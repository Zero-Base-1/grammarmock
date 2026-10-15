import { RightLinearGrammar, ProductionRule } from '../grammar/types.js';
import { PRNG } from './prng.js';
import { sampleTerminal } from './sampler.js';
import { SequentialGenerator } from './sequential.js';

export type GenerationMode = 'random' | 'chronological' | 'sequential';

export interface GenerationOptions {
  maxRepeat?: number;
  seed?: number;
  maxTotalSteps?: number;
  mode?: GenerationMode;
}

export class MockGenerator {
  private grammar: RightLinearGrammar;
  private prng: PRNG;
  private minDistanceToAccept = new Map<string, number>();
  private sequentialGen?: SequentialGenerator;

  constructor(grammar: RightLinearGrammar, seed?: number) {
    this.grammar = grammar;
    this.prng = new PRNG(seed);
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

  public generate(options: GenerationOptions = {}): string {
    if (options.mode === 'chronological' || options.mode === 'sequential') {
      const bulk = this.generateBulk(1, options);
      return bulk[0] ?? '';
    }

    const maxRepeat = options.maxRepeat ?? 5;
    const maxTotalSteps = options.maxTotalSteps ?? 2000;

    let currentVar = this.grammar.startVariable;
    const visitCounts = new Map<string, number>();
    const chars: string[] = [];

    let totalSteps = 0;

    while (totalSteps < maxTotalSteps) {
      totalSteps++;
      const visits = (visitCounts.get(currentVar) || 0) + 1;
      visitCounts.set(currentVar, visits);

      const rules = this.grammar.productions.get(currentVar) || [];
      if (rules.length === 0) {
        break;
      }

      let candidates: ProductionRule[] = rules;

      if (visits >= maxRepeat) {
        const epsilonRule = rules.find((r) => r.type === 'epsilon');
        if (epsilonRule) {
          break;
        }

        const currentDist = this.minDistanceToAccept.get(currentVar) ?? Infinity;
        const progressRules = rules.filter((r) => {
          if (r.type === 'epsilon') return true;
          const nextDist = this.minDistanceToAccept.get(r.nextVariable) ?? Infinity;
          return nextDist < currentDist || r.nextVariable !== currentVar;
        });

        if (progressRules.length > 0) {
          candidates = progressRules;
        }
      }

      const chosenRule = this.prng.choice(candidates);

      if (chosenRule.type === 'epsilon') {
        break;
      }

      if (chosenRule.type === 'unit') {
        currentVar = chosenRule.nextVariable;
        continue;
      }

      if (chosenRule.type === 'step') {
        const char = sampleTerminal(chosenRule.terminal, this.prng);
        chars.push(char);
        currentVar = chosenRule.nextVariable;
      }
    }

    return chars.join('');
  }

  public generateBulk(count: number, options: GenerationOptions = {}): string[] {
    if (options.mode === 'chronological' || options.mode === 'sequential') {
      if (!this.sequentialGen) {
        this.sequentialGen = new SequentialGenerator(this.grammar);
      }
      return this.sequentialGen.generateBulk(count, {
        maxRepeat: options.maxRepeat,
        maxTotalSteps: options.maxTotalSteps,
      });
    }

    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.generate(options));
    }
    return results;
  }
}
