# Product

<!-- impeccable:product-schema 1 -->

> Written unattended from the owner's original brief (2026-10-02). Facts marked
> *(inferred)* were not confirmed by the owner and should be reviewed.

## Platform

web

## Users

- **Primary:** people who drink caffeine daily (coffee, tea, energy drinks,
  soda, pre-workout) and want to get more out of it — sharper focus when they
  need it, less damage to their sleep. *(inferred: students and knowledge
  workers who self-manage energy across long days are the first audience.)*
- **Situation:** logging happens in seconds, right after (or while) drinking,
  usually on a phone; review happens on the dashboard, later in the day or
  before a planned next cup. *(inferred)*

## Product Purpose

Track caffeine intake so people can use caffeine more effectively. The MVP
answers three questions at a glance:

1. How much caffeine is active in my body right now, and how will that decay?
2. How much have I had today relative to a sensible daily ceiling?
3. When is my last sensible cup if I want to sleep well tonight?

Success: a user can log a drink in one or two taps and immediately see how it
changes their curve, their total, and their sleep cutoff.

## Positioning

Not a calorie-counter-style ledger. The product treats caffeine as a dose
with a timeline (absorption, then half-life decay), and frames every number
in terms of a decision the user is about to make: "can I have another one?"
and "when should I stop?". *(inferred from brief)*

## Operating Context

- Logged in-the-moment, often mid-task, on mobile; reviewed on desktop or
  mobile. *(inferred)*
- Personal and private: one person's own data on their own device for the
  MVP (local-first, no account). *(inferred: MVP scope decision)*

## Capabilities and Constraints

- **MVP:** quick-log common drinks and custom doses; edit/delete entries with
  time adjustment; active-caffeine curve (pharmacokinetic model);
  today's total vs. daily limit; sleep-safe cutoff time from the user's
  bedtime; recent entries; personal settings (half-life, bedtime, limit).
- **Must extend:** the data model is a generic metric store. Sleep, water,
  mood, focus/energy, exercise will be added later as new metric
  definitions, not as rewrites.
- **Not medical advice.** Numbers are population-average estimates; the
  product must say so plainly and never present itself as diagnostic.
- **Explicitly undecided:** product name, accounts/sync, native apps,
  HealthKit / Health Connect integration, monetization.

## Brand Commitments

None yet. No name, logo, or voice has been committed. Working titles in the
UI are placeholders.

## Evidence on Hand

- No users, testimonials, or usage data exist yet. Do not fabricate any.
- Caffeine content values and pharmacokinetic constants come from the cited
  research notes in `docs/research.md`; illustrative/demo entries must be
  labeled as sample data.

## Product Principles

1. **Decisions over data.** Every number answers "should I, and when?"
2. **Logging is a reflex.** One or two taps from open to logged.
3. **Honest about uncertainty.** Estimates are labeled as estimates;
   individual metabolism varies widely.
4. **Built to hold more than caffeine.** Every feature asks: how will this
   look when sleep and mood sit beside it?
5. **Private by default.** The user's data stays on their device until they
   choose otherwise.

## Accessibility & Inclusion

WCAG 2.2 AA target *(inferred default)*. Charts must have a text equivalent
(the key numbers are always stated in words, not only drawn).
