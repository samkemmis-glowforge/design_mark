import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl, createPkce, exchangeCode, DEFAULT_SCOPES } from "./oauth.js";
import { saveTokens } from "./tokens.js";

/**
 * One-time Canva authorization (OAuth 2.0 + PKCE). Prints an authorize URL, captures
 * the redirect on a local server, exchanges the code, and stores tokens for the agent.
 *
 * Required env: CANVA_CLIENT_ID, CANVA_CLIENT_SECRET.
 * The redirect URL (default http://127.0.0.1:8976/callback) must be registered as a
 * return URL on your Canva Connect app.
 */
async function main() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("✗ Set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET first (see README → Phase 7).");
    process.exit(1);
  }
  const port = Number(process.env.CANVA_REDIRECT_PORT ?? 8976);
  const redirectUri = process.env.CANVA_REDIRECT_URI ?? `http://127.0.0.1:${port}/callback`;

  // Scopes: default to the full set, but allow narrowing via CANVA_SCOPES (space/comma
  // separated) — e.g. uploads only ("asset:read asset:write") when the account lacks the
  // Enterprise brand-template scopes, which otherwise fail the whole authorize.
  const scopes = process.env.CANVA_SCOPES
    ? process.env.CANVA_SCOPES.split(/[\s,]+/).filter(Boolean)
    : DEFAULT_SCOPES;

  const pkce = createPkce();
  const state = randomBytes(16).toString("hex");
  const authorizeUrl = buildAuthorizeUrl({ clientId, redirectUri, challenge: pkce.challenge, state, scopes });

  const code: string = await new Promise((resolveCode, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", redirectUri);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const returnedState = url.searchParams.get("state");
      const returnedCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html" });
      if (error || !returnedCode || returnedState !== state) {
        res.end("<h2>Authorization failed.</h2> You can close this tab.");
        server.close();
        reject(new Error(error ?? "state mismatch or missing code"));
        return;
      }
      res.end("<h2>Glowforge design agent is now connected to Canva.</h2> You can close this tab.");
      server.close();
      resolveCode(returnedCode);
    });
    server.listen(port, () => {
      console.log("\nOpen this URL in your browser to authorize Canva:\n");
      console.log(authorizeUrl + "\n");
      console.log(`Waiting for the redirect on ${redirectUri} …`);
    });
  });

  const tokens = await exchangeCode({ clientId, clientSecret, code, codeVerifier: pkce.verifier, redirectUri });
  await saveTokens(tokens);
  console.log("\n✓ Canva connected. Tokens saved to .canva-tokens.json (gitignored).");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
