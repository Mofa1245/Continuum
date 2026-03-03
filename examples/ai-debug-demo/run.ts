/**
 * AI Debug Demo — multi-step agent: LLM → tool → LLM post-process → memory write.
 * Run once, replay, show identical output. Then show replay diff and invariant validator.
 * Runs are persisted to ./runs when run via this script or continuum demo.
 *
 * Run: npx tsx examples/ai-debug-demo/run.ts
 * Optional: npx tsx examples/ai-debug-demo/run.ts --divergence   (phrase drift)
 * Optional: npx tsx examples/ai-debug-demo/run.ts --json-drift   (missing JSON field — realistic AI failure)
 */

import { pathToFileURL } from "url";
import { runDemoAgent } from "../../src/cli/demo-agent-command.js";
import { FileRunStore } from "../../src/storage/RunStore.js";

const runStore = new FileRunStore("runs");

async function runDemo(): Promise<void> {
  await runDemoAgent(process.argv.slice(2), runStore);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { runDemo };
