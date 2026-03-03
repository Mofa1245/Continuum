# AI Debug Demo

Multi-step agent: **LLM call → tool call → LLM post-process → memory write**. Run once, save results, replay, then show identical output, replay diff, and invariant validator.

## What this demo shows

1. **Run** — 4 steps (simulated LLM, tool, LLM post-process, memory write) with deterministic outputs.
2. **Replay** — Same run replayed via the engine; step outputs match (PASS).
3. **Replay diff** — Step-by-step ✓/✗ comparison of original vs replay.
4. **Invariant validator** — `validateRunInvariants` report for the run.
5. **Divergence (phrase)** — `--divergence`: second run has slightly different phrasing in `llm_post_process`; diff shows ✗.
6. **Divergence (structured)** — `--json-drift`: second run has **missing JSON field** in `tool_call` result (e.g. `unit` dropped). Same structure, subtle, very real-world. Replay FAIL.

## Without deterministic replay

- You cannot reproduce an agent run once tool outputs change.
- You cannot verify that replayed runs match original execution.
- Logging does not guarantee step equivalence.
- You cannot detect subtle drift in post-processing steps.

That comparison is why the demo exists.

## Run

```bash
# From repo root
npx tsx examples/ai-debug-demo/run.ts
```

Expected: Run ID, replay diff (all ✓), "Replay verification: PASS", then invariant report and "Invariant validation: PASS".

## Show replay mismatch (divergence)

**Phrase drift** (subtle text change):

```bash
npx tsx examples/ai-debug-demo/run.ts --divergence
```

Second run: `llm_post_process` returns "Weather in NYC is 72°F." instead of "Weather in NYC: 72°F." Same structure, different phrasing. Diff shows ✗ for that step.

**Structured drift — missing JSON field** (realistic AI failure):

```bash
npx tsx examples/ai-debug-demo/run.ts --json-drift
```

Second run: `tool_call` result is missing the `unit` field.

- **Original:** `{ "temperature": 72, "unit": "F", "city": "NYC" }`
- **Divergent:** `{ "temperature": 72, "city": "NYC" }`

Same structure. Subtle. The kind of drift that breaks downstream logic. Replay FAIL.

## Example output (divergence)

When you run with `--divergence` (phrase) or `--json-drift` (missing field), the replay diff looks like this — one step fails, the rest match:

```
✓ llm_call
✓ tool_call
✗ llm_post_process
✓ memory_write
Replay verification: FAIL
```

(With `--json-drift`, the ✗ appears on `tool_call` and the diff shows original `result` with `unit` vs divergent without it.)

The diff then shows the two JSON outputs for the failed step so you see exactly what drifted.

## 2-minute terminal demo video (suggested script)

1. **Intro** — "Continuum is a deterministic debugger for AI workflows. Here’s a 4-step agent: LLM, tool call, LLM post-process, memory write."
2. **Run** — `npx tsx examples/ai-debug-demo/run.ts` — show Run ID and 4 steps completing.
3. **Replay** — Point out "Replay (same seed)" and the ✓ lines: same inputs → same outputs.
4. **Replay diff** — "Each step is compared; all match."
5. **Invariant validator** — "We then validate the run: steps array, unique phase names, checkpoint present, etc. PASS."
6. **Divergence** (optional) — `npx tsx examples/ai-debug-demo/run.ts --divergence` (phrase) or `--json-drift` (missing field) — show one step ✗ and the exact original vs divergent output.

No enterprise, no pricing — just proof that runs are replayable and verifiable.
