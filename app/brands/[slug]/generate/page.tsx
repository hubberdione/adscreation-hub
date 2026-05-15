import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/types/product";
import type { CompetitorReference } from "@/types/competitor";
import type { GenerationRun } from "@/types/generation-run";
import { GenerateForm } from "./generate-form";
import { RunsGrid } from "./runs-grid";

export const dynamic = "force-dynamic";

export default async function GeneratePage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const [productsRes, refsRes, runsRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("brand_id", brand.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("competitor_references")
        .select("*")
        .eq("brand_id", brand.id)
        .order("is_winner", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("generation_runs")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("run_type", "static")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const products = (productsRes.data ?? []) as Product[];
    const refs = (refsRes.data ?? []) as CompetitorReference[];
    const runs = (runsRes.data ?? []) as GenerationRun[];

    return (
      <div className="space-y-6">
        <GenerateForm
          brandSlug={params.slug}
          products={products}
          inspoRefs={refs}
        />
        <RunsGrid runs={runs} products={products} />
      </div>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
