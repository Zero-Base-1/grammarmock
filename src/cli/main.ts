import { Command } from 'commander';
import * as fs from 'node:fs';
import { Parser } from '../parser/parser.js';
import { printAST } from '../ast/printer.js';
import { ThompsonBuilder } from '../automata/nfa.js';
import { nfaToRightLinearGrammar } from '../grammar/converter.js';
import { formatGrammar } from '../grammar/formatter.js';
import { MockGenerator } from '../generator/engine.js';
import { formatOutput, OutputFormat } from './formatters.js';

export function runCLI(argv = process.argv): void {
  const program = new Command();

  program
    .name('grammarmock')
    .description('Automata-Driven Procedural Mock Data Generator')
    .version('1.0.0')
    .argument('<pattern>', 'Regular expression pattern (e.g. "^[A-Z]{3}-\\d{4}$")')
    .option('-n, --count <number>', 'Number of records to generate', (v) => parseInt(v, 10), 10)
    .option('-f, --format <format>', 'Output format: text, json, csv', 'text')
    .option('-o, --output <file>', 'Output file path (defaults to stdout)')
    .option('-s, --seed <number>', 'PRNG seed for reproducible generation', (v) => parseInt(v, 10))
    .option(
      '-m, --max-repeat <number>',
      'Maximum repetition depth for unbounded quantifiers (*, +, {n,})',
      (v) => parseInt(v, 10),
      5
    )
    .option('--show-ast', 'Print the parsed Abstract Syntax Tree')
    .option('--show-grammar', 'Print the formal Right-Linear Grammar productions')
    .option('--raw-grammar', 'Show raw grammar with epsilon unit rules before normalization')
    .option('--verify', 'Validate each generated string against native RegExp fullmatch')
    .action((pattern: string, options) => {
      try {
        // 1. AST Parsing
        const ast = Parser.parse(pattern);
        if (options.showAst) {
          console.log('\n=== Abstract Syntax Tree (AST) ===');
          console.log(printAST(ast));
        }

        // 2. Automata & Grammar Conversion
        const builder = new ThompsonBuilder();
        const nfa = builder.build(ast);
        const grammar = nfaToRightLinearGrammar(nfa, !options.rawGrammar);

        if (options.showGrammar) {
          console.log('\n=== Formal Right-Linear Grammar ===');
          console.log(formatGrammar(grammar));
          console.log('');
        }

        // 3. Procedural Generation
        const generator = new MockGenerator(grammar, options.seed);
        const records = generator.generateBulk(options.count, {
          maxRepeat: options.maxRepeat,
        });

        // 4. Verification Check (--verify)
        if (options.verify) {
          let testPattern = pattern;
          // Normalize anchors for standard fullmatch testing
          if (!testPattern.startsWith('^')) testPattern = '^' + testPattern;
          if (!testPattern.endsWith('$')) testPattern = testPattern + '$';

          const regex = new RegExp(testPattern);
          let failureCount = 0;

          for (let i = 0; i < records.length; i++) {
            const rec = records[i];
            if (!regex.test(rec)) {
              console.error(`❌ Verification failed on record #${i + 1}: "${rec}"`);
              failureCount++;
            }
          }

          if (failureCount === 0) {
            console.error(`✔ 100% Compliance Verified (${records.length}/${records.length} records matched /${testPattern}/)`);
          } else {
            console.error(`❌ Verification failed: ${failureCount} of ${records.length} records did not match.`);
            process.exit(1);
          }
        }

        // 5. Output Formatting & Delivery
        const formatted = formatOutput(records, options.format as OutputFormat);

        if (options.output) {
          fs.writeFileSync(options.output, formatted, 'utf-8');
          console.error(`✔ Wrote ${records.length} records to ${options.output}`);
        } else {
          console.log(formatted);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(`Error: ${err.message}`);
        } else {
          console.error('Unknown error occurred', err);
        }
        process.exit(1);
      }
    });

  program.parse(argv);
}
