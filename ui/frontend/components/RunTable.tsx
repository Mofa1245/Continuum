import { useRouter } from "next/router";

type RunSummary = {
  id: string;
  status: string;
  driftType?: string | null;
  driftPhase?: string | null;
};

type Props = {
  runs: RunSummary[];
  onCompare?: (runId: string) => void;
};

function statusText(run: RunSummary): string {
  if (run.status === "verified") return "🟢 verified";
  if (run.driftType === "type_drift") return "🔴 critical drift";
  if (run.driftType === "format_drift") return "🟡 warning drift";
  if (run.driftType === "value_drift") return "🔵 info drift";
  return "✗ drift";
}

function severityPriority(driftType?: string | null): number {
  if (driftType === "type_drift") return 3;
  if (driftType === "format_drift") return 2;
  if (driftType === "value_drift") return 1;
  return 0;
}

export default function RunTable({ runs, onCompare }: Props) {
  const router = useRouter();
  if (runs.length === 0) {
    return <p>No runs found. Run the pipeline first to generate artifacts.</p>;
  }

  const sorted = runs
    .slice()
    .sort((a, b) => {
      const aFailed = a.status !== "verified";
      const bFailed = b.status !== "verified";
      if (aFailed !== bFailed) return aFailed ? -1 : 1;
      return severityPriority(b.driftType) - severityPriority(a.driftType);
    });

  return (
    <table style={{ borderCollapse: "collapse", marginTop: "1rem" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "0.5rem 1rem", borderBottom: "1px solid #ccc" }}>Run ID</th>
          <th style={{ textAlign: "left", padding: "0.5rem 1rem", borderBottom: "1px solid #ccc" }}>Status</th>
          <th style={{ textAlign: "left", padding: "0.5rem 1rem", borderBottom: "1px solid #ccc" }}>Drift Type</th>
          <th style={{ textAlign: "left", padding: "0.5rem 1rem", borderBottom: "1px solid #ccc" }}>Phase</th>
          <th style={{ textAlign: "left", padding: "0.5rem 1rem", borderBottom: "1px solid #ccc" }}>Compare</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((run) => (
          <tr
            key={run.id}
            onClick={() => router.push(`/run/${run.id}`)}
            style={{ cursor: "pointer" }}
          >
            <td style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #eee" }}>
              <span style={{ color: "#0066cc", fontWeight: 600 }}>{run.id}</span>
            </td>
            <td style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #eee" }}>
              {statusText(run)}
            </td>
            <td style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #eee" }}>
              {run.driftType ? run.driftType : "—"}
            </td>
            <td style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #eee" }}>
              {run.driftPhase ? run.driftPhase : "—"}
            </td>
            <td style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #eee" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare?.(run.id);
                }}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "0.35rem 0.55rem",
                  cursor: "pointer",
                }}
              >
                Compare
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
