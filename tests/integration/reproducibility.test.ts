import { describe, it, expect } from 'vitest';
import { generateBulk, MockGenerator, compileGrammar } from '../../src/index.js';

describe('Integration: Seed Reproducibility & State Isolation', () => {
  it('produces identical output across multiple runs with identical PRNG seed', () => {
    const pattern = '^[A-Z]{3}-\\d{4}-[a-z]{2}$';
    const seed = 987654321;

    const run1 = generateBulk(pattern, 25, { seed });
    const run2 = generateBulk(pattern, 25, { seed });
    const run3 = generateBulk(pattern, 25, { seed });

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });

  it('produces different sequences when different seeds are provided', () => {
    const pattern = '^[A-Z]{4}-\\d{4}$';
    const runA = generateBulk(pattern, 10, { seed: 1111 });
    const runB = generateBulk(pattern, 10, { seed: 2222 });

    expect(runA).not.toEqual(runB);
  });

  it('maintains independent generator state between instances', () => {
    const grammar = compileGrammar('^[0-9]{6}$');
    const genA = new MockGenerator(grammar, 42);
    const genB = new MockGenerator(grammar, 42);

    const a1 = genA.generate();
    const b1 = genB.generate();
    expect(a1).toBe(b1);

    const a2 = genA.generate();
    const b2 = genB.generate();
    expect(a2).toBe(b2);
  });
});
