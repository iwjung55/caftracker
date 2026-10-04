import { describe, expect, it } from 'vitest';
import type { CaffeineEntry } from '.';
import { quickDrinks } from './derive';
import { DRINKS } from './drinks';

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

describe('quickDrinks', () => {
  it('keeps today’s logging from reshuffling the keys', () => {
    const history = [entry(at(9, 0, -1), 64, 'Espresso', 'espresso')];
    const before = quickDrinks(history, [], at(4)).map((d) => d.id);
    const today = [...history, ...Array.from({ length: 5 }, (_, i) => entry(at(9 + i), 47, 'Black tea', 'black-tea'))];
    expect(quickDrinks(today, [], at(4)).map((d) => d.id)).toEqual(before);
    expect(DRINKS.length).toBeGreaterThan(10);
  });
});
