type DiffEntry = {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type?: string;
  phase?: string;
};

type Props = { diffs: DiffEntry[] };

export default function DiffViewer({ diffs }: Props) {
  if (!diffs || diffs.length === 0) {
    return <p>No drift detected.</p>;
  }

  return (
    <table style={{ borderCollapse: "collapse", marginTop: "0.5rem", width: "100%" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Path</th>
          <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Expected</th>
          <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Received</th>
          <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Drift Type</th>
          <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Phase</th>
        </tr>
      </thead>
      <tbody>
        {diffs.map((d, i) => (
          <tr key={i} style={{ backgroundColor: "#fff8f0" }}>
            <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{d.path}</td>
            <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{JSON.stringify(d.expected)}</td>
            <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{JSON.stringify(d.received)}</td>
            <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{d.drift_type ?? "—"}</td>
            <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{d.phase ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
