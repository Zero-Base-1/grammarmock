import { describe, it, expect } from 'vitest';
import { generateBulk } from '../../src/index.js';

describe('Integration: 100% Compliance Verification Suite', () => {
  const testPatterns = [
    { name: 'Employee ID', pattern: '^[A-Z]{3}-\\d{4}$' },
    { name: 'Hex Color (short or full)', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' },
    { name: 'US Phone Number', pattern: '^\\+1-\\d{3}-\\d{3}-\\d{4}$' },
    { name: 'Product SKU', pattern: '^[A-Z]{2,4}-[0-9]{3,5}-[A-Z0-9]{2}$' },
    { name: 'IPv4 Address format', pattern: '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$' },
    { name: 'Corporate Email', pattern: '^[a-z]{3,6}\\.[a-z]{3,6}@[a-z]{3,6}\\.(com|org|net)$' },
    { name: 'Nested Quantified Alternation', pattern: '^(foo|bar|baz){1,3}-(alpha|beta|gamma)$' },
    { name: 'Mixed Character Class & Underscore', pattern: '^[a-f0-9_]{4,8}$' },
    { name: 'Negated Digits', pattern: '^[^0-9]{3,6}$' },
    { name: 'Wildcard Characters', pattern: '^A.B.C$' },
    { name: 'Optional Components', pattern: '^(https?://)?www\\.[a-z]{4,8}\\.org$' },
    { name: 'Credit Card (Visa-like)', pattern: '^4[0-9]{3}-[0-9]{4}-[0-9]{4}-[0-9]{4}$' },
    { name: 'Invoice ID', pattern: '^INV-202[0-9]-[0-9]{5}$' },
    { name: 'SemVer 2.0', pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-(alpha|beta|rc)\\.[1-9])?$' },
    { name: 'MAC Address', pattern: '^([0-9A-F]{2}:){5}[0-9A-F]{2}$' },
    { name: 'ISO Date', pattern: '^202[0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' },
  ];

  for (const { name, pattern } of testPatterns) {
    it(`guarantees 100% regex compliance in random mode for: ${name} (${pattern})`, () => {
      const count = 30;
      const records = generateBulk(pattern, count, { maxRepeat: 4 });
      const regex = new RegExp(pattern);

      expect(records).toHaveLength(count);

      for (let i = 0; i < records.length; i++) {
        const str = records[i];
        const matches = regex.test(str);
        if (!matches) {
          throw new Error(
            `Compliance Failure on ${name}: generated "${str}" does not match pattern /${pattern}/`
          );
        }
        expect(matches).toBe(true);
      }
    });

    it(`guarantees 100% regex compliance in chronological mode for: ${name} (${pattern})`, () => {
      const count = 15;
      const records = generateBulk(pattern, count, { mode: 'chronological', maxRepeat: 4 });
      const regex = new RegExp(pattern);

      expect(records.length).toBeGreaterThan(0);

      for (let i = 0; i < records.length; i++) {
        const str = records[i];
        const matches = regex.test(str);
        expect(matches).toBe(true);
      }
    });
  }
});
