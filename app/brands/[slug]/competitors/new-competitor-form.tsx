"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompetitorSourceType } from "@/types/competitor";

export function NewCompetitorForm({ brandSlug }: { brandSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<CompetitorSourceType>("ad_library_url");
  const [url, setUrl] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [copyText, setCopyText] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [notes, setNotes] = useState("");
  const [isWinner, setIsWinner] = useState(false);

  function reset() {
    setSourceType("ad_library_url");
    setUrl("");
    setDriveFileId("");
    setCopyText("");
    setCompetitorName("");
    setNotes("");
    setIsWinner(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      source_type: sourceType,
      competitor_name: competitorName.trim() || null,
      notes: notes.trim() || null,
      is_winner: isWinner,
    };
    if (sourceType === "ad_library_url") payload.url = url.trim();
    if (sourceType === "drive_asset") payload.drive_file_id = driveFileId.trim();
    if (sourceType === "text_copy") payload.copy_text = copyText.trim();

    const res = await fetch(`/api/brands/${brandSlug}/competitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to save");
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Add competitor reference</Button>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New competitor reference</CardTitle>
        <p className="text-sm text-neutral-500">
          Pick the fastest input type for what you have.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="source_type">Source type</Label>
            <Select
              id="source_type"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as CompetitorSourceType)}
            >
              <option value="ad_library_url">Meta Ad Library URL</option>
              <option value="drive_asset">Google Drive asset</option>
              <option value="text_copy">Text copy only</option>
            </Select>
          </div>

          {sourceType === "ad_library_url" && (
            <div className="space-y-2">
              <Label htmlFor="url">Ad Library URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.facebook.com/ads/library/?id=..."
                required
              />
            </div>
          )}

          {sourceType === "drive_asset" && (
            <div className="space-y-2">
              <Label htmlFor="drive_file_id">Drive file ID</Label>
              <Input
                id="drive_file_id"
                value={driveFileId}
                onChange={(e) => setDriveFileId(e.target.value)}
                placeholder="1A2B3C4D..."
                required
              />
            </div>
          )}

          {sourceType === "text_copy" && (
            <div className="space-y-2">
              <Label htmlFor="copy_text">Ad copy</Label>
              <Textarea
                id="copy_text"
                value={copyText}
                onChange={(e) => setCopyText(e.target.value)}
                rows={6}
                placeholder="Paste the competitor's ad copy here..."
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="competitor_name">Competitor name</Label>
              <Input
                id="competitor_name"
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                placeholder="HelloNancy"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="is_winner"
                type="checkbox"
                checked={isWinner}
                onChange={(e) => setIsWinner(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="is_winner">Mark as winner</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Why this works / what mechanism to preserve..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save reference"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
