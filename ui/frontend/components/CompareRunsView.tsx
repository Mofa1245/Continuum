import React, { useEffect, useMemo, useState } from "react";
import PromptDiff from "./PromptDiff";
import TokenDiff from "./TokenDiff";
import InlineJsonDiff from "./InlineJsonDiff";

type DiffEntry = {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type?: string;
  phase?: string;
};

type Props = {
  baselineRunId: string;
  driftedRunId: string;
  onClose: () => void;
};

const API = "http://localhost:8000";

function tryToNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function classify(expected: unknown, received: unknown): "type_drift" | "format_drift" | "value_drift" {
  const expT = typeof expected;
  const recT = typeof received;

  const expN = tryToNumber(expected);
  const recN = tryToNumber(received);
  if (expN !== null && recN !== null && expN === recN && expected !== received) {
    return "format_drift";
  }

  if (expT !== recT) return "type_drift";
  return "value_drift";
}

function isPrimitive(x: unknown): boolean {
  return x === null || (typeof x !== "object" && typeof x !== "function");
}

function deepDiff(stored: unknown, current: unknown, basePath: string): Array<{ path: string; stored: unknown; current: unknown }> {
  if (isPrimitive(stored) || isPrimitive(current)) {
    if (stored !== current) return [{ path: basePath, stored, current }];
    return [];
  }

  if (Array.isArray(stored) && Array.isArray(current)) {
    const out: Array<{ path: string; stored: unknown; current: unknown }> = [];
    const max = Math.max(stored.length, current.length);
    for (let i = 0; i < max; i++) {
      const p = basePath ? `${basePath}.${i}` : String(i);
      out.push(...deepDiff(stored[i], current[i], p));
    }
    return out;
  }

  if (Array.isArray(stored) !== Array.isArray(current)) {
    return [{ path: basePath, stored, current }];
  }

  const so = stored as Record<string, unknown>;
  const co = current as Record<string, unknown>;
  const keys = new Set([...Object.keys(so), ...Object.keys(co)]);
  const out: Array<{ path: string; stored: unknown; current: unknown }> = [];
  for (const k of keys) {
    const p = basePath ? `${basePath}.${k}` : k;
    out.push(...deepDiff(so[k], co[k], p));
  }
  return out;
}

function phaseFromPath(path: string): string | undefined {
  const seg = String(path).split(".")[0];
  return seg || undefined;
}

function buildDiffEntries(expectedObj: any, actualObj: any): DiffEntry[] {
  const raw = deepDiff(expectedObj, actualObj, "");
  return raw
    .filter((d) => d.path)
    .map((d) => ({
      path: d.path,
      expected: d.stored,
      received: d.current,
      drift_type: classify(d.stored, d.current),
      phase: phaseFromPath(d.path),
    }));
}

function pickPrimaryDiff(diffs: DiffEntry[]): DiffEntry | null {
  const priority = (t?: string) => (t === "type_drift" ? 3 : t === "format_drift" ? 2 : t === "value_drift" ? 1 : 0);
  const sorted = diffs.slice().sort((a, b) => priority(b.drift_type) - priority(a.drift_type));
  return sorted[0] ?? null;
}

export default function CompareRunsView({ baselineRunId, driftedRunId, onClose }: Props) {
  const [baselineExpected, setBaselineExpected] = useState<Record<string, unknown> | null>(null);
  const [driftedExpected, setDriftedExpected] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`${API}/runs/${baselineRunId}/expected`).then((r) => r.json()),
      fetch(`${API}/runs/${driftedRunId}/expected`).then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        setBaselineExpected(a && typeof a === "object" ? a : null);
        setDriftedExpected(b && typeof b === "object" ? b : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baselineRunId, driftedRunId]);

  const diffs = useMemo(() => {
    if (!baselineExpected || !driftedExpected) return [];
    return buildDiffEntries(baselineExpected, driftedExpected);
  }, [baselineExpected, driftedExpected]);

  const primary = useMemo(() => pickPrimaryDiff(diffs), [diffs]);

  const baselinePrompt = (baselineExpected?.llm_call as any)?.prompt;
  const driftedPrompt = (driftedExpected?.llm_call as any)?.prompt;
  const baselineRaw = (baselineExpected?.llm_call as any)?.rawText;
  const driftedRaw = (driftedExpected?.llm_call as any)?.rawText;

  const summary =
    primary != null
      ? `Changes from ${baselineRunId} → ${driftedRunId} caused ${primary.drift_type ?? "value_drift"} in ${primary.path}`
      : `No differences detected between ${baselineRunId} and ${driftedRunId}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          backgroundColor: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "1rem 1.25rem",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Compare Runs</h2>
            <div style={{ marginTop: 6, color: "#374151", fontSize: 13 }}>{summary}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 8,
              padding: "0.4rem 0.6rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {loading ? (
          <p style={{ marginTop: "1rem" }}>Loading…</p>
        ) : (
          <>
            {typeof baselinePrompt === "string" && typeof driftedPrompt === "string" && baselinePrompt !== driftedPrompt && (
              <>
                <h3 style={{ marginTop: "1.25rem", marginBottom: 6 }}>Prompt Change</h3>
                <PromptDiff expectedPrompt={baselinePrompt} actualPrompt={driftedPrompt} />
              </>
            )}

            {typeof baselineRaw === "string" && typeof driftedRaw === "string" && baselineRaw !== driftedRaw && (
              <>
                <h3 style={{ marginTop: "1.25rem", marginBottom: 6 }}>LLM output (token diff)</h3>
                <TokenDiff expected_output={baselineRaw} actual_output={driftedRaw} />
              </>
            )}

            <h3 style={{ marginTop: "1.25rem", marginBottom: 6 }}>Parsed output</h3>
            <InlineJsonDiff expected={baselineExpected ?? {}} actual={driftedExpected ?? {}} diffs={diffs} />
          </>
        )}
      </div>
    </div>
  );
}

