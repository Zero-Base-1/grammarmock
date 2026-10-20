import { describe, it, expect } from 'vitest';
import {
  compileGrammar,
  generateMock,
  generateBulk,
  MockGenerator,
  Parser,
  ThompsonBuilder,
  eliminateEpsilons,
  nfaToRightLinearGrammar,
} from '../../src/index.js';
import { buildTransitionMatrix } from '../../src/web/automata-visualizer.js';

describe('Integration: Compilation & Generation Pipeline', () => {
  it('integrates Parser -> NFA -> Epsilon Elimination -> Grammar Converter', () => {
    const pattern = '^[A-Z]{3}-\\d{4}$';
    const ast = Parser.parse(pattern);
    const builder = new ThompsonBuilder();
    const rawNfa = builder.build(ast);
    const normalizedNfa = eliminateEpsilons(rawNfa);
    const grammar = nfaToRightLinearGrammar(normalizedNfa, false);

    expect(grammar.variables).toContain(grammar.startVariable);
    expect(grammar.productions.size).toBe(grammar.variables.length);

    // Ensure start variable can reach accept
    const generator = new MockGenerator(grammar);
    const sample = generator.generate();
    expect(sample).toMatch(/^[A-Z]{3}-\d{4}$/);
  });

  it('runs high-level compileGrammar and generateMock APIs', () => {
    const grammar = compileGrammar('^[a-z0-9_]{5}$');
    expect(grammar.variables.length).toBeGreaterThan(0);

    const singleResult = generateMock('^[a-z0-9_]{5}$');
    expect(singleResult).toHaveLength(5);
    expect(singleResult).toMatch(/^[a-z0-9_]{5}$/);
  });

  it('integrates bulk generation in random mode', () => {
    const results = generateBulk('^REQ-(PASS|FAIL)$', 20);
    expect(results).toHaveLength(20);
    for (const r of results) {
      expect(['REQ-PASS', 'REQ-FAIL']).toContain(r);
    }
  });

  it('integrates bulk generation in chronological Shortlex mode', () => {
    const results = generateBulk('^[0-1]{3}$', 8, { mode: 'chronological' });
    expect(results).toEqual([
      '000', '001', '010', '011',
      '100', '101', '110', '111',
    ]);
  });

  it('integrates NFA with Automata Visualizer transition matrix', () => {
    const ast = Parser.parse('a|b');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const matrixData = buildTransitionMatrix(nfa);
    expect(matrixData.states.length).toBeGreaterThan(0);
    expect(matrixData.symbols.length).toBeGreaterThan(0);
    expect(matrixData.matrix.size).toBe(matrixData.states.length);
  });
});
