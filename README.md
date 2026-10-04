# Caffeine Recorder

Track caffeine as a dose over time, not a tally. The dashboard is a
strip-chart recorder: it plots how much caffeine is active in your body right
now, projects where it will be at bedtime, and tells you the last time today
your usual drink still fits under your bedtime target.

*Caffeine Recorder* is a working title.

## What it does

You only ever enter one thing: **what you drank.**

- **One button:** "+ Add drink" opens a searchable sheet (your usual drinks
  first, then 70+ presets including 30 energy drinks: Red Bull, Monster,
  Celsius, Ghost, C4, Alani Nu, Bang, Prime, Reign…). Tap a drink and it's
  logged; *Change time* and *Undo* are in the confirmation.
- **Suggestion:** one sentence on what to do next ("Have an espresso now",
  "Top up at 2:40 PM", "You're set until 4:50 PM", "Skip the next one",
  "Done for today"), computed on your device from research defaults and
  your drink history, inside fixed safety limits. Every drink in the sheet
  carries its own tag ("Best now", "Hurts sleep · ≈55 mg at bed").
- **A few numbers:** caffeine now (and whether you're in your focus range),
  today vs your limit, estimated sleep impact tonight, and when you'll
  crash.
- **The chart:** caffeine active across the day with your focus range,
  bedtime and target, plus today's log and a 14-day history.
- **Optional Settings:** body weight (sizes everything in mg/kg), focus
  hours, half-life, bedtime, target. Nothing is required.
- **Private:** everything stays in your browser; works offline once installed.

Built to grow: every metric shares one `Entry` shape and a thin metric
registry, so sleep, water, mood, focus and exercise can be added without
migrations. See [docs/architecture.md](docs/architecture.md).

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

```bash
npm test
```

```bash
npm run build
```

`dist/` is a static site. Pushing to `main` deploys it to GitHub Pages
automatically (`.github/workflows/deploy.yml`: install, test, build with
`BASE_PATH=/<repo>/`, publish).

**Install it on your phone:** open the site in Safari, then Share → *Add to
Home Screen* (Chrome on Android: ⋮ → *Install app*). The installed app opens
full-screen, works offline, and browsers are much less likely to clear its
storage. Your log still lives only on that device, so use *Settings → Export
backup* now and then.

## Docs

- [PRODUCT.md](PRODUCT.md): who it's for and the product principles (several are marked *inferred*, so please review them).
- [DESIGN.md](DESIGN.md): the visual system (strip-chart recorder world).
- [docs/architecture.md](docs/architecture.md): data model, adding a metric, privacy posture, next steps.
- [docs/research.md](docs/research.md): sources for every constant and drink value.
- `.claude/council-cache/`: the architecture council's full perspectives.

## Not medical advice

Estimates for healthy adults based on population averages. Caffeine affects
people very differently. Pregnancy, some medications and liver conditions
change it a lot. Intended for ages 18+.
