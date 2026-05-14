import { getServerSupabase } from "./supabase/server";
import type { Brand } from "@/types/brand";

/**
 * The isolation core. Every server function that touches brand data must go
 * through requireBrand(slug). It returns the brand row or throws BrandNotFound.
 * No code path elsewhere should accept a free-form brand string.
 */
export class BrandNotFound extends Error {
  constructor(slug: string) {
    super(`Brand not found: ${slug}`);
    this.name = "BrandNotFound";
  }
}

export async function requireBrand(slug: string): Promise<Brand> {
  if (!slug || typeof slug !== "string") {
    throw new BrandNotFound(String(slug));
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) throw new BrandNotFound(slug);
  return data as Brand;
}

export async function getBrandDnaPrompt(brandId: string): Promise<string> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("brands")
    .select("dna_prompt")
    .eq("id", brandId)
    .single();
  if (error || !data) return "";
  return data.dna_prompt ?? "";
}
