# Continuum

**Deterministic Replay Infrastructure for AI Agents**

**Version 1.0.0 - Stable Release**

---

## What Continuum Is

Continuum is deterministic replay infrastructure for AI agent systems. It provides memory persistence, execution tracking, and deterministic replay capabilities that enable debugging, auditing, testing, and compliance for agent-based applications.

**Continuum is infrastructure, not a framework.** It provides primitives (memory store, run tracking, replay engine) that you integrate into your agent system, not a complete agent framework that you use directly.

---

## Read This Before Using

**Before using Continuum, read:**

1. **[ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md)** - Who should use Continuum, who should not, when it is the right tool, when it is the wrong tool.

2. **[THREAT_MODEL.md](./THREAT_MODEL.md)** - What Continuum protects against, what it does not protect against, assumptions required for guarantees.

3. **[WHY_CONTINUUM.md](./WHY_CONTINUUM.md)** - What problem Continuum solves, what it does not solve, why determinism is the core value.

4. **[CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md)** - Formal technical whitepaper describing the problem, model, guarantees, and limitations.

**Do not use Continuum if:**
- You require distributed execution (single-node only)
- You require high performance (no performance guarantees)
- You require security features (no encryption, no access control)
- You are building simple prototypes (overhead not justified)

**Use Continuum if:**
- You are building production agent systems (need deterministic replay, audit trail, crash recovery)
- You require compliance and auditing (need to prove correctness, demonstrate compliance)
- You are building agent testing infrastructure (need to test agent changes, verify fixes)
- You are debugging complex agent workflows (need to reproduce bugs, trace decisions)

---

## Core Documentation

### Understanding Continuum

- **[WHY_CONTINUUM.md](./WHY_CONTINUUM.md)** - What Continuum is, what problem it solves, why determinism matters
- **[CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md)** - Formal technical whitepaper
- **[ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md)** - Who should use Continuum, who should not
- **[THREAT_MODEL.md](./THREAT_MODEL.md)** - What Continuum protects against, what it does not
- **[FAQ.md](./FAQ.md)** - Frequently asked questions

### Contracts and Guarantees

- **[DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md)** - Formal determinism guarantees
- **[RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md)** - Persistence and recovery guarantees
- **[API_CONTRACT.md](./legal/API_CONTRACT.md)** - Public API contracts, invariants, error guarantees
- **[STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md)** - What is frozen, what may evolve
- **[NON_GOALS.md](./legal/NON_GOALS.md)** - Explicit non-goals

### Evaluation

- **[EVALUATION_CRITERIA.md](./EVALUATION_CRITERIA.md)** - How Continuum should be evaluated
- **[PUBLIC_RELEASE.md](./PUBLIC_RELEASE.md)** - Official public release statement

---

## Quick Reference

**What Continuum provides:**
- Deterministic execution (same inputs → same outputs)
- Complete audit trail (every decision recorded)
- Crash recovery (state survives process exit)
- Replay capability (debug, audit, test)

**What Continuum does not provide:**
- Distributed execution (single-node only)
- Performance guarantees (correctness focus)
- Security features (use operating system security)
- Availability guarantees (infrastructure, not service)

**Guarantees:**
- Memory State Determinism
- Agent Decision Determinism
- Replay Correctness
- Crash Recovery

**Limitations:**
- Single-node, single-threaded
- No performance guarantees
- No security features
- No availability guarantees
- Assumptions required (deterministic LLM, mocked external APIs)

---

## No Installation Hype, No Quickstart Pressure

**This README does not provide:**
- Installation instructions (see project documentation)
- Quickstart guides (see examples)
- Getting started tutorials (see integration guides)

**This README provides:**
- What Continuum is (infrastructure, not framework)
- What problem it solves (nondeterminism)
- Who it is for (production agent systems)
- Who it is not for (distributed, high-performance, security-critical)
- Where to find documentation (links to all documents)

**Before using Continuum, read the documentation. Understand the guarantees. Understand the limitations. Determine if it fits your use case.**

---

## Examples

**Canonical example:**
- **[examples/deterministic-agent-run/](./examples/deterministic-agent-run/README.md)** - End-to-end deterministic agent run (run, persist, crash, recover, replay)

**Reference adapters (non-core, non-stable):**
- **[src/adapters/langgraph/](../src/adapters/langgraph/README.md)** - LangGraph adapter (reference implementation)

**Note:** Adapters and examples are non-normative. They are reference implementations, not production code.

---

## Version and Stability

**Current version:** v1.0.0

**Stability:** Core semantics are frozen for v1.x. Guarantees remain unchanged. APIs remain unchanged.

**Versioning:** Semantic versioning (MAJOR.MINOR.PATCH). Breaking changes only in MAJOR versions.

**Reference:** [V1_DECLARATION.md](./V1_DECLARATION.md), [VERSIONING.md](./legal/VERSIONING.md), [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md)

---

## Summary

Continuum is deterministic replay infrastructure for AI agent systems. It solves the problem of nondeterminism by providing memory persistence, execution tracking, and deterministic replay capabilities.

**Infrastructure, not framework. Correctness, not convenience. Substrate, not application.**

**Read the documentation. Understand the guarantees. Understand the limitations. Determine if it fits your use case.**

---

**Version 1.0 - January 2024**

This is the public-facing README. All claims are bounded by formal contracts.
