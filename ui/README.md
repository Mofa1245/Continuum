# Continuum Drift Visualizer

Local dashboard for inspecting LLM pipeline drift.

## Run from repo root

**Option 1: CLI (starts backend + frontend + opens browser)**

```bash
npm run build
continuum ui
```

**Option 2: Manual**

```bash
# Terminal 1: Backend (from repo root)
pip install -r ui/backend/requirements.txt
uvicorn ui.backend.main:app --port 8000

# Terminal 2: Frontend
cd ui/frontend && npm install && npm run dev
```

Then open http://localhost:3000.

## Data source

- Backend reads from `artifacts/runs/`.
- On first request, runs are synced from `runs/*.json` (Continuum CLI output) into `artifacts/runs/<run_id>/` with `metadata.json`, `expected.json`, `actual.json`, `diff.json`, `timeline.json`.
- Replay (POST `/runs/{id}/replay`) re-runs `continuum verify <id> --strict` and updates artifacts.
