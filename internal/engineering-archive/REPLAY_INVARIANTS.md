# Replay Invariants

What must match on replay, what can differ, and what counts as divergence.

This is the legal definition of deterministic replay.

---

## The Core Principle

Replay must produce identical agent decisions and memory state when given identical inputs, memory checkpoint, and model configuration.

That's it. Everything else comes from this.

---

## What Must Match (Strict Invariants)

These must be identical between original and replay.

### Memory State

- Memory entries at start (checkpoint guarantees this)
- Memory entries after each step (deterministic memory writes)
- Memory entry versions (append-only versioning)
- Memory entry IDs (deterministic ID generation)
- Memory indexes (derived from entries)

**If this breaks:** Fatal error - replay is invalid

### Agent Decisions

- Step actions (agent behavior must be deterministic)
- Step inputs (same inputs → same decisions)
- Step outputs (core value proposition)
- Step order (sequential execution)
- Step count (no extra or missing steps)

**If this breaks:** Divergence detected - replay failed

### Context Resolution

- Resolved constraints (memory state is identical)
- Resolved preferences (memory state is identical)
- Resolved conventions (memory state is identical)
- Resolved decisions (memory state is identical)
- Resolved risks (memory state is identical)
- Warnings generated (derived from constraints/risks)

**If this breaks:** Fatal error - memory resolution is broken

### Memory Writes

- Memory write keys (agent decisions are identical)
- Memory write values (agent decisions are identical)
- Memory write categories (agent decisions are identical)
- Memory write order (sequential execution)
- Memory write count (no extra or missing writes)

**If this breaks:** Divergence detected - agent behavior changed

---

## What Can Differ (Allowed Differences)

These may differ without invalidating replay.

### Execution Metadata

- Run ID (new run, new ID - obviously)
- Timestamps (time is external)
- Execution duration (performance varies)
- Step timestamps (time is external)

**Note:** These differences are expected. They don't indicate divergence.

### External Dependencies

- Token usage (LLM non-determinism, even with seed)
- API call timestamps (external systems)
- Network latency (external systems)
- File system timestamps (external systems)

**Note:** External calls should be mocked in replay for true determinism.

### Non-Critical Outputs

- Log messages (not part of agent decision)
- Debug information (not part of agent decision)
- Performance metrics (not part of agent decision)
- Error stack traces (format may vary, message must match)

**Note:** Error messages must match, but stack trace formatting may differ.

---

## Divergence Detection

### What Divergence Means

Divergence occurs when a strict invariant is violated.

### How We Detect It

1. **Step-by-step comparison**
   - Compare each step in order
   - First mismatch = divergence point
   - Report step number and what diverged

2. **Output comparison**
   - Deep equality check (JSON.stringify)
   - Handle nested objects and arrays
   - Ignore allowed differences (timestamps, IDs)

3. **Memory comparison**
   - Compare memory state after each step
   - Check entries, versions, and indexes
   - Report first memory divergence

### Divergence Severity

**Fatal:** Memory state mismatch, context resolution mismatch → Replay is invalid, cannot continue

**Divergence:** Step output mismatch, step order mismatch → Replay failed, report divergence

**Warning:** Allowed difference detected, performance degradation → Log but continue

---

## Error Classification

### Fatal Errors (Replay Cannot Continue)

1. **Checkpoint not found**
   - Original run has no checkpoint
   - Checkpoint was deleted
   - Checkpoint is corrupted

2. **Memory restoration failure**
   - Cannot restore from checkpoint
   - Memory state is inconsistent
   - Index corruption detected

3. **Context resolution failure**
   - Cannot resolve context
   - Memory entries are missing
   - Resolution logic error

4. **Schema mismatch**
   - AgentRun schema changed
   - MemoryEntry schema changed
   - Incompatible version

### Warnings (Replay Continues)

1. **Performance degradation**
   - Replay is slower than original
   - Memory operations are slow
   - Index rebuild required

2. **Allowed differences detected**
   - Timestamps differ (expected)
   - Run IDs differ (expected)
   - External calls differ (expected if mocked)

3. **Partial replay**
   - Replay stopped early (stopAtStep)
   - Some steps not replayed
   - Final output not compared

### Divergence (Replay Failed)

1. **Step output mismatch**
   - Agent decision changed
   - Output structure changed
   - Output values changed

2. **Step order mismatch**
   - Steps executed in different order
   - Steps missing
   - Extra steps added

3. **Memory write mismatch**
   - Different memory written
   - Memory written in different order
   - Memory not written when expected

---

## Consistency Levels

**Level 1: Memory Consistency**
- Memory state matches exactly
- Required for memory integrity

**Level 2: Decision Consistency**
- Agent decisions match exactly
- Required for replay correctness

**Level 3: Full Determinism**
- Everything matches (Level 1 + Level 2)
- The gold standard

---

## Edge Cases

### Partial Replay

**Scenario:** Replay only first N steps

**Rules:**
- Memory state must match after each step
- Step outputs must match for replayed steps
- Final output comparison skipped
- Warning: Partial replay, final output not compared

### Replay with Overrides

**Scenario:** Replay with different model config

**Rules:**
- Warning: Model config differs from original
- Memory state must still match
- Step outputs may differ (expected)
- Divergence expected, not an error

### Replay After Schema Evolution

**Scenario:** Replay old run with new schema

**Rules:**
- Must support schema versioning
- Must migrate old runs to new schema
- If migration fails → Fatal error
- Warning: Schema migration performed

### Replay with Missing Memory

**Scenario:** Some memory entries deleted

**Rules:**
- If checkpoint memory missing → Fatal error
- If memory referenced but missing → Fatal error
- If unrelated memory missing → Warning

### Replay with Corrupted Checkpoint

**Scenario:** Checkpoint data is corrupted

**Rules:**
- Cannot restore → Fatal error
- Memory state inconsistent → Fatal error
- Report corruption details

---

## Validation Rules

### Pre-Replay Validation

Before replay starts:
1. Original run exists
2. Checkpoint exists
3. Checkpoint is valid
4. Memory store is accessible
5. Model config is compatible (if specified)
6. Identity matches original run

**If any validation fails → Fatal error**

### During-Replay Validation

During replay, after each step:
1. Memory state matches expected
2. Step output matches original
3. Step order matches original
4. Memory writes match original

**If any validation fails → Divergence detected**

### Post-Replay Validation

After replay completes:
1. Final output matches original
2. Memory state matches original
3. Step count matches original
4. No fatal errors occurred

**If any validation fails → Replay failed**

---

## Legal Meaning

This spec defines the contract:

- **If all strict invariants are satisfied** → Replay is valid and deterministic
- **If any strict invariant is violated** → Replay is invalid or diverged
- **If allowed differences are detected** → Replay is valid but different in expected ways
- **If fatal error occurs** → Replay cannot proceed

**This is the legal definition. Use it to validate replay correctness.**

---

Version 1.0 - January 2024

Changes to this spec must be versioned and documented.
