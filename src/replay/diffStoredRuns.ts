/**
 * Historical diff: load two runs from disk and compare step-by-step with structural diffs.
 */

import { FileRunStore } from "../storage/RunStore.js";
import type { RunStore } from "../storage/RunStore.js";
import { printReplayDiff, areReplayResultsEqual } from "../cli/replay-diff.js";
import { deepDiff } from "../utils/deepDiff.js";

const DEFAULT_RUNS_DIR = "runs";

/**
 * Loads two stored runs by ID and compares their step outputs.
 * When phases differ, prints field-level diff (Path / Stored / Current).
 *
 * @param runIdA - First run ID (stored/original).
 * @param runIdB - Second run ID (current/other).
 * @param store - Optional RunStore; defaults to FileRunStore with "runs" dir.
 * @param options - strict: extra/missing keys in runB count as drift.
 */
export async function diffStoredRuns(
  runIdA: string,
  runIdB: string,
  store: RunStore = new FileRunStore(DEFAULT_RUNS_DIR),
  options: { strict?: boolean } = {}
): Promise<void> {
  const runA = await store.load(runIdA);
  const runB = await store.load(runIdB);
  const strict = options.strict ?? false;

  const phaseOrder = runA.phases.length > 0
    ? [...runA.phases, ...runB.phases.filter((k) => !runA.phases.includes(k))]
    : undefined;
  console.log(`Comparing ${runIdA} vs ${runIdB}`);
  printReplayDiff(runA.stepOutputs, runB.stepOutputs, {
    secondLabel: "other",
    phaseOrder,
  });

  const identical = areReplayResultsEqual(runA.stepOutputs, runB.stepOutputs);
  if (!identical) {
    const allPhases = [...new Set([...runA.phases, ...runB.phases])];
    for (const phaseName of allPhases) {
      const storedOut = runA.stepOutputs[phaseName];
      const currentOut = runB.stepOutputs[phaseName];
      const diffs = deepDiff(storedOut, currentOut, phaseName, { strict });
      if (diffs.length > 0) {
        console.log("");
        console.log("Drift detected in phase:", phaseName);
        console.log("");
        for (const d of diffs) {
          console.log("Path:", d.path);
          console.log("  Stored:", JSON.stringify(d.stored));
          console.log("  Current:", JSON.stringify(d.current));
          console.log("");
        }
      }
    }
    console.log("✗ step mismatch");
  } else {
    console.log("✓ identical");
  }
}
