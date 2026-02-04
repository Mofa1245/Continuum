# Ecosystem Boundaries

**Phase 13: Ecosystem Boundary & Adapter Governance**

This document defines strict boundaries between Continuum core and its ecosystem.

**Version 1.0 - January 2024**

---

## Purpose

This document explicitly defines:
- What is core (frozen, stable, guaranteed)
- What is ecosystem (unstable, non-guaranteed, may change)
- What guarantees apply to each layer
- What guarantees do NOT apply to each layer
- What may change without notice

**This document prevents ecosystem components from contaminating core guarantees.**

---

## Core

**Definition:** Core is the Continuum system that provides deterministic replay infrastructure.

**What is included:**
- Memory Store (append-only, versioned entries)
- Agent Run Tracking (complete execution records)
- Deterministic Replay (same inputs → same outputs)
- Persistence (crash-consistent storage)
- Recovery (state restoration after crashes)
- Compaction (log size reduction)

**Guarantees that apply:**
- ✅ Determinism guarantees (see [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md))
- ✅ Persistence/recovery guarantees (see [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md))
- ✅ Compaction guarantees (see [PERSISTENCE_ARCHITECTURE.md](./architecture/PERSISTENCE_ARCHITECTURE.md))
- ✅ Public API contracts (see [API_CONTRACT.md](./legal/API_CONTRACT.md))

**Guarantees that do NOT apply:**
- ❌ Performance guarantees (not guaranteed)
- ❌ Security guarantees (not provided)
- ❌ Availability guarantees (not guaranteed)

**What may change:**
- Performance optimizations (behavior unchanged)
- Internal implementations (public APIs unchanged)
- Documentation (guarantees unchanged)

**What will NOT change:**
- Guarantees (frozen for v1.x)
- Public APIs (frozen for v1.x)
- Semantics (frozen for v1.x)
- Behavior (frozen for v1.x)

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is Frozen in v1.x"

---

## Adapters

**Definition:** Adapters integrate Continuum with external systems (agent frameworks, tools, services).

**What is included:**
- LangGraph adapter (reference implementation)
- CrewAI adapter (reference implementation)
- Custom framework adapters (user-created)

**Guarantees that apply:**
- ✅ Core guarantees apply to core APIs used by adapters
- ❌ No guarantees apply to adapter APIs
- ❌ No guarantees apply to adapter behavior
- ❌ No guarantees apply to adapter stability

**Guarantees that do NOT apply:**
- ❌ Adapter stability (not guaranteed)
- ❌ Adapter correctness (not guaranteed)
- ❌ Adapter performance (not guaranteed)
- ❌ Adapter completeness (not guaranteed)

**What may change:**
- Adapter APIs (may change without notice)
- Adapter behavior (may change without notice)
- Adapter features (may be added or removed)
- Adapter implementations (may be replaced)

**What will NOT change:**
- Core guarantees (remain valid)
- Core APIs (remain valid)
- Core semantics (remain valid)

**Explicit statement:** Only Core is covered by v1.x stability guarantees. Adapters are explicitly excluded.

