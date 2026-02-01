# How Continuum Works

The basic idea and how the pieces fit together.

---

## Core Ideas

1. **AI is a consumer, not the brain** - The kernel doesn't use AI. AI uses the kernel.
2. **Deterministic memory** - Rules-based, not AI-based. Same inputs → same outputs.
3. **Operational identity** - We track projects/repos/orgs, not people. One person can have many identities.
4. **Append-only** - Memory entries are immutable. New versions, don't modify old ones.
5. **Scoped memory** - Global → Org → Repo hierarchy. More specific overrides less specific.

---

## Code Structure

```
src/
  types/          # Type definitions (the schema)
  engine/         # The deterministic logic (no AI here)
  storage/        # Storage layer (files for now, DB later)
  api/            # REST API
  daemon/         # CLI daemon for Cursor
  cli/            # CLI entry point
```

This structure describes a reference implementation. Guarantees are defined by contracts, not by directory layout.

---

## How Data Flows

```
[ Cursor / Client ]
        ↓
[ CLI Daemon ] → [ API ] → [ Memory Engine ] → [ Storage ]
        ↓
[ Context injected into prompt ]
```

Simple. Client calls API, API uses engine, engine uses storage. Context gets injected into the agent's prompt.

---

## Memory Entry

This is the core data structure. It won't change.

```typescript
{
  id: string
  orgId: string
  scope: "global" | "org" | "repo"
  scopeId?: string
  category: "preference" | "convention" | "constraint" | "decision" | "risk"
  key: string
  value: string | number | boolean | object
  confidence: number  // 0–1
  source: "explicit" | "observed" | "inferred"
  createdAt: number
  expiresAt?: number
  version: number
}
```

This schema is frozen for v1.x. Breaking changes are only allowed in v2.0.0+.

---

## How Resolution Works (MVP)

When you ask for context, here's what happens:

1. Collect entries from scopes: global → org → repo → project
2. Filter out expired stuff and low-confidence entries (confidence < 0.5)
3. Deduplicate by key (keep the latest version)
4. Sort by confidence (highest first)
5. Group by category

That's it. No AI, no magic. Just rules.

---

## Identity

We don't track humans. We track operational identities.

**API Key = Identity Boundary**

Identity is: (org, repo, project, environment, toolchain)

One human can have many identities. Org identity outlives humans. This avoids privacy issues and legal problems.

---

## Storage

**MVP:** In-memory store + file-based persistence (JSON files)

**Production (example):** Postgres (cold storage) + Redis (indexes)

The interface is the same. Swap the implementation. Storage engines are implementation details; persistence guarantees are defined elsewhere.

---

## Why This Scales

- Reads are cheap (indexed lookups)
- Writes are rare (append-only, so mostly reads)
- Memory grows slowly (normalized facts, not raw context)
- Value compounds per org (more runs = more value)

Cost curve is flat. Value curve is exponential.

That's the math.
