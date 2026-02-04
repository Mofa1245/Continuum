# Replay System

How deterministic replay actually works.

---

## The Idea

Replay a run with the same inputs and get the same outputs. If outputs differ, we detect it.

---

## How It Works

**1. Load original run**
- Get the AgentRun
- Get the checkpoint ID
- Get the config and seed

**2. Restore memory state**
- Load checkpoint
- Restore memory to exact state at run start
- Verify memory is correct

**3. Create new run**
- Same task
- Same config
- Same seed
- Different run ID (obviously)

**4. Replay steps**
- For each step in original:
  - Resolve context (should match)
  - Execute step (should produce same output)
  - Compare output
  - If different → divergence detected

**5. Compare final output**
- Original output vs replayed output
- Match or diverge

---

## Checkpoints

Checkpoints are memory snapshots. When a run starts, we create a checkpoint. When we replay, we restore from that checkpoint.

**What's in a checkpoint:**
- All memory entries (deep cloned)
- All indexes (deep cloned)
- Metadata (org, timestamp, description)

**Why this works:**
- Memory state is deterministic
- Restore from checkpoint → same memory state
- Same memory + same inputs → same outputs

---

## Divergence Detection

We compare step-by-step:
- Step 1 output matches? Continue
- Step 2 output matches? Continue
- Step 3 output differs? Divergence detected at step 3

We normalize before comparing (remove timestamps, IDs, etc.) so we only compare what matters.

---

## What Must Match

**Strict invariants:**
- Memory state (entries, versions, indexes)
- Agent decisions (actions, outputs, order)
- Context resolution (constraints, preferences, etc.)
- Memory writes (keys, values, order)

**Allowed differences:**
- Run IDs (obviously)
- Timestamps (time is external)
- Execution duration (performance varies)
- Token usage (if LLM doesn't support seed)

See the replay invariants doc for the full spec.

---

## Failure Modes

**Fatal errors (can't continue):**
- Checkpoint missing or corrupted
- Memory entries missing
- Schema incompatibility

**Divergence (replay fails):**
- Step output differs
- Step order differs
- Memory writes differ

**Warnings (replay continues):**
- Performance degradation
- Allowed differences
- Config overrides

See the "How This Fails" doc for details.

---

## Why This Is Valuable

**Debugging:** Replay failed runs to see what happened
**Testing:** Replay to verify behavior hasn't changed
**Auditing:** Replay to prove deterministic execution
**Compliance:** Reproducibility is mandatory in regulated industries

This is what makes Continuum different from observability tools.
