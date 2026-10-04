/**
 * Model constants. Each value and its source is explained in
 * docs/research.md — keep the two in sync.
 */

/**
 * First-order absorption rate (1/h). 4.9/h puts the peak ~45 min after
 * intake at a 5 h half-life (observed Tmax 30–120 min; Blanchard & Sawers 1983).
 */
export const ABSORPTION_RATE_PER_HOUR = 4.9;

/** Population-average elimination half-life for healthy adults, hours (ISSN 2021: generally 4–6 h). */
export const DEFAULT_HALF_LIFE_HOURS = 5;

/** Uncertainty band as multiples of the personal half-life (3–7 h around the 5 h default). */
export const HALF_LIFE_BAND = { low: 0.6, high: 1.4 } as const;

/** Daily reference for healthy, non-pregnant adults, mg (FDA; EFSA 2015). */
export const DEFAULT_DAILY_LIMIT_MG = 400;

/**
 * Default "still active at bedtime" target, mg. There is no validated
 * threshold. 30 mg at a 5 h half-life reproduces Gardiner et al. 2023's
 * meta-analysis cutoffs (coffee ≥8.8 h, pre-workout ≥13.2 h before bed)
 * and matches Landolt 1995's bedtime residual — a starting point the user
 * owns and can change, never a "safe" level.
 */
export const DEFAULT_BEDTIME_TARGET_MG = 30;

/** Reference dose used to compute "last cup" when the user has no history, mg. */
export const DEFAULT_REFERENCE_DOSE_MG = 95;
