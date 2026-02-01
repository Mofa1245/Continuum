# Adoption Guide

**Who should use Continuum, who should not, and when it is the right tool**

**Version 1.0 - January 2024**

---

## Who SHOULD Use Continuum

### 1. Teams Building Production Agent Systems

**Use case:** Building AI agents for production use (customer-facing, business-critical).

**Why Continuum fits:**
- Need deterministic replay for debugging
- Need audit trail for compliance
- Need crash recovery for reliability
- Need testing capability for quality

**Requirements:**
- Single-node deployment (no distributed execution)
- Single-threaded execution (no concurrent writes)
- Deterministic LLM (seed support) or accept divergence
- Mocked external APIs (for replay) or accept divergence

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "What Problem Continuum Solves"

---

### 2. Teams Requiring Compliance and Auditing

**Use case:** Building agents that must demonstrate correctness, compliance, or auditability.

**Why Continuum fits:**
- Complete execution records (every decision)
- Deterministic replay (prove correctness)
- Audit trail (compliance evidence)
- Reproducibility (regulatory requirements)

**Requirements:**
- Need to prove agent decisions
- Need to demonstrate compliance
- Need to audit execution paths
- Need to reproduce issues

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - "Agent Decision Determinism"

---

### 3. Teams Building Agent Testing Infrastructure

**Use case:** Building testing frameworks, regression tests, or quality assurance for agents.

**Why Continuum fits:**
- Deterministic replay (reproduce bugs)
- Regression testing (compare versions)
- Divergence detection (find issues)
- State restoration (test from checkpoints)

**Requirements:**
- Need to test agent changes
- Need to verify fixes
- Need to compare versions
- Need to reproduce bugs

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Problem 4: Agent Testing Is Impossible"

---

### 4. Teams Debugging Complex Agent Workflows

**Use case:** Debugging agent workflows with many steps, complex state, or hard-to-reproduce bugs.

**Why Continuum fits:**
- Complete execution trace (every step)
- State restoration (exact context)
- Deterministic replay (reproduce exactly)
- Divergence detection (find where it breaks)

**Requirements:**
- Need to debug agent behavior
- Need to understand execution paths
- Need to reproduce bugs
- Need to trace decisions

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Problem 1: Agent Behavior is Unpredictable"

---

## Who SHOULD NOT Use Continuum

### 1. Teams Requiring Distributed Execution

**Use case:** Building agents that run across multiple nodes, require consensus, or need distributed coordination.

**Why Continuum does not fit:**
- Single-node only (no distributed execution)
- No consensus protocols (no coordination)
- No replication (no redundancy)
- No network partition handling

**Alternatives:**
- Use distributed systems (Raft, Paxos) for consensus
- Use replication (multi-master, sharding) for redundancy
- Use coordination (Zookeeper, etcd) for coordination

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution"

---

### 2. Teams Requiring High Performance

**Use case:** Building agents that require high throughput, low latency, or real-time performance.

**Why Continuum does not fit:**
- No performance guarantees (correctness focus)
- Write overhead (append-only log, checksums)
- Read overhead (state restoration, validation)
- No optimization (not performance-focused)

**Alternatives:**
- Use in-memory stores (Redis, Memcached) for performance
- Use optimized databases (PostgreSQL, MongoDB) for throughput
- Use caching layers (CDN, cache) for latency

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### 3. Teams Requiring Security Features

**Use case:** Building agents that require encryption, access control, authentication, or authorization.

**Why Continuum does not fit:**
- No encryption (data stored in plain text)
- No access control (file system permissions only)
- No authentication (no user management)
- No authorization (no role-based access)

**Alternatives:**
- Use encryption (LUKS, BitLocker) for disk encryption
- Use access control (file permissions, ACLs) for file access
- Use authentication (OAuth, JWT) for user authentication
- Use authorization (RBAC, ABAC) for role-based access

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Security"

---

### 4. Teams Building Simple Prototypes

**Use case:** Building simple prototypes, demos, or proof-of-concepts that don't need determinism.

