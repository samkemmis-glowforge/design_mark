import { searchAssets } from "../agent/tools/asset-search.js";
const q = process.argv.slice(2).join(" ").trim();
if (!q) { console.error("usage: search-assets <query>"); process.exit(1); }
const hits = await searchAssets(q, 8);
if (!hits.length) { console.log(`no matches for "${q}"`); process.exit(0); }
console.log(`Top matches for "${q}":\n`);
for (const h of hits) {
  console.log(`  [${h.score}] ${h.name}  (${h.subject_type}${h.product ? "/" + h.product : ""})`);
  console.log(`        ${h.caption}`);
  if (h.url) console.log(`        ${h.url}`);
  console.log();
}
