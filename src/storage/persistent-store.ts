/**
 * Persistent Storage Layer
 * 
 * Phase 5B: Persistence & Durability
 * 
 * Implements:
 * - Append-only log for memory entries
 * - Checksummed checkpoints
 * - Crash consistency (write-ahead logging)
 * - Atomic writes
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import type { MemoryEntry } from "../types/memory.js";
import type { MemoryCheckpoint } from "../types/checkpoint.js";
import {
  computeObjectChecksum,
  verifyObjectChecksum,
} from "./checksum.js";
import {
  assertNonEmptyString,
} from "../utils/invariants.js";

export interface PersistentStore {
  // Memory entry operations
  appendEntry(entry: MemoryEntry): Promise<void>;
  loadEntries(orgId: string): Promise<MemoryEntry[]>;
  
  // Checkpoint operations
  saveCheckpoint(checkpoint: MemoryCheckpoint): Promise<void>;
  loadCheckpoint(checkpointId: string, orgId: string): Promise<MemoryCheckpoint | null>;
  listCheckpoints(orgId: string): Promise<string[]>;
  deleteCheckpoint(checkpointId: string, orgId: string): Promise<void>;
  
  // Compaction (Phase 7)
  compactLog(orgId: string): Promise<CompactionResult>;
  getLogSize(orgId: string): Promise<number>;
  
  // Maintenance
  close(): Promise<void>;
}

export interface CompactionResult {
  entriesBefore: number;
  entriesAfter: number;
  sizeBefore: number;
  sizeAfter: number;
  compacted: boolean;
}

/**
 * File-based persistent store
 * 
 * Structure:
 * .continuum/
 *   orgs/
 *     {orgId}/
 *       log.jsonl          # Append-only log of memory entries
 *       checkpoints/        # Checkpoint directory
 *         {checkpointId}.json
 */
export class FilePersistentStore implements PersistentStore {
  private baseDir: string;
  private logFiles: Map<string, fs.FileHandle> = new Map();

  constructor(baseDir: string = ".continuum") {
    this.baseDir = baseDir;
  }

  /**
   * Append entry to append-only log
   * 
   * Format: JSON line with checksum
   * { "entry": {...}, "checksum": "sha256..." }
   */
  async appendEntry(entry: MemoryEntry): Promise<void> {
    // Invariant: entry must have valid orgId
    assertNonEmptyString(entry.orgId, "entry.orgId must be non-empty string");
    
    // Invariant: entry must have valid id
    assertNonEmptyString(entry.id, "entry.id must be non-empty string");

    const logPath = this.getLogPath(entry.orgId);
    await this.ensureDir(logPath);

    // Open log file in append mode
    const handle = await this.getLogHandle(entry.orgId);

    // Serialize entry with checksum
    const logEntry = {
      entry,
      checksum: computeObjectChecksum(entry),
      timestamp: Date.now(),
    };

    const line = JSON.stringify(logEntry) + "\n";
    await handle.writeFile(line, null);
    await handle.sync(); // Ensure durability
  }

  /**
   * Load all entries from append-only log
   * 
   * Validates checksums and filters corrupted entries
   */
  async loadEntries(orgId: string): Promise<MemoryEntry[]> {
    const logPath = this.getLogPath(orgId);
    return this.loadEntriesFromPath(logPath);
  }

  /**
   * Load entries from a specific log path (internal helper)
   */
  private async loadEntriesFromPath(logPath: string): Promise<MemoryEntry[]> {
    try {
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n").filter((line) => line.length > 0);

      const entries: MemoryEntry[] = [];
      const corrupted: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const logEntry = JSON.parse(lines[i]) as {
            entry: MemoryEntry;
            checksum: string;
            timestamp: number;
          };

          // Verify checksum
          if (!verifyObjectChecksum(logEntry.entry, logEntry.checksum)) {
            corrupted.push(i);
            continue;
          }

          entries.push(logEntry.entry);
        } catch (error) {
          // Corrupted line
          corrupted.push(i);
        }
      }

      if (corrupted.length > 0) {
        console.warn(
          `Warning: Found ${corrupted.length} corrupted entries in log`
        );
      }

