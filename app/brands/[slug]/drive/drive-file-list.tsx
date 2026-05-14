"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedTime: string;
  thumbnailLink: string | null;
  webViewLink: string | null;
  iconLink: string | null;
};

function isImage(m: string) {
  return m.startsWith("image/");
}
function isVideo(m: string) {
  return m.startsWith("video/");
}
function isFolder(m: string) {
  return m === "application/vnd.google-apps.folder";
}

function humanSize(b: number | null): string {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fileTypeLabel(m: string): string {
  if (isFolder(m)) return "Folder";
  if (isImage(m)) return "Image";
  if (isVideo(m)) return "Video";
  if (m === "application/pdf") return "PDF";
  if (m.startsWith("application/vnd.google-apps.")) {
    return m.replace("application/vnd.google-apps.", "Google ");
  }
  return m.split("/").pop() ?? "File";
}

export function DriveFileList({ brandSlug }: { brandSlug: string }) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/brands/${brandSlug}/drive/files`);
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to load files");
      return;
    }
    const data = await res.json();
    setFiles(data.files ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSlug]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Files in folder</CardTitle>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <p className="font-medium">Drive read failed</p>
            <p className="mt-1 text-xs">{error}</p>
            <p className="mt-2 text-xs">
              Common causes: (1) folder ID wrong, (2) service account email not
              shared on the folder, (3) Google service account env vars not set
              in Vercel.
            </p>
          </div>
        )}
        {!error && !loading && files.length === 0 && (
          <p className="text-sm text-neutral-500">
            No files visible. Make sure the folder is shared with the service
            account email shown above.
          </p>
        )}
        {!error && files.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {files.map((f) => (
              <a
                key={f.id}
                href={f.webViewLink ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-md border border-neutral-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex aspect-square items-center justify-center bg-neutral-100">
                  {f.thumbnailLink ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.thumbnailLink}
                      alt={f.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : f.iconLink ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.iconLink}
                      alt={f.name}
                      className="h-10 w-10 opacity-60"
                    />
                  ) : (
                    <span className="text-3xl text-neutral-400">📄</span>
                  )}
                </div>
                <div className="space-y-1 p-2">
                  <p
                    className="truncate text-xs font-medium"
                    title={f.name}
                  >
                    {f.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <Badge tone="neutral" className="text-[10px]">
                      {fileTypeLabel(f.mimeType)}
                    </Badge>
                    <span>{humanSize(f.size)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
