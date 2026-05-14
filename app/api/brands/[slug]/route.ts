import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    return NextResponse.json({ brand });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const body = await req.json().catch(() => ({}));
    const allowedFields = ["name", "drive_folder_id", "dna_prompt"];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) update[key] = body[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ brand });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("brands")
      .update(update)
      .eq("id", brand.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ brand: data });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", brand.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
