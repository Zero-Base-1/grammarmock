export enum TokenType {
  LITERAL = 'LITERAL',
  CHAR_CLASS = 'CHAR_CLASS',
  OR = 'OR',
  STAR = 'STAR',
  PLUS = 'PLUS',
  QUESTION = 'QUESTION',
  QUANTIFIER = 'QUANTIFIER',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  ANCHOR_START = 'ANCHOR_START',
  ANCHOR_END = 'ANCHOR_END',
  EOF = 'EOF',
}

export interface QuantifierPayload {
  min: number;
  max: number;
}

export interface CharClassPayload {
  negated: boolean;
  ranges: Array<{ from: string; to: string }>;
  chars: string[];
  isWildcard?: boolean;
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
  quantifier?: QuantifierPayload;
  charClass?: CharClassPayload;
}
