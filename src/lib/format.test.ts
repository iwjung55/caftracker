import { describe, expect, it } from 'vitest';
import { capitalize, withArticle } from './format';

describe('withArticle', () => {
  it('picks a/an and handles "half a …"', () => {
    expect(capitalize(withArticle('black tea'))).toBe('A black tea');
    expect(capitalize(withArticle('energy drink, small'))).toBe('An energy drink, small');
    expect(withArticle('espresso')).toBe('an espresso');
    expect(capitalize(withArticle('half a drip coffee'))).toBe('Half a drip coffee');
  });
});
