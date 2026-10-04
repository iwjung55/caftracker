import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Settings } from '../data/types';
import type { CaffeineEntry } from '../metrics/caffeine';
import { HALF_LIFE_BAND } from '../metrics/caffeine/constants';
import { roundMg, type CaffeineDay } from '../metrics/caffeine/derive';
import { activeAt } from '../metrics/caffeine/model';
import { formatHour, formatTime, HOUR, MINUTE } from '../lib/time';
import { useSize } from '../lib/hooks';
import { approx } from '../lib/format';

/** Your focus range across focus hours, from the suggestion engine. */
export interface FocusBand {
  from: number;
  to: number;
  floor: number;
  ceiling: number;
  /** Suggested top-up time, drawn as a pencil mark. */
  topUpAt: number | null;
}

interface Props {
  focus?: FocusBand;
  day: CaffeineDay;
  settings: Settings;
  entries: readonly CaffeineEntry[];
  /** Changes whenever a drink is logged, so the projection re-plots. */
  replotKey: number;
}

/**
 * The strip-chart recorder: time runs left→right across chart paper, the
 * pen sits at "now", the past is inked solid and the rest of the day is
 * projected dashed. Bedtime, the bedtime target and your focus range are
 * ruled on the paper. Drag, hover or use arrow keys to read any time.
 */
