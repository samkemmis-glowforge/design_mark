/**
 * fetch wrapper for the Gemini REST API that retries transient failures
 * (429 rate-limit, 5xx "high demand"/unavailable, network errors) with
 * exponential backoff + jitter. Returns the final Response either way, so
 * callers keep their existing `res.ok` handling.
 */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export async function geminiFetch(
  url: string,
  init: RequestInit,
  opts: { retries?: number; baseMs?: number } = {},
): Promise<Response> {
  const retries = opts.retries ?? 5;
  const baseMs = opts.baseMs ?? 1500;
  let lastRes: Response | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || !RETRYABLE.has(res.status)) return res;
      lastRes = res;
    } catch {
      lastRes = undefined; // network error — retry
    }
    if (attempt < retries) {
      const wait = baseMs * 2 ** attempt + Math.random() * 500;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return lastRes ?? fetch(url, init);
}
