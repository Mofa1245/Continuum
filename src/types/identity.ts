/**
 * Identity Resolution
 * 
 * We track operational identities, not humans.
 * Identity = tuple of project, repo, org, environment, toolchain
 */

export interface IdentityContext {
  orgId: string;
  repoId?: string;
  projectId?: string;
  environment?: string;
  toolchain?: string;
}

export interface ApiKey {
  key: string;
  orgId: string;
  scopes: string[];
  createdAt: number;
  expiresAt?: number;
}

/**
 * Simple API key store for MVP
 * Production: Replace with proper key management (JWT, database, etc.)
 */
const API_KEY_STORE = new Map<string, IdentityContext>();

/**
 * Register an API key (for MVP/testing)
 * Production: This would be done via admin API or key generation service
 */
export function registerApiKey(apiKey: string, identity: IdentityContext): void {
  API_KEY_STORE.set(apiKey, identity);
}

/**
 * Identity boundary = API key
 */
export function extractIdentityFromKey(apiKey: string): IdentityContext {
  const identity = API_KEY_STORE.get(apiKey);
  
  if (!identity) {
    // For MVP: If key not found, treat key as orgId (development mode)
    // Production: This should be a 401 error
    if (process.env.NODE_ENV === "development") {
      return {
        orgId: apiKey,
      };
    }
    
    throw new Error("Invalid API key");
  }
  
  return identity;
}

