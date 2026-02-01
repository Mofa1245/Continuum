/**
 * API Key Management (MVP)
 * 
 * For production: Replace with proper JWT/database-backed key management
 */

import { registerApiKey } from "../types/identity.js";

/**
 * Initialize default API keys for development
 */
export function initializeDefaultKeys(): void {
  // Example: Register a test key
  // In production, keys would be generated via admin API
  if (process.env.NODE_ENV === "development") {
    registerApiKey("test-key-123", {
      orgId: "org-test",
      repoId: "repo-test",
    });
  }
}

