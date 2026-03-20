"""Run listing and detail endpoints."""

from fastapi import APIRouter, HTTPException

from ui.backend.services import run_loader

router = APIRouter()


@router.get("/runs")
def get_runs():
    return run_loader.list_runs()


@router.get("/runs/drift-summary")
def get_drift_summary():
    return run_loader.get_drift_summary()


@router.get("/runs/drift-patterns")
def get_drift_patterns():
    return run_loader.get_drift_patterns()


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    try:
        return run_loader.load_metadata(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found")


@router.get("/runs/{run_id}/diff")
def get_run_diff(run_id: str):
    try:
        run_loader.load_metadata(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_loader.load_diff(run_id)


@router.get("/runs/{run_id}/timeline")
def get_run_timeline(run_id: str):
    try:
        run_loader.load_metadata(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_loader.load_timeline(run_id)


@router.get("/runs/{run_id}/expected")
def get_run_expected(run_id: str):
    try:
        run_loader.load_metadata(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_loader.load_expected(run_id)


@router.get("/runs/{run_id}/actual")
def get_run_actual(run_id: str):
    try:
        run_loader.load_metadata(run_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_loader.load_actual(run_id)


@router.post("/runs/{run_id}/promote")
def promote_run(run_id: str):
    try:
        return run_loader.promote_run(run_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
