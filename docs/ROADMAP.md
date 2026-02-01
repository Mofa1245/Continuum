# Roadmap

**Public roadmap with frozen core**

**Version 1.0 (Inital stable release)**

---

## Core Semantics Are Frozen

**Explicit statement:** Core semantics are frozen for v1.x. They will not change without a major version bump.

**What is frozen:**
- Determinism guarantees (see [DETERMINISM_CONTRACT.md](./legal/DETERMINISM_CONTRACT.md))
- Persistence & recovery guarantees (see [RECOVERY_GUARANTEES.md](./legal/RECOVERY_GUARANTEES.md))
- Compaction guarantees (see [PERSISTENCE_ARCHITECTURE.md](./architecture/PERSISTENCE_ARCHITECTURE.md))
- Public API contracts (see [API_CONTRACT.md](./legal/API_CONTRACT.md))

**What this means:**
- Guarantees remain unchanged in v1.x
- APIs remain unchanged in v1.x
- Semantics remain unchanged in v1.x
- Breaking changes only in v2.0.0+

**Reference:** [V1_DECLARATION.md](./V1_DECLARATION.md), [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md)

---

## Core (Frozen)

**Status:** ✅ Frozen for v1.x

**What is included:**
- Memory Store (append-only, versioned entries)
- Agent Run Tracking (complete execution records)
- Deterministic Replay (same inputs → same outputs)
- Persistence (crash-consistent storage)
- Recovery (state restoration after crashes)
- Compaction (log size reduction)

**What will NOT change:**
- Guarantees (frozen)
- APIs (frozen)
- Semantics (frozen)
- Behavior (frozen)

**What may evolve:**
- Performance (optimizations)
- Internal implementations (algorithms, data structures)
- Documentation (clarity improvements)

**Reference:** [STABILITY_GUARANTEES.md](./legal/STABILITY_GUARANTEES.md) - "What Is Frozen in v1.x"

---

## Adapters (Non-Core, Unstable)

**Status:** ⚠️ Non-core, unstable, may change without notice

**What is included:**
- LangGraph adapter (reference implementation)
- CrewAI adapter (reference implementation)
- Minimal agent (simple agent loop)

**What may change:**
- Adapter APIs (may change without version bump)
- Adapter behavior (may change without notice)
- Adapter features (may be added or removed)

**What is NOT guaranteed:**
- Stability (may change without notice)
- Completeness (may not cover all framework features)
- Performance (not optimized)
- Correctness (best-effort implementation)

**Reference:** [INTERNAL_APIS.md](./legal/INTERNAL_APIS.md) - "Internal APIs (Unstable)"

---

## Tooling

**Status:** 🔄 May evolve, not guaranteed

**What may be added:**
- CLI tools (command-line interface)
- Monitoring tools (metrics, health checks)
- Debugging tools (replay visualization, divergence analysis)
- Testing tools (test runners, assertion helpers)

**What is NOT guaranteed:**
- Availability (may not be provided)
- Stability (may change without notice)
- Completeness (may not cover all use cases)
- Performance (not optimized)

**Note:** Tooling is not part of core. Tooling may be added, removed, or changed without affecting core guarantees.

---

## Research / Future Ideas (Non-Commitment)

**Status:** 💡 Research only, no commitment

**What may be explored:**
- Distributed execution (multi-node determinism)
- Concurrent writes (thread-safe operations)
- Schema migration (automatic compatibility)
- Performance optimization (throughput, latency)
- Security features (encryption, access control)
- Availability features (high availability, replication)

**What is NOT committed:**
- Implementation (may not be implemented)
- Timeline (no timeline provided)
- Guarantees (no guarantees if implemented)
- Scope (scope may change)

**Note:** Research items are ideas only. No commitment to implement. No timeline. No guarantees.

---

## Versioning Policy

**Current version:** v1.0.0

**Versioning rules:**
- MAJOR: Breaking changes (API/contract changes)
- MINOR: Backward-compatible features
- PATCH: Bug fixes, documentation

**v1.x guarantees:**
- Backward compatibility (all v1.x versions compatible)
- Stability (guarantees frozen)
- Additive evolution (new features are additive only)

**Reference:** [VERSIONING.md](./legal/VERSIONING.md)

---

## Deprecation Policy

**Deprecation process:**
1. Announcement in MINOR version
2. Support window (minimum one MINOR version)
3. Migration guide provided
4. Removal in MAJOR version only

**Breaking removals:**
- Only in MAJOR versions
- Deprecated in previous major version
- Migration guide provided

**Reference:** [DEPRECATION_POLICY.md](./legal/DEPRECATION_POLICY.md)

---

## No Timelines, No Promises

**Explicit statement:** This roadmap provides no timelines and makes no promises.

**What this means:**
- No delivery dates (timelines not provided)
- No feature commitments (features may not be implemented)
- No guarantee of implementation (research items may not be implemented)
- No guarantee of timeline (if implemented, timeline may vary)

**Why:**
- Focus on correctness over speed
- Avoid over-promising
- Maintain quality over quantity
- Respect frozen core

---

## Summary

**Core (frozen):**
- ✅ Guarantees frozen for v1.x
- ✅ APIs frozen for v1.x
- ✅ Semantics frozen for v1.x
- ✅ Performance may evolve

**Adapters (non-core, unstable):**
- ⚠️ May change without notice
- ⚠️ Not part of stability promise
- ⚠️ Use as reference, not production code

**Tooling (may evolve):**
- 🔄 May be added or removed
- 🔄 Not guaranteed
- 🔄 Not part of core

**Research (non-commitment):**
- 💡 Ideas only
- 💡 No commitment to implement
- 💡 No timeline
- 💡 No guarantees

**Versioning:**
- v1.x: Backward compatible, stable, additive evolution
- v2.0.0+: Breaking changes possible

**Deprecation:**
- Announced in MINOR versions
- Support window: minimum one MINOR version
- Removed in MAJOR versions only

**No timelines, no promises:**
- No delivery dates
- No feature commitments
- No guarantee of implementation

---

**Version 1.0 - January 2024**

This roadmap describes Continuum's evolution. Core is frozen. Adapters are unstable. Research is non-commitment.
