# Continuum Definitions

**Version 1.0 (v1.x frozen) – January 2024**
Any incompatible change to these definitions requires a major version increment.

This document defines all terms used in Continuum's determinism contract. These definitions are **legally binding** and **frozen** for external review.

---

## Mental Model (Non-Normative)

**Quick overview for readers:**

Continuum guarantees deterministic replay of AI agent runs. The core idea:

1. **Capture state** - When a run starts, we create a checkpoint (snapshot of memory)
2. **Capture inputs** - We record the task, config, seed, and all agent steps
3. **Replay** - Given the same checkpoint and inputs, we produce the same outputs
4. **Detect divergence** - If outputs differ, we detect and report it

**Key concepts:**
- **Determinism** = Same inputs → same outputs (or divergence detected)
- **Agent Decision** = One step in the execution (atomic, sequential)
- **Checkpoint** = Snapshot of memory state at a point in time
- **Divergence** = Output differs from original (detected step-by-step)

**Scope:** Single-threaded, single-node, in-memory (initial implementation). No concurrency, no distribution, no durability.

**This mental model is non-normative.** The formal definitions below are what matter legally.

---

## Core Terms

### Determinism (for Continuum)

**Definition:** Determinism means that given identical inputs, memory checkpoint, and model configuration, Continuum will produce identical memory state transitions and agent decisions.

**What this means:**
- Same checkpoint + same operations → same memory state 
- Same task + same memory + same config + same seed → same agent decisions
- Identical inputs → identical outputs (or divergence detected)

**Important:** Operations are defined relative to a restored valid checkpoint; determinism applies only after successful restoration. This removes any circularity in the definition.

