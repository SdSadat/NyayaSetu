// =============================================================================
// Sahayak Routes — Citizen Legal Information Engine
// =============================================================================
// POST /api/v1/sahayak/query   — Legal Q&A (JSON response, multi-turn support)
// POST /api/v1/sahayak/verify  — Document authenticity verification (multipart)
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { SahayakResponse, SupportedState } from '@nyayasetu/shared-types';
import { processQuery } from '../services/query-pipeline.js';
import { runVerifyPipeline } from '../services/verify-pipeline.js';

// ---------------------------------------------------------------------------
// Request validation schemas
// ---------------------------------------------------------------------------

const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(5000),
  timestamp: z.string().optional(),
  sources: z.array(z.string()).optional(),
});

const QueryRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Query text is required')
    .max(2000, 'Query text must not exceed 2000 characters'),
  state: z
    .enum(['west-bengal', 'jharkhand'] as const)
    .optional(),
  language: z
    .enum(['en', 'hi'] as const)
    .optional()
    .default('en'),
  conversationHistory: z
    .array(ConversationTurnSchema)
    .max(8, 'Conversation history must not exceed 8 turns')
    .optional(),
});

type QueryRequest = z.infer<typeof QueryRequestSchema>;

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const sahayakRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {
  /**
   * POST /query — Legal Q&A with optional multi-turn conversation history.
   */
  fastify.post<{ Body: QueryRequest; Reply: SahayakResponse }>(
    '/query',
    async (request, reply) => {
      const parseResult = QueryRequestSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          type: 'refusal',
          reason: 'out-of-scope',
          message: `Invalid request: ${parseResult.error.errors.map((e) => e.message).join('; ')}`,
          suggestHumanLawyer: false,
        } satisfies SahayakResponse);
      }

      const { text, state, language, conversationHistory } = parseResult.data;

      const response = await processQuery({
        text,
        state: state as SupportedState | undefined,
        language,
        conversationHistory: conversationHistory as any,
      });

      const statusCode = response.type === 'success' ? 200 : 422;
      return reply.status(statusCode).send(response);
    },
  );

  /**
   * POST /verify — Document authenticity verification (multipart upload)
   */
  fastify.post('/verify', async (request, reply) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_MIMES = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ]);

    let data;
    try {
      data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } });
    } catch {
      return reply.status(400).send({
        type: 'refusal',
        reason: 'unsupported-format',
        message: 'No file uploaded. Please attach a document to verify.',
      });
    }

    if (!data) {
      return reply.status(400).send({
        type: 'refusal',
        reason: 'unsupported-format',
        message: 'No file uploaded. Please attach a document to verify.',
      });
    }

    if (!ALLOWED_MIMES.has(data.mimetype)) {
      return reply.status(400).send({
        type: 'refusal',
        reason: 'unsupported-format',
        message: `Unsupported file type "${data.mimetype}". Please upload a PDF, DOCX, TXT, PNG, or JPG file.`,
      });
    }

    const buffer = await data.toBuffer();

    const result = await runVerifyPipeline(buffer, data.filename, data.mimetype);
    const statusCode = result.type === 'success' ? 200 : 422;
    return reply.status(statusCode).send(result);
  });
};
