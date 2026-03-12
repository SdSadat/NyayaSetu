// =============================================================================
// Progress Routes — User learning progress persistence (Jagrut)
// =============================================================================
//
// GET  /             — Load all progress for the authenticated user.
// PUT  /sync         — Bulk-sync progress from frontend localStorage.
// PUT  /lesson/:id   — Mark a single lesson complete or record quiz score.
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  getUserProgress,
  saveUserProgress,
  syncUserProgress,
} from '../db/user-progress.js';
import type { BulkProgressPayload, UserProgressItem } from '../db/user-progress.js';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const QuizResultSchema = z.object({
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  completedAt: z.string(),
});

const SyncBodySchema = z.object({
  completedLessons: z.record(z.string(), z.string()),
  quizResults: z.record(z.string(), QuizResultSchema),
});

const LessonProgressSchema = z.object({
  completedAt: z.string().optional(),
  quizScore: z.number().int().nonnegative().optional(),
  quizTotal: z.number().int().positive().optional(),
  quizCompletedAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const progressRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {
  // All progress routes require authentication
  fastify.addHook('preHandler', authenticate);

  /**
   * GET /
   * Returns all progress records for the authenticated user, formatted
   * in the same shape as the frontend's JagrutProgress interface.
   */
  fastify.get('/', async (request, reply) => {
    const { username } = request.user;
    const items = await getUserProgress(username);

    // Convert from DynamoDB records to frontend-friendly format
    const completedLessons: Record<string, string> = {};
    const quizResults: Record<string, { score: number; total: number; completedAt: string }> = {};

    for (const item of items) {
      if (item.completedAt) {
        completedLessons[item.lessonId] = item.completedAt;
      }
      if (item.quizScore !== undefined && item.quizTotal !== undefined) {
        quizResults[item.lessonId] = {
          score: item.quizScore,
          total: item.quizTotal,
          completedAt: item.quizCompletedAt ?? item.updatedAt,
        };
      }
    }

    return reply.status(200).send({ completedLessons, quizResults });
  });

  /**
   * PUT /sync
   * Bulk-sync progress from the frontend. Merges with existing data:
   * keeps earliest completion timestamps and highest quiz scores.
   */
  fastify.put<{ Body: BulkProgressPayload }>('/sync', async (request, reply) => {
    const parseResult = SyncBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Invalid progress data.' });
    }

    const { username } = request.user;
    await syncUserProgress(username, parseResult.data);

    return reply.status(200).send({ success: true });
  });

  /**
   * PUT /lesson/:id
   * Save progress for a single lesson (completion and/or quiz score).
   */
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof LessonProgressSchema> }>(
    '/lesson/:id',
    async (request, reply) => {
      const parseResult = LessonProgressSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ message: 'Invalid lesson progress data.' });
      }

      const { username } = request.user;
      const { id: lessonId } = request.params;
      const body = parseResult.data;

      const item: UserProgressItem = {
        username,
        lessonId,
        updatedAt: new Date().toISOString(),
        ...(body.completedAt && { completedAt: body.completedAt }),
        ...(body.quizScore !== undefined && { quizScore: body.quizScore }),
        ...(body.quizTotal !== undefined && { quizTotal: body.quizTotal }),
        ...(body.quizCompletedAt && { quizCompletedAt: body.quizCompletedAt }),
      };

      await saveUserProgress(item);

      return reply.status(200).send({ success: true });
    },
  );
};
