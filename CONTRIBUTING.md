# Contributing to Continuum

## Development Setup

```bash
npm install
npm run build
```

## Running in Development

```bash
# API server
npm run dev

# CLI daemon
npm run dev:daemon
```

## Testing

```bash
npm test
```

## Project Philosophy

Continuum is **deterministic infrastructure**: it provides replay, checkpointing, and memory guarantees that applications can rely on. The core replay and memory guarantees must not be weakened. AI is a **consumer** of this infrastructure, not part of the deterministic kernel.

## Contribution Scope

**Allowed contributions** (generally welcome with clear PRs):

- Adapters
- Integrations
- Examples
- Documentation
- Tests
- Tooling
- Developer experience improvements

**Restricted areas** (require maintainer approval):

- `src/engine/*`
- `src/storage/*`
- Replay logic
- Checkpoint logic
- Invariants enforcement
- Determinism guarantees

Changes to these areas must include:

- Invariant proof (or updated invariants doc)
- Determinism tests
- Replay validation

## Pull Request Guidelines

- Provide a clear description of the change and why it is needed.
- Include reproducible test steps where applicable.
- Do not introduce breaking changes to determinism guarantees.
- Add or update tests for new behavior.

## Required Checks Before PR Approval

- `npm run build` must pass.
- `npm test` must pass.
- Deterministic replay tests must pass.
- No non-deterministic APIs are allowed inside `src/engine` or `src/storage`.
- The PR must not introduce `Date.now()`, `Math.random()`, or external I/O inside the deterministic core.

## Architecture Reference

See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for design and architecture details.
