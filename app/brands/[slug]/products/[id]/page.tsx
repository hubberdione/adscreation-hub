import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { getServerSupabase } from "@/lib/supabase/server";
import { buildCopyTone } from "@/lib/tone";
import { ToneBadge } from "@/components/ToneBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types/product";
import { EditProductForm } from "./edit-product-form";
import { ProductPhotos } from "./product-photos";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .eq("brand_id", brand.id)
      .single();
    if (error || !data) notFound();
    const product = data as Product;
    const tone = buildCopyTone(product.status);

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EditProductForm brandSlug={params.slug} product={product} />
          <ProductPhotos
            brandSlug={params.slug}
            productId={product.id}
            initialUrls={
              Array.isArray(product.reference_image_urls)
                ? product.reference_image_urls
                : []
            }
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active tone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToneBadge status={product.status} />
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-500">
                  Allowed CTAs
                </p>
                <ul className="space-y-0.5 text-sm">
                  {tone.allowed_ctas.map((c) => (
                    <li key={c}>· {c}</li>
                  ))}
                  {tone.allowed_ctas.length === 0 && (
                    <li className="text-neutral-400">— none (render blocked) —</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-500">
                  Banned phrases
                </p>
                <ul className="space-y-0.5 text-sm text-neutral-700">
                  {tone.banned_phrases.map((b) => (
                    <li key={b}>× {b}</li>
                  ))}
                  {tone.banned_phrases.length === 0 && (
                    <li className="text-neutral-400">— none —</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-500">
                  Proof rules
                </p>
                <ul className="space-y-0.5 text-sm text-neutral-700">
                  {tone.proof_rules.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              </div>
              {!tone.can_render && (
                <p className="rounded-md bg-neutral-100 p-2 text-xs text-neutral-700">
                  Drafts cannot be rendered. Change status to enable generation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
