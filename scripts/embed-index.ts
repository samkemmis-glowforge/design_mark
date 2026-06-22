import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { embedText, assetProfile } from "../agent/tools/embed.js";
import { REPO_ROOT } from "../agent/brand.js";
const INDEX = resolve(REPO_ROOT, "assets/index.json");
const EMB = resolve(REPO_ROOT, "assets/embeddings.json");
const index = JSON.parse(await readFile(INDEX, "utf8")) as Record<string, any>;
const emb: Record<string, number[]> = existsSync(EMB) ? JSON.parse(await readFile(EMB, "utf8")) : {};
const force = process.argv.includes("--force");
let n = 0;
for (const [key, e] of Object.entries(index)) {
  if (!force && emb[key]) continue;
  emb[key] = await embedText(assetProfile(e), "RETRIEVAL_DOCUMENT");
  n++; if (n % 10 === 0) await writeFile(EMB, JSON.stringify(emb));
}
await writeFile(EMB, JSON.stringify(emb));
console.log(`embedded ${n}, total ${Object.keys(emb).length} → assets/embeddings.json`);
