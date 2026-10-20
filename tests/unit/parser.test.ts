import { describe, it, expect } from 'vitest';
import { Parser, ParserError } from '../../src/parser/parser.js';

describe('Unit: Parser', () => {
  it('parses empty pattern into empty node', () => {
    const ast = Parser.parse('');
    expect(ast).toEqual({ type: 'empty' });
  });

  it('parses anchors as empty nodes in concatenation', () => {
    const ast = Parser.parse('^$');
    expect(ast).toEqual({
      type: 'concat',
      children: [{ type: 'empty' }, { type: 'empty' }],
    });
  });

  it('parses single literal character', () => {
    const ast = Parser.parse('x');
    expect(ast).toEqual({ type: 'literal', char: 'x' });
  });

  it('parses literal concatenation', () => {
    const ast = Parser.parse('hello');
    expect(ast.type).toBe('concat');
    if (ast.type === 'concat') {
      expect(ast.children).toHaveLength(5);
      expect(ast.children.map((c) => (c.type === 'literal' ? c.char : ''))).toEqual([
        'h',
        'e',
        'l',
        'l',
        'o',
      ]);
    }
  });

  it('parses union / alternation', () => {
    const ast = Parser.parse('foo|bar|baz');
    expect(ast.type).toBe('union');
    if (ast.type === 'union') {
      expect(ast.options).toHaveLength(3);
      expect(ast.options[0].type).toBe('concat');
      expect(ast.options[1].type).toBe('concat');
      expect(ast.options[2].type).toBe('concat');
    }
  });

  it('respects operator precedence: quantifiers > concatenation > alternation', () => {
    // 'a|bc*' should be parsed as union(a, concat(b, c*))
    const ast = Parser.parse('a|bc*');
    expect(ast.type).toBe('union');
    if (ast.type === 'union') {
      expect(ast.options[0]).toEqual({ type: 'literal', char: 'a' });
      expect(ast.options[1].type).toBe('concat');
      if (ast.options[1].type === 'concat') {
        expect(ast.options[1].children[0]).toEqual({ type: 'literal', char: 'b' });
        expect(ast.options[1].children[1].type).toBe('repetition');
      }
    }
  });

  it('parses parenthesized sub-expressions and overrides precedence', () => {
    const ast = Parser.parse('(a|b)c');
    expect(ast.type).toBe('concat');
    if (ast.type === 'concat') {
      expect(ast.children[0].type).toBe('union');
      expect(ast.children[1]).toEqual({ type: 'literal', char: 'c' });
    }
  });

  it('parses nested repetitions and quantifiers', () => {
    const ast = Parser.parse('(a+)?');
    expect(ast.type).toBe('repetition');
    if (ast.type === 'repetition') {
      expect(ast.min).toBe(0);
      expect(ast.max).toBe(1);
      expect(ast.child.type).toBe('repetition');
      if (ast.child.type === 'repetition') {
        expect(ast.child.min).toBe(1);
        expect(ast.child.max).toBe(Infinity);
      }
    }
  });

  it('parses character classes into char_class AST nodes', () => {
    const ast = Parser.parse('[0-9a-fA-F]');
    expect(ast.type).toBe('char_class');
    if (ast.type === 'char_class') {
      expect(ast.negated).toBe(false);
      expect(ast.ranges).toEqual([
        { from: '0', to: '9' },
        { from: 'a', to: 'f' },
        { from: 'A', to: 'F' },
      ]);
    }
  });

  it('parses anchored patterns retaining structural nodes', () => {
    const ast = Parser.parse('^[A-Z]{3}-\\d{4}$');
    expect(ast.type).toBe('concat');
    if (ast.type === 'concat') {
      expect(ast.children).toHaveLength(5);
      expect(ast.children[0]).toEqual({ type: 'empty' });
      expect(ast.children[1].type).toBe('repetition');
      expect(ast.children[2]).toEqual({ type: 'literal', char: '-' });
      expect(ast.children[3].type).toBe('repetition');
      expect(ast.children[4]).toEqual({ type: 'empty' });
    }
  });

  it('throws ParserError on unclosed parentheses', () => {
    expect(() => Parser.parse('(abc')).toThrowError(ParserError);
    expect(() => Parser.parse('(abc')).toThrowError(/Unclosed parenthesis/);
  });

  it('throws ParserError on misplaced quantifiers at start of expression', () => {
    expect(() => Parser.parse('*abc')).toThrowError(ParserError);
    expect(() => Parser.parse('+abc')).toThrowError(ParserError);
    expect(() => Parser.parse('?abc')).toThrowError(ParserError);
    expect(() => Parser.parse('{2}abc')).toThrowError(ParserError);
  });
});
