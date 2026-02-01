/**
 * Persistence Recovery Testing Framework
 * 
 * Phase 6: Persistence Validation & Recovery Proof
 * 
 * Tests crash recovery and corruption scenarios.
 * Validates that persistence layer behaves exactly as specified.
 */

import { promises as fs } from "fs";
import { join } from "path";
import { FilePersistentStore } from "../storage/persistent-store.js";
import type { MemoryEntry } from "../types/memory.js";
import type { MemoryCheckpoint } from "../types/checkpoint.js";

export interface RecoveryTestResult {
  test: string;
  passed: boolean;
  error?: string;
  details: {
    scenario: string;
    expectedBehavior: string;
    actualBehavior: string;
    recoveryStatus: "recovered" | "failed" | "partial" | "detected";
  };
}

/**
 * Crash Recovery Tester
 * 
 * Tests crash scenarios and validates recovery behavior.
 */
export class CrashRecoveryTester {
  private baseDir: string;
  private testOrgId: string;

  constructor(baseDir: string = ".continuum-test") {
    this.baseDir = baseDir;
    this.testOrgId = "test-org";
  }

  /**
   * Test: Crash during log entry write
   * 
   * Scenario: Process crashes after writing to log but before fsync completes.
   * Expected: Partial write detected, previous entries intact, corrupted entry skipped.
   */
  async testCrashDuringLogWrite(): Promise<RecoveryTestResult> {
    const testDir = join(this.baseDir, "crash-log-write");
    await this.cleanup(testDir);

    try {
      // Setup: Write some valid entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1");
      const entry2 = this.createTestEntry("entry-2");
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      // Simulate crash: Corrupt the last line (partial write)
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");
      const corruptedContent = lines.slice(0, -1).join("\n") + "\n" + "{\"incomplete\":";
      await fs.writeFile(logPath, corruptedContent, "utf-8");

      // Recovery: Load entries
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: Should recover entry1, skip corrupted entry2
      const recovered = recoveredEntries.length === 1;
      const entry1Recovered = recoveredEntries[0]?.id === entry1.id;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Crash During Log Write",
        passed: recovered && entry1Recovered,
        details: {
          scenario: "Process crashes during log entry write (partial JSON)",
          expectedBehavior: "Previous entries recovered, corrupted entry skipped",
          actualBehavior: recovered && entry1Recovered
            ? `Recovered ${recoveredEntries.length} valid entry (entry-2 skipped due to partial write)`
            : `Recovery failed or invalid entries recovered`,
          recoveryStatus: recovered && entry1Recovered ? "recovered" : "failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Crash During Log Write",
        passed: false,
        error: String(error),
        details: {
          scenario: "Process crashes during log entry write",
          expectedBehavior: "Previous entries recovered, corrupted entry skipped",
          actualBehavior: `Error: ${error}`,
          recoveryStatus: "failed",
        },
      };
    }
  }

