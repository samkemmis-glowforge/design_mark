import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { launchBrowser } from "./browser.js";
import { REPO_ROOT } from "../brand.js";

export interface HtmlToPngOptions {
  html: string;
  /** Viewport width in CSS px. */
  width: number;
  /** Viewport height in CSS px. */
  height: number;
  /** Output PNG path (absolute, or relative to repo root). */
  outPath: string;
  /** Retina factor for crisp output. Default 2. */
  deviceScaleFactor?: number;
  /** If true, capture the full scrollable page instead of a fixed viewport. */
  fullPage?: boolean;
}

export interface HtmlToPngResult {
  outPath: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Core renderer: HTML string -> PNG on disk via headless Chromium.
 * Shared by the template path (Phase 1) and the agent-authored SVG/HTML path (Phase 5).
 */
export async function htmlToPng(opts: HtmlToPngOptions): Promise<HtmlToPngResult> {
  const { html, width, height, deviceScaleFactor = 2, fullPage = false } = opts;
  const outPath = isAbsolute(opts.outPath) ? opts.outPath : resolve(REPO_ROOT, opts.outPath);

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor,
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    // Ensure embedded webfonts are fully parsed before snapshot.
    await page.evaluate(async () => {
      // @ts-ignore - document.fonts exists in the browser context
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await mkdir(dirname(outPath), { recursive: true });
    const buffer = await page.screenshot({ type: "png", fullPage });
    await writeFile(outPath, buffer);
    return { outPath, width, height, bytes: buffer.length };
  } finally {
    await browser.close();
  }
}
