export type DriftSeverity = "critical" | "warning" | "info";

export function getSeverity(driftType: string): {
  label: DriftSeverity;
  color: string;
} {
  switch (driftType) {
    case "type_drift":
      return { label: "critical", color: "#ef4444" }; // red
    case "format_drift":
      return { label: "warning", color: "#f59e0b" }; // yellow
    case "value_drift":
      return { label: "info", color: "#3b82f6" }; // blue
    default:
      // Unknown drift types still get treated as informational.
      return { label: "info", color: "#3b82f6" };
  }
}

