// =============================================================================
// DynamoDB — Shareable Reports CRUD
// =============================================================================
// Table: NyayaSetu-Shares (configurable via env)
//   PK: shareId (String) — nanoid(8)
//   GSI: ownerId-createdAt-index (ownerId PK, createdAt SK)
//   TTL: expiresAt (Number — epoch seconds, optional)
// =============================================================================

import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { config } from '../config/index.js';
import { getDocClient } from './dynamodb.js';
import type {
  DrishtiAnalysis,
  ShareAccessLevel,
  ShareListItem,
} from '@nyayasetu/shared-types';

const TABLE = config.dynamodb.sharesTableName;
const OWNER_INDEX = 'ownerId-createdAt-index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateShareParams {
  ownerId: string;
  historyId: string;
  caseTitle: string;
  analysis: DrishtiAnalysis;
  accessLevel: ShareAccessLevel;
  passwordHash?: string;
  documentText?: string;
  expiresAt?: number; // epoch seconds
}

export interface ShareRow {
  shareId: string;
  ownerId: string;
  historyId: string;
  accessLevel: ShareAccessLevel;
  passwordHash?: string;
  caseTitle: string;
  analysis: DrishtiAnalysis;
  documentText?: string;
  createdAt: string;
  expiresAt?: number;
  viewCount: number;
  revoked: boolean;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createShare(params: CreateShareParams): Promise<string> {
  const doc = getDocClient();
  const shareId = nanoid(8);
  const createdAt = new Date().toISOString();

  await doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        shareId,
        ownerId: params.ownerId,
        historyId: params.historyId,
        accessLevel: params.accessLevel,
        ...(params.passwordHash && { passwordHash: params.passwordHash }),
        caseTitle: params.caseTitle,
        analysis: params.analysis,
        ...(params.documentText && { documentText: params.documentText }),
        createdAt,
        ...(params.expiresAt && { expiresAt: params.expiresAt }),
        viewCount: 0,
        revoked: false,
      },
    }),
  );

  return shareId;
}

// ---------------------------------------------------------------------------
// Read — single share
// ---------------------------------------------------------------------------

export async function getShareById(shareId: string): Promise<ShareRow | null> {
  const doc = getDocClient();
  const result = await doc.send(
    new GetCommand({ TableName: TABLE, Key: { shareId } }),
  );
  return (result.Item as ShareRow | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Read — list by owner
// ---------------------------------------------------------------------------

export async function listSharesByOwner(
  ownerId: string,
  limit = 20,
): Promise<ShareListItem[]> {
  const doc = getDocClient();
  const result = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: OWNER_INDEX,
      KeyConditionExpression: 'ownerId = :oid',
      ExpressionAttributeValues: { ':oid': ownerId },
      ScanIndexForward: false,
      Limit: limit,
      ProjectionExpression:
        'shareId, caseTitle, accessLevel, viewCount, createdAt, expiresAt, revoked',
    }),
  );

  return (result.Items ?? []) as ShareListItem[];
}

// ---------------------------------------------------------------------------
// Update — increment view count
// ---------------------------------------------------------------------------

export async function incrementViewCount(shareId: string): Promise<void> {
  const doc = getDocClient();
  await doc.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { shareId },
      UpdateExpression: 'ADD viewCount :one',
      ExpressionAttributeValues: { ':one': 1 },
    }),
  );
}

// ---------------------------------------------------------------------------
// Update — revoke share
// ---------------------------------------------------------------------------

export async function revokeShare(
  shareId: string,
  ownerId: string,
): Promise<boolean> {
  const doc = getDocClient();
  await doc.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { shareId },
      UpdateExpression: 'SET revoked = :t',
      ConditionExpression: 'ownerId = :oid',
      ExpressionAttributeValues: { ':t': true, ':oid': ownerId },
    }),
  );
  return true;
}
