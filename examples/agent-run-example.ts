/**
 * AgentRun Example
 * 
 * Demonstrates:
 * 1. Creating an AgentRun
 * 2. Appending steps during execution
 * 3. How AgentRun maps to MemoryEntry (kernel integration)
 * 4. Replay capability
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { ReplayEngine } from "../src/engine/replay.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== AgentRun Example ===\n");

  // Initialize stores
  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const replayEngine = new ReplayEngine(runStore, memoryStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "agent-service",
  };

  // Create an agent run
  console.log("1. Creating AgentRun...");
  const run = await runStore.create({
    orgId: identity.orgId,
    task: "Write a function to calculate fibonacci numbers",
    initialContext: identity,
    initialRequest: {
      task: "Write a function to calculate fibonacci numbers",
      repo: identity.repoId,
      org: identity.orgId,
    },
    seed: 42, // For deterministic execution
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
    agentFramework: "custom",
  });

  console.log(`   Created run: ${run.runId}`);
  console.log(`   Status: ${run.status}`);
  console.log(`   Memory snapshot at start: ${run.memorySnapshotStart.length} entries\n`);

  // Simulate agent execution steps
  console.log("2. Simulating agent execution...");

  // Step 1: Agent resolves context
  await runStore.appendStep(
    {
      runId: run.runId,
      action: "resolve_context",
      contextResolved: {
        task: "Write a function to calculate fibonacci numbers",
        repo: identity.repoId,
      },
      contextUsed: {
        constraints: [],
        preferences: [],
        conventions: [],
        decisions: [],
        risks: [],
        warnings: [],
      },
    },
    identity.orgId
  );
  console.log("   Step 1: Context resolved");

  // Step 2: Agent makes a decision
  await runStore.appendStep(
    {
      runId: run.runId,
      action: "make_decision",
      input: { decision: "Use iterative approach for fibonacci" },
      output: { chosen: "iterative", reason: "More efficient than recursive" },
    },
    identity.orgId
  );
  console.log("   Step 2: Decision made");

  // Step 3: Agent writes code
  await runStore.appendStep(
    {
      runId: run.runId,
      action: "write_code",
      input: { language: "typescript", function: "fibonacci" },
      output: {
        code: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}`,
      },
    },
    identity.orgId
  );
  console.log("   Step 3: Code written");

  // Step 4: Agent writes memory (learns from this run)
  const memoryEntry = await memoryStore.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "preference",
    key: "algorithm.fibonacci",
    value: "iterative",
    confidence: 0.9,
    source: "observed",
  });

  await runStore.appendStep(
    {
      runId: run.runId,
      action: "write_memory",
      memoryWriteIds: [memoryEntry.id],
    },
    identity.orgId
  );
  console.log("   Step 4: Memory written\n");

  // Complete the run
  console.log("3. Completing AgentRun...");
  const completedRun = await runStore.updateStatus(
    run.runId,
    identity.orgId,
    "completed",
    { success: true, function: "fibonacci" }
  );

  console.log(`   Status: ${completedRun.status}`);
  console.log(`   Steps: ${completedRun.steps.length}`);
  console.log(`   Final output: ${JSON.stringify(completedRun.finalOutput)}\n`);

  // Show how AgentRun maps to MemoryEntry
  console.log("4. AgentRun stored as MemoryEntry:");
  const runMemory = await memoryStore.read({
    orgId: identity.orgId,
    key: `agent_run:${run.runId}`,
  });

  if (runMemory.length > 0) {
    const runEntry = runMemory[0];
    console.log(`   Key: ${runEntry.key}`);
    console.log(`   Category: ${runEntry.category}`);
    console.log(`   Value type: ${typeof runEntry.value}`);
    console.log(`   Version: ${runEntry.version}`);
    console.log(`   → AgentRun is stored in the same kernel!\n`);
  }

  // Demonstrate replay capability
  console.log("5. Replaying AgentRun...");
  try {
    const replayResult = await replayEngine.replay({
      runId: run.runId,
    });

    console.log(`   Original run: ${replayResult.originalRunId}`);
    console.log(`   Replayed run: ${replayResult.replayedRunId}`);
    console.log(`   Matched: ${replayResult.matched}`);
    if (replayResult.divergenceStep) {
      console.log(`   Diverged at step: ${replayResult.divergenceStep}`);
    }
  } catch (error) {
    console.log(`   Replay error (expected in MVP): ${error}`);
    console.log("   → Full replay requires memory checkpoint/restore\n");
  }

  console.log("=== Example Complete ===");
}

main().catch(console.error);

