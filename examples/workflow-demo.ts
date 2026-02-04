/**
 * Workflow demo: createDeterministicWorkflow with five deterministic steps.
 */

import { pathToFileURL } from "url";
import { createDeterministicWorkflow } from "../src/workflow/deterministic-workflow.js";

const steps = [
  {
    name: "validateInput",
    run: async () => ({ valid: true, schema: "v1" }),
  },
  {
    name: "normalize",
    run: async () => ({ normalized: true, format: "canonical" }),
  },
  {
    name: "plan",
    run: async () => ({ plan: "workflow-demo", steps: ["execute", "summarize"] }),
  },
  {
    name: "execute",
    run: async () => ({ executed: true, output: "done" }),
  },
  {
    name: "summarize",
    run: async () => ({ summary: "ok", status: "completed" }),
  },
];

async function runWorkflowDemo(): Promise<void> {
  const workflow = createDeterministicWorkflow({
    workflowId: "workflow-demo",
    taskId: "workflow-demo-task",
    steps,
  });

  const result = await workflow.run();

  console.log("runId:", result.runId);
  console.log("results:", JSON.stringify(result.stepResults, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWorkflowDemo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
