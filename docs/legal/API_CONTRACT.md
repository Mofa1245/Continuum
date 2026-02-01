# API Contract

**Production API Contract & Interface Stability**

This document defines the public API contract, invariants, error guarantees, and caller responsibilities.

**All public APIs are frozen. Breaking changes require major version bump.**

---

## Public API Surface

### Core Interfaces (Stable)

**These interfaces are public, stable, and will not change without a major version bump:**

1. **MemoryStore** (`src/engine/memory-store.ts`)
2. **AgentRunStore** (`src/engine/agent-run-store.ts`)
3. **PersistentStore** (`src/storage/persistent-store.ts`)
4. **ReplayEngine** (`src/engine/replay.ts`)
5. **Resolver** (`src/engine/resolver.ts`)

### Core Types (Stable)

**These types are public, stable, and will not change without a major version bump:**

1. **MemoryEntry** (`src/types/memory.ts`)
2. **AgentRun** (`src/types/agent.ts`)
3. **AgentStep** (`src/types/agent.ts`)
4. **MemoryCheckpoint** (`src/types/checkpoint.ts`)
5. **IdentityContext** (`src/types/identity.ts`)

### Internal APIs (Unstable)

**These are NOT part of the public API and may change without notice:**

- Concrete class implementations
- Adapter implementations
- Storage engine implementations
- Internal helper utilities
- Testing and benchmarking code

---

## Required Invariants

### MemoryStore Invariants

**Invariant 1: Append-Only**
- Memory entries are immutable after creation
- New versions create new entries, don't modify old ones
- Entry IDs are unique and never reused

**Invariant 2: Versioning**
- Versions are sequential per (orgId, key)
- Version numbers are positive integers
- Version gaps indicate deleted entries (not allowed in MVP)

**Invariant 3: Scope Hierarchy**
- Global scope applies to all orgs
- Org scope applies to all repos in org
- Repo scope applies to specific repo
- More specific overrides less specific

**Invariant 4: Deterministic Resolution**
- Same identity + same task → same context (deterministic)
- Resolution order: global → org → repo → project
- Results are sorted deterministically

**Invariant 5: Checkpoint Consistency**
- Checkpoint contains snapshot of all entries for org
- Checkpoint indexes match entries
- Checkpoint is valid if all referenced entries exist

**Caller Responsibility:**
- Don't modify entries after creation
- Don't delete entries that checkpoints reference
- Don't modify checkpoints directly

---

### AgentRunStore Invariants

