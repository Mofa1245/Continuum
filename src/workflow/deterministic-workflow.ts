/**
 * Deterministic Workflow — thin workflow abstraction on top of runDeterministicAgent.
 * DX helper layer only; not part of the deterministic core.
 */

import { runDeterministicAgent } from "../agent/deterministic-runner.js";
import type { DeterministicPhase } from "../agent/deterministic-runner.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";

/**
 * A single step in a deterministic workflow.
 * `run` must be deterministic (no randomness, no Date.now(), no external I/O).
 */
export interface DeterministicWorkflowStep {
  /** Step name (must be unique within the workflow). */
  name: string;
  /** Deterministic async execution. */
  run: () => Promise<unknown>;
}

/**
 * Configuration for creating a deterministic workflow.
 */
export interface DeterministicWorkflowConfig {
  /** Workflow identifier (used as agentId for the run). */
  workflowId: string;
  /** Task identifier. */
  taskId: string;
  /** Ordered list of steps to run. */
  steps: DeterministicWorkflowStep[];
}

/**
 * Result of running a deterministic workflow.
 */
export interface DeterministicWorkflowRunResult {
  runId: string;
  stepResults: Record<string, unknown>;
}

/**
 * Creates a deterministic workflow helper. This is a DX helper layer only: it is not
 * part of the Continuum core. It converts workflow steps into agent phases, uses
 * in-memory stores, and calls runDeterministicAgent. Suitable for demos and local
 * workflows. No randomness or time-based logic; steps must be deterministic.
 *
 * @param config - workflowId, taskId, and steps.
 * @returns An object with `run()` that executes the workflow and returns runId and stepResults.
 */
export function createDeterministicWorkflow(
  config: DeterministicWorkflowConfig
): {
  run: () => Promise<DeterministicWorkflowRunResult>;
} {
  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  const phases: DeterministicPhase[] = config.steps.map((step) => ({
    name: step.name,
    execute: step.run,
  }));

  return {
    async run(): Promise<DeterministicWorkflowRunResult> {
      const result = await runDeterministicAgent({
        agentId: config.workflowId,
        taskId: config.taskId,
        phases,
        store,
        agentRunStore,
      });
      return {
        runId: result.runId,
        stepResults: result.phaseResults,
      };
    },
  };
}
