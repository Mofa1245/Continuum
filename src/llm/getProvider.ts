/**
 * Provider factory. No config files; no DI container.
 */

import type { LLMProvider } from "./LLMProvider.js";
import { MockProvider } from "./MockProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

export function getProvider(): LLMProvider {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }
  return new MockProvider();
}
