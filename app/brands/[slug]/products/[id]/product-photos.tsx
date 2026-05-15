"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductPhotos({
  brandSlug,
  productId,
  initialUrls,
}: {
  brandSlug: string;
  productId: string;
  initialUrls: string[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append("files", files[i]);
    }
    const res = await fetch(
      `/api/brands/${brandSlug}/products/${productId}/photos`,
      { method: "POST", body: form }
    );
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Upload failed");
      return;
    }
    const data = await res.json();
    const newUrls: string[] = data?.product?.reference_image_urls ?? [];
    setUrls(newUrls);
    if (data.errors && data.errors.length > 0) {
      setError(data.errors.join("; "));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function removeOne(url: string) {
    if (!confirm("Remove this reference photo?")) return;
    const res = await fetch(
      `/api/brands/${brandSlug}/products/${productId}/photos`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Delete failed");
      return;
    }
    const data = await res.json();
    setUrls(data?.product?.reference_image_urls ?? []);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference photos</CardTitle>
        <p className="text-sm text-neutral-500">
          Upload product shots here. The generator will use these as identity-lock
          references so the AI preserves every surface detail. PNG / JPG / WebP, max 20 MB each.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-2 file:text-white file:hover:bg-neutral-800 file:disabled:opacity-50"
          />
          {uploading && (
            <p className="mt-2 text-xs text-neutral-500">Uploading…</p>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>

        {urls.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No reference photos yet. Upload one or more above.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {urls.map((url) => (
              <div
                key={url}
                className="group relative overflow-hidden rounded-md border border-neutral-200 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="reference"
                  className="aspect-square w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeOne(url)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
