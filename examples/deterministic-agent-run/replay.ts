/**
 * Deterministic Agent Run - Step 5: Replay Deterministically
 * 
 * This demonstrates:
 * - Loading state from disk
 * - Restoring memory checkpoint
 * - Replaying agent steps
 * - Detecting divergence
 */

import { InMemoryStore } from "../../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../../src/engine/agent-run-store.js";
import { ReplayEngine } from "../../src/engine/replay.js";
import { FilePersistentStore } from "../../src/storage/persistent-store.js";

async function main() {
  const runId = process.argv[2];

  if (!runId) {
    console.error("Usage: npx tsx examples/deterministic-agent-run/replay.ts <runId>");
    process.exit(1);
  }

  // Setup Continuum with persistence
  const persistentStore = new FilePersistentStore(".continuum");
  const memoryStore = new InMemoryStore(persistentStore);
  const runStore = new InMemoryAgentRunStore(memoryStore);

  const orgId = "example-org";

  // Load org state from disk
  console.log("💾 Loading state from disk...");
  await memoryStore.loadOrg(orgId);

  // Get original run
  const originalRun = await runStore.get(runId, orgId);
  if (!originalRun) {
    console.error(`❌ Run not found: ${runId}`);
    process.exit(1);
  }

  console.log(`✅ Original run loaded: ${runId}`);
  console.log(`   Steps: ${originalRun.steps.length}`);
  console.log(`   Checkpoint: ${originalRun.checkpointId}`);

  // Step 1: Replay deterministically
  console.log("\n🔄 Replaying run deterministically...");
  const replayEngine = new ReplayEngine(runStore, memoryStore);

  const replayResult = await replayEngine.replay({
    runId,
    seed: originalRun.seed, // Same seed
    modelConfig: originalRun.modelConfig, // Same config
  });

  // Step 2: Check if replay matched
  console.log("\n📊 Replay results:");
  console.log(`   Matched: ${replayResult.matched ? "✅ Yes" : "❌ No"}`);

  if (replayResult.matched) {
    console.log("✅ Replay matched original run perfectly!");
    console.log("   This means:");
    console.log("   - Same memory state (checkpoint restored)");
    console.log("   - Same inputs (deterministic)");
    console.log("   - Same outputs (deterministic)");
  } else {
    console.log(`❌ Divergence detected at step ${replayResult.divergenceStep}`);
    console.log("   This means:");
    console.log("   - Memory state matched (checkpoint restored)");
    console.log("   - Inputs matched (deterministic)");
    console.log("   - Outputs differed (nondeterminism detected)");
    console.log(`\n   Original output: ${JSON.stringify(replayResult.originalOutput)}`);
    console.log(`   Replayed output: ${JSON.stringify(replayResult.replayedOutput)}`);
  }

  // Step 3: Show replay details
  const replayedRun = await runStore.get(replayResult.replayedRunId, orgId);
  if (replayedRun) {
    console.log(`\n📝 Replayed run: ${replayedRun.runId}`);
    console.log(`   Steps: ${replayedRun.steps.length}`);
    console.log(`   Status: ${replayedRun.status}`);
  }
}

main().catch(console.error);
