# Recovery Guarantees

This document specifies explicit recovery guarantees for the persistence layer. These guarantees define behavior after crashes or on-disk corruption.

**Version 1.0 (v1.x guarantees frozen)**  
Any incompatible change requires a major version increment.

**Semantics are validated, not extended.**

---

## Guarantee Scope

**What this covers:**
- Crash recovery (process crashes during writes)
- Corruption detection (data corruption on disk)
- Recovery behavior (what happens after crash/corruption)

**What this does NOT cover:**
- Performance guarantees (not specified)
- Availability guarantees (not specified)
- Security guarantees (not specified)
- Distributed recovery (single-node only)

This document applies only to the persistence layer. It does not guarantee recovery of higher-level semantic state.

---

## Recovery Guarantees

### 1. Log Entry Recovery

**Guarantee:** If a log entry is successfully written (fsync completes), it will be recovered on restart.

**What this means:**
- Entries written before crash are recovered
- Entries written during crash may be lost
- Recovery is per-entry (no multi-entry atomicity is guaranteed)

**Failure scenarios:**

#### Scenario 1.1: Crash During Log Write (Partial Write)

**What happens:** Process crashes after writing partial JSON to log.

**Recovery behavior:**
- Partial entry is skipped (JSON parse fails)
- Previous entries are recovered
- System continues with valid entries

**Guarantee:** No data loss for entries written before crash. Partial entry is lost (expected).

**Detection:** JSON parse error during load.

**Recovery status:** ✅ Partial recovery (valid entries recovered, corrupted entry skipped)

---

#### Scenario 1.2: Missing Log File

**What happens:** Log file doesn't exist (first run or deleted).

**Recovery behavior:**
- Empty entries array returned
- No crash
- System continues normally

**Guarantee:** Missing log file is handled gracefully. No data loss (no data existed).

**Detection:** File not found (ENOENT).

**Recovery status:** ✅ Recovered (empty state, no crash)

---

#### Scenario 1.3: Corrupted Log Entry (Checksum Mismatch)

**What happens:** Log entry has valid JSON but wrong checksum.

**Recovery behavior:**
- Entry with wrong checksum is skipped
- Other entries are recovered
- Warning logged

**Guarantee:** Corrupted entries are detected and skipped. Valid entries are recovered.

**Detection:** Checksum verification fails.

**Recovery status:** ✅ Partial recovery (valid entries recovered, corrupted entry skipped)

---

#### Scenario 1.4: Corrupted Log Entry (Invalid JSON)

**What happens:** Log entry has invalid JSON structure.

**Recovery behavior:**
- Invalid entry is skipped (JSON parse fails)
- Other entries are recovered
- Warning logged

**Guarantee:** Invalid entries are detected and skipped. Valid entries are recovered.

**Detection:** JSON parse error.

**Recovery status:** ✅ Partial recovery (valid entries recovered, corrupted entry skipped)

---

#### Scenario 1.5: Complete Log Corruption

**What happens:** Entire log file is corrupted (not readable JSON).

**Recovery behavior:**
- Empty entries array returned
- No crash
- System continues normally

**Guarantee:** Complete corruption is handled gracefully. No data loss (data was already corrupted).

**Detection:** All entries fail JSON parse or checksum verification.

**Recovery status:** ✅ Recovered (empty state, no crash)

---

### 2. Checkpoint Recovery

**Guarantee:** If a checkpoint is successfully written (atomic write completes), it will be recovered on restart.

**What this means:**
- Checkpoints written before crash are recovered
- Checkpoints written during crash may be lost
- Recovery validates checksums

**Failure scenarios:**

#### Scenario 2.1: Crash During Checkpoint Write (Temp File Exists)

