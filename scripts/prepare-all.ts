#!/usr/bin/env node
// =============================================================================
// Batch PDF → Prepared JSON Converter
// =============================================================================
// Converts all PDFs in data/raw-pdfs/ into prepared JSON files in
// data/prepared/. Uses the @nyayasetu/data-prep pipeline in offline mode
// (no Ollama required) with metadata from an optional manifest file.
//
// Usage:
//   pnpm prepare:all                          # Convert all PDFs
//   pnpm prepare:all --manifest manifest.json # Use manifest for metadata
//
// Manifest format (data/raw-pdfs/manifest.json):
//   [
//     {
//       "file": "motor-vehicles-act-1988.pdf",
//       "act": "Motor Vehicles Act, 1988",
//       "jurisdiction": "central",
//       "sourceUrl": "https://indiacode.nic.in/...",
//       "docType": "bare-act"
//     }
//   ]
//
// PDFs without a manifest entry are processed with auto-detection (requires
// Ollama running locally) or skipped in offline mode.
// =============================================================================

import { readdir, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, basename, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const RAW_DIR = resolve(ROOT, 'data/raw-pdfs');
const OUT_DIR = resolve(ROOT, 'data/prepared');

function getTseRunner(): { command: string; args: string[] } {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, 'exec', 'tsx'],
    };
  }

  return {
    command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['exec', 'tsx'],
  };
}

interface ManifestEntry {
  file: string;
  act: string;
  jurisdiction: string; // "central" or "state:west-bengal"
  sourceUrl?: string;
  docType?: string;     // "bare-act" | "supreme-court" | "high-court" | "state-rule"
}

function stripRepeatedPdfExtension(fileName: string): string {
  let stem = fileName;
  while (extname(stem).toLowerCase() === '.pdf') {
    stem = basename(stem, extname(stem));
  }
  return stem;
}

function normalizePdfFileName(fileName: string): string {
  return `${stripRepeatedPdfExtension(fileName)}.pdf`;
}

async function loadManifest(manifestPath?: string): Promise<Map<string, ManifestEntry>> {
  const map = new Map<string, ManifestEntry>();
  const path = manifestPath ?? resolve(RAW_DIR, 'manifest.json');

  try {
    await access(path);
    const raw = await readFile(path, 'utf-8');
    const entries = JSON.parse(raw) as ManifestEntry[];
    for (const entry of entries) {
      map.set(entry.file, entry);
    }
    console.log(`Loaded manifest with ${map.size} entries.\n`);
  } catch {
    console.log('No manifest found — PDFs will need Ollama for metadata extraction.\n');
  }

  return map;
}

async function main() {
  const args = process.argv.slice(2);
  let manifestPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest') manifestPath = args[++i];
    if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: pnpm prepare:all [--manifest <path>]

Converts all PDFs in data/raw-pdfs/ to prepared JSONs in data/prepared/.

Options:
  --manifest <path>   Path to manifest.json with metadata for each PDF
                      (default: data/raw-pdfs/manifest.json)

Manifest format:
  [
    {
      "file": "motor-vehicles-act-1988.pdf",
      "act": "Motor Vehicles Act, 1988",
      "jurisdiction": "central",
      "sourceUrl": "https://...",
      "docType": "bare-act"
    }
  ]
`);
      process.exit(0);
    }
  }

  const manifest = await loadManifest(manifestPath);

  // Find all PDFs
  let files: string[];
  try {
    files = (await readdir(RAW_DIR)).filter(
      (f) => extname(f).toLowerCase() === '.pdf',
    );
  } catch {
    console.error(`Directory not found: ${RAW_DIR}`);
    console.error('Create data/raw-pdfs/ and place your PDF files there.');
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No PDF files found in data/raw-pdfs/');
    return;
  }

  console.log(`Found ${files.length} PDF(s) to process.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pdfPath = resolve(RAW_DIR, file);
    const outName = `${stripRepeatedPdfExtension(file)}.prepared.json`;
    const outPath = resolve(OUT_DIR, outName);

    // Check if already prepared
    try {
      await access(outPath);
      console.log(`[${i + 1}/${files.length}] SKIP (exists): ${outName}`);
      skipped++;
      continue;
    } catch {
      // File doesn't exist — proceed
    }

    const entry = manifest.get(file) ?? manifest.get(normalizePdfFileName(file));

    // Build CLI args for prepare-data
    const cliArgs = [
      resolve(ROOT, 'packages/data-prep/src/cli.ts'),
      pdfPath,
      '--output', outPath,
    ];

    if (entry) {
      cliArgs.push('--act', entry.act);
      cliArgs.push('--jurisdiction', entry.jurisdiction);
      if (entry.sourceUrl) cliArgs.push('--source-url', entry.sourceUrl);
      if (entry.docType) cliArgs.push('--doc-type', entry.docType);
      cliArgs.push('--offline');
    }

    console.log(`[${i + 1}/${files.length}] Processing: ${file}`);

    try {
      const tsxRunner = getTseRunner();
      const { stderr } = await execFileAsync(tsxRunner.command, [...tsxRunner.args, ...cliArgs], {
        cwd: ROOT,
        timeout: 300_000, // 5 minutes per PDF
        env: { ...process.env },
      });
      if (stderr) {
        // data-prep writes progress to stderr
        for (const line of stderr.split('\n').filter(Boolean)) {
          console.log(`  ${line}`);
        }
      }
      console.log(`  → ${outName}`);
      success++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Failed: ${message.split('\n')[0]}`);
      if (
        typeof err === 'object' &&
        err !== null &&
        'stderr' in err &&
        typeof err.stderr === 'string' &&
        err.stderr.trim().length > 0
      ) {
        for (const line of err.stderr.split('\n').filter(Boolean)) {
          console.error(`    ${line}`);
        }
      }
      failed++;
    }
  }

  console.log(`\nDone: ${success} prepared, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
