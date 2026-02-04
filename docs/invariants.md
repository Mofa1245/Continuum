# Deterministic Execution Invariants

These invariants define the non-negotiable guarantees of the Continuum core engine. Any change to engine, storage, replay, or checkpoint logic must preserve these invariants.

## 1. Deterministic Step Execution

Given identical inputs, phase logic, and configuration, step outputs must be identical across runs and replays.

- No randomness, time dependence, or external I/O inside deterministic phases.
- Replay must reproduce the same step outputs.

## 2. Append-Only Run History

- Steps are never mutated or deleted after being recorded.
- New information is appended only.
- Historical steps remain immutable for replay integrity.

## 3. Checkpoint Consistency

- A checkpoint represents a complete, restorable memory snapshot.
- Restoring a checkpoint must fully restore memory state.
- Checkpoint restore + replay must produce identical results.

## 4. Replay Equivalence

Replay must match:

- step count
- step outputs
- canonical output hash

Replay verification failure indicates invariant violation.

## 5. Phase Identity Uniqueness

- Phase names must be unique within a run.
- Duplicate phase names are invalid and must throw errors.
- Prevents replay ambiguity.

## 6. Engine / AI Separation

- AI is not part of the deterministic core.
- AI outputs are treated as inputs to deterministic steps.
- Core engine must remain rules-based and deterministic.

## 7. Store Interface Contract

Stores must:

- return consistent snapshots
- preserve checkpoint data
- not reorder steps

Alternative store implementations must preserve behavior.

## 8. Test Requirements for Core Changes

Any change to:

- engine
- storage
- replay
- checkpoint logic

Must include:

- determinism test
- replay verification test
- checkpoint restore test

---

Violating any invariant is considered a breaking change to the Continuum core.