**What this does NOT mean:**
- Semantic equivalence (we don't guarantee LLM outputs are semantically identical)
- Performance determinism (speed may vary)
- External system determinism (APIs, file systems, etc.)

**Scope:** This applies to Continuum's kernel (MemoryStore, Resolver, AgentRunStore, ReplayEngine). It does NOT apply to external systems (LLMs, APIs, file systems).

**Reference:** This matches how databases define consistency - same inputs → same state transitions.

---

### Agent Decision

**Definition:** An agent decision is a single `AgentStep` in an `AgentRun`.

**What this means:**
- One step = one decision
- Each step has: action, input, output, memoryWrites
- Steps are sequential (stepNumber 1, 2, 3...)
- Steps are atomic (either complete or not recorded)

**What constitutes a decision:**
- One LLM call (if that's what the agent does)
- One tool invocation (if that's what the agent does)
- One composite operation (if the agent groups operations)

**Important:** The atomic unit is the `AgentStep`. What the agent does inside a step (multiple LLM calls, multiple tool calls) is not separately tracked. The step's output is what matters for replay.

**Scope:** Single-agent, single-threaded execution. No concurrency within a run.

**Reference:** This matches how event-sourced systems define events - atomic, sequential, immutable.

---

### Same Checkpoint

**Definition:** Two checkpoints are "same" if they:
1. Have identical checkpoint IDs
2. Contain identical memory entry IDs (same set, same order)
3. Were created from identical memory state
4. Have identical schema version

**What this means:**
- Checkpoint equality is defined by content, not reference
- Two checkpoints with same ID and same content are "same"
- Checkpoint validity is separate from equality (see "Valid Checkpoint")

**What this does NOT mean:**
- Same timestamp (timestamps may differ)
- Same file location (location may differ)
- Same format version (must be same schema version)

**Validation:** Checkpoints are validated on creation and restoration. Invalid checkpoints cannot be used.

**Reference:** This matches how databases define snapshot equality - same data, same schema.

---

### Same Operation

**Definition:** Two operations are "same" if they:
1. Have identical operation type (read, write, resolve)
2. Have identical parameters (keys, values, scopes)
3. Are executed in identical memory state (same checkpoint)

**What this means:**
- Operation equality is defined by inputs and state
- Same operation on same state → same result
- Operation order matters (sequential execution)

**What this does NOT mean:**
- Same timestamp (timestamps may differ)
- Same execution duration (performance may vary)
- Same memory location (implementation detail)

**Scope:** Operations are single-threaded, sequential. No concurrent operations.

**Reference:** This matches how transactional systems define operation equality - same inputs, same state.

---

### Identical Memory State

**Definition:** Two memory states are "identical" if they:
1. Contain identical memory entries (same IDs, same values)
2. Have identical entry versions (same version numbers)
3. Have identical indexes (same keys, same scopes)
4. Have identical resolution results (same context for same query)

**What this means:**
- Memory state equality is defined by content, not reference
- Two states with same entries are "identical"
- State comparison is deterministic (JSON.stringify for values)

**What this does NOT mean:**
- Same memory location (implementation detail)
- Same creation timestamps (timestamps may differ)
- Same storage format (format may differ)

**Comparison:** Memory states are compared using deep equality (JSON.stringify for values, set equality for IDs).

**Implementation Note (Non-Normative):** Value equality is implementation-defined in early versions. We use JSON.stringify for object/value comparison, which is deterministic for the data types we support. Future versions may use canonicalization (e.g., RFC 8785) for stricter equality semantics, but this does not change the determinism guarantee - it only affects how equality is computed.

Unsupported value types (e.g. functions, Symbols, BigInt) are not valid memory values.

**Reference:** This matches how databases define state equality - same data, same structure.

---

### Valid Checkpoint

**Definition:** A checkpoint is "valid" if it:
1. Exists (can be retrieved from storage)
2. Has valid format (can be parsed)
3. References memory entries that exist (all IDs are present)
4. Has compatible schema version (matches current system version)
5. Has consistent indexes (indexes match entries)

**What this means:**
- Validity is checked on creation and restoration
- Invalid checkpoints cause fatal errors (cannot replay)
- Validity is separate from equality (see "Same Checkpoint")

**What makes a checkpoint invalid:**
- Missing or corrupted file
- Unparseable format
- References deleted memory entries
- Incompatible schema version
- Corrupted indexes

**Validation:** Checkpoints are validated before use. Invalid checkpoints are rejected with clear error messages.

**Reference:** This matches how databases validate snapshots - existence, format, consistency.

---

### Memory Store Consistency

**Definition:** Memory store is "consistent" if:
1. All memory entries are accessible (can be retrieved by ID)
2. Indexes match entries (all indexed entries exist)
3. Versions are sequential (no gaps, no duplicates)
4. Scopes are valid (all scope IDs reference valid entities)

**What this means:**
- Consistency is maintained by the kernel
- Inconsistent stores cause fatal errors (cannot replay)
- Consistency is checked during operations

**What breaks consistency:**
- Deleted entries still referenced
- Corrupted indexes
- Version gaps or duplicates
- Invalid scope references

**Guarantee:** Continuum maintains consistency within a single run. External modifications (deleting entries, corrupting files) break consistency and cause fatal errors.

**Scope:** Single-threaded, single-node. No concurrent modifications.

**Reference:** This matches how databases maintain consistency - referential integrity, index consistency.

---

### Divergence

**Definition:** Divergence occurs when a strict invariant is violated during replay.

**What this means:**
- Step output differs from original
- Step order differs from original
- Memory writes differ from original
- Memory state differs from original

**What divergence is NOT:**
- Timestamps differ (allowed difference)
- Run IDs differ (allowed difference)
- Performance differs (allowed difference)
- Allowed differences (see Replay Invariants)

**Detection:** Divergence is detected step-by-step during replay. First mismatch = divergence point. Detection is synchronous and immediate.

**Accuracy:** Divergence detection has zero false positives relative to defined equality semantics (if we say it diverged, it diverged according to our equality rules). False negatives are possible if comparison logic is buggy, but we test for this.

**Reference:** This matches how databases detect inconsistency - compare expected vs actual, report first mismatch.

---

### Replay Correctness

**Definition:** Replay is "correct" if:
1. All strict invariants are satisfied (see Replay Invariants)
2. No fatal errors occurred
3. Final output matches original (if replay completed)
4. Memory state matches original (if replay completed)

**What this means:**
- Correctness is binary (correct or not)
- Correctness is verified step-by-step
- Correctness is reported clearly

**What correctness is NOT:**
- Performance matching (not guaranteed)
- Timestamp matching (not required)
- External system matching (not controlled)

**Guarantee:** If all inputs are identical and no external systems diverge, replay will be correct. If inputs differ or external systems diverge, we detect and report it.

**Reference:** This matches how databases define correctness - same inputs → same outputs, or error reported.

---

## Equality Semantics

### Floating Point Precision

**Rule:** Floating point values are compared using JavaScript's `===` operator (exact equality).

**What this means:**
- 0.1 + 0.2 === 0.3 is false (JavaScript behavior)
- We use exact equality, not approximate
- If you need approximate equality, normalize values before storing

**Impact:** Floating point values must be exactly equal for replay to match.

---

### Time Zone Handling

**Rule:** All timestamps are stored as Unix timestamps (milliseconds since epoch, UTC).

**What this means:**
- No time zone conversion
- No daylight saving time issues
- Timestamps are compared as numbers

**Impact:** Timestamps are deterministic if stored correctly.

---

### String Encoding

**Rule:** All strings are UTF-8 encoded.

**What this means:**
- No encoding conversion
- No character set issues
- Strings are compared byte-for-byte

**Impact:** String comparison is deterministic.

---

### Object Property Order

**Rule:** Object properties are compared using deep equality (JSON.stringify for values).

**What this means:**
- Property insertion order is assumed stable per ECMAScript specification (ES2015+)
- Values must match exactly
- Nested objects are compared recursively

**Note:** While JavaScript historically didn't guarantee property order, ECMAScript 2015+ specifies that string keys are ordered by insertion order, which JSON.stringify respects. This makes property order deterministic in practice.

**Implementation Note (Non-Normative):** Value equality is implementation-defined. Early versions use JSON.stringify, which is deterministic for supported types. Future versions may use canonicalization (e.g., RFC 8785) for stricter semantics, but this does not change the determinism guarantee.

**Impact:** Object comparison is deterministic if values match.

---

### Whitespace in Strings

**Rule:** Whitespace is significant (spaces, tabs, newlines are compared exactly).

**What this means:**
- "hello world" ≠ "hello  world" (different number of spaces)
- Normalize whitespace before storing if needed

**Impact:** String comparison is exact, including whitespace.

---

## Ordering Guarantees

### Step Ordering

**Rule:** Steps are totally ordered within a single run.

**What this means:**
- Steps execute sequentially (stepNumber 1, 2, 3...)
- No concurrent steps
- No reordering

**Scope:** Single-agent, single-threaded execution. No concurrency.

**Future:** If concurrency is added, ordering guarantees will be explicitly defined.

---

### Memory Write Ordering

**Rule:** Memory writes are totally ordered within a single step.

**What this means:**
- Writes happen sequentially
- No concurrent writes
- Order is deterministic (same inputs → same order)

**Scope:** Single-threaded execution. No concurrency.

---

### Operation Ordering

**Rule:** Operations are totally ordered within a single run.

**What this means:**
- Operations execute sequentially
- No concurrent operations
- Order is deterministic

**Scope:** Single-threaded execution. No concurrency.

---

## System Scope

### Single-Threaded Execution

**Rule:** Continuum executes operations sequentially, one at a time.

**What this means:**
- No concurrent operations
- No race conditions
- No locking needed

**Scope:** The initial implementation is single-threaded. Concurrency is explicitly not supported.

**Future:** If concurrency is added, guarantees will be explicitly defined.

---

### Storage Model (Implementation-Dependent)

**Rule:** Continuum's guarantees are defined independently of storage implementation.

**What this means:**
- Determinism does not depend on persistence
- Replay requires a valid checkpoint (in-memory or persistent)
- Durability depends on the selected PersistentStore implementation

**Scope:**
- Non-persistent configurations may use in-memory storage
- Production deployments may use persistent storage
- Persistence guarantees are defined in RECOVERY_GUARANTEES.md

**Note:** This document defines semantic correctness, not durability guarantees.

---

### Single-Node Execution

**Rule:** Continuum runs on a single node.

**What this means:**
- No distributed execution
- No network partitions
- No consensus needed

**Scope:** The initial implementation is single-node only. Distributed execution is explicitly not supported.

**Future:** If distributed execution is added, guarantees will be explicitly defined.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial definitions |

**If we change these definitions, we'll version them and document the changes.**

---

**These definitions are frozen for external review. They define the legal meaning of all terms in Continuum's determinism contract.**

