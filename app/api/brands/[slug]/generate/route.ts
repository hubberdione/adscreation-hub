import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { generateStaticSchema } from "@/lib/schemas";
import { composeStaticPrompt } from "@/lib/prompt-builder";
import { generateImage, type ReferenceImage } from "@/lib/gemini";
import { uploadRender } from "@/lib/storage";
import {
  findFolderByPath,
  listImagesInFolder,
  downloadFile,
  isImage,
} from "@/lib/drive";
import type { Product } from "@/types/product";
import type { CompetitorReference } from "@/types/competitor";

// Gemini image generation can take 20-45s. Vercel limit 60s.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MAX_PRODUCT_REFS = 3;
const MAX_INSPO_REFS = 2;

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  let runId: string | null = null;
  let supabase = getServerSupabase();

  try {
    const brand = await requireBrand(params.slug);
    const body = await req.json().catch(() => null);
    const parsed = generateStaticSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { product_id, creative_brief, aspect_ratio, inspo_reference_ids } =
      parsed.data;

    // Load product (brand-scoped)
    const productRes = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .eq("brand_id", brand.id)
      .single();
    if (productRes.error || !productRes.data) {
      return NextResponse.json(
        { error: "Product not found in this brand" },
        { status: 404 }
      );
    }
    const product = productRes.data as Product;
    if (product.status === "draft") {
      return NextResponse.json(
        { error: "Drafts cannot be rendered. Change product status first." },
        { status: 400 }
      );
    }

    // Load inspo refs (brand-scoped)
    let inspoRefs: CompetitorReference[] = [];
    if (inspo_reference_ids.length > 0) {
      const refsRes = await supabase
        .from("competitor_references")
        .select("*")
        .eq("brand_id", brand.id)
        .in("id", inspo_reference_ids);
      if (refsRes.error) {
        return NextResponse.json(
          { error: `Failed to load inspo refs: ${refsRes.error.message}` },
          { status: 500 }
        );
      }
      inspoRefs = (refsRes.data ?? []) as CompetitorReference[];
    }

    // Insert run row, status=running
    const insertRes = await supabase
      .from("generation_runs")
      .insert({
        brand_id: brand.id,
        product_id: product.id,
        run_type: "static",
        status: "running",
        aspect_ratio,
        creative_brief,
        cost_usd: 0,
      })
      .select()
      .single();
    if (insertRes.error || !insertRes.data) {
      return NextResponse.json(
        { error: `Failed to create run row: ${insertRes.error?.message}` },
        { status: 500 }
      );
    }
    runId = insertRes.data.id as string;

    // === Pull product reference photos from Drive ===
    const productRefs: ReferenceImage[] = [];
    const referenceFileIds: string[] = [];
    if (brand.drive_folder_id) {
      const subfolderPath =
        product.banned_terms && false /* reserved */
          ? []
          : ["products", slugifyName(product.name)];
      const subfolderId = await findFolderByPath(
        brand.drive_folder_id,
        subfolderPath
      );
      if (subfolderId) {
        const productFiles = await listImagesInFolder(
          subfolderId,
          MAX_PRODUCT_REFS
        );
        for (const f of productFiles) {
          try {
            const dl = await downloadFile(f.id);
            productRefs.push({
              data: dl.data,
              mimeType: dl.mimeType,
              role: "product",
            });
            referenceFileIds.push(f.id);
          } catch {
            // skip unreadable files
          }
        }
      }
    }

    // === Pull inspo images from competitor refs ===
    const inspoImages: ReferenceImage[] = [];
    let inspoUsed = 0;
    for (const ref of inspoRefs) {
      if (inspoUsed >= MAX_INSPO_REFS) break;
      if (ref.source_type !== "drive_asset" || !ref.drive_file_id) continue;
      try {
        const dl = await downloadFile(ref.drive_file_id);
        if (!isImage(dl.mimeType)) continue;
        inspoImages.push({
          data: dl.data,
          mimeType: dl.mimeType,
          role: "inspo",
        });
        referenceFileIds.push(ref.drive_file_id);
        inspoUsed += 1;
      } catch {
        // skip
      }
    }

    // Compose prompt (inspo first in text-block instructions, but order in parts
    // is inspo then product so Gemini sees both — order matches the prompt text).
    const prompt = composeStaticPrompt({
      brand,
      product,
      inspoRefs,
      creativeBrief: creative_brief,
      aspectRatio: aspect_ratio,
    });

    const allRefs: ReferenceImage[] = [...inspoImages, ...productRefs];

    // Generate
    const gen = await generateImage({ prompt, references: allRefs });

    // Upload to Storage
    const upload = await uploadRender({
      brandSlug: brand.slug,
      runId,
      imageBuffer: gen.imageBuffer,
      mimeType: gen.mimeType,
    });

    // Update run row to complete
    const updateRes = await supabase
      .from("generation_runs")
      .update({
        status: "complete",
        prompt,
        image_url: upload.url,
        cost_usd: gen.cost_usd,
        reference_files: {
          product_count: productRefs.length,
          inspo_count: inspoImages.length,
          file_ids: referenceFileIds,
        },
      })
      .eq("id", runId)
      .select()
      .single();

    return NextResponse.json({ run: updateRes.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    // Best-effort: mark run as failed
    if (runId) {
      await supabase
        .from("generation_runs")
        .update({ status: "failed", error: message })
        .eq("id", runId);
    }
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
