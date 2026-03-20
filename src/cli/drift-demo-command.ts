/**
 * Drift demo: run prompt_v1 (baseline), then replay with prompt_v2, compare outputs.
 * Produces format_drift at path "total" (expected: 72, received: "72.00").
 * Writes artifacts so Dashboard diff view, TokenDiff, and DriftHeatmap show the drift.
 */

import path from "path";
import { promises as fs } from "fs";
import { FileRunStore } from "../storage/RunStore.js";
import { runDeterministicAgent } from "../agent/deterministic-runner.js";
import type { DeterministicPhase } from "../agent/deterministic-runner.js";
import type { ExecutionRecipe } from "../storage/RunStore.js";
import { buildLlmDemoPhases } from "./llm-demo-command.js";
import { MockProvider } from "../llm/MockProvider.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import { replayAgainstStored } from "../replay/replayFromStored.js";

const ORG_ID = "invoice-processor-org";
const TASK_ID = "invoice-processor";

/** Prompt v1: extract from text → mock returns total as number (72). */
export const PROMPT_V1 = "Extract invoice number and total amount from the text.";
/** Prompt v2: extract as JSON → mock returns total as string ("72.00"). */
export const PROMPT_V2 = "Extract invoice number and total amount as JSON.";

/** Minimal invoice body so MockProvider matches. */
const INVOICE_BODY = `
Invoice #: INV-001
Vendor: Acme Industrial Supply
Amount Due: $72
Currency: USD
Due Date: April 15, 2024
`.trim();

function buildPrompt(header: string): string {
  return `${header}\n\nInvoice text:\n\n${INVOICE_BODY}`;
}

export async function runDriftDemo(): Promise<void> {
  const repoRoot = process.cwd();
  const runStore = new FileRunStore("runs");
  const provider = new MockProvider();
  const model = "mock-model";
  const temperature = 0;

  const promptV1 = buildPrompt(PROMPT_V1);
  const memoryStore = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(memoryStore);
  const phases: DeterministicPhase[] = buildLlmDemoPhases(provider, model, temperature, promptV1);

  const recipe: ExecutionRecipe = {
    task: TASK_ID,
    provider: "mock",
    model,
    temperature,
    maxTokens: 256,
    config: { prompt: promptV1 },
  };

  console.log("Drift demo: running prompt_v1 (baseline)...");
  const result = await runDeterministicAgent({
    agentId: ORG_ID,
    taskId: TASK_ID,
    phases,
    store: memoryStore,
    agentRunStore,
    runStore,
    recipe,
    input: promptV1,
  });

  const baselineRunId = result.runId;
  console.log("Baseline run stored:", baselineRunId);
  console.log("prompt_v1 result (baseline json_parse):", JSON.stringify(result.phaseResults.json_parse, null, 2));

  // Create a drift run that still contains EXPECTED outputs from prompt_v1,
  // but stores input/recipe prompt for prompt_v2. That way, `continuum verify <driftRunId> --strict`
  // replays prompt_v2 and detects drift against the stored prompt_v1 outputs.
  const promptV2 = buildPrompt(PROMPT_V2);
  const driftRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const baselineStoredRun = await runStore.load(baselineRunId);
  const driftStoredRun = {
    ...baselineStoredRun,
    runId: driftRunId,
    input: promptV2,
    recipe: {
      ...baselineStoredRun.recipe,
      config: { ...(baselineStoredRun.recipe.config ?? {}), prompt: promptV2 },
    },
  };
  await runStore.save(driftStoredRun);

  console.log("");
  console.log("Drift run prepared:", driftRunId);
  console.log("Running verify replay for drift run...");

  const replayResult = await replayAgainstStored(driftRunId, runStore, { strict: true, returnDiffs: true });
  if (typeof replayResult === "boolean") {
    console.error("Expected returnDiffs result");
    process.exit(1);
  }

  const { pass, diffs, actualOutputs } = replayResult;
  console.log("prompt_v2 result (received json_parse):", JSON.stringify(actualOutputs.json_parse, null, 2));

  // Print only the required example drift to make it easy to confirm in logs.
  for (const d of diffs) {
    if (String(d.path).includes("total")) {
      console.log(
        `  ${d.drift_type} path: ${d.path}  expected: ${JSON.stringify(d.expected)}  received: ${JSON.stringify(d.received)}`
      );
    }
  }

  const artifactDir = path.join(repoRoot, "artifacts", "runs", driftRunId);
  await fs.mkdir(artifactDir, { recursive: true });

  const storedRun = await runStore.load(driftRunId);
  const expectedOutputs = storedRun.stepOutputs;
  const actualOutputsToWrite = actualOutputs;

  await fs.writeFile(
    path.join(artifactDir, "expected.json"),
    JSON.stringify(expectedOutputs, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(artifactDir, "actual.json"),
    JSON.stringify(actualOutputsToWrite, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(artifactDir, "diff.json"),
    JSON.stringify(diffs, null, 2),
    "utf8"
  );

  const phaseNames = storedRun.phases;
  const driftPhases = new Set(diffs.map((d) => d.phase).filter(Boolean));
  const timeline = phaseNames.map((p) => ({ phase: p, status: driftPhases.has(p) ? "drift" : "ok" }));
  await fs.writeFile(
    path.join(artifactDir, "timeline.json"),
    JSON.stringify(timeline, null, 2),
    "utf8"
  );

  const metadata = {
    id: driftRunId,
    timestamp: new Date().toISOString(),
    status: pass ? "verified" : "drift",
  };
  await fs.writeFile(
    path.join(artifactDir, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  console.log("");
  console.log("Artifacts written to", artifactDir);
  console.log("Continuum classifies: format_drift at path 'total' (expected: 72, received: \"72.00\")");
  console.log("View in: CLI verify, Dashboard diff view, TokenDiff, DriftHeatmap.");
  process.exit(pass ? 0 : 1);
}
