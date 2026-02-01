/**
 * Minimal Agent Loop
 * 
 * This demonstrates how Continuum integrates into an agent execution loop.
 * 
 * Flow:
 * 1. Agent receives task
 * 2. Resolve context from Continuum
 * 3. Execute agent logic (with context)
 * 4. Record steps to AgentRun
 * 5. Write memory back to Continuum
 * 
 * This is the wedge use-case.
 */

import type { AgentRun } from "../types/agent.js";
import type { ResolveResponse } from "../types/memory.js";
import type { IdentityContext } from "../types/identity.js";
import type { MemoryStore } from "../engine/memory-store.js";
import type { AgentRunStore } from "../engine/agent-run-store.js";
import type { Resolver } from "../engine/resolver.js";

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  output: unknown;
  steps: number;
  error?: string;
}

/**
 * Minimal Agent
 * 
 * A simple agent that:
 * - Resolves context from Continuum
 * - Makes decisions based on context
 * - Records everything to AgentRun
 * - Writes memory back
 */
export class MinimalAgent {
  constructor(
    private memoryStore: MemoryStore,
    private runStore: AgentRunStore,
    private resolver: Resolver,
    private identity: IdentityContext
  ) {}

  /**
   * Execute an agent task
   * 
   * This is the main agent loop.
   */
  async execute(
    task: string,
    options?: {
      seed?: number;
      modelConfig?: AgentRun["modelConfig"];
    }
  ): Promise<AgentExecutionResult> {
    // 1. Create AgentRun
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
      agentFramework: "minimal",
    });

    try {
      // 2. Resolve context from Continuum
      const context = await this.resolver.resolve(
        this.identity,
        { task, repo: this.identity.repoId, org: this.identity.orgId }
      );

      // Record context resolution step
      await this.runStore.appendStep(
        {
          runId: run.runId,
          action: "resolve_context",
          input: { task },
          output: {
            constraints: context.constraints.length,
            preferences: context.preferences.length,
            conventions: context.conventions.length,
            warnings: context.warnings.length,
          },
          contextResolved: {
            task,
            repo: this.identity.repoId,
            org: this.identity.orgId,
          },
          contextUsed: context,
        },
        this.identity.orgId
      );

      // 3. Execute agent logic (with context)
      const result = await this.executeWithContext(task, context, run);

      // 4. Complete run
      await this.runStore.updateStatus(
        run.runId,
        this.identity.orgId,
        "completed",
        result.output
      );

      return {
        success: true,
        output: result.output,
        steps: result.steps,
      };
    } catch (error) {
      // Record error
      await this.runStore.updateStatus(
        run.runId,
        this.identity.orgId,
        "failed",
        undefined,
        {
          message: error instanceof Error ? error.message : String(error),
          stepId: run.steps[run.steps.length - 1]?.id || "unknown",
          stack: error instanceof Error ? error.stack : undefined,
        }
      );

      return {
        success: false,
        output: null,
        steps: run.steps.length,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute agent logic with resolved context
   * 
   * This is where the actual agent work happens.
   * For MVP, we simulate it, but in production this would:
   * - Call LLM with context
   * - Execute tools
   * - Make decisions
   */
  private async executeWithContext(
    task: string,
    context: ResolveResponse,
    run: AgentRun
  ): Promise<{ output: unknown; steps: number }> {
    const steps: string[] = [];

    // Step 1: Analyze constraints
    if (context.constraints.length > 0) {
      steps.push("analyze_constraints");
      await this.runStore.appendStep(
        {
          runId: run.runId,
          action: "analyze_constraints",
          input: { constraints: context.constraints },
          output: {
            count: context.constraints.length,
            summary: context.constraints.map((c) => c.value),
          },
        },
        this.identity.orgId
      );
    }

    // Step 2: Apply preferences
    if (context.preferences.length > 0) {
      steps.push("apply_preferences");
      await this.runStore.appendStep(
        {
          runId: run.runId,
          action: "apply_preferences",
          input: { preferences: context.preferences },
          output: {
            count: context.preferences.length,
            applied: context.preferences.map((p) => p.value),
          },
        },
        this.identity.orgId
      );
    }

    // Step 3: Make decision (simulated)
    const decision = await this.makeDecision(task, context);
    steps.push("make_decision");

    await this.runStore.appendStep(
      {
        runId: run.runId,
        action: "make_decision",
        input: { task, context: context.warnings },
        output: decision,
      },
      this.identity.orgId
    );

    // Step 4: Execute decision (simulated)
    const executionResult = await this.executeDecision(decision);
    steps.push("execute_decision");

    await this.runStore.appendStep(
      {
        runId: run.runId,
        action: "execute_decision",
        input: decision,
        output: executionResult,
      },
      this.identity.orgId
    );

    // Step 5: Write memory (learn from this execution)
    const memoryWriteIds = await this.writeMemory(decision, executionResult);
    if (memoryWriteIds.length > 0) {
      steps.push("write_memory");
      await this.runStore.appendStep(
        {
          runId: run.runId,
          action: "write_memory",
          input: { decision, result: executionResult },
          output: { memoryEntries: memoryWriteIds.length },
          memoryWriteIds,
        },
        this.identity.orgId
      );
    }

    return {
      output: {
        task,
        decision,
        result: executionResult,
        steps: steps.length,
      },
      steps: steps.length,
    };
  }

  /**
   * Make a decision based on task and context
   * 
   * In production, this would call an LLM.
   * For MVP, we simulate it.
   */
  private async makeDecision(
    _task: string,
    context: ResolveResponse
  ): Promise<unknown> {
    // Simulate decision-making
    // In production: LLM call with context injected
    // Task would be used to inform the decision

    const decision = {
      approach: "iterative",
      reasoning: context.warnings.length > 0
        ? `Heeding ${context.warnings.length} warnings`
        : "No warnings, proceeding",
      preferences: context.preferences.map((p) => p.value),
    };

    return decision;
  }

  /**
   * Execute the decision
   * 
   * In production, this would:
   * - Call tools
   * - Generate code
   * - Perform actions
   */
  private async executeDecision(decision: unknown): Promise<unknown> {
    // Simulate execution
    // In production: Actual tool execution

    return {
      success: true,
      executed: true,
      decision,
    };
  }

  /**
   * Write memory back to Continuum
   * 
   * This is how the agent learns and improves.
   */
  private async writeMemory(
    decision: unknown,
    result: unknown
  ): Promise<string[]> {
    const memoryIds: string[] = [];

    // Example: Learn from successful decisions
    if (
      result &&
      typeof result === "object" &&
      "success" in result &&
      result.success === true
    ) {
      // Extract approach value, ensuring it's a valid MemoryEntry value type
      let approachValue: string | number | boolean | object = "default";
      if (
        decision &&
        typeof decision === "object" &&
        decision !== null &&
        "approach" in decision
      ) {
        const approach = (decision as { approach: unknown }).approach;
        if (typeof approach === "string") {
          approachValue = approach;
        } else if (typeof approach === "number") {
          approachValue = approach;
        } else if (typeof approach === "boolean") {
          approachValue = approach;
        } else if (typeof approach === "object" && approach !== null) {
          approachValue = approach;
        } else {
          approachValue = String(approach);
        }
      }

      const memory = await this.memoryStore.write({
        orgId: this.identity.orgId,
        scope: this.identity.repoId ? "repo" : "org",
        scopeId: this.identity.repoId || this.identity.orgId,
        category: "preference",
        key: "agent.decision_approach",
        value: approachValue,
        confidence: 0.8,
        source: "observed",
      });

      memoryIds.push(memory.id);
    }

    return memoryIds;
  }
}

