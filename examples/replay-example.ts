/**
 * Deterministic Replay Example
 * 
 * Demonstrates full replay with memory checkpoint/restore:
 * 1. Create agent run (checkpoint created automatically)
 * 2. Execute agent (memory changes)
 * 3. Replay run (memory restored from checkpoint)
 * 4. Compare outputs (detect divergence)
 * 
 * This is the killer capability.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { Resolver } from "../src/engine/resolver.js";
import { ReplayEngine } from "../src/engine/replay.js";
import { MinimalAgent } from "../src/agent/minimal-agent.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== Deterministic Replay Example ===\n");

  // Initialize Continuum
  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const resolver = new Resolver(memoryStore);
  const replayEngine = new ReplayEngine(runStore, memoryStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "api-service",
  };

  // Pre-populate memory
  console.log("1. Pre-populating memory...");
  await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "constraint",
    key: "security.no-new-deps",
    value: "Do not add new dependencies without security review",
    confidence: 0.9,
    source: "explicit",
  });

  await memoryStore.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "preference",
    key: "api.framework",
    value: "fastify",
    confidence: 0.95,
    source: "explicit",
  });

  console.log("   ✓ Memory populated\n");

  // Create and execute agent run
  console.log("2. Creating and executing agent run...");
  const agent = new MinimalAgent(memoryStore, runStore, resolver, identity);

  const originalResult = await agent.execute("Add authentication endpoint", {
    seed: 42,
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
  });

  console.log(`   ✓ Original run completed`);
  console.log(`   Success: ${originalResult.success}`);
  console.log(`   Steps: ${originalResult.steps}\n`);

  // Get the run
  const runs = await runStore.list({
    orgId: identity.orgId,
    limit: 1,
  });

  if (runs.length === 0) {
    console.error("No runs found!");
    return;
  }

  const originalRun = runs[0];
  console.log(`3. Original run details:`);
  console.log(`   Run ID: ${originalRun.runId}`);
  console.log(`   Checkpoint ID: ${originalRun.checkpointId || "none"}`);
  console.log(`   Memory snapshot start: ${originalRun.memorySnapshotStart.length} entries\n`);

  // Show memory after original run
  const memoryAfterOriginal = await memoryStore.read({
    orgId: identity.orgId,
  });
  console.log(`   Memory entries after original run: ${memoryAfterOriginal.length}\n`);

  // Add some memory that wasn't in the original run
  console.log("4. Adding new memory (simulating time passing)...");
  await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "preference",
    key: "new.memory",
    value: "This was added after the original run",
    confidence: 0.8,
    source: "explicit",
  });

  const memoryBeforeReplay = await memoryStore.read({
    orgId: identity.orgId,
  });
  console.log(`   Memory entries before replay: ${memoryBeforeReplay.length}\n`);

  // Replay the run
  console.log("5. Replaying original run...");
  console.log("   (Memory should be restored to checkpoint state)\n");

  try {
    const replayResult = await replayEngine.replay({
      runId: originalRun.runId,
      seed: 42, // Same seed for deterministic replay
    });

    console.log("6. Replay result:");
    console.log(`   Original run ID: ${replayResult.originalRunId}`);
    console.log(`   Replayed run ID: ${replayResult.replayedRunId}`);
    console.log(`   Matched: ${replayResult.matched}`);
    if (replayResult.divergenceStep) {
      console.log(`   Diverged at step: ${replayResult.divergenceStep}`);
    }

    // Show memory after replay
    const memoryAfterReplay = await memoryStore.read({
      orgId: identity.orgId,
    });
    console.log(`\n   Memory entries after replay: ${memoryAfterReplay.length}`);

    // Check if checkpoint was restored
    const newMemoryEntry = memoryAfterReplay.find(
      (e) => e.key === "new.memory"
    );
    if (newMemoryEntry) {
      console.log(
        `   ⚠️  New memory still present (checkpoint restore may not have removed it)`
      );
    } else {
      console.log(
        `   ✓ New memory removed (checkpoint restore worked correctly)`
      );
    }

    // Compare outputs
    console.log("\n7. Output comparison:");
    console.log(
      `   Original: ${JSON.stringify(replayResult.originalOutput, null, 2)}`
    );
    console.log(
      `   Replayed: ${JSON.stringify(replayResult.replayedOutput, null, 2)}`
    );

    if (replayResult.matched) {
      console.log("\n   ✓ Replay matched original output!");
    } else {
      console.log("\n   ⚠️  Replay diverged from original output");
    }
  } catch (error) {
    console.error(`   Error during replay: ${error}`);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
  }

  // Show checkpoints
  console.log("\n8. Available checkpoints:");
  const checkpoints = await memoryStore.listCheckpoints(identity.orgId);
  console.log(`   Total checkpoints: ${checkpoints.length}`);
  checkpoints.forEach((checkpoint, i) => {
    console.log(
      `   ${i + 1}. ${checkpoint.id} (${new Date(checkpoint.createdAt).toISOString()})`
    );
    if (checkpoint.description) {
      console.log(`      ${checkpoint.description}`);
    }
  });

  console.log("\n=== Example Complete ===");
  console.log("\nKey takeaways:");
  console.log("✓ Checkpoints capture exact memory state");
  console.log("✓ Replay restores memory from checkpoint");
  console.log("✓ Same input + same state = same output");
  console.log("✓ Divergence detection works");
}

main().catch(console.error);

