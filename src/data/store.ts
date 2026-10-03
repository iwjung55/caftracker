import { useSyncExternalStore } from 'react';
import * as db from './db';
import type { Entry, Settings } from './types';
import { caffeine, type CaffeineEntry, isCaffeineEntry } from '../metrics/caffeine';
import type { Drink } from '../metrics/caffeine/drinks';
import { validateEntry } from '../metrics/registry';
import {
  DEFAULT_BEDTIME_TARGET_MG,
  DEFAULT_DAILY_LIMIT_MG,
  DEFAULT_HALF_LIFE_HOURS,
} from '../metrics/caffeine/constants';
import { currentTimeZone } from '../lib/time';

/**
 * App state: a tiny external store over IndexedDB. Volumes are small
 * (a few thousand entries a year), so everything loads into memory and
 * every derived number is computed on read.
 */

export const DEFAULT_SETTINGS: Settings = {
  v: 1,
  halfLifeHours: DEFAULT_HALF_LIFE_HOURS,
  bedtimeMin: 23 * 60,
  dayStartMin: 4 * 60,
  dailyLimitMg: DEFAULT_DAILY_LIMIT_MG,
  bedtimeTargetMg: DEFAULT_BEDTIME_TARGET_MG,
};

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  error?: string;
  entries: CaffeineEntry[];
  settings: Settings;
  customDrinks: Drink[];
  /** null until the browser answers. */
  persisted: boolean | null;
  /** Most recently deleted entry, kept for one undo. */
  lastRemoved?: CaffeineEntry;
}

let state: AppState = {
  status: 'loading',
  entries: [],
  settings: DEFAULT_SETTINGS,
  customDrinks: [],
  persisted: null,
};

const listeners = new Set<() => void>();

function set(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}

const byTime = (a: Entry, b: Entry) => a.startAt - b.startAt;

/**
 * Keeps every open window of the app in step: a browser tab and the
 * installed home-screen app share one IndexedDB but each holds its own
 * in-memory copy. After any write we announce it; the others re-read.
 */
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('caffeine-tracker');
(channel as unknown as { unref?: () => void } | null)?.unref?.(); // don't keep Node (tests) alive
channel?.addEventListener('message', () => {
  void load().catch(() => {});
});
const announce = () => channel?.postMessage('changed');

async function load(): Promise<void> {
  const [entries, settings, customDrinks] = await Promise.all([
    db.listEntries(caffeine.id),
    db.getKV<Settings>(db.KV.settings),
    db.getKV<Drink[]>(db.KV.customDrinks),
  ]);
  set({
    status: 'ready',
    entries: entries.filter(isCaffeineEntry).sort(byTime),
    settings: { ...DEFAULT_SETTINGS, ...settings },
    customDrinks: customDrinks ?? [],
  });
}

export async function init(): Promise<void> {
  try {
    await load();
    set({ persisted: await db.requestPersistence() });
  } catch (err) {
    set({
      status: 'error',
      error:
        err instanceof Error && /indexedDB|IDB/i.test(err.message + err.name)
          ? 'This browser is blocking local storage (private mode can do this). Your entries can’t be saved here.'
          : 'Couldn’t open your saved data. Reload the page to try again.',
    });
  }
}

export interface LogInput {
  label: string;
  mg: number;
  at: number;
  drinkId?: string;
}

export type LogResult = { entry: CaffeineEntry; error?: undefined } | { entry?: undefined; error: string };

/** Validate and save a caffeine entry. */
export async function logCaffeine(input: LogInput): Promise<LogResult> {
  const now = Date.now();
  const entry: CaffeineEntry = {
    id: crypto.randomUUID(),
    metric: caffeine.id,
    startAt: Math.round(input.at),
    tz: currentTimeZone(),
    value: Math.round(input.mg),
    data: { v: 1, label: input.label.trim(), ...(input.drinkId ? { drinkId: input.drinkId } : {}) },
    createdAt: now,
    updatedAt: now,
  };
  const problem = validateEntry(entry) ?? (entry.startAt > now + 60_000 ? 'That time is in the future' : null);
  if (problem) return { error: problem };
  await db.putEntry(entry);
  set({ entries: [...state.entries, entry].sort(byTime) });
  announce();
  return { entry };
}

