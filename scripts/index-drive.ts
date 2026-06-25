import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";
import { tagImage, GATE_VERSION } from "../agent/tools/vision-tag.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Walk a Google Drive folder (recursively), tag every image with the vision
 * model, and write a searchable index (assets/index.json) of the REUSABLE ones.
 * Tags Drive's own thumbnail (≈768px) rather than downloading full files.
 *
 * First-level triage gate: the vision model judges `marketing_usable` (a generic,
 * reuse-anywhere asset) vs one-off (dated promo, internal screenshot, low-value).
 * Only usable assets get a full record in index.json and get embedded later — so
 * the searchable index stays small even when the folder holds tens of thousands of
 * one-off images. Every processed id is recorded in assets/seen.json (tiny stub +
 * verdict) so incremental runs skip it and you keep an audit of what was rejected.
 *
 * Setup (one-time):
 *   1. GCP console → create a Service Account → make a JSON key.
 *   2. Share the Drive folder with the service account's email (Viewer).
 *   3. export GOOGLE_APPLICATION_CREDENTIALS=/path/key.json
 *      export DRIVE_FOLDER_ID=<the folder id>   GEMINI_API_KEY=...
 *   4. npm run index:drive            (add --force to re-tag everything)
 *
 * Incremental: skips Drive ids already processed (in seen.json) at the current gate
 * version. When the triage rubric changes, bump GATE_VERSION in vision-tag.ts — then
 * a normal run re-triages every stale-version asset in advancing --limit batches (no
 * --force needed; raw --force + --limit would re-do the same first N every run).
 * Scan-once: the recursive Drive enumeration is cached to assets/drive-listing.json
 * on the first run and reused thereafter; pass --rescan to re-walk Drive (new files
 * added, or expired thumbnail links).
 */

const INDEX = resolve(REPO_ROOT, "assets/index.json");
const SEEN = resolve(REPO_ROOT, "assets/seen.json"); // triage ledger: every processed id + verdict (tiny stubs)
const LISTING = resolve(REPO_ROOT, "assets/drive-listing.json"); // cached folder enumeration (scan once, reuse)
const FOLDER = process.env.DRIVE_FOLDER_ID;

type Img = { id: string; name: string; mimeType: string; thumb?: string; web?: string; path: string };

