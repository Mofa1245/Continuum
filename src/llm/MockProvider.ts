/**
 * Deterministic mock LLM provider. Same prompt → same output. No randomness, no Date.
 */

import type { LLMProvider, LLMRequest, LLMResponse } from "./LLMProvider.js";

const WEATHER_RESPONSE: LLMResponse = {
  rawText: '{"city":"NYC","temperature":72}',
};

/** Structured invoice extraction for invoice-demo. Deterministic. */
const INVOICE_EXTRACTION_RESPONSE: LLMResponse = {
  rawText: '{"vendor":"Acme Industrial Supply","amount":72,"currency":"USD","due_date":"2024-04-15"}',
};

/** Drift demo: different format (amount string, shortened vendor) when prompt says "strictly in JSON". */
const INVOICE_STRICT_JSON_RESPONSE: LLMResponse = {
  rawText: '{"vendor":"Acme Industrial","amount":"72.00","currency":"USD","due_date":"2024-04-15"}',
};

/** Drift demo prompt_v1: extract invoice number and total (number). */
const DRIFT_V1_RESPONSE: LLMResponse = {
  rawText: '{"invoice_number":"INV-001","total":72}',
};

/** Drift demo prompt_v2: extract as JSON (total as string). */
const DRIFT_V2_RESPONSE: LLMResponse = {
  rawText: '{"invoice_number":"INV-001","total":"72.00"}',
};

const UNKNOWN_RESPONSE: LLMResponse = {
  rawText: '{"message":"mock-response"}',
};

export class MockProvider implements LLMProvider {
  async generate(_request: LLMRequest): Promise<LLMResponse> {
    if (_request.prompt.includes("Weather in NYC")) {
      return WEATHER_RESPONSE;
    }
    if (_request.prompt.includes("Extract invoice number and total amount as JSON")) {
      return DRIFT_V2_RESPONSE;
    }
    if (_request.prompt.includes("Extract invoice number and total amount from the text")) {
      return DRIFT_V1_RESPONSE;
    }
    if (_request.prompt.includes("strictly in JSON") && _request.prompt.includes("Acme Industrial")) {
      return INVOICE_STRICT_JSON_RESPONSE;
    }
    if (_request.prompt.includes("Invoice #4831") || _request.prompt.includes("Acme Industrial Supply")) {
      return INVOICE_EXTRACTION_RESPONSE;
    }
    return UNKNOWN_RESPONSE;
  }
}
