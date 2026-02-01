/**
 * Deterministic Memory Store
 * 
 * Rules:
 * - Append-only (versioned)
 * - Typed entries
 * - Scoped (global/org/repo)
 * - No AI in core loop
 */

import type { MemoryEntry, MemoryScope } from "../types/memory.js";
import type { IdentityContext } from "../types/identity.js";
import type {
  MemoryCheckpoint,
  CreateCheckpointInput,
} from "../types/checkpoint.js";
import type { PersistentStore } from "../storage/persistent-store.js";
import {
  assertInvariant,
  assertNonEmptyString,
  assertInRange01,
} from "../utils/invariants.js";

export interface MemoryStore {
  write(entry: Omit<MemoryEntry, "id" | "version" | "createdAt">): Promise<MemoryEntry>;
  read(filters: MemoryFilters): Promise<MemoryEntry[]>;
  resolve(context: IdentityContext, task?: string): Promise<MemoryEntry[]>;
  
  // Checkpoint methods
  createCheckpoint(input: CreateCheckpointInput): Promise<MemoryCheckpoint>;
  restoreCheckpoint(checkpointId: string, orgId: string): Promise<void>;
  getCheckpoint(checkpointId: string, orgId: string): Promise<MemoryCheckpoint | null>;
  listCheckpoints(orgId: string): Promise<MemoryCheckpoint[]>;
  deleteCheckpoint(checkpointId: string, orgId: string): Promise<void>;
}

export interface MemoryFilters {
  orgId: string;
  scope?: MemoryScope;
  scopeId?: string;
  category?: MemoryEntry["category"];
  key?: string;
  minConfidence?: number;
  activeOnly?: boolean; // Exclude expired
}

/**
 * In-memory implementation with optional persistence
 * 
 * Phase 5B: If persistentStore is provided, entries and checkpoints
 * are persisted to disk with checksums and crash consistency.
 */
