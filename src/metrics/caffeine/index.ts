import type { Entry, EntryData } from '../../data/types';
import { registerMetric } from '../registry';

export interface CaffeineData extends EntryData {
  v: 1;
  /** Preset the user tapped, if any. Informational only — mg is copied onto the entry. */
  drinkId?: string;
  /** Name shown in history, copied at log time so editing a preset never rewrites history. */
  label: string;
}

export type CaffeineEntry = Entry<CaffeineData>;

export const caffeine = registerMetric({
  id: 'caffeine',
  label: 'Caffeine',
  unit: 'mg',
  kind: 'dose',
  aggregate: 'sum',
  pen: '--pen-caffeine',
  sensitivity: 'lifestyle',
  dataVersion: 1,
  range: { min: 1, max: 1000 },
  validateData(entry) {
    const label = (entry.data as Partial<CaffeineData>).label;
    if (typeof label !== 'string' || label.trim().length === 0) return 'Give the drink a name';
    if (label.length > 60) return 'Keep the name under 60 characters';
    return null;
  },
});

export function isCaffeineEntry(e: Entry): e is CaffeineEntry {
  return e.metric === caffeine.id;
}
