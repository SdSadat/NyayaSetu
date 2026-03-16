// =============================================================================
// LLM Provider Interface
// =============================================================================
// Common interface for LLM backends (Amazon Nova via Bedrock).
// The response-generator uses this to abstract over the concrete provider.
// =============================================================================

/** A single message in a multi-turn conversation. */
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * A provider that can generate text from system + user prompts.
 */
export interface LLMProvider {
  /**
   * Generate a text response given system and user prompts.
   */
  generate(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Generate a text response from a multi-turn conversation.
   * The messages array contains alternating user/assistant turns,
   * with the final message being the current user query.
   */
  generateWithMessages(systemPrompt: string, messages: LLMMessage[]): Promise<string>;

  /**
   * Generate a guaranteed JSON response. The implementation should use
   * native JSON mode where the provider supports it. Nova uses prompt
   * engineering for JSON output.
   *
   * The returned string is a raw JSON string — callers must parse it.
   */
  generateJSON(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Generate a JSON response from a multimodal prompt (text + image).
   * Optional — only providers with vision capabilities implement this.
   */
  generateJSONWithImage?(
    systemPrompt: string,
    userPrompt: string,
    imageBytes: Buffer,
    imageFormat: 'png' | 'jpeg' | 'gif' | 'webp',
  ): Promise<string>;

  /**
   * Check whether the provider is reachable and operational.
   */
  isAvailable(): Promise<boolean>;
}
