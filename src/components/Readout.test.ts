import { describe, expect, it } from 'vitest';
import { withArticle } from './Readout';

describe('withArticle', () => {
  it('picks a/an and handles "half a …"', () => {
    expect(withArticle('black tea')).toBe('A black tea');
    expect(withArticle('energy drink, small')).toBe('An energy drink, small');
    expect(withArticle('espresso')).toBe('An espresso');
    expect(withArticle('half a drip coffee')).toBe('Half a drip coffee');
  });
});
