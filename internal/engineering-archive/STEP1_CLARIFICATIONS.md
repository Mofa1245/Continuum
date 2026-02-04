# Step 1 Clarifications - Critical Issues Addressed

**Date:** January 2024  
**Status:** Complete

This document summarizes the clarifications made to address the 8 critical issues identified in the hostile review.

---

## What Was Done

### 1. Created DEFINITIONS.md

**File:** `docs/legal/DEFINITIONS.md`

**Purpose:** Explicitly defines all terms used in the determinism contract.

**Key Definitions Added:**
- **Determinism (for Continuum)** - What determinism means for this system
- **Agent Decision** - One AgentStep, atomic, sequential
- **Same Checkpoint** - Content-based equality, not reference
- **Same Operation** - Input and state-based equality
- **Identical Memory State** - Deep equality semantics
- **Valid Checkpoint** - Explicit validation criteria
- **Memory Store Consistency** - What consistency means
- **Divergence** - What counts as divergence
- **Replay Correctness** - When replay is correct

**Also Defined:**
- Equality semantics (floating point, time zones, encoding, object properties, whitespace)
- Ordering guarantees (step ordering, memory write ordering, operation ordering)
- System scope (single-threaded, in-memory, single-node)

**Impact:** All 8 critical ambiguities are now explicitly defined.

---

### 2. Updated DETERMINISM_CONTRACT.md

**Changes:**
- Added reference to DEFINITIONS.md at the top
- Updated all three guarantees to reference defined terms
- Added explicit scope statements (single-threaded, single-node, in-memory)
- Clarified what "same" means in each guarantee
- Added explicit non-guarantees section (durability, availability, security, performance)
- Tightened error messages and failure descriptions
- Added responsibility section mentioning DEFINITIONS.md

**Impact:** Contract now uses defined terms, removing ambiguity.

---

### 3. Updated REVIEWER_GUIDE.md

**Changes:**
- Added DEFINITIONS.md as first reading step
- Updated "What do we guarantee" to reference definitions
- Clarified current status section with explicit scope (single-threaded, single-node, in-memory)
- Added explicit list of what's missing (durability, availability, security, performance)
- Clarified that this is "infrastructure-grade kernel work", not production system
- Updated "Where to start" to include definitions first

**Impact:** Reviewers now know to read definitions first, and understand MVP limitations.

---

### 4. Updated docs/README.md

**Changes:**
- Added DEFINITIONS.md as first item in legal section
- Marked it as "START HERE"

**Impact:** Definitions are prominently featured in documentation index.

---

## Critical Issues Addressed

### ✅ Issue 1: Ambiguous "same" definitions
**Fixed:** DEFINITIONS.md defines "Same Checkpoint", "Same Operation", "Identical Memory State" explicitly.

### ✅ Issue 2: Hidden LLM assumptions
**Fixed:** Contract explicitly states scope (single-threaded, single-node), and non-guarantees section clarifies LLM determinism is not guaranteed if seed not supported.

### ✅ Issue 3: Undefined "identical" semantics
**Fixed:** DEFINITIONS.md has "Equality Semantics" section covering floating point, time zones, encoding, object properties, whitespace.

### ✅ Issue 4: Unspecified divergence detection
**Fixed:** DEFINITIONS.md defines "Divergence" and "Replay Correctness" with explicit detection mechanism (synchronous, step-by-step, zero false positives).

### ✅ Issue 5: Undefined checkpoint validity
**Fixed:** DEFINITIONS.md defines "Valid Checkpoint" with explicit validation criteria.

### ✅ Issue 6: Undefined memory consistency
**Fixed:** DEFINITIONS.md defines "Memory Store Consistency" with explicit consistency criteria.

### ✅ Issue 7: Circular dependency
**Fixed:** DEFINITIONS.md clarifies that checkpoints reference memory entries, and validity requires entries to exist. Contract clarifies this is a fatal error if broken.

### ✅ Issue 8: Undefined determinism
**Fixed:** DEFINITIONS.md defines "Determinism (for Continuum)" explicitly, with scope and boundaries.

---

## Additional Clarifications

### Agent Decision Definition
- Explicitly defined as one AgentStep
- Atomic, sequential, single-threaded
- Scope clearly stated

### Ordering Guarantees
- Total ordering within single run
- Sequential execution
- No concurrency

### System Scope
- Single-threaded (explicitly stated)
- Single-node (explicitly stated)
- In-memory (explicitly stated)
- MVP status (not production-ready)

### Non-Guarantees
- Durability (explicitly not guaranteed)
- Availability (explicitly not guaranteed)
- Security (explicitly not guaranteed)
- Performance (explicitly not guaranteed)

---

## What This Means

**Before:** Guarantees were vague and could be interpreted multiple ways.

**After:** All terms are explicitly defined. Guarantees are precise and legally meaningful.

**Status:** Ready for Step 2 (real external reviewers). The contract is now tight enough to withstand adversarial review.

---

## Next Steps

1. ✅ Step 1 complete - Definitions added, contract tightened
2. → Step 2 - Identify real external reviewers
3. → Step 3 - External review window
4. → Step 4 - Lock validation results

---

**All critical ambiguities have been resolved. The contract is now legally and technically precise.**

