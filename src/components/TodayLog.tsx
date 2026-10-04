import { useRef, useState, type FormEvent } from 'react';
import { logCaffeine, removeCaffeine, updateCaffeine } from '../data/store';
import type { CaffeineEntry } from '../metrics/caffeine';
import { DAY, formatTime, hhmmToMin, minToHHMM } from '../lib/time';

interface Props {
  entries: CaffeineEntry[];
  now: number;
  onRemoved: (entry: CaffeineEntry) => void;
  onLogged: (entry: CaffeineEntry) => void;
  /** Take back a drink that was just logged. */
  onUndoLog: (entry: CaffeineEntry) => void;
  /** Which row is open for editing (controlled, so "Change time" in the toast can open it). */
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
}

/** How long a just-logged row keeps its own Undo button. */
const INLINE_UNDO_MS = 2 * 60_000;

/** Today's chart log: what the event pen recorded, newest first. */
export function TodayLog({ entries, now, onRemoved, onLogged, onUndoLog, editingId: editing, onEditingChange: setEditing }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rows = [...entries].reverse();
  // The most recently *created* entry, if it was created moments ago, gets an inline Undo.
  const newest = entries.reduce<CaffeineEntry | null>((a, e) => (!a || e.createdAt > a.createdAt ? e : a), null);
  const undoableId = newest && Date.now() - newest.createdAt < INLINE_UNDO_MS ? newest.id : null;

  return (
    <section aria-labelledby="today-log-title">
      <div className="section-head">
        <h2 className="section-title" id="today-log-title" ref={headingRef} tabIndex={-1}>
          Today’s log
        </h2>
        {rows.length > 0 && <p className="section-hint">{rows.length} logged</p>}
      </div>
      {rows.length === 0 ? (
        <p className="empty">
          Nothing logged yet today. When you have a drink, tap it above. The pen starts drawing from that moment, and
          your last-cup time updates.
        </p>
      ) : (
        <ul className="log">
          {rows.map((e) => (
            <li key={e.id} className="log__row" id={`entry-${e.id}`}>
              <span className="log__time">{formatTime(e.startAt)}</span>
              <span className="log__name">{e.data.label}</span>
              <span className="log__mg">{e.value} mg</span>
              <span className="log__actions">
                {e.id === undoableId ? (
                  <button
                    className="btn btn--quiet btn--sm log__undo"
                    type="button"
                    aria-label={`Undo logging ${e.data.label} at ${formatTime(e.startAt)}`}
                    onClick={() => {
                      onUndoLog(e);
                      headingRef.current?.focus();
                    }}
                  >
                    Undo
                  </button>
                ) : (
                  <button
                    className="btn btn--quiet btn--sm"
                    type="button"
                    aria-label={`Log ${e.data.label} again now`}
                    onClick={async () => {
                      const result = await logCaffeine({ label: e.data.label, mg: e.value, at: Date.now(), drinkId: e.data.drinkId });
                      if (result.entry) onLogged(result.entry);
                    }}
                  >
                    Again
                  </button>
                )}
                <button
                  className="btn btn--quiet btn--sm"
                  type="button"
                  aria-expanded={editing === e.id}
                  aria-label={`Edit ${e.data.label} at ${formatTime(e.startAt)}`}
                  onClick={() => setEditing(editing === e.id ? null : e.id)}
                >
                  Edit
                </button>
                <button
                  className="btn btn--quiet btn--sm btn--danger"
                  type="button"
                  aria-label={`Delete ${e.data.label} at ${formatTime(e.startAt)}`}
                  onClick={async () => {
                    await removeCaffeine(e.id);
                    onRemoved(e);
                    // Keep keyboard focus in the log instead of dropping it to <body>.
                    headingRef.current?.focus();
                  }}
                >
                  Delete
                </button>
              </span>
              {editing === e.id && <EditRow entry={e} now={now} onDone={() => setEditing(null)} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EditRow({ entry, now, onDone }: { entry: CaffeineEntry; now: number; onDone: () => void }) {
  const d = new Date(entry.startAt);
  const [label, setLabel] = useState(entry.data.label);
  const [mg, setMg] = useState(String(entry.value));
  const [time, setTime] = useState(minToHHMM(d.getHours() * 60 + d.getMinutes()));
  const [error, setError] = useState<string | null>(null);

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    const min = hhmmToMin(time);
    if (min === null) return setError('Enter a time like 14:30');
    const at = new Date(entry.startAt);
    at.setHours(Math.floor(min / 60), min % 60, 0, 0);
    let t = at.getTime();
    // Keep the entry on its own logical day if the clock wraps past midnight.
    if (t - entry.startAt > DAY / 2) t -= DAY;
    else if (entry.startAt - t > DAY / 2) t += DAY;
    if (t > now + 60_000) return setError('That time hasn’t happened yet');
    const problem = await updateCaffeine(entry.id, { label, mg: Number(mg), at: t });
    if (problem) return setError(problem);
    onDone();
  };

  return (
    <form className="log__edit" onSubmit={save} onKeyDown={(e) => e.key === 'Escape' && onDone()}>
      <label className="field">
        <span>Drink</span>
        <input className="input input--name" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
      </label>
      <label className="field">
        <span>Caffeine (mg)</span>
        <input className="input input--mg" inputMode="numeric" value={mg} onChange={(e) => setMg(e.target.value.replace(/[^\d.]/g, ''))} />
      </label>
      <label className="field">
        <span>Time</span>
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <button className="btn btn--primary" type="submit">
        Save
      </button>
      <button className="btn btn--quiet" type="button" onClick={onDone}>
        Cancel
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
