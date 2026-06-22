import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { tagImage } from "../agent/tools/vision-tag.js";
import { REPO_ROOT } from "../agent/brand.js";

const INDEX = resolve(REPO_ROOT, "assets/index.json");
const meta = JSON.parse(await readFile("/tmp/drivepilot/meta.json", "utf8")) as Record<string, any>;
const index: Record<string, any> = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, "utf8")) : {};
for (const [id, m] of Object.entries(meta)) {
  try {
    const bytes = await readFile(`/tmp/drivepilot/${id}.jpg`);
    const tags = await tagImage(bytes, "image/jpeg");
    index[`drive:${id}`] = { name: m.title, source: "drive", driveId: id, driveUrl: m.viewUrl, ...tags, indexed_at: new Date().toISOString() };
    console.log(`✓ ${m.title} — ${tags.category} [${tags.tags.slice(0,5).join(", ")}]`);
  } catch (e) { console.log(`✗ ${m.title}: ${e instanceof Error ? e.message : e}`); }
}
await writeFile(INDEX, JSON.stringify(index, null, 2));
console.log(`\n→ ${Object.keys(index).length} entries in assets/index.json`);
