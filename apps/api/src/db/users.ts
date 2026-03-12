// =============================================================================
// DynamoDB Users — Simple username/password authentication store
// =============================================================================
// Table: NyayaSetu-Users (configurable via env)
//   PK: username (String)
//   No sort key
// =============================================================================

import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient } from './dynamodb.js';
import { config } from '../config/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  username: string;
  passwordHash: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

const TABLE_NAME = config.dynamodb.usersTableName;

/**
 * Create a new user. Throws if the username already exists.
 */
export async function createUser(
  username: string,
  passwordHash: string,
): Promise<User> {
  const docClient = getDocClient();
  const now = new Date().toISOString();

  const user: User = { username, passwordHash, createdAt: now };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
      ConditionExpression: 'attribute_not_exists(username)',
    }),
  );

  return user;
}

/**
 * Fetch a user by username. Returns null if not found.
 */
export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const docClient = getDocClient();

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { username },
    }),
  );

  return (result.Item as User) ?? null;
}
