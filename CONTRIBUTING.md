# Contributing

## Development Setup

```bash
npm install
npm run build
```

## Running

```bash
# API Server
npm run dev

# CLI Daemon
npm run dev:daemon
```

## Testing

```bash
npm test
```

## Architecture Decisions

- **No AI in core loop** - AI is a consumer, not the brain
- **Deterministic memory** - Rules-based, not AI-based
- **Append-only** - Memory entries are immutable, versioned
- **Scoped hierarchy** - Global → Org → Repo

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

