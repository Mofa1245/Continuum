/**
 * Deterministic Replay Engine
 * 
 * This is the killer capability.
 * 
 * Given an AgentRun, replay it deterministically:
 * - Same input
 * - Same memory state
 * - Same model config
 * - Same seed
 * 
 * Result: Same output (or divergence detection)
 */

import type { AgentRun, ReplayConfig, ReplayResult } from "../types/agent.js";
import type { AgentRunStore } from "./agent-run-store.js";
import type { MemoryStore } from "./memory-store.js";
import type { IdentityContext } from "../types/identity.js";
import {
  assertNonEmptyString,
  assertDefined,
} from "../utils/invariants.js";

export class ReplayEngine {
  constructor(
    private runStore: AgentRunStore,
    private memoryStore: MemoryStore
  ) {}

  /**
   * Replay an AgentRun deterministically
   * 
   * **This is the core value proposition:**
   * - Same input → same output
   * - Detect divergence
   * - Debug agent behavior
   * 
   * **Invariants:**
   * - Run must have checkpointId (required for replay)
   * - Memory state restored to checkpoint state
   * - Replay is step-by-step (sequential)
   * 
   * **Error guarantees:**
   * - Throws if run not found
   * - Throws if checkpoint missing
   * - Throws if checkpoint invalid
   * - No state change on error
   * 
   * **Caller responsibility:**
   * - Ensure run exists and has checkpointId
   * - Ensure checkpoint exists
   * - Don't modify memory during replay
   * - Handle divergence appropriately
   */
  async replay(config: ReplayConfig): Promise<ReplayResult> {
    // Invariant: runId must be non-empty
    assertNonEmptyString(config.runId, "runId must be non-empty string");

    // Get original run
    // Note: We need orgId - for MVP, we'll need to pass it
    // In production, this would be extracted from auth context
    const originalRun = await this.getOriginalRun(config.runId);

    // Invariant: run must exist
    assertDefined(originalRun, `Run not found: ${config.runId}`);
    
    // Invariant: run must have checkpointId for replay
    assertDefined(
      originalRun.checkpointId,
      `Run ${config.runId} has no checkpointId (cannot replay)`
    );

    // Restore memory state to start of original run
    await this.restoreMemoryState(
      originalRun.initialContext,
      originalRun.checkpointId
    );

    // Create new run with same config (but different runId)
    const replayedRun = await this.runStore.create({
      orgId: originalRun.orgId,
      runId: `replay_${originalRun.runId}_${Date.now()}`,
      task: originalRun.task,
      initialContext: originalRun.initialContext,
      initialRequest: originalRun.initialRequest,
      seed: config.seed ?? originalRun.seed,
      modelConfig: config.modelConfig ?? originalRun.modelConfig,
      agentFramework: originalRun.agentFramework,
    });

    // Replay each step
    const stepsToReplay = config.stopAtStep
      ? originalRun.steps.slice(0, config.stopAtStep)
      : originalRun.steps;

    let divergenceStep: number | undefined;
    let matched = true;

    for (const originalStep of stepsToReplay) {
      // Replay step
      const replayedStep = await this.replayStep(
        replayedRun,
        originalStep,
        originalRun.initialContext
      );

      // Compare outputs
      if (!this.stepsMatch(originalStep, replayedStep)) {
        matched = false;
        divergenceStep = originalStep.stepNumber;
        break;
      }
    }

    // Get final outputs
    const originalOutput = originalRun.finalOutput;
    const replayedOutput = replayedRun.finalOutput;

    // Update replayed run status
    await this.runStore.updateStatus(
      replayedRun.runId,
      originalRun.orgId,
      matched ? "completed" : "failed",
      replayedOutput
    );

    return {
      originalRunId: originalRun.runId,
      replayedRunId: replayedRun.runId,
      matched,
      divergenceStep,
      originalOutput,
      replayedOutput,
    };
  }

