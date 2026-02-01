# Log Compaction Guide

This guide explains when and how to compact logs, what compaction guarantees, and what it doesn't.

---

## What Is Compaction?

**Compaction** removes duplicate entries from the append-only log while preserving final state exactly.

**What it does:**
- Removes old versions of entries (keeps latest version per key)
- Reduces log file size
- Preserves final state exactly (same as before compaction)

**What it doesn't do:**
- Doesn't change semantics
- Doesn't change recovery behavior
- Doesn't repair corruption
- Doesn't run automatically

---

## When to Compact

**Compact when:**
- Log file is large (e.g., > 100MB)
- You have many duplicate entries (same key, different versions)
- Disk space is a concern
- You want to reduce load time

**Don't compact when:**
- Log file is small (< 10MB)
- You need historical versions (compaction removes old versions)
- System is under heavy write load (compaction locks the log)
- You're debugging (compaction removes audit trail)

Compaction acquires an exclusive write lock for the duration of the operation.

**Rule of thumb:** Compact periodically (weekly/monthly) or when log size exceeds a threshold.

---

## How to Compact

**Basic usage:**
```typescript
import { FilePersistentStore } from "./src/storage/persistent-store.js";

const store = new FilePersistentStore(".continuum");
const result = await store.compactLog("org-id");

console.log(`Compacted: ${result.compacted}`);
console.log(`Entries: ${result.entriesBefore} → ${result.entriesAfter}`);
console.log(`Size: ${result.sizeBefore} → ${result.sizeAfter} bytes`);
```

**Check log size first:**
```typescript
const size = await store.getLogSize("org-id");
if (size > 100 * 1024 * 1024) { // 100MB
  await store.compactLog("org-id");
}
```

---

## What Compaction Guarantees

### ✅ State Preservation

**Guarantee:** State before compaction == state after compaction (deduplicated).

**What this means:**
- All unique entries are preserved
- Latest version per key is kept
- Final state is identical

**Example:**
```
Before: entry-1 v1, entry-1 v2, entry-2 v1, entry-2 v2, entry-2 v3
After:  entry-1 v2, entry-2 v3
State: Same (latest versions only)
```

### ✅ Atomic Operation

**Guarantee:** Compaction is atomic (temp file + rename).

Atomic replace relies on standard filesystem semantics (same filesystem, POSIX-style rename). Network or non-POSIX filesystems may not provide the same guarantees.

**What this means:**
- Original log is preserved until compaction succeeds
- If compaction fails, original log is intact
- No partial compaction state

### ✅ Crash Safety

**Guarantee:** Crash during compaction doesn't corrupt data.

**What this means:**
- Original log is preserved if compaction crashes
- Temp file is ignored if incomplete
- System continues with original log

### ✅ Verification

**Guarantee:** Compaction verifies integrity before replacing log.

**What this means:**
- Temp file is verified (checksums, entry count)
- Original log is only replaced if verification passes
- Compaction aborts if verification fails

---

## What Compaction Does NOT Guarantee

### ❌ Historical Versions

**Not guaranteed:** Old versions of entries are removed.

**What this means:**
- After compaction, you can't access old versions
- Only latest version per key is kept
- Historical audit trail is lost

**Impact:** If you need old versions, don't compact (or back up first).

---

### ❌ Performance Improvement

**Not guaranteed:** Compaction improves performance.

**What this means:**
- Compaction itself takes time (reads/writes entire log)
- Load time may improve (smaller file)
- Write performance unchanged

**Impact:** Compaction is for disk space, not speed.

---

### ❌ Automatic Repair

**Not guaranteed:** Compaction repairs corrupted entries.

**What this means:**
- Corrupted entries are skipped (same as before)
- Compaction doesn't fix corruption
- Verification detects corruption, doesn't repair it

**Impact:** Fix corruption before compacting (or accept skipped entries).

---

### ❌ Background Execution

**Not guaranteed:** Compaction runs in background.

