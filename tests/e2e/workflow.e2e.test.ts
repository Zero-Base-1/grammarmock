import { describe, it, expect } from 'vitest';
import { generateBulk } from '../../src/index.js';
import { formatOutput } from '../../src/cli/formatters.js';

describe('E2E: Complete User Data Workflows', () => {
  it('workflow: generates, serializes to JSON, deserializes, and verifies every record', () => {
    const pattern = '^[A-Z]{3}-\\d{4}$';
    const rawRecords = generateBulk(pattern, 50, { seed: 42 });

    // Format to JSON
    const jsonString = formatOutput(rawRecords, 'json');
    const parsedRecords: string[] = JSON.parse(jsonString);

    expect(parsedRecords).toHaveLength(50);
    const regex = new RegExp(pattern);
    for (const r of parsedRecords) {
      expect(regex.test(r)).toBe(true);
    }
  });

  it('workflow: generates, serializes to CSV, parses CSV rows, and verifies integrity', () => {
    const pattern = '^ID-[0-9]{5}$';
    const rawRecords = generateBulk(pattern, 40, { seed: 101 });

    // Format to CSV
    const csvString = formatOutput(rawRecords, 'csv');
    const lines = csvString.trim().split('\n');

    expect(lines[0]).toBe('value');
    expect(lines.length).toBe(41);

    const regex = new RegExp(pattern);
    for (let i = 1; i < lines.length; i++) {
      expect(regex.test(lines[i])).toBe(true);
    }
  });

  it('workflow: database seeding simulation with deterministic reproduction', () => {
    const pattern = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'; // UUID v4
    const seed = 55555;

    // Simulation: generate fixtures for staging database
    const stagingFixtures = generateBulk(pattern, 20, { seed });

    // Later: test suite re-generates fixtures using same seed
    const testFixtures = generateBulk(pattern, 20, { seed });

    expect(stagingFixtures).toEqual(testFixtures);
  });
});
