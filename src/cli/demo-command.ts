/**
 * CLI demo command: deterministic agent scenario with optional crash/replay validation.
 */

import { createHash } from "crypto";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import { ReplayEngine } from "../engine/replay.js";
import type { IdentityContext } from "../types/identity.js";
import {
  logSection,
  logStep,
  logCheckpoint,
  logCrash,
  logRecovery,
  logReplayStart,
  logReplayResult,
  logInfo,
} from "../utils/demo-logger.js";

const ORG_ID = "org-test";
const SEED = 42;
const TOTAL_STEPS = 5;
const DEMO_CRASH_MESSAGE = "Simulated crash for demo";

function parseCrashStep(args: string[]): number | undefined {
  const crashFlag = args.includes("--crash");
  const atIdx = args.findIndex((a) => a.startsWith("--crash-at="));
  if (atIdx >= 0) {
    const n = parseInt(args[atIdx].split("=")[1], 10);
    return Number.isInteger(n) && n >= 1 ? n : undefined;
  }
  return crashFlag ? 3 : undefined;
}

function hashSteps(steps: { stepNumber: number; action: string; input?: unknown; output?: unknown }[]): string {
  const canonical = JSON.stringify(steps.map((s) => ({ stepNumber: s.stepNumber, action: s.action, input: s.input, output: s.output })));
  return createHash("sha256").update(canonical).digest("hex");
}

export async function runDemo(args: string[], crashStep?: number): Promise<void> {
  const crashStepResolved = crashStep ?? parseCrashStep(args);

  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const replayEngine = new ReplayEngine(runStore, memoryStore);

  const identity: IdentityContext = { orgId: ORG_ID, repoId: "demo-repo" };

  logSection("RUN START");

  const run = await runStore.create({
    orgId: ORG_ID,
    task: "demo deterministic run",
    initialContext: identity,
    initialRequest: { task: "demo deterministic run", repo: identity.repoId, org: ORG_ID },
    seed: SEED,
    modelConfig: { model: "demo", temperature: 0 },
    agentFramework: "demo",
  });

  logInfo("Run ID: " + run.runId);
  logInfo("Checkpoint ID: " + run.checkpointId);

  const checkpoints: string[] = [run.checkpointId!];

  let stepsCompleted = 0;
  let lastCheckpointId = run.checkpointId!;
  let didCrash = false;

  try {
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      logSection("STEP EXECUTION");

      const stepOutput = { step: i, value: `output_${i}`, deterministic: true };
      logStep(i, "step_" + i);
      console.log(JSON.stringify({ step: i, action: `step_${i}`, output: stepOutput }, null, 2));

      await runStore.appendStep(
        {
          runId: run.runId,
          action: `step_${i}`,
          input: { step: i },
          output: stepOutput,
        },
        ORG_ID
      );
      stepsCompleted = i;

      const checkpoint = await memoryStore.createCheckpoint({
        orgId: ORG_ID,
        description: `After step ${i}`,
      });
      checkpoints.push(checkpoint.id);
      lastCheckpointId = checkpoint.id;

      logSection("CHECKPOINT SAVED");
      logCheckpoint(i, checkpoint.id);

      if (crashStepResolved !== undefined && i === crashStepResolved) {
        logSection("CRASH SIMULATED");
        logCrash(stepsCompleted);
        didCrash = true;
        throw new Error(DEMO_CRASH_MESSAGE);
      }
    }

    if (stepsCompleted === TOTAL_STEPS) {
      await runStore.updateStatus(run.runId, ORG_ID, "completed", { steps: TOTAL_STEPS });
    }
  } catch (err) {
    if (!(err instanceof Error) || err.message !== DEMO_CRASH_MESSAGE) {
      throw err;
    }
    didCrash = true;
  }

  let originalHash: string;
  let replayedHash: string;

  if (didCrash) {
    logSection("RECOVERY START");
    await memoryStore.restoreCheckpoint(lastCheckpointId, ORG_ID);
    logRecovery(lastCheckpointId);
    originalHash = hashSteps(run.steps);

    logSection("REPLAY START");
    logReplayStart();
    const replayResult = await replayEngine.replay({
      runId: run.runId,
      seed: SEED,
      stopAtStep: stepsCompleted,
    });

    const replayedRun = await runStore.get(replayResult.replayedRunId, ORG_ID);
    replayedHash = hashSteps(replayedRun?.steps ?? []);
    logInfo("Replay matched: " + String(replayResult.matched));
  } else {
    logSection("REPLAY START");
    logReplayStart();
    const replayResult = await replayEngine.replay({
      runId: run.runId,
      seed: SEED,
    });

    originalHash = hashSteps(run.steps);
    const replayedRun = await runStore.get(replayResult.replayedRunId, ORG_ID);
    replayedHash = hashSteps(replayedRun?.steps ?? []);
    logInfo("Replay matched: " + String(replayResult.matched));
  }

  logSection("REPLAY VERIFIED");
  const pass = originalHash === replayedHash;
  logInfo("Original hash: " + originalHash);
  logInfo("Replayed hash: " + replayedHash);
  logReplayResult(pass);
  process.exit(pass ? 0 : 1);
}
