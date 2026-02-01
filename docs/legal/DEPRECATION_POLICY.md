# Deprecation Policy

**Version 1.0 (v1.x frozen) Declaration & Stability Commitment**
Any incompatible change to this policy requires a major version increment.

This document defines how deprecations are announced, supported, and removed in Continuum.

---

## Deprecation Process

### 1. Announcement

**When:** Deprecations are announced in MINOR versions

**How:**
- Deprecation notice in changelog
- Deprecation warnings in code (if applicable)
- Migration guide provided
- Clear removal timeline specified

**What is announced:**
- What is being deprecated (API, feature, guarantee)
- Why it is being deprecated
- When it will be removed (minimum support window)
- How to migrate (migration guide)

---

### 2. Support Window

**Minimum support window:** At least one MINOR version before removal

**Example:**
- Deprecated in v1.1.0
- Removed in v1.3.0 (or later)
- Minimum: v1.1.0 → v1.2.0 → v1.3.0 (2 minor versions)

**What this means:**
- Deprecated APIs remain functional during support window
- Deprecated guarantees remain valid during support window
- Deprecated features remain available during support window
- Breaking removals only occur in MAJOR versions

---

### 3. Migration Guidance

**Provided for all deprecations:**
- Migration guide (step-by-step instructions)
- Code examples (before/after)
- Common patterns (how to replace deprecated usage)
- Timeline (when to migrate)

**Migration guides include:**
- What to replace deprecated API with
- How to update code
- What behavior changes (if any)
- What guarantees change (if any)

---

### 4. Removal

**When:** Breaking removals only occur in MAJOR versions

**Process:**
- Deprecated in previous major version (e.g., v1.x)
- Removed in new major version (e.g., v2.0.0)
- Migration guide provided
- Changelog documents removal

**What is removed:**
- Deprecated public APIs
- Deprecated public types
- Deprecated guarantees (if any)
- Deprecated features

**What is not removed:**
- Internal APIs (may change without deprecation)
- Undefined behaviors (may change without deprecation)

---

## Deprecation Types

### 1. API Deprecation

**What:** Public API methods or types are deprecated

**Example:**
- Method `oldMethod()` deprecated in v1.1.0
- Replacement: `newMethod()` (available in v1.1.0)
- Removed in v2.0.0

**Process:**
1. Announce in v1.1.0 changelog
2. Add deprecation warning (if applicable)
3. Provide migration guide
4. Support until v2.0.0
5. Remove in v2.0.0

---

### 2. Guarantee Deprecation

**What:** Guarantees are deprecated (weakened or removed)

**Example:**
- Guarantee "X" deprecated in v1.1.0
- Replacement: Guarantee "Y" (available in v1.1.0)
- Removed in v2.0.0

**Process:**
1. Announce in v1.1.0 changelog
2. Document in guarantee documentation
3. Provide migration guide
4. Support until v2.0.0
5. Remove in v2.0.0

**Note:** Guarantee deprecations are rare. Most guarantee changes are strengthening (additive), not weakening (removal).

---

### 3. Feature Deprecation

**What:** Features are deprecated (removed or replaced)

**Example:**
- Feature "X" deprecated in v1.1.0
- Replacement: Feature "Y" (available in v1.1.0)
- Removed in v2.0.0

**Process:**
1. Announce in v1.1.0 changelog
2. Document in feature documentation
3. Provide migration guide
4. Support until v2.0.0
5. Remove in v2.0.0

---

## Deprecation Examples

### Example 1: Method Deprecation

**Scenario:** `MemoryStore.oldMethod()` is deprecated in favor of `MemoryStore.newMethod()`

**v1.1.0 (Deprecation):**
```typescript
// Deprecated: Use newMethod() instead
// @deprecated Will be removed in v2.0.0
async oldMethod(): Promise<void> {
  // Implementation remains functional
  return this.newMethod();
}
```

**Changelog:**
- `MemoryStore.oldMethod()` is deprecated. Use `MemoryStore.newMethod()` instead. Will be removed in v2.0.0.

**Migration guide:**
- Replace `store.oldMethod()` with `store.newMethod()`
- Behavior is identical
- No code changes required (if using replacement)

**v2.0.0 (Removal):**
- `MemoryStore.oldMethod()` removed. Use `MemoryStore.newMethod()` instead.

---

### Example 2: Type Deprecation

**Scenario:** `OldType` is deprecated in favor of `NewType`

**v1.1.0 (Deprecation):**
```typescript
/**
 * @deprecated Use NewType instead. Will be removed in v2.0.0.
 */
export type OldType = {
  // Type definition remains
};
```

**Changelog:**
- `OldType` is deprecated. Use `NewType` instead. Will be removed in v2.0.0.

**Migration guide:**
- Replace `OldType` with `NewType`
- Types are compatible (or migration guide explains differences)

**v2.0.0 (Removal):**
- `OldType` removed. Use `NewType` instead.

---

## Internal APIs

**Internal APIs are NOT subject to deprecation policy:**

- Implementation classes
- Testing frameworks
- Adapter implementations
- Internal utilities

**Internal APIs may change without:**
- Deprecation notices
- Support windows
- Migration guides

**Use public interfaces, not implementations.**

---

## Breaking Changes

**Breaking changes only occur in MAJOR versions:**

- API removals
- Guarantee removals
- Type removals
- Incompatible changes

**Breaking changes are NOT deprecations:**
- Deprecations are announced in MINOR versions
- Breaking changes are announced in MAJOR versions
- Deprecations have support windows
- Breaking changes do not have support windows (they are the change)

**Process:**
1. Deprecate in previous major version (e.g., v1.x)
2. Remove in new major version (e.g., v2.0.0)
3. Provide migration guide
4. Document in changelog

---

## Summary

**Deprecation Process:**
1. ✅ Announcement in MINOR version
2. ✅ Support window (minimum one MINOR version)
3. ✅ Migration guidance provided
4. ✅ Removal in MAJOR version only

**Deprecation Types:**
- API deprecation (methods, types)
- Guarantee deprecation (rare)
- Feature deprecation

**Breaking Changes:**
- Only in MAJOR versions
- Deprecated in previous major version
- Migration guide provided

**Internal APIs:**
- ⚠️ Not subject to deprecation policy
- ⚠️ May change without notice

**This policy ensures smooth migrations and predictable removals.**

---

**Version 1.0 - January 2024**

This document defines deprecation policy. Use it to understand how deprecations work.
