# Step 2: External Reviewer Package

**Status:** Ready for distribution  
**Date:** January 2024

---

## What to Send Reviewers

Send **only** these three documents:

1. **[DEFINITIONS.md](./legal/DEFINITIONS.md)** - All terms explicitly defined
2. **[DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md)** - The three guarantees
3. **[REVIEWER_GUIDE.md](./REVIEWER_GUIDE.md)** - 5-minute overview

**Do NOT send:**
- Architecture docs (unless specifically asked)
- Code (unless specifically asked)
- Examples (unless specifically asked)
- Other documentation

**Why:** We want feedback on the **contract**, not implementation. Implementation can change. The contract must be stable.

---

## The One Question

Ask reviewers this question:

> **"Are these guarantees meaningful, defensible, and reviewable as written?"**

**Do NOT:**
- Explain verbally unless asked
- Defend the design unless asked
- Provide context unless asked

**Why:** We want unbiased feedback. If the contract needs explanation, it's not clear enough.

---

## What Success Looks Like

You pass Step 2 if reviewers:

✅ **Stop arguing semantics** - They understand what terms mean  
✅ **Shift to tradeoff criticism** - "I don't like this tradeoff" not "what does this mean?"  
✅ **Focus on scope** - "This is too narrow" or "This is too broad" not "This is ambiguous"

**You fail Step 2 if reviewers:**
❌ Still ask "what does X mean?" after reading DEFINITIONS.md  
❌ Find ambiguities we didn't catch  
❌ Can't evaluate guarantees without explanation

---

## What Feedback Blocks Phase 5

**Blocks Phase 5 (must fix before persistence):**
- Ambiguities in definitions
- Unclear guarantees
- Missing non-guarantees
- Contract contradictions
- Undefined terms

**Does NOT block Phase 5 (can address later):**
- "This is too narrow" (scope feedback)
- "I don't like this tradeoff" (design feedback)
- "This won't work for my use case" (use case feedback)
- "You should add X" (feature requests)
- "Performance will be bad" (implementation concerns)

**Rule:** If feedback is about **clarity**, it blocks. If feedback is about **scope/design**, it doesn't.

---

## Reviewer Selection Criteria

**Ideal reviewers (2-3 max):**

1. **Infra / distributed systems engineer**
   - Has worked on databases, logs, or consensus systems
   - Understands determinism and replay
   - Can evaluate contracts critically

2. **LLM / agent systems engineer**
   - Has built agent systems
   - Understands LLM nondeterminism
   - Can evaluate agent replay claims

3. **Platform / tooling engineer** (optional)
   - Has built developer tools
   - Understands what developers need
   - Can evaluate usability

**They should:**
- Not be emotionally invested
- Not be contributors
- Be allowed to say "this guarantee is useless"
- Have 5+ years experience in relevant area

**They should NOT:**
- Be friends (bias risk)
- Be juniors (may not catch issues)
- Be hype people (won't be critical)

---

## Outreach Message Template

See `STEP2_OUTREACH_MESSAGE.md` for the exact message to send.

---

## Review Window

**Timeline:** 1-2 weeks

**Rules:**
- Do not argue with feedback
- Do not explain live
- Do not patch mid-review
- Collect all feedback first

**What to collect:**
- Confusion points
- Ambiguities found
- Undefined terms
- Contract contradictions
- Scope concerns

---

## After Review

**Step 4: Lock Validation Results**

1. Fix documentation clarity issues (if any)
2. Fix bugs ONLY if they violate stated guarantees
3. Do NOT expand scope
4. Document results in `EXTERNAL_REVIEW_NOTES.md`

**Then proceed to Phase 5B: Persistence & Durability**

---

**This package is ready for distribution. Freeze is active. Semantics are locked.**

