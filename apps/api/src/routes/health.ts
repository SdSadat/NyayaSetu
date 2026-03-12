// =============================================================================
// Health Check Routes
// =============================================================================
// Provides liveness and readiness probes for Kubernetes / Cloud Run.
//
// GET /health  — Liveness probe. Returns 200 if the process is running.
// GET /ready   — Readiness probe. Returns 200 when the service is ready to
//                accept traffic (can be extended to check DB connectivity, etc.).
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/index.js';

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface HealthResponse {
  status: 'ok';
  version: string;
  timestamp: string;
}

interface ReadyResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const healthRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {
  /**
   * GET /health
   *
   * Liveness probe. Returns 200 with current version and timestamp to indicate
   * the process is alive.
   */
  fastify.get<{ Reply: HealthResponse }>('/health', async (_request, reply) => {
    const response: HealthResponse = {
      status: 'ok',
      version: config.version,
      timestamp: new Date().toISOString(),
    };
    return reply.status(200).send(response);
  });

  /**
   * GET /ready
   *
   * Readiness probe. Returns 200 when the service is ready to serve traffic.
   * Extend this handler to include checks for downstream dependencies (e.g.,
   * vector database connectivity, AWS service availability).
   */
  fastify.get<{ Reply: ReadyResponse }>('/ready', async (_request, reply) => {
    // TODO: Add readiness checks for:
    // - Vector database connectivity
    // - AWS Bedrock (Nova) endpoint availability
    // - Any other critical downstream dependencies

    const isReady = true; // Placeholder — replace with actual checks

    const response: ReadyResponse = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
    };

    return reply
      .status(isReady ? 200 : 503)
      .send(response);
  });
};
