import React, { useMemo, useState } from "react";
import { getSeverity } from "../utils/driftSeverity";
import { getDriftImpact } from "../utils/driftImpact";

type DiffEntry = {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type?: string;
  phase?: string;
};

type Props = {
  expected: any;
  actual: any;
  diffs: DiffEntry[];
};

type TrieNode = {
  children: Map<string, TrieNode>;
  diffsAtNode: DiffEntry[];
};

function normalizeMissing(v: unknown): unknown {
  // Some backends serialize missing values as the string "undefined".
  if (v === "undefined") return undefined;
  return v;
}

function fmtValue(v: unknown): string {
  v = normalizeMissing(v);
  if (v === undefined) return "undefined";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function tryToNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function classifyDriftTypeFromValues(expected: unknown, received: unknown): string {
  expected = normalizeMissing(expected);
  received = normalizeMissing(received);

  if (expected === undefined && received !== undefined) return "value_drift";
  if (received === undefined && expected !== undefined) return "value_drift";

  const expT = typeof expected;
  const recT = typeof received;

  // Number vs numeric string, treat as format_drift if semantic value matches.
  const expN = tryToNumber(expected);
  const recN = tryToNumber(received);
  if (expN !== null && recN !== null && expN === recN) {
    if (expT !== recT) return "format_drift";
    return expected === received ? "value_drift" : "format_drift";
  }

  if (expT !== recT) return "type_drift";
  if (expected !== received) return "value_drift";
  return "value_drift";
}

function badgeLabelAndColor(driftType: string): { label: string; color: string } {
  switch (driftType) {
    case "type_drift": {
      const { color } = getSeverity(driftType);
      return { label: "[TYPE DRIFT]", color };
    }
    case "format_drift": {
      const { color } = getSeverity(driftType);
      return { label: "[FORMAT DRIFT]", color };
    }
    case "value_drift": {
      const { color } = getSeverity(driftType);
      return { label: "[VALUE DRIFT]", color };
    }
    default: {
      const { color } = getSeverity(driftType);
      return { label: "[VALUE DRIFT]", color };
    }
  }
}

function changeStyle(d: DiffEntry): {
  expectedBg: string;
  receivedBg: string;
  arrow: string;
} {
  const expected = normalizeMissing(d.expected);
  const received = normalizeMissing(d.received);

  // Added/removed based on undefined (diff.json uses undefined for missing keys).
  const isAdded = expected === undefined && received !== undefined;
  const isRemoved = received === undefined && expected !== undefined;

  if (isAdded) {
    return { expectedBg: "transparent", receivedBg: "#22c55e33", arrow: "→" };
  }
  if (isRemoved) {
    return { expectedBg: "#ef444433", receivedBg: "#ef444433", arrow: "→" };
  }
  // Modified
  return { expectedBg: "#f59e0b33", receivedBg: "#f59e0b33", arrow: "→" };
}

function buildTrie(diffs: DiffEntry[]): TrieNode {
  const root: TrieNode = { children: new Map(), diffsAtNode: [] };

  for (const d of diffs) {
    const path = d.path ?? "";
    if (!path) continue;
    const segs = path.split(".").filter(Boolean);
    let node = root;
    for (const seg of segs) {
      if (!node.children.has(seg)) node.children.set(seg, { children: new Map(), diffsAtNode: [] });
      node = node.children.get(seg)!;
    }
    node.diffsAtNode.push(d);
  }

  return root;
}

function collectExpandableNodes(root: TrieNode): Set<string> {
  const expanded = new Set<string>();
  function walk(node: TrieNode, prefix: string) {
    if (node.children.size > 0) expanded.add(prefix);
    for (const [seg, child] of node.children.entries()) {
      const p = prefix ? `${prefix}.${seg}` : seg;
      walk(child, p);
    }
  }
  walk(root, "");
  return expanded;
}

function NodeLine({
  indent,
  children,
}: {
  indent: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingLeft: indent, lineHeight: "1.45", fontFamily: "monospace", fontSize: 12 }}>
      {children}
    </div>
  );
}

function LeafDiffLine({ d, fullPath, keyName, indent }: { d: DiffEntry; fullPath: string; keyName: string; indent: number }) {
  const driftType = d.drift_type ?? classifyDriftTypeFromValues(d.expected, d.received);
  const { label, color } = badgeLabelAndColor(driftType);
  const { expectedBg, receivedBg } = changeStyle(d);
  const impact = getDriftImpact(driftType);

  return (
    <div style={{ marginBottom: "0.35rem" }}>
      <NodeLine indent={indent}>
        <span style={{ color: "#111827" }}>{JSON.stringify(keyName)} </span>
        <span style={{ color: "#6b7280" }}>({fullPath}) </span>
        <span
          style={{
            display: "inline-block",
            marginRight: 8,
            fontWeight: 800,
            padding: "0.1rem 0.4rem",
            borderRadius: 999,
            border: `1px solid ${color}`,
            color,
            backgroundColor: "#fff",
          }}
        >
          {label}
        </span>
        <span style={{ backgroundColor: expectedBg, borderRadius: 4, padding: "0 4px" }}>
          {fmtValue(d.expected)}
        </span>
        <span style={{ margin: "0 6px", color: "#6b7280" }}>→</span>
        <span style={{ backgroundColor: receivedBg, borderRadius: 4, padding: "0 4px" }}>
          {fmtValue(d.received)}
        </span>
      </NodeLine>
      <NodeLine indent={indent + 8}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{impact}</span>
      </NodeLine>
    </div>
  );
}

