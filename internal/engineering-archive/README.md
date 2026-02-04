# Deterministic Agent Run - Canonical Example

This example demonstrates Continuum's core value proposition: **deterministic replay of agent workflows**.

**What this example shows:**
1. Run an agent workflow
2. Persist memory + checkpoint
3. Simulate a crash (process exit)
4. Recover state from disk
5. Replay deterministically
6. Detect divergence if introduced

**Why determinism matters:**
- Debug agent behavior (reproduce bugs)
- Audit agent decisions (compliance)
- Test agent changes (regression testing)
- Understand agent reasoning (transparency)

---

## Step-by-Step Explanation

### Step 1: Run Agent Workflow

```typescript
// Create agent run (automatically creates checkpoint)
const run = await runStore.create({
  orgId: "my-org",
  task: "analyze user feedback",
  seed: 42, // Deterministic seed
  modelConfig: { model: "gpt-4", temperature: 0.7 }
});

// Agent executes steps
await runStore.appendStep(run.runId, {
  action: "analyze_feedback",
  input: { feedback: "Great product!" },
  output: { sentiment: "positive", score: 0.9 }
}, "my-org");

// Write memory
await memoryStore.write({
  orgId: "my-org",
  category: "decision",
  key: "user.sentiment",
  value: "positive",
  confidence: 0.9
});
```

**What happens:**
- AgentRun created with checkpointId
- Memory checkpoint created automatically
- All steps recorded
- All memory writes persisted

---

### Step 2: Persist Memory + Checkpoint

```typescript
// With FilePersistentStore, everything is persisted automatically
const persistentStore = new FilePersistentStore(".continuum");
const memoryStore = new InMemoryStore(persistentStore);

// All writes go to disk:
// - Memory entries → log.jsonl
// - Checkpoints → checkpoint-{id}.json
```

**What happens:**
- Memory entries written to append-only log
- Checkpoints written to disk with checksums
- State survives process exit

---

### Step 3: Simulate Crash (Process Exit)

```typescript
// Simulate crash: process exits unexpectedly
process.exit(1);
```

**What happens:**
- Process terminates
- In-memory state lost
- Disk state preserved

---

### Step 4: Recover State from Disk

```typescript
// Restart process
const persistentStore = new FilePersistentStore(".continuum");
const memoryStore = new InMemoryStore(persistentStore);

// Load org state from disk
await memoryStore.loadOrg("my-org");

// State restored:
// - All memory entries loaded
// - All checkpoints available
// - Ready for replay
```

**What happens:**
- Memory entries loaded from log.jsonl
- Checkpoints loaded from disk
- State restored exactly as before crash

---

### Step 5: Replay Deterministically

```typescript
const replayEngine = new ReplayEngine(runStore, memoryStore);

// Replay original run
const replayResult = await replayEngine.replay({
  runId: "original-run-id",
  seed: 42, // Same seed
  modelConfig: { model: "gpt-4", temperature: 0.7 } // Same config
});

if (replayResult.matched) {
  console.log("✅ Replay matched original run");
} else {
  console.log(`❌ Divergence at step ${replayResult.divergenceStep}`);
}
```

**What happens:**
- Memory state restored to checkpoint
- Steps replayed with same inputs
- Outputs compared to original
- Divergence detected if outputs differ

---

### Step 6: Detect Divergence

```typescript
// If LLM output differs (nondeterminism), divergence is detected
if (!replayResult.matched) {
  console.log(`Original output: ${replayResult.originalOutput}`);
  console.log(`Replayed output: ${replayResult.replayedOutput}`);
  console.log(`Divergence at step: ${replayResult.divergenceStep}`);
}
```

**What happens:**
- Divergence detected at first mismatch
- Step number reported
- Original vs replayed output shown

---

## Why Determinism Matters

### 1. Debug Agent Behavior

**Problem:** Agent produces wrong output. Why?

**Solution:** Replay the exact same run with same inputs and memory state.

```typescript
// Replay to debug
const replayResult = await replayEngine.replay({ runId: "buggy-run" });

// Inspect each step
for (const step of replayResult.replayedRun.steps) {
  console.log(`Step ${step.stepNumber}: ${step.action}`);
  console.log(`Input: ${JSON.stringify(step.input)}`);
  console.log(`Output: ${JSON.stringify(step.output)}`);
}
```

---

### 2. Audit Agent Decisions

**Problem:** Need to prove agent made correct decisions.

**Solution:** Replay shows exact decision path.

```typescript
// Audit run
const auditRun = await replayEngine.replay({ runId: "audit-run" });

// Show decision path
console.log("Decision path:");
for (const step of auditRun.replayedRun.steps) {
  if (step.action.includes("decision")) {
    console.log(`- ${step.output}`);
  }
}
```

---

### 3. Test Agent Changes

**Problem:** Changed agent code. Does it still work?

**Solution:** Replay old runs to check for regressions.

```typescript
// Test against old runs
const oldRuns = await runStore.list({ orgId: "my-org" });

for (const oldRun of oldRuns) {
  const replayResult = await replayEngine.replay({ runId: oldRun.runId });
  
  if (!replayResult.matched) {
    console.log(`❌ Regression in run ${oldRun.runId}`);
  }
}
```

---

### 4. Understand Agent Reasoning

**Problem:** Why did agent make this decision?

**Solution:** Replay shows exact context and reasoning.

```typescript
// Understand reasoning
const replayResult = await replayEngine.replay({ runId: "mystery-run" });

// Show context used
for (const step of replayResult.replayedRun.steps) {
  if (step.contextUsed) {
    console.log(`Context at step ${step.stepNumber}:`);
    console.log(`- Constraints: ${step.contextUsed.constraints.length}`);
    console.log(`- Preferences: ${step.contextUsed.preferences.length}`);
  }
}
```

---

## Key Concepts

### Checkpoint

A checkpoint is a snapshot of memory state at a specific point in time.

- Created automatically when AgentRun starts
- Used to restore memory state for replay
- Preserved on disk (survives crashes)

### Replay

Replay executes the same AgentRun with the same inputs and memory state.

- Same checkpoint → same memory state
- Same inputs → same outputs (if deterministic)
- Divergence detected if outputs differ

### Determinism

Determinism means same inputs → same outputs.

- Requires: same checkpoint, same seed, same model config
- Enables: debugging, auditing, testing
- Detects: nondeterminism (LLM variance, external APIs)

---

## No Framework Magic

This example shows **what happens**, not implementation details:

1. **Checkpoint creation** - Snapshot of memory state
2. **Persistence** - Write to disk (append-only log)
3. **Recovery** - Load from disk (restore state)
4. **Replay** - Execute same steps (compare outputs)

**No magic. Just explicit state management.**

---

## Running the Example

```bash
# Run agent workflow
npx tsx examples/deterministic-agent-run/run.ts

# Simulate crash (process exits)
# State persisted to disk

# Recover and replay
npx tsx examples/deterministic-agent-run/replay.ts

# Test crash recovery
npx tsx examples/deterministic-agent-run/crash-recover.ts
```

---

**This example demonstrates Continuum's core value: deterministic replay.**
