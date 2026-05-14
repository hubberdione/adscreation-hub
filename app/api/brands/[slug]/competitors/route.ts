import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { competitorCreateSchema } from "@/lib/schemas";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("competitor_references")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ references: data });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const body = await req.json().catch(() => null);
    const parsed = competitorCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("competitor_references")
      .insert({
        brand_id: brand.id,
        source_type: parsed.data.source_type,
        url: parsed.data.url ?? null,
        drive_file_id: parsed.data.drive_file_id ?? null,
        copy_text: parsed.data.copy_text ?? null,
        competitor_name: parsed.data.competitor_name ?? null,
        notes: parsed.data.notes ?? null,
        is_winner: parsed.data.is_winner ?? false,
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ reference: data }, { status: 201 });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
