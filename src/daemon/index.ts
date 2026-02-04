/**
 * CLI Daemon for Cursor Integration
 * 
 * Cursor calls this via CLI
 * CLI calls API
 * Context injected into prompts
 * 
 * Flow: Cursor → memory.resolve → context → prompt
 */

import type { ResolveRequest, ResolveResponse } from "../types/memory.js";
import { runDemo } from "../cli/demo-command.js";
import { printRunSummary } from "../cli/run-inspector.js";
import { runReplayCheck } from "../cli/replay-check.js";
import { validateRunInvariants } from "../cli/invariant-validator.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";

const API_URL = process.env.CONTINUUM_API_URL || "http://localhost:3000";
const API_KEY = process.env.CONTINUUM_API_KEY || "";

/**
 * Resolve context for a task
 */
async function resolve(request: ResolveRequest): Promise<ResolveResponse> {
  const response = await fetch(`${API_URL}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json() as Promise<ResolveResponse>;
}

/**
 * Format context for prompt injection
 */
function formatContext(response: ResolveResponse): string {
  const parts: string[] = [];

  if (response.constraints.length > 0) {
    parts.push("## Constraints");
    for (const constraint of response.constraints) {
      parts.push(`- ${constraint.value} (confidence: ${constraint.confidence})`);
    }
  }

  if (response.preferences.length > 0) {
    parts.push("## Preferences");
    for (const preference of response.preferences) {
      parts.push(`- ${preference.value} (confidence: ${preference.confidence})`);
    }
  }

  if (response.conventions.length > 0) {
    parts.push("## Conventions");
    for (const convention of response.conventions) {
      parts.push(`- ${convention.value} (confidence: ${convention.confidence})`);
    }
  }

  if (response.warnings.length > 0) {
    parts.push("## Warnings");
    for (const warning of response.warnings) {
      parts.push(`- ${warning}`);
    }
  }

  return parts.join("\n");
}

/**
 * Main CLI interface
 */
export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "resolve") {
    // Parse request from args or stdin
    const task = args[1] || "";
    const repo = process.env.CONTINUUM_REPO || "";
    const org = process.env.CONTINUUM_ORG || "";

    const request: ResolveRequest = {
      task,
      repo,
      org,
    };

    try {
      const response = await resolve(request);
      const formatted = formatContext(response);
      console.log(formatted);
    } catch (error) {
      console.error("Error resolving context:", error);
      process.exit(1);
    }
  } else if (command === "demo") {
    await runDemo(args);
  } else if (command === "inspect") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: continuum inspect <runId>");
      process.exit(1);
    }
    const memoryStore = new InMemoryStore();
    const agentRunStore = new InMemoryAgentRunStore(memoryStore);
    await printRunSummary(agentRunStore, runId);
  } else if (command === "replay-check") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: continuum replay-check <runId>");
      process.exit(1);
    }
    const memoryStore = new InMemoryStore();
    const agentRunStore = new InMemoryAgentRunStore(memoryStore);
    await runReplayCheck(agentRunStore, memoryStore, runId);
  } else if (command === "validate-run") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: continuum validate-run <runId>");
      process.exit(1);
    }
    const memoryStore = new InMemoryStore();
    const agentRunStore = new InMemoryAgentRunStore(memoryStore);
    await validateRunInvariants(agentRunStore, runId);
  } else if (command === "write") {
    // Write memory entry (for testing/ingestion)
    console.error("Write command not implemented in MVP");
    process.exit(1);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error("Usage: continuum resolve <task> | continuum demo [--crash] | continuum inspect <runId> | continuum replay-check <runId> | continuum validate-run <runId>");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

