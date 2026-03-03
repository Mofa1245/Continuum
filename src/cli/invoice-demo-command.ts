/**
 * Invoice extraction demo: structured data from messy invoice text.
 * Same pipeline as llm-demo (llm_call → json_parse → memory_write).
 * Demonstrates drift guard for billing-critical extraction: if amount drifts, verify fails.
 */

import { runDeterministicAgent } from "../agent/deterministic-runner.js";
import type { DeterministicPhase } from "../agent/deterministic-runner.js";
import type { RunStore, ExecutionRecipe } from "../storage/RunStore.js";
import type { LLMProvider } from "../llm/LLMProvider.js";
import { MockProvider } from "../llm/MockProvider.js";
import { InMemoryStore } from "../engine/memory-store.js";
import { InMemoryAgentRunStore } from "../engine/agent-run-store.js";
import { buildLlmDemoPhases } from "./llm-demo-command.js";

const ORG_ID = "org-test";
const DEFAULT_TEMPERATURE = 0;

const SAMPLE_INVOICE_TEXT = `Invoice #4831
Vendor: Acme Industrial Supply
Amount Due: $72.00
Due Date: 2024-04-15`;

/**
 * Runs the invoice extraction demo: mock LLM extracts vendor, amount, currency, due_date.
 * Stores run under ./runs for CI verification.
 */
export async function runInvoiceDemo(_args: string[], runStore: RunStore): Promise<void> {
  const model = "gpt-4o-mini";
  const temperature = DEFAULT_TEMPERATURE;

  const provider: LLMProvider = new MockProvider();
  const prompt = `Extract structured data from this invoice:\n\n${SAMPLE_INVOICE_TEXT}`;

  const memoryStore = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(memoryStore);
  const phases: DeterministicPhase[] = buildLlmDemoPhases(provider, model, temperature, prompt);

  const recipe: ExecutionRecipe = {
    task: "invoice-demo",
    provider: "mock",
    model,
    temperature,
    maxTokens: 256,
    config: { prompt },
  };

  const result = await runDeterministicAgent({
    agentId: ORG_ID,
    taskId: "invoice-demo",
    phases,
    store: memoryStore,
    agentRunStore,
    runStore,
    recipe,
    input: prompt,
  });

  const extracted = result.phaseResults.json_parse as Record<string, unknown>;
  console.log("Created run:", result.runId);
  console.log("Extracted JSON:", JSON.stringify(extracted, null, 2));
  console.log("");
  console.log("Verify in CI: continuum verify", result.runId, "--strict");
}
