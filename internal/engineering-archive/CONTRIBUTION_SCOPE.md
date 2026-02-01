# Contribution Scope

**Phase 13: Ecosystem Boundary & Adapter Governance**

This document defines what types of contributions are accepted into Continuum core and what types are redirected to ecosystem components.

**Version 1.0 - January 2024**

---

## Purpose

This document explicitly defines:
- What types of contributions are accepted into core (very limited)
- What types of contributions are redirected to adapters/tooling
- Review philosophy (correctness > features > popularity)
- Explicit discouragement of feature creep in core
- Explicit statement that new guarantees are NOT accepted post-v1.0

**This document prevents core contamination by keeping contributions within scope boundaries.**

---

## Contributions Accepted into Core

### Bug Fixes

**Accepted:** Bug fixes that align with documented guarantees.

**What this means:**
- Fixes bugs that violate documented guarantees
- Fixes bugs that cause incorrect behavior
- Fixes bugs that break invariants
- Fixes bugs that cause crashes

**What this does NOT mean:**
- Adding new features (not accepted)
- Changing behavior (not accepted)
- Extending guarantees (not accepted)
- Modifying semantics (not accepted)

**Review criteria:**
- Does the fix align with documented guarantees?
- Does the fix preserve existing behavior?
- Does the fix maintain invariants?
- Does the fix not introduce new guarantees?

**Reference:** [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md), [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md), [API_CONTRACT.md](./legal/API_CONTRACT.md)

---

### Documentation Improvements

**Accepted:** Documentation improvements that clarify existing guarantees.

**What this means:**
- Clarifying guarantee wording (without changing meaning)
- Clarifying limitation wording (without changing meaning)
- Clarifying assumption wording (without changing meaning)
- Adding examples (without changing guarantees)

**What this does NOT mean:**
- Changing guarantee meaning (not accepted)
- Adding new guarantees (not accepted)
- Removing limitations (not accepted)
- Modifying semantics (not accepted)

**Review criteria:**
- Does the improvement clarify without changing meaning?
- Does the improvement preserve existing guarantees?
- Does the improvement maintain limitations?
- Does the improvement not introduce new claims?

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve" - "Documentation"

---

### Performance Optimizations

**Accepted:** Performance optimizations that preserve behavior.

**What this means:**
- Optimizing algorithms (behavior unchanged)
- Optimizing data structures (behavior unchanged)
- Optimizing I/O operations (behavior unchanged)
- Optimizing memory usage (behavior unchanged)

**What this does NOT mean:**
- Adding performance guarantees (not accepted)
- Changing behavior for performance (not accepted)
- Breaking invariants for performance (not accepted)
- Modifying semantics for performance (not accepted)

**Review criteria:**
- Does the optimization preserve behavior?
- Does the optimization maintain invariants?
- Does the optimization not introduce new guarantees?
- Does the optimization not modify semantics?

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve" - "Performance Characteristics"

---

### Internal Implementation Improvements

**Accepted:** Internal implementation improvements that preserve public APIs.

**What this means:**
- Refactoring internal code (public APIs unchanged)
- Improving internal algorithms (public APIs unchanged)
- Improving internal data structures (public APIs unchanged)
- Improving internal error handling (public APIs unchanged)

**What this does NOT mean:**
- Changing public APIs (not accepted)
- Changing public behavior (not accepted)
- Changing public semantics (not accepted)
- Breaking public contracts (not accepted)

**Review criteria:**
- Does the improvement preserve public APIs?
- Does the improvement preserve public behavior?
- Does the improvement maintain public contracts?
- Does the improvement not introduce new guarantees?

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What May Evolve" - "Internal Implementations"

---

## Contributions Redirected to Ecosystem

### New Features

**Redirected to:** Adapters, tooling, or examples.

**What this means:**
- New features are not accepted into core
- New features should be implemented as adapters
- New features should be implemented as tooling
- New features should be implemented as examples

