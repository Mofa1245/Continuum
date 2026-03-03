/**
 * Provider-agnostic LLM interface. Pure types only; no SDK imports.
 */

export interface LLMRequest {
  model: string;
  prompt: string;
  temperature?: number;
}

export interface LLMResponse {
  rawText: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
