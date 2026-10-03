import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { logCaffeine, saveCustomDrink } from '../data/store';
import type { Settings } from '../data/types';
import type { CaffeineEntry } from '../metrics/caffeine';
import type { CaffeineDay } from '../metrics/caffeine/derive';
import { DRINKS, type Drink, type DrinkKind } from '../metrics/caffeine/drinks';
import { DAY, formatTime, hhmmToMin, MINUTE, minToHHMM } from '../lib/time';
import { approx } from './Readout';
import type { Preview } from './RecorderChart';

interface Props {
  quick: Drink[];
  customDrinks: Drink[];
  now: number;
  day: CaffeineDay;
  previewDay: CaffeineDay | null;
  settings: Settings;
  /** Report the drink being considered so the chart can ghost it. */
  onPreview: (p: Preview | null) => void;
  onLogged: (entry: CaffeineEntry) => void;
}

const PORTIONS = [
  { value: 0.5, label: '½' },
  { value: 1, label: '1' },
  { value: 1.5, label: '1½' },
  { value: 2, label: '2' },
] as const;

const WHEN = [
  { value: 0, label: 'Now', ago: false },
  { value: 15, label: '15 min', ago: true },
  { value: 30, label: '30 min', ago: true },
  { value: 60, label: '1 h', ago: true },
  { value: -1, label: 'Earlier…', ago: false },
] as const;

const KIND_LABEL: Record<DrinkKind, string> = {
  coffee: 'Coffee',
  tea: 'Tea',
  energy: 'Energy drinks',
  soda: 'Soda',
  other: 'Other',
};

