// =============================================================================
// Sahayak Routes — Citizen Legal Information Engine
// =============================================================================
// POST /api/v1/sahayak/query        — JSON response (original)
// POST /api/v1/sahayak/query/stream — SSE streaming response
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { SahayakResponse, SupportedState } from '@nyayasetu/shared-types';
import { processQuery } from '../services/query-pipeline.js';

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

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
});

type QueryRequest = z.infer<typeof QueryRequestSchema>;

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const sahayakRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {
  /**
   * POST /query — full JSON response (existing behavior)
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

      const { text, state, language } = parseResult.data;

      const response = await processQuery({
        text,
        state: state as SupportedState | undefined,
        language,
      });

      const statusCode = response.type === 'success' ? 200 : 422;
      return reply.status(statusCode).send(response);
    },
  );
};
