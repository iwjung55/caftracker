import type { Settings } from '../../data/types';
import { bedtimeFor, DAY, logicalDayKey, logicalDayStart, shiftLogicalDay } from '../../lib/time';
import type { CaffeineEntry } from '.';
import { DEFAULT_REFERENCE_DOSE_MG, HALF_LIFE_BAND } from './constants';
import { DEFAULT_QUICK_IDS, DRINKS, type Drink, findDrink } from './drinks';
import { activeAt, type CutoffResult, type Dose, latestDoseTime, type ModelParams, timeUnder } from './model';

/** Everything the dashboard shows, derived from raw entries at time `now`. */
export interface CaffeineDay {
  now: number;
  dayStart: number;
  bedtime: number;
  params: ModelParams;
  doses: Dose[];
  activeNow: number;
  activeNowBand: [number, number];
  activeAtBedtime: number;
  activeAtBedtimeBand: [number, number];
  todayEntries: CaffeineEntry[];
  todayTotal: number;
  /** The dose "last cup" is computed for: the user's usual drink. */
  referenceDose: { label: string; mg: number };
  cutoff: CutoffResult;
}

export function toDoses(entries: readonly CaffeineEntry[]): Dose[] {
  return entries.map((e) => ({ at: e.startAt, mg: e.value }));
}

export function deriveDay(entries: readonly CaffeineEntry[], settings: Settings, now: number): CaffeineDay {
  const params: ModelParams = { halfLifeHours: settings.halfLifeHours };
  const lowP = { halfLifeHours: settings.halfLifeHours * HALF_LIFE_BAND.low };
  const highP = { halfLifeHours: settings.halfLifeHours * HALF_LIFE_BAND.high };
  const dayStart = logicalDayStart(now, settings.dayStartMin);
  const bedtime = bedtimeFor(now, settings.bedtimeMin, settings.dayStartMin);
  // Only doses from the last 72 h can still matter.
  const doses = toDoses(entries.filter((e) => e.startAt > now - 3 * DAY && e.startAt <= now + 60_000));
  const todayEntries = entries.filter((e) => e.startAt >= dayStart && e.startAt < dayStart + DAY);
  const referenceDose = usualDose(entries, now);

  return {
    now,
    dayStart,
    bedtime,
    params,
    doses,
    activeNow: activeAt(doses, now, params),
    activeNowBand: [activeAt(doses, now, lowP), activeAt(doses, now, highP)],
    activeAtBedtime: activeAt(doses, bedtime, params),
    activeAtBedtimeBand: [activeAt(doses, bedtime, lowP), activeAt(doses, bedtime, highP)],
    todayEntries,
    todayTotal: todayEntries.reduce((s, e) => s + e.value, 0),
    referenceDose,
    cutoff: latestDoseTime(doses, now, bedtime, referenceDose.mg, settings.bedtimeTargetMg, params),
  };
}

/** The user's most frequent drink over the last two weeks, or a standard coffee. */
export function usualDose(entries: readonly CaffeineEntry[], now: number): { label: string; mg: number } {
  const recent = entries.filter((e) => e.startAt > now - 14 * DAY);
  if (recent.length === 0) return { label: 'coffee', mg: DEFAULT_REFERENCE_DOSE_MG };
  const counts = new Map<string, { n: number; label: string; mg: number; last: number }>();
  for (const e of recent) {
    const key = `${e.data.label}|${e.value}`;
    const c = counts.get(key);
    if (c) {
      c.n++;
      c.last = Math.max(c.last, e.startAt);
    } else counts.set(key, { n: 1, label: e.data.label, mg: e.value, last: e.startAt });
  }
  const best = [...counts.values()].sort((a, b) => b.n - a.n || b.last - a.last)[0]!;
  return { label: best.label.toLowerCase(), mg: best.mg };
}

/**
 * One-tap keys: the drinks this person actually logs (by frequency over
 * 30 days), topped up with sensible defaults.
 */
