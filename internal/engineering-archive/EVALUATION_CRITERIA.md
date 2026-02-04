# Evaluation Criteria

**How Continuum should be evaluated**

**Version 1.0 - January 2024**

---

## Purpose

This document defines how Continuum should be evaluated. It specifies what success looks like, what failure looks like, and what is out of scope for evaluation.

**This document prevents mis-evaluation by setting correct criteria.**

---

## What Success Looks Like

### Success Criterion 1: Deterministic Replay Works

**What to evaluate:**
- Same checkpoint + same operations → same memory state
- Same inputs + same memory state → same outputs
- Divergence is detected when outputs differ

**How to evaluate:**
1. Create an agent run with a checkpoint
2. Record agent steps with deterministic inputs (seed, model config)
3. Replay the run with the same inputs
4. Verify outputs match (or divergence is detected if they don't)

**Success:** Replay produces same outputs (or divergence is correctly detected).

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - "Replay Correctness"

---

### Success Criterion 2: Crash Recovery Works

**What to evaluate:**
- Entries written before crash are recovered
- Partial entries written during crash are skipped
- Checkpoints are recovered if written before crash
- State is restored exactly as before crash

**How to evaluate:**
1. Write memory entries
2. Create a checkpoint
3. Simulate a crash (process exit)
4. Restart and load state from disk
5. Verify all entries written before crash are recovered

**Success:** State is recovered exactly as before crash.

**Reference:** [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

### Success Criterion 3: Execution Records Are Complete

**What to evaluate:**
- All agent steps are recorded
- All memory writes are recorded
- All context resolutions are recorded
- Complete execution trace is available

**How to evaluate:**
1. Create an agent run
2. Execute agent steps
3. Write memory entries
4. Resolve context
5. Verify all steps, writes, and resolutions are recorded

**Success:** Complete execution record is available for replay.

**Reference:** [API_CONTRACT.md](./legal/API_CONTRACT.md) - "AgentRunStore Invariants"

---

### Success Criterion 4: Guarantees Are Met

**What to evaluate:**
- Memory State Determinism guarantee is met
- Agent Decision Determinism guarantee is met
- Replay Correctness guarantee is met
- Crash Recovery guarantee is met

**How to evaluate:**
1. Review formal contracts
2. Test each guarantee
3. Verify guarantees are met under assumptions

**Success:** All guarantees are met when assumptions are satisfied.

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md), [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

## What Failure Looks Like

### Failure Criterion 1: Deterministic Replay Fails

**What indicates failure:**
- Same inputs produce different outputs (divergence not detected)
- Replay fails when it should succeed (checkpoint valid, inputs identical)
- Divergence is reported when outputs match (false positive)

**How to evaluate:**
1. Create an agent run with deterministic inputs
2. Replay with same inputs
3. Verify outputs match (or divergence is correctly detected)

**Failure:** Replay produces different outputs without detecting divergence, or divergence is incorrectly reported.

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - "Replay Correctness"

---

### Failure Criterion 2: Crash Recovery Fails

**What indicates failure:**
- Entries written before crash are not recovered
- Corrupted entries are not detected
- Checkpoints are not recovered
- State is inconsistent after recovery

**How to evaluate:**
1. Write memory entries
2. Create a checkpoint
3. Simulate a crash
4. Restart and load state
5. Verify all entries are recovered correctly

**Failure:** State is not recovered correctly, or corruption is not detected.

**Reference:** [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

### Failure Criterion 3: Guarantees Are Not Met

**What indicates failure:**
- Guarantees are violated under assumptions
- Guarantees are not documented
- Guarantees are ambiguous

**How to evaluate:**
1. Review formal contracts
2. Test each guarantee
3. Verify guarantees are met under assumptions

**Failure:** Guarantees are violated when assumptions are satisfied, or guarantees are not documented.

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md), [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

## What Is Out of Scope for Evaluation

### Performance

**Do not evaluate on:**
- Write throughput (not guaranteed)
- Read latency (not guaranteed)
- Memory usage (not guaranteed)
- Disk usage (not guaranteed)
- Performance consistency (not guaranteed)

**Why:** Performance is not part of the contract. Correctness is the focus.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### Security

**Do not evaluate on:**
- Encryption (not provided)
- Access control (not provided)
- Authentication (not provided)
- Authorization (not provided)

**Why:** Security is out of scope. Continuum is a correctness layer, not a security layer.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Security"

---

### Availability

**Do not evaluate on:**
- Uptime (not guaranteed)
- Availability percentage (not guaranteed)
- Service level agreements (not guaranteed)
- High availability (not guaranteed)

**Why:** Availability is out of scope. Continuum is infrastructure, not a service.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### Distributed Execution

**Do not evaluate on:**
- Multi-node execution (not supported)
- Distributed storage (not supported)
- Network partitions (not supported)
- Distributed consensus (not supported)

**Why:** Distributed execution is out of scope. Continuum is single-node only.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md) - "Distributed Execution"

---

### Concurrent Writes

**Do not evaluate on:**
- Thread safety (not supported)
- Race conditions (not supported)
- Concurrent writes (undefined behavior)

**Why:** Concurrent writes are undefined behavior. Continuum is single-threaded only.

**Reference:** [API_CONTRACT.md](./legal/API_CONTRACT.md) - "Undefined Behavior"

---

## Criteria Reviewers Should Use

### Criterion 1: Correctness

**Evaluate:**
- Do guarantees hold under assumptions?
- Is deterministic replay correct?
- Is crash recovery correct?
- Are execution records complete?

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md), [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)

---

### Criterion 2: Documentation

**Evaluate:**
- Are guarantees documented?
- Are limitations explicit?
- Are assumptions clear?
- Are failure modes documented?

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md), [THREAT_MODEL.md](./THREAT_MODEL.md), [FAILURE_MODES.md](./legal/FAILURE_MODES.md)

