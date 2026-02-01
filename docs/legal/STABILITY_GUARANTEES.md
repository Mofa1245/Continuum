# Stability Guarantees

This document explicitly defines what is frozen in v1.x, what may evolve, and what is not guaranteed.

**Version 1.0 (v1.x stability guarantees frozen)**

---

## What Is Frozen in v1.x

**These are locked and will not change in v1.x:**

### 1. Determinism Guarantees

**Frozen:** All determinism guarantees specified in [DETERMINISM_CONTRACT.md](./DETERMINISM_CONTRACT.md)

**What this means:**
- Memory State Determinism guarantee remains unchanged
- Agent Decision Determinism guarantee remains unchanged
- Replay Correctness guarantee remains unchanged
- All definitions in [DEFINITIONS.md](./DEFINITIONS.md) remain unchanged

**What cannot change:**
- Guarantee wording (only referenced, not altered)
- Guarantee scope (single-threaded, single-node, in-memory)
- Guarantee enforcement mechanisms
- Guarantee failure modes

**What can change:**
- Nothing. Guarantees are frozen.

**Reference:** [DETERMINISM_CONTRACT.md](./DETERMINISM_CONTRACT.md)

---

### 2. Persistence & Recovery Guarantees

**Frozen:** All recovery guarantees specified in [RECOVERY_GUARANTEES.md](./RECOVERY_GUARANTEES.md)

**What this means:**
- Log entry recovery guarantees remain unchanged
- Checkpoint recovery guarantees remain unchanged
- Corruption detection guarantees remain unchanged
- Crash recovery behavior remains unchanged

**What cannot change:**
- Recovery behavior (what happens after crash/corruption)
- Detection mechanisms (how corruption is detected)
- Recovery guarantees (what is recovered, what is lost)
- Failure scenarios (documented scenarios remain valid)

**What can change:**
- Nothing. Recovery guarantees are frozen.

**Reference:** [RECOVERY_GUARANTEES.md](./RECOVERY_GUARANTEES.md)

---

### 3. Compaction Guarantees

**Frozen:** All compaction guarantees specified in [PERSISTENCE_ARCHITECTURE.md](../architecture/PERSISTENCE_ARCHITECTURE.md) and [COMPACTION_GUIDE.md](../operational/COMPACTION_GUIDE.md)

**What this means:**
- Compaction preserves final state exactly
- Compaction is atomic (temp file + rename)
- Compaction is crash-safe (original log preserved on failure)
- Compaction is optional and explicitly triggered

**What cannot change:**
- Compaction guarantees (state preservation, atomicity, crash safety)
- Compaction behavior (what compaction does)
- Compaction limitations (what compaction does not guarantee)

**What can change:**
- Nothing. Compaction guarantees are frozen.

**Reference:** [PERSISTENCE_ARCHITECTURE.md](../architecture/PERSISTENCE_ARCHITECTURE.md), [COMPACTION_GUIDE.md](../operational/COMPACTION_GUIDE.md)

---

### 4. Public API Contracts

**Frozen:** All public API contracts specified in [API_CONTRACT.md](./API_CONTRACT.md)

**What this means:**
- Public interfaces remain unchanged (MemoryStore, AgentRunStore, PersistentStore, ReplayEngine)
- Public types remain unchanged (MemoryEntry, AgentRun, AgentStep, MemoryCheckpoint, etc.)
- Public method signatures remain unchanged
- Required invariants remain unchanged
- Error guarantees remain unchanged

**What cannot change:**
- Public interface methods (signatures, behavior)
- Public type definitions (fields, types)
- Required invariants (what must be true)
- Error guarantees (what errors are thrown, when)

**What can change:**
- Nothing. Public API contracts are frozen.

**Reference:** [API_CONTRACT.md](./API_CONTRACT.md)

---

### 5. Failure Modes

**Frozen:** All failure modes specified in [FAILURE_MODES.md](./FAILURE_MODES.md) and [HOW_THIS_FAILS.md](./HOW_THIS_FAILS.md)

**What this means:**
- Documented failure modes remain valid
- Expected system behavior remains unchanged
- Caller responsibilities remain unchanged
- Recovery strategies remain unchanged

**What cannot change:**
- Failure mode documentation (what failures are documented)
- Expected behavior (what happens when failures occur)
- Caller responsibilities (what callers must do)

**What can change:**
- Nothing. Failure modes are frozen.

**Reference:** [FAILURE_MODES.md](./FAILURE_MODES.md), [HOW_THIS_FAILS.md](./HOW_THIS_FAILS.md)

---

### 6. Undefined Behavior

**Frozen:** All undefined behavior specified in [API_CONTRACT.md](./API_CONTRACT.md)

