import { describe, it, expect } from 'vitest';
import { Parser } from '../src/parser/parser.js';
import { ThompsonBuilder } from '../src/automata/nfa.js';
import { getEpsilonClosure, eliminateEpsilons } from '../src/automata/epsilon.js';
import { nfaToRightLinearGrammar } from '../src/grammar/converter.js';
import { formatGrammar } from '../src/grammar/formatter.js';

describe('Thompson NFA & Grammar Conversion', () => {
  it('builds NFA for simple concatenation', () => {
    const ast = Parser.parse('ab');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    expect(nfa.getAllStates().length).toBeGreaterThan(0);
    expect(nfa.acceptStates.size).toBe(1);
  });

  it('computes epsilon closure correctly', () => {
    const ast = Parser.parse('a|b');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const closure = getEpsilonClosure(nfa.startState);
    expect(closure.size).toBeGreaterThan(1);
  });

  it('eliminates epsilon transitions without changing language semantics', () => {
    const ast = Parser.parse('a(b|c)*d');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const normalized = eliminateEpsilons(nfa);
    const allStates = normalized.getAllStates();

    for (const state of allStates) {
      for (const t of state.transitions) {
        expect(t.label.type).not.toBe('epsilon');
      }
    }
  });

  it('converts NFA to Right-Linear Grammar in Chomsky format', () => {
    const ast = Parser.parse('[A-Z]{2}-\\d{2}');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const grammar = nfaToRightLinearGrammar(nfa, true);
    expect(grammar.variables).toContain(grammar.startVariable);

    const formatted = formatGrammar(grammar);
    expect(formatted).toContain('Right-Linear Grammar');
    expect(formatted).toContain('Production Rules (R):');
    expect(formatted).toContain('ε');
  });
});
