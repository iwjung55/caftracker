import { useId } from 'react';
import type { Settings } from '../data/types';
import type { CaffeineEntry } from '../metrics/caffeine';
import { archive } from '../metrics/caffeine/derive';
import { formatDate, formatHour, formatTime, formatWeekday, HOUR } from '../lib/time';
import { useWidth } from '../lib/hooks';

interface Props {
  entries: readonly CaffeineEntry[];
  settings: Settings;
  now: number;
}

/**
 * The chart archive: each past day as a strip of recorder paper, with an
 * event tick for every drink (height = dose) and the bedtime ruled in.
 * No "insights" — the timing pattern is there to be seen.
 */
export function Archive({ entries, settings, now }: Props) {
  const days = archive(entries, settings, now, 14);
  const [ref, width] = useWidth<HTMLDivElement>();
  const ids = useId();
  // Each strip covers day start + 2 h → day start + 24 h (e.g. 6 AM → 4 AM).
  const span = 22 * HOUR;
  const offset = 2 * HOUR;
  const xOf = (dayStart: number, t: number) => ((t - dayStart - offset) / span) * width;
  const hasAny = days.some((d) => d.entries.length > 0);
  // Tick height is relative to the biggest single dose shown (at least 200 mg), so a 310 mg café drip
  // and a 200 mg tablet don't look the same.
  const doseScale = Math.max(200, ...days.flatMap((d) => d.entries.map((e) => e.value)));
  const ticksEvery = width < 360 ? 6 : 3;

  return (
    <section aria-labelledby={`${ids}-title`}>
      <div className="section-head">
        <h2 className="section-title" id={`${ids}-title`}>
          Last 14 days
        </h2>
        <p className="section-hint">One strip per day</p>
      </div>
      <div className="archive">
        <div className="archive__axis" aria-hidden="true">
          <span />
          <div ref={ref}>
            {width > 0 && days[0] && (
              <svg width={width} height={14} style={{ display: 'block', overflow: 'visible' }}>
                {Array.from({ length: Math.floor(22 / ticksEvery) + 1 }, (_, i) => days[0]!.start + offset + i * ticksEvery * HOUR).map((t, i, all) => (
                  <text key={t} x={xOf(days[0]!.start, t)} y={11} textAnchor={i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle'}>
                    {formatHour(t)}
                  </text>
                ))}
              </svg>
            )}
          </div>
          <span />
        </div>
        {days.map((d, i) => {
          const over = d.total > settings.dailyLimitMg;
          const summary =
            d.entries.length === 0
              ? `${formatDate(d.start)}: nothing logged`
              : `${formatDate(d.start)}: ${d.total} mg from ${d.entries.length} ${d.entries.length === 1 ? 'drink' : 'drinks'}, last at ${formatTime(d.entries[d.entries.length - 1]!.startAt)}`;
          return (
            <div className="archive__row" key={d.key} data-today={i === 0}>
              <span className="archive__day">{i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatWeekday(d.start) + ' ' + new Date(d.start).getDate()}</span>
              {width > 0 ? (
                <svg className="archive__strip" width={width} height={26} role="img" aria-label={summary}>
                  <rect className="strip-paper" x={0} y={0} width={width} height={26} rx={2} />
                  <rect className="strip-night" x={Math.max(0, xOf(d.start, d.bedtime))} y={0} width={Math.max(0, width - xOf(d.start, d.bedtime))} height={26} />
                  {Array.from({ length: 22 / 3 + 1 }, (_, k) => d.start + offset + k * 3 * HOUR).map((t) => (
                    <line key={t} className="strip-grid" x1={xOf(d.start, t)} x2={xOf(d.start, t)} y1={0} y2={26} />
                  ))}
                  <line className="strip-bed" x1={xOf(d.start, d.bedtime)} x2={xOf(d.start, d.bedtime)} y1={0} y2={26} />
                  {d.entries.map((e) => {
                    const h = Math.max(4, Math.min(22, (e.value / doseScale) * 22));
                    return (
                      <rect key={e.id} className="strip-event" x={Math.max(0, Math.min(width - 3, xOf(d.start, e.startAt) - 1.5))} y={26 - 2 - h} width={3} height={h} rx={1}>
                        <title>
                          {e.data.label}, {e.value} mg at {formatTime(e.startAt)}
                        </title>
                      </rect>
                    );
                  })}
                </svg>
              ) : (
                <span />
              )}
              <span className="archive__total" data-over={over} data-none={d.entries.length === 0}>
                {d.entries.length === 0 ? '—' : `${d.total} mg`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="archive__legend">
        {hasAny
          ? `Tick height shows the dose. Shaded: after your ${formatTime(days[0]!.bedtime)} bedtime. Underlined totals are above your ${settings.dailyLimitMg} mg reference.`
          : 'Your days will collect here. After a week, you’ll be able to see when your last drink usually lands.'}
      </p>
    </section>
  );
}
