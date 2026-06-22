/**
 * Text embeddings via Gemini, for semantic asset search. embedText() turns a
 * query or an asset's text profile into a vector; cosine() ranks them.
 * Env: GEMINI_API_KEY (or GOOGLE_API_KEY); GEMINI_EMBED_MODEL (default gemini-embedding-001).
 */

export async function embedText(text: string, taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY"): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set.");
  const model = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] }, taskType, outputDimensionality: 768 }),
  });
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);
  const json = (await res.json()) as { embedding?: { values?: number[] } };
  const v = json.embedding?.values;
  if (!v?.length) throw new Error("Gemini embed returned no vector.");
  return v;
}

/** Text profile of an indexed asset, used as the document to embed. */
export function assetProfile(e: { caption?: string; category?: string; tags?: string[]; objects?: string[]; suggested_use?: string; name?: string }): string {
  return [e.name, e.caption, e.category, (e.tags ?? []).join(", "), (e.objects ?? []).join(", "), e.suggested_use]
    .filter(Boolean).join(". ");
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
