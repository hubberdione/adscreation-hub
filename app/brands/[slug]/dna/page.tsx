import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DnaPromptEditor } from "./dna-prompt-editor";

export const dynamic = "force-dynamic";

export default async function DnaPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const brand = await requireBrand(params.slug);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand DNA prompt</CardTitle>
          <p className="text-sm text-neutral-500">
            This text is prepended to every generation call for this brand. It
            never reaches the client. Keep it specific — voice, banned phrases,
            do-nots, anti-positioning.
          </p>
        </CardHeader>
        <CardContent>
          <DnaPromptEditor
            brandSlug={params.slug}
            initialPrompt={brand.dna_prompt ?? ""}
          />
        </CardContent>
      </Card>
    );
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }
}
