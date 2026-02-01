/**
 * LangGraph Reference Adapter
 * 
 * ⚠️ NON-CORE ⚠️
 * 
 * This adapter is NOT part of the Continuum core system.
 * This adapter is NOT covered by Continuum stability guarantees.
 * This adapter may change or be removed without notice.
 * 
 * Purpose:
 * - Demonstrates how to integrate Continuum with LangGraph
 * - Shows deterministic run recording, checkpoint persistence, and replay
 * - Provides a reference implementation for understanding Continuum usage
 * 
 * What this adapter does:
 * - Maps LangGraph node executions to Continuum AgentSteps
 * - Records agent decisions and memory writes
 * - Enables deterministic replay of LangGraph workflows
 * 
 * What this adapter does NOT guarantee:
 * - Stability (may change without version bump)
 * - Completeness (may not cover all LangGraph features)
 * - Performance (not optimized)
 * - Correctness (best-effort implementation)
 * 
 * Use this adapter as a reference, not as production code.
 * Build your own adapter based on your specific needs.
 */

import type { MemoryStore } from "../../engine/memory-store.js";
import type { AgentRunStore } from "../../engine/agent-run-store.js";
import type { Resolver } from "../../engine/resolver.js";
import type { IdentityContext } from "../../types/identity.js";
import type { ResolveResponse } from "../../types/memory.js";

/**
 * LangGraph Reference Adapter
 * 
 * Maps LangGraph concepts to Continuum:
 * - LangGraph workflow → Continuum AgentRun
 * - LangGraph node → Continuum AgentStep
 * - LangGraph state → Continuum memory context
 * 
 * This adapter uses ONLY public Continuum interfaces:
 * - MemoryStore (public interface)
 * - AgentRunStore (public interface)
 * - Resolver (public class)
 * 
 * This adapter does NOT:
 * - Extend core behavior
 * - Modify core semantics
 * - Add new guarantees
 * - Change existing behavior
 */
export class LangGraphAdapter {
  private currentRunId: string | null = null;

  constructor(
    private memoryStore: MemoryStore,
    private runStore: AgentRunStore,
    private resolver: Resolver,
    private identity: IdentityContext
  ) {}

  /**
   * Start tracking a LangGraph workflow execution
   * 
   * Creates a Continuum AgentRun that will track all LangGraph nodes.
   * A checkpoint is automatically created at run start (for replay).
   */
  async startRun(
    task: string,
    options?: {
      seed?: number;
      modelConfig?: { model: string; temperature: number };
    }
  ): Promise<string> {
    const run = await this.runStore.create({
      orgId: this.identity.orgId,
      task,
      initialContext: this.identity,
      initialRequest: {
        task,
        repo: this.identity.repoId,
        org: this.identity.orgId,
      },
      seed: options?.seed,
      modelConfig: options?.modelConfig,
      agentFramework: "langgraph",
    });

    this.currentRunId = run.runId;
    return run.runId;
  }

  /**
   * Resolve context for a LangGraph task
   * 
   * Retrieves relevant memory entries (constraints, preferences, conventions)
   * that should influence the LangGraph workflow execution.
   */
  async resolveContext(task: string): Promise<ResolveResponse> {
    return await this.resolver.resolve(this.identity, {
      task,
      repo: this.identity.repoId,
      org: this.identity.orgId,
    });
  }

