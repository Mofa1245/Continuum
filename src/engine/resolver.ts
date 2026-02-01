/**
 * Resolution Engine
 * 
 * Given a task → return relevant memory
 * Deterministic ordering
 * No AI here
 */

import type { MemoryEntry, ResolveRequest, ResolveResponse } from "../types/memory.js";
import type { IdentityContext } from "../types/identity.js";
import type { MemoryStore } from "./memory-store.js";

export class Resolver {
  constructor(private store: MemoryStore) {}

  async resolve(
    identity: IdentityContext,
    request: ResolveRequest
  ): Promise<ResolveResponse> {
    // Get all relevant memory entries
    const entries = await this.store.resolve(identity, request.task);

    // Group by category
    const constraints = entries.filter((e) => e.category === "constraint");
    const preferences = entries.filter((e) => e.category === "preference");
    const conventions = entries.filter((e) => e.category === "convention");
    const decisions = entries.filter((e) => e.category === "decision");
    const risks = entries.filter((e) => e.category === "risk");

    // Generate warnings from high-priority constraints/risks
    const warnings = this.generateWarnings(constraints, risks);

    return {
      constraints,
      preferences,
      conventions,
      decisions,
      risks,
      warnings,
    };
  }

  private generateWarnings(
    constraints: MemoryEntry[],
    risks: MemoryEntry[]
  ): string[] {
    const warnings: string[] = [];

    // High-confidence constraints become warnings
    for (const constraint of constraints) {
      if (constraint.confidence >= 0.8 && typeof constraint.value === "string") {
        warnings.push(constraint.value);
      }
    }

    // High-confidence risks become warnings
    for (const risk of risks) {
      if (risk.confidence >= 0.8 && typeof risk.value === "string") {
        warnings.push(`Risk: ${risk.value}`);
      }
    }

    return warnings;
  }
}

