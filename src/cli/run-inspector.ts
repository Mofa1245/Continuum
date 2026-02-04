/**
 * CLI helper: print a deterministic run summary from AgentRunStore.
 * Read-only; no engine or storage changes.
 */

import type { AgentRunStore } from "../engine/agent-run-store.js";

const DEFAULT_ORG_ID = "org-test";

/**
 * Fetches a run by runId and prints a summary. Uses only agentRunStore APIs.
 * If the run is not found, logs to stderr and returns.
 *
 * @param agentRunStore - Store to read from (e.g. InMemoryAgentRunStore).
 * @param runId - Run identifier.
 * @param orgId - Optional org scope; defaults to "org-test".
 */
export async function printRunSummary(
  agentRunStore: AgentRunStore,
  runId: string,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> {
  const run = await agentRunStore.get(runId, orgId);

  if (!run) {
    console.error(`Run not found: ${runId} (org: ${orgId})`);
    return;
  }

  const phaseNames = run.steps.map((s) => s.action);
  const checkpointId = run.checkpointId ?? "—";
  const checkpointCount = run.checkpointId ? 1 : 0;

  console.log("Run ID:", run.runId);
  console.log("Task:", run.task);
  console.log("Status:", run.status);
  console.log("Step count:", run.steps.length);
  console.log("Phase names (order):", phaseNames.join(", ") || "—");
  console.log("Checkpoint count:", checkpointCount);
  console.log("Checkpoint ID:", checkpointId);
  console.log(
    "Final output:",
    run.finalOutput !== undefined
      ? JSON.stringify(run.finalOutput, null, 2)
      : "—"
  );
}
