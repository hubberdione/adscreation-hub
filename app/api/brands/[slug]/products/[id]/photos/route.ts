import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BUCKET = "product-photos";
const MAX_FILES_PER_UPLOAD = 10;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/jpg",
]);

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/**
 * POST: upload one or more reference photos for a product.
 * multipart/form-data with field name "files" (repeated).
 */
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();

    const productRes = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .eq("brand_id", brand.id)
      .single();
    if (productRes.error || !productRes.data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productRes.data as Product;

    const form = await req.formData();
    const files = form.getAll("files").filter((f) => f instanceof File) as File[];
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided. Use field name 'files'." },
        { status: 400 }
      );
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Too many files (max ${MAX_FILES_PER_UPLOAD} per request)` },
        { status: 400 }
      );
    }

    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_MIMES.has(file.type)) {
        errors.push(`${file.name}: unsupported type ${file.type}`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`${file.name}: file too large (${file.size} bytes)`);
        continue;
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const ext = extFromMime(file.type);
      const fname = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFilename(file.name)}`;
      const path = `${brand.slug}/${product.id}/${fname}`;
      const up = await supabase.storage.from(BUCKET).upload(path, buf, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) {
        errors.push(`${file.name}: ${up.error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }

    const existing = Array.isArray(product.reference_image_urls)
      ? product.reference_image_urls
      : [];
    const next = [...existing, ...uploaded];

    const updateRes = await supabase
      .from("products")
      .update({ reference_image_urls: next })
      .eq("id", product.id)
      .eq("brand_id", brand.id)
      .select()
      .single();

    return NextResponse.json({
      product: updateRes.data,
      uploaded,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE: remove a single photo by its URL.
 * Body: { url: string }
 */
export async function DELETE(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url : "";
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const productRes = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .eq("brand_id", brand.id)
      .single();
    if (productRes.error || !productRes.data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productRes.data as Product;

    // Extract storage path from the public URL.
    // Pattern: /storage/v1/object/public/product-photos/{brandSlug}/{productId}/{filename}
    const marker = "/product-photos/";
    const idx = url.indexOf(marker);
    if (idx === -1) {
      return NextResponse.json(
        { error: "Not a product-photos URL" },
        { status: 400 }
      );
    }
    const path = url.slice(idx + marker.length);
    // sanity: must be under this brand+product
    if (!path.startsWith(`${brand.slug}/${product.id}/`)) {
      return NextResponse.json(
        { error: "URL does not belong to this product" },
        { status: 403 }
      );
    }

    const del = await supabase.storage.from(BUCKET).remove([path]);
    if (del.error) {
      return NextResponse.json({ error: del.error.message }, { status: 500 });
    }

    const existing = Array.isArray(product.reference_image_urls)
      ? product.reference_image_urls
      : [];
    const next = existing.filter((u) => u !== url);

    const updateRes = await supabase
      .from("products")
      .update({ reference_image_urls: next })
      .eq("id", product.id)
      .eq("brand_id", brand.id)
      .select()
      .single();

    return NextResponse.json({ product: updateRes.data });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
