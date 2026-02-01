/**
 * Basic Usage Example
 * 
 * Demonstrates the core workflow:
 * 1. Write memory entries
 * 2. Resolve context for a task
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { Resolver } from "../src/engine/resolver.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  // Initialize
  const store = new InMemoryStore();
  const resolver = new Resolver(store);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "api-service",
  };

  // Write memory entries
  await store.write({
    orgId: identity.orgId,
    scope: "global",
    category: "constraint",
    key: "security.no-new-deps",
    value: "Do not add new dependencies without security review",
    confidence: 0.9,
    source: "explicit",
  });

  await store.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "preference",
    key: "database.orm",
    value: "prisma",
    confidence: 0.85,
    source: "observed",
  });

  await store.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "convention",
    key: "api.framework",
    value: "fastify",
    confidence: 0.95,
    source: "explicit",
  });

  // Resolve context for a task
  const context = await resolver.resolve(identity, {
    task: "add authentication endpoint",
    repo: identity.repoId,
    org: identity.orgId,
  });

  console.log("=== Resolved Context ===");
  console.log("\nConstraints:");
  context.constraints.forEach((c) => {
    console.log(`  - ${c.value} (${c.confidence})`);
  });

  console.log("\nPreferences:");
  context.preferences.forEach((p) => {
    console.log(`  - ${p.value} (${p.confidence})`);
  });

  console.log("\nConventions:");
  context.conventions.forEach((c) => {
    console.log(`  - ${c.value} (${c.confidence})`);
  });

  console.log("\nWarnings:");
  context.warnings.forEach((w) => {
    console.log(`  - ${w}`);
  });
}

main().catch(console.error);

