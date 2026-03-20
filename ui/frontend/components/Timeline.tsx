import React from "react";

type DiffEntry = {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type?: string;
  phase?: string;
};

type Props = {
  diffs: DiffEntry[];
};

const DEFAULT_PHASES = ["llm_call", "json_parse", "memory_write"];

function titleForPhase(phase: string, diffs: DiffEntry[]) {
  const paths = [...new Set(diffs.map((d) => d.path).filter(Boolean))];
  const shown = paths.slice(0, 8);
  const more = paths.length > shown.length ? ` (+${paths.length - shown.length} more)` : "";
  const items = shown.map((p) => `- ${p}`).join("\n");
  return `${phase.replace(/_/g, " ")}:\n- ${diffs.length} diff${diffs.length === 1 ? "" : "s"}\n${items}${more}`;
}

export default function Timeline({ diffs }: Props) {
  const phaseDiffs = DEFAULT_PHASES.map((phase) => ({
    phase,
    diffs: diffs.filter((d) => d.phase === phase),
  }));

  const firstFail = phaseDiffs.find((p) => p.diffs.length > 0)?.phase;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
        marginTop: "0.75rem",
      }}
    >
      {phaseDiffs.map(({ phase, diffs: pd }, idx) => {
        const hasDrift = pd.length > 0;
        const isFirstFail = firstFail === phase;
        const bg = hasDrift ? "rgb(254, 202, 202)" : "rgb(220, 252, 231)";
        return (
          <React.Fragment key={phase}>
            <div
              title={titleForPhase(phase, pd)}
              style={{
                flex: "0 0 auto",
                minWidth: 120,
                padding: "0.75rem 0.85rem",
                border: `1px solid #e5e7eb`,
                borderRadius: 10,
                backgroundColor: bg,
                fontFamily: "system-ui",
                fontWeight: isFirstFail ? 900 : 700,
                transform: isFirstFail ? "scale(1.03)" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontFamily: "monospace", fontSize: 13 }}>{phase}</div>
                <div style={{ fontSize: 14 }}>{hasDrift ? "🔴" : "🟢"}</div>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#374151" }}>
                {hasDrift ? `${pd.length} drift diff${pd.length === 1 ? "" : "s"}` : "No drift"}
              </div>
            </div>
            {idx < phaseDiffs.length - 1 && <div style={{ color: "#6b7280" }}>→</div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
