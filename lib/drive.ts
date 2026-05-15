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

/**
 * Find a named subfolder inside a parent folder. Returns the subfolder id or null.
 * Used by the brand-memory convention to locate products/{slug}/ inside a brand's Drive folder.
 */
export async function findSubfolder(
  parentFolderId: string,
  name: string
): Promise<string | null> {
  if (!parentFolderId || !name) return null;
  const drive = getDriveClient();
  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `'${parentFolderId.replace(/'/g, "\\'")}' in parents and name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1,
  });
  const f = res.data.files?.[0];
  return f?.id ?? null;
}

/**
 * Walk a nested path of subfolders. Returns the final folder id or null if any
 * segment is missing. e.g. findFolderByPath(brandFolderId, ['products','ripple']).
 */
export async function findFolderByPath(
  rootFolderId: string,
  segments: string[]
): Promise<string | null> {
  let current: string | null = rootFolderId;
  for (const seg of segments) {
    if (!current) return null;
    current = await findSubfolder(current, seg);
  }
  return current;
}

/**
 * Download a Drive file's raw bytes. Returns the buffer and mime type.
 * Only supports binary files (images, videos). Will not auto-export Google Docs.
 */
export async function downloadFile(
  fileId: string
): Promise<{ data: Buffer; mimeType: string; name: string }> {
  const drive = getDriveClient();
  // Metadata first
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType",
  });
  const mimeType = meta.data.mimeType ?? "application/octet-stream";
  const name = meta.data.name ?? fileId;
  // Then content as stream → buffer
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  const data = Buffer.from(res.data as ArrayBuffer);
  return { data, mimeType, name };
}

/**
 * List image files in a folder (skips Google-native and non-image mime types).
 */
export async function listImagesInFolder(
  folderId: string,
  limit = 5
): Promise<DriveFile[]> {
  const all = await listFilesInFolder(folderId);
  return all.filter((f) => isImage(f.mimeType)).slice(0, limit);
}
