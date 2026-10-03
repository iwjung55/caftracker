import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import * as db from './db';
import {
  eraseEverything,
  importFile,
  init,
  logCaffeine,
  removeCaffeine,
  undoRemove,
  updateCaffeine,
  updateSettings,
} from './store';

// The store keeps module state; read it back through a tiny subscriber-free probe.
async function entries() {
  return db.listEntries('caffeine');
}

describe('store ↔ IndexedDB round trip', () => {
  beforeEach(async () => {
    await eraseEverything();
    await init();
  });

  it('logs, edits, deletes and undoes', async () => {
    const at = Date.now() - 60_000;
    const r = await logCaffeine({ label: 'Espresso', mg: 64, at, drinkId: 'espresso' });
    expect(r.error).toBeUndefined();
    expect(await entries()).toHaveLength(1);

    const id = r.entry!.id;
    expect(await updateCaffeine(id, { mg: 128, label: 'Double espresso' })).toBeNull();
    const [edited] = await entries();
    expect(edited!.value).toBe(128);
    expect(edited!.data.label).toBe('Double espresso');
    expect(edited!.updatedAt).toBeGreaterThanOrEqual(edited!.createdAt);

    await removeCaffeine(id);
    expect(await entries()).toHaveLength(0);
    await undoRemove();
    expect(await entries()).toHaveLength(1);
  });

  it('rejects invalid input without writing', async () => {
    expect((await logCaffeine({ label: '', mg: 64, at: Date.now() })).error).toMatch(/name/);
    expect((await logCaffeine({ label: 'X', mg: 5000, at: Date.now() })).error).toMatch(/between/);
    expect((await logCaffeine({ label: 'X', mg: 64, at: Date.now() + 3_600_000 })).error).toMatch(/future/);
    expect(await entries()).toHaveLength(0);
  });

  it('exports, erases and re-imports everything', async () => {
    await logCaffeine({ label: 'Drip coffee', mg: 95, at: Date.now() - 3_600_000 });
    await logCaffeine({ label: 'Black tea', mg: 47, at: Date.now() - 60_000 });
    await updateSettings({ halfLifeHours: 6.5, bedtimeMin: 22 * 60 });
    const exported = await db.exportAll();
    expect(exported.entries).toHaveLength(2);

    await eraseEverything();
    expect(await entries()).toHaveLength(0);
    expect(await db.getKV(db.KV.settings)).toBeUndefined();

    // One corrupt row should be skipped, not abort the import.
    const file = new File(
      [JSON.stringify({ ...exported, entries: [...exported.entries, { id: 'bad', metric: 'caffeine', value: -1 }] })],
      'backup.json',
    );
    const report = await importFile(file);
    expect(report).toEqual({ imported: 2, unchanged: 0, skipped: 1 });
    expect(await entries()).toHaveLength(2);
    expect((await db.getKV<{ halfLifeHours: number }>(db.KV.settings))?.halfLifeHours).toBe(6.5);
  });

  it('never lets an older backup revert a newer edit', async () => {
    const r = await logCaffeine({ label: 'Espresso', mg: 64, at: Date.now() - 60_000 });
    const backup = await db.exportAll(); // has the 64 mg version
    await new Promise((res) => setTimeout(res, 5));
    expect(await updateCaffeine(r.entry!.id, { mg: 128 })).toBeNull();

    const report = await importFile(new File([JSON.stringify(backup)], 'old.json'));
    expect(report).toEqual({ imported: 0, unchanged: 1, skipped: 0 });
    expect((await entries())[0]!.value).toBe(128);
  });

  it('keeps this device’s notice acknowledgment when importing', async () => {
    await updateSettings({ acknowledgedAt: undefined });
    const backup = await db.exportAll();
    await updateSettings({ acknowledgedAt: 12345 });
    await importFile(new File([JSON.stringify({ ...backup, settings: { ...backup.settings, acknowledgedAt: 1 } })], 'b.json'));
    expect((await db.getKV<{ acknowledgedAt?: number }>(db.KV.settings))?.acknowledgedAt).toBe(12345);
  });

  it('refuses files from other apps', async () => {
    const file = new File([JSON.stringify({ hello: 'world' })], 'x.json');
    await expect(importFile(file)).rejects.toThrow(/wasn’t exported from this app/);
    await expect(importFile(new File(['not json'], 'x.json'))).rejects.toThrow(/valid JSON/);
  });
});
