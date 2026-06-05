import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { REPO_ROOT } from "../../brand.js";
import { dimsFor, type ImageProvider, type ImageRequest, type ImageResult } from "../image-types.js";
import { pngSize } from "../../util/png-size.js";

/**
 * Gemini-native image generation ("Nano Banana" family) via the Generative Language
 * REST API: POST /v1beta/models/{model}:generateContent with responseModalities:["IMAGE"].
 * Accepts reference images as inline input parts to condition the look (on-brand
 * consistency). Imagen 4 uses a different (:predict) schema and is intentionally not
 * used here.
 *
 * Env:
 *   GEMINI_API_KEY (or GOOGLE_API_KEY)   — required to run
 *   GEMINI_IMAGE_MODEL                   — default "gemini-2.5-flash-image"
 */

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}
interface GeminiRequest {
  contents: { role: "user"; parts: GeminiPart[] }[];
  generationConfig: { responseModalities: string[]; imageConfig?: { aspectRatio: string } };
}

/** Pure, testable request builder (no IO). */
export function buildGeminiRequest(prompt: string, aspectRatio: string, refs: GeminiPart[]): GeminiRequest {
  return {
    contents: [{ role: "user", parts: [{ text: prompt }, ...refs] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio },
    },
  };
}

async function refsToParts(paths: string[] | undefined): Promise<GeminiPart[]> {
  if (!paths?.length) return [];
  const parts: GeminiPart[] = [];
  for (const p of paths.slice(0, 3)) {
    const abs = isAbsolute(p) ? p : resolve(REPO_ROOT, p);
    const mime = MIME[extname(abs).toLowerCase()];
    if (!mime) continue;
    const data = (await readFile(abs)).toString("base64");
    parts.push({ inlineData: { mimeType: mime, data } });
  }
  return parts;
}

export const geminiProvider: ImageProvider = {
  name: "gemini",
  async generate(req: ImageRequest): Promise<ImageResult> {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set; cannot use the gemini image provider.");
    }
    const model = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
    const aspectRatio = req.aspectRatio ?? "1:1";

    const body = buildGeminiRequest(req.prompt, aspectRatio, await refsToParts(req.references));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini image API ${res.status}: ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: GeminiPart[] } }[];
    };
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData) {
      throw new Error("Gemini response contained no image data.");
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    const outPath = isAbsolute(req.outPath) ? req.outPath : resolve(REPO_ROOT, req.outPath);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, buffer);

    const size = pngSize(buffer) ?? dimsFor(req.aspectRatio);
    return { outPath, width: size.width, height: size.height, provider: "gemini" };
  },
};
