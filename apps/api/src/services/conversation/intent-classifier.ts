// =============================================================================
// Intent Classifier — Determines if a query is a follow-up or new topic
// =============================================================================
// Uses a rule-based approach with pattern matching. Fast and deterministic —
// no LLM call needed. Examines pronoun usage, query length, domain overlap,
// and explicit topic-change signals.
// =============================================================================

import type { ConversationIntent, ConversationTurn } from '@nyayasetu/shared-types';

// ---------------------------------------------------------------------------
// Signal patterns
// ---------------------------------------------------------------------------

/** Pronouns and references that indicate a follow-up. */
const FOLLOW_UP_PATTERNS = [
  /\b(what about|how about|and if|but what if|what if)\b/i,
  /\b(in that case|in this case|then what|so can)\b/i,
  /\b(can i|can they|can he|can she|should i)\b/i,
  /\b(that|this|those|these|the same|it)\b.*\?/i,
  /\b(also|additionally|furthermore|moreover)\b/i,
  /\b(instead|alternatively|or else)\b/i,
  /\b(you (said|mentioned|explained|stated))\b/i,
  /\b(as you said|like you said|earlier|previously|before)\b/i,
  /\b(follow.?up|related|another question about)\b/i,
];

/** Signals that the user is starting a completely new topic. */
const NEW_TOPIC_PATTERNS = [
  /\b(different (question|topic)|new question|unrelated)\b/i,
  /\b(changing (topic|subject)|separate question|another topic)\b/i,
  /\b(by the way|btw|on a different note)\b/i,
  /\b(i (also |)want to (ask|know) about)\b/i,
];

/** Legal domain keywords grouped by topic for domain-overlap detection. */
const LEGAL_DOMAINS: Record<string, RegExp> = {
  arrest:   /\b(arrest|detain|custody|bail|fir|police station|remand)\b/i,
  property: /\b(tenant|landlord|rent|evict|property|lease|premises)\b/i,
  traffic:  /\b(traffic|challan|vehicle|driving|licence|motor)\b/i,
  consumer: /\b(consumer|refund|defective|product|complaint|warranty)\b/i,
  work:     /\b(employer|employee|salary|wages|termination|workplace)\b/i,
  family:   /\b(divorce|custody|maintenance|marriage|dowry|domestic)\b/i,
  rights:   /\b(fundamental|constitution|article|right to|freedom)\b/i,
};

// ---------------------------------------------------------------------------
// Domain detection
// ---------------------------------------------------------------------------

function detectDomains(text: string): Set<string> {
  const domains = new Set<string>();
  for (const [domain, pattern] of Object.entries(LEGAL_DOMAINS)) {
    if (pattern.test(text)) {
      domains.add(domain);
    }
  }
  return domains;
}

function domainOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const domain of a) {
    if (b.has(domain)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

/**
 * Classify whether the current query is a follow-up to the conversation
 * or the start of a new topic. Pure rule-based — no LLM call.
 *
 * @param currentQuery  The user's current (normalized) query text.
 * @param history       Recent conversation turns (last 4-8 messages).
 * @returns             Intent classification with confidence score.
 */
export function classifyIntent(
  currentQuery: string,
  history: ConversationTurn[],
): ConversationIntent {
  // No history → always a new topic
  if (history.length === 0) {
    return { type: 'new-topic', confidence: 1.0 };
  }

  let followUpScore = 0;
  let newTopicScore = 0;

  // --- Signal 1: Explicit new-topic markers ---
  for (const pattern of NEW_TOPIC_PATTERNS) {
    if (pattern.test(currentQuery)) {
      newTopicScore += 3;
      break; // One match is enough
    }
  }

  // --- Signal 2: Follow-up language patterns ---
  for (const pattern of FOLLOW_UP_PATTERNS) {
    if (pattern.test(currentQuery)) {
      followUpScore += 2;
    }
  }
  // Cap pattern score to avoid over-counting
  followUpScore = Math.min(followUpScore, 6);

  // --- Signal 3: Query length heuristic ---
  // Short queries after substantive exchanges are likely follow-ups
  const lastUserTurn = history.filter((t) => t.role === 'user').at(-1);
  if (lastUserTurn && currentQuery.length < 40 && lastUserTurn.content.length > 40) {
    followUpScore += 2;
  }
  // Long, detailed queries are more likely standalone
  if (currentQuery.length > 120) {
    newTopicScore += 1;
  }

  // --- Signal 4: Domain overlap ---
  const currentDomains = detectDomains(currentQuery);
  const previousContent = history
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join(' ');
  const previousDomains = detectDomains(previousContent);

  if (currentDomains.size > 0 && previousDomains.size > 0) {
    if (domainOverlap(currentDomains, previousDomains)) {
      followUpScore += 2;
    } else {
      newTopicScore += 2;
    }
  }

  // --- Signal 5: Question ends with "?" and is very short (< 25 chars) ---
  if (currentQuery.endsWith('?') && currentQuery.length < 25) {
    followUpScore += 1;
  }

  // --- Decision ---
  const total = followUpScore + newTopicScore;
  if (total === 0) {
    // No signals either way — treat as new topic (safer)
    return { type: 'new-topic', confidence: 0.5 };
  }

  if (newTopicScore > followUpScore) {
    return {
      type: 'new-topic',
      confidence: Math.min(newTopicScore / total, 1.0),
    };
  }

  // Distinguish between follow-up and clarification
  // Clarification = very short query that seems to ask for more detail
  const isClarification =
    currentQuery.length < 30 &&
    /\b(explain|clarify|what do you mean|meaning|elaborate)\b/i.test(currentQuery);

  return {
    type: isClarification ? 'clarification' : 'follow-up',
    confidence: Math.min(followUpScore / total, 1.0),
  };
}