interface Armed {
  drink: Drink;
  portion: number;
  /** mg per serving, editable. */
  mgPerServing: string;
  whenAgo: number;
  earlier: string;
  adjusting: boolean;
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/**
 * Event-marker keys. Tap a drink to arm it: the chart ghosts what it would
 * do, the decision strip and readouts show the shift, and a second tap on
 * the same key logs it. "Adjust" opens amount, servings and time.
 * Keyboard: 1–9 arm a key (again to log), Enter logs, Esc cancels.
 */
export function EventDeck({ quick, customDrinks, now, day, previewDay, settings, onPreview, onLogged }: Props) {
  const [armed, setArmed] = useState<Armed | null>(null);
  const [hovered, setHovered] = useState<Drink | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ids = useId();

  const armedMg = armed ? Number(armed.mgPerServing) * armed.portion : 0;
  const armedAt = armed ? resolveTime(armed, now) : now;

  // A drink armed from the picker gets a temporary key, so "tap again to log" always works.
  const keys = useMemo(
    () => (armed && !quick.some((d) => d.id === armed.drink.id) ? [...quick, armed.drink] : quick),
    [quick, armed],
  );

  const commit = useCallback(async () => {
    if (!armed || saving) return;
    if (!Number.isFinite(armedMg) || armedMg <= 0) return setError('Enter the caffeine in mg, e.g. 95');
    if (armedAt === null) return setError('Enter a time like 14:30');
    setSaving(true);
    const portion = PORTIONS.find((p) => p.value === armed.portion)?.label;
    const label = armed.portion === 1 ? armed.drink.label : `${armed.drink.label} ×${portion}`;
    const result = await logCaffeine({ label, mg: armedMg, at: armedAt, drinkId: armed.drink.id });
    setSaving(false);
    if (result.error !== undefined) return setError(result.error);
    onLogged(result.entry);
    setArmed(null);
    setHovered(null);
  }, [armed, armedMg, armedAt, saving, onLogged]);

  const arm = useCallback(
    (drink: Drink) => {
      setError(null);
      setPicking(false);
      if (armed?.drink.id === drink.id) {
        void commit();
        return;
      }
      const d = new Date(now);
      setArmed({ drink, portion: 1, mgPerServing: String(drink.mg), whenAgo: 0, earlier: minToHHMM(d.getHours() * 60 + d.getMinutes()), adjusting: false });
    },
    [armed, commit, now],
  );

  // Feed the chart preview.
  useEffect(() => {
    if (armed && Number.isFinite(armedMg) && armedMg > 0 && armedAt !== null) {
      onPreview({ at: armedAt, mg: armedMg, label: armed.drink.label });
    } else if (!armed && hovered) {
      onPreview({ at: now, mg: hovered.mg, label: hovered.label });
    } else {
      onPreview(null);
    }
  }, [armed, armedMg, armedAt, hovered, now, onPreview]);

  // Keyboard accelerators (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (armed || picking)) {
        setArmed(null);
        setPicking(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (/^[1-9]$/.test(e.key)) {
        const d = keys[Number(e.key) - 1];
        if (d) {
          e.preventDefault();
          arm(d);
        }
        return;
      }
      // Enter on a focused button already activates it; only handle Enter elsewhere.
      if (e.key === 'Enter' && armed && !(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) {
        e.preventDefault();
        void commit();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [armed, picking, keys, arm, commit]);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    void commit();
  };

  const logLabel = `Log ${Number.isFinite(armedMg) && armedMg > 0 ? `${Math.round(armedMg)} mg` : 'drink'}${
    armed && armedAt !== null && armed.whenAgo !== 0 ? ` at ${formatTime(armedAt)}` : ''
  }`;

  return (
    <section className="deck" aria-labelledby={`${ids}-title`}>
      <div className="deck__head">
        <h2 className="section-title" id={`${ids}-title`}>
          Log a drink
        </h2>
        <p className="section-hint">
          <span className="hint--touch">Tap a drink to preview it. Tap again to log.</span>
          <span className="hint--pointer">Pick a drink to preview it, again to log · keys 1–{Math.min(9, keys.length)}, Enter, Esc</span>
        </p>
      </div>

      <div className="keys">
        {keys.map((d, i) => {
          const isArmed = armed?.drink.id === d.id;
          const mg = isArmed && Number.isFinite(armedMg) && armedMg > 0 ? Math.round(armedMg) : d.mg;
          return (
            <button
              key={d.id}
              type="button"
              className="key"
              aria-pressed={isArmed}
              aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
              aria-label={isArmed ? `Log ${d.label}, ${mg} mg` : `${d.label}, ${d.mg} mg`}
              onClick={() => arm(d)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(d)}
              onPointerLeave={() => setHovered(null)}
            >
              {i < 9 && (
                <span className="key__legend" aria-hidden="true">
                  {i + 1}
                </span>
              )}
              <span className="key__name">{d.label}</span>
              <span className="key__mg">{isArmed ? `Log ${mg} mg` : `${d.mg} mg`}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="key key--other"
          aria-expanded={picking}
          onClick={() => {
            setPicking((v) => !v);
            setArmed(null);
          }}
        >
          <span className="key__name">Other drink</span>
          <span className="key__mg">{picking ? 'Close' : 'All drinks'}</span>
        </button>
      </div>

      <DecisionStrip day={day} previewDay={previewDay} settings={settings} label={armed?.drink.label ?? hovered?.label ?? null} />

      {picking && <Picker customDrinks={customDrinks} onPick={arm} onHover={setHovered} />}

      {armed && (
        <form className="composer" onSubmit={submit}>
          <div className="composer__row composer__row--summary">
            <p className="composer__summary">
              <strong>{armed.drink.label}</strong> · {armed.drink.serving}
              {armed.drink.range && ` · usually ${armed.drink.range[0]}–${armed.drink.range[1]} mg`}
            </p>
            <div className="composer__actions">
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {logLabel}
              </button>
              <button
                className="btn"
                type="button"
                aria-expanded={armed.adjusting}
                onClick={() => setArmed({ ...armed, adjusting: !armed.adjusting })}
              >
                {armed.adjusting ? 'Done adjusting' : 'Adjust'}
              </button>
              <button className="btn btn--quiet" type="button" onClick={() => setArmed(null)}>
                Cancel
              </button>
            </div>
          </div>
          {armed.adjusting && (
            <div className="composer__row">
              <label className="field">
                <span>Caffeine per serving</span>
                <span className="field__inline">
                  <input
                    className="input input--mg"
                    inputMode="numeric"
                    value={armed.mgPerServing}
                    aria-invalid={!(Number(armed.mgPerServing) > 0)}
                    onChange={(e) => setArmed({ ...armed, mgPerServing: e.target.value.replace(/[^\d.]/g, '') })}
                  />
                  mg
                </span>
              </label>
              <fieldset className="fieldset">
                <legend>Servings</legend>
                <div className="segmented">
                  {PORTIONS.map((p) => (
                    <label key={p.value}>
                      <input type="radio" name={`${ids}-portion`} checked={armed.portion === p.value} onChange={() => setArmed({ ...armed, portion: p.value })} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="fieldset">
                <legend>When</legend>
                <div className="segmented segmented--when">
                  {WHEN.map((w) => (
                    <label key={w.value}>
                      <input type="radio" name={`${ids}-when`} checked={armed.whenAgo === w.value} onChange={() => setArmed({ ...armed, whenAgo: w.value })} />
                      {w.label}
                      {w.ago && <span className="ago"> ago</span>}
                    </label>
                  ))}
                </div>
              </fieldset>
              {armed.whenAgo === -1 && (
                <label className="field">
                  <span>Time</span>
                  <input className="input" type="time" value={armed.earlier} onChange={(e) => setArmed({ ...armed, earlier: e.target.value })} />
                </label>
              )}
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

/**
 * One line with the consequence of the drink being considered, right under
 * the keys where the decision happens (the readout can be off-screen on a
 * phone). Also the live announcement for screen readers.
 */
function DecisionStrip({
  day,
  previewDay,
  settings,
  label,
}: {
  day: CaffeineDay;
  previewDay: CaffeineDay | null;
  settings: Settings;
  label: string | null;
}) {
  const parts =
    previewDay && label
      ? [
          day.now < day.bedtime
            ? `bedtime ${approx(day.activeAtBedtime)} → ${approx(previewDay.activeAtBedtime)} mg, ${
                previewDay.activeAtBedtime > settings.bedtimeTargetMg ? 'over' : 'under'
              } your ${settings.bedtimeTargetMg} mg target`
            : null,
          `today ${day.todayTotal} → ${previewDay.todayTotal} mg`,
        ].filter(Boolean)
      : [];
  const text = parts.length ? `With ${label!.toLowerCase()}: ${parts.join(' · ')}` : '';
  const over = previewDay ? previewDay.activeAtBedtime > settings.bedtimeTargetMg && day.now < day.bedtime : false;
  return (
    <p className={`decision${text ? ' decision--on' : ''}${over ? ' decision--over' : ''}`} aria-live="polite">
      {text}
    </p>
  );
}

function resolveTime(a: Armed, now: number): number | null {
  if (a.whenAgo >= 0) return now - a.whenAgo * MINUTE;
  const min = hhmmToMin(a.earlier);
  if (min === null) return null;
  const d = new Date(now);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  // A time later than now means yesterday (e.g. logging last night's drink after midnight).
  return d.getTime() > now ? d.getTime() - DAY : d.getTime();
}

function Picker({ customDrinks, onPick, onHover }: { customDrinks: Drink[]; onPick: (d: Drink) => void; onHover: (d: Drink | null) => void }) {
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [mg, setMg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const ids = useId();

  useEffect(() => {
    if (window.matchMedia('(hover: hover)').matches) searchRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const match = (d: Drink) => !q || d.label.toLowerCase().includes(q) || d.kind.includes(q);
  const groups = [
    ...(customDrinks.length ? [{ key: 'usuals', title: 'Your usuals', drinks: customDrinks.filter(match) }] : []),
    ...(Object.keys(KIND_LABEL) as DrinkKind[]).map((kind) => ({ key: kind, title: KIND_LABEL[kind], drinks: DRINKS.filter((d) => d.kind === kind && match(d)) })),
  ].filter((g) => g.drinks.length > 0);

  const addCustom = async (ev: FormEvent) => {
    ev.preventDefault();
    const value = Number(mg);
    if (!name.trim()) return setError('Name the drink, e.g. “Office coffee”');
    if (!(value > 0 && value <= 1000)) return setError('Caffeine must be between 1 and 1000 mg');
    const saved = await saveCustomDrink({ label: name.trim().slice(0, 60), mg: Math.round(value), serving: 'my usual', kind: 'other' });
    setName('');
    setMg('');
    setError(null);
    onPick(saved);
  };

  return (
    <div className="picker" onPointerLeave={() => onHover(null)}>
      <label className="field picker__search">
        <span>Find a drink</span>
        <input
          ref={searchRef}
          className="input"
          type="search"
          placeholder="e.g. cold brew, tea, energy"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && groups[0]?.drinks[0]) {
              e.preventDefault();
              onPick(groups[0].drinks[0]);
            }
          }}
        />
      </label>

      <div className="picker__groups">
        {groups.map((g) => (
          <div className="picker__group" key={g.key}>
            <h3>{g.title}</h3>
            <ul className="picker__list">
              {g.drinks.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="picker__item"
                    onClick={() => onPick(d)}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(d)}
                  >
                    <span>{d.label}</span>
                    <b>{d.mg} mg</b>
                    <small>
                      {d.serving}
                      {d.range && ` · ${d.range[0]}–${d.range[1]} mg`}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {groups.length === 0 && <p className="fineprint">No preset matches “{query}”. Add it as your own drink below.</p>}
      </div>

      <form className="composer__row picker__custom" onSubmit={addCustom} aria-labelledby={`${ids}-custom`}>
        <label className="field">
          <span id={`${ids}-custom`}>Your own drink</span>
          <input className="input input--name" placeholder="e.g. Office coffee" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        <label className="field">
          <span>Caffeine</span>
          <span className="field__inline">
            <input className="input input--mg" inputMode="numeric" placeholder="mg" value={mg} onChange={(e) => setMg(e.target.value.replace(/[^\d.]/g, ''))} />
            mg
          </span>
        </label>
        <button className="btn" type="submit">
          Save as a usual
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
