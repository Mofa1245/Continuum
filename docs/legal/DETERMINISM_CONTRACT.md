# What Continuum Guarantees

This is the contract. What we promise, what we don't, and what happens when things go wrong.

**Version 1.0 (v1.x frozen)**  
Any incompatible change requires a major version increment.

**Important:** All terms used in this contract are explicitly defined in [DEFINITIONS.md](./DEFINITIONS.md). Terms like "same", "identical", "agent decision", "valid checkpoint", etc. have precise legal meanings.

---

## The Three Guarantees

### 1. Memory State Determinism

**The promise:** If you give us the same checkpoint (as defined in DEFINITIONS.md) and run the same operations (as defined in DEFINITIONS.md), you'll get identical memory state (as defined in DEFINITIONS.md). Every time.

**What this means:**
- Same checkpoint → same memory entries (by ID, by value, by version)
- Same operations → same results (deterministic execution)
- Memory indexes stay consistent (valid checkpoint requirement)
- Context resolution is predictable (deterministic resolver)

**Scope:** Single-threaded, single-node execution. No concurrency, no distribution.

**How we enforce it:**
- We validate checkpoints when we create them
- We check memory state when we restore it
- We verify indexes are consistent

**What happens if it breaks:**
- Corrupted checkpoint → fatal error (can't replay)
- Memory diverges → we detect it and fail the replay

---

### 2. Agent Decision Determinism

**The promise:** Same task, same memory (identical memory state), same model config, same seed → same agent decisions (as defined in DEFINITIONS.md).

**What this means:**
- Agent steps happen in the same order (totally ordered, sequential)
- Agent outputs are identical (deep equality, see DEFINITIONS.md for equality semantics)
- Memory writes are the same (same keys, same values, same order)
- Everything is reproducible (deterministic execution)

**Scope:** Single-agent, single-threaded execution. Each agent decision is one AgentStep. Steps are atomic and sequential.

**How we enforce it:**
- We capture the seed in the run
- We capture the model config
- We restore memory from checkpoint
- We compare outputs step by step

**What happens if it breaks:**
- LLM doesn't support seed → might diverge (we detect it)
- External APIs not mocked → might diverge (we detect it)
- Output differs → we detect divergence and fail

---

### 3. Replay Correctness

**The promise:** Replay will be correct (as defined in DEFINITIONS.md) if (and only if) all inputs are identical (as defined in DEFINITIONS.md).

**What this means:**
- Same checkpoint (valid, identical content) + same config + same seed = same output (identical memory state, identical agent decisions)
- If anything differs, we detect and report divergence (as defined in DEFINITIONS.md)
- Divergence detection is synchronous and immediate (step-by-step comparison)

**Scope:** Single-threaded replay. Divergence detection has zero false positives (if we say it diverged, it diverged).

**How we enforce it:**
- We validate the checkpoint exists
- We check config matches
- We compare outputs step by step
- We report where things diverge

**What happens if it breaks:**
- Missing checkpoint → fatal error
- Config differs → warning issued; replay is no longer covered by determinism guarantees and may diverge
- Outputs differ → divergence detected

Replay correctness corresponds to Compliance Level 2 or higher. Full determinism corresponds to Compliance Level 3.

---

## What We Don't Guarantee (Explicitly)

These are explicitly NOT guaranteed in the current implementation:

### Durability

**We don't promise:** That checkpoints or memory will survive system restart.

**Why:** The current implementation may use in-memory storage. Data is lost on restart.

**What this means:** Checkpoints are lost on restart. Memory is lost on restart. No crash recovery.

**What to do:** Use a deployment with persistence and durability guarantees.

---

### Availability

**We don't promise:** Any uptime guarantee or SLA.

**Why:** The current implementation is single-node. No high availability.

**What this means:** System may be unavailable. No recovery procedures. No redundancy.

**What to do:** Use a deployment with availability guarantees.

---

### Security

**We don't promise:** Data encryption, access control, or security guarantees.

**Why:** This contract focuses on determinism, not security.

**What this means:** No encryption, no access control, no security features.

**What to do:** Implement security at application layer.

---

### Performance

**We don't promise:** Any performance characteristics or SLAs.

**Why:** Performance is not part of the determinism contract.

**What this means:** Replay may be slow. Checkpoint creation may be slow. No performance guarantees.

**What to do:** Measure and optimize as needed.

---

### LLM Semantic Determinism

**We don't promise:** That LLMs will be deterministic if they don't support seeds.

**Why:** LLMs are probabilistic. Some don't support deterministic mode. We can't fix that.

**What this means:** If your LLM doesn't support seeds, replay might diverge. We'll detect it and tell you, but we can't make the LLM deterministic.

**What to do:** Use LLMs that support seeds, or accept that replay might diverge.

---

### External API Determinism

**We don't promise:** That external APIs will return the same responses.

**Why:** APIs change. Network latency varies. We can't control external systems.

**What this means:** If you call external APIs and don't mock them, replay might diverge. We'll detect it.

**What to do:** Mock external APIs in replay, or accept divergence.

---

### Performance Determinism

**We don't promise:** That replay will be the same speed as the original.

**Why:** System load varies. Resource availability changes. Performance isn't part of the determinism contract.

**What this means:** Replay might be faster or slower. That's fine. We don't guarantee it.

---

### Schema Evolution

**We don't promise:** That old runs will replay with new schemas automatically.

**Why:** Schemas change. Sometimes compatibility breaks. Migration needs to be explicit.

**What this means:** If you upgrade and the schema changed, old runs might not replay. You'll need migration.

**What to do:** Implement schema migration, or don't upgrade.

---

## How Things Fail

### Fatal Errors (Can't Continue)

**Checkpoint missing or invalid (as defined in DEFINITIONS.md)**
- Can't restore memory state
- Replay stops immediately
- Clear error message: "Checkpoint not found" or "Checkpoint invalid"

**Memory entries missing (memory store inconsistency)**
- Can't restore from checkpoint (checkpoint references deleted entries)
- Replay stops during restoration
- Clear error message: "Memory entries missing"

**Schema incompatibility**
- Old run, new schema (version mismatch)
- Replay fails on version check
- Clear error message: "Schema version incompatible"
- Need migration (not provided in current implementation)

---

### Divergence (Replay Fails)

**Step output differs (as defined in DEFINITIONS.md)**
- Agent made different decision (output not identical by deep equality)
- We detect it synchronously and report where (step number, what diverged)
- Replay fails immediately

**Step order differs**
- Agent executed in different order (steps not sequential)
- We detect it (step-by-step comparison)
- Replay fails

**Memory writes differ**
- Different memory was written (different keys, values, or order)
- We detect it (memory state comparison after each step)
- Replay fails

---

### Warnings (Replay Continues)

**Performance is different**
- Replay is slower/faster
- We log it but continue
- Not a problem

**Timestamps differ**
- Expected, we ignore them
- Not a problem

**Config override**
- You replayed with different config
- We issue a warning; replay is no longer covered by determinism guarantees and may diverge

---

## Compliance Levels

**Level 1: Memory Consistency**
- Memory state matches exactly
- Required for memory integrity

**Level 2: Decision Consistency**
- Agent decisions match exactly
- Required for replay correctness

**Level 3: Full Determinism**
- Everything matches
- The gold standard

---

## Legal Stuff

**Warranty:** Continuum provides only the guarantees explicitly stated in this contract.

**Liability:** We're only liable for what we guarantee. We're not liable for:
- LLM nondeterminism (if seed not supported)
- External API changes (if not mocked)
- Performance issues
- Schema incompatibility (without migration)

**Your responsibility:**
- Use LLMs that support seeds (or accept divergence)
- Mock external APIs (or accept divergence)
- Implement schema migration (or don't upgrade)
- Validate replay results
- Understand definitions (read DEFINITIONS.md)
- Accept scope limitations (see DEFINITIONS.md)

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0 | Initial contract |

**If we change this contract, we'll version it and document the changes.**

---

**By using Continuum, you accept this contract.**

This is what we promise. This is what we don't. This is how we handle failures.
