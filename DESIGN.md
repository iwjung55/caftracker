---
name: Caffeine Recorder
description: A one-pen strip-chart recorder for the caffeine active in your body across the day.
colors:
  pen-caffeine: "#b4123e"
  pen-caffeine-band: "rgb(180 18 62 / 0.075)"
  print: "#2b6a4c"
  grid-minor: "rgb(46 125 88 / 0.14)"
  grid-major: "rgb(46 125 88 / 0.36)"
  lamp-ok: "#23a861"
  lamp-warn: "#d99a00"
  focus: "#1663c7"
  alarm: "#7a4f00"
  danger: "#a3122f"
  on-fill: "#ffffff"
  bezel-highlight: "rgb(255 255 255 / 0.4)"
  housing: "#d3d9d6"
  housing-raised: "#dfe4e1"
  housing-sunk: "#c5ccc9"
  seam: "#aab3af"
  bezel: "#22282a"
  bezel-edge: "#3a4244"
  bezel-legend: "#9fb0aa"
  paper: "#f6faf4"
  paper-night: "#e7efe8"
  ink: "#1b2220"
  ink-2: "#47524f"
  ink-3: "#525d59"
  pencil: "#59625f"
  cursor: "#1b2220"
  key: "#f1f4f2"
  key-top: "#ffffff"
  key-edge: "#9ea8a4"
  pen-caffeine-dark: "#ff5a7e"
  pen-caffeine-band-dark: "rgb(255 90 126 / 0.1)"
  print-dark: "#7cc3a0"
  grid-minor-dark: "rgb(110 205 160 / 0.07)"
  grid-major-dark: "rgb(110 205 160 / 0.18)"
  lamp-ok-dark: "#3ddc84"
  lamp-warn-dark: "#ffbf3d"
  focus-dark: "#6aa8ff"
  alarm-dark: "#ffc24d"
  danger-dark: "#ff8a7a"
  on-fill-dark: "#0d1311"
  bezel-highlight-dark: "rgb(255 255 255 / 0.04)"
  housing-dark: "#141918"
  housing-raised-dark: "#1b2120"
  housing-sunk-dark: "#0e1211"
  seam-dark: "#2a3230"
  bezel-dark: "#030505"
  bezel-edge-dark: "#222a29"
  paper-dark: "#121a17"
  paper-night-dark: "#0b100e"
  ink-dark: "#e3e9e6"
  ink-2-dark: "#a9b4b0"
  ink-3-dark: "#8b9692"
  pencil-dark: "#9aa5a1"
  cursor-dark: "#e3e9e6"
  key-dark: "#1f2624"
  key-top-dark: "#283130"
  key-edge-dark: "#39433f"
typography:
  headline:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.728rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  readout:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.44rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  note:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.45
  caption:
    fontFamily: "Barlow, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  figure:
    fontFamily: "'Barlow Condensed', Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.45
    fontFeature: "tnum"
  plate:
    fontFamily: "'Barlow Condensed', Barlow, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.08em"
  scale:
    fontFamily: "'Barlow Condensed', Barlow, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
  annotation:
    fontFamily: "'Barlow Condensed', Barlow, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
rounded:
  strip: "2px"
  paper: "3px"
  sm: "4px"
  md: "6px"
  well: "8px"
  bezel: "10px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
components:
  bezel:
    backgroundColor: "{colors.bezel}"
    rounded: "{rounded.bezel}"
    padding: "10px"
  chart-paper:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.paper}"
  chart-flag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.paper}"
    height: "20px"
  panel:
    backgroundColor: "{colors.housing-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  readout-value:
    textColor: "{colors.ink}"
    typography: "{typography.readout}"
  event-key:
    backgroundColor: "{colors.key}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 12px 10px"
    height: "72px"
  event-key-dose:
    textColor: "{colors.pen-caffeine}"
    typography: "{typography.figure}"
  button:
    backgroundColor: "{colors.key}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-hover:
    backgroundColor: "{colors.key-top}"
  button-primary:
    backgroundColor: "{colors.pen-caffeine}"
    textColor: "{colors.on-fill}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, var(--pen-caffeine) 88%, black)"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
  button-quiet-hover:
    backgroundColor: "{colors.housing-sunk}"
  button-small:
    padding: "0 12px"
    height: "32px"
  button-danger-solid:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-fill}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  navlink:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  navlink-hover:
    backgroundColor: "{colors.housing-raised}"
  navlink-current:
    backgroundColor: "{colors.housing-sunk}"
  snackbar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.note}"
    rounded: "{rounded.md}"
    padding: "8px 8px 8px 16px"
