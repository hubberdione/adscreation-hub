"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function DriveFolderEditor({
  brandSlug,
  initialFolderId,
}: {
  brandSlug: string;
  initialFolderId: string;
}) {
  const router = useRouter();
  const [folderId, setFolderId] = useState(initialFolderId);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/brands/${brandSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drive_folder_id: folderId.trim() || null }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to save");
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
    router.refresh();
  }

  const driveUrl = folderId
    ? `https://drive.google.com/drive/folders/${folderId}`
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="folder_id">Folder ID</Label>
        <Input
          id="folder_id"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          placeholder="1A2B3C4D... (from drive.google.com URL)"
        />
        <p className="text-xs text-neutral-500">
          In Drive, open the folder → copy the part of the URL after
          /folders/.
        </p>
      </div>
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          Open in Google Drive →
        </a>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {savedAt ? `Saved at ${savedAt}` : "Not saved yet"}
        </p>
        <Button onClick={save} disabled={submitting}>
          {submitting ? "Saving..." : "Save folder link"}
        </Button>
      </div>
    </div>
  );
}
