import { roundMg } from '../metrics/caffeine/derive';

/** "≈140", but a plain "0" when nothing is measurable. */
export const approx = (mg: number) => (roundMg(mg) === 0 ? '0' : `≈${roundMg(mg)}`);

/** "a black tea", "an energy drink", "half a drip coffee" — noun phrase with its article. */
export function withArticle(label: string): string {
  if (/^half\b/i.test(label)) return label;
  return `${/^[aeiou]/i.test(label) ? 'an' : 'a'} ${label}`;
}

/** Capitalize the first letter, for sentence starts. */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
