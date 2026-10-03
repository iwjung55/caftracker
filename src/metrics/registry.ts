import type { Entry } from '../data/types';

/**
 * How a metric behaves. Adding sleep, water, or mood later means writing
 * one of these (plus its own card/form) — the storage layer and the entry
 * shape do not change. Kept deliberately thin: no plugin system, no
 * schema-driven UI.
 */
export type MetricKind =
  /** A dose that keeps acting after intake (caffeine). */
  | 'dose'
  /** An amount that simply adds up (water, ml). */
  | 'quantity'
  /** A rating on a fixed scale (mood, focus 1–5). */
  | 'scale'
  /** Something with a start and end (sleep, exercise). */
  | 'interval';

export type Aggregate = 'sum' | 'mean' | 'last' | 'duration';

export interface MetricDefinition {
  id: string;
  label: string;
  /** Canonical unit stored in Entry.value. */
  unit: string;
  kind: MetricKind;
  /** How a day's entries roll up into one number. */
  aggregate: Aggregate;
  /**
   * CSS custom property with this metric's ink. The dashboard is a
   * multi-pen chart recorder: every metric gets its own pen color.
   */
  pen: string;
  /** Health-category data will need explicit consent before any sync. */
  sensitivity: 'lifestyle' | 'health';
  /** Current payload version written to Entry.data.v. */
  dataVersion: number;
  /** Bounds for Entry.value. */
  range: { min: number; max: number };
  /** Metric-specific checks beyond the shared ones; return an error or null. */
  validateData?(entry: Entry): string | null;
}

const registry = new Map<string, MetricDefinition>();

export function registerMetric(def: MetricDefinition): MetricDefinition {
  if (registry.has(def.id)) throw new Error(`Metric "${def.id}" is already registered`);
  registry.set(def.id, def);
  return def;
}

export function getMetric(id: string): MetricDefinition | undefined {
  return registry.get(id);
}

export function listMetrics(): MetricDefinition[] {
  return [...registry.values()];
}

/** Shared validation every entry must pass, then the metric's own. */
export function validateEntry(entry: Entry): string | null {
  const def = registry.get(entry.metric);
  if (!def) return `Unknown metric "${entry.metric}"`;
  if (typeof entry.id !== 'string' || entry.id.length === 0) return 'Missing id';
  if (!Number.isFinite(entry.startAt)) return 'Invalid start time';
  if (entry.endAt !== undefined) {
    if (def.kind !== 'interval') return `${def.label} entries cannot have an end time`;
    if (!Number.isFinite(entry.endAt) || entry.endAt < entry.startAt) return 'End must be after start';
  } else if (def.kind === 'interval') {
    return `${def.label} entries need an end time`;
  }
  if (!Number.isFinite(entry.value)) return 'Invalid value';
  if (entry.value < def.range.min || entry.value > def.range.max) {
    return `${def.label} must be between ${def.range.min} and ${def.range.max} ${def.unit}`;
  }
  if (typeof entry.data !== 'object' || entry.data === null || typeof entry.data.v !== 'number') {
    return 'Missing payload version';
  }
  return def.validateData?.(entry) ?? null;
}

/** Roll a set of same-metric entries up into one number for a day. */
export function aggregate(def: MetricDefinition, entries: readonly Entry[]): number | null {
  if (entries.length === 0) return null;
  switch (def.aggregate) {
    case 'sum':
      return entries.reduce((s, e) => s + e.value, 0);
    case 'mean':
      return entries.reduce((s, e) => s + e.value, 0) / entries.length;
    case 'last':
      return [...entries].sort((a, b) => b.startAt - a.startAt)[0]!.value;
    case 'duration':
      return entries.reduce((s, e) => s + ((e.endAt ?? e.startAt) - e.startAt), 0);
  }
}
