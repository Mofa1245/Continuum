# Documentation

**Continuum v1.0 - Stable Release**

All the docs are here, organized by topic.

**Status:** ✅ Stable (v1.0.0) - Production-ready

## Structure

```
docs/
├── legal/              # Contracts and guarantees
├── architecture/        # How the system works
├── integration/        # How to integrate
├── testing/            # What we tested
└── *.md                # Project summaries
```

## Quick start

**Start here:** [Reviewer Guide](./REVIEWER_GUIDE.md) - 5 minute overview

**Why Continuum:** [WHY_CONTINUUM.md](./WHY_CONTINUUM.md) - What problem Continuum solves

**Adoption Guide:** [ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md) - Who should use Continuum, who should not

**Important:** [Core Semantics Freeze Notice](./FREEZE_NOTICE.md) - What's locked for review

## Legal stuff

**Location:** `docs/legal/`

- **[Definitions](./legal/DEFINITIONS.md)** - **START HERE** - All terms defined explicitly
- **[What We Guarantee](./legal/DETERMINISM_CONTRACT.md)** - The contract
- **[How This Fails](./legal/HOW_THIS_FAILS.md)** - Failure modes
- **[Recovery Guarantees](./legal/RECOVERY_GUARANTEES.md)** - Persistence recovery (Phase 6)
- **[API Contract](./legal/API_CONTRACT.md)** - Public API contract, invariants, error guarantees (Phase 8)
- **[Failure Modes](./legal/FAILURE_MODES.md)** - Failure modes and caller responsibilities (Phase 8)
- **[Internal APIs](./legal/INTERNAL_APIS.md)** - Public vs internal API marking (Phase 8)
- **[Versioning Policy](./legal/VERSIONING.md)** - Semantic versioning rules (Phase 9)
- **[Stability Guarantees](./legal/STABILITY_GUARANTEES.md)** - What is frozen, what may evolve (Phase 9)
- **[Deprecation Policy](./legal/DEPRECATION_POLICY.md)** - Deprecation rules (Phase 9)
- **[What We Don't Do](./legal/NON_GOALS.md)** - Boundaries

## Architecture

**Location:** `docs/architecture/`

- **[ARCHITECTURE.md](./architecture/ARCHITECTURE.md)** - Core design
- **[AGENT_RUN_ARCHITECTURE.md](./architecture/AGENT_RUN_ARCHITECTURE.md)** - AgentRun stuff
- **[REPLAY_ARCHITECTURE.md](./architecture/REPLAY_ARCHITECTURE.md)** - Replay system
- **[NONDETERMINISM_BOUNDARY.md](./architecture/NONDETERMINISM_BOUNDARY.md)** - Where randomness lives
- **[PERSISTENCE_ARCHITECTURE.md](./architecture/PERSISTENCE_ARCHITECTURE.md)** - How persistence works (Phase 5B-7)

## Integration

**Location:** `docs/integration/`

- **[INTEGRATION_GUIDE.md](./integration/INTEGRATION_GUIDE.md)** - How to integrate
- **[AGENT_LOOP_INTEGRATION.md](./integration/AGENT_LOOP_INTEGRATION.md)** - Integration patterns

## Operational

**Location:** `docs/operational/`

- **[COMPACTION_GUIDE.md](./operational/COMPACTION_GUIDE.md)** - Log compaction guide (Phase 7)

## Testing

**Location:** `docs/testing/`

- **[REPLAY_INVARIANTS.md](./testing/REPLAY_INVARIANTS.md)** - What must match
- **[FAULT_INJECTION_REPORT.md](./testing/FAULT_INJECTION_REPORT.md)** - What we broke
- **Persistence Recovery Tests** - Crash recovery and corruption injection (Phase 6)

## Proof-of-Use

**Location:** `examples/deterministic-agent-run/`

- **[Canonical Example](./examples/deterministic-agent-run/README.md)** - End-to-end deterministic agent run
  - Run agent workflow
  - Persist memory + checkpoint
  - Simulate crash
  - Recover state from disk
  - Replay deterministically
  - Detect divergence

**Adapters and examples are non-normative:**
- Reference implementations only
- Not part of core stability guarantees
- Use as starting points, not production code

**See:** [src/adapters/langgraph/README.md](../src/adapters/langgraph/README.md) for adapter details

---

## Reference Documentation

**Location:** `docs/`

- **[CONTINUUM_WHITEPAPER.md](./CONTINUUM_WHITEPAPER.md)** - Formal technical whitepaper (Phase 11)
- **[THREAT_MODEL.md](./THREAT_MODEL.md)** - Threat and misuse analysis (Phase 11)
- **[ADOPTION_GUIDE.md](./ADOPTION_GUIDE.md)** - Who should/should not use Continuum (Phase 11)
- **[ROADMAP.md](./ROADMAP.md)** - Public roadmap with frozen core (Phase 11)

## Ecosystem & Governance

**Location:** `docs/` and `docs/legal/`

- **[ECOSYSTEM_BOUNDARIES.md](./ECOSYSTEM_BOUNDARIES.md)** - Strict boundaries between core and ecosystem (Phase 13)
- **[ADAPTER_POLICY.md](./legal/ADAPTER_POLICY.md)** - Adapter governance policy (Phase 13)
- **[CONTRIBUTION_SCOPE.md](./CONTRIBUTION_SCOPE.md)** - What contributions are accepted into core (Phase 13)

---

## Links

- **Main README:** [../README.md](../README.md)
- **Reviewer Guide:** [./REVIEWER_GUIDE.md](./REVIEWER_GUIDE.md)
