/**
 * Deterministic Agent Run - Step 1: Run Agent Workflow
 * 
 * This demonstrates:
 * - Creating an agent run (with automatic checkpoint)
 * - Recording agent steps
 * - Writing memory entries
 * - Persisting state to disk
 */

import { InMemoryStore } from "../../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../../src/engine/agent-run-store.js";
import { FilePersistentStore } from "../../src/storage/persistent-store.js";

async function main() {
  // Setup Continuum with persistence
  const persistentStore = new FilePersistentStore(".continuum");
  const memoryStore = new InMemoryStore(persistentStore);
  const runStore = new InMemoryAgentRunStore(memoryStore);

  const orgId = "example-org";

  // Load org state (if exists)
  await memoryStore.loadOrg(orgId);

  // Step 1: Create agent run (automatically creates checkpoint)
  console.log("📝 Creating agent run...");
  const run = await runStore.create({
    orgId,
    task: "analyze user feedback",
    initialContext: { orgId },
    initialRequest: { task: "analyze user feedback" },
    seed: 42, // Deterministic seed
    modelConfig: { model: "gpt-4", temperature: 0.7 },
  });

  console.log(`✅ Run created: ${run.runId}`);
  console.log(`✅ Checkpoint created: ${run.checkpointId}`);

  // Step 2: Record agent steps
  console.log("\n📝 Recording agent steps...");

  await runStore.appendStep(
    {
      runId: run.runId,
      action: "analyze_feedback",
      input: { feedback: "Great product! Very satisfied." },
      output: { sentiment: "positive", score: 0.9 },
    },
    orgId
  );

  await runStore.appendStep(
    {
      runId: run.runId,
      action: "extract_keywords",
      input: { feedback: "Great product! Very satisfied." },
      output: { keywords: ["great", "satisfied", "product"] },
    },
    orgId
  );

  console.log(`✅ Recorded ${run.steps.length} steps`);

  // Step 3: Write memory entries
  console.log("\n📝 Writing memory entries...");

  const memory1 = await memoryStore.write({
    orgId,
    category: "decision",
    key: "user.sentiment",
    value: "positive",
    confidence: 0.9,
    source: "observed",
  });

  const memory2 = await memoryStore.write({
    orgId,
    category: "preference",
    key: "user.feedback_style",
    value: "concise",
    confidence: 0.8,
    source: "observed",
  });

  console.log(`✅ Wrote memory entries: ${memory1.id}, ${memory2.id}`);

  // Step 4: Complete run
  console.log("\n📝 Completing run...");
  const completedRun = await runStore.updateStatus(
    run.runId,
    orgId,
    "completed",
    { analysis: "User feedback is positive" }
  );

  console.log(`✅ Run completed: ${completedRun.runId}`);
  console.log(`✅ Final output: ${JSON.stringify(completedRun.finalOutput)}`);

  // Step 5: Show persisted state
  console.log("\n💾 State persisted to disk:");
  console.log(`- Memory entries: ${(await memoryStore.read({ orgId })).length}`);
  console.log(`- Checkpoints: ${(await memoryStore.listCheckpoints(orgId)).length}`);
  console.log(`- Runs: ${(await runStore.list({ orgId })).length}`);

  console.log("\n✅ Agent run complete. State persisted to disk.");
  console.log(`\nTo replay this run, use: npx tsx examples/deterministic-agent-run/replay.ts ${run.runId}`);
}

main().catch(console.error);
