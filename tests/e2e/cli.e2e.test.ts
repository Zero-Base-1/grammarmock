import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

describe('E2E: Command-Line Interface (CLI)', () => {
  const cliPath = path.resolve(process.cwd(), 'bin/grammarmock.js');
  const tempFilesToClean: string[] = [];

  function runCLI(args: string[], options: { expectSuccess?: boolean } = {}) {
    const { expectSuccess = true } = options;
    const res = spawnSync(process.execPath, [cliPath, ...args], {
      encoding: 'utf-8',
    });

    if (expectSuccess && res.status !== 0) {
      throw new Error(
        `CLI exited with code ${res.status}.\nStderr: ${res.stderr}\nStdout: ${res.stdout}`
      );
    }
    return res;
  }

  afterEach(() => {
    while (tempFilesToClean.length > 0) {
      const filePath = tempFilesToClean.pop()!;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  it('runs default CLI generation with 10 plain text records', () => {
    const res = runCLI(['^[A-Z]{3}-\\d{4}$']);
    expect(res.status).toBe(0);

    const lines = res.stdout.trim().split('\n');
    expect(lines).toHaveLength(10);
    for (const line of lines) {
      expect(line.trim()).toMatch(/^[A-Z]{3}-\d{4}$/);
    }
  });

  it('respects -n / --count option', () => {
    const res = runCLI(['^[A-Z]{2}\\d{2}$', '-n', '5']);
    const lines = res.stdout.trim().split('\n');
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(line.trim()).toMatch(/^[A-Z]{2}\d{2}$/);
    }
  });

  it('outputs valid JSON format with -f json', () => {
    const res = runCLI(['^USER-[0-9]{3}$', '-n', '4', '-f', 'json']);
    expect(res.status).toBe(0);

    const parsed = JSON.parse(res.stdout.trim());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(4);
    for (const item of parsed) {
      expect(item).toMatch(/^USER-[0-9]{3}$/);
    }
  });

  it('outputs valid CSV format with -f csv', () => {
    const res = runCLI(['^SKU-[A-Z]{2}$', '-n', '3', '-f', 'csv']);
    expect(res.status).toBe(0);

    const lines = res.stdout.trim().split('\n');
    expect(lines[0].trim()).toBe('value');
    expect(lines).toHaveLength(4); // header + 3 rows
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i].trim()).toMatch(/^SKU-[A-Z]{2}$/);
    }
  });

  it('generates identical output across separate CLI runs when given identical --seed', () => {
    const args = ['^[A-Z]{4}-\\d{4}$', '-n', '5', '--seed', '777'];
    const run1 = runCLI(args);
    const run2 = runCLI(args);

    expect(run1.stdout).toBe(run2.stdout);
  });

  it('generates chronological Shortlex order with --chronological / -c', () => {
    const res = runCLI(['^[0-1]{2}$', '-n', '4', '-c']);
    const lines = res.stdout.trim().split('\n').map((l) => l.trim());
    expect(lines).toEqual(['00', '01', '10', '11']);
  });

  it('generates chronological Shortlex order with --sequential alias', () => {
    const res = runCLI(['^[A-B]{2}$', '-n', '4', '--sequential']);
    const lines = res.stdout.trim().split('\n').map((l) => l.trim());
    expect(lines).toEqual(['AA', 'AB', 'BA', 'BB']);
  });

  it('writes output to file using -o / --output', () => {
    const tempFile = path.resolve(process.cwd(), `test-out-${Date.now()}.txt`);
    tempFilesToClean.push(tempFile);

    const res = runCLI(['^[0-9]{5}$', '-n', '7', '-o', tempFile]);
    expect(res.status).toBe(0);
    expect(res.stderr).toContain(`Wrote 7 records to ${tempFile}`);

    expect(fs.existsSync(tempFile)).toBe(true);
    const content = fs.readFileSync(tempFile, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(7);
  });

  it('displays AST and Grammar when --show-ast and --show-grammar are passed', () => {
    const res = runCLI(['^a|b$', '-n', '1', '--show-ast', '--show-grammar']);
    expect(res.stdout).toContain('=== Abstract Syntax Tree (AST) ===');
    expect(res.stdout).toContain('=== Formal Right-Linear Grammar ===');
    expect(res.stdout).toContain('Production Rules (R):');
  });

  it('verifies compliance with --verify flag and prints verification badge', () => {
    const res = runCLI(['^[A-Z]{3}-\\d{4}$', '-n', '10', '--verify']);
    expect(res.status).toBe(0);
    expect(res.stderr).toContain('100% Compliance Verified');
  });

  it('fails with exit code 1 on non-regular lookahead assertions', () => {
    const res = runCLI(['(?=abc)def'], { expectSuccess: false });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Lookaround assertions');
  });

  it('fails with exit code 1 on non-regular backreferences', () => {
    const res = runCLI(['([a-z])\\1'], { expectSuccess: false });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Backreferences');
  });

  it('fails with exit code 1 on invalid regex syntax', () => {
    const res = runCLI(['[z-a]'], { expectSuccess: false });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Character class range out of order');
  });
});
