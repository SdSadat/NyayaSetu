#!/usr/bin/env node
// =============================================================================
// CLI: Ingest Bare Act from File
// =============================================================================
// Usage: pnpm ingest <file-path> --act <name> --jurisdiction <scope> [--source-url <url>]
//
// Example:
//   pnpm ingest ./data/bare-acts/ipc-1860.txt \
//     --act "Indian Penal Code, 1860" \
//     --jurisdiction central \
//     --source-url "https://indiacode.nic.in/handle/123456789/2263"
// =============================================================================

import 'dotenv/config';
import type { Jurisdiction } from '@nyayasetu/shared-types';
import { ingestBareAct } from '../services/ingestion.js';

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  let filePath: string | undefined;
  let act: string | undefined;
  let jurisdictionStr: string | undefined;
  let sourceUrl: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--act':
        act = args[++i];
        break;
      case '--jurisdiction':
        jurisdictionStr = args[++i];
        break;
      case '--source-url':
        sourceUrl = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: pnpm ingest <file-path> --act <name> --jurisdiction <scope> [--source-url <url>]

Options:
  --act <name>              Name of the act (e.g. "Indian Penal Code, 1860")
  --jurisdiction <scope>    "central" or "state:<name>" (e.g. "state:west-bengal")
  --source-url <url>        Source URL for citation traceability
  -h, --help                Show this help
`);
        process.exit(0);
        break;
      default:
        if (!args[i].startsWith('--')) {
          filePath = args[i];
        }
    }
  }

  if (!filePath || !act || !jurisdictionStr) {
    console.error('Missing required arguments. Use --help for usage.');
    process.exit(1);
  }

  let jurisdiction: Jurisdiction;
  if (jurisdictionStr === 'central') {
    jurisdiction = { scope: 'central' };
  } else if (jurisdictionStr.startsWith('state:')) {
    jurisdiction = {
      scope: 'state',
      state: jurisdictionStr.slice(6) as Jurisdiction['state'],
    };
  } else {
    console.error(`Invalid jurisdiction: "${jurisdictionStr}". Use "central" or "state:<name>".`);
    process.exit(1);
  }

  return { filePath, act, jurisdiction, sourceUrl };
}

async function main() {
  const { filePath, act, jurisdiction, sourceUrl } = parseArgs(process.argv);

  console.log(`Ingesting bare act: "${act}"`);
  console.log(`  File: ${filePath}`);
  console.log(`  Jurisdiction: ${JSON.stringify(jurisdiction)}`);
  if (sourceUrl) console.log(`  Source URL: ${sourceUrl}`);

  const result = await ingestBareAct({
    filePath,
    act,
    jurisdiction,
    sourceUrl,
  });

  if (result.success) {
    console.log(`\nSuccess: ${result.chunksIngested} chunks ingested.`);
  } else {
    console.error(`\nFailed:`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
