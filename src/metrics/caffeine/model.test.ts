import { describe, expect, it } from 'vitest';
import { activeAt, doseActiveAfter, latestDoseTime, timeToPeakMs, timeUnder } from './model';
import { DEFAULT_BEDTIME_TARGET_MG, DEFAULT_HALF_LIFE_HOURS } from './constants';

const H = 3_600_000;
const p = { halfLifeHours: 5 };

describe('doseActiveAfter', () => {
  it('is zero before and at intake', () => {
    expect(doseActiveAfter(100, -H, p)).toBe(0);
    expect(doseActiveAfter(100, 0, p)).toBe(0);
  });

  it('peaks roughly 45 minutes after intake', () => {
    const peak = timeToPeakMs(p);
    expect(peak).toBeGreaterThan(0.6 * H);
    expect(peak).toBeLessThan(0.9 * H);
    expect(doseActiveAfter(100, peak, p)).toBeGreaterThan(doseActiveAfter(100, peak - 10 * 60_000, p));
    expect(doseActiveAfter(100, peak, p)).toBeGreaterThan(doseActiveAfter(100, peak + 10 * 60_000, p));
  });

  it('never exceeds the dose', () => {
    for (let t = 0; t < 24 * H; t += 5 * 60_000) expect(doseActiveAfter(100, t, p)).toBeLessThanOrEqual(100);
  });

  it('roughly halves every half-life once absorbed', () => {
    const at6 = doseActiveAfter(200, 6 * H, p);
    const at11 = doseActiveAfter(200, 11 * H, p);
    expect(at11 / at6).toBeCloseTo(0.5, 2);
  });

  it('decays faster with a shorter half-life', () => {
    expect(doseActiveAfter(100, 8 * H, { halfLifeHours: 3 })).toBeLessThan(doseActiveAfter(100, 8 * H, { halfLifeHours: 7 }));
  });

  it('handles the ka == ke edge case without NaN', () => {
    const v = doseActiveAfter(100, 2 * H, { halfLifeHours: Math.LN2 / 5, ka: 5 });
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });
});

describe('activeAt', () => {
  it('sums doses and ignores future ones', () => {
    const t0 = 1_000 * H;
    const doses = [
      { at: t0, mg: 100 },
      { at: t0 + 2 * H, mg: 100 },
      { at: t0 + 10 * H, mg: 500 },
    ];
    const expected = doseActiveAfter(100, 4 * H, p) + doseActiveAfter(100, 2 * H, p);
    expect(activeAt(doses, t0 + 4 * H, p)).toBeCloseTo(expected, 6);
  });
});

describe('latestDoseTime', () => {
  const morning = 1_000 * H; // treat as 08:00
  const bedtime = morning + 15 * H; // 23:00

  it('finds a cutoff that lands exactly on the target', () => {
    const r = latestDoseTime([], morning, bedtime, 95, 50, p);
    expect(r.kind).toBe('latest');
    if (r.kind !== 'latest') return;
    expect(doseActiveAfter(95, bedtime - r.at, p)).toBeCloseTo(50, 1);
    // ~5 h half-life: 95 mg decays to 50 mg in a bit under 5 h after peak.
    expect((bedtime - r.at) / H).toBeGreaterThan(4);
    expect((bedtime - r.at) / H).toBeLessThan(6.5);
  });

  it('moves the cutoff earlier when caffeine is already on board', () => {
    const empty = latestDoseTime([], morning, bedtime, 95, 50, p);
    const loaded = latestDoseTime([{ at: morning, mg: 200 }], morning, bedtime, 95, 50, p);
    expect(empty.kind).toBe('latest');
    expect(loaded.kind).toBe('latest');
    if (empty.kind === 'latest' && loaded.kind === 'latest') expect(loaded.at).toBeLessThan(empty.at);
  });

  it('reports "over" when bedtime is already above target', () => {
    const r = latestDoseTime([{ at: bedtime - 3 * H, mg: 300 }], bedtime - 2 * H, bedtime, 95, 50, p);
    expect(r.kind).toBe('over');
    expect(r.activeAtBedtime).toBeGreaterThan(50);
  });

  it('reports "over" with the passed cutoff and what a dose now would leave', () => {
    const now = bedtime - 2 * H;
    const r = latestDoseTime([], now, bedtime, 95, 50, p);
    expect(r.kind).toBe('over');
    if (r.kind !== 'over') return;
    expect(r.passedAt).toBeLessThan(now);
    expect(r.ifNowAtBedtime).toBeCloseTo(doseActiveAfter(95, 2 * H, p), 6);
  });

  it('never suggests a dose that would peak after bedtime', () => {
    const r = latestDoseTime([], morning, bedtime, 5, 50, p);
    expect(r.kind).toBe('latest');
    if (r.kind === 'latest') expect(r.at).toBeLessThanOrEqual(bedtime - timeToPeakMs(p));
  });

  it('reports past-bedtime once bedtime has passed', () => {
    expect(latestDoseTime([], bedtime + H, bedtime, 95, 50, p).kind).toBe('past-bedtime');
  });
});

describe('defaults agree with the sleep evidence', () => {
  // Gardiner et al. 2023 (Sleep Med Rev 69:101764): coffee (107 mg) ≥ 8.8 h
  // and pre-workout (217.5 mg) ≥ 13.2 h before bed. Their regression is
  // linear in dose, ours is pharmacokinetic, so no single threshold matches
  // both exactly. The spec: never laxer than the evidence, at most 1.5 h stricter.
  const bedtime = 2_000 * H;
  const now = bedtime - 20 * H;
  const hoursBefore = (mg: number) => {
    const r = latestDoseTime([], now, bedtime, mg, DEFAULT_BEDTIME_TARGET_MG, { halfLifeHours: DEFAULT_HALF_LIFE_HOURS });
    if (r.kind !== 'latest') throw new Error(`expected a cutoff, got ${r.kind}`);
    return (bedtime - r.at) / H;
  };

  it('coffee cutoff is 8.8–10.3 h before bed', () => {
    expect(hoursBefore(107)).toBeGreaterThanOrEqual(8.8);
    expect(hoursBefore(107)).toBeLessThan(8.8 + 1.5);
  });

  it('pre-workout cutoff is 13.2–14.7 h before bed', () => {
    expect(hoursBefore(217.5)).toBeGreaterThanOrEqual(13.2);
    expect(hoursBefore(217.5)).toBeLessThan(13.2 + 1.5);
  });
});

describe('timeUnder', () => {
  it('returns the start time when already under target', () => {
    expect(timeUnder([], 5 * H, 30, p)).toBe(5 * H);
  });

  it('finds when a dose has decayed under the target', () => {
    const t0 = 100 * H;
    const t = timeUnder([{ at: t0, mg: 200 }], t0, 50, p)!;
    expect(doseActiveAfter(200, t - t0, p)).toBeLessThanOrEqual(50.01);
    expect(doseActiveAfter(200, t - t0 - 10 * 60_000, p)).toBeGreaterThan(50);
  });

  it('waits for a dose that is still absorbing', () => {
    const t0 = 100 * H;
    // Right after intake the level is low, but it will rise — not "under" yet.
    expect(timeUnder([{ at: t0, mg: 300 }], t0 + 60_000, 30, p)!).toBeGreaterThan(t0 + 5 * H);
  });
});
