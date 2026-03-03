/**
 * Storage Layer
 * 
 * Cold storage + indexes
 * 
 * MVP: File-based (JSON)
 * Production: Replace with DB (Postgres + Redis for indexes)
 * 
 * Phase 5B: PersistentStore for append-only log and checkpoints
 */

import type { MemoryEntry } from "../types/memory.js";
import { promises as fs } from "fs";
import { join, dirname } from "path";

// Re-export persistent store
export { FilePersistentStore, type PersistentStore } from "./persistent-store.js";
export { computeChecksum, verifyChecksum, computeObjectChecksum, verifyObjectChecksum } from "./checksum.js";
export { FileRunStore, type RunStore, type DeterministicRun } from "./RunStore.js";

export interface Storage {
  write(entry: MemoryEntry): Promise<void>;
  read(filters: {
    orgId: string;
    scope?: MemoryEntry["scope"];
    scopeId?: string;
  }): Promise<MemoryEntry[]>;
  close(): Promise<void>;
}

/**
 * File-based storage for MVP
 * 
 * Structure:
 * .continuum/
 *   orgs/
 *     {orgId}/
 *       global.json
 *       org.json
 *       repos/
 *         {repoId}.json
 */
export class FileStorage implements Storage {
  private baseDir: string;

  constructor(baseDir: string = ".continuum") {
    this.baseDir = baseDir;
  }

  async write(entry: MemoryEntry): Promise<void> {
    const filePath = this.getFilePath(entry);
    await this.ensureDir(filePath);

    // Append-only: read existing, add new entry
    const existing = await this.readFile(filePath);
    existing.push(entry);

    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
  }

  async read(filters: {
    orgId: string;
    scope?: MemoryEntry["scope"];
    scopeId?: string;
  }): Promise<MemoryEntry[]> {
    const filePath = this.getFilePathForScope(
      filters.orgId,
      filters.scope || "global",
      filters.scopeId
    );

    try {
      return await this.readFile(filePath);
    } catch (error) {
      // File doesn't exist yet
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    // No-op for file storage
  }

  private getFilePath(entry: MemoryEntry): string {
    return this.getFilePathForScope(entry.orgId, entry.scope, entry.scopeId);
  }

  private getFilePathForScope(
    orgId: string,
    scope: MemoryEntry["scope"],
    scopeId?: string
  ): string {
    const orgDir = join(this.baseDir, "orgs", orgId);

    if (scope === "global") {
      return join(orgDir, "global.json");
    }

    if (scope === "org") {
      return join(orgDir, "org.json");
    }

    if (scope === "repo" && scopeId) {
      return join(orgDir, "repos", `${scopeId}.json`);
    }

    throw new Error(`Invalid scope: ${scope}`);
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async readFile(filePath: string): Promise<MemoryEntry[]> {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as MemoryEntry[];
  }
}