**What happens:** Process crashes while writing checkpoint (temp file exists, final file doesn't).

**Recovery behavior:**
- Temp file is ignored (not a valid checkpoint)
- Previous checkpoints are recovered
- Incomplete checkpoint is not loaded

**Guarantee:** Only complete checkpoints are loaded. Temp files are ignored.

**Detection:** Checkpoint file doesn't exist (only temp file exists).

**Recovery status:** ✅ Recovered (previous checkpoints intact, incomplete checkpoint not loaded)

---

#### Scenario 2.2: Missing Checkpoint File

**What happens:** Checkpoint file doesn't exist.

**Recovery behavior:**
- null returned
- No crash
- System continues normally

**Guarantee:** Missing checkpoint is handled gracefully. No data loss (checkpoint didn't exist).

**Detection:** File not found (ENOENT).

**Recovery status:** ✅ Recovered (null returned, no crash)

---

#### Scenario 2.3: Corrupted Checkpoint (Checksum Mismatch)

**What happens:** Checkpoint file has valid JSON but wrong checksum.

**Recovery behavior:**
- Checksum verification fails
- Error thrown
- Checkpoint cannot be used

**Guarantee:** Corrupted checkpoints are detected and rejected. System does not use corrupted data.

**Detection:** Checksum verification fails on load.

**Recovery status:** ❌ Failed (checkpoint rejected, error thrown)

**Note:** This is expected behavior. Corrupted checkpoints cannot be used for replay.

---

#### Scenario 2.4: Corrupted Checkpoint (Invalid JSON)

**What happens:** Checkpoint file has invalid JSON structure.

**Recovery behavior:**
- JSON parse fails
- Error thrown or null returned
- Checkpoint cannot be used

**Guarantee:** Invalid checkpoints are detected and rejected. System does not use corrupted data.

**Detection:** JSON parse error.

**Recovery status:** ❌ Failed (checkpoint rejected, error thrown or null returned)

**Note:** This is expected behavior. Invalid checkpoints cannot be used for replay.

---

## Recovery Guarantee Summary

| Scenario | Detection | Recovery | Data Loss |
|----------|-----------|---------|-----------|
| Crash during log write | ✅ JSON parse error | ✅ Partial (valid entries recovered) | ⚠️ Partial entry lost |
| Missing log file | ✅ File not found | ✅ Empty state | ❌ None (no data existed) |
| Corrupted log entry (checksum) | ✅ Checksum mismatch | ✅ Partial (other entries recovered) | ⚠️ Corrupted entry lost |
| Corrupted log entry (JSON) | ✅ JSON parse error | ✅ Partial (other entries recovered) | ⚠️ Corrupted entry lost |
| Complete log corruption | ✅ All entries fail | ✅ Empty state | ⚠️ All entries lost |
| Crash during checkpoint write | ✅ File not found | ✅ Previous checkpoints intact | ⚠️ Incomplete checkpoint lost |
| Missing checkpoint file | ✅ File not found | ✅ null returned | ❌ None (checkpoint didn't exist) |
| Corrupted checkpoint (checksum) | ✅ Checksum mismatch | ❌ Error thrown | ⚠️ Checkpoint unusable |
| Corrupted checkpoint (JSON) | ✅ JSON parse error | ❌ Error thrown | ⚠️ Checkpoint unusable |

---

## What We Guarantee

**For log entries:**
1. ✅ Entries written before crash are recovered
2. ✅ Corrupted entries are detected and skipped
3. ✅ Valid entries are recovered even if some are corrupted
4. ✅ Missing log file returns empty array (no crash)
5. ✅ Complete corruption returns empty array (no crash)

**For checkpoints:**
1. ✅ Checkpoints written before crash are recovered
2. ✅ Corrupted checkpoints are detected and rejected
3. ✅ Missing checkpoint returns null (no crash)
4. ✅ Temp files are ignored (incomplete checkpoints not loaded)
5. ❌ Corrupted checkpoints cannot be used (error thrown)

---

## What We Don't Guarantee

**We don't guarantee:**
- Automatic repair of corrupted data (corruption is detected, not fixed)
- Recovery of partial writes (partial writes are lost)
- Recovery of checkpoints written during crash (only complete checkpoints are loaded)
- Performance of recovery (recovery may be slow for large logs)
- Atomic recovery of multiple entries (recovery is per-entry)

**These are limitations, not bugs. We detect corruption and skip it, we don't repair it.**

---

## Recovery Behavior Rules

**Rule 1: Fail-safe**
- Missing files return empty/null (no crash)
- Corrupted data is skipped (no crash)
- System continues with valid data

**Rule 2: Detect, don't repair**
- Corruption is detected and reported
- Corrupted data is skipped, not repaired
- User must fix corruption manually

**Rule 3: Partial recovery is acceptable**
- Some entries may be lost due to corruption
- Valid entries are recovered
- System continues with partial data

**Rule 4: Checkpoints are strict**
- Corrupted checkpoints are rejected (error thrown)
- Checkpoints must be valid to be used
- No partial checkpoint recovery

---

## Validation

**These guarantees are validated by:**
- Crash recovery tests (`src/testing/persistence-recovery.ts`)
- Corruption injection tests (`src/testing/corruption-injection.ts`)
- Test suite (`examples/persistence-recovery-tests.ts`)

**Run tests:**
```bash
npm run build
npx tsx examples/persistence-recovery-tests.ts
```

**All tests must pass to validate these guarantees.**

---


**Version 1.0 (v1.x guarantees frozen)**  
These guarantees define what the persistence layer does, not what it should do.
