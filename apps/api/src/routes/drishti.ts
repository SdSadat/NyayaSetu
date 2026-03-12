// =============================================================================
// Drishti Routes — Professional Legal Document Analyser
// =============================================================================
//
// POST /extract           — Upload file (PDF/DOCX/TXT) and extract text.
// POST /analyze           — Analyse a document; persists to DynamoDB.
// POST /summarize         — Backward-compatible alias for /analyze.
// GET  /history           — List session history (DynamoDB).
// GET  /history/:id       — Fetch a single history item.
// DELETE /history/:id     — Delete a single history item (session-scoped).
//
// DynamoDB is optional. When not configured, /history routes return 503 and
// /analyze stays fully functional (stateless).
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { DrishtiAnalysis } from '@nyayasetu/shared-types';
import { runDrishtiPipeline } from '../services/drishti-pipeline.js';
import type { DrishtiRefusal } from '../services/drishti-pipeline.js';
import {
  isDynamoConnected,
  saveDrishtiHistory,
  listDrishtiHistory,
  getDrishtiHistoryById,
  deleteDrishtiHistory,
} from '../db/dynamodb.js';
import { extractText } from '../services/doc-extractor.js';

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

const AnalyzeRequestSchema = z.object({
  documentText: z
    .string()
    .min(100, 'Document text must be at least 100 characters')
    .max(200_000, 'Document text must not exceed 200,000 characters'),
  sessionId: z.string().max(128).optional(),
});

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

interface AnalyzeSuccessResponse {
  type: 'success';
  analysis: DrishtiAnalysis;
  historyId?: string;
}

type AnalyzeResponse =
  | AnalyzeSuccessResponse
  | DrishtiRefusal
  | { type: 'error'; message: string };

interface HistoryListItem {
  id: string;
  sessionId: string;
  preview: string;
  caseTitle: string;
  outcome: string;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const drishtiRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {

  async function runAnalysis(
    documentText: string,
    sessionId: string | undefined,
  ): Promise<{ status: number; body: AnalyzeResponse }> {
    fastify.log.info({ documentLength: documentText.length }, '[drishti] Starting analysis pipeline');

    const result = await runDrishtiPipeline(documentText);

    if (result.type === 'refusal') {
      return { status: 422, body: result };
    }

    const { type: _type, ...analysis } = result;
    const drishtiAnalysis = analysis as DrishtiAnalysis;

    let historyId: string | undefined;
    if (isDynamoConnected() && sessionId) {
      try {
        historyId = await saveDrishtiHistory({
          sessionId,
          documentText,
          preview: documentText.slice(0, 200).replace(/\s+/g, ' ').trim(),
          analysis: drishtiAnalysis,
        });
      } catch (err) {
        fastify.log.warn({ err }, '[drishti] DynamoDB save failed');
      }
    }

    return { status: 200, body: { type: 'success', analysis: drishtiAnalysis, historyId } };
  }

  // ── POST /extract ─────────────────────────────────────────────────────────

  fastify.post('/extract', async (request, reply) => {
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    let data: Awaited<ReturnType<typeof request.file>>;
    try {
      data = await request.file({ limits: { fileSize: MAX_BYTES } });
    } catch (err) {
      return reply.status(400).send({ type: 'error', message: `Upload failed: ${(err as Error).message}` });
    }

    if (!data) {
      return reply.status(400).send({ type: 'error', message: 'No file attached to the request.' });
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;
    for await (const chunk of data.file) {
      totalBytes += (chunk as Buffer).length;
      if (totalBytes > MAX_BYTES) {
        return reply.status(413).send({ type: 'error', message: 'File too large. Maximum size is 5 MB.' });
      }
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    const result = await extractText(buffer, data.filename, data.mimetype);

    if (!result.ok) {
      return reply.status(422).send({ type: 'error', message: result.error });
    }

    fastify.log.info(
      { filename: data.filename, chars: result.text.length },
      '[drishti] Document extracted',
    );

    return reply.status(200).send({ type: 'success', text: result.text, filename: data.filename });
  });

  // ── POST /analyze ────────────────────────────────────────────────────────

  fastify.post<{ Body: AnalyzeRequest; Reply: AnalyzeResponse }>(
    '/analyze',
    async (request, reply) => {
      const parseResult = AnalyzeRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          type: 'error',
          message: `Invalid request: ${parseResult.error.errors.map((e) => e.message).join('; ')}`,
        });
      }
      const { status, body } = await runAnalysis(parseResult.data.documentText, parseResult.data.sessionId);
      return reply.status(status).send(body);
    },
  );

  // ── POST /summarize (alias) ──────────────────────────────────────────────

  fastify.post<{ Body: AnalyzeRequest; Reply: AnalyzeResponse }>(
    '/summarize',
    async (request, reply) => {
      const parseResult = AnalyzeRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          type: 'error',
          message: `Invalid request: ${parseResult.error.errors.map((e) => e.message).join('; ')}`,
        });
      }
      const { status, body } = await runAnalysis(parseResult.data.documentText, parseResult.data.sessionId);
      return reply.status(status).send(body);
    },
  );

  // ── GET /history ─────────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { sessionId?: string; limit?: string };
    Reply: HistoryListItem[] | { type: 'error'; message: string };
  }>('/history', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ type: 'error', message: 'DynamoDB is not configured on this server.' });
    }

    const { sessionId, limit } = request.query;
    if (!sessionId) {
      return reply.status(400).send({ type: 'error', message: 'sessionId query param is required.' });
    }

    const cap = Math.min(parseInt(limit ?? '15', 10) || 15, 50);
    const items = await listDrishtiHistory(sessionId, cap);
    return reply.status(200).send(items);
  });

  // ── GET /history/:id ─────────────────────────────────────────────────────

  fastify.get<{
    Params: { id: string };
    Reply:
      | { id: string; sessionId: string; documentText: string; analysis: DrishtiAnalysis; savedAt: string }
      | { type: 'error'; message: string };
  }>('/history/:id', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ type: 'error', message: 'DynamoDB is not configured on this server.' });
    }

    const item = await getDrishtiHistoryById(request.params.id);
    if (!item) return reply.status(404).send({ type: 'error', message: 'History item not found.' });

    return reply.status(200).send({
      id: item.id,
      sessionId: item.sessionId,
      documentText: item.documentText,
      analysis: item.analysis,
      savedAt: item.savedAt,
    });
  });

  // ── DELETE /history/:id ──────────────────────────────────────────────────

  fastify.delete<{
    Params: { id: string };
    Querystring: { sessionId?: string };
    Reply: { success: boolean } | { type: 'error'; message: string };
  }>('/history/:id', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ type: 'error', message: 'DynamoDB is not configured on this server.' });
    }

    const { sessionId } = request.query;
    if (!sessionId) {
      return reply.status(400).send({ type: 'error', message: 'sessionId query param is required.' });
    }

    const deleted = await deleteDrishtiHistory(request.params.id, sessionId);
    if (!deleted) {
      return reply.status(404).send({ type: 'error', message: 'Item not found or session mismatch.' });
    }

    return reply.status(200).send({ success: true });
  });
};
