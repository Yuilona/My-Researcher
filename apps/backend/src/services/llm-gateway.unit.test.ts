import assert from 'node:assert/strict';
import test from 'node:test';
import type { LiteratureContentProcessingSettingsService } from './literature-content-processing-settings-service.js';
import { BackendLlmGateway, LlmGatewayError } from './llm-gateway.js';

function createSettingsService(): LiteratureContentProcessingSettingsService {
  return {
    resolveOpenAIProviderApiKey: async () => 'sk-test',
    resolveDashScopeProviderApiKey: async () => 'sk-dashscope-test',
  } as LiteratureContentProcessingSettingsService;
}

test('LLM gateway maps structured Responses output and telemetry', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async (_input, init) => {
      calls.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify({
        output_text: JSON.stringify({ ok: true }),
        usage: { input_tokens: 11, output_tokens: 7, total_tokens: 18 },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  const response = await gateway.createStructuredOutput<{ ok: boolean }>({
    executionContext: { feature: 'test', operation: 'structured' },
    model: { providerId: 'openai', modelId: 'gpt-test', profileId: 'test-profile' },
    prompt: { promptTemplateId: 'test-prompt', version: 'v1' },
    messages: [{ role: 'user', content: 'return ok' }],
    schemaName: 'ok_schema',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['ok'],
      properties: { ok: { type: 'boolean' } },
    },
  });

  assert.equal(response.parsed.ok, true);
  assert.equal(response.telemetry.model_id, 'gpt-test');
  assert.equal(response.telemetry.prompt_template_id, 'test-prompt');
  assert.equal(response.telemetry.request_count, 1);
  assert.equal(response.telemetry.input_tokens, 11);
  assert.equal(response.telemetry.output_tokens, 7);
  assert.equal(response.telemetry.total_tokens, 18);
  assert.equal(calls[0]?.model, 'gpt-test');
});

test('LLM gateway normalizes OpenAI structured output schemas to strict objects', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async (_input, init) => {
      calls.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify({
        output_text: JSON.stringify({ items: [{ ref: { id: 'ref-1', legacy: {} } }] }),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  await gateway.createStructuredOutput<{ items: Array<{ ref: { id: string; legacy: Record<string, unknown> } }> }>({
    executionContext: { feature: 'test', operation: 'strict-schema' },
    model: { providerId: 'openai', modelId: 'gpt-test', profileId: 'test-profile' },
    prompt: { promptTemplateId: 'test-prompt', version: 'v1' },
    messages: [{ role: 'user', content: 'return ok' }],
    schemaName: 'strict_schema',
    schema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['ref'],
            properties: {
              ref: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string' },
                  legacy: { anyOf: [{ type: 'object', additionalProperties: true }, { type: 'null' }] },
                },
              },
            },
          },
        },
      },
    },
  });

  const body = calls[0] as {
    text?: { format?: { schema?: Record<string, unknown> } };
  };
  const schema = body.text?.format?.schema as {
    additionalProperties?: boolean;
    required?: string[];
    properties?: {
      items?: {
        items?: {
          additionalProperties?: boolean;
          required?: string[];
          properties?: {
            ref?: {
              additionalProperties?: boolean;
              required?: string[];
              properties?: {
                legacy?: {
                  anyOf?: Array<{
                    additionalProperties?: boolean;
                    properties?: Record<string, unknown>;
                    required?: string[];
                  }>;
                };
              };
            };
          };
        };
      };
    };
  };

  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ['items']);
  assert.equal(schema.properties?.items?.items?.additionalProperties, false);
  assert.deepEqual(schema.properties?.items?.items?.required, ['ref']);
  assert.equal(schema.properties?.items?.items?.properties?.ref?.additionalProperties, false);
  assert.deepEqual(schema.properties?.items?.items?.properties?.ref?.required, ['id', 'legacy']);
  assert.equal(
    schema.properties?.items?.items?.properties?.ref?.properties?.legacy?.anyOf?.[0]?.additionalProperties,
    false,
  );
  assert.deepEqual(
    schema.properties?.items?.items?.properties?.ref?.properties?.legacy?.anyOf?.[0]?.required,
    [],
  );
  assert.deepEqual(
    schema.properties?.items?.items?.properties?.ref?.properties?.legacy?.anyOf?.[0]?.properties,
    {},
  );
});

