type Props = { data: unknown };

export default function JsonViewer({ data }: Props) {
  return (
    <pre
      style={{
        background: "#f5f5f5",
        padding: "1rem",
        overflow: "auto",
        fontSize: "12px",
        border: "1px solid #ddd",
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
