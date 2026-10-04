# Focus Advisor & Insights — design

Date: 2026-10-03 · Revised 2026-10-04 (revision 2, below) · Status: revision 2 implemented

## Revision 2 (2026-10-04): drinks are the only input

The owner narrowed the product: **the only thing a person enters is a
drink**, via one "+ Add drink" button. This supersedes parts of the design
below:

| Original | Revision 2 (implemented) |
|---|---|
| Check-ins: focus 1–5, jitters, water, workout, morning sleep | **Removed.** No inputs besides drinks. |
| Learned Bayesian focus + jitter models (need ratings) | **Deferred.** Suggestions use research defaults plus patterns learned from drink history only: usual drinks, when your day starts (median first-drink time), tolerance (7-day average). `src/advice/engine.ts` |
| Sleep from check-ins | **Estimated** "sleep impact tonight" (Low / Some / High) from caffeine left at bedtime. |
| Keys + composer + arming preview | **One button → sheet → one tap.** Every drink in the sheet carries its own suggestion tag. |
| Body weight, focus hours required | **Optional** in Settings (70 kg and 9:00–18:00 assumed; start learned from history). |
| Insights page | **Deferred**; drink-derived findings only when built. |

Kept: the focus range (≈1–3 mg/kg active), the crash (first slide back
below the range), all hard limits (bedtime target, ≤ min(200 mg, 3 mg/kg)
per dose, ≤ min(reference, 5.7 mg/kg) per day, 45-min spacing, jitter
ceiling), bold advice (any predicted gain), the verdict set, and the
privacy posture. Drink catalog expanded to 71 presets (31 energy drinks),
verified 2026-10-04 (docs/research.md §4b).

## 1. Goal

Tell the user whether to have more caffeine — how much and when — to
**optimize performance** (studying, getting through the day, avoiding the
crash) while still protecting sleep, personalized by body weight, food,
sleep, how they feel, and a few other cheap signals. Then turn the
accumulated data into honest **insights**.

Decisions made with the owner:

| Topic | Decision |
|---|---|
| Optimize for | Performance: stay in a personal focus range during focus hours, avoid crashes, keep the bedtime target |
| When focus matters | Usual focus hours (Settings) + one-tap "Focus for 2/3/4 h" override |
| Inputs entered | Body weight, food with the drink, last night's sleep, focus rating 1–5, jitters tap, planned workout, sipping time, water |
| Inputs derived (free) | Tolerance (7-day avg), hours awake, afternoon dip |
| Deliberately excluded | Smoking, contraceptives, pregnancy, medications (covered by the personal half-life setting); stress, alcohol (too sensitive); heart rate, steps (need wearables) |
| Presentation | Always-visible Next-move card + a verdict when arming a drink |
| Engine | **Learned model** (Bayesian, research-based priors so it works on day one) |
| Advice strength | **Bold**: recommend whenever any gain over "nothing" is predicted |
| Insights | In scope, with built-in honesty rules |

## 2. Architecture

```
src/metrics/            registry (existing) + new metric definitions
  caffeine/             payload v2 (food, sipMinutes); PK: food & sipping
  sleep/ focus/ jitters/ water/ workout/
src/learn/              learned models — pure functions, no I/O
  features.ts           feature vector at a moment in time
  linalg.ts             tiny dense matrix helpers (≤8×8)
  focusModel.ts         Bayesian linear regression (conjugate normal)
  jitterModel.ts        logistic regression, MAP with prior (Newton)
src/advice/             decision layer — pure functions
  guardrails.ts         hard limits (never learned)
  engine.ts             candidates → simulate → score → verdict
  drinkFeedback.ts      verdict for an armed drink
src/insights/           findings computed on read, with honesty rules
src/data/store.ts       generalized: all metrics, logEntry(metric, …)
src/components/         NextMove, CheckInRow, MorningCard, Insights page,
                        chart: focus band + top-up flag; Settings sections
```

Principles kept from the MVP: store facts only, derive everything on read;
copy values onto entries; logical days; hard deletes; no data leaves the
device.

## 3. Data

### New metrics (registry; no migrations)

