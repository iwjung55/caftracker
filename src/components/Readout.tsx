import type { Settings } from '../data/types';
import { cutoffFor, roundMg, whatStillFits, type CaffeineDay } from '../metrics/caffeine/derive';
import type { Drink } from '../metrics/caffeine/drinks';
import { formatClockMin, formatRelative, formatTime } from '../lib/time';
import type { Preview } from './RecorderChart';

interface Props {
  day: CaffeineDay;
  previewDay: CaffeineDay | null;
  preview: Preview | null;
  settings: Settings;
  quick: readonly Drink[];
}

/** "A black tea", "An energy drink", "Half a drip coffee" — sentence-start noun phrase. */
export function withArticle(label: string): string {
  if (/^half\b/i.test(label)) return label.charAt(0).toUpperCase() + label.slice(1);
  return `${/^[aeiou]/i.test(label) ? 'An' : 'A'} ${label}`;
}

/** "≈140", but a plain "0" when nothing is measurable. */
export const approx = (mg: number) => (roundMg(mg) === 0 ? '0' : `≈${roundMg(mg)}`);

/**
 * The instrument's readout: the chart's key numbers stated in words, so
 * nothing depends on reading the drawing. While a drink is being
 * considered, each channel shows where it would move ("≈38 → ≈62 mg") and
 * the cutoff answers for that drink, not your usual one.
 */
export function Readout({ day, previewDay, preview, settings, quick }: Props) {
  const [nowLow, nowHigh] = [Math.min(...day.activeNowBand), Math.max(...day.activeNowBand)];
  const pastBedtime = day.now >= day.bedtime;
  const bedMg = roundMg(day.activeAtBedtime);
  const bedPreview = previewDay ? roundMg(previewDay.activeAtBedtime) : null;
  const bedOver = (bedPreview ?? bedMg) > settings.bedtimeTargetMg;
  const todayAfter = previewDay?.todayTotal ?? day.todayTotal;
  const todayOver = todayAfter > settings.dailyLimitMg;

  return (
    <section className="readout" aria-label="Readings">
      <div className="channel">
        <p className="channel__label">Active now</p>
        <p className="channel__value">
          {approx(day.activeNow)}
          <span className="unit">mg</span>
        </p>
        <p className="channel__note">
          {day.activeNow < 2
            ? 'Nothing measurable in your system.'
            : `Could be ${roundMg(nowLow)}–${roundMg(nowHigh)} mg. Bodies clear caffeine at different speeds.`}
        </p>
      </div>

      <div className="channel">
        <p className="channel__label">At bedtime, {formatTime(day.bedtime)}</p>
        {pastBedtime ? (
          <>
            <p className="channel__value">Past bedtime</p>
            <p className="channel__note">Tomorrow’s chart starts at {formatClockMin(settings.dayStartMin)}.</p>
          </>
        ) : (
          <>
            <p className="channel__value">
              {approx(day.activeAtBedtime)}
              {bedPreview !== null && bedPreview !== bedMg && <> → {approx(previewDay!.activeAtBedtime)}</>}
              <span className="unit">mg</span>
            </p>
            <p className={`channel__note${bedOver ? ' channel__note--warn' : ''}`}>
              {bedOver ? 'Over' : 'Under'} your {settings.bedtimeTargetMg} mg bedtime target.
            </p>
          </>
        )}
      </div>

      <CutoffChannel day={day} previewDay={previewDay} preview={preview} settings={settings} quick={quick} />

      <div className="channel">
        <p className="channel__label">Today</p>
        <p className="channel__value">
          {day.todayTotal}
          {previewDay && <> → {previewDay.todayTotal}</>}
          <span className="unit">mg</span>
        </p>
        <TodayMeter total={day.todayTotal} preview={previewDay?.todayTotal ?? null} limit={settings.dailyLimitMg} />
        <p className={`channel__note${todayOver ? ' channel__note--warn' : ''}`}>
          {todayOver ? `Over the ${settings.dailyLimitMg} mg reference.` : `${settings.dailyLimitMg} mg daily reference`}
        </p>
      </div>
    </section>
  );
}

function CutoffChannel({ day, previewDay, preview, settings, quick }: Props) {
  const target = settings.bedtimeTargetMg;

  // Considering a specific drink: answer for that drink.
  if (preview && previewDay) {
    const name = preview.label.toLowerCase();
    const c = cutoffFor(day, settings, preview.mg);
    const leaves = approx(previewDay.activeAtBedtime);
    if (c.kind === 'latest') {
      return (
        <Channel label={`Last ${name} for tonight`} value={formatTime(c.at)}>
          {formatRelative(c.at, day.now)} · keeps bedtime under {target} mg
        </Channel>
      );
    }
    if (c.kind === 'past-bedtime') return <PastBedtime settings={settings} label={`Last ${name} for tonight`} />;
    return (
      <Channel label={`Last ${name} for tonight`} value="Too late tonight" warn>
        {c.passedAt ? `Cutoff was ${formatTime(c.passedAt)}. ` : ''}It would leave {leaves} mg at bedtime.
      </Channel>
    );
  }

  const dose = day.referenceDose;
  const c = day.cutoff;
  const label = `Last ${dose.label} for tonight`;
  if (c.kind === 'past-bedtime') return <PastBedtime settings={settings} label={label} />;
  if (c.kind === 'latest') {
    return (
      <Channel label={label} value={formatTime(c.at)}>
        {formatRelative(c.at, day.now)} · for a {dose.mg} mg {dose.label}
      </Channel>
    );
  }

  // Over: say what still fits instead of stopping at "no".
  const fits = whatStillFits(day, settings, quick);
  const passed = c.passedAt ? `Cutoff was ${formatTime(c.passedAt)}. ` : '';
  const alternative =
    fits.kind === 'drink'
      ? `${withArticle(fits.label)} (${fits.mg} mg) still fits until ${formatTime(fits.until)}.`
      : fits.kind === 'decaf-only'
        ? 'Only decaf fits now.'
        : fits.at !== null
          ? `You’ll be under ${target} mg by ${formatTime(fits.at)}.`
          : `You’ll stay over ${target} mg for a while.`;
  return (
    <Channel label={label} value="Not tonight">
      {passed}
      {alternative}
    </Channel>
  );
}

function Channel({ label, value, warn, children }: { label: string; value: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <div className="channel">
      <p className="channel__label">{label}</p>
      <p className="channel__value">{value}</p>
      <p className={`channel__note${warn ? ' channel__note--warn' : ''}`}>{children}</p>
    </div>
  );
}

function PastBedtime({ settings, label }: { settings: Settings; label: string }) {
  return (
    <Channel label={label} value="—">
      Tomorrow’s chart starts at {formatClockMin(settings.dayStartMin)}.
    </Channel>
  );
}

/** A linear measurement scale, not a progress bar: the reference is a ruled mark, today is a needle. */
function TodayMeter({ total, preview, limit }: { total: number; preview: number | null; limit: number }) {
  const max = Math.max(limit * 1.25, (preview ?? total) * 1.05, 100);
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
        {preview !== null && preview > total && (
          <rect className="meter-dose" x={pct(total)} y="6" width={`${Math.max(0, ((Math.min(preview, max) - total) / max) * 100)}%`} height="12" />
        )}
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
