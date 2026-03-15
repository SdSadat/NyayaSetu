// =============================================================================
// Drishti — Shareable Reports Routes
// =============================================================================
// POST   /share              Create a share link
// GET    /shared/:id         View a shared report (public) or get lock status
// POST   /shared/:id/unlock  Unlock a password-protected report
// GET    /shares             List my active shares
// DELETE /share/:id          Revoke a share
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { hash, compare } from 'bcryptjs';
import { isDynamoConnected, getDrishtiHistoryById } from '../db/dynamodb.js';
import {
  createShare,
  getShareById,
  listSharesByOwner,
  incrementViewCount,
  revokeShare,
} from '../db/shares.js';
import type { ShareAccessLevel, ShareExpiry } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 10;

/** Rate limit map for password attempts: key = "ip:shareId" → { count, resetAt } */
const attemptMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string, shareId: string): { allowed: boolean; remaining: number } {
  const key = `${ip}:${shareId}`;
  const now = Date.now();
  const entry = attemptMap.get(key);

  if (!entry || now > entry.resetAt) {
    attemptMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function expiryToEpoch(expiresIn: ShareExpiry): number | undefined {
  if (!expiresIn) return undefined;
  const now = Date.now();
  const ms: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return Math.floor((now + (ms[expiresIn] ?? 0)) / 1000);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function shareRoutes(server: FastifyInstance) {
  // ── Create share ──────────────────────────────────────────────────────────
  server.post<{
    Body: {
      historyId: string;
      sessionId: string;
      accessLevel: ShareAccessLevel;
      password?: string;
      expiresIn?: ShareExpiry;
      includeDocument?: boolean;
    };
  }>('/share', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ message: 'Database not available.' });
    }

    const { historyId, sessionId, accessLevel, password, expiresIn, includeDocument } =
      request.body;

    if (!historyId || !sessionId) {
      return reply.status(400).send({ message: 'historyId and sessionId are required.' });
    }

    if (accessLevel === 'password' && !password) {
      return reply.status(400).send({ message: 'Password is required for protected shares.' });
    }

    // Verify ownership — historyId format is "sessionId#savedAt"
    const hashIdx = historyId.indexOf('#');
    if (hashIdx === -1 || historyId.substring(0, hashIdx) !== sessionId) {
      return reply.status(403).send({ message: 'You can only share your own analyses.' });
    }

    // Fetch the analysis
    const historyItem = await getDrishtiHistoryById(historyId);
    if (!historyItem) {
      return reply.status(404).send({ message: 'Analysis not found.' });
    }

    const passwordHash = password ? await hash(password, BCRYPT_ROUNDS) : undefined;

    const shareId = await createShare({
      ownerId: sessionId,
      historyId,
      caseTitle: historyItem.analysis.caseTitle || 'Untitled Analysis',
      analysis: historyItem.analysis,
      accessLevel,
      passwordHash,
      documentText: includeDocument ? historyItem.documentText : undefined,
      expiresAt: expiryToEpoch(expiresIn ?? null),
    });

    const baseUrl = request.headers.origin ?? request.headers.referer ?? '';
    const shareUrl = `${baseUrl}/drishti/s/${shareId}`;

    return reply.send({ shareId, shareUrl });
  });

  // ── View shared report ────────────────────────────────────────────────────
  server.get<{ Params: { id: string } }>('/shared/:id', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ type: 'not-found', message: 'Database not available.' });
    }

    const share = await getShareById(request.params.id);

    if (!share || share.revoked) {
      return reply.status(404).send({
        type: 'not-found',
        message: 'This shared report does not exist or has been revoked.',
      });
    }

    // Check expiry
    if (share.expiresAt && Date.now() / 1000 > share.expiresAt) {
      return reply.status(410).send({
        type: 'not-found',
        message: 'This shared report has expired.',
      });
    }

    // Password-protected → return lock screen
    if (share.accessLevel === 'password') {
      return reply.send({
        type: 'password-required',
        caseTitle: share.caseTitle,
      });
    }

    // Public → return full analysis
    await incrementViewCount(share.shareId);

    return reply.send({
      type: 'success',
      caseTitle: share.caseTitle,
      analysis: share.analysis,
      ...(share.documentText && { documentText: share.documentText }),
      sharedAt: share.createdAt,
      expiresAt: share.expiresAt
        ? new Date(share.expiresAt * 1000).toISOString()
        : null,
    });
  });

  // ── Unlock password-protected report ──────────────────────────────────────
  server.post<{
    Params: { id: string };
    Body: { password: string };
  }>('/shared/:id/unlock', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ type: 'not-found', message: 'Database not available.' });
    }

    const ip = request.ip;
    const shareId = request.params.id;
    const { allowed, remaining } = checkRateLimit(ip, shareId);

    if (!allowed) {
      return reply.status(429).send({
        type: 'rate-limited',
        message: 'Too many attempts. Please try again later.',
        attemptsRemaining: 0,
      });
    }

    const share = await getShareById(shareId);

    if (!share || share.revoked) {
      return reply.status(404).send({
        type: 'not-found',
        message: 'This shared report does not exist or has been revoked.',
      });
    }

    if (share.expiresAt && Date.now() / 1000 > share.expiresAt) {
      return reply.status(410).send({
        type: 'not-found',
        message: 'This shared report has expired.',
      });
    }

    if (!share.passwordHash) {
      // Not password-protected — just return it
      await incrementViewCount(shareId);
      return reply.send({
        type: 'success',
        caseTitle: share.caseTitle,
        analysis: share.analysis,
        ...(share.documentText && { documentText: share.documentText }),
        sharedAt: share.createdAt,
        expiresAt: share.expiresAt
          ? new Date(share.expiresAt * 1000).toISOString()
          : null,
      });
    }

    const valid = await compare(request.body.password ?? '', share.passwordHash);

    if (!valid) {
      return reply.status(401).send({
        type: 'invalid-password',
        message: 'Incorrect password.',
        attemptsRemaining: remaining,
      });
    }

    await incrementViewCount(shareId);

    return reply.send({
      type: 'success',
      caseTitle: share.caseTitle,
      analysis: share.analysis,
      ...(share.documentText && { documentText: share.documentText }),
      sharedAt: share.createdAt,
      expiresAt: share.expiresAt
        ? new Date(share.expiresAt * 1000).toISOString()
        : null,
    });
  });

  // ── List my shares ────────────────────────────────────────────────────────
  server.get<{ Querystring: { sessionId: string } }>(
    '/shares',
    async (request, reply) => {
      if (!isDynamoConnected()) {
        return reply.status(503).send({ message: 'Database not available.' });
      }

      const { sessionId } = request.query;
      if (!sessionId) {
        return reply.status(400).send({ message: 'sessionId is required.' });
      }

      const shares = await listSharesByOwner(sessionId);
      return reply.send({ shares });
    },
  );

  // ── Revoke share ──────────────────────────────────────────────────────────
  server.delete<{
    Params: { id: string };
    Querystring: { sessionId: string };
  }>('/share/:id', async (request, reply) => {
    if (!isDynamoConnected()) {
      return reply.status(503).send({ message: 'Database not available.' });
    }

    const { sessionId } = request.query;
    if (!sessionId) {
      return reply.status(400).send({ message: 'sessionId is required.' });
    }

    try {
      await revokeShare(request.params.id, sessionId);
      return reply.send({ success: true });
    } catch {
      return reply.status(403).send({ message: 'You can only revoke your own shares.' });
    }
  });
}