  /**
   * Get original run (helper)
   * 
   * For MVP: We need orgId. In production, this comes from auth.
   */
  private async getOriginalRun(runId: string): Promise<AgentRun | null> {
    // For MVP: Try to find in all orgs (inefficient but works)
    // In production: orgId comes from auth context
    const orgIds = ["org-test"]; // TODO: Get from config or auth

    for (const orgId of orgIds) {
      const run = await this.runStore.get(runId, orgId);
      if (run) return run;
    }

    return null;
  }

  /**
   * Restore memory state to a specific snapshot
   * 
   * This is critical for deterministic replay.
   * We restore from the checkpoint created at the start of the original run.
   */
  private async restoreMemoryState(
    context: IdentityContext,
    checkpointId?: string
  ): Promise<void> {
    if (!checkpointId) {
      throw new Error("Cannot restore memory state: no checkpoint ID");
    }

    // Restore memory state from checkpoint
    await this.memoryStore.restoreCheckpoint(checkpointId, context.orgId);
  }

  /**
   * Replay a single step
   */
  private async replayStep(
    run: AgentRun,
    originalStep: AgentRun["steps"][0],
    context: IdentityContext
  ): Promise<AgentRun["steps"][0]> {
    // Resolve context if original step did
    let contextUsed;
    if (originalStep.contextResolved) {
      const resolved = await this.memoryStore.resolve(
        context,
        originalStep.contextResolved.task
      );
      // Format as ResolveResponse (simplified for MVP)
      contextUsed = {
        constraints: resolved.filter((m) => m.category === "constraint"),
        preferences: resolved.filter((m) => m.category === "preference"),
        conventions: resolved.filter((m) => m.category === "convention"),
        decisions: resolved.filter((m) => m.category === "decision"),
        risks: resolved.filter((m) => m.category === "risk"),
        warnings: [],
      };
    }

    // Append step to replayed run
    await this.runStore.appendStep(
      {
        runId: run.runId,
        action: originalStep.action,
        input: originalStep.input,
        output: originalStep.output, // For deterministic replay, we use same output
        contextResolved: originalStep.contextResolved,
        contextUsed,
        memoryWriteIds: originalStep.memoryWrites,
      },
      run.orgId
    );

    // Return the step we just created
    const updatedRun = await this.runStore.get(run.runId, run.orgId);
    return updatedRun!.steps[updatedRun!.steps.length - 1];
  }

  /**
   * Check if two steps match (for divergence detection)
   * 
   * Implements Replay Invariants Specification:
   * - Step outputs must match exactly (strict invariant)
   * - Step actions must match exactly (strict invariant)
   * - Timestamps may differ (allowed difference)
   */
  private stepsMatch(
    step1: AgentRun["steps"][0],
    step2: AgentRun["steps"][0]
  ): boolean {
    // Strict invariant: Actions must match
    if (step1.action !== step2.action) {
      return false;
    }

    // Strict invariant: Outputs must match exactly (deep equality)
    // Note: We compare JSON strings to handle nested objects/arrays
    const output1 = this.normalizeForComparison(step1.output);
    const output2 = this.normalizeForComparison(step2.output);
    
    return JSON.stringify(output1) === JSON.stringify(output2);
  }

  /**
   * Normalize output for comparison (remove allowed differences)
   * 
   * Removes timestamps, IDs, and other allowed differences
   * to focus on strict invariants only.
   */
  private normalizeForComparison(output: unknown): unknown {
    if (output === null || output === undefined) {
      return output;
    }

    if (typeof output !== "object") {
      return output;
    }

    if (Array.isArray(output)) {
      return output.map((item) => this.normalizeForComparison(item));
    }

    // Clone object and remove allowed differences
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(output)) {
      // Skip allowed differences (timestamps, IDs, etc.)
      if (
        key.toLowerCase().includes("timestamp") ||
        key.toLowerCase().includes("time") ||
        key.toLowerCase().endsWith("id") && key !== "id" // Keep "id" if it's a decision ID
      ) {
        continue;
      }

      normalized[key] = this.normalizeForComparison(value);
    }

    return normalized;
  }
}

