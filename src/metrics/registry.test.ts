import { describe, expect, it } from 'vitest';
import type { Entry } from '../data/types';
import { aggregate, registerMetric, validateEntry } from './registry';
import { caffeine } from './caffeine';

/**
 * The extensibility check: register the next likely metrics *without any
 * UI* and make sure the shared Entry shape, validation and aggregation
 * already handle them. If one of these needs a schema change, we find out
 * now rather than when metric #2 ships.
 */
const sleep = registerMetric({
  id: 'test-sleep',
  label: 'Sleep',
  unit: 'min',
  kind: 'interval',
  aggregate: 'duration',
  pen: '--pen-sleep',
  sensitivity: 'health',
  dataVersion: 1,
  range: { min: 0, max: 24 * 60 },
});

const mood = registerMetric({
  id: 'test-mood',
  label: 'Mood',
  unit: '1–5',
  kind: 'scale',
  aggregate: 'mean',
  pen: '--pen-mood',
  sensitivity: 'health',
  dataVersion: 1,
  range: { min: 1, max: 5 },
});

const base = { tz: 'America/New_York', createdAt: 0, updatedAt: 0 };
const H = 3_600_000;

describe('registry handles future metric kinds', () => {
  it('accepts an overnight sleep interval and sums its duration', () => {
    const night: Entry = { ...base, id: 's1', metric: sleep.id, startAt: 0, endAt: 7.5 * H, value: 450, data: { v: 1, quality: 4 } };
    expect(validateEntry(night)).toBeNull();
    expect(aggregate(sleep, [night])).toBe(7.5 * H);
  });

  it('rejects an interval without an end, and a point event with one', () => {
    expect(validateEntry({ ...base, id: 's2', metric: sleep.id, startAt: 0, value: 400, data: { v: 1 } })).toMatch(/end time/);
    expect(validateEntry({ ...base, id: 'c1', metric: caffeine.id, startAt: 0, endAt: H, value: 95, data: { v: 1, label: 'x' } })).toMatch(/cannot have an end/);
  });

  it('averages 1–5 mood ratings and enforces the scale', () => {
    const a: Entry = { ...base, id: 'm1', metric: mood.id, startAt: 0, value: 2, data: { v: 1 } };
    const b: Entry = { ...base, id: 'm2', metric: mood.id, startAt: H, value: 4, data: { v: 1 } };
    expect(aggregate(mood, [a, b])).toBe(3);
    expect(validateEntry({ ...a, value: 9 })).toMatch(/between 1 and 5/);
  });

  it('sums caffeine and requires a drink label', () => {
    const e: Entry = { ...base, id: 'c2', metric: caffeine.id, startAt: 0, value: 95, data: { v: 1, label: 'Drip coffee' } };
    expect(validateEntry(e)).toBeNull();
    expect(aggregate(caffeine, [e, { ...e, id: 'c3', value: 63 }])).toBe(158);
    expect(validateEntry({ ...e, data: { v: 1, label: '  ' } })).toMatch(/name/);
  });

  it('refuses unknown metrics and duplicate registration', () => {
    expect(validateEntry({ ...base, id: 'x', metric: 'nope', startAt: 0, value: 1, data: { v: 1 } })).toMatch(/Unknown/);
    expect(() => registerMetric({ ...mood })).toThrow(/already registered/);
  });
});
