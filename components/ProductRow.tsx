import Link from "next/link";
import { ToneBadge } from "./ToneBadge";
import type { Product } from "@/types/product";

export function ProductRow({
  product,
  brandSlug,
}: {
  product: Product;
  brandSlug: string;
}) {
  return (
    <Link
      href={`/brands/${brandSlug}/products/${product.id}`}
      className="flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 transition-colors hover:bg-neutral-50"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{product.name}</p>
        {product.one_liner && (
          <p className="truncate text-xs text-neutral-500">
            {product.one_liner}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {product.price_usd != null && (
          <span className="text-sm text-neutral-600">
            ${Number(product.price_usd).toFixed(0)}
          </span>
        )}
        <ToneBadge status={product.status} />
      </div>
    </Link>
  );
}
