/**
 * Corruption Injection Testing Framework
 * 
 * Phase 6: Persistence Validation & Recovery Proof
 * 
 * Injects various corruption scenarios and validates detection/recovery behavior.
 */

import { promises as fs } from "fs";
import { join } from "path";
import { FilePersistentStore } from "../storage/persistent-store.js";
import type { MemoryEntry } from "../types/memory.js";
import type { MemoryCheckpoint } from "../types/checkpoint.js";

export interface CorruptionTestResult {
  test: string;
  passed: boolean;
  error?: string;
  details: {
    corruptionType: string;
    injectionMethod: string;
    detectionStatus: "detected" | "not-detected" | "error";
    recoveryStatus: "recovered" | "failed" | "partial" | "skipped";
    behavior: string;
  };
}

/**
 * Corruption Injection Tester
 * 
 * Injects corruption and validates detection/recovery.
 */
export class CorruptionInjectionTester {
  private baseDir: string;
  private testOrgId: string;

  constructor(baseDir: string = ".continuum-test") {
    this.baseDir = baseDir;
    this.testOrgId = "test-org";
  }

  /**
   * Test: Corrupt checkpoint checksum
   * 
   * Scenario: Modify checkpoint file checksum.
   * Expected: Checksum verification fails, checkpoint load throws error.
   */
  async testCorruptCheckpointChecksum(): Promise<CorruptionTestResult> {
    const testDir = join(this.baseDir, "corrupt-checkpoint-checksum");
    await this.cleanup(testDir);

    try {
      // Setup: Create valid checkpoint
      const store = new FilePersistentStore(testDir);
      const checkpoint = this.createTestCheckpoint("checkpoint-1");
      await store.saveCheckpoint(checkpoint);

      // Inject corruption: Modify checksum
      const checkpointPath = join(
        testDir,
        "orgs",
        this.testOrgId,
        "checkpoints",
        "checkpoint-1.json"
      );
      const content = await fs.readFile(checkpointPath, "utf-8");
      const data = JSON.parse(content);
      data.checksum = "corrupted-checksum";
      await fs.writeFile(checkpointPath, JSON.stringify(data, null, 2), "utf-8");

      // Test: Try to load checkpoint
      let detected = false;
      let error: Error | null = null;
      try {
        await store.loadCheckpoint("checkpoint-1", this.testOrgId);
      } catch (e) {
        detected = true;
        error = e as Error;
      }

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Corrupt Checkpoint Checksum",
        passed: detected,
        error: error?.message,
        details: {
          corruptionType: "Checksum mismatch",
          injectionMethod: "Modified checksum field in checkpoint file",
          detectionStatus: detected ? "detected" : "not-detected",
          recoveryStatus: detected ? "failed" : "failed", // Expected to fail
          behavior: detected
            ? `Checksum verification failed: ${error?.message}`
            : "Checksum corruption not detected",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Corrupt Checkpoint Checksum",
        passed: false,
        error: String(error),
        details: {
          corruptionType: "Checksum mismatch",
          injectionMethod: "Modified checksum field",
          detectionStatus: "error",
          recoveryStatus: "failed",
          behavior: `Error: ${error}`,
        },
      };
    }
  }

  /**
   * Test: Corrupt checkpoint JSON structure
   * 
   * Scenario: Corrupt checkpoint file JSON (invalid structure).
   * Expected: JSON parse fails, checkpoint load returns null or throws error.
   */
  async testCorruptCheckpointJSON(): Promise<CorruptionTestResult> {
    const testDir = join(this.baseDir, "corrupt-checkpoint-json");
    await this.cleanup(testDir);

    try {
      // Setup: Create valid checkpoint
      const store = new FilePersistentStore(testDir);
      const checkpoint = this.createTestCheckpoint("checkpoint-1");
      await store.saveCheckpoint(checkpoint);

      // Inject corruption: Corrupt JSON
      const checkpointPath = join(
        testDir,
        "orgs",
        this.testOrgId,
        "checkpoints",
        "checkpoint-1.json"
      );
      await fs.writeFile(checkpointPath, "{\"invalid\": json}", "utf-8");

      // Test: Try to load checkpoint
      let detected = false;
      let error: Error | null = null;
      try {
        const result = await store.loadCheckpoint("checkpoint-1", this.testOrgId);
        if (result === null) {
          detected = true; // Also valid - returns null for missing/corrupted
        }
      } catch (e) {
        detected = true;
        error = e as Error;
      }

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Corrupt Checkpoint JSON",
        passed: detected,
        error: error?.message,
        details: {
          corruptionType: "Invalid JSON structure",
          injectionMethod: "Replaced checkpoint file with invalid JSON",
          detectionStatus: detected ? "detected" : "not-detected",
          recoveryStatus: detected ? "failed" : "failed", // Expected to fail
          behavior: detected
            ? error
              ? `JSON parse error: ${error.message}`
              : "Checkpoint load returned null"
            : "Corruption not detected",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Corrupt Checkpoint JSON",
        passed: false,
        error: String(error),
        details: {
          corruptionType: "Invalid JSON structure",
          injectionMethod: "Replaced with invalid JSON",
          detectionStatus: "error",
          recoveryStatus: "failed",
          behavior: `Error: ${error}`,
        },
      };
    }
  }

