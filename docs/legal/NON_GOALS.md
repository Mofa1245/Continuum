# What Continuum Doesn't Do

This is the list of things we explicitly don't do. Not because we can't, but because they're out of scope.

**Version 1.0 (v1.x non-goals frozen)**  
Any incompatible change requires a major version increment. These non-goals are contractual for all v1.x releases.

**Clear boundaries prevent scope creep and set correct expectations.**

---

## 1. LLM Semantic Determinism

**We don't guarantee:** That LLMs will be semantically deterministic if they don't support seeds.

**Why:** LLMs are probabilistic. Some don't support deterministic mode. We can't make them deterministic.

**What this means:** If your LLM doesn't support seeds, replay might diverge. We'll detect it and tell you, but we can't fix the LLM.

**What we do instead:**
- Capture the seed and config
- Detect divergence if outputs differ
- Document which LLMs support seeds
- Accept divergence if seed not supported

---

## 2. External API Determinism

**We don't guarantee:** That external APIs will return the same responses.

**Why:** APIs change. Network varies. We can't control external systems.

**What this means:** If you call external APIs and don't mock them, replay might diverge. We'll detect it.

**What we do instead:**
- Allow capture of API calls and responses when explicitly enabled
- Detect divergence if responses differ
- Document that you need mocks
- Accept divergence if you don't mock

---

## 3. Performance Determinism

**We don't guarantee:** That replay will be the same speed as the original.

**Why:** System load varies. Resources change. Performance isn't part of the contract.

**What this means:** Replay might be faster or slower. That's fine. We don't promise it'll be the same.

**What we do instead:**
- Log performance differences as warnings
- Continue replay regardless of speed
- Document that performance isn't guaranteed

---

## 4. Schema Evolution

**We don't guarantee:** That old runs will replay with new schemas automatically.

**Why:** Schemas change. Sometimes compatibility breaks. Migration needs to be explicit.

**What this means:** If you upgrade and the schema changed, old runs might not replay. You'll need migration.

**What we do instead:**
- Check schema version on replay
- Give clear errors if incompatible
- Document migration requirements
- Implement migration when needed

---

## 5. Real-Time Execution

**We don't guarantee:** That replay will be fast or low-latency.

**Why:** Replay needs to restore checkpoints. That takes time. Speed isn't the goal.

**What this means:** Replay might be slower than original execution. That's expected.

**What we do instead:**
- Optimize for correctness, not speed
- Log performance metrics
- Document performance characteristics

---

## 6. Distributed Execution

**We don't guarantee:** That replay works across multiple nodes.

**Why:** Distributed determinism is hard. Needs consensus. Not in scope for v1.x.

**What this means:** Replay is single-node only. Distributed execution isn't supported.

**What we do instead:**
- Focus on single-node determinism
- Document distributed limitations
- Plan for future distributed support

---

## 7. Automatic Recovery

**We don't guarantee:** That we'll automatically fix failures.

**Why:** Recovery needs domain knowledge. Automatic recovery can be unsafe. Manual is safer.

**What this means:** Failures are detected and reported. You fix them manually.

**What we do instead:**
- Detect failures clearly
- Report failures with details
- Provide recovery guidance
- Document recovery procedures

---

## 8. Universal Agent Framework Support

**We don't guarantee:** That we support every agent framework.

**Why:** Frameworks vary. Integration needs framework-specific code. Not all are compatible.

**What this means:** We support some frameworks (LangGraph, CrewAI). Not all of them.

**What we do instead:**
- Support major frameworks
- Provide integration adapters
- Document framework requirements
- Accept contributions for new frameworks

---

## Why This Matters

**Clear non-goals:**
- Prevent scope creep
- Set correct expectations
- Enable informed decisions
- Build trust through honesty

**This is how infrastructure earns credibility.**

This document tells you what Continuum doesn't do. Use it to set correct expectations.
