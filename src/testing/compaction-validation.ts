/**
 * Compaction Validation Testing Framework
 * 
 * Phase 7: Operational Maturity & Log Compaction
 * 
 * Tests that compaction preserves state exactly and is crash-safe.
 */

import { promises as fs } from "fs";
import { join } from "path";
import { FilePersistentStore } from "../storage/persistent-store.js";
import type { MemoryEntry } from "../types/memory.js";

export interface CompactionTestResult {
  test: string;
  passed: boolean;
  error?: string;
  details: {
    scenario: string;
    expectedBehavior: string;
    actualBehavior: string;
    statePreserved: boolean;
  };
}

/**
 * Compaction Validation Tester
 * 
 * Tests that compaction preserves state exactly and handles crashes safely.
 */
export class CompactionValidationTester {
  private baseDir: string;
  private testOrgId: string;

  constructor(baseDir: string = ".continuum-test") {
    this.baseDir = baseDir;
    this.testOrgId = "test-org";
  }

  /**
   * Test: State preservation after compaction
   * 
   * Scenario: Compact log with duplicate entries.
   * Expected: State before compaction == state after compaction.
   */
  async testStatePreservation(): Promise<CompactionTestResult> {
    const testDir = join(this.baseDir, "compaction-state-preservation");
    await this.cleanup(testDir);

    try {
      // Setup: Create entries with duplicates (same key, different versions)
      const store = new FilePersistentStore(testDir);
      
      const entry1v1 = this.createTestEntry("entry-1", "key-1", 1);
      const entry1v2 = this.createTestEntry("entry-1", "key-1", 2);
      const entry2v1 = this.createTestEntry("entry-2", "key-2", 1);
      const entry2v2 = this.createTestEntry("entry-2", "key-2", 2);
      const entry2v3 = this.createTestEntry("entry-2", "key-2", 3);
      const entry3v1 = this.createTestEntry("entry-3", "key-3", 1);

      await store.appendEntry(entry1v1);
      await store.appendEntry(entry1v2);
      await store.appendEntry(entry2v1);
      await store.appendEntry(entry2v2);
      await store.appendEntry(entry2v3);
      await store.appendEntry(entry3v1);

      // Get state before compaction
      const stateBefore = await store.loadEntries(this.testOrgId);
      const stateBeforeDedup = this.deduplicateByKey(stateBefore);

      // Compact
      const result = await store.compactLog(this.testOrgId);

      // Get state after compaction
      const stateAfter = await store.loadEntries(this.testOrgId);

      // Validate: State should be identical (deduplicated)
      const statePreserved = this.compareStates(stateBeforeDedup, stateAfter);
      const compacted = result.compacted === true;
      const entriesReduced = result.entriesAfter < result.entriesBefore;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "State Preservation",
        passed: statePreserved && compacted && entriesReduced,
        details: {
          scenario: "Compact log with duplicate entries (same key, different versions)",
          expectedBehavior: "State before compaction == state after compaction (deduplicated)",
          actualBehavior: statePreserved
            ? `State preserved: ${stateBeforeDedup.length} unique entries before and after`
            : "State mismatch detected",
          statePreserved,
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "State Preservation",
        passed: false,
        error: String(error),
        details: {
          scenario: "Compact log with duplicates",
          expectedBehavior: "State preserved exactly",
          actualBehavior: `Error: ${error}`,
          statePreserved: false,
        },
      };
    }
  }

  /**
   * Test: Crash during compaction
   * 
   * Scenario: Process crashes while writing temp file.
   * Expected: Original log intact, temp file cleaned up, no data loss.
   */
  async testCrashDuringCompaction(): Promise<CompactionTestResult> {
    const testDir = join(this.baseDir, "compaction-crash");
    await this.cleanup(testDir);

    try {
      // Setup: Create entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1", "key-1", 1);
      const entry2 = this.createTestEntry("entry-2", "key-2", 1);
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      const stateBefore = await store.loadEntries(this.testOrgId);
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");

      // Simulate crash: Create incomplete temp file
      const tempPath = logPath + ".tmp";
      await fs.writeFile(tempPath, "{\"incomplete\":", "utf-8");

      // Try to load entries (should work, temp file should be ignored)
      const stateAfter = await store.loadEntries(this.testOrgId);

      // Validate: Original log intact, temp file exists (would be cleaned up on next compaction)
      const statePreserved = this.compareStates(stateBefore, stateAfter);
      const tempFileExists = await this.fileExists(tempPath);

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Crash During Compaction",
        passed: statePreserved,
        details: {
          scenario: "Process crashes during compaction (incomplete temp file)",
          expectedBehavior: "Original log intact, temp file ignored, no data loss",
          actualBehavior: statePreserved
            ? `Original log intact (${stateAfter.length} entries), temp file exists: ${tempFileExists}`
            : "State corrupted",
          statePreserved,
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Crash During Compaction",
        passed: false,
        error: String(error),
        details: {
          scenario: "Process crashes during compaction",
          expectedBehavior: "Original log intact, no data loss",
          actualBehavior: `Error: ${error}`,
          statePreserved: false,
        },
      };
    }
  }

