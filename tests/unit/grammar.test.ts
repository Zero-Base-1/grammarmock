import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/parser/parser.js';
import { ThompsonBuilder } from '../../src/automata/nfa.js';
import { nfaToRightLinearGrammar } from '../../src/grammar/converter.js';
import { formatGrammar } from '../../src/grammar/formatter.js';

describe('Unit: Grammar Converter & Formatter', () => {
  it('converts NFA to Right-Linear Grammar without epsilons', () => {
    const ast = Parser.parse('^[A-Z]{2}-\\d{2}$');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const grammar = nfaToRightLinearGrammar(nfa, true);

    expect(grammar.variables.length).toBeGreaterThan(0);
    expect(grammar.variables).toContain(grammar.startVariable);
    expect(grammar.productions.size).toBe(grammar.variables.length);

    // Verify all productions adhere to Chomsky Type-3 right-linear format:
    // A -> a B or A -> ε (no unit rules since normalized)
    for (const [varName, rules] of grammar.productions) {
      expect(grammar.variables).toContain(varName);
      for (const rule of rules) {
        if (rule.type === 'step') {
          expect(grammar.variables).toContain(rule.nextVariable);
          expect(rule.terminal).toBeDefined();
        } else if (rule.type === 'epsilon') {
          // Terminal accept
          expect(rule.type).toBe('epsilon');
        } else {
          // Unit rules should not appear if normalizeEpsilons was true
          expect(rule.type).not.toBe('unit');
        }
      }
    }
  });

  it('supports raw grammar conversion preserving epsilon unit rules', () => {
    const ast = Parser.parse('a|b');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const rawGrammar = nfaToRightLinearGrammar(nfa, false);
    let hasUnitRule = false;

    for (const [, rules] of rawGrammar.productions) {
      for (const rule of rules) {
        if (rule.type === 'unit') {
          hasUnitRule = true;
          break;
        }
      }
    }

    expect(hasUnitRule).toBe(true);
  });

  it('formats Right-Linear Grammar into formal mathematical notation', () => {
    const ast = Parser.parse('a');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);
    const grammar = nfaToRightLinearGrammar(nfa, true);

    const formatted = formatGrammar(grammar);

    expect(formatted).toContain('Right-Linear Grammar');
    expect(formatted).toContain('Variables (V)');
    expect(formatted).toContain('Start Symbol (S):');
    expect(formatted).toContain('Production Rules (R):');
    expect(formatted).toContain('->');
  });
});
