/**
 * Filesystem-backed RunStore for deterministic run snapshots.
 * Pure storage layer: no business logic. Node + fs only.
 */

import { promises as fs } from "fs";
import path from "path";

/**
 * Execution recipe for re-running a deterministic workflow from stored metadata.
 * This is the minimal contract required for universal replay.
 */
export interface ExecutionRecipe {
  /** High-level task identifier (e.g. "llm-demo", "ai-debug-demo"). */
  task: string;
  /** Provider identifier (e.g. "openai", "mock", "internal"). */
  provider: string;
  /** Model identifier (e.g. "gpt-4o-mini", "deterministic-runner"). */
  model: string;
  /** Temperature used for generation (0 for deterministic or engine-internal tasks). */
  temperature: number;
  /** Optional max tokens hint when applicable. */
  maxTokens?: number;
  /** Optional system prompt or instructions, if applicable. */
  systemPrompt?: string;
  /**
   * Optional task-specific configuration.
   * Specific commands can store whatever they need under this field.
   */
  config?: Record<string, unknown>;
}

/**
 * Serializable snapshot of a deterministic run for persistence and replay.
 * Stored as /runs/{runId}.json.
 */
export interface DeterministicRun {
  runId: string;
  /** How this run was executed originally (used for recipe-based replay). */
  recipe: ExecutionRecipe;
  /** Top-level input for the run (e.g. prompt string). */
  input: unknown;
  /** Phase outputs keyed by phase name. */
  stepOutputs: Record<string, unknown>;
  /** Run start timestamp. */
  timestamp: number;
  /** Ordered phase names for this run (used for diff ordering). */
  phases: string[];
  metadata: {
    seed?: number;
    modelConfig?: unknown;
    taskId?: string;
    agentId?: string;
  };
  status: string;
  checkpointId?: string;
}

export interface RunStore {
  save(run: DeterministicRun): Promise<void>;
  load(runId: string): Promise<DeterministicRun>;
  exists(runId: string): Promise<boolean>;
  listRuns(): Promise<string[]>;
}

/**
 * RunStore implementation using the filesystem.
 * Creates /runs if it does not exist.
 */
export class FileRunStore implements RunStore {
  private readonly runsDir: string;

  constructor(baseDir: string = "runs") {
    this.runsDir = path.resolve(process.cwd(), baseDir);
  }

  async save(run: DeterministicRun): Promise<void> {
    await fs.mkdir(this.runsDir, { recursive: true });
    const filePath = path.join(this.runsDir, `${run.runId}.json`);
    await fs.writeFile(
      filePath,
      JSON.stringify(run, null, 2),
      "utf-8"
    );
  }

  async load(runId: string): Promise<DeterministicRun> {
    const filePath = path.join(this.runsDir, `${runId}.json`);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as DeterministicRun;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new Error(`Run not found: ${runId}`);
      }
      throw err;
    }
  }

  async exists(runId: string): Promise<boolean> {
    const filePath = path.join(this.runsDir, `${runId}.json`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listRuns(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.runsDir, { withFileTypes: true });
      const runIds = entries
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map((e) => e.name.replace(/\.json$/, ""));
      return runIds.sort();
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        return [];
      }
      throw err;
    }
  }
}
