# Research notes

Compiled 2026-10-02 by research agents for the MVP. Every constant in
`src/metrics/caffeine/constants.ts` and every preset in `drinks.ts` traces to
a line here. Where evidence is weak, it says so — the app's copy must not be
firmer than this file.

Sourcing caveat: PubMed Central pages were behind a CAPTCHA (not bypassed);
abstracts were verified through Europe PMC / NCBI E-utilities, and full text
was read where open access. Items marked **[secondary]** were not verified
against a primary source.

---

## 1. Pharmacokinetics (the model)

**Model.** One-compartment, first-order absorption and elimination (Bateman):

```
A(t) = D · F · ka/(ka − ke) · (e^(−ke·t) − e^(−ka·t)),   ke = ln2 / t½
```

Standard for caffeine (Seng 2009 fit exactly this, n=59,
https://pubmed.ncbi.nlm.nih.gov/19125908/).

| Constant | Value | Source |
|---|---|---|
| Bioavailability F | 1.0 | Blanchard & Sawers 1983: F = 108 ± 4 %, Tmax 29.8 ± 8.1 min. https://doi.org/10.1007/BF00613933 |
| Tmax | 30–120 min (capsules ~30, cola/chocolate ~90–120) | ISSN 2021 https://doi.org/10.1186/s12970-020-00383-4 ; EFSA 2015 PK slides https://efsa.europa.eu/sites/default/files/event/documentset/150305-p09.pdf |
| **ka** | **4.9 h⁻¹** (absorption t½ ≈ 8.5 min) | Back-solved from Bateman Tmax = 45 min at t½ = 5 h. No single authoritative value; Seng 2009 reports 51 % between-subject variability in ka. |
| **t½ default** | **5.0 h** | ISSN: "generally 4–6 h", range 1.5–10. Study means 4.3 (Seng), 5.2 (Healy 1989), 5.37 (Abernethy 1985), 6.0 (Parsons 1978), median 5 (Jeppesen 1996). |
| Uncertainty band | t½ × 0.6 – 1.4 (3–7 h at default) | Covers ISSN's typical range; individuals reach 1.5–10 h. |

**Simplification check (100 mg, t½ 5 h):** Bateman vs 45-min linear ramp vs
instant absorption agree within ~5 % after 1 h (89 / 92 / 87 mg at 1 h;
25.7 / 26.3 / 25.0 mg at 10 h). Only the first 30–45 min differ.

**Do not copy Penn State's Caffeine Zone constants** (Ritter & Yeh 2011,
https://acs.ist.psu.edu/papers/ritterY11.pdf): its "half-lives" of 7 min and
4 h are applied as time constants (true half-lives ≈ 4.9 min and 2.8 h), and
its sleep threshold was "anecdotal".

### What changes half-life

Shown to users only as explanatory text next to the single "personal
half-life" setting — the app never asks about these (compliance review:
asking would collect special-category health data).

| Factor | Effect | Source |
|---|---|---|
| Smoking | ×0.58–0.70 | Parsons 1978 https://pubmed.ncbi.nlm.nih.gov/657717/ ; Seng 2009 |
| Oral contraceptives | ×1.47 (7.88 vs 5.37 h) | Abernethy & Todd 1985 https://pubmed.ncbi.nlm.nih.gov/4029248/ |
| Pregnancy | ≈ ×1.5 / ×1.9 / ×2.9 by trimester; ~16 h late | Tracy 2005 https://pubmed.ncbi.nlm.nih.gov/15696014/ ; EFSA |
| Fluvoxamine | ×6 (5 → 31 h) | https://pubmed.ncbi.nlm.nih.gov/8807660/ |
| Ciprofloxacin | ×1.6–2.2 | https://doi.org/10.1128/aac.33.4.474 |
| Liver disease | up to 60–168 h; don't model — "ask a clinician" | https://pubmed.ncbi.nlm.nih.gov/7361718/ |
| CYP1A2 rs762551 | **No baseline effect in non-smokers** — don't offer a "fast/slow gene" toggle | Sachse 1999 https://pmc.ncbi.nlm.nih.gov/articles/PMC2014233/ ; EFSA |
| Age (healthy elderly) | no significant difference | https://pubmed.ncbi.nlm.nih.gov/6886969/ |

---

## 2. Sleep (the cutoff)

- **Drake et al. 2013** (J Clin Sleep Med 9:1195, n=12): 400 mg at 0, 3 or
  6 h before bed all disrupted sleep; at 6 h, objective total sleep time fell
  by >1 h, and participants didn't perceive it.
  https://doi.org/10.5664/jcsm.3170
- **Gardiner et al. 2023** (Sleep Med Rev 69:101764, 24 studies): caffeine
  reduced total sleep by 45 min and efficiency by 7 %. Cutoffs where the
  effect stops being *significant* (not zero): **coffee (107 mg) ≥ 8.8 h**,
  **pre-workout (217.5 mg) ≥ 13.2 h** before bed; black tea (47 mg) no
  cutoff. Their model is linear in dose and time.
  https://doi.org/10.1016/j.smrv.2023.101764
- **No consensus "residual at bedtime" threshold exists.** EFSA: 100 mg
  "may affect sleep… particularly close to bedtime". Landolt 1995: ~25–30 mg
  residual still reduced sleep efficiency (n=9).
  https://doi.org/10.1016/0006-8993(95)00040-w

**Default bedtime target = 30 mg.** At t½ 5 h it reproduces both Gardiner
cutoffs (our PK model lands 0.6 h and 1.3 h *stricter* — see
`model.test.ts › defaults agree with the sleep evidence`). It is labelled a
user-owned starting point, never "safe".

