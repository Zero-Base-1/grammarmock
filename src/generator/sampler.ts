import { TerminalSymbol } from '../grammar/types.js';
import { PRNG } from './prng.js';

export function sampleTerminal(terminal: TerminalSymbol, prng: PRNG): string {
  if (terminal.type === 'literal') {
    return terminal.char;
  }

  if (terminal.isWildcard) {
    // Standard regex wildcard '.' matches any character except newline
    // Printable ASCII 32 (' ') to 126 ('~')
    return String.fromCharCode(prng.nextInt(32, 126));
  }

  if (!terminal.negated) {
    // Calculate total character count across all ranges and discrete characters
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

    // Check which range the pick lands in
    for (let i = 0; i < terminal.ranges.length; i++) {
      const size = rangeSizes[i];
      if (pickIndex < size) {
        const charCode = terminal.ranges[i].from.charCodeAt(0) + pickIndex;
        return String.fromCharCode(charCode);
      }
      pickIndex -= size;
    }

    // Pick falls into discrete chars
    return terminal.chars[pickIndex];
  } else {
    // Negated character class: pick from printable ASCII (32-126) that don't match
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
      return 'a'; // fallback
    }

    return prng.choice(candidates);
  }
}
