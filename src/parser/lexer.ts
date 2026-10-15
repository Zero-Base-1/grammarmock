import { Token, TokenType, CharClassPayload } from './tokens.js';

export class LexerError extends Error {
  constructor(message: string, public position: number) {
    super(`Lexer Error at position ${position}: ${message}`);
    this.name = 'LexerError';
  }
}

export class Lexer {
  private input: string;
  private pos = 0;
  private len: number;

  constructor(input: string) {
    this.input = input;
    this.len = input.length;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.len) {
      const char = this.input[this.pos];

      if (char === '^') {
        tokens.push({ type: TokenType.ANCHOR_START, value: '^', position: this.pos });
        this.pos++;
      } else if (char === '$') {
        tokens.push({ type: TokenType.ANCHOR_END, value: '$', position: this.pos });
        this.pos++;
      } else if (char === '|') {
        tokens.push({ type: TokenType.OR, value: '|', position: this.pos });
        this.pos++;
      } else if (char === '*') {
        tokens.push({
          type: TokenType.STAR,
          value: '*',
          position: this.pos,
          quantifier: { min: 0, max: Infinity },
        });
        this.pos++;
      } else if (char === '+') {
        tokens.push({
          type: TokenType.PLUS,
          value: '+',
          position: this.pos,
          quantifier: { min: 1, max: Infinity },
        });
        this.pos++;
      } else if (char === '?') {
        tokens.push({
          type: TokenType.QUESTION,
          value: '?',
          position: this.pos,
          quantifier: { min: 0, max: 1 },
        });
        this.pos++;
      } else if (char === '(') {
        const startPos = this.pos;
        if (this.input.startsWith('(?:', startPos)) {
          tokens.push({ type: TokenType.LPAREN, value: '(?:', position: startPos });
          this.pos += 3;
        } else if (
          this.input.startsWith('(?=', startPos) ||
          this.input.startsWith('(?!', startPos) ||
          this.input.startsWith('(?<=', startPos) ||
          this.input.startsWith('(?<!', startPos)
        ) {
          throw new LexerError(
            'Lookaround assertions (lookahead/lookbehind) are non-regular extensions and cannot be represented in a Type-3 Right-Linear Grammar.',
            startPos
          );
        } else if (this.input.startsWith('(?', startPos)) {
          throw new LexerError(
            `Unsupported regex extension '${this.input.slice(startPos, startPos + 4)}' is not valid in a regular grammar.`,
            startPos
          );
        } else {
          tokens.push({ type: TokenType.LPAREN, value: '(', position: startPos });
          this.pos++;
        }
      } else if (char === ')') {
        tokens.push({ type: TokenType.RPAREN, value: ')', position: this.pos });
        this.pos++;
      } else if (char === '{') {
        tokens.push(this.readQuantifier());
      } else if (char === '[') {
        tokens.push(this.readCharacterClass());
      } else if (char === '.') {
        tokens.push({
          type: TokenType.CHAR_CLASS,
          value: '.',
          position: this.pos,
          charClass: {
            negated: false,
            ranges: [],
            chars: [],
            isWildcard: true,
          },
        });
        this.pos++;
      } else if (char === '\\') {
        tokens.push(this.readEscape());
      } else {
        tokens.push({ type: TokenType.LITERAL, value: char, position: this.pos });
        this.pos++;
      }
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.pos });
    return tokens;
  }

  private readQuantifier(): Token {
    const startPos = this.pos;
    const closeIdx = this.input.indexOf('}', startPos);
    if (closeIdx === -1) {
      throw new LexerError('Unterminated quantifier: missing closing "}"', startPos);
    }

    const content = this.input.slice(startPos + 1, closeIdx).trim();
    const parts = content.split(',').map((s) => s.trim());

    let min = 0;
    let max = Infinity;

    if (parts.length === 1) {
      if (!/^\d+$/.test(parts[0])) {
        throw new LexerError(`Invalid quantifier format: "{${content}}"`, startPos);
      }
      min = parseInt(parts[0], 10);
      max = min;
    } else if (parts.length === 2) {
      if (!/^\d+$/.test(parts[0])) {
        throw new LexerError(`Invalid quantifier minimum: "${parts[0]}"`, startPos);
      }
      min = parseInt(parts[0], 10);

      if (parts[1] === '') {
        max = Infinity;
      } else {
        if (!/^\d+$/.test(parts[1])) {
          throw new LexerError(`Invalid quantifier maximum: "${parts[1]}"`, startPos);
        }
        max = parseInt(parts[1], 10);
        if (max < min) {
          throw new LexerError(`Quantifier range out of order: min ${min} > max ${max}`, startPos);
        }
      }
    } else {
      throw new LexerError(`Invalid quantifier format: "{${content}}"`, startPos);
    }

    this.pos = closeIdx + 1;
    return {
      type: TokenType.QUANTIFIER,
      value: this.input.slice(startPos, this.pos),
      position: startPos,
      quantifier: { min, max },
    };
  }

  private readEscape(): Token {
    const startPos = this.pos;
    this.pos++; // skip '\'

    if (this.pos >= this.len) {
      throw new LexerError('Trailing backslash at end of pattern', startPos);
    }

    const ch = this.input[this.pos];
    this.pos++;

    if (/^[1-9]$/.test(ch)) {
      throw new LexerError(
        `Backreferences (e.g. \\${ch}) require context-sensitive matching and cannot be represented in a Type-3 Right-Linear Grammar.`,
        startPos
      );
    }

    if (ch === 'd') {
      return {
        type: TokenType.CHAR_CLASS,
        value: '\\d',
        position: startPos,
        charClass: {
          negated: false,
          ranges: [{ from: '0', to: '9' }],
          chars: [],
        },
      };
    }
    if (ch === 'D') {
      return {
        type: TokenType.CHAR_CLASS,
        value: '\\D',
        position: startPos,
        charClass: {
          negated: true,
          ranges: [{ from: '0', to: '9' }],
          chars: [],
        },
      };
    }
    if (ch === 'w') {
      return {
        type: TokenType.CHAR_CLASS,
        value: '\\w',
        position: startPos,
        charClass: {
          negated: false,
          ranges: [
            { from: 'a', to: 'z' },
            { from: 'A', to: 'Z' },
            { from: '0', to: '9' },
          ],
          chars: ['_'],
        },
      };
    }
    if (ch === 'W') {
      return {
        type: TokenType.CHAR_CLASS,
        value: '\\W',
        position: startPos,
        charClass: {
          negated: true,
          ranges: [
            { from: 'a', to: 'z' },
            { from: 'A', to: 'Z' },
            { from: '0', to: '9' },
          ],
          chars: ['_'],
        },
      };
    }
    if (ch === 's') {
      return {
        type: TokenType.CHAR_CLASS,
        value: '\\s',
        position: startPos,
        charClass: {
          negated: false,
          ranges: [],
          chars: [' ', '\t'],
        },
      };
    }
    if (ch === 'S') {
      return {
        type: TokenType.CHAR_CLASS,
        value: '\\S',
        position: startPos,
        charClass: {
          negated: true,
          ranges: [],
          chars: [' ', '\t', '\r', '\n'],
        },
      };
    }

    if (ch === 't') return { type: TokenType.LITERAL, value: '\t', position: startPos };
    if (ch === 'n') return { type: TokenType.LITERAL, value: '\n', position: startPos };
    if (ch === 'r') return { type: TokenType.LITERAL, value: '\r', position: startPos };

    if (ch === 'x' && this.pos + 2 <= this.len) {
      const hex = this.input.slice(this.pos, this.pos + 2);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        this.pos += 2;
        return {
          type: TokenType.LITERAL,
          value: String.fromCharCode(parseInt(hex, 16)),
          position: startPos,
        };
      }
    }

    return {
      type: TokenType.LITERAL,
      value: ch,
      position: startPos,
    };
  }

  private readCharacterClass(): Token {
    const startPos = this.pos;
    this.pos++; // skip '['

    let negated = false;
    if (this.pos < this.len && this.input[this.pos] === '^') {
      negated = true;
      this.pos++;
    }

    const ranges: Array<{ from: string; to: string }> = [];
    const chars: string[] = [];

    if (this.pos < this.len && this.input[this.pos] === ']') {
      chars.push(']');
      this.pos++;
    }

    while (this.pos < this.len && this.input[this.pos] !== ']') {
      let currentVal: string;
      const ch = this.input[this.pos];

      if (ch === '\\') {
        this.pos++;
        if (this.pos >= this.len) {
          throw new LexerError('Unterminated escape in character class', startPos);
        }
        const esc = this.input[this.pos];
        this.pos++;

        if (esc === 'd') {
          ranges.push({ from: '0', to: '9' });
          continue;
        } else if (esc === 'w') {
          ranges.push({ from: 'a', to: 'z' }, { from: 'A', to: 'Z' }, { from: '0', to: '9' });
          chars.push('_');
          continue;
        } else if (esc === 's') {
          chars.push(' ', '\t');
          continue;
        } else if (esc === 't') {
          currentVal = '\t';
        } else if (esc === 'n') {
          currentVal = '\n';
        } else if (esc === 'r') {
          currentVal = '\r';
        } else {
          currentVal = esc;
        }
      } else {
        currentVal = ch;
        this.pos++;
      }

      if (this.pos < this.len && this.input[this.pos] === '-' && this.pos + 1 < this.len && this.input[this.pos + 1] !== ']') {
        this.pos++; // skip '-'
        let nextVal: string;
        const nextCh = this.input[this.pos];

        if (nextCh === '\\') {
          this.pos++;
          if (this.pos >= this.len) {
            throw new LexerError('Unterminated escape in character class range', startPos);
          }
          const esc = this.input[this.pos];
          this.pos++;
          nextVal = esc;
        } else {
          nextVal = nextCh;
          this.pos++;
        }

        if (currentVal.charCodeAt(0) > nextVal.charCodeAt(0)) {
          throw new LexerError(
            `Character class range out of order: '${currentVal}' > '${nextVal}'`,
            startPos
          );
        }

        ranges.push({ from: currentVal, to: nextVal });
      } else {
        chars.push(currentVal);
      }
    }

    if (this.pos >= this.len || this.input[this.pos] !== ']') {
      throw new LexerError('Unterminated character class: missing closing "]"', startPos);
    }
    this.pos++; // skip ']'

    const payload: CharClassPayload = {
      negated,
      ranges,
      chars,
    };

    return {
      type: TokenType.CHAR_CLASS,
      value: this.input.slice(startPos, this.pos),
      position: startPos,
      charClass: payload,
    };
  }
}
