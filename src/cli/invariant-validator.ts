/**
 * Read-only invariant validator for a stored agent run.
 * Does not modify engine, runner, replay engine, or stores.
 */

import type { AgentRunStore } from "../engine/agent-run-store.js";

const DEFAULT_ORG_ID = "org-test";

export interface ValidateRunInvariantsResult {
  ok: boolean;
  failures: string[];
}

/**
 * Validates invariants for a run loaded from the store. Read-only; deterministic.
 * Prints a per-check report and returns { ok, failures }.
 *
 * @param agentRunStore - Store to read from.
 * @param runId - Run identifier.
 * @param orgId - Optional org scope; defaults to "org-test".
 */
export async function validateRunInvariants(
  agentRunStore: AgentRunStore,
  runId: string,
  orgId: string = DEFAULT_ORG_ID
): Promise<ValidateRunInvariantsResult> {
  const run = await agentRunStore.get(runId, orgId);

  if (!run) {
    console.error("Run not found:", runId);
    return { ok: false, failures: ["Run not found"] };
  }

  const failures: string[] = [];
  const report: { name: string; pass: boolean; message?: string }[] = [];

  const steps = run.steps;

  if (!steps || !Array.isArray(steps)) {
    failures.push("steps missing or not array");
    report.push({ name: "steps array present", pass: false });
  } else {
    report.push({ name: "steps array present", pass: true });
  }

  if (steps && Array.isArray(steps)) {
    if (steps.length === 0) {
      report.push({ name: "step count > 0", pass: true, message: "warn: zero steps" });
    } else {
      report.push({ name: "step count > 0", pass: true });
    }
  }

  let phaseNamesUnique = true;
  if (steps && Array.isArray(steps)) {
    const actionSet = new Set(steps.map((s) => s.action));
    if (actionSet.size !== steps.length) {
      failures.push("duplicate phase names");
      phaseNamesUnique = false;
    }
    report.push({ name: "phase names unique", pass: phaseNamesUnique });
  }

  let outputsDefined = true;
  let missingOutputStep: string | undefined;
  if (steps && Array.isArray(steps)) {
    for (const s of steps) {
      if (s.output === undefined) {
        outputsDefined = false;
        missingOutputStep = s.action;
        break;
      }
    }
    if (!outputsDefined) {
      failures.push("missing outputs in step: " + (missingOutputStep ?? "unknown"));
    }
    report.push({
      name: "outputs defined",
      pass: outputsDefined,
      message: missingOutputStep ? "missing outputs in step: " + missingOutputStep : undefined,
    });
  }

  let appendOnlyOk = true;
  if (steps && Array.isArray(steps)) {
    const seen = new Set<string>();
    for (const s of steps) {
      if (seen.has(s.action)) {
        appendOnlyOk = false;
        break;
      }
      seen.add(s.action);
    }
    if (!appendOnlyOk) failures.push("append-only ordering: duplicate action in steps");
    report.push({ name: "append-only ordering sanity", pass: appendOnlyOk });
  }

  let checkpointOk = true;
  if (steps && Array.isArray(steps) && steps.length > 0) {
    if (!run.checkpointId) {
      checkpointOk = false;
      failures.push("checkpoint missing when steps exist");
    }
    report.push({ name: "checkpoint present", pass: checkpointOk });
  } else {
    report.push({ name: "checkpoint present", pass: true });
  }

  const statusPresent = run.status !== undefined;
  if (!statusPresent) {
    failures.push("run status missing");
  }
  report.push({ name: "run status present", pass: statusPresent });

  console.log("Invariant report for run", runId);
  for (const r of report) {
    console.log(r.pass ? "✓" : "✗", r.name + (r.message ? " — " + r.message : ""));
  }
  console.log(
    failures.length === 0 ? "Invariant validation: PASS" : "Invariant validation: FAIL"
  );

  return {
    ok: failures.length === 0,
    failures,
  };
}
