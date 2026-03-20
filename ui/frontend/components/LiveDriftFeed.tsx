import React, { useEffect, useMemo, useRef, useState } from "react";

type RunRow = {
  id: string;
  status: string;
  driftType?: string | null;
  driftPhase?: string | null;
};

type FeedEvent = {
  id: string;
  kind: "drift" | "verified";
  message: string;
  ts: number;
};

const API = "http://localhost:8000";

function secondsAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  return `${s}s ago`;
}

async function fetchDiffFirstPath(runId: string): Promise<{ path?: string; driftType?: string } | null> {
  try {
    const diffsRes = await fetch(`${API}/runs/${runId}/diff`);
    const diffs = await diffsRes.json();
    if (!Array.isArray(diffs)) return null;
    const first = diffs.find((d: any) => d && typeof d === "object" && d.path);
    if (!first) return null;
    return { path: first.path, driftType: first.drift_type };
  } catch {
    return null;
  }
}

export default function LiveDriftFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const lastSeen = useRef<Map<string, { status: string; driftType?: string | null; driftPhase?: string | null }>>(
    new Map()
  );
  const reported = useRef<Set<string>>(new Set());

  const pollMs = 2500;

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      let runs: RunRow[] = [];
      try {
        const res = await fetch(`${API}/runs`);
        const data = await res.json();
        runs = Array.isArray(data) ? data : [];
      } catch {
        return;
      }

      const now = Date.now();

      for (const r of runs) {
        const prev = lastSeen.current.get(r.id);
        const hasPrev = !!prev;

        const statusChanged = prev && prev.status !== r.status;
        const driftMetaChanged =
          prev &&
          (prev.driftType !== r.driftType || prev.driftPhase !== r.driftPhase);

        const isNewRun = !hasPrev;
        const becameDrift = prev && prev.status === "verified" && r.status === "drift";
        const driftButMetadataChanged = prev && prev.status === "drift" && driftMetaChanged;

        if (!isNewRun && !statusChanged && !driftMetaChanged && !(becameDrift || driftButMetadataChanged)) {
          continue;
        }

        // Build a stable event dedupe key.
        const keyBase = `${r.id}:${r.status}:${r.driftType ?? ""}:${r.driftPhase ?? ""}`;

        if (isNewRun) {
          if (r.status === "drift") {
            // Need diff.json to display a path.
            const diffInfo = await fetchDiffFirstPath(r.id);
            const path = diffInfo?.path ?? r.driftPhase ?? "unknown";
            const driftType = diffInfo?.driftType ?? r.driftType ?? "drift";
            const ev: FeedEvent = {
              id: keyBase,
              kind: "drift",
              message: `🔴 Drift detected — ${path}`,
              ts: now,
            };
            if (!reported.current.has(ev.id)) {
              reported.current.add(ev.id);
              setEvents((cur) => [ev, ...cur].slice(0, 10));
            }
          } else {
            const ev: FeedEvent = {
              id: keyBase,
              kind: "verified",
              message: `🟢 Run verified — ${r.id}`,
              ts: now,
            };
            if (!reported.current.has(ev.id)) {
              reported.current.add(ev.id);
              setEvents((cur) => [ev, ...cur].slice(0, 10));
            }
          }
        } else if (becameDrift) {
          const diffInfo = await fetchDiffFirstPath(r.id);
          const path = diffInfo?.path ?? r.driftPhase ?? "unknown";
          const ev: FeedEvent = {
            id: keyBase,
            kind: "drift",
            message: `🔴 Drift detected — ${path}`,
            ts: now,
          };
          if (!reported.current.has(ev.id)) {
            reported.current.add(ev.id);
            setEvents((cur) => [ev, ...cur].slice(0, 10));
          }
        } else if (driftButMetadataChanged) {
          const diffInfo = await fetchDiffFirstPath(r.id);
          const path = diffInfo?.path ?? r.driftPhase ?? "unknown";
          const ev: FeedEvent = {
            id: keyBase,
            kind: "drift",
            message: `🔴 Drift detected — ${path}`,
            ts: now,
          };
          if (!reported.current.has(ev.id)) {
            reported.current.add(ev.id);
            setEvents((cur) => [ev, ...cur].slice(0, 10));
          }
        }

        lastSeen.current.set(r.id, {
          status: r.status,
          driftType: r.driftType,
          driftPhase: r.driftPhase,
        });
      }
    }

    // Prime state.
    tick().catch(() => {});

    const t = window.setInterval(() => {
      tick().catch(() => {});
    }, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  const rendered = useMemo(() => {
    return events
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .map((e) => ({
        ...e,
        timeText: secondsAgo(e.ts),
      }));
  }, [events]);

  if (rendered.length === 0) {
    return <p style={{ color: "#6b7280", marginTop: 0 }}>No live activity yet.</p>;
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {rendered.map((e) => (
        <div key={e.id} style={{ padding: "0.35rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <span style={{ fontWeight: 650 }}>{e.message}</span>{" "}
          <span style={{ color: "#6b7280", fontSize: 12 }}>({e.timeText})</span>
        </div>
      ))}
    </div>
  );
}

