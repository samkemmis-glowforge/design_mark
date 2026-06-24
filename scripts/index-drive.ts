import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";
import { tagImage } from "../agent/tools/vision-tag.js";
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
 * Incremental: skips Drive ids already processed (in seen.json) unless --force.
 */

const INDEX = resolve(REPO_ROOT, "assets/index.json");
const SEEN = resolve(REPO_ROOT, "assets/seen.json"); // triage ledger: every processed id + verdict (tiny stubs)
const FOLDER = process.env.DRIVE_FOLDER_ID;

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

  // Recurse: collect image files with their folder path.
  type Img = { id: string; name: string; mimeType: string; thumb?: string; web?: string; path: string };
  const images: Img[] = [];
  let folders = 0;
  async function walk(folderId: string, path: string) {
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
  }
  await walk(FOLDER, "");
  console.log(`\nscanned ${folders} folders — found ${images.length} images`);

  if (process.argv.includes("--count")) {
    const byFolder: Record<string, number> = {};
    for (const i of images) byFolder[i.path || "/"] = (byFolder[i.path || "/"] ?? 0) + 1;
    for (const [f, n] of Object.entries(byFolder).sort((a, b) => b[1] - a[1]))
      console.log(`  ${n}\t${f}`);
    const already = images.filter((i) => seen[`drive:${i.id}`]).length;
    console.log(`\n${images.length} images, ${already} already processed, ${images.length - already} to triage. (preflight only; no tagging)`);
    process.exit(0);
  }

  const CONC = Number(process.env.INDEX_CONCURRENCY ?? 5);
  const todo = images.filter((img) => (force || !seen[`drive:${img.id}`]) && img.thumb);
  const skip = images.length - todo.length;
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
        seen[key] = { u: tags.marketing_usable, r: tags.reusability, n: img.name };
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
