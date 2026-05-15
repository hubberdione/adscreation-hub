import { GoogleGenerativeAI } from "@google/generative-ai";

export type ReferenceImage = {
  data: Buffer;
  mimeType: string;
  role: "product" | "inspo";
};

export type GeneratedImage = {
  imageBuffer: Buffer;
  mimeType: string;
  cost_usd: number;
};

const DEFAULT_MODEL = "gemini-3-pro-image-preview";
// Conservative per-image cost estimate. Real cost is provider-dependent.
const ESTIMATED_COST_PER_IMAGE = 0.15;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

function getModelName(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * Generate one image from a composed prompt + optional reference images.
 * - Server-side only. Never call from the browser.
 * - References attach in the order received. Caller is responsible for ordering
 *   product refs vs inspo refs and writing the prompt to match.
 */
export async function generateImage({
  prompt,
  references = [],
}: {
  prompt: string;
  references?: ReferenceImage[];
}): Promise<GeneratedImage> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: getModelName() });

  const parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  > = [{ text: prompt }];

  for (const ref of references) {
    parts.push({
      inlineData: {
        data: ref.data.toString("base64"),
        mimeType: ref.mimeType,
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  const response = result.response;
  const candidates = response.candidates ?? [];

  for (const candidate of candidates) {
    const candidateParts = candidate.content?.parts ?? [];
    for (const part of candidateParts) {
      const inline = (part as { inlineData?: { data: string; mimeType: string } })
        .inlineData;
      if (inline?.data) {
        return {
          imageBuffer: Buffer.from(inline.data, "base64"),
          mimeType: inline.mimeType || "image/png",
          cost_usd: ESTIMATED_COST_PER_IMAGE,
        };
      }
    }
  }

  throw new Error(
    "Gemini returned no image. Possible cause: model name mismatch, policy block, or response-modality config not supported."
  );
}
