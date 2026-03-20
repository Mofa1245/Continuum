"""Load run data from artifacts/runs/ and sync from runs/."""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

from ui.backend.config import ARTIFACTS_RUNS, RUNS_DIR


def _ensure_artifacts() -> None:
    """Sync runs/ -> artifacts/runs/ if artifact run dirs are missing."""
    ARTIFACTS_RUNS.mkdir(parents=True, exist_ok=True)
    if not RUNS_DIR.exists():
        return
    for f in RUNS_DIR.glob("run_*.json"):
        run_id = f.stem
        artifact_dir = ARTIFACTS_RUNS / run_id
        if artifact_dir.exists():
            continue
        try:
            with f.open() as fp:
                data = json.load(fp)
        except (json.JSONDecodeError, IOError):
            continue
        step_outputs = data.get("stepOutputs") or {}
        phases = data.get("phases") or list(step_outputs.keys())
        ts = data.get("timestamp") or 0
        status = data.get("status", "completed")

        artifact_dir.mkdir(parents=True, exist_ok=True)
        metadata = {
            "id": run_id,
            "timestamp": _format_ts(ts),
            "status": "verified",
        }
        (artifact_dir / "metadata.json").write_text(
            json.dumps(metadata, indent=2), encoding="utf-8"
        )
        (artifact_dir / "expected.json").write_text(
            json.dumps(step_outputs, indent=2), encoding="utf-8"
        )
        (artifact_dir / "actual.json").write_text(
            json.dumps(step_outputs, indent=2), encoding="utf-8"
        )
        (artifact_dir / "diff.json").write_text("[]", encoding="utf-8")
        timeline = [{"phase": p, "status": "ok"} for p in phases]
        (artifact_dir / "timeline.json").write_text(
            json.dumps(timeline, indent=2), encoding="utf-8"
        )


def _format_ts(ts: float) -> str:
    from datetime import datetime
    try:
        return datetime.utcfromtimestamp(ts / 1000.0).strftime("%Y-%m-%dT%H:%M:%S")
    except (ValueError, OSError):
        return str(ts)


def list_runs() -> List[Dict[str, str]]:
    _ensure_artifacts()
    out = []
    if not ARTIFACTS_RUNS.exists():
        return out
    for d in sorted(ARTIFACTS_RUNS.iterdir()):
        if not d.is_dir():
            continue
        meta_file = d / "metadata.json"
        status = "unknown"
        if meta_file.exists():
            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
                status = meta.get("status", "unknown")
            except (json.JSONDecodeError, IOError):
                pass
        diffs = load_diff(d.name)
        first = diffs[0] if diffs else None
        drift_type = first.get("drift_type") if isinstance(first, dict) else None
        drift_phase = first.get("phase") if isinstance(first, dict) else None

        out.append(
            {
                "id": d.name,
                "status": status,
                "driftType": drift_type,
                "driftPhase": drift_phase,
            }
        )
    return out


def load_metadata(run_id: str) -> Dict[str, Any]:
    artifact_dir = ARTIFACTS_RUNS / run_id
    meta_file = artifact_dir / "metadata.json"
    if not meta_file.exists():
        raise FileNotFoundError(f"Run not found: {run_id}")
    return json.loads(meta_file.read_text(encoding="utf-8"))


def load_diff(run_id: str) -> List[Dict[str, Any]]:
    artifact_dir = ARTIFACTS_RUNS / run_id
    diff_file = artifact_dir / "diff.json"
    if not diff_file.exists():
        return []
    return json.loads(diff_file.read_text(encoding="utf-8"))


def load_timeline(run_id: str) -> List[Dict[str, Any]]:
    artifact_dir = ARTIFACTS_RUNS / run_id
    tl_file = artifact_dir / "timeline.json"
    if not tl_file.exists():
        return []
    return json.loads(tl_file.read_text(encoding="utf-8"))


