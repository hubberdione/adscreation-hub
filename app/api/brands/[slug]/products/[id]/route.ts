import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireBrand, BrandNotFound } from "@/lib/brand-scope";
import { productUpdateSchema } from "@/lib/schemas";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .eq("brand_id", brand.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const body = await req.json().catch(() => null);
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("products")
      .update(parsed.data)
      .eq("id", params.id)
      .eq("brand_id", brand.id)
      .select()
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Update failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    if (err instanceof BrandNotFound) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const brand = await requireBrand(params.slug);
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", params.id)
      .eq("brand_id", brand.id);
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
