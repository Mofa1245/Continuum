/**
 * LangGraph Integration Example
 * 
 * Demonstrates how to integrate Continuum with LangGraph.
 * 
 * This is a simplified example showing the integration pattern.
 * In production, you would use actual LangGraph nodes and state management.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { Resolver } from "../src/engine/resolver.js";
import { LangGraphAdapter } from "../src/integrations/langgraph-adapter.js";
import type { IdentityContext } from "../src/types/identity.js";

/**
 * Simulated LangGraph node
 * 
 * In real LangGraph, this would be an actual node function.
 */
async function simulateLangGraphNode(
  adapter: LangGraphAdapter,
  runId: string,
  nodeName: string,
  task: string,
  state: unknown
): Promise<unknown> {
  // Resolve context from Continuum
  const context = await adapter.resolveContext(task);

  // Format context for LLM prompt
  const contextPrompt = adapter.formatContext(context);

  // Simulate LLM call (in real LangGraph, this would be actual LLM invocation)
  const llmResponse = {
    content: `Based on the context:\n${contextPrompt}\n\nTask: ${task}\n\nI will proceed with the task following the constraints and preferences.`,
    reasoning: "Following organizational constraints and preferences",
  };

  // Record the step
  await adapter.recordStep(
    runId,
    "llm_invoke",
    { task, state, contextPrompt },
    llmResponse,
    {
      nodeName,
      contextResolved: { task },
      contextUsed: context,
    }
  );

  return llmResponse;
}

async function main() {
  console.log("=== LangGraph Integration Example ===\n");

  // Initialize Continuum
  const memoryStore = new InMemoryStore();
  const runStore = new InMemoryAgentRunStore(memoryStore);
  const resolver = new Resolver(memoryStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "api-service",
  };

  // Pre-populate memory
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

  console.log("   ✓ Memory populated\n");

  // Create LangGraph adapter
  console.log("2. Creating LangGraph adapter...");
  const adapter = new LangGraphAdapter(
    memoryStore,
    runStore,
    resolver,
    identity
  );
  console.log("   ✓ Adapter created\n");

  // Start run
  console.log("3. Starting LangGraph execution...");
  const task = "Add authentication endpoint";
  const runId = await adapter.startRun(task, {
    seed: 42,
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
  });
  console.log(`   Run ID: ${runId}\n`);

  // Simulate LangGraph workflow
  console.log("4. Simulating LangGraph workflow...");

  // Node 1: Planning
  console.log("   Node 1: Planning...");
  const planState = { task, step: "planning" };
  const planResult = await simulateLangGraphNode(
    adapter,
    runId,
    "planning",
    task,
    planState
  );
  console.log(`   ✓ Planning complete\n`);

  // Node 2: Execution
  console.log("   Node 2: Execution...");
  const execState = { ...planState, plan: planResult };
  const execResult = await simulateLangGraphNode(
    adapter,
    runId,
    "execution",
    task,
    execState
  );
  console.log(`   ✓ Execution complete\n`);

  // Node 3: Review
  console.log("   Node 3: Review...");
  const reviewState = { ...execState, result: execResult };
  const reviewResult = await simulateLangGraphNode(
    adapter,
    runId,
    "review",
    task,
    reviewState
  );
  console.log(`   ✓ Review complete\n`);

  // Write memory from execution
  console.log("5. Writing memory from execution...");
  const memoryId = await adapter.writeMemory(
    "agent.decision.auth_endpoint",
    "Use JWT with Fastify",
    {
      category: "decision",
      confidence: 0.85,
    }
  );
  console.log(`   ✓ Memory written (ID: ${memoryId})\n`);

  // Record memory write
  await adapter.recordStep(
    runId,
    "write_memory",
    { key: "agent.decision.auth_endpoint" },
    { memoryId },
    { memoryWriteIds: [memoryId] }
  );

  // Complete run
  console.log("6. Completing run...");
  await adapter.completeRun(runId, {
    task,
    plan: planResult,
    execution: execResult,
    review: reviewResult,
  });
  console.log("   ✓ Run completed\n");

  // Show run details
  console.log("7. Run details:");
  const run = await runStore.get(runId, identity.orgId);
  if (run) {
    console.log(`   Run ID: ${run.runId}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Steps: ${run.steps.length}`);
    console.log(`   Framework: ${run.agentFramework}`);
    console.log("\n   Step breakdown:");
    run.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step.action}`);
      if (step.nodeName) {
        console.log(`      Node: ${step.nodeName}`);
      }
    });
  }

  console.log("\n=== Example Complete ===");
  console.log("\nKey takeaways:");
  console.log("✓ Continuum context injected into LangGraph nodes");
  console.log("✓ All steps recorded to AgentRun");
  console.log("✓ Memory written back from agent decisions");
  console.log("✓ Full traceability and replay capability");
}

main().catch(console.error);

