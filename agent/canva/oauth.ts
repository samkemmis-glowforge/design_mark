import { createHash, randomBytes } from "node:crypto";

/**
 * Canva Connect uses OAuth 2.0 Authorization Code + PKCE (S256).
 * These helpers cover the deterministic parts (PKCE, URL + token-request building);
 * the network calls accept an injectable `fetchImpl` so they can be tested offline.
 */

export const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
export const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";

/** Default scopes for autofill + export + asset upload + handoff. */
export const DEFAULT_SCOPES = [
  "design:content:read",
  "design:content:write",
  "design:meta:read",
  "brandtemplate:meta:read",
  "brandtemplate:content:read",
  "asset:read",
  "asset:write",
];

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface Pkce {
  verifier: string;
  challenge: string;
}

/** Generate a PKCE verifier/challenge pair (S256). */
export function createPkce(): Pkce {
  const verifier = base64url(randomBytes(64)); // 86 chars, within 43–128
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  challenge: string;
  scopes?: string[];
  state: string;
}): string {
  const u = new URL(CANVA_AUTHORIZE_URL);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("scope", (params.scopes ?? DEFAULT_SCOPES).join(" "));
  u.searchParams.set("code_challenge", params.challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("state", params.state);
  return u.toString();
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

type FetchImpl = typeof fetch;

function basicAuth(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

/** Exchange an authorization code for tokens. */
export async function exchangeCode(
  params: { clientId: string; clientSecret: string; code: string; codeVerifier: string; redirectUri: string },
  fetchImpl: FetchImpl = fetch,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: params.redirectUri,
  });
  return postToken(body, params.clientId, params.clientSecret, fetchImpl);
}

/** Refresh an access token. */
export async function refreshToken(
  params: { clientId: string; clientSecret: string; refreshToken: string },
  fetchImpl: FetchImpl = fetch,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });
  return postToken(body, params.clientId, params.clientSecret, fetchImpl);
}

async function postToken(
  body: URLSearchParams,
  clientId: string,
  clientSecret: string,
  fetchImpl: FetchImpl,
): Promise<TokenResponse> {
  const res = await fetchImpl(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(clientId, clientSecret),
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Canva token endpoint ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as TokenResponse;
}