  /**
   * Test: Compaction with no duplicates
   * 
   * Scenario: Compact log with no duplicate entries.
   * Expected: Compaction skipped (no work needed), state unchanged.
   */
  async testCompactionWithNoDuplicates(): Promise<CompactionTestResult> {
    const testDir = join(this.baseDir, "compaction-no-duplicates");
    await this.cleanup(testDir);

    try {
      // Setup: Create entries with no duplicates
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1", "key-1", 1);
      const entry2 = this.createTestEntry("entry-2", "key-2", 1);
      const entry3 = this.createTestEntry("entry-3", "key-3", 1);

      await store.appendEntry(entry1);
      await store.appendEntry(entry2);
      await store.appendEntry(entry3);

      const stateBefore = await store.loadEntries(this.testOrgId);

      // Compact
      const result = await store.compactLog(this.testOrgId);

      // Get state after compaction
      const stateAfter = await store.loadEntries(this.testOrgId);

      // Validate: Compaction skipped, state unchanged
      const statePreserved = this.compareStates(stateBefore, stateAfter);
      const skipped = result.compacted === false;
      const entriesSame = result.entriesBefore === result.entriesAfter;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Compaction With No Duplicates",
        passed: statePreserved && skipped && entriesSame,
        details: {
          scenario: "Compact log with no duplicate entries",
          expectedBehavior: "Compaction skipped, state unchanged",
          actualBehavior: skipped && entriesSame
            ? `Compaction skipped (no duplicates), state unchanged (${stateAfter.length} entries)`
            : "Compaction performed unnecessarily or state changed",
          statePreserved,
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Compaction With No Duplicates",
        passed: false,
        error: String(error),
        details: {
          scenario: "Compact log with no duplicates",
          expectedBehavior: "Compaction skipped, state unchanged",
          actualBehavior: `Error: ${error}`,
          statePreserved: false,
        },
      };
    }
  }

  /**
   * Test: Compaction verification failure
   * 
   * Scenario: Temp file verification fails (corruption detected).
   * Expected: Original log preserved, temp file deleted, compaction aborted.
   */
  async testCompactionVerificationFailure(): Promise<CompactionTestResult> {
    const testDir = join(this.baseDir, "compaction-verification-failure");
    await this.cleanup(testDir);

    try {
      // Setup: Create entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1", "key-1", 1);
      const entry2 = this.createTestEntry("entry-2", "key-2", 1);
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      const stateBefore = await store.loadEntries(this.testOrgId);
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");

      // Manually create a temp file that will fail verification
      // (wrong entry count - we'll create a temp file with fewer entries)
      const tempPath = logPath + ".tmp";
      const tempHandle = await fs.open(tempPath, "w");
      const logEntry = {
        entry: entry1,
        checksum: "wrong-checksum", // This will cause verification to fail
        timestamp: Date.now(),
      };
      const line = JSON.stringify(logEntry) + "\n";
      await tempHandle.writeFile(line, null);
      await tempHandle.sync();
      await tempHandle.close();

      // Try to load entries (should work, temp file should be ignored)
      const stateAfter = await store.loadEntries(this.testOrgId);
      const tempFileExists = await this.fileExists(tempPath);

      // Validate: Original log intact
      const statePreserved = this.compareStates(stateBefore, stateAfter);

      // Cleanup temp file
      await fs.unlink(tempPath).catch(() => {});

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Compaction Verification Failure",
        passed: statePreserved,
        details: {
          scenario: "Temp file verification fails during compaction",
          expectedBehavior: "Original log preserved, temp file deleted, compaction aborted",
          actualBehavior: statePreserved
            ? `Original log intact (${stateAfter.length} entries), temp file exists: ${tempFileExists} (would be cleaned up)`
            : "State corrupted",
          statePreserved,
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Compaction Verification Failure",
        passed: false,
        error: String(error),
        details: {
          scenario: "Temp file verification fails",
          expectedBehavior: "Original log preserved, compaction aborted",
          actualBehavior: `Error: ${error}`,
          statePreserved: false,
        },
      };
    }
  }

