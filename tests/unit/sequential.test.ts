import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/parser/parser.js';
import { ThompsonBuilder } from '../../src/automata/nfa.js';
import { nfaToRightLinearGrammar } from '../../src/grammar/converter.js';
import { SequentialGenerator } from '../../src/generator/sequential.js';

describe('Unit: Sequential / Shortlex Generator', () => {
  function createSeqGen(pattern: string) {
    const ast = Parser.parse(pattern);
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);
    const grammar = nfaToRightLinearGrammar(nfa, true);
    return new SequentialGenerator(grammar);
  }

  it('generates strings in Shortlex order for character sets', () => {
    const gen = createSeqGen('^[0-1]{2}$');
    const records = gen.generateBulk(4);
    expect(records).toEqual(['00', '01', '10', '11']);
  });

  it('generates shortest strings first when lengths vary', () => {
    const gen = createSeqGen('^a|bb|ccc$');
    const records = gen.generateBulk(3);
    expect(records).toEqual(['a', 'bb', 'ccc']);
  });

  it('generates chronological sequence for alternation with prefixes', () => {
    const gen = createSeqGen('^(X|Y)-[0-1]$');
    const records = gen.generateBulk(4);
    expect(records).toEqual(['X-0', 'X-1', 'Y-0', 'Y-1']);
  });

  it('stops when language is exhausted', () => {
    const gen = createSeqGen('^A|B$');
    const records = gen.generateBulk(10);
    // Language only contains 2 strings
    expect(records).toEqual(['A', 'B']);
  });

  it('handles empty pattern gracefully', () => {
    const gen = createSeqGen('^$');
    const records = gen.generateBulk(3);
    expect(records).toEqual(['']);
  });
});
