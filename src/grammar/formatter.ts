import { RightLinearGrammar, ProductionRule, TerminalSymbol } from './types.js';

export function formatTerminal(term: TerminalSymbol): string {
  if (term.type === 'literal') {
    return `'${term.char}'`;
  }
  if (term.isWildcard) {
    return '.';
  }
  const parts: string[] = [];
  for (const r of term.ranges) {
    parts.push(`${r.from}-${r.to}`);
  }
  for (const c of term.chars) {
    parts.push(c === ' ' ? '\\s' : c);
  }
  const inner = parts.join('');
  return term.negated ? `[^${inner}]` : `[${inner}]`;
}

export function formatRule(rule: ProductionRule): string {
  switch (rule.type) {
    case 'epsilon':
      return 'ε';
    case 'unit':
      return rule.nextVariable;
    case 'step':
      return `${formatTerminal(rule.terminal)} ${rule.nextVariable}`;
  }
}

export function formatGrammar(grammar: RightLinearGrammar): string {
  const lines: string[] = [];
  lines.push('Right-Linear Grammar G = (V, Σ, R, S)');
  lines.push(`Variables (V)   : { ${grammar.variables.join(', ')} }`);
  lines.push(`Start Symbol (S): ${grammar.startVariable}`);
  lines.push('\nProduction Rules (R):');

  for (const v of grammar.variables) {
    const rules = grammar.productions.get(v) || [];
    if (rules.length === 0) continue;
    const ruleStrings = rules.map(formatRule);
    lines.push(`  ${v.padEnd(4)} -> ${ruleStrings.join(' | ')}`);
  }

  return lines.join('\n');
}