export function RecorderChart({ day, settings, entries, replotKey, focus }: Props) {
  // The paper's size comes from CSS (it fills the bezel); the SVG matches it.
  const [wrapRef, { width, height }] = useSize<HTMLDivElement>();
  const [cursor, setCursor] = useState<number | null>(null);

  const compact = width < 560;
  const m = { l: compact ? 34 : 42, r: compact ? 10 : 16, t: 34, b: 44 };

  const geo = useMemo(() => {
    if (width === 0 || height === 0) return null;
    const firstToday = day.todayEntries[0]?.startAt ?? Infinity;
    const start = firstToday < day.dayStart + 2 * HOUR ? day.dayStart : day.dayStart + 2 * HOUR;
    const end = Math.max(day.bedtime + 3 * HOUR, day.now + 2 * HOUR);
    const plotW = width - m.l - m.r;
    const plotH = height - m.t - m.b;

    const n = Math.max(60, Math.floor(plotW / 3));
    const times: number[] = [];
    for (let i = 0; i <= n; i++) times.push(start + ((end - start) * i) / n);
    if (day.now > start && day.now < end) times.push(day.now);
    times.sort((a, b) => a - b);

    const low = { halfLifeHours: settings.halfLifeHours * HALF_LIFE_BAND.low };
    const high = { halfLifeHours: settings.halfLifeHours * HALF_LIFE_BAND.high };
    const curve = times.map((t) => activeAt(day.doses, t, day.params));
    const bandA = times.map((t) => activeAt(day.doses, t, low));
    const bandB = times.map((t) => activeAt(day.doses, t, high));

    const peak = Math.max(...curve, ...bandA, ...bandB, settings.bedtimeTargetMg * 2.5, focus?.ceiling ?? 0, 100);
    const step = peak <= 160 ? 25 : peak <= 340 ? 50 : peak <= 700 ? 100 : 200;
    const yMax = Math.ceil((peak * 1.12) / step) * step;

    const x = (t: number) => m.l + ((t - start) / (end - start)) * plotW;
    const y = (mg: number) => m.t + (1 - mg / yMax) * plotH;
    return { start, end, plotW, plotH, times, curve, bandA, bandB, yMax, step, x, y };
  }, [width, height, day, settings.halfLifeHours, settings.bedtimeTargetMg, focus?.ceiling, m.l, m.r]);

  const caption =
    `Estimated caffeine active now: about ${roundMg(day.activeNow)} mg. ` +
    `At bedtime (${formatTime(day.bedtime)}): about ${roundMg(day.activeAtBedtime)} mg; your target is ${settings.bedtimeTargetMg} mg.`;

  if (!geo) {
    // Same figure > div.paper structure as below, so React keeps the measured node.
    return (
      <figure className="chart-figure">
        <div ref={wrapRef} className="paper" aria-busy="true" />
      </figure>
    );
  }

  const { start, end, times, curve, bandA, bandB, yMax, step, x, y } = geo;
  const plotTop = m.t;
  const plotBottom = height - m.b;
  const nowX = x(day.now);
  const nowIn = day.now >= start && day.now <= end;

  const line = (vals: number[], from: number, to: number) => {
    let d = '';
    for (let i = 0; i < times.length; i++) {
      const t = times[i]!;
      if (t < from || t > to) continue;
      d += `${d ? 'L' : 'M'}${x(t).toFixed(1)},${y(vals[i]!).toFixed(1)}`;
    }
    return d;
  };
  const band = (() => {
    const top = times.map((t, i) => `${x(t).toFixed(1)},${y(Math.max(bandA[i]!, bandB[i]!)).toFixed(1)}`);
    const bottom = times.map((t, i) => `${x(t).toFixed(1)},${y(Math.min(bandA[i]!, bandB[i]!)).toFixed(1)}`).reverse();
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  })();

  // Grid
  const minorV: number[] = [];
  const majorV: number[] = [];
  const firstHalf = Math.ceil(start / (30 * MINUTE)) * 30 * MINUTE;
  for (let t = firstHalf; t <= end; t += 30 * MINUTE) {
    const d = new Date(t);
    (d.getMinutes() === 0 ? majorV : minorV).push(t);
  }
  const labelEvery = compact ? 4 : width < 900 ? 3 : 2;
  const hourLabels = majorV.filter((t) => new Date(t).getHours() % labelEvery === 0);
  const hLines: { mg: number; major: boolean }[] = [];
  for (let mg = 0; mg <= yMax; mg += step / 2) hLines.push({ mg, major: mg % step === 0 });

  // Event marks along the bottom edge
  const events = entries.filter((e) => e.startAt >= start && e.startAt <= end);
  let lastLabelX = -Infinity;
  const eventMarks = events.map((e) => {
    const ex = x(e.startAt);
    const showLabel = ex - lastLabelX > (compact ? 30 : 34);
    if (showLabel) lastLabelX = ex;
    return { e, ex, showLabel };
  });

  // Annotations
  const bedX = x(day.bedtime);
  const bedY = y(day.activeAtBedtime);
  const penY = y(day.activeNow);
  // Right after a drink the curve keeps rising; prefer the label under the pen so the projection can't cross it.
  const rising = activeAt(day.doses, day.now + 20 * MINUTE, day.params) > day.activeNow + 1;
  const showBed = day.now < day.bedtime;

  // Label placement: try candidate spots in priority order, skip any that leave
  // the plot or collide with a label already placed. A label with no free
  // spot is dropped — the readout states every number in words anyway.
  type Spot = { x: number; y: number; anchor: 'start' | 'end' };
  type Box = { x0: number; x1: number; y0: number; y1: number };
  const placed: Box[] = [];
  const CHAR = 6.7;
  const place = (texts: string[], spots: Spot[]): (Spot & { text: string }) | null => {
    for (const text of texts) {
      for (const sp of spots) {
        const w = text.length * CHAR;
        const b = { x0: sp.anchor === 'start' ? sp.x : sp.x - w, x1: sp.anchor === 'start' ? sp.x + w : sp.x, y0: sp.y - 12, y1: sp.y + 3 };
        const inside = b.x0 >= m.l + 2 && b.x1 <= width - m.r - 2 && b.y0 >= plotTop && b.y1 <= plotBottom;
        const clear = placed.every((o) => b.x1 + 4 < o.x0 || o.x1 + 4 < b.x0 || b.y1 + 2 < o.y0 || o.y1 + 2 < b.y0);
        if (inside && clear) {
          placed.push(b);
          return { ...sp, text };
        }
      }
    }
    return null;
  };
  const around = (px: number, py: number, order: ('ra' | 'la' | 'rb' | 'lb')[]): Spot[] =>
    order.map((o) => ({
      x: o[0] === 'r' ? px + 8 : px - 8,
      y: o[1] === 'a' ? py - 8 : py + 18,
      anchor: o[0] === 'r' ? ('start' as const) : ('end' as const),
    }));

  const bandFrom = focus ? Math.max(start, focus.from) : 0;
  const bandTo = focus ? Math.min(end, focus.to) : 0;
  const showBand = focus !== undefined && bandTo > bandFrom;
  const bandLabel = showBand
    ? place(['your focus range', 'focus range'], [
        { x: x(bandFrom) + 6, y: y(focus!.ceiling) + 14, anchor: 'start' },
        { x: x(bandTo) - 6, y: y(focus!.ceiling) + 14, anchor: 'end' },
      ])
    : null;

  const bedLabel = place([`BED ${formatTime(day.bedtime)}`, 'BED'], [
    { x: bedX + 7, y: plotTop + 16, anchor: 'start' },
    { x: bedX - 7, y: plotTop + 16, anchor: 'end' },
  ]);
  const targetY = y(settings.bedtimeTargetMg);
  const targetLabel = place([`target ${settings.bedtimeTargetMg} mg`, `${settings.bedtimeTargetMg} mg`], [
    { x: bedX + 7, y: targetY + 15, anchor: 'start' },
    { x: bedX - 7, y: targetY + 15, anchor: 'end' },
    { x: width - m.r - 6, y: targetY - 6, anchor: 'end' },
  ]);
  const bedValueLabel = showBed
    ? place([`${approx(day.activeAtBedtime)} mg at bed`, `${approx(day.activeAtBedtime)} mg`], around(bedX, bedY, ['ra', 'lb', 'rb', 'la']))
    : null;
  const penLabel = nowIn
    ? place(
        [`${approx(day.activeNow)} mg now`, `${approx(day.activeNow)} mg`],
        around(nowX, penY, rising ? ['rb', 'lb', 'ra', 'la'] : ['ra', 'la', 'rb', 'lb']),
      )
    : null;

  // Scrubbing
  const toTime = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    const t = start + ((px - m.l) / (width - m.l - m.r)) * (end - start);
    return Math.min(end, Math.max(start, t));
  };
  const onPointer = (ev: PointerEvent<SVGSVGElement>) => {
    if (ev.pointerType !== 'mouse' && ev.buttons === 0 && ev.type === 'pointermove') return;
    setCursor(toTime(ev.clientX, ev.currentTarget.getBoundingClientRect()));
  };
  const onKey = (ev: KeyboardEvent<SVGSVGElement>) => {
    const stepMs = ev.shiftKey ? HOUR : 15 * MINUTE;
    const base = cursor ?? day.now;
    let next: number | null = base;
    if (ev.key === 'ArrowRight') next = base + stepMs;
    else if (ev.key === 'ArrowLeft') next = base - stepMs;
    else if (ev.key === 'Home') next = start;
    else if (ev.key === 'End') next = end;
    else if (ev.key === 'Escape') next = null;
    else return;
    ev.preventDefault();
    setCursor(next === null ? null : Math.min(end, Math.max(start, next)));
  };
  const cursorMg = cursor !== null ? activeAt(day.doses, cursor, day.params) : 0;
  const cursorText = cursor !== null ? `${formatTime(cursor)} · ≈${roundMg(cursorMg)} mg` : '';
  const chipW = cursorText.length * 6.8 + 16;
  const chipX = cursor !== null ? Math.min(Math.max(x(cursor) - chipW / 2, m.l), width - m.r - chipW) : 0;

  return (
    <figure className="chart-figure">
      <div ref={wrapRef} className="paper">
        <svg
          className="chart"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          tabIndex={0}
          role="img"
          aria-label={`${caption} Use the left and right arrow keys to read the estimate at other times.`}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={(ev) => ev.pointerType === 'mouse' && setCursor(null)}
          onKeyDown={onKey}
          onBlur={() => setCursor(null)}
        >
          {/* Focus range across focus hours (drawn first, under everything) */}
          {showBand && (
            <rect
              className="focus-band"
              x={x(bandFrom)}
              y={y(focus!.ceiling)}
              width={x(bandTo) - x(bandFrom)}
              height={y(focus!.floor) - y(focus!.ceiling)}
            />
          )}
          {bandLabel && (
            <text className="annot annot--band" x={bandLabel.x} y={bandLabel.y} textAnchor={bandLabel.anchor}>
              {bandLabel.text}
            </text>
          )}

          {/* Sleep region */}
          <rect className="night" x={bedX} y={plotTop} width={Math.max(0, x(end) - bedX)} height={plotBottom - plotTop} />

          {/* Paper grid */}
          {minorV.map((t) => (
            <line key={`v${t}`} className="grid-minor" x1={x(t)} x2={x(t)} y1={plotTop} y2={plotBottom} />
          ))}
          {majorV.map((t) => (
            <line key={`V${t}`} className="grid-major" x1={x(t)} x2={x(t)} y1={plotTop} y2={plotBottom} />
          ))}
          {hLines.map(({ mg, major }) => (
            <line key={`h${mg}`} className={major ? 'grid-major' : 'grid-minor'} x1={m.l} x2={width - m.r} y1={y(mg)} y2={y(mg)} />
          ))}

          {/* Printed scales */}
          {hLines
            .filter((h) => h.major)
            .map(({ mg }) => (
              <text key={`s${mg}`} className="scale" x={m.l - 6} y={y(mg) + 4} textAnchor="end">
                {mg}
              </text>
            ))}
          <text className="scale" x={m.l - 6} y={plotTop - 10} textAnchor="end">
            mg
          </text>
          {hourLabels.map((t) => (
            <text key={`l${t}`} className="scale" x={x(t)} y={height - 8} textAnchor="middle">
              {formatHour(t)}
            </text>
          ))}

          {/* Bedtime target and bedtime */}
          <line className="rule-target" x1={m.l} x2={width - m.r} y1={y(settings.bedtimeTargetMg)} y2={y(settings.bedtimeTargetMg)} />
          {targetLabel && (
            <text className="annot" x={targetLabel.x} y={targetLabel.y} textAnchor={targetLabel.anchor}>
              {targetLabel.text}
            </text>
          )}
          <line className="rule-bed" x1={bedX} x2={bedX} y1={plotTop} y2={plotBottom} />
          {bedLabel && (
            <text className="annot" x={bedLabel.x} y={bedLabel.y} textAnchor={bedLabel.anchor}>
              {bedLabel.text}
            </text>
          )}

          {/* Uncertainty band, then the trace */}
          {/* The re-plot motion marks a new log only — never on page load. */}
          <path key={`band${replotKey}`} className={replotKey > 0 ? 'band replot' : 'band'} d={band} />
          <path className="trace" d={line(curve, start, day.now)} />
          <path
            key={`proj${replotKey}`}
            className={replotKey > 0 ? 'trace trace--projected replot' : 'trace trace--projected'}
            d={line(curve, day.now, end)}
          />

          {/* Value at bedtime */}
          {showBed && (
            <g>
              <circle cx={bedX} cy={bedY} r={3.5} fill="var(--pen-caffeine)" />
              {bedValueLabel && (
                <text className="annot annot--pen" x={bedValueLabel.x} y={bedValueLabel.y} textAnchor={bedValueLabel.anchor}>
                  {bedValueLabel.text}
                </text>
              )}
            </g>
          )}
          {/* Suggested top-up: a pencil mark in the event lane */}
          {focus?.topUpAt != null && focus.topUpAt >= start && focus.topUpAt <= end && (
            <g className="topup-mark">
              <path
                d={`M${x(focus.topUpAt) - 4},${plotBottom + 11} L${x(focus.topUpAt)},${plotBottom + 4} L${x(focus.topUpAt) + 4},${plotBottom + 11} Z`}
              />
              <text x={x(focus.topUpAt) + 6} y={plotBottom + 12}>
                top up
              </text>
            </g>
          )}

          {/* Event marker pen */}
          {eventMarks.map(({ e, ex, showLabel }) => (
            <g key={e.id}>
              <path className="event" d={`M${ex - 4},${plotBottom + 11} L${ex},${plotBottom + 4} L${ex + 4},${plotBottom + 11} Z`}>
                <title>
                  {e.data.label}, {e.value} mg at {formatTime(e.startAt)}
                </title>
              </path>
              {showLabel && (
                <text className="event-label" x={ex + 6} y={plotBottom + 12}>
                  {e.value}
                </text>
              )}
            </g>
          ))}

          {/* Pen carriage at now */}
          {nowIn && (
            <g>
              <line className="carriage" x1={nowX} x2={nowX} y1={plotTop} y2={plotBottom} />
              <circle className="pen-tip" cx={nowX} cy={penY} r={5} />
              {/* Indicating pointer riding the mg scale, just inside the paper */}
              <path className="event" d={`M${m.l},${penY} l7,-4.5 v9 z`} />
              {penLabel && (
                <text className="annot annot--pen" x={penLabel.x} y={penLabel.y} textAnchor={penLabel.anchor}>
                  {penLabel.text}
                </text>
              )}
            </g>
          )}

          {/* Scrub cursor */}
          {cursor !== null && (
            <g pointerEvents="none">
              <line className="cursor-line" x1={x(cursor)} x2={x(cursor)} y1={plotTop} y2={plotBottom} />
              <circle cx={x(cursor)} cy={y(cursorMg)} r={4} fill="var(--cursor)" />
              <rect className="cursor-chip" x={chipX} y={plotBottom - 26} width={chipW} height={20} rx={3} />
              <text className="cursor-text" x={chipX + chipW / 2} y={plotBottom - 12} textAnchor="middle">
                {cursorText}
              </text>
            </g>
          )}
        </svg>
        <span className="sr-only" aria-live="polite">
          {cursorText}
        </span>
      </div>
      <figcaption className="chart-caption">
        Solid: so far. Dashed: if you have nothing else. Shaded: half-life{' '}
        {(settings.halfLifeHours * HALF_LIFE_BAND.low).toFixed(1)}–{(settings.halfLifeHours * HALF_LIFE_BAND.high).toFixed(1)} h. Drag
        to read any time. <a href="#/calibrate/evidence">How estimates work</a>
      </figcaption>
    </figure>
  );
}
