/**
 * Persistence Example
 * 
 * Demonstrates Phase 5B: Persistence & Durability
 * 
 * Shows:
 * - Append-only log with checksums
 * - Persistent checkpoints
 * - Crash consistency
 * - Loading state on startup
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { FilePersistentStore } from "../src/storage/persistent-store.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== Persistence & Durability Example ===\n");

  // Create persistent store
  const persistentStore = new FilePersistentStore(".continuum");
  const memoryStore = new InMemoryStore(persistentStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "api-service",
  };

  // Load existing state (if any)
  console.log("1. Loading existing state...");
  await memoryStore.loadOrg(identity.orgId);
  console.log("   ✓ State loaded (or empty if first run)\n");

  // Write some memory entries
  console.log("2. Writing memory entries...");
  const entry1 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "preference",
    key: "api.framework",
    value: "fastify",
    confidence: 0.95,
    source: "explicit",
  });
  console.log(`   ✓ Entry 1 written: ${entry1.id}`);

  const entry2 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "constraint",
    key: "security.no-new-deps",
    value: "Do not add new dependencies without security review",
    confidence: 0.9,
    source: "explicit",
  });
  console.log(`   ✓ Entry 2 written: ${entry2.id}\n`);

  // Create checkpoint
  console.log("3. Creating checkpoint...");
  const checkpoint = await memoryStore.createCheckpoint({
    orgId: identity.orgId,
    description: "Example checkpoint",
  });
  console.log(`   ✓ Checkpoint created: ${checkpoint.id}\n`);

  // Simulate restart: create new store and load state
  console.log("4. Simulating restart (new store instance)...");
  const persistentStore2 = new FilePersistentStore(".continuum");
  const memoryStore2 = new InMemoryStore(persistentStore2);

  await memoryStore2.loadOrg(identity.orgId);
  console.log("   ✓ State restored from disk\n");

  // Verify entries are restored
  console.log("5. Verifying restored entries...");
  const restoredEntries = await memoryStore2.read({
    orgId: identity.orgId,
  });
  console.log(`   ✓ Found ${restoredEntries.length} entries`);
  restoredEntries.forEach((entry) => {
    console.log(`     - ${entry.key}: ${entry.value}`);
  });
  console.log();

  // Verify checkpoint is restored
  console.log("6. Verifying restored checkpoint...");
  const restoredCheckpoint = await memoryStore2.getCheckpoint(
    checkpoint.id,
    identity.orgId
  );
  if (restoredCheckpoint) {
    console.log(`   ✓ Checkpoint restored: ${restoredCheckpoint.id}`);
    console.log(`     Entries in checkpoint: ${restoredCheckpoint.entries.size}`);
  } else {
    console.log("   ❌ Checkpoint not found");
  }
  console.log();

  // Test replay with persistent checkpoint
  console.log("7. Testing replay with persistent checkpoint...");
  await memoryStore2.restoreCheckpoint(checkpoint.id, identity.orgId);
  const entriesAfterRestore = await memoryStore2.read({
    orgId: identity.orgId,
  });
  console.log(`   ✓ Memory restored to checkpoint state`);
  console.log(`     Entries after restore: ${entriesAfterRestore.length}`);
  console.log();

  // Cleanup
  console.log("8. Cleaning up...");
  await persistentStore.close();
  await persistentStore2.close();
  console.log("   ✓ Cleanup complete\n");

  console.log("=== Example Complete ===");
  console.log("\nKey takeaways:");
  console.log("✓ Memory entries persisted to append-only log");
  console.log("✓ Checkpoints persisted with checksums");
  console.log("✓ State can be restored on restart");
  console.log("✓ Crash consistency via atomic writes");
  console.log("✓ Checksums validate integrity");
}

main().catch(console.error);
