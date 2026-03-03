# Continuum

AI outputs change.
Models update.
Temperatures get modified.
Silent drift breaks production systems.

Continuum replays and verifies multi-step LLM workflows.
If the output changes, your CI fails.

Run once. Verify forever.

![Invoice extraction drift guard: run → verify PASS → edit 72→99 → verify FAIL](demo.gif)

---

## Why This Exists

AI outputs change over time. Models update. Temperature mistakes happen. Prompt tweaks slip in. **Silent drift breaks production systems** — and you only notice when users complain.

Continuum catches that. Store a run once. Replay it from its stored recipe. Diff the outputs. **If anything changed, verification fails.** No guessing. No "it worked on my machine." CI-friendly exit codes and one command: `verify-all`.

---

## Quick Start

Three commands.

```bash
npm install && npm run build
node dist/cli/index.js invoice-demo
node dist/cli/index.js verify-all --strict
```

You should see **All runs verified successfully.** and exit code 0.

---

## CI: Drop-In Drift Check

Use Continuum in GitHub Actions to fail the build when any stored AI run has drifted.

```yaml
name: AI Drift Check

on: [push, pull_request]

jobs:
  verify-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Verify AI runs
        run: node dist/cli/index.js verify-all --strict
```

If any run in `./runs` no longer matches a re-execution from its stored recipe, the job fails. **No silent drift.**

```
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Run once   │ ──► │  Store run  │ ──► │  CI: verify  │
    │ (invoice-   │     │  (./runs/)  │     │  verify-all  │
    │  demo)      │     └─────────────┘     └──────┬──────┘
    └─────────────┘                                │
                                    pass ──► exit 0   exit 1 ◄── drift
```

---

## Invoice Demo (What the GIF Shows)

The demo that proves the value: **structured extraction from messy text**, then **verify that it never silently changes**.

1. **Run** `node dist/cli/index.js invoice-demo`  
   Extracts vendor, amount, currency, due_date from sample invoice text. Stores the run under `./runs`.

2. **Verify** `node dist/cli/index.js verify <runId> --strict`  
   Replays the run from its stored recipe. Output matches → **PASS**, exit 0.

3. **Tamper** — Open `runs/<runId>.json`, change `"amount": 72` to `"amount": 99` in `stepOutputs.json_parse`, save.

4. **Verify again** — Same command. Replay still returns 72. Stored says 99. **FAIL**, exit 1. Drift reported: `Path: json_parse.amount`, Stored vs Current.

If your model (or a bad deploy) ever extracts the wrong amount, **CI fails.** That’s the guard.

---

## Architecture

```
[ Agent Framework (LangGraph / CrewAI / Custom) ]
                    ↓
[ Continuum Adapter (Context Injection) ]
                    ↓
[ Deterministic Kernel (Memory + Replay) ]
                    ↓
[ Checkpoint-Based Storage ]
```

**Key principle:** AI is a consumer, not the brain. The kernel is deterministic.

---

## Core Concepts

**Stored run** — Each run is saved as a JSON file in `./runs` with a **recipe** (task, provider, model, temperature) and **stepOutputs**. Replay re-executes from the recipe and diffs against stepOutputs.

**Verify** — `continuum verify <runId> --strict` replays one run. `continuum verify-all --strict` replays every run in `./runs`. Any mismatch → exit 1.

**Recipe** — Execution metadata (provider, model, temperature, task). Replay uses only the recipe and stored input; no CLI overrides. Historically faithful.

---

## Other Commands

- `continuum llm-demo` — Weather-style LLM call → JSON parse → memory write (mock or OpenAI).
- `continuum demo` — 4-step agent demo with optional crash/recovery.
- `continuum replay <runId>` — Replay with full diff output.
- `continuum diff <runIdA> <runIdB>` — Compare two stored runs.

---

## Who This Is For

- Infra engineers shipping LLM-backed features
- Teams that need to catch silent output drift in CI
- Anyone extracting structured data (invoices, tickets, etc.) and unwilling to risk wrong numbers in production

---

## Documentation

- [docs/README](./docs/README.md) — Documentation index
- [What We Guarantee](./docs/legal/DETERMINISM_CONTRACT.md) — Determinism contract
- [How This Fails](./docs/legal/FAILURE_MODES.md) — Failure modes
- [What We Don't Do](./docs/legal/NON_GOALS.md) — Non-goals

---

## License

Continuum Non-Commercial Source License v1.0.  
Commercial use requires separate permission from the author.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and architecture decisions.

---

**Primary author:** Mohammed Al-Hajri. Developed with AI assistance under human direction, review, and validation.
