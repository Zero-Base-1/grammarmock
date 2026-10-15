import { RightLinearGrammar, ProductionRule } from '../grammar/types.js';
import { getSortedCharacters } from './sampler.js';

export interface SequentialOptions {
  maxRepeat?: number;
  maxTotalSteps?: number;
}

export class SequentialGenerator {
  private grammar: RightLinearGrammar;
  private minDistanceToAccept = new Map<string, number>();

  constructor(grammar: RightLinearGrammar) {
    this.grammar = grammar;
    this.computeDistancesToAccept();
  }

  private computeDistancesToAccept(): void {
    const reverseAdj = new Map<string, string[]>();
    const queue: string[] = [];

    for (const v of this.grammar.variables) {
      reverseAdj.set(v, []);
    }

    for (const [v, rules] of this.grammar.productions.entries()) {
      let hasEpsilon = false;
      for (const rule of rules) {
        if (rule.type === 'epsilon') {
          hasEpsilon = true;
        } else {
          const next = rule.nextVariable;
          const list = reverseAdj.get(next) || [];
          list.push(v);
          reverseAdj.set(next, list);
        }
      }

      if (hasEpsilon) {
        this.minDistanceToAccept.set(v, 0);
        queue.push(v);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = this.minDistanceToAccept.get(current)!;
      const predecessors = reverseAdj.get(current) || [];

      for (const pred of predecessors) {
        if (!this.minDistanceToAccept.has(pred)) {
          this.minDistanceToAccept.set(pred, currentDist + 1);
          queue.push(pred);
        }
      }
    }
  }

  /**
   * Generates `count` strings in chronological / canonical Shortlex order
   * (ordered first by length, then alphabetically/lexicographically).
   */
  public generateBulk(count: number, options: SequentialOptions = {}): string[] {
    const results: string[] = [];
    const maxRepeat = options.maxRepeat ?? 5;
    const maxLen =
      options.maxTotalSteps ?? (maxRepeat * Math.max(1, this.grammar.variables.length) + 50);

    const startMinDist = this.minDistanceToAccept.get(this.grammar.startVariable) ?? 0;

    for (let targetLength = startMinDist; targetLength <= maxLen; targetLength++) {
      this.dfs(
        this.grammar.startVariable,
        targetLength,
        '',
        new Map<string, number>(),
        maxRepeat,
        results,
        count
      );

      if (results.length >= count) {
        break;
      }
    }

    return results.slice(0, count);
  }

  private dfs(
    currentVar: string,
    remainingLength: number,
    prefix: string,
    visitCounts: Map<string, number>,
    maxRepeat: number,
    results: string[],
    targetCount: number
  ): void {
    if (results.length >= targetCount) {
      return;
    }

    const minNeeded = this.minDistanceToAccept.get(currentVar) ?? Infinity;
    if (minNeeded > remainingLength) {
      return;
    }

    const rules = this.grammar.productions.get(currentVar) || [];

    if (remainingLength === 0) {
      const hasEpsilon = rules.some((r) => r.type === 'epsilon');
      if (hasEpsilon) {
        results.push(prefix);
      }
      return;
    }

    const stepRules = rules.filter(
      (r): r is Extract<ProductionRule, { type: 'step' }> => r.type === 'step'
    );
    const unitRules = rules.filter(
      (r): r is Extract<ProductionRule, { type: 'unit' }> => r.type === 'unit'
    );

    for (const rule of unitRules) {
      const visits = visitCounts.get(rule.nextVariable) || 0;
      if (visits < maxRepeat) {
        visitCounts.set(rule.nextVariable, visits + 1);
        this.dfs(
          rule.nextVariable,
          remainingLength,
          prefix,
          visitCounts,
          maxRepeat,
          results,
          targetCount
        );
        visitCounts.set(rule.nextVariable, visits);
        if (results.length >= targetCount) return;
      }
    }

    const transitions: Array<{ char: string; nextVariable: string }> = [];

    for (const rule of stepRules) {
      const chars = getSortedCharacters(rule.terminal);
      for (const ch of chars) {
        transitions.push({ char: ch, nextVariable: rule.nextVariable });
      }
    }

    transitions.sort((a, b) => a.char.localeCompare(b.char));

    for (const { char, nextVariable } of transitions) {
      const visits = visitCounts.get(nextVariable) || 0;
      if (visits < maxRepeat) {
        visitCounts.set(nextVariable, visits + 1);
        this.dfs(
          nextVariable,
          remainingLength - 1,
          prefix + char,
          visitCounts,
          maxRepeat,
          results,
          targetCount
        );
        visitCounts.set(nextVariable, visits);
        if (results.length >= targetCount) return;
      }
    }
  }
}
