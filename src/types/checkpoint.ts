/**
 * Memory Checkpoint Types
 * 
 * Checkpoints enable deterministic replay by capturing
 * exact memory state at a point in time.
 */

import type { MemoryEntry } from "./memory.js";

/**
 * Memory checkpoint
 * 
 * Represents a snapshot of memory state at a specific point in time.
 * Used for deterministic replay.
 * 
 * **Phase 8: Immutability Contract**
 * - Checkpoints are immutable after creation
 * - Don't modify checkpoint entries or indexes directly
 * - Checkpoint is a snapshot, not a live view
 * 
 * **Critical Invariants:**
 * - entries contains snapshot of all entries for org
 * - indexes match entries (all indexed entries exist)
 * - checkpointId is unique
 */
export interface MemoryCheckpoint {
  /** Checkpoint ID (unique, generated, immutable) */
  id: string;
  /** Organization ID (required, non-empty, immutable) */
  orgId: string;
  /** Creation timestamp (Unix timestamp, milliseconds, immutable) */
  createdAt: number;
  /** Optional description (immutable) */
  description?: string;

  // Snapshot of memory entries
  /** Snapshot of all memory entries for org (immutable snapshot, don't modify) */
  entries: Map<string, MemoryEntry>;

  // Snapshot of indexes
  /** Snapshot of indexes (immutable snapshot, don't modify) */
  indexes: {
    byOrg: Map<string, Set<string>>;
    byScope: Map<string, Set<string>>;
    byCategory: Map<string, Set<string>>;
    byKey: Map<string, Set<string>>;
  };
}

/**
 * Checkpoint creation input
 */
export interface CreateCheckpointInput {
  orgId: string;
  description?: string;
}

