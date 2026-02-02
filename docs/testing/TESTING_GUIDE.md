# Testing Guide

This guide explains how Continuum testing and validation works.

---

## Test Categories

**Replay invariant tests** — Validate that replay produces identical outputs when inputs (checkpoint, seed, config) are identical. Implementations and entry points: `src/engine/replay.ts` (ReplayEngine), `examples/e2e-validation.ts`, `examples/deterministic-agent-run/run.ts` and `replay.ts`, `examples/replay-example.ts`.

**Fault injection tests** — Deliberately inject failures (missing checkpoint, corrupted data, invalid state) and assert expected behavior and recovery. Framework: `src/testing/fault-injection.ts`. Runner: `examples/fault-injection-tests.ts`.

**Persistence recovery tests** — Verify crash recovery, log loading, checkpoint load/save, and that state recovered from disk is correct. Framework: `src/testing/persistence-recovery.ts`. Runner: `examples/persistence-recovery-tests.ts`.

**Compaction validation tests** — Ensure log compaction preserves final state, is atomic, and does not corrupt data. Framework: `src/testing/compaction-validation.ts`. Runner: `examples/compaction-validation-tests.ts`.

**Nondeterminism audit tests** — Document and check the boundary between deterministic kernel and nondeterministic inputs (LLM, external APIs). Framework: `src/testing/nondeterminism-audit.ts`. Runner: `examples/nondeterminism-audit-tests.ts`.

Additional: **Corruption injection** (`src/testing/corruption-injection.ts`) tests behavior when log or checkpoint data is corrupted.

---

## Run All Tests

```bash
npm test
```

Runs the project test suite (e.g. Jest).

---

## Type Checking

```bash
npm run typecheck
```

Runs TypeScript compiler in check-only mode. Use before committing.

---

## Example Validation Scripts

Run validation scripts directly with tsx:

```bash
npx tsx examples/fault-injection-tests.ts
npx tsx examples/persistence-recovery-tests.ts
npx tsx examples/compaction-validation-tests.ts
```

Other useful scripts:

```bash
npx tsx examples/e2e-validation.ts
npx tsx examples/nondeterminism-audit-tests.ts
```

---

## What Must Always Hold

**Identical inputs → identical replay outputs** — For a given run, if replay uses the same checkpoint, seed, and model config, the replayed steps must match the original step outputs. Any deviation is divergence.

**Checkpoint restore correctness** — Restoring from a valid checkpoint must yield the same in-memory state that existed when the checkpoint was created. Persistence and recovery tests validate this.

**Divergence detection must trigger when inputs change** — If the replayed execution would produce different output (e.g. different LLM response, different external API result), the replay engine must detect the mismatch, set `matched: false`, and report the divergence step. It must not silently return matched.

These invariants are formalized in `docs/legal/DETERMINISM_CONTRACT.md` and `docs/legal/DEFINITIONS.md`.
