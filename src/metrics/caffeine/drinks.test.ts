import { describe, expect, it } from 'vitest';
import { DEFAULT_QUICK_IDS, DRINKS } from './drinks';

describe('drink catalog', () => {
  it('has unique ids and sane values', () => {
    const ids = DRINKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DRINKS) {
      expect(d.mg).toBeGreaterThan(0);
      expect(d.mg).toBeLessThanOrEqual(500);
      if (d.range) {
        expect(d.range[0]).toBeLessThanOrEqual(d.mg);
        expect(d.range[1]).toBeGreaterThanOrEqual(d.mg);
      }
    }
  });

  it('offers a wide range of energy drinks', () => {
    expect(DRINKS.filter((d) => d.kind === 'energy' && d.brand).length).toBeGreaterThanOrEqual(25);
  });

  it('only defaults to drinks that exist', () => {
    for (const id of DEFAULT_QUICK_IDS) expect(DRINKS.some((d) => d.id === id)).toBe(true);
  });
});
