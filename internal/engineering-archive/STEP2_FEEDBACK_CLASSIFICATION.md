# Step 2: Feedback Classification Guide

**Purpose:** Classify reviewer feedback to determine what blocks Phase 5B vs what doesn't.

---

## Classification Rules

### ✅ Blocks Phase 5B (Must Fix Before Persistence)

These are **clarity issues** that make the contract ambiguous or unenforceable:

#### 1. Ambiguities in Definitions
**Example:** "What does 'same checkpoint' mean if the checkpoint format changed?"

**Action:** Fix DEFINITIONS.md to clarify.

**Why it blocks:** If definitions are ambiguous, guarantees are meaningless.

---

#### 2. Unclear Guarantees
**Example:** "I don't understand what 'agent decision determinism' actually guarantees."

**Action:** Fix DETERMINISM_CONTRACT.md to clarify.

**Why it blocks:** If guarantees are unclear, they can't be enforced.

---

#### 3. Missing Non-Guarantees
**Example:** "You don't mention what happens if the system crashes mid-replay."

**Action:** Add to non-guarantees section or failure modes.

**Why it blocks:** Missing non-guarantees create false expectations.

---

#### 4. Contract Contradictions
**Example:** "You say 'same checkpoint' but also say checkpoints can be in different formats."

**Action:** Resolve contradiction in definitions or contract.

**Why it blocks:** Contradictions make the contract unenforceable.

---

#### 5. Undefined Terms
**Example:** "What is 'memory store consistency'? I don't see it defined."

**Action:** Add to DEFINITIONS.md.

**Why it blocks:** Undefined terms create ambiguity.

---

### ❌ Does NOT Block Phase 5B (Can Address Later)

These are **scope/design feedback** that don't affect contract clarity:

#### 1. Scope Too Narrow
**Example:** "This only works for single-agent runs. What about multi-agent?"

**Action:** Document as non-goal or future work. Don't expand scope now.

**Why it doesn't block:** Scope is explicit. Narrow scope is a design choice, not a clarity issue.

---

#### 2. Design Tradeoffs
**Example:** "I don't like that you require checkpoints. Why not just replay from logs?"

**Action:** Document rationale. Don't change design based on preference.

**Why it doesn't block:** Tradeoffs are design choices. Contract is about clarity, not preference.

---

#### 3. Use Case Mismatch
**Example:** "This won't work for my use case where agents run for days."

**Action:** Document as limitation or non-goal. Don't expand to cover all use cases.

**Why it doesn't block:** Not every system needs to cover every use case. Scope is explicit.

---

#### 4. Feature Requests
**Example:** "You should add distributed execution support."

**Action:** Document as future work or non-goal. Don't add features now.

**Why it doesn't block:** Feature requests are about scope expansion, not contract clarity.

---

#### 5. Implementation Concerns
**Example:** "Performance will be bad with large checkpoints."

**Action:** Document as known limitation. Don't optimize implementation now.

**Why it doesn't block:** Implementation concerns don't affect contract clarity. Performance is explicitly not guaranteed.

---

#### 6. Preference Feedback
**Example:** "I'd prefer if you used X instead of Y."

**Action:** Acknowledge but don't change. Document rationale if needed.

**Why it doesn't block:** Preferences are subjective. Contract is about objective clarity.

---

## Decision Tree

**Is the feedback about:**
- **Clarity?** → Blocks Phase 5B (fix it)
- **Scope?** → Doesn't block (document it)
- **Design?** → Doesn't block (document rationale)
- **Implementation?** → Doesn't block (document limitation)

**Rule of thumb:** If you need to explain it, it's a clarity issue. If they just don't like it, it's not.

---

## Examples

### Example 1: Blocks Phase 5B
**Feedback:** "What does 'identical memory state' mean? Do you compare by reference or by value?"

**Classification:** Ambiguity in definitions

**Action:** Add to DEFINITIONS.md: "Memory states are compared using deep equality (JSON.stringify for values, set equality for IDs)."

**Why it blocks:** Without this definition, "identical" is ambiguous.

---

### Example 2: Does NOT Block
**Feedback:** "This is too narrow. You should support multi-agent runs."

**Classification:** Scope feedback

**Action:** Document as non-goal: "Multi-agent runs are explicitly not supported in MVP. This is a design choice to keep the contract simple."

**Why it doesn't block:** Scope is explicit. Narrow scope is intentional, not a bug.

---

### Example 3: Blocks Phase 5B
**Feedback:** "You say 'same checkpoint' but also say checkpoints can be corrupted. How can they be 'same' if one is corrupted?"

**Classification:** Contract contradiction

**Action:** Clarify in DEFINITIONS.md: "Two checkpoints are 'same' if they have identical content. A checkpoint is 'valid' if it can be used. A corrupted checkpoint is not valid, so it cannot be 'same' as a valid one."

**Why it blocks:** Contradiction makes the contract unenforceable.

---

### Example 4: Does NOT Block
**Feedback:** "I don't like that you require checkpoints. Why not just replay from logs?"

**Classification:** Design tradeoff

**Action:** Document rationale: "Checkpoints provide deterministic state restoration. Logs alone don't guarantee state consistency."

**Why it doesn't block:** This is a design choice, not a clarity issue.

---

## What to Do After Classification

### For Blocking Feedback:
1. Fix the clarity issue
2. Update relevant docs (DEFINITIONS.md, DETERMINISM_CONTRACT.md, etc.)
3. Re-verify with reviewer (optional but recommended)
4. Document in EXTERNAL_REVIEW_NOTES.md

### For Non-Blocking Feedback:
1. Acknowledge the feedback
2. Document as limitation, non-goal, or future work
3. Don't change the contract
4. Document in EXTERNAL_REVIEW_NOTES.md

---

## Red Flags (Must Fix Immediately)

These indicate the contract is fundamentally broken:

- **"I can't understand what you're guaranteeing"** → Contract is too vague
- **"These definitions contradict each other"** → Contract is inconsistent
- **"This guarantee is impossible to verify"** → Contract is unenforceable
- **"You're using terms that aren't defined"** → Contract is incomplete

**If you get any of these, stop and fix before proceeding.**

---

**Use this guide to classify all feedback. Only clarity issues block Phase 5B. Everything else can wait.**

