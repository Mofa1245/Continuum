/**
 * Fault Injection Test Suite
 * 
 * Deliberately breaks things to validate system resilience.
 * 
 * Tests:
 * 1. Kill agent mid-run
 * 2. Corrupt checkpoint
 * 3. Reorder memory writes
 * 4. Replay with partial memory
 * 5. Replay after schema evolution
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { Resolver } from "../src/engine/resolver.js";
import { ReplayEngine } from "../src/engine/replay.js";
import { MinimalAgent } from "../src/agent/minimal-agent.js";
import { FaultInjectionTester } from "../src/testing/fault-injection.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== Fault Injection Test Suite ===\n");
  console.log("Deliberately breaking things to validate resilience...\n");

  // Initialize Continuum
  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const resolver = new Resolver(memoryStore);
  const replayEngine = new ReplayEngine(runStore, memoryStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "test-org",
    repoId: "test-repo",
  };

  // Pre-populate memory
  console.log("1. Setting up test environment...");
  await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "constraint",
    key: "test.constraint",
    value: "Test constraint",
    confidence: 0.9,
    source: "explicit",
  });

  await memoryStore.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "preference",
    key: "test.preference",
    value: "Test preference",
    confidence: 0.95,
    source: "explicit",
  });

  console.log("   ✓ Environment ready\n");

  // Create a complete run for testing
  console.log("2. Creating original run for testing...");
  const agent = new MinimalAgent(memoryStore, runStore, resolver, identity);

  const result = await agent.execute("Test task for fault injection", {
    seed: 42,
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
  });

  if (!result.success) {
    console.error("Failed to create original run");
    return;
  }

  // Get the run
  const runs = await runStore.list({
    orgId: identity.orgId,
    limit: 1,
  });

  if (runs.length === 0) {
    console.error("No runs found");
    return;
  }

  const originalRun = runs[0];
  console.log(`   ✓ Original run created: ${originalRun.runId}`);
  console.log(`   Steps: ${originalRun.steps.length}`);
  console.log(`   Checkpoint: ${originalRun.checkpointId || "none"}\n`);

  // Run fault injection tests
  console.log("3. Running fault injection tests...\n");

  const tester = new FaultInjectionTester(
    memoryStore,
    runStore,
    replayEngine,
    identity
  );

  const testResults = await tester.runAllTests(originalRun);

  // Report results
  console.log("4. Test Results:\n");

  let passed = 0;
  let failed = 0;

  for (const result of testResults) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.scenario}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.details.message) {
      console.log(`   ${result.details.message}`);
    }

    if (Object.keys(result.details).length > 1) {
      console.log("   Details:");
      for (const [key, value] of Object.entries(result.details)) {
        if (key !== "message") {
          console.log(`     ${key}: ${JSON.stringify(value)}`);
        }
      }
    }

    console.log();

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log("5. Summary:");
  console.log(`   Total tests: ${testResults.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${((passed / testResults.length) * 100).toFixed(1)}%\n`);

  // Interpretation
  console.log("6. Interpretation:");
  console.log("   ✅ PASS = System handled fault correctly");
  console.log("   ❌ FAIL = System did not handle fault correctly");
  console.log("\n   Note: Some tests may show limitations in MVP implementation.");
  console.log("   Full fault injection requires production storage layer.\n");

  console.log("=== Test Suite Complete ===");
}

main().catch(console.error);

