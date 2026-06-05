import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { REPO_ROOT } from "../brand.js";
import { refreshToken, type TokenResponse } from "./oauth.js";

/** Persisted Canva tokens (gitignored). */
export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  /** Epoch ms when the access token expires. */
  expires_at: number;
}

const TOKENS_PATH = resolve(REPO_ROOT, ".canva-tokens.json");

export async function saveTokens(t: TokenResponse): Promise<void> {
  const stored: StoredTokens = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + t.expires_in * 1000,
  };
  await writeFile(TOKENS_PATH, JSON.stringify(stored, null, 2));
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    return JSON.parse(await readFile(TOKENS_PATH, "utf8")) as StoredTokens;
  } catch {
    return null;
  }
}

function clientCreds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("CANVA_CLIENT_ID / CANVA_CLIENT_SECRET are not set (see README → Phase 7).");
  }
  return { clientId, clientSecret };
}

/**
 * Get a valid Canva access token, refreshing if it expires within 60s.
 * Throws with setup guidance if the integration hasn't been authorized yet.
 */
export async function getCanvaAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("Canva is not connected. Run `npm run canva:auth` to authorize the integration.");
  }
  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token;
  }
  const { clientId, clientSecret } = clientCreds();
  const refreshed = await refreshToken({ clientId, clientSecret, refreshToken: tokens.refresh_token });
  await saveTokens(refreshed);
  return refreshed.access_token;
}