export function quickDrinks(entries: readonly CaffeineEntry[], custom: readonly Drink[], asOf: number, count = 6): Drink[] {
  // Counted up to `asOf` (the start of today) so keys don't reshuffle mid-day while you log.
  const recent = entries.filter((e) => e.startAt > asOf - 30 * DAY && e.startAt < asOf);
  const counts = new Map<string, number>();
  for (const e of recent) {
    const id = e.data.drinkId;
    if (id && findDrink(id, custom)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const used = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => findDrink(id, custom)!);
  const picks: Drink[] = [];
  for (const d of [...custom, ...used]) if (!picks.some((p) => p.id === d.id)) picks.push(d);
  // Recently used drinks lead; custom "usuals" that were never used still get a key.
  picks.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  for (const id of DEFAULT_QUICK_IDS) {
    if (picks.length >= count) break;
    if (!picks.some((p) => p.id === id)) picks.push(DRINKS.find((d) => d.id === id)!);
  }
  return picks.slice(0, count);
}

export interface ArchiveDay {
  key: string;
  start: number;
  bedtime: number;
  entries: CaffeineEntry[];
  total: number;
}

/** The last `days` logical days, newest first, each with its own entries. */
export function archive(entries: readonly CaffeineEntry[], settings: Settings, now: number, days = 14): ArchiveDay[] {
  const today = logicalDayStart(now, settings.dayStartMin);
  const buckets = new Map<string, CaffeineEntry[]>();
  for (const e of entries) {
    const k = logicalDayKey(e.startAt, settings.dayStartMin);
    const list = buckets.get(k);
    if (list) list.push(e);
    else buckets.set(k, [e]);
  }
  const out: ArchiveDay[] = [];
  for (let i = 0; i < days; i++) {
    const start = shiftLogicalDay(today, -i, settings.dayStartMin);
    const key = logicalDayKey(start, settings.dayStartMin);
    const list = buckets.get(key) ?? [];
    out.push({
      key,
      start,
      bedtime: bedtimeFor(start, settings.bedtimeMin, settings.dayStartMin),
      entries: list,
      total: list.reduce((s, e) => s + e.value, 0),
    });
  }
  return out;
}

/** Round to the nearest 5 mg — the model can't honestly say more than that. */
export const roundMg = (mg: number) => Math.max(0, Math.round(mg / 5) * 5);

export type StillFits =
  /** A smaller drink still keeps bedtime under target if you have it by `until`. */
  | { kind: 'drink'; label: string; mg: number; until: number }
  /** Nothing with meaningful caffeine fits; decaf is fine. */
  | { kind: 'decaf-only' }
  /** Bedtime is already over target; you drop under it at `at` (or not within a day). */
  | { kind: 'under-at'; at: number | null };

/** Smaller, common options to suggest when the usual drink no longer fits. */
const FALLBACK_IDS = ['black-tea', 'cola', 'green-tea', 'dark-chocolate'] as const;

/**
 * "What can I still have?" — the most caffeine among a few common options
 * (half of your usual included) that keeps bedtime under target, and how
 * long it stays available. Answers the evening dead end.
 */
export function whatStillFits(day: CaffeineDay, settings: Settings, quick: readonly Drink[] = []): StillFits {
  const target = settings.bedtimeTargetMg;
  if (day.activeAtBedtime >= target) {
    return { kind: 'under-at', at: timeUnder(day.doses, day.now, target, day.params) };
  }
  const options: { label: string; mg: number }[] = [
    { label: `half a ${day.referenceDose.label}`, mg: Math.round(day.referenceDose.mg / 2) },
    ...quick.map((d) => ({ label: d.label.toLowerCase(), mg: d.mg })),
    ...FALLBACK_IDS.map((id) => DRINKS.find((d) => d.id === id)!).map((d) => ({ label: d.label.toLowerCase(), mg: d.mg })),
  ].filter((o) => o.mg >= 10 && o.mg < day.referenceDose.mg);

  let best: { label: string; mg: number; until: number } | null = null;
  for (const o of options) {
    const r = latestDoseTime(day.doses, day.now, day.bedtime, o.mg, target, day.params);
    if (r.kind !== 'latest') continue;
    if (!best || o.mg > best.mg || (o.mg === best.mg && r.at > best.until)) best = { ...o, until: r.at };
  }
  return best ? { kind: 'drink', ...best } : { kind: 'decaf-only' };
}

/** Cutoff for a specific drink (e.g. the one being considered), against what's already logged. */
export function cutoffFor(day: CaffeineDay, settings: Settings, mg: number): CutoffResult {
  return latestDoseTime(day.doses, day.now, day.bedtime, mg, settings.bedtimeTargetMg, day.params);
}
