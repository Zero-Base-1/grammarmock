import { Token, TokenType } from './tokens.js';
import { Lexer } from './lexer.js';
import { ASTNode, ConcatNode, UnionNode, RepetitionNode, EmptyNode } from '../ast/types.js';

export class ParserError extends Error {
  constructor(message: string, public position: number) {
    super(`Parser Error at position ${position}: ${message}`);
    this.name = 'ParserError';
  }
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public static parse(pattern: string): ASTNode {
    const lexer = new Lexer(pattern);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parseRegex();
  }

  public parseRegex(): ASTNode {
    const node = this.parseUnion();

    if (!this.isAtEnd()) {
      const tok = this.peek();
      throw new ParserError(`Unexpected token '${tok.value}' at end of pattern`, tok.position);
    }

    return node;
  }

  /**
   * Union: Expression ('|' Expression)*
   */
  private parseUnion(): ASTNode {
    const options: ASTNode[] = [this.parseConcat()];

    while (this.match(TokenType.OR)) {
      options.push(this.parseConcat());
    }

    if (options.length === 1) {
      return options[0];
    }

    return {
      type: 'union',
      options,
    };
  }

  /**
   * Concat: Factor*
   */
  private parseConcat(): ASTNode {
    const children: ASTNode[] = [];

    while (
      !this.isAtEnd() &&
      this.peek().type !== TokenType.OR &&
      this.peek().type !== TokenType.RPAREN
    ) {
      children.push(this.parseFactor());
    }

    if (children.length === 0) {
      return { type: 'empty' };
    }
    if (children.length === 1) {
      return children[0];
    }

    return {
      type: 'concat',
      children,
    };
  }

  /**
   * Factor: Atom Quantifier?
   */
  private parseFactor(): ASTNode {
    const atom = this.parseAtom();

    const tok = this.peek();
    if (
      tok.type === TokenType.STAR ||
      tok.type === TokenType.PLUS ||
      tok.type === TokenType.QUESTION ||
      tok.type === TokenType.QUANTIFIER
    ) {
      this.advance();
      const q = tok.quantifier!;
      return {
        type: 'repetition',
        child: atom,
        min: q.min,
        max: q.max,
      };
    }

    return atom;
  }

  /**
   * Atom: Literal | CharClass | '(' Expression ')' | Anchor
   */
  private parseAtom(): ASTNode {
    const tok = this.peek();

    if (tok.type === TokenType.ANCHOR_START || tok.type === TokenType.ANCHOR_END) {
      // Anchors (^, $) are structural assertions matching start/end of string.
      // In generative grammars, start and end are intrinsic to S0 and ε-accept states.
      this.advance();
      return { type: 'empty' };
    }

    if (tok.type === TokenType.LITERAL) {
      this.advance();
      return {
        type: 'literal',
        char: tok.value,
      };
    }

    if (tok.type === TokenType.CHAR_CLASS) {
      this.advance();
      return {
        type: 'char_class',
        negated: tok.charClass!.negated,
        ranges: tok.charClass!.ranges,
        chars: tok.charClass!.chars,
        isWildcard: tok.charClass!.isWildcard,
      };
    }

    if (tok.type === TokenType.LPAREN) {
      const openParen = this.advance();
      const expr = this.parseUnion();

      if (!this.match(TokenType.RPAREN)) {
        throw new ParserError('Unclosed parenthesis: expected ")"', openParen.position);
      }
      return expr;
    }

    throw new ParserError(`Unexpected token '${tok.value}'`, tok.position);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
