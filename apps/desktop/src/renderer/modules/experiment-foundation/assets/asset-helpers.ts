import type { ExperimentFoundationRef } from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

/** Coerce an unknown payload field into a `string[]`, dropping non-strings. */
export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

/** Coerce an unknown payload field into an `ExperimentFoundationRef[]`. */
export function asRefArray(value: unknown): ExperimentFoundationRef[] {
  if (!Array.isArray(value)) return [];
  const out: ExperimentFoundationRef[] = [];
  for (const entry of value) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const candidate = entry as Record<string, unknown>;
      if (typeof candidate.ref_type === 'string' && typeof candidate.ref_id === 'string') {
        out.push({ ref_type: candidate.ref_type, ref_id: candidate.ref_id });
      }
    }
  }
  return out;
}

/** Read a string field from a record payload, returning `fallback` if absent. */
export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Returns the field as-is if it matches the enum, otherwise the fallback. */
export function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

/** Trim each string entry and drop empty results. Useful for aliases / task_types. */
export function trimAndCompact(values: readonly string[]): string[] {
  return values.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

/** Return the existing created_at if present on `base`, else now. */
export function preserveCreatedAt(base: Record<string, unknown> | null): string {
  if (base && typeof base.created_at === 'string') return base.created_at;
  return new Date().toISOString();
}
