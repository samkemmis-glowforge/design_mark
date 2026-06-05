import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { PermissionResult, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { REPO_ROOT } from "./brand.js";
import { buildDesignServer, DESIGN_SERVER_NAME, DESIGN_TOOL_NAMES, type DesignHostTransports } from "./design-server.js";

/**
 * Built-in Claude Code tools we hide from the design agent — it should only ever
 * reach for our three design tools, not the filesystem/shell/web/meta tooling the
 * SDK exposes by default.
 */
const DISALLOWED_BUILTINS = [
  "Bash", "BashOutput", "KillShell", "Read", "Write", "Edit", "MultiEdit",
  "NotebookEdit", "Glob", "Grep", "WebFetch", "WebSearch", "Task", "Agent",
  "TodoWrite", "ToolSearch", "SendUserFile", "AskUserQuestion", "ExitPlanMode", "Skill",
];

/** Compose the full system prompt: creative-director persona + the brand spec. */
export async function composeSystemPrompt(): Promise<string> {
  const [persona, brandMd, brandJson] = await Promise.all([
    readFile(resolve(REPO_ROOT, "agent/system-prompt.md"), "utf8"),
    readFile(resolve(REPO_ROOT, "brand/brand.md"), "utf8"),
    readFile(resolve(REPO_ROOT, "brand/brand.json"), "utf8"),
  ]);
  return [
    persona,
    "\n\n---\n\n# Brand spec — brand.md\n\n" + brandMd,
    "\n\n---\n\n# Brand tokens — brand.json\n\n```json\n" + brandJson + "\n```",
  ].join("");
}

/** Only allow our own design tools; deny everything else. */
async function allowOnlyDesignTools(toolName: string): Promise<PermissionResult> {
  if (DESIGN_TOOL_NAMES.includes(toolName)) {
    return { behavior: "allow", updatedInput: {} };
  }
  return { behavior: "deny", message: `Tool ${toolName} is not part of the design agent.` };
}

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
  };

  const server = buildDesignServer(transports);
  const systemPrompt = await composeSystemPrompt();

  console.log(`\n\x1b[1mGlowforge design agent\x1b[0m — brief: "${brief}"\n`);

  try {
    for await (const message of query({
      prompt: brief,
      options: {
        systemPrompt,
        mcpServers: { [DESIGN_SERVER_NAME]: server },
        allowedTools: DESIGN_TOOL_NAMES,
        disallowedTools: DISALLOWED_BUILTINS,
        canUseTool: allowOnlyDesignTools,
        permissionMode: "default",
        settingSources: [],
        ...(process.env.AGENT_MODEL ? { model: process.env.AGENT_MODEL } : {}),
      },
    })) {
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
