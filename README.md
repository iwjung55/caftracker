# Caffeine Recorder

Track caffeine as a dose over time, not a tally. The dashboard is a
strip-chart recorder: it plots how much caffeine is active in your body right
now, projects where it will be at bedtime, and tells you the last time today
your usual drink still fits under your bedtime target.

*Caffeine Recorder* is a working title.

## What it does (MVP)

- **Active now:** a pharmacokinetic estimate (absorption + half-life decay)
  with an honest uncertainty band.
- **At bedtime:** caffeine projected to still be active, against a target you set.
- **Last cup for tonight:** dose-aware (a cold brew's cutoff is earlier than a tea's).
- **What-if preview:** pick a drink and see the curve and every number move *before* you log it.
- **Two-tap logging:** keys learn your usual drinks; portions (½–2×), backdating
  (15 min / 30 min / 1 h / any time), editable mg, custom "usuals".
- **Today's log:** with *Again*, *Edit* and *Delete*, plus undo.
- **14-day archive:** one strip per day, so you can see *when* you drink.
- **Settings:** set your personal half-life, bedtime, bedtime target, daily
  reference and when your day starts, with a live chart that redraws as you go,
  plus evidence-graded notes on using caffeine well.
- **Works offline** once installed (service worker caches the app, never your data).
- **Your data:** stays in this browser (IndexedDB). JSON export/import and erase-all.

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
