import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriveFolderEditor } from "./drive-folder-editor";

export const dynamic = "force-dynamic";

export default async function DrivePage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const brand = await requireBrand(params.slug);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Drive folder</CardTitle>
          <p className="text-sm text-neutral-500">
            Paste the folder ID from your brand's Google Drive folder URL. (Phase 2 will
            replace this with a one-click OAuth picker.)
          </p>
        </CardHeader>
        <CardContent>
          <DriveFolderEditor
            brandSlug={params.slug}
            initialFolderId={brand.drive_folder_id ?? ""}
          />
        </CardContent>
      </Card>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
