import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Entry, Settings } from './types';
import type { Drink } from '../metrics/caffeine/drinks';

/**
 * Local-first storage: everything lives in this browser's IndexedDB.
 * Nothing is sent anywhere. This module is the only place that touches
 * storage, so a sync layer or a server can replace it later.
 */

interface TrackerDB extends DBSchema {
  entries: {
    key: string;
    value: Entry;
    indexes: { metric_startAt: [string, number] };
  };
  kv: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'caffeine-tracker';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TrackerDB>> | null = null;

function db(): Promise<IDBPDatabase<TrackerDB>> {
  dbPromise ??= openDB<TrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const entries = database.createObjectStore('entries', { keyPath: 'id' });
      entries.createIndex('metric_startAt', ['metric', 'startAt']);
      database.createObjectStore('kv');
    },
    // A newer version of the app (another tab, or the installed app after an
    // update) needs to upgrade the schema: close our connection so it isn't
    // stalled, and reopen on next use.
    blocking(_current, _next, event) {
      (event.target as IDBDatabase).close();
      dbPromise = null;
    },
    terminated() {
      dbPromise = null;
    },
  });
  return dbPromise;
}

export async function listEntries(metric: string, from = 0, to = Number.MAX_SAFE_INTEGER): Promise<Entry[]> {
  const range = IDBKeyRange.bound([metric, from], [metric, to]);
  return (await db()).getAllFromIndex('entries', 'metric_startAt', range);
}

export async function putEntry(entry: Entry): Promise<void> {
  await (await db()).put('entries', entry);
}

/** Hard delete — erasure means erasure. Sync, when it exists, will add id-only tombstones. */
export async function deleteEntry(id: string): Promise<void> {
  await (await db()).delete('entries', id);
}

export async function getKV<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('kv', key)) as T | undefined;
}

export async function putKV(key: string, value: unknown): Promise<void> {
  await (await db()).put('kv', value, key);
}

export const KV = {
  settings: 'settings',
  customDrinks: 'customDrinks',
} as const;

export interface ExportFile {
  app: 'caffeine-tracker';
  format: 1;
  exportedAt: string;
  entries: Entry[];
  settings: Settings | undefined;
  customDrinks: Drink[];
}

export async function exportAll(): Promise<ExportFile> {
  const database = await db();
  return {
    app: 'caffeine-tracker',
    format: 1,
    exportedAt: new Date().toISOString(),
    entries: await database.getAll('entries'),
    settings: (await database.get('kv', KV.settings)) as Settings | undefined,
    customDrinks: ((await database.get('kv', KV.customDrinks)) as Drink[] | undefined) ?? [],
  };
}

/**
 * Merge an export into this device. An entry is written only if it's new
 * here or the file's copy is newer (by updatedAt), so restoring an old
 * backup never reverts later edits. Custom drinks merge by id. Settings come
 * from the file, but this device keeps its own notice acknowledgment and
 * backup date. Returns how many entries were written.
 */
export async function importAll(file: ExportFile, valid: Entry[]): Promise<number> {
  const database = await db();
  const tx = database.transaction(['entries', 'kv'], 'readwrite');
  const entries = tx.objectStore('entries');
  const kv = tx.objectStore('kv');
  let written = 0;
  for (const e of valid) {
    const existing = await entries.get(e.id);
    if (!existing || existing.updatedAt < e.updatedAt) {
      await entries.put(e);
      written++;
    }
  }
  if (file.settings) {
    const current = (await kv.get(KV.settings)) as Settings | undefined;
    await kv.put({ ...file.settings, acknowledgedAt: current?.acknowledgedAt, lastExportAt: current?.lastExportAt }, KV.settings);
  }
  if (file.customDrinks.length) {
    const current = ((await kv.get(KV.customDrinks)) as Drink[] | undefined) ?? [];
    const merged = [...current, ...file.customDrinks.filter((d) => !current.some((c) => c.id === d.id))];
    await kv.put(merged, KV.customDrinks);
  }
  await tx.done;
  return written;
}

/** Erase everything this app stored on this device. */
export async function eraseAll(): Promise<void> {
  const database = await db();
  const tx = database.transaction(['entries', 'kv'], 'readwrite');
  await tx.objectStore('entries').clear();
  await tx.objectStore('kv').clear();
  await tx.done;
}

/** Ask the browser not to evict our data under storage pressure (Safari's 7-day rule, etc.). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
