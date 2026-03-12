// =============================================================================
// User Progress — DynamoDB persistence for Jagrut learning progress
// =============================================================================
// Table: NyayaSetu-UserProgress (configurable via env)
//   PK: username (String)
//   SK: lessonId (String)
// Stores lesson completion timestamps, quiz best scores, and SM-2 spaced
// repetition fields.
// =============================================================================

import { PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient } from './dynamodb.js';
import { config } from '../config/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProgressItem {
  username: string;
  lessonId: string;
  completedAt?: string;       // ISO timestamp when lesson was first completed
  quizScore?: number;         // Best quiz score
  quizTotal?: number;         // Total questions in quiz
  quizCompletedAt?: string;   // ISO timestamp of best quiz attempt
  // SM-2 spaced repetition fields
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
  nextReviewDate?: string;
  updatedAt: string;          // ISO timestamp of last update
}

export interface BulkProgressPayload {
  completedLessons: Record<string, string>;              // lessonId -> completedAt
  quizResults: Record<string, {
    score: number;
    total: number;
    completedAt: string;
  }>;
}

const TABLE_NAME = config.dynamodb.progressTableName;

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/**
 * Save or update a single lesson progress record.
 */
export async function saveUserProgress(item: UserProgressItem): Promise<void> {
  if (!TABLE_NAME) return;
  const docClient = getDocClient();
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );
}

/**
 * Load all progress records for a user.
 */
export async function getUserProgress(username: string): Promise<UserProgressItem[]> {
  if (!TABLE_NAME) return [];
  const docClient = getDocClient();

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'username = :u',
      ExpressionAttributeValues: { ':u': username },
    }),
  );

  return (result.Items ?? []) as UserProgressItem[];
}

/**
 * Bulk-sync progress from the frontend's localStorage format.
 * Merges: won't overwrite earlier completion times or higher quiz scores.
 */
export async function syncUserProgress(
  username: string,
  payload: BulkProgressPayload,
): Promise<void> {
  if (!TABLE_NAME) return;

  // Load existing progress to merge
  const existing = await getUserProgress(username);
  const existingMap = new Map<string, UserProgressItem>();
  for (const item of existing) {
    existingMap.set(item.lessonId, item);
  }

  const now = new Date().toISOString();
  const items: UserProgressItem[] = [];

  // Collect all unique lesson IDs
  const allLessonIds = new Set([
    ...Object.keys(payload.completedLessons),
    ...Object.keys(payload.quizResults),
  ]);

  for (const lessonId of allLessonIds) {
    const prev = existingMap.get(lessonId);
    const completedAt = payload.completedLessons[lessonId];
    const quiz = payload.quizResults[lessonId];

    const item: UserProgressItem = {
      username,
      lessonId,
      updatedAt: now,
    };

    // Merge completion: keep earliest timestamp
    if (completedAt) {
      item.completedAt = prev?.completedAt && prev.completedAt < completedAt
        ? prev.completedAt
        : completedAt;
    } else if (prev?.completedAt) {
      item.completedAt = prev.completedAt;
    }

    // Merge quiz: keep highest score
    if (quiz) {
      if (prev?.quizScore !== undefined && prev.quizScore >= quiz.score) {
        item.quizScore = prev.quizScore;
        item.quizTotal = prev.quizTotal;
        item.quizCompletedAt = prev.quizCompletedAt;
      } else {
        item.quizScore = quiz.score;
        item.quizTotal = quiz.total;
        item.quizCompletedAt = quiz.completedAt;
      }
    } else if (prev?.quizScore !== undefined) {
      item.quizScore = prev.quizScore;
      item.quizTotal = prev.quizTotal;
      item.quizCompletedAt = prev.quizCompletedAt;
    }

    // Preserve SM-2 fields if they exist
    if (prev?.easeFactor !== undefined) {
      item.easeFactor = prev.easeFactor;
      item.interval = prev.interval;
      item.repetitions = prev.repetitions;
      item.nextReviewDate = prev.nextReviewDate;
    }

    items.push(item);
  }

  // BatchWrite in chunks of 25 (DynamoDB limit)
  const docClient = getDocClient();
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      }),
    );
  }
}
