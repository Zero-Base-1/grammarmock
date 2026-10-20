import { describe, it, expect } from 'vitest';
import { generateBulk } from '../../src/index.js';

describe('E2E: Web Studio Presets Catalog', () => {
  const PRESETS = [
    // Identity & HR
    { name: 'Employee ID', pattern: '^[A-Z]{3}-\\d{4}$', category: 'Identity & HR' },
    { name: 'Email Handle', pattern: '^[a-z]{3,8}\\.[a-z]{3,8}@[a-z]{3,8}\\.(com|org|net)$', category: 'Identity & HR' },

    // Commerce & Inventory
    { name: 'Product SKU', pattern: '^[A-Z]{2}-[0-9]{4}-[A-Z]{2}$', category: 'Commerce & Inventory' },
    { name: 'Credit Card', pattern: '^4[0-9]{3}-[0-9]{4}-[0-9]{4}-[0-9]{4}$', category: 'Commerce & Inventory' },
    { name: 'Invoice ID', pattern: '^INV-202[0-9]-[0-9]{5}$', category: 'Commerce & Inventory' },

    // Software & Development
    { name: 'UUID v4', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', category: 'Software & Dev' },
    { name: 'SemVer 2.0', pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-(alpha|beta|rc)\\.[1-9])?$', category: 'Software & Dev' },
    { name: 'API Route', pattern: '^/(GET|POST|PUT)/api/v[1-3]/[a-z]{3,8}$', category: 'Software & Dev' },
    { name: 'Hex Color', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', category: 'Software & Dev' },

    // Network & Infrastructure
    { name: 'IPv4 CIDR', pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(1[6-9]|2[0-9]|3[0-2])$', category: 'Network & Infra' },
    { name: 'MAC Address', pattern: '^([0-9A-F]{2}:){5}[0-9A-F]{2}$', category: 'Network & Infra' },
    { name: 'ISO Date', pattern: '^202[0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$', category: 'Network & Infra' },
  ];

  for (const preset of PRESETS) {
    it(`end-to-end generates and verifies valid data for preset "${preset.name}" (${preset.category})`, () => {
      const records = generateBulk(preset.pattern, 20, { maxRepeat: 3 });
      expect(records).toHaveLength(20);

      const regex = new RegExp(preset.pattern);
      for (const rec of records) {
        expect(regex.test(rec)).toBe(true);
      }
    });
  }
});