  /**
   * Test: Crash during checkpoint write
   * 
   * Scenario: Process crashes while writing checkpoint (temp file exists).
   * Expected: Temp file detected, checkpoint load fails gracefully, previous checkpoints intact.
   */
  async testCrashDuringCheckpointWrite(): Promise<RecoveryTestResult> {
    const testDir = join(this.baseDir, "crash-checkpoint-write");
    await this.cleanup(testDir);

    try {
      // Setup: Create a valid checkpoint
      const store = new FilePersistentStore(testDir);
      const checkpoint1 = this.createTestCheckpoint("checkpoint-1");
      await store.saveCheckpoint(checkpoint1);

      // Simulate crash: Create temp file (checkpoint write in progress)
      const checkpointPath = join(
        testDir,
        "orgs",
        this.testOrgId,
        "checkpoints",
        "checkpoint-2.json"
      );
      const tempPath = checkpointPath + ".tmp";
      await fs.mkdir(join(testDir, "orgs", this.testOrgId, "checkpoints"), {
        recursive: true,
      });
      await fs.writeFile(tempPath, "{\"incomplete\":", "utf-8");

      // Recovery: Try to load checkpoints
      const checkpoint1Loaded = await store.loadCheckpoint("checkpoint-1", this.testOrgId);
      const checkpoint2Loaded = await store.loadCheckpoint("checkpoint-2", this.testOrgId);

      // Validate: checkpoint-1 should load, checkpoint-2 should not (temp file only)
      const checkpoint1Recovered = checkpoint1Loaded !== null;
      const checkpoint2NotRecovered = checkpoint2Loaded === null;
      const tempFileExists = await this.fileExists(tempPath);

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Crash During Checkpoint Write",
        passed: checkpoint1Recovered && checkpoint2NotRecovered,
        details: {
          scenario: "Process crashes during checkpoint write (temp file exists)",
          expectedBehavior:
            "Previous checkpoint recovered, incomplete checkpoint not loaded, temp file remains",
          actualBehavior: checkpoint1Recovered && checkpoint2NotRecovered
            ? `Checkpoint-1 recovered, checkpoint-2 not loaded (temp file: ${tempFileExists})`
            : "Recovery failed",
          recoveryStatus: checkpoint1Recovered && checkpoint2NotRecovered
            ? "recovered"
            : "failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Crash During Checkpoint Write",
        passed: false,
        error: String(error),
        details: {
          scenario: "Process crashes during checkpoint write",
          expectedBehavior: "Previous checkpoint recovered, incomplete checkpoint not loaded",
          actualBehavior: `Error: ${error}`,
          recoveryStatus: "failed",
        },
      };
    }
  }

  /**
   * Test: Complete log corruption
   * 
   * Scenario: Entire log file is corrupted (not readable).
   * Expected: Empty entries array returned, no crash.
   */
  async testCompleteLogCorruption(): Promise<RecoveryTestResult> {
    const testDir = join(this.baseDir, "complete-log-corruption");
    await this.cleanup(testDir);

    try {
      // Setup: Create log file
      const store = new FilePersistentStore(testDir);
      const entry = this.createTestEntry("entry-1");
      await store.appendEntry(entry);

      // Corrupt: Replace entire log with garbage
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      await fs.writeFile(logPath, "not valid json\nmore garbage", "utf-8");

      // Recovery: Load entries
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: Should return empty array (all entries corrupted)
      const recovered = Array.isArray(recoveredEntries);
      const empty = recoveredEntries.length === 0;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Complete Log Corruption",
        passed: recovered && empty,
        details: {
          scenario: "Entire log file is corrupted (not readable JSON)",
          expectedBehavior: "Empty entries array returned, no crash",
          actualBehavior: recovered && empty
            ? "Empty array returned, no crash"
            : "Recovery failed or invalid entries returned",
          recoveryStatus: recovered && empty ? "recovered" : "failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Complete Log Corruption",
        passed: false,
        error: String(error),
        details: {
          scenario: "Entire log file is corrupted",
          expectedBehavior: "Empty entries array returned, no crash",
          actualBehavior: `Error: ${error}`,
          recoveryStatus: "failed",
        },
      };
    }
  }

  /**
   * Test: Missing log file
   * 
   * Scenario: Log file doesn't exist (first run or deleted).
   * Expected: Empty entries array returned, no crash.
   */
  async testMissingLogFile(): Promise<RecoveryTestResult> {
    const testDir = join(this.baseDir, "missing-log-file");
    await this.cleanup(testDir);

    try {
      // Setup: Don't create any entries
      const store = new FilePersistentStore(testDir);

      // Recovery: Load entries (file doesn't exist)
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: Should return empty array
      const recovered = Array.isArray(recoveredEntries);
      const empty = recoveredEntries.length === 0;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Missing Log File",
        passed: recovered && empty,
        details: {
          scenario: "Log file doesn't exist (first run or deleted)",
          expectedBehavior: "Empty entries array returned, no crash",
          actualBehavior: recovered && empty
            ? "Empty array returned, no crash"
            : "Recovery failed",
          recoveryStatus: recovered && empty ? "recovered" : "failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Missing Log File",
        passed: false,
        error: String(error),
        details: {
          scenario: "Log file doesn't exist",
          expectedBehavior: "Empty entries array returned, no crash",
          actualBehavior: `Error: ${error}`,
          recoveryStatus: "failed",
        },
      };
    }
  }

