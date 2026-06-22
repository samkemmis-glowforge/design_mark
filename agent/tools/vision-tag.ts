import { Buffer } from "node:buffer";

/**
 * Vision tagging via Gemini generateContent: an image → structured metadata for
 * a searchable asset index (caption, category, tags, colors, objects, …).
 * Distinct from generate-image (which makes pixels) — this reads them.
 *
 * Env: GEMINI_API_KEY (or GOOGLE_API_KEY); GEMINI_VISION_MODEL (default gemini-2.5-flash).
 */

export interface AssetTags {
  caption: string;
  category: string;
  tags: string[];
  colors: string[];
  objects: string[];
  orientation: "square" | "portrait" | "landscape";
  has_text: boolean;
  suggested_use: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    caption: { type: "string", description: "One concise sentence describing the image." },
    category: { type: "string", description: "e.g. product-shot, lifestyle, logo, illustration, ui-screenshot, social-graphic, texture, icon, photo-people." },
    tags: { type: "array", items: { type: "string" }, description: "5–12 lowercase search keywords." },
    colors: { type: "array", items: { type: "string" }, description: "2–4 dominant colors as plain names or hex." },
    objects: { type: "array", items: { type: "string" }, description: "Key objects/subjects visible." },
    orientation: { type: "string", enum: ["square", "portrait", "landscape"] },
    has_text: { type: "boolean", description: "Does the image contain rendered text/copy?" },
    suggested_use: { type: "string", description: "Where a marketer would use this (e.g. 'IG feed background', 'hero banner', 'icon')." },
  },
  required: ["caption", "category", "tags", "colors", "objects", "orientation", "has_text", "suggested_use"],
};

const PROMPT =
  "You are cataloguing a marketing asset for a searchable library. Analyze the image and return " +
  "metadata as JSON matching the schema. Be specific and use natural search terms a marketer would " +
  "type. Lowercase tags. If it's a brand/product image, name the product type and setting.";

/** Tag a single image (raw bytes). Returns structured metadata. */
export async function tagImage(bytes: Buffer, mimeType: string): Promise<AssetTags> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set.");
  const model = process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";

  const res = await fetch(
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
