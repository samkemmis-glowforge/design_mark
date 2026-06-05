import type { Browser } from "playwright-core";
import { chromium } from "playwright-core";

/**
 * Launch a fresh Chromium browser.
 *
 * This environment blocks Playwright's browser CDN, so we source Chromium from
 * the npm-distributed `@sparticuz/chromium` package and drive it with
 * `playwright-core`. If a normal Playwright/system Chromium is ever available
 * (PLAYWRIGHT_CHROMIUM_PATH), we prefer it.
 *
 * Each call returns a new browser; the caller owns its lifecycle and must close
 * it. (The sparticuz build is tuned for short-lived, single-session use, so we
 * don't share a long-lived instance across renders.)
 */
export async function launchBrowser(): Promise<Browser> {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  if (explicit) {
    return chromium.launch({ executablePath: explicit, headless: true });
  }

  const sparticuz = (await import("@sparticuz/chromium")).default;
  const executablePath = await sparticuz.executablePath();
  return chromium.launch({
    executablePath,
    args: sparticuz.args,
    headless: true,
  });
}
