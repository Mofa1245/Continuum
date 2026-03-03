/**
 * LLM demo command: llm_call → json_parse → memory_write. Uses provider abstraction, persists to /runs.
 */

import { runDeterministicAgent } from "../agent/deterministic-runner.js";
import type { DeterministicPhase } from "../agent/deterministic-runner.js";
import type { RunStore, ExecutionRecipe } from "../storage/RunStore.js";
import type { LLMProvider } from "../llm/LLMProvider.js";
import { getProvider } from "../llm/getProvider.js";
import { MockProvider } from "../llm/MockProvider.js";
import { OpenAIProvider } from "../llm/OpenAIProvider.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import path from "path";

const ORG_ID = "org-test";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0;

function parseArg(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i >= 0 && i + 1 < args.length) return args[i + 1];
  return undefined;
}

export function buildLlmDemoPhases(
  provider: LLMProvider,
  model: string,
  temperature: number,
  prompt: string
): DeterministicPhase[] {
  let llmResponse: { rawText: string; usage?: { promptTokens?: number; completionTokens?: number } } | null = null;

  return [
    {
      name: "llm_call",
      execute: async () => {
        const response = await provider.generate({ model, prompt, temperature });
        llmResponse = response;
        return {
          model,
          prompt,
          rawText: response.rawText,
          ...(response.usage != null && { usage: response.usage }),
          temperature,
        };
      },
    },
    {
      name: "json_parse",
      execute: async () => {
        if (!llmResponse) throw new Error("llm_call did not run before json_parse");
        try {
          return JSON.parse(llmResponse.rawText);
        } catch (e) {
          throw new Error(`JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    },
    {
      name: "memory_write",
      execute: async () => ({ stored: true }),
    },
  ];
}

function getProviderName(provider: LLMProvider): string {
  if (provider instanceof MockProvider) return "MockProvider";
  if (provider instanceof OpenAIProvider) return "OpenAIProvider";
  return "Unknown";
}

/**
 * Runs the LLM demo: provider.generate → JSON.parse → memory_write. Persists to runStore.
 */
export async function runLlmDemo(args: string[], runStore: RunStore): Promise<void> {
  const model = parseArg(args, "--model") ?? DEFAULT_MODEL;
  const temperatureRaw = parseArg(args, "--temperature");
  const temperature = temperatureRaw !== undefined ? Number(temperatureRaw) : DEFAULT_TEMPERATURE;
  const providerFlag = parseArg(args, "--provider");

  let provider: LLMProvider;
  let providerId: string;
  if (providerFlag === "openai") {
    provider = new OpenAIProvider();
    providerId = "openai";
  } else if (providerFlag === "mock") {
    provider = new MockProvider();
    providerId = "mock";
  } else {
    provider = getProvider();
    providerId = provider instanceof OpenAIProvider ? "openai" : "mock";
  }

  const prompt = "Weather in NYC";

  console.log("--- LLM Demo ---");
  console.log("Using provider:", getProviderName(provider));

  const memoryStore = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(memoryStore);
  const phases = buildLlmDemoPhases(provider, model, temperature, prompt);

  const recipe: ExecutionRecipe = {
    task: "llm-demo",
    provider: providerId,
    model,
    temperature,
    maxTokens: 200,
    config: {
      prompt,
    },
  };

  const result = await runDeterministicAgent({
    agentId: ORG_ID,
    taskId: "llm-demo",
    phases,
    store: memoryStore,
    agentRunStore,
    runStore,
    recipe,
    input: prompt,
  });

  console.log("Run ID:", result.runId);
  console.log("Stored to", path.join("runs", `${result.runId}.json`));
}
