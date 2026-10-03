# Local council — Caffeine tracker MVP

> **Local council** — these perspectives all come from Claude playing different
> roles, not from different AI vendors. Treat agreement as a shared starting
> point to pressure-test, not as independent confirmation.

Question: MVP scope, stack/storage, extensible data model, and biggest risks for
a caffeine-intake tracker that must later hold sleep, water, mood, focus,
exercise. Solo student developer, empty directory.

Roles: Devil's Advocate, Simplicity Champion, Scalability Architect,
Compliance Officer (substituted for Security Auditor — health-data and
medical-claims risk outweighs generic appsec for a device-only MVP).
No external providers (Gemini/OpenAI/Grok/Perplexity) were configured.

---

## 🗳️ Devil's Advocate

### Position
The central promise ("X mg still active", "stop at 2:47 pm") is false precision
on inputs that vary 3×; "extensible architecture" protects the wrong layer
(code is cheap to rewrite; lost data and platform lock-in are not). Build an
honest, rough caffeine log with sleep as the outcome variable — not a generic
metrics engine.

### Key points
- Half-life spans ~1.5–9.5 h (mean ~5); OCs ~double it, pregnancy >15 h,
  smoking −30–50 %. 95 mg at 3 pm leaves ~15 / 31 / 43 mg at 11 pm for
  t½ = 3 / 5 / 7 h — a 3× spread before preset error (95 mg vs a ~300 mg
  grande). Show a band, make custom mg and "my usual" first-class.
- Caffeine-only can't deliver "protect sleep": no validated bedtime-mg
  threshold exists; Drake 2013 showed 400 mg 6 h pre-bed still cost ~1 h of
  sleep. Suggests a one-tap morning sleep rating in the MVP — also the only
  real test of extensibility.
- Cut "pattern spotting" from v1; reverse confounding (bad night → more
  coffee). Ship raw history instead.
- Extensibility lives in the data envelope:
  `{id, type, startAt, endAt?, tz, schema, payload, createdAt, updatedAt, deletedAt?}`;
  copy mg into entries; never store derived values; add `endAt` now.
- Hidden walls of local-first web: per-device data + Safari 7-day eviction;
  cutoff is passive without push; HealthKit/Health Connect unreachable from web.

### Risks & blind spots
A filling 400 mg bar gamifies intake toward the limit — make it a reference
line. Late logging is the norm → one-tap backdating. "Day" boundary should be
configurable (e.g. 4 am) with tz stored per entry. Pure decay ignores the
30–60 min absorption peak. Apple Health already stores caffeine — the edge is
honest cutoff guidance, not logging.

### Confidence
`medium` — pharmacology ranges and platform limits are solid; pulling sleep
into MVP and cutting patterns are judgment calls.

---

## 🗳️ Simplicity Champion

### Position
Static, local-first SPA (Vite + React), no backend, no auth, one flat
timestamped-entry list. Don't build a metrics framework until metric #2
exists — over-engineering for "extensible" is the likeliest way this dies.

### Key points
- The product is two numbers: "~140 mg active now" and "last coffee for
  tonight: 2:40 PM". 6–8 presets with editable mg, a "when" adjuster, edit/delete,
  today vs 400, 14-day bars, settings, JSON export/import. Out: accounts, sync,
  notifications, barcode/DB, absorption modeling, insights, service worker.
- localStorage under one versioned key behind `store.ts`; swap later.
- `Entry {id, metric, ts, value, meta?}`; copy mg at log time; no registry,
  no plugin interface, no repository layer.
- Decay + cutoff math is ~15 lines; test those pure functions and local-day
  grouping; skip component/E2E tests.
- Timebox to a weekend. Logging >2 taps kills retention.

### Risks & blind spots
Local-first data loss (Safari eviction, clearing site data) → export on day 1,
`navigator.storage.persist()`, Add to Home Screen. False precision → "~",
round to 5–10 mg, editable half-life/limits, "estimate, not medical advice".
Instant-dose model overstates "active now" right after logging. Store epoch ms,
group by local day at display time.

### Confidence
`high` — small scope, well-understood math, generic entry fits every listed
future metric.

---

## 🗳️ Scalability Architect

### Position
Load is irrelevant; what scales is (a) number of metric types, (b) years of
history for cross-metric analysis, (c) single → multi-device. Build a
local-first, append-mostly event log, sync-ready, metric semantics in code,
everything derived computed on read.

### Key points
- One `entries` table (not per-metric tables, not user-defined EAV):
  `{id: UUIDv7, metric, startAt, endAt?, tz, value, data(v:1), createdAt, updatedAt, deletedAt?}`;
  `registerMetric({key, unit, schema, aggregate, derive?})`.
- Sync-readiness costs ~4 fields: client IDs, `updatedAt`, `deletedAt`,
  no in-place history mutation. Copy mg onto the entry.
- Vite + React + TS static PWA; Dexie/IndexedDB behind an `EntryRepo`
  interface; compound index `[metric+startAt]`.
- Volume is tiny (≈10–30k entries/user/year across metrics); compute on read
  over a ~48 h window; never persist curves or totals.
- Cheap validation: unit tests that register a fake interval metric (sleep)
  and a fake 1–5 scale metric (mood) against the entry shape.

### Risks & blind spots
Time is the hard part: logical day with configurable start, tz per entry; UTC
grouping is the #1 bug. Storage eviction → `persist()`, PWA, export.
Multi-device will bite within weeks. Changing half-life rewrites past derived
values — consider effective-dated settings before correlating with sleep.
Later sync must use server-assigned sequence, not device clocks.

