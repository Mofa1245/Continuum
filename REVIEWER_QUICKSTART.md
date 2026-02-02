# Continuum — Reviewer Quick Start

This guide is for technical reviewers evaluating determinism and replay correctness.

**Goal:** Validate that Continuum correctly implements:

- **Run recording** — Agent runs are captured with steps, checkpoint, seed, and config
- **Checkpoints** — Memory state is snapshotted at run start and restorable for replay
- **Deterministic replay** — Same checkpoint + same inputs produce same outputs
- **Divergence detection** — When outputs differ, the system detects and reports the step

---

## Fast Path Validation

```bash
npm install
npm run build
npx tsx examples/deterministic-agent-run/run.ts
npx tsx examples/deterministic-agent-run/replay.ts <runId>
```

Use the `runId` printed by `run.ts` when invoking `replay.ts`.

**Expected behavior:** Replay matches the original run when deterministic inputs are preserved (same seed, same config, same checkpoint). `replayResult.matched` is `true`. If the LLM or external inputs differ, divergence is detected and reported.

---

## Files Reviewers Should Inspect

- **src/engine/replay.ts** — Replay engine, step-by-step replay, divergence comparison
- **src/storage/persistent-store.ts** — Persistence, checkpoints, crash-consistent writes
- **docs/legal/DETERMINISM_CONTRACT.md** — Formal determinism guarantees and scope
- **docs/legal/NON_GOALS.md** — Explicit non-guarantees (LLM determinism, external APIs, etc.)
