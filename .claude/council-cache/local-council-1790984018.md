# Local council — What to add next (roadmap)

> **Local council** — these perspectives all come from Claude playing different
> roles, not from different AI vendors. Treat agreement as a shared starting
> point to pressure-test, not as independent confirmation.

Invoked via `/claude-council:deep-execution`; no external providers
(Gemini/OpenAI/Grok/Perplexity) are configured, so it fell back to a local
council. Roles: Devil's Advocate, Simplicity Champion, Scalability Architect,
Compliance Officer. Each member could read the codebase.

Question: what should come next for the caffeine-tracker MVP (local-first
web app; goal: use caffeine more effectively, expand to other metrics)?

---

## 🗳️ Devil's Advocate

### Position
The roadmap the repo already implies (sleep check-in → "your sleep lost per
100 mg" → Web Push → sync/more metrics) has a trap at every step. Don't add a
feature next: ship it, live with it for 14 days, then cut logging friction
*outside* the app, and add sleep only as raw context and a fix for the
bedtime input, never as a computed personal sleep-loss number.

### Key points
- **Order:** (0) ship and use it: no `.git`, no deployed URL; iOS ignores the
  SVG `apple-touch-icon` (needs PNG); add a service worker; log every real
  cup for 14 days. (1) Log from outside the app with a hash route
  `#log/<drinkId>/<portion>` (`useRoute()` already handles hash routes): iOS
  Shortcuts, Back Tap, Action Button, an NFC sticker on the coffee machine,
  Android manifest `shortcuts`. The fragment never reaches host logs, and the
  existing undo toast covers accidental logs. The same Shortcut can write
  `HKQuantityTypeIdentifierDietaryCaffeine`, which is the HealthKit bridge
  almost for free. (2) Sleep, reduced: a morning tap for actual bed/wake,
  drawn as a bar under each archive strip and used to correct the cutoff's
  bedtime. No correlation number. **Later:** a fixed reminder (.ics or
  Shortcut) before any Web Push; a taper plan only once evidence for taper
  schedules is in research.md; sync last; water and exercise maybe never.
- **"Sleep lost per 100 mg" is out of reach for one person using
  self-report, and is likely to falsely reassure.** In Drake 2013, people
  didn't perceive more than 1 h of objectively lost sleep; bed/wake measures
  time in bed, not efficiency; residuals near the cutoff are ~0–60 mg (a
  few minutes of effect) against ~1 h of nightly variance, so hundreds of
  nights are needed. Confounding: late caffeine falls on deadline nights.
  It also defeats itself: the better the cutoff works, the less the
  residual varies.
- **Web Push means building your first backend.** There are no local
  scheduled notifications on the web, and a server that pings you at 2:40 PM
  every day knows your schedule. On iOS it needs a home-screen install.
  The usual-drink cutoff lands at about the same time daily, so a fixed
  reminder needs no server.
- **The weakest input is bedtime, not half-life.** Bedtime is one fixed
  default (23:00) with no uncertainty drawn. Recording actual bedtimes fixes
  the cutoff directly. Moving the half-life slider also rewrites every past
  residual, which invites circular calibration.
- **More metrics follow the pattern of quantified-self apps that died.**
  Each one is a daily logging chore. A focus/energy rating would mostly
  measure withdrawal reversal (Rogers 2010).

### Risks & blind spots
- The gap is in learning, not building: there are zero users.
- A service worker is the riskiest "small" change: if the IndexedDB version
  is bumped, a stale worker serves old code against an upgraded database,
  idb throws `VersionError`, and to the user it looks like data loss.
- The `#log` route can be linked by any page: accept only known drink IDs
  and capped portions, never raw mg, and always show the undo toast.
- Anchoring warning: the earlier council and architecture.md already push
  "sleep lost per 100 mg".

### Confidence
`medium`: the platform facts and Drake's finding are solid; the sample-size
figure is order-of-magnitude.

---

## 🗳️ Simplicity Champion

### Position
The next thing to ship isn't infrastructure. Put it on a real URL, use it
daily, and add the smallest sleep check-in that makes "protects your sleep"
visible. Push, sync and taper plans each cost a backend or a scheduler. The
extensibility scaffolding is already ahead of usage, so stop adding to it.

### Key points
- **Step 0 is about an hour:** `git init`, deploy `dist/`, install on your
  phone. The home-screen install gives the app its own storage counter, so
  it avoids Safari's 7-day eviction. iOS needs a 180px PNG
  `apple-touch-icon`.
- **Feature 1:** a one-tap morning sleep rating (1–5) beside the archive
  strips, with bed/wake prefilled and editable, stored as an interval
  Entry. Show the rating next to that day's bedtime mg. No statistics.
- **Feature 2:** a ~30-line hand-written service worker. Fetch HTML
  network-first and serve hashed `/assets/*` cache-first. No Workbox.
- **Cheaper versions of the other gaps:** no reminders (the what-if preview
  already answers "can I have another?" at the moment it's asked). Taper
  becomes a tip in Calibrate. JSON export/import already handles moving
  devices.
- **Don't extend the registry until something uses it.** Outside tests,
  `aggregate`, `getMetric`, `listMetrics`, `sensitivity` and `pen` have no
  callers.
- **Later, if usage justifies it:** a two-bucket sleep comparison ("≤30 mg
  at bed: avg 3.9 (n=12) · >30 mg: 3.1 (n=9)"); a mood/focus tap; reminders
  and sync tied to an explicit backend decision; a HealthKit Shortcut
  probably never.

### Risks & blind spots
Every item is a guess with zero users. Self-rated sleep may never show the
effect (Drake: people don't perceive it). Daily check-ins can wear people
out, so the prompt must be skippable with no streaks. If people forget the
app between drinks, reminders move up the list. Without git, one bad edit
can lose the whole project.

### Confidence
`high`: the multi-metric scaffolding exists and is unused, and every
deferred item needs a backend or settings history.

---

## 🗳️ Scalability Architect

### Position
The app's biggest scaling asset is that it has no server: $0 per extra
user. Keep the next 1–3 features on-device (PWA, a sleep check-in,
sync-ready data-model fixes). Treat Web Push, sync and HealthKit as later,
minimal-state relays. The real limits are concurrent writers and server
state, not data volume.

### Key points
- **#1 PWA:** a service worker pre-caching Vite's hashed assets. It's also
  a prerequisite for Web Push on iOS. Fix in the same change: `openDB` has
  no `blocked`/`blocking` handlers, so a version bump stalls silently, and
  `store.ts` reads IndexedDB once, so add a `BroadcastChannel` so the tab
  and the installed app don't each keep stale `state.entries`.
- **#2 sleep check-in plus two data-model fixes before data accumulates:**
  (a) effective-dated settings, because changing half-life silently
  rewrites past "mg at bedtime"; (b) a `source`/external-id on `Entry` so
  Shortcut/HealthKit imports don't create duplicates. Compute-on-read still
  holds. Limit `init()` to the last 30–90 days once metric #2 arrives.
- **#3 sync-readiness, without building sync:** `importAll` writes
  unconditionally, so an old backup reverts newer edits and brings back
  deleted entries. Add tombstones, merge by `updatedAt` (or an HLC plus a
  deviceId), store custom drinks as one record each, and bump to
  `DB_VERSION = 2` now, while there's one user on one device.
- **Later, Web Push as a minimal timer service:** it stores only
  `{deviceId, subscription, fireAtUTC}`, on the same origin, with per-minute
  buckets or Durable Object alarms, and prunes 404/410 subscriptions.
- **Later still:** sync as a per-user append-only log with
  server-assigned sequence numbers, ideally E2E encrypted. For the HealthKit
  bridge, import nightly summaries only, via the URL fragment.

### Risks & blind spots
The main risk is over-engineering (caches, rollups, workers aren't needed).
Concurrent writers arrive before sync does: a tab plus the installed app on
one phone each keep their own memory, and undo can resurrect an entry
another window edited. Service-worker version skew needs a deliberate
update strategy. Push fire times still describe when the user drinks
caffeine.

### Confidence
`high` on data volumes, compute, and the import/settings/`openDB` gaps,
since they come straight from `src/data/*`.

---

## 🗳️ Compliance Officer

### Position
Ship on-device features first, and treat the first server-dependent
feature as its own deliberate milestone: (1) a local sleep check-in, (2) a
PWA, (3) server-free cutoff nudges. Then Web Push, sync and the HealthKit
bridge. New metrics are cheap for compliance; new data flows off the
device are expensive. (Not legal advice.)

### Key points
- **The current copy makes promises you can be held to.** "Your log never
  leaves this browser" and "nothing is uploaded" (App.tsx) bind you under
  FTC Act §5 (see Flo, GoodRx, BetterHelp). Replace `acknowledgedAt` with
  `{noticeVersion, acceptedAt}`, add a one-page privacy notice that names
  the static host, and put 18+ in the acknowledgment itself.
- **#1 sleep, local-only:** `sensitivity: 'health'`, structured fields
  only, no disorder words. Effective-dated settings come before any "sleep
  lost per 100 mg". Show the insight only after enough paired nights, with
  a range, worded as an observation. Add an export note that the JSON now
  contains sleep history.
- **#2 PWA:** eviction is a data-availability failure (GDPR Art. 5(1)(f) and
  Art. 32). The service worker caches only the app shell, never user data,
  and "Erase everything" must also unregister it and clear its caches.
- **#3 cutoff nudges without a server:** an in-app notification while the
  app is open, an .ics reminder, or an iOS Shortcut automation. When Web
  Push does come: `{endpoint, nextFireAt}` only, an empty payload, deletion
  on unsubscribe, erase and 410, plus rewritten copy and a new notice
  version.
- **Later, ordered by compliance load:**
  - Taper: wellness framing only; no withdrawal-symptom logging, because
    caffeine withdrawal is a DSM-5 diagnosis.
  - Shortcut bridge: file, clipboard, or a fragment cleared with
    `replaceState`, never query strings. Pulling from multiple sources makes
    it a PHR under the 2024 HBNR.
  - Web Push.
  - Sync: E2E encrypted, opt-in migration of existing data, Art. 9 consent.
  - Mood/focus last, on neutral scales, never PHQ-9.
  - Never: analytics/ad SDKs, sending logs to an LLM for "insights",
    collecting testers' exports.

### Risks & blind spots
`sensitivity` is a comment, not a control: nothing reads it, so route all
egress through one checked function. `connect-src 'self'` weakens once
same-origin API routes exist. `importAll` overwrites `acknowledgedAt`, so
an old backup can mark a newer notice as accepted. Testers who send exports
make you a controller, and possibly need IRB review for coursework.

### Confidence
`medium`: local-first and crossing to a server deliberately is solid; how
MHMDA and HBNR apply to a serverless app depends on the facts.

---

## Synthesis — angles, not consensus

### Shared starting points (a common prior to stress-test)
All four agree:
- **Ship and install before building more:** git, deploy, PNG touch icons,
  use it on your phone.
- **Service worker / PWA next.** Network-first HTML, cache-first hashed
  assets, and a version-skew plan.
- **Sleep as metric #2, local-only, structured, `health` sensitivity.**
- **Web Push is a backend in disguise,** so try server-free nudges first.
- **Sync last,** E2E encrypted.

Because the members share one model, and an earlier council in this project
already named sleep metric #2, this convergence is weak evidence. What they
might all be missing for the same reason: whether the owner (or a first
user) wants *insight* at all, or just a faster "should I have another?". The
critique suggests the core loop itself still needs work on the phone.

### Genuine tensions
| Tension | Positions | What this situation implies |
|---|---|---|
| The sleep *insight* | Devil: unreachable from self-report, gives false reassurance, show raw context only. Simplicity: two-bucket comparison later. Scalability/Compliance: effective-dated settings first, insight after enough nights, as an observation. | Ship sleep as **raw context plus actual-bedtime correction** now. Any computed comparison waits for real nights and effective-dated settings, and is worded as an observation with n. Devil's measurement critique is the strongest argument here. |
| Data-model hardening now vs later | Scalability: DB v2 now (tombstones, per-record drinks, source field, effective dates, BroadcastChannel). Simplicity: don't extend scaffolding until it's used. | The SW **creates** the multi-window problem, so ship `BroadcastChannel`, `openDB` blocked/versionchange handling, and an import merge that doesn't resurrect deletes **with the SW**. Defer tombstones/sync fields until sync. |
| Reminders | Devil/Compliance: .ics or Shortcut first. Simplicity: probably not needed. Scalability: Web Push as a minimal relay later. | Server-free first. Only build push if real use shows people forget between drinks. |

### Blind spots
- **One member each:**
  - Devil: **bedtime is the weakest input**, and the log-outside-the-app
    deep link (`#log/<drinkId>`) plus a Shortcut is the cheapest friction
    cut and HealthKit bridge.
  - Scalability: **concurrent writers on one phone** (browser tab plus the
    installed app).
  - Compliance: **notice versioning** before any change to data flows;
    `sensitivity` isn't enforced; import overwrites the acknowledgment.
- **No member covered:**
  - The critique's P1s (mobile preview hidden at decision time, the 7 s
    unpausable undo) compete directly with new features.
  - Onboarding: asking for bedtime on first run, since the default is the
    weakest input.
  - The evening dead end ("what can I still have?").
  - Units and locale (fl oz vs ml).

### Suggested direction
1. **Ship & use (≈1 h):** git, deploy `dist/`, PNG icons, install on phone,
   log every real cup for 14 days. (All four.)
2. **Fix the core loop on the phone:** the critique's P1s (armed-state
   decision strip, no auto-scroll, label collisions; pausable undo with a
   keyboard path). This is the product's main promise.
3. **PWA:** a hand-written SW, `openDB` blocked/versionchange handling,
   `BroadcastChannel`, and erase that also clears the SW. (All four, with
   Scalability's additions.)
4. **Log from outside the app:** `#log/<drinkId>/<portion>` plus an iOS
   Shortcut recipe that can also write to Apple Health. (Devil; Compliance's
   fragment-only rule.)
5. **Sleep check-in:** a morning tap for actual bed/wake plus an optional
   1–5, `health` sensitivity, drawn under the archive strips, and used to
   learn your real bedtime for the cutoff. No correlation number yet.
   (All four; scope per Devil.)
6. **Before any data leaves the device:** versioned notice + privacy page,
   import merge fix, effective-dated settings. Then server-free reminders,
   and only then Web Push or sync as a deliberate backend milestone.

The main open question is whether a computed sleep insight is ever
trustworthy without wearable data. Devil's objection stands unless sleep
comes from a device.
