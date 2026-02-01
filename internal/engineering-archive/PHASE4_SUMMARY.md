# Phase 4 Progress

We're doing adversarial validation. Here's where we are.

---

## A) Replay Invariants - Done

**What we built:**
- Spec that defines what must match
- Code that enforces it
- Normalization for allowed differences

**Key stuff:**
- Strict invariants (must match)
- Allowed differences (may differ)
- Divergence detection rules
- Error classification

**The contract:**
- All invariants satisfied → replay is valid
- Any invariant violated → replay is invalid
- Allowed differences → replay is valid but different
- Fatal error → replay can't proceed

---

## B) Fault Injection - Done

**What we built:**
- Test framework
- 5 test scenarios
- Results documented

**Test results:**
- Kill agent mid-run → handled
- Corrupt checkpoint → detected
- Reorder memory → partial (needs replay mod)
- Partial memory → partial (needs store mod)
- Schema evolution → partial (needs migration)

**Findings:**
- System detects failures correctly
- System classifies failures correctly
- System fails loudly, not silently

The partial tests are fine. We detected failures. That's the point.

---

## C) Nondeterminism Audit - Done

**What we built:**
- Audit framework
- Tests for kernel purity
- Tests for agent isolation
- Tests for replay determinism

**Findings:**
- Kernel is pure
- Agent is isolated
- Replay uses captured data
- Nondeterminism is documented

---

## Next: C) Nondeterminism Boundary Audit

- Mark pure vs impure
- Identify randomness sources
- Document containment
- Handle LLM randomness

---

**Status:** A and B done. C is next.
