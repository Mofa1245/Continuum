# Deterministic Agent Quickstart

## Install

```bash
npm install
npm run build
```

If tsx is not available: `npm install -D tsx`

## Run the Agent Kit Demo

```bash
npx tsx examples/agent-kit-demo.ts
```

The demo runs four deterministic phases (plan, gatherContext, decideAction, produceResult), creates a run automatically, checkpoints after each phase, and records steps for replay-safe execution. Every phase result is checkpointed and replay-verifiable by the Continuum engine.

## Create Your Own Agent

```ts
import { createDeterministicAgentKit } from "../src/agent/agent-kit.js";
import type { DeterministicPhase } from "../src/agent/deterministic-runner.js";

const phases: DeterministicPhase[] = [
  { name: "step1", execute: async () => ({ value: "a" }) },
  { name: "step2", execute: async () => ({ value: "b" }) },
];

const kit = createDeterministicAgentKit({
  agentId: "my-agent",
  taskId: "my-task",
  phases,
});

const { runId, phaseResults } = await kit.run();
```

## Determinism Rules

- No randomness (no `Math.random()` or equivalent).
- No time-based logic (no `Date.now()` or timers inside phases).
- No external I/O inside phases (no network, disk, or env reads).
- Same input must produce the same output for replay to match.

## When To Use Agent Kit vs Runner

- **Agent Kit** — Fastest start: in-memory stores, one call to create and run. Use for demos and local experimentation.
- **Deterministic Runner** — Advanced control: supply your own stores, integrate with persistence or replay. Use when you need custom store wiring or production-style setup.
