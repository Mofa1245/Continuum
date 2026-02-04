/**
 * Runner demo: use runDeterministicAgent with four deterministic phases.
 * Example only — no engine or core changes.
 */

import { pathToFileURL } from "url";
import { runDeterministicAgent } from "../src/agent/deterministic-runner.js";
import type { DeterministicPhase } from "../src/agent/deterministic-runner.js";
import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";

const phases: DeterministicPhase[] = [
  {
    name: "plan",
    execute: async () => {
      console.log("[phase] plan: starting");
      const result = { plan: "runner-demo", steps: ["gather", "decide", "produce"] };
      console.log("[phase] plan: done");
      return result;
    },
  },
  {
    name: "gatherContext",
    execute: async () => {
      console.log("[phase] gatherContext: starting");
      const result = { constraints: ["deterministic"], preferences: ["no external calls"] };
      console.log("[phase] gatherContext: done");
      return result;
    },
  },
  {
    name: "decideAction",
    execute: async () => {
      console.log("[phase] decideAction: starting");
      const result = { action: "execute_plan", reason: "deterministic flow" };
      console.log("[phase] decideAction: done");
      return result;
    },
  },
  {
    name: "produceResult",
    execute: async () => {
      console.log("[phase] produceResult: starting");
      const result = { result: "ok", status: "completed" };
      console.log("[phase] produceResult: done");
      return result;
    },
  },
];

export async function runRunnerDemo(): Promise<void> {
  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  const result = await runDeterministicAgent({
    agentId: "runner-demo",
    taskId: "runner-demo-task",
    phases,
    store,
    agentRunStore,
  });

  console.log("runId:", result.runId);
  console.log("phaseResults:", JSON.stringify(result.phaseResults, null, 2));
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  runRunnerDemo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
