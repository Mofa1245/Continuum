# LangGraph Reference Adapter

**⚠️ NON-CORE ⚠️**

This adapter is **NOT** part of the Continuum core system.  
This adapter is **NOT** covered by Continuum stability guarantees.  
This adapter may change or be removed without notice.

---

## What This Adapter Does

This adapter demonstrates how to integrate Continuum with LangGraph workflows:

1. **Deterministic Run Recording**
   - Maps LangGraph workflow → Continuum AgentRun
   - Maps LangGraph node → Continuum AgentStep
   - Records all agent decisions and memory writes

2. **Checkpoint Persistence**
   - Automatically creates checkpoints at run start
   - Enables deterministic replay after crashes
   - Preserves memory state for replay

3. **Replay After Crash**
   - Restores memory state from checkpoint
   - Replays LangGraph workflow deterministically
   - Detects divergence if outputs differ

---

## What This Adapter Does NOT Guarantee

- **Stability** - May change without version bump
- **Completeness** - May not cover all LangGraph features
- **Performance** - Not optimized for production
- **Correctness** - Best-effort implementation

**This adapter is a reference implementation, not production code.**

---

## How It Maps LangGraph → Continuum

### LangGraph Workflow → Continuum AgentRun

```typescript
// LangGraph workflow starts
const runId = await adapter.startRun("process user request", {
  seed: 42,
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});

// Creates Continuum AgentRun with:
// - checkpointId (for replay)
// - seed (for determinism)
// - modelConfig (for replay)
```

### LangGraph Node → Continuum AgentStep

```typescript
// LangGraph node executes
await adapter.recordNode(runId, "analyze_request", input, output);

// Creates Continuum AgentStep with:
// - action: "langgraph_node:analyze_request"
// - input/output (for replay)
// - stepNumber (sequential)
```

### LangGraph State → Continuum Memory Context

```typescript
// Resolve context for LangGraph workflow
const context = await adapter.resolveContext("process user request");

// Returns Continuum ResolveResponse with:
// - constraints (must follow)
// - preferences (should follow)
// - conventions (patterns)
// - previous decisions (history)
```

---

## Usage Example

```typescript
import { LangGraphAdapter } from "./adapters/langgraph/LangGraphAdapter.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import { Resolver } from "../engine/resolver.js";
import { FilePersistentStore } from "../storage/persistent-store.js";

// Setup Continuum (with persistence)
const persistentStore = new FilePersistentStore(".continuum");
const memoryStore = new InMemoryStore(persistentStore);
const runStore = new InMemoryAgentRunStore(memoryStore);
const resolver = new Resolver(memoryStore);

const identity = { orgId: "my-org", repoId: "my-repo" };

// Create adapter
const adapter = new LangGraphAdapter(
  memoryStore,
  runStore,
  resolver,
  identity
);

// Start run (creates checkpoint)
const runId = await adapter.startRun("process user request", {
  seed: 42,
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});

// Resolve context
const context = await adapter.resolveContext("process user request");
const contextStr = adapter.formatContext(context);

// Use in LangGraph node
const result = await llm.invoke([
  { role: "system", content: contextStr },
  { role: "user", content: "process user request" }
]);

// Record node execution
await adapter.recordNode(runId, "process_request", input, result);

// Write memory from decision
const memoryId = await adapter.writeMemory(
  "user.preference",
  "prefers concise responses",
  { category: "preference", confidence: 0.9 }
);

// Complete run
await adapter.completeRun(runId, result);
```

---

## Replay Example

```typescript
import { ReplayEngine } from "../engine/replay.js";

const replayEngine = new ReplayEngine(runStore, memoryStore);

// Replay LangGraph workflow deterministically
const replayResult = await replayEngine.replay({
  runId: "original-run-id",
  seed: 42, // Same seed as original
  modelConfig: { model: "gpt-4", temperature: 0.7 } // Same config
});

if (replayResult.matched) {
  console.log("Replay matched original run");
} else {
  console.log(`Divergence at step ${replayResult.divergenceStep}`);
}
```

---

## Important Notes

1. **This adapter uses ONLY public Continuum interfaces**
   - MemoryStore (public interface)
   - AgentRunStore (public interface)
   - Resolver (public class)

2. **This adapter does NOT extend core behavior**
   - No new guarantees
   - No new semantics
   - No core modifications

3. **This adapter is a reference implementation**
   - Use as a starting point
   - Adapt to your needs
   - Don't rely on stability

---

## Warning

**This adapter is NOT part of the Continuum stability promise.**

- May change without notice
- May be removed
- Not covered by v1.x guarantees
- Use at your own risk

**Build your own adapter based on your specific needs.**

---

**This adapter demonstrates Continuum usage. It is not production code.**
