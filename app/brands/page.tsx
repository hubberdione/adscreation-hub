import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { BrandCard } from "@/components/BrandCard";
import { Button } from "@/components/ui/button";
import type { Brand } from "@/types/brand";

export const dynamic = "force-dynamic";

async function loadBrands(): Promise<Brand[]> {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Brand[];
}

export default async function BrandsListPage() {
  const brands = await loadBrands();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brands</h1>
          <p className="text-sm text-neutral-500">
            One isolated room per brand. Pick one to enter.
          </p>
        </div>
        <Link href="/brands/new">
          <Button>+ New brand</Button>
        </Link>
      </div>

      {brands.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="text-sm text-neutral-600">
            No brands yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <BrandCard key={b.id} brand={b} />
          ))}
        </div>
      )}
    </div>
  );
}
