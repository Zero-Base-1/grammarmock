import { describe, it, expect } from 'vitest';
import { generateBulk, generateMock } from '../../src/index.js';

describe('Integration: Complex Regex Edge Cases', () => {
  it('handles empty pattern and empty matches', () => {
    const res = generateMock('');
    expect(res).toBe('');

    const resAnchors = generateMock('^$');
    expect(resAnchors).toBe('');
  });

  it('handles zero repetitions {0}', () => {
    const res = generateMock('^a{0}b$');
    expect(res).toBe('b');
  });

  it('bounds unbounded Kleene star repetitions according to maxRepeat option', () => {
    const maxRepeat = 3;
    const records = generateBulk('^a*$', 30, { maxRepeat });
    for (const r of records) {
      expect(r.length).toBeLessThanOrEqual(maxRepeat);
      if (r.length > 0) {
        expect(r).toMatch(/^a+$/);
      }
    }
  });

  it('handles deeply nested parenthesized groups and alternations', () => {
    const pattern = '^(((a|b)|(c|d))|((e|f)|(g|h)))$';
    const records = generateBulk(pattern, 40);
    const validLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (const r of records) {
      expect(validLetters).toContain(r);
    }
  });

  it('handles escaped regex symbols as literal characters', () => {
    const pattern = '^\\^\\$\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|\\\\$';
    const res = generateMock(pattern);
    expect(res).toBe('^$*+?()[]{}|\\');
  });

  it('generates large batch (500 records) without memory or performance degradation', () => {
    const pattern = '^[A-Z]{3}-\\d{4}$';
    const start = performance.now();
    const records = generateBulk(pattern, 500);
    const duration = performance.now() - start;

    expect(records).toHaveLength(500);
    expect(duration).toBeLessThan(1500); // 500 records within 1.5 seconds
  });
});
