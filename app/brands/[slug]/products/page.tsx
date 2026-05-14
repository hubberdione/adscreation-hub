import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { getServerSupabase } from "@/lib/supabase/server";
import { ProductRow } from "@/components/ProductRow";
import type { Product } from "@/types/product";
import { NewProductForm } from "./new-product-form";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });
    const products = (data ?? []) as Product[];
    return (
      <div className="space-y-6">
        <NewProductForm brandSlug={params.slug} />
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-700">
            {products.length} products
          </h2>
          {products.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No products yet — add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  brandSlug={params.slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
