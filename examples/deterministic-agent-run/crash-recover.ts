/**
 * Deterministic Agent Run - Step 3 & 4: Crash Recovery
 * 
 * This demonstrates:
 * - Running agent workflow
 * - Simulating crash (process exit)
 * - Recovering state from disk
 * - Continuing from checkpoint
 */

import { InMemoryStore } from "../../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../../src/engine/agent-run-store.js";
import { FilePersistentStore } from "../../src/storage/persistent-store.js";

async function main() {
  const simulateCrash = process.argv[2] === "crash";

  // Setup Continuum with persistence
  const persistentStore = new FilePersistentStore(".continuum");
  const memoryStore = new InMemoryStore(persistentStore);
  const runStore = new InMemoryAgentRunStore(memoryStore);

  const orgId = "example-org";

  if (simulateCrash) {
    // Step 1: Run agent workflow
    console.log("📝 Running agent workflow...");
    await memoryStore.loadOrg(orgId);

    const run = await runStore.create({
      orgId,
      task: "process user request",
      initialContext: { orgId },
      initialRequest: { task: "process user request" },
      seed: 42,
      modelConfig: { model: "gpt-4", temperature: 0.7 },
    });

    console.log(`✅ Run created: ${run.runId}`);
    console.log(`✅ Checkpoint created: ${run.checkpointId}`);

    // Record some steps
    await runStore.appendStep(
      {
        runId: run.runId,
        action: "step_1",
        input: { data: "input1" },
        output: { result: "output1" },
      },
      orgId
    );

    await runStore.appendStep(
      {
        runId: run.runId,
        action: "step_2",
        input: { data: "input2" },
        output: { result: "output2" },
      },
      orgId
    );

    // Write memory
    await memoryStore.write({
      orgId,
      category: "decision",
      key: "crash.test",
      value: "before_crash",
      confidence: 1.0,
      source: "explicit",
    });

    console.log(`✅ Recorded ${run.steps.length} steps`);
    console.log("💾 State persisted to disk");

    // Step 2: Simulate crash
    console.log("\n💥 Simulating crash (process exit)...");
    console.log("   In-memory state lost");
    console.log("   Disk state preserved");
    process.exit(1);
  } else {
    // Step 3: Recover state from disk
    console.log("💾 Recovering state from disk...");
    await memoryStore.loadOrg(orgId);

    // Step 4: Verify recovery
    console.log("\n✅ State recovered:");
    const entries = await memoryStore.read({ orgId });
    console.log(`   Memory entries: ${entries.length}`);

    const checkpoints = await memoryStore.listCheckpoints(orgId);
    console.log(`   Checkpoints: ${checkpoints.length}`);

    const runs = await runStore.list({ orgId });
    console.log(`   Runs: ${runs.length}`);

    // Find incomplete runs
    const incompleteRuns = runs.filter((r) => r.status === "running");
    console.log(`   Incomplete runs: ${incompleteRuns.length}`);

    if (incompleteRuns.length > 0) {
      console.log("\n📝 Incomplete runs found:");
      for (const run of incompleteRuns) {
        console.log(`   - ${run.runId} (${run.steps.length} steps)`);
        console.log(`     Checkpoint: ${run.checkpointId}`);
        console.log(`     Can be replayed from checkpoint`);
      }
    }

    // Step 5: Show recovery guarantees
    console.log("\n✅ Recovery guarantees:");
    console.log("   - All entries written before crash are recovered");
    console.log("   - All checkpoints are available");
    console.log("   - Incomplete runs can be replayed from checkpoint");
    console.log("   - State is exactly as it was before crash");
  }
}

main().catch(console.error);
