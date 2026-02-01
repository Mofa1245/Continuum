# Failure Modes & Caller Responsibilities

This document specifies failure modes, expected system behavior, and caller responsibilities for all public APIs.

**Version 1.0 (v1.x frozen)**  
Any incompatible change requires a major version increment.

"No state change" means no mutation of memory, logs, checkpoints, or run metadata.

---

## MemoryStore Failure Modes

### Invalid Input

**Failure:** Invalid input provided to `write()`.

**When it happens:**
- Missing required fields (orgId, key, category)
- Invalid types (confidence not number, value wrong type)
- Invalid values (confidence outside [0, 1], empty strings)

**Expected behavior:**
- Error thrown immediately (TypeScript compile-time or runtime)
- No state change
- Clear error message

**Caller responsibility:**
- Validate input before calling
- Handle errors appropriately
- Don't retry with same invalid input

**Recovery:**
- Fix input and retry

---

### Missing Checkpoint

**Failure:** Checkpoint not found during `restoreCheckpoint()`.

**When it happens:**
- Checkpoint was deleted
- Checkpoint ID is wrong
- Checkpoint belongs to different org

**Expected behavior:**
- Error thrown: "Checkpoint not found: {checkpointId}"
- No state change
- Memory remains in current state

**Caller responsibility:**
- Ensure checkpoint exists before restoring
- Handle missing checkpoint errors
- Don't assume checkpoint exists

**Recovery:**
- Create new checkpoint
- Use different checkpoint
- Handle error gracefully

---

### Checkpoint Org Mismatch

**Failure:** Checkpoint belongs to different org than requested.

**When it happens:**
- Wrong orgId passed to `restoreCheckpoint()`
- Checkpoint was created for different org

**Expected behavior:**
- Error thrown: "Checkpoint orgId mismatch: expected {orgId}, got {checkpoint.orgId}"
- No state change

**Caller responsibility:**
- Ensure orgId matches checkpoint.orgId
- Validate orgId before restoring

**Recovery:**
- Use correct orgId
- Use checkpoint for correct org

---

## AgentRunStore Failure Modes

### Missing Run

**Failure:** Run not found during `get()` or `appendStep()`.

**When it happens:**
- Run ID is wrong
- Run was deleted
- Run belongs to different org

**Expected behavior:**
- `get()` returns null
- `appendStep()` throws error: "Run not found: {runId}"
- No state change

**Caller responsibility:**
- Ensure run exists before appending steps
- Handle null return from `get()`
- Validate runId before operations

**Recovery:**
- Create new run
- Use correct runId
- Handle error gracefully

---

### Invalid Step Order

**Failure:** Step appended out of order.

**When it happens:**
- Step number doesn't match expected sequence
- Steps skipped (stepNumber 1, 3, 4 - missing 2)

**Expected behavior:**
- Behavior is out of scope and not guaranteed.
- May cause replay issues

**Caller responsibility:**
- Append steps sequentially (1, 2, 3...)
- Don't skip step numbers
- Don't append steps out of order

**Recovery:**
- Append steps in correct order
- Fix step numbers

---

### Run Status Transition

**Failure:** Invalid status transition attempted.

**When it happens:**
- Trying to complete already completed run
- Trying to cancel already failed run

**Expected behavior:**
- Behavior is out of scope and not guaranteed.
- May cause inconsistent state

**Caller responsibility:**
- Only transition status forward (running → completed/failed/cancelled)
- Don't modify completed/failed runs
- Validate status before transitions

**Recovery:**
- Don't modify completed runs
- Create new run if needed

---

## PersistentStore Failure Modes

Note: PersistentStore failure modes apply only when a persistence-backed deployment is used.

### Disk Full

**Failure:** Disk is full during `appendEntry()` or `saveCheckpoint()`.

**When it happens:**
- Disk space exhausted
- Quota exceeded
- Permission denied

**Expected behavior:**
- Error thrown (ENOSPC or permission error)
- No state change
- Previous entries intact

**Caller responsibility:**
- Monitor disk space
- Handle disk full errors
- Free up space before retrying

**Recovery:**
- Free up disk space
- Compact logs (reduce size)
- Retry operation

---

### Corrupted Log Entry

**Failure:** Log entry is corrupted (checksum mismatch or invalid JSON).

**When it happens:**
- Disk corruption
- Partial write
- Manual file modification

**Expected behavior:**
- Corrupted entry skipped during `loadEntries()`
- Warning logged
- Valid entries recovered
- System continues

