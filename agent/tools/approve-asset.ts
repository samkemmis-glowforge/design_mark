import { mkdir, rename, copyFile, stat } from "node:fs/promises";
import { basename, isAbsolute, resolve, relative } from "node:path";
import { REPO_ROOT } from "../brand.js";

export interface ApproveResult {
  from: string;
  to: string;
}

/**
 * Mark an asset approved by moving it from /output (scratch) into /approved (finals).
 * Versioned filenames already come from the renderers, so finals keep their names.
 */
export async function approveAsset(path: string): Promise<ApproveResult> {
  const src = isAbsolute(path) ? path : resolve(REPO_ROOT, path);
  await stat(src); // throws a clear error if it doesn't exist

  const destDir = resolve(REPO_ROOT, "approved");
  await mkdir(destDir, { recursive: true });
  const dest = resolve(destDir, basename(src));

  try {
    await rename(src, dest);
  } catch {
    // rename fails across devices; fall back to copy.
    await copyFile(src, dest);
  }

  return { from: relative(REPO_ROOT, src), to: relative(REPO_ROOT, dest) };
}