---

# Design System: Caffeine Recorder

## Overview

**Creative North Star: "The Lab Strip-Chart Recorder"**

The interface is one bench instrument. An instrument-grey enamel housing carries a dark bezel; the bezel frames green-ruled chart paper; one crimson pen writes the caffeine active in the body from the start of the day to past bedtime, solid up to the pen carriage at "now" and dashed for the projection beyond it. The chart is the dashboard. Every other surface is a part of the same machine: the suggestion panel says what to do next, the readout states in words what the paper shows, one pen-coloured key feeds the pen, and the log and the 14-day archive file the paper away. The only thing anyone ever enters is a drink.

Density is instrument density: compact, labelled, tabular. Two type voices divide the work. Barlow Condensed is what the instrument prints (scales, annotations, the bezel plate, mg figures); Barlow is what the operator reads and presses. Color is held to the housing greys, the paper's printed green and pen ink, and pen ink is data, never decoration. Depth is physical and scarce: the paper sits recessed in its bezel, the keys travel when pressed, and almost nothing else casts a shadow.

The dark theme is the night chart: housing and paper go to graphite, the printed green lightens, and the pen turns luminous. Both themes are first-class and every color token is declared twice. The direction was chosen against three things, and the build keeps all three out: the stat-card grid, the progress ring, and the coffee-brown cozy café app.

**Key Characteristics:**
- A full-width strip chart is the first and largest thing on the dashboard.
- One pen color per metric; caffeine is pen 1.
- Solid past, dashed projection, a faint uncertainty band, and a pencil-grey ghost for a drink not yet logged.
- One pen-coloured hardware key ("+ Add drink") with 2px of travel; everything else is read, not entered.
- Condensed printed type on the paper, plain Barlow on the housing, tabular figures everywhere.
- Flat housing panels separated by 1px seams; shadows only on physical objects.
- A day chart and a night chart, token for token.

## Colors

A cool instrument-grey housing, green-ruled paper, and one saturated ink per metric; anything that is not data stays grey or green. Values are given day / night; the frontmatter carries each night value under a `-dark` key.

