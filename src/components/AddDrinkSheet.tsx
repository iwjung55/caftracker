import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Settings } from '../data/types';
import { type Advice, tagFor } from '../advice/engine';
import type { CaffeineDay } from '../metrics/caffeine/derive';
import { DRINKS, type Drink, type DrinkKind } from '../metrics/caffeine/drinks';
import { DAY, hhmmToMin, MINUTE, minToHHMM } from '../lib/time';

interface Props {
  open: boolean;
  onClose: () => void;
  usual: Drink[];
  customDrinks: Drink[];
  advice: Advice;
  day: CaffeineDay;
  settings: Settings;
  /** Log `drink` at time `at` (and save it as a usual first if it's new). */
  onPick: (drink: Drink, at: number) => void;
  onAddCustom: (label: string, mg: number, at: number) => Promise<string | null>;
}

const GROUPS: { kind: DrinkKind; title: string }[] = [
  { kind: 'energy', title: 'Energy drinks' },
  { kind: 'coffee', title: 'Coffee' },
  { kind: 'tea', title: 'Tea' },
  { kind: 'soda', title: 'Soda' },
  { kind: 'other', title: 'Other' },
];

const WHEN = [
  { value: '0', label: 'Now' },
  { value: '15', label: '15 min ago' },
  { value: '30', label: '30 min ago' },
  { value: '60', label: '1 hour ago' },
  { value: 'earlier', label: 'Earlier…' },
] as const;

/**
 * The whole logging flow: tap the one button, tap a drink, done. Every row
 * carries the suggestion for having that drink now, so the choice is made
 * with the advice in view.
 */
export function AddDrinkSheet({ open, onClose, usual, customDrinks, advice, day, settings, onPick, onAddCustom }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [when, setWhen] = useState<string>('0');
  const [earlier, setEarlier] = useState('');
  const [custom, setCustom] = useState({ open: false, name: '', mg: '', error: '' });
  const ids = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery('');
      setWhen('0');
      const d = new Date(day.now);
      setEarlier(minToHHMM(d.getHours() * 60 + d.getMinutes()));
      setCustom({ open: false, name: '', mg: '', error: '' });
      dialog.showModal();
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) searchRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, day.now]);

  const at = useMemo(() => {
    if (when !== 'earlier') return day.now - Number(when) * MINUTE;
    const min = hhmmToMin(earlier);
    if (min === null) return day.now;
    const d = new Date(day.now);
    d.setHours(Math.floor(min / 60), min % 60, 0, 0);
    return d.getTime() > day.now ? d.getTime() - DAY : d.getTime();
  }, [when, earlier, day.now]);

  const q = query.trim().toLowerCase();
  const all = [...customDrinks, ...DRINKS];
  const matches = q ? all.filter((d) => `${d.label} ${d.brand ?? ''} ${d.kind}`.toLowerCase().includes(q)) : [];

  const pick = (d: Drink) => {
    onPick(d, at);
    onClose();
  };

  const submitCustom = async (ev: FormEvent) => {
    ev.preventDefault();
    const mg = Number(custom.mg);
    if (!custom.name.trim()) return setCustom({ ...custom, error: 'Name the drink, e.g. “Office coffee”' });
    if (!(mg > 0 && mg <= 1000)) return setCustom({ ...custom, error: 'Caffeine must be between 1 and 1000 mg' });
    const error = await onAddCustom(custom.name.trim().slice(0, 60), Math.round(mg), at);
    if (error) return setCustom({ ...custom, error });
    onClose();
  };

  const row = (d: Drink) => {
    const tag = tagFor(d.mg, advice, day, settings);
    return (
      <li key={d.id}>
        <button type="button" className="drink-row" onClick={() => pick(d)}>
          <span className="drink-row__name">{d.label}</span>
          <span className="drink-row__mg">{d.mg} mg</span>
          <span className="drink-row__serving">{d.serving}</span>
          <span className="drink-row__tag" data-tone={tag.tone}>
            {tag.text}
          </span>
        </button>
      </li>
    );
  };

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      onClick={(e) => {
        // Tapping the backdrop closes the sheet.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="sheet__inner">
        <header className="sheet__head">
          <h2 className="sheet__title" id={`${ids}-title`}>
            Add a drink
          </h2>
          <button className="btn btn--quiet sheet__close" type="button" onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>

        <div className="sheet__controls">
          <label className="field sheet__search">
            <span className="sr-only">Find a drink</span>
            <input
              ref={searchRef}
              className="input"
              type="search"
              placeholder="Search: Red Bull, latte, Celsius…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) {
                  e.preventDefault();
                  pick(matches[0]);
                }
              }}
            />
          </label>
          <label className="field sheet__when">
            <span className="sr-only">When</span>
            <select className="input" value={when} onChange={(e) => setWhen(e.target.value)}>
              {WHEN.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          {when === 'earlier' && (
            <label className="field">
              <span className="sr-only">Time</span>
              <input className="input" type="time" value={earlier} onChange={(e) => setEarlier(e.target.value)} />
            </label>
          )}
        </div>

        <div className="sheet__body">
          {q ? (
            matches.length ? (
              <ul className="drink-list">{matches.map(row)}</ul>
            ) : (
              <p className="sheet__empty">No drink matches “{query}”. Add it as your own below.</p>
            )
          ) : (
            <>
              {usual.length > 0 && (
                <section className="drink-group">
                  <h3>Your usual</h3>
                  <ul className="drink-list">{usual.map(row)}</ul>
                </section>
              )}
              {GROUPS.map(({ kind, title }) => {
                const drinks = DRINKS.filter((d) => d.kind === kind && !usual.some((u) => u.id === d.id));
                return drinks.length ? (
                  <section className="drink-group" key={kind}>
                    <h3>{title}</h3>
                    <ul className="drink-list">{drinks.map(row)}</ul>
                  </section>
                ) : null;
              })}
            </>
          )}

          <section className="drink-group drink-group--custom">
            {!custom.open ? (
              <button className="btn" type="button" onClick={() => setCustom({ ...custom, open: true })}>
                Not listed? Add your own
              </button>
            ) : (
              <form className="custom-drink" onSubmit={submitCustom}>
                <label className="field">
                  <span>Drink</span>
                  <input className="input" placeholder="e.g. Office coffee" value={custom.name} maxLength={60} onChange={(e) => setCustom({ ...custom, name: e.target.value, error: '' })} />
                </label>
                <label className="field">
                  <span>Caffeine</span>
                  <span className="field__inline">
                    <input className="input input--mg" inputMode="numeric" placeholder="mg" value={custom.mg} onChange={(e) => setCustom({ ...custom, mg: e.target.value.replace(/[^\d.]/g, ''), error: '' })} />
                    mg
                  </span>
                </label>
                <button className="btn btn--primary" type="submit">
                  Save and log
                </button>
                {custom.error && (
                  <p className="error" role="alert">
                    {custom.error}
                  </p>
                )}
              </form>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}
