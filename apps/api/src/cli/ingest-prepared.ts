#!/usr/bin/env node
// =============================================================================
// CLI: Ingest Prepared Document (data-prep → ingestion bridge)
// =============================================================================
// Reads JSON output from the @nyayasetu/data-prep pipeline and ingests it
// into the vector database. This bridges the two systems without requiring
// a direct code dependency.
//
// Usage:
//   pnpm ingest:prepared <json-file>
//   pnpm ingest:prepared --stdin
//   cat prepared.json | pnpm ingest:prepared --stdin
//
// The JSON file should be the output of `pnpm prepare-data`, containing
// either a single object or an array of objects with these fields:
//   { text, act/title, jurisdiction, sourceUrl, sourceType? }
// =============================================================================

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { LegalSourceType, Jurisdiction } from '@nyayasetu/shared-types';
import { ingestPreparedDocument } from '../services/ingestion.js';
import type { IngestPreparedDocumentParams } from '../services/ingestion.js';

/**
 * Shape of data-prep output JSON. Supports both BareActOutput and
 * JudgmentOutput/StateRuleOutput shapes.
 */
interface PreparedJson {
  text: string;
  act?: string;
  title?: string;
  shortName?: string;
  sourceType?: LegalSourceType;
  jurisdiction: Jurisdiction;
  sourceUrl: string;
  caseCitation?: string;
  court?: string;
  dateOfJudgment?: string;
  year?: number;
}

function toIngestParams(doc: PreparedJson): IngestPreparedDocumentParams {
  const title = doc.title ?? doc.act;
  if (!title) {
    throw new Error('Document must have "title" or "act" field.');
  }

  // Infer sourceType from fields if not explicitly provided
  let sourceType: LegalSourceType = doc.sourceType ?? 'bare-act';
  if (!doc.sourceType) {
    if (doc.court?.toLowerCase().includes('supreme')) {
      sourceType = 'supreme-court';
    } else if (doc.court?.toLowerCase().includes('high')) {
      sourceType = 'high-court';
    } else if (doc.jurisdiction.scope === 'state' && !doc.year) {
      sourceType = 'state-rule';
    }
  }

  return {
    text: doc.text,
    title,
    sourceType,
    jurisdiction: doc.jurisdiction,
    sourceUrl: doc.sourceUrl,
  };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  let jsonStr: string;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  pnpm ingest:prepared <json-file>       Ingest from data-prep JSON output file
  pnpm ingest:prepared --stdin            Read JSON from stdin (pipe from data-prep)

The JSON should contain the output of "pnpm prepare-data":
  { text, act/title, jurisdiction, sourceUrl, ... }

Or an array of such objects for batch ingestion.

Example workflow:
  pnpm --filter data-prep prepare-data ./ipc.pdf --output prepared.json
  pnpm --filter api ingest:prepared prepared.json
`);
    process.exit(0);
  }

  if (args.includes('--stdin')) {
    jsonStr = await readStdin();
  } else if (args[0] && !args[0].startsWith('--')) {
    jsonStr = await readFile(resolve(args[0]), 'utf-8');
  } else {
    console.error('Provide a JSON file path or use --stdin. Use --help for usage.');
    process.exit(1);
  }

  let parsed: PreparedJson | PreparedJson[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse JSON input.');
    process.exit(1);
  }

  const docs = Array.isArray(parsed) ? parsed : [parsed];
  console.log(`Ingesting ${docs.length} prepared document(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const title = doc.title ?? doc.act ?? `document-${i + 1}`;

    try {
      const params = toIngestParams(doc);
      console.log(`[${i + 1}/${docs.length}] Ingesting: "${params.title}" (${params.sourceType})`);

      const result = await ingestPreparedDocument(params);

      if (result.success) {
        console.log(`  ✓ ${result.chunksIngested} chunks ingested`);
        successCount++;
      } else {
        console.error(`  ✗ Failed:`);
        for (const err of result.errors) {
          console.error(`    - ${err}`);
        }
        failCount++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error processing "${title}": ${message}`);
      failCount++;
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${failCount} failed.`);
  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
