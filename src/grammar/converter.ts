import { NFA } from '../automata/nfa.js';
import { State } from '../automata/state.js';
import { eliminateEpsilons } from '../automata/epsilon.js';
import { RightLinearGrammar, ProductionRule, TerminalSymbol } from './types.js';

export function nfaToRightLinearGrammar(
  nfa: NFA,
  normalizeEpsilons = true
): RightLinearGrammar {
  const targetNfa = normalizeEpsilons ? eliminateEpsilons(nfa) : nfa;
  const states = targetNfa.getAllStates();

  const stateToVarName = (state: State): string => `S${state.id}`;
  const variables: string[] = states.map((s) => stateToVarName(s));
  const startVariable = stateToVarName(targetNfa.startState);
  const productions = new Map<string, ProductionRule[]>();

  for (const state of states) {
    const varName = stateToVarName(state);
    const rules: ProductionRule[] = [];

    // If state is accepting, it produces epsilon (terminates)
    if (state.isAccept) {
      rules.push({ type: 'epsilon' });
    }

    for (const t of state.transitions) {
      const targetVar = stateToVarName(t.target);
      if (t.label.type === 'epsilon') {
        rules.push({
          type: 'unit',
          nextVariable: targetVar,
        });
      } else {
        const terminal: TerminalSymbol =
          t.label.type === 'literal'
            ? { type: 'literal', char: t.label.char }
            : {
                type: 'char_class',
                negated: t.label.negated,
                ranges: t.label.ranges,
                chars: t.label.chars,
                isWildcard: t.label.isWildcard,
              };

        rules.push({
          type: 'step',
          terminal,
          nextVariable: targetVar,
        });
      }
    }

    productions.set(varName, rules);
  }

  return {
    variables,
    startVariable,
    productions,
  };
}
