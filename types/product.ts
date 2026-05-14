export type ProductStatus = "pre_order" | "sale" | "sold_out" | "draft";

export type Product = {
  id: string;
  brand_id: string;
  name: string;
  status: ProductStatus;
  description: string | null;
  hero_color: string | null;
  price_usd: number | null;
  one_liner: string | null;
  hero_benefits: string[] | null;
  banned_terms: string[] | null;
  created_at: string;
};
