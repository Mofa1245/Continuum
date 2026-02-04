# How Continuum Fails

This document is about what goes wrong. Not bugs - failure modes. How the system breaks, when it breaks, and what you can do about it.

**We document failures because trust requires honesty.**

---

## Three Types of Failures

### 1. Fatal Errors (Can't Continue)

These stop replay dead. You can't proceed. We detect them immediately and tell you clearly.

#### Checkpoint Corruption

**What happens:** The checkpoint is gone or broken. Replay can't start.

**When it happens:**
- Disk failure corrupted the file
- Someone deleted it
- Format changed and it's incompatible

**How we detect it:** Immediately when you try to replay. Clear error: "Checkpoint not found" or "Checkpoint corrupted".

**Can you recover?** No. The checkpoint is required. You can't replay without it.

**How to prevent it:**
- Validate checkpoints when you create them
- Back them up
- Use checksums to detect corruption

---

#### Memory Restoration Failure

**What happens:** Memory entries the checkpoint references are missing. Can't restore state.

**When it happens:**
- Memory was deleted after checkpoint was created
- Memory store got corrupted
- Migration failed and lost data

**How we detect it:** During restoration. Clear error: "Memory entries missing".

**Can you recover?** No. Need the memory to restore state.

**How to prevent it:**
- Don't delete memory that checkpoints reference
- Back up memory entries
- Validate memory integrity

---

#### Schema Incompatibility

**What happens:** Run was created with old schema, new schema is incompatible.

**When it happens:**
- You upgraded Continuum
- Schema changed in a breaking way
- Migration wasn't implemented

**How we detect it:** Version check when you try to replay. Clear error: "Schema version incompatible".

**Can you recover?** Maybe. Need to implement migration.

**How to prevent it:**
- Version your schemas
- Implement migrations
- Test migrations before upgrading

---

### 2. Divergence (Replay Fails)

These mean replay produced different outputs. We detect it and tell you where.

#### LLM Nondeterminism

**What happens:** LLM gave different output even with same seed/config.

**When it happens:**
- LLM doesn't actually support seeds (despite claiming to)
- LLM seed implementation is buggy
- Model changed between runs

**How we detect it:** Step-by-step comparison. We tell you: "Diverged at step N".

**Can you recover?** No. The LLM output is different. That's the reality.

**How to prevent it:**
- Use LLMs that actually support seeds
- Test seed support before relying on it
- Accept that some LLMs aren't deterministic

---

#### External API Nondeterminism

**What happens:** External API returned different response.

**When it happens:**
- API state changed between runs
- API response is non-deterministic
- You didn't mock the API in replay

**How we detect it:** Step-by-step comparison. We tell you: "Diverged at step N (API call)".

**Can you recover?** No. The API response is different.

**How to prevent it:**
- Mock external APIs in replay
- Capture API responses
- Accept divergence if you don't mock

---

#### Memory Write Order Mismatch

**What happens:** Memory was written in different order, state diverged.

**When it happens:**
- Agent execution order changed
- Parallel execution (not supported yet)
- Race condition in memory writes

**How we detect it:** Memory state comparison after each step. We tell you: "Memory state diverged at step N".

**Can you recover?** No. Memory state is different.

**How to prevent it:**
- Keep execution order deterministic
- Write memory sequentially
- Validate memory state after each step

---

### 3. Warnings (Replay Continues)

These are expected differences. We log them but don't stop.

#### Performance Degradation

**What happens:** Replay is slower than original.

**When it happens:** System is under load, resources are constrained, network is slow.

**Impact:** None. Performance isn't guaranteed. We log it and continue.

**What to do:** Nothing. This is expected.

---

#### Allowed Differences

**What happens:** Timestamps, IDs, metadata differ.

**When it happens:** Always. These are allowed to differ.

**Impact:** None. We normalize them out before comparison.

**What to do:** Nothing. This is by design.

---

## How We Detect Failures

**Before replay:**
- Checkpoint exists? ✓
- Checkpoint valid? ✓
- Memory store accessible? ✓
- Schema compatible? ✓

**During replay:**
- Memory state matches? ✓
- Step output matches? ✓
- Step order matches? ✓
- Memory writes match? ✓

**After replay:**
- Final output matches? ✓
- Memory state matches? ✓
- No fatal errors? ✓
- Consistency level achieved? ✓

---

## How to Prevent Failures

**For checkpoints:**
- Validate on creation
- Back them up
- Use checksums

**For memory:**
- Don't delete referenced entries
- Back up memory
- Validate integrity

**For schemas:**
- Version your schemas
- Implement migrations
- Test before upgrading

**For LLMs:**
- Use LLMs with seed support
- Test seed support
- Accept divergence if not supported

**For APIs:**
- Mock external APIs
- Capture responses
- Isolate dependencies

---

## Known Limitations

**LLM seed support:** Not all LLMs actually support seeds, even if they claim to. Test it.

**External API mocks:** We don't provide mocking in MVP. You need to build it or accept divergence.

**Schema migration:** Not implemented yet. You'll need to build it or don't upgrade.

**These are limitations, not bugs. We document them so you know what to expect.**

---

## Why We Document Failures

**Trust requires honesty.**

We document failures because:
- You need to know what can go wrong
- You need to make informed decisions
- You need to set correct expectations
- Production deployments need reality, not marketing

**This is how infrastructure earns credibility.**

---

**Version 1.0 - January 2024**

This document tells you how Continuum fails. Use it to make informed decisions.
