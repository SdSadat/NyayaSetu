// =============================================================================
// DynamoDB Connection — AWS persistence layer for Drishti history
// =============================================================================
// Replaces MongoDB with AWS DynamoDB for serverless-native persistence.
// Table: NyayaSetu-DrishtiHistory (configurable via env)
//   PK: sessionId (String)
//   SK: savedAt (String — ISO timestamp)
//   TTL: expiresAt (Number — epoch seconds)
// =============================================================================

import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config/index.js';
import type { DrishtiAnalysis } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

let _client: DynamoDBClient | null = null;
let _docClient: DynamoDBDocumentClient | null = null;
let _available = false;

export function getDocClient(): DynamoDBDocumentClient {
  if (!_docClient) {
    _client = new DynamoDBClient({
      region: config.aws.region,
      ...(config.aws.accessKeyId && config.aws.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.aws.accessKeyId,
              secretAccessKey: config.aws.secretAccessKey,
            },
          }
        : {}),
    });
    _docClient = DynamoDBDocumentClient.from(_client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return _docClient;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const TABLE_NAME = config.dynamodb.tableName;

/**
 * Attempt to connect to DynamoDB by verifying the table exists.
 * Returns true if available, false otherwise. Never crashes the server.
 */
export async function connectDynamo(): Promise<boolean> {
  if (!TABLE_NAME) return false;

  try {
    const client = getDocClient();
    // Verify table exists
    await _client!.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    _available = true;
    return true;
  } catch (err) {
    console.error(
      '[dynamodb] Table verification failed — running without DynamoDB:',
      (err as Error).message,
    );
    _available = false;
    return false;
  }
}

export function isDynamoConnected(): boolean {
  return _available;
}

export async function disconnectDynamo(): Promise<void> {
  if (_client) {
    _client.destroy();
    _client = null;
    _docClient = null;
    _available = false;
  }
}

// ---------------------------------------------------------------------------
// History item type
// ---------------------------------------------------------------------------

export interface DrishtiHistoryItem {
  sessionId: string;
  savedAt: string;
  id: string;
  documentText: string;
  preview: string;
  analysis: DrishtiAnalysis;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Save a Drishti analysis to DynamoDB.
 */
export async function saveDrishtiHistory(params: {
  sessionId: string;
  documentText: string;
  preview: string;
  analysis: DrishtiAnalysis;
}): Promise<string> {
  const docClient = getDocClient();
  const now = new Date();
  const savedAt = now.toISOString();
  const id = `${params.sessionId}#${savedAt}`;
  const ttlSeconds = config.dynamodb.historyTtlDays * 24 * 60 * 60;
  const expiresAt = Math.floor(now.getTime() / 1000) + ttlSeconds;

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        sessionId: params.sessionId,
        savedAt,
        id,
        documentText: params.documentText,
        preview: params.preview,
        analysis: params.analysis,
        expiresAt,
      },
    }),
  );

  return id;
}

/**
 * List Drishti history for a session, ordered by most recent first.
 */
export async function listDrishtiHistory(
  sessionId: string,
  limit: number = 15,
): Promise<Array<{
  id: string;
  sessionId: string;
  preview: string;
  caseTitle: string;
  outcome: string;
  savedAt: string;
}>> {
  const docClient = getDocClient();

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'sessionId = :sid',
      ExpressionAttributeValues: {
        ':sid': sessionId,
      },
      ScanIndexForward: false, // descending (most recent first)
      Limit: limit,
      ProjectionExpression: 'id, sessionId, preview, analysis, savedAt',
    }),
  );

  return (result.Items ?? []).map((item) => ({
    id: item.id as string,
    sessionId: item.sessionId as string,
    preview: item.preview as string,
    caseTitle: (item.analysis as DrishtiAnalysis)?.caseTitle ?? '',
    outcome: (item.analysis as DrishtiAnalysis)?.outcome ?? '',
    savedAt: item.savedAt as string,
  }));
}

/**
 * Get a single history item by its composite ID.
 */
export async function getDrishtiHistoryById(
  id: string,
): Promise<DrishtiHistoryItem | null> {
  // ID format: sessionId#savedAt
  const hashIndex = id.indexOf('#');
  if (hashIndex === -1) return null;

  const sessionId = id.substring(0, hashIndex);
  const savedAt = id.substring(hashIndex + 1);

  const docClient = getDocClient();
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { sessionId, savedAt },
    }),
  );

  if (!result.Item) return null;

  return result.Item as unknown as DrishtiHistoryItem;
}

/**
 * Delete a history item (session-scoped).
 */
export async function deleteDrishtiHistory(
  id: string,
  sessionId: string,
): Promise<boolean> {
  const hashIndex = id.indexOf('#');
  if (hashIndex === -1) return false;

  const itemSessionId = id.substring(0, hashIndex);
  const savedAt = id.substring(hashIndex + 1);

  // Ensure the item belongs to the given session
  if (itemSessionId !== sessionId) return false;

  const docClient = getDocClient();
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { sessionId, savedAt },
    }),
  );

  return true;
}
