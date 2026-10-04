import { describe, expect, it } from 'vitest';
import type { Settings } from '../data/types';
import type { CaffeineEntry } from '../metrics/caffeine';
import { deriveDay } from '../metrics/caffeine/derive';
import { activeAt } from '../metrics/caffeine/model';
import { advise, checkLimits, MIN_GAP_MS, type Option, profileFor, sleepImpact, tagFor } from './engine';

const settings: Settings = { v: 1, halfLifeHours: 5, bedtimeMin: 23 * 60, dayStartMin: 4 * 60, dailyLimitMg: 400, bedtimeTargetMg: 30 };
const at = (h: number, m = 0, dayOffset = 0) => new Date(2026, 9, 5 + dayOffset, h, m).getTime();
let n = 0;
const drink = (t: number, mg: number, label = 'Drip coffee'): CaffeineEntry => ({
  id: `e${n++}`,
  metric: 'caffeine',
  startAt: t,
  tz: 'UTC',
  value: mg,
  data: { v: 1, label },
  createdAt: t,
  updatedAt: t,
});
const OPTIONS: Option[] = [
  { label: 'drip coffee', mg: 95 },
  { label: 'half a drip coffee', mg: 48 },
  { label: 'black tea', mg: 47 },
  { label: 'green tea', mg: 28 },
  { label: 'cold brew', mg: 205 },
];
const run = (entries: CaffeineEntry[], now: number, s: Settings = settings) => {
  const day = deriveDay(entries, s, now);
  return { day, advice: advise(entries, s, day, OPTIONS) };
};

describe('profile', () => {
  it('scales the range with body weight and assumes 70 kg until told', () => {
    const { advice } = run([], at(9));
    expect(advice.profile.weightKnown).toBe(false);
    expect(advice.profile.floorMg).toBe(70);
    expect(advice.profile.ceilingMg).toBe(210);
    const heavy = run([], at(9), { ...settings, bodyWeightKg: 90 }).advice.profile;
    expect(heavy.ceilingMg).toBe(270);
    expect(heavy.maxDoseMg).toBe(200); // never above 200 mg per dose
  });

  it('learns when your day starts from your first drinks', () => {
    const history = [1, 2, 3, 4].map((d) => drink(at(7, 30, -d), 95));
    const day = deriveDay(history, settings, at(8));
    const p = profileFor(history, settings, day);
    expect(p.startLearned).toBe(true);
    expect(new Date(p.focusStart).getHours()).toBe(7);
    expect(new Date(p.focusStart).getMinutes()).toBe(30);
  });
});

describe('advise', () => {
  it('suggests a first drink at the start of a focus day', () => {
    const { advice } = run([], at(9));
    expect(advice.verdict.kind).toBe('have-now');
  });

  it('does not stack a drink right after a big one', () => {
    const { advice } = run([drink(at(10), 205, 'Cold brew')], at(10, 20));
    expect(['set', 'skip-high', 'top-up']).toContain(advice.verdict.kind);
    if (advice.verdict.kind === 'top-up') expect(advice.verdict.at).toBeGreaterThanOrEqual(at(10) + MIN_GAP_MS);
  });

  it('is quiet in the evening after focus hours', () => {
    expect(run([], at(20)).advice.verdict.kind).toBe('outside');
  });

  it('says done for today when any more would hurt sleep', () => {
    const { advice } = run([drink(at(14), 200, 'Energy drink')], at(16, 30));
    expect(['done', 'set', 'skip-high']).toContain(advice.verdict.kind);
    expect(advice.verdict.kind).not.toBe('have-now');
  });

  it('predicts the crash: when caffeine drops below your range', () => {
    const { advice } = run([drink(at(9), 150)], at(10));
    expect(advice.dipAt).not.toBeNull();
    expect(advice.dipAt!).toBeGreaterThan(at(10));
  });

  it('never breaks a hard limit across many random days', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let recommended = 0;
    for (let trial = 0; trial < 400; trial++) {
      const entries: CaffeineEntry[] = [];
      const count = Math.floor(rand() * 5);
      for (let i = 0; i < count; i++) entries.push(drink(at(6 + Math.floor(rand() * 10), Math.floor(rand() * 60)), 20 + Math.floor(rand() * 200)));
      entries.sort((a, b) => a.startAt - b.startAt);
      const now = at(7 + Math.floor(rand() * 12), Math.floor(rand() * 60));
      const s = { ...settings, bodyWeightKg: 45 + Math.floor(rand() * 60) };
      const past = entries.filter((e) => e.startAt <= now);
      const { day, advice } = run(past, now, s);
      const v = advice.verdict;
      if (v.kind !== 'have-now' && v.kind !== 'top-up') continue;
      recommended++;
      const when = v.kind === 'top-up' ? v.at : now;
      const p = advice.profile;
      expect(v.option.mg).toBeLessThanOrEqual(p.maxDoseMg);
      expect(day.todayTotal + v.option.mg).toBeLessThanOrEqual(p.maxDailyMg);
      expect(activeAt([...day.doses, { at: when, mg: v.option.mg }], day.bedtime, day.params)).toBeLessThanOrEqual(s.bedtimeTargetMg + 1e-9);
      const last = Math.max(-Infinity, ...day.doses.map((d) => d.at));
      expect(when).toBeGreaterThanOrEqual(last + MIN_GAP_MS);
      expect(checkLimits(v.option.mg, when, day, p, s)).toBeNull();
    }
    // The property only means something if plenty of random days produced a recommendation.
    expect(recommended).toBeGreaterThan(80);
  });
});

describe('tags and sleep impact', () => {
  it('warns about sleep for a big drink late in the day', () => {
    const { day, advice } = run([], at(17));
    expect(tagFor(205, advice, day, settings)).toMatchObject({ tone: 'warn' });
  });

  it('marks the suggested size as best', () => {
    const { day, advice } = run([], at(9));
    if (advice.verdict.kind !== 'have-now') throw new Error('expected have-now');
    expect(tagFor(advice.verdict.option.mg, advice, day, settings).text).toBe('Best now');
  });

  it('grades sleep impact from caffeine at bedtime', () => {
    expect(sleepImpact(deriveDay([], settings, at(9)), settings)).toBe('low');
    expect(sleepImpact(deriveDay([drink(at(18), 200)], settings, at(18, 30)), settings)).toBe('high');
  });
});
