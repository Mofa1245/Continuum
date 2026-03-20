"""Paths relative to repo root."""

import os
from pathlib import Path

# Repo root: parent of ui/
REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS_RUNS = REPO_ROOT / "artifacts" / "runs"
RUNS_DIR = REPO_ROOT / "runs"
DIST_CLI = REPO_ROOT / "dist" / "cli" / "index.js"
NODE = os.environ.get("NODE", "node")
