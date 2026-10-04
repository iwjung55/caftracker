/**
 * Suggestions — computed on the device from drinks alone.
 *
 * The only thing a person enters is what they drank. From that and the
 * absorption model, the engine keeps them inside a personal *focus range*
 * of caffeine during their focus hours: enough to help (floor), not so much
 * that it turns into jitters (ceiling), and without a crash — a slide below
 * the floor before the day's work is done. Hard limits (sleep, per dose,
 * per day, spacing) are fixed rules that the scoring can never overrule.
 *
 * Research behind the numbers: docs/research.md. Design:
 * docs/superpowers/specs/2026-10-03-focus-advisor-design.md (revision 2).
 */

import type { Settings } from '../data/types';
import type { CaffeineEntry } from '../metrics/caffeine';
import type { CaffeineDay } from '../metrics/caffeine/derive';
import { activeAt, type Dose, timeUnder } from '../metrics/caffeine/model';
import { DAY, HOUR, MINUTE, shiftLogicalDay } from '../lib/time';

/** Used until the person adds their weight in Settings. */
export const ASSUMED_WEIGHT_KG = 70;
/** Active caffeine where alertness benefits reliably show up (~70 mg at 70 kg; EFSA's 75 mg claim). */
export const FLOOR_MG_PER_KG = 1;
/** Above this, jitters and diminishing returns (≈ the 3 mg/kg single-dose reference). */
export const CEILING_MG_PER_KG = 3;
/** Per-dose limit: EFSA ≈3 mg/kg, never more than 200 mg. */
export const MAX_DOSE_MG_PER_KG = 3;
export const MAX_DOSE_MG = 200;
/** Per-day limit: EFSA 400 mg ≈ 5.7 mg/kg. */
export const MAX_DAILY_MG_PER_KG = 5.7;
/** Don't stack a new dose on one that's still being absorbed. */
export const MIN_GAP_MS = 45 * MINUTE;
export const DEFAULT_FOCUS_START_MIN = 9 * 60;
export const DEFAULT_FOCUS_END_MIN = 18 * 60;

const STEP = 5 * MINUTE;

export interface Option {
  label: string;
  mg: number;
  drinkId?: string;
}

export interface Profile {
  weightKg: number;
  weightKnown: boolean;
  /** Today's focus window, epoch ms. */
  focusStart: number;
  focusEnd: number;
  /** True when the start comes from your drinking history rather than Settings. */
  startLearned: boolean;
  floorMg: number;
  ceilingMg: number;
  maxDoseMg: number;
  maxDailyMg: number;
  /** 7-day average intake, mg/day. */
  tolerance: number;
}

export type Verdict =
  | { kind: 'have-now'; option: Option; inRangeUntil: number | null }
  | { kind: 'top-up'; option: Option; at: number }
  | { kind: 'set'; until: number | null }
  | { kind: 'skip-high' }
  | { kind: 'done'; reason: 'sleep' | 'daily' }
  | { kind: 'outside'; nextStart: number; when: 'before' | 'after' };

export interface Advice {
  verdict: Verdict;
  profile: Profile;
  /** When caffeine will fall back below your focus range during focus hours (the crash), if it will. */
  dipAt: number | null;
  /** The highest level coming in the next 3 h — tells "rising" apart from "low" right after a drink. */
  peakAhead: { mg: number; at: number };
  bedtime: number;
}

/** Minute-of-day helper using local time. */
const minuteOfDay = (t: number) => {
  const d = new Date(t);
  return d.getHours() * 60 + d.getMinutes();
};

const atMinute = (dayStart: number, min: number, dayStartMin: number) => {
  const d = new Date(dayStart);
  if (min < dayStartMin) d.setDate(d.getDate() + 1);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d.getTime();
};

/**
 * Learned from drinks only: when your day usually starts (median first-drink
 * time over the last 14 days, needs ≥ 3 days) and your tolerance.
 */
