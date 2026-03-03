/**
 * OpenAI-backed LLM provider. Uses official OpenAI Node SDK.
 * Only use when OPENAI_API_KEY is set; throw from generate() if key missing.
 */

import type { LLMProvider, LLMRequest, LLMResponse } from "./LLMProvider.js";
import OpenAI from "openai";

export class OpenAIProvider implements LLMProvider {
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: request.model,
      messages: [{ role: "user", content: request.prompt }],
      temperature: request.temperature ?? 0,
    });

    const rawText =
      completion.choices[0]?.message?.content ?? "";

    const usage = completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
        }
      : undefined;

    return {
      rawText,
      usage,
    };
  }
}
