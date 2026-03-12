/**
 * Task registry for recipe-based replay.
 *
 * Each task executor knows how to reconstruct phases and re-run a workflow
 * given only the stored input string and execution recipe. Replay logic
 * remains generic and only calls into this registry.
 */

import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import { runDeterministicAgent } from "../agent/deterministic-runner.js";
import type { ExecutionRecipe } from "../storage/RunStore.js";
import type { LLMProvider } from "../llm/LLMProvider.js";
import { MockProvider } from "../llm/MockProvider.js";
import { OpenAIProvider } from "../llm/OpenAIProvider.js";
import { buildLlmDemoPhases } from "../cli/llm-demo-command.js";
import { buildPhases, type DivergenceMode } from "../cli/demo-agent-command.js";

export type TaskExecutor = (
  input: string,
  recipe: ExecutionRecipe
) => Promise<{ phaseResults: Record<string, unknown> }>;

const llmDemoExecutor: TaskExecutor = async (input, recipe) => {
  const provider: LLMProvider =
    recipe.provider === "openai" ? new OpenAIProvider() : new MockProvider();

  const model = recipe.model;
  const temperature = recipe.temperature;
  const prompt = input;

  const phases = buildLlmDemoPhases(provider, model, temperature, prompt);

  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  const result = await runDeterministicAgent({
    agentId: "org-test",
    taskId: recipe.task,
    phases,
    store,
    agentRunStore,
  });

  return { phaseResults: result.phaseResults };
};

const aiDebugDemoExecutor: TaskExecutor = async (_input, recipe) => {
  const phases = buildPhases();

  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  const result = await runDeterministicAgent({
    agentId: "org-test",
    taskId: recipe.task,
    phases,
    store,
    agentRunStore,
  });

  return { phaseResults: result.phaseResults };
};

const aiDebugDemo2Executor: TaskExecutor = async (_input, recipe) => {
  const divergenceMode = (recipe.config?.divergenceMode as DivergenceMode | undefined) ?? undefined;
  const phases = buildPhases(divergenceMode);

  const store = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(store);

  const result = await runDeterministicAgent({
    agentId: "org-test",
    taskId: recipe.task,
    phases,
    store,
    agentRunStore,
  });

  return { phaseResults: result.phaseResults };
};

const taskRegistry: Record<string, TaskExecutor> = {
  "llm-demo": llmDemoExecutor,
  "invoice-demo": llmDemoExecutor,
  "invoice-processor": llmDemoExecutor,
  "ai-debug-demo": aiDebugDemoExecutor,
  "ai-debug-demo-2": aiDebugDemo2Executor,
};

export function getTaskExecutor(task: string): TaskExecutor | undefined {
  return taskRegistry[task];
}

