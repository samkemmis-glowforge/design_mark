import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";

/**
 * Upload a finished local asset to Google Drive via a service account, so the agent
 * can hand the human a Drive link. Unlike fetching a public link, this needs auth:
 *   - GOOGLE_APPLICATION_CREDENTIALS must point at the service-account key, and
 *   - the target folder must be shared with that service account as Editor.
 * Folder: opts.folderId, else DRIVE_UPLOAD_FOLDER_ID.
 */

const MIME: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};

export interface SavedToDrive {
  id: string;
  name: string;
  link: string;
}

export async function saveToDrive(localPath: string, opts: { folderId?: string; name?: string } = {}): Promise<SavedToDrive> {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
    throw new Error(
      "Uploading to Drive needs a service account: set GOOGLE_APPLICATION_CREDENTIALS and share the target folder with that account as Editor.",
    );
  const folderId = opts.folderId ?? process.env.DRIVE_UPLOAD_FOLDER_ID;
  if (!folderId) throw new Error("No Drive folder to upload into. Pass a folderId or set DRIVE_UPLOAD_FOLDER_ID.");

  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive"] });
  const drive = google.drive({ version: "v3", auth: auth as never });

  const name = opts.name ?? basename(localPath);
  const mimeType = MIME[extname(name).toLowerCase()] ?? "application/octet-stream";
  const res = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media: { mimeType, body: createReadStream(localPath) },
    fields: "id, name, webViewLink",
    supportsAllDrives: true,
  });
  const f = res.data;
  return { id: f.id!, name: f.name ?? name, link: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view` };
}
