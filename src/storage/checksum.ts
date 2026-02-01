/**
 * Checksum Utilities
 * 
 * Provides integrity checking for persistent storage.
 * Uses SHA-256 for checksums.
 */

import { createHash } from "crypto";

/**
 * Compute SHA-256 checksum of a string
 */
export function computeChecksum(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Verify checksum
 */
export function verifyChecksum(data: string, expectedChecksum: string): boolean {
  const actualChecksum = computeChecksum(data);
  return actualChecksum === expectedChecksum;
}

/**
 * Compute checksum of an object (JSON stringified)
 */
export function computeObjectChecksum(obj: unknown): string {
  const json = JSON.stringify(obj);
  return computeChecksum(json);
}

/**
 * Verify object checksum
 */
export function verifyObjectChecksum(
  obj: unknown,
  expectedChecksum: string
): boolean {
  const actualChecksum = computeObjectChecksum(obj);
  return actualChecksum === expectedChecksum;
}
