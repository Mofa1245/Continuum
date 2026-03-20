import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Timeline from "../../components/Timeline";
import JsonViewer from "../../components/JsonViewer";
import TokenDiff from "../../components/TokenDiff";
import Link from "next/link";
import InlineJsonDiff from "../../components/InlineJsonDiff";
import DriftFocusPanel from "../../components/DriftFocusPanel";
import PromptDiff from "../../components/PromptDiff";
import { getSeverity } from "../../utils/driftSeverity";
import { getPromptChangeAttribution } from "../../utils/promptAttribution";

type TimelineEntry = { phase: string; status: string };
type DiffEntry = {
  path: string;
  expected: unknown;
  received: unknown;
  drift_type?: string;
  phase?: string;
};

const API = "http://localhost:8000";

function getPromptDiffStrings(
  expected: Record<string, unknown> | null,
  actual: Record<string, unknown> | null,
  diffs: DiffEntry[]
): { expectedPrompt: string; actualPrompt: string } | null {
  const row = diffs.find((d) => d.path === "llm_call.prompt");
  if (row && typeof row.expected === "string" && typeof row.received === "string") {
    return { expectedPrompt: row.expected, actualPrompt: row.received };
  }
  const e = expected?.llm_call as Record<string, unknown> | undefined;
  const a = actual?.llm_call as Record<string, unknown> | undefined;
  const ep = e?.prompt;
  const ap = a?.prompt;
  if (typeof ep === "string" && typeof ap === "string" && ep !== ap) {
    return { expectedPrompt: ep, actualPrompt: ap };
  }
  return null;
}

function getLlmCallStrings(
  expected: Record<string, unknown> | null,
  actual: Record<string, unknown> | null,
  diffs: DiffEntry[]
): { expected_output: string; actual_output: string } | null {
  const fromDiff = diffs.find(
    (d) => d.phase === "llm_call" && String(d.path || "").includes("rawText")
  );
  if (fromDiff && typeof fromDiff.expected === "string" && typeof fromDiff.received === "string") {
    return { expected_output: fromDiff.expected, actual_output: fromDiff.received };
  }
  const llmExpected = expected?.llm_call as Record<string, unknown> | undefined;
  const llmActual = actual?.llm_call as Record<string, unknown> | undefined;
  const expStr = typeof llmExpected?.rawText === "string" ? llmExpected.rawText : "";
  const actStr = typeof llmActual?.rawText === "string" ? llmActual.rawText : "";
  if (expStr || actStr) return { expected_output: expStr, actual_output: actStr };
  return null;
}

