/**
 * Persistence Recovery Test Suite
 * 
 * Phase 6: Persistence Validation & Recovery Proof
 * 
 * Runs all crash recovery and corruption injection tests.
 */

import { CrashRecoveryTester } from "../src/testing/persistence-recovery.js";
import { CorruptionInjectionTester } from "../src/testing/corruption-injection.js";

async function main() {
  console.log("=== Phase 6: Persistence Recovery Tests ===\n");

  // Crash recovery tests
  console.log("1. Crash Recovery Tests\n");
  const crashTester = new CrashRecoveryTester();
  const crashResults = await crashTester.runAllTests();

  let crashPassed = 0;
  let crashFailed = 0;

  for (const result of crashResults) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.test}`);
    console.log(`   Scenario: ${result.details.scenario}`);
    console.log(`   Expected: ${result.details.expectedBehavior}`);
    console.log(`   Actual: ${result.details.actualBehavior}`);
    console.log(`   Recovery: ${result.details.recoveryStatus}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();

    if (result.passed) {
      crashPassed++;
    } else {
      crashFailed++;
    }
  }

  console.log(`Crash Recovery Summary: ${crashPassed} passed, ${crashFailed} failed\n`);

  // Corruption injection tests
  console.log("2. Corruption Injection Tests\n");
  const corruptionTester = new CorruptionInjectionTester();
  const corruptionResults = await corruptionTester.runAllTests();

  let corruptionPassed = 0;
  let corruptionFailed = 0;

  for (const result of corruptionResults) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.test}`);
    console.log(`   Corruption: ${result.details.corruptionType}`);
    console.log(`   Injection: ${result.details.injectionMethod}`);
    console.log(`   Detection: ${result.details.detectionStatus}`);
    console.log(`   Recovery: ${result.details.recoveryStatus}`);
    console.log(`   Behavior: ${result.details.behavior}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();

    if (result.passed) {
      corruptionPassed++;
    } else {
      corruptionFailed++;
    }
  }

  console.log(
    `Corruption Injection Summary: ${corruptionPassed} passed, ${corruptionFailed} failed\n`
  );

  // Overall summary
  const totalPassed = crashPassed + corruptionPassed;
  const totalFailed = crashFailed + corruptionFailed;
  const totalTests = totalPassed + totalFailed;

  console.log("=== Overall Summary ===");
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(
    `Success rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%\n`
  );

  if (totalFailed === 0) {
    console.log("✅ All persistence recovery tests passed!");
    console.log("Persistence layer behaves exactly as specified under crashes and corruption.");
  } else {
    console.log("❌ Some tests failed. Review failures above.");
  }
}

main().catch(console.error);
