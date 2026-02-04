# Step 2: Reviewer Identification Guide

**Purpose:** Identify 2-3 external reviewers who meet the criteria.

**Target:** 2-3 total, no more.

---

## Ideal Profiles

### 1. Senior Infra / Distributed Systems Engineer

**What to look for:**
- Worked on databases, distributed logs, or consensus systems
- Understands determinism, replay, and state management
- Has experience with formal contracts/guarantees
- Can evaluate infrastructure claims critically

**Where to find:**
- OSS maintainers (PostgreSQL, Kafka, etcd, etc.)
- Ex-Google/Meta/Amazon infra engineers
- Distributed systems researchers
- Database engineers at mid/large companies

**Signals:**
- Has written about consistency models
- Has worked on replay systems
- Has reviewed infrastructure contracts
- Understands formal specifications

---

### 2. Senior LLM / Agent Platform Engineer

**What to look for:**
- Has built agent systems in production
- Understands LLM nondeterminism
- Has dealt with agent debugging/replay
- Can evaluate agent infrastructure claims

**Where to find:**
- AI platform teams at mid/large companies
- OSS agent framework maintainers (LangGraph, CrewAI, etc.)
- Ex-OpenAI/Anthropic engineers
- Agent infrastructure builders

**Signals:**
- Has written about agent determinism
- Has built agent observability/replay
- Understands LLM seed support
- Has dealt with agent production issues

---

### 3. Internal Tools / Runtime Engineer (Optional)

**What to look for:**
- Has built developer tools or runtimes
- Understands what developers need
- Can evaluate usability and adoption
- Has experience with infrastructure adoption

**Where to find:**
- Platform teams at tech companies
- Developer tools engineers
- Runtime engineers (V8, Node.js, etc.)
- Infrastructure tooling builders

**Signals:**
- Has built tools developers use
- Understands adoption patterns
- Can evaluate developer experience
- Has reviewed infrastructure APIs

---

## Hard Requirements

All reviewers must meet **all** of these:

### ✅ 5+ Years Experience
- Not a junior
- Has seen multiple systems
- Can spot patterns and issues

### ✅ Not a Contributor
- Hasn't contributed to Continuum
- No code commits
- No design input

### ✅ No Financial/Emotional Stake
- Not an investor
- Not a co-founder
- Not emotionally invested
- Can say "this is weak" without consequence

### ✅ Willing to Say "This Guarantee is Weak"
- Not a yes-person
- Will give honest critical feedback
- Can evaluate contracts objectively

---

## Where to Find Reviewers

### Option 1: OSS Communities

**Infra/Distributed Systems:**
- PostgreSQL, Kafka, etcd, Redis communities
- Distributed systems forums (Hacker News, Reddit r/systems)
- Database engineering communities

**LLM/Agent Systems:**
- LangGraph, CrewAI, AutoGen communities
- AI agent forums
- LLM infrastructure discussions

**How to reach:**
- GitHub issues/discussions
- Community forums
- Direct message (if public profile)

---

### Option 2: Professional Networks

**LinkedIn:**
- Search: "distributed systems engineer" + "5+ years"
- Search: "agent platform engineer" + "LLM"
- Look for people who've written about determinism/replay

**Twitter/X:**
- Follow infra engineers who discuss systems
- Look for people who critique infrastructure
- Find people who review systems publicly

**How to reach:**
- Direct message
- Email (if public)
- Introduction through mutual connection

---

### Option 3: Academic/Research

**Distributed Systems Researchers:**
- Database systems researchers
- Consistency model researchers
- Replay/determinism researchers

**How to reach:**
- Email (usually public)
- Research paper authors
- Conference speakers

---

### Option 4: Ex-Big Tech Engineers

**Infra Engineers:**
- Ex-Google SRE/Infra
- Ex-Meta Infrastructure
- Ex-Amazon AWS
- Ex-Netflix/Spotify Platform

**How to reach:**
- LinkedIn
- Personal websites
- GitHub profiles

---

## Red Flags (Avoid These)

**Do NOT choose reviewers who:**
- ❌ Are friends (bias risk)
- ❌ Are investors (financial stake)
- ❌ Are contributors (already involved)
- ❌ Are juniors (< 5 years)
- ❌ Only give positive feedback (yes-people)
- ❌ Have emotional stake (co-founders, etc.)
- ❌ Can't be critical (afraid to offend)

---

## Outreach Strategy

### Step 1: Identify Candidates

Create a list of 5-10 potential reviewers (you'll only use 2-3).

**For each candidate, verify:**
- ✅ 5+ years experience
- ✅ Relevant background (infra/LLM/platform)
- ✅ Not a contributor
- ✅ No financial/emotional stake
- ✅ Can be critical

### Step 2: Prioritize

**Rank by:**
1. Relevance (infra > LLM > platform)
2. Experience (more years = better)
3. Availability (can respond in 1-2 weeks)
4. Critical thinking (known for honest feedback)

### Step 3: Reach Out

Use `STEP2_OUTREACH_MESSAGE.md` template.

**Send to 2-3 reviewers max.**

**Why not more:**
- Too many reviewers = diluted feedback
- Harder to manage
- Diminishing returns

---

## Example Reviewer Profiles

### ✅ Good Reviewer Example 1

**Profile:**
- Senior database engineer at mid-size company
- 8 years experience
- Worked on PostgreSQL replication
- Has written about consistency models
- Not a contributor
- Known for critical reviews

**Why good:**
- Relevant experience
- Understands determinism
- Can evaluate contracts
- Will be honest

---

### ✅ Good Reviewer Example 2

**Profile:**
- Ex-OpenAI engineer, now building agent platform
- 6 years experience
- Has dealt with LLM nondeterminism
- Understands agent replay needs
- Not a contributor
- Willing to critique

**Why good:**
- Relevant LLM/agent experience
- Understands the problem
- Can evaluate agent claims
- Will be honest

---

### ❌ Bad Reviewer Example 1

**Profile:**
- Friend who's a software engineer
- 3 years experience
- Never worked on infrastructure
- Will say "looks good" to be nice

**Why bad:**
- Friend (bias)
- Junior (< 5 years)
- Not relevant experience
- Won't be critical

---

### ❌ Bad Reviewer Example 2

**Profile:**
- Investor in your company
- 10 years experience
- Understands infrastructure
- Has financial stake

**Why bad:**
- Financial stake (bias)
- Can't be objective
- Has incentive to be positive

---

## Checklist Before Reaching Out

For each potential reviewer, verify:

- [ ] 5+ years experience
- [ ] Relevant background (infra/LLM/platform)
- [ ] Not a contributor
- [ ] No financial/emotional stake
- [ ] Can be critical
- [ ] Available in 1-2 weeks
- [ ] Willing to review contracts

---

## After Identification

Once you've identified 2-3 reviewers:

1. **Send outreach message** (use `STEP2_OUTREACH_MESSAGE.md`)
2. **Wait for response** (1-2 weeks)
3. **Collect feedback** (don't argue, don't explain)
4. **Classify feedback** (use `STEP2_FEEDBACK_CLASSIFICATION.md`)
5. **Fix blocking issues** (clarity only)
6. **Document results** (create `EXTERNAL_REVIEW_NOTES.md`)

---

**This guide helps you identify reviewers who will give honest, critical feedback on your determinism contract.**

