# Persistence Architecture

How Continuum persists data to disk with crash consistency and integrity validation.

---

## Overview

Phase 5B adds persistence to Continuum. The system now:
- Persists memory entries to append-only log
- Persists checkpoints to disk with checksums
- Validates integrity on load
- Provides crash consistency

---

## Storage Structure

```
.continuum/
  orgs/
    {orgId}/
      log.jsonl              # Append-only log of memory entries
      checkpoints/           # Checkpoint directory
        {checkpointId}.json  # Individual checkpoints
```

---

## Append-Only Log

### Format

**File:** `log.jsonl` (JSON Lines)

**Structure:**
```json
{"entry": {...}, "checksum": "sha256...", "timestamp": 1234567890}
{"entry": {...}, "checksum": "sha256...", "timestamp": 1234567891}
...
```

**Properties:**
- One entry per line
- Checksum validates entry integrity
- Timestamp for ordering
- Append-only (immutable)

### Write Process

1. Serialize entry to JSON
2. Compute SHA-256 checksum
3. Append line to log file
4. Call `fsync()` for durability
5. Update in-memory state

**Atomicity:** Each line is atomic. If write fails, previous lines are intact.

### Read Process

1. Read entire log file
2. Parse each line as JSON
3. Verify checksum for each entry
4. Skip corrupted entries (log warning)
5. Return valid entries

**Resilience:** Corrupted entries are detected and skipped. System continues with valid entries.

---

## Persistent Checkpoints

### Format

**File:** `checkpoints/{checkpointId}.json`

**Structure:**
```json
{
  "checkpoint": {
    "id": "...",
    "orgId": "...",
    "createdAt": 1234567890,
    "description": "...",
    "entries": [[id, entry], ...],
    "indexes": {
      "byOrg": [[key, [ids...]], ...],
      "byScope": [[key, [ids...]], ...],
      "byCategory": [[key, [ids...]], ...],
      "byKey": [[key, [ids...]], ...]
    }
  },
  "checksum": "sha256...",
  "savedAt": 1234567890
}
```

**Properties:**
- Maps/Sets serialized to arrays
- Checksum validates entire checkpoint
- Atomic write (temp file + rename)

### Write Process

1. Serialize checkpoint (Maps/Sets → arrays)
2. Compute SHA-256 checksum
3. Write to temp file (`{checkpointId}.json.tmp`)
4. Rename temp file to final name
5. Update in-memory state

**Atomicity:** Temp file + rename ensures atomic write. If process crashes, temp file is left behind (can be cleaned up).

### Read Process

1. Read checkpoint file
2. Parse JSON
3. Verify checksum
4. Deserialize (arrays → Maps/Sets)
5. Return checkpoint

**Validation:** If checksum fails, throw error. Corrupted checkpoints cannot be used.

---

## Checksums

### Algorithm

**SHA-256** (via Node.js `crypto`)

### Usage

**Memory Entries:**
- Checksum computed on entry object
- Stored with entry in log
- Verified on load

**Checkpoints:**
- Checksum computed on serialized checkpoint
- Stored with checkpoint
- Verified on load

### Integrity

**What checksums protect:**
- Data corruption (disk errors)
- Partial writes (crash during write)
- Tampering (manual file edits)

**What checksums don't protect:**
- Encryption (data is plain text)
- Access control (no file permissions)
- Replication (single copy)

---

## Crash Consistency

### Write-Ahead Logging

**Principle:** Write to log before updating in-memory state.

**Process:**
1. Append entry to log
2. Call `fsync()` (ensure on disk)
3. Update in-memory state

**Recovery:** On restart, load from log. In-memory state matches disk.

### Atomic Writes

**Checkpoints:**
1. Write to temp file
2. Rename to final name
3. Update in-memory state

**Log entries:**
1. Append line
2. Call `fsync()`
3. Update in-memory state

**Recovery:** Temp files can be cleaned up. Log entries are atomic per line.

### State Restoration

**On startup:**
1. Load entries from log (per org)
2. Verify checksums
3. Rebuild in-memory indexes
4. Load checkpoints (per org)
5. Verify checkpoint checksums

**Result:** In-memory state matches disk state.

---

## Performance

### Write Performance

