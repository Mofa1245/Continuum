import React from "react";

export type DriftPatterns = {
  patterns: Record<string, Record<string, number>>;
  unstable_fields?: string[];
};

type Row = { path: string; driftType: string; count: number };

type Props = {
  patterns: DriftPatterns;
};

export default function DriftPatterns({ patterns }: Props) {
  const rows: Row[] = [];
  const unstable = new Set(patterns?.unstable_fields ?? []);
  for (const [path, byType] of Object.entries(patterns?.patterns ?? {})) {
    for (const [driftType, count] of Object.entries(byType ?? {})) {
      rows.push({ path, driftType, count: Number(count) || 0 });
    }
  }
  rows.sort((a, b) => b.count - a.count);

  if (rows.length === 0) {
    return <p style={{ marginTop: "0.5rem" }}>No drift patterns yet.</p>;
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "1px solid #ccc" }}>Path</th>
            <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "1px solid #ccc" }}>Drift Type</th>
            <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", borderBottom: "1px solid #ccc" }}>Count</th>
            <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "1px solid #ccc" }}>Label</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.path}-${r.driftType}-${idx}`}>
              <td style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee", fontFamily: "monospace" }}>
                {r.path}
              </td>
              <td style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee", fontFamily: "monospace" }}>
                {r.driftType}
              </td>
              <td style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {r.count}
              </td>
              <td style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee", color: "#6b7280", fontSize: 12 }}>
                {unstable.has(r.path) ? "High-risk field" : r.count >= 2 ? "Recurring issue" : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