---

### Criterion 3: Scope Boundaries

**Evaluate:**
- Are non-goals explicit?
- Are limitations clear?
- Are assumptions documented?
- Are undefined behaviors specified?

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md), [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md), [API_CONTRACT.md](./legal/API_CONTRACT.md)

---

### Criterion 4: Use Case Fit

**Evaluate:**
- Does Continuum fit the use case?
- Are assumptions satisfied?
- Are limitations acceptable?
- Are guarantees sufficient?

**Reference:** [ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md)

---

## Criteria Reviewers Should NOT Use

### Criterion 1: Performance

**Do not evaluate on:**
- Write throughput
- Read latency
- Memory usage
- Performance consistency

**Why:** Performance is not part of the contract. Correctness is the focus.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

### Criterion 2: Features It Does Not Claim

**Do not evaluate on:**
- Distributed execution
- Security features
- Availability guarantees
- Performance guarantees

**Why:** These are explicit non-goals. Evaluating on them is mis-evaluation.

**Reference:** [NON_GOALS.md](./legal/NON_GOALS.md), [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md)

---

### Criterion 3: Comparison to Different Tools

**Do not evaluate by comparing to:**
- Event sourcing (different purpose)
- Logging (different purpose)
- Databases (different purpose)
- Frameworks (different purpose)

**Why:** These solve different problems. Comparing to them is mis-evaluation.

**Reference:** [FAQ.md](./FAQ.md), [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - "Why Existing Approaches Fail"

---

## Evaluation Process

### Step 1: Understand the Problem

**Read:**
- [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - What problem Continuum solves
- [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - Problem statement

**Understand:**
- What is the problem?
- Why does it matter?
- What are the consequences?

---

### Step 2: Understand the Solution

**Read:**
- [CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md) - Continuum's model
- [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md) - Guarantees
- [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md) - Recovery guarantees

**Understand:**
- What is the solution?
- How does it work?
- What are the guarantees?

---

### Step 3: Understand the Limitations

**Read:**
- [NON_GOALS.md](./legal/NON_GOALS.md) - Explicit non-goals
- [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - What is NOT guaranteed
- [THREAT_MODEL.md](./THREAT_MODEL.md) - What Continuum does NOT protect against

**Understand:**
- What are the limitations?
- What are the assumptions?
- What are the consequences of violation?

---

### Step 4: Evaluate Correctness

**Test:**
- Deterministic replay (same inputs → same outputs)
- Crash recovery (state recovered correctly)
- Execution records (complete trace)
- Guarantees (met under assumptions)

**Verify:**
- Guarantees are met
- Limitations are explicit
- Assumptions are clear
- Failure modes are documented

---

### Step 5: Evaluate Use Case Fit

**Determine:**
- Does Continuum fit the use case?
- Are assumptions satisfied?
- Are limitations acceptable?
- Are guarantees sufficient?

**Reference:** [ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md)

---

## Summary

**What success looks like:**
- ✅ Deterministic replay works
- ✅ Crash recovery works
- ✅ Execution records are complete
- ✅ Guarantees are met

**What failure looks like:**
- ❌ Deterministic replay fails
- ❌ Crash recovery fails
- ❌ Guarantees are not met

**What is out of scope:**
- ⚠️ Performance (not guaranteed)
- ⚠️ Security (not provided)
- ⚠️ Availability (not guaranteed)
- ⚠️ Distributed execution (not supported)
- ⚠️ Concurrent writes (undefined behavior)

**Criteria reviewers should use:**
- ✅ Correctness (guarantees hold)
- ✅ Documentation (guarantees documented)
- ✅ Scope boundaries (non-goals explicit)
- ✅ Use case fit (fits use case)

**Criteria reviewers should NOT use:**
- ❌ Performance (not part of contract)
- ❌ Features it does not claim (explicit non-goals)
- ❌ Comparison to different tools (different purposes)

**Evaluation process:**
1. Understand the problem
2. Understand the solution
3. Understand the limitations
4. Evaluate correctness
5. Evaluate use case fit

---

**Version 1.0 - January 2024**

This document defines evaluation criteria. Use it to evaluate Continuum correctly.