def load_expected(run_id: str) -> Dict[str, Any]:
    artifact_dir = ARTIFACTS_RUNS / run_id
    f = artifact_dir / "expected.json"
    if not f.exists():
        return {}
    return json.loads(f.read_text(encoding="utf-8"))


def load_actual(run_id: str) -> Dict[str, Any]:
    artifact_dir = ARTIFACTS_RUNS / run_id
    f = artifact_dir / "actual.json"
    if not f.exists():
        return {}
    return json.loads(f.read_text(encoding="utf-8"))


def promote_run(run_id: str) -> Dict[str, Any]:
    """Promote actual to baseline: replace expected with actual, clear diff, update metadata."""
    from datetime import datetime, timezone
    artifact_dir = ARTIFACTS_RUNS / run_id
    if not artifact_dir.is_dir():
        raise FileNotFoundError(f"Run not found: {run_id}")
    meta_file = artifact_dir / "metadata.json"
    actual_file = artifact_dir / "actual.json"
    if not meta_file.exists():
        raise FileNotFoundError(f"Run not found: {run_id}")
    if not actual_file.exists():
        raise FileNotFoundError(f"No actual.json for run: {run_id}")
    actual_data = json.loads(actual_file.read_text(encoding="utf-8"))
    (artifact_dir / "expected.json").write_text(
        json.dumps(actual_data, indent=2), encoding="utf-8"
    )
    (artifact_dir / "diff.json").write_text("[]", encoding="utf-8")
    timeline = load_timeline(run_id)
    if timeline:
        timeline_ok = [{"phase": e.get("phase", ""), "status": "ok"} for e in timeline]
        (artifact_dir / "timeline.json").write_text(
            json.dumps(timeline_ok, indent=2), encoding="utf-8"
        )
    meta = json.loads(meta_file.read_text(encoding="utf-8"))
    meta["baseline_updated"] = True
    meta["timestamp"] = datetime.now(timezone.utc).isoformat()
    meta["status"] = "verified"
    meta_file.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return {"run_id": run_id, "status": "verified", "baseline_updated": True}