---

## 3. Limits and effective use

| Guidance | Value | Source |
|---|---|---|
| Healthy adults, daily | 400 mg | FDA https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much ; EFSA 2015 https://doi.org/10.2903/j.efsa.2015.4102 |
| Single dose | ≤ 200 mg (≈3 mg/kg) | EFSA 2015; OTC monograph 21 CFR 340.50 (100–200 mg, ≥3–4 h apart) |
| Pregnancy / breastfeeding | 200 mg/day (EFSA, ACOG); 300 mg (Health Canada) | ACOG CO 462 https://pubmed.ncbi.nlm.nih.gov/20664420/ |
| Adolescents | 2.5 mg/kg/day (Health Canada) / 3 mg/kg (EFSA) | Health Canada |
| Alertness | EFSA claim ≥ 75 mg; effects from 32 mg | https://doi.org/10.2903/j.efsa.2014.3574 ; Lieberman 1987 |
| In habitual users | much of the "boost" is withdrawal reversal | Rogers 2010 https://doi.org/10.1038/npp.2010.71 |
| Exercise | 3–6 mg/kg ~60 min before (min ~2 mg/kg) | ISSN 2021 |
| "Wait 90–120 min after waking" | **Not supported** by any trial | Lovallo 2005 undercuts the cortisol rationale |
| Coffee nap | 150–200 mg then 15–20 min nap (small studies) | Horne & Reyner 1996/1997; Hayashi 2003 |
| Withdrawal | onset 12–24 h, peak 20–51 h, lasts 2–9 days; from ≥100 mg/day | Juliano & Griffiths 2004 https://pubmed.ncbi.nlm.nih.gov/15448977/ |
| Tolerance | cardiovascular in 1–4 days; exercise benefit fades after ~15–28 days | Robertson 1981; Lara 2019; Beaumont 2017 |

---

## 4. Drink presets (mg per serving)

USDA FoodData Central values converted per serving; brand-style values from
CSPI's 2026 table (https://www.cspi.org/article/how-much-caffeine-coffee-tea-soda-and-other-foods).
Presets are generic (no brand names) and editable before logging.

| Preset | mg | Range | Basis |
|---|---|---|---|
| Espresso (1 shot) | 64 | 50–75 | USDA 171891 |
| Double espresso | 128 | 100–150 | |
| Drip coffee 8 oz | 95 | 75–165 | USDA 171890; FDA range |
| Café drip 16 oz | 310 | 235–410 | Starbucks grande via CSPI; one outlet measured 259–564 mg over 6 days (McCusker 2003 https://doi.org/10.1093/jat/27.7.520) |
| Americano 16 oz | 225 | 150–300 | CSPI |
| Latte 16 oz | 150 | 128–190 | CSPI (2 shots) |
| Cold brew 16 oz | 205 | 150–295 | CSPI |
| Instant coffee 8 oz | 62 | 30–90 | USDA 174130 |
| Decaf 8 oz | 2 | 2–15 | USDA; FDA |
| Black tea 8 oz | 47 | 30–60 | USDA 173227; Health Canada |
| Green tea 8 oz | 28 | 20–45 | USDA 171917 |
| Matcha 2 g | 70 | 30–90 | 16–44 mg/g measured |
| Yerba mate 8 oz | 80 | 50–110 | CSPI |
| Cola 12 oz | 34 | 34–41 | CSPI |
| Diet cola 12 oz | 46 | 35–47 | CSPI |
| Citrus soda 12 oz | 54 | 54–68 | CSPI |
| Energy drink 8.4 oz | 80 | 80–114 | label/CSPI |
| Energy drink 16 oz | 160 | 140–300 | label **[secondary]** |
| High-caffeine energy 12 oz | 200 | 200–300 | CSPI |
| Energy shot 1.9 oz | 200 | 100–230 | CSPI |
| Pre-workout scoop | 250 | 150–350 | top-100 average 254 ± 80 mg (https://doi.org/10.3390/nu11020254); 42 % of products under-label (https://doi.org/10.1002/dta.3043) |
| Caffeine tablet | 200 | 100–200 | OTC max single dose |
| Dark chocolate 1 oz | 23 | 12–35 | USDA 170273 |

---

## 5. Competitive landscape (Oct 2026)

- Crowded with **iOS-only** indie apps (HiCoffee, Caffeine App, Caffiend,
  RECaf, Caffeine Clock, CaffSense, Clarity, Caffi, CaffPulse…). AlternativeTo
  lists **no web-based alternative**.
- Baseline every competitor ships: decay curve, residual at bedtime, drink
  database, widget.
- Top complaints: paywalls on drink databases and integrations; metabolism
  not adjustable; logging friction ("log at start or end of sip?", half
  servings); shallow history; database values that can't be accurate.
- Opportunities this MVP takes: web-first and free; dose-dependent cutoff
  (not a fixed "X hours before bed"); "what if I drink this?" preview;
  adjustable half-life with an honest uncertainty band; portions and
  backdating; undo instead of confirm dialogs; export.
- Opportunities deferred: Web Push cutoff reminders, sleep/mood check-in for
  correlation ("sleep lost per 100 mg", à la Jawbone UP Coffee), tapering
  plans, iOS Shortcut bridge to HealthKit.

Interop for later: HealthKit `HKQuantityTypeIdentifierDietaryCaffeine` (mg,
cumulative; dedupe via `HKMetadataKeySyncIdentifier` + version); Health
Connect `NutritionRecord.caffeine` (interval record; dedupe via
`clientRecordId` + version). Our client-generated entry `id` maps onto both.
