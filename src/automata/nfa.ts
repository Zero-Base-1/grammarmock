import { State, TransitionLabel } from './state.js';
import { ASTNode, CharClassNode } from '../ast/types.js';

export interface NFAFragment {
  start: State;
  accept: State;
}

export class NFA {
  public startState: State;
  public acceptStates: Set<State>;

  constructor(startState: State, acceptStates: Set<State>) {
    this.startState = startState;
    this.acceptStates = acceptStates;
  }

  public getAllStates(): State[] {
    const visited = new Set<State>();
    const stack: State[] = [this.startState];

    while (stack.length > 0) {
      const state = stack.pop()!;
      if (!visited.has(state)) {
        visited.add(state);
        for (const t of state.transitions) {
          if (!visited.has(t.target)) {
            stack.push(t.target);
          }
        }
      }
    }

    return Array.from(visited);
  }

  public renumber(): void {
    const states = this.getAllStates();
    states.forEach((state, index) => {
      state.id = index;
    });
  }
}

export class ThompsonBuilder {
  private stateId = 0;

  private createState(isAccept = false): State {
    return new State(this.stateId++, isAccept);
  }

  public build(ast: ASTNode): NFA {
    const fragment = this.buildFragment(ast);
    fragment.accept.isAccept = true;
    const nfa = new NFA(fragment.start, new Set([fragment.accept]));
    nfa.renumber();
    return nfa;
  }

  private buildFragment(node: ASTNode): NFAFragment {
    switch (node.type) {
      case 'empty':
        return this.fromEmpty();
      case 'literal':
        return this.fromLiteral(node.char);
      case 'char_class':
        return this.fromCharClass(node);
      case 'concat':
        return this.concat(node.children.map((c) => this.buildFragment(c)));
      case 'union':
        return this.union(node.options.map((o) => this.buildFragment(o)));
      case 'repetition':
        return this.repetition(node.child, node.min, node.max);
    }
  }

  public fromLiteral(char: string): NFAFragment {
    const start = this.createState();
    const accept = this.createState();
    start.addTransition({ type: 'literal', char }, accept);
    return { start, accept };
  }

  public fromCharClass(node: CharClassNode): NFAFragment {
    const start = this.createState();
    const accept = this.createState();
    const label: TransitionLabel = {
      type: 'char_class',
      negated: node.negated,
      ranges: node.ranges,
      chars: node.chars,
      isWildcard: node.isWildcard,
    };
    start.addTransition(label, accept);
    return { start, accept };
  }

  public fromEmpty(): NFAFragment {
    const start = this.createState();
    const accept = this.createState();
    start.addEpsilonTransition(accept);
    return { start, accept };
  }

  public concat(fragments: NFAFragment[]): NFAFragment {
    if (fragments.length === 0) {
      return this.fromEmpty();
    }
    if (fragments.length === 1) {
      return fragments[0];
    }

    for (let i = 0; i < fragments.length - 1; i++) {
      fragments[i].accept.addEpsilonTransition(fragments[i + 1].start);
    }

    return {
      start: fragments[0].start,
      accept: fragments[fragments.length - 1].accept,
    };
  }

  public union(fragments: NFAFragment[]): NFAFragment {
    if (fragments.length === 0) {
      return this.fromEmpty();
    }
    if (fragments.length === 1) {
      return fragments[0];
    }

    const start = this.createState();
    const accept = this.createState();

    for (const frag of fragments) {
      start.addEpsilonTransition(frag.start);
      frag.accept.addEpsilonTransition(accept);
    }

    return { start, accept };
  }

  public star(fragment: NFAFragment): NFAFragment {
    const start = this.createState();
    const accept = this.createState();

    start.addEpsilonTransition(fragment.start);
    start.addEpsilonTransition(accept);
    fragment.accept.addEpsilonTransition(fragment.start);
    fragment.accept.addEpsilonTransition(accept);

    return { start, accept };
  }

  public plus(fragment: NFAFragment): NFAFragment {
    const start = this.createState();
    const accept = this.createState();

    start.addEpsilonTransition(fragment.start);
    fragment.accept.addEpsilonTransition(fragment.start);
    fragment.accept.addEpsilonTransition(accept);

    return { start, accept };
  }

  public optional(fragment: NFAFragment): NFAFragment {
    const start = this.createState();
    const accept = this.createState();

    start.addEpsilonTransition(fragment.start);
    start.addEpsilonTransition(accept);
    fragment.accept.addEpsilonTransition(accept);

    return { start, accept };
  }

  private repetition(childNode: ASTNode, min: number, max: number): NFAFragment {
    if (min === 0 && max === Infinity) {
      return this.star(this.buildFragment(childNode));
    }
    if (min === 1 && max === Infinity) {
      return this.plus(this.buildFragment(childNode));
    }
    if (min === 0 && max === 1) {
      return this.optional(this.buildFragment(childNode));
    }
    if (min === 0 && max === 0) {
      return this.fromEmpty();
    }

    const frags: NFAFragment[] = [];
    for (let i = 0; i < min; i++) {
      frags.push(this.buildFragment(childNode));
    }

    if (max === Infinity) {
      frags.push(this.star(this.buildFragment(childNode)));
      return this.concat(frags);
    }

    for (let i = 0; i < max - min; i++) {
      frags.push(this.optional(this.buildFragment(childNode)));
    }

    return this.concat(frags);
  }
}
