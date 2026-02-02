## Authorship

Primary author: Mohammed Al-Hajri  
This project was developed with AI assistance under human direction, review, and validation.

# Continuum

**Deterministic Replay Infrastructure for AI Agents**

Continuum provides **provable determinism** for AI agent execution through checkpoint-based replay. This enables debugging, auditing, compliance, and reproducible agent behavior.

---

## What Continuum Does

Continuum solves the **deterministic replay problem** for AI agents:

- ✅ **Deterministic Memory** - Append-only, versioned, scoped memory substrate
- ✅ **Agent Run Tracking** - Complete execution trace with checkpoint-based state
- ✅ **Deterministic Replay** - Replay agent runs with identical outputs when deterministic inputs are preserved
- ✅ **Divergence Detection** - Automatically detect when replay differs from original
- ✅ **Designed for enterprise use** - Formal determinism contract, fault injection validated

**This is agent memory infrastructure, not a feature.**

---

## Why Continuum Exists

AI agents are **non-deterministic by nature**. This creates problems:

- **Debugging is impossible** - Can't reproduce failures
- **Compliance is impossible** - Can't audit decisions
- **Testing is impossible** - Can't verify behavior
- **Trust is impossible** - Can't prove correctness

Continuum solves this by:
1. **Capturing** all non-deterministic inputs (seed, config, memory state)
2. **Isolating** non-determinism at the boundary
3. **Replaying** with identical inputs to produce identical outputs
4. **Detecting** divergence when outputs differ

**This enables provable determinism for AI agents.**

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

**Key Principle:** AI is a consumer, not the brain. The kernel is deterministic.

---

## Core Concepts

### Memory Entry

Normalized, machine-usable facts stored in an append-only log:

```typescript
{
  orgId: string
  scope: "global" | "org" | "repo"
  category: "preference" | "convention" | "constraint" | "decision" | "risk"
  key: string
  value: string | number | boolean | object
  confidence: number  // 0–1
  source: "explicit" | "observed" | "inferred"
  version: number     // Append-only versioning
}
```

### Agent Run

Complete execution record with checkpoint:

```typescript
{
  runId: string
  task: string
  steps: AgentStep[]
  checkpointId: string  // Memory state at start
  seed?: number         // For deterministic replay
  modelConfig?: {...}   // LLM configuration
}
```

### Replay

Deterministic replay with divergence detection:

```typescript
const result = await replayEngine.replay({
  runId: originalRun.runId,
  seed: 42,  // Same seed
  modelConfig: {...}  // Same config
});

// Result:
// - matched: true/false
// - divergenceStep?: number
// - originalOutput vs replayedOutput
```

---

## Quick Start

### Installation

```bash
npm install continuum  # once published
```

### Basic Usage

```typescript
import { InMemoryStore, InMemoryAgentRunStore, Resolver, ReplayEngine } from "continuum";
import { LangGraphAdapter } from "continuum/integrations";

// Initialize
const memoryStore = new InMemoryStore();
const runStore = new InMemoryAgentRunStore(memoryStore);
const resolver = new Resolver(memoryStore);
const replayEngine = new ReplayEngine(runStore, memoryStore);

// Create adapter
const adapter = new LangGraphAdapter(
  memoryStore,
  runStore,
  resolver,
  { orgId: "acme", repoId: "api-service" }
);

// Start run
const runId = await adapter.startRun("Add authentication endpoint", {
  seed: 42,
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});

// Resolve context
const context = await adapter.resolveContext("Add authentication endpoint");
const prompt = adapter.formatContext(context);

// Execute agent (with context injected)
const result = await agent.execute(task, { systemPrompt: prompt });

// Record step
await adapter.recordStep(runId, "agent_execute", { task }, result);

// Complete run
await adapter.completeRun(runId, result);

// Replay
const replayResult = await replayEngine.replay({ runId });
console.log(`Matched: ${replayResult.matched}`);
```

---

## Determinism Guarantees

Continuum provides **formal determinism guarantees**:

### Guarantee 1: Memory State Determinism