**Why Continuum may not fit:**
- Overhead (persistence, tracking, replay)
- Complexity (checkpoints, state management)
- Requirements (deterministic LLM, mocked APIs)
- Not needed (prototypes don't need determinism)

**Alternatives:**
- Use simple logging (console.log, files) for visibility
- Use in-memory storage (variables, objects) for simplicity
- Use framework solutions (LangGraph, CrewAI) for integration

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Why Continuum Is Infrastructure, Not a Framework"

---

## When Continuum Is the Right Tool

### Scenario 1: Production Agent System

**Situation:** Building a production agent system that must be reliable, debuggable, and auditable.

**Continuum provides:**
- Deterministic replay (debug production issues)
- Crash recovery (survive process crashes)
- Audit trail (compliance evidence)
- Testing capability (regression tests)

**Right tool:** ✅ Yes

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md)

---

### Scenario 2: Compliance and Auditing

**Situation:** Building agents that must demonstrate correctness, compliance, or auditability.

**Continuum provides:**
- Complete execution records (every decision)
- Deterministic replay (prove correctness)
- Audit trail (compliance evidence)
- Reproducibility (regulatory requirements)

**Right tool:** ✅ Yes

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md)

---

### Scenario 3: Complex Debugging

**Situation:** Debugging agent workflows with many steps, complex state, or hard-to-reproduce bugs.

**Continuum provides:**
- Complete execution trace (every step)
- State restoration (exact context)
- Deterministic replay (reproduce exactly)
- Divergence detection (find where it breaks)

**Right tool:** ✅ Yes

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Problem 1: Agent Behavior is Unpredictable"

---

### Scenario 4: Agent Testing

**Situation:** Building testing frameworks, regression tests, or quality assurance for agents.

**Continuum provides:**
- Deterministic replay (reproduce bugs)
- Regression testing (compare versions)
- Divergence detection (find issues)
- State restoration (test from checkpoints)

**Right tool:** ✅ Yes

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Problem 4: Agent Testing Is Impossible"

---

## When Continuum Is the Wrong Tool

### Scenario 1: Distributed Agent System

**Situation:** Building agents that run across multiple nodes, require consensus, or need distributed coordination.

**Continuum limitations:**
- Single-node only (no distributed execution)
- No consensus protocols (no coordination)
- No replication (no redundancy)

**Wrong tool:** ❌ Yes

**Alternatives:** Use distributed systems (Raft, Paxos) for consensus, replication for redundancy.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution"

---

### Scenario 2: High-Performance System

**Situation:** Building agents that require high throughput, low latency, or real-time performance.

**Continuum limitations:**
- No performance guarantees (correctness focus)
- Write overhead (append-only log, checksums)
- Read overhead (state restoration, validation)

**Wrong tool:** ❌ Yes

**Alternatives:** Use in-memory stores (Redis) for performance, optimized databases (PostgreSQL) for throughput.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### Scenario 3: Security-Critical System

**Situation:** Building agents that require encryption, access control, authentication, or authorization.

**Continuum limitations:**
- No encryption (data stored in plain text)
- No access control (file system permissions only)
- No authentication (no user management)

**Wrong tool:** ❌ Yes (without external security)

**Alternatives:** Use encryption (LUKS) for disk encryption, access control (file permissions) for file access.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Security"

---

### Scenario 4: Simple Prototype

**Situation:** Building simple prototypes, demos, or proof-of-concepts that don't need determinism.

**Continuum overhead:**
- Persistence (disk writes, checksums)
- Tracking (execution records, checkpoints)
- Complexity (state management, replay)

**Wrong tool:** ⚠️ Probably (overhead not justified)

**Alternatives:** Use simple logging (console.log) for visibility, in-memory storage for simplicity.

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Why Continuum Is Infrastructure, Not a Framework"

---

## Integration Patterns

### Pattern 1: Direct Integration

**Approach:** Use Continuum directly in agent code.

**When to use:**
- Custom agent framework
- Full control over execution
- Need fine-grained tracking

