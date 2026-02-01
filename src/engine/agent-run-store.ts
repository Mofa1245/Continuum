/**
 * AgentRunStore
 * 
 * Stores and retrieves AgentRuns.
 * 
 * This is built on top of the MemoryStore kernel.
 * AgentRuns are stored as MemoryEntries with category="decision"
 * and special structure in the value field.
 * 
 * This keeps everything in the same append-only log.
 */

import type {
  AgentRun,
  CreateAgentRunInput,
  AppendStepInput,
} from "../types/agent.js";
import type { MemoryStore } from "./memory-store.js";
import {
  assertInvariant,
  assertNonEmptyString,
} from "../utils/invariants.js";

export interface AgentRunStore {
  create(input: CreateAgentRunInput): Promise<AgentRun>;
  get(runId: string, orgId: string): Promise<AgentRun | null>;
  list(filters: {
    orgId: string;
    status?: AgentRun["status"];
    limit?: number;
  }): Promise<AgentRun[]>;
  appendStep(input: AppendStepInput, orgId: string): Promise<AgentRun>;
  updateStatus(
    runId: string,
    orgId: string,
    status: AgentRun["status"],
    finalOutput?: unknown,
    error?: AgentRun["error"]
  ): Promise<AgentRun>;
}

/**
 * In-memory implementation for MVP
 * 
 * AgentRuns are stored as:
 * - Main run record: MemoryEntry with key="agent_run:{runId}"
 * - Steps: MemoryEntry with key="agent_run:{runId}:step:{stepNumber}"
 * 
 * This allows us to use the existing MemoryStore kernel.
 */
export class InMemoryAgentRunStore implements AgentRunStore {
  private runs: Map<string, AgentRun> = new Map();
  private runsByOrg: Map<string, Set<string>> = new Map();

  constructor(private memoryStore: MemoryStore) {}

  async create(input: CreateAgentRunInput): Promise<AgentRun> {
    // Invariant: orgId must be non-empty
    assertNonEmptyString(input.orgId, "orgId must be non-empty string");
    
    // Invariant: task must be non-empty
    assertNonEmptyString(input.task, "task must be non-empty string");
    
    // Invariant: initialContext.orgId must match input.orgId
    assertInvariant(
      input.initialContext.orgId === input.orgId,
      "initialContext.orgId must match input.orgId"
    );

    const runId = input.runId || this.generateRunId();
    const id = this.generateId();
    const now = Date.now();

    // Create memory checkpoint at start
    const checkpoint = await this.memoryStore.createCheckpoint({
      orgId: input.orgId,
      description: `AgentRun start: ${runId}`,
    });

    // Get initial memory snapshot
    const initialMemory = await this.memoryStore.resolve(
      input.initialContext,
      input.initialRequest.task
    );
    const memorySnapshotStart = initialMemory.map((m) => m.id);

    const run: AgentRun = {
      id,
      orgId: input.orgId,
      runId,
      startedAt: now,
      status: "running",
      task: input.task,
      initialContext: input.initialContext,
      initialRequest: input.initialRequest,
      steps: [],
      memorySnapshotStart,
      seed: input.seed,
      modelConfig: input.modelConfig,
      agentFramework: input.agentFramework,
      version: 1,
    };

    // Store checkpoint ID in run
    run.checkpointId = checkpoint.id;

    // Store in memory
    this.runs.set(this.getKey(runId, input.orgId), run);

    // Index by org
    if (!this.runsByOrg.has(input.orgId)) {
      this.runsByOrg.set(input.orgId, new Set());
    }
    this.runsByOrg.get(input.orgId)!.add(runId);

    // Also store as MemoryEntry for persistence
    await this.persistRun(run);

    return run;
  }

  async get(runId: string, orgId: string): Promise<AgentRun | null> {
    const key = this.getKey(runId, orgId);
    return this.runs.get(key) || null;
  }

  async list(filters: {
    orgId: string;
    status?: AgentRun["status"];
    limit?: number;
  }): Promise<AgentRun[]> {
    const runIds = this.runsByOrg.get(filters.orgId) || new Set();
    const runs: AgentRun[] = [];

    for (const runId of runIds) {
      const run = await this.get(runId, filters.orgId);
      if (run && (!filters.status || run.status === filters.status)) {
        runs.push(run);
      }
    }

    // Sort by startedAt descending
    runs.sort((a, b) => b.startedAt - a.startedAt);

    if (filters.limit) {
      return runs.slice(0, filters.limit);
    }

    return runs;
  }

  async appendStep(
    input: AppendStepInput,
    orgId: string
  ): Promise<AgentRun> {
    const run = await this.get(input.runId, orgId);
    if (!run) {
      throw new Error(`Run not found: ${input.runId}`);
    }

    if (run.status !== "running") {
      throw new Error(`Cannot append step to ${run.status} run`);
    }

    const step: AgentRun["steps"][0] = {
      id: this.generateId(),
      stepNumber: run.steps.length + 1,
      timestamp: Date.now(),
      action: input.action,
      input: input.input,
      output: input.output,
      contextResolved: input.contextResolved,
      contextUsed: input.contextUsed,
      memoryWrites: input.memoryWriteIds || [],
    };

    run.steps.push(step);

    // Persist step
    await this.persistStep(run, step);

    return run;
  }

  async updateStatus(
    runId: string,
    orgId: string,
    status: AgentRun["status"],
    finalOutput?: unknown,
    error?: AgentRun["error"]
  ): Promise<AgentRun> {
    const run = await this.get(runId, orgId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    run.status = status;
    if (status === "completed" || status === "failed") {
      run.completedAt = Date.now();
    }
    if (finalOutput !== undefined) {
      run.finalOutput = finalOutput;
    }
    if (error) {
      run.error = error;
    }

    // Get final memory snapshot
    if (status === "completed") {
      const finalMemory = await this.memoryStore.resolve(
        run.initialContext,
        run.initialRequest.task
      );
      run.memorySnapshotEnd = finalMemory.map((m) => m.id);
    }

    // Persist updated run
    await this.persistRun(run);

    return run;
  }

  /**
   * Persist AgentRun as MemoryEntry
   * 
   * This is how we use the existing kernel.
   */
  private async persistRun(run: AgentRun): Promise<void> {
    await this.memoryStore.write({
      orgId: run.orgId,
      scope: "org",
      scopeId: run.orgId,
      category: "decision",
      key: `agent_run:${run.runId}`,
      value: run,
      confidence: 1.0,
      source: "explicit",
    });
  }

  /**
   * Persist step as MemoryEntry
   */
  private async persistStep(
    run: AgentRun,
    step: AgentRun["steps"][0]
  ): Promise<void> {
    await this.memoryStore.write({
      orgId: run.orgId,
      scope: "org",
      scopeId: run.orgId,
      category: "decision",
      key: `agent_run:${run.runId}:step:${step.stepNumber}`,
      value: step,
      confidence: 1.0,
      source: "explicit",
    });
  }

  private getKey(runId: string, orgId: string): string {
    return `${orgId}:${runId}`;
  }

  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

