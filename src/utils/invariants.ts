/**
 * Invariant Assertions (Dev-Time Only)
 * 
 * Phase 8: Production Hardening & Interface Stability
 * 
 * These assertions validate invariants at development time.
 * They are disabled in production builds.
 * 
 * Purpose: Catch developer misuse early, not enforce runtime behavior.
 */

/**
 * Assert that a condition is true
 * 
 * Only active in development/test builds.
 * No-op in production.
 */
export function assertInvariant(
  condition: boolean,
  message: string
): asserts condition {
  if (process.env.NODE_ENV !== "production" && !condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}

/**
 * Assert that a value is not null/undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  assertInvariant(value != null, message);
}

/**
 * Assert that a value is a non-empty string
 */
export function assertNonEmptyString(
  value: string | null | undefined,
  message: string
): asserts value is string {
  assertInvariant(
    typeof value === "string" && value.length > 0,
    message
  );
}

/**
 * Assert that a number is positive
 */
export function assertPositive(
  value: number,
  message: string
): void {
  assertInvariant(value > 0, message);
}

/**
 * Assert that a number is in range [0, 1]
 */
export function assertInRange01(
  value: number,
  message: string
): void {
  assertInvariant(value >= 0 && value <= 1, message);
}

/**
 * Assert that an array is not empty
 */
export function assertNonEmpty<T>(
  array: T[],
  message: string
): asserts array is [T, ...T[]] {
  assertInvariant(array.length > 0, message);
}

/**
 * Assert that a Map/Set is not empty
 */
export function assertNonEmptyCollection(
  collection: Map<unknown, unknown> | Set<unknown>,
  message: string
): void {
  assertInvariant(collection.size > 0, message);
}
