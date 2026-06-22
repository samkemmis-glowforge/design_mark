import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, extname, basename, relative, join } from "node:path";
import { tagImage } from "../agent/tools/vision-tag.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Walk image sources, tag each with the vision model, and write a searchable
 * index (assets/index.json). Source-agnostic: pass dirs/files as args. The Drive
 * walker (scripts/index-drive.ts) feeds the same tagImage() + entry shape.
 * Incremental: skips already-indexed paths unless --force.
 */

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const INDEX = resolve(REPO_ROOT, "assets/index.json");
const REF = "claude/gifted-davinci-YFc85";
const RAW = `https://raw.githubusercontent.com/samkemmis-glowforge/design_mark/${REF}/`;

async function walk(p: string, out: string[]) {
  const s = await stat(p);
  if (s.isDirectory()) for (const e of await readdir(p)) await walk(join(p, e), out);
  else if (MIME[extname(p).toLowerCase()]) out.push(p);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const inputs = args.filter((a) => !a.startsWith("--"));
  if (!inputs.length) { console.error("usage: index-assets <dir|file> … [--force]"); process.exit(1); }

  const files: string[] = [];
  for (const i of inputs) await walk(resolve(REPO_ROOT, i), files);

  const index: Record<string, unknown> = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, "utf8")) : {};
  let done = 0, skip = 0;
  for (const abs of files) {
    const rel = relative(REPO_ROOT, abs);
    if (!force && index[rel]) { skip++; continue; }
    try {
      const bytes = await readFile(abs);
      const tags = await tagImage(bytes, MIME[extname(abs).toLowerCase()]);
      index[rel] = {
        name: basename(abs), path: rel, bytes: bytes.length,
        url: rel.startsWith("assets/") || rel.startsWith("brand/") ? RAW + rel : undefined,
        ...tags, indexed_at: new Date().toISOString(),
      };
      done++; process.stdout.write(`✓ ${basename(abs)} — ${tags.category} [${tags.tags.slice(0, 4).join(", ")}]\n`);
    } catch (e) { process.stdout.write(`✗ ${basename(abs)}: ${e instanceof Error ? e.message : e}\n`); }
  }
  await writeFile(INDEX, JSON.stringify(index, null, 2));
  console.log(`\nindexed ${done}, skipped ${skip}, total ${Object.keys(index).length} → assets/index.json`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
