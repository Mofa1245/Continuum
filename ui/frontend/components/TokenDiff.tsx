import React from "react";

export type TokenSegment = {
  text: string;
  type: "same" | "added" | "removed" | "modified";
};

/**
 * Simple word-based LCS-like diff. Returns segments for expected (left) and actual (right)
 * so we can show side-by-side with removed/added/modified highlighting.
 */
function wordDiff(expected: string, actual: string): { left: TokenSegment[]; right: TokenSegment[] } {
  const a = expected.trim().split(/\s+/);
  const b = actual.trim().split(/\s+/);
  const n = a.length;
  const m = b.length;

  // dp[i][j] = length of LCS of a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const left: TokenSegment[] = [];
  const right: TokenSegment[] = [];
  let i = n;
  let j = m;
  const leftStack: TokenSegment[] = [];
  const rightStack: TokenSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      leftStack.push({ text: a[i - 1], type: "same" });
      rightStack.push({ text: b[j - 1], type: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rightStack.push({ text: b[j - 1], type: "added" });
      leftStack.push({ text: "", type: "removed" });
      j--;
    } else if (i > 0) {
      leftStack.push({ text: a[i - 1], type: "removed" });
      rightStack.push({ text: "", type: "added" });
      i--;
    }
  }

  const flush = (stack: TokenSegment[]) => {
    const out: TokenSegment[] = [];
    while (stack.length) out.push(stack.pop()!);
    return out;
  };
  const leftRaw = flush(leftStack);
  const rightRaw = flush(rightStack);
  const len = leftRaw.length;

  for (let k = 0; k < len; k++) {
    const l = leftRaw[k];
    const r = rightRaw[k];
    if (l && r && l.type === "removed" && r.type === "added" && l.text && r.text) {
      left.push({ text: l.text, type: "modified" });
      right.push({ text: r.text, type: "modified" });
    } else {
      if (l) left.push(l);
      if (r) right.push(r);
    }
  }

  return { left, right };
}

function segmentStyle(type: TokenSegment["type"]): React.CSSProperties {
  switch (type) {
    case "added":
      return { backgroundColor: "rgba(0, 200, 0, 0.25)" };
    case "removed":
      return { backgroundColor: "rgba(255, 0, 0, 0.2)" };
    case "modified":
      return { backgroundColor: "rgba(255, 255, 0, 0.4)" };
    default:
      return {};
  }
}

type Props = {
  expected_output: string;
  actual_output: string;
};

export default function TokenDiff({ expected_output, actual_output }: Props) {
  const { left, right } = wordDiff(
    expected_output ?? "",
    actual_output ?? ""
  );

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 45%", minWidth: 200 }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>Expected</strong>
          <div
            style={{
              padding: "0.5rem",
              fontFamily: "monospace",
              fontSize: "13px",
              border: "1px solid #ccc",
              borderRadius: 4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {left.map((seg, i) =>
              seg.text ? (
                <span key={i} style={segmentStyle(seg.type)}>
                  {seg.text}{" "}
                </span>
              ) : null
            )}
          </div>
        </div>
        <div style={{ flex: "1 1 45%", minWidth: 200 }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>Actual</strong>
          <div
            style={{
              padding: "0.5rem",
              fontFamily: "monospace",
              fontSize: "13px",
              border: "1px solid #ccc",
              borderRadius: 4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {right.map((seg, i) =>
              seg.text ? (
                <span key={i} style={segmentStyle(seg.type)}>
                  {seg.text}{" "}
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: "12px", color: "#666" }}>
        <span style={{ display: "inline-block", marginRight: "1rem" }}>
          <span style={{ backgroundColor: "rgba(255, 0, 0, 0.2)", padding: "0 4px" }}> Removed</span>
        </span>
        <span style={{ display: "inline-block", marginRight: "1rem" }}>
          <span style={{ backgroundColor: "rgba(0, 200, 0, 0.25)", padding: "0 4px" }}> Added</span>
        </span>
        <span style={{ display: "inline-block" }}>
          <span style={{ backgroundColor: "rgba(255, 255, 0, 0.4)", padding: "0 4px" }}> Modified</span>
        </span>
      </div>
    </div>
  );
}
