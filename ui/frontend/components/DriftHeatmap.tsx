import React from "react";
import { getSeverity } from "../utils/driftSeverity";

export type PhaseSummary = {
  driftCount: number;
  totalRuns: number;
  dominantDriftType?: string | null;
};

export type DriftSummary = Record<string, PhaseSummary>;

type Props = {
  /** Per-phase drift summary: { phaseName: { driftCount, totalRuns } } */
  runsDiffHistory: DriftSummary;
};

const PHASES = ["llm_call", "json_parse", "memory_write"];

function heatColor(dominantDriftType: string | null | undefined, totalRuns: number): string {
  if (totalRuns === 0) return "rgb(220, 252, 231)"; // green-100
  if (!dominantDriftType) return "rgb(220, 252, 231)";

  const { label } = getSeverity(dominantDriftType);
  if (label === "critical") return "rgb(254, 202, 202)"; // red-200
  if (label === "warning") return "rgb(254, 249, 195)"; // yellow-200
  return "rgb(219, 234, 254)"; // blue-200
}

function label(phase: string): string {
  return phase.replace(/_/g, " ");
}

export default function DriftHeatmap({ runsDiffHistory }: Props) {
  const data = PHASES.map((phase) => {
    const s = runsDiffHistory[phase] ?? { driftCount: 0, totalRuns: 0 };
    return {
      phase,
      ...s,
      color: heatColor(s.dominantDriftType, s.totalRuns),
    };
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        marginTop: "0.5rem",
      }}
    >
      {data.map(({ phase, driftCount, totalRuns, color }) => (
        <div
          key={phase}
          style={{
            flex: "1 1 120px",
            minWidth: 100,
            padding: "0.75rem 1rem",
            backgroundColor: color,
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, textTransform: "capitalize", marginBottom: "0.25rem" }}>
            {label(phase)}
          </div>
          <div style={{ fontSize: "12px", color: "#374151" }}>
            {totalRuns === 0
              ? "No runs"
              : `${driftCount} / ${totalRuns} run${totalRuns === 1 ? "" : "s"} drifted`}
          </div>
        </div>
      ))}
      <div style={{ flex: "1 1 100%", fontSize: "11px", color: "#6b7280", marginTop: "0.25rem" }}>
        <span style={{ display: "inline-block", marginRight: "0.75rem" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "rgb(220, 252, 231)", border: "1px solid #ccc", marginRight: 4, verticalAlign: "middle" }} />
          Stable
        </span>
        <span style={{ display: "inline-block", marginRight: "0.75rem" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "rgb(254, 249, 195)", border: "1px solid #ccc", marginRight: 4, verticalAlign: "middle" }} />
          Warning drift
        </span>
        <span style={{ display: "inline-block" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "rgb(254, 202, 202)", border: "1px solid #ccc", marginRight: 4, verticalAlign: "middle" }} />
          Critical drift
        </span>
        <span style={{ display: "inline-block", marginLeft: "0.75rem" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "rgb(219, 234, 254)", border: "1px solid #ccc", marginRight: 4, verticalAlign: "middle" }} />
          Info drift
        </span>
      </div>
    </div>
  );
}
