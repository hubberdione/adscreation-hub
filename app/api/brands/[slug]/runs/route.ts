import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("generation_runs")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ runs: data });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
