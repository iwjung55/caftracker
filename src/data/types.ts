/**
 * The one record shape every metric shares.
 *
 * Caffeine is the first metric; sleep, water, mood, focus and exercise are
 * meant to arrive later as new MetricDefinitions writing this same shape —
 * no new tables, no migrations. Metric-specific fields live in `data`,
 * which carries its own `v` so each metric can evolve independently.
 *
 * Rules (from the architecture review, see docs/architecture.md):
 * - Store the fact, never a derived number (active mg, totals, cutoffs are
 *   computed on read).
 * - Copy values onto the entry (e.g. mg); never reference a mutable preset.
 * - Timestamps are UTC epoch ms; `tz` records where it happened so a
 *   "logical day" can be reconstructed after travel or DST.
 */
export interface Entry<D extends EntryData = EntryData> {
  /** Client-generated UUID — safe to sync later without remapping. */
  id: string;
  /** Registry key, e.g. 'caffeine'. */
  metric: string;
  /** When it happened (not when it was logged). UTC epoch ms. */
  startAt: number;
  /** For interval metrics (sleep, exercise). Absent for point events. */
  endAt?: number;
  /** IANA timezone at logging time, e.g. 'America/New_York'. */
  tz: string;
  /** Canonical unit defined by the metric (mg for caffeine). */
  value: number;
  /** Metric-specific payload. */
  data: D;
  createdAt: number;
  updatedAt: number;
}

export interface EntryData {
  /** Payload schema version for this metric. */
  v: number;
  [key: string]: unknown;
}

export interface Settings {
  v: 1;
  /** Personal caffeine elimination half-life, hours. */
  halfLifeHours: number;
  /** Usual bedtime, minutes after midnight (may be < dayStartMin = after midnight). */
  bedtimeMin: number;
  /** When a "day" starts for totals, minutes after midnight. A 1am espresso belongs to the previous day. */
  dayStartMin: number;
  /** Reference daily ceiling, mg. Shown as a line, not a goal. */
  dailyLimitMg: number;
  /** The most caffeine the user wants still active at bedtime, mg. */
  bedtimeTargetMg: number;
  /** Set once the user has read the "estimate, not medical advice" note. */
  acknowledgedAt?: number;
  /** Last time a backup was exported — drives the "back up" lamp. */
  lastExportAt?: number;
}
