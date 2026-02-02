# Continuum — Install & Run

## Requirements

- Node.js >= 18
- npm >= 9

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run API Server

```bash
node dist/api/index.js
```

The API server listens on port 3000.

## Run CLI

```bash
node dist/cli/index.js resolve "test task"
```

## Run Examples

```bash
npx tsx examples/basic-usage.ts
```

## Type Check

```bash
npm run typecheck
```

## Tests

```bash
npm test
```
