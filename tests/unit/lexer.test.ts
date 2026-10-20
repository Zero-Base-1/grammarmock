import { describe, it, expect } from 'vitest';
import { Lexer, LexerError } from '../../src/parser/lexer.js';
import { TokenType } from '../../src/parser/tokens.js';

describe('Unit: Lexer', () => {
  it('tokenizes simple literal characters', () => {
    const lexer = new Lexer('abc');
    const tokens = lexer.tokenize();

    expect(tokens).toHaveLength(4); // 'a', 'b', 'c', EOF
    expect(tokens[0]).toMatchObject({ type: TokenType.LITERAL, value: 'a' });
    expect(tokens[1]).toMatchObject({ type: TokenType.LITERAL, value: 'b' });
    expect(tokens[2]).toMatchObject({ type: TokenType.LITERAL, value: 'c' });
    expect(tokens[3]).toMatchObject({ type: TokenType.EOF });
  });

  it('tokenizes start and end anchors (^ and $)', () => {
    const lexer = new Lexer('^abc$');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.ANCHOR_START);
    expect(tokens[tokens.length - 2].type).toBe(TokenType.ANCHOR_END);
    expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
  });

  it('tokenizes union / alternation operator (|)', () => {
    const lexer = new Lexer('cat|dog');
    const tokens = lexer.tokenize();

    const orToken = tokens.find((t) => t.type === TokenType.OR);
    expect(orToken).toBeDefined();
    expect(orToken?.value).toBe('|');
  });

  it('tokenizes standard quantifiers: *, +, ?', () => {
    const tokensStar = new Lexer('a*').tokenize();
    expect(tokensStar[1]).toMatchObject({
      type: TokenType.STAR,
      value: '*',
      quantifier: { min: 0, max: Infinity },
    });

    const tokensPlus = new Lexer('a+').tokenize();
    expect(tokensPlus[1]).toMatchObject({
      type: TokenType.PLUS,
      value: '+',
      quantifier: { min: 1, max: Infinity },
    });

    const tokensQuest = new Lexer('a?').tokenize();
    expect(tokensQuest[1]).toMatchObject({
      type: TokenType.QUESTION,
      value: '?',
      quantifier: { min: 0, max: 1 },
    });
  });

  it('tokenizes bounded and unbounded range quantifiers: {n}, {n,}, {n,m}', () => {
    const exact = new Lexer('a{3}').tokenize();
    expect(exact[1]).toMatchObject({
      type: TokenType.QUANTIFIER,
      value: '{3}',
      quantifier: { min: 3, max: 3 },
    });

    const atLeast = new Lexer('a{2,}').tokenize();
    expect(atLeast[1]).toMatchObject({
      type: TokenType.QUANTIFIER,
      value: '{2,}',
      quantifier: { min: 2, max: Infinity },
    });

    const range = new Lexer('a{2,5}').tokenize();
    expect(range[1]).toMatchObject({
      type: TokenType.QUANTIFIER,
      value: '{2,5}',
      quantifier: { min: 2, max: 5 },
    });
  });

  it('tokenizes character classes with ranges, characters, and negation', () => {
    const standardClass = new Lexer('[A-Za-z0-9_]').tokenize();
    expect(standardClass[0].type).toBe(TokenType.CHAR_CLASS);
    expect(standardClass[0].charClass).toBeDefined();
    expect(standardClass[0].charClass?.negated).toBe(false);
    expect(standardClass[0].charClass?.ranges).toEqual([
      { from: 'A', to: 'Z' },
      { from: 'a', to: 'z' },
      { from: '0', to: '9' },
    ]);
    expect(standardClass[0].charClass?.chars).toContain('_');

    const negatedClass = new Lexer('[^0-9]').tokenize();
    expect(negatedClass[0].charClass?.negated).toBe(true);
    expect(negatedClass[0].charClass?.ranges).toEqual([{ from: '0', to: '9' }]);
  });

  it('tokenizes wildcard dot (.) as special character class', () => {
    const wildcard = new Lexer('.').tokenize();
    expect(wildcard[0].type).toBe(TokenType.CHAR_CLASS);
    expect(wildcard[0].charClass?.isWildcard).toBe(true);
  });

  it('tokenizes shorthand character classes: \\d, \\D, \\w, \\W, \\s, \\S', () => {
    const tokens = new Lexer('\\d\\D\\w\\W\\s\\S').tokenize();

    // \d
    expect(tokens[0].charClass).toEqual({
      negated: false,
      ranges: [{ from: '0', to: '9' }],
      chars: [],
    });
    // \D
    expect(tokens[1].charClass?.negated).toBe(true);
    // \w
    expect(tokens[2].charClass).toEqual({
      negated: false,
      ranges: [
        { from: 'a', to: 'z' },
        { from: 'A', to: 'Z' },
        { from: '0', to: '9' },
      ],
      chars: ['_'],
    });
    // \W
    expect(tokens[3].charClass?.negated).toBe(true);
    // \s
    expect(tokens[4].charClass?.chars).toEqual([' ', '\t']);
    // \S
    expect(tokens[5].charClass?.negated).toBe(true);
  });

  it('tokenizes escaped control characters and metacharacters', () => {
    const tokens = new Lexer('\\n\\t\\r\\\\\\^\\$\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|\\.').tokenize();
    const chars = tokens.slice(0, -1).map((t) => t.value);
    expect(chars).toEqual(['\n', '\t', '\r', '\\', '^', '$', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|', '.']);
  });

  it('tokenizes non-capturing groups (?:...)', () => {
    const tokens = new Lexer('(?:abc)').tokenize();
    expect(tokens[0].type).toBe(TokenType.LPAREN);
    expect(tokens[tokens.length - 2].type).toBe(TokenType.RPAREN);
  });

  it('throws LexerError on lookaround assertions (lookahead/lookbehind)', () => {
    expect(() => new Lexer('(?=abc)').tokenize()).toThrowError(LexerError);
    expect(() => new Lexer('(?!abc)').tokenize()).toThrowError(LexerError);
    expect(() => new Lexer('(?<=abc)').tokenize()).toThrowError(LexerError);
    expect(() => new Lexer('(?<!abc)').tokenize()).toThrowError(LexerError);
  });

  it('throws LexerError on unsupported regex extensions', () => {
    expect(() => new Lexer('(?x)').tokenize()).toThrowError(LexerError);
  });

  it('throws LexerError on backreferences', () => {
    expect(() => new Lexer('([a-z])\\1').tokenize()).toThrowError(LexerError);
    expect(() => new Lexer('\\9').tokenize()).toThrowError(/Backreferences/);
  });

  it('throws LexerError on malformed quantifiers', () => {
    expect(() => new Lexer('a{').tokenize()).toThrowError(/Unterminated quantifier/);
    expect(() => new Lexer('a{abc}').tokenize()).toThrowError(/Invalid quantifier/);
    expect(() => new Lexer('a{5,2}').tokenize()).toThrowError(/Quantifier range out of order/);
  });

  it('throws LexerError on malformed character classes', () => {
    expect(() => new Lexer('[abc').tokenize()).toThrowError(/Unterminated character class/);
    expect(() => new Lexer('[z-a]').tokenize()).toThrowError(/Character class range out of order/);
  });

  it('throws LexerError on trailing backslash', () => {
    expect(() => new Lexer('abc\\').tokenize()).toThrowError(/Trailing backslash/);
  });
});
