/**
 * Read-only helper: compare two run result objects and print step-by-step differences.
 * Pure, deterministic; no engine or storage changes.
 */

/**
 * Deterministic JSON stringify (object keys sorted) for deep equality.
 */
function deterministicStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((v) => deterministicStringify(v)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => JSON.stringify(k) + ":" + deterministicStringify(obj[k]));
  return "{" + pairs.join(",") + "}";
}

function deepEqual(a: unknown, b: unknown): boolean {
  return deterministicStringify(a) === deterministicStringify(b);
}

/**
 * Compares two run result objects (e.g. phaseResults or stepResults) and prints
 * step-by-step differences. When phaseOrder is provided, keys are shown in that
 * order (deterministic execution order); otherwise keys are sorted alphabetically.
 *
 * @param originalResults - Result map from original run (step/phase name → value).
 * @param replayResults - Result map from replay or other run.
 * @param options - Optional: secondLabel for the second column (default "replay");
 *                  phaseOrder: array of phase names to enforce display order.
 */
export function printReplayDiff(
  originalResults: Record<string, unknown>,
  replayResults: Record<string, unknown>,
  options?: { secondLabel?: string; phaseOrder?: string[] }
): void {
  const secondLabel = options?.secondLabel ?? "replay";
  const phaseOrder = options?.phaseOrder;
  const keySet = new Set([
    ...Object.keys(originalResults),
    ...Object.keys(replayResults),
  ]);
  const allKeys = phaseOrder
    ? [...phaseOrder.filter((k) => keySet.has(k)), ...Array.from(keySet).filter((k) => !phaseOrder.includes(k))]
    : Array.from(keySet).sort();

  for (const stepName of allKeys) {
    const orig = originalResults[stepName];
    const repl = replayResults[stepName];

    if (deepEqual(orig, repl)) {
      console.log("✓", stepName);
    } else {
      console.log("✗", stepName);
      console.log("  original:", JSON.stringify(orig, null, 2));
      console.log(`  ${secondLabel.padEnd(7)}:`, JSON.stringify(repl, null, 2));
    }
  }
}

/**
 * Deep-compares two run result maps using the same deterministic stringify as printReplayDiff.
 */
export function areReplayResultsEqual(
  originalResults: Record<string, unknown>,
  replayResults: Record<string, unknown>
): boolean {
  const keySet = new Set([
    ...Object.keys(originalResults),
    ...Object.keys(replayResults),
  ]);
  const allKeys = Array.from(keySet).sort();
  for (const k of allKeys) {
    if (!deepEqual(originalResults[k], replayResults[k])) return false;
  }
  return true;
}
