import { describe, it, expect } from 'vitest';
import { State } from '../../src/automata/state.js';
import { NFA, ThompsonBuilder } from '../../src/automata/nfa.js';
import { getEpsilonClosure, eliminateEpsilons } from '../../src/automata/epsilon.js';
import { Parser } from '../../src/parser/parser.js';

describe('Unit: Epsilon Closure & Elimination', () => {
  it('computes reflexive epsilon closure for isolated state', () => {
    const s0 = new State(0);
    const closure = getEpsilonClosure(s0);

    expect(closure.size).toBe(1);
    expect(closure.has(s0)).toBe(true);
  });

  it('computes transitive epsilon closure across multiple hops', () => {
    const s0 = new State(0);
    const s1 = new State(1);
    const s2 = new State(2);

    s0.addEpsilonTransition(s1);
    s1.addEpsilonTransition(s2);

    const closure = getEpsilonClosure(s0);
    expect(closure.size).toBe(3);
    expect(closure.has(s0)).toBe(true);
    expect(closure.has(s1)).toBe(true);
    expect(closure.has(s2)).toBe(true);
  });

  it('eliminates all epsilon transitions from an NFA', () => {
    const ast = Parser.parse('(a|b)*c');
    const builder = new ThompsonBuilder();
    const rawNfa = builder.build(ast);

    const normalized = eliminateEpsilons(rawNfa);
    const states = normalized.getAllStates();

    for (const s of states) {
      for (const t of s.transitions) {
        expect(t.label.type).not.toBe('epsilon');
      }
    }
  });

  it('preserves start and accept semantics after epsilon elimination', () => {
    const ast = Parser.parse('a?b');
    const builder = new ThompsonBuilder();
    const rawNfa = builder.build(ast);

    const normalized = eliminateEpsilons(rawNfa);

    expect(normalized.startState).toBeDefined();
    expect(normalized.acceptStates.size).toBeGreaterThan(0);
  });
});