| id | kind | value | sensitivity | notes |
|---|---|---|---|---|
| `sleep` | interval | minutes asleep (bed → wake) | health | `data: { v: 1 }` |
| `focus` | scale 1–5 | rating | health | `data: { v: 1, prompted: boolean }` |
| `jitters` | quantity | 1 per tap | health | |
| `water` | quantity | ml (one glass = 250 ml) | lifestyle | |
| `workout` | interval | planned minutes | lifestyle | `data: { v: 1, planned: true }` |

### Caffeine payload v2

`{ v: 2, label, drinkId?, food?: 'with' | 'empty', sipMinutes?: number }`.
v1 entries are read as `sipMinutes: 0`, food unknown (treated as empty
stomach — the faster, more conservative curve).

### Settings additions

`bodyWeightKg?`, `weightUnit: 'kg' | 'lb'`, `focusStartMin` (default 9:00),
`focusEndMin` (default 18:00), `focusUntil?` (override expiry, epoch ms),
`defaultFood: 'with' | 'empty'` (last choice), `learningResetAt?`.

No body weight yet → advice runs assuming 70 kg and the card says so, with
a link to add weight.

### Model state

Never stored. Posteriors are recomputed from entries on read (hundreds of
ratings × 8×8 algebra is microseconds). "Reset learning" sets
`learningResetAt`; ratings before it are ignored, nothing is deleted.

## 4. Absorption model changes

- **Food:** a dose taken with food uses `ka = 2.0 h⁻¹` (Tmax ≈ 1.4 h at
  t½ 5 h) instead of 4.9 h⁻¹ (Tmax ≈ 45 min): a later, lower peak.
- **Sipping:** a dose with `sipMinutes = s > 0` is split into
  `k = max(1, round(s / 5))` equal sub-doses evenly over `s`.
- `Dose` gains optional `ka`; `activeAt` and the cutoff solver use it.

## 5. Learned focus model

**Outcome:** focus rating `y ∈ {1..5}` at time `t`.

**Features `x(t)`** (computed by `features.ts`):

| Feature | Definition |
|---|---|
| `1` | intercept |
| `a` | caffeine active at `t`, mg/kg (PK model, personal half-life, food/sip aware) |
| `a²` | so that too much lowers predicted focus |
| `debt` | `max(0, 8 − h)`, `h` = hours slept last night; no check-in → median debt of last 14 days, else 0 |
| `awake` | hours since wake (sleep entry end); no check-in → since `dayStart + 3 h` |
| `dip` | `exp(−(hourOfDay − 14)² / 2)` (afternoon dip centered 2 PM, sd 1 h) |
| `tol` | 7-day average intake, mg/kg/day |

**Model:** `y = βᵀx + ε`, `ε ~ N(0, σ²)`, `σ = 0.8`. Conjugate normal prior
`β ~ N(μ₀, diag(s₀²))`; posterior in closed form:
`Σ = (Σ₀⁻¹ + XᵀX/σ²)⁻¹`, `μ = Σ(Σ₀⁻¹μ₀ + Xᵀy/σ²)`.

**Priors (research-based):**

| Coefficient | Mean | SD | Meaning |
|---|---|---|---|
| intercept | 3.0 | 1.0 | |
| `a` | 0.8 | 0.5 | benefit per mg/kg |
| `a²` | −0.2 | 0.15 | → optimum `−β_a / 2β_a²` = 2.0 mg/kg |
| `debt` | −0.25 | 0.2 | per hour short of 8 h |
| `awake` | −0.05 | 0.05 | per hour awake |
| `dip` | −0.4 | 0.3 | at the 2 PM peak of the dip |
| `tol` | 0 | 0.1 | |

**Outputs:**
- `predict(x)` → mean and sd of predicted focus.
- `bestRange()` → active levels whose predicted focus (debt 0, awake 8 h,
  dip 0, current tol) is within 0.25 of the maximum, in mg/kg and mg. If
  the posterior `a²` coefficient is ≥ −0.02 it is clamped to −0.02 for this
  calculation (keeps a finite optimum).
- `confidence()` → `research` (< 10 ratings), `partly yours` (10–29),
  `mostly yours` (≥ 30 ratings across ≥ 10 days).

