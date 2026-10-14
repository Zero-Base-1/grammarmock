import { CharRange } from '../ast/types.js';

export type TransitionLabel =
  | { type: 'epsilon' }
  | { type: 'literal'; char: string }
  | {
      type: 'char_class';
      negated: boolean;
      ranges: CharRange[];
      chars: string[];
      isWildcard?: boolean;
    };

export interface Transition {
  label: TransitionLabel;
  target: State;
}

export class State {
  public id: number;
  public transitions: Transition[] = [];
  public isAccept = false;

  constructor(id: number, isAccept = false) {
    this.id = id;
    this.isAccept = isAccept;
  }

  public addTransition(label: TransitionLabel, target: State): void {
    this.transitions.push({ label, target });
  }

  public addEpsilonTransition(target: State): void {
    this.transitions.push({ label: { type: 'epsilon' }, target });
  }
}
