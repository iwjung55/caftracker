/**
 * Caffeine pharmacokinetics — pure functions, no I/O.
 *
 * One-compartment model with first-order absorption and elimination
 * (the Bateman function). Each dose D taken at t0 contributes
 *
 *   A(t) = D · ka / (ka − ke) · (e^(−ke·Δ) − e^(−ka·Δ)),   Δ = t − t0 ≥ 0
 *
 * where ke = ln2 / halfLife. Oral caffeine is ~100 % bioavailable, so A(t)
 * is an estimate of milligrams still active in the body. It is a
 * population-average estimate: individual half-life varies several-fold.
 * Sources and the reasoning behind each constant: docs/research.md.
 */

import { ABSORPTION_RATE_PER_HOUR } from './constants';

const HOUR = 3_600_000;

export interface Dose {
  /** When it was taken, epoch ms. */
  at: number;
  /** Milligrams of caffeine. */
  mg: number;
}

export interface ModelParams {
  halfLifeHours: number;
  /** First-order absorption rate, 1/h. */
  ka?: number;
}

/** mg of a single dose still active `deltaMs` after it was taken. */
export function doseActiveAfter(mg: number, deltaMs: number, p: ModelParams): number {
  if (deltaMs <= 0 || mg <= 0) return 0;
  const ka = p.ka ?? ABSORPTION_RATE_PER_HOUR;
  const ke = Math.LN2 / p.halfLifeHours;
  const t = deltaMs / HOUR;
  // ka ≈ ke is the degenerate case of the Bateman function.
  if (Math.abs(ka - ke) < 1e-9) return mg * ke * t * Math.exp(-ke * t);
  return ((mg * ka) / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

/** Total mg active at time `t` from every dose taken before it. */
export function activeAt(doses: readonly Dose[], t: number, p: ModelParams): number {
  let sum = 0;
  for (const d of doses) sum += doseActiveAfter(d.mg, t - d.at, p);
  return sum;
}

/** Time from intake to peak level, ms. */
export function timeToPeakMs(p: ModelParams): number {
  const ka = p.ka ?? ABSORPTION_RATE_PER_HOUR;
  const ke = Math.LN2 / p.halfLifeHours;
  if (Math.abs(ka - ke) < 1e-9) return HOUR / ke;
  return (Math.log(ka / ke) / (ka - ke)) * HOUR;
}

/** Sample the active-caffeine curve between `from` and `to`. */
export function sampleCurve(
  doses: readonly Dose[],
  from: number,
  to: number,
  stepMs: number,
  p: ModelParams,
): { t: number; mg: number }[] {
  const out: { t: number; mg: number }[] = [];
  for (let t = from; t <= to; t += stepMs) out.push({ t, mg: activeAt(doses, t, p) });
  return out;
}

export type CutoffResult =
  /**
   * Another dose now would leave more than the target at bedtime.
   * `passedAt` is when the cutoff was, if there was one earlier today;
   * `ifNowAtBedtime` is what a dose right now would leave at bedtime.
   */
  | { kind: 'over'; activeAtBedtime: number; passedAt?: number; ifNowAtBedtime: number }
  /** Latest time today a dose of `doseMg` keeps bedtime under target. */
  | { kind: 'latest'; at: number; activeAtBedtime: number }
  /** Nothing is needed — bedtime has already passed for this day. */
  | { kind: 'past-bedtime'; activeAtBedtime: number };

/**
 * Latest time to take a dose of `doseMg` so that the estimated active
 * caffeine at `bedtime` stays at or under `targetMg`.
 *
 * The dose must also have peaked before bedtime — a coffee drunk five
 * minutes before bed reads as ~0 mg at the bedtime instant but peaks
 * while asleep, so we only search intake times at least one
 * time-to-peak before bed.
 */
export function latestDoseTime(
  doses: readonly Dose[],
  now: number,
  bedtime: number,
  doseMg: number,
  targetMg: number,
  p: ModelParams,
): CutoffResult {
  const residual = activeAt(doses, bedtime, p);
  if (now >= bedtime) return { kind: 'past-bedtime', activeAtBedtime: residual };

  const ifNowAtBedtime = residual + doseActiveAfter(doseMg, bedtime - now, p);
  const over = (passedAt?: number): CutoffResult => ({ kind: 'over', activeAtBedtime: residual, passedAt, ifNowAtBedtime });
  const budget = targetMg - residual;
  if (budget <= 0) return over();

  const fits = (intake: number) => doseActiveAfter(doseMg, bedtime - intake, p) <= budget;
  // Candidate intake times run from bedtime − 72h to bedtime − peak; in that
  // range the dose's contribution at bedtime falls as intake moves earlier.
  let hi = bedtime - timeToPeakMs(p);
  let lo = bedtime - 72 * HOUR;

  let latest: number;
  if (fits(hi)) latest = hi;
  else if (!fits(lo)) return over();
  else {
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    latest = lo;
  }
  // A cutoff that already passed means another dose today overshoots.
  return latest < now ? over(latest) : { kind: 'latest', at: latest, activeAtBedtime: residual };
}

/**
 * Earliest time at or after `from` when active caffeine is at or under
 * `targetMg` and stays there (no dose still absorbing). Null if not within
 * `withinMs`.
 */
export function timeUnder(
  doses: readonly Dose[],
  from: number,
  targetMg: number,
  p: ModelParams,
  withinMs = 72 * HOUR,
): number | null {
  // Once every dose has peaked, the curve only falls — start the scan there.
  const lastPeak = Math.max(from, ...doses.map((d) => d.at + timeToPeakMs(p)));
  if (lastPeak === from && activeAt(doses, from, p) <= targetMg) return from;
  const step = 5 * 60_000;
  for (let t = lastPeak; t <= from + withinMs; t += step) {
    if (activeAt(doses, t, p) <= targetMg) {
      // Refine to the minute.
      let lo = t - step;
      let hi = t;
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (activeAt(doses, mid, p) <= targetMg) hi = mid;
        else lo = mid;
      }
      return Math.max(from, hi);
    }
  }
  return null;
}
