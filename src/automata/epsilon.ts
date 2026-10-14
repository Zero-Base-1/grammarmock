import { State, Transition } from './state.js';
import { NFA } from './nfa.js';

/**
 * Computes the epsilon closure of a given state:
 * The set of all states reachable from `state` via zero or more epsilon transitions.
 */
export function getEpsilonClosure(startState: State): Set<State> {
  const closure = new Set<State>([startState]);
  const stack: State[] = [startState];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const t of current.transitions) {
      if (t.label.type === 'epsilon' && !closure.has(t.target)) {
        closure.add(t.target);
        stack.push(t.target);
      }
    }
  }

  return closure;
}

/**
 * Normalizes an NFA by eliminating epsilon transitions.
 * Produces an equivalent NFA where transitions are strictly labeled with terminals
 * (character literals or character classes) and accept states are preserved via closure.
 */
export function eliminateEpsilons(nfa: NFA): NFA {
  const allStates = nfa.getAllStates();
  const closureMap = new Map<State, Set<State>>();

  for (const s of allStates) {
    closureMap.set(s, getEpsilonClosure(s));
  }

  // Create new state mapping
  const newStateMap = new Map<number, State>();
  const getOrCreate = (id: number): State => {
    let st = newStateMap.get(id);
    if (!st) {
      st = new State(id);
      newStateMap.set(id, st);
    }
    return st;
  };

  const newAcceptStates = new Set<State>();

  for (const s of allStates) {
    const newS = getOrCreate(s.id);
    const closure = closureMap.get(s)!;

    // If any state in closure is an accept state, this state is also accepting
    for (const member of closure) {
      if (member.isAccept) {
        newS.isAccept = true;
        newAcceptStates.add(newS);
        break;
      }
    }

    // For every state in the closure, find non-epsilon transitions
    const seenTransitions = new Set<string>();

    for (const member of closure) {
      for (const t of member.transitions) {
        if (t.label.type !== 'epsilon') {
          // Target state in new NFA
          const newTarget = getOrCreate(t.target.id);
          const key = `${JSON.stringify(t.label)}->${newTarget.id}`;

          if (!seenTransitions.has(key)) {
            seenTransitions.add(key);
            newS.addTransition(t.label, newTarget);
          }
        }
      }
    }
  }

  const newStart = getOrCreate(nfa.startState.id);
  const normalized = new NFA(newStart, newAcceptStates);
  normalized.renumber();
  return normalized;
}
