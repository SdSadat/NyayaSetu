// =============================================================================
// LLM Provider Interface
// =============================================================================
// Common interface for LLM backends (Amazon Nova via Bedrock).
// The response-generator uses this to abstract over the concrete provider.
// =============================================================================

/**
 * A provider that can generate text from system + user prompts.
 */
export interface LLMProvider {
  /**
   * Generate a text response given system and user prompts.
   */
  generate(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Generate a streaming response. Yields text chunks as they arrive.
   */
  generateStream?(
    systemPrompt: string,
    userPrompt: string,
  ): AsyncIterable<string>;

  /**
   * Generate a guaranteed JSON response. The implementation should use
   * native JSON mode where the provider supports it. Nova uses prompt
   * engineering for JSON output.
   *
   * The returned string is a raw JSON string — callers must parse it.
   */
  generateJSON(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Check whether the provider is reachable and operational.
   */
  isAvailable(): Promise<boolean>;
}
