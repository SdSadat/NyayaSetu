// =============================================================================
// Data Preparation Pipeline Orchestrator
// =============================================================================
// Orchestrates the 7-stage pipeline using injected dependencies.
// The pipeline has ZERO knowledge of concrete implementations — all
// strategies are provided via PipelineDependencies at construction time.
//
// Stages: Acquire → Extract → Clean → Classify → Metadata → Validate → Output
// =============================================================================

import type {
  PipelineDependencies,
  RawInput,
  PreparedDocument,
  ProcessingReport,
  AcquiredContent,
  ExtractedText,
  CleanedText,
  ClassifiedDocument,
  ExtractedMetadata,
  BatchOptions,
  BatchResult,
} from './types.js';
import { validateMetadata } from './validators/metadata-validator.js';

/**
 * The main data preparation pipeline. Accepts raw inputs (PDF, TXT, URL)
 * and produces fully prepared documents ready for ingestion.
 *
 * All processing strategies are injected via {@link PipelineDependencies},
 * making every stage independently swappable.
 */
export class DataPrepPipeline {
  constructor(private readonly deps: PipelineDependencies) {}

  // -------------------------------------------------------------------------
  // Main entry point
  // -------------------------------------------------------------------------

  /**
   * Process a single raw input through all pipeline stages.
   */
  async prepare(input: RawInput): Promise<PreparedDocument> {
    const timings: Record<string, number> = {};
    const warnings: string[] = [];
    const stagesExecuted: string[] = [];
    let ollamaUsed = false;

    const time = async <T>(
      stageName: string,
      fn: () => Promise<T>,
    ): Promise<T> => {
      const start = performance.now();
      const result = await fn();
      timings[stageName] = Math.round(performance.now() - start);
      stagesExecuted.push(stageName);
      return result;
    };

    // Stage 1: Acquire
    const acquirer = this.deps.acquirers.getOrThrow(
      input.sourceType,
      'acquirer',
    );
    const acquired = await time('acquire', () =>
      acquirer.acquire(input.location),
    );

    // Stage 2: Extract
    const extractor = this.deps.extractors.getOrThrow(
      acquired.contentType,
      'extractor',
    );
    const extracted = await time('extract', () =>
      extractor.extract(acquired),
    );

    // Warn if document is very large
    if (extracted.text.length > this.deps.config.maxDocumentSize) {
      warnings.push(
        `Document is ${extracted.text.length} chars (max recommended: ${this.deps.config.maxDocumentSize})`,
      );
    }

    // Stage 3: Clean
    const cleaned = await time('clean', () =>
      this.deps.textProcessor.process(extracted),
    );
    if (this.deps.textProcessor.name.includes('llm')) ollamaUsed = true;

    // Stage 4: Classify
    const classified = await time('classify', () =>
      this.deps.documentClassifier.classify(cleaned),
    );
    if (this.deps.documentClassifier.name.includes('llm')) ollamaUsed = true;

    if (classified.confidence < 0.5) {
      warnings.push(
        `Low classification confidence (${classified.confidence.toFixed(2)}) for type "${classified.documentType}"`,
      );
    }

    // Stage 5: Extract metadata
    const metadata = await time('metadata', () =>
      this.deps.metadataExtractor.extract(classified, input.hints),
    );
    if (this.deps.metadataExtractor.name.includes('llm')) ollamaUsed = true;

    // Stage 6: Validate
    const validation = await time('validate', async () =>
      validateMetadata(metadata, classified),
    );

    if (!validation.valid) {
      warnings.push(
        `Metadata validation errors: ${validation.errors.join('; ')}`,
      );
    }
    warnings.push(...validation.warnings);

    // Stage 7: Assemble output
    const report: ProcessingReport = {
      input,
      stagesExecuted,
      timings,
      warnings,
      ollamaUsed,
      ollamaModel: ollamaUsed ? this.deps.llmProvider.modelName : undefined,
    };

    return {
      text: classified.text,
      metadata,
      documentType: classified.documentType,
      processingReport: report,
    };
  }

  // -------------------------------------------------------------------------
  // Batch processing
  // -------------------------------------------------------------------------

  /**
   * Process multiple inputs, optionally in parallel.
   */
  async prepareBatch(
    inputs: RawInput[],
    options: BatchOptions = { concurrency: 1, continueOnError: true },
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    // Process with limited concurrency
    const tasks = inputs.map((input) => async (): Promise<BatchResult> => {
      const start = performance.now();
      try {
        const result = await this.prepare(input);
        return {
          input,
          result,
          error: null,
          timingMs: Math.round(performance.now() - start),
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        if (!options.continueOnError) throw error;
        return {
          input,
          result: null,
          error: message,
          timingMs: Math.round(performance.now() - start),
        };
      }
    });

    // Execute with concurrency limit
    const executing: Promise<void>[] = [];
    for (const task of tasks) {
      const p = task().then((r) => {
        results.push(r);
      });
      executing.push(p);

      if (executing.length >= options.concurrency) {
        await Promise.race(executing);
        // Remove settled promises
        for (let i = executing.length - 1; i >= 0; i--) {
          const settled = await Promise.race([
            executing[i].then(() => true),
            Promise.resolve(false),
          ]);
          if (settled) executing.splice(i, 1);
        }
      }
    }

    await Promise.all(executing);
    return results;
  }

  // -------------------------------------------------------------------------
  // Individual stage access (for testing / advanced usage)
  // -------------------------------------------------------------------------

  async acquire(input: RawInput): Promise<AcquiredContent> {
    const acquirer = this.deps.acquirers.getOrThrow(
      input.sourceType,
      'acquirer',
    );
    return acquirer.acquire(input.location);
  }

  async extract(content: AcquiredContent): Promise<ExtractedText> {
    const extractor = this.deps.extractors.getOrThrow(
      content.contentType,
      'extractor',
    );
    return extractor.extract(content);
  }

  async clean(text: ExtractedText): Promise<CleanedText> {
    return this.deps.textProcessor.process(text);
  }

  async classify(text: CleanedText): Promise<ClassifiedDocument> {
    return this.deps.documentClassifier.classify(text);
  }

  async extractMetadata(
    doc: ClassifiedDocument,
  ): Promise<ExtractedMetadata> {
    return this.deps.metadataExtractor.extract(doc);
  }
}
