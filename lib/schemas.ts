import { z } from "zod";

export const brandCreateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and dashes only"),
  name: z.string().min(1).max(80),
  drive_folder_id: z.string().trim().optional().nullable(),
});

export const productStatusSchema = z.enum([
  "pre_order",
  "sale",
  "sold_out",
  "draft",
]);

export const productCreateSchema = z.object({
  name: z.string().min(1).max(80),
  status: productStatusSchema,
  description: z.string().optional().nullable(),
  hero_color: z.string().optional().nullable(),
  price_usd: z.coerce.number().nonnegative().optional().nullable(),
  one_liner: z.string().optional().nullable(),
  hero_benefits: z.array(z.string()).optional().nullable(),
  banned_terms: z.array(z.string()).optional().nullable(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const competitorSourceTypeSchema = z.enum([
  "ad_library_url",
  "drive_asset",
  "text_copy",
  "auto_scrape",
]);

export const competitorCreateSchema = z
  .object({
    source_type: competitorSourceTypeSchema,
    url: z.string().url().optional().nullable(),
    drive_file_id: z.string().optional().nullable(),
    copy_text: z.string().min(1).optional().nullable(),
    competitor_name: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    is_winner: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // exactly one of url/drive_file_id/copy_text must be present
      // unless source_type=auto_scrape (which has no source field, scraper fills it)
      if (data.source_type === "auto_scrape") return true;
      const filled = [data.url, data.drive_file_id, data.copy_text].filter(
        (v) => v != null && v !== ""
      ).length;
      return filled === 1;
    },
    {
      message:
        "Exactly one of url / drive_file_id / copy_text is required for this source_type",
    }
  );

export const aspectRatioSchema = z.enum(["4:5", "1:1", "16:9", "9:16"]);

export const generateStaticSchema = z.object({
  product_id: z.string().uuid(),
  creative_brief: z.string().min(10).max(4000),
  aspect_ratio: aspectRatioSchema.default("4:5"),
  inspo_reference_ids: z.array(z.string().uuid()).optional().default([]),
});

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CompetitorCreateInput = z.infer<typeof competitorCreateSchema>;
export type GenerateStaticInput = z.infer<typeof generateStaticSchema>;
