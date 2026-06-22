import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { embedText, assetProfile } from "../agent/tools/embed.js";
import { REPO_ROOT } from "../agent/brand.js";

const INDEX = resolve(REPO_ROOT, "assets/index.json");
const EMB = resolve(REPO_ROOT, "assets/embeddings.json");
const CONC = Number(process.env.INDEX_CONCURRENCY ?? 5);

const index = JSON.parse(await readFile(INDEX, "utf8")) as Record<string, any>;
const emb: Record<string, number[]> = existsSync(EMB) ? JSON.parse(await readFile(EMB, "utf8")) : {};
const force = process.argv.includes("--force");
const todo = Object.entries(index).filter(([k]) => force || !emb[k]);

let n = 0;
for (let i = 0; i < todo.length; i += CONC) {
  const batch = todo.slice(i, i + CONC);
  await Promise.all(batch.map(async ([key, e]) => {
    try { emb[key] = await embedText(assetProfile(e), "RETRIEVAL_DOCUMENT"); }
    catch (err) { process.stdout.write(`\n✗ embed ${e.name}: ${err instanceof Error ? err.message : err}\n`); }
  }));
  n += batch.length;
  await writeFile(EMB, JSON.stringify(emb));
  process.stdout.write(`embedded ${n}/${todo.length}\r`);
}
console.log(`\nembedded ${n}, total ${Object.keys(emb).length} → assets/embeddings.json`);