**What this means:**
- Documented undefined behaviors remain undefined
- Undefined behaviors may change without notice
- Undefined behaviors are not guaranteed

**What cannot change:**
- The fact that these behaviors are undefined
- The documentation that they are undefined

**What can change:**
- The actual behavior (undefined behaviors may change)

**Reference:** [API_CONTRACT.md](./API_CONTRACT.md) - "Undefined Behavior" section

---

## What May Evolve in v1.x

**These may change in minor/patch versions:**

### 1. Performance Characteristics

**May evolve:**
- Write throughput (may improve)
- Read latency (may improve)
- Memory usage (may optimize)
- Disk usage (may optimize)
- Startup time (may improve)

**What is guaranteed:**
- Behavior remains unchanged
- Guarantees remain unchanged
- APIs remain unchanged

**What is not guaranteed:**
- Specific performance metrics
- Performance improvements
- Performance consistency

---

### 2. Internal Implementations

**May evolve:**
- Implementation classes (InMemoryStore, FilePersistentStore, etc.)
- Internal algorithms (indexing, resolution, etc.)
- Internal data structures
- Internal utilities

**What is guaranteed:**
- Public interfaces remain unchanged
- Public behavior remains unchanged
- Guarantees remain unchanged

**What is not guaranteed:**
- Implementation details
- Internal APIs
- Internal behavior

**Use public interfaces, not implementations.**

---

### 3. Tooling and Adapters

**May evolve:**
- Testing frameworks
- Adapter implementations (LangGraphAdapter, CrewAIAdapter)
- CLI tools
- Example code

**What is guaranteed:**
- Core APIs remain unchanged
- Core guarantees remain unchanged

**What is not guaranteed:**
- Tooling APIs
- Adapter APIs
- Example code correctness

**Tooling and adapters are internal and may change.**

---

### 4. Documentation

**May evolve:**
- Documentation clarity
- Documentation examples
- Documentation structure
- Non-normative notes

**What is guaranteed:**
- Guarantee wording remains unchanged (only referenced)
- Contract wording remains unchanged (only referenced)
- Core definitions remain unchanged

**What is not guaranteed:**
- Documentation examples
- Documentation structure
- Non-normative notes

**Documentation may be improved for clarity, but guarantees remain frozen.**

---

## What Is NOT Guaranteed

**These are explicitly not guaranteed:**

### 1. Distributed Execution

**Not guaranteed:**
- Multi-node execution
- Distributed storage
- Distributed consensus
- Network partitions

**Status:** Explicitly out of scope (see [NON_GOALS.md](./NON_GOALS.md))

---

### 2. Concurrent Writes

**Not guaranteed:**
- Concurrent writes to same org
- Concurrent checkpoints
- Concurrent compaction
- Thread safety

**Status:** Explicitly undefined behavior (see [API_CONTRACT.md](./API_CONTRACT.md))

---

### 3. Undefined Behaviors

**Not guaranteed:**
- Concurrent operations
- Modifying entries after creation
- Deleting entries
- Schema evolution
- Replay during writes
- Compaction during writes

**Status:** Explicitly undefined (see [API_CONTRACT.md](./API_CONTRACT.md))

---

### 4. Performance Metrics

**Not guaranteed:**
- Specific write throughput
- Specific read latency
- Specific memory usage
- Specific disk usage
- Performance consistency

**Status:** May evolve, not guaranteed

---

### 5. Availability

**Not guaranteed:**
- Uptime
- Availability percentage
- Service level agreements
- High availability

**Status:** Not in scope (see [NON_GOALS.md](./NON_GOALS.md))

---

### 6. Security

**Not guaranteed:**
- Encryption at rest
- Encryption in transit
- Access control
- Authentication
- Authorization

**Status:** Not in scope (see [NON_GOALS.md](./NON_GOALS.md))

---

## Summary

**Frozen in v1.x:**
- ✅ Determinism guarantees
- ✅ Persistence & recovery guarantees
- ✅ Compaction guarantees
- ✅ Public API contracts
- ✅ Failure modes
- ✅ Undefined behavior documentation

**May evolve in v1.x:**
- ⚠️ Performance characteristics
- ⚠️ Internal implementations
- ⚠️ Tooling and adapters
- ⚠️ Documentation (non-normative)

**Not guaranteed:**
- ❌ Distributed execution
- ❌ Concurrent writes
- ❌ Undefined behaviors
- ❌ Performance metrics
- ❌ Availability
- ❌ Security

**v1.x is stable. All documented guarantees and public APIs are frozen. Evolution within v1.x is additive and non-breaking only.**

---

**Version 1.0 (v1.x stability guarantees frozen)**

This document defines stability guarantees. Use it to understand what is frozen and what may evolve.
