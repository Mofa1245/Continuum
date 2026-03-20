/**
 * Classify drift type for a single path (aligned with engine/drift_classifier.py).
 * Used when writing diff.json from Node so Dashboard and DriftHeatmap show format_drift etc.
 */

export interface ClassifiedDiff {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type: string;
  phase?: string;
}

function typeCategory(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "boolean") return "bool";
  if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
  if (typeof val === "string") return "str";
  if (Array.isArray(val)) return "list";
  if (typeof val === "object") return "dict";
  return "other";
}

function isNumericString(s: string): boolean {
  const n = Number(s);
  return !Number.isNaN(n) && s.trim() !== "";
}

/**
 * Classify a single diff entry (path, stored, current) into drift_type.
 */
export function classifyDiff(
  path: string,
  expected: unknown,
  received: unknown,
  phase?: string
): ClassifiedDiff {
  const expType = typeCategory(expected);
  const recType = typeCategory(received);

  if (received === undefined || received === null) {
    if (expected !== undefined && expected !== null) {
      return { path, expected, received: received ?? null, drift_type: "missing_field", phase };
    }
  }
  if (expected === undefined || expected === null) {
    if (received !== undefined && received !== null) {
      return { path, expected: expected ?? null, received, drift_type: "extra_field", phase };
    }
  }

  if (expType !== recType) {
    if (expType === "int" && recType === "str" && isNumericString(String(received))) {
      try {
        if (Number((received as string).trim()) === expected) {
          return { path, expected, received, drift_type: "format_drift", phase };
        }
      } catch {
        // fall through to type_drift
      }
    }
    return { path, expected, received, drift_type: "type_drift", phase };
  }

  if (["int", "float", "str", "bool"].includes(expType) && expected !== received) {
    if (expType === "str" && isNumericString(String(expected)) && isNumericString(String(received))) {
      try {
        if (Number(String(expected)) === Number(String(received))) {
          return { path, expected, received, drift_type: "format_drift", phase };
        }
      } catch {
        // fall through
      }
    }
    return { path, expected, received, drift_type: "value_drift", phase };
  }

  return { path, expected, received, drift_type: "value_drift", phase };
}