export function profileFor(entries: readonly CaffeineEntry[], settings: Settings, day: CaffeineDay): Profile {
  const weightKg = settings.bodyWeightKg ?? ASSUMED_WEIGHT_KG;

  const firsts: number[] = [];
  for (let i = 1; i <= 14; i++) {
    const start = shiftLogicalDay(day.dayStart, -i, settings.dayStartMin);
    const first = entries.find((e) => e.startAt >= start && e.startAt < start + DAY);
    if (first) firsts.push((minuteOfDay(first.startAt) - settings.dayStartMin + 1440) % 1440);
  }
  let startMin = settings.focusStartMin;
  let startLearned = false;
  if (startMin === undefined && firsts.length >= 3) {
    firsts.sort((a, b) => a - b);
    const median = firsts[Math.floor(firsts.length / 2)]!;
    startMin = (Math.round(median / 15) * 15 + settings.dayStartMin) % 1440;
    startLearned = true;
  }
  startMin ??= DEFAULT_FOCUS_START_MIN;
  const endMin = settings.focusEndMin ?? DEFAULT_FOCUS_END_MIN;

  const weekAgo = shiftLogicalDay(day.dayStart, -7, settings.dayStartMin);
  const tolerance = entries.filter((e) => e.startAt >= weekAgo && e.startAt < day.dayStart).reduce((s, e) => s + e.value, 0) / 7;
  // Regular drinkers feel less from the same level; raise the floor a little (at most 25%).
  const toleranceScale = 1 + 0.25 * Math.min(1, tolerance / 400);

  return {
    weightKg,
    weightKnown: settings.bodyWeightKg !== undefined,
    focusStart: atMinute(day.dayStart, startMin, settings.dayStartMin),
    focusEnd: atMinute(day.dayStart, endMin, settings.dayStartMin),
    startLearned,
    floorMg: Math.round(FLOOR_MG_PER_KG * weightKg * toleranceScale),
    ceilingMg: Math.round(CEILING_MG_PER_KG * weightKg),
    maxDoseMg: Math.min(MAX_DOSE_MG, round5(MAX_DOSE_MG_PER_KG * weightKg)),
    maxDailyMg: Math.min(settings.dailyLimitMg, round5(MAX_DAILY_MG_PER_KG * weightKg)),
    tolerance,
  };
}

const round5 = (mg: number) => Math.round(mg / 5) * 5;

/** How useful a given active level is, 0–1: full inside the range, partial below, falling off fast above. */
function utility(mg: number, p: Profile): number {
  if (mg < p.floorMg) return mg / p.floorMg;
  if (mg <= p.ceilingMg) return 1;
  return Math.max(0, 1 - ((mg - p.ceilingMg) / p.ceilingMg) * 3);
}

interface Simulation {
  score: number;
  peak: number;
}

function simulate(doses: readonly Dose[], from: number, to: number, day: CaffeineDay, p: Profile): Simulation {
  if (to <= from) return { score: 0, peak: activeAt(doses, from, day.params) };
  let sum = 0;
  let n = 0;
  let peak = 0;
  let reachedRange = false;
  let crashed = 0;
  for (let t = from; t <= to; t += STEP) {
    const mg = activeAt(doses, t, day.params);
    peak = Math.max(peak, mg);
    sum += utility(mg, p);
    if (mg >= p.floorMg) reachedRange = true;
    else if (reachedRange) crashed++;
    n++;
  }
  // The crash: time spent sliding back below the range after reaching it.
  return { score: sum / n - 0.5 * (crashed / n), peak };
}

export type Block = 'sleep' | 'daily' | 'dose' | 'gap' | 'jitters';

/** Hard limits for taking `mg` at time `at`. Returns the first limit broken, or null. */
export function checkLimits(mg: number, at: number, day: CaffeineDay, p: Profile, settings: Settings): Block | null {
  const doses: Dose[] = [...day.doses, { at, mg }];
  if (day.now < day.bedtime && activeAt(doses, day.bedtime, day.params) > settings.bedtimeTargetMg) return 'sleep';
  if (mg > p.maxDoseMg) return 'dose';
  if (day.todayTotal + mg > p.maxDailyMg) return 'daily';
  const last = day.doses.reduce((m, d) => Math.max(m, d.at), -Infinity);
  if (at < last + MIN_GAP_MS) return 'gap';
  const peak = Math.max(...[0, 1, 2, 3, 4, 6, 8].map((h) => activeAt(doses, at + h * 15 * MINUTE + 15 * MINUTE, day.params)));
  if (peak > p.ceilingMg) return 'jitters';
  return null;
}

/**
 * Pick the next move. Bold by design (owner's choice): recommend a drink
 * whenever any option beats doing nothing; near-ties go to the smaller
 * dose, then the earlier time.
 */
