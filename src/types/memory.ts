/**
 * Core Memory Entry Type
 * 
 * This schema will not change.
 * Everything else evolves around it.
 */

export type MemoryCategory =
  | "preference"
  | "convention"
  | "constraint"
  | "decision"
  | "risk";

export type MemorySource =
  | "explicit"    // User/agent explicitly set
  | "observed"    // Inferred from behavior
  | "inferred";   // AI-assisted inference

export type MemoryScope =
  | "global"      // System-wide
  | "org"         // Organization-wide
  | "repo";       // Repository-specific

/**
 * Memory Entry - Core data structure
 * 
 * This schema is FROZEN and will not change.
 * 
 * **Phase 8: Immutability Contract**
 * - Entries are immutable after creation (append-only invariant)
 * - Modifying entries after creation violates contract
 * - New versions create new entries, don't modify old ones
 * 
 * **Critical Invariants:**
 * - id is unique and never reused
 * - version is sequential per (orgId, key)
 * - confidence is in range [0, 1]
 */
export interface MemoryEntry {
  /** Unique entry ID (generated, never reused, immutable) */
  id: string;
  /** Organization ID (required, non-empty, immutable) */
  orgId: string;
  /** Scope level (global, org, repo, immutable) */
  scope: MemoryScope;
  /** Scope identifier (repo slug, org slug, etc., immutable) */
  scopeId?: string;

  /** Entry category (immutable) */
  category: MemoryCategory;
  /** Entry key (unique per orgId + key, immutable) */
  key: string;
  /** Entry value (typed, immutable) */
  value: string | number | boolean | object;

  /** Confidence level [0, 1] (immutable) */
  confidence: number;
  /** Source of entry (immutable) */
  source: MemorySource;

  /** Creation timestamp (Unix timestamp, milliseconds, immutable) */
  createdAt: number;
  /** Expiration timestamp (Unix timestamp, milliseconds, optional, immutable) */
  expiresAt?: number;
  /** Version number (sequential per orgId + key, immutable) */
  version: number;
}

/**
 * Identity tuple for operational identity
 */
export interface Identity {
  project?: string;
  repo?: string;
  org?: string;
  environment?: string;
  toolchain?: string;
}

/**
 * Resolution request
 */
export interface ResolveRequest {
  task: string;
  repo?: string;
  org?: string;
  project?: string;
  environment?: string;
}

/**
 * Resolution response
 */
export interface ResolveResponse {
  constraints: MemoryEntry[];
  preferences: MemoryEntry[];
  conventions: MemoryEntry[];
  decisions: MemoryEntry[];
  risks: MemoryEntry[];
  warnings: string[];
}

