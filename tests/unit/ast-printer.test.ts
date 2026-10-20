import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/parser/parser.js';
import { printAST } from '../../src/ast/printer.js';

describe('Unit: AST Printer', () => {
  it('formats literal node correctly', () => {
    const ast = Parser.parse('a');
    const output = printAST(ast);
    expect(output).toContain("Literal: 'a'");
  });

  it('formats concatenation tree with box-drawing indentation', () => {
    const ast = Parser.parse('ab');
    const output = printAST(ast);
    expect(output).toContain('Concat');
    expect(output).toContain("Literal: 'a'");
    expect(output).toContain("Literal: 'b'");
    expect(output).toContain('├──');
    expect(output).toContain('└──');
  });

  it('formats union / alternation tree', () => {
    const ast = Parser.parse('x|y');
    const output = printAST(ast);
    expect(output).toContain('Union (|)');
    expect(output).toContain("Literal: 'x'");
    expect(output).toContain("Literal: 'y'");
  });

  it('formats repetition with bounds', () => {
    const ast = Parser.parse('a{2,5}');
    const output = printAST(ast);
    expect(output).toContain('Repetition {2, 5}');
    expect(output).toContain("Literal: 'a'");
  });

  it('formats character class with ranges and negation', () => {
    const ast = Parser.parse('[^0-9_]');
    const output = printAST(ast);
    expect(output).toContain('CharClass: [^0-9_]');
  });

  it('formats empty AST node', () => {
    const ast = Parser.parse('');
    const output = printAST(ast);
    expect(output).toContain('Empty (ε)');
  });
});
