# Reviewer Guide

5-minute briefing for external reviewers.

---

## What is this?

Deterministic replay for AI agent runs. Capture state, replay with same inputs, detect divergence.

This is infrastructure, not a feature.

---

## Why does this exist?

AI agents fail in production and you can't debug them. Can't reproduce, can't audit, can't prove anything.

Existing tools (logging, tracing, observability) don't give you determinism. They show you what happened, not why, and definitely not how to replay it.

Continuum gives you replay. Same inputs → same outputs. Or we detect divergence.

---

## What problem does this solve that others don't?

**Deterministic replay for AI agents. Nobody else does this.**

Why? Because it requires:
- Isolating non-determinism (LLMs, APIs, time)
- Checkpoint-based state management
- Formal guarantees (not just "works on my machine")

We do all three. LangSmith, W&B, and others do observability. We do replay.

What this enables:
- Debug failed runs (replay to see what happened)
- Compliance (replay to prove execution)
- Testing (replay to verify behavior)
- Regulated AI (reproducibility is required)

---

## What do we guarantee?

Three things:

1. **Memory State Determinism** - Same checkpoint + same ops → same memory
2. **Agent Decision Determinism** - Same task + memory + config + seed → same decisions  
3. **Replay Correctness** - Replay matches original if (and only if) inputs are identical

**Important:** All terms ("same", "identical", "agent decision", etc.) are explicitly defined in [DEFINITIONS.md](./legal/DEFINITIONS.md).

See [the contract](./legal/DETERMINISM_CONTRACT.md) for the full spec.

---

## What don't we guarantee?

- LLM determinism if the LLM doesn't support seeds
- External API determinism if you don't mock them
- Performance determinism (speed may vary)
- Schema evolution (need migration)
- Distributed execution (single-node only)

See [non-goals doc](./legal/NON_GOALS.md) for the full list.

---

## How do we validate this?

1. **Replay Invariants** - Formal spec of what must match vs what can differ
2. **Fault Injection** - Deliberately broke things (corrupt checkpoints, kill agents, reorder writes)
3. **Nondeterminism Audit** - Documented where randomness lives and how it's contained

See [testing docs](./testing/) for results.

---

## How do you verify it?

1. Read [definitions](./legal/DEFINITIONS.md) - understand what terms mean
2. Read [the contract](./legal/DETERMINISM_CONTRACT.md) - what we guarantee
3. Read [how it fails](./legal/HOW_THIS_FAILS.md) - failure modes
4. Read [architecture](./architecture/ARCHITECTURE.md) - how it works
5. Run the examples - see it in action

Then try to break it:
- Corrupt a checkpoint → should fail clearly
- Replay with different seed → should detect divergence
- Kill agent mid-run → should handle it

If you find something we didn't document, tell us.

---

## Where to start

**Reviewing:**
1. This doc (you're here)
2. [Definitions](./legal/DEFINITIONS.md) - **START HERE** - all terms defined explicitly
3. [The contract](./legal/DETERMINISM_CONTRACT.md) - what we guarantee
4. [Architecture](./architecture/ARCHITECTURE.md) - how it works
5. [Replay invariants](./testing/REPLAY_INVARIANTS.md) - what must match

**Integrating:**
1. [Integration guide](./integration/INTEGRATION_GUIDE.md)
2. Examples folder
3. Source code

---

## Current status

MVP. In-memory storage, single-node, single-threaded, determinism validated.

**What works:**
- Deterministic memory (single-threaded, sequential)
- Agent run tracking (single-agent, sequential steps)
- Checkpoint-based replay (in-memory, non-durable)
- Divergence detection (step-by-step, synchronous)
- Validated via fault injection

**What's missing (explicitly not guaranteed):**
- Persistent storage (checkpoints lost on restart) - Phase 5B
- Schema migration (not implemented) - Phase 5B
- Distributed execution (single-node only) - explicitly not supported
- API mocking (not provided) - user must implement
- Durability (in-memory only) - Phase 5B
- Availability (no SLA) - Phase 5B
- Security (not specified) - Phase 5B

**Scope clarification:**
- Single-threaded execution (no concurrency)
- Single-node execution (no distribution)
- In-memory storage (no durability)
- MVP status (not production-ready without Phase 5B)

This is infrastructure-grade **kernel work**, not a production system. Production requires Phase 5B (persistence & durability).

---

## Common questions

**Q: Does this work with all LLMs?**  
A: Works with any LLM. Deterministic replay needs seed support. If the LLM doesn't support seeds, replay might diverge and we'll detect it.

**Q: Can I use this in production?**  
A: MVP is in-memory only. For production you need persistent storage (Phase 5B).

**Q: How does this compare to LangSmith/W&B?**  
A: Those are observability tools. We do replay, not just logging.

**Q: What's the performance impact?**  
A: Minimal. Checkpoint creation is fast, replay is mostly reads. But we don't guarantee performance (it's a non-goal).

---

## Core Semantics Freeze

**Status:** Core semantics are frozen for external review.

The following are locked and will not change during review:
- Replay invariants
- Determinism contract
- Failure classifications
- Nondeterminism boundaries

See [FREEZE_NOTICE.md](./FREEZE_NOTICE.md) for details.

---

## Feedback

If you find failure modes we didn't document, unclear guarantees, missing non-goals, or architecture problems, tell us. This is built to be reviewed.