export function advise(
  entries: readonly CaffeineEntry[],
  settings: Settings,
  day: CaffeineDay,
  options: readonly Option[],
): Advice {
  const p = profileFor(entries, settings, day);
  const now = day.now;
  const windowEnd = Math.min(p.focusEnd, day.bedtime);
  const scoreFrom = Math.max(now, p.focusStart);
  const nowMg = day.activeNow;

  // The crash: walking forward, the first slide back below the floor after being in range
  // (a drink that is still absorbing counts as on its way up, not as a crash).
  const dipAt = (() => {
    let inRange = false;
    for (let t = now; t <= windowEnd; t += STEP) {
      const mg = activeAt(day.doses, t, day.params);
      if (mg >= p.floorMg) inRange = true;
      else if (inRange) return t;
    }
    return null;
  })();
  const peakAhead = { mg: nowMg, at: now };
  for (let t = now; t <= now + 3 * HOUR; t += STEP) {
    const mg = activeAt(day.doses, t, day.params);
    if (mg > peakAhead.mg) Object.assign(peakAhead, { mg, at: t });
  }

  // Outside the focus window: too early to plan, or the day's work is done.
  if (now >= windowEnd || now < p.focusStart - 3 * HOUR) {
    const before = now < p.focusStart;
    return { verdict: { kind: 'outside', nextStart: before ? p.focusStart : p.focusStart + DAY, when: before ? 'before' : 'after' }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
  }

  const nothing = simulate(day.doses, scoreFrom, windowEnd, day, p);
  const times: number[] = [];
  for (const offset of [0, 30, 60, 90, 120]) {
    const t = now + offset * MINUTE;
    if (t <= windowEnd - 30 * MINUTE) times.push(t);
  }

  type Scored = { option: Option; at: number; score: number };
  let best: Scored | null = null;
  const blocks = new Set<Block>();
  const seen = new Set<number>();
  for (const option of options) {
    if (option.mg < 10 || seen.has(option.mg)) continue;
    seen.add(option.mg);
    for (const at of times) {
      const block = checkLimits(option.mg, at, day, p, settings);
      if (block) {
        if (at === now) blocks.add(block);
        continue;
      }
      const sim = simulate([...day.doses, { at, mg: option.mg }], scoreFrom, windowEnd, day, p);
      const better =
        !best ||
        sim.score > best.score + 0.02 ||
        (Math.abs(sim.score - best.score) <= 0.02 && (option.mg < best.option.mg || (option.mg === best.option.mg && at < best.at)));
      if (better) best = { option, at, score: sim.score };
    }
  }

  if (best && best.score > nothing.score + 0.005) {
    if (best.at - now < 10 * MINUTE) {
      const after = [...day.doses, { at: now, mg: best.option.mg }];
      const until = timeUnder(after, now, p.floorMg, day.params, windowEnd - now);
      return { verdict: { kind: 'have-now', option: best.option, inRangeUntil: until !== null && until <= windowEnd ? until : null }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
    }
    return { verdict: { kind: 'top-up', option: best.option, at: best.at }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
  }

  // Doing nothing is best (or nothing is allowed).
  if (nowMg >= p.ceilingMg * 0.9) return { verdict: { kind: 'skip-high' }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
  if (nowMg >= p.floorMg) return { verdict: { kind: 'set', until: dipAt }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
  if (!best && (blocks.has('sleep') || blocks.has('daily'))) {
    const reason = blocks.has('sleep') ? 'sleep' : 'daily';
    return { verdict: { kind: 'done', reason }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
  }
  return { verdict: { kind: 'set', until: dipAt }, profile: p, dipAt, peakAhead, bedtime: day.bedtime };
}

export type TagTone = 'good' | 'neutral' | 'warn';
export interface Tag {
  tone: TagTone;
  text: string;
}

/** The suggestion shown next to a drink in the add sheet, if you had it now. */
export function tagFor(mg: number, advice: Advice, day: CaffeineDay, settings: Settings): Tag {
  const p = advice.profile;
  const block = checkLimits(mg, day.now, day, p, settings);
  if (block === 'sleep') {
    const bed = activeAt([...day.doses, { at: day.now, mg }], day.bedtime, day.params);
    return { tone: 'warn', text: `Hurts sleep · ≈${Math.round(bed / 5) * 5} mg at bed` };
  }
  if (block === 'dose') return { tone: 'warn', text: `More than one dose should be (${p.maxDoseMg} mg)` };
  if (block === 'daily') return { tone: 'warn', text: 'Over today’s limit' };
  if (block === 'jitters') return { tone: 'warn', text: 'Likely jittery' };
  if (block === 'gap') return { tone: 'neutral', text: 'Soon after your last' };

  const v = advice.verdict;
  if (v.kind === 'have-now') {
    if (Math.abs(mg - v.option.mg) <= Math.max(10, v.option.mg * 0.2)) return { tone: 'good', text: 'Best now' };
    if (mg > v.option.mg) return { tone: 'neutral', text: `More than you need · ~${v.option.mg} mg would do` };
    return { tone: 'good', text: 'Good now' };
  }
  if (v.kind === 'top-up') return { tone: 'neutral', text: `Better at ${new Date(v.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` };
  if (v.kind === 'set' || v.kind === 'skip-high') return { tone: 'neutral', text: 'Not needed now' };
  return { tone: 'neutral', text: 'Fine' };
}

export type SleepImpact = 'low' | 'some' | 'high';

/** Estimated, from caffeine still active at bedtime against your target (no sleep tracking needed). */
export function sleepImpact(day: CaffeineDay, settings: Settings): SleepImpact {
  const bed = day.activeAtBedtime;
  if (bed <= settings.bedtimeTargetMg) return 'low';
  if (bed <= settings.bedtimeTargetMg * 2) return 'some';
  return 'high';
}
