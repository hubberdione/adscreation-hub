"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";
import type { CompetitorReference } from "@/types/competitor";

type BriefRow = {
  id: string;
  product_id: string;
  brief: string;
  aspect_ratio: "4:5" | "1:1" | "16:9" | "9:16";
  status: "pending" | "running" | "complete" | "failed";
  error?: string;
};

function rowId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function GenerateForm({
  brandSlug,
  products,
  inspoRefs,
}: {
  brandSlug: string;
  products: Product[];
  inspoRefs: CompetitorReference[];
}) {
  const router = useRouter();
  const renderableProducts = products.filter((p) => p.status !== "draft");

  const [rows, setRows] = useState<BriefRow[]>(() => [
    {
      id: rowId(),
      product_id: renderableProducts[0]?.id ?? "",
      brief: "",
      aspect_ratio: "4:5",
      status: "pending",
    },
  ]);
  const [selectedInspoIds, setSelectedInspoIds] = useState<Set<string>>(
    () => new Set(inspoRefs.filter((r) => r.is_winner).map((r) => r.id))
  );
  const [batchRunning, setBatchRunning] = useState(false);

  function addRow(cloneFrom?: BriefRow) {
    setRows((r) => [
      ...r,
      {
        id: rowId(),
        product_id: cloneFrom?.product_id ?? renderableProducts[0]?.id ?? "",
        brief: cloneFrom?.brief ?? "",
        aspect_ratio: cloneFrom?.aspect_ratio ?? "4:5",
        status: "pending",
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((r) => (r.length <= 1 ? r : r.filter((x) => x.id !== id)));
  }

  function updateRow(id: string, patch: Partial<BriefRow>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function toggleInspo(id: string) {
    setSelectedInspoIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runOne(row: BriefRow): Promise<void> {
    updateRow(row.id, { status: "running", error: undefined });
    try {
      const res = await fetch(`/api/brands/${brandSlug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: row.product_id,
          creative_brief: row.brief,
          aspect_ratio: row.aspect_ratio,
          inspo_reference_ids: Array.from(selectedInspoIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        updateRow(row.id, {
          status: "failed",
          error: data?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      updateRow(row.id, { status: "complete" });
    } catch (err) {
      updateRow(row.id, {
        status: "failed",
        error: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  async function runBatch() {
    const pending = rows.filter(
      (r) =>
        r.product_id &&
        r.brief.trim().length >= 10 &&
        (r.status === "pending" || r.status === "failed")
    );
    if (pending.length === 0) return;
    setBatchRunning(true);
    for (const row of pending) {
      // sequential so each is awaited; safer for Vercel function limits
      await runOne(row);
    }
    setBatchRunning(false);
    router.refresh();
  }

  if (renderableProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            No renderable products in this brand. Add a product with status
            "Pre-order" or "Sale" first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const completeCount = rows.filter((r) => r.status === "complete").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inspo references (mechanism only)</CardTitle>
          <p className="text-sm text-neutral-500">
            Selected references will be sent to the generator alongside the
            brand DNA. The prompt instructs Gemini to study the structural
            mechanism — composition, hook framing, proof shape — and translate
            it to a {brandSlug}-native execution, NOT to copy the literal design.
          </p>
        </CardHeader>
        <CardContent>
          {inspoRefs.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No competitor references added yet. Add some from the Competitors
              tab.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {inspoRefs.map((ref) => (
                <label
                  key={ref.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 p-2 text-sm hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedInspoIds.has(ref.id)}
                    onChange={() => toggleInspo(ref.id)}
                    className="h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {ref.competitor_name ?? "Untitled"}
                      </span>
                      {ref.is_winner && <Badge tone="winner">Winner</Badge>}
                    </div>
                    <p className="truncate text-xs text-neutral-500">
                      {ref.source_type === "ad_library_url"
                        ? ref.url
                        : ref.source_type === "drive_asset"
                        ? `Drive: ${ref.drive_file_id}`
                        : ref.copy_text?.slice(0, 80)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Briefs ({rows.length})</CardTitle>
            <div className="text-xs text-neutral-500">
              {completeCount > 0 && `${completeCount} complete`}
              {failedCount > 0 && ` · ${failedCount} failed`}
            </div>
          </div>
          <p className="text-sm text-neutral-500">
            Add one row per concept. Run all queued briefs sequentially.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div
                key={row.id}
                className="rounded-md border border-neutral-200 p-3"
              >
                <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_120px_auto]">
                  <Select
                    value={row.product_id}
                    onChange={(e) =>
                      updateRow(row.id, { product_id: e.target.value })
                    }
                  >
                    {renderableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.status})
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={row.aspect_ratio}
                    onChange={(e) =>
                      updateRow(row.id, {
                        aspect_ratio: e.target.value as BriefRow["aspect_ratio"],
                      })
                    }
                  >
                    <option value="4:5">4:5 (Meta feed)</option>
                    <option value="1:1">1:1 (square)</option>
                    <option value="16:9">16:9 (landscape)</option>
                    <option value="9:16">9:16 (story)</option>
                  </Select>
                  <div className="flex items-center justify-end gap-2">
                    {row.status === "running" && (
                      <Badge tone="neutral">Running…</Badge>
                    )}
                    {row.status === "complete" && (
                      <Badge tone="sale">Done</Badge>
                    )}
                    {row.status === "failed" && (
                      <Badge tone="draft" className="text-red-700">
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRow(row)}
                      disabled={batchRunning}
                    >
                      Clone
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(row.id)}
                      disabled={batchRunning || rows.length <= 1}
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={row.brief}
                  onChange={(e) =>
                    updateRow(row.id, { brief: e.target.value })
                  }
                  rows={3}
                  placeholder={`Brief #${i + 1} — describe the scene, mood, headline copy (if any), and what you want the ad to do. Min 10 chars.`}
                  disabled={batchRunning}
                />
                {row.error && (
                  <p className="mt-1 text-xs text-red-600">× {row.error}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => addRow()}
              disabled={batchRunning}
            >
              + Add brief
            </Button>
            <Button
              type="button"
              onClick={runBatch}
              disabled={batchRunning}
            >
              {batchRunning
                ? "Running…"
                : `Generate ${rows.filter((r) => r.brief.trim().length >= 10).length}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
