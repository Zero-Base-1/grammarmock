import { describe, it, expect } from 'vitest';
import { generateMock, generateBulk } from '../src/index.js';

describe('Mock Generator', () => {
  it('generates exact literal matches', () => {
    const result = generateMock('HELLO');
    expect(result).toBe('HELLO');
  });

  it('generates alternation choices', () => {
    const results = generateBulk('CAT|DOG|BIRD', 20);
    for (const r of results) {
      expect(['CAT', 'DOG', 'BIRD']).toContain(r);
    }
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('generates bounded repetitions', () => {
    const results = generateBulk('\\d{4}', 10);
    for (const r of results) {
      expect(r).toMatch(/^\d{4}$/);
      expect(r.length).toBe(4);
    }
  });

  it('produces identical output with identical PRNG seeds', () => {
    const run1 = generateBulk('^[A-Z]{3}-\\d{4}$', 5, { seed: 12345 });
    const run2 = generateBulk('^[A-Z]{3}-\\d{4}$', 5, { seed: 12345 });
    expect(run1).toEqual(run2);
  });

  it('bounds unbounded Kleene star repetitions according to maxRepeat', () => {
    const results = generateBulk('a*', 20, { maxRepeat: 3 });
    for (const r of results) {
      expect(r.length).toBeLessThanOrEqual(3);
      if (r.length > 0) {
        expect(r).toMatch(/^a+$/);
      }
    }
  });
});
