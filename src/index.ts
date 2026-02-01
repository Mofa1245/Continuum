/**
 * Continuum Core
 * 
 * This is the kernel.
 * 
 * Phase 8: Public API surface is stable and documented.
 * See docs/legal/API_CONTRACT.md for contract details.
 * See docs/legal/INTERNAL_APIS.md for internal vs public APIs.
 */

// Public Types (Stable)
export * from "./types/memory.js";
export * from "./types/identity.js";
export * from "./types/agent.js";
export * from "./types/checkpoint.js";

// Public Interfaces (Stable)
export * from "./engine/memory-store.js";
export * from "./engine/agent-run-store.js";
export * from "./engine/replay.js";
export * from "./storage/persistent-store.js";

// Public Utilities (Stable)
export * from "./storage/checksum.js";

// Internal Implementations (Unstable - may change)
// Use interfaces, not implementations
export { InMemoryStore } from "./engine/memory-store.js";
export { InMemoryAgentRunStore } from "./engine/agent-run-store.js";
export { FilePersistentStore } from "./storage/persistent-store.js";
export { ReplayEngine } from "./engine/replay.js";
export { Resolver } from "./engine/resolver.js";

// Internal Adapters (Unstable - may change)
export * from "./agent/minimal-agent.js";
export * from "./integrations/index.js";

// Internal Testing Frameworks (Unstable - testing only)
// Do not use in production code
export * from "./testing/fault-injection.js";
export * from "./testing/nondeterminism-audit.js";
export * from "./testing/persistence-recovery.js";
export * from "./testing/corruption-injection.js";
export * from "./testing/compaction-validation.js";

// Internal Storage (Unstable - legacy)
export * from "./storage/index.js";

