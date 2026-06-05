import type { Brand } from "../agent/brand.js";

export interface TemplateContext {
  brand: Brand;
  /** Arbitrary content fields supplied by the caller/agent. */
  content: Record<string, unknown>;
  /** Resolved image as a data: URI, or null if none supplied. */
  imageDataUri: string | null;
  /** `@font-face` CSS embedding the brand fonts. */
  fontFaceCSS: string;
}

export interface TemplateModule {
  /** Stable id used to select the template. */
  name: string;
  /** Human description for the agent/CLI. */
  description: string;
  /** Default output size in CSS px. */
  defaultSize: { width: number; height: number };
  /** Content fields that must be present (the agent must not silently guess these). */
  requiredFields: string[];
  /** Returns a complete HTML document string. */
  render(ctx: TemplateContext): string;
}

/** Minimal HTML-escape for text injected into templates. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