export async function updateCaffeine(id: string, patch: { label?: string; mg?: number; at?: number }): Promise<string | null> {
  const current = state.entries.find((e) => e.id === id);
  if (!current) return 'That entry no longer exists';
  const next: CaffeineEntry = {
    ...current,
    startAt: patch.at !== undefined ? Math.round(patch.at) : current.startAt,
    value: patch.mg !== undefined ? Math.round(patch.mg) : current.value,
    data: { ...current.data, label: patch.label !== undefined ? patch.label.trim() : current.data.label },
    updatedAt: Date.now(),
  };
  const problem = validateEntry(next) ?? (next.startAt > Date.now() + 60_000 ? 'That time is in the future' : null);
  if (problem) return problem;
  await db.putEntry(next);
  set({ entries: state.entries.map((e) => (e.id === id ? next : e)).sort(byTime) });
  announce();
  return null;
}

export async function removeCaffeine(id: string): Promise<void> {
  const removed = state.entries.find((e) => e.id === id);
  await db.deleteEntry(id);
  set({ entries: state.entries.filter((e) => e.id !== id), lastRemoved: removed });
  announce();
}

export async function undoRemove(): Promise<void> {
  const e = state.lastRemoved;
  if (!e) return;
  await db.putEntry(e);
  set({ entries: [...state.entries, e].sort(byTime), lastRemoved: undefined });
  announce();
}

export function dismissUndo(): void {
  if (state.lastRemoved) set({ lastRemoved: undefined });
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const settings = { ...state.settings, ...patch };
  await db.putKV(db.KV.settings, settings);
  set({ settings });
  announce();
}

export async function saveCustomDrink(drink: Omit<Drink, 'id' | 'custom'>): Promise<Drink> {
  const saved: Drink = { ...drink, id: `custom-${crypto.randomUUID()}`, custom: true };
  const customDrinks = [...state.customDrinks, saved];
  await db.putKV(db.KV.customDrinks, customDrinks);
  set({ customDrinks });
  announce();
  return saved;
}

/** Put back a removed "usual" (undo). */
export async function restoreCustomDrink(drink: Drink): Promise<void> {
  if (state.customDrinks.some((d) => d.id === drink.id)) return;
  const customDrinks = [...state.customDrinks, drink];
  await db.putKV(db.KV.customDrinks, customDrinks);
  set({ customDrinks });
  announce();
}

export async function removeCustomDrink(id: string): Promise<void> {
  const customDrinks = state.customDrinks.filter((d) => d.id !== id);
  await db.putKV(db.KV.customDrinks, customDrinks);
  set({ customDrinks });
  announce();
}

/** Download everything as JSON. Also the future sync/import format. */
export async function downloadExport(): Promise<void> {
  const data = await db.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `caffeine-log-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  await updateSettings({ lastExportAt: Date.now() });
}

export interface ImportReport {
  /** New or newer entries written. */
  imported: number;
  /** Already here in the same or a newer version. */
  unchanged: number;
  /** Unreadable rows. */
  skipped: number;
}

/** Merge an exported file into this device. Throws with a readable message on bad files. */
export async function importFile(file: File): Promise<ImportReport> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t valid JSON. Choose a file exported from this app.');
  }
  const data = parsed as Partial<db.ExportFile>;
  if (data?.app !== 'caffeine-tracker' || data.format !== 1 || !Array.isArray(data.entries)) {
    throw new Error('That file wasn’t exported from this app, or it’s from a newer version.');
  }
  const valid = data.entries.filter((e): e is Entry => validateEntry(e as Entry) === null);
  const written = await db.importAll(
    { ...(data as db.ExportFile), customDrinks: Array.isArray(data.customDrinks) ? data.customDrinks : [] },
    valid,
  );
  await load();
  announce();
  return { imported: written, unchanged: valid.length - written, skipped: data.entries.length - valid.length };
}

/**
 * Backup state for the header lamp. Amber only for a real risk: the
 * browser hasn't promised to keep our data, there's a log worth losing,
 * and no export in the last 14 days.
 */
export function backupStatus(s: AppState, now: number): 'persisted' | 'local' | 'needs-backup' {
  if (s.persisted) return 'persisted';
  const fresh = s.settings.lastExportAt !== undefined && now - s.settings.lastExportAt < 14 * 86_400_000;
  return s.entries.length >= 5 && !fresh ? 'needs-backup' : 'local';
}

export async function eraseEverything(): Promise<void> {
  await db.eraseAll();
  set({ entries: [], settings: DEFAULT_SETTINGS, customDrinks: [], lastRemoved: undefined });
  announce();
  // The offline cache holds only app code, but "erase everything" should leave nothing behind.
  try {
    if (typeof caches !== 'undefined') {
      for (const key of await caches.keys()) if (key.startsWith('shell-')) await caches.delete(key);
    }
    const registrations = (await globalThis.navigator?.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(registrations.map((r) => r.unregister()));
  } catch {
    // Best effort: nothing personal lives in the cache.
  }
}

export async function acknowledgeNotice(): Promise<void> {
  await updateSettings({ acknowledgedAt: Date.now() });
}
