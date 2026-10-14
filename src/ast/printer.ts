import { ASTNode, CharClassNode } from './types.js';

export function formatCharClass(node: CharClassNode): string {
  if (node.isWildcard) {
    return '.';
  }
  const parts: string[] = [];
  for (const r of node.ranges) {
    parts.push(`${r.from}-${r.to}`);
  }
  for (const c of node.chars) {
    parts.push(c === ' ' ? '\\s' : c);
  }
  const inner = parts.join('');
  return node.negated ? `[^${inner}]` : `[${inner}]`;
}

export function printAST(
  node: ASTNode,
  indent = '',
  isLast = true,
  isRoot = true
): string {
  const prefix = isRoot ? '' : indent + (isLast ? '└── ' : '├── ');
  const nextIndent = isRoot ? '' : indent + (isLast ? '    ' : '│   ');

  switch (node.type) {
    case 'empty':
      return `${prefix}Empty (ε)\n`;
    case 'literal':
      return `${prefix}Literal: '${node.char}'\n`;
    case 'char_class':
      return `${prefix}CharClass: ${formatCharClass(node)}\n`;
    case 'concat': {
      let out = `${prefix}Concat\n`;
      node.children.forEach((child, index) => {
        out += printAST(child, nextIndent, index === node.children.length - 1, false);
      });
      return out;
    }
    case 'union': {
      let out = `${prefix}Union (|)\n`;
      node.options.forEach((opt, index) => {
        out += printAST(opt, nextIndent, index === node.options.length - 1, false);
      });
      return out;
    }
    case 'repetition': {
      const maxStr = node.max === Infinity ? '∞' : node.max.toString();
      let out = `${prefix}Repetition {${node.min}, ${maxStr}}\n`;
      out += printAST(node.child, nextIndent, true, false);
      return out;
    }
  }
}
