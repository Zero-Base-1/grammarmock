import { describe, it, expect } from 'vitest';
import { sampleTerminal, getSortedCharacters } from '../../src/generator/sampler.js';
import { PRNG } from '../../src/generator/prng.js';
import { TerminalSymbol } from '../../src/grammar/types.js';

describe('Unit: Terminal Sampler', () => {
  const prng = new PRNG(42);

  it('samples exact character for literal terminal', () => {
    const literal: TerminalSymbol = { type: 'literal', char: 'Z' };
    expect(sampleTerminal(literal, prng)).toBe('Z');
  });

  it('samples printable ASCII character for wildcard terminal', () => {
    const wildcard: TerminalSymbol = {
      type: 'char_class',
      negated: false,
      ranges: [],
      chars: [],
      isWildcard: true,
    };

    for (let i = 0; i < 50; i++) {
      const char = sampleTerminal(wildcard, prng);
      expect(char.length).toBe(1);
      const code = char.charCodeAt(0);
      expect(code).toBeGreaterThanOrEqual(32);
      expect(code).toBeLessThanOrEqual(126);
    }
  });

  it('samples character within character class ranges', () => {
    const charClass: TerminalSymbol = {
      type: 'char_class',
      negated: false,
      ranges: [{ from: '0', to: '9' }],
      chars: [],
    };

    for (let i = 0; i < 50; i++) {
      const char = sampleTerminal(charClass, prng);
      expect(char).toMatch(/^[0-9]$/);
    }
  });

  it('samples character from discrete chars list', () => {
    const charClass: TerminalSymbol = {
      type: 'char_class',
      negated: false,
      ranges: [],
      chars: ['!', '@', '#'],
    };

    for (let i = 0; i < 30; i++) {
      const char = sampleTerminal(charClass, prng);
      expect(['!', '@', '#']).toContain(char);
    }
  });

  it('samples character excluding negated ranges and chars', () => {
    const negatedClass: TerminalSymbol = {
      type: 'char_class',
      negated: true,
      ranges: [{ from: '0', to: '9' }],
      chars: ['A', 'B'],
    };

    for (let i = 0; i < 100; i++) {
      const char = sampleTerminal(negatedClass, prng);
      expect(char).not.toMatch(/^[0-9]$/);
      expect(['A', 'B']).not.toContain(char);
    }
  });

  it('extracts sorted characters in canonical ASCII order', () => {
    const literal: TerminalSymbol = { type: 'literal', char: 'k' };
    expect(getSortedCharacters(literal)).toEqual(['k']);

    const digitClass: TerminalSymbol = {
      type: 'char_class',
      negated: false,
      ranges: [{ from: '3', to: '7' }],
      chars: ['0'],
    };
    expect(getSortedCharacters(digitClass)).toEqual(['0', '3', '4', '5', '6', '7']);

    const wildcard: TerminalSymbol = {
      type: 'char_class',
      negated: false,
      ranges: [],
      chars: [],
      isWildcard: true,
    };
    const sortedWildcard = getSortedCharacters(wildcard);
    expect(sortedWildcard).toHaveLength(95); // ASCII 32..126
    expect(sortedWildcard[0]).toBe(' ');
    expect(sortedWildcard[sortedWildcard.length - 1]).toBe('~');
  });
});
