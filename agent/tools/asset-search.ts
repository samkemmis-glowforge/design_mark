import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../brand.js";
import { embedText, cosine } from "./embed.js";

/**
 * Search the asset index (assets/index.json). Semantic when embeddings exist
 * (assets/embeddings.json) and a GEMINI key is set — embeds the query and ranks
 * by cosine, lightly boosted by keyword hits — else falls back to keyword only.
 * Shared by the CLI (scripts/search-assets.ts) and the MCP search_assets tool.
 */

export interface AssetHit {
  key: string; name: string; caption: string; category: string;
  tags: string[]; url?: string; score: number;
}

const INDEX = resolve(REPO_ROOT, "assets/index.json");
const EMB = resolve(REPO_ROOT, "assets/embeddings.json");

function keywordScore(e: any, terms: string[]): number {
  const hay = [e.name, e.caption, e.category, e.suggested_use, ...(e.tags ?? []), ...(e.objects ?? []), ...(e.colors ?? [])]
    .join(" ").toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (hay.includes(t)) s += 1;
    if ((e.tags ?? []).some((tag: string) => tag.toLowerCase().includes(t))) s += 2;
  }
  return s;
}

export async function searchAssets(query: string, limit = 8): Promise<AssetHit[]> {
  if (!existsSync(INDEX)) return [];
  const index = JSON.parse(await readFile(INDEX, "utf8")) as Record<string, any>;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  let emb: Record<string, number[]> | null = null;
  let qv: number[] | null = null;
  if (existsSync(EMB)) {
    try { emb = JSON.parse(await readFile(EMB, "utf8")); qv = await embedText(query, "RETRIEVAL_QUERY"); }
    catch { emb = null; qv = null; } // no key / API down → keyword only
  }

  const rows = Object.entries(index).map(([key, e]) => {
    const kw = keywordScore(e, terms);
    const sem = emb && qv && emb[key] ? cosine(qv, emb[key]) : 0;
    // semantic dominates (0..1); keyword nudges ties and rewards exact matches
    const score = emb && qv ? sem + 0.03 * kw : kw;
    return { key, e, score, sem, kw };
  });

  const ranked = rows
    .filter((r) => (emb && qv ? r.score > 0.25 || r.kw > 0 : r.kw > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ key, e, score }) => ({
    key, name: e.name, caption: e.caption ?? "", category: e.category ?? "",
    tags: e.tags ?? [], url: e.driveUrl ?? e.url, score: +score.toFixed(3),
  }));
}
