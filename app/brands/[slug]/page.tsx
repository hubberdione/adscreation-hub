import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { getServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BrandOverviewPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const [productsRes, competitorsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, status")
        .eq("brand_id", brand.id),
      supabase
        .from("competitor_references")
        .select("id, is_winner")
        .eq("brand_id", brand.id),
    ]);
    const products = productsRes.data ?? [];
    const competitors = competitorsRes.data ?? [];
    const preOrderCount = products.filter((p) => p.status === "pre_order").length;
    const saleCount = products.filter((p) => p.status === "sale").length;
    const winnerCount = competitors.filter((c) => c.is_winner).length;

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{products.length}</p>
            <div className="flex gap-2">
              <Badge tone="pre_order">{preOrderCount} pre-order</Badge>
              <Badge tone="sale">{saleCount} sale</Badge>
            </div>
            <Link
              href={`/brands/${params.slug}/products`}
              className="text-sm text-neutral-600 hover:underline"
            >
              Manage products →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitor references</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{competitors.length}</p>
            <div className="flex gap-2">
              <Badge tone="winner">{winnerCount} winners</Badge>
            </div>
            <Link
              href={`/brands/${params.slug}/competitors`}
              className="text-sm text-neutral-600 hover:underline"
            >
              Manage references →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drive folder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              {brand.drive_folder_id ? (
                <span className="text-neutral-600">
                  Linked: {brand.drive_folder_id}
                </span>
              ) : (
                <span className="text-amber-700">Not linked yet</span>
              )}
            </p>
            <Link
              href={`/brands/${params.slug}/drive`}
              className="text-sm text-neutral-600 hover:underline"
            >
              {brand.drive_folder_id ? "View / edit link" : "Link folder"} →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
