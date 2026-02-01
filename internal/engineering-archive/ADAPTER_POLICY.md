# Adapter Policy

**Phase 13: Ecosystem Boundary & Adapter Governance**

This document defines the governance policy for Continuum adapters, integrations, and ecosystem components.

**Version 1.0 - January 2024**

---

## What Is an Adapter

An adapter is code that integrates Continuum with external systems (agent frameworks, tools, services).

**Examples:**
- LangGraph adapter (integrates Continuum with LangGraph)
- CrewAI adapter (integrates Continuum with CrewAI)
- Custom framework adapters (user-created integrations)

**Adapters are NOT part of Continuum core.**

---

## Adapter Classification: NON-CORE

**Explicit classification:** All adapters are NON-CORE.

**What this means:**
- Adapters are not part of the Continuum core system
- Adapters are not covered by Continuum stability guarantees
- Adapters may change or be removed without notice
- Adapter breakage does NOT constitute a Continuum breaking change

**Reference:** [INTERNAL_APIS.md](./INTERNAL_APIS.md) - "Adapter Implementations", [STABILITY_GUARANTEES.md](./STABILITY_GUARANTEES.md) - "What May Evolve"

---

## Adapter Stability: NO STABILITY GUARANTEES

**Explicit statement:** Adapters carry NO STABILITY GUARANTEES.

**What this means:**
- Adapter APIs may change without version bump
- Adapter behavior may change without notice
- Adapter features may be added or removed
- Adapters may be deprecated or removed

**What this does NOT mean:**
- Core guarantees are affected (they are not)
- Core APIs are affected (they are not)
- Core semantics are affected (they are not)

**Adapters are unstable by design. Use at your own risk.**

**Reference:** [STABILITY_GUARANTEES.md](./STABILITY_GUARANTEES.md) - "What May Evolve" - "Tooling and Adapters"

---

## Allowed Adapter Behavior

### Must Use Public APIs Only

**Requirement:** Adapters must use only public Continuum APIs.

**Public APIs:**
- `MemoryStore` interface
- `AgentRunStore` interface
- `PersistentStore` interface
- `ReplayEngine` class
- `Resolver` class
- Public types (MemoryEntry, AgentRun, AgentStep, etc.)

**Forbidden:**
- Using internal implementation classes directly
- Accessing private methods or properties
- Relying on implementation details

**Reference:** [API_CONTRACT.md](./API_CONTRACT.md) - "Public API Surface", [INTERNAL_APIS.md](./INTERNAL_APIS.md) - "Public APIs (Stable)"

---

### Must Not Rely on Undocumented Behavior

**Requirement:** Adapters must not rely on undocumented behavior.

**What this means:**
- Adapters must use documented APIs only
- Adapters must not rely on side effects
- Adapters must not rely on implementation details
- Adapters must not rely on undefined behavior

**Forbidden:**
- Relying on undocumented method behavior
- Relying on undocumented type behavior
- Relying on undocumented error behavior
- Relying on undocumented performance characteristics

**Reference:** [API_CONTRACT.md](./API_CONTRACT.md) - "Undefined Behavior"

---

### Must Not Mutate Core State Outside Public Contracts

**Requirement:** Adapters must not mutate core state outside public contracts.

**What this means:**
- Adapters must use public methods to modify state
- Adapters must not directly modify core data structures
- Adapters must not bypass public APIs
- Adapters must respect invariants

**Forbidden:**
- Directly modifying core data structures
- Bypassing public APIs
- Violating invariants
- Mutating state outside public contracts

**Reference:** [API_CONTRACT.md](./API_CONTRACT.md) - "Required Invariants", "Caller Responsibilities"

---

## Forbidden Adapter Behavior

### No Monkey-Patching Core

**Forbidden:** Adapters must not monkey-patch core code.

**What this means:**
- Adapters must not modify core classes
- Adapters must not extend core classes with new methods
- Adapters must not override core methods
- Adapters must not inject code into core

**Why forbidden:**
- Monkey-patching breaks encapsulation
- Monkey-patching creates implicit dependencies
- Monkey-patching makes guarantees unenforceable
- Monkey-patching breaks stability commitments

