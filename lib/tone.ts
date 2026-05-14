import type { ProductStatus } from "@/types/product";

export type ToneConstraint = {
  label: string;
  allowed_ctas: string[];
  banned_phrases: string[];
  proof_rules: string[];
  urgency_register: "reserve" | "shop" | "restock-soon" | "render-blocked";
  can_render: boolean;
};

/**
 * Single source of truth for copy tone. Every generation call MUST pass the
 * product status through this function and respect the returned constraints.
 */
export function buildCopyTone(status: ProductStatus): ToneConstraint {
  switch (status) {
    case "pre_order":
      return {
        label: "Pre-order tone",
        allowed_ctas: ["Pre-order", "Reserve yours", "Be first in line"],
        banned_phrases: [
          "Shop now",
          "Add to bag",
          "Buy today",
          "In stock now",
          "Ships today",
          "★★★★★",
          "2,000+ reviews",
          "Bestseller",
        ],
        proof_rules: [
          "No SKU-specific review badges (no reviews yet exist).",
          "Do not promise ship dates unless PDP confirms them.",
          "Use anticipation language, not urgency.",
        ],
        urgency_register: "reserve",
        can_render: true,
      };
    case "sale":
      return {
        label: "Sale tone",
        allowed_ctas: ["Shop now", "Add to bag", "Get yours"],
        banned_phrases: ["Pre-order", "Reserve yours"],
        proof_rules: [
          "Review badges allowed when verified.",
          "Urgency language allowed (low stock, limited time).",
          "Ship-date promises allowed if accurate.",
        ],
        urgency_register: "shop",
        can_render: true,
      };
    case "sold_out":
      return {
        label: "Sold-out tone",
        allowed_ctas: ["Notify me", "Join waitlist"],
        banned_phrases: ["Shop now", "Pre-order", "Add to bag"],
        proof_rules: [
          "Past-tense proof only (testimonials, demand signals).",
          "No FOMO ads — restock signal only.",
        ],
        urgency_register: "restock-soon",
        can_render: true,
      };
    case "draft":
      return {
        label: "Draft (render blocked)",
        allowed_ctas: [],
        banned_phrases: [],
        proof_rules: [],
        urgency_register: "render-blocked",
        can_render: false,
      };
  }
}