function RenderNode({
  node,
  keyName,
  fullPath,
  expectedValue,
  actualValue,
  depth,
  expanded,
  setExpanded,
}: {
  node: TrieNode;
  keyName: string | null; // null for root
  fullPath: string; // full path for this node (dot-joined)
  expectedValue: any;
  actualValue: any;
  depth: number;
  expanded: Set<string>;
  setExpanded: (next: Set<string>) => void;
}) {
  const hasChildren = node.children.size > 0;
  const hasLeafDiffs = node.diffsAtNode.length > 0;

  if (!hasChildren && hasLeafDiffs && keyName != null) {
    // Leaf node.
    const d = node.diffsAtNode[0];
    return (
      <LeafDiffLine d={d} fullPath={fullPath} keyName={keyName} indent={depth * 16} />
    );
  }

  const isExpanded = expanded.has(fullPath);
  const indent = depth * 16;

  if (keyName === null) {
    // Root.
    return (
      <>
        <NodeLine indent={indent}>{`{`}</NodeLine>
        {isExpanded && (
          <>
            {[...node.children.entries()].map(([seg, child]) => {
              const expChild = expectedValue?.[seg];
              const actChild = actualValue?.[seg];
              const childPath = fullPath ? `${fullPath}.${seg}` : seg;
              return (
                <RenderNode
                  key={childPath}
                  node={child}
                  keyName={seg}
                  fullPath={childPath}
                  expectedValue={expChild}
                  actualValue={actChild}
                  depth={depth + 1}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              );
            })}
          </>
        )}
        <NodeLine indent={indent}>{`}`}</NodeLine>
      </>
    );
  }

  // Object-ish node containing children and/or diffs.
  const toggle = () => {
    const next = new Set(expanded);
    if (next.has(fullPath)) next.delete(fullPath);
    else next.add(fullPath);
    setExpanded(next);
  };

  return (
    <>
      <NodeLine indent={indent}>
        <button
          onClick={toggle}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            fontFamily: "monospace",
            color: "#111827",
          }}
          aria-label={`Toggle ${fullPath}`}
          title="Collapse/expand"
        >
          {isExpanded ? "▾" : "▸"} {JSON.stringify(keyName)}: {isExpanded ? "{" : "{…}"}
        </button>
      </NodeLine>
      {isExpanded && (
        <>
          {hasLeafDiffs && (
            <>
              {node.diffsAtNode.map((d, i) => (
                <LeafDiffLine
                  key={`${fullPath}-${i}`}
                  d={d}
                  fullPath={fullPath}
                  keyName={keyName}
                  indent={indent + 16}
                />
              ))}
            </>
          )}
          {[...node.children.entries()].map(([seg, child]) => {
            const expChild = expectedValue?.[seg];
            const actChild = actualValue?.[seg];
            const childPath = fullPath ? `${fullPath}.${seg}` : seg;
            return (
              <RenderNode
                key={childPath}
                node={child}
                keyName={seg}
                fullPath={childPath}
                expectedValue={expChild}
                actualValue={actChild}
                depth={depth + 1}
                expanded={expanded}
                setExpanded={setExpanded}
              />
            );
          })}
          <NodeLine indent={indent}>{`}`}</NodeLine>
        </>
      )}
    </>
  );
}

export default function InlineJsonDiff({ expected, actual, diffs }: Props) {
  const trieRoot = useMemo(() => buildTrie(diffs ?? []), [diffs]);
  const initialExpanded = useMemo(() => collectExpandableNodes(trieRoot), [trieRoot]);

  const [expanded, setExpanded] = useState<Set<string>>(() => initialExpanded);

  // If diffs change, reset expansion.
  React.useEffect(() => {
    setExpanded(initialExpanded);
  }, [initialExpanded]);

  if (!diffs || diffs.length === 0) {
    return <p style={{ fontFamily: "system-ui", marginTop: "0.5rem" }}>No drift detected.</p>;
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ marginBottom: "0.25rem", color: "#6b7280", fontSize: 12 }}>
        Showing only changed paths.
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.75rem", overflowX: "auto" }}>
        <RenderNode
          node={trieRoot}
          keyName={null}
          fullPath=""
          expectedValue={expected}
          actualValue={actual}
          depth={0}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>
    </div>
  );
}