**Why redirected:**
- New features extend scope (core scope is frozen)
- New features may require new guarantees (guarantees are frozen)
- New features may modify semantics (semantics are frozen)
- New features may break stability (stability is frozen)

**Where to contribute:**
- Adapters (framework-specific features)
- Tooling (developer experience features)
- Examples (usage pattern features)

**Reference:** [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md), [ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md)

---

### New Guarantees

**Redirected to:** Not accepted. New guarantees are NOT accepted post-v1.0.

**What this means:**
- New guarantees are not accepted into core
- New guarantees should not be added
- New guarantees should not be proposed
- New guarantees should not be implemented

**Why not accepted:**
- Guarantees are frozen for v1.x (see [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md))
- New guarantees extend scope (scope is frozen)
- New guarantees modify contracts (contracts are frozen)
- New guarantees break stability (stability is frozen)

**Consequence:** New guarantees can only be added in v2.0.0+ (major version bump).

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is Frozen in v1.x", [VERSIONING.md](./legal/VERSIONING.md) - "MAJOR Version"

---

### API Extensions

**Redirected to:** Adapters or tooling.

**What this means:**
- New public API methods are not accepted into core
- New public API methods should be implemented as adapters
- New public API methods should be implemented as tooling
- New public API methods should be implemented as examples

**Why redirected:**
- Public APIs are frozen for v1.x (see [API_CONTRACT.md](./legal/API_CONTRACT.md))
- API extensions may require new guarantees (guarantees are frozen)
- API extensions may modify semantics (semantics are frozen)
- API extensions may break stability (stability is frozen)

**Exception:** New public API methods may be added in MINOR versions if they are backward-compatible and additive only.

**Reference:** [VERSIONING.md](./legal/VERSIONING.md) - "MINOR Version", [API_CONTRACT.md](./legal/API_CONTRACT.md) - "Public API Surface"

---

### Framework Integrations

**Redirected to:** Adapters.

**What this means:**
- Framework integrations are not accepted into core
- Framework integrations should be implemented as adapters
- Framework integrations should be maintained separately
- Framework integrations should be versioned independently

**Why redirected:**
- Framework integrations are non-core (see [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md))
- Framework integrations are unstable (may change without notice)
- Framework integrations are not covered by stability guarantees
- Framework integrations should not contaminate core

**Where to contribute:**
- Create new adapters (see [ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md))
- Improve existing adapters (non-core, may change)
- Maintain adapter documentation (non-core, may change)

**Reference:** [ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md), [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md) - "Adapters"

---

### Tooling Features

**Redirected to:** Tooling.

**What this means:**
- Tooling features are not accepted into core
- Tooling features should be implemented as separate tools
- Tooling features should be maintained separately
- Tooling features should be versioned independently

**Why redirected:**
- Tooling is non-core (see [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md))
- Tooling is unstable (may change without notice)
- Tooling is not covered by stability guarantees
- Tooling should not contaminate core

**Where to contribute:**
- Create new tools (CLI, monitoring, debugging, testing)
- Improve existing tools (non-core, may change)
- Maintain tool documentation (non-core, may change)

**Reference:** [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md) - "Tooling"

---

## Review Philosophy

### Correctness > Features > Popularity

**Priority order:**
1. **Correctness** - Does it preserve guarantees? Does it maintain invariants? Does it not break contracts?
2. **Features** - Does it add value? Does it fit scope? Does it not extend guarantees?
3. **Popularity** - Is it requested? Is it useful? Is it not required?

**What this means:**
- Correctness is the highest priority
- Features are secondary to correctness
- Popularity is tertiary to correctness and features

**Consequence:**
- Popular but incorrect contributions are rejected
- Popular but out-of-scope contributions are redirected
- Correct but unpopular contributions may be accepted

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is Frozen in v1.x"

---

### Explicit Discouragement of Feature Creep

**Explicit statement:** Feature creep in core is explicitly discouraged.

