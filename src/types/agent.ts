/**
 * AgentRun - The Canonical Object
 * 
 * This is the unit of value for agent memory infrastructure.
 * 
 * An AgentRun represents:
 * - A complete agent execution
 * - All decisions made during execution
 * - All memory writes
 * - All context resolutions
 * - Complete state for deterministic replay
 * 
 * This is what developers pay for.
 */

import type { ResolveRequest, ResolveResponse } from "./memory.js";
import type { IdentityContext } from "./identity.js";

/**
 * Agent execution step
 * 
 * **Phase 8: Immutability Contract**
 * - Steps are immutable after creation
 * - Steps are append-only (can't modify existing steps)
 * 
 * **Critical Invariants:**
 * - stepNumber is sequential (1, 2, 3...)
 * - stepNumber is unique within a run
 */
export interface AgentStep {
  /** Unique step ID (generated, immutable) */
  id: string;
  /** Step number (sequential: 1, 2, 3..., immutable) */
  stepNumber: number;
  /** Step timestamp (Unix timestamp, milliseconds, immutable) */
  timestamp: number;

  // What the agent did
  /** Action type (e.g., "call_tool", "make_decision", "write_memory", immutable) */
  action: string;
  /** Input to this step (immutable) */
  input?: unknown;
  /** Output from this step (immutable) */
  output?: unknown;

  // Context used
  /** Context resolution request (immutable) */
  contextResolved?: ResolveRequest;
  /** Context resolution response (immutable) */
  contextUsed?: ResolveResponse;

  // Memory written in this step
  /** IDs of MemoryEntry written in this step (immutable) */
  memoryWrites: string[];

  // Deterministic markers
  /** Model used (e.g., "gpt-4", "claude-3", immutable) */
  modelUsed?: string;
  /** Temperature setting (immutable) */
  temperature?: number;
  /** Seed for deterministic generation (immutable) */
  seed?: number;
}

/**
 * AgentRun - Complete execution record
 * 
 * **Phase 8: Immutability Contract**
 * - Runs are append-only (steps can be appended, but existing fields are immutable)
 * - Status can only transition forward (running → completed/failed/cancelled)
 * - Once completed/failed/cancelled, run cannot be modified
 * 
 * **Critical Invariants:**
 * - Steps are sequential (stepNumber 1, 2, 3...)
 * - Steps are append-only (can't modify existing steps)
 * - checkpointId is required for replay
 */
export interface AgentRun {
  /** Unique run ID (generated, immutable) */
  id: string;
  /** Organization ID (required, non-empty, immutable) */
  orgId: string;
  /** Human-readable run identifier (immutable) */
  runId: string;

  // Execution metadata
  /** Start timestamp (Unix timestamp, milliseconds, immutable) */
  startedAt: number;
  /** Completion timestamp (Unix timestamp, milliseconds, set on completion) */
  completedAt?: number;
  /** Run status (can only transition forward: running → completed/failed/cancelled) */
  status: "running" | "completed" | "failed" | "cancelled";

  // What triggered this run
  /** Task description (required, non-empty, immutable) */
  task: string;
  /** Initial identity context (immutable) */
  initialContext: IdentityContext;
  /** Initial resolution request (immutable) */
  initialRequest: ResolveRequest;

  // Execution trace
  /** Steps in execution (append-only, sequential, immutable after append) */
  steps: AgentStep[];

  // Memory state at start and end
  /** MemoryEntry IDs active at start (immutable) */
  memorySnapshotStart: string[];
  /** MemoryEntry IDs active at end (set on completion) */
  memorySnapshotEnd?: string[];
  /** Checkpoint ID for memory state at start (required for replay, immutable) */
  checkpointId?: string;

  // Deterministic replay markers
  /** Global seed for entire run (required for deterministic replay, immutable) */
  seed?: number;
  /** Model configuration (required for deterministic replay, immutable) */
  modelConfig?: {
    model: string;
    temperature: number;
    maxTokens?: number;
  };

  // Results
  /** Final output (set on completion) */
  finalOutput?: unknown;
  /** Error details (set on failure) */
  error?: {
    message: string;
    stepId: string;
    stack?: string;
  };

  // Metadata
  /** Agent framework used (e.g., "langgraph", "crewai", "custom", immutable) */
  agentFramework?: string;
  /** Schema version (for future compatibility, immutable) */
  version: number;
}

/**
 * AgentRun creation input
 * 
 * What you need to start tracking a run
 */
export interface CreateAgentRunInput {
  orgId: string;
  runId?: string; // Optional, will be generated if not provided
  task: string;
  initialContext: IdentityContext;
  initialRequest: ResolveRequest;
  seed?: number;
  modelConfig?: AgentRun["modelConfig"];
  agentFramework?: string;
}

/**
 * AgentRun update (for appending steps)
 * 
 * AgentRuns are append-only - you can only add steps
 */
export interface AppendStepInput {
  runId: string;
  action: string;
  input?: unknown;
  output?: unknown;
  contextResolved?: ResolveRequest;
  contextUsed?: ResolveResponse;
  memoryWriteIds?: string[];
}

/**
 * Replay configuration
 * 
 * For deterministic replay of an AgentRun
 */
export interface ReplayConfig {
  runId: string;
  seed?: number; // Override original seed
  modelConfig?: AgentRun["modelConfig"]; // Override model config
  stopAtStep?: number; // Replay only up to this step
}

/**
 * Replay result
 * 
 * Result of replaying an AgentRun
 */
export interface ReplayResult {
  originalRunId: string;
  replayedRunId: string;
  matched: boolean; // Did replay produce same output?
  divergenceStep?: number; // First step where replay diverged
  originalOutput: unknown;
  replayedOutput: unknown;
}