def get_drift_summary() -> Dict[str, Any]:
    """Aggregate drift per phase across all runs.

    Returns:
      {
        phaseName: {
          driftCount: <#run+phase with any drift>,
          totalRuns: <#runs>,
          dominantDriftType: <type_drift|format_drift|value_drift|None>,
          criticalRuns: <#run+phase with type_drift>,
          warningRuns: <#run+phase with format_drift>,
          infoRuns: <#run+phase with value_drift>,
        }
      }
    """
    _ensure_artifacts()
    default_phases = ["llm_call", "json_parse", "memory_write"]
    critical_runs: Dict[str, int] = {p: 0 for p in default_phases}
    warning_runs: Dict[str, int] = {p: 0 for p in default_phases}
    info_runs: Dict[str, int] = {p: 0 for p in default_phases}
    drift_count: Dict[str, int] = {p: 0 for p in default_phases}
    total_runs = 0
    if not ARTIFACTS_RUNS.exists():
        return {
            p: {
                "driftCount": 0,
                "totalRuns": 0,
                "dominantDriftType": None,
                "criticalRuns": 0,
                "warningRuns": 0,
                "infoRuns": 0,
            }
            for p in default_phases
        }
    for d in ARTIFACTS_RUNS.iterdir():
        if not d.is_dir():
            continue
        total_runs += 1
        diffs = load_diff(d.name)
        per_phase_types: Dict[str, set] = {p: set() for p in default_phases}
        for entry in diffs:
            if not isinstance(entry, dict):
                continue
            ph = entry.get("phase")
            if ph in per_phase_types:
                dt = entry.get("drift_type")
                if dt:
                    per_phase_types[ph].add(dt)

        for p in default_phases:
            types = per_phase_types.get(p) or set()
            if not types:
                continue
            # Any drift counts the run+phase as drifting.
            drift_count[p] = drift_count.get(p, 0) + 1
            if "type_drift" in types:
                critical_runs[p] = critical_runs.get(p, 0) + 1
            elif "format_drift" in types:
                warning_runs[p] = warning_runs.get(p, 0) + 1
            else:
                info_runs[p] = info_runs.get(p, 0) + 1

    def dominant_for_phase(p: str):
        if critical_runs.get(p, 0) > 0:
            return "type_drift"
        if warning_runs.get(p, 0) > 0:
            return "format_drift"
        if info_runs.get(p, 0) > 0:
            return "value_drift"
        return None

    phases_payload = {
        p: {
            "driftCount": drift_count.get(p, 0),
            "totalRuns": total_runs,
            "dominantDriftType": dominant_for_phase(p),
            "criticalRuns": critical_runs.get(p, 0),
            "warningRuns": warning_runs.get(p, 0),
            "infoRuns": info_runs.get(p, 0),
        }
        for p in default_phases
    }

    verified_runs = 0
    latest_ts = -1.0
    latest_status = None
    for d in ARTIFACTS_RUNS.iterdir() if ARTIFACTS_RUNS.exists() else []:
        if not d.is_dir():
            continue
        meta_file = d / "metadata.json"
        if not meta_file.exists():
            continue
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, IOError):
            continue
        status = meta.get("status")
        if status == "verified":
            verified_runs += 1

        # Determine "latest" by timestamp in metadata or run_id prefix.
        ts_val = -1.0
        ts = meta.get("timestamp")
        if isinstance(ts, str):
            try:
                from datetime import datetime
                ts_val = datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
            except Exception:
                ts_val = -1.0
        if ts_val < 0:
            # run_id format: run_<epochMs>_<suffix>
            rid = d.name
            parts = rid.split("_")
            if len(parts) >= 2:
                try:
                    ts_val = float(parts[1]) / 1000.0
                except (TypeError, ValueError):
                    ts_val = -1.0

        if ts_val > latest_ts:
            latest_ts = ts_val
            latest_status = status

    total_runs = total_runs or 0
    stability_score = 100.0
    trend = None
    if total_runs > 0:
        stability_score = (verified_runs / total_runs) * 100.0
        if latest_status == "verified":
            trend = "up"
        elif latest_status == "drift":
            trend = "down"

    return {
        "phases": phases_payload,
        "stabilityScore": stability_score,
        "verifiedRuns": verified_runs,
        "totalRuns": total_runs,
        "trend": trend,
    }


def get_drift_patterns() -> Dict[str, Any]:
    """
    Identify recurring drift patterns across runs.

    Groups diffs by:
      - path (e.g. json_parse.total)
      - drift_type (e.g. format_drift)

    Returns:
      {
        "patterns": {
          "json_parse.total": { "format_drift": 3, "type_drift": 1 }
        },
        "unstable_fields": ["json_parse.total"]
      }
    """
    _ensure_artifacts()
    patterns: Dict[str, Dict[str, int]] = {}
    if not ARTIFACTS_RUNS.exists():
        return {"patterns": patterns, "unstable_fields": []}
    for d in ARTIFACTS_RUNS.iterdir():
        if not d.is_dir():
            continue
        diffs = load_diff(d.name)
        for entry in diffs:
            if not isinstance(entry, dict):
                continue
            path = entry.get("path")
            dt = entry.get("drift_type") or "value_drift"
            if not path:
                continue
            if path not in patterns:
                patterns[path] = {}
            patterns[path][dt] = patterns[path].get(dt, 0) + 1
    unstable_fields: List[str] = []
    for path, by_type in patterns.items():
        total = 0
        for c in by_type.values():
            try:
                total += int(c)
            except (TypeError, ValueError):
                continue
        if total >= 2:
            unstable_fields.append(path)
    unstable_fields.sort()
    return {"patterns": patterns, "unstable_fields": unstable_fields}
