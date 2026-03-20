"""
Deterministic drift classification engine for Continuum.
Compares expected vs received outputs and classifies drift type.
"""

from typing import Any, Dict, List, Optional, Tuple


class ContinuumDriftEngine:
    """Classifies drift between expected and received structured outputs."""

    DRIFT_TYPES = (
        "type_drift",
        "value_drift",
        "format_drift",
        "missing_field",
        "extra_field",
        "structure_drift",
    )

    @staticmethod
    def _type_category(val: Any) -> str:
        if val is None:
            return "null"
        if isinstance(val, bool):
            return "bool"
        if isinstance(val, int):
            return "int"
        if isinstance(val, float):
            return "float"
        if isinstance(val, str):
            return "str"
        if isinstance(val, (list, tuple)):
            return "list"
        if isinstance(val, dict):
            return "dict"
        return "other"

    @staticmethod
    def _is_numeric_string(s: str) -> bool:
        try:
            float(s)
            return True
        except (TypeError, ValueError):
            return False

    @classmethod
    def _classify_single(
        cls,
        path: str,
        expected: Any,
        received: Any,
        phase: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Classify drift for a single path. Returns None if no drift."""
        exp_type = cls._type_category(expected)
        rec_type = cls._type_category(received)

        # Missing in received
        if received is None and expected is not None:
            return {
                "path": path,
                "expected": expected,
                "received": None,
                "drift_type": "missing_field",
                "phase": phase,
            }

        # Extra in received (expected None/missing)
        if expected is None and received is not None:
            return {
                "path": path,
                "expected": None,
                "received": received,
                "drift_type": "extra_field",
                "phase": phase,
            }

        # Type change
        if exp_type != rec_type:
            # int -> string that looks like number is often format_drift
            if exp_type == "int" and rec_type == "str" and cls._is_numeric_string(str(received)):
                try:
                    if int(float(received)) == expected:
                        return {
                            "path": path,
                            "expected": expected,
                            "received": received,
                            "drift_type": "format_drift",
                            "phase": phase,
                        }
                except (ValueError, TypeError):
                    pass
            return {
                "path": path,
                "expected": expected,
                "received": received,
                "drift_type": "type_drift",
                "phase": phase,
            }

        # Same type, different value
        if exp_type in ("int", "float", "str", "bool") and expected != received:
            if exp_type == "str" and rec_type == "str":
                if cls._is_numeric_string(expected) and cls._is_numeric_string(received):
                    try:
                        if float(expected) == float(received):
                            return {
                                "path": path,
                                "expected": expected,
                                "received": received,
                                "drift_type": "format_drift",
                                "phase": phase,
                            }
                    except (ValueError, TypeError):
                        pass
            return {
                "path": path,
                "expected": expected,
                "received": received,
                "drift_type": "value_drift",
                "phase": phase,
            }

        # Nested structure: recurse
        if exp_type == "dict" and rec_type == "dict":
            return None  # Handled in verify()
        if exp_type == "list" and rec_type == "list":
            if len(expected) != len(received):
                return {
                    "path": path,
                    "expected": expected,
                    "received": received,
                    "drift_type": "structure_drift",
                    "phase": phase,
                }
            return None

        return None

    @classmethod
    def _flatten(
        cls,
        obj: Any,
        prefix: str = "",
        phase: Optional[str] = None,
    ) -> List[Tuple[str, Any, Optional[str]]]:
        """Flatten nested dict into (path, value, phase) list. Phase from top-level key if obj is phase-keyed."""
        out: List[Tuple[str, Any, Optional[str]]] = []
        if isinstance(obj, dict) and not prefix:
            for k, v in obj.items():
                out.extend(cls._flatten(v, k, phase or k))
            return out
        if isinstance(obj, dict):
            for k, v in obj.items():
                p = f"{prefix}.{k}" if prefix else k
                out.extend(cls._flatten(v, p, phase))
            return out
        if isinstance(obj, list):
            for i, v in enumerate(obj):
                out.extend(cls._flatten(v, f"{prefix}[{i}]", phase))
            return out
        out.append((prefix, obj, phase))
        return out

    @classmethod
    def verify(
        cls,
        expected: Any,
        received: Any,
        phase: Optional[str] = None,
        strict: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Compare expected vs received and return list of drift entries.
        Each entry: path, expected, received, drift_type, phase.
        """
        results: List[Dict[str, Any]] = []

        def walk(exp: Any, rec: Any, path: str, ph: Optional[str]) -> None:
            exp_type = cls._type_category(exp)
            rec_type = cls._type_category(rec)

            if exp_type != "dict" or rec_type != "dict":
                d = cls._classify_single(path, exp, rec, ph)
                if d is not None:
                    results.append(d)
                return

            all_keys = set(exp.keys()) | set(rec.keys())
            for key in sorted(all_keys):
                p = f"{path}.{key}" if path else key
                if key not in rec:
                    results.append({
                        "path": p,
                        "expected": exp.get(key),
                        "received": None,
                        "drift_type": "missing_field",
                        "phase": ph,
                    })
                elif key not in exp:
                    if strict:
                        results.append({
                            "path": p,
                            "expected": None,
                            "received": rec.get(key),
                            "drift_type": "extra_field",
                            "phase": ph,
                        })
                else:
                    walk(exp[key], rec[key], p, ph)

        walk(expected, received, "", phase)
        return results
