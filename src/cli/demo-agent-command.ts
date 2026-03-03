/**
 * CLI demo-agent command: 4-step deterministic agent with optional persistence.
 * Used by continuum demo and by examples/ai-debug-demo.
 */

import { runDeterministicAgent } from "../agent/deterministic-runner.js";
import type { DeterministicPhase } from "../agent/deterministic-runner.js";
import type { RunStore, ExecutionRecipe } from "../storage/RunStore.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import { ReplayEngine } from "../engine/replay.js";
import { printReplayDiff, areReplayResultsEqual } from "./replay-diff.js";
import { validateRunInvariants } from "./invariant-validator.js";

const ORG_ID = "org-test";

export type DivergenceMode = "phrase" | "json" | undefined;

function stepsToPhaseResults(steps: { action: string; output?: unknown }[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of steps) out[s.action] = s.output;
  return out;
}

export function buildPhases(divergence?: DivergenceMode): DeterministicPhase[] {
  const toolResultFull = { temperature: 72, unit: "F", city: "NYC" };
  const toolResultMissingUnit = { temperature: 72, city: "NYC" };

  return [
    {
      name: "llm_call",
      execute: async () => ({
        role: "assistant",
        content: "I will call the weather tool.",
        model: "gpt-4",
      }),
    },
    {
      name: "tool_call",
      execute: async () => ({
        tool: "get_weather",
        args: { location: "NYC" },
        result: divergence === "json" ? toolResultMissingUnit : toolResultFull,
      }),
    },
    {
      name: "llm_post_process",
      execute: async () => ({
        content: divergence === "phrase"
          ? "Weather in NYC is 72°F."
          : "Weather in NYC: 72°F.",
        finishReason: "stop",
      }),
    },
    {
      name: "memory_write",
      execute: async () => ({
        key: "last_weather",
        value: "72°F NYC",
      }),
    },
  ];
}

function parseDivergenceMode(args: string[]): DivergenceMode {
  const showJsonDrift = args.includes("--json-drift");
  const showDivergence = args.includes("--divergence");
  return showJsonDrift ? "json" : showDivergence ? "phrase" : undefined;
}

/**
 * Runs the 4-step AI debug demo. When runStore is provided, runs are persisted to disk.
 *
 * @param args - CLI args (e.g. process.argv.slice(2)); --divergence and --json-drift are supported.
 * @param runStore - Optional RunStore; when provided, each completed run is saved to disk.
 */
export async function runDemoAgent(
  args: string[],
  runStore?: RunStore
): Promise<void> {
  const divergenceMode = parseDivergenceMode(args);
  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  console.log("--- AI Debug Demo: 4-step agent ---\n");
  console.log("Steps: llm_call → tool_call → llm_post_process → memory_write\n");

  const phases = buildPhases();
  const recipe: ExecutionRecipe = {
    task: "ai-debug-demo",
    provider: "internal",
    model: "deterministic-runner",
    temperature: 0,
  };
  const result = await runDeterministicAgent({
    agentId: ORG_ID,
    taskId: "ai-debug-demo",
    phases,
    store,
    agentRunStore,
    runStore,
    recipe,
  });

  console.log("Run ID:", result.runId);
  console.log("");

  const replayEngine = new ReplayEngine(agentRunStore, store);
  const run = await agentRunStore.get(result.runId, ORG_ID);
  if (!run) {
    console.error("Run not found after create");
    return;
  }

  if (!divergenceMode) {
    console.log("--- Replay (same seed) ---");
    const replayResult = await replayEngine.replay({
      runId: run.runId,
      seed: run.seed ?? 0,
    });
    const replayedRun = await agentRunStore.get(replayResult.replayedRunId, ORG_ID);
    if (!replayedRun) {
      console.error("Replayed run not found");
      return;
    }
    const originalResults = stepsToPhaseResults(run.steps);
    const replayResults = stepsToPhaseResults(replayedRun.steps);
    const phaseOrder = run.steps.map((s) => s.action);
    printReplayDiff(originalResults, replayResults, { phaseOrder });
    const pass = areReplayResultsEqual(originalResults, replayResults);
    console.log(pass ? "Replay verification: PASS" : "Replay verification: FAIL");
    console.log("");
  }

  console.log("--- Invariant validator ---");
  await validateRunInvariants(agentRunStore, result.runId, ORG_ID);

  if (divergenceMode) {
    const label =
      divergenceMode === "json"
        ? "structured drift (missing JSON field)"
        : "phrase drift in llm_post_process";
    console.log("\n--- Divergence demo: second run with one step changed ---");
    const store2 = new InMemoryStore();
    const agentRunStore2 = new InMemoryAgentRunStore(store2);
    const phasesDivergent = buildPhases(divergenceMode);
    const recipe2: ExecutionRecipe = {
      task: "ai-debug-demo-2",
      provider: "internal",
      model: "deterministic-runner",
      temperature: 0,
      config: { divergenceMode },
    };
    const result2 = await runDeterministicAgent({
      agentId: ORG_ID,
      taskId: "ai-debug-demo-2",
      phases: phasesDivergent,
      store: store2,
      agentRunStore: agentRunStore2,
      runStore,
      recipe: recipe2,
    });
    const run2 = await agentRunStore2.get(result2.runId, ORG_ID);
    if (!run2) return;
    const origResults = stepsToPhaseResults(run.steps);
    const divResults = stepsToPhaseResults(run2.steps);
    const phaseOrder = run.steps.map((s) => s.action);
    printReplayDiff(origResults, divResults, { phaseOrder });
    console.log(`Replay verification: FAIL (intentional ${label})`);
  }
}
