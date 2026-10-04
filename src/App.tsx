import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acknowledgeNotice,
  backupStatus,
  logCaffeine,
  removeCaffeine,
  saveCustomDrink,
  undoRemove,
  useAppState,
} from './data/store';
import type { CaffeineEntry } from './metrics/caffeine';
import { deriveDay, quickDrinks } from './metrics/caffeine/derive';
import { DRINKS, type Drink } from './metrics/caffeine/drinks';
import { advise, type Option } from './advice/engine';
import { formatDate, formatTime } from './lib/time';
import { withArticle } from './lib/format';
import { useNow, useRoute } from './lib/hooks';
import { RecorderChart } from './components/RecorderChart';
import { Suggestion } from './components/Suggestion';
import { Metrics } from './components/Metrics';
import { AddDrinkSheet } from './components/AddDrinkSheet';
import { TodayLog } from './components/TodayLog';
import { Archive } from './components/Archive';
import { Calibrate } from './components/Calibrate';

interface Toast {
  id: number;
  message: string;
  /** Show an Undo button that runs the pending undo action. */
  undoable: boolean;
  /** Entry the "Change time" action opens for editing. */
  editId?: string;
}

/** The one action that Undo (toast button, inline row button or Ctrl/Cmd+Z) reverses. */
export interface UndoAction {
  run: () => Promise<void>;
  /** Confirmation once undone, e.g. "Removed Espresso". */
  done: string;
  at: number;
}

