import { getServerSupabase } from "./supabase/server";

const BUCKET = "renders";

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

/**
 * Upload a rendered image to the brand's space in the `renders` Supabase Storage bucket.
 * Path: {brand_slug}/{run_id}.{ext}. Returns the public URL.
 * Brand scoping is enforced by the caller (route only invokes this after requireBrand()).
 */
export async function uploadRender({
  brandSlug,
  runId,
  imageBuffer,
  mimeType,
}: {
  brandSlug: string;
  runId: string;
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<{ url: string; path: string }> {
  const supabase = getServerSupabase();
  const ext = extFromMime(mimeType);
  const path = `${brandSlug}/${runId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, {
      contentType: mimeType,
      upsert: true,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
