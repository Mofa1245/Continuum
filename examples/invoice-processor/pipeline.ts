/**
 * Invoice processor example pipeline.
 *
 * Simulates a real workflow:
 *   invoice text -> LLM extraction -> JSON -> accounting record
 * and persists runs into ./runs so Continuum can verify drift.
 *
 * Run (from repo root):
 *   npx tsx examples/invoice-processor/pipeline.ts
 *
 * Then in CI / locally:
 *   node dist/cli/index.js verify-all --strict
 *
 * To simulate drift, change the prompt string below from
 * "Extract invoice fields carefully." to
 * "Extract invoice fields strictly in JSON."
 * Re-run the pipeline and then run verify-all --strict again.
 */

import { pathToFileURL } from "url";
import path from "path";
import { promises as fs } from "fs";
import { runDeterministicAgent, type DeterministicPhase } from "../../src/agent/deterministic-runner.js";
import type { ExecutionRecipe, RunStore } from "../../src/storage/RunStore.js";
import { FileRunStore } from "../../src/storage/RunStore.js";
import type { LLMProvider } from "../../src/llm/LLMProvider.js";
import { getProvider } from "../../src/llm/getProvider.js";
import { MockProvider } from "../../src/llm/MockProvider.js";
import { OpenAIProvider } from "../../src/llm/OpenAIProvider.js";
import { InMemoryStore } from "../../src/engine/memory-store.js";
import { InMemoryAgentRunStore } from "../../src/engine/agent-run-store.js";
import { buildLlmDemoPhases } from "../../src/cli/llm-demo-command.js";

const ORG_ID = "invoice-processor-org";
const TASK_ID = "invoice-processor";

/**
 * Baseline prompt for extraction.
 * To simulate drift, change the first line to:
 *   "Extract invoice fields strictly in JSON."
 */
const PROMPT_HEADER = `Extract invoice fields carefully.

Return JSON with keys: vendor, amount, currency, due_date, invoice_number.

Invoice text:
`;

interface InvoiceInput {
  fileName: string;
  absolutePath: string;
  contents: string;
}

function getProviderName(provider: LLMProvider): string {
  if (provider instanceof MockProvider) return "MockProvider";
  if (provider instanceof OpenAIProvider) return "OpenAIProvider";
  return "UnknownProvider";
}

async function loadInvoices(): Promise<InvoiceInput[]> {
  const invoicesDir = path.join(process.cwd(), "examples", "invoice-processor", "invoices");
  const entries = await fs.readdir(invoicesDir, { withFileTypes: true });
  const result: InvoiceInput[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".txt")) continue;
    const absolutePath = path.join(invoicesDir, entry.name);
    const contents = await fs.readFile(absolutePath, "utf8");
    result.push({ fileName: entry.name, absolutePath, contents });
  }

  return result;
}

function extractInvoiceNumber(text: string): string | null {
  const match = text.match(/Invoice\s*#?:\s*([A-Za-z0-9\-]+)/i);
  return match ? match[1] : null;
}

async function runForInvoice(
  invoice: InvoiceInput,
  provider: LLMProvider,
  model: string,
  temperature: number,
  runStore: RunStore
): Promise<string> {
  const prompt = `${PROMPT_HEADER}\n${invoice.contents}`;

  const memoryStore = new InMemoryStore();
  const agentRunStore = new InMemoryAgentRunStore(memoryStore);
  const phases: DeterministicPhase[] = buildLlmDemoPhases(provider, model, temperature, prompt);

  const recipe: ExecutionRecipe = {
    task: TASK_ID,
    provider: provider instanceof OpenAIProvider ? "openai" : "mock",
    model,
    temperature,
    maxTokens: 256,
    config: {
      prompt,
      invoiceFile: invoice.fileName,
    },
  };

  const result = await runDeterministicAgent({
    agentId: ORG_ID,
    taskId: TASK_ID,
    phases,
    store: memoryStore,
    agentRunStore,
    runStore,
    recipe,
    input: prompt,
  });

  const parsed = result.phaseResults.json_parse as Record<string, unknown>;

  const strictJsonMode = prompt.toLowerCase().includes("strictly in json");

  const amountRaw = parsed.amount as number | string | undefined;
  const amountNumeric =
    typeof amountRaw === "number" ? amountRaw : amountRaw != null ? Number(amountRaw) : undefined;

  const accountingRecord = {
    invoice_file: invoice.fileName,
    invoice_number: extractInvoiceNumber(invoice.contents),
    vendor: parsed.vendor ?? null,
    amount: strictJsonMode && amountNumeric != null ? amountNumeric.toFixed(2) : amountNumeric ?? null,
    currency: parsed.currency ?? null,
    due_date: parsed.due_date ?? null,
  };

  console.log("Invoice file:", invoice.fileName);
  console.log("Run ID:", result.runId);
  console.log("Accounting record:", JSON.stringify(accountingRecord, null, 2));
  console.log("");

  return result.runId;
}

async function runPipeline(): Promise<void> {
  const invoices = await loadInvoices();
  if (invoices.length === 0) {
    console.error("No invoices found in examples/invoice-processor/invoices");
    process.exit(1);
  }

  const provider = getProvider();
  const model = provider instanceof OpenAIProvider ? "gpt-4o-mini" : "mock-model";
  const temperature = 0;
  const runStore: RunStore = new FileRunStore("runs");

  console.log("--- Invoice Processor Pipeline ---");
  console.log("Using provider:", getProviderName(provider));
  console.log("");

  const runIds: string[] = [];
  for (const invoice of invoices) {
    const runId = await runForInvoice(invoice, provider, model, temperature, runStore);
    runIds.push(runId);
  }

  console.log("Baseline runs created for invoices:");
  for (const id of runIds) {
    console.log(" -", id);
  }
  console.log("");
  console.log("Next:");
  console.log(' 1) Run: node dist/cli/index.js verify-all --strict   # should PASS');
  console.log(
    ' 2) Edit PROMPT_HEADER in examples/invoice-processor/pipeline.ts to say "strictly in JSON", rerun the pipeline'
  );
  console.log(" 3) Run: node dist/cli/index.js verify-all --strict   # Continuum should detect drift");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPipeline().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { runPipeline };

