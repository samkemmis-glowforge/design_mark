import { Buffer } from "node:buffer";

/**
 * Vision tagging via Gemini generateContent: an image → structured metadata for
 * a searchable asset index (caption, category, tags, colors, objects, …).
 * Distinct from generate-image (which makes pixels) — this reads them.
 *
 * Env: GEMINI_API_KEY (or GOOGLE_API_KEY); GEMINI_VISION_MODEL (default gemini-2.5-flash).
 */

import { geminiFetch } from "../util/gemini-fetch.js";

export interface AssetTags {
  caption: string;
  subject_type: string;
  product: string;
  features: string[];
  tags: string[];
  colors: string[];
  objects: string[];
  has_text: boolean;
  suggested_use: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    caption: { type: "string", description: "One concise sentence describing the image." },
    subject_type: {
      type: "string",
      enum: ["hardware", "software-ui", "finished-project", "lifestyle", "packaging", "branding", "promo-graphic", "other"],
      description: "Primary subject: hardware=the physical laser machine is the focus; software-ui=a screenshot/mockup of the app/web interface; finished-project=a laser-made object; lifestyle=people/makers/scenes; packaging; branding=logo/wordmark; promo-graphic=composed ad with copy.",
    },
    product: { type: "string", description: "Named Glowforge product if identifiable (e.g. 'Aura', 'Spark', 'Pro', 'Glowforge app', 'Premium'), else empty." },
    features: { type: "array", items: { type: "string" }, description: "Software features shown/named (e.g. 'Smartfit', 'Magic Canvas', 'AI design', 'catalog', 'Print'). Empty if none." },
    tags: { type: "array", items: { type: "string" }, description: "5–12 lowercase search keywords." },
    colors: { type: "array", items: { type: "string" }, description: "2–4 dominant colors (names or hex)." },
    objects: { type: "array", items: { type: "string" }, description: "Key objects/subjects visible." },
    has_text: { type: "boolean", description: "Does the image contain rendered text/copy?" },
    suggested_use: { type: "string", description: "Where a marketer would use this." },
  },
  required: ["caption", "subject_type", "product", "features", "tags", "colors", "objects", "has_text", "suggested_use"],
};

const PROMPT =
  "You are cataloguing a Glowforge marketing asset for a searchable library. Glowforge makes BOTH " +
  "hardware (laser cutter/engraver machines — product lines include Aura, Spark, Pro, Plus, Basic) AND " +
  "software (the Glowforge web/app design tool, with features like Smartfit auto-nesting, Magic Canvas / " +
  "AI design, the catalog, and Print). Classify the image precisely with the schema — especially " +
  "`subject_type` (distinguish a hardware machine shot from a software-ui screenshot from a finished " +
  "laser-made project), `product` (name it if you can tell), and `features` (any software features shown). " +
  "Use specific, natural search terms a marketer would type. Lowercase tags.";

/** Tag a single image (raw bytes). Returns structured metadata. */
export async function tagImage(bytes: Buffer, mimeType: string): Promise<AssetTags> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set.");
  const model = process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";

  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType, data: bytes.toString("base64") } }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini vision ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini vision returned no text.");
  return JSON.parse(text) as AssetTags;
}
