import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { brandCreateSchema } from "@/lib/schemas";

export async function GET() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brands: data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = brandCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      drive_folder_id: parsed.data.drive_folder_id || null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brand: data }, { status: 201 });
}