  /**
   * Test: Corrupt log entry checksum
   * 
   * Scenario: Modify checksum in log entry.
   * Expected: Entry skipped during load, other entries recovered.
   */
  async testCorruptLogEntryChecksum(): Promise<CorruptionTestResult> {
    const testDir = join(this.baseDir, "corrupt-log-checksum");
    await this.cleanup(testDir);

    try {
      // Setup: Write valid entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1");
      const entry2 = this.createTestEntry("entry-2");
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      // Inject corruption: Modify checksum
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");
      const logEntry = JSON.parse(lines[1]);
      logEntry.checksum = "corrupted-checksum";
      lines[1] = JSON.stringify(logEntry);
      await fs.writeFile(logPath, lines.join("\n") + "\n", "utf-8");

      // Test: Load entries
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: entry-1 recovered, entry-2 skipped
      const detected = recoveredEntries.length === 1;
      const entry1Recovered = recoveredEntries[0]?.id === entry1.id;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Corrupt Log Entry Checksum",
        passed: detected && entry1Recovered,
        details: {
          corruptionType: "Checksum mismatch in log entry",
          injectionMethod: "Modified checksum field in log entry",
          detectionStatus: detected ? "detected" : "not-detected",
          recoveryStatus: detected && entry1Recovered ? "partial" : "failed",
          behavior: detected && entry1Recovered
            ? `Recovered 1 entry (entry-2 skipped due to checksum mismatch)`
            : "Corruption not detected or recovery failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Corrupt Log Entry Checksum",
        passed: false,
        error: String(error),
        details: {
          corruptionType: "Checksum mismatch",
          injectionMethod: "Modified checksum field",
          detectionStatus: "error",
          recoveryStatus: "failed",
          behavior: `Error: ${error}`,
        },
      };
    }
  }

  /**
   * Test: Corrupt log entry JSON
   * 
   * Scenario: Corrupt JSON in log entry (invalid structure).
   * Expected: Entry skipped during load, other entries recovered.
   */
  async testCorruptLogEntryJSON(): Promise<CorruptionTestResult> {
    const testDir = join(this.baseDir, "corrupt-log-json");
    await this.cleanup(testDir);

    try {
      // Setup: Write valid entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1");
      const entry2 = this.createTestEntry("entry-2");
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      // Inject corruption: Corrupt JSON
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");
      lines[1] = "{\"invalid\": json}"; // Invalid JSON
      await fs.writeFile(logPath, lines.join("\n") + "\n", "utf-8");

      // Test: Load entries
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: entry-1 recovered, entry-2 skipped
      const detected = recoveredEntries.length === 1;
      const entry1Recovered = recoveredEntries[0]?.id === entry1.id;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Corrupt Log Entry JSON",
        passed: detected && entry1Recovered,
        details: {
          corruptionType: "Invalid JSON structure in log entry",
          injectionMethod: "Replaced log entry line with invalid JSON",
          detectionStatus: detected ? "detected" : "not-detected",
          recoveryStatus: detected && entry1Recovered ? "partial" : "failed",
          behavior: detected && entry1Recovered
            ? `Recovered 1 entry (entry-2 skipped due to JSON parse error)`
            : "Corruption not detected or recovery failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Corrupt Log Entry JSON",
        passed: false,
        error: String(error),
        details: {
          corruptionType: "Invalid JSON structure",
          injectionMethod: "Replaced with invalid JSON",
          detectionStatus: "error",
          recoveryStatus: "failed",
          behavior: `Error: ${error}`,
        },
      };
    }
  }

  /**
   * Test: Partial log entry (incomplete write)
   * 
   * Scenario: Log entry is incomplete (cut off mid-write).
   * Expected: Entry skipped during load, other entries recovered.
   */
  async testPartialLogEntry(): Promise<CorruptionTestResult> {
    const testDir = join(this.baseDir, "partial-log-entry");
    await this.cleanup(testDir);

    try {
      // Setup: Write valid entries
      const store = new FilePersistentStore(testDir);
      const entry1 = this.createTestEntry("entry-1");
      const entry2 = this.createTestEntry("entry-2");
      
      await store.appendEntry(entry1);
      await store.appendEntry(entry2);

      // Inject corruption: Truncate last entry
      const logPath = join(testDir, "orgs", this.testOrgId, "log.jsonl");
      const content = await fs.readFile(logPath, "utf-8");
      const lines = content.trim().split("\n");
      lines[1] = lines[1].substring(0, lines[1].length - 10); // Truncate
      await fs.writeFile(logPath, lines.join("\n") + "\n", "utf-8");

      // Test: Load entries
      const recoveredEntries = await store.loadEntries(this.testOrgId);

      // Validate: entry-1 recovered, entry-2 skipped
      const detected = recoveredEntries.length === 1;
      const entry1Recovered = recoveredEntries[0]?.id === entry1.id;

      await store.close();
      await this.cleanup(testDir);

      return {
        test: "Partial Log Entry",
        passed: detected && entry1Recovered,
        details: {
          corruptionType: "Incomplete log entry (truncated)",
          injectionMethod: "Truncated last log entry line",
          detectionStatus: detected ? "detected" : "not-detected",
          recoveryStatus: detected && entry1Recovered ? "partial" : "failed",
          behavior: detected && entry1Recovered
            ? `Recovered 1 entry (entry-2 skipped due to incomplete JSON)`
            : "Corruption not detected or recovery failed",
        },
      };
    } catch (error) {
      await this.cleanup(testDir);
      return {
        test: "Partial Log Entry",
        passed: false,
        error: String(error),
        details: {
          corruptionType: "Incomplete log entry",
          injectionMethod: "Truncated entry line",
          detectionStatus: "error",
          recoveryStatus: "failed",
          behavior: `Error: ${error}`,
        },
      };
    }
  }

  /**
   * Run all corruption injection tests
   */
  async runAllTests(): Promise<CorruptionTestResult[]> {
    return [
      await this.testCorruptCheckpointChecksum(),
      await this.testCorruptCheckpointJSON(),
      await this.testCorruptLogEntryChecksum(),
      await this.testCorruptLogEntryJSON(),
      await this.testPartialLogEntry(),
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
}
