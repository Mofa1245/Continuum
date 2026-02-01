/**
 * CrewAI Integration Adapter
 * 
 * Integrates Continuum with CrewAI agents.
 * 
 * Usage:
 * ```typescript
 * const adapter = new CrewAIAdapter(memoryStore, runStore, resolver, identity);
 * 
 * // In your CrewAI agent
 * const context = await adapter.resolveContext(task);
 * agent.systemPrompt += adapter.formatContext(context);
 * 
 * const result = await agent.execute(task);
 * await adapter.recordStep(runId, "agent_execute", { task }, result);
 * ```
 */

import type { MemoryStore } from "../engine/memory-store.js";
import type { AgentRunStore } from "../engine/agent-run-store.js";
import type { Resolver } from "../engine/resolver.js";
import type { IdentityContext } from "../types/identity.js";
import type { ResolveResponse } from "../types/memory.js";

export interface CrewAIStep {
  action: string;
  agentName?: string;
  task?: string;
  input?: unknown;
  output?: unknown;
}

/**
 * CrewAI Adapter
 * 
 * Provides Continuum integration for CrewAI agents.
 */
export class CrewAIAdapter {
  private currentRunId: string | null = null;

  constructor(
    private memoryStore: MemoryStore,
    private runStore: AgentRunStore,
    private resolver: Resolver,
    private identity: IdentityContext
  ) {}

  /**
   * Start tracking a CrewAI execution
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
      agentFramework: "crewai",
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
   * Format context for injection into agent system prompt
   */
  formatContext(context: ResolveResponse): string {
    const parts: string[] = [];

    parts.push("\n=== Continuum Context ===");
    parts.push("The following context comes from your organization's memory:\n");

    if (context.constraints.length > 0) {
      parts.push("CONSTRAINTS (you MUST follow these):");
      for (const constraint of context.constraints) {
        parts.push(`  - ${constraint.value}`);
      }
      parts.push("");
    }

    if (context.preferences.length > 0) {
      parts.push("PREFERENCES (you SHOULD follow these):");
      for (const preference of context.preferences) {
        parts.push(`  - ${preference.value}`);
      }
      parts.push("");
    }

    if (context.conventions.length > 0) {
      parts.push("CONVENTIONS:");
      for (const convention of context.conventions) {
        parts.push(`  - ${convention.value}`);
      }
      parts.push("");
    }

    if (context.warnings.length > 0) {
      parts.push("⚠️ WARNINGS:");
      for (const warning of context.warnings) {
        parts.push(`  - ${warning}`);
      }
      parts.push("");
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
      agentName?: string;
      task?: string;
      contextResolved?: { task: string };
      contextUsed?: ResolveResponse;
      memoryWriteIds?: string[];
    }
  ): Promise<void> {
    await this.runStore.appendStep(
      {
        runId,
        action: options?.agentName
          ? `${options.agentName}:${action}`
          : action,
        input: {
          ...(typeof input === "object" && input !== null ? input : {}),
          task: options?.task,
        },
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
   * Record an agent execution
   */
  async recordAgentExecution(
    runId: string,
    agentName: string,
    task: string,
    result: unknown
  ): Promise<void> {
    await this.recordStep(
      runId,
      "agent_execute",
      { task },
      result,
      { agentName, task }
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
      scopeId:
        options?.scope === "repo"
          ? this.identity.repoId
          : this.identity.orgId,
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
   * Fail the run
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