**Consequence:** Monkey-patched adapters are not supported. Core guarantees do not apply to monkey-patched code.

---

### No Extending Core Semantics

**Forbidden:** Adapters must not extend core semantics.

**What this means:**
- Adapters must not add new guarantees
- Adapters must not modify existing guarantees
- Adapters must not create implicit guarantees
- Adapters must not claim core guarantees apply to adapter behavior

**Why forbidden:**
- Extending semantics breaks core stability
- Extending semantics creates confusion
- Extending semantics makes guarantees unenforceable
- Extending semantics breaks credibility

**Consequence:** Adapters that extend core semantics are not supported. Core guarantees do not apply to extended semantics.

**Reference:** [DETERMINISM_CONTRACT.md](./DETERMINISM_CONTRACT.md), [STABILITY_GUARANTEES.md](./STABILITY_GUARANTEES.md) - "What Is Frozen in v1.x"

---

### No Implicit Guarantees

**Forbidden:** Adapters must not create implicit guarantees.

**What this means:**
- Adapters must not imply core guarantees apply to adapter behavior
- Adapters must not imply adapter stability
- Adapters must not imply adapter correctness
- Adapters must not imply adapter performance

**Why forbidden:**
- Implicit guarantees create confusion
- Implicit guarantees break credibility
- Implicit guarantees make promises unenforceable
- Implicit guarantees break stability commitments

**Consequence:** Implicit guarantees are not valid. Core guarantees do not apply to adapter behavior.

**Reference:** [STABILITY_GUARANTEES.md](./STABILITY_GUARANTEES.md) - "What Is NOT Guaranteed"

---

## Adapter Breakage Does NOT Constitute Continuum Breaking Change

**Explicit statement:** Adapter breakage does NOT constitute a Continuum breaking change.

**What this means:**
- Adapter API changes are not Continuum breaking changes
- Adapter behavior changes are not Continuum breaking changes
- Adapter removals are not Continuum breaking changes
- Adapter deprecations are not Continuum breaking changes

**Why:**
- Adapters are non-core (not part of core system)
- Adapters are unstable (may change without notice)
- Adapters are not covered by stability guarantees
- Core guarantees remain valid regardless of adapter changes

**Consequence:** Adapter breakage does not trigger Continuum version bumps. Core versioning is independent of adapter versioning.

**Reference:** [VERSIONING.md](./VERSIONING.md) - "Internal APIs", [STABILITY_GUARANTEES.md](./STABILITY_GUARANTEES.md) - "What May Evolve"

---

## Adapter Development Guidelines

### Best Practices

**Recommended:**
- Use public APIs only
- Document adapter limitations
- Mark adapters as non-core and non-stable
- Provide migration guides for breaking changes
- Test adapters independently

**Not recommended:**
- Relying on internal APIs
- Creating implicit guarantees
- Extending core semantics
- Monkey-patching core code

---

### Adapter Documentation Requirements

**Required:**
- Explicit statement: "This adapter is NON-CORE"
- Explicit statement: "This adapter carries NO STABILITY GUARANTEES"
- Documentation of what adapter does
- Documentation of what adapter does NOT guarantee
- Documentation of limitations

**Reference:** [src/adapters/langgraph/README.md](../../src/adapters/langgraph/README.md) - Example adapter documentation

---

## Summary

**Adapter classification:**
- ✅ NON-CORE (not part of core system)
- ✅ NO STABILITY GUARANTEES (may change without notice)
- ✅ Adapter breakage does NOT constitute Continuum breaking change

**Allowed adapter behavior:**
- ✅ Use public APIs only
- ✅ Do not rely on undocumented behavior
- ✅ Do not mutate core state outside public contracts

**Forbidden adapter behavior:**
- ❌ No monkey-patching core
- ❌ No extending core semantics
- ❌ No implicit guarantees

**This policy preserves core credibility by keeping adapters clearly outside stability commitments.**

---

**Version 1.0 - January 2024**

This document defines adapter governance policy. Use it to understand adapter boundaries and limitations.
