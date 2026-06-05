import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, "..");

export interface PaletteFamily {
  role: string;
  note?: string;
  base: string;
  tint: string;
  shade: string;
  temperature: "warm" | "cool" | "neutral";
}

/** The eight named Glowforge color families (plus open-ended index for future additions). */
export type Palette = Record<
  "teal" | "cream" | "yellow" | "coral" | "purple" | "blue" | "rust" | "ink",
  PaletteFamily
> &
  Record<string, PaletteFamily>;

export interface Brand {
  brand: { name: string; tagline: string; personality: string[] };
  colors: { primary: string; background: string; accent: string; text: string };
  palette: Palette;
  colorSystem: Record<string, string | string[]>;
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: { h1: number; h2: number; body: number };
    weights?: { heading: number; body: number };
  };
  spacing: { unit: number; sectionPadding: number };
  radius: { button: number; card: number };
  logo: { path: string; note?: string };
}

let cached: Brand | null = null;

/** Load and cache brand tokens from brand/brand.json. */
export async function loadBrand(): Promise<Brand> {
  if (cached) return cached;
  const raw = await readFile(resolve(REPO_ROOT, "brand/brand.json"), "utf8");
  cached = JSON.parse(raw) as Brand;
  return cached;
}

/** The set of font families the brand uses (for embedding). */
export function brandFontFamilies(brand: Brand): string[] {
  return [brand.typography.headingFont, brand.typography.bodyFont];
}
