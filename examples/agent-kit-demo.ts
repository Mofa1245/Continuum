/**
 * Simplest runnable example using createDeterministicAgentKit.
 * Goal: understand Continuum in under 2 minutes.
 */

import { pathToFileURL } from "url";
import { createDeterministicAgentKit } from "../src/agent/agent-kit.js";
import type { DeterministicPhase } from "../src/agent/deterministic-runner.js";

const phases: DeterministicPhase[] = [
  {
    name: "plan",
    execute: async () => {
      console.log("[phase] plan start");
      const out = { plan: "kit-demo", steps: ["gather", "decide", "produce"] };
      console.log("[phase] plan done");
      return out;
    },
  },
  {
    name: "gatherContext",
    execute: async () => {
      console.log("[phase] gatherContext start");
      const out = { constraints: ["deterministic"], prefs: ["no external calls"] };
      console.log("[phase] gatherContext done");
      return out;
    },
  },
  {
    name: "decideAction",
    execute: async () => {
      console.log("[phase] decideAction start");
      const out = { action: "execute_plan", reason: "deterministic flow" };
      console.log("[phase] decideAction done");
      return out;
    },
  },
  {
    name: "produceResult",
    execute: async () => {
      console.log("[phase] produceResult start");
      const out = { result: "ok", status: "completed" };
      console.log("[phase] produceResult done");
      return out;
    },
  },
];

export async function runAgentKitDemo(): Promise<void> {
  const kit = createDeterministicAgentKit({
    agentId: "kit-demo-agent",
    taskId: "kit-demo-task",
    phases,
  });

  const result = await kit.run();

  console.log("runId:", result.runId);
  console.log("phaseResults:", JSON.stringify(result.phaseResults, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAgentKitDemo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
