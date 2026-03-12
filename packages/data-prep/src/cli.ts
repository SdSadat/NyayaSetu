#!/usr/bin/env node
// =============================================================================
// Data Preparation CLI
// =============================================================================
// Command-line interface for the data preparation pipeline.
//
// Usage:
//   pnpm prepare-data <file-or-url> [options]
//   pnpm prepare-data --batch <manifest.json> [options]
//
// Options:
//   --type pdf|txt|url        Source type (auto-detected if omitted)
//   --act <name>              Act name hint (skip LLM classification)
//   --jurisdiction <scope>    Jurisdiction hint: "central" or "state:<name>"
//   --doc-type <type>         Document type hint: bare-act|supreme-court|high-court|state-rule
//   --source-url <url>        Source URL hint
//   --model <name>            Ollama model (default: mistral)
//   --offline                 Skip Ollama entirely (requires hints)
//   --output <path>           Output file path (default: stdout)
//   --batch <manifest.json>   Process multiple inputs from a JSON manifest
//   --dry-run                 Validate inputs without processing
//   --verbose                 Show detailed processing reports

// example: pnpm --filter @nyayasetu/data-prep run prepare-data S:\NyayaSetu\rawData\residentail_and_commercial_tenancy_act.pdf --source-url https://www.indiacode.nic.in/bitstream/123456789/21324/1/residential_and_commercial_tenancy_act%2C_2012.pdf --act "(RESIDENTIAL AND COMMERCIAL TENANCY) ACT, 2012" --jurisdiction central --output ./out.json
// =============================================================================
import { writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import type { RawInput, InputSourceType, InputHints } from './types.js';
import type { Jurisdiction } from '@nyayasetu/shared-types';
import { RawInputSchema } from './types.js';
import { createDefaultPipeline } from './defaults.js';
import { BareActFormatter } from './output/bare-act-output.js';
import { JudgmentFormatter } from './output/judgment-output.js';
import { StateRuleFormatter } from './output/state-rule-output.js';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  inputs: RawInput[];
  model?: string;
  offline: boolean;
  outputPath?: string;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2); // skip node + script
  const result: CliArgs = {
    inputs: [],
    offline: false,
    dryRun: false,
    verbose: false,
  };

  let location: string | undefined;
  let sourceType: InputSourceType | undefined;
  let batchFile: string | undefined;
  const hints: InputHints = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--type':
        sourceType = args[++i] as InputSourceType;
        break;
      case '--act':
        hints.actName = args[++i];
        break;
      case '--jurisdiction': {
        const val = args[++i];
        if (val === 'central') {
          hints.jurisdiction = { scope: 'central' };
        } else if (val.startsWith('state:')) {
          const state = val.slice(6) as Jurisdiction['state'];
          hints.jurisdiction = { scope: 'state', state };
        } else {
          console.error(`Invalid jurisdiction: "${val}". Use "central" or "state:<name>".`);
          process.exit(1);
        }
        break;
      }
      case '--doc-type':
        hints.documentType = args[++i] as InputHints['documentType'];
        break;
      case '--source-url':
        hints.sourceUrl = args[++i];
        break;
      case '--model':
        result.model = args[++i];
        break;
      case '--offline':
        result.offline = true;
        break;
      case '--output':
        result.outputPath = args[++i];
        break;
      case '--batch':
        batchFile = args[++i];
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--verbose':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('--')) {
          location = arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  if (batchFile) {
    // Batch mode: load inputs from JSON manifest
    result.inputs = loadBatchManifest(batchFile);
  } else if (location) {
    // Single input mode
    const resolvedType = sourceType ?? detectSourceType(location);
    const hasHints = Object.keys(hints).length > 0;
    result.inputs = [
      {
        sourceType: resolvedType,
        location: resolvedType === 'url' ? location : resolve(location),
        hints: hasHints ? hints : undefined,
      },
    ];
  }

  return result;
}

function detectSourceType(location: string): InputSourceType {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    return 'url';
  }
  const ext = extname(location).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  return 'txt';
}

function loadBatchManifest(filePath: string): RawInput[] {
  // Dynamic require for synchronous CLI usage
  const fs = require('node:fs');
  const raw = fs.readFileSync(resolve(filePath), 'utf-8');
  const manifest = JSON.parse(raw) as unknown[];

  if (!Array.isArray(manifest)) {
    console.error('Batch manifest must be a JSON array of RawInput objects.');
    process.exit(1);
  }

  return manifest.map((item, i) => {
    const parsed = RawInputSchema.safeParse(item);
    if (!parsed.success) {
      console.error(`Manifest entry ${i}: ${parsed.error.message}`);
      process.exit(1);
    }
    return parsed.data as RawInput;
  });
}

