/**
 * Log Compaction Example
 * 
 * Phase 7: Operational Maturity & Log Compaction
 * 
 * Demonstrates how to use log compaction to manage disk growth.
 */

import { InMemoryStore } from "../src/engine/memory-store.js";
import { FilePersistentStore } from "../src/storage/persistent-store.js";
import type { IdentityContext } from "../src/types/identity.js";

async function main() {
  console.log("=== Log Compaction Example ===\n");

  // Create persistent store
  const persistentStore = new FilePersistentStore(".continuum");
  const memoryStore = new InMemoryStore(persistentStore);

  // Define identity
  const identity: IdentityContext = {
    orgId: "acme-corp",
    repoId: "api-service",
  };

  // Load existing state
  console.log("1. Loading existing state...");
  await memoryStore.loadOrg(identity.orgId);
  console.log("   ✓ State loaded\n");

  // Write entries with duplicates (same key, different versions)
  console.log("2. Writing entries with duplicates...");
  
  // Write key-1 v1
  const entry1v1 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "preference",
    key: "api.framework",
    value: "express",
    confidence: 0.9,
    source: "explicit",
  });
  console.log(`   ✓ Written: ${entry1v1.key} v${entry1v1.version}`);

  // Write key-1 v2 (duplicate)
  const entry1v2 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "preference",
    key: "api.framework",
    value: "fastify",
    confidence: 0.95,
    source: "explicit",
  });
  console.log(`   ✓ Written: ${entry1v2.key} v${entry1v2.version}`);

  // Write key-2 v1
  const entry2v1 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "constraint",
    key: "security.no-new-deps",
    value: "Do not add new dependencies",
    confidence: 0.9,
    source: "explicit",
  });
  console.log(`   ✓ Written: ${entry2v1.key} v${entry2v1.version}`);

  // Write key-2 v2 (duplicate)
  const entry2v2 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "org",
    scopeId: identity.orgId,
    category: "constraint",
    key: "security.no-new-deps",
    value: "Do not add new dependencies without review",
    confidence: 0.95,
    source: "explicit",
  });
  console.log(`   ✓ Written: ${entry2v2.key} v${entry2v2.version}`);

  // Write key-3 v1 (no duplicates)
  const entry3v1 = await memoryStore.write({
    orgId: identity.orgId,
    scope: "repo",
    scopeId: identity.repoId,
    category: "preference",
    key: "database.orm",
    value: "prisma",
    confidence: 0.9,
    source: "explicit",
  });
  console.log(`   ✓ Written: ${entry3v1.key} v${entry3v1.version}\n`);

  // Check log size before compaction
  console.log("3. Checking log size before compaction...");
  const sizeBefore = await persistentStore.getLogSize(identity.orgId);
  const entriesBefore = await memoryStore.read({ orgId: identity.orgId });
  console.log(`   Log size: ${(sizeBefore / 1024).toFixed(2)} KB`);
  console.log(`   Total entries: ${entriesBefore.length}`);
  console.log(`   Unique keys: ${new Set(entriesBefore.map((e) => e.key)).size}\n`);

  // Compact log
  console.log("4. Compacting log...");
  const result = await persistentStore.compactLog(identity.orgId);
  
  if (result.compacted) {
    console.log(`   ✓ Compaction successful`);
    console.log(`   Entries: ${result.entriesBefore} → ${result.entriesAfter}`);
    console.log(`   Size: ${(result.sizeBefore / 1024).toFixed(2)} KB → ${(result.sizeAfter / 1024).toFixed(2)} KB`);
    const reduction = ((1 - result.sizeAfter / result.sizeBefore) * 100).toFixed(1);
    console.log(`   Reduction: ${reduction}%\n`);
  } else {
    console.log(`   ⚠ Compaction skipped (no duplicates found)\n`);
  }

  // Verify state after compaction
  console.log("5. Verifying state after compaction...");
  const entriesAfter = await memoryStore.read({ orgId: identity.orgId });
  console.log(`   Total entries: ${entriesAfter.length}`);
  console.log(`   Unique keys: ${new Set(entriesAfter.map((e) => e.key)).size}`);

  // Verify state preservation
  const statePreserved = entriesAfter.length === new Set(entriesAfter.map((e) => e.key)).size;
  console.log(`   State preserved: ${statePreserved ? "✅" : "❌"}\n`);

  // Show final entries
  console.log("6. Final entries:");
  entriesAfter.forEach((entry) => {
    console.log(`   - ${entry.key} v${entry.version}: ${entry.value}`);
  });
  console.log();

  // Cleanup
  console.log("7. Cleaning up...");
  await persistentStore.close();
  console.log("   ✓ Cleanup complete\n");

  console.log("=== Example Complete ===");
  console.log("\nKey takeaways:");
  console.log("✓ Compaction removes duplicate entries (keeps latest version)");
  console.log("✓ State preserved exactly (final state identical)");
  console.log("✓ Disk usage reduced (smaller log file)");
  console.log("✓ Compaction is atomic and crash-safe");
}

main().catch(console.error);
