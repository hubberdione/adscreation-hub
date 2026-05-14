import { NextResponse } from "next/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { listFilesInFolder } from "@/lib/drive";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    if (!brand.drive_folder_id) {
      return NextResponse.json({ files: [], folderLinked: false });
    }
    const files = await listFilesInFolder(brand.drive_folder_id);
    return NextResponse.json({ files, folderLinked: true });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Drive read failed";
    return NextResponse.json(
      { error: message, files: [], folderLinked: true },
      { status: 500 }
    );
  }
}
