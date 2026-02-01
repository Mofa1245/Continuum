/**
 * Nondeterminism Boundary Audit Test Suite
 * 
 * Validates that nondeterminism is properly isolated and contained.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { Resolver } from "../src/engine/resolver.js";
import { ReplayEngine } from "../src/engine/replay.js";
import { MinimalAgent } from "../src/agent/minimal-agent.js";
import { NondeterminismAuditor } from "../src/testing/nondeterminism-audit.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== Nondeterminism Boundary Audit ===\n");
  console.log("Validating nondeterminism isolation and containment...\n");

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

  console.log("   ✓ Environment ready\n");

  // Create a complete run for testing
  console.log("2. Creating test run...");
  const agent = new MinimalAgent(memoryStore, runStore, resolver, identity);

  const result = await agent.execute("Test task for nondeterminism audit", {
    seed: 42,
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
  });

  if (!result.success) {
    console.error("Failed to create test run");
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

  const testRun = runs[0];
  console.log(`   ✓ Test run created: ${testRun.runId}\n`);

  // Run nondeterminism audit
  console.log("3. Running nondeterminism audit...\n");

  const auditor = new NondeterminismAuditor(replayEngine);

  const auditResults = await auditor.runAllTests(testRun);

  // Report results
  console.log("4. Audit Results:\n");

  let passed = 0;
  let failed = 0;

  for (const result of auditResults) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.test}`);

    if (result.violations.length > 0) {
      console.log("   Violations:");
      for (const violation of result.violations) {
        console.log(`     ❌ ${violation}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log("   Warnings:");
      for (const warning of result.warnings) {
        console.log(`     ⚠️  ${warning}`);
      }
    }

    if (result.details.message) {
      console.log(`   ${result.details.message}`);
    }

    console.log();

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log("5. Summary:");
  console.log(`   Total tests: ${auditResults.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${((passed / auditResults.length) * 100).toFixed(1)}%\n`);

  // Interpretation
  console.log("6. Interpretation:");
  console.log("   ✅ PASS = Nondeterminism properly isolated and contained");
  console.log("   ❌ FAIL = Nondeterminism leakage detected");
  console.log("   ⚠️  WARNING = Potential issues or limitations\n");

  console.log("=== Audit Complete ===");
}

main().catch(console.error);