  /**
   * Test: Missing checkpoint file
   * 
   * Scenario: Checkpoint file doesn't exist.
   * Expected: null returned, no crash.
   */
  async testMissingCheckpointFile(): Promise<RecoveryTestResult> {
    const testDir = join(this.baseDir, "missing-checkpoint-file");
    await this.cleanup(testDir);

    try {
      // Setup: Don't create any checkpoints
      const store = new FilePersistentStore(testDir);

      // Recovery: Load checkpoint (file doesn't exist)
      const checkpoint = await store.loadCheckpoint("nonexistent", this.testOrgId);

      // Validate: Should return null
      const recovered = checkpoint === null;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Missing Checkpoint File",
        passed: recovered,
        details: {
          scenario: "Checkpoint file doesn't exist",
          expectedBehavior: "null returned, no crash",
          actualBehavior: recovered ? "null returned, no crash" : "Recovery failed",
          recoveryStatus: recovered ? "recovered" : "failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Missing Checkpoint File",
        passed: false,
        error: String(error),
        details: {
          scenario: "Checkpoint file doesn't exist",
          expectedBehavior: "null returned, no crash",
          actualBehavior: `Error: ${error}`,
          recoveryStatus: "failed",
        },
      };
    }
  }

  /**
   * Test: Checksum corruption
   * 
   * Scenario: Log entry has valid JSON but wrong checksum.
   * Expected: Entry skipped, warning logged, other entries recovered.
   */
  async testChecksumCorruption(): Promise<RecoveryTestResult> {
    const testDir = join(this.baseDir, "checksum-corruption");
    await this.cleanup(testDir);

    try {
      // Setup: Write valid entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1");
      const entry2 = this.createTestEntry("entry-2");
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      // Corrupt: Modify checksum in log
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");
      const logEntry = JSON.parse(lines[1]);
      logEntry.checksum = "wrong-checksum";
      lines[1] = JSON.stringify(logEntry);
      await fs.writeFile(logPath, lines.join("\n") + "\n", "utf-8");

      // Recovery: Load entries
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: Should recover entry1, skip entry2 (checksum mismatch)
      const recovered = recoveredEntries.length === 1;
      const entry1Recovered = recoveredEntries[0]?.id === entry1.id;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Checksum Corruption",
        passed: recovered && entry1Recovered,
        details: {
          scenario: "Log entry has valid JSON but wrong checksum",
          expectedBehavior: "Entry with wrong checksum skipped, other entries recovered",
          actualBehavior: recovered && entry1Recovered
            ? `Recovered ${recoveredEntries.length} entry (entry-2 skipped due to checksum mismatch)`
            : "Recovery failed",
          recoveryStatus: recovered && entry1Recovered ? "recovered" : "failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Checksum Corruption",
        passed: false,
        error: String(error),
        details: {
          scenario: "Log entry has wrong checksum",
          expectedBehavior: "Entry skipped, other entries recovered",
          actualBehavior: `Error: ${error}`,
          recoveryStatus: "failed",
        },
      };
    }
  }

  /**
   * Run all crash recovery tests
   */
  async runAllTests(): Promise<RecoveryTestResult[]> {
    return [
      await this.testCrashDuringLogWrite(),
      await this.testCrashDuringCheckpointWrite(),
      await this.testCompleteLogCorruption(),
      await this.testMissingLogFile(),
      await this.testMissingCheckpointFile(),
      await this.testChecksumCorruption(),
    ];
  }

  // Helper methods

  private createTestEntry(id: string): MemoryEntry {
    return {
      id,
      orgId: this.testOrgId,
      scope: "org",
      scopeId: this.testOrgId,
      category: "preference",
      key: `test.${id}`,
      value: `value-${id}`,
      confidence: 0.9,
      source: "explicit",
      version: 1,
      createdAt: Date.now(),
    };
  }

  private createTestCheckpoint(id: string): MemoryCheckpoint {
    return {
      id,
      orgId: this.testOrgId,
      createdAt: Date.now(),
      description: `Test checkpoint ${id}`,
      entries: new Map(),
      indexes: {
        byOrg: new Map(),
        byScope: new Map(),
        byCategory: new Map(),
        byKey: new Map(),
      },
    };
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
