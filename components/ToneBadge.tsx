import { Badge } from "./ui/badge";
import { buildCopyTone } from "@/lib/tone";
import type { ProductStatus } from "@/types/product";

export function ToneBadge({ status }: { status: ProductStatus }) {
  const tone = buildCopyTone(status);
  return <Badge tone={status}>{tone.label}</Badge>;
}
