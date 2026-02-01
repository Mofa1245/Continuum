# Where Randomness Lives

This doc is about where nondeterminism enters the system and how we contain it.

Without this, replay is correct but fragile.

---

## The Core Idea

**The kernel is deterministic. Nondeterminism is isolated at the boundary and captured for replay.**

---

## Pure Components (Deterministic)

These have no external dependencies and no randomness:

**MemoryStore**
- Deterministic ID generation (timestamp + counter, seedable)
- Deterministic versioning (append-only, sequential)
- Deterministic indexing (derived from entries)
- Deterministic resolution (scoped, ordered)

**Resolver**
- Deterministic context resolution (same memory → same context)
- Deterministic ordering (scope hierarchy)
- Deterministic filtering (confidence, active only)

**AgentRunStore**
- Deterministic run creation (checkpoint at start)
- Deterministic step recording (append-only, sequential)
- Deterministic status updates (state machine)

**ReplayEngine**
- Deterministic checkpoint restoration
- Deterministic step replay
- Deterministic divergence detection

**These components have NO external dependencies and NO randomness.**

---

## Impure Components (Nondeterministic)

These introduce randomness:

**LLM Calls** (Agent Execution)
- Probabilistic outputs (temperature > 0)
- Non-deterministic token generation
- External API calls (network, timing)

**External APIs**
- Network latency (varies)
- API responses (may change)
- Rate limiting (timing-dependent)

**Time/Date Operations**
- `Date.now()` (current time)
- Timestamps (execution time)
- Timeouts (timing-dependent)

**Random Number Generation**
- `Math.random()` (not seedable)
- UUID generation (non-deterministic)
- Cryptographic randomness

**These are OUTSIDE the kernel and must be isolated.**

---

## Where Nondeterminism Comes From

### 1. LLM Nondeterminism

**Source:** Language model inference

**Nature:** Probabilistic token generation. Temperature controls randomness. Seed can make it deterministic (if supported).

**Where it enters:** Agent execution (MinimalAgent, LangGraphAdapter, CrewAIAdapter)

**How we contain it:**
- Seed captured in AgentRun.modelConfig.seed
- Temperature captured in AgentRun.modelConfig.temperature
- Model captured in AgentRun.modelConfig.model
- LLM outputs captured in step.output

**Leakage prevention:** Kernel never calls LLM directly. All LLM calls are in agent execution, isolated.

**Replay guarantee:** Same seed + same temperature + same model + same input = same output (if LLM supports seed).

---

### 2. External API Nondeterminism

**Source:** External service calls

**Nature:** Network latency varies. API responses may change. Rate limiting is timing-dependent.

**Where it enters:** Agent tool execution, external service calls in agent steps

**How we contain it:**
- API calls captured in step.input/output
- API responses captured in step.output
- Network timing not captured (allowed difference)

**Leakage prevention:** Kernel never calls external APIs. All API calls are in agent execution, isolated.

**Replay guarantee:** Same API call + same mock = same response. Without mocks, replay may diverge (documented limitation).

---

### 3. Time Nondeterminism

**Source:** System clock, execution timing

**Nature:** `Date.now()` returns current time. Execution duration varies. Timestamps are execution-time dependent.

**Where it enters:** MemoryEntry.createdAt, AgentRun.startedAt/completedAt, AgentStep.timestamp

**How we contain it:**
- Timestamps captured but allowed to differ (not strict invariant)
- Execution duration not captured (allowed difference)
- Time-based logic isolated in agent execution

**Leakage prevention:** Timestamps are metadata, not part of decisions. Time-based logic is in agent, not kernel.

**Replay guarantee:** Timestamps may differ (allowed difference). Time-based decisions are captured in step.output.

---

### 4. Random Number Generation

**Source:** Math.random(), UUID generation

**Nature:** Non-seedable randomness. Cryptographic randomness. System entropy.

**Where it enters:** ID generation (MemoryEntry.id, AgentRun.id)

**How we contain it:**
- IDs generated deterministically (timestamp + counter)
- Format: `mem_${timestamp}_${counter}`
- Timestamp is execution time (allowed difference)
- Counter is sequential (deterministic)

**Leakage prevention:** IDs are metadata, not part of decisions. ID generation is deterministic (timestamp + counter).

**Replay guarantee:** IDs may differ (allowed difference). ID generation doesn't affect decisions.

---

## Containment Strategies

### Strategy 1: Capture and Replay

**For:** LLM calls, external APIs

**How:**
1. Capture inputs (step.input)
2. Capture outputs (step.output)
3. Capture configuration (AgentRun.modelConfig)
4. Replay with same inputs + config

**Enforcement:**
- All LLM calls recorded in AgentStep
- All API calls recorded in AgentStep
- Configuration captured in AgentRun

**Limitation:** Requires LLM/API to support deterministic mode. Without seed/mocks, replay may diverge.

---

### Strategy 2: Isolate and Ignore

**For:** Time, random numbers, execution metadata

**How:**
1. Isolate in metadata (not decisions)
2. Mark as allowed differences
3. Ignore in comparison

**Enforcement:**
- Timestamps in metadata only
- IDs in metadata only
- Normalize before comparison (remove timestamps/IDs)

**Limitation:** None. These are explicitly allowed to differ.

---

### Strategy 3: Mock and Control

**For:** External APIs, file system, network

**How:**
1. Mock external dependencies
2. Control responses
3. Isolate in test environment

**Enforcement:** Not yet implemented (future enhancement)

**Limitation:** Requires explicit mocking setup. Not available in MVP.

---

## Boundary Enforcement

### Kernel Boundary

**Rule:** Kernel components must be pure (no external dependencies)

**Enforcement:**
- MemoryStore - No external calls
- Resolver - No external calls
- AgentRunStore - No external calls
- ReplayEngine - No external calls

**Validation:** Static analysis (no `fetch`, `Date.now`, `Math.random` in kernel). Runtime checks (validate kernel purity).

---

### Agent Boundary

**Rule:** Agent execution is impure, but isolated

**Enforcement:**
- LLM calls in agent, not kernel
- API calls in agent, not kernel
- All calls captured in AgentStep
- Configuration captured in AgentRun

**Validation:** All agent steps recorded. All external calls captured. Configuration captured.

---

### Replay Boundary

**Rule:** Replay uses captured data, not live calls

**Enforcement:**
- Replay uses step.input/output (captured)
- Replay uses AgentRun.modelConfig (captured)
- Replay may call LLM (if seed supported)
- Replay should not call external APIs (requires mocks)

**Validation:** Replay uses captured data. Replay does not make new external calls. Replay divergence detected if outputs differ.

---

## Known Limitations

**LLM seed support:** Not all LLMs actually support seeds, even if they claim to. Test it.

**External API mocks:** We don't provide mocking in MVP. You need to build it or accept divergence.

**Schema migration:** Not implemented yet. You'll need to build it or don't upgrade.

**These are limitations, not bugs. We document them so you know what to expect.**

---

## Summary

**Pure (deterministic):**
- MemoryStore
- Resolver
- AgentRunStore
- ReplayEngine

**Impure (nondeterministic, but isolated):**
- LLM calls (captured)
- External APIs (captured)
- Time (metadata only)
- Random (ID generation only)

**Containment:**
- LLM: Seed + config captured
- APIs: Calls captured (mocks needed)
- Time: Isolated in metadata
- Random: Isolated in ID generation

**Enforcement:**
- Kernel is pure (no external deps)
- Agent is isolated (calls captured)
- Replay uses captured data
- Nondeterminism detected and documented

This is how we make replay deterministic even though the world is random.
