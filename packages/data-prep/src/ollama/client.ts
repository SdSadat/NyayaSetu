// =============================================================================
// Ollama LLM Provider — Implementation
// =============================================================================
// Implements the LLMProvider interface using Ollama's REST API.
// Uses raw fetch() — no SDK dependency. Can be swapped for OpenAI, Vertex AI,
// Anthropic, or any other provider by implementing the same LLMProvider interface.
// =============================================================================

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  DataPrepConfig,
} from '../types.js';
import { OllamaError } from '../types.js';

// ---------------------------------------------------------------------------
// Internal types for Ollama REST API
// ---------------------------------------------------------------------------

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream: false;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
  };
  format?: 'json';
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration: number;
  eval_count: number;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
  }>;
}

// ---------------------------------------------------------------------------
// OllamaProvider
// ---------------------------------------------------------------------------

/**
 * Ollama implementation of {@link LLMProvider}.
 *
 * Uses Ollama's REST API (`POST /api/generate`) with streaming disabled.
 * All errors are wrapped in {@link OllamaError} with stage `'llm'`.
 *
 * Can be replaced with `OpenAIProvider`, `VertexAIProvider`, etc. — the
 * pipeline only depends on the {@link LLMProvider} interface.
 */
export class OllamaProvider implements LLMProvider {
  readonly modelName: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    config: Pick<
      DataPrepConfig,
      'ollamaBaseUrl' | 'ollamaModel' | 'ollamaTimeoutMs'
    >,
  ) {
    this.baseUrl = config.ollamaBaseUrl.replace(/\/+$/, '');
    this.modelName = config.ollamaModel;
    this.timeoutMs = config.ollamaTimeoutMs;
  }

  // -------------------------------------------------------------------------
  // LLMProvider.generate
  // -------------------------------------------------------------------------

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const body = this.buildRequestBody(request);

    let responseText: string;
    let durationMs: number;

    try {
      const result = await this.callOllama(body);
      responseText = result.responseText;
      durationMs = result.durationMs;
    } catch (error) {
      throw this.wrapError('Generate request failed', error);
    }

    // If JSON format was requested, validate the response is valid JSON.
    // On failure, retry once with a nudge appended to the prompt.
    if (request.format === 'json' && !this.isValidJson(responseText)) {
      const retryBody = this.buildRequestBody({
        ...request,
        prompt: request.prompt + '\n\nRespond ONLY with valid JSON.',
      });

      try {
        const retryResult = await this.callOllama(retryBody);
        responseText = retryResult.responseText;
        durationMs += retryResult.durationMs;
      } catch (error) {
        throw this.wrapError(
          'JSON retry request failed after initial malformed response',
          error,
        );
      }

      if (!this.isValidJson(responseText)) {
        throw new OllamaError(
          `Model returned invalid JSON after retry. Response starts with: "${responseText.slice(0, 200)}"`,
          'llm',
        );
      }
    }

    return { text: responseText, durationMs };
  }

  // -------------------------------------------------------------------------
  // LLMProvider.isAvailable
  // -------------------------------------------------------------------------

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);

      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as OllamaTagsResponse;

      // Match by prefix to handle `:tag` suffixes (e.g. "mistral:latest")
      const modelAvailable = data.models.some(
        (m) =>
          m.name === this.modelName ||
          m.name.startsWith(`${this.modelName}:`) ||
          m.model === this.modelName ||
          m.model.startsWith(`${this.modelName}:`),
      );

      return modelAvailable;
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildRequestBody(request: LLMRequest): OllamaGenerateRequest {
    const body: OllamaGenerateRequest = {
      model: this.modelName,
      prompt: request.prompt,
      stream: false as const,
    };

    if (request.system) {
      body.system = request.system;
    }

    if (request.format === 'json') {
      body.format = 'json';
    }

    if (request.options) {
      body.options = {};
      if (request.options.temperature !== undefined) {
        body.options.temperature = request.options.temperature;
      }
      if (request.options.maxTokens !== undefined) {
        body.options.num_predict = request.options.maxTokens;
      }
    }

    return body;
  }

  private async callOllama(
    body: OllamaGenerateRequest,
  ): Promise<{ responseText: string; durationMs: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new OllamaError(
          `Request timed out after ${this.timeoutMs}ms`,
          'llm',
        );
      }

      throw new OllamaError(
        `Network error connecting to Ollama at ${this.baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
        'llm',
        error instanceof Error ? error : undefined,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // Ignore errors reading error body
      }
      throw new OllamaError(
        `Ollama returned HTTP ${response.status}: ${errorBody || response.statusText}`,
        'llm',
      );
    }

    let data: OllamaGenerateResponse;
    try {
      data = (await response.json()) as OllamaGenerateResponse;
    } catch (error) {
      throw new OllamaError(
        'Failed to parse Ollama response as JSON',
        'llm',
        error instanceof Error ? error : undefined,
      );
    }

    if (typeof data.response !== 'string') {
      throw new OllamaError(
        'Unexpected Ollama response shape: missing "response" field',
        'llm',
      );
    }

    // Ollama reports total_duration in nanoseconds — convert to milliseconds
    const durationMs =
      typeof data.total_duration === 'number'
        ? data.total_duration / 1_000_000
        : 0;

    return { responseText: data.response, durationMs };
  }

  private isValidJson(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  private wrapError(message: string, error: unknown): OllamaError {
    if (error instanceof OllamaError) {
      return error;
    }
    return new OllamaError(
      `${message}: ${error instanceof Error ? error.message : String(error)}`,
      'llm',
      error instanceof Error ? error : undefined,
    );
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Factory function for creating an OllamaProvider from config. */
export function createOllamaProvider(
  config: Pick<
    DataPrepConfig,
    'ollamaBaseUrl' | 'ollamaModel' | 'ollamaTimeoutMs'
  >,
): LLMProvider {
  return new OllamaProvider(config);
}
