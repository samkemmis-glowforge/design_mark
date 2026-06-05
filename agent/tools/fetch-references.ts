import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { REPO_ROOT } from "../brand.js";

export type ReferenceKind = "references" | "exemplars" | "all";

export interface ReferenceItem {
  kind: "references" | "exemplars";
  path: string;
  bytes: number;
}

export interface FetchReferencesResult {
  items: ReferenceItem[];
  counts: { references: number; exemplars: number };
  note: string;
}

const IMAGE_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

async function listDir(kind: "references" | "exemplars"): Promise<ReferenceItem[]> {
  const dir = join(REPO_ROOT, "brand", kind);
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const items: ReferenceItem[] = [];
  for (const name of names) {
    if (!IMAGE_RE.test(name)) continue;
    const abs = join(dir, name);
    const s = await stat(abs);
    if (s.isFile()) {
      items.push({ kind, path: relative(REPO_ROOT, abs), bytes: s.size });
    }
  }
  return items;
}

/**
 * Pull relevant reference (swipe file) and exemplar (our approved past work) images
 * to condition production. Today this lists what's available; once the library grows
 * it can be made query-aware (Phase 6 auto-attach).
 */
export async function fetchReferences(
  kind: ReferenceKind = "all",
): Promise<FetchReferencesResult> {
  const wantRefs = kind === "all" || kind === "references";
  const wantEx = kind === "all" || kind === "exemplars";

  const references = wantRefs ? await listDir("references") : [];
  const exemplars = wantEx ? await listDir("exemplars") : [];
  const items = [...references, ...exemplars];

  const note =
    items.length === 0
      ? "No references or exemplars yet. Proceed, but adding 5-15 swipe-file images to brand/references/ will raise quality more than any prompt tuning."
      : `Found ${references.length} reference(s) and ${exemplars.length} exemplar(s).`;

  return {
    items,
    counts: { references: references.length, exemplars: exemplars.length },
    note,
  };
}