function printUsage(): void {
  console.log(`
NyayaSetu Data Preparation Pipeline

Usage:
  pnpm prepare-data <file-or-url> [options]
  pnpm prepare-data --batch <manifest.json> [options]

Options:
  --type pdf|txt|url        Source type (auto-detected if omitted)
  --act <name>              Act name hint (skip LLM metadata extraction)
  --jurisdiction <scope>    Jurisdiction: "central" or "state:<name>"
  --doc-type <type>         Document type: bare-act|supreme-court|high-court|state-rule
  --source-url <url>        Source URL for citation traceability
  --model <name>            Ollama model (default: mistral)
  --offline                 Skip Ollama (requires --act and --jurisdiction)
  --output <path>           Output file (default: stdout as JSON)
  --batch <manifest.json>   Process multiple inputs from JSON array
  --dry-run                 Validate inputs without processing
  --verbose                 Show detailed processing report
  -h, --help                Show this help message

Examples:
  pnpm prepare-data ./ipc-1860.pdf
  pnpm prepare-data ./ipc-1860.txt --act "Indian Penal Code, 1860" --jurisdiction central
  pnpm prepare-data https://indiankanoon.org/doc/1501234/ --type url
  pnpm prepare-data --batch ./manifest.json --output ./output/
  pnpm prepare-data ./bns-2023.pdf --offline --act "Bharatiya Nyaya Sanhita, 2023" --jurisdiction central --doc-type bare-act
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.inputs.length === 0) {
    console.error('No input specified. Use --help for usage information.');
    process.exit(1);
  }

  // Validate inputs in dry-run mode
  if (args.dryRun) {
    console.log(`Dry run: ${args.inputs.length} input(s) validated.`);
    for (const input of args.inputs) {
      console.log(`  - [${input.sourceType}] ${input.location}`);
      if (input.hints) console.log(`    Hints: ${JSON.stringify(input.hints)}`);
    }
    return;
  }

  // Build pipeline
  const pipeline = createDefaultPipeline(
    {
      ollamaModel: args.model,
      offlineMode: args.offline || undefined,
    },
    args.inputs[0]?.hints,
  );

  // Formatters for output
  const bareActFormatter = new BareActFormatter();
  const judgmentFormatter = new JudgmentFormatter();
  const stateRuleFormatter = new StateRuleFormatter();

  const outputs: unknown[] = [];

  for (let i = 0; i < args.inputs.length; i++) {
    const input = args.inputs[i];
    console.error(
      `[${i + 1}/${args.inputs.length}] Processing: ${input.location}`,
    );

    try {
      const prepared = await pipeline.prepare(input);

      // Format based on document type
      let formatted: unknown;
      switch (prepared.documentType) {
        case 'bare-act':
          formatted = bareActFormatter.format(prepared);
          break;
        case 'supreme-court':
        case 'high-court':
          formatted = judgmentFormatter.format(prepared);
          break;
        case 'state-rule':
          formatted = stateRuleFormatter.format(prepared);
          break;
        default:
          formatted = prepared;
      }

      outputs.push(formatted);

      if (args.verbose) {
        console.error(`  Type: ${prepared.documentType}`);
        console.error(`  Title: ${prepared.metadata.title}`);
        console.error(`  Stages: ${prepared.processingReport.stagesExecuted.join(' → ')}`);
        console.error(`  Timings: ${JSON.stringify(prepared.processingReport.timings)}`);
        if (prepared.processingReport.warnings.length > 0) {
          console.error(`  Warnings:`);
          for (const w of prepared.processingReport.warnings) {
            console.error(`    - ${w}`);
          }
        }
        console.error(`  Ollama used: ${prepared.processingReport.ollamaUsed}`);
      }

      console.error(`  ✓ Done: ${prepared.metadata.title}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error: ${message}`);

      if (args.inputs.length === 1) {
        process.exit(1);
      }
    }
  }

  // Output results
  const json = JSON.stringify(
    outputs.length === 1 ? outputs[0] : outputs,
    null,
    2,
  );

  if (args.outputPath) {
    await writeFile(resolve(args.outputPath), json, 'utf-8');
    console.error(`Output written to: ${args.outputPath}`);
  } else {
    console.log(json);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
