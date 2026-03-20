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
import { runDemoAgent } from "../cli/demo-agent-command.js";
import { runLlmDemo } from "../cli/llm-demo-command.js";
import { runInvoiceDemo } from "../cli/invoice-demo-command.js";
import { runDriftDemo } from "../cli/drift-demo-command.js";
import { FileRunStore } from "../storage/RunStore.js";
import { printRunSummary } from "../cli/run-inspector.js";
import { runReplayCheck } from "../cli/replay-check.js";
import { validateRunInvariants } from "../cli/invariant-validator.js";
import { replayAgainstStored } from "../replay/replayFromStored.js";
import { diffStoredRuns } from "../replay/diffStoredRuns.js";
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
    const { spawn } = await import("child_process");
    const path = await import("path");
    const isWin = process.platform === "win32";
    if (!isWin) {
      console.error("continuum demo currently supports Windows PowerShell only.");
      console.error("Run manually: npm run build && npm run continuum -- drift-demo && npm run continuum -- ui");
      process.exit(1);
    }
    const scriptPath = path.join(process.cwd(), "scripts", "demo-flow.ps1");
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: true,
    });
    await new Promise<void>((resolve) => {
      child.on("close", () => resolve());
    });
  } else if (command === "demo-agent") {
    const runStore = new FileRunStore("runs");
    await runDemoAgent(args, runStore);
  } else if (command === "llm-demo") {
    const runStore = new FileRunStore("runs");
    await runLlmDemo(args, runStore);
  } else if (command === "invoice-demo") {
    const runStore = new FileRunStore("runs");
    await runInvoiceDemo(args, runStore);
  } else if (command === "drift-demo") {
    await runDriftDemo();
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
  } else if (command === "replay") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: continuum replay <runId> [--strict]");
      process.exit(1);
    }
    const strict = args.includes("--strict");
    const result = await replayAgainstStored(runId, undefined, { strict });
    const pass = typeof result === "boolean" ? result : result.pass;
    process.exit(pass ? 0 : 1);
  } else if (command === "verify") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: continuum verify <runId> [--strict]");
      process.exit(1);
    }
    const runStore = new FileRunStore("runs");
    const strict = args.includes("--strict");
    const result = await replayAgainstStored(runId, runStore, { strict });
    const pass = typeof result === "boolean" ? result : result.pass;
    console.log(pass ? "Verification: PASS" : "Verification: FAIL");
    process.exit(pass ? 0 : 1);
  } else if (command === "verify-all") {
    const runStore = new FileRunStore("runs");
    const strict = args.includes("--strict");
    const runIds = await runStore.listRuns();
    const failed: string[] = [];
    for (const runId of runIds) {
      const result = await replayAgainstStored(runId, runStore, { strict });
      const pass = typeof result === "boolean" ? result : result.pass;
      if (!pass) failed.push(runId);
    }
    if (failed.length === 0) {
      console.log("All runs verified successfully.");
      process.exit(0);
    }
    console.error("Verification failed for:");
    for (const id of failed) {
      console.error(" -", id);
    }
    process.exit(1);
  } else if (command === "diff") {
    const runIdA = args[1];
    const runIdB = args[2];
    if (!runIdA || !runIdB) {
      console.error("Usage: continuum diff <runIdA> <runIdB>");
      process.exit(1);
    }
    await diffStoredRuns(runIdA, runIdB);
  } else if (command === "watch") {
    const { spawn } = await import("child_process");
    const fs = await import("fs");
    const path = await import("path");
    const repoRoot = process.cwd();
    const runsDir = path.join(repoRoot, "runs");
    const isWin = process.platform === "win32";

    function listRunIds(): string[] {
      try {
        if (!fs.existsSync(runsDir)) return [];
        return fs.readdirSync(runsDir)
          .filter((f) => f.startsWith("run_") && f.endsWith(".json"))
          .map((f) => path.basename(f, ".json"));
      } catch {
        return [];
      }
    }

    function runVerify(runId: string): Promise<boolean> {
      return new Promise((resolve) => {
        const child = spawn(
          process.execPath,
          [path.join(repoRoot, "dist", "cli", "index.js"), "verify", runId, "--strict"],
          { cwd: repoRoot, stdio: "pipe" }
        );
        child.on("close", (code) => resolve(code === 0));
      });
    }

    function openDashboard(): void {
      const open = isWin ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
      spawn(open, ["http://localhost:3000"], { stdio: "ignore", shell: true });
    }

    async function isHttpUp(url: string, timeoutMs: number = 1500): Promise<boolean> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        // Treat any < 500 status as "reachable" (e.g. 404 is fine).
        return res.status < 500;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    let uiStarted = false;
    function startUI(): void {
      if (uiStarted) {
        openDashboard();
        return;
      }
      uiStarted = true;

      void (async () => {
        const backendUp = await isHttpUp("http://localhost:8000/runs/drift-summary");
        const frontendUp = await isHttpUp("http://localhost:3000/");

        if (!backendUp) {
          spawn(
            isWin ? "python" : "python3",
            ["-m", "uvicorn", "ui.backend.main:app", "--port", "8000"],
            { cwd: repoRoot, stdio: "ignore", shell: isWin }
          );
        }
        if (!frontendUp) {
          spawn("npm", ["run", "dev"], {
            cwd: path.join(repoRoot, "ui", "frontend"),
            stdio: "ignore",
            shell: true,
          });
        }

        setTimeout(openDashboard, 5000);
      })();
    }

    let knownIds = new Set(listRunIds());
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    if (!fs.existsSync(runsDir)) {
      fs.mkdirSync(runsDir, { recursive: true });
    }

    console.log("Watching runs/ for new runs. Press Ctrl+C to stop.");
    fs.watch(runsDir, { persistent: true }, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        const current = listRunIds();
        const newIds = current.filter((id) => !knownIds.has(id));
        for (const id of newIds) {
          knownIds.add(id);
          console.log(`New run detected: ${id}. Verifying...`);
          runVerify(id).then((pass) => {
            if (!pass) {
              console.log("Drift detected. Opening dashboard...");
              startUI();
            } else {
              console.log(`${id}: verified.`);
            }
          });
        }
      }, 500);
    });
    return;
  } else if (command === "ui") {
    const { spawn } = await import("child_process");
    const path = await import("path");
    const repoRoot = process.cwd();
    const isWin = process.platform === "win32";

    async function isHttpUp(url: string, timeoutMs: number = 1500): Promise<boolean> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        return res.status < 500;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    const open =
      isWin ? "start" : process.platform === "darwin" ? "open" : "xdg-open";

    // Avoid EADDRINUSE: don't spawn uvicorn if something is already on 8000.
    const backendUp = await isHttpUp("http://localhost:8000/runs/drift-summary");
    const frontendUp = await isHttpUp("http://localhost:3000/");

    const backend = backendUp
      ? null
      : spawn(
          isWin ? "python" : "python3",
          ["-m", "uvicorn", "ui.backend.main:app", "--port", "8000"],
          { cwd: repoRoot, stdio: "inherit", shell: isWin }
        );
    const frontend = frontendUp
      ? null
      : spawn("npm", ["run", "dev"], {
          cwd: path.join(repoRoot, "ui", "frontend"),
          stdio: "inherit",
          shell: true,
        });

    if (backendUp) {
      console.log("UI backend already running on http://localhost:8000");
    }
    if (frontendUp) {
      console.log("UI frontend already running on http://localhost:3000");
    }

    setTimeout(() => {
      spawn(open, ["http://localhost:3000"], { stdio: "ignore", shell: true });
    }, 4000);

    process.on("SIGINT", () => {
      backend?.kill();
      frontend?.kill();
      process.exit(0);
    });
    backend?.on("exit", () => {
      frontend?.kill();
      process.exit(0);
    });
    frontend?.on("exit", () => {
      backend?.kill();
      process.exit(0);
    });
    return;
  } else if (command === "write") {
    // Write memory entry (for testing/ingestion)
    console.error("Write command not implemented in MVP");
    process.exit(1);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error("Usage: continuum resolve <task> | continuum demo | continuum demo-agent [--crash] | continuum llm-demo | continuum invoice-demo | continuum drift-demo | continuum ui | continuum watch | continuum inspect <runId> | continuum replay-check <runId> | continuum validate-run <runId> | continuum replay <runId> [--strict] | continuum verify <runId> [--strict] | continuum verify-all [--strict] | continuum diff <runIdA> <runIdB>");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

