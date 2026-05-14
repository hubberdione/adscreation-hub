export type CompetitorSourceType =
  | "ad_library_url"
  | "drive_asset"
  | "text_copy"
  | "auto_scrape";

export type CompetitorReference = {
  id: string;
  brand_id: string;
  source_type: CompetitorSourceType;
  url: string | null;
  drive_file_id: string | null;
  copy_text: string | null;
  competitor_name: string | null;
  notes: string | null;
  is_winner: boolean;
  created_at: string;
};