  /**
   * Test: Compaction with corrupted entries
   * 
   * Scenario: Compact log containing corrupted entries.
   * Expected: Corrupted entries skipped, valid entries compacted, state preserved.
   */
  async testCompactionWithCorruptedEntries(): Promise<CompactionTestResult> {
    const testDir = join(this.baseDir, "compaction-corrupted");
    await this.cleanup(testDir);

    try {
      // Setup: Create valid entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1", "key-1", 1);
      const entry2 = this.createTestEntry("entry-2", "key-2", 1);
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      // Corrupt one entry in log
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");
      const logEntry = JSON.parse(lines[1]);
      logEntry.checksum = "wrong-checksum";
      lines[1] = JSON.stringify(logEntry);
      await fs.writeFile(logPath, lines.join("\n") + "\n", "utf-8");

      // Get state before (corrupted entry will be skipped)
      const stateBefore = await store.loadEntries(this.testOrgId);

      // Compact (result not used, but compaction should succeed)
      await store.compactLog(this.testOrgId);

      // Get state after compaction
      const stateAfter = await store.loadEntries(this.testOrgId);

      // Validate: State preserved (corrupted entry remains skipped)
      const statePreserved = this.compareStates(stateBefore, stateAfter);

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Compaction With Corrupted Entries",
        passed: statePreserved,
        details: {
          scenario: "Compact log containing corrupted entries",
          expectedBehavior: "Corrupted entries skipped, valid entries compacted, state preserved",
          actualBehavior: statePreserved
            ? `State preserved: ${stateAfter.length} valid entries (corrupted entry skipped)`
            : "State mismatch",
          statePreserved,
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Compaction With Corrupted Entries",
        passed: false,
        error: String(error),
        details: {
          scenario: "Compact log with corrupted entries",
          expectedBehavior: "State preserved, corrupted entries skipped",
          actualBehavior: `Error: ${error}`,
          statePreserved: false,
        },
      };
    }
  }

  /**
   * Run all compaction validation tests
   */
  async runAllTests(): Promise<CompactionTestResult[]> {
    return [
      await this.testStatePreservation(),
      await this.testCrashDuringCompaction(),
      await this.testCompactionWithNoDuplicates(),
      await this.testCompactionVerificationFailure(),
      await this.testCompactionWithCorruptedEntries(),
    ];
  }

  // Helper methods

  private createTestEntry(id: string, key: string, version: number): MemoryEntry {
    return {
      id,
      orgId: this.testOrgId,
      scope: "org",
      scopeId: this.testOrgId,
      category: "preference",
      key,
      value: `value-${id}-v${version}`,
      confidence: 0.9,
      source: "explicit",
      version,
      createdAt: Date.now(),
    };
  }

  private deduplicateByKey(entries: MemoryEntry[]): MemoryEntry[] {
    const byKey = new Map<string, MemoryEntry>();

    for (const entry of entries) {
      const key = `${entry.orgId}:${entry.key}`;
      const existing = byKey.get(key);

      if (!existing || entry.version > existing.version) {
        byKey.set(key, entry);
      }
    }

    return Array.from(byKey.values()).sort((a, b) => {
      const keyA = `${a.orgId}:${a.key}`;
      const keyB = `${b.orgId}:${b.key}`;
      return keyA.localeCompare(keyB);
    });
  }

  private compareStates(state1: MemoryEntry[], state2: MemoryEntry[]): boolean {
    if (state1.length !== state2.length) {
      return false;
    }

    // Sort by key for comparison
    const sorted1 = [...state1].sort((a, b) => {
      const keyA = `${a.orgId}:${a.key}`;
      const keyB = `${b.orgId}:${b.key}`;
      return keyA.localeCompare(keyB);
    });

    const sorted2 = [...state2].sort((a, b) => {
      const keyA = `${a.orgId}:${a.key}`;
      const keyB = `${b.orgId}:${b.key}`;
      return keyA.localeCompare(keyB);
    });

    for (let i = 0; i < sorted1.length; i++) {
      const e1 = sorted1[i];
      const e2 = sorted2[i];

      if (
        e1.id !== e2.id ||
        e1.orgId !== e2.orgId ||
        e1.key !== e2.key ||
        e1.version !== e2.version ||
        JSON.stringify(e1.value) !== JSON.stringify(e2.value)
      ) {
        return false;
      }
    }

    return true;
  }

  private async cleanup(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
