/**
 * Deterministic Agent Runner
 *
 * High-level runner that sits on top of Continuum engine APIs. Executes a
 * sequence of deterministic phases with step recording and checkpointing.
 * No randomness, time-based logic, or external I/O in the execution path.
 */

import type { MemoryStore } from "../engine/memory-store.js";
import type { AgentRunStore } from "../engine/agent-run-store.js";
import type { IdentityContext } from "../types/identity.js";

/**
 * A single phase in a deterministic agent run.
 * `execute` must be deterministic (no randomness, no Date.now(), no external I/O).
 */
export interface DeterministicPhase {
  /** Phase name (used as step action and key in phaseResults). */
  name: string;
  /** Deterministic async execution. Must return the same result for the same inputs. */
  execute: () => Promise<unknown>;
}

/**
 * Configuration for running a deterministic agent.
 */
export interface DeterministicAgentConfig {
  /** Agent/organization identifier (used as orgId for run and store APIs). */
  agentId: string;
  /** Task identifier (used as task for the run). */
  taskId: string;
  /** Ordered list of phases to run. */
  phases: DeterministicPhase[];
  /** Memory store (e.g. InMemoryStore) for checkpoints. */
  store: MemoryStore;
  /** Agent run store (e.g. InMemoryAgentRunStore) for run and steps. */
  agentRunStore: AgentRunStore;
}

/**
 * Result of a completed deterministic agent run.
 */
export interface DeterministicAgentResult {
  /** Run ID from the engine. */
  runId: string;
  /** Output of each phase keyed by phase name. */
  phaseResults: Record<string, unknown>;
}

/**
 * Runs a deterministic agent: creates a run, executes each phase in order,
 * records steps and checkpoints after every phase, and returns the run ID
 * and all phase results.
 *
 * Constraints (caller must ensure):
 * - Phases are deterministic (no Math.random(), Date.now(), or external I/O).
 * - Only existing engine/store APIs are used.
 *
 * @param config - Agent id, task id, phases, and store instances.
 * @returns The run ID and a map of phase name → phase output.
 */
export async function runDeterministicAgent(
  config: DeterministicAgentConfig
): Promise<DeterministicAgentResult> {
  const { agentId, taskId, phases, store, agentRunStore } = config;

  const seen = new Set<string>();
  for (const phase of phases) {
    if (seen.has(phase.name)) {
      throw new Error("Duplicate phase name detected: " + phase.name);
    }
    seen.add(phase.name);
  }

  const orgId = agentId;
  const identity: IdentityContext = { orgId };

  const run = await agentRunStore.create({
    orgId,
    task: taskId,
    initialContext: identity,
    initialRequest: { task: taskId, org: orgId },
    seed: 0,
    modelConfig: { model: "deterministic-runner", temperature: 0 },
    agentFramework: "deterministic-runner",
  });

  const phaseResults: Record<string, unknown> = {};

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const stepNumber = i + 1;

    console.log(`[DeterministicRunner] Phase ${stepNumber}/${phases.length}: ${phase.name}`);

    const output = await phase.execute();

    await agentRunStore.appendStep(
      {
        runId: run.runId,
        action: phase.name,
        input: { phase: phase.name, stepNumber },
        output,
      },
      orgId
    );

    await store.createCheckpoint({
      orgId,
      description: `After ${phase.name}`,
    });

    phaseResults[phase.name] = output;
  }

  await agentRunStore.updateStatus(run.runId, orgId, "completed", {
    phases: phases.length,
    phaseResults,
  });

  return {
    runId: run.runId,
    phaseResults,
  };
}