### Primary
- **Pen 1: Caffeine Crimson / Luminous Rose** (#b4123e / #ff5a7e): The caffeine pen. On the paper it draws the trace, the projection, the pen tip, the bedtime-value point and the event markers, and the dose ticks on archive strips; in the readout it is the Today meter's needle. Off the paper it colors every caffeine mg figure (sheet rows, log), fills the one button ("+ Add drink") and the commit button ("Save"), and is the `accent-color` of the caffeine calibration sliders. It measures 6.4:1 on day paper and 6.3:1 on night paper.
- **Pen 1 Band** (rgb(180 18 62 / 0.075) / rgb(255 90 126 / 0.1)): The uncertainty band: the spread of the curve between the low and high half-life bounds, filled behind the trace. Each pen has a band variant at its own hue and low alpha.

### Secondary
- **Chart-Paper Green** (#2b6a4c / #7cc3a0): The paper's own printing. Scale numerals and hour labels, the "BED" and "target" labels, the bedtime rule and the bedtime-target rule; the bedtime rule on archive strips. 6.1:1 on day paper, 9.1:1 on night paper.
- **Minor and Major Rulings** (minor rgb(46 125 88 / 0.14), major rgb(46 125 88 / 0.36) / minor rgb(110 205 160 / 0.07), major rgb(110 205 160 / 0.18)): The paper grid. Minor rulings every 30 minutes and every half scale step; major rulings on the hour and on every full step. Archive strips use the minor ruling every three hours.

### Tertiary
- **Lamp Green** (#23a861 / #3ddc84) and **Lamp Amber** (#d99a00 / #ffbf3d): Lamps only. Green beside "Saved on this device" / "Saved in this browser"; amber beside "Back up your log" (the browser hasn't promised to keep storage, there are 5+ entries, and no export in 14 days), and as the lamp dot on a warning note.
- **Focus Blue** (#1663c7 / #6aa8ff): Focus rings and nothing else; the only blue in the system.
- **Alarm Amber** (#7a4f00 / #ffc24d): Warning state, deliberately unlike any pen: over-target and over-reference notes, over-reference archive totals, the "Back up your log" lamp words. 5.0:1 on day housing, 10.7:1 on night raised housing.
- **Danger Red** (#a3122f / #ff8a7a): Destruction and errors only: Delete on hover, the Erase confirm, error lines, invalid-field borders.
- **On-Fill** (#ffffff / #0d1311): The label on a filled pen or danger surface: 6.8:1 / 6.3:1 on the pen, 7.8:1 / 8.2:1 on danger.

### Neutral
- **Enamel Housing** (#d3d9d6 / #141918): The page background: the body of the instrument. Also the browser theme color.
- **Raised Housing** (#dfe4e1 / #1b2120): Panels set into the housing (readout, composer, picker, notice); nav-link hover.
- **Sunk Housing** (#c5ccc9 / #0e1211): Pressed-in states: the current nav link, quiet-button hover, picker-row hover.
- **Seam** (#aab3af / #2a3230): Every 1px divider and panel border on the housing.
- **Bezel** (#22282a / #030505) and **Bezel Edge** (#3a4244 / #222a29): The dark frame around the paper and its inner top lip. The bezel stays dark in both themes.
- **Bezel Legend** (#9fb0aa): Text engraved on the bezel: the plate above the paper and the caption below it. One value for both themes (6.6:1 day, 8.9:1 night). In the build it is a literal, not a custom property.
- **Chart Paper** (#f6faf4 / #121a17): The chart paper and archive strips; also the fill of text inputs, which read as paper slips set into the housing.
- **Sleep Paper** (#e7efe8 / #0b100e): The paper after bedtime, on the chart and on every archive strip. The token is named `paper-night`; it means the sleep region, not the dark theme.
- **Ink** (#1b2220 / #e3e9e6): Primary text; the last-cup cutoff rule and its flag; the selected segment; the snackbar.
- **Ink 2** (#47524f / #a9b4b0): Secondary text: labels, notes, hints, units, the date.
- **Ink 3** (#525d59 / #8b9692): Tertiary text (archive legend and axis, slider end labels, drink servings, empty-day dashes; 4.8:1 on day housing) and non-text marks (keycap and input hover borders, meter ticks, the muted-flag outline).
- **Pencil** (#59625f / #9aa5a1): The ghost trace and its bedtime point while a drink is being considered: pencil, not ink.
- **Cursor** (#1b2220 / #e3e9e6): The scrub cursor's line and dot. It tracks Ink.
- **Keycap, Keycap Top, Keycap Edge** (#f1f4f2, #ffffff, #9ea8a4 / #1f2624, #283130, #39433f): The keycap face, the top of its gradient, and its 1px edge; also the face and border of default buttons, the keycap-style "Log espresso" button, and the border of inputs.

### Named Rules
**The One Pen Per Metric Rule.** Every metric owns exactly one pen: a `--pen-<metric>` ink and a `--pen-<metric>-band` fill, each declared in `:root` and again in the dark block, and named in that metric's `MetricDefinition.pen`. Caffeine is pen 1 (`--pen-caffeine`). A new pen arrives with both theme values and its band (its own hue at low alpha, as pen 1 uses 7.5% day and 10% night), clears 4.5:1 on Chart Paper and Sleep Paper in both themes, and does not share a hue with an existing pen, Alarm Amber, Danger Red, Chart-Paper Green, Pencil or Focus Blue. No pen beyond pen 1 has a color yet. In the shipped build the chart and stylesheet name `--pen-caffeine` directly; the registry's `pen` field is declared but not yet read by the chart.

**The Ink Is the Metric Rule.** Pen ink appears only where its metric is: that metric's trace, markers and figures, and the controls that commit or calibrate that metric. It is never used for navigation, headings, panels, focus or decoration.

**The Alarm Is Not Ink Rule.** A warning is never drawn in a pen's ink: it is Alarm Amber, like an annunciator lamp, and it is always also a word ("Over your target", "Above the reference"), an amber lamp dot, or an underline explained by a legend. Danger Red is reserved for controls that destroy and for errors.

**The Housing Text Floor Rule.** Text on the housing is Ink 3 or darker. Ink 3 measures 4.8:1 on day housing and 5.3:1 on raised housing; nothing lighter carries text. Labels on fills use On-Fill, never a fixed white, so the night chart keeps contrast.

## Typography

**Body Font:** Barlow (with system-ui, -apple-system, Segoe UI, sans-serif)
**Label/Mono Font:** Barlow Condensed (with Barlow, system-ui, sans-serif), the printed-scale face

**Character:** Barlow is a low-contrast, slightly rounded grotesque with the plainness of plates and signage; its condensed width reads as the scale printing on chart paper. Both are self-hosted, with no third-party requests, and only these faces ship: Barlow 400, 500 and 600, Barlow Condensed 500 and 600. There is no display face; the chart is the hero.

### Hierarchy
The housing scale steps by 1.2 from 1rem (1.2, 1.44, 1.728rem), with two fixed steps below (0.875, 0.75rem). Type printed on the chart is set in px because it lives in SVG user space.

- **Headline** (600, 1.728rem, 1.45, -0.01em): The page title on Calibrate. The dashboard's h1 is visually hidden because the chart is the headline. The Calibrate headings request the browser's bold (700); the nearest shipped face is 600.
- **Readout** (600, 1.44rem, 1.15, -0.01em, tabular): Readout channel values; 1.2rem at 600px and below. The unit follows at 1rem, weight 500, in Ink 2.
- **Title** (600, 1.2rem, 1.45): Section titles ("Log a drink", "Today's log", "Last 14 days") and Calibrate section headings.
- **Body** (400, 1rem, 1.45, tabular): Default running text and log rows; Calibrate row labels at 600.
- **Note** (400, 0.875rem, 1.45): Channel labels and notes, section hints, help text, notices; measure 60–65ch.
- **Label** (600, 0.875rem, 1.45): Field labels, legends, buttons, nav links, drink names in the sheet.
- **Caption** (400, 0.75rem, 1.45): The chart caption, archive legend, picker serving lines, slider end labels.
- **Figure** (Barlow Condensed 600, 1rem, tabular): mg numerals off the paper: sheet rows, log, archive totals. Calibrate's printed slider values use it at 1.2rem.
- **Plate** (Barlow Condensed 500, 0.75rem, uppercase, 0.08em): The bezel plate ("CAFFEINE ACTIVE · MG") and the time beside it.
- **Scale** (Barlow Condensed 500, 11px): Chart axis numerals and hours, meter labels, the archive hour axis.
- **Annotation** (Barlow Condensed 600, 12.5px): Labels written on the paper: the value at the pen, the value at bedtime, BED, target. Within the chart the same voice steps to 11.5px uppercase at 0.04em for flags, 12px for the cursor chip and 10.5px for event mg labels.

Plate and Scale request weight 400 in the stylesheet; with only Condensed 500 and 600 shipped, they render at 500.

### Named Rules
**The Printed Scale Rule.** Barlow Condensed is for what the instrument prints: scales, annotations, plates, flags and mg figures. Barlow is for what the operator reads and presses. Paragraphs, labels and buttons are never condensed; chart scales are never set in regular width.

**The Tabular Figures Rule.** `font-variant-numeric: tabular-nums` is set on the body and inherited everywhere, so readouts and figures hold their width as values update every 30 seconds.

**The 600 Ceiling Rule.** The shipped faces stop at 600 and nothing is set heavier. Emphasis is a step to 600 or a step in ink, never a heavier weight.

## Layout

A centered column, at most 1240px wide, padded 16px top, 24px sides, 48px bottom (12px, 16px, 48px at 600px and below). Spacing runs on a 4px base: 4, 8, 12, 16, 24, 32, 48px.

The Today view reads top to bottom: top bar, suggestion panel, recorder (chart and readout), lower deck (today's log and the 14-day archive). There is no footer: the estimates notice shows until acknowledged, and the full disclaimer lives in Settings. The recorder is a two-column grid: the chart takes the fluid column and the readout a fixed 300px column, 16px apart and equal in height. The paper is at least 340px tall (300px at 900px and below, 250px at 600px and below). Its time span runs from the start of the day (or two hours later if nothing was logged early) to whichever is later, three hours past bedtime or two hours past now. At 900px and below the readout drops beneath the chart and becomes a 2×2 grid of channels split by seams. At 900px and below the "+ Add drink" key leaves the suggestion panel and becomes a bar pinned to the bottom of the screen (full width, 52px, in the thumb zone, above the safe area); the page reserves room for it.

The suggestion panel sits 16px above the recorder. The lower deck is a 5:7 split with a 32px gap, 48px below the recorder, and stacks at 900px and below. Settings is two columns above 1080px: controls on the left (at most 680px; each row is label and help text beside a 220px control) and a sticky live-preview recorder on the right that redraws as values change. At 1080px and below the preview sits above the controls; at 600px and below rows collapse to one column.

Lists are ruled, not carded: log rows are at least 48px tall and archive rows at least 34px, each closed by a seam rule. Text measures: 60–65ch for help and fine print, 68ch for notices, 72–78ch for captions and legends.

### Named Rules
**The Chart Comes First Rule.** On the dashboard the strip chart is the first content and the widest object at every breakpoint. Only the top bar, the one-time estimates notice and the one-sentence suggestion sit above it. The readout sits beside it above 900px and beneath it below. New metrics join as pens on this recorder.

## Elevation & Depth

A hybrid. The housing is flat and layered tonally: Raised Housing for panels, Sunk Housing for pressed-in states, a 1px Seam at every edge. Real shadows belong only to physical objects: the bezel the paper sits in, the keys, and the floating layers (the add-drink sheet and the snackbar). The status lamp glows rather than casts.

### Shadow Vocabulary
- **Bezel** (`box-shadow: inset 0 1px 0 var(--bezel-edge), 0 1px 0 var(--bezel-highlight), 0 6px 18px rgb(20 30 26 / 0.18)`): An inner top lip, a light catch under the frame (40% white by day, 4% at night), and a soft drop.
- **Add key** (`box-shadow: 0 2px 0 <pen 62% toward black>, 0 3px 8px rgb(20 30 26 / 0.22)`): The one button's hard base and short drop; it collapses as the key moves down 2px.
- **Sheet** (`box-shadow: 0 18px 50px rgb(0 0 0 / 0.3)`, backdrop `rgb(10 14 13 / 0.48)`): The add-drink sheet floats over the dimmed instrument.
- **Keycap at rest** (`box-shadow: var(--key-shadow)`; day `0 2px 0 #8f9995, 0 3px 6px rgb(20 30 26 / 0.18)`, night `0 2px 0 #050707, 0 3px 6px rgb(0 0 0 / 0.5)`): A hard 2px base with a short soft shadow under it.
- **Keycap pressed** (`box-shadow: var(--key-shadow-pressed)`; day `0 0 0 #8f9995, 0 1px 2px rgb(20 30 26 / 0.2)`, night `0 0 0 #050707, 0 1px 2px rgb(0 0 0 / 0.5)`): The base collapses as the key moves down 2px.
- **Snackbar** (`box-shadow: 0 6px 20px rgb(0 0 0 / 0.25)`): The one floating layer.
- **Lamp** (`box-shadow: 0 0 0 2px rgb(0 0 0 / 0.08), 0 0 6px <lamp color>`): A bezel ring and a glow in the lamp's own color.

### Named Rules
**The Hardware Depth Rule.** Only objects that physically stand proud of the housing cast shadows: the bezel, the keys, the sheet and the snackbar. Panels (suggestion, readout, notice) are flat: Raised Housing with a 1px Seam. A shadow on a panel is wrong.

## Shapes

Small, machined radii that grow with the object. Paper corners are 3px (the chart paper, chart flags, the cursor chip; archive strips 2px, dose ticks 1px). Controls are 4px (buttons, inputs, nav links). Panels and keys are 6px. The bezel and the sheet are 10px (the bezel tightens to 8px with 6px padding at 600px and below; the phone sheet rounds only its top corners). Circles appear only as lamps, the pen tip and data points. Borders are 1px throughout. On the paper, event markers are 8px-wide upward triangles under the baseline; the Today meter's needle is a downward triangle; archive doses are 3px bars.

### Named Rules
**The Radius Ladder Rule.** 2, 3, 4, 6, 8, 10px, by how much of the machine the shape is: strip, paper, control, panel or key, key well (and the compact bezel), frame. Nothing is pill-shaped and nothing but a true circle goes past 10px.

## Components

### Buttons
Plain panel switches; the only colored one commits a dose.
- **Shape:** Small machined corners (4px), 40px tall with 0 16px padding; the small size is 32px tall with 0 12px. Label type.
- **Default:** Keycap face, 1px Keycap Edge, Ink text. Hover lifts the face to Keycap Top and darkens the edge to Ink 3 over 120ms.
- **Primary (commit):** Pen 1 fill and border with an On-Fill label (white by day, graphite at night); hover mixes the pen 12% toward black in oklab. Used only to commit a caffeine entry ("Log 95 mg", "Save").
- **Quiet:** Transparent, Ink 2 text; hover fills Sunk Housing. Row actions ("Again", "Edit", "Delete"), Cancel, Reset to defaults.
- **Danger:** Log-row Delete is a quiet button in Ink 2 that turns Danger Red on hover, so it never reads as an mg figure. "Erase everything…" is quiet Danger Red; its second step is the solid danger button (Danger fill, On-Fill label).
- **Disabled:** 50% opacity, not-allowed cursor.
- **Focus:** A 2px Focus Blue outline at 2px offset, set globally for every focusable element.

### Add drink (signature)
The only input in the product: one key, one sheet, one tap.
- **The key:** Pen fill, On-Fill label "+ Add drink" (Title size, 600), 52px tall, 6px corners, the add-key shadow; hover darkens the pen 10%, press moves it down 2px. In the suggestion panel above 900px; pinned to the bottom of the screen below. Shortcut: A.
- **The sheet:** a modal `<dialog>` (focus trapped, Esc and backdrop close it), Raised Housing, 10px corners, at most 640px wide and 82vh tall; on phones a bottom sheet (full width, 88dvh, top corners only). It rises 16px and fades in over 220ms (motion permitting).
- **Inside:** a search field (matches name, brand and kind; Enter logs the first match) and a When select (Now / 15 min / 30 min / 1 hour ago / Earlier…), then *Your usual* (learned from history before today, so it never reshuffles mid-day), then Energy drinks, Coffee, Tea, Soda, Other, then "Not listed? Add your own".
- **Rows:** ruled, at least 56px tall: name (Label) and mg (Figure, pen ink) on the first line; serving (Caption, Ink 3) and the suggestion tag on the second. Tapping a row logs it and closes the sheet; the snackbar offers Change time and Undo.
- **Suggestion tags:** a 6px lamp dot plus a few words for having that drink now: green dot + Ink ("Best now", "Good now"), amber dot + Alarm Amber ("Hurts sleep · ≈55 mg at bed", "Over today's limit", "Likely jittery"), seam dot + Ink 2 ("Not needed now", "Better at 2:40 PM", "Soon after your last").

### Suggestion panel
- **Style:** Raised Housing, 1px Seam, 6px corners, 24px padding (16px at 900px and below). A kicker ("Suggestion · from research and your drinks") led by a lamp: green when it says go, amber when it says stop, seam grey when it says wait. The verdict in Headline size (Title at 900px and below), one sentence of why in Ink 2, and a hint to add body weight while 70 kg is assumed.
- **Verdicts:** Have [drink] now · Top up at [time] · You're set until [time] · Skip the next one · Done for today · Focus hours start at / are over.
- **Action:** when it says "have", a keycap button logs that drink in one tap ("Log espresso · 64 mg").

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** Raised Housing on Enamel Housing (the readout, composer, picker and notice).
- **Shadow Strategy:** None. See the Hardware Depth Rule.
- **Border:** 1px Seam.
- **Internal Padding:** 16px (the notice uses 12px 16px; readout channels use 16px, 12px at 600px and below).
- There are no card grids. The readout is a single panel divided into channels by seam rules.

### Inputs / Fields
- **Style:** Chart Paper fill, 1px Keycap Edge, 4px corners, 40px tall, padding 0 12px. Labels sit above in Label type, Ink 2, 4px gap. mg inputs are 96px wide with a trailing "mg"; name inputs run up to 260px.
- **Focus:** The global Focus Blue ring. Hover darkens the border to Ink 3.
- **Error / Disabled:** An invalid value turns the border Danger Red (`aria-invalid`) and adds an error line in Danger Red, weight 600, announced as an alert.
- **Sliders:** Native range inputs with a pen-ink `accent-color`, the current value printed above in Figure type at 1.2rem.

### Navigation
- **Top bar:** The wordmark (Barlow Condensed 600, 1.2rem; the name is a working title), the date in Note type and Ink 2, a spacer, the status lamp, then the nav links.
- **Nav links:** Label type in Ink, padding 8px 12px, 4px corners. Hover fills Raised Housing; the current page fills Sunk Housing, pressed in.
- **Status lamp:** A link to Settings › Your data: an 8px dot with its glow, then its words in Note type. Housekeeping, so the words stay Ink 2 / Ink even when the dot is amber ("Back up your log"); Alarm Amber text is reserved for intake warnings.
- **Mobile:** At 600px and below the bar wraps and the date takes its own line. The lamp keeps a short visible word ("Saved" / "Back up") beside its dot. On touch screens every control is at least 44px tall.

### Recorder (signature)
The bezel, its plate, and the chart paper with everything written on it.
- **Bezel:** Bezel fill, 10px corners, 10px padding. Above the paper sits the plate: Plate type in Bezel Legend, a 14×3px pen swatch and "CAFFEINE ACTIVE · MG" on the left, the time on the right. Below the paper sits the caption in Caption type and Bezel Legend, explaining solid, dashed and shaded, with a "How estimates work" link to the evidence notes.
- **Paper:** Chart Paper with 3px corners, clipped. Plot margins are 42px left, 16px right, 34px top and 44px bottom (34px and 10px at the sides when the paper is under 560px wide). Hour labels fall every 2, 3 or 4 hours depending on width; the mg scale steps by 25, 50, 100 or 200 to fit the peak.
- **Sleep region:** Sleep Paper fills the plot to the right of the bedtime rule.
- **Pen:** At now, a 1px Ink carriage line at 55% opacity, a 5px-radius pen tip with a 2px Chart Paper ring, a pen-ink pointer riding the mg scale at the same value, and the value written beside it in Annotation type and pen ink ("≈62 mg now"). While the curve is still rising after a drink, the label sits under the pen so the projection can't cross it. Annotations carry a 3px paper halo (`paint-order: stroke`).
- **Bedtime:** The value at bedtime as a 3.5px pen point with its label; BED and target labels in Chart-Paper Green.
- **Label placement:** "your focus range", BED, target, the bedtime value and the pen value are placed in that priority, each trying spots around its point (right/left, above/below) and taking the first that stays on the paper and clears every label already placed; a label with no free spot shortens, then drops (the readout states it anyway).
- **Focus range:** your range (about 1–3 mg/kg active) as a band of `--focus-band` (the paper's green at 8–9%) across your focus hours, labelled "your focus range" in Chart-Paper Green. The scale always reaches its ceiling.
- **Top-up mark:** a suggested top-up time drawn as an outlined Pencil triangle in the event lane, labelled "top up". The paper never carries a last-cup flag; the suggestion panel answers "can I have another?".
- **Events:** Pen triangles under the baseline with their mg in 10.5px condensed pen ink; a label is skipped when it would sit within 34px of the previous one (30px on compact paper).
- **Scrub:** Dragging, hovering, or the arrow keys (15 minutes; Shift for an hour; Home, End, Escape) move a 1px Cursor line, a 4px dot and an Ink chip reading the time and "≈80 mg". Each reading is announced in a polite live region.
- **Replot:** After a drink is logged (never on page load), the band and the projection wipe in from left to right (a clip-path inset) over 700ms on `cubic-bezier(0.16, 1, 0.3, 1)`, only under `prefers-reduced-motion: no-preference`.

**The Line Grammar Rule.** Every mark on the paper can be told apart by weight and dash, not by color alone (pen 1 and Chart-Paper Green sit at 1.06:1 in luminance on the day chart): the trace 2.25px solid with round joins; the projection 1.75px dashed 5/4; the ghost 1.75px dotted 2/4 with round caps in Pencil; the bedtime target 1.25px dash-dot 8/3/2/3 in Chart-Paper Green; bedtime 1.25px solid in Chart-Paper Green; the last-cup cutoff 1.25px dashed 3/3 in Ink; the carriage and cursor 1px. A new pen inherits the trace grammar (solid past, dashed projection, band) in its own ink; how a second pen is told apart from the first beyond hue is not yet established.

### Readout
The instrument's readings panel, beside or below the chart.
- **Channels:** Caffeine now (with your focus range, or "Rising: peaks around ≈40 mg at 5:32 PM" while a drink absorbs); Today (against your mg/kg daily limit); Sleep impact tonight (Low / Some / High, estimated from caffeine left at bedtime); Crash (when you'll drop back below your range, "No dip", or "Low: stays below your range"). Each runs label (Note, Ink 2), value (Readout), note (Note, Ink 2); notes reserve two lines. A warning note turns Alarm Amber at 600 behind an amber lamp dot and always says what is over.
- **Today meter:** A linear measurement scale, not a progress bar. A 1px Ink 3 baseline with a tick every 100mg (every 200mg when the scale runs past 900mg), a 2px Ink reference rule at the daily reference labelled in Scale type, and a pen-ink triangular needle at today's total.

**The Stated Twice Rule.** Every number the paper draws is also stated in words: in the readout, and in the chart's accessible label and caption. A new mark on the chart ships with its sentence.

### Ruled Lists (log and archive)
- **Today's log:** Rows of time (76px), name, mg in Figure type and pen ink, and quiet actions; at least 48px tall with seam rules above and below. Editing opens an inline row of fields beneath.
- **Archive:** Fourteen rows of day, a 26px strip, and the total. Each strip is paper with the sleep region shaded, minor rulings every three hours, the bedtime rule in Chart-Paper Green, and a 3px pen tick per drink whose height follows the dose (4–22px). Totals over the reference turn Alarm Amber with a 2px underline at a 3px offset; empty days show "—" in Ink 3 at weight 500.

### Snackbar
- **Style:** Ink fill, Chart Paper text, 6px corners, Note type, centered 24px above the bottom (or the safe area), with the snackbar shadow. Its action (Undo) is an underlined text button. It rises 12px and fades in over 220ms (motion permitting) and clears after 12 seconds, paused while hovered or focused. Undo also works by Ctrl/Cmd+Z for 5 minutes, and the newest log row carries its own Undo for 2 minutes; every undo confirms itself ("Removed Espresso").

## Do's and Don'ts

### Do:
- **Do** open every dashboard view on the strip chart at full width, with the readout to its right above 900px and beneath it below.
- **Do** add a metric as a new pen: `--pen-<metric>` and `--pen-<metric>-band` in both `:root` and the dark block, named in `MetricDefinition.pen`, checked at 4.5:1 on Chart Paper and Sleep Paper in both themes.
- **Do** draw every pen with one grammar: 2.25px solid up to the carriage, 1.75px dashed 5/4 after it, its band behind, and Pencil dotted 2/4 for a drink not yet logged.
- **Do** set printed things (scales, annotations, plates, flags, mg figures) in Barlow Condensed and everything read or operated in Barlow, with tabular figures throughout.
- **Do** separate housing panels with Raised Housing and a 1px Seam, and keep shadows for the bezel, the keycaps and the snackbar.
- **Do** keep spacing on the 4px steps (4, 8, 12, 16, 24, 32, 48) and radii on the 3/4/6/10px ladder.
- **Do** give every warning a word, a lamp dot or an underline as well as Alarm Amber.
- **Do** declare every color for both the day chart and the night chart, and keep the bezel dark in both.
- **Do** gate motion behind `prefers-reduced-motion: no-preference`: the 700ms replot wipe and the 220ms snackbar rise, with key travel at 120ms.

### Don't:
- **Don't** build stat-card grids, progress rings or radial gauges; a total is a needle on a ruled linear scale.
- **Don't** reach for coffee browns, cream or café warmth; the housing is cool instrument grey and the paper is green-ruled.
- **Don't** use pen ink for navigation, headings, panels, focus or decoration, and don't draw a metric's data in any ink but its own pen.
- **Don't** give a new pen a hue near pen 1 crimson, Alarm Amber, Danger Red, Chart-Paper Green, Pencil grey or Focus Blue.
- **Don't** set text on the housing lighter than Ink 3, or draw a warning in pen ink.
- **Don't** hard-code a white label on a fill; use On-Fill so the night chart keeps contrast.
- **Don't** set anything heavier than 600, and don't condense running text.
- **Don't** put shadows on panels or round anything past 10px.
- **Don't** animate on page load; motion marks a change the user just made.