test('LLM gateway normalizes OpenAI response format names without changing the internal schema name', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async (_input, init) => {
      calls.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify({
        output_text: JSON.stringify({ ok: true }),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  await gateway.createStructuredOutput<{ ok: boolean }>({
    executionContext: { feature: 'test', operation: 'schema-name' },
    model: { providerId: 'openai', modelId: 'gpt-test', profileId: 'test-profile' },
    prompt: { promptTemplateId: 'test-prompt', version: 'v1' },
    messages: [{ role: 'user', content: 'return ok' }],
    schemaName: 'TopicSelectionNeedAdjudicationRecommendationPacket@v1',
    schema: {
      type: 'object',
      properties: {
        schema_version: { const: 'TopicSelectionNeedAdjudicationRecommendationPacket@v1' },
        ok: { type: 'boolean' },
      },
    },
  });

  const body = calls[0] as {
    text?: {
      format?: {
        name?: string;
        schema?: {
          properties?: {
            schema_version?: {
              const?: string;
              enum?: string[];
              type?: string;
            };
          };
        };
      };
    };
  };
  assert.equal(body.text?.format?.name, 'TopicSelectionNeedAdjudicationRecommendationPacket_v1');
  assert.equal(body.text?.format?.schema?.properties?.schema_version?.const, undefined);
  assert.deepEqual(body.text?.format?.schema?.properties?.schema_version?.enum, [
    'TopicSelectionNeedAdjudicationRecommendationPacket@v1',
  ]);
  assert.equal(body.text?.format?.schema?.properties?.schema_version?.type, 'string');
});

test('LLM gateway parses embedding vectors from OpenAI data shape', async () => {
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async () => new Response(JSON.stringify({
      data: [
        { embedding: [0.1, 0.2, 0.3] },
        { embedding: [0.4, 0.5, 0.6] },
      ],
      usage: { prompt_tokens: 2, total_tokens: 2 },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch,
  });

  const response = await gateway.createEmbeddings({
    executionContext: { feature: 'test', operation: 'embedding' },
    model: { providerId: 'openai', modelId: 'text-embedding-test', profileId: 'embedding-test' },
    input: ['a', 'b'],
  });

  assert.deepEqual(response.vectors, [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
  assert.equal(response.telemetry.request_count, 1);
  assert.equal(response.telemetry.embedding_input_tokens, 2);
  assert.equal(response.telemetry.total_tokens, 2);
});

test('LLM gateway maps DashScope chat completion JSON output and telemetry', async () => {
  const calls: Array<{ input: string; body: Record<string, unknown> }> = [];
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async (input, init) => {
      calls.push({
        input: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(JSON.stringify({
        choices: [
          { message: { content: JSON.stringify({ ok: true }) } },
        ],
        usage: { prompt_tokens: 13, completion_tokens: 5, total_tokens: 18 },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  const response = await gateway.createStructuredOutput<{ ok: boolean }>({
    executionContext: { feature: 'test', operation: 'dashscope-structured' },
    model: { providerId: 'dashscope', modelId: 'qwen3.6-plus', profileId: 'default' },
    prompt: { promptTemplateId: 'test-prompt', version: 'v1' },
    messages: [{ role: 'user', content: 'return ok' }],
    schemaName: 'ok_schema',
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
    providerOverrides: { enable_thinking: false },
  });

  assert.equal(response.parsed.ok, true);
  assert.equal(response.telemetry.provider_id, 'dashscope');
  assert.equal(response.telemetry.model_id, 'qwen3.6-plus');
  assert.equal(response.telemetry.input_tokens, 13);
  assert.equal(response.telemetry.output_tokens, 5);
  assert.equal(calls[0]?.input, 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions');
  assert.equal(calls[0]?.body.model, 'qwen3.6-plus');
  assert.deepEqual(calls[0]?.body.response_format, { type: 'json_object' });
  assert.deepEqual(calls[0]?.body.extra_body, { enable_thinking: false });
});

test('LLM gateway retries rate limits and records canonical telemetry', async () => {
  let callCount = 0;
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ error: { message: 'slow down' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '0.001' },
        });
      }
      return new Response(JSON.stringify({ output_text: JSON.stringify({ ok: true }) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  const response = await gateway.createStructuredOutput<{ ok: boolean }>({
    executionContext: { feature: 'test', operation: 'retry' },
    model: { providerId: 'openai', modelId: 'gpt-test' },
    prompt: { promptTemplateId: 'retry-prompt', version: 'v1' },
    messages: [{ role: 'user', content: 'return ok' }],
    schemaName: 'ok_schema',
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
    policy: { maxRetries: 1, timeoutMs: 1_000 },
  });

  assert.equal(response.parsed.ok, true);
  assert.equal(response.telemetry.request_count, 2);
  assert.equal(response.telemetry.retry_count, 1);
  assert.equal(response.telemetry.rate_limit_count, 1);
});

test('LLM gateway retries empty 404 provider responses as transient failures', async () => {
  let callCount = 0;
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response('', { status: 404 });
      }
      return new Response(JSON.stringify({ output_text: JSON.stringify({ ok: true }) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  const response = await gateway.createStructuredOutput<{ ok: boolean }>({
    executionContext: { feature: 'test', operation: 'empty-404' },
    model: { providerId: 'openai', modelId: 'gpt-test' },
    prompt: { promptTemplateId: 'empty-404-prompt', version: 'v1' },
    messages: [{ role: 'user', content: 'return ok' }],
    schemaName: 'ok_schema',
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
    policy: { maxRetries: 1, timeoutMs: 1_000 },
  });

  assert.equal(response.parsed.ok, true);
  assert.equal(response.telemetry.request_count, 2);
  assert.equal(response.telemetry.retry_count, 1);
});

test('LLM gateway maps timeout failures', async () => {
  const gateway = new BackendLlmGateway({
    settingsService: createSettingsService(),
    fetchImpl: (async (_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    })) as typeof fetch,
  });

  await assert.rejects(
    () => gateway.createEmbeddings({
      executionContext: { feature: 'test', operation: 'timeout' },
      model: { providerId: 'openai', modelId: 'text-embedding-test' },
      input: 'query',
      policy: { timeoutMs: 1, maxRetries: 0 },
    }),
    (error) => {
      assert.ok(error instanceof LlmGatewayError);
      assert.equal(error.code, 'TimeoutError');
      assert.equal(error.telemetry?.timeout_count, 1);
      return true;
    },
  );
});
