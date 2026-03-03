/**
 * Structural deep diff: returns path-level differences between stored and current values.
 * Pure function, no side effects. No external libraries.
 */

export interface DiffResult {
  path: string;
  stored: unknown;
  current: unknown;
}

function pathJoin(base: string, key: string | number): string {
  return base === "" ? String(key) : `${base}.${key}`;
}

export function deepDiff(
  stored: unknown,
  current: unknown,
  basePath = "",
  options: { strict?: boolean } = {}
): DiffResult[] {
  const strict = options.strict ?? false;

  const isPrimitive = (x: unknown) => x === null || (typeof x !== "object" && typeof x !== "function");
  if (isPrimitive(stored) || isPrimitive(current)) {
    if (stored !== current) return [{ path: basePath, stored, current }];
    return [];
  }

  if (Array.isArray(stored) && Array.isArray(current)) {
    const out: DiffResult[] = [];
    const maxLen = Math.max(stored.length, current.length);
    for (let i = 0; i < maxLen; i++) {
      const p = pathJoin(basePath, i);
      if (i >= stored.length) {
        if (strict) out.push({ path: p, stored: undefined, current: current[i] });
      } else if (i >= current.length) {
        if (strict) out.push({ path: p, stored: stored[i], current: undefined });
      } else {
        out.push(...deepDiff(stored[i], current[i], p, options));
      }
    }
    return out;
  }

  if (Array.isArray(stored) !== Array.isArray(current)) {
    return [{ path: basePath, stored, current }];
  }

  const so = stored as Record<string, unknown>;
  const co = current as Record<string, unknown>;
  const storedKeys = Object.keys(so);
  const currentKeys = Object.keys(co);
  const keysToCompare = strict
    ? [...new Set([...storedKeys, ...currentKeys])]
    : storedKeys;

  const out: DiffResult[] = [];
  for (const k of keysToCompare) {
    const p = pathJoin(basePath, k);
    if (!(k in so)) {
      if (strict) out.push({ path: p, stored: undefined, current: co[k] });
    } else if (!(k in co)) {
      out.push({ path: p, stored: so[k], current: undefined });
    } else {
      out.push(...deepDiff(so[k], co[k], p, options));
    }
  }
  return out;
}
