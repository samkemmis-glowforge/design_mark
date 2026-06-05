import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { McpServerConfig, Options, PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { REPO_ROOT } from "./brand.js";
import { DESIGN_SERVER_NAME, DESIGN_TOOL_NAMES } from "./design-server.js";

/**
 * Built-in Claude Code tools we hide from the design agent — it should only ever
 * reach for our three design tools, not the filesystem/shell/web/meta tooling the
 * SDK exposes by default.
 */
export const DISALLOWED_BUILTINS = [
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

/** Permission gate: only allow our own design tools; deny everything else. */
export async function allowOnlyDesignTools(toolName: string): Promise<PermissionResult> {
  if (DESIGN_TOOL_NAMES.includes(toolName)) {
    return { behavior: "allow", updatedInput: {} };
  }
  return { behavior: "deny", message: `Tool ${toolName} is not part of the design agent.` };
}

/** Build the SDK `query` options shared by every host (CLI, Slack, …). */
export async function buildQueryOptions(server: McpServerConfig): Promise<Options> {
  return {
    systemPrompt: await composeSystemPrompt(),
    mcpServers: { [DESIGN_SERVER_NAME]: server },
    allowedTools: DESIGN_TOOL_NAMES,
    disallowedTools: DISALLOWED_BUILTINS,
    canUseTool: allowOnlyDesignTools,
    permissionMode: "default",
    settingSources: [],
    ...(process.env.AGENT_MODEL ? { model: process.env.AGENT_MODEL } : {}),
  };
}
