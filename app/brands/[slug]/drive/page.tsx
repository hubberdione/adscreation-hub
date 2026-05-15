import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriveFolderEditor } from "./drive-folder-editor";
import { DriveFileList } from "./drive-file-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DrivePage({
  params,
}: {
  params: { slug: string };
}) {
  noStore();
  try {
    const brand = await requireBrand(params.slug);
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Drive folder</CardTitle>
            <p className="text-sm text-neutral-500">
              Paste the folder ID from your brand's Google Drive folder, and
              share that folder with the service account so the app can read
              it.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <DriveFolderEditor
              brandSlug={params.slug}
              initialFolderId={brand.drive_folder_id ?? ""}
            />
            {serviceAccountEmail && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">Share the folder with this email:</p>
                <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-xs">
                  {serviceAccountEmail}
                </code>
                <p className="mt-2 text-xs">
                  In Drive: open the folder → Share → paste this email → set
                  permission to <strong>Viewer</strong> → Send.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {brand.drive_folder_id && (
          <DriveFileList brandSlug={params.slug} />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
