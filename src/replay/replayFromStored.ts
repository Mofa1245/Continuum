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
 * @param options - strict, recipeOverride (e.g. input for different prompt), returnDiffs.
 * @returns true if replay matched (PASS), false if drift (FAIL); or { pass, diffs } when returnDiffs.
 */

import { FileRunStore, type RunStore } from "../storage/RunStore.js";
import { deepDiff } from "../utils/deepDiff.js";
import { getTaskExecutor } from "./taskRegistry.js";
import { classifyDiff, type ClassifiedDiff } from "./driftClassifier.js";

const DEFAULT_RUNS_DIR = "runs";

export interface ReplayOptions {
  strict?: boolean;
  /** Override input (e.g. prompt) when replaying (for drift-demo: replay with v2 prompt). */
  recipeOverride?: { input?: string };
  /** When true, return { pass, diffs, actualOutputs } for writing artifacts. */
  returnDiffs?: boolean;
}

export type ReplayResultWithDiffs = {
  pass: boolean;
  diffs: ClassifiedDiff[];
  actualOutputs: Record<string, unknown>;
};

export async function replayAgainstStored(
  runId: string,
  store: RunStore = new FileRunStore(DEFAULT_RUNS_DIR),
  options: ReplayOptions = {}
): Promise<boolean | ReplayResultWithDiffs> {
  const storedRun = await store.load(runId);

  if (!storedRun.recipe) {
    console.error("Stored run is missing execution recipe. RunId:", storedRun.runId);
    console.log("Replay verification: FAIL");
    return options.returnDiffs ? { pass: false, diffs: [], actualOutputs: {} } : false;
  }

  const executor = getTaskExecutor(storedRun.recipe.task);
  if (!executor) {
    console.error("Unknown task type in stored run:", storedRun.recipe.task);
    console.log("Replay verification: FAIL");
    return options.returnDiffs ? { pass: false, diffs: [], actualOutputs: {} } : false;
  }

  console.log(`Replaying historical run ${runId}...`);

  const inputString = options.recipeOverride?.input != null
    ? options.recipeOverride.input
    : (typeof storedRun.input === "string" ? storedRun.input : JSON.stringify(storedRun.input ?? ""));

  const { phaseResults } = await executor(inputString, storedRun.recipe);

  const strict = options.strict ?? false;
  const allClassified: ClassifiedDiff[] = [];
  let anyDrift = false;

  for (const phaseName of storedRun.phases) {
    const storedOut = storedRun.stepOutputs[phaseName];
    const currentOut = phaseResults[phaseName];
    const diffs = deepDiff(storedOut, currentOut, phaseName, { strict });

    if (diffs.length > 0) {
      anyDrift = true;
      for (const d of diffs) {
        const classified = classifyDiff(d.path, d.stored, d.current, phaseName);
        allClassified.push(classified);
      }
      if (!options.returnDiffs) {
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
  }

  if (!options.returnDiffs) {
    console.log(anyDrift ? "Replay verification: FAIL" : "Replay verification: PASS");
    return !anyDrift;
  }
  if (anyDrift) {
    console.log("Replay verification: FAIL");
  } else {
    console.log("Replay verification: PASS");
  }
  return { pass: !anyDrift, diffs: allClassified, actualOutputs: phaseResults };
}
