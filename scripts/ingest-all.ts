#!/usr/bin/env node
// =============================================================================
// Batch Ingest — Load all prepared JSONs into ChromaDB
// =============================================================================
// Reads every .json file from data/prepared/ and ingests them into the vector
// database (ChromaDB) using the existing ingest:prepared pipeline.
//
// Usage:
//   pnpm ingest:all                  # Ingest all prepared JSONs
//   pnpm ingest:all --force          # Re-ingest even if already done
//
// Prerequisites:
//   1. ChromaDB running: chroma run --path ./chroma-data
//   2. AWS credentials set (for Nova embeddings)
//   3. Prepared JSONs in data/prepared/
// =============================================================================

import { readdir, readFile, access, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const PREPARED_DIR = resolve(ROOT, 'data/prepared');
const TRACKER_FILE = resolve(PREPARED_DIR, '.ingested');

interface IngestedTracker {
  files: Record<string, { ingestedAt: string; chunks: number }>;
}

async function loadTracker(): Promise<IngestedTracker> {
  try {
    const raw = await readFile(TRACKER_FILE, 'utf-8');
    return JSON.parse(raw) as IngestedTracker;
  } catch {
    return { files: {} };
  }
}

async function saveTracker(tracker: IngestedTracker): Promise<void> {
  await writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2), 'utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm ingest:all [--force]

Ingests all prepared JSON files from data/prepared/ into ChromaDB.

Options:
  --force    Re-ingest files that were already ingested

Prerequisites:
  1. ChromaDB running:  chroma run --path ./chroma-data
  2. AWS credentials set in .env (for Nova embeddings)
  3. Prepared JSONs in data/prepared/
`);
    process.exit(0);
  }

  // Dynamically import ingestion from the API package so it can load its own
  // configuration and environment handling.
  const { ingestPreparedDocument } = await import(
    '../apps/api/src/services/ingestion.js'
  );

  // Find all JSON files
  let files: string[];
  try {
    files = (await readdir(PREPARED_DIR)).filter(
      (f) => extname(f) === '.json' && !f.startsWith('.'),
    );
  } catch {
    console.error(`Directory not found: ${PREPARED_DIR}`);
    console.error('Run "pnpm prepare:all" first to generate prepared JSONs.');
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No prepared JSON files found in data/prepared/');
    return;
  }

  const tracker = await loadTracker();

  // Filter already-ingested files unless --force
  const toIngest = force
    ? files
    : files.filter((f) => !tracker.files[f]);

  if (toIngest.length === 0) {
    console.log(
      `All ${files.length} files already ingested. Use --force to re-ingest.`,
    );
    return;
  }

  console.log(
    `Ingesting ${toIngest.length} of ${files.length} prepared JSON(s)...\n`,
  );

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toIngest.length; i++) {
    const file = toIngest[i];
    const filePath = resolve(PREPARED_DIR, file);

    let doc: {
      text: string;
      act?: string;
      title?: string;
      sourceType?: string;
      jurisdiction: { scope: string; state?: string };
      sourceUrl: string;
      court?: string;
      year?: number;
    };

    try {
      const raw = await readFile(filePath, 'utf-8');
      doc = JSON.parse(raw);
    } catch {
      console.error(`[${i + 1}/${toIngest.length}] ✗ Failed to parse: ${file}`);
      failed++;
      continue;
    }

    const title = doc.title ?? doc.act ?? file;

    // Infer sourceType
    let sourceType = doc.sourceType ?? 'bare-act';
    if (!doc.sourceType) {
      if (doc.court?.toLowerCase().includes('supreme')) sourceType = 'supreme-court';
      else if (doc.court?.toLowerCase().includes('high')) sourceType = 'high-court';
      else if (doc.jurisdiction.scope === 'state' && !doc.year) sourceType = 'state-rule';
    }

    console.log(
      `[${i + 1}/${toIngest.length}] Ingesting: "${title}" (${sourceType})`,
    );

    try {
      const result = await ingestPreparedDocument({
        text: doc.text,
        title,
        sourceType: sourceType as 'bare-act' | 'supreme-court' | 'high-court' | 'state-rule',
        jurisdiction: doc.jurisdiction as { scope: 'central' | 'state'; state?: string },
        sourceUrl: doc.sourceUrl ?? '',
      });

      if (result.success) {
        console.log(`  ✓ ${result.chunksIngested} chunks ingested`);
        tracker.files[file] = {
          ingestedAt: new Date().toISOString(),
          chunks: result.chunksIngested,
        };
        await saveTracker(tracker);
        success++;
      } else {
        console.error(`  ✗ Failed:`);
        for (const err of result.errors) console.error(`    - ${err}`);
        failed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Error: ${message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} ingested, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