## 6. Jitter model

`P(jitter | a) = sigmoid(γ₀ + γ₁·a)`. Prior `γ₀ ~ N(−6, 2²)`,
`γ₁ ~ N(2, 1²)` (50% at 3 mg/kg). Positives: jitters taps at their active
level. Negatives: focus ratings with no jitters tap within ±30 min. MAP fit
by Newton's method (≤ 20 iterations, stop at step < 1e-6).
**Jitter level** = the `a` where `P = 0.2` (≈ 2.3 mg/kg at the prior).

## 7. Decision engine

**Window:** now → end of focus hours (or `focusUntil` if later), clipped to
`bedtime − timeToPeak`. Outside the window with no override → quiet card.

**Candidates:** "nothing", plus doses `D` × times `T`:
- `D`: the usual drink (full and half), quick-key drinks smaller than the
  usual, green tea, black tea — deduplicated by mg; food = `defaultFood`,
  sipping = quick.
- `T`: now, +30, +60, +90, +120 min inside the window; plus
  `workout − 60 min` when a workout is planned.

**Hard limits (filter; never learned):**
1. Bedtime residual including the candidate ≤ bedtime target.
2. Dose ≤ min(200 mg, 3 mg/kg).
3. Today's total + dose ≤ min(daily reference, 5.7 mg/kg).
4. Candidate time ≥ last dose + 45 min.
5. No dose within 2 h after a jitters tap.
6. Peak `P(jitter)` over the window ≤ 0.35.

**Score** (5-min steps across the window):
`mean predicted focus − 1.0 × max P(jitter) − 0.5 × crash`, where
`crash` = the largest drop of predicted focus below its running maximum
within the window.

**Choice (bold):** best = highest score. Recommend it if
`score(best) > score(nothing) + 0.01`. Near-ties (within 0.05) go to the
smaller dose, then the earlier time.

**Verdicts (card copy):**

| Situation | Card |
|---|---|
| Best dose now | "Have ~60 mg now (about half a drip coffee)" + why: "keeps you in range until 5:10 PM · ≈20 mg at bed" |
| Best dose later | "Top up at 2:40 PM: ~50 mg (a black tea)" + "before your afternoon dip" |
| Nothing is best, in range | "You're set until 4:50 PM" (when `a` leaves the best range) |
| Nothing is best, high/jittery | "Skip: more won't help right now" |
| Every dose blocked by limits 1–3 | "Done for today" + existing "under 30 mg by 1:10 AM" |
| Jitters pause (limit 5) | "Paused after your jittery check-in until 4:15 PM" |
| Workout within 3 h | "Pre-workout at 4:00 PM: ~200 mg (3 mg/kg)" or "Skip pre-workout caffeine: it would leave ≈55 mg at bed" |
| Outside focus hours | "Outside your focus hours (9 AM–6 PM)" + Focus for 2/3/4 h |

mg → drink mapping: closest of the user's drinks at ½, 1 or 1½ servings
(±15%); otherwise just "~X mg".

**Drink feedback (arming a drink):** violates a limit → the limit's reason
("Too late for tonight's sleep", "Over today's limit for your weight");
within 0.05 of best → "Good timing"; same time, more mg than best → "More
than you need (~X would do)"; best is later → "Early: you're in range until
3 PM"; otherwise "Fine, a little under ideal".

Recomputed on every log, check-in, setting change, and the 30 s clock.

## 8. Screens

- **Next-move card** replaces "Last cup for tonight" at the top of the
  readout (directly under the chart on phones): verdict, one-line why,
  action (**Log it** arms the drink; **Remind me at 2:40** draws an in-app
  marker), **Focus for 2 / 3 / 4 h**, confidence label.
- **Chart:** best-range band across the focus window (pen-band styling,
  labelled "your range"); pencil flag at a recommended top-up time; workout
  marker.
- **Check-in row** under the keys: How's your focus? (1–5) · Jittery ·
  + Water · Plan workout (time + minutes). Chip "How's your focus?"
  appears 45–120 min after a caffeine entry if no rating since; dismissible.
- **Morning card**, first open after day start when no sleep entry ended
  in the last 12 h:
  "How did you sleep?" bed (from bedtime setting) → wake (now, rounded to
  5 min), both editable, one tap to save.
