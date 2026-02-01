/**
 * CrewAI Integration Example
 * 
 * Demonstrates how to integrate Continuum with CrewAI.
 * 
 * This is a simplified example showing the integration pattern.
 * In production, you would use actual CrewAI agents and tasks.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../src/engine/agent-run-store.js";
import { Resolver } from "../src/engine/resolver.js";
import { CrewAIAdapter } from "../src/integrations/crewai-adapter.js";
import type { IdentityContext } from "../src/types/identity.js";

/**
 * Simulated CrewAI agent
 * 
 * In real CrewAI, this would be an actual Agent instance.
 */
interface SimulatedAgent {
  name: string;
  role: string;
  goal: string;
  systemPrompt: string;
}

/**
 * Simulate CrewAI agent execution
 */
async function simulateCrewAIAgent(
  adapter: CrewAIAdapter,
  runId: string,
  agent: SimulatedAgent,
  task: string
): Promise<unknown> {
  // Resolve context from Continuum
  const context = await adapter.resolveContext(task);

  // Inject context into agent system prompt
  const enhancedPrompt = agent.systemPrompt + adapter.formatContext(context);

  // Simulate agent execution (in real CrewAI, this would be agent.execute())
  const result = {
    agent: agent.name,
    task,
    result: `I will ${task} following the organizational constraints and preferences.`,
    reasoning: "Following Continuum context",
  };

  // Record the execution
  await adapter.recordAgentExecution(runId, agent.name, task, result);

  return result;
}

async function main() {
  console.log("=== CrewAI Integration Example ===\n");

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

  // Create CrewAI adapter
  console.log("2. Creating CrewAI adapter...");
  const adapter = new CrewAIAdapter(
    memoryStore,
    runStore,
    resolver,
    identity
  );
  console.log("   ✓ Adapter created\n");

  // Define CrewAI agents
  const agents: SimulatedAgent[] = [
    {
      name: "Senior Developer",
      role: "Senior Software Developer",
      goal: "Write high-quality, maintainable code",
      systemPrompt: "You are a senior software developer.",
    },
    {
      name: "Code Reviewer",
      role: "Code Reviewer",
      goal: "Review code for quality and compliance",
      systemPrompt: "You are a code reviewer.",
    },
  ];

  // Start run
  console.log("3. Starting CrewAI execution...");
  const task = "Add authentication endpoint";
  const runId = await adapter.startRun(task, {
    seed: 42,
    modelConfig: {
      model: "gpt-4",
      temperature: 0.7,
    },
  });
  console.log(`   Run ID: ${runId}\n`);

  // Simulate CrewAI workflow
  console.log("4. Simulating CrewAI workflow...");

  // Agent 1: Senior Developer
  console.log("   Agent 1: Senior Developer...");
  const devResult = await simulateCrewAIAgent(
    adapter,
    runId,
    agents[0],
    task
  );
  console.log(`   ✓ Development complete\n`);

  // Agent 2: Code Reviewer
  console.log("   Agent 2: Code Reviewer...");
  const reviewTask = `Review the implementation: ${JSON.stringify(devResult)}`;
  const reviewResult = await simulateCrewAIAgent(
    adapter,
    runId,
    agents[1],
    reviewTask
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
    development: devResult,
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
    });
  }

  console.log("\n=== Example Complete ===");
  console.log("\nKey takeaways:");
  console.log("✓ Continuum context injected into CrewAI agent prompts");
  console.log("✓ All agent executions recorded to AgentRun");
  console.log("✓ Memory written back from agent decisions");
  console.log("✓ Full traceability and replay capability");
}

main().catch(console.error);

