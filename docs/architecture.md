# Architecture

A static, local-first single-page app. No backend, no accounts, no
third-party requests. Decided by a four-role architecture council (see
`.claude/council-cache/`) — the reasoning is summarised here.

```
src/
  data/
    types.ts        Entry + Settings — the one shared record shape
    db.ts           IndexedDB (via `idb`). The only module that touches storage.
    store.ts        In-memory app state + actions (log, edit, delete, undo, import/export)
  metrics/
    registry.ts     MetricDefinition, registerMetric, validateEntry, aggregate
    caffeine/
      index.ts      Caffeine's MetricDefinition + payload type
      model.ts      Pharmacokinetics (Bateman) + last-cup solver — pure functions
      constants.ts  Model constants (sources in docs/research.md)
      drinks.ts     Preset catalogue
      derive.ts     Everything the dashboard shows, computed from raw entries
  lib/              time (logical days, bedtime), hooks
  components/       RecorderChart, Readout, EventDeck, TodayLog, Archive, Calibrate
```

## The data model

Every metric — caffeine now; sleep, water, mood, focus, exercise later —
writes the same `Entry`:

```ts
interface Entry {
  id: string;          // client UUID — syncs later without remapping
  metric: string;      // 'caffeine'
  startAt: number;     // when it happened, UTC ms (not when logged)
  endAt?: number;      // interval metrics only (sleep, exercise)
  tz: string;          // IANA zone, so logical days survive travel/DST
  value: number;       // canonical unit from the metric definition (mg)
  data: { v: number; ... };  // metric-specific payload, versioned
  createdAt: number;
  updatedAt: number;
}
```

Stored in one IndexedDB object store with a compound index
`[metric, startAt]`.

**Rules the council converged on:**

1. **Store facts, derive everything else.** Active mg, daily totals, the
   last-cup time and the archive are computed on read. Nothing derived is
   persisted, so editing an entry or changing your half-life can't leave
   stale numbers behind.
2. **Copy, don't reference.** A caffeine entry stores its own mg and label.
   Editing a preset (or a "usual") never rewrites history.
3. **Logical days, not midnight.** Days start at a configurable time
   (default 04:00), so a 1 a.m. study espresso belongs to the night before.
4. **Hard delete.** "Delete" and "Erase everything" really erase. When sync
   exists, deletions will travel as id-only tombstones.

## Adding a metric (e.g. water)

The registry test (`src/metrics/registry.test.ts`) already registers a fake
**sleep** (interval) and **mood** (1–5 scale) metric to prove the shape holds.
To ship a real one:

1. `src/metrics/water/index.ts` — `registerMetric({ id: 'water', unit: 'ml',
   kind: 'quantity', aggregate: 'sum', pen: '--pen-water', sensitivity:
   'lifestyle', … })`.
2. Add `--pen-water` (light + dark) in `src/styles/app.css`. Each metric is
   a pen on the recorder; see DESIGN.md.
3. `store.ts` — load `db.listEntries('water')` alongside caffeine (the
   generic `logCaffeine` becomes `logEntry(metric, …)` at this point — not
   before; we extract only what metric #2 actually duplicates).
4. A card/pen for it on the dashboard and a quick-log control.

No schema migration, no new object store.

**Recommended metric #2: sleep.** Without it, "protect your sleep" is a
model, not a measurement. A one-tap morning check-in (bed/wake time + 1–5
quality) enables the most-wanted insight from competitor research: *your*
sleep lost per 100 mg at bedtime.

## Privacy & compliance posture

- Data never leaves the browser. Fonts are self-hosted (`@fontsource`);
  no analytics, error trackers or CDNs.
- Production builds ship a strict CSP (`vite.config.ts`): `connect-src
  'self'`, so even injected script can't send the log anywhere.
- No free-text notes in the MVP (people would type medications and
  diagnoses). No pregnancy/medication questions — a single personal
  half-life setting with an explanation instead.
- Copy never says "safe". 400 mg is a *reference* (a ruled mark on a
  scale, not a progress bar to fill).
- Before any sync/backend ships: health-category metrics (`sensitivity:
  'health'`) need explicit consent; moving existing local data to a server
  is its own consent step (GDPR Art. 9, WA MHMDA, FTC HBNR — see the
  council notes).

## Offline & multiple windows

- `sw/sw.template.js` becomes `dist/sw.js` at build time (`vite.config.ts`
  plugin) with the exact list of built files to precache, versioned by their
  hash. Page loads are network-first (a new deploy shows immediately, the
  cached shell offline); hashed assets are cache-first. It caches only app
  code — never user data — and "Erase everything" also drops the cache and
  unregisters the worker.
- A browser tab and the installed app share one IndexedDB. Every write
  announces itself on a `BroadcastChannel`; other windows re-read. `db.ts`
  closes its connection when a newer version needs to upgrade the schema, so
  a future `DB_VERSION` bump can't stall behind an old tab.

## Known limits / next steps

| Limit | Mitigation now | Later |
|---|---|---|
| Browser may evict storage (Safari 7-day rule) | Installable PWA (home-screen apps get their own storage budget), `navigator.storage.persist()`, header lamp, JSON export | Sync |
| Data is per-device | Export/import JSON (merges by `updatedAt`, so an old backup never reverts newer edits) | Sync layer behind `db.ts` (server-assigned sequence numbers, not device clocks) |
| Cutoff is passive (open the app to see it) | — | Web Push reminder at the cutoff time (content-free payload) |
| Changing half-life re-computes past estimates | Fine for display | Effective-dated settings before correlating with sleep |
| No sleep data, so no personal calibration | Adjustable half-life + uncertainty band | Sleep metric → personal "sleep lost per 100 mg" |
