import { TerminalSymbol } from '../grammar/types.js';
import { PRNG } from './prng.js';

export function sampleTerminal(terminal: TerminalSymbol, prng: PRNG): string {
  if (terminal.type === 'literal') {
    return terminal.char;
  }

  if (terminal.isWildcard) {
    return String.fromCharCode(prng.nextInt(32, 126));
  }

  if (!terminal.negated) {
    let totalCount = 0;
    const rangeSizes: number[] = [];

    for (const r of terminal.ranges) {
      const size = r.to.charCodeAt(0) - r.from.charCodeAt(0) + 1;
      rangeSizes.push(size);
      totalCount += size;
    }

    totalCount += terminal.chars.length;

    if (totalCount === 0) {
      return '';
    }

    let pickIndex = prng.nextInt(0, totalCount - 1);

    for (let i = 0; i < terminal.ranges.length; i++) {
      const size = rangeSizes[i];
      if (pickIndex < size) {
        const charCode = terminal.ranges[i].from.charCodeAt(0) + pickIndex;
        return String.fromCharCode(charCode);
      }
      pickIndex -= size;
    }

    return terminal.chars[pickIndex];
  } else {
    const candidates: string[] = [];

    for (let code = 32; code <= 126; code++) {
      const ch = String.fromCharCode(code);
      let matched = false;

      for (const r of terminal.ranges) {
        if (code >= r.from.charCodeAt(0) && code <= r.to.charCodeAt(0)) {
          matched = true;
          break;
        }
      }

      if (!matched && terminal.chars.includes(ch)) {
        matched = true;
      }

      if (!matched) {
        candidates.push(ch);
      }
    }

    if (candidates.length === 0) {
      return 'a';
    }

    return prng.choice(candidates);
  }
}

/**
 * Returns all distinct characters in the terminal in deterministic ascending (chronological/lexicographical) order.
 */
export function getSortedCharacters(terminal: TerminalSymbol): string[] {
  if (terminal.type === 'literal') {
    return [terminal.char];
  }

  if (terminal.isWildcard) {
    const chars: string[] = [];
    for (let code = 32; code <= 126; code++) {
      chars.push(String.fromCharCode(code));
    }
    return chars;
  }

  if (!terminal.negated) {
    const charSet = new Set<string>();
    for (const r of terminal.ranges) {
      const from = r.from.charCodeAt(0);
      const to = r.to.charCodeAt(0);
      for (let c = from; c <= to; c++) {
        charSet.add(String.fromCharCode(c));
      }
    }
    for (const c of terminal.chars) {
      charSet.add(c);
    }
    return Array.from(charSet).sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));
  } else {
    const candidates: string[] = [];
    for (let code = 32; code <= 126; code++) {
      const ch = String.fromCharCode(code);
      let matched = false;
      for (const r of terminal.ranges) {
        if (code >= r.from.charCodeAt(0) && code <= r.to.charCodeAt(0)) {
          matched = true;
          break;
        }
      }
      if (!matched && terminal.chars.includes(ch)) {
        matched = true;
      }
      if (!matched) {
        candidates.push(ch);
      }
    }
    return candidates;
  }
}
