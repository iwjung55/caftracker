import { describe, expect, it } from 'vitest';
import { bedtimeFor, hhmmToMin, logicalDayKey, logicalDayStart, minToHHMM } from './time';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();
const DAY_START = 4 * 60;

describe('logical days', () => {
  it('counts a 1 am espresso toward the previous evening', () => {
    expect(logicalDayKey(at(2026, 10, 3, 1), DAY_START)).toBe('2026-10-02');
    expect(logicalDayKey(at(2026, 10, 3, 4), DAY_START)).toBe('2026-10-03');
  });

  it('starts the day at the configured time', () => {
    expect(logicalDayStart(at(2026, 10, 2, 15), DAY_START)).toBe(at(2026, 10, 2, 4));
    expect(logicalDayStart(at(2026, 10, 3, 2), DAY_START)).toBe(at(2026, 10, 2, 4));
  });
});

describe('bedtimeFor', () => {
  it('uses the same evening for a pre-midnight bedtime', () => {
    expect(bedtimeFor(at(2026, 10, 2, 9), 23 * 60, DAY_START)).toBe(at(2026, 10, 2, 23));
  });

  it('rolls an after-midnight bedtime onto the next date', () => {
    expect(bedtimeFor(at(2026, 10, 2, 9), 30, DAY_START)).toBe(at(2026, 10, 3, 0, 30));
  });

  it('keeps the same bedtime when checked after midnight but before day start', () => {
    expect(bedtimeFor(at(2026, 10, 3, 0, 10), 30, DAY_START)).toBe(at(2026, 10, 3, 0, 30));
  });
});

describe('HH:MM conversion', () => {
  it('round-trips', () => {
    expect(minToHHMM(23 * 60 + 5)).toBe('23:05');
    expect(hhmmToMin('23:05')).toBe(23 * 60 + 5);
    expect(hhmmToMin('25:00')).toBeNull();
    expect(hhmmToMin('nope')).toBeNull();
  });
});
