export type GenerationRunStatus =
  | "queued"
  | "running"
  | "complete"
  | "failed";

export type GenerationRunType = "static" | "video" | "vsl" | "ugc" | "motion";

export type GenerationRun = {
  id: string;
  brand_id: string;
  product_id: string | null;
  run_type: GenerationRunType;
  status: GenerationRunStatus;
  prompt: string | null;
  image_url: string | null;
  aspect_ratio: string | null;
  creative_brief: string | null;
  reference_files: Record<string, unknown> | null;
  cost_usd: number;
  error: string | null;
  created_at: string;
};
