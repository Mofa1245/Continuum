/**
 * LangGraph Integration Adapter
 * 
 * Integrates Continuum with LangGraph agents.
 * 
 * Usage:
 * ```typescript
 * const adapter = new LangGraphAdapter(memoryStore, runStore, resolver, identity);
 * 
 * // In your LangGraph node
 * const context = await adapter.resolveContext(task);
 * const result = await llm.invoke([
 *   { role: "system", content: adapter.formatContext(context) },
 *   { role: "user", content: task }
 * ]);
 * 
 * await adapter.recordStep(runId, "llm_call", { task }, result);
 * ```
 */

import type { MemoryStore } from "../engine/memory-store.js";
import type { AgentRunStore } from "../engine/agent-run-store.js";
import type { Resolver } from "../engine/resolver.js";
import type { IdentityContext } from "../types/identity.js";
import type { ResolveResponse } from "../types/memory.js";

export interface LangGraphStep {
  action: string;
  input?: unknown;
  output?: unknown;
  nodeName?: string;
  state?: unknown;
}

/**
 * LangGraph Adapter
 * 
 * Provides Continuum integration for LangGraph agents.
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
   * Start tracking a LangGraph execution
   */
  async startRun(task: string, options?: {
    seed?: number;
    modelConfig?: { model: string; temperature: number };
  }): Promise<string> {
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
   * Resolve context for a task
   */
  async resolveContext(task: string): Promise<ResolveResponse> {
    return await this.resolver.resolve(this.identity, {
      task,
      repo: this.identity.repoId,
      org: this.identity.orgId,
    });
  }

  /**
   * Format context for injection into LLM prompt
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
        // Limit to 5 most recent
        parts.push(`- ${decision.value}`);
      }
    }

    return parts.join("\n");
  }

  /**
   * Record a step in the agent execution
   */
  async recordStep(
    runId: string,
    action: string,
    input?: unknown,
    output?: unknown,
    options?: {
      nodeName?: string;
      contextResolved?: { task: string };
      contextUsed?: ResolveResponse;
      memoryWriteIds?: string[];
    }
  ): Promise<void> {
    // Include nodeName in input if provided
    const stepInput = options?.nodeName
      ? { ...(typeof input === "object" && input !== null ? input : {}), nodeName: options.nodeName }
      : input;

    await this.runStore.appendStep(
      {
        runId,
        action: options?.nodeName ? `${options.nodeName}:${action}` : action,
        input: stepInput,
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
   * Record a LangGraph node execution
   */
  async recordNode(
    runId: string,
    nodeName: string,
    state: unknown,
    result: unknown
  ): Promise<void> {
    await this.recordStep(
      runId,
      "node_execute",
      { state },
      result,
      { nodeName }
    );
  }

  /**
   * Write memory from agent decision
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
   * Complete the run
   */
  async completeRun(
    runId: string,
    finalOutput: unknown
  ): Promise<void> {
    await this.runStore.updateStatus(
      runId,
      this.identity.orgId,
      "completed",
      finalOutput
    );
    this.currentRunId = null;
  }

  /**
   * Fail the run
   */
  async failRun(
    runId: string,
    error: Error,
    stepId?: string
  ): Promise<void> {
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

