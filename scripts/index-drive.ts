import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";
import { tagImage } from "../agent/tools/vision-tag.js";
import { REPO_ROOT } from "../agent/brand.js";

/**
 * Walk a Google Drive folder (recursively), tag every image with the vision
 * model, and write a searchable index (assets/index.json). Tags Drive's own
 * thumbnail (≈768px) rather than downloading full files — fast and cheap.
 *
 * Setup (one-time):
 *   1. GCP console → create a Service Account → make a JSON key.
 *   2. Share the Drive folder with the service account's email (Viewer).
 *   3. export GOOGLE_APPLICATION_CREDENTIALS=/path/key.json
 *      export DRIVE_FOLDER_ID=<the folder id>   GEMINI_API_KEY=...
 *   4. npm run index:drive            (add --force to re-tag everything)
 *
 * Incremental: skips Drive ids already indexed unless --force.
 */

const INDEX = resolve(REPO_ROOT, "assets/index.json");
const FOLDER = process.env.DRIVE_FOLDER_ID;

async function main() {
  if (!FOLDER) { console.error("set DRIVE_FOLDER_ID"); process.exit(1); }
  const force = process.argv.includes("--force");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
  const client = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: auth as any });
  const token = (await client.getAccessToken()).token!;

  const index: Record<string, any> = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, "utf8")) : {};

  // Recurse: collect image files with their folder path.
  type Img = { id: string; name: string; mimeType: string; thumb?: string; web?: string; path: string };
  const images: Img[] = [];
  async function walk(folderId: string, path: string) {
    let pageToken: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: "nextPageToken, files(id,name,mimeType,thumbnailLink,webViewLink)",
        pageSize: 1000, pageToken,
        supportsAllDrives: true, includeItemsFromAllDrives: true,
      });
      for (const f of r.data.files ?? []) {
        if (f.mimeType === "application/vnd.google-apps.folder") await walk(f.id!, `${path}/${f.name}`);
        else if (f.mimeType?.startsWith("image/")) images.push({ id: f.id!, name: f.name!, mimeType: f.mimeType!, thumb: f.thumbnailLink ?? undefined, web: f.webViewLink ?? undefined, path });
      }
      pageToken = r.data.nextPageToken ?? undefined;
    } while (pageToken);
  }
  await walk(FOLDER, "");
  console.log(`found ${images.length} images under the folder`);

  if (process.argv.includes("--count")) {
    const byFolder: Record<string, number> = {};
    for (const i of images) byFolder[i.path || "/"] = (byFolder[i.path || "/"] ?? 0) + 1;
    for (const [f, n] of Object.entries(byFolder).sort((a, b) => b[1] - a[1]))
      console.log(`  ${n}\t${f}`);
    const already = images.filter((i) => index[`drive:${i.id}`]).length;
    console.log(`\n${images.length} images, ${already} already indexed, ${images.length - already} to tag. (preflight only; no tagging)`);
    process.exit(0);
  }

  const CONC = Number(process.env.INDEX_CONCURRENCY ?? 5);
  const todo = images.filter((img) => (force || !index[`drive:${img.id}`]) && img.thumb);
  const skip = images.length - todo.length;
  let done = 0;
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC);
    await Promise.all(batch.map(async (img) => {
      try {
        const url = img.thumb!.replace(/=s\d+$/, "=s768");
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const bytes = Buffer.from(await res.arrayBuffer());
        const tags = await tagImage(bytes, "image/jpeg");
        index[`drive:${img.id}`] = { name: img.name, source: "drive", driveId: img.id, driveUrl: img.web, folder: img.path, ...tags, indexed_at: new Date().toISOString() };
      } catch (e) { process.stdout.write(`\n✗ ${img.name}: ${e instanceof Error ? e.message : e}\n`); }
    }));
    done += batch.length;
    await writeFile(INDEX, JSON.stringify(index, null, 2)); // checkpoint per batch
    process.stdout.write(`tagged ${done}/${todo.length} (skipped ${skip})\r`);
  }
  await writeFile(INDEX, JSON.stringify(index, null, 2));
  console.log(`\nindexed ${done}, skipped ${skip}, total ${Object.keys(index).length} → assets/index.json`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
