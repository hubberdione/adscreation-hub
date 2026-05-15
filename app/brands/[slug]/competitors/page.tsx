import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { getServerSupabase } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CompetitorReference } from "@/types/competitor";
import { NewCompetitorForm } from "./new-competitor-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function sourceLabel(t: CompetitorReference["source_type"]): string {
  switch (t) {
    case "ad_library_url": return "Ad Library URL";
    case "drive_asset": return "Drive asset";
    case "text_copy": return "Text copy";
    case "auto_scrape": return "Auto scrape";
  }
}

function refValue(ref: CompetitorReference): string {
  return (
    ref.url ??
    ref.drive_file_id ??
    (ref.copy_text ? ref.copy_text.slice(0, 120) + "…" : "—")
  );
}

export default async function CompetitorsPage({
  params,
}: {
  params: { slug: string };
}) {
  noStore();
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("competitor_references")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });
    const refs = (data ?? []) as CompetitorReference[];

    return (
      <div className="space-y-6">
        <NewCompetitorForm brandSlug={params.slug} />
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-700">
            {refs.length} references
          </h2>
          {refs.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No competitor references yet — add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {refs.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {r.competitor_name ?? "Untitled"}
                        </span>
                        <Badge tone="neutral">{sourceLabel(r.source_type)}</Badge>
                        {r.is_winner && <Badge tone="winner">Winner</Badge>}
                      </div>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {refValue(r)}
                      </p>
                      {r.notes && (
                        <p className="mt-1 text-xs text-neutral-600">
                          {r.notes}
                        </p>
                      )}
                    </div>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs text-blue-600 hover:underline"
                      >
                        Open →
                      </a>
                    )}
                  </CardContent>
                </Card>
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