**What this means:**
- New features should not be added to core
- New features should be implemented as ecosystem components
- New features should not extend core scope
- New features should not modify core guarantees

**Why discouraged:**
- Core scope is frozen (see [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md))
- Core guarantees are frozen (see [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md))
- Core semantics are frozen (see [FREEZE_NOTICE.md](./FREEZE_NOTICE.md))
- Feature creep breaks stability (see [VERSIONING.md](./legal/VERSIONING.md))

**Consequence:**
- Feature requests are redirected to ecosystem
- Feature implementations are rejected from core
- Feature discussions are redirected to ecosystem

**Reference:** [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md), [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md)

---

## New Guarantees Are NOT Accepted Post-v1.0

**Explicit statement:** New guarantees are NOT accepted post-v1.0.

**What this means:**
- New guarantees cannot be added to v1.x
- New guarantees can only be added in v2.0.0+ (major version bump)
- New guarantee proposals are rejected
- New guarantee implementations are rejected

**Why not accepted:**
- Guarantees are frozen for v1.x (see [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md))
- New guarantees extend scope (scope is frozen)
- New guarantees modify contracts (contracts are frozen)
- New guarantees break stability (stability is frozen)

**Consequence:**
- New guarantee proposals are rejected
- New guarantee implementations are rejected
- New guarantees can only be added in major versions

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is Frozen in v1.x", [VERSIONING.md](./legal/VERSIONING.md) - "MAJOR Version"

---

## Contribution Process

### Step 1: Determine Contribution Type

**Questions to answer:**
- Is this a bug fix? (accepted if aligns with guarantees)
- Is this a documentation improvement? (accepted if clarifies without changing meaning)
- Is this a performance optimization? (accepted if preserves behavior)
- Is this an internal implementation improvement? (accepted if preserves public APIs)
- Is this a new feature? (redirected to ecosystem)
- Is this a new guarantee? (not accepted)
- Is this an API extension? (redirected to ecosystem)
- Is this a framework integration? (redirected to adapters)
- Is this a tooling feature? (redirected to tooling)

---

### Step 2: Review Against Criteria

**For core contributions:**
- Does it preserve guarantees?
- Does it maintain invariants?
- Does it not break contracts?
- Does it not introduce new guarantees?

**For ecosystem contributions:**
- Does it use public APIs only?
- Does it not extend core semantics?
- Does it not create implicit guarantees?
- Does it not monkey-patch core?

**Reference:** [ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md), [ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md)

---

### Step 3: Submit Contribution

**For core contributions:**
- Submit bug fix, documentation improvement, performance optimization, or internal implementation improvement
- Review focuses on correctness (preserves guarantees, maintains invariants)
- Review focuses on scope (does not extend guarantees, does not modify semantics)

**For ecosystem contributions:**
- Submit adapter, tooling, or example
- Review focuses on ecosystem boundaries (uses public APIs, does not extend core)
- Review focuses on documentation (explicit non-core, explicit non-stable)

---

## Summary

**Contributions accepted into core:**
- ✅ Bug fixes (align with documented guarantees)
- ✅ Documentation improvements (clarify without changing meaning)
- ✅ Performance optimizations (preserve behavior)
- ✅ Internal implementation improvements (preserve public APIs)

**Contributions redirected to ecosystem:**
- ⚠️ New features (adapters, tooling, examples)
- ⚠️ API extensions (adapters, tooling)
- ⚠️ Framework integrations (adapters)
- ⚠️ Tooling features (tooling)

**Contributions not accepted:**
- ❌ New guarantees (not accepted post-v1.0)
- ❌ Feature creep (explicitly discouraged)
- ❌ Core semantics extensions (frozen)

**Review philosophy:**
- Correctness > Features > Popularity

**This scope prevents core contamination by keeping contributions within boundaries.**

---

**Version 1.0 - January 2024**

This document defines contribution scope. Use it to understand what contributions are accepted and what are redirected.