async function main() {
  if (!FOLDER) { console.error("set DRIVE_FOLDER_ID"); process.exit(1); }
  const force = process.argv.includes("--force");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
  const client = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: auth as any });
  const token = (await client.getAccessToken()).token!;

  const index: Record<string, any> = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, "utf8")) : {};
  const seen: Record<string, any> = existsSync(SEEN) ? JSON.parse(await readFile(SEEN, "utf8")) : {};
  // Grandfather: ids already in index.json count as processed even if seen.json predates them.
  for (const k of Object.keys(index)) if (!seen[k]) seen[k] = { u: true, r: index[k].reusability ?? "reusable" };

  // Folder enumeration: scan once, then reuse the cached listing. The recursive
  // Drive walk over a big folder is hundreds of API calls; caching it means later
  // runs (to process the next batch) go straight to tagging. --rescan refreshes it
  // (e.g. to pick up newly-added Drive files, or if cached thumbnail links expire).
  const rescan = process.argv.includes("--rescan");
  const listingCache: Record<string, { scanned_at: string; images: Img[] }> =
    existsSync(LISTING) ? JSON.parse(await readFile(LISTING, "utf8")) : {};

  let images: Img[];
  if (!rescan && listingCache[FOLDER]?.images?.length) {
    images = listingCache[FOLDER].images;
    console.log(`using cached listing: ${images.length} images (scanned ${listingCache[FOLDER].scanned_at}). Pass --rescan to re-walk Drive.`);
  } else {
    images = [];
    let folders = 0;
    const walk = async (folderId: string, path: string): Promise<void> => {
      folders++;
      process.stdout.write(`scanning [${folders}] ${path || "/"}  (${images.length} images so far)\n`);
      let pageToken: string | undefined;
      do {
        const r = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: "nextPageToken, files(id,name,mimeType,thumbnailLink,webViewLink)",
          pageSize: 1000, pageToken,
          supportsAllDrives: true, includeItemsFromAllDrives: true,
        });
        const kids = r.data.files ?? [];
        // images first (cheap), then recurse subfolders
        for (const f of kids) if (f.mimeType?.startsWith("image/"))
          images.push({ id: f.id!, name: f.name!, mimeType: f.mimeType!, thumb: f.thumbnailLink ?? undefined, web: f.webViewLink ?? undefined, path });
        for (const f of kids) if (f.mimeType === "application/vnd.google-apps.folder")
          await walk(f.id!, `${path}/${f.name}`);
        pageToken = r.data.nextPageToken ?? undefined;
      } while (pageToken);
    };
    await walk(FOLDER, "");
    listingCache[FOLDER] = { scanned_at: new Date().toISOString(), images };
    await writeFile(LISTING, JSON.stringify(listingCache));
    console.log(`\nscanned ${folders} folders — found ${images.length} images (cached → assets/drive-listing.json)`);
  }

  if (process.argv.includes("--count")) {
    const byFolder: Record<string, number> = {};
    for (const i of images) byFolder[i.path || "/"] = (byFolder[i.path || "/"] ?? 0) + 1;
    for (const [f, n] of Object.entries(byFolder).sort((a, b) => b[1] - a[1]))
      console.log(`  ${n}\t${f}`);
    const current = images.filter((i) => seen[`drive:${i.id}`]?.gv === GATE_VERSION).length;
    const stale = images.filter((i) => { const s = seen[`drive:${i.id}`]; return s && s.gv !== GATE_VERSION; }).length;
    const fresh = images.length - current - stale;
    console.log(`\n${images.length} images: ${current} up-to-date (gate v${GATE_VERSION}), ${stale} need re-triage (older rubric), ${fresh} new. (preflight only; no tagging)`);
    process.exit(0);
  }

  const CONC = Number(process.env.INDEX_CONCURRENCY ?? 5);
  // --limit N (or LIMIT env): process at most N new images this run, so a single
  // run stays time-boxed (e.g. under CI job limits). Re-run to resume — already
  // processed ids are in seen.json and skipped.
  const limArg = process.argv.indexOf("--limit");
  const limit = Number(limArg >= 0 ? process.argv[limArg + 1] : process.env.LIMIT ?? 0) || 0;
  // Process new images, anything tagged under an OLDER gate version (rubric changed),
  // or everything if --force. The gate-version check is what makes a rubric update
  // re-triage in advancing batches — re-tagged items get the current version and drop
  // out of the to-do list, so the next run moves forward (unlike raw --force + --limit).
  const todoAll = images.filter((img) => {
    const s = seen[`drive:${img.id}`];
    return (force || !s || s.gv !== GATE_VERSION) && img.thumb;
  });
  const todo = limit > 0 ? todoAll.slice(0, limit) : todoAll;
  const skip = images.length - todoAll.length;
  if (limit > 0 && todoAll.length > todo.length)
    console.log(`limiting to ${todo.length} of ${todoAll.length} remaining this run (re-run to continue)`);
  let done = 0, kept = 0, rejected = 0;
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC);
    await Promise.all(batch.map(async (img) => {
      const key = `drive:${img.id}`;
      try {
        const url = img.thumb!.replace(/=s\d+$/, "=s768");
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const bytes = Buffer.from(await res.arrayBuffer());
        const tags = await tagImage(bytes, "image/jpeg");
        // First-level gate: only reusable assets earn a full record + later embedding.
        seen[key] = { u: tags.marketing_usable, r: tags.reusability, n: img.name, gv: GATE_VERSION };
        if (tags.marketing_usable) {
          index[key] = { name: img.name, source: "drive", driveId: img.id, driveUrl: img.web, folder: img.path, ...tags, indexed_at: new Date().toISOString() };
          kept++;
        } else {
          delete index[key]; // in case a prior run had kept it
          rejected++;
        }
      } catch (e) { process.stdout.write(`\n✗ ${img.name}: ${e instanceof Error ? e.message : e}\n`); }
    }));
    done += batch.length;
    await writeFile(INDEX, JSON.stringify(index, null, 2)); // checkpoint per batch
    await writeFile(SEEN, JSON.stringify(seen));
    process.stdout.write(`triaged ${done}/${todo.length}  (kept ${kept}, rejected ${rejected}, skipped ${skip})\r`);
  }
  await writeFile(INDEX, JSON.stringify(index, null, 2));
  await writeFile(SEEN, JSON.stringify(seen));
  console.log(`\ntriaged ${done}: kept ${kept} reusable, rejected ${rejected} one-off; skipped ${skip}. index has ${Object.keys(index).length} usable assets → assets/index.json`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
