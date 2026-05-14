import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Brand } from "@/types/brand";

export function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/brands/${brand.slug}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{brand.name}</CardTitle>
          <p className="text-xs text-neutral-500">/{brand.slug}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            {brand.drive_folder_id
              ? "Drive folder linked"
              : "No Drive folder linked yet"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