**Example:**
```typescript
const memoryStore = new InMemoryStore(persistentStore);
const runStore = new InMemoryAgentRunStore(memoryStore);
const resolver = new Resolver(memoryStore);

// Create run
const run = await runStore.create({ ... });

// Record steps
await runStore.appendStep({ ... });

// Write memory
await memoryStore.write({ ... });
```

**Reference:** [INTEGRATION_GUIDE.md](./integration/INTEGRATION_GUIDE.md)

---

### Pattern 2: Adapter Integration

**Approach:** Use Continuum adapters for agent frameworks.

**When to use:**
- Using existing agent framework (LangGraph, CrewAI)
- Want framework-specific integration
- Need quick integration

**Example:**
```typescript
const adapter = new LangGraphAdapter(
  memoryStore,
  runStore,
  resolver,
  identity
);

// Start run
const runId = await adapter.startRun(task);

// Record node
await adapter.recordNode(runId, nodeName, input, output);
```

**Reference:** [src/adapters/langgraph/README.md](../src/adapters/langgraph/README.md)

**Note:** Adapters are non-core and non-stable. Use as reference, not production code.

---

### Pattern 3: Minimal Agent Integration

**Approach:** Use Continuum's MinimalAgent for simple agent loops.

**When to use:**
- Simple agent workflows
- Need basic tracking
- Want minimal setup

**Example:**
```typescript
const agent = new MinimalAgent(
  memoryStore,
  runStore,
  resolver,
  identity
);

// Execute agent
const result = await agent.execute(task, executeFunction);
```

**Reference:** [AGENT_LOOP_INTEGRATION.md](./integration/AGENT_LOOP_INTEGRATION.md)

---

## Operational Expectations

### Disk Space

**Expectation:** Disk space grows with usage. Log files grow indefinitely until compaction.

**Management:**
- Monitor disk usage
- Compact logs regularly
- Archive old data if needed

**Reference:** [COMPACTION_GUIDE.md](./operational/COMPACTION_GUIDE.md)

---

### Performance

**Expectation:** Performance may vary. No performance guarantees.

**Characteristics:**
- Write overhead (append-only log, checksums)
- Read overhead (state restoration, validation)
- Startup time (load from disk)

**Optimization:**
- Compact logs (reduce disk usage)
- Index optimization (faster reads)
- Caching (reduce disk reads)

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve"

---

### Reliability

**Expectation:** State survives crashes. Corrupted data is detected.

**Characteristics:**
- Crash recovery (state restored from disk)
- Corruption detection (checksums verify integrity)
- No automatic repair (corrupted data is lost)

**Management:**
- Monitor for corruption warnings
- Back up data regularly
- Handle corruption errors

**Reference:** [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

### Maintenance

**Expectation:** Minimal maintenance required. Log compaction is optional.

**Tasks:**
- Compact logs (optional, reduces disk usage)
- Monitor disk space (required)
- Handle errors (required)

**Reference:** [COMPACTION_GUIDE.md](./operational/COMPACTION_GUIDE.md)

---

## Summary

**Who should use Continuum:**
- ✅ Teams building production agent systems
- ✅ Teams requiring compliance and auditing
- ✅ Teams building agent testing infrastructure
- ✅ Teams debugging complex agent workflows

**Who should not use Continuum:**
- ❌ Teams requiring distributed execution
- ❌ Teams requiring high performance
- ❌ Teams requiring security features
- ❌ Teams building simple prototypes

**When Continuum is the right tool:**
- Production agent systems
- Compliance and auditing
- Complex debugging
- Agent testing

**When Continuum is the wrong tool:**
- Distributed agent systems
- High-performance systems
- Security-critical systems (without external security)
- Simple prototypes

**Integration patterns:**
- Direct integration (custom frameworks)
- Adapter integration (existing frameworks)
- Minimal agent integration (simple workflows)

**Operational expectations:**
- Disk space grows with usage
- Performance may vary
- State survives crashes
- Minimal maintenance required

---

**Version 1.0 - January 2024**

This guide helps you decide if Continuum is the right tool for your use case.
