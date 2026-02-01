# Versioning Policy

This document defines how Continuum versions are managed, what constitutes breaking changes, and what guarantees are provided for each version level.

**Version 1.0 (v1.x versioning policy frozen)**

---

## Semantic Versioning

Continuum follows [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`

### Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes (API/contract changes)
- **MINOR**: Backward-compatible feature additions
- **PATCH**: Bug fixes, documentation-only changes

---

## Version Components

### MAJOR Version (X.0.0)

**Incremented when:**
- Public API contracts are broken
- Determinism guarantees are changed
- Persistence/recovery guarantees are changed
- Public type definitions are changed in incompatible ways
- Public method signatures are removed or changed incompatibly
- Required invariants are changed
- Error guarantees are changed in incompatible ways

**What constitutes a breaking change:**
- Removing a public method from an interface
- Changing a public method signature (parameters, return type)
- Removing a public type
- Changing a public type in an incompatible way (e.g., making required field optional, changing type)
- Changing determinism guarantees (e.g., weakening guarantees)
- Changing persistence/recovery guarantees (e.g., weakening guarantees)
- Changing error behavior (e.g., method that threw now returns null)

**What does NOT constitute a breaking change:**
- Adding new methods to interfaces (backward compatible)
- Adding new optional parameters (backward compatible)
- Adding new types (backward compatible)
- Strengthening guarantees (additive only; existing guarantees unchanged)
- Fixing bugs (behavioral fixes that align with documented behavior)

**v1.x guarantee:**
- All public APIs remain backward compatible
- All guarantees remain valid
- No breaking changes without major version bump

---

### MINOR Version (1.X.0)

**Incremented when:**
- New features are added (backward compatible)
- New public methods are added to interfaces
- New public types are added
- New optional parameters are added
- Guarantees are strengthened (new guarantees added)
- Performance improvements (behavior unchanged)

**What constitutes a minor change:**
- Adding new methods to `MemoryStore`, `AgentRunStore`, `PersistentStore`, `ReplayEngine`
- Adding new public types (e.g., new input/output types)
- Adding new optional parameters to existing methods
- Adding new guarantees (strengthening, not weakening)
- Adding new features (e.g., new compaction options, new replay features)

**v1.x guarantee:**
- All existing APIs remain functional
- All existing guarantees remain valid
- New features are additive only

---

### PATCH Version (1.0.X)

**Incremented when:**
- Bug fixes (fixing behavior to match documented guarantees)
- Documentation-only changes
- Internal implementation changes (no public API impact)
- Performance optimizations (behavior unchanged)
- Security patches (behavior unchanged)

**What constitutes a patch change:**
- Fixing bugs that violate documented guarantees
- Fixing crashes or incorrect behavior
- Improving error messages (same error, better message)
- Documentation corrections
- Internal refactoring (no public API impact)
- Performance optimizations (same behavior, faster)

**v1.x guarantee:**
- No API changes
- No guarantee changes
- Behavior fixes align with documented guarantees

---

## Version Guarantees

### v1.x Guarantees

**For all v1.x versions (1.0.0, 1.1.0, 1.2.0, etc.):**

1. **Backward Compatibility**
   - All public APIs remain functional
   - All public types remain compatible
   - All guarantees remain valid
   - No breaking changes without major version bump

2. **Stability**
   - Determinism guarantees remain frozen
   - Persistence/recovery guarantees remain frozen
   - Compaction guarantees remain frozen
   - Public API contracts remain frozen

3. **Additive Evolution**
   - New features are additive only
   - New methods are optional (don't break existing code)
   - New types are optional (don't break existing code)
   - Guarantees can be strengthened, not weakened

**v1.x is stable. Breaking changes only occur in v2.0.0+.**

---

## Internal APIs

**Internal APIs are NOT versioned:**

- Implementation classes (InMemoryStore, FilePersistentStore, etc.)
- Testing frameworks
- Adapter implementations
- Internal utilities

**Internal APIs may change without version bumps.**

**Use public interfaces, not implementations.**

---

## Version History

### v1.0.0

**Initial stable release:**
- Core determinism guarantees
- Persistence & recovery guarantees
- Compaction guarantees
- Public API contracts
- Core contracts declared stable

**Status:** Stable, production-ready

---

## Migration Between Versions

### MAJOR Version Migration

**When:** Upgrading from v1.x to v2.0.0+

**Process:**
1. Review changelog for breaking changes
2. Update code to use new APIs
3. Test thoroughly
4. Update integration code

**Support:**
- Deprecation warnings in previous major version
- Migration guides provided
- Minimum support window before removal

### MINOR Version Migration

**When:** Upgrading from v1.0.0 to v1.1.0+

**Process:**
1. Review changelog for new features
2. Optional: Adopt new features
3. No code changes required (backward compatible)

**Support:**
- No breaking changes
- Existing code continues to work
- New features are optional

### PATCH Version Migration

**When:** Upgrading from v1.0.0 to v1.0.1+

**Process:**
1. Review changelog for bug fixes
2. No code changes required
3. Recommended: Upgrade for bug fixes

**Support:**
- No API changes
- No behavior changes (only bug fixes)
- Safe to upgrade

---

## Version Support Policy

### Current Version

**v1.0.0+** - Fully supported

### Previous Versions

**v0.x.x** - Pre-1.0, not supported

**v1.x.x** - Supported until v2.0.0 released

### Deprecation Policy

**See [DEPRECATION_POLICY.md](./DEPRECATION_POLICY.md) for details.**

**Summary:**
- Deprecations announced in minor versions
- Minimum support window before removal
- Breaking removals only in major versions

---

## Summary

**Versioning Rules:**
- MAJOR: Breaking changes (API/contract)
- MINOR: Backward-compatible features
- PATCH: Bug fixes, documentation

**v1.x Guarantees:**
- ✅ Backward compatibility
- ✅ Stability (guarantees frozen)
- ✅ Additive evolution only

**Internal APIs:**
- ⚠️ Not versioned
- ⚠️ May change without notice

**This policy ensures Continuum remains stable and predictable for production use.**

---

**Version 1.0 (v1.x versioning policy frozen)**

This document defines versioning policy. Use it to understand what changes between versions.
