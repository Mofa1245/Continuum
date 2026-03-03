/**
 * Historical replay verification: load a run from disk, re-execute phases based on
 * the stored execution recipe, and compare stored snapshot vs replay.
 *
 * If a recipe is present, replay uses it as the single source of truth for how
 * to rebuild phases (e.g. provider, model, temperature, prompts). When no recipe
 * is present, replay falls back to returning stored outputs directly.
 *
 * @param runId - Run identifier (e.g. run_123abc).
 * @param store - Optional RunStore; defaults to FileRunStore with "runs" dir.
 * @param options - strict: if true, extra/missing keys in current count as drift.
 * @returns true if replay matched (PASS), false if drift detected (FAIL).
 */

import { FileRunStore, type RunStore } from "../storage/RunStore.js";
import { deepDiff } from "../utils/deepDiff.js";
import { getTaskExecutor } from "./taskRegistry.js";

const DEFAULT_RUNS_DIR = "runs";

export async function replayAgainstStored(
  runId: string,
  store: RunStore = new FileRunStore(DEFAULT_RUNS_DIR),
  options: { strict?: boolean } = {}
): Promise<boolean> {
  const storedRun = await store.load(runId);

  if (!storedRun.recipe) {
    console.error("Stored run is missing execution recipe. RunId:", storedRun.runId);
    console.log("Replay verification: FAIL");
    return false;
  }

  const executor = getTaskExecutor(storedRun.recipe.task);
  if (!executor) {
    console.error("Unknown task type in stored run:", storedRun.recipe.task);
    console.log("Replay verification: FAIL");
    return false;
  }

  console.log(`Replaying historical run ${runId}...`);

  const inputString =
    typeof storedRun.input === "string" ? storedRun.input : JSON.stringify(storedRun.input ?? "");

  const { phaseResults } = await executor(inputString, storedRun.recipe);

  const strict = options.strict ?? false;
  let anyDrift = false;

  for (const phaseName of storedRun.phases) {
    const storedOut = storedRun.stepOutputs[phaseName];
    const currentOut = phaseResults[phaseName];
    const diffs = deepDiff(storedOut, currentOut, phaseName, { strict });

    if (diffs.length > 0) {
      anyDrift = true;
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

  console.log(anyDrift ? "Replay verification: FAIL" : "Replay verification: PASS");
  return !anyDrift;
}