  /**
   * Format context for injection into LangGraph node prompts
   * 
   * Converts Continuum ResolveResponse into a formatted string
   * suitable for inclusion in LLM system prompts.
   */
  formatContext(context: ResolveResponse): string {
    const parts: string[] = [];

    parts.push("# Continuum Context\n");
    parts.push("This context contains constraints, preferences, and conventions from your organization's memory.\n");

    if (context.constraints.length > 0) {
      parts.push("\n## Constraints (MUST FOLLOW)");
      for (const constraint of context.constraints) {
        parts.push(`- ${constraint.value}`);
        if (constraint.confidence < 0.8) {
          parts.push(`  (confidence: ${(constraint.confidence * 100).toFixed(0)}%)`);
        }
      }
    }

    if (context.preferences.length > 0) {
      parts.push("\n## Preferences (SHOULD FOLLOW)");
      for (const preference of context.preferences) {
        parts.push(`- ${preference.value}`);
        if (preference.confidence < 0.8) {
          parts.push(`  (confidence: ${(preference.confidence * 100).toFixed(0)}%)`);
        }
      }
    }

    if (context.conventions.length > 0) {
      parts.push("\n## Conventions");
      for (const convention of context.conventions) {
        parts.push(`- ${convention.value}`);
      }
    }

    if (context.warnings.length > 0) {
      parts.push("\n## ⚠️ Warnings");
      for (const warning of context.warnings) {
        parts.push(`- ${warning}`);
      }
    }

    if (context.decisions.length > 0) {
      parts.push("\n## Previous Decisions");
      for (const decision of context.decisions.slice(0, 5)) {
        parts.push(`- ${decision.value}`);
      }
    }

    return parts.join("\n");
  }

  /**
   * Record a LangGraph node execution as a Continuum AgentStep
   * 
   * Maps LangGraph node execution to Continuum step tracking.
   * This enables deterministic replay of LangGraph workflows.
   */
  async recordNode(
    runId: string,
    nodeName: string,
    input: unknown,
    output: unknown,
    options?: {
      contextResolved?: { task: string };
      contextUsed?: ResolveResponse;
      memoryWriteIds?: string[];
    }
  ): Promise<void> {
    await this.runStore.appendStep(
      {
        runId,
        action: `langgraph_node:${nodeName}`,
        input: { nodeName, input },
        output,
        contextResolved: options?.contextResolved
          ? {
              task: options.contextResolved.task,
              repo: this.identity.repoId,
              org: this.identity.orgId,
            }
          : undefined,
        contextUsed: options?.contextUsed,
        memoryWriteIds: options?.memoryWriteIds,
      },
      this.identity.orgId
    );
  }

  /**
   * Write memory from LangGraph agent decision
   * 
   * Records agent decisions as Continuum MemoryEntry instances.
   * These entries can be retrieved in future runs via resolveContext().
   */
  async writeMemory(
    key: string,
    value: string | number | boolean | object,
    options?: {
      category?: "preference" | "convention" | "decision";
      confidence?: number;
      scope?: "org" | "repo";
    }
  ): Promise<string> {
    const memory = await this.memoryStore.write({
      orgId: this.identity.orgId,
      scope: options?.scope || (this.identity.repoId ? "repo" : "org"),
      scopeId: options?.scope === "repo" ? this.identity.repoId : this.identity.orgId,
      category: options?.category || "decision",
      key,
      value,
      confidence: options?.confidence || 0.8,
      source: "observed",
    });

    return memory.id;
  }

  /**
   * Complete the LangGraph workflow run
   * 
   * Marks the AgentRun as completed with final output.
   */
  async completeRun(runId: string, finalOutput: unknown): Promise<void> {
    await this.runStore.updateStatus(
      runId,
      this.identity.orgId,
      "completed",
      finalOutput
    );
    this.currentRunId = null;
  }

  /**
   * Fail the LangGraph workflow run
   * 
   * Marks the AgentRun as failed with error details.
   */
  async failRun(runId: string, error: Error, stepId?: string): Promise<void> {
    await this.runStore.updateStatus(
      runId,
      this.identity.orgId,
      "failed",
      undefined,
      {
        message: error.message,
        stepId: stepId || "unknown",
        stack: error.stack,
      }
    );
    this.currentRunId = null;
  }

  /**
   * Get current run ID (if tracking)
   */
  getCurrentRunId(): string | null {
    return this.currentRunId;
  }
}
