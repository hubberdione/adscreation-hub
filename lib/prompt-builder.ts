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

function describeInspoMechanism(ref: CompetitorReference, i: number): string {
  const label = ref.competitor_name ?? `Reference ${i + 1}`;
  const tag = ref.is_winner ? " (proven winner)" : "";
  const noteFragment = ref.notes ? `\n    Mechanism note: ${ref.notes}` : "";
  const copyFragment =
    ref.source_type === "text_copy" && ref.copy_text
      ? `\n    Sample copy text from that reference: "${ref.copy_text.slice(0, 280)}"`
      : "";
  return `  - ${label}${tag}${noteFragment}${copyFragment}`;
}

/**
 * Compose the full prompt for a Gemini image generation.
 *
 * Hard rules embedded in the prompt:
 *   - The generator produces a NEW image, not an edit of any reference.
 *   - Inspo references are described in TEXT only. Inspo image bytes are not
 *     attached to the request, so the generator cannot pattern-match the inspo
 *     image pixel-for-pixel. This protects against derivative output.
 *   - Product reference images ARE attached and used for identity-lock on
 *     product surface details only.
 *   - Brand DNA + tone constraints are loaded server-side from the DB.
 */
export function composeStaticPrompt(opts: ComposeOptions): string {
  const { brand, product, inspoRefs = [], creativeBrief, aspectRatio } = opts;
  const tone = buildCopyTone(product.status);
  const dna = (brand.dna_prompt ?? "").trim();
  const description = (product.description ?? "").trim();
  const benefits = Array.isArray(product.hero_benefits)
    ? product.hero_benefits.filter(Boolean).join(" | ")
    : "";

  const inspoSection =
    inspoRefs.length > 0
      ? `

# INSPO MECHANISM NOTES (text only — no inspo image is attached)
The following references inspired this brief. They are described here for STRUCTURAL inspiration only — composition framing, hook pattern, or proof shape. The actual inspo images are intentionally NOT attached to this request. You must generate an entirely new ${brand.name}-native image based on the brand DNA, product photos, and brief below. Do not attempt to reconstruct or echo the inspo visually.

${inspoRefs.map(describeInspoMechanism).join("\n")}`
      : "";

  return `TASK: Generate a NEW production-ready Meta-ready static ad creative for the brand "${brand.name}". Output ONE original image. Do not edit, modify, or echo any attached image; treat attached images strictly as identity-lock product references.

# CREATIVE BRIEF (this is the visual you must create)
${creativeBrief.trim()}

# OUTPUT SPEC
- Aspect ratio: ${aspectRatio}
- Production-ready static ad: no watermarks, no source attribution, no stock-photo overlays.
- No AI tells: perfect hands and fingers if humans appear (no extra or missing fingers, no warped limbs).
- Any rendered text in the image must be spelled EXACTLY as the brief specifies — no typos, no autocorrected words, no extra characters.
- Visual register: match the Brand DNA below.

# BRAND DNA — DO NOT DEVIATE
${dna || "(no Brand DNA on file — render in a clean editorial style)"}

# PRODUCT TRUTH — preserve every visible surface detail; do not invent features
Product name: ${product.name}
${description || "(no description on file)"}
Hero color: ${product.hero_color ?? "(not specified)"}
Selling points: ${benefits || "(see description)"}
One-liner: ${product.one_liner ?? "(not specified)"}

# TONE — product status is "${product.status}" (${tone.label})
ALLOWED CTAs (use one if a CTA renders in-frame): ${tone.allowed_ctas.join(", ") || "(no CTA — copy-only)"}
BANNED phrases (must NOT appear visually anywhere): ${tone.banned_phrases.join(", ") || "(none)"}
Proof rules:
${tone.proof_rules.map((r) => `- ${r}`).join("\n") || "- (no specific proof rules)"}

# ATTACHED REFERENCE IMAGES (product identity-lock only)
The image(s) attached to this request show the actual product. Preserve every visible product detail exactly — form factor, color, material, surface texture, hardware, proportions. Do not invent any feature not present in the attached photo. The attached images are not the creative — you must compose a new scene per the brief.${inspoSection}

FINAL CHECK before you output:
- Is this a NEW image (not an edit of any attached photo)?
- Does the scene match the CREATIVE BRIEF above?
- Does the product look identical to the attached reference photo?
- Does the overall look match the BRAND DNA?
- Does any rendered text avoid all BANNED phrases?
- If any answer is no — regenerate before responding.`;
}
