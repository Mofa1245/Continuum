# Internal APIs

**Phase 8: Production Hardening & Interface Stability**

This document clearly marks what is internal (unstable) vs public (stable).

**Internal APIs may change without notice. Don't rely on them.**

---

## Public APIs (Stable)

**These are public, stable, and will not change without a major version bump:**

### Core Interfaces

- `MemoryStore` - Memory operations interface
- `AgentRunStore` - Agent run operations interface
- `PersistentStore` - Persistence operations interface
- `ReplayEngine` - Replay operations class

### Core Types

- `MemoryEntry` - Memory entry type
- `AgentRun` - Agent run type
- `AgentStep` - Agent step type
- `MemoryCheckpoint` - Checkpoint type
- `IdentityContext` - Identity context type
- `MemoryFilters` - Memory filter type
- `CreateAgentRunInput` - Run creation input
- `AppendStepInput` - Step append input
- `ReplayConfig` - Replay configuration
- `ReplayResult` - Replay result
- `CreateCheckpointInput` - Checkpoint creation input
- `CompactionResult` - Compaction result

### Utility Functions

- `computeChecksum()` - Compute checksum
- `verifyChecksum()` - Verify checksum
- `computeObjectChecksum()` - Compute object checksum
- `verifyObjectChecksum()` - Verify object checksum

---

## Internal APIs (Unstable)

**These are internal and may change without notice:**

### Implementation Classes

- `InMemoryStore` - Memory store implementation
- `InMemoryAgentRunStore` - Agent run store implementation
- `FilePersistentStore` - Persistent store implementation
- `FileStorage` - Storage implementation (legacy)
- `Resolver` - Resolution implementation
- `MinimalAgent` - Minimal agent implementation

**Why internal:**
- Implementation details
- May be replaced with different implementations
- Not part of public contract

**Don't rely on:**
- Class names
- Constructor signatures
- Internal methods
- Implementation details

---

### Testing Frameworks

- `FaultInjectionTester` - Fault injection testing
- `NondeterminismAuditor` - Nondeterminism audit
- `CrashRecoveryTester` - Crash recovery testing
- `CorruptionInjectionTester` - Corruption injection testing
- `CompactionValidationTester` - Compaction validation testing

**Why internal:**
- Testing tools only
- Not for production use
- May change for testing needs

**Don't use in production code.**

---

### Adapter Implementations

- `LangGraphAdapter` - LangGraph integration
- `CrewAIAdapter` - CrewAI integration

**Why internal:**
- Framework-specific implementations
- May change with framework updates
- Not part of core contract

**Use adapters, but don't rely on implementation details.**

---

### Utility Functions (Internal)

- `assertInvariant()` - Invariant assertion (dev-time only)
- `assertDefined()` - Defined assertion (dev-time only)
- `assertNonEmptyString()` - Non-empty string assertion (dev-time only)
- `assertInRange01()` - Range assertion (dev-time only)

**Why internal:**
- Development tools only
- Disabled in production
- Not for external use

**Don't use in production code.**

---

## API Stability Guarantees

### Stable (Post-1.0)

**These will not change without major version bump:**
- Public interfaces (MemoryStore, AgentRunStore, etc.)
- Public types (MemoryEntry, AgentRun, etc.)
- Public method signatures
- Public error types

### Unstable (Pre-1.0)

**These may change without notice:**
- Implementation classes
- Testing frameworks
- Adapter implementations
- Internal utilities

---

## How to Use Public APIs

**Use interfaces, not implementations:**
```typescript
// ✅ Good: Use interface
const store: MemoryStore = new InMemoryStore(persistentStore);

// ❌ Bad: Rely on implementation
const store = new InMemoryStore(persistentStore);
// Don't rely on InMemoryStore-specific methods
```

**Use types, not classes:**
```typescript
// ✅ Good: Use type
function processRun(run: AgentRun): void { ... }

// ❌ Bad: Rely on class
function processRun(run: InMemoryAgentRunStore): void { ... }
```

**Handle errors, don't ignore:**
```typescript
// ✅ Good: Handle errors
try {
  const run = await runStore.get(runId, orgId);
  if (!run) {
    // Handle missing run
  }
} catch (error) {
  // Handle error
}

// ❌ Bad: Ignore errors
const run = await runStore.get(runId, orgId); // May throw
```

---

## Migration Path

**If internal APIs change:**

1. **Check changelog** - Breaking changes documented
2. **Update code** - Use new internal APIs
3. **Test thoroughly** - Internal changes may affect behavior
4. **Report issues** - If internal changes break your code

**Public APIs won't change without major version bump.**

---

## Summary

**Public APIs:**
- ✅ Stable and documented
- ✅ Won't change without major version bump
- ✅ Safe to rely on

**Internal APIs:**
- ⚠️ Unstable and may change
- ⚠️ Don't rely on implementation details
- ⚠️ Use interfaces, not classes

**Use public APIs for production code. Internal APIs are for implementation only.**

---

**Version 1.0 - January 2024**

This document marks internal vs public APIs. Use it to build stable integrations.
