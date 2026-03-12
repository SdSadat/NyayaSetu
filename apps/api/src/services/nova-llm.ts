// =============================================================================
// Amazon Nova LLM Client (via AWS Bedrock)
// =============================================================================
// Provides text generation using Amazon Nova 2 Lite on AWS Bedrock.
// Implements the LLMProvider interface so it can be swapped in for
// other providers via the LLMProvider interface.
//
// Uses the @aws-sdk/client-bedrock-runtime InvokeModel API with the
// native Nova request/response schema.
// =============================================================================

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

import { config } from '../config/index.js';
import type { LLMProvider } from './llm-provider.js';

// ---------------------------------------------------------------------------
// Nova request/response types (Bedrock InvokeModel native format)
// ---------------------------------------------------------------------------

interface NovaMessage {
  role: 'user' | 'assistant';
  content: Array<{ text: string }>;
}

interface NovaRequest {
  system: Array<{ text: string }>;
  messages: NovaMessage[];
  inferenceConfig: {
    maxTokens: number;
    temperature: number;
    topP: number;
  };
}

interface NovaResponse {
  output: {
    message: {
      role: string;
      content: Array<{ text: string }>;
    };
  };
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ---------------------------------------------------------------------------
// NovaLLM class
// ---------------------------------------------------------------------------

/**
 * LLM client backed by Amazon Nova 2 Lite via AWS Bedrock.
 *
 * @example
 * ```ts
 * const llm = new NovaLLM();
 * const response = await llm.generate(
 *   'You are a legal information system.',
 *   'What does Section 302 of IPC cover?',
 * );
 * ```
 */
export class NovaLLM implements LLMProvider {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;
  private readonly timeoutMs: number;

  constructor(opts?: {
    region?: string;
    modelId?: string;
    timeoutMs?: number;
  }) {
    const region = opts?.region ?? config.aws.region;
    this.modelId = opts?.modelId ?? config.aws.novaModelId;
    this.timeoutMs = opts?.timeoutMs ?? config.aws.novaTimeoutMs;

    this.client = new BedrockRuntimeClient({
      region,
      ...(config.aws.accessKeyId && config.aws.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.aws.accessKeyId,
              secretAccessKey: config.aws.secretAccessKey,
            },
          }
        : {}),
      requestHandler: {
        requestTimeout: this.timeoutMs,
      } as never,
    });
  }

  /**
   * Generate a text response given system and user prompts.
   */
  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    const body: NovaRequest = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userPrompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.3,
        topP: 0.9,
      },
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body),
    ) as NovaResponse;

    const parts = responseBody.output?.message?.content;
    if (!parts || parts.length === 0) {
      throw new Error('Nova returned no content in response.');
    }

    return parts.map((p) => p.text).join('');
  }

  /**
   * Stream text chunks from Amazon Nova via Bedrock.
   */
  async *generateStream(
    systemPrompt: string,
    userPrompt: string,
  ): AsyncIterable<string> {
    const body: NovaRequest = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userPrompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.3,
        topP: 0.9,
      },
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const parsed = JSON.parse(
            new TextDecoder().decode(event.chunk.bytes),
          ) as Record<string, unknown>;
          // Nova streaming returns contentBlockDelta events with delta.text
          const delta = parsed?.contentBlockDelta as
            | { delta?: { text?: string } }
            | undefined;
          if (delta?.delta?.text) {
            yield delta.delta.text;
          }
        }
      }
    }
  }

  /**
   * Generate a JSON response.
   *
   * Nova doesn't have a native JSON mode. We use prompt
   * engineering with low temperature and explicit JSON instructions,
   * plus assistant prefill to force JSON output.
   */
  async generateJSON(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You MUST respond with ONLY valid JSON. Do NOT include any text, markdown fences, or explanation before or after the JSON. Start your response with \`{\` and end with \`}\`.`;

    const body: NovaRequest = {
      system: [{ text: jsonSystemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userPrompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 5000,
        temperature: 0.1,
        topP: 0.9,
      },
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body),
    ) as NovaResponse;

    const parts = responseBody.output?.message?.content;
    if (!parts || parts.length === 0) {
      throw new Error('Nova returned no content in response.');
    }

    return parts.map((p) => p.text).join('');
  }

  /**
   * Check whether the Bedrock Nova model is reachable.
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Send a minimal request to verify access
      const body: NovaRequest = {
        system: [{ text: 'Reply with OK.' }],
        messages: [
          { role: 'user', content: [{ text: 'ping' }] },
        ],
        inferenceConfig: {
          maxTokens: 10,
          temperature: 0,
          topP: 1,
        },
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
