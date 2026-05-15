import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";
import type { GenerationRun } from "@/types/generation-run";

function statusTone(status: GenerationRun["status"]) {
  if (status === "complete") return "sale" as const;
  if (status === "failed") return "draft" as const;
  if (status === "running" || status === "queued") return "neutral" as const;
  return "neutral" as const;
}

export function RunsGrid({
  runs,
  products,
}: {
  runs: GenerationRun[];
  products: Product[];
}) {
  const productMap = new Map(products.map((p) => [p.id, p]));

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-neutral-500">
          No runs yet. Queue a brief above and click Generate.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-neutral-700">
        Past runs ({runs.length})
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {runs.map((run) => {
          const product = run.product_id ? productMap.get(run.product_id) : null;
          return (
            <Card key={run.id} className="overflow-hidden">
              <div className="flex aspect-[4/5] items-center justify-center bg-neutral-100">
                {run.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a
                    href={run.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-full w-full"
                  >
                    <img
                      src={run.image_url}
                      alt={run.creative_brief?.slice(0, 60) ?? "Generated"}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ) : (
                  <span className="text-xs text-neutral-400">
                    {run.status}
                  </span>
                )}
              </div>
              <CardContent className="space-y-1 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {product?.name ?? "—"}
                  </span>
                  <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                </div>
                {run.creative_brief && (
                  <p className="line-clamp-2 text-xs text-neutral-600">
                    {run.creative_brief}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>{run.aspect_ratio ?? "—"}</span>
                  <span>${Number(run.cost_usd ?? 0).toFixed(2)}</span>
                </div>
                {run.error && (
                  <p className="text-[10px] text-red-600">× {run.error}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
