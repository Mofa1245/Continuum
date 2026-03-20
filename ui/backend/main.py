"""FastAPI backend for Continuum Drift Visualizer. Serves artifacts from artifacts/runs/."""

import sys
from pathlib import Path

# Ensure repo root on path for engine and ui.backend
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ui.backend.routes import runs, replay

app = FastAPI(title="Continuum UI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runs.router, tags=["runs"])
app.include_router(replay.router, tags=["replay"])


@app.get("/health")
def health():
    return {"status": "ok"}
