import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/competitors", label: "Competitors" },
  { href: "/dna", label: "Brand DNA" },
  { href: "/drive", label: "Drive" },
];

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  let brandName: string;
  try {
    const brand = await requireBrand(params.slug);
    brandName = brand.name;
  } catch (err) {
    if (err instanceof BrandNotFound) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-neutral-200 pb-4">
        <div>
          <Link
            href="/brands"
            className="text-xs text-neutral-500 hover:text-black"
          >
            ← Brands
          </Link>
          <h1 className="text-2xl font-semibold">{brandName}</h1>
          <p className="text-xs text-neutral-500">/{params.slug}</p>
        </div>
      </div>
      <nav className="flex gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={`/brands/${params.slug}${tab.href}`}
            className="rounded-t-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-black"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
