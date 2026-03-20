import React, { useMemo } from "react";

type LineOp = { kind: "same" | "removed" | "added"; text: string };

/**
 * Line-by-line diff (LCS). No external deps.
 */
function lineDiff(expected: string, actual: string): LineOp[] {
  const a = expected.split("\n");
  const b = actual.split("\n");
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out: LineOp[] = [];
  let i = n;
  let j = m;
  const stack: LineOp[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ kind: "same", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ kind: "added", text: b[j - 1] });
      j--;
    } else if (i > 0) {
      stack.push({ kind: "removed", text: a[i - 1] });
      i--;
    }
  }
  while (stack.length) out.push(stack.pop()!);
  return out;
}

type Props = {
  expectedPrompt: string;
  actualPrompt: string;
  highlightAddedLines?: string[];
};

export default function PromptDiff({ expectedPrompt, actualPrompt, highlightAddedLines }: Props) {
  const ops = useMemo(() => lineDiff(expectedPrompt, actualPrompt), [expectedPrompt, actualPrompt]);
  const highlightList = useMemo(
    () => (highlightAddedLines ?? []).map((s) => s.trim()).filter(Boolean),
    [highlightAddedLines]
  );

  const isHighlightedLine = (text: string) => {
    const t = String(text ?? "").trim();
    if (!t) return false;
    return highlightList.some((h) => h === t || t.includes(h) || h.includes(t));
  };

  return (
    <div
      style={{
        marginTop: "0.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
        fontFamily: "monospace",
        fontSize: 12,
        maxHeight: 320,
        overflowY: "auto",
      }}
    >
      {ops.map((op, idx) => {
        if (op.kind === "same") {
          return (
            <div key={idx} style={{ padding: "2px 8px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {op.text || " "}
            </div>
          );
        }
        if (op.kind === "removed") {
          return (
            <div
              key={idx}
              style={{
                padding: "2px 8px",
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              - {op.text}
            </div>
          );
        }
        const isHighlighted = op.kind === "added" && isHighlightedLine(op.text ?? "");

        return (
          <div
            key={idx}
            style={{
              padding: "2px 8px",
              backgroundColor: "rgba(34, 197, 94, 0.22)",
              outline: isHighlighted ? "2px solid rgba(245, 158, 11, 0.9)" : undefined,
              fontWeight: isHighlighted ? 800 : undefined,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            + {op.text}
          </div>
        );
      })}
    </div>
  );
}
