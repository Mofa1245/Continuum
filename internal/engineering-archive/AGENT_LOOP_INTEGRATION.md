# Agent Loop Integration

How Continuum fits into an agent execution loop.

This is the wedge use-case in action.

---

## The Flow

```
1. Agent receives task
   ↓
2. Resolve context from Continuum
   ↓
3. Execute agent logic (with context)
   ↓
4. Record steps to AgentRun
   ↓
5. Write memory back to Continuum
```

---

## MinimalAgent Class

The MinimalAgent class shows how it works:

```typescript
const agent = new MinimalAgent(
  memoryStore,
  runStore,
  resolver,
  identity
);

const result = await agent.execute("Add authentication endpoint", {
  seed: 42,
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});
```

---

## What Happens

### 1. Create AgentRun

```typescript
const run = await runStore.create({
  orgId: "acme",
  task: "Add authentication endpoint",
  initialContext: identity,
  initialRequest: { task: "..." },
  seed: 42,
});
```

Checkpoint is created automatically.

### 2. Resolve Context

```typescript
const context = await resolver.resolve(identity, {
  task: "Add authentication endpoint",
  repo: "api-service",
  org: "acme"
});

// Returns:
// - constraints (e.g., "No new dependencies")
// - preferences (e.g., "Use Fastify")
// - conventions (e.g., "TypeScript strict mode")
// - warnings (high-confidence constraints/risks)
```

### 3. Execute with Context

The agent:
- Analyzes constraints
- Applies preferences
- Makes decisions (with context injected)
- Executes decisions
- Records each step to AgentRun

### 4. Write Memory Back

```typescript
// Agent learns from successful decisions
await memoryStore.write({
  orgId: "acme",
  scope: "repo",
  scopeId: "api-service",
  category: "preference",
  key: "agent.decision_approach",
  value: "iterative",
  confidence: 0.8,
  source: "observed"
});
```

---

## Integration Points

### For LangGraph

```typescript
// In your LangGraph node
const context = await continuum.resolve(identity, { task });
const result = await llm.invoke([
  { role: "system", content: formatContext(context) },
  { role: "user", content: task }
]);

await continuum.appendStep(runId, {
  action: "llm_call",
  input: { task, context },
  output: result
});
```

### For CrewAI

```typescript
// In your CrewAI agent
const context = await continuum.resolve(identity, { task });
agent.systemPrompt += formatContext(context);

const result = await agent.execute(task);
await continuum.appendStep(runId, {
  action: "agent_execute",
  input: { task },
  output: result
});
```

### For Custom Loops

```typescript
const run = await continuum.createRun({ task, identity });

while (!done) {
  const context = await continuum.resolve(identity, { task });
  const step = await executeStep(context);
  
  await continuum.appendStep(run.runId, {
    action: step.action,
    input: step.input,
    output: step.output
  });
}

await continuum.completeRun(run.runId, result);
```

---

## Key Benefits

1. **Context Injection** - Agent gets relevant constraints/preferences
2. **Full Traceability** - Every step recorded to AgentRun
3. **Learning** - Agent writes memory back, improves over time
4. **Deterministic** - Same input → same output (with seed)
5. **Replayable** - Can replay any run deterministically

---

## Example Output

```
=== Minimal Agent Loop Example ===

1. Pre-populating Continuum memory...
   ✓ Memory populated

2. Creating agent...
   ✓ Agent created

3. Executing agent task...
   Task: 'Add authentication endpoint'

4. Execution result:
   Success: true
   Steps: 5
   Output: {
     "task": "Add authentication endpoint",
     "decision": { "approach": "iterative", ... },
     "result": { "success": true, ... },
     "steps": 5
   }

5. AgentRun details:
   Run ID: run_1234567890_abc123
   Status: completed
   Steps: 5
   Started: 2024-01-01T12:00:00.000Z
   Completed: 2024-01-01T12:00:01.234Z
   Duration: 1234ms

   Step breakdown:
   1. resolve_context (10ms)
   2. analyze_constraints (50ms)
   3. apply_preferences (30ms)
   4. make_decision (100ms)
   5. execute_decision (200ms)
   6. write_memory (50ms)

6. Memory written by agent:
   Key: agent.decision_approach
   Value: iterative
   Confidence: 0.8
   Source: observed
```

---

## Next Steps

1. **Integrate with real agent framework** (LangGraph/CrewAI)
2. **Add LLM calls** (replace simulation with actual calls)
3. **Implement full replay** (with memory checkpoint/restore)
4. **Add tool execution** (actual code generation/execution)

This is the foundation for agent memory infrastructure.
