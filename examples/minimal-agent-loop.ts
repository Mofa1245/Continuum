/**
 * Minimal Agent Loop Example
 * 
 * Demonstrates a complete agent execution using Continuum:
 * 1. Agent receives task
 * 2. Resolves context from Continuum
 * 3. Executes with context
 * 4. Records to AgentRun
 * 5. Writes memory back
 * 
 * This is the wedge use-case in action.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { Resolver } from "../src/engine/resolver.js";
import { MinimalAgent } from "../src/agent/minimal-agent.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== Minimal Agent Loop Example ===\n");

  // Initialize Continuum
  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const resolver = new Resolver(memoryStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "api-service",
  };

  // Pre-populate some memory (simulating existing context)
  console.log("1. Pre-populating Continuum memory...");
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

  await memoryStore.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "convention",
    key: "code.style",
    value: "TypeScript strict mode",
    confidence: 0.9,
    source: "explicit",
  });

  console.log("   ✓ Memory populated\n");

  // Create agent
  console.log("2. Creating agent...");
  const agent = new MinimalAgent(memoryStore, runStore, resolver, identity);
  console.log("   ✓ Agent created\n");

  // Execute agent task
  console.log("3. Executing agent task...");
  console.log("   Task: 'Add authentication endpoint'\n");

  const result = await agent.execute("Add authentication endpoint", {
    seed: 42,
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
  });

  console.log("4. Execution result:");
  console.log(`   Success: ${result.success}`);
  console.log(`   Steps: ${result.steps}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  console.log(`   Output: ${JSON.stringify(result.output, null, 2)}\n`);

  // Show AgentRun
  console.log("5. AgentRun details:");
  const runs = await runStore.list({
    orgId: identity.orgId,
    limit: 1,
  });

  if (runs.length > 0) {
    const run = runs[0];
    console.log(`   Run ID: ${run.runId}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Steps: ${run.steps.length}`);
    console.log(`   Started: ${new Date(run.startedAt).toISOString()}`);
    if (run.completedAt) {
      console.log(
        `   Completed: ${new Date(run.completedAt).toISOString()}`
      );
      console.log(
        `   Duration: ${run.completedAt - run.startedAt}ms`
      );
    }

    console.log("\n   Step breakdown:");
    run.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step.action} (${step.timestamp - run.startedAt}ms)`);
    });
  }

  // Show memory written
  console.log("\n6. Memory written by agent:");
  const newMemory = await memoryStore.read({
    orgId: identity.orgId,
    key: "agent.decision_approach",
  });

  if (newMemory.length > 0) {
    newMemory.forEach((entry) => {
      console.log(`   Key: ${entry.key}`);
      console.log(`   Value: ${entry.value}`);
      console.log(`   Confidence: ${entry.confidence}`);
      console.log(`   Source: ${entry.source}`);
    });
  }

  console.log("\n=== Example Complete ===");
  console.log("\nKey takeaways:");
  console.log("✓ Agent resolves context from Continuum");
  console.log("✓ Agent records all steps to AgentRun");
  console.log("✓ Agent writes memory back to Continuum");
  console.log("✓ Everything is deterministic and replayable");
}

main().catch(console.error);

