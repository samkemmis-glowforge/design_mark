import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { buildDesignServer, type DesignHostTransports } from "../agent/design-server.js";
import { buildQueryOptions } from "../agent/runtime.js";
import { AsyncQueue } from "./async-queue.js";

/**
 * How a session talks back to its Slack thread. Kept abstract so the session
 * logic is testable without Bolt.
 */
export interface ThreadChannel {
  /** Post a text reply into the thread. */
  postText(text: string): Promise<void>;
  /** Upload an image file into the thread. */
  uploadImage(path: string, comment: string): Promise<void>;
}

function userMessage(text: string): SDKUserMessage {
  return { type: "user", message: { role: "user", content: text }, parent_tool_use_id: null };
}

function formatQuestion(question: string, options?: string[]): string {
  const opts = options?.length ? "\n" + options.map((o) => `• ${o}`).join("\n") : "";
  return `:thinking_face: *${question}*${opts}\n_Reply in this thread._`;
}

/**
 * One Slack thread = one long-lived agent session. A single `query()` runs for
 * the life of the thread, so the SDK keeps full conversation context across
 * turns. Mid-turn clarifications use `ask_human` (posted to the thread; the next
 * thread reply resolves it); between turns, a new thread reply is fed as the next
 * user message.
 */
export class ThreadSession {
  private input = new AsyncQueue<SDKUserMessage>();
  private pendingAsk: ((answer: string) => void) | null = null;
  private running = false;

  constructor(private channel: ThreadChannel) {}

  /** Route an inbound thread message: answer a pending question, or new turn. */
  handleUserMessage(text: string): void {
    if (this.pendingAsk) {
      const resolve = this.pendingAsk;
      this.pendingAsk = null;
      resolve(text);
      return;
    }
    this.input.push(userMessage(text));
  }

  /** Start the persistent agent loop with the opening brief. */
  async start(firstMessage: string): Promise<void> {
    if (this.running) {
      this.handleUserMessage(firstMessage);
      return;
    }
    this.running = true;
    this.input.push(userMessage(firstMessage));

    const transports: DesignHostTransports = {
      askHuman: (question, options) =>
        new Promise<string>((resolve) => {
          this.pendingAsk = resolve;
          void this.channel.postText(formatQuestion(question, options));
        }),
      onAsset: ({ path, width, height }) =>
        this.channel.uploadImage(path, `Candidate · ${width}×${height}`),
    };

    const server = buildDesignServer(transports);
    const options = await buildQueryOptions(server);

    try {
      for await (const message of query({ prompt: this.input, options })) {
        if (message.type === "assistant") {
          for (const block of message.message.content) {
            if (block.type === "text" && block.text.trim()) {
              await this.channel.postText(block.text.trim());
            }
          }
        }
      }
    } catch (err) {
      await this.channel.postText(
        `:warning: Something went wrong: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.running = false;
      this.input.close();
    }
  }

  stop(): void {
    this.input.close();
  }
}
