/**
 * Built-in drink presets. Values are typical figures from public sources
 * (see docs/research.md); real drinks vary, so every preset's mg is
 * editable before logging and the variability range is shown.
 */

export type DrinkKind = 'coffee' | 'tea' | 'energy' | 'soda' | 'other';

export interface Drink {
  id: string;
  label: string;
  /** Typical caffeine, mg. */
  mg: number;
  /** Plain-language serving, e.g. '8 fl oz / 240 ml'. */
  serving: string;
  /** Typical spread for this kind of drink, mg. */
  range?: readonly [number, number];
  kind: DrinkKind;
  /** User-made "my usual" drinks. */
  custom?: boolean;
}

export const DRINKS: readonly Drink[] = [
  { id: 'espresso', label: 'Espresso', mg: 64, serving: '1 shot / 30 ml', range: [50, 75], kind: 'coffee' },
  { id: 'double-espresso', label: 'Double espresso', mg: 128, serving: '2 shots / 60 ml', range: [100, 150], kind: 'coffee' },
  { id: 'drip-coffee', label: 'Drip coffee', mg: 95, serving: '8 fl oz / 240 ml', range: [75, 165], kind: 'coffee' },
  { id: 'cafe-coffee-large', label: 'Café drip, 16\u00a0oz', mg: 310, serving: '16 fl oz / 475 ml', range: [235, 410], kind: 'coffee' },
  { id: 'americano', label: 'Americano, 16\u00a0oz', mg: 225, serving: '16 fl oz / 475 ml', range: [150, 300], kind: 'coffee' },
  { id: 'latte', label: 'Latte, 16\u00a0oz', mg: 150, serving: '16 fl oz / 475 ml (2 shots)', range: [128, 190], kind: 'coffee' },
  { id: 'cold-brew', label: 'Cold brew', mg: 205, serving: '16 fl oz / 475 ml', range: [150, 295], kind: 'coffee' },
  { id: 'instant-coffee', label: 'Instant coffee', mg: 62, serving: '8 fl oz / 240 ml', range: [30, 90], kind: 'coffee' },
  { id: 'decaf', label: 'Decaf coffee', mg: 2, serving: '8 fl oz / 240 ml', range: [2, 15], kind: 'coffee' },
  { id: 'black-tea', label: 'Black tea', mg: 47, serving: '8 fl oz / 240 ml', range: [30, 60], kind: 'tea' },
  { id: 'green-tea', label: 'Green tea', mg: 28, serving: '8 fl oz / 240 ml', range: [20, 45], kind: 'tea' },
  { id: 'matcha', label: 'Matcha', mg: 70, serving: '1 tsp / 2 g powder', range: [30, 90], kind: 'tea' },
  { id: 'yerba-mate', label: 'Yerba mate', mg: 80, serving: '8 fl oz / 240 ml', range: [50, 110], kind: 'tea' },
  { id: 'cola', label: 'Cola', mg: 34, serving: '12 fl oz can / 355 ml', range: [34, 41], kind: 'soda' },
  { id: 'diet-cola', label: 'Diet cola', mg: 46, serving: '12 fl oz can / 355 ml', range: [35, 47], kind: 'soda' },
  { id: 'citrus-soda', label: 'Citrus soda', mg: 54, serving: '12 fl oz can / 355 ml', range: [54, 68], kind: 'soda' },
  { id: 'energy-small', label: 'Energy drink, small', mg: 80, serving: '8.4 fl oz can / 250 ml', range: [80, 114], kind: 'energy' },
  { id: 'energy-large', label: 'Energy drink, 16\u00a0oz', mg: 160, serving: '16 fl oz can / 475 ml', range: [140, 300], kind: 'energy' },
  { id: 'energy-strong', label: 'High-caffeine energy', mg: 200, serving: '12 fl oz can / 355 ml', range: [200, 300], kind: 'energy' },
  { id: 'energy-shot', label: 'Energy shot', mg: 200, serving: '1.9 fl oz / 57 ml', range: [100, 230], kind: 'energy' },
  { id: 'pre-workout', label: 'Pre-workout', mg: 250, serving: '1 scoop', range: [150, 350], kind: 'other' },
  { id: 'caffeine-pill', label: 'Caffeine tablet', mg: 200, serving: '1 tablet', range: [100, 200], kind: 'other' },
  { id: 'dark-chocolate', label: 'Dark chocolate', mg: 23, serving: '1 oz / 28 g, 70–85%', range: [12, 35], kind: 'other' },
];

/** The handful shown as one-tap keys before the user has any history. */
export const DEFAULT_QUICK_IDS = ['espresso', 'drip-coffee', 'cold-brew', 'black-tea', 'energy-small', 'cola'] as const;

export function findDrink(id: string, custom: readonly Drink[] = []): Drink | undefined {
  return custom.find((d) => d.id === id) ?? DRINKS.find((d) => d.id === id);
}
