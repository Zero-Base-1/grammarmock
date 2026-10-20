import { describe, it, expect } from 'vitest';
import { State } from '../../src/automata/state.js';
import { ThompsonBuilder, NFA } from '../../src/automata/nfa.js';
import { Parser } from '../../src/parser/parser.js';

describe('Unit: Automata & Thompson NFA', () => {
  it('instantiates State with ID and accept flag', () => {
    const s1 = new State(0, false);
    const s2 = new State(1, true);

    expect(s1.id).toBe(0);
    expect(s1.isAccept).toBe(false);
    expect(s2.id).toBe(1);
    expect(s2.isAccept).toBe(true);
  });

  it('adds transitions and epsilon transitions between states', () => {
    const s1 = new State(0);
    const s2 = new State(1);

    s1.addTransition({ type: 'literal', char: 'a' }, s2);
    expect(s1.transitions).toHaveLength(1);
    expect(s1.transitions[0]).toEqual({
      label: { type: 'literal', char: 'a' },
      target: s2,
    });

    s2.addEpsilonTransition(s1);
    expect(s2.transitions).toHaveLength(1);
    expect(s2.transitions[0].label.type).toBe('epsilon');
    expect(s2.transitions[0].target).toBe(s1);
  });

  it('builds NFA for literal expression', () => {
    const ast = Parser.parse('a');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    expect(nfa.startState).toBeDefined();
    expect(nfa.acceptStates.size).toBe(1);
    const states = nfa.getAllStates();
    expect(states.length).toBe(2);
    expect(nfa.startState.transitions).toHaveLength(1);
    expect(nfa.startState.transitions[0].label).toEqual({ type: 'literal', char: 'a' });
  });

  it('builds NFA for concatenation', () => {
    const ast = Parser.parse('ab');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const states = nfa.getAllStates();
    expect(states.length).toBeGreaterThanOrEqual(3);
    expect(nfa.acceptStates.size).toBe(1);
  });

  it('builds NFA for alternation (union)', () => {
    const ast = Parser.parse('a|b');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    expect(nfa.startState.transitions.length).toBeGreaterThanOrEqual(2);
    expect(nfa.acceptStates.size).toBe(1);
  });

  it('builds NFA for Kleene star (*)', () => {
    const ast = Parser.parse('a*');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    const states = nfa.getAllStates();
    expect(states.length).toBeGreaterThan(2);
    // Epsilon path from start to accept exists
    const hasEpsilonFromStart = nfa.startState.transitions.some(
      (t) => t.label.type === 'epsilon'
    );
    expect(hasEpsilonFromStart).toBe(true);
  });

  it('builds NFA for bounded repetition {2,4}', () => {
    const ast = Parser.parse('a{2,4}');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    expect(nfa.getAllStates().length).toBeGreaterThan(4);
    expect(nfa.acceptStates.size).toBe(1);
  });

  it('renumbers state IDs sequentially', () => {
    const ast = Parser.parse('abc');
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);

    nfa.renumber();
    const states = nfa.getAllStates();
    const ids = states.map((s) => s.id).sort((a, b) => a - b);
    for (let i = 0; i < ids.length; i++) {
      expect(ids[i]).toBe(i);
    }
  });
});
