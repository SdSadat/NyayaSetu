// =============================================================================
// JWT Authentication Middleware
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Fastify preHandler that verifies a JWT Bearer token.
 * Attach to routes or route prefixes that require authentication.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ type: 'error', message: 'Unauthorized' });
  }
}
