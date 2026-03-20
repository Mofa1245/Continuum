import React from "react";
import { getSeverity } from "../utils/driftSeverity";
import { getRootCauseFromDiffs } from "../utils/rootCause";
import { getDriftImpact } from "../utils/driftImpact";
import { getPromptChangeAttribution } from "../utils/promptAttribution";

type DiffEntry = {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type?: string;
  phase?: string;
};

type Props = {
  diffs: DiffEntry[];
  expectedPrompt?: string | null;
  actualPrompt?: string | null;
  unstableFields?: string[];
  highlight?: boolean;
};

function priority(driftType: string | undefined): number {
  // Higher priority first.
  if (driftType === "type_drift") return 3;
  if (driftType === "format_drift") return 2;
  if (driftType === "value_drift") return 1;
  return 0;
}

function pickPrimaryDrift(diffs: DiffEntry[]): DiffEntry | null {
  if (!diffs || diffs.length === 0) return null;
  const sorted = diffs.slice().sort((a, b) => priority(b.drift_type) - priority(a.drift_type));
  return sorted[0] ?? null;
}

function formatValue(v: unknown): string {
  if (v === undefined) return "undefined";
  try {
    return JSON.stringify(v, null, 0);
  } catch {
    return String(v);
  }
}

function explanationForType(driftType: string | undefined): string {
  if (driftType === "format_drift") {
    return "Value format changed. This may cause parsing inconsistencies.";
  }
  if (driftType === "type_drift") {
    return "Type mismatch detected. This can break downstream logic.";
  }
  // value_drift and fallback.
  return "Value changed between runs.";
}

export default function DriftFocusPanel({
  diffs,
  expectedPrompt,
  actualPrompt,
  unstableFields,
  highlight,
}: Props) {
  const primary = pickPrimaryDrift(diffs);

  if (!primary) return null;

  const driftType = primary.drift_type ?? "value_drift";
  const { label, color } = getSeverity(driftType);
  const rootCause = getRootCauseFromDiffs(diffs);
  const impact = getDriftImpact(driftType);
  const attribution =
    typeof expectedPrompt === "string" && typeof actualPrompt === "string"
      ? getPromptChangeAttribution(expectedPrompt, actualPrompt, diffs)
      : null;
  const unstable = new Set(unstableFields ?? []);
  const touchesUnstableField = diffs.some((d) => unstable.has(d.path));
  const suggestedFix =
    driftType === "format_drift"
      ? "Enforce strict schema or post-process to normalize types."
      : driftType === "type_drift"
        ? "Cast types explicitly or validate output schema."
        : "Add constraints or validation rules.";

  const stripColor = color;
  const bg = `${color}22`; // alpha-ish

  return (
    <section
      style={{
        marginTop: "1rem",
        border: `1px solid ${stripColor}`,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: bg,
        boxShadow: highlight ? `0 0 0 4px rgba(245, 158, 11, 0.25), 0 10px 24px rgba(0,0,0,0.08)` : undefined,
        transform: highlight ? "scale(1.01)" : undefined,
        transition: "box-shadow 150ms ease, transform 150ms ease",
      }}
    >
      <div style={{ height: 6, width: "100%", backgroundColor: stripColor }} />
      <div style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>
            Primary Drift: <span style={{ fontFamily: "monospace" }}>{primary.path}</span>
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: stripColor,
              border: `1px solid ${stripColor}`,
              backgroundColor: "#fff",
              borderRadius: 999,
              padding: "0.15rem 0.5rem",
            }}
          >
            {label.toUpperCase()}
          </span>
        </div>

        <div style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: 13 }}>
          {touchesUnstableField && (
            <div
              style={{
                marginBottom: "0.5rem",
                padding: "0.5rem 0.65rem",
                borderRadius: 8,
                border: "1px solid rgba(245, 158, 11, 0.75)",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                fontFamily: "system-ui",
                fontSize: 12,
                color: "#92400e",
              }}
            >
              ⚠ This field has drifted multiple times. High risk of future instability.
            </div>
          )}
          <div>
            <strong>Expected:</strong> {formatValue(primary.expected)}
          </div>
          <div>
            <strong>Actual:</strong> {formatValue(primary.received)}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#374151" }}>{explanationForType(driftType)}</div>
          <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Impact</div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>{impact}</div>
          </div>
          <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Root cause</div>
            <div style={{ fontSize: 13, color: "#1f2937" }}>{rootCause.summary}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, fontStyle: "italic" }}>
              {rootCause.chain}
            </div>
          </div>
          {attribution && (
            <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Prompt attribution</div>
              <div style={{ fontSize: 12, color: "#374151" }}>{attribution.message}</div>
            </div>
          )}
          <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Suggested fix</div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>{suggestedFix}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

