// =============================================================================
// Jagrut Routes — Public Legal Education Engine ("Duolingo for Indian Law")
// =============================================================================
//
// GET  /categories         — List all lesson categories with counts.
// GET  /lessons            — List all lessons (optional ?category= filter).
// GET  /lessons/:id        — Retrieve a specific lesson by ID.
// GET  /quiz/:lessonId     — Retrieve quiz questions for a lesson.
// POST /progress           — Record a user's learning progress (SM-2).
// GET  /cards              — List all Know Your Rights cards (optional ?category= / ?variant=).
// GET  /cards/:id          — Retrieve a single rights card by ID.
// =============================================================================

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type {
  LessonCard,
  QuizQuestion,
  UserProgress,
  RightsCard,
} from '@nyayasetu/shared-types';
import { LESSONS, QUIZ_QUESTIONS, getCategoryMeta } from '../data/jagrut-lessons.js';
import { RIGHTS_CARDS } from '../data/rights-cards.js';

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const ProgressRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  lessonId: z.string().min(1, 'lessonId is required'),
  easeFactor: z.number().min(1.3).max(5.0),
  interval: z.number().int().nonnegative(),
  repetitions: z.number().int().nonnegative(),
  nextReviewDate: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export const jagrutRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
): Promise<void> => {
  /**
   * GET /categories
   *
   * Returns all lesson categories with metadata and lesson counts.
   */
  fastify.get('/categories', async (_request, reply) => {
    const categories = getCategoryMeta(LESSONS);
    return reply.status(200).send(categories);
  });

  /**
   * GET /lessons
   *
   * Returns lesson cards, optionally filtered by ?category=.
   * Sorted by category then order within category.
   */
  fastify.get<{ Querystring: { category?: string }; Reply: LessonCard[] }>(
    '/lessons',
    async (request, reply) => {
      const { category } = request.query;

      let lessons = LESSONS;
      if (category) {
        lessons = LESSONS.filter((l) => l.category === category);
      }

      const sorted = [...lessons].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.order - b.order;
      });

      return reply.status(200).send(sorted);
    },
  );

  /**
   * GET /lessons/:id
   *
   * Returns a single lesson by ID. Returns 404 if not found.
   */
  fastify.get<{ Params: { id: string }; Reply: LessonCard | { error: string } }>(
    '/lessons/:id',
    async (request, reply) => {
      const { id } = request.params;
      const lesson = LESSONS.find((l) => l.id === id);

      if (!lesson) {
        return reply.status(404).send({ error: `Lesson "${id}" not found.` });
      }

      return reply.status(200).send(lesson);
    },
  );

  /**
   * GET /quiz/:lessonId
   *
   * Returns quiz questions for a specific lesson. Returns 404 if none exist.
   */
  fastify.get<{ Params: { lessonId: string }; Reply: QuizQuestion[] | { error: string } }>(
    '/quiz/:lessonId',
    async (request, reply) => {
      const { lessonId } = request.params;
      const questions = QUIZ_QUESTIONS.filter((q) => q.lessonId === lessonId);

      if (questions.length === 0) {
        return reply
          .status(404)
          .send({ error: `No quiz found for lesson "${lessonId}".` });
      }

      return reply.status(200).send(questions);
    },
  );

  /**
   * GET /cards
   *
   * Returns all Know Your Rights cards, optionally filtered by
   * ?category= and/or ?variant= query parameters.
   */
  fastify.get<{
    Querystring: { category?: string; variant?: string };
    Reply: RightsCard[];
  }>('/cards', async (request, reply) => {
    const { category, variant } = request.query;

    let cards = RIGHTS_CARDS;
    if (category) cards = cards.filter((c) => c.category === category);
    if (variant) cards = cards.filter((c) => c.variant === variant);

    return reply.status(200).send(cards);
  });

  /**
   * GET /cards/:id
   *
   * Returns a single rights card by ID. Returns 404 if not found.
   */
  fastify.get<{ Params: { id: string }; Reply: RightsCard | { error: string } }>(
    '/cards/:id',
    async (request, reply) => {
      const { id } = request.params;
      const card = RIGHTS_CARDS.find((c) => c.id === id);
      if (!card) return reply.status(404).send({ error: `Card "${id}" not found.` });
      return reply.status(200).send(card);
    },
  );

  /**
   * POST /progress
   *
   * Records a user's learning progress for spaced repetition scheduling.
   */
  fastify.post<{ Body: UserProgress; Reply: { success: boolean; progress: UserProgress } }>(
    '/progress',
    async (request, reply) => {
      const parseResult = ProgressRequestSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          progress: request.body,
        });
      }

      const progress: UserProgress = parseResult.data;

      // In-memory acknowledgement — production will use Firestore.
      fastify.log.info(
        { userId: progress.userId, lessonId: progress.lessonId },
        'Recording user progress',
      );

      return reply.status(200).send({
        success: true,
        progress,
      });
    },
  );
};
