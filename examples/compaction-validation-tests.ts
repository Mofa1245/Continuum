/**
 * Compaction Validation Test Suite
 * 
 * Phase 7: Operational Maturity & Log Compaction
 * 
 * Runs all compaction validation tests.
 */

import { CompactionValidationTester } from "../src/testing/compaction-validation.js";

async function main() {
  console.log("=== Phase 7: Compaction Validation Tests ===\n");

  const tester = new CompactionValidationTester();
  const results = await tester.runAllTests();

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.test}`);
    console.log(`   Scenario: ${result.details.scenario}`);
    console.log(`   Expected: ${result.details.expectedBehavior}`);
    console.log(`   Actual: ${result.details.actualBehavior}`);
    console.log(`   State Preserved: ${result.details.statePreserved ? "✅" : "❌"}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log("=== Summary ===");
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `Success rate: ${results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0}%\n`
  );

  if (failed === 0) {
    console.log("✅ All compaction validation tests passed!");
    console.log("Compaction preserves state exactly and is crash-safe.");
  } else {
    console.log("❌ Some tests failed. Review failures above.");
  }
}

main().catch(console.error);
