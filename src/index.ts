import { Parser } from './parser/parser.js';
import { ThompsonBuilder, NFA } from './automata/nfa.js';
import { eliminateEpsilons } from './automata/epsilon.js';
import { nfaToRightLinearGrammar } from './grammar/converter.js';
import { formatGrammar } from './grammar/formatter.js';
import { MockGenerator, GenerationOptions } from './generator/engine.js';
import { RightLinearGrammar } from './grammar/types.js';
import { printAST } from './ast/printer.js';

export * from './ast/types.js';
export * from './ast/printer.js';
export * from './parser/tokens.js';
export * from './parser/lexer.js';
export * from './parser/parser.js';
export * from './automata/state.js';
export * from './automata/nfa.js';
export * from './automata/epsilon.js';
export * from './grammar/types.js';
export * from './grammar/converter.js';
export * from './grammar/formatter.js';
export * from './generator/prng.js';
export * from './generator/sampler.js';
export * from './generator/engine.js';

/**
 * Compiles a regex pattern into a formal Right-Linear Grammar.
 */
export function compileGrammar(pattern: string, normalizeEpsilons = true): RightLinearGrammar {
  const ast = Parser.parse(pattern);
  const builder = new ThompsonBuilder();
  const nfa = builder.build(ast);
  return nfaToRightLinearGrammar(nfa, normalizeEpsilons);
}

/**
 * Generates a single synthetic mock string complying with the given regex pattern.
 */
export function generateMock(pattern: string, options: GenerationOptions = {}): string {
  const grammar = compileGrammar(pattern);
  const generator = new MockGenerator(grammar, options.seed);
  return generator.generate(options);
}

/**
 * Generates multiple synthetic mock strings complying with the given regex pattern.
 */
export function generateBulk(
  pattern: string,
  count: number,
  options: GenerationOptions = {}
): string[] {
  const grammar = compileGrammar(pattern);
  const generator = new MockGenerator(grammar, options.seed);
  return generator.generateBulk(count, options);
}
