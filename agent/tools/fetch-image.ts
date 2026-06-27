import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { REPO_ROOT } from "../brand.js";

/**
 * Pull an image the agent was given as a URL/Drive link onto local disk, so the
 * render/composite tools (which only read local files) can use it.
 *
 * Resolution order:
 *   1. Google Drive "anyone with the link" → public download URL (no auth).
 *   2. Restricted Drive file → Drive API with a service account, IF
 *      GOOGLE_APPLICATION_CREDENTIALS is configured (shared with that SA).
 *   3. Any other http(s) image URL → direct download.
 * Non-image responses (e.g. Drive's sign-in HTML) are rejected with a clear hint.
 */

function sniff(b: Buffer): { mime: string; ext: string } | null {
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  if (b[0] === 0xff && b[1] === 0xd8) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { mime: "image/gif", ext: "gif" };
  return null;
}

/** Extract a Drive file id from a share link, an `id=` URL, or a bare id. */
function driveId(s: string): string | null {
  const m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/) ?? s.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  if (m) return m[1] ?? null;
  if (/^[A-Za-z0-9_-]{20,}$/.test(s.trim())) return s.trim();
  return null;
}

async function downloadImage(url: string, headers?: Record<string, string>): Promise<Buffer | null> {
  const res = await fetch(url, headers ? { headers } : {});
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return sniff(buf) ? buf : null; // reject HTML sign-in / interstitial pages
}

async function viaDriveApi(id: string): Promise<{ bytes: Buffer } | { error: string }> {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
    return { error: "no service account is configured on this bot (GOOGLE_APPLICATION_CREDENTIALS is unset)" };
  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
    const drive = google.drive({ version: "v3", auth: auth as never });
    const r = await drive.files.get({ fileId: id, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
    const buf = Buffer.from(r.data as ArrayBuffer);
    return sniff(buf) ? { bytes: buf } : { error: "service account downloaded the file but it is not an image" };
  } catch (e) {
    const err = e as { errors?: { message?: string }[]; message?: string };
    return { error: `service account read failed (${err.errors?.[0]?.message ?? err.message ?? String(e)})` };
  }
}

export interface FetchedImage {
  path: string;
  mime: string;
  bytes: number;
}

export async function fetchImage(source: string, nameHint = "incoming"): Promise<FetchedImage> {
  const id = driveId(source);
  let bytes: Buffer | null = null;

  if (id) {
    bytes = await downloadImage(`https://drive.google.com/uc?export=download&id=${id}&confirm=t`);
    if (!bytes) {
      const sa = await viaDriveApi(id);
      if ("bytes" in sa) bytes = sa.bytes;
      else
        throw new Error(
          `Could not read Drive file ${id}: the public link is blocked, and ${sa.error}. ` +
            `Fix: share it "Anyone with the link → Viewer", or grant the bot's service account Viewer on it.`,
        );
    }
  } else if (/^https?:\/\//.test(source.trim())) {
    bytes = await downloadImage(source.trim());
    if (!bytes) throw new Error("That URL did not return an image (got HTML or a non-image response).");
  } else {
    throw new Error(`Not a Google Drive link/ID or an http(s) image URL: "${source.slice(0, 80)}"`);
  }

  const det = sniff(bytes)!;
  const dir = resolve(REPO_ROOT, "output/incoming");
  await mkdir(dir, { recursive: true });
  const safe = nameHint.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 40) || "incoming";
  const path = resolve(dir, `${safe}-${id ?? "url"}.${det.ext}`);
  await writeFile(path, bytes);
  return { path, mime: det.mime, bytes: bytes.length };
}
