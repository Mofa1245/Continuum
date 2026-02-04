# Step 2: Reviewer Outreach Message

**Purpose:** Send this message to potential external reviewers.

**Customization:** Replace `[YOUR_NAME]`, `[REPO_LINK]`, and adjust tone as needed.

---

## Message Template

**Subject:** Review request: Determinism contract for AI agent replay system

Hi [REVIEWER_NAME],

I'm building Continuum, a deterministic replay system for AI agents. Before adding persistence and scaling, I need external validation of the core determinism contract.

**What I'm asking:** Review three documents (15-20 min read) and answer one question:

> "Are these guarantees meaningful, defensible, and reviewable as written?"

**What to review:**
1. [DEFINITIONS.md]([REPO_LINK]/docs/legal/DEFINITIONS.md) - All terms explicitly defined
2. [DETERMINISM_CONTRACT.md]([REPO_LINK]/docs/legal/DETERMINISM_CONTRACT.md) - The three guarantees
3. [REVIEWER_GUIDE.md]([REPO_LINK]/docs/REVIEWER_GUIDE.md) - 5-minute overview

**Context:** This is MVP (in-memory, single-node, single-threaded). I'm not asking about implementation - just whether the contract is clear and defensible.

**Timeline:** 1-2 weeks, no rush.

**What I need:** Honest feedback. If the guarantees are vague, say so. If terms are undefined, say so. If the contract is useless, say so.

I won't argue with feedback. I'll collect it, fix clarity issues, then move to persistence.

Can you help? If not, no worries - just let me know.

Thanks,
[YOUR_NAME]

---

## Alternative (Shorter Version)

**Subject:** Quick review: AI agent determinism contract

Hi [REVIEWER_NAME],

I need a 15-min review of a determinism contract for AI agent replay. Three docs, one question: "Are these guarantees meaningful and defensible as written?"

Repo: [REPO_LINK]

This is contract validation, not code review. MVP stage, in-memory only.

Can you help? Timeline: 1-2 weeks.

Thanks,
[YOUR_NAME]

---

## Alternative (More Formal)

**Subject:** External review request: Continuum determinism contract

Dear [REVIEWER_NAME],

I am requesting an external review of Continuum's determinism contract before proceeding to persistence and scaling.

**Request:** Review three documents and provide feedback on whether the guarantees are:
- Meaningful (they solve a real problem)
- Defensible (they can be proven)
- Reviewable (they are clear enough to evaluate)

**Documents:**
1. [DEFINITIONS.md]([REPO_LINK]/docs/legal/DEFINITIONS.md)
2. [DETERMINISM_CONTRACT.md]([REPO_LINK]/docs/legal/DETERMINISM_CONTRACT.md)
3. [REVIEWER_GUIDE.md]([REPO_LINK]/docs/REVIEWER_GUIDE.md)

**Scope:** Contract validation only. Implementation is MVP (in-memory, single-node). This review focuses on semantic clarity, not implementation details.

**Timeline:** 1-2 weeks

**Process:** I will collect all feedback, address clarity issues, and document results. I will not argue with feedback or defend the design during review.

Thank you for your consideration.

Best regards,
[YOUR_NAME]

---

## What NOT to Include

**Do NOT:**
- Explain the system verbally
- Defend design choices
- Provide context beyond what's in the docs
- Ask for code review
- Ask for feature suggestions
- Set expectations about positive feedback

**Why:** We want unbiased contract evaluation, not design discussion.

---

## Follow-Up (After They Agree)

**Subject:** Re: Review request: Determinism contract

Thanks for agreeing to review!

**What to review:**
1. [DEFINITIONS.md]([REPO_LINK]/docs/legal/DEFINITIONS.md)
2. [DETERMINISM_CONTRACT.md]([REPO_LINK]/docs/legal/DETERMINISM_CONTRACT.md)
3. [REVIEWER_GUIDE.md]([REPO_LINK]/docs/REVIEWER_GUIDE.md)

**The question:** "Are these guarantees meaningful, defensible, and reviewable as written?"

**Timeline:** 1-2 weeks, no rush.

**Process:** Read the docs, answer the question, flag any ambiguities or undefined terms. I'll collect all feedback and address clarity issues.

Thanks again!

---

**Use whichever version matches your style. The key is: be brief, be clear, don't oversell.**

