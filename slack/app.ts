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

/** Claude writes standard markdown, but Slack mrkdwn differs — convert the common cases
 *  so **bold**, __bold__, ### headings, and [text](url) links render instead of showing raw. */
function toSlackMrkdwn(s: string): string {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, "*_$1_*")               // ***bold italic***
    .replace(/\*\*(.+?)\*\*/g, "*$1*")                      // **bold** -> *bold*
    .replace(/__(.+?)__/g, "*$1*")                          // __bold__ -> *bold*
    .replace(/^\s{0,3}#{1,6}\s+(.+?)\s*$/gm, "*$1*")        // # Heading -> *Heading*
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "<$2|$1>"); // [text](url) -> <url|text>
}

/** Build a ThreadChannel bound to a specific channel + thread (threadTs undefined = post
 *  at the channel/DM top level). Supports an editable placeholder: postPlaceholder() posts
 *  the "On it" message; the FIRST postText() edits it in place, later calls post anew. */
function makeChannel(
  client: WebClient,
  channel: string,
  initialThread: string | undefined,
): ThreadChannel & { postPlaceholder(text: string): Promise<void>; setThread(ts: string | undefined): void } {
  // `thread` is mutable: replies follow whichever thread the user's latest message is in,
  // so a question asked in a nested thread is answered there (not in the main channel).
  let thread = initialThread;
  let placeholderTs: string | null = null;
  let placeholderReady: Promise<void> | null = null;
  return {
    setThread(ts: string | undefined) { thread = ts; },
    postPlaceholder(text: string) {
      placeholderReady = client.chat
        .postMessage({ channel, thread_ts: thread, text: toSlackMrkdwn(text), unfurl_links: false })
        .then((r) => { placeholderTs = (r.ts as string) ?? null; });
      return placeholderReady;
    },
    async postText(text: string) {
      const body = toSlackMrkdwn(text);
      if (placeholderReady) await placeholderReady; // ensure we know the placeholder's ts
      if (placeholderTs) {
        const ts = placeholderTs;
        placeholderTs = null; // consume it — only the first reply replaces the placeholder
        await client.chat.update({ channel, ts, text: body });
        return;
      }
      await client.chat.postMessage({ channel, thread_ts: thread, text: body, unfurl_links: false });
    },
    async uploadImage(path: string, comment: string) {
      const args: Record<string, unknown> = {
        channel_id: channel,
        file: path,
        filename: path.split("/").pop() ?? "asset.png",
        initial_comment: toSlackMrkdwn(comment),
      };
      if (thread) args.thread_ts = thread;
      await client.files.uploadV2(args as unknown as Parameters<typeof client.files.uploadV2>[0]);
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

  // key -> { session, channel }. Keep the channel so we can re-point its reply thread.
  type Entry = { session: ThreadSession; ch: ReturnType<typeof makeChannel> };
  const sessions = new Map<string, Entry>();

  // For DMs the key is the channel (one ongoing conversation, so context survives across
  // top-level messages); for channel @-mentions it's channel:threadTs. `threadTs` is where
  // THIS message lives — replies follow it, so a question in a nested thread is answered there.
  function routeMessage(client: WebClient, key: string, channel: string, threadTs: string | undefined, text: string) {
    if (!text) return;
    const existing = sessions.get(key);
    if (existing) {
      existing.ch.setThread(threadTs); // reply where the user is now
      existing.session.handleUserMessage(text);
      return;
    }
    const ch = makeChannel(client, channel, threadTs);
    // Immediate receipt ack; the agent's first reply edits this message in place.
    void ch.postPlaceholder(":hourglass_flowing_sand: *On it* — Design Mark is working on your request…");
    const session = new ThreadSession(ch);
    sessions.set(key, { session, ch });
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
    // DM = one continuous session keyed by channel (context survives across messages),
    // but reply in the thread the user is actually using (m.thread_ts), not always top level.
    routeMessage(client as WebClient, `dm:${m.channel}`, m.channel, m.thread_ts, (m.text ?? "").trim());
  });

  // @-mentions in channels — one session per thread.
  app.event("app_mention", async ({ event, client }) => {
    const e = event as { text?: string; ts: string; thread_ts?: string; channel: string };
    const threadTs = e.thread_ts ?? e.ts;
    routeMessage(client as WebClient, `${e.channel}:${threadTs}`, e.channel, threadTs, stripMention(e.text ?? ""));
  });

  startHealthListener(); // satisfy Cloud Run's $PORT startup check
  await app.start();
  console.log("⚡ Glowforge design agent is running (Socket Mode). DM the bot or @-mention it.");
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
