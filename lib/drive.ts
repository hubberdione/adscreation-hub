import { google } from "googleapis";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedTime: string;
  thumbnailLink: string | null;
  webViewLink: string | null;
  iconLink: string | null;
};

/**
 * Builds an authenticated Drive client using the service account credentials
 * from Vercel env vars. The service account email and JSON key are NEVER
 * shipped to the client.
 */
function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "Google service account env vars missing (GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)."
    );
  }
  // Vercel stores multi-line values with literal \n — convert them back.
  const privateKey = rawKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

/**
 * Lists files in a brand's Drive folder. Brand scoping is enforced upstream
 * (only routes that call requireBrand() reach this function).
 */
export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  if (!folderId) return [];
  const drive = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
    fields:
      "files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, iconLink)",
    pageSize: 200,
    orderBy: "folder,name",
  });
  const files = res.data.files ?? [];
  return files.map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "(untitled)",
    mimeType: f.mimeType ?? "application/octet-stream",
    size: f.size ? Number(f.size) : null,
    modifiedTime: f.modifiedTime ?? "",
    thumbnailLink: f.thumbnailLink ?? null,
    webViewLink: f.webViewLink ?? null,
    iconLink: f.iconLink ?? null,
  }));
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function isFolder(mimeType: string): boolean {
  return mimeType === "application/vnd.google-apps.folder";
}

export function humanSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
