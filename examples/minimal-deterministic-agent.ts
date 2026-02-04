/**
 * Minimal deterministic agent example.
 * Shows Continuum wrapping a simple agent workflow: step recording, checkpointing, crash recovery, replay verification.
 * Example only — no engine or core changes.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { ReplayEngine } from "../src/engine/replay.js";
import { verifyReplayIntegrity } from "../src/engine/replay-verifier.js";
import type { IdentityContext } from "../src/types/identity.js";
import {
  logSection,
  logStep,
  logCheckpoint,
  logCrash,
  logRecovery,
  logReplayStart,
  logReplayResult,
  logInfo,
} from "../src/utils/demo-logger.js";

const ORG_ID = "org-test";
const CRASH_MESSAGE = "Simulated agent crash";

function parseCrashAt(args: string[]): number | undefined {
  const idx = args.findIndex((a) => a.startsWith("--crash-at="));
  if (idx < 0) return undefined;
  const n = parseInt(args[idx].split("=")[1], 10);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}

function plan(): { plan: string; steps: string[] } {
  return { plan: "minimal-example", steps: ["gather", "decide", "produce"] };
}

function gatherContext(): { constraints: string[]; preferences: string[] } {
  return { constraints: ["deterministic"], preferences: ["no external calls"] };
}

function decideAction(): { action: string; reason: string } {
  return { action: "execute_plan", reason: "deterministic flow" };
}

function produceResult(): { result: string; status: string } {
  return { result: "ok", status: "completed" };
}

export async function runMinimalAgentExample(args: string[]): Promise<void> {
  const crashAtStep = parseCrashAt(args);

  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const replayEngine = new ReplayEngine(runStore, memoryStore);

  const identity: IdentityContext = { orgId: ORG_ID, repoId: "agent-example" };

  logSection("RUN START");

  const run = await runStore.create({
    orgId: ORG_ID,
    task: "minimal deterministic agent (agent-example)",
    initialContext: identity,
    initialRequest: { task: "minimal deterministic agent", repo: identity.repoId, org: ORG_ID },
    seed: 42,
    modelConfig: { model: "demo", temperature: 0 },
    agentFramework: "minimal-example",
  });

  logInfo("Run ID: " + run.runId);
  logInfo("Checkpoint ID: " + run.checkpointId);

  let lastCheckpointId = run.checkpointId!;
  let stepsCompleted = 0;
  let didCrash = false;

  const phases = [
    { name: "plan", fn: plan },
    { name: "gatherContext", fn: gatherContext },
    { name: "decideAction", fn: decideAction },
    { name: "produceResult", fn: produceResult },
  ];

  try {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const stepNumber = i + 1;

      logSection("STEP EXECUTION");
      logStep(stepNumber, phase.name);

      const output = phase.fn();

      await runStore.appendStep(
        {
          runId: run.runId,
          action: phase.name,
          input: { phase: phase.name },
          output,
        },
        ORG_ID
      );
      stepsCompleted = stepNumber;

      const checkpoint = await memoryStore.createCheckpoint({
        orgId: ORG_ID,
        description: `After ${phase.name}`,
      });
      lastCheckpointId = checkpoint.id;

      logSection("CHECKPOINT SAVED");
      logCheckpoint(stepNumber, checkpoint.id);

      if (crashAtStep !== undefined && stepNumber === crashAtStep) {
        logSection("CRASH SIMULATED");
        logCrash(stepNumber);
        didCrash = true;
        throw new Error(CRASH_MESSAGE);
      }
    }

    await runStore.updateStatus(run.runId, ORG_ID, "completed", { phases: phases.length });
  } catch (err) {
    if (!(err instanceof Error) || err.message !== CRASH_MESSAGE) {
      throw err;
    }
    didCrash = true;
  }

  if (didCrash) {
    logSection("RECOVERY START");
    await memoryStore.restoreCheckpoint(lastCheckpointId, ORG_ID);
    logRecovery(lastCheckpointId);

    logSection("REPLAY START");
    logReplayStart();
    const replayResult = await replayEngine.replay({
      runId: run.runId,
      seed: 42,
      stopAtStep: stepsCompleted,
    });
    logInfo("Replay matched: " + String(replayResult.matched));

    const verification = await verifyReplayIntegrity(
      runStore,
      ORG_ID,
      run.runId,
      replayResult.replayedRunId
    );

    logSection("REPLAY VERIFIED");
    logReplayResult(verification.pass);
    if (verification.differences?.length) {
      verification.differences.forEach((d) => logInfo(d));
    }
    process.exit(verification.pass ? 0 : 1);
  } else {
    logSection("REPLAY START");
    logReplayStart();
    const replayResult = await replayEngine.replay({
      runId: run.runId,
      seed: 42,
    });
    logInfo("Replay matched: " + String(replayResult.matched));

    const verification = await verifyReplayIntegrity(
      runStore,
      ORG_ID,
      run.runId,
      replayResult.replayedRunId
    );

    logSection("REPLAY VERIFIED");
    logReplayResult(verification.pass);
    if (verification.differences?.length) {
      verification.differences.forEach((d) => logInfo(d));
    }
    process.exit(verification.pass ? 0 : 1);
  }
}

runMinimalAgentExample(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
