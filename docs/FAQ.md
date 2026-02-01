# Frequently Asked Questions

**Hard questions engineers will ask**

**Version 1.0 - January 2024**

---

## Why Not Event Sourcing?

**Question:** Why not use event sourcing? It provides state restoration and replay.

**Answer:** Event sourcing is general-purpose and requires custom agent integration. Continuum is agent-specific with built-in run tracking. Event sourcing does not capture nondeterministic inputs (seed, model config) or guarantee deterministic replay (external APIs vary). Continuum captures all nondeterministic inputs and guarantees deterministic replay (if assumptions are met).

**Reference:** [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Why Existing Approaches Fail" - "Event Sourcing"

**Key difference:** Continuum is agent-specific with deterministic replay guarantees. Event sourcing is general-purpose without deterministic replay guarantees.

---

## Why Not Just Logging?

**Question:** Why not just log agent decisions to files or databases? Logs provide visibility.

**Answer:** Logs are not structured (cannot replay), do not capture state (cannot restore context), are not deterministic (cannot reproduce exactly), and are not crash-consistent (may lose data). Continuum provides structured execution records, state capture (checkpoints), deterministic replay, and crash-consistent persistence.

**Reference:** [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Why Existing Approaches Fail" - "Ad-Hoc Logging"

**Key difference:** Logs provide visibility but not reproducibility. Continuum provides reproducibility with deterministic replay.

---

## Why Not Database Snapshots?

**Question:** Why not periodically snapshot agent state to a database? Snapshots provide persistence.

**Answer:** Snapshots are not fine-grained (lose intermediate state), do not capture execution context (cannot replay), are not crash-consistent (may be inconsistent), and do not guarantee determinism (external dependencies). Continuum provides fine-grained execution records, complete execution context, crash-consistent persistence, and deterministic replay guarantees.

**Reference:** [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Why Existing Approaches Fail" - "Database Snapshots"

**Key difference:** Snapshots provide state persistence but not deterministic replay. Continuum provides deterministic replay with formal guarantees.

---

## Why Not Framework X?

**Question:** Why not use [LangGraph/CrewAI/AutoGen]? They provide agent frameworks.

**Answer:** Agent frameworks provide agent execution, not deterministic replay infrastructure. Continuum is infrastructure that you integrate into frameworks, not a framework itself. Frameworks solve agent execution. Continuum solves determinism, auditability, and crash recovery. They are complementary, not competing.

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Why Continuum Is Infrastructure, Not a Framework"

**Key difference:** Frameworks provide agent execution. Continuum provides deterministic replay infrastructure. Use both together.

---

## Why Not Distributed?

**Question:** Why not support distributed execution? Most production systems are distributed.

**Answer:** Distributed determinism requires consensus protocols (Raft, Paxos) and is significantly more complex than single-node determinism. Continuum focuses on single-node determinism, which is the correct scope for most agent systems. Distributed execution can be added later if needed, but it is out of scope for v1.0.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution", [THREAT_MODEL.md](./THREAT_MODEL.md) - "What Continuum Does NOT Protect Against"

**Key difference:** Distributed execution is out of scope. Continuum is single-node only. Use distributed systems (consensus protocols) for multi-node reliability.

---

## Is This Production-Ready?

**Question:** Is Continuum production-ready? Can I use it in production?

**Answer:** Continuum v1.0 is stable and production-ready for single-node, single-threaded agent systems that meet the assumptions (deterministic LLM or accept divergence, mocked external APIs or accept divergence). It provides formal guarantees, crash recovery, and deterministic replay. It does not provide performance guarantees, security features, or availability guarantees. Use operating system security and service management for production deployment.

**Reference:** [V1_DECLARATION.md](./V1_DECLARATION.md), [ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md) - "Who SHOULD Use Continuum"

**Key point:** Production-ready for correct use cases. Not production-ready for incorrect use cases (distributed, high-performance, security-critical without external security).

---

## What Happens If Assumptions Are Violated?

**Question:** What happens if I violate the assumptions (concurrent writes, distributed execution, nondeterministic LLM, unmocked external APIs)?

**Answer:** Behavior is undefined. Guarantees are not applicable. System may fail silently, corrupt data, or produce incorrect results. Continuum does not protect against assumption violations. It is the caller's responsibility to satisfy assumptions.

**Reference:** [THREAT_MODEL.md](./THREAT_MODEL.md) - "Assumptions Required for Guarantees", [API_CONTRACT.md](./legal/API_CONTRACT.md) - "Undefined Behavior"

**Key point:** Assumptions are required. Violations cause undefined behavior. No guarantees if assumptions are violated.

---

## Why Not Just Use Git?

**Question:** Why not use Git for version control? It provides history and reproducibility.

**Answer:** Git is for code version control, not agent execution tracking. Git does not capture agent execution state, nondeterministic inputs (seed, model config), or enable deterministic replay. Continuum is for agent execution tracking, not code version control. They solve different problems.

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Why Continuum Is Infrastructure, Not a Framework" - "Continuum Is Like Git"

**Key difference:** Git is for code. Continuum is for agent execution. Use both together.

---

## Why Not Just Use a Database?

**Question:** Why not use a database (PostgreSQL, MongoDB) for persistence? Databases provide durability and consistency.

**Answer:** Databases provide persistence but not deterministic replay infrastructure. Databases do not capture execution context, nondeterministic inputs, or enable deterministic replay. Continuum provides agent-specific infrastructure (execution tracking, deterministic replay) that databases do not provide.

**Reference:** [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Why Existing Approaches Fail" - "Database Snapshots"

**Key difference:** Databases provide persistence. Continuum provides deterministic replay infrastructure. Use both together (Continuum can use databases for storage).

---

## Why Not Just Use Observability Tools?

**Question:** Why not use observability tools (Datadog, New Relic) for tracking? They provide visibility.

**Answer:** Observability tools provide visibility but not deterministic replay. They do not capture execution state, nondeterministic inputs, or enable deterministic replay. Continuum provides deterministic replay infrastructure that observability tools do not provide.

**Reference:** [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Why Existing Approaches Fail" - "Ad-Hoc Logging"

**Key difference:** Observability tools provide visibility. Continuum provides deterministic replay. Use both together.

---

## Why Not Just Use Testing Frameworks?

**Question:** Why not use testing frameworks (Jest, pytest) for testing? They provide test execution.

**Answer:** Testing frameworks provide test execution but not deterministic replay of agent runs. They do not capture agent execution state, nondeterministic inputs, or enable deterministic replay of production runs. Continuum provides deterministic replay infrastructure that testing frameworks do not provide.

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Problem 4: Agent Testing Is Impossible"

**Key difference:** Testing frameworks provide test execution. Continuum provides deterministic replay of agent runs. Use both together.

---

## Why Not Just Use Checkpoint Libraries?

**Question:** Why not use checkpoint libraries (PyTorch, TensorFlow) for checkpoints? They provide state snapshots.

**Answer:** Checkpoint libraries are for model training, not agent execution tracking. They do not capture agent execution context, nondeterministic inputs, or enable deterministic replay of agent workflows. Continuum provides agent-specific infrastructure that checkpoint libraries do not provide.

**Reference:** [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Continuum's Model" - "Agent Run Tracking"

**Key difference:** Checkpoint libraries are for model training. Continuum is for agent execution tracking. Different purposes.

---

## Why Not Just Use Workflow Engines?

**Question:** Why not use workflow engines (Temporal, Airflow) for workflows? They provide execution tracking.

**Answer:** Workflow engines provide workflow execution but not deterministic replay infrastructure. They do not capture nondeterministic inputs (seed, model config) or guarantee deterministic replay. Continuum provides deterministic replay infrastructure that workflow engines do not provide.

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Why Continuum Is Infrastructure, Not a Framework"

**Key difference:** Workflow engines provide workflow execution. Continuum provides deterministic replay infrastructure. Use both together.

---

## Why Not Just Use Time-Travel Debuggers?

**Question:** Why not use time-travel debuggers (rr, Undo) for debugging? They provide replay.

**Answer:** Time-travel debuggers are for low-level system debugging, not agent execution tracking. They do not capture agent execution context, memory state, or enable deterministic replay of agent workflows. Continuum provides agent-specific infrastructure that time-travel debuggers do not provide.

**Reference:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - "Problem 1: Agent Behavior is Unpredictable"

**Key difference:** Time-travel debuggers are for system debugging. Continuum is for agent execution tracking. Different purposes.

---

## Summary

**Common questions answered:**

- **Why not event sourcing?** Continuum is agent-specific with deterministic replay guarantees.
- **Why not just logging?** Logs provide visibility but not reproducibility.
- **Why not database snapshots?** Snapshots provide persistence but not deterministic replay.
- **Why not framework X?** Frameworks provide agent execution. Continuum provides deterministic replay infrastructure.
- **Why not distributed?** Distributed execution is out of scope. Continuum is single-node only.
- **Is this production-ready?** Yes, for correct use cases. No, for incorrect use cases.
- **What happens if assumptions are violated?** Behavior is undefined. Guarantees are not applicable.

**All answers reference existing documentation. No new claims are made.**

---

**Version 1.0 - January 2024**

This FAQ answers common questions. All answers reference existing documentation.