### Confidence
`high` — well-trodden pattern; only open question is how soon sync is needed.

---

## 🗳️ Compliance Officer

### Position
Treat this as a health-data product from commit one, and ship local-first with
zero backend, accounts, or third-party scripts — the moment caffeine + sleep/mood
logs reach a server, a solo developer inherits GDPR Art. 9, WA MHMDA, and the
FTC Health Breach Notification Rule. Build deletion, export, and per-metric
sensitivity into the model now. (Not legal advice.)

### Key points
- The data's legal character changes with the roadmap: adding mood/sleep or
  inferences makes it special-category health data (CJEU C-184/20). FTC HBNR
  treats unauthorized sharing via analytics SDKs as a breach.
- Local-first is the compliance answer: self-host fonts (Munich 2022 Google
  Fonts ruling), no analytics/session replay, never put metric data in URLs,
  no consent banner needed for strictly-necessary storage.
- Generic versioned entries table; metric registry with
  `sensitivity: 'lifestyle'|'health'`; **hard deletes** (soft flags conflict
  with erasure — use id-only tombstones when sync arrives). Export (JSON/CSV)
  and Delete-all in v1. **No free-text notes** in MVP.
- Scope out pregnancy / medication / condition modes — offer a single
  "personal half-life" setting with an explainer instead.
- Claims: never "safe", "insomnia", "overdose"; 400 mg "commonly cited for
  healthy adults (FDA/EFSA)", not a "remaining safe budget"; cutoff phrased as
  "estimated X mg active at your bedtime"; editable drink values with sources.

### Risks & blind spots
Going from local to backend is a consent event (plan the opt-in migration).
Collecting classmates' data makes you a controller (and may trigger IRB).
Minors (energy drinks): 18+ statement. Availability is a data-protection
issue (Safari eviction). Leak paths: push payloads, error trackers, future
LLM "insights", XSS → strict CSP and minimal deps. Don't over-build consent
platforms or audit logs for a device-only MVP.

### Confidence
`high` on the architecture direction; facts-dependent on MHMDA/HBNR applicability.

---

## Synthesis — angles, not consensus

### Shared starting points (a common prior to stress-test)
All four landed on: **static local-first SPA (Vite + React + TS), no backend,
no auth; one generic entries list; mg copied onto each entry; derived values
computed on read; JSON export from day one; label every number an estimate.**
Because all four are the same model, this convergence is weak evidence. What
they might *all* be missing for the same reason: whether the owner actually
wants a portfolio piece that demonstrates backend/auth skills, and whether
logging on a laptop (not phone) is the real usage scene for a student.

### Genuine tensions
| Tension | Positions | Resolution for this MVP |
|---|---|---|
| localStorage vs IndexedDB | Simplicity: one localStorage key. Others: IndexedDB/Dexie. | **IndexedDB via the 1 KB `idb` wrapper** behind a small repo module. localStorage's ~5 MB cap is reachable within ~a year once several metrics share it; `idb` keeps deps near zero (Compliance's CSP/dep concern). |
| Soft vs hard delete | Scalability/Devil: soft-delete for sync. Compliance: hard delete for erasure. | **Hard delete now** (no sync exists, so tombstones protect nothing); `updatedAt` + client UUIDs keep sync possible. Add id-only tombstones when sync ships. |
| Metric registry | Scalability: `registerMetric`. Simplicity: none until metric #2. | **A thin, static registry** (id, label, unit, kind, aggregate, ink color) — required anyway because the chart-recorder UI assigns each metric a pen. No plugin system, no schema-driven forms. Validate with fake sleep/mood tests (Scalability's cheap check). |
| Absorption modeling | Simplicity: skip. Devil/Scalability: curve looks wrong without it. | **One-compartment (Bateman) model** — it's one formula, makes the curve honest (peak ~45 min), and the cutoff solver is a bisection either way. |
| Sleep in MVP | Devil: add a 1–5 morning rating now. | **Deferred** — owner explicitly scoped MVP to caffeine. Sleep is the recommended metric #2 and the data model is tested against it. |
| Precision | Devil: show a band. | **Uncertainty envelope** on the chart (personal half-life × 0.6–1.4), "~" prefixes, 5 mg rounding. |

### Blind spots
- Raised by one, walked into by others: Simplicity's pure-decay model
  overstates "active now" (Devil/Scalability flag it). Scalability's
  soft-delete conflicts with Compliance's erasure requirement. The 400 mg
  *progress bar* everyone listed as "in" is a gamification risk (Devil,
  Compliance) → render as a reference line.
- **No member covered:** accessibility of a chart-first dashboard (a
  non-visual equivalent for the curve and cutoff); i18n of units (fl oz vs ml
  in the drink presets); what happens when the user's bedtime is *after*
  midnight or they work night shifts; and what the app says when there is no
  data at all (first-run / empty state).

### Suggested direction
Build the local-first Vite + React + TS app with IndexedDB (`idb`), a generic
`Entry {id, metric, startAt, endAt?, tz, value, data, createdAt, updatedAt}`,
a thin metric registry, a Bateman absorption/elimination model with an
uncertainty band, a configurable day start, one-tap backdating, editable
per-drink mg, export/import/delete-all, and careful non-medical language.
Supported by all four roles on the architecture; the remaining real
uncertainty is multi-device use (deferred, sync-ready) and whether sleep
should join the MVP.
