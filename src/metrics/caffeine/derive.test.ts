import { describe, expect, it } from 'vitest';
import type { Settings } from '../../data/types';
import type { CaffeineEntry } from '.';
import { deriveDay, quickDrinks, whatStillFits } from './derive';
import { DRINKS } from './drinks';


const settings: Settings = { v: 1, halfLifeHours: 5, bedtimeMin: 23 * 60, dayStartMin: 4 * 60, dailyLimitMg: 400, bedtimeTargetMg: 30 };
const at = (h: number, m = 0, dayOffset = 0) => {
  const d = new Date(2026, 9, 2 + dayOffset, h, m);
  return d.getTime();
};
const entry = (t: number, mg: number, label = 'Drip coffee', drinkId = 'drip-coffee'): CaffeineEntry => ({
  id: `${t}-${mg}`,
  metric: 'caffeine',
  startAt: t,
  tz: 'UTC',
  value: mg,
  data: { v: 1, label, drinkId },
  createdAt: t,
  updatedAt: t,
});

describe('whatStillFits', () => {
  it('offers a smaller drink once the usual no longer fits', () => {
    const day = deriveDay([entry(at(8), 95)], settings, at(16));
    expect(day.cutoff.kind).toBe('over');
    const r = whatStillFits(day, settings);
    expect(r.kind).toBe('drink');
    if (r.kind === 'drink') {
      expect(r.mg).toBeLessThan(95);
      expect(r.until).toBeGreaterThan(at(16));
    }
  });

  it('says when you drop under target if bedtime is already over', () => {
    const day = deriveDay([entry(at(15), 300, 'Cold brew', 'cold-brew')], settings, at(17));
    const r = whatStillFits(day, settings);
    expect(r.kind).toBe('under-at');
    if (r.kind === 'under-at') expect(r.at).toBeGreaterThan(day.bedtime);
  });

  it('falls back to decaf when nothing with caffeine fits', () => {
    const day = deriveDay([], settings, at(22, 30));
    expect(whatStillFits(day, settings).kind).toBe('decaf-only');
  });
});

describe('quickDrinks', () => {
  it('keeps today’s logging from reshuffling the keys', () => {
    const history = [entry(at(9, 0, -1), 64, 'Espresso', 'espresso')];
    const before = quickDrinks(history, [], at(4)).map((d) => d.id);
    const today = [...history, ...Array.from({ length: 5 }, (_, i) => entry(at(9 + i), 47, 'Black tea', 'black-tea'))];
    expect(quickDrinks(today, [], at(4)).map((d) => d.id)).toEqual(before);
    expect(DRINKS.length).toBeGreaterThan(10);
  });
});
