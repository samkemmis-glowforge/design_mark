/** Shared image-generation types and sizing, imported by both the registry and providers. */

export type AspectRatio = "1:1" | "16:9" | "4:5" | "3:2" | "9:16";

export interface ImageRequest {
  prompt: string;
  aspectRatio?: AspectRatio;
  /** Paths to style-reference images to condition the look (from brand/references). */
  references?: string[];
  /** Output PNG path (absolute or repo-relative). */
  outPath: string;
}

export interface ImageResult {
  outPath: string;
  width: number;
  height: number;
  provider: string;
}

export interface ImageProvider {
  name: string;
  generate(req: ImageRequest): Promise<ImageResult>;
}

const DIMS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "4:5": { width: 1024, height: 1280 },
  "3:2": { width: 1280, height: 854 },
  "9:16": { width: 720, height: 1280 },
};

export function dimsFor(ar: AspectRatio = "1:1") {
  return DIMS[ar];
}
