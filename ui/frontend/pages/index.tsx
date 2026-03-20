import { useEffect, useMemo, useState } from "react";
import RunTable from "../components/RunTable";
import DriftHeatmap, { type DriftSummary } from "../components/DriftHeatmap";
import DriftPatterns, { type DriftPatterns as DriftPatternsType } from "../components/DriftPatterns";
import CompareRunsView from "../components/CompareRunsView";
import LiveDriftFeed from "../components/LiveDriftFeed";
import { useRouter } from "next/router";

type RunSummary = {
  id: string;
  status: string;
  driftType?: string | null;
  driftPhase?: string | null;
};

type DriftSummaryResponse = {
  phases: DriftSummary;
  stabilityScore: number;
  verifiedRuns: number;
  totalRuns: number;
  trend?: "up" | "down" | null;
};

const API = "http://localhost:8000";

export default function Dashboard() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [driftSummary, setDriftSummary] = useState<DriftSummaryResponse | null>(null);
  const [driftPatterns, setDriftPatterns] = useState<DriftPatternsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [baselineRunId, setBaselineRunId] = useState<string | null>(null);
  const [driftedRunId, setDriftedRunId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/runs`).then((res) => res.json()),
      fetch(`${API}/runs/drift-summary`).then((res) => res.json()),
      fetch(`${API}/runs/drift-patterns`).then((res) => res.json()),
    ])
      .then(([runsData, summaryData, patternsData]) => {
        setRuns(Array.isArray(runsData) ? runsData : []);
        setDriftSummary(
          summaryData && typeof summaryData === "object" && "phases" in summaryData
            ? (summaryData as DriftSummaryResponse)
            : null
        );
        setDriftPatterns(patternsData && typeof patternsData === "object" ? patternsData : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stability = driftSummary?.stabilityScore ?? null;
  const stabilityColor = useMemo(() => {
    if (stability == null) return "#d1d5db";
    if (stability >= 90) return "#22c55e";
    if (stability >= 70) return "#f59e0b";
    return "#ef4444";
  }, [stability]);

  function runEpochMs(runId: string): number {
    // run_<epochMs>_<suffix>
    const parts = String(runId).split("_");
    if (parts.length >= 2) {
      const n = Number(parts[1]);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  }

  const latestDriftRun = useMemo(() => {
    const drifted = runs.filter((r) => r.status !== "verified");
    drifted.sort((a, b) => runEpochMs(b.id) - runEpochMs(a.id));
    return drifted[0] ?? null;
  }, [runs]);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Continuum Drift Dashboard</h1>

      {!loading && driftSummary && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: 10,
            border: `1px solid ${stabilityColor}`,
            backgroundColor: `${stabilityColor}18`,
          }}
        >
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>System Stability</div>
          <div style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "baseline", gap: 10 }}>
            <span>
              {Math.round(driftSummary.stabilityScore)}% stable
            </span>
            {driftSummary.trend && (
              <span style={{ fontSize: 14, color: "#111827" }}>
                {driftSummary.trend === "up" ? "↑" : "↓"}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.25rem" }}>
        <h2 style={{ marginBottom: "0.25rem" }}>Live Activity</h2>
        <LiveDriftFeed />
      </div>

      {!loading && driftSummary && (
        <>
          <h2 style={{ marginTop: "1.5rem", marginBottom: "0.25rem" }}>Stability Scorecard</h2>
          <DriftHeatmap runsDiffHistory={driftSummary.phases} />
        </>
      )}

      {!loading && driftPatterns && (
        <>
          <h2 style={{ marginTop: "1.5rem", marginBottom: "0.25rem" }}>Drift Patterns</h2>
          <DriftPatterns patterns={driftPatterns} />
        </>
      )}

      <h2 style={{ marginTop: "1.5rem", marginBottom: "0.25rem" }}>Runs</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {latestDriftRun && (
            <button
              onClick={() => router.push(`/run/${latestDriftRun.id}?debug=1`)}
              style={{
                border: "1px solid rgba(239, 68, 68, 0.35)",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                color: "#991b1b",
                borderRadius: 10,
                padding: "0.6rem 0.9rem",
                cursor: "pointer",
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              Debug Latest Drift
            </button>
          )}
          <div style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: 12 }}>
            Compare: click <strong>Compare</strong> on two runs (baseline first, then drifted).
            {baselineRunId && (
              <>
                {" "}
                Baseline: <span style={{ fontFamily: "monospace" }}>{baselineRunId}</span>
              </>
            )}
            {driftedRunId && (
              <>
                {" "}
                Drifted: <span style={{ fontFamily: "monospace" }}>{driftedRunId}</span>
              </>
            )}
          </div>
          <RunTable
            runs={runs}
            onCompare={(id) => {
              if (!baselineRunId || (baselineRunId && driftedRunId)) {
                setBaselineRunId(id);
                setDriftedRunId(null);
                return;
              }
              if (!driftedRunId && baselineRunId !== id) {
                setDriftedRunId(id);
              }
            }}
          />
        </>
      )}

      {baselineRunId && driftedRunId && (
        <CompareRunsView
          baselineRunId={baselineRunId}
          driftedRunId={driftedRunId}
          onClose={() => {
            setBaselineRunId(null);
            setDriftedRunId(null);
          }}
        />
      )}
    </main>
  );
}
