# AgentRun: The Canonical Object

AgentRun is what you pay for. It's the unit of value.

It represents one complete agent execution - all the decisions, all the memory writes, all the context resolutions, everything needed to replay it.

---

## What AgentRun Contains

A complete agent execution:
- The task that triggered it
- All the steps the agent took
- All the memory it wrote
- All the context it resolved
- Complete state for replay

---

## How We Store It

**Key insight:** AgentRun is stored using the same MemoryEntry kernel.

**Main run record:**
- Key: `agent_run:{runId}`
- Category: `decision`
- Value: The whole AgentRun object
- Scope: `org`

**Steps:**
- Key: `agent_run:{runId}:step:{stepNumber}`
- Category: `decision`
- Value: The step object
- Scope: `org`

Why this works:
- Same append-only log (immutable, versioned)
- Same indexing (can query by org, scope, category)
- Same storage (no new infrastructure)
- Same guarantees (deterministic)

---

## AgentRun Structure

```typescript
{
  id: string
  orgId: string
  runId: string
  
  // When it ran
  startedAt: number
  completedAt?: number
  status: "running" | "completed" | "failed" | "cancelled"
  
  // What triggered it
  task: string
  initialContext: IdentityContext
  initialRequest: ResolveRequest
  
  // What happened
  steps: AgentStep[]
  
  // Memory state
  memorySnapshotStart: string[]  // MemoryEntry IDs at start
  memorySnapshotEnd?: string[]   // MemoryEntry IDs at end
  checkpointId?: string          // For replay
  
  // Determinism stuff
  seed?: number
  modelConfig?: { model, temperature, maxTokens }
  
  // Results
  finalOutput?: unknown
  error?: { message, stepId, stack }
}
```

---

## AgentStep Structure

Each step in the execution:

```typescript
{
  id: string
  stepNumber: number
  timestamp: number
  
  // What the agent did
  action: string
  input?: unknown
  output?: unknown
  
  // Context used
  contextResolved?: ResolveRequest
  contextUsed?: ResolveResponse
  
  // Memory written
  memoryWrites: string[]  // MemoryEntry IDs
  
  // Determinism markers
  modelUsed?: string
  temperature?: number
  seed?: number
}
```

---

## Replay

This is the killer feature.

**How it works:**
1. Load the original run
2. Restore memory from checkpoint
3. Replay each step with same inputs/config/seed
4. Compare outputs
5. Detect divergence if anything differs

**Result:**
- Same input → same output (if everything matches)
- Or divergence detected (if something differs)

This is what makes Continuum valuable.

---

## Integration

Works with LangGraph, CrewAI, or custom agents.

**Pattern:**
1. Start run (creates checkpoint)
2. Resolve context
3. Inject context into agent
4. Execute agent
5. Record steps
6. Write memory back
7. Complete run

See the integration docs for details.

---

## Why This Matters

AgentRun is the unit of value because:
- It's complete (everything needed to replay)
- It's immutable (append-only, can't change)
- It's deterministic (same inputs → same outputs)
- It's auditable (can prove what happened)

This is what enterprises pay for.
