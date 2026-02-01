# Threat Model

**Explicit threat and misuse analysis for Continuum**

**Version 1.0 - January 2024**

---

## Purpose

This document explicitly defines:
- What Continuum protects against
- What it explicitly does NOT protect against
- Assumptions required for guarantees
- Consequences of violating assumptions
- Why exclusions are intentional and acceptable

**This is not a security document. This is a correctness and reliability analysis.**

---

## What Continuum Protects Against

### 1. State Loss on Crashes

**Threat:** Process crashes lose in-memory state.

**Protection:**
- Append-only log persists all entries
- Checkpoints persist memory state
- State can be recovered from disk

**Mechanism:**
- Write-ahead logging (entries written before return)
- Atomic checkpoint writes (temp file + rename)
- Checksum validation (corruption detection)

**Limitation:** Only protects against process crashes. Does not protect against disk failures, hardware failures, or data center outages.

**Reference:** [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

### 2. Memory Corruption

**Threat:** Memory entries or checkpoints are corrupted on disk.

**Protection:**
- Checksums verify entry integrity
- Checksums verify checkpoint integrity
- Corrupted entries are skipped (not loaded)
- Corrupted checkpoints are rejected (cannot replay)

**Mechanism:**
- SHA-256 checksums on all entries
- SHA-256 checksums on all checkpoints
- Validation on load (corruption detected)
- Skip corrupted entries (valid entries recovered)

**Limitation:** Only detects corruption. Does not repair corruption. Corrupted data is lost.

**Reference:** [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md) - "Corruption Detection"

---

### 3. Nondeterministic Replay

**Threat:** Replay produces different outputs than original run.

**Protection:**
- Divergence detection (zero false positives)
- Step-by-step comparison (immediate detection)
- Clear reporting (where divergence occurred)

**Mechanism:**
- Same checkpoint → same memory state
- Same seed → same LLM outputs (if supported)
- Same config → same behavior
- Output comparison → divergence detection

**Limitation:** Only detects divergence. Does not prevent divergence. Divergence may occur if LLM doesn't support seed or external APIs are not mocked.

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - "Replay Correctness"

---

### 4. Incomplete Execution Records

**Threat:** Agent runs are not fully recorded.

**Protection:**
- Complete execution records (all steps, all decisions)
- Checkpoint at start (memory state captured)
- Sequential steps (totally ordered)
- Immutable runs (cannot modify after creation)

**Mechanism:**
- Run creation captures initial state
- Step appending records all decisions
- Run completion captures final state
- Immutability prevents modification

**Limitation:** Only protects if steps are recorded. Does not protect if steps are not recorded (caller responsibility).

**Reference:** [API_CONTRACT.md](./legal/API_CONTRACT.md) - "AgentRunStore Invariants"

---

## What Continuum Does NOT Protect Against

### 1. Security Threats

**Not protected:**
- Unauthorized access (no authentication)
- Data theft (no encryption)
- Tampering (no integrity checks beyond checksums)
- Denial of service (no rate limiting)

**Why:** Security is out of scope. Continuum is a correctness layer, not a security layer.

**Consequence:** Continuum data is accessible to anyone with file system access. Use operating system security (file permissions, encryption) for protection.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Security"

---

### 2. Distributed Failures

**Not protected:**
- Network partitions (single-node only)
- Multi-node inconsistencies (no consensus)
- Distributed corruption (no replication)
- Split-brain scenarios (no coordination)

**Why:** Distributed execution is out of scope. Continuum is single-node only.

**Consequence:** Continuum does not work across multiple nodes. Use distributed systems (consensus protocols, replication) for multi-node reliability.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution"

---

### 3. Concurrent Access

**Not protected:**
- Race conditions (single-threaded only)
- Concurrent writes (undefined behavior)
- Thread safety (no locking)
- Data races (no synchronization)

**Why:** Concurrent access is out of scope. Continuum is single-threaded only.

**Consequence:** Concurrent access may cause corruption, data loss, or undefined behavior. Use single-threaded execution or external synchronization.

**Reference:** [API_CONTRACT.md](./legal/API_CONTRACT.md) - "Undefined Behavior"

---

### 4. Performance Issues

**Not protected:**
- Slow writes (no performance guarantees)
- Slow reads (no performance guarantees)
- High memory usage (no resource limits)
- Disk space exhaustion (no quotas)

**Why:** Performance is out of scope. Continuum focuses on correctness, not performance.

**Consequence:** Performance may degrade with large datasets or high write rates. Use performance optimization (indexing, caching, batching) if needed.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### 5. Availability Issues

**Not protected:**
- Process crashes (no automatic restart)
- Disk failures (no replication)
- Data center outages (no redundancy)
- Service unavailability (no high availability)

**Why:** Availability is out of scope. Continuum is infrastructure, not a service.

**Consequence:** Continuum does not provide high availability. Use service management (process managers, load balancers, replication) for availability.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### 6. Schema Evolution

**Not protected:**
- Schema changes (no automatic migration)
- Backward incompatibility (no compatibility layer)
- Data format changes (no conversion)
- Version mismatches (no automatic upgrade)

**Why:** Schema evolution is out of scope. Schema changes require explicit migration.

**Consequence:** Schema changes may break replay. Use explicit migration (version checks, data conversion) for schema evolution.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Schema Evolution"

---

## Assumptions Required for Guarantees

### Assumption 1: Single-Threaded Execution

**Requirement:** All operations are single-threaded. No concurrent access.

**Why required:** Concurrent access may cause race conditions, corruption, or undefined behavior.

**Consequence of violation:**
- Behavior undefined (may cause corruption)
- Guarantees not applicable
- System may fail silently

**How to satisfy:** Use single-threaded execution or external synchronization (locks, queues).

**Reference:** [API_CONTRACT.md](./legal/API_CONTRACT.md) - "Undefined Behavior"

---

### Assumption 2: Single-Node Execution

**Requirement:** All operations are on a single node. No distributed execution.

**Why required:** Distributed execution requires consensus protocols. Single-node determinism is the scope.

**Consequence of violation:**
- Behavior undefined (no consensus)
- Guarantees not applicable
- System may be inconsistent

**How to satisfy:** Use single-node execution or distributed systems (consensus, replication) for multi-node reliability.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution"

---

### Assumption 3: Deterministic LLM

**Requirement:** LLM supports seed parameter for deterministic outputs.

**Why required:** Nondeterministic LLM outputs cause replay divergence.

**Consequence of violation:**
- Replay may diverge (detected)
- Guarantees not applicable
- Divergence reported

**How to satisfy:** Use LLMs that support seed parameter (OpenAI GPT-4, Anthropic Claude) or accept divergence.

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - "Agent Decision Determinism"

---

### Assumption 4: Mocked External APIs

**Requirement:** External APIs are mocked or deterministic.

**Why required:** Nondeterministic external API responses cause replay divergence.

**Consequence of violation:**
- Replay may diverge (detected)
- Guarantees not applicable
- Divergence reported

**How to satisfy:** Mock external APIs in replay mode or accept divergence.

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - "Agent Decision Determinism"

---

### Assumption 5: Valid Checkpoints

**Requirement:** Checkpoints are not corrupted. Checkpoints exist when needed.

**Why required:** Corrupted or missing checkpoints cannot be used for replay.

**Consequence of violation:**
- Replay fails (fatal error)
- Guarantees not applicable
- Error reported

**How to satisfy:** Ensure checkpoints are not corrupted (checksums verify integrity) and exist when needed (create checkpoints before replay).

**Reference:** [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md) - "Checkpoint Recovery"

---

### Assumption 6: Sufficient Disk Space

**Requirement:** Disk has sufficient space for writes.

**Why required:** Disk full causes write failures.

**Consequence of violation:**
- Writes fail (error thrown)
- State may be inconsistent
- Error reported

**How to satisfy:** Monitor disk space and free space before writes.

**Reference:** [FAILURE_MODES.md](./legal/FAILURE_MODES.md) - "Disk Full"

---

## Why Exclusions Are Intentional and Acceptable

### Security Exclusions

**Why intentional:** Security requires domain-specific knowledge (authentication, encryption, access control). Continuum focuses on correctness, not security.

**Why acceptable:** Operating systems provide security primitives (file permissions, encryption). Continuum can be used with existing security infrastructure.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Security"

---

### Distributed Exclusions

**Why intentional:** Distributed determinism requires consensus protocols (Raft, Paxos). Single-node determinism is the scope.

**Why acceptable:** Most agent systems are single-node. Distributed execution can be added later if needed.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution"

---

### Performance Exclusions

**Why intentional:** Performance optimization requires profiling, benchmarking, and trade-offs. Correctness is the focus.

**Why acceptable:** Performance can be optimized later if needed. Correctness is more important than performance for infrastructure.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve"

---

### Availability Exclusions

**Why intentional:** High availability requires service management (process managers, load balancers, replication). Continuum is infrastructure, not a service.

**Why acceptable:** Service management can be added externally. Continuum provides correctness, not availability.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

## Summary

**What Continuum protects against:**
- ✅ State loss on crashes
- ✅ Memory corruption
- ✅ Nondeterministic replay (detection)
- ✅ Incomplete execution records

**What Continuum does NOT protect against:**
- ❌ Security threats
- ❌ Distributed failures
- ❌ Concurrent access
- ❌ Performance issues
- ❌ Availability issues
- ❌ Schema evolution

**Assumptions required:**
- Single-threaded execution
- Single-node execution
- Deterministic LLM (or accept divergence)
- Mocked external APIs (or accept divergence)
- Valid checkpoints
- Sufficient disk space

**Exclusions are intentional and acceptable because:**
- Security can be added externally
- Distributed execution is out of scope
- Performance can be optimized later
- Availability can be managed externally

**All protections, exclusions, and assumptions are explicit. All consequences are documented.**

---

**Version 1.0 - January 2024**

This document defines Continuum's threat model. Use it to understand what Continuum protects against and what it does not.
