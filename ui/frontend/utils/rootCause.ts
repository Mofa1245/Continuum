/**
 * Rule-based root cause from diff.json (no AI).
 */

export type DiffLike = {
  path?: string;
  phase?: string;
};

function pathMatches(d: DiffLike, exact: string): boolean {
  return String(d.path ?? "") === exact;
}

function hasPhaseDiff(diffs: DiffLike[], phase: string): boolean {
  return diffs.some((d) => d.phase === phase || String(d.path ?? "").startsWith(`${phase}.`));
}

function onlyPhaseDiffs(diffs: DiffLike[], phase: string): boolean {
  if (diffs.length === 0) return false;
  return diffs.every((d) => d.phase === phase || String(d.path ?? "").startsWith(`${phase}.`));
}

function hasPromptChange(diffs: DiffLike[]): boolean {
  return diffs.some((d) => pathMatches(d, "llm_call.prompt"));
}

function hasRawTextChange(diffs: DiffLike[]): boolean {
  return diffs.some((d) => pathMatches(d, "llm_call.rawText"));
}

function hasJsonParseChange(diffs: DiffLike[]): boolean {
  return hasPhaseDiff(diffs, "json_parse");
}

/**
 * Explains WHY drift likely happened from diff paths.
 */
export function getRootCauseFromDiffs(diffs: DiffLike[]): {
  summary: string;
  chain: string;
} {
  if (!diffs.length) {
    return { summary: "No drift entries.", chain: "—" };
  }

  const prompt = hasPromptChange(diffs);
  const raw = hasRawTextChange(diffs);
  const parse = hasJsonParseChange(diffs);

  if (prompt && raw && parse) {
    return {
      summary: "Prompt change caused LLM output format drift",
      chain: "Prompt changed → output format changed → parsing drift",
    };
  }

  if (onlyPhaseDiffs(diffs, "json_parse")) {
    return {
      summary: "Parsing inconsistency",
      chain: "Parsing drift only (upstream LLM output matched or unchanged in diff set)",
    };
  }

  if (!prompt && raw) {
    return {
      summary: "LLM output variation",
      chain: "Same prompt context in diff; raw model output changed",
    };
  }

  if (!prompt && !raw && parse) {
    return {
      summary: "Parsing inconsistency",
      chain: "Structured parse output differs without prompt/rawText in this diff",
    };
  }

  return {
    summary: "Multiple contributing changes",
    chain: "Review diff paths across phases to isolate the trigger",
  };
}
