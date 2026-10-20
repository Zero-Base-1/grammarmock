import { describe, it, expect } from 'vitest';
import { formatOutput } from '../../src/cli/formatters.js';

describe('Unit: CLI Output Formatters', () => {
  const sampleRecords = ['ABC-1001', 'DEF-2002', 'GHI-3003'];

  it('formats text as newline-delimited lines', () => {
    const output = formatOutput(sampleRecords, 'text');
    expect(output).toBe('ABC-1001\nDEF-2002\nGHI-3003');
  });

  it('formats json as formatted JSON array', () => {
    const output = formatOutput(sampleRecords, 'json');
    const parsed = JSON.parse(output);
    expect(parsed).toEqual(sampleRecords);
  });

  it('formats standard csv with header and row values', () => {
    const output = formatOutput(sampleRecords, 'csv');
    const lines = output.split('\n');
    expect(lines[0]).toBe('value');
    expect(lines[1]).toBe('ABC-1001');
    expect(lines[2]).toBe('DEF-2002');
    expect(lines[3]).toBe('GHI-3003');
  });

  it('escapes quotes, commas, and newlines in csv values', () => {
    const complexRecords = ['hello, world', 'he said "hi"', 'line1\nline2'];
    const output = formatOutput(complexRecords, 'csv');
    const lines = output.split('\n');

    expect(lines[0]).toBe('value');
    expect(output).toContain('"hello, world"');
    expect(output).toContain('"he said ""hi"""');
  });
});