**Reference:** [ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md), [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve"

---

## Tooling

**Definition:** Tooling includes CLI tools, monitoring tools, debugging tools, testing tools.

**What is included:**
- CLI tools (command-line interface)
- Monitoring tools (metrics, health checks)
- Debugging tools (replay visualization, divergence analysis)
- Testing tools (test runners, assertion helpers)

**Guarantees that apply:**
- ✅ Core guarantees apply to core APIs used by tooling
- ❌ No guarantees apply to tooling APIs
- ❌ No guarantees apply to tooling behavior
- ❌ No guarantees apply to tooling availability

**Guarantees that do NOT apply:**
- ❌ Tooling stability (not guaranteed)
- ❌ Tooling correctness (not guaranteed)
- ❌ Tooling performance (not guaranteed)
- ❌ Tooling availability (not guaranteed)

**What may change:**
- Tooling APIs (may change without notice)
- Tooling behavior (may change without notice)
- Tooling features (may be added or removed)
- Tooling implementations (may be replaced)

**What will NOT change:**
- Core guarantees (remain valid)
- Core APIs (remain valid)
- Core semantics (remain valid)

**Explicit statement:** Tooling is not part of core. Tooling may be added, removed, or changed without affecting core guarantees.

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve" - "Tooling and Adapters"

---

## Examples

**Definition:** Examples demonstrate Continuum usage patterns.

**What is included:**
- Canonical end-to-end example (deterministic agent run)
- Integration examples (framework integrations)
- Usage examples (common patterns)

**Guarantees that apply:**
- ✅ Core guarantees apply to core APIs used in examples
- ❌ No guarantees apply to example code
- ❌ No guarantees apply to example correctness
- ❌ No guarantees apply to example completeness

**Guarantees that do NOT apply:**
- ❌ Example correctness (not guaranteed)
- ❌ Example completeness (not guaranteed)
- ❌ Example performance (not guaranteed)
- ❌ Example stability (not guaranteed)

**What may change:**
- Example code (may change without notice)
- Example patterns (may change without notice)
- Example features (may be added or removed)
- Example implementations (may be replaced)

**What will NOT change:**
- Core guarantees (remain valid)
- Core APIs (remain valid)
- Core semantics (remain valid)

**Explicit statement:** Examples are non-normative. They are reference implementations, not production code.

**Reference:** [docs/README.md](./README.md) - "Proof-of-Use" - "Adapters and examples are non-normative"

---

## Research / Experiments

**Definition:** Research and experiments explore future possibilities.

**What is included:**
- Distributed execution research
- Concurrent writes research
- Performance optimization research
- Security feature research

**Guarantees that apply:**
- ✅ Core guarantees apply to core APIs used in research
- ❌ No guarantees apply to research code
- ❌ No guarantees apply to research outcomes
- ❌ No guarantees apply to research implementation

**Guarantees that do NOT apply:**
- ❌ Research correctness (not guaranteed)
- ❌ Research completeness (not guaranteed)
- ❌ Research implementation (not guaranteed)
- ❌ Research timeline (not guaranteed)

**What may change:**
- Research code (may change without notice)
- Research direction (may change without notice)
- Research outcomes (may not be implemented)
- Research timeline (no timeline provided)

**What will NOT change:**
- Core guarantees (remain valid)
- Core APIs (remain valid)
- Core semantics (remain valid)

**Explicit statement:** Research is non-commitment. Research items may not be implemented. No timeline. No guarantees.

**Reference:** [ROADMAP.md](./ROADMAP.md) - "Research / Future Ideas (Non-Commitment)"

---

## Boundary Enforcement

### How Boundaries Are Enforced

**Documentation:**
- Explicit classification (core vs ecosystem)
- Explicit guarantees (what applies, what does not)
- Explicit limitations (what may change, what will not)

**Code:**
- Public APIs (stable, documented)
- Internal APIs (unstable, may change)
- Adapter APIs (unstable, may change)

**Process:**
- Contribution scope (see [CONTRIBUTION_SCOPE.md](./CONTRIBUTION_SCOPE.md))
- Review philosophy (correctness > features > popularity)
- Versioning policy (core versioning independent of ecosystem versioning)

**Reference:** [ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md), [CONTRIBUTION_SCOPE.md](./CONTRIBUTION_SCOPE.md), [VERSIONING.md](./legal/VERSIONING.md)

---

### Consequences of Boundary Violation

**If ecosystem components claim core guarantees:**
- Claims are invalid (core guarantees do not apply)
- Credibility is damaged (false promises)
- Stability is compromised (unclear boundaries)

**If ecosystem components extend core semantics:**
- Extensions are invalid (core semantics are frozen)
- Guarantees are unenforceable (extended semantics not covered)
- Stability is compromised (semantics contaminated)

**If ecosystem components monkey-patch core:**
- Patches are unsupported (core guarantees do not apply)
- Stability is compromised (core behavior modified)
- Credibility is damaged (implicit dependencies)

**Prevention:**
- Explicit documentation (clear boundaries)
- Explicit classification (core vs ecosystem)
- Explicit guarantees (what applies, what does not)
- Explicit limitations (what may change, what will not)

---

## Summary

**Core:**
- ✅ Frozen for v1.x (guarantees, APIs, semantics, behavior)
- ✅ Stability guarantees apply
- ✅ Public API contracts apply
- ✅ Determinism/recovery guarantees apply

**Adapters:**
- ⚠️ Non-core (not part of core system)
- ⚠️ No stability guarantees
- ⚠️ May change without notice
- ⚠️ Adapter breakage does NOT constitute Continuum breaking change

**Tooling:**
- ⚠️ Non-core (not part of core system)
- ⚠️ No stability guarantees
- ⚠️ May change without notice
- ⚠️ May be added or removed

**Examples:**
- ⚠️ Non-normative (reference implementations)
- ⚠️ No stability guarantees
- ⚠️ May change without notice
- ⚠️ Not production code

**Research:**
- ⚠️ Non-commitment (ideas only)
- ⚠️ No guarantees
- ⚠️ May not be implemented
- ⚠️ No timeline

**Explicit statement:** Only Core is covered by v1.x stability guarantees. All ecosystem components are explicitly excluded.

**This boundary preserves core credibility by keeping ecosystem components clearly outside stability commitments.**

---

**Version 1.0 - January 2024**

This document defines ecosystem boundaries. Use it to understand what is core and what is ecosystem.
