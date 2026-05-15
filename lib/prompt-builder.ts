import type { Brand } from "@/types/brand";
import type { Product } from "@/types/product";
import type { CompetitorReference } from "@/types/competitor";
import { buildCopyTone } from "./tone";

export type AspectRatio = "4:5" | "1:1" | "16:9" | "9:16";

export type ComposeOptions = {
  brand: Brand;
  product: Product;
  inspoRefs?: CompetitorReference[];
  creativeBrief: string;
  aspectRatio: AspectRatio;
};

/**
 * Compose the full 6-block prompt for a Gemini image generation.
 * - Server-side only.
 * - Brand DNA is loaded fresh from the DB by the caller, never accepted from client input.
 * - Inspo handling explicitly instructs MECHANISM EXTRACTION, not literal copy,
 *   per the user's variance-ladder framework (default 40% variance).
 */
export function composeStaticPrompt(opts: ComposeOptions): string {
  const { brand, product, inspoRefs = [], creativeBrief, aspectRatio } = opts;
  const tone = buildCopyTone(product.status);
  const dna = (brand.dna_prompt ?? "").trim();
  const description = (product.description ?? "").trim();
  const benefits = Array.isArray(product.hero_benefits)
    ? product.hero_benefits.filter(Boolean).join(" | ")
    : "";

  const inspoNotes = inspoRefs
    .map((r, i) => {
      const label = r.competitor_name ?? "Competitor";
      const tag = r.is_winner ? " (proven winner)" : "";
      const noteFragment = r.notes ? ` — note: ${r.notes}` : "";
      return `  [Inspo ${i + 1}] ${label}${tag}${noteFragment}`;
    })
    .join("\n");

  const referenceGuidance =
    inspoRefs.length > 0
      ? `Some images attached after this prompt are INSPO REFERENCES. Study them only for their underlying STRUCTURAL MECHANISM — composition pattern, visual hook framing, the SHAPE of the proof element, where the eye is led. Translate that mechanism into a fully ${brand.name}-native execution. Do NOT replicate the literal design, colors, props, typography, illustration style, or product silhouette from the inspo. The execution must look like a ${brand.name} ad — not a reskin of the reference.

The remaining attached images are PRODUCT REFERENCES. Preserve every visible product detail exactly: form factor, color, material, surface texture, hardware, proportions. Do not invent any feature not present in the product reference.`
      : `All attached images are PRODUCT REFERENCES. Preserve every visible product detail exactly. Stay conservative on any visual element not explicitly specified in the brief.`;

  return `You are generating a Meta-ready static ad creative for ${brand.name}.

# BRAND DNA — DO NOT DEVIATE
${dna || "(no Brand DNA provided — render conservatively to a clean editorial style)"}

# PRODUCT TRUTH — PRESERVE EVERY SURFACE DETAIL; DO NOT INVENT FEATURES
Product: ${product.name}
${description || "(no description provided)"}
Hero color: ${product.hero_color ?? "(not specified)"}
Selling points: ${benefits || "(see description)"}
One-liner: ${product.one_liner ?? "(not specified)"}

# TONE — product status is "${product.status}" (${tone.label})
ALLOWED CTAs (if a CTA renders in-frame, use one of these verbatim): ${tone.allowed_ctas.join(", ") || "(no CTA — copy-only)"}
BANNED phrases (must NOT appear visually anywhere in the image): ${tone.banned_phrases.join(", ") || "(none)"}
Proof rules:
${tone.proof_rules.map((r) => `- ${r}`).join("\n") || "- (no specific proof rules)"}

# REFERENCE IMAGE HANDLING
${referenceGuidance}
${inspoNotes ? `\nInspo refs in this batch:\n${inspoNotes}\n` : ""}

# CREATIVE BRIEF (this generation only)
${creativeBrief.trim()}

# OUTPUT SPEC
- Aspect ratio: ${aspectRatio}
- Production-ready static ad — no watermarks, no source attribution stamps.
- No AI tells: perfect hands and fingers if humans appear (no extra or missing fingers, no warped limbs).
- Any rendered text must be spelled EXACTLY as specified in the brief — no typos, no autocorrected words, no extra characters.
- Visual register matches the Brand DNA above. If the DNA conflicts with the inspo's visual style, the DNA wins.`;
}
