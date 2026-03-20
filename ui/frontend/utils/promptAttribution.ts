/**
 * Rule-based prompt change attribution.
 * Identifies which changed line likely caused the drift.
 */

type DiffLike = { path?: string; drift_type?: string; phase?: string };

function addedLines(expectedPrompt: string, actualPrompt: string): string[] {
  const a = new Set(expectedPrompt.split("\n").map((s) => s.trim()).filter(Boolean));
  const b = actualPrompt.split("\n").map((s) => s.trim()).filter(Boolean);
  return b.filter((line) => !a.has(line));
}

function hasFormatOrParseDrift(diffs: DiffLike[]): boolean {
  return diffs.some((d) => d.drift_type === "format_drift" || String(d.path ?? "").startsWith("json_parse."));
}

function hasPromptDiff(diffs: DiffLike[]): boolean {
  return diffs.some((d) => String(d.path ?? "") === "llm_call.prompt");
}

export function getPromptChangeAttribution(
  expectedPrompt: string,
  actualPrompt: string,
  diffs: DiffLike[]
): { message: string; highlightAddedLines: string[] } | null {
  if (!expectedPrompt || !actualPrompt) return null;
  if (!hasPromptDiff(diffs)) return null;
  if (!diffs || diffs.length === 0) return null;

  const adds = addedLines(expectedPrompt, actualPrompt);
  if (adds.length === 0) return null;

  // Heuristics for format drift: added “as JSON” / “JSON” is often the trigger.
  if (hasFormatOrParseDrift(diffs)) {
    const jsonish = adds.find((l) => l.toLowerCase().includes("as json")) ?? adds.find((l) => l.toLowerCase().includes("json"));
    if (jsonish) {
      return {
        message: `Likely cause: Added phrase '${jsonish}' changed output format`,
        highlightAddedLines: [jsonish],
      };
    }
  }

  // Fallback: first added line.
  const first = adds[0];
  return {
    message: `Likely cause: Added line '${first}' changed model behavior`,
    highlightAddedLines: [first],
  };
}

