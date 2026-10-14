import { describe, it, expect } from 'vitest';
import { Parser } from '../src/parser/parser.js';
import { LexerError } from '../src/parser/lexer.js';
import { printAST } from '../src/ast/printer.js';

describe('Lexer & Parser', () => {
  it('parses simple literal concatenation', () => {
    const ast = Parser.parse('abc');
    expect(ast.type).toBe('concat');
    if (ast.type === 'concat') {
      expect(ast.children).toHaveLength(3);
      expect(ast.children[0]).toEqual({ type: 'literal', char: 'a' });
      expect(ast.children[1]).toEqual({ type: 'literal', char: 'b' });
      expect(ast.children[2]).toEqual({ type: 'literal', char: 'c' });
    }
  });

  it('parses alternation (union)', () => {
    const ast = Parser.parse('a|b|c');
    expect(ast.type).toBe('union');
    if (ast.type === 'union') {
      expect(ast.options).toHaveLength(3);
    }
  });

  it('parses character classes and shorthands', () => {
    const ast = Parser.parse('[A-Z0-9_]');
    expect(ast.type).toBe('char_class');
    if (ast.type === 'char_class') {
      expect(ast.negated).toBe(false);
      expect(ast.ranges).toEqual([
        { from: 'A', to: 'Z' },
        { from: '0', to: '9' },
      ]);
      expect(ast.chars).toContain('_');
    }

    const digitAst = Parser.parse('\\d');
    expect(digitAst.type).toBe('char_class');

    const wildcardAst = Parser.parse('.');
    expect(wildcardAst.type).toBe('char_class');
    if (wildcardAst.type === 'char_class') {
      expect(wildcardAst.isWildcard).toBe(true);
    }
  });

  it('parses quantifiers and repetitions', () => {
    const astStar = Parser.parse('a*');
    expect(astStar.type).toBe('repetition');
    if (astStar.type === 'repetition') {
      expect(astStar.min).toBe(0);
      expect(astStar.max).toBe(Infinity);
    }

    const astRange = Parser.parse('a{2,5}');
    expect(astRange.type).toBe('repetition');
    if (astRange.type === 'repetition') {
      expect(astRange.min).toBe(2);
      expect(astRange.max).toBe(5);
    }
  });

  it('correctly respects operator precedence: a|bc*', () => {
    const ast = Parser.parse('a|bc*');
    expect(ast.type).toBe('union');
    if (ast.type === 'union') {
      expect(ast.options[0]).toEqual({ type: 'literal', char: 'a' });
      expect(ast.options[1].type).toBe('concat');
    }
  });

  it('parses complex employee ID regex: ^[A-Z]{3}-\\d{4}$', () => {
    const ast = Parser.parse('^[A-Z]{3}-\\d{4}$');
    expect(ast.type).toBe('concat');
    const printed = printAST(ast);
    expect(printed).toContain('Repetition {3, 3}');
    expect(printed).toContain('Literal: \'-\'');
  });

  it('rejects non-regular lookaround assertions with descriptive error', () => {
    expect(() => Parser.parse('(?=abc)def')).toThrowError(LexerError);
    expect(() => Parser.parse('(?<=abc)def')).toThrowError(
      /Lookaround assertions .* are non-regular extensions/
    );
  });

  it('rejects non-regular backreferences with descriptive error', () => {
    expect(() => Parser.parse('([a-z])\\1')).toThrowError(
      /Backreferences .* require context-sensitive matching/
    );
  });
});
