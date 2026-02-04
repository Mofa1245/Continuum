/**
 * Replay verification helper.
 * Compares original and replayed runs: step count, final state checksum, output hash.
 */

import type { AgentRunStore } from "./agent-run-store.js";
import type { AgentRun, AgentStep } from "../types/agent.js";
import { computeObjectChecksum } from "../storage/checksum.js";

export interface ReplayVerificationResult {
  pass: boolean;
  differences?: string[];
}

/**
 * Canonical step payload for hashing (exclude ids/timestamps that may differ).
 */
function stepPayload(step: AgentStep): { stepNumber: number; action: string; input?: unknown; output?: unknown } {
  return {
    stepNumber: step.stepNumber,
    action: step.action,
    input: step.input,
    output: step.output,
  };
}

function stepsOutputHash(steps: AgentStep[]): string {
  return computeObjectChecksum(steps.map(stepPayload));
}

function finalStateChecksum(run: AgentRun): string {
  return computeObjectChecksum({
    finalOutput: run.finalOutput,
    memorySnapshotEnd: run.memorySnapshotEnd,
  });
}

/**
 * Verify replay integrity: step count, final state checksum, output hash.
 * Reuses existing checksum utilities.
 */
export async function verifyReplayIntegrity(
  runStore: AgentRunStore,
  orgId: string,
  originalRunId: string,
  replayRunId: string
): Promise<ReplayVerificationResult> {
  const differences: string[] = [];

  const originalRun = await runStore.get(originalRunId, orgId);
  const replayedRun = await runStore.get(replayRunId, orgId);

  if (!originalRun) {
    differences.push("Original run not found: " + originalRunId);
    return { pass: false, differences };
  }
  if (!replayedRun) {
    differences.push("Replay run not found: " + replayRunId);
    return { pass: false, differences };
  }

  if (originalRun.steps.length !== replayedRun.steps.length) {
    differences.push(
      "Step count mismatch: original=" + originalRun.steps.length + ", replayed=" + replayedRun.steps.length
    );
  }

  const originalFinalChecksum = finalStateChecksum(originalRun);
  const replayedFinalChecksum = finalStateChecksum(replayedRun);
  if (originalFinalChecksum !== replayedFinalChecksum) {
    differences.push("Final state checksum mismatch");
  }

  const originalOutputHash = stepsOutputHash(originalRun.steps);
  const replayedOutputHash = stepsOutputHash(replayedRun.steps);
  if (originalOutputHash !== replayedOutputHash) {
    differences.push("Output hash mismatch");
  }

  const pass = differences.length === 0;
  return pass ? { pass: true } : { pass: false, differences };
}
