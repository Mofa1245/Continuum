"""Re-run verification and regenerate artifacts for a run."""

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

from ui.backend.config import ARTIFACTS_RUNS, DIST_CLI, NODE, REPO_ROOT
from ui.backend.services import run_loader

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
from engine.drift_classifier import ContinuumDriftEngine


def _is_numeric_string(s: str) -> bool:
    try:
        float(s)
        return True
    except (TypeError, ValueError):
        return False


def _classify_drift_type(expected: Any, received: Any) -> str:
    """
    Lightweight drift classification focused on:
      - type_drift: Python type/category differs
      - format_drift: numeric value matches but representation differs
      - value_drift: different values
    """
    # Handle verify output formatting quirks.
    if expected == "undefined":
        expected = None
    if received == "undefined":
        received = None

    # Missing / extra fields are treated as info-level drift in the UI.
    if received is None and expected is not None:
        return "value_drift"
    if expected is None and received is not None:
        return "value_drift"

    exp_type = type(expected)
    rec_type = type(received)

    # Both numeric (or numeric strings): check semantic equality => format_drift.
    if isinstance(expected, (int, float)) and isinstance(received, str) and _is_numeric_string(received):
        try:
            if float(received) == float(expected):
                return "format_drift"
        except (TypeError, ValueError):
            pass
    if isinstance(received, (int, float)) and isinstance(expected, str) and _is_numeric_string(expected):
        try:
            if float(expected) == float(received):
                return "format_drift"
        except (TypeError, ValueError):
            pass
    if isinstance(expected, str) and isinstance(received, str) and _is_numeric_string(expected) and _is_numeric_string(received):
        if float(expected) == float(received) and expected != received:
            return "format_drift"

    # Type mismatch.
    if exp_type != rec_type:
        return "type_drift"

    # Same type but different value.
    if expected != received:
        return "value_drift"

    return "value_drift"


def _run_verify(run_id: str) -> str:
    """Run continuum verify and return combined stdout+stderr."""
    cmd = [NODE, str(DIST_CLI), "verify", run_id, "--strict"]
    result = subprocess.run(
        cmd,
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=60,
    )
    return result.stdout + result.stderr


def _parse_verify_output(text: str) -> tuple[List[Dict[str, Any]], str | None]:
    """Parse verify output for Path/Stored/Current and drift phase. Returns (diffs, drift_phase)."""
    diffs: List[Dict[str, Any]] = []
    drift_phase: str | None = None
    current_path: str | None = None
    current_expected: Any = None
    current_received: Any = None
    phase_re = re.compile(r"Drift detected in phase:\s*(\w+)")
    path_re = re.compile(r"Path:\s*(.+)")
    stored_re = re.compile(r"Stored:\s*(.+)")
    current_re = re.compile(r"Current:\s*(.+)")

    for line in text.splitlines():
        m = phase_re.search(line)
        if m:
            drift_phase = m.group(1).strip()
            continue
        m = path_re.search(line)
        if m:
            if current_path and current_expected is not None and current_received is not None:
                try:
                    expected = json.loads(current_expected)
                except json.JSONDecodeError:
                    expected = current_expected
                try:
                    received = json.loads(current_received)
                except json.JSONDecodeError:
                    received = current_received
                diffs.append({
                    "path": current_path,
                    "expected": expected,
                    "received": received,
                    "drift_type": "value_drift",
                    "phase": drift_phase,
                })
            current_path = m.group(1).strip()
            current_expected = None
            current_received = None
            continue
        m = stored_re.search(line)
        if m:
            current_expected = m.group(1).strip()
            continue
        m = current_re.search(line)
        if m:
            current_received = m.group(1).strip()
            continue

    if current_path and current_expected is not None and current_received is not None:
        try:
            expected = json.loads(current_expected)
        except json.JSONDecodeError:
            expected = current_expected
        try:
            received = json.loads(current_received)
        except json.JSONDecodeError:
            received = current_received
        diffs.append({
            "path": current_path,
            "expected": expected,
            "received": received,
            "drift_type": "value_drift",
            "phase": drift_phase,
        })

    return diffs, drift_phase


def replay_run(run_id: str) -> Dict[str, Any]:
    """Re-run verification, update artifacts, return result."""
    run_loader.load_metadata(run_id)  # ensure exists
    out = _run_verify(run_id)
    diffs, drift_phase = _parse_verify_output(out)
    # Re-classify drift types so the UI severity system can distinguish
    # type_drift vs format_drift vs value_drift.
    for entry in diffs:
        entry["drift_type"] = _classify_drift_type(entry.get("expected"), entry.get("received"))
    expected = run_loader.load_expected(run_id)
    actual = run_loader.load_actual(run_id)
    timeline_data = run_loader.load_timeline(run_id)
    meta = run_loader.load_metadata(run_id)

    # If we parsed diffs, optionally refine with drift classifier
    if not diffs and expected and actual:
        for phase_name, exp_val in expected.items():
            rec_val = actual.get(phase_name)
            entries = ContinuumDriftEngine.verify(exp_val, rec_val, phase=phase_name)
            for e in entries:
                diffs.append(e)

    # Update timeline with drift phase
    timeline: List[Dict[str, Any]] = []
    for e in timeline_data:
        status = "drift" if (drift_phase and e.get("phase") == drift_phase) else e.get("status", "ok")
        timeline.append({"phase": e.get("phase", ""), "status": status})

    status = "drift" if diffs else "verified"
    meta["status"] = status
    artifact_dir = ARTIFACTS_RUNS / run_id
    artifact_dir.mkdir(parents=True, exist_ok=True)
    (artifact_dir / "metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    (artifact_dir / "diff.json").write_text(json.dumps(diffs, indent=2), encoding="utf-8")
    (artifact_dir / "timeline.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")

    return {
        "run_id": run_id,
        "status": status,
        "drift_count": len(diffs),
        "diffs": diffs,
    }
