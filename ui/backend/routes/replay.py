"""Replay endpoint."""

from fastapi import APIRouter, HTTPException

from ui.backend.services import run_loader, replay_runner

router = APIRouter()


@router.post("/runs/{run_id}/replay")
def replay(run_id: str):
    try:
        run_loader.load_metadata(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found")
    return replay_runner.replay_run(run_id)
