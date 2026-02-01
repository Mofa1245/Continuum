# How to Integrate Continuum

This shows common patterns for integrating Continuum with agent frameworks.

> ⚠️ **Adapters are reference implementations**  
> LangGraphAdapter, CrewAIAdapter, and MinimalAgent are **non-core**, **unstable**, and provided as examples.  
> They may change without notice and are **not covered by Continuum's stability guarantees**.
>
> Core guarantees apply only to:
> - MemoryStore
> - AgentRunStore
> - Resolver
> - ReplayEngine

---

## The Pattern

All integrations follow the same pattern:

1. Start run (creates checkpoint)
2. Resolve context (get constraints/preferences)
3. Inject context (add to agent prompts)
4. Record steps (track what agent does)
5. Write memory (learn from decisions)
6. Complete run (finalize)

---

## LangGraph

### Setup

> Note: Code snippets are illustrative.  
> Method names and signatures may vary between versions.  
> Refer to actual adapter implementations for exact APIs.

```typescript
import { LangGraphAdapter } from "continuum";
import { InMemoryStore, InMemoryAgentRunStore, Resolver } from "continuum";

const memoryStore = new InMemoryStore();
const runStore = new InMemoryAgentRunStore(memoryStore);
const resolver = new Resolver(memoryStore);

const adapter = new LangGraphAdapter(
  memoryStore,
  runStore,
  resolver,
  { orgId: "acme", repoId: "api-service" }
);
```

### In Your Node

```typescript
async function myNode(state: State) {
  const task = state.task;
  const runId = state.continuumRunId; // Pass through state

  // Get context
  const context = await adapter.resolveContext(task);
  const prompt = adapter.formatContext(context);

  // Call LLM
  const messages = [
    { role: "system", content: prompt },
    { role: "user", content: task }
  ];
  const result = await llm.invoke(messages);

  // Record it
  await adapter.recordStep(
    runId,
    "llm_invoke",
    { task, messages },
    result,
    { nodeName: "myNode", contextResolved: { task }, contextUsed: context }
  );

  return { ...state, result };
}
```

### Complete Workflow

```typescript
// Start run
const runId = await adapter.startRun("Add auth endpoint", {
  seed: 42,
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});

// Pass runId through state
const graph = new StateGraph(State)
  .addNode("planning", async (state) => {
    state.continuumRunId = runId;
    return await planningNode(state);
  })
  .addNode("execution", async (state) => {
    return await executionNode(state);
  });

// Execute
const result = await graph.invoke({ task: "...", continuumRunId: runId });

// Write memory
await adapter.writeMemory("agent.decision.auth", "Use JWT", {
  category: "decision",
  confidence: 0.85
});

// Complete
await adapter.completeRun(runId, result);
```

---

## CrewAI

### Setup

```typescript
import { CrewAIAdapter } from "continuum";

const adapter = new CrewAIAdapter(
  memoryStore,
  runStore,
  resolver,
  { orgId: "acme", repoId: "api-service" }
);
```

### In Your Agent

```typescript
// Create agent
const agent = new Agent({
  role: "Senior Developer",
  goal: "Write high-quality code",
  backstory: "You are a senior developer...",
});

// Start run
const runId = await adapter.startRun("Add authentication endpoint");

// Get context
const context = await adapter.resolveContext("Add authentication endpoint");

// Inject into prompt
agent.systemPrompt += adapter.formatContext(context);

// Execute
const result = await agent.execute("Add authentication endpoint");

// Record it
await adapter.recordAgentExecution(runId, agent.role, "Add authentication endpoint", result);

// Complete
await adapter.completeRun(runId, result);
```

### Multi-Agent

```typescript
const runId = await adapter.startRun("Build auth system");

// Agent 1
const devContext = await adapter.resolveContext("Implement auth endpoint");
const devAgent = new Agent({ ... });
devAgent.systemPrompt += adapter.formatContext(devContext);
const devResult = await devAgent.execute("Implement auth endpoint");
await adapter.recordAgentExecution(runId, "Developer", "Implement auth endpoint", devResult);

// Agent 2
const reviewContext = await adapter.resolveContext("Review auth implementation");
const reviewAgent = new Agent({ ... });
reviewAgent.systemPrompt += adapter.formatContext(reviewContext);
const reviewResult = await reviewAgent.execute("Review auth implementation");
await adapter.recordAgentExecution(runId, "Reviewer", "Review auth implementation", reviewResult);

// Complete
await adapter.completeRun(runId, { dev: devResult, review: reviewResult });
```

---

## Custom Integration

MinimalAgent is a reference implementation demonstrating the core execution loop. Use it as a template:

```typescript
import { MinimalAgent } from "continuum";

const agent = new MinimalAgent(
  memoryStore,
  runStore,
  resolver,
  identity
);

const result = await agent.execute("Your task", {
  seed: 42,
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});
```

---

## Context Formatting

### LangGraph Format

```typescript
const contextPrompt = adapter.formatContext(context);
// Returns formatted string with:
// - Constraints (MUST FOLLOW)
// - Preferences (SHOULD FOLLOW)
// - Conventions
// - Warnings
// - Previous Decisions
```

### CrewAI Format

```typescript
const contextPrompt = adapter.formatContext(context);
// Returns formatted string optimized for CrewAI agents
```

---

## Writing Memory

Write memory from agent decisions:

```typescript
// Write preference
await adapter.writeMemory(
  "agent.preference.framework",
  "fastify",
  { category: "preference", confidence: 0.9 }
);

// Write decision
await adapter.writeMemory(
  "agent.decision.auth_approach",
  "Use JWT",
  { category: "decision", confidence: 0.85 }
);

// Write convention
await adapter.writeMemory(
  "agent.convention.code_style",
  "TypeScript strict mode",
  { category: "convention", confidence: 0.95 }
);
```

---

## Error Handling

```typescript
try {
  const runId = await adapter.startRun(task);
  // ... execute agent ...
  await adapter.completeRun(runId, result);
} catch (error) {
  if (runId) {
    await adapter.failRun(runId, error);
  }
  throw error;
}
```

---

## Best Practices

1. **Always start run** - Creates checkpoint automatically
2. **Resolve context early** - Get constraints before execution
3. **Inject context** - Add to system prompts, not user messages
4. **Record all steps** - Full traceability for replay
5. **Write memory** - Learn from successful decisions
6. **Complete run** - Always finalize, even on error

---

## Replay

Replay any run:

```typescript
import { ReplayEngine } from "continuum";

const replayEngine = new ReplayEngine(runStore, memoryStore);

const replayResult = await replayEngine.replay({
  runId: originalRun.runId,
  seed: 42, // Same seed
});

if (replayResult.matched) {
  console.log("✓ Deterministic execution verified");
} else {
  console.log(`Diverged at step ${replayResult.divergenceStep}`);
}
```

---

## Production Considerations

1. **Persistent storage** – Use a persistent MemoryStore implementation (e.g. Postgres-backed)
2. **API integration** – Consider using a service/API boundary instead of direct store access
3. **Error handling** - Wrap all adapter calls in try/catch
4. **Run cleanup** - Always complete or fail runs
5. **Memory management** - Clean up old checkpoints

---

## Examples

See:
- `examples/langgraph-integration.ts` - LangGraph example
- `examples/crewai-integration.ts` - CrewAI example
- `examples/minimal-agent-loop.ts` - Custom agent example