- **Composer → Adjust:** With food / Empty stomach; Sipping: quick /
  ~30 min / ~1 h.
- **Settings:** *You* (body weight kg/lb, focus hours); *What the model has
  learned* (best range, sleep effect, jitter level, confidence, check-in
  count, Reset learning with undo).
- **Navigation:** Today · Insights · Settings.

All new UI follows DESIGN.md (strip-chart world, ruled lists, no card
grids, Alarm Amber only for warnings, 44 px touch targets).

## 9. Insights page

Ruled "lab report", recomputed on open.

**This week** recap vs the week before: average daily mg; days with
bedtime residual ≤ target; average sleep; average focus.

**Findings** (each shows value, likely range, n, and a "how computed"
disclosure):

| Finding | Computation | Unlock |
|---|---|---|
| Your best range | `bestRange()` | ≥ 10 ratings over ≥ 5 days |
| Sleep → focus | `2 × β_debt` ("per 2 h short") | ≥ 10 ratings, ≥ 7 sleep check-ins, debt sd ≥ 0.5 h |
| Afternoon dip | `β_dip`; afternoon focus on days with a top-up 12:30–1:45 vs without | ≥ 5 days in each group |
| Caffeine → sleep | mean sleep: nights with residual > target vs ≤ target | ≥ 7 nights per group; tagged "observation, not proof" |
| Jitter level | jitter model | ≥ 2 jitters taps |
| Timing drift | last-drink time vs that day's cutoff, last 7 days | ≥ 5 caffeine days |
| Tolerance trend | 7-day avg vs prior 7 days; shown if change ≥ 15% | 14 days of log |
| Water | daily mean focus: days with ≥ 6 glasses vs fewer | ≥ 5 days per group |

**Honesty rules:**
- Likely ranges are 80% intervals (posterior for model terms; mean
  difference ± 1.28·SE for group comparisons). If the interval contains
  zero → "No clear pattern yet" instead of a number.
- Locked findings appear under "Still learning" with progress
  ("4 more sleep check-ins to unlock *Caffeine → sleep*").
- Wording is observational ("on days when…", "in your log"); never "causes".
- No push, no LLM-written text, nothing leaves the device.

## 10. Privacy & copy

Sleep, focus and jitters are `sensitivity: 'health'`; everything stays in
IndexedDB. Export includes them; the export button notes that the file now
contains sleep and focus history. No free-text fields. Wellness framing
only: no "safe", no diagnoses, no withdrawal-symptom tracking. The 18+
estimates notice stays.

## 11. Testing

- **Model:** with no data, `bestRange()` ≈ 2 mg/kg optimum and predictions
  equal the prior; on 300 synthetic ratings from known β the posterior mean
  is within 0.1 of each true coefficient; Reset learning ignores earlier
  ratings.
- **Jitter model:** learns a lower jitter level from synthetic taps; stays
  at the prior with none.
- **Engine:** property test over 1,000 seeded random days — no recommended
  dose ever violates a hard limit; scenarios: morning start, before the
  dip, in range, high level, evening "done", jitters pause, workout,
  outside focus hours, no body weight.
- **PK:** food delays and lowers the peak; sipping flattens it; totals are
  preserved.
- **Insights:** each finding locked/unlocked at its threshold; interval
  crossing zero → "No clear pattern yet"; wording contains no causal verbs.
- **Data:** new metrics validate; v1 caffeine entries and old backups
  import; store round trip across metrics.
- **UI:** verified in the browser at desktop, phone width and dark mode.

## 12. Build order

1. Metrics, settings, store generalization (`logEntry`, all metrics).
2. Absorption: food and sipping.
3. Learned models (features, linalg, focus, jitters).
4. Guardrails + decision engine + drink feedback.
5. UI: Settings (You, model), check-in row, morning card, composer
   additions, Next-move card, chart band/flag.
6. Insights page.
7. DESIGN.md update, critique pass.

## 13. Out of scope

Push notifications, wearables/HealthKit, sync, LLM features, mood beyond
the focus scale, menstrual/medication/smoking inputs.