      return entries;
    } catch (error) {
      // Log file doesn't exist yet
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save checkpoint with checksum
   * 
   * Format: JSON file with checksum
   * { "checkpoint": {...}, "checksum": "sha256..." }
   */
  async saveCheckpoint(checkpoint: MemoryCheckpoint): Promise<void> {
    const checkpointPath = this.getCheckpointPath(checkpoint.id, checkpoint.orgId);
    await this.ensureDir(checkpointPath);

    // Serialize checkpoint (convert Maps/Sets to arrays for JSON)
    const serialized = this.serializeCheckpoint(checkpoint);
    const checksum = computeObjectChecksum(serialized);

    const checkpointData = {
      checkpoint: serialized,
      checksum,
      savedAt: Date.now(),
    };

    // Atomic write: write to temp file, then rename
    const tempPath = checkpointPath + ".tmp";
    await fs.writeFile(tempPath, JSON.stringify(checkpointData, null, 2), "utf-8");
    await fs.rename(tempPath, checkpointPath);
  }

  /**
   * Load checkpoint with validation
   */
  async loadCheckpoint(
    checkpointId: string,
    orgId: string
  ): Promise<MemoryCheckpoint | null> {
    const checkpointPath = this.getCheckpointPath(checkpointId, orgId);

    try {
      const content = await fs.readFile(checkpointPath, "utf-8");
      const checkpointData = JSON.parse(content) as {
        checkpoint: unknown;
        checksum: string;
        savedAt: number;
      };

      // Verify checksum
      if (!verifyObjectChecksum(checkpointData.checkpoint, checkpointData.checksum)) {
        throw new Error(`Checkpoint checksum verification failed: ${checkpointId}`);
      }

      // Deserialize checkpoint (convert arrays back to Maps/Sets)
      return this.deserializeCheckpoint(checkpointData.checkpoint);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all checkpoint IDs for an org
   */
  async listCheckpoints(orgId: string): Promise<string[]> {
    const checkpointsDir = this.getCheckpointsDir(orgId);

    try {
      const files = await fs.readdir(checkpointsDir);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(checkpointId: string, orgId: string): Promise<void> {
    const checkpointPath = this.getCheckpointPath(checkpointId, orgId);

    try {
      await fs.unlink(checkpointPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // Already deleted, ignore
        return;
      }
      throw error;
    }
  }

  /**
   * Compact log file (Phase 7)
   * 
   * Removes duplicate entries (keeps latest version per key).
   * Preserves final state exactly.
   * Atomic and crash-safe.
   * 
   * Process:
   * 1. Load all entries
   * 2. Deduplicate by key (keep latest version)
   * 3. Write to temp file
   * 4. Verify checksums
   * 5. Atomic rename (temp -> original)
   */
  async compactLog(orgId: string): Promise<CompactionResult> {
    // Invariant: orgId must be non-empty
    assertNonEmptyString(orgId, "orgId must be non-empty string");

    const logPath = this.getLogPath(orgId);
    
    // Get size before
    let sizeBefore = 0;
    try {
      const stats = await fs.stat(logPath);
      sizeBefore = stats.size;
    } catch {
      // File doesn't exist, nothing to compact
      return {
        entriesBefore: 0,
        entriesAfter: 0,
        sizeBefore: 0,
        sizeAfter: 0,
        compacted: false,
      };
    }

    // Load all entries
    const allEntries = await this.loadEntries(orgId);
    const entriesBefore = allEntries.length;

    if (entriesBefore === 0) {
      // No entries, nothing to compact
      return {
        entriesBefore: 0,
        entriesAfter: 0,
        sizeBefore,
        sizeAfter: 0,
        compacted: false,
      };
    }

    // Deduplicate by key (keep latest version)
    const deduplicated = this.deduplicateEntries(allEntries);
    const entriesAfter = deduplicated.length;

    // If no deduplication needed, skip compaction
    if (entriesBefore === entriesAfter) {
      return {
        entriesBefore,
        entriesAfter,
        sizeBefore,
        sizeAfter: sizeBefore,
        compacted: false,
      };
    }

    // Write compacted log to temp file
    const tempPath = logPath + ".tmp";
    const tempHandle = await fs.open(tempPath, "w");

    try {
      for (const entry of deduplicated) {
        const logEntry = {
          entry,
          checksum: computeObjectChecksum(entry),
          timestamp: Date.now(),
        };

        const line = JSON.stringify(logEntry) + "\n";
        await tempHandle.writeFile(line, null);
      }

      await tempHandle.sync(); // Ensure durability
      await tempHandle.close();

      // Verify temp file integrity
      const tempEntries = await this.loadEntriesFromPath(tempPath);
      if (tempEntries.length !== entriesAfter) {
        // Verification failed, don't replace
        await fs.unlink(tempPath).catch(() => {});
        throw new Error("Compaction verification failed: entry count mismatch");
      }

      // Close handle before atomic replace (Windows file locking)
      const handle = this.logFiles.get(orgId);
      if (handle) {
        await handle.close();
        this.logFiles.delete(orgId);
      }

      // Atomic replace: temp -> original
      await fs.rename(tempPath, logPath);

      // Get size after
      const stats = await fs.stat(logPath);
      const sizeAfter = stats.size;

      return {
        entriesBefore,
        entriesAfter,
        sizeBefore,
        sizeAfter,
        compacted: true,
      };
    } catch (error) {
      // Cleanup temp file on error
      await fs.unlink(tempPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Get log file size in bytes
   */
  async getLogSize(orgId: string): Promise<number> {
    const logPath = this.getLogPath(orgId);

    try {
      const stats = await fs.stat(logPath);
      return stats.size;
    } catch {
      // File doesn't exist
      return 0;
    }
  }

  /**
   * Close all file handles
   */
  async close(): Promise<void> {
    for (const handle of this.logFiles.values()) {
      await handle.close();
    }
    this.logFiles.clear();
  }

  // Private helpers

  /**
   * Deduplicate entries by key (keep latest version)
   * 
   * This preserves final state exactly - same as what loadEntries would return
   * after deduplication in memory.
   */
  private deduplicateEntries(entries: MemoryEntry[]): MemoryEntry[] {
    // Group by key (orgId + key)
    const byKey = new Map<string, MemoryEntry>();

    for (const entry of entries) {
      const key = `${entry.orgId}:${entry.key}`;
      const existing = byKey.get(key);

      if (!existing || entry.version > existing.version) {
        byKey.set(key, entry);
      }
    }

    // Return deduplicated entries in deterministic order (sorted by key)
    return Array.from(byKey.values()).sort((a, b) => {
      const keyA = `${a.orgId}:${a.key}`;
      const keyB = `${b.orgId}:${b.key}`;
      return keyA.localeCompare(keyB);
    });
  }

  private getLogPath(orgId: string): string {
    return join(this.baseDir, "orgs", orgId, "log.jsonl");
  }

  private getCheckpointsDir(orgId: string): string {
    return join(this.baseDir, "orgs", orgId, "checkpoints");
  }

  private getCheckpointPath(checkpointId: string, orgId: string): string {
    return join(this.getCheckpointsDir(orgId), `${checkpointId}.json`);
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async getLogHandle(orgId: string): Promise<fs.FileHandle> {
    if (!this.logFiles.has(orgId)) {
      const logPath = this.getLogPath(orgId);
      await this.ensureDir(logPath);
      const handle = await fs.open(logPath, "a"); // Append mode
      this.logFiles.set(orgId, handle);
    }
    return this.logFiles.get(orgId)!;
  }

  /**
   * Serialize checkpoint (Maps/Sets → arrays)
   */
  private serializeCheckpoint(checkpoint: MemoryCheckpoint): unknown {
    return {
      id: checkpoint.id,
      orgId: checkpoint.orgId,
      createdAt: checkpoint.createdAt,
      description: checkpoint.description,
      entries: Array.from(checkpoint.entries.entries()),
      indexes: {
        byOrg: Array.from(checkpoint.indexes.byOrg.entries()).map(([k, v]) => [
          k,
          Array.from(v),
        ]),
        byScope: Array.from(checkpoint.indexes.byScope.entries()).map(([k, v]) => [
          k,
          Array.from(v),
        ]),
        byCategory: Array.from(checkpoint.indexes.byCategory.entries()).map(
          ([k, v]) => [k, Array.from(v)]
        ),
        byKey: Array.from(checkpoint.indexes.byKey.entries()).map(([k, v]) => [
          k,
          Array.from(v),
        ]),
      },
    };
  }

  /**
   * Deserialize checkpoint (arrays → Maps/Sets)
   */
  private deserializeCheckpoint(serialized: unknown): MemoryCheckpoint {
    const data = serialized as {
      id: string;
      orgId: string;
      createdAt: number;
      description?: string;
      entries: [string, MemoryEntry][];
      indexes: {
        byOrg: [string, string[]][];
        byScope: [string, string[]][];
        byCategory: [string, string[]][];
        byKey: [string, string[]][];
      };
    };

    return {
      id: data.id,
      orgId: data.orgId,
      createdAt: data.createdAt,
      description: data.description,
      entries: new Map(data.entries),
      indexes: {
        byOrg: new Map(
          data.indexes.byOrg.map(([k, v]) => [k, new Set(v)])
        ),
        byScope: new Map(
          data.indexes.byScope.map(([k, v]) => [k, new Set(v)])
        ),
        byCategory: new Map(
          data.indexes.byCategory.map(([k, v]) => [k, new Set(v)])
        ),
        byKey: new Map(
          data.indexes.byKey.map(([k, v]) => [k, new Set(v)])
        ),
      },
    };
  }
}