/** Long enough to read and reach by keyboard; paused while hovered or focused. */
const TOAST_MS = 12_000;
/** Ctrl/Cmd+Z keeps working this long after the toast is gone. */
const UNDO_WINDOW_MS = 5 * 60_000;

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function App() {
  const state = useAppState();
  const route = useRoute();
  const now = useNow(30_000);
  const [replotKey, setReplotKey] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [toastPaused, setToastPaused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const undoRef = useRef<UndoAction | null>(null);

  const { entries, settings } = state;
  const day = useMemo(() => deriveDay(entries, settings, now), [entries, settings, now]);
  // Your usual drinks, ordered from history before today so they don't move while you log.
  const usual = useMemo(() => quickDrinks(entries, state.customDrinks, day.dayStart), [entries, state.customDrinks, day.dayStart]);

  // What the suggestion engine may propose: your usual drinks, half your usual, and two light options.
  const options = useMemo<Option[]>(() => {
    const light = ['black-tea', 'green-tea'].map((id) => DRINKS.find((d) => d.id === id)!);
    const list: Option[] = [...usual, ...light].map((d) => ({ label: d.label.toLowerCase(), mg: d.mg, drinkId: d.id }));
    list.push({ label: `half ${withArticle(day.referenceDose.label)}`, mg: Math.round(day.referenceDose.mg / 2) });
    return list;
  }, [usual, day.referenceDose]);
  const advice = useMemo(() => advise(entries, settings, day, options), [entries, settings, day, options]);

  const showToast = useCallback((message: string, undo?: Omit<UndoAction, 'at'>, editId?: string) => {
    if (undo) undoRef.current = { ...undo, at: Date.now() };
    setToastPaused(false);
    setToast({ id: Date.now(), message, undoable: Boolean(undo), editId });
  }, []);

  const runUndo = useCallback(async () => {
    const u = undoRef.current;
    if (!u || Date.now() - u.at > UNDO_WINDOW_MS) return;
    undoRef.current = null;
    await u.run();
    setReplotKey((k) => k + 1);
    setToast({ id: Date.now(), message: u.done, undoable: false });
  }, []);

  // Toast timer, paused while the pointer or focus is on it.
  useEffect(() => {
    if (!toast || toastPaused) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast, toastPaused]);

  // Keyboard: A opens the drink sheet; Ctrl/Cmd+Z undoes the last log, delete or settings change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || sheetOpen) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && undoRef.current) {
        e.preventDefault();
        void runUndo();
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'a' && !route.startsWith('calibrate')) {
        e.preventDefault();
        setSheetOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [runUndo, sheetOpen, route]);

  const onLogged = useCallback(
    (entry: CaffeineEntry) => {
      setReplotKey((k) => k + 1);
      showToast(
        `Logged ${entry.data.label} · ${entry.value} mg${Math.abs(entry.startAt - Date.now()) > 2 * 60_000 ? ` at ${formatTime(entry.startAt)}` : ''}`,
        { run: () => removeCaffeine(entry.id), done: `Removed ${entry.data.label}` },
        entry.id,
      );
    },
    [showToast],
  );

  const logDrink = useCallback(
    async (label: string, mg: number, at: number, drinkId?: string) => {
      const result = await logCaffeine({ label, mg, at, drinkId });
      if (result.entry) onLogged(result.entry);
      else showToast(result.error);
      return result.error ?? null;
    },
    [onLogged, showToast],
  );

  const onPick = useCallback((d: Drink, at: number) => void logDrink(d.label, d.mg, at, d.id), [logDrink]);

  const onAddCustom = useCallback(
    async (label: string, mg: number, at: number) => {
      const saved = await saveCustomDrink({ label, mg, serving: 'your own', kind: 'other' });
      return logDrink(saved.label, saved.mg, at, saved.id);
    },
    [logDrink],
  );

  const onLogOption = useCallback(
    (o: Option) => {
      const drink = o.drinkId ? [...state.customDrinks, ...DRINKS].find((d) => d.id === o.drinkId) : undefined;
      void logDrink(drink?.label ?? o.label.charAt(0).toUpperCase() + o.label.slice(1), o.mg, Date.now(), o.drinkId);
    },
    [logDrink, state.customDrinks],
  );

  const onUndoLog = useCallback((entry: CaffeineEntry) => {
    void removeCaffeine(entry.id).then(() => {
      undoRef.current = null;
      setReplotKey((k) => k + 1);
      setToast({ id: Date.now(), message: `Removed ${entry.data.label}`, undoable: false });
    });
  }, []);

  const onRemoved = useCallback(
    (entry: CaffeineEntry) => {
      showToast(`Deleted ${entry.data.label} · ${formatTime(entry.startAt)}`, {
        run: () => undoRemove(),
        done: `Restored ${entry.data.label}`,
      });
    },
    [showToast],
  );

  const changeTime = (id: string) => {
    setToast(null);
    setEditingId(id);
    requestAnimationFrame(() => document.getElementById(`entry-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  const onSettings = route.startsWith('calibrate');

  return (
    <div className={`shell${onSettings ? '' : ' shell--today'}`}>
      <header className="topbar">
        <a className="wordmark" href="#/">
          Caffeine Recorder
        </a>
        <span className="topbar__date">{formatDate(now)}</span>
        <span className="topbar__spacer" />
        <Lamp status={backupStatus(state, now)} />
        <nav className="nav" aria-label="Main">
          <a className="navlink" href="#/" aria-current={!onSettings ? 'page' : undefined}>
            Today
          </a>
          <a className="navlink" href="#/calibrate" aria-current={onSettings ? 'page' : undefined}>
            Settings
          </a>
        </nav>
      </header>

      {state.status === 'ready' && !settings.acknowledgedAt && (
        <div className="notice" role="note">
          <p>
            <strong>Estimates, not medical advice.</strong> Built on averages for healthy adults 18+; bodies differ. Your
            log stays in this browser.
          </p>
          <button className="btn" type="button" onClick={() => void acknowledgeNotice()}>
            Got it
          </button>
        </div>
      )}

      {state.status === 'error' ? (
        <div className="notice notice--error" role="alert">
          <p>
            <strong>Storage unavailable.</strong> {state.error} Try a regular (not private) window, or allow site data for
            this page in your browser settings, then reload.
          </p>
          <button className="btn" type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      ) : onSettings ? (
        <main>
          <Calibrate
            day={day}
            settings={settings}
            entries={entries}
            customDrinks={state.customDrinks}
            persisted={state.persisted}
            showEvidence={route === 'calibrate/evidence'}
            onToast={showToast}
          />
        </main>
      ) : (
        <main className="dashboard" aria-busy={state.status === 'loading'}>
          <h1 className="sr-only">Today’s caffeine</h1>
          <Suggestion advice={advice} settings={settings} onLogOption={onLogOption} onAdd={() => setSheetOpen(true)} />

          <div className="recorder">
            <div className="bezel">
              <div className="bezel__plate" aria-hidden="true">
                <span>
                  <span className="pen-swatch" />
                  Caffeine active · mg
                </span>
                <span>{formatTime(now)}</span>
              </div>
              <RecorderChart
                day={day}
                settings={settings}
                entries={entries}
                replotKey={replotKey}
                focus={{
                  from: advice.profile.focusStart,
                  to: advice.profile.focusEnd,
                  floor: advice.profile.floorMg,
                  ceiling: advice.profile.ceilingMg,
                  topUpAt: advice.verdict.kind === 'top-up' ? advice.verdict.at : null,
                }}
              />
            </div>
            <Metrics day={day} advice={advice} settings={settings} />
          </div>

          <div className="lower">
            <TodayLog
              entries={day.todayEntries}
              now={now}
              onRemoved={onRemoved}
              onLogged={onLogged}
              onUndoLog={onUndoLog}
              editingId={editingId}
              onEditingChange={setEditingId}
            />
            <Archive entries={entries} settings={settings} now={now} />
          </div>

          {/* On phones the one button lives where the thumb is. */}
          <div className="add-bar">
            <button className="add-button" type="button" onClick={() => setSheetOpen(true)}>
              <span aria-hidden="true">+</span> Add drink
            </button>
          </div>

          <AddDrinkSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            usual={usual}
            customDrinks={state.customDrinks}
            advice={advice}
            day={day}
            settings={settings}
            onPick={onPick}
            onAddCustom={onAddCustom}
          />
        </main>
      )}

      {toast && (
        <div
          className="snackbar"
          role="status"
          key={toast.id}
          onPointerEnter={() => setToastPaused(true)}
          onPointerLeave={() => setToastPaused(false)}
          onFocus={() => setToastPaused(true)}
          onBlur={() => setToastPaused(false)}
        >
          <span>{toast.message}</span>
          {toast.editId && (
            <button className="btn btn--sm" type="button" onClick={() => changeTime(toast.editId!)}>
              Change time
            </button>
          )}
          {toast.undoable && (
            <button
              className="btn btn--sm"
              type="button"
              aria-keyshortcuts="Control+Z Meta+Z"
              onClick={() => {
                void runUndo();
                document.getElementById('today-log-title')?.focus();
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const LAMP = {
  persisted: { state: 'ok', text: 'Saved on this device', short: 'Saved', hint: 'Your log is stored on this device only.' },
  local: { state: 'ok', text: 'Saved in this browser', short: 'Saved', hint: 'Your log is stored in this browser only. Export a backup from Settings now and then.' },
  'needs-backup': { state: 'warn', text: 'Back up your log', short: 'Back up', hint: 'This browser may clear its storage. Export a backup from Settings.' },
} as const;

/** Status lamp for where the log lives; links to the data controls. Housekeeping, so neutral ink, never the alarm colour. */
function Lamp({ status }: { status: keyof typeof LAMP }) {
  const l = LAMP[status];
  return (
    <a className="lamp" data-state={l.state} href="#/calibrate" title={l.hint}>
      <span className="lamp__text">{l.text}</span>
      <span className="lamp__short" aria-hidden="true">
        {l.short}
      </span>
    </a>
  );
}
