import { createServer } from "node:http";
import { App, LogLevel } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { ThreadSession, type ThreadChannel } from "./session.js";

/** Socket Mode binds no HTTP port, but Cloud Run (and most PaaS) require the container
 *  to listen on $PORT or it's killed at startup. Expose a tiny health endpoint. */
function startHealthListener(): void {
  const port = Number(process.env.PORT ?? 8080);
  createServer((_req, res) => { res.writeHead(200, { "content-type": "text/plain" }); res.end("ok"); })
    .listen(port, () => console.log(`health listener on :${port}`));
}

/**
 * Slack host for the Glowforge design agent (Bolt + Socket Mode — no public URL).
 * A thread is a session: a new message to the bot starts one; replies in-thread
 * continue it with full context. Clarifying questions are thread replies; the
 * human answers in-thread; rendered PNGs are uploaded to the thread.
 */

function requireEnv(): { botToken: string; appToken: string } {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const appToken = process.env.SLACK_APP_TOKEN;
  const missing: string[] = [];
  if (!botToken) missing.push("SLACK_BOT_TOKEN (xoxb-…)");
  if (!appToken) missing.push("SLACK_APP_TOKEN (xapp-…, Socket Mode)");
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY (sk-ant-…)");
  if (missing.length) {
    console.error("⚠  Missing required environment variables:\n   - " + missing.join("\n   - "));
    console.error("\nSee README → 'Running in Slack (Phase 3)' for the app setup steps.");
    process.exit(1);
  }
  return { botToken: botToken!, appToken: appToken! };
}

/** Build a ThreadChannel bound to a specific channel + thread. */
function makeChannel(client: WebClient, channel: string, threadTs: string): ThreadChannel {
  return {
    async postText(text: string) {
      await client.chat.postMessage({ channel, thread_ts: threadTs, text, unfurl_links: false });
    },
    async uploadImage(path: string, comment: string) {
      await client.files.uploadV2({
        channel_id: channel,
        thread_ts: threadTs,
        file: path,
        filename: path.split("/").pop() ?? "asset.png",
        initial_comment: comment,
      });
    },
  };
}

/** Strip a leading bot mention like "<@U123> ..." from app_mention text. */
function stripMention(text: string): string {
  return text.replace(/^\s*<@[^>]+>\s*/, "").trim();
}

async function main() {
  const { botToken, appToken } = requireEnv();

  const app = new App({
    token: botToken,
    appToken,
    socketMode: true,
    logLevel: LogLevel.INFO,
  });

  // channel:threadTs -> session
  const sessions = new Map<string, ThreadSession>();

  function routeMessage(client: WebClient, channel: string, threadTs: string, text: string) {
    if (!text) return;
    const key = `${channel}:${threadTs}`;
    let session = sessions.get(key);
    if (session) {
      session.handleUserMessage(text);
      return;
    }
    session = new ThreadSession(makeChannel(client, channel, threadTs));
    sessions.set(key, session);
    void session.start(text);
  }

  // Direct messages to the bot.
  app.message(async ({ message, client }) => {
    // Ignore non-standard messages, edits, and anything the bot itself posted.
    const m = message as {
      subtype?: string;
      bot_id?: string;
      text?: string;
      ts: string;
      thread_ts?: string;
      channel: string;
      channel_type?: string;
    };
    if (m.subtype || m.bot_id) return;
    if (m.channel_type !== "im") return; // channels use @-mentions
    routeMessage(client as WebClient, m.channel, m.thread_ts ?? m.ts, (m.text ?? "").trim());
  });

  // @-mentions in channels.
  app.event("app_mention", async ({ event, client }) => {
    const e = event as { text?: string; ts: string; thread_ts?: string; channel: string };
    routeMessage(client as WebClient, e.channel, e.thread_ts ?? e.ts, stripMention(e.text ?? ""));
  });

  startHealthListener(); // satisfy Cloud Run's $PORT startup check
  await app.start();
  console.log("⚡ Glowforge design agent is running (Socket Mode). DM the bot or @-mention it.");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
