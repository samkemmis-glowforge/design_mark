import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Keyword search over assets/index.json (v1: term-frequency scoring across
 * caption/tags/category/objects/suggested_use/name). Next step: swap in vector
 * embeddings for true semantic search. Usage: search-assets warm lifestyle wood
 */
async function main() {
  const q = process.argv.slice(2).join(" ").toLowerCase().trim();
  if (!q) { console.error("usage: search-assets <query>"); process.exit(1); }
  const terms = q.split(/\s+/);
  const index = JSON.parse(await readFile(resolve(REPO_ROOT, "assets/index.json"), "utf8")) as Record<string, any>;

  const scored = Object.values(index).map((e: any) => {
    const hay = [e.name, e.caption, e.category, e.suggested_use, ...(e.tags ?? []), ...(e.objects ?? []), ...(e.colors ?? [])]
      .join(" ").toLowerCase();
    let score = 0;
    for (const t of terms) {
      const n = (hay.match(new RegExp(t.replace(/[^a-z0-9]/g, ""), "g")) || []).length;
      score += n + (e.tags?.some((tag: string) => tag.toLowerCase().includes(t)) ? 2 : 0);
    }
    return { e, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  if (!scored.length) { console.log(`no matches for "${q}"`); process.exit(0); }
  console.log(`Top matches for "${q}":\n`);
  for (const { e, score } of scored) {
    console.log(`  [${score}] ${e.name}  (${e.category})`);
    console.log(`        ${e.caption}`);
    console.log(`        tags: ${(e.tags ?? []).join(", ")}`);
    if (e.driveUrl || e.url) console.log(`        ${e.driveUrl ?? e.url}`);
    console.log();
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
