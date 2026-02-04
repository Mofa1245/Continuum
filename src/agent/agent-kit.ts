/**
 * Agent Kit — convenience wrapper for creating and running a deterministic agent
 * with minimal setup. Not part of the deterministic core; uses in-memory stores
 * for demo and development.
 */

import { runDeterministicAgent } from "./deterministic-runner.js";
import type { DeterministicPhase } from "./deterministic-runner.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";

/**
 * Configuration for creating a deterministic agent kit.
 */
export interface DeterministicAgentKitConfig {
  /** Agent/organization identifier. */
  agentId: string;
  /** Task identifier. */
  taskId: string;
  /** Ordered list of deterministic phases to run. */
  phases: DeterministicPhase[];
}

/**
 * Result of calling `kit.run()`.
 */
export interface DeterministicAgentKitRunResult {
  runId: string;
  phaseResults: Record<string, unknown>;
}

/**
 * Creates a convenience kit for running a deterministic agent with in-memory
 * stores. This is a DX wrapper only: it is not part of the deterministic core.
 * Uses InMemoryStore and InMemoryAgentRunStore, suitable for demos and local
 * development. For production or persistence, wire your own stores to
 * runDeterministicAgent directly.
 *
 * @param config - agentId, taskId, and phases.
 * @returns An object with `run()` that executes the agent and returns runId and phaseResults.
 */
export function createDeterministicAgentKit(
  config: DeterministicAgentKitConfig
): {
  run: () => Promise<{ runId: string; phaseResults: Record<string, unknown> }>;
} {
  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  return {
    async run(): Promise<DeterministicAgentKitRunResult> {
      const result = await runDeterministicAgent({
        agentId: config.agentId,
        taskId: config.taskId,
        phases: config.phases,
        store,
        agentRunStore,
      });
      return {
        runId: result.runId,
        phaseResults: result.phaseResults,
      };
    },
  };
}