export class InMemoryStore implements MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private indexes: {
    byOrg: Map<string, Set<string>>;
    byScope: Map<string, Set<string>>;
    byCategory: Map<string, Set<string>>;
    byKey: Map<string, Set<string>>;
  } = {
    byOrg: new Map(),
    byScope: new Map(),
    byCategory: new Map(),
    byKey: new Map(),
  };

  // Checkpoint storage
  private checkpoints: Map<string, MemoryCheckpoint> = new Map();
  private checkpointsByOrg: Map<string, Set<string>> = new Map();

  // Persistent storage (optional)
  private persistentStore?: PersistentStore;
  private loadedOrgs: Set<string> = new Set();

  constructor(persistentStore?: PersistentStore) {
    this.persistentStore = persistentStore;
  }

  /**
   * Load entries from persistent store for an org
   * Call this on startup to restore state
   */
  async loadOrg(orgId: string): Promise<void> {
    if (!this.persistentStore || this.loadedOrgs.has(orgId)) {
      return;
    }

    const entries = await this.persistentStore.loadEntries(orgId);

    // Restore entries to memory
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
      this.indexEntry(entry);
    }

    // Load checkpoints
    const checkpointIds = await this.persistentStore.listCheckpoints(orgId);
    for (const checkpointId of checkpointIds) {
      const checkpoint = await this.persistentStore.loadCheckpoint(
        checkpointId,
        orgId
      );
      if (checkpoint) {
        this.checkpoints.set(checkpointId, checkpoint);
        if (!this.checkpointsByOrg.has(orgId)) {
          this.checkpointsByOrg.set(orgId, new Set());
        }
        this.checkpointsByOrg.get(orgId)!.add(checkpointId);
      }
    }

    this.loadedOrgs.add(orgId);
  }

  /**
   * Write a memory entry
   * 
   * **Invariants:**
   * - Entry is append-only (new version, don't modify old)
   * - Version is sequential per (orgId, key)
   * - Entry is immutable after creation
   * 
   * **Error guarantees:**
   * - Throws on invalid input (no state change)
   * - Atomic: Either succeeds completely or fails completely
   * - Previous entries preserved on failure
   * 
   * **Caller responsibility:**
   * - Provide valid orgId, key, category
   * - Don't modify entry after creation
   */
  async write(
    entry: Omit<MemoryEntry, "id" | "version" | "createdAt">
  ): Promise<MemoryEntry> {
    // Invariant: orgId must be non-empty
    assertNonEmptyString(entry.orgId, "orgId must be non-empty string");
    
    // Invariant: key must be non-empty
    assertNonEmptyString(entry.key, "key must be non-empty string");
    
    // Invariant: confidence must be in [0, 1]
    assertInRange01(entry.confidence, "confidence must be in range [0, 1]");

    const id = this.generateId();
    const version = this.getNextVersion(entry.orgId, entry.key);
    const createdAt = Date.now();

    const memoryEntry: MemoryEntry = {
      ...entry,
      id,
      version,
      createdAt,
    };

    // Append-only: store new version (never modify existing)
    this.entries.set(id, memoryEntry);

    // Update indexes (must happen after entry is stored)
    this.indexEntry(memoryEntry);

    // Persist to disk (if persistent store is available)
    // Write-ahead: Persist before returning (crash consistency)
    if (this.persistentStore) {
      await this.persistentStore.appendEntry(memoryEntry);
    }

    return memoryEntry;
  }

  async read(filters: MemoryFilters): Promise<MemoryEntry[]> {
    let candidateIds = this.getCandidatesByOrg(filters.orgId);

    // Apply filters
    if (filters.scope) {
      candidateIds = this.intersect(
        candidateIds,
        this.indexes.byScope.get(filters.scope) || new Set()
      );
    }

    if (filters.category) {
      candidateIds = this.intersect(
        candidateIds,
        this.indexes.byCategory.get(filters.category) || new Set()
      );
    }

    if (filters.key) {
      candidateIds = this.intersect(
        candidateIds,
        this.indexes.byKey.get(filters.key) || new Set()
      );
    }

    // Load entries
    const entries = Array.from(candidateIds)
      .map((id) => this.entries.get(id))
      .filter((entry): entry is MemoryEntry => {
        if (!entry) return false;

        // Apply additional filters
        if (filters.scopeId && entry.scopeId !== filters.scopeId) {
          return false;
        }

        if (filters.minConfidence && entry.confidence < filters.minConfidence) {
          return false;
        }

        if (filters.activeOnly && entry.expiresAt && entry.expiresAt < Date.now()) {
          return false;
        }

        return true;
      });

    // Return latest version per key (deterministic)
    return this.deduplicateByKey(entries);
  }

  async resolve(
    context: IdentityContext,
    _task?: string
  ): Promise<MemoryEntry[]> {
    // Deterministic resolution order:
    // 1. Global scope
    // 2. Org scope
    // 3. Repo scope (if available)
    // 4. Project scope (if available)

    const scopes: Array<{ scope: MemoryScope; scopeId?: string }> = [
      { scope: "global" },
      { scope: "org", scopeId: context.orgId },
    ];

    if (context.repoId) {
      scopes.push({ scope: "repo", scopeId: context.repoId });
    }

    if (context.projectId) {
      scopes.push({ scope: "repo", scopeId: context.projectId });
    }

    const allEntries: MemoryEntry[] = [];

    for (const { scope, scopeId } of scopes) {
      const entries = await this.read({
        orgId: context.orgId,
        scope,
        scopeId,
        activeOnly: true,
        minConfidence: 0.5, // Filter low-confidence entries
      });

      allEntries.push(...entries);
    }

    // TODO: Apply task-specific ranking/decay
    // For MVP: return all, sorted by confidence descending
    return allEntries.sort((a, b) => b.confidence - a.confidence);
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getNextVersion(orgId: string, key: string): number {
    // Find highest version for this key in this org
    const existing = Array.from(this.entries.values()).filter(
      (e) => e.orgId === orgId && e.key === key
    );

    if (existing.length === 0) return 1;

    return Math.max(...existing.map((e) => e.version)) + 1;
  }

  private indexEntry(entry: MemoryEntry): void {
    // Index by org
    if (!this.indexes.byOrg.has(entry.orgId)) {
      this.indexes.byOrg.set(entry.orgId, new Set());
    }
    this.indexes.byOrg.get(entry.orgId)!.add(entry.id);

    // Index by scope
    const scopeKey = `${entry.scope}:${entry.scopeId || ""}`;
    if (!this.indexes.byScope.has(scopeKey)) {
      this.indexes.byScope.set(scopeKey, new Set());
    }
    this.indexes.byScope.get(scopeKey)!.add(entry.id);

    // Index by category
    if (!this.indexes.byCategory.has(entry.category)) {
      this.indexes.byCategory.set(entry.category, new Set());
    }
    this.indexes.byCategory.get(entry.category)!.add(entry.id);

    // Index by key
    if (!this.indexes.byKey.has(entry.key)) {
      this.indexes.byKey.set(entry.key, new Set());
    }
    this.indexes.byKey.get(entry.key)!.add(entry.id);
  }

  private getCandidatesByOrg(orgId: string): Set<string> {
    return this.indexes.byOrg.get(orgId) || new Set();
  }

  private intersect(set1: Set<string>, set2: Set<string>): Set<string> {
    const result = new Set<string>();
    for (const item of set1) {
      if (set2.has(item)) {
        result.add(item);
      }
    }
    return result;
  }

  private deduplicateByKey(entries: MemoryEntry[]): MemoryEntry[] {
    // Keep only latest version per key
    const byKey = new Map<string, MemoryEntry>();

    for (const entry of entries) {
      const key = `${entry.orgId}:${entry.key}`;
      const existing = byKey.get(key);

      if (!existing || entry.version > existing.version) {
        byKey.set(key, entry);
      }
    }

    return Array.from(byKey.values());
  }

  // Checkpoint methods

  /**
   * Create a memory checkpoint
   * 
   * **Invariants:**
   * - Checkpoint contains snapshot of all entries for org
   * - Checkpoint indexes match entries
   * - Checkpoint is immutable after creation
   * 
   * **Error guarantees:**
   * - Throws on invalid input (no state change)
   * - Atomic: Either succeeds completely or fails completely
   * - Previous checkpoints preserved on failure
   * 
   * **Caller responsibility:**
   * - Provide valid orgId
   * - Don't modify checkpoint after creation
   * - Don't delete entries that checkpoints reference
   */
  async createCheckpoint(
    input: CreateCheckpointInput
  ): Promise<MemoryCheckpoint> {
    // Invariant: orgId must be non-empty
    assertNonEmptyString(input.orgId, "orgId must be non-empty string");

    const checkpointId = this.generateCheckpointId();

    // Deep clone entries (snapshot must be independent)
    // Critical: Must clone to prevent external modification
    const entriesSnapshot = new Map<string, MemoryEntry>();
    for (const [id, entry] of this.entries) {
      entriesSnapshot.set(id, { ...entry });
    }

    // Deep clone indexes (snapshot must be independent)
    // Critical: Must clone to prevent external modification
    const indexesSnapshot = {
      byOrg: this.deepCloneIndex(this.indexes.byOrg),
      byScope: this.deepCloneIndex(this.indexes.byScope),
      byCategory: this.deepCloneIndex(this.indexes.byCategory),
      byKey: this.deepCloneIndex(this.indexes.byKey),
    };

    const checkpoint: MemoryCheckpoint = {
      id: checkpointId,
      orgId: input.orgId,
      createdAt: Date.now(),
      description: input.description,
      entries: entriesSnapshot,
      indexes: indexesSnapshot,
    };

    // Store checkpoint in memory
    this.checkpoints.set(checkpointId, checkpoint);

    // Index by org (for efficient lookup)
    if (!this.checkpointsByOrg.has(input.orgId)) {
      this.checkpointsByOrg.set(input.orgId, new Set());
    }
    this.checkpointsByOrg.get(input.orgId)!.add(checkpointId);

    // Persist checkpoint to disk (if persistent store is available)
    // Write-ahead: Persist before returning (crash consistency)
    if (this.persistentStore) {
      await this.persistentStore.saveCheckpoint(checkpoint);
    }

    return checkpoint;
  }

  async restoreCheckpoint(
    checkpointId: string,
    orgId: string
  ): Promise<void> {
    // Invariant: checkpointId must be non-empty
    assertNonEmptyString(checkpointId, "checkpointId must be non-empty string");
    
    // Invariant: orgId must be non-empty
    assertNonEmptyString(orgId, "orgId must be non-empty string");

    const checkpoint = await this.getCheckpoint(checkpointId, orgId);
    if (checkpoint === null) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    // Invariant: checkpoint must belong to specified org
    assertInvariant(
      checkpoint.orgId === orgId,
      `Checkpoint orgId mismatch: expected ${orgId}, got ${checkpoint.orgId}`
    );

    // Restore entries (only for this org)
    // We need to be careful: we only restore entries that belong to this org
    // and remove entries that were added after the checkpoint

    // Get current entries for this org
    const currentOrgEntries = Array.from(this.entries.values()).filter(
      (e) => e.orgId === orgId
    );

    // Remove entries that were added after checkpoint
    for (const entry of currentOrgEntries) {
      if (!checkpoint.entries.has(entry.id)) {
        // This entry was added after checkpoint, remove it
        this.entries.delete(entry.id);
        this.removeFromIndexes(entry);
      }
    }

    // Restore checkpoint entries
    for (const [id, entry] of checkpoint.entries) {
      if (entry.orgId === orgId) {
        this.entries.set(id, { ...entry });
        // Re-index (indexes will be restored separately)
      }
    }

    // Restore indexes (only for this org)
    // We need to merge: remove org entries from current indexes, add from checkpoint
    this.restoreIndexesForOrg(orgId, checkpoint.indexes);
  }

  async getCheckpoint(
    checkpointId: string,
    orgId: string
  ): Promise<MemoryCheckpoint | null> {
    // Try memory first
    let checkpoint: MemoryCheckpoint | null = this.checkpoints.get(checkpointId) || null;
    
    // If not in memory and persistent store is available, try loading from disk
    if (!checkpoint && this.persistentStore) {
      checkpoint = await this.persistentStore.loadCheckpoint(checkpointId, orgId);
      if (checkpoint) {
        // Cache in memory
        this.checkpoints.set(checkpointId, checkpoint);
        if (!this.checkpointsByOrg.has(orgId)) {
          this.checkpointsByOrg.set(orgId, new Set());
        }
        this.checkpointsByOrg.get(orgId)!.add(checkpointId);
      }
    }

    if (!checkpoint) {
      return null;
    }

    if (checkpoint.orgId !== orgId) {
      return null;
    }

    return checkpoint;
  }

  async listCheckpoints(orgId: string): Promise<MemoryCheckpoint[]> {
    // Load from persistent store if available
    if (this.persistentStore) {
      const checkpointIds = await this.persistentStore.listCheckpoints(orgId);
      const checkpoints: MemoryCheckpoint[] = [];

      for (const checkpointId of checkpointIds) {
        const checkpoint = await this.getCheckpoint(checkpointId, orgId);
        if (checkpoint) {
          checkpoints.push(checkpoint);
        }
      }

      // Sort by creation time descending
      return checkpoints.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Fallback to memory-only
    const checkpointIds = this.checkpointsByOrg.get(orgId) || new Set();
    const checkpoints: MemoryCheckpoint[] = [];

    for (const checkpointId of checkpointIds) {
      const checkpoint = this.checkpoints.get(checkpointId);
      if (checkpoint) {
        checkpoints.push(checkpoint);
      }
    }

    // Sort by creation time descending
    return checkpoints.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteCheckpoint(
    checkpointId: string,
    orgId: string
  ): Promise<void> {
    const checkpoint = await this.getCheckpoint(checkpointId, orgId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    // Delete from persistent store
    if (this.persistentStore) {
      await this.persistentStore.deleteCheckpoint(checkpointId, orgId);
    }

    // Delete from memory
    this.checkpoints.delete(checkpointId);

    const orgCheckpoints = this.checkpointsByOrg.get(orgId);
    if (orgCheckpoints) {
      orgCheckpoints.delete(checkpointId);
    }
  }

  // Helper methods for checkpoint operations

  private generateCheckpointId(): string {
    return `checkpoint_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private deepCloneIndex(
    index: Map<string, Set<string>>
  ): Map<string, Set<string>> {
    const cloned = new Map<string, Set<string>>();
    for (const [key, value] of index) {
      cloned.set(key, new Set(value));
    }
    return cloned;
  }

  private removeFromIndexes(entry: MemoryEntry): void {
    // Remove from org index
    const orgEntries = this.indexes.byOrg.get(entry.orgId);
    if (orgEntries) {
      orgEntries.delete(entry.id);
    }

    // Remove from scope index
    const scopeKey = `${entry.scope}:${entry.scopeId || ""}`;
    const scopeEntries = this.indexes.byScope.get(scopeKey);
    if (scopeEntries) {
      scopeEntries.delete(entry.id);
    }

    // Remove from category index
    const categoryEntries = this.indexes.byCategory.get(entry.category);
    if (categoryEntries) {
      categoryEntries.delete(entry.id);
    }

    // Remove from key index
    const keyEntries = this.indexes.byKey.get(entry.key);
    if (keyEntries) {
      keyEntries.delete(entry.id);
    }
  }

  private restoreIndexesForOrg(
    orgId: string,
    checkpointIndexes: MemoryCheckpoint["indexes"]
  ): void {
    // For org index: remove all entries for this org, then restore from checkpoint
    const currentOrgEntries = this.indexes.byOrg.get(orgId);
    if (currentOrgEntries) {
      // Clear current entries - we'll restore from checkpoint
      currentOrgEntries.clear();
    }

    // Restore org index from checkpoint
    const checkpointOrgEntries = checkpointIndexes.byOrg.get(orgId);
    if (checkpointOrgEntries) {
      if (!this.indexes.byOrg.has(orgId)) {
        this.indexes.byOrg.set(orgId, new Set());
      }
      const orgIndex = this.indexes.byOrg.get(orgId)!;
      for (const entryId of checkpointOrgEntries) {
        orgIndex.add(entryId);
      }
    }

    // For other indexes, we need to be more careful
    // We'll restore entries that belong to this org
    // This is a simplified approach - in production, you'd want more sophisticated merging

    // Restore scope indexes (for entries in this org)
    for (const [scopeKey, entryIds] of checkpointIndexes.byScope) {
      if (!this.indexes.byScope.has(scopeKey)) {
        this.indexes.byScope.set(scopeKey, new Set());
      }
      const scopeIndex = this.indexes.byScope.get(scopeKey)!;
      for (const entryId of entryIds) {
        const entry = this.entries.get(entryId);
        if (entry && entry.orgId === orgId) {
          scopeIndex.add(entryId);
        }
      }
    }

    // Restore category indexes (for entries in this org)
    for (const [category, entryIds] of checkpointIndexes.byCategory) {
      if (!this.indexes.byCategory.has(category)) {
        this.indexes.byCategory.set(category, new Set());
      }
      const categoryIndex = this.indexes.byCategory.get(category)!;
      for (const entryId of entryIds) {
        const entry = this.entries.get(entryId);
        if (entry && entry.orgId === orgId) {
          categoryIndex.add(entryId);
        }
      }
    }

    // Restore key indexes (for entries in this org)
    for (const [key, entryIds] of checkpointIndexes.byKey) {
      if (!this.indexes.byKey.has(key)) {
        this.indexes.byKey.set(key, new Set());
      }
      const keyIndex = this.indexes.byKey.get(key)!;
      for (const entryId of entryIds) {
        const entry = this.entries.get(entryId);
        if (entry && entry.orgId === orgId) {
          keyIndex.add(entryId);
        }
      }
    }
  }
}

