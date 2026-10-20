import { describe, it, expect } from 'vitest';
import { PRNG } from '../../src/generator/prng.js';

describe('Unit: PRNG (Mulberry32)', () => {
  it('generates deterministic numbers with the same seed', () => {
    const prng1 = new PRNG(42);
    const prng2 = new PRNG(42);

    const values1 = [prng1.next(), prng1.next(), prng1.next()];
    const values2 = [prng2.next(), prng2.next(), prng2.next()];

    expect(values1).toEqual(values2);
  });

  it('generates different sequences with different seeds', () => {
    const prng1 = new PRNG(100);
    const prng2 = new PRNG(200);

    const val1 = prng1.next();
    const val2 = prng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('generates integers within specified [min, max] range inclusive', () => {
    const prng = new PRNG(999);
    const min = 5;
    const max = 15;

    for (let i = 0; i < 200; i++) {
      const val = prng.nextInt(min, max);
      expect(val).toBeGreaterThanOrEqual(min);
      expect(val).toBeLessThanOrEqual(max);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('picks random element from array using choice()', () => {
    const prng = new PRNG(12345);
    const items = ['apple', 'banana', 'cherry', 'date'];

    for (let i = 0; i < 50; i++) {
      const chosen = prng.choice(items);
      expect(items).toContain(chosen);
    }
  });

  it('throws error when calling choice() on an empty array', () => {
    const prng = new PRNG(1);
    expect(() => prng.choice([])).toThrowError(/Cannot choose from empty array/);
  });

  it('initializes with random seed if none provided', () => {
    const prng = new PRNG();
    const val = prng.next();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });
});
