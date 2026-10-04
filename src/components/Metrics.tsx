import type { Settings } from '../data/types';
import { type Advice, sleepImpact } from '../advice/engine';
import { roundMg, type CaffeineDay } from '../metrics/caffeine/derive';
import { approx } from '../lib/format';
import { formatTime } from '../lib/time';

interface Props {
  day: CaffeineDay;
  advice: Advice;
  settings: Settings;
}

const SLEEP_LABEL = { low: 'Low', some: 'Some', high: 'High' } as const;

/**
 * Four numbers, each stated in words: what's in you now, today's total
 * against your limit, what tonight's sleep is in for, and when the crash
 * comes. All derived from drinks alone.
 */
export function Metrics({ day, advice, settings }: Props) {
  const p = advice.profile;
  const now = day.activeNow;
  const zone = now < 2 ? 'none' : now < p.floorMg ? 'below' : now <= p.ceilingMg ? 'in' : 'above';
  const impact = sleepImpact(day, settings);
  const pastBedtime = day.now >= day.bedtime;
  const nothingToday = day.todayEntries.length === 0;
  // Right after a drink the level is still climbing; say so instead of "below range".
  const rising = advice.peakAhead.mg > now + 5;
  const peaksBelow = advice.peakAhead.mg < p.floorMg;

  return (
    <section className="readout" aria-label="Readings">
      <div className="channel">
        <p className="channel__label">Caffeine now</p>
        <p className="channel__value">
          {approx(now)}
          <span className="unit">mg</span>
        </p>
        <p className={`channel__note${zone === 'above' ? ' channel__note--warn' : ''}`}>
          {rising
            ? `Rising: peaks around ${approx(advice.peakAhead.mg)} mg at ${formatTime(advice.peakAhead.at)}.`
            : zone === 'none'
              ? `Your focus range is ${p.floorMg}–${p.ceilingMg} mg.`
              : zone === 'below'
                ? `Below your focus range (${p.floorMg}–${p.ceilingMg} mg).`
                : zone === 'in'
                  ? `In your focus range (${p.floorMg}–${p.ceilingMg} mg).`
                  : 'Above your range: jitters, not focus.'}
        </p>
      </div>

      <div className="channel">
        <p className="channel__label">Today</p>
        <p className="channel__value">
          {day.todayTotal}
          <span className="unit">mg</span>
        </p>
        <TodayMeter total={day.todayTotal} limit={p.maxDailyMg} />
        <p className={`channel__note${day.todayTotal > p.maxDailyMg ? ' channel__note--warn' : ''}`}>
          {day.todayTotal > p.maxDailyMg ? `Over your ${p.maxDailyMg} mg limit.` : `${p.maxDailyMg} mg limit for your weight`}
        </p>
      </div>

      <div className="channel">
        <p className="channel__label">Sleep impact tonight</p>
        <p className="channel__value">{pastBedtime ? '—' : SLEEP_LABEL[impact]}</p>
        <p className={`channel__note${!pastBedtime && impact === 'high' ? ' channel__note--warn' : ''}`}>
          {pastBedtime
            ? 'Past bedtime.'
            : `Estimated: ${approx(day.activeAtBedtime)} mg still active at ${formatTime(day.bedtime)}.`}
        </p>
      </div>

      <div className="channel">
        <p className="channel__label">Crash</p>
        <p className="channel__value">
          {nothingToday && now < 2 && !rising
            ? '—'
            : advice.dipAt
              ? formatTime(advice.dipAt)
              : peaksBelow
                ? 'Low'
                : 'No dip'}
        </p>
        <p className="channel__note">
          {nothingToday && now < 2 && !rising
            ? 'No caffeine yet today.'
            : advice.dipAt
              ? `When you’ll drop back below ${p.floorMg} mg.`
              : peaksBelow
                ? `Stays below your range (${roundMg(p.floorMg)} mg), so no crash.`
                : 'Not before your focus hours end.'}
        </p>
      </div>
    </section>
  );
}

/** A linear measurement scale, not a progress bar: the limit is a ruled mark, today is a needle. */
function TodayMeter({ total, limit }: { total: number; limit: number }) {
  const max = Math.max(limit * 1.25, total * 1.05, 100);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const ticks: number[] = [];
  const tickStep = max > 900 ? 200 : 100;
  for (let v = 0; v <= max; v += tickStep) ticks.push(v);
  return (
    <div className="meter" aria-hidden="true">
      <svg>
        <line className="meter-scale" x1="0" x2="100%" y1="12" y2="12" />
        {ticks.map((v) => (
          <line key={v} className="meter-scale" x1={pct(v)} x2={pct(v)} y1="8" y2="16" />
        ))}
        <line className="meter-ref" x1={pct(limit)} x2={pct(limit)} y1="2" y2="22" />
        <text x={pct(limit)} y="30" textAnchor="middle">
          {limit}
        </text>
        <svg x={pct(total)} y="0" overflow="visible">
          <path className="meter-needle" d="M-5,0 L5,0 L0,9 Z" />
        </svg>
      </svg>
    </div>
  );
}
