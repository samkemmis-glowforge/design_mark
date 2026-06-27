import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { buildDesignServer, DESIGN_SERVER_NAME, type DesignHostTransports } from "./design-server.js";
import { buildQueryOptions } from "./runtime.js";

/** Render a streamed SDK message to the terminal. */
function printMessage(message: SDKMessage): void {
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if (block.type === "text" && block.text.trim()) {
        console.log("\n" + block.text.trim());
      } else if (block.type === "tool_use") {
        const name = block.name.replace(`mcp__${DESIGN_SERVER_NAME}__`, "");
        console.log(`\n  ↳ \x1b[2m${name}\x1b[0m`);
      }
    }
  } else if (message.type === "result") {
    if (message.subtype !== "success") {
      console.error(`\n[session ended: ${message.subtype}]`);
    }
  }
}

async function runBrief(brief: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "⚠  ANTHROPIC_API_KEY is not set. The agent needs it to run.\n" +
        "   Export a key and re-run:  export ANTHROPIC_API_KEY=sk-ant-...",
    );
    process.exitCode = 1;
    return;
  }

  const rl = createInterface({ input, output });

  const transports: DesignHostTransports = {
    askHuman: async (question, options) => {
      const opts = options?.length ? `\n   (${options.join(" / ")})` : "";
      const answer = await rl.question(`\n\x1b[36m? ${question}\x1b[0m${opts}\n> `);
      return answer.trim();
    },
    onAsset: async ({ path, width, height }) => {
      console.log(`\n  \x1b[32m✓ asset:\x1b[0m ${path} (${width}×${height})`);
    },
    showImage: async (path, caption) => {
      console.log(`\n  \x1b[36m🖼  ${path}\x1b[0m${caption ? ` — ${caption}` : ""}`);
    },
  };

  const server = buildDesignServer(transports);
  const options = await buildQueryOptions(server);

  console.log(`\n\x1b[1mGlowforge design agent\x1b[0m — brief: "${brief}"\n`);

  try {
    for await (const message of query({ prompt: brief, options })) {
      printMessage(message);
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const brief = process.argv.slice(2).join(" ").trim();
  if (!brief) {
    console.error('Usage: tsx agent/index.ts "<brief>"');
    console.error('Example: tsx agent/index.ts "feature section announcing the layer tool"');
    process.exitCode = 1;
    return;
  }
  await runBrief(brief);
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().catch((err) => {
    console.error("✗", err instanceof Error ? err.stack ?? err.message : err);
    process.exit(1);
  });
}
