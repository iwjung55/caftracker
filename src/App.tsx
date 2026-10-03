import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { acknowledgeNotice, backupStatus, removeCaffeine, undoRemove, useAppState } from './data/store';
import type { CaffeineEntry } from './metrics/caffeine';
import { deriveDay, quickDrinks } from './metrics/caffeine/derive';
import { currentTimeZone, formatDate, formatTime } from './lib/time';
import { useNow, useRoute } from './lib/hooks';
import { RecorderChart, type Preview } from './components/RecorderChart';
import { Readout } from './components/Readout';
import { EventDeck } from './components/EventDeck';
import { TodayLog } from './components/TodayLog';
import { Archive } from './components/Archive';
import { Calibrate } from './components/Calibrate';

interface Toast {
  id: number;
  message: string;
  /** Show an Undo button that runs the pending undo action. */
  undoable: boolean;
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

export function App() {
  const state = useAppState();
  const route = useRoute();
  const now = useNow(30_000);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [replotKey, setReplotKey] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [toastPaused, setToastPaused] = useState(false);
  const undoRef = useRef<UndoAction | null>(null);

  const { entries, settings } = state;
  const day = useMemo(() => deriveDay(entries, settings, now), [entries, settings, now]);
  const previewDay = useMemo(() => {
    if (!preview) return null;
    const ghost: CaffeineEntry = {
      id: 'preview',
      metric: 'caffeine',
      startAt: preview.at,
      tz: currentTimeZone(),
      value: preview.mg,
      data: { v: 1, label: preview.label },
      createdAt: now,
      updatedAt: now,
    };
    return deriveDay([...entries, ghost].sort((a, b) => a.startAt - b.startAt), settings, now);
  }, [preview, entries, settings, now]);
  // Keys are ordered from history before today, so they don't move while you log.
  const quick = useMemo(() => quickDrinks(entries, state.customDrinks, day.dayStart), [entries, state.customDrinks, day.dayStart]);

  const showToast = useCallback((message: string, undo?: Omit<UndoAction, 'at'>) => {
    if (undo) undoRef.current = { ...undo, at: Date.now() };
    setToastPaused(false);
    setToast({ id: Date.now(), message, undoable: Boolean(undo) });
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

  // Ctrl/Cmd+Z undoes the last log, delete or settings change (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !typing && undoRef.current) {
        e.preventDefault();
        void runUndo();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [runUndo]);

  const onLogged = useCallback(
    (entry: CaffeineEntry) => {
      setReplotKey((k) => k + 1);
      setPreview(null);
      showToast(`Logged ${entry.data.label} · ${entry.value} mg`, {
        run: () => removeCaffeine(entry.id),
        done: `Removed ${entry.data.label}`,
      });
    },
    [showToast],
  );

  const onUndoLog = useCallback(
    (entry: CaffeineEntry) => {
      void removeCaffeine(entry.id).then(() => {
        undoRef.current = null;
        setReplotKey((k) => k + 1);
        setToast({ id: Date.now(), message: `Removed ${entry.data.label}`, undoable: false });
      });
    },
    [],
  );

  const onRemoved = useCallback(
    (entry: CaffeineEntry) => {
      showToast(`Deleted ${entry.data.label} · ${formatTime(entry.startAt)}`, {
        run: () => undoRemove(),
        done: `Restored ${entry.data.label}`,
      });
    },
    [showToast],
  );

  const onSettings = route.startsWith('calibrate');

  return (
    <div className="shell">
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
          <div className="recorder">
            <div className="bezel">
              <div className="bezel__plate" aria-hidden="true">
                <span>
                  <span className="pen-swatch" />
                  Caffeine active · mg
                </span>
                <span>{formatTime(now)}</span>
              </div>
              <RecorderChart day={day} previewDay={previewDay} preview={preview} settings={settings} entries={entries} replotKey={replotKey} />
            </div>
            <Readout day={day} previewDay={previewDay} preview={preview} settings={settings} quick={quick} />
          </div>

          <EventDeck
            quick={quick}
            customDrinks={state.customDrinks}
            now={now}
            day={day}
            previewDay={previewDay}
            settings={settings}
            onPreview={setPreview}
            onLogged={onLogged}
          />

          <div className="lower">
            <TodayLog entries={day.todayEntries} now={now} onRemoved={onRemoved} onLogged={onLogged} onUndoLog={onUndoLog} />
            <Archive entries={entries} settings={settings} now={now} />
          </div>
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
