import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  downloadExport,
  eraseEverything,
  importFile,
  removeCustomDrink,
  restoreCustomDrink,
  updateSettings,
} from '../data/store';
import type { Settings } from '../data/types';
import type { CaffeineEntry } from '../metrics/caffeine';
import type { CaffeineDay } from '../metrics/caffeine/derive';
import type { Drink } from '../metrics/caffeine/drinks';
import { doseActiveAfter } from '../metrics/caffeine/model';
import { formatTime, hhmmToMin, HOUR, minToHHMM } from '../lib/time';
import type { UndoAction } from '../App';
import { approx } from './Readout';
import { RecorderChart } from './RecorderChart';

interface Props {
  day: CaffeineDay;
  settings: Settings;
  entries: CaffeineEntry[];
  customDrinks: Drink[];
  persisted: boolean | null;
  /** Scroll to the evidence notes (route #/calibrate/evidence). */
  showEvidence: boolean;
  onToast: (message: string, undo?: Omit<UndoAction, 'at'>) => void;
}

/**
 * Settings: calibrating the recorder to your body and your day. A live
 * chart sits beside the controls so every change shows its effect.
 */
export function Calibrate({ day, settings, entries, customDrinks, persisted, showEvidence, onToast }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const evidenceRef = useRef<HTMLElement>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const entryCount = entries.length;

  useEffect(() => {
    if (showEvidence) evidenceRef.current?.scrollIntoView({ block: 'start' });
  }, [showEvidence]);

  const set = (patch: Partial<Settings>) => void updateSettings(patch);
  const coffeeLeft = Math.round(doseActiveAfter(95, 8 * HOUR, { halfLifeHours: settings.halfLifeHours }));
  const c = day.cutoff;
  const liveSummary =
    c.kind === 'latest'
      ? `Last ${day.referenceDose.label} today: ${formatTime(c.at)} · ${approx(day.activeAtBedtime)} mg at bedtime`
      : c.kind === 'over'
        ? `No more ${day.referenceDose.label} today · ${approx(day.activeAtBedtime)} mg at bedtime`
        : `Past bedtime · ${approx(day.activeNow)} mg active now`;

  return (
    <div className="calibrate">
      <div className="calibrate__intro">
        <h1>Settings</h1>
        <p>
          Calibrate the recorder to your body and your day. It starts from population averages; changes save
          automatically and the chart redraws as you go.
        </p>
      </div>

      <aside className="calibrate__preview" aria-label="Live preview">
        <div className="bezel bezel--compact">
          <div className="bezel__plate" aria-hidden="true">
            <span>
              <span className="pen-swatch" />
              Today, as calibrated
            </span>
          </div>
          <RecorderChart day={day} previewDay={null} preview={null} settings={settings} entries={entries} replotKey={0} />
        </div>
        <p className="calibrate__summary" aria-live="polite">
          {liveSummary}
        </p>
      </aside>

      <div className="calibrate__controls">
        <section className="cal-section" aria-labelledby="cal-body">
          <h2 id="cal-body">Your body</h2>

          <div className="cal-row">
            <label className="cal-row__label" htmlFor="half-life">
              Caffeine half-life
            </label>
            <p className="cal-row__help">
              How long your body takes to clear half of it. Most adults fall between 4 and 6 hours, but it ranges from
              about 2 to 10. Smoking shortens it; pregnancy, oral contraceptives and some medications lengthen it a lot.
              If an afternoon coffee keeps you up, try a longer value. At {settings.halfLifeHours} h, a 95 mg coffee
              still leaves about {coffeeLeft} mg after 8 hours.
            </p>
            <Slider id="half-life" value={settings.halfLifeHours} display={`${settings.halfLifeHours.toFixed(1)} h`} min={2} max={10} step={0.5} unit="h" onChange={(v) => set({ halfLifeHours: v })} />
          </div>
        </section>

        <section className="cal-section" aria-labelledby="cal-day">
          <h2 id="cal-day">Your day</h2>

          <div className="cal-row">
            <label className="cal-row__label" htmlFor="bedtime">
              Usual bedtime
            </label>
            <p className="cal-row__help">The last-cup time works backwards from here.</p>
            <div className="cal-row__control">
              <input
                id="bedtime"
                className="input"
                type="time"
                value={minToHHMM(settings.bedtimeMin)}
                onChange={(e) => {
                  const v = hhmmToMin(e.target.value);
                  if (v !== null) set({ bedtimeMin: v });
                }}
              />
            </div>
          </div>

          <div className="cal-row">
            <label className="cal-row__label" htmlFor="target">
              Bedtime target
            </label>
            <p className="cal-row__help">
              The most caffeine you want still active when you go to bed. No study sets a safe level. 30 mg lines up
              with a 2023 meta-analysis that found coffee should come at least 8.8 hours before bed. Lower it if you
              sleep lightly.
            </p>
            <Slider id="target" value={settings.bedtimeTargetMg} display={`${settings.bedtimeTargetMg} mg`} min={0} max={100} step={5} unit="mg" onChange={(v) => set({ bedtimeTargetMg: v })} />
          </div>

          <div className="cal-row">
            <label className="cal-row__label" htmlFor="limit">
              Daily reference
            </label>
            <p className="cal-row__help">
              400 mg a day is the figure the FDA and EFSA cite for healthy adults. Guidance during pregnancy or
              breastfeeding is 200 mg (EFSA, ACOG). Teenagers: about 2.5 mg per kg of body weight.
            </p>
            <Slider id="limit" value={settings.dailyLimitMg} display={`${settings.dailyLimitMg} mg`} min={100} max={600} step={25} unit="mg" onChange={(v) => set({ dailyLimitMg: v })} />
          </div>

          <div className="cal-row">
            <label className="cal-row__label" htmlFor="day-start">
              Day starts at
            </label>
            <p className="cal-row__help">
              Drinks before this time count toward the previous day, so a 1 a.m. study espresso belongs to the night it
              was part of.
            </p>
            <div className="cal-row__control">
              <input
                id="day-start"
                className="input"
                type="time"
                value={minToHHMM(settings.dayStartMin)}
                onChange={(e) => {
                  const v = hhmmToMin(e.target.value);
                  if (v !== null) set({ dayStartMin: v });
                }}
              />
            </div>
          </div>

          <div className="cal-actions">
            <button
              className="btn btn--quiet"
              type="button"
              onClick={() => {
                const previous = settings;
                void updateSettings({ ...DEFAULT_SETTINGS, acknowledgedAt: settings.acknowledgedAt, lastExportAt: settings.lastExportAt });
                onToast('Settings reset to defaults', { run: () => updateSettings(previous), done: 'Settings restored' });
              }}
            >
              Reset to defaults
            </button>
          </div>
        </section>

        <section className="cal-section" aria-labelledby="cal-usuals">
          <h2 id="cal-usuals">Your usuals</h2>
          {customDrinks.length === 0 ? (
            <p className="fineprint">
              None yet. Use “Other drink” on the Today page to save a drink you have often, like your office coffee,
              with its own caffeine amount.
            </p>
          ) : (
            <ul className="cal-list">
              {customDrinks.map((d) => (
                <li key={d.id}>
                  <span>
                    {d.label} · <b>{d.mg} mg</b>
                  </span>
                  <button
                    className="btn btn--quiet btn--sm btn--danger"
                    type="button"
                    onClick={() => {
                      void removeCustomDrink(d.id);
                      onToast(`Removed ${d.label}`, { run: () => restoreCustomDrink(d), done: `Restored ${d.label}` });
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cal-section" aria-labelledby="cal-data">
          <h2 id="cal-data">Your data</h2>
          <div className="fineprint">
            <p>
              Your log ({entryCount} {entryCount === 1 ? 'entry' : 'entries'}) is stored only in this browser on this
              device. Nothing is uploaded. There’s no account and no tracking.
              {persisted === false &&
                ' This browser may clear it if storage runs low or you don’t visit for a while, so export a backup now and then. Adding the app to your home screen helps.'}
            </p>
          </div>
          <div className="cal-actions">
            <button className="btn" type="button" onClick={() => void downloadExport().then(() => onToast('Backup downloaded'))}>
              Export backup (.json)
            </button>
            <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
              Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  const r = await importFile(file);
                  setImportError(null);
                  onToast(
                    `Imported ${r.imported} ${r.imported === 1 ? 'entry' : 'entries'}` +
                      (r.unchanged ? `, ${r.unchanged} already up to date` : '') +
                      (r.skipped ? `, skipped ${r.skipped} unreadable` : ''),
                  );
                } catch (err) {
                  setImportError(err instanceof Error ? err.message : 'That file couldn’t be imported.');
                }
              }}
            />
            {!confirmErase ? (
              <button className="btn btn--quiet btn--danger" type="button" onClick={() => setConfirmErase(true)}>
                Erase everything…
              </button>
            ) : (
              <>
                <button
                  className="btn btn--danger-solid"
                  type="button"
                  onClick={async () => {
                    await eraseEverything();
                    setConfirmErase(false);
                    onToast('All data erased from this browser');
                  }}
                >
                  Erase {entryCount} {entryCount === 1 ? 'entry' : 'entries'} and settings
                </button>
                <button className="btn btn--quiet" type="button" onClick={() => setConfirmErase(false)}>
                  Keep my data
                </button>
              </>
            )}
          </div>
          {importError && (
            <p className="error" role="alert" style={{ marginTop: 12 }}>
              {importError}
            </p>
          )}
        </section>

        <section className="cal-section" aria-labelledby="cal-evidence" id="evidence" ref={evidenceRef}>
          <h2 id="cal-evidence">Using caffeine well: what the evidence says</h2>
          <div className="fineprint">
            <p>
              <b>Small doses work.</b> Around 75 mg is enough to raise alertness (EFSA); studies find effects from as
              little as 32 mg. For regular drinkers, part of the morning lift is relief from overnight withdrawal.
            </p>
            <p>
              <b>Time it against your bedtime, not the clock.</b> In a 2023 meta-analysis, a coffee needed at least 8.8
              hours and a pre-workout 13.2 hours before bed to stop measurably shortening sleep. 400 mg taken six hours
              before bed cost over an hour of sleep, and people didn’t notice.
            </p>
            <p>
              <b>The “wait 90 minutes after waking” rule isn’t backed by trials.</b> Drink when it suits you.
            </p>
            <p>
              <b>Coffee naps have small but consistent support.</b> About 150–200 mg followed straight away by a 15–20
              minute nap beat either one alone in driving studies.
            </p>
            <p>
              <b>Cutting back?</b> Withdrawal can follow stopping as little as 100 mg a day. It starts 12–24 hours later,
              peaks at 1–2 days and can last up to 9. Lowering your daily reference by about a quarter each week is a
              gentler way down.
            </p>
            <p>
              Every number here is an estimate for healthy adults built on population averages. It is not medical
              advice. Ask a clinician if you’re pregnant, take medication, or have a heart or liver condition. Intended
              for ages 18+.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Slider({
  id,
  value,
  display,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  id: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="cal-row__control">
      <output htmlFor={id}>{display}</output>
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={display} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="slider__ends" aria-hidden="true">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </span>
    </div>
  );
}
