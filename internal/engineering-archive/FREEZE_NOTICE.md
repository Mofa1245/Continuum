# Core Semantics Freeze Notice

**Effective Date:** January 2024  
**Status:** ACTIVE

---

## What Is Frozen

The following core semantics are **locked** and will not change during external review:

### 1. Replay Invariants
**File:** `docs/testing/REPLAY_INVARIANTS.md`

- What must match on replay (strict invariants)
- What can differ (allowed differences)
- Divergence detection rules
- Error classification

### 2. Determinism Contract
**File:** `docs/legal/DETERMINISM_CONTRACT.md`

- The three formal guarantees:
  1. Memory State Determinism
  2. Agent Decision Determinism
  3. Replay Correctness
- Non-guarantees
- Compliance levels

### 3. Failure Classifications
**File:** `docs/legal/HOW_THIS_FAILS.md`

- Fatal errors (can't continue)
- Divergence (output differs)
- Warnings (non-fatal issues)
- Detection mechanisms
- Recovery strategies

### 4. Nondeterminism Boundaries
**File:** `docs/architecture/NONDETERMINISM_BOUNDARY.md`

- Pure components (deterministic)
- Impure components (nondeterministic)
- Where randomness enters the system
- How nondeterminism is contained

---

## What This Means

**Frozen means:**
- ✅ No refactors to these semantics
- ✅ No "small improvements" to guarantees
- ✅ No behavior changes to core contracts
- ✅ No scope expansion
- ✅ Documentation clarity fixes only (if needed)

**Not frozen:**
- Implementation details (can optimize)
- API ergonomics (can improve UX)
- Performance (can optimize)
- New features (can add, but not change guarantees)

---

## Why This Matters

Reviewers must evaluate a **stable contract**, not a moving target.

If guarantees change during review, reviewers can't trust what they're evaluating. This freeze ensures:

1. **Reviewers can rely on what they read** - guarantees won't shift mid-review
2. **Comparisons are valid** - same contract throughout review period
3. **Trust is built** - stability signals seriousness

---

## Review Period

This freeze is active during the external review window (typically 1-2 weeks).

After review:
- Fix documentation clarity issues (if any)
- Fix bugs ONLY if they violate stated guarantees
- Do NOT expand scope
- Document review results in `docs/EXTERNAL_REVIEW_NOTES.md`

---

## Status

**Current Status:** FROZEN

**Next Action:** External review (Step 1-3)

**Unfreeze Condition:** After external review window closes and results are documented

---

**Last Updated:** January 2024