**Invariant 1: Run Immutability**
- AgentRun is immutable after creation
- Steps are append-only (can't modify existing steps)
- Run status can only transition forward (running → completed/failed/cancelled)

**Invariant 2: Step Ordering**
- Steps are totally ordered (stepNumber 1, 2, 3...)
- Steps are sequential (no concurrent steps)
- Step numbers are unique within a run

**Invariant 3: Checkpoint Association**
- Every run has a checkpointId (created at start)
- Checkpoint must exist for replay
- Checkpoint belongs to same org as run

**Caller Responsibility:**
- Don't modify runs after creation
- Don't reorder steps
- Don't delete checkpoints that runs reference

---

### PersistentStore Invariants

**Invariant 1: Append-Only Log**
- Log entries are append-only (never modified)
- Each entry has checksum
- Log file grows monotonically (until compaction)

**Invariant 2: Atomic Writes**
- Checkpoints: temp file + rename (atomic)
- Log entries: append + fsync (atomic per line)
- No partial writes visible

**Invariant 3: Crash Safety**
- Crash during write: partial entry skipped, previous entries intact
- Crash during checkpoint: temp file ignored, previous checkpoints intact
- Original data preserved on failure

**Invariant 4: Compaction Safety**
- Compaction preserves final state exactly
- Compaction is atomic (temp file + rename)
- Original log preserved if compaction fails

**Caller Responsibility:**
- Don't modify log files directly
- Don't delete checkpoints during compaction
- Don't write entries during compaction (behavior undefined)

---

### ReplayEngine Invariants

**Invariant 1: Deterministic Replay**
- Same checkpoint + same config + same seed → same output
- Divergence detected if outputs differ
- Replay is step-by-step (sequential)

**Invariant 2: State Restoration**
- Memory state restored to checkpoint state
- Only org-scoped entries restored
- Indexes restored to match entries

**Invariant 3: Divergence Detection**
- Divergence detected at first mismatch
- Detection is immediate (synchronous)
- Divergence reported with step number

**Caller Responsibility:**
- Don't modify memory during replay
- Don't modify original run during replay
- Ensure checkpoint exists before replay

---

## Undefined Behavior

**These behaviors are undefined and may change without notice:**

### MemoryStore

- **Concurrent writes:** Not supported, behavior undefined
- **Modifying entries:** Not supported, behavior undefined
- **Deleting entries:** Not supported, behavior undefined
- **Schema evolution:** Not supported, behavior undefined

### AgentRunStore

- **Concurrent step appends:** Not supported, behavior undefined
- **Modifying steps:** Not supported, behavior undefined
- **Reordering steps:** Not supported, behavior undefined

### PersistentStore

- **Concurrent compaction:** Not supported, behavior undefined
- **Compaction during writes:** Not supported, behavior undefined
- **Modifying log files:** Not supported, behavior undefined

### ReplayEngine

- **Replay during writes:** Not supported, behavior undefined
- **Concurrent replays:** Not supported, behavior undefined
- **Modifying memory during replay:** Not supported, behavior undefined

**Undefined behavior may cause:**
- Data corruption
- Incorrect results
- Crashes
- Silent failures

**Don't rely on undefined behavior.**

---

## Error Guarantees

### Error Types

**1. Validation Errors**
- **When:** Invalid input (missing required fields, invalid types)
- **Guarantee:** Error thrown immediately, no state change
- **Recovery:** Fix input and retry

**2. Not Found Errors**
- **When:** Resource doesn't exist (checkpoint, run, entry)
- **Guarantee:** Error thrown, no state change
- **Recovery:** Check if resource exists, create if needed

**3. Consistency Errors**
- **When:** State inconsistency detected (corrupted checkpoint, missing entries)
- **Guarantee:** Error thrown, state may be inconsistent
- **Recovery:** Manual intervention required

**4. I/O Errors**
- **When:** Disk full, permission denied, network error
- **Guarantee:** Error thrown, partial state may exist
- **Recovery:** Fix I/O issue, retry operation

### Error Guarantees

**For all errors:**
- ✅ Error is thrown (not swallowed)
- ✅ Error message is clear and actionable
- ✅ No silent failures
- ✅ State is consistent (or error indicates inconsistency)

**For write operations:**
- ✅ Atomic: Either succeeds completely or fails completely
- ✅ No partial state on error
- ✅ Original state preserved on failure

**For read operations:**
- ✅ Never throws on missing data (returns empty/null)
- ✅ Throws on corruption (detected, not hidden)
- ✅ Returns valid data or throws error

---

## Caller Responsibilities

### MemoryStore

**Must:**
- Provide valid orgId in all operations
- Ensure entry.orgId matches identity.orgId
- Don't modify entries after creation
- Don't delete entries that checkpoints reference

**Must Not:**
- Modify entries directly
- Delete entries manually
- Create entries with duplicate IDs
- Create entries with invalid versions

---

### AgentRunStore

**Must:**
- Create run before appending steps
- Append steps sequentially (stepNumber 1, 2, 3...)
- Complete run after all steps
- Don't modify runs after creation

**Must Not:**
- Append steps out of order
- Modify existing steps
- Delete runs that are being replayed
- Create runs without checkpoints

---

### PersistentStore

**Must:**
- Close store when done (cleanup file handles)
- Compact during low-traffic periods
- Don't modify log files directly
- Don't delete checkpoints during compaction

**Must Not:**
- Modify log files directly
- Delete checkpoints manually
- Compact during heavy write load
- Rely on compaction for correctness

---

### ReplayEngine

**Must:**
- Ensure checkpoint exists before replay
- Ensure memory state is consistent
- Don't modify memory during replay
- Don't modify original run during replay

**Must Not:**
- Replay with missing checkpoint
- Replay with corrupted checkpoint
- Modify memory during replay
- Rely on replay for correctness (it's for debugging)

---

## Type Safety

**All public APIs are strongly typed:**

- ✅ TypeScript strict mode
- ✅ No `any` types in public APIs
- ✅ Readonly where applicable
- ✅ Required vs optional clearly marked

**Type violations:**
- Compile-time errors (TypeScript catches)
- Runtime errors (if types are bypassed)

---

## Versioning

**Current version:** 1.0.0

**Versioning rules:**
- MAJOR: Breaking changes (API/contract changes)
- MINOR: Backward-compatible additions
- PATCH: Bug fixes and documentation

**v1.x guarantees:**
- Public APIs are stable
- Breaking changes require v2.0.0+

---

## Stability Guarantees

### Stable (v1.x)

**These will not change without major version bump:**
- Public interfaces (MemoryStore, AgentRunStore, etc.)
- Public types (MemoryEntry, AgentRun, etc.)
- Public method signatures
- Public error types

### Unstable (Non-Core)

**These may change without notice:**
- Concrete class implementations
- Internal APIs
- Testing and benchmarking code
- Adapter implementations

---

## Summary

**Public API Contract:**
- ✅ Interfaces are stable and documented
- ✅ Invariants are explicit and enforced
- ✅ Error guarantees are clear
- ✅ Caller responsibilities are documented

**What this means:**
- You can rely on public APIs
- You must follow caller responsibilities
- Undefined behavior is documented
- Errors are guaranteed to be thrown

**This contract is frozen. Breaking changes require major version bump.**

---

**Version 1.0 - January 2024**

This contract defines the public API. Use it to build reliable integrations.