**What this means:**
- Compaction is synchronous (blocks until complete)
- No background threads
- Must be explicitly triggered

**Impact:** Run compaction during low-traffic periods.

---

## Disk Growth Behavior

### Before Compaction

**Growth pattern:**
- Log grows linearly with writes
- Duplicate entries accumulate
- Old versions never removed
- File size: O(n) where n = total writes

**Example:**
- 1000 writes with 100 unique keys
- Log size: ~1000 entries
- Disk usage: grows indefinitely

### After Compaction

**Growth pattern:**
- Log size = number of unique keys
- Duplicate entries removed
- Old versions removed
- File size: O(u) where u = unique keys

**Example:**
- Same 1000 writes with 100 unique keys
- After compaction: ~100 entries
- Disk usage: reduced by ~90%

---

## Compaction Process

**Step-by-step:**

1. **Load entries** - Read entire log file
2. **Deduplicate** - Keep latest version per key
3. **Write temp file** - Write compacted entries to temp file
4. **Verify** - Check temp file integrity (checksums, entry count)
5. **Atomic replace** - Rename temp file to original (atomic)
6. **Cleanup** - Close file handles

**If any step fails:**
- Original log is preserved
- Temp file is deleted
- Compaction aborts
- No data loss

---

## Safety Guarantees

**Compaction is safe because:**

1. **Atomic operation** - Temp file + rename (no partial state)
2. **Verification** - Temp file verified before replace
3. **Crash-safe** - Original log preserved if crash occurs
4. **State preservation** - Final state identical before/after

**These guarantees are validated by tests** (see `compaction-validation-tests.ts`).

---

## Best Practices

**Do:**
- Compact during low-traffic periods
- Monitor log size before compacting
- Back up before first compaction (if you need old versions)
- Compact periodically (weekly/monthly)
- Verify compaction results (check entry count)

**Don't:**
- Compact during heavy write load
- Compact if you need historical versions
- Compact without understanding what it does
- Rely on compaction for performance
- Expect automatic compaction

---

## Monitoring

**Check log size:**
```typescript
const size = await store.getLogSize("org-id");
console.log(`Log size: ${(size / 1024 / 1024).toFixed(2)} MB`);
```

**Check compaction results:**
```typescript
const result = await store.compactLog("org-id");
console.log(`Compaction: ${result.compacted ? "success" : "skipped"}`);
console.log(`Reduction: ${((1 - result.sizeAfter / result.sizeBefore) * 100).toFixed(1)}%`);
```

**Log compaction events:**
```typescript
const result = await store.compactLog("org-id");
if (result.compacted) {
  console.log(`[Compaction] Org: ${orgId}, Entries: ${result.entriesBefore} → ${result.entriesAfter}, Size: ${result.sizeBefore} → ${result.sizeAfter}`);
}
```

---

## Troubleshooting

**Compaction skipped:**
- **Cause:** No duplicates found
- **Action:** Normal, nothing to compact

**Compaction failed:**
- **Cause:** Verification failed or I/O error
- **Action:** Check disk space, check file permissions, original log intact

**State mismatch after compaction:**
- **Cause:** Bug (should not happen)
- **Action:** Report bug, original log should be intact

**Temp file left behind:**
- **Cause:** Crash during compaction
- **Action:** Safe to delete, original log is intact

---

## Summary

**Compaction:**
- ✅ Preserves final state exactly
- ✅ Reduces disk usage
- ✅ Atomic and crash-safe
- ✅ Optional and explicit

**Compaction does NOT:**
- ❌ Preserve historical versions
- ❌ Improve performance automatically
- ❌ Repair corruption
- ❌ Run in background

**Use compaction to manage disk growth, not for correctness or performance.**

Compaction behavior is intentionally conservative and follows the v1.x non-goals defined in [NON_GOALS.md](../legal/NON_GOALS.md).

---

**Version 1.0 (v1.x)**

This guide explains log compaction. Use it to manage disk growth safely.