**Memory entries:**
- Append to log: O(1)
- Checksum: O(n) where n = entry size
- Fsync: O(1) but slow (disk I/O)

**Checkpoints:**
- Serialize: O(n) where n = checkpoint size
- Checksum: O(n)
- Write: O(n)
- Rename: O(1)

### Read Performance

**Memory entries:**
- Load entire log: O(n) where n = log size
- Parse: O(n)
- Verify checksums: O(n)
- Rebuild indexes: O(n)

**Checkpoints:**
- Load file: O(n) where n = file size
- Parse: O(n)
- Verify checksum: O(n)
- Deserialize: O(n)

### Log Compaction (Phase 7)

**What it does:**
- Removes duplicate entries (keeps latest version per key)
- Preserves final state exactly
- Reduces disk usage
- Atomic and crash-safe

**When to use:**
- Log file is large (> 100MB)
- Many duplicate entries
- Disk space is a concern

**Process:**
1. Load all entries
2. Deduplicate by key (keep latest version)
3. Write to temp file
4. Verify integrity
5. Atomic replace (temp → original)

**Guarantees:**
- State preservation (final state identical)
- Atomic operation (no partial state)
- Crash safety (original preserved on failure)
- Verification (integrity checked before replace)

**Limitations:**
- Removes historical versions
- Synchronous (blocks until complete)
- Must be explicitly triggered
- Doesn't improve performance automatically

See [Compaction Guide](../operational/COMPACTION_GUIDE.md) for details.

---

### Optimization Opportunities

**Future improvements:**
- Incremental loading (load only recent entries)
- Index persistence (avoid rebuilding)
- Compression (reduce disk usage)
- Batch writes (reduce fsync calls)

---

## Failure Modes

### Corrupted Log Entry

**Detection:** Checksum verification fails

**Recovery:** Skip corrupted entry, log warning, continue with valid entries

**Impact:** One entry lost, system continues

### Corrupted Checkpoint

**Detection:** Checksum verification fails on load

**Recovery:** Throw error, checkpoint cannot be used

**Impact:** Replay fails, but system continues (can create new checkpoint)

### Partial Write

**Detection:** Checksum verification fails (incomplete JSON)

**Recovery:** Skip corrupted entry/checkpoint

**Impact:** Last write may be lost, previous writes intact

### Disk Full

**Detection:** Write fails with ENOSPC

**Recovery:** Throw error, operation fails

**Impact:** System cannot write, but can read existing data

---

## Security Considerations

### Data at Rest

**Current:** Plain text JSON files

**Risks:**
- Sensitive data in memory entries
- No encryption
- No access control

**Future:** Encryption at rest, access control, key management

### Checksums

**Purpose:** Integrity, not security

**Limitation:** Checksums don't prevent tampering, only detect it

**Future:** Cryptographic signatures for tamper-proofing

---

## Migration Path

### From In-Memory to Persistent

**Step 1:** Create persistent store
```typescript
const persistentStore = new FilePersistentStore(".continuum");
```

**Step 2:** Pass to memory store
```typescript
const memoryStore = new InMemoryStore(persistentStore);
```

**Step 3:** Load existing state
```typescript
await memoryStore.loadOrg("org-id");
```

**Result:** Existing in-memory code works unchanged. Persistence is transparent.

### From File-Based to Database

**Future:** Replace `FilePersistentStore` with `DatabasePersistentStore`

**Interface:** Same `PersistentStore` interface

**Migration:** Load from files, write to database

---

## Summary

**What we built:**
- Append-only log with checksums
- Persistent checkpoints with checksums
- Crash consistency (write-ahead logging, atomic writes)
- Integrity validation (checksum verification)

**What we guarantee:**
- Durability (entries persisted to disk)
- Integrity (checksums validate data)
- Consistency (atomic writes, no partial state)
- Recovery (state can be restored from log)

**What we don't guarantee (yet):**
- High throughput (file-based, not optimized)
- Distributed storage (single-node only)
- Encryption (plain text)
- Replication (single copy)

**Phase 5B:** Basic persistence and durability  
**Phase 6:** Recovery validation and guarantees  
**Phase 7:** Log compaction and operational maturity

---

**Persistence architecture complete. System is durable, crash-consistent, and operationally mature.**
