import { CharRange } from '../ast/types.js';

export type TerminalSymbol =
  | { type: 'literal'; char: string }
  | {
      type: 'char_class';
      negated: boolean;
      ranges: CharRange[];
      chars: string[];
      isWildcard?: boolean;
    };

export type ProductionRule =
  | {
      type: 'step';
      terminal: TerminalSymbol;
      nextVariable: string;
    }
  | {
      type: 'unit';
      nextVariable: string;
    }
  | {
      type: 'epsilon';
    };

export interface RightLinearGrammar {
  variables: string[];
  startVariable: string;
  productions: Map<string, ProductionRule[]>;
}
