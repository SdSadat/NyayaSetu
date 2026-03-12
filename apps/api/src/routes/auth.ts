// =============================================================================
// Auth Routes — Simple username/password authentication
// =============================================================================
//
// POST /register  — Create a new account. Returns JWT.
// POST /login     — Authenticate. Returns JWT.
// GET  /me        — Get current user info (requires JWT).
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '../db/users.js';
import { authenticate } from '../middleware/authenticate.js';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const AuthSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
});

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const authRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {

  // ── POST /register ────────────────────────────────────────────────────────

  fastify.post('/register', async (request, reply) => {
    const parseResult = AuthSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        type: 'error',
        message: parseResult.error.errors.map((e) => e.message).join('; '),
      });
    }

    const { username, password } = parseResult.data;
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await createUser(username, passwordHash);
    } catch (err) {
      const name = (err as Error).name;
      if (name === 'ConditionalCheckFailedException') {
        return reply.status(409).send({
          type: 'error',
          message: 'Username already taken',
        });
      }
      throw err;
    }

    const token = fastify.jwt.sign({ username });

    return reply.status(201).send({ token, username });
  });

  // ── POST /login ───────────────────────────────────────────────────────────

  fastify.post('/login', async (request, reply) => {
    const parseResult = AuthSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        type: 'error',
        message: parseResult.error.errors.map((e) => e.message).join('; '),
      });
    }

    const { username, password } = parseResult.data;
    const user = await getUserByUsername(username);

    if (!user) {
      return reply.status(401).send({
        type: 'error',
        message: 'Invalid username or password',
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({
        type: 'error',
        message: 'Invalid username or password',
      });
    }

    const token = fastify.jwt.sign({ username });

    return reply.status(200).send({ token, username });
  });

  // ── GET /me ───────────────────────────────────────────────────────────────

  fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
    const { username } = request.user as { username: string };
    return { username };
  });
};
