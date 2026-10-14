export type ASTNode =
  | EmptyNode
  | LiteralNode
  | CharClassNode
  | ConcatNode
  | UnionNode
  | RepetitionNode;

export interface EmptyNode {
  type: 'empty';
}

export interface LiteralNode {
  type: 'literal';
  char: string;
}

export interface CharRange {
  from: string;
  to: string;
}

export interface CharClassNode {
  type: 'char_class';
  negated: boolean;
  ranges: CharRange[];
  chars: string[];
  isWildcard?: boolean; // for '.'
}

export interface ConcatNode {
  type: 'concat';
  children: ASTNode[];
}

export interface UnionNode {
  type: 'union';
  options: ASTNode[];
}

export interface RepetitionNode {
  type: 'repetition';
  child: ASTNode;
  min: number;
  max: number; // Infinity for unbounded (*, +, {n,})
}