Given identical checkpoint and operations → identical memory state.

### Guarantee 2: Agent Decision Determinism

Given identical task, memory, config, and seed → identical decisions.

### Guarantee 3: Replay Correctness

Replay produces identical outputs if and only if all deterministic inputs are identical.

**See [DETERMINISM_CONTRACT.md](./docs/legal/DETERMINISM_CONTRACT.md) for complete specification.**

---

## What Continuum Does Not Do

**Clear non-goals prevent scope creep:**

- ❌ LLM semantic determinism (if seed not supported)
- ❌ External API determinism (if not mocked)
- ❌ Performance determinism (execution time may vary)
- ❌ Schema evolution (migration required)
- ❌ Distributed execution (single-node only)

**See [NON_GOALS.md](./docs/legal/NON_GOALS.md) for complete list.**

---

## How Continuum Fails

**Transparency about failure modes builds trust:**

- **Fatal Errors:** Checkpoint corruption, memory restoration failure, schema incompatibility
- **Divergence:** LLM nondeterminism, external API changes, memory write order mismatch
- **Warnings:** Performance degradation, allowed differences (timestamps, IDs)

**See [FAILURE_MODES.md](./docs/legal/FAILURE_MODES.md) for complete failure mode specification.**

---

## Integration

### LangGraph

```typescript
import { LangGraphAdapter } from "continuum/integrations";

const adapter = new LangGraphAdapter(...);

// In LangGraph node
const context = await adapter.resolveContext(task);
const prompt = adapter.formatContext(context);
const result = await llm.invoke([{ role: "system", content: prompt }, ...]);
await adapter.recordStep(runId, "llm_invoke", { task }, result);
```

### CrewAI

```typescript
import { CrewAIAdapter } from "continuum/integrations";

const adapter = new CrewAIAdapter(...);

// In CrewAI agent
const context = await adapter.resolveContext(task);
agent.systemPrompt += adapter.formatContext(context);
const result = await agent.execute(task);
await adapter.recordAgentExecution(runId, agent.name, task, result);
```

**See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete integration guide.**

---

## Validation

Continuum has been **adversarially validated**:

- ✅ **Replay Invariants** - Formal correctness contract
- ✅ **Fault Injection** - Deliberate failure testing
- ✅ **Nondeterminism Audit** - Explicit boundary documentation

**See [docs/legal](./docs/legal) for contracts and validation documentation.**

---

## Documentation

**Start here:** [docs/README](./docs/README.md) - Documentation index

### Legal & Contracts
- **[What We Guarantee](./docs/legal/DETERMINISM_CONTRACT.md)** - The determinism contract
- **[How This Fails](./docs/legal/FAILURE_MODES.md)** - Failure modes and what to do
- **[What We Don't Do](./docs/legal/NON_GOALS.md)** - Explicit boundaries

### Architecture
- **[Architecture](./docs/architecture/ARCHITECTURE.md)** - How the system works

### Integration
- **[Integration Guide](./docs/integration/INTEGRATION_GUIDE.md)** - How to integrate

---

## Use Cases

### 1. AI Observability

**Problem:** Can't debug agent failures  
**Solution:** Replay failed runs to see exactly what happened

### 2. Compliance & Audit

**Problem:** Can't audit agent decisions  
**Solution:** Replay any run to prove deterministic execution

### 3. Agent Testing

**Problem:** Can't test agent behavior  
**Solution:** Replay runs to verify behavior hasn't changed

### 4. Regulated AI

**Problem:** Reproducibility is mandatory  
**Solution:** Deterministic replay provides proof of reproducibility

---

## Status

**Current:** MVP - In-memory storage, single-node, validated determinism  
**Planned future work includes:** Persistence & durability, production storage, enterprise features

**This is infrastructure-grade work, not a prototype.**

---

## License

Continuum Non-Commercial Source License v1.0.  
Commercial use requires separate permission from the author.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and architecture decisions.

---

**Continuum enables provable determinism for AI agents. This is agent memory infrastructure.**
