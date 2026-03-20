/**
 * Business consequence of each drift type (rule-based).
 */

export function getDriftImpact(driftType: string | undefined): string {
  switch (driftType) {
    case "type_drift":
      return "Type mismatch — likely to break downstream logic";
    case "format_drift":
      return "Format changed — may cause parsing or formatting issues";
    case "value_drift":
      return "Value changed — depends on business logic";
    default:
      return "Value changed — depends on business logic";
  }
}
