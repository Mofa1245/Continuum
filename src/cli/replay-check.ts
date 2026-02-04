/**
 * CLI helper: load a run, replay it via the engine, compare original vs replay with printReplayDiff.
 * Read-only; no engine or storage modifications.
 */

import type { AgentRunStore } from "../engine/agent-run-store.js";
import type { MemoryStore } from "../engine/memory-store.js";
import { ReplayEngine } from "../engine/replay.js";
import { printReplayDiff, areReplayResultsEqual } from "./replay-diff.js";

const DEFAULT_ORG_ID = "org-test";

function stepsToPhaseResults(
  steps: { action: string; output?: unknown }[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of steps) {
    out[s.action] = s.output;
  }
  return out;
}

/**
 * Loads a run by runId, replays it using the existing replay engine, and compares
 * original vs replay results with printReplayDiff. Prints PASS or FAIL.
 *
 * @param agentRunStore - Store that holds the run (and will hold the replayed run).
 * @param memoryStore - Memory store used by the replay engine (must contain run checkpoint).
 * @param runId - Run identifier.
 * @param orgId - Optional org scope; defaults to "org-test".
 */
export async function runReplayCheck(
  agentRunStore: AgentRunStore,
  memoryStore: MemoryStore,
  runId: string,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> {
  const run = await agentRunStore.get(runId, orgId);

  if (!run) {
    console.error("Run not found:", runId);
    return;
  }

  const originalResults = stepsToPhaseResults(run.steps);

  const replayEngine = new ReplayEngine(agentRunStore, memoryStore);
  const replayResult = await replayEngine.replay({
    runId: run.runId,
    seed: run.seed,
  });

  const replayedRun = await agentRunStore.get(replayResult.replayedRunId, orgId);
  if (!replayedRun) {
    console.error("Replay run not found:", replayResult.replayedRunId);
    return;
  }

  const replayResults = stepsToPhaseResults(replayedRun.steps);

  printReplayDiff(originalResults, replayResults);

  const equal = areReplayResultsEqual(originalResults, replayResults);
  console.log(equal ? "Replay verification: PASS" : "Replay verification: FAIL");
}
