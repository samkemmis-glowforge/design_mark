import { Buffer } from "node:buffer";

/**
 * Vision tagging via Gemini generateContent: an image → structured metadata for
 * a searchable asset index (caption, category, tags, colors, objects, …).
 * Distinct from generate-image (which makes pixels) — this reads them.
 *
 * Env: GEMINI_API_KEY (or GOOGLE_API_KEY); GEMINI_VISION_MODEL (default gemini-2.5-flash).
 */

import { geminiFetch } from "../util/gemini-fetch.js";

/** Bump when the triage rubric changes — index-drive re-tags any asset stamped with
 *  an older gate version, in advancing batches (no --force needed). */
export const GATE_VERSION = 2;

export interface AssetTags {
  caption: string;
  reusability: string;
  reuse_notes: string;
  marketing_usable: boolean;
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
    reusability: {
      type: "string",
      enum: ["reusable", "dated-promo", "screenshot", "low-value"],
      description: "reusable=a generic, reuse-anywhere building block (clean product/lifestyle/finished-project photo, a CLEAN/presentable app or feature UI shot, logo/icon/pattern/illustration) with no campaign-specific copy; dated-promo=a finished ad locked to one promotion (baked-in price, sale date, coupon, seasonal/event copy); screenshot=ONLY a throwaway/internal screen capture (error or empty state, half-cropped or cluttered window, internal dashboard, document, slide, email, spreadsheet, or low-quality grab) — a nice-looking product/app UI is 'reusable', NOT a screenshot; low-value=blurry, low-res, duplicate, watermarked comp, WIP scratch, or not a deliberate brand asset.",
    },
    reuse_notes: { type: "string", description: "Brief reason for the reusability call — what makes it generic, or what locks it to a single use." },
    marketing_usable: { type: "boolean", description: "TRUE when reusability='reusable' — a clean asset a designer could drop into a NEW campaign as-is, INCLUDING a polished app/feature UI shot. FALSE for dated-promo, throwaway/internal screenshots, and low-value files." },
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
  required: ["caption", "reusability", "reuse_notes", "marketing_usable", "subject_type", "product", "features", "tags", "colors", "objects", "has_text", "suggested_use"],
};

const PROMPT =
  "You are triaging a Glowforge marketing image for a searchable library of REUSABLE assets. Glowforge makes BOTH " +
  "hardware (laser cutter/engraver machines — product lines include Aura, Spark, Pro, Plus, Basic) AND " +
  "software (the Glowforge web/app design tool, with features like Smartfit auto-nesting, Magic Canvas / " +
  "AI design, the catalog, and Print).\n\n" +
  "FIRST decide reusability. The library only keeps generic, reuse-anywhere building blocks a designer could drop " +
  "into a NEW campaign as-is: clean product photography, clean lifestyle/maker/finished-project photos, and brand " +
  "assets (logos, icons, patterns, illustrations). REJECT (marketing_usable=false) the one-offs that bloat the " +
  "library: ads locked to a specific promotion (baked-in price, sale date, coupon, seasonal/event copy), and " +
  "low-value files (blurry, low-res, duplicate, watermarked comps, WIP scratch).\n\n" +
  "IMPORTANT — software/app UI is a PRODUCT, not junk. Glowforge's app is something we market, so a CLEAN, " +
  "presentable shot of the app or a feature (the design canvas, Magic Canvas / AI design, Smartfit, the catalog, " +
  "a feature highlight, an in-app design) IS reusable: set reusability='reusable' and subject_type='software-ui'. " +
  "Only use reusability='screenshot' for genuinely throwaway captures — error/empty states, half-cropped or " +
  "cluttered windows, internal dashboards, documents, spreadsheets, emails, slides, or low-quality grabs. A " +
  "nice-looking product/app UI is an asset to KEEP, not a screenshot to reject.\n\n" +
  "THEN classify precisely — `subject_type` (distinguish a hardware machine shot from a software-ui app shot from " +
  "a finished laser-made project), `product`, and `features`. Use specific, natural search terms a marketer would " +
  "type. Lowercase tags.";

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
