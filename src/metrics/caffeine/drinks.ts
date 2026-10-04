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
  /** Brand, for search ("Red Bull", "Starbucks"). */
  brand?: string;
  /** User-made "my usual" drinks. */
  custom?: boolean;
}

export const DRINKS: readonly Drink[] = [
  // Energy drinks — brand label values (docs/research.md §4b); ordered roughly by popularity.
  { id: 'red-bull-8', label: 'Red Bull 8.4\u00a0oz', mg: 80, serving: '8.4 fl oz can / 250 ml', kind: 'energy', brand: 'Red Bull' },
  { id: 'red-bull-12', label: 'Red Bull 12\u00a0oz', mg: 114, serving: '12 fl oz can / 355 ml', kind: 'energy', brand: 'Red Bull' },
  { id: 'red-bull-16', label: 'Red Bull 16\u00a0oz', mg: 151, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Red Bull' },
  { id: 'red-bull-sf-8', label: 'Red Bull Sugarfree 8.4\u00a0oz', mg: 80, serving: '8.4 fl oz can / 250 ml', kind: 'energy', brand: 'Red Bull' },
  { id: 'monster-16', label: 'Monster Energy', mg: 160, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Monster' },
  { id: 'monster-zero-ultra-16', label: 'Monster Zero Ultra', mg: 150, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Monster' },
  { id: 'java-monster-15', label: 'Java Monster', mg: 200, serving: '15 fl oz can / 444 ml', kind: 'energy', brand: 'Monster' },
  { id: 'celsius-12', label: 'Celsius', mg: 200, serving: '12 fl oz can / 355 ml', kind: 'energy', brand: 'Celsius' },
  { id: 'celsius-essentials-16', label: 'Celsius Essentials', mg: 270, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Celsius' },
  { id: 'alani-nu-12', label: 'Alani Nu Energy', mg: 200, serving: '12 fl oz can / 355 ml', kind: 'energy', brand: 'Alani Nu' },
  { id: 'ghost-energy-16', label: 'Ghost Energy', mg: 200, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Ghost' },
  { id: 'c4-energy-16', label: 'C4 Energy', mg: 200, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'C4 Cellucor' },
  { id: 'c4-ultimate-16', label: 'C4 Ultimate Energy', mg: 300, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'C4 Cellucor' },
  { id: 'prime-energy-16', label: 'Prime Energy', mg: 200, serving: '16 fl oz can / 473 ml (12 oz also 200 mg)', kind: 'energy', brand: 'Prime' },
  { id: 'bang-16', label: 'Bang Energy', mg: 300, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Bang' },
  { id: 'reign-16', label: 'Reign', mg: 300, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Reign' },
  { id: 'rockstar-16', label: 'Rockstar Original', mg: 160, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Rockstar' },
  { id: 'nos-16', label: 'NOS', mg: 160, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'NOS' },
  { id: 'full-throttle-16', label: 'Full Throttle', mg: 160, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Full Throttle' },
  { id: 'zoa-16', label: 'ZOA Energy', mg: 210, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'ZOA' },
  { id: 'bloom-energy-12', label: 'Bloom Sparkling Energy', mg: 180, serving: '12 fl oz can / 355 ml', kind: 'energy', brand: 'Bloom' },
  { id: '3d-energy-16', label: '3D Energy', mg: 200, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: '3D' },
  { id: 'bucked-up-16', label: 'Bucked Up Energy', mg: 300, serving: '16 fl oz can / 473 ml', kind: 'energy', brand: 'Bucked Up' },
  { id: 'sbux-doubleshot-energy-15', label: 'Starbucks Doubleshot Energy', mg: 135, serving: '15 fl oz can / 444 ml', range: [125, 160], kind: 'energy', brand: 'Starbucks' },
  { id: 'sbux-tripleshot-energy-15', label: 'Starbucks Tripleshot Energy', mg: 225, serving: '15 fl oz can / 444 ml', kind: 'energy', brand: 'Starbucks' },
  { id: 'five-hour-energy', label: '5-hour Energy', mg: 200, serving: '1.93 fl oz shot / 57 ml', kind: 'energy', brand: '5-hour Energy' },
  { id: 'five-hour-energy-xs', label: '5-hour Energy Extra Strength', mg: 230, serving: '1.93 fl oz shot / 57 ml', kind: 'energy', brand: '5-hour Energy' },
  { id: 'energy-small', label: 'Other energy drink, small', mg: 80, serving: '8.4 fl oz can / 250 ml', range: [80, 114], kind: 'energy' },
  { id: 'energy-large', label: 'Other energy drink, 16\u00a0oz', mg: 160, serving: '16 fl oz can / 475 ml', range: [140, 300], kind: 'energy' },
  { id: 'energy-strong', label: 'Other high-caffeine energy', mg: 200, serving: '12 fl oz can / 355 ml', range: [200, 300], kind: 'energy' },
  { id: 'energy-shot', label: 'Other energy shot', mg: 200, serving: '1.9 fl oz / 57 ml', range: [100, 230], kind: 'energy' },
  // Coffee — generic (USDA/CSPI), then chains (brand menus).
  { id: 'espresso', label: 'Espresso', mg: 64, serving: '1 shot / 30 ml', range: [50, 75], kind: 'coffee' },
  { id: 'double-espresso', label: 'Double espresso', mg: 128, serving: '2 shots / 60 ml', range: [100, 150], kind: 'coffee' },
  { id: 'drip-coffee', label: 'Drip coffee', mg: 95, serving: '8 fl oz / 240 ml', range: [75, 165], kind: 'coffee' },
  { id: 'americano', label: 'Americano, 16\u00a0oz', mg: 225, serving: '16 fl oz / 475 ml', range: [150, 300], kind: 'coffee' },
  { id: 'latte', label: 'Latte, 16\u00a0oz', mg: 150, serving: '16 fl oz / 475 ml (2 shots)', range: [128, 190], kind: 'coffee' },
  { id: 'cold-brew', label: 'Cold brew', mg: 205, serving: '16 fl oz / 475 ml', range: [150, 295], kind: 'coffee' },
  { id: 'cafe-coffee-large', label: 'Café drip, 16\u00a0oz', mg: 310, serving: '16 fl oz / 475 ml', range: [235, 410], kind: 'coffee' },
  { id: 'instant-coffee', label: 'Instant coffee', mg: 62, serving: '8 fl oz / 240 ml', range: [30, 90], kind: 'coffee' },
  { id: 'decaf', label: 'Decaf coffee', mg: 2, serving: '8 fl oz / 240 ml', range: [2, 15], kind: 'coffee' },
  { id: 'sbux-pike-tall', label: 'Starbucks Pike Place, Tall', mg: 260, serving: '12 fl oz / 355 ml', range: [235, 290], kind: 'coffee', brand: 'Starbucks' },
  { id: 'sbux-pike-grande', label: 'Starbucks Pike Place, Grande', mg: 350, serving: '16 fl oz / 473 ml', range: [315, 390], kind: 'coffee', brand: 'Starbucks' },
  { id: 'sbux-pike-venti', label: 'Starbucks Pike Place, Venti', mg: 440, serving: '20 fl oz / 591 ml', range: [390, 490], kind: 'coffee', brand: 'Starbucks' },
  { id: 'sbux-cold-brew-grande', label: 'Starbucks Cold Brew, Grande', mg: 205, serving: '16 fl oz / 473 ml', kind: 'coffee', brand: 'Starbucks' },
  { id: 'sbux-latte-grande', label: 'Starbucks Caffè Latte, Grande', mg: 150, serving: '16 fl oz / 473 ml', kind: 'coffee', brand: 'Starbucks' },
  { id: 'dunkin-hot-small', label: 'Dunkin’ Hot Coffee, Small', mg: 180, serving: '10 fl oz / 296 ml', kind: 'coffee', brand: 'Dunkin' },
  { id: 'dunkin-hot-medium', label: 'Dunkin’ Hot Coffee, Medium', mg: 210, serving: '14 fl oz / 414 ml', kind: 'coffee', brand: 'Dunkin' },
  { id: 'dunkin-hot-large', label: 'Dunkin’ Hot Coffee, Large', mg: 270, serving: '20 fl oz / 591 ml', kind: 'coffee', brand: 'Dunkin' },
  { id: 'dunkin-iced-medium', label: 'Dunkin’ Iced Coffee, Medium', mg: 297, serving: '24 fl oz / 710 ml', range: [198, 398], kind: 'coffee', brand: 'Dunkin' },
  { id: 'mcd-coffee-medium', label: 'McDonald’s Coffee, Medium', mg: 145, serving: '16 fl oz / 473 ml', kind: 'coffee', brand: 'McDonalds McCafe' },
  // Tea
  { id: 'black-tea', label: 'Black tea', mg: 47, serving: '8 fl oz / 240 ml', range: [30, 60], kind: 'tea' },
  { id: 'green-tea', label: 'Green tea', mg: 28, serving: '8 fl oz / 240 ml', range: [20, 45], kind: 'tea' },
  { id: 'matcha', label: 'Matcha', mg: 70, serving: '1 tsp / 2 g powder', range: [30, 90], kind: 'tea' },
  { id: 'yerba-mate', label: 'Yerba mate', mg: 80, serving: '8 fl oz / 240 ml', range: [50, 110], kind: 'tea' },
  { id: 'yerba-madre-15', label: 'Yerba Madre (Guayakí)', mg: 150, serving: '15.5 fl oz can / 458 ml', kind: 'tea', brand: 'Guayaki Yerba Madre' },
  // Soda — brand values; generic rows kept for older logs.
  { id: 'coca-cola-12', label: 'Coca-Cola', mg: 34, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Coca-Cola Coke' },
  { id: 'diet-coke-12', label: 'Diet Coke', mg: 46, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Coca-Cola Coke' },
  { id: 'coke-zero-12', label: 'Coke Zero Sugar', mg: 34, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Coca-Cola Coke' },
  { id: 'pepsi-12', label: 'Pepsi', mg: 38, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Pepsi' },
  { id: 'mountain-dew-12', label: 'Mountain Dew', mg: 54, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Pepsi Mtn Dew' },
  { id: 'mtn-dew-zero-12', label: 'Mtn Dew Zero Sugar', mg: 68, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Pepsi Mtn Dew' },
  { id: 'dr-pepper-12', label: 'Dr Pepper', mg: 41, serving: '12 fl oz can / 355 ml', kind: 'soda', brand: 'Dr Pepper' },
  { id: 'cola', label: 'Cola (other)', mg: 34, serving: '12 fl oz can / 355 ml', range: [34, 41], kind: 'soda' },
  { id: 'diet-cola', label: 'Diet cola (other)', mg: 46, serving: '12 fl oz can / 355 ml', range: [35, 47], kind: 'soda' },
  { id: 'citrus-soda', label: 'Citrus soda (other)', mg: 54, serving: '12 fl oz can / 355 ml', range: [54, 68], kind: 'soda' },
  // Other
  { id: 'c4-preworkout-scoop', label: 'C4 Original Pre-Workout', mg: 200, serving: '1 scoop', kind: 'other', brand: 'C4 Cellucor' },
  { id: 'ghost-legend-scoop', label: 'Ghost Legend Pre-Workout', mg: 300, serving: '1 scoop', kind: 'other', brand: 'Ghost' },
  { id: 'pre-workout', label: 'Pre-workout (other)', mg: 250, serving: '1 scoop', range: [150, 350], kind: 'other' },
  { id: 'liquid-iv-energy', label: 'Liquid I.V. Energy Multiplier', mg: 100, serving: '1 stick in 16 fl oz water', kind: 'other', brand: 'Liquid IV' },
  { id: 'caffeine-pill', label: 'Caffeine tablet', mg: 200, serving: '1 tablet', range: [100, 200], kind: 'other' },
  { id: 'dark-chocolate', label: 'Dark chocolate', mg: 23, serving: '1 oz / 28 g, 70–85%', range: [12, 35], kind: 'other' },
];

/** The handful shown as one-tap keys before the user has any history. */
export const DEFAULT_QUICK_IDS = ['espresso', 'drip-coffee', 'cold-brew', 'red-bull-8', 'black-tea', 'coca-cola-12'] as const;

export function findDrink(id: string, custom: readonly Drink[] = []): Drink | undefined {
  return custom.find((d) => d.id === id) ?? DRINKS.find((d) => d.id === id);
}