**Caller responsibility:**
- Don't modify log files directly
- Monitor for corruption warnings
- Back up logs regularly

**Recovery:**
- Corrupted entry is lost (cannot recover)
- Valid entries remain intact
- System continues with partial data

---

### Corrupted Checkpoint

**Failure:** Checkpoint file is corrupted (checksum mismatch or invalid JSON).

**When it happens:**
- Disk corruption
- Partial write
- Manual file modification

**Expected behavior:**
- Error thrown during `loadCheckpoint()`
- Checkpoint cannot be used
- System continues (can create new checkpoint)

**Caller responsibility:**
- Don't modify checkpoint files directly
- Handle checkpoint corruption errors
- Create new checkpoint if needed

**Recovery:**
- Corrupted checkpoint is unusable
- Create new checkpoint
- Replay fails (expected)

---

### Compaction Failure

**Failure:** Compaction fails (verification error, I/O error).

**When it happens:**
- Temp file verification fails
- Disk full during compaction
- Permission denied

**Expected behavior:**
- Error thrown
- Original log preserved
- Temp file deleted
- No state change

**Caller responsibility:**
- Don't compact during heavy write load
- Ensure disk space available
- Handle compaction errors

**Recovery:**
- Original log intact
- Fix issue (disk space, permissions)
- Retry compaction

---

## ReplayEngine Failure Modes

### Missing Checkpoint

**Failure:** Run has no checkpointId or checkpoint doesn't exist.

**When it happens:**
- Run created before checkpoint system
- Checkpoint was deleted
- Checkpoint belongs to different org

**Expected behavior:**
- Error thrown: "Run {runId} has no checkpointId (cannot replay)"
- Replay aborted
- No state change

**Caller responsibility:**
- Ensure run has checkpointId before replay
- Ensure checkpoint exists
- Handle missing checkpoint errors

**Recovery:**
- Cannot replay without checkpoint
- Create new run with checkpoint
- Handle error gracefully

---

### Divergence Detected

**Failure:** Replay produces different output than original.

**When it happens:**
- LLM nondeterminism (seed not supported)
- External API changed
- Memory state differs

**Expected behavior:**
- Divergence detected and reported
- ReplayResult.matched = false
- DivergenceStep indicates where it diverged
- No error thrown (divergence is expected in some cases)

**Caller responsibility:**
- Handle divergence appropriately
- Don't assume replay always matches
- Investigate divergence causes

**Recovery:**
- Divergence is detected, not fixed
- Investigate cause (LLM, API, memory)
- Accept divergence or fix root cause

---

## Common Failure Patterns

### Concurrent Operations

**Failure:** Multiple operations on same resource concurrently.

**When it happens:**
- Multiple writes to same org
- Compaction during writes
- Replay during writes

**Expected behavior:**
- Behavior is out of scope and not guaranteed.
- May cause data corruption
- May cause inconsistent state

**Caller responsibility:**
- Don't perform concurrent operations
- Serialize operations if needed
- Use single-threaded execution

**Recovery:**
- Don't rely on concurrent operations
- Restart with consistent state
- Avoid concurrent access

---

### Resource Exhaustion

**Failure:** System runs out of resources (memory, disk, file handles).

**When it happens:**
- Too many entries in memory
- Log file too large
- Too many file handles open

**Expected behavior:**
- Error thrown (out of memory, disk full, too many files)
- Operation fails
- Previous state intact

**Caller responsibility:**
- Monitor resource usage
- Compact logs regularly
- Close file handles when done
- Handle resource exhaustion errors

**Recovery:**
- Free up resources
- Compact logs
- Restart system
- Increase resource limits

---

## Error Handling Best Practices

### Do

- ✅ Validate input before calling APIs
- ✅ Handle all errors (don't ignore)
- ✅ Check for null/undefined returns
- ✅ Monitor for corruption warnings
- ✅ Close resources when done
- ✅ Serialize operations (no concurrency)

### Don't

- ❌ Ignore errors
- ❌ Retry with same invalid input
- ❌ Modify files directly
- ❌ Perform concurrent operations
- ❌ Assume resources exist
- ❌ Rely on undefined behavior

---

## Summary

**Failure modes are documented, not prevented.**

**System behavior:**
- Errors are thrown (not swallowed)
- State is consistent (or error indicates inconsistency)
- Previous state preserved on failure

**Caller responsibilities:**
- Validate input
- Handle errors
- Don't rely on undefined behavior
- Follow best practices

**This documentation helps you build reliable integrations.**