export default function RunDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
  const [expected, setExpected] = useState<Record<string, unknown> | null>(null);
  const [actual, setActual] = useState<Record<string, unknown> | null>(null);
  const [replayResult, setReplayResult] = useState<Record<string, unknown> | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [unstableFields, setUnstableFields] = useState<string[]>([]);
  const [pulse, setPulse] = useState(false);
  const driftFocusRef = React.useRef<HTMLDivElement | null>(null);

  const debugMode =
    router.query.debug === "1" || router.query.debug === "true";

  const hasLlmCallPhase = diffs.some((d) => d.phase === "llm_call");
  const promptPair = getPromptDiffStrings(expected, actual, diffs);
  const llmStrings = hasLlmCallPhase
    ? getLlmCallStrings(expected, actual, diffs)
    : null;

  const primaryDrift = (() => {
    const priority = (driftType: string | undefined) => {
      if (driftType === "type_drift") return 3;
      if (driftType === "format_drift") return 2;
      if (driftType === "value_drift") return 1;
      return 0;
    };
    const sorted = diffs
      .slice()
      .sort((a, b) => priority(b.drift_type) - priority(a.drift_type));
    return sorted[0] ?? null;
  })();

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    Promise.all([
      fetch(`${API}/runs/${id}`).then((r) => r.json()),
      fetch(`${API}/runs/${id}/timeline`).then((r) => r.json()),
      fetch(`${API}/runs/${id}/diff`).then((r) => r.json()),
      fetch(`${API}/runs/${id}/expected`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/runs/${id}/actual`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/runs/drift-patterns`).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([meta, tl, diff, exp, act, patterns]) => {
        setMetadata(meta);
        setTimeline(Array.isArray(tl) ? tl : []);
        setDiffs(Array.isArray(diff) ? diff : []);
        setExpected(exp && typeof exp === "object" ? exp : null);
        setActual(act && typeof act === "object" ? act : null);
        const unstable = (patterns && typeof patterns === "object" ? (patterns as any).unstable_fields : null) as unknown;
        setUnstableFields(Array.isArray(unstable) ? unstable.map(String) : []);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!debugMode) return;
    // Wait until DriftFocusPanel is likely mounted (after diffs load).
    const t = window.setTimeout(() => {
      driftFocusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 1500);
    }, 250);
    return () => window.clearTimeout(t);
  }, [debugMode, primaryDrift, diffs]);

  async function onReplay() {
    if (!id || typeof id !== "string") return;
    setReplaying(true);
    setReplayResult(null);
    try {
      const res = await fetch(`${API}/runs/${id}/replay`, { method: "POST" });
      const data = await res.json();
      setReplayResult(data);
      if (Array.isArray(data.diffs)) setDiffs(data.diffs);
      if (data.run_id) {
        const [metaRes, tlRes, diffRes, expRes, actRes] = await Promise.all([
          fetch(`${API}/runs/${id}`).then((r) => r.json()),
          fetch(`${API}/runs/${id}/timeline`).then((r) => r.json()),
          fetch(`${API}/runs/${id}/diff`).then((r) => r.json()),
          fetch(`${API}/runs/${id}/expected`).then((r) => r.json()).catch(() => ({})),
          fetch(`${API}/runs/${id}/actual`).then((r) => r.json()).catch(() => ({})),
        ]);
        setMetadata(await metaRes);
        setTimeline(Array.isArray(await tlRes) ? await tlRes : []);
        setDiffs(Array.isArray(await diffRes) ? await diffRes : []);
        setExpected(expRes && typeof expRes === "object" ? expRes : null);
        setActual(actRes && typeof actRes === "object" ? actRes : null);
      }
    } finally {
      setReplaying(false);
    }
  }

  async function onPromote() {
    if (!id || typeof id !== "string") return;
    setPromoting(true);
    try {
      const res = await fetch(`${API}/runs/${id}/promote`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const [metaRes, tlRes, diffRes, expRes, actRes] = await Promise.all([
        fetch(`${API}/runs/${id}`).then((r) => r.json()),
        fetch(`${API}/runs/${id}/timeline`).then((r) => r.json()),
        fetch(`${API}/runs/${id}/diff`).then((r) => r.json()),
        fetch(`${API}/runs/${id}/expected`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API}/runs/${id}/actual`).then((r) => r.json()).catch(() => ({})),
      ]);
      setMetadata(await metaRes);
      setTimeline(Array.isArray(await tlRes) ? await tlRes : []);
      setDiffs(Array.isArray(await diffRes) ? await diffRes : []);
      setExpected(expRes && typeof expRes === "object" ? expRes : null);
      setActual(actRes && typeof actRes === "object" ? actRes : null);
    } catch (e) {
      console.error(e);
    } finally {
      setPromoting(false);
    }
  }

  if (!id) return <p>Loading…</p>;

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <p><Link href="/" style={{ color: "#0066cc" }}>← Dashboard</Link></p>
      <h1>Run {id}</h1>
      {metadata && <p><strong>Status:</strong> {String(metadata.status)}</p>}

      {primaryDrift && (
        (() => {
          const driftType = primaryDrift.drift_type ?? "value_drift";
          const { label, color } = getSeverity(driftType);
          const bg = `${color}22`;
          return (
            <div
              style={{
                marginTop: "1rem",
                border: `1px solid ${color}`,
                borderRadius: 8,
                backgroundColor: bg,
                padding: "0.75rem 1rem",
                fontFamily: "system-ui",
              }}
            >
              <strong>{label.toUpperCase()} DRIFT</strong> detected in{" "}
              <span style={{ fontFamily: "monospace" }}>{primaryDrift.path}</span>
            </div>
          );
        })()
      )}

      <h2>Timeline</h2>
      <Timeline diffs={diffs} />

      {promptPair && (
        <>
          <h2 style={{ marginTop: "1.5rem" }}>Prompt Change</h2>
          {(() => {
            const attr = getPromptChangeAttribution(promptPair.expectedPrompt, promptPair.actualPrompt, diffs);
            return (
              <PromptDiff
                expectedPrompt={promptPair.expectedPrompt}
                actualPrompt={promptPair.actualPrompt}
                highlightAddedLines={attr?.highlightAddedLines}
              />
            );
          })()}
        </>
      )}

      {hasLlmCallPhase && llmStrings && (
        <>
          <h2 style={{ marginTop: "1.5rem" }}>LLM output (token diff)</h2>
          <TokenDiff
            expected_output={llmStrings.expected_output}
            actual_output={llmStrings.actual_output}
          />
        </>
      )}

      {primaryDrift && (
        <div ref={driftFocusRef}>
          <DriftFocusPanel
            diffs={diffs}
            expectedPrompt={promptPair?.expectedPrompt ?? null}
            actualPrompt={promptPair?.actualPrompt ?? null}
            unstableFields={unstableFields}
            highlight={pulse}
          />
        </div>
      )}

      <h2>Drift</h2>
      <InlineJsonDiff expected={expected ?? {}} actual={actual ?? {}} diffs={diffs} />

      <p style={{ marginTop: "1rem" }}>
        <button
          onClick={onReplay}
          disabled={replaying || promoting}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem", cursor: replaying ? "wait" : "pointer" }}
        >
          {replaying ? "Replaying…" : "Replay Run"}
        </button>
        <button
          onClick={onPromote}
          disabled={replaying || promoting}
          style={{ padding: "0.5rem 1rem", cursor: promoting ? "wait" : "pointer" }}
        >
          {promoting ? "Promoting…" : "Promote to Baseline"}
        </button>
      </p>

      {replayResult && (
        <>
          <h3>Replay Result</h3>
          <JsonViewer data={replayResult} />
        </>
      )}

      <h2>Raw JSON</h2>
      <JsonViewer data={{ metadata, timeline, diffs }} />
    </main>
  );
}
