import type { LiteratureContentProcessingSettingsService } from './literature-content-processing-settings-service.js';

export type LlmGatewayErrorCode =
  | 'AuthError'
  | 'RateLimitError'
  | 'TimeoutError'
  | 'TransientError'
  | 'InvalidRequestError'
  | 'UpstreamError'
  | 'BudgetExceededError';

export type LlmExecutionContext = {
  feature: string;
  operation: string;
  traceId?: string;
  literatureId?: string;
  metadata?: Record<string, unknown>;
  budget?: {
    timeout_ms?: number;
  };
};

export type LlmModelRef = {
  providerId: 'openai' | 'dashscope';
  modelId: string;
  profileId?: string;
};

export type LlmPromptRef = {
  promptTemplateId: string;
  version: string;
};

export type LlmRequestPolicy = {
  timeoutMs?: number;
  maxRetries?: number;
};

export type LlmCallTelemetry = {
  provider_id: LlmModelRef['providerId'];
  model_id: string;
  profile_id: string | null;
  prompt_template_id: string | null;
  prompt_template_version: string | null;
  elapsed_ms: number;
  request_count: number;
  retry_count: number;
  timeout_count: number;
  rate_limit_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  embedding_input_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
};

export class LlmGatewayError extends Error {
  constructor(
    readonly code: LlmGatewayErrorCode,
    message: string,
    readonly options: {
      statusCode?: number;
      retryable?: boolean;
      retryAfterMs?: number;
      telemetry?: LlmCallTelemetry;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'LlmGatewayError';
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }

  get retryable(): boolean {
    return this.options.retryable ?? false;
  }

  get statusCode(): number | undefined {
    return this.options.statusCode;
  }

  get telemetry(): LlmCallTelemetry | undefined {
    return this.options.telemetry;
  }

  get retryAfterMs(): number | undefined {
    return this.options.retryAfterMs;
  }
}

export type LlmStructuredOutputRequest = {
  executionContext: LlmExecutionContext;
  model: LlmModelRef;
  prompt: LlmPromptRef;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  schemaName: string;
  schema: Record<string, unknown>;
  policy?: LlmRequestPolicy;
};

export type LlmStructuredOutputResponse<T> = {
  parsed: T;
  raw: Record<string, unknown>;
  telemetry: LlmCallTelemetry;
};

export type LlmEmbeddingRequest = {
  executionContext: LlmExecutionContext;
  model: LlmModelRef;
  input: string | string[];
  dimensions?: number | null;
  policy?: LlmRequestPolicy;
};

export type LlmEmbeddingResponse = {
  vectors: number[][];
  raw: Record<string, unknown>;
  telemetry: LlmCallTelemetry;
};

type RetryTelemetryState = {
  requestCount: number;
  retryCount: number;
  timeoutCount: number;
  rateLimitCount: number;
};

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeOpenAiStructuredOutputSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map((item) => normalizeOpenAiStructuredOutputSchema(item));
  }
  if (!isRecord(schema)) {
    return schema;
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'properties' && isRecord(value)) {
      normalized.properties = Object.fromEntries(
        Object.entries(value).map(([propertyKey, propertySchema]) => [
          propertyKey,
          normalizeOpenAiStructuredOutputSchema(propertySchema),
        ]),
      );
      continue;
    }
    normalized[key] = normalizeOpenAiStructuredOutputSchema(value);
  }

  if (normalized.type === 'object' || isRecord(normalized.properties)) {
    if (!isRecord(normalized.properties)) {
      normalized.properties = {};
    }
    normalized.additionalProperties = false;
    normalized.required = isRecord(normalized.properties)
      ? Object.keys(normalized.properties)
      : [];
  }

  return normalized;
}

export class BackendLlmGateway {
  constructor(
    private readonly options: {
      settingsService?: LiteratureContentProcessingSettingsService;
      fetchImpl?: typeof fetch;
      defaultTimeoutMs?: number;
      defaultMaxRetries?: number;
    } = {},
  ) {}

  async createStructuredOutput<T>(
    request: LlmStructuredOutputRequest,
  ): Promise<LlmStructuredOutputResponse<T>> {
    const apiKey = await this.resolveProviderApiKey(request.model.providerId);
    const startedAt = Date.now();
    const state: RetryTelemetryState = {
      requestCount: 0,
      retryCount: 0,
      timeoutCount: 0,
      rateLimitCount: 0,
    };

    const raw = await this.runWithRetry({
      model: request.model,
      prompt: request.prompt,
      executionContext: request.executionContext,
      policy: request.policy,
      state,
      startedAt,
      operation: async (signal) => this.requestStructuredOutput(request, apiKey, signal),
    });

    const parsed = this.readStructuredPayload(raw);
    if (!parsed) {
      throw new LlmGatewayError(
        'UpstreamError',
        'LLM structured output response did not include parseable JSON.',
        {
          retryable: false,
          telemetry: this.buildTelemetry(request.model, request.prompt, startedAt, state, raw),
        },
      );
    }

    return {
      parsed: parsed as T,
      raw,
      telemetry: this.buildTelemetry(request.model, request.prompt, startedAt, state, raw),
    };
  }

  async createEmbeddings(request: LlmEmbeddingRequest): Promise<LlmEmbeddingResponse> {
    if (request.model.providerId !== 'openai') {
      throw new LlmGatewayError('InvalidRequestError', `Embeddings are not implemented for provider ${request.model.providerId}.`, {
        retryable: false,
      });
    }
    const apiKey = await this.resolveOpenAIApiKey();
    const startedAt = Date.now();
    const state: RetryTelemetryState = {
      requestCount: 0,
      retryCount: 0,
      timeoutCount: 0,
      rateLimitCount: 0,
    };
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const body: Record<string, unknown> = {
      model: request.model.modelId,
      input: request.input,
      encoding_format: 'float',
    };
    if (request.dimensions !== null && request.dimensions !== undefined) {
      body.dimensions = request.dimensions;
    }

    const raw = await this.runWithRetry({
      model: request.model,
      prompt: null,
      executionContext: request.executionContext,
      policy: request.policy,
      state,
      startedAt,
      operation: async (signal) => {
        const response = await this.fetchProvider('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal,
          body: JSON.stringify(body),
        });
        return this.readJsonResponse(response);
      },
    });

    const vectors = this.readEmbeddingVectors(raw);
    if (vectors.length !== inputs.length || vectors.some((vector) => vector.length === 0)) {
      throw new LlmGatewayError('UpstreamError', 'LLM embedding response shape mismatch.', {
        retryable: false,
        telemetry: this.buildTelemetry(request.model, null, startedAt, state, raw),
      });
    }

    return {
      vectors,
      raw,
      telemetry: this.buildTelemetry(request.model, null, startedAt, state, raw),
    };
  }

  private async runWithRetry<T>(input: {
    model: LlmModelRef;
    prompt: LlmPromptRef | null;
    executionContext: LlmExecutionContext;
    policy: LlmRequestPolicy | undefined;
    state: RetryTelemetryState;
    startedAt: number;
    operation: (signal: AbortSignal) => Promise<T>;
  }): Promise<T> {
    const timeoutMs = this.normalizePositiveInteger(
      input.policy?.timeoutMs ?? input.executionContext.budget?.timeout_ms ?? this.options.defaultTimeoutMs,
      DEFAULT_TIMEOUT_MS,
    );
    const maxRetries = Math.max(
      0,
      Math.min(3, this.normalizeNonNegativeInteger(input.policy?.maxRetries ?? this.options.defaultMaxRetries, DEFAULT_MAX_RETRIES)),
    );

    let lastError: LlmGatewayError | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      input.state.requestCount += 1;
      try {
        const value = await input.operation(controller.signal);
        clearTimeout(timer);
        return value;
      } catch (error) {
        clearTimeout(timer);
        const mapped = this.mapError(error);
        if (mapped.code === 'TimeoutError') {
          input.state.timeoutCount += 1;
        }
        if (mapped.code === 'RateLimitError') {
          input.state.rateLimitCount += 1;
        }
        lastError = mapped;
        if (!mapped.retryable || attempt >= maxRetries) {
          throw new LlmGatewayError(mapped.code, mapped.message, {
            statusCode: mapped.statusCode,
            retryable: false,
            retryAfterMs: mapped.retryAfterMs,
            telemetry: this.buildTelemetry(input.model, input.prompt, input.startedAt, input.state),
            cause: error,
          });
        }
        input.state.retryCount += 1;
        await this.delay(this.computeRetryDelayMs(mapped, attempt));
      }
    }

    throw lastError ?? new LlmGatewayError('UpstreamError', 'LLM request failed.', {
      telemetry: this.buildTelemetry(input.model, input.prompt, input.startedAt, input.state),
    });
  }

  private async readJsonResponse(response: Response): Promise<Record<string, unknown>> {
    if (!response.ok) {
      const message = await this.tryReadErrorMessage(response);
      throw this.mapHttpError(response.status, message, this.readRetryAfterMs(response, message));
    }
    const payload = await response.json() as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new LlmGatewayError('UpstreamError', 'LLM response body was not a JSON object.', { retryable: false });
    }
    return payload as Record<string, unknown>;
  }

  private async fetchProvider(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> {
    if (this.options.fetchImpl) {
      return this.options.fetchImpl(input, init);
    }
    return globalThis.fetch(input, init);
  }

  private async requestStructuredOutput(
    request: LlmStructuredOutputRequest,
    apiKey: string,
    signal: AbortSignal,
  ): Promise<Record<string, unknown>> {
    if (request.model.providerId === 'openai') {
      const response = await this.fetchProvider('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model: request.model.modelId,
          input: request.messages,
          text: {
            format: {
              type: 'json_schema',
              name: request.schemaName,
              strict: true,
              schema: normalizeOpenAiStructuredOutputSchema(request.schema),
            },
          },
        }),
      });
      return this.readJsonResponse(response);
    }

    const response = await this.fetchProvider(`${this.resolveDashScopeBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: request.model.modelId,
        messages: request.messages,
        response_format: { type: 'json_object' },
        extra_body: { enable_thinking: true },
      }),
    });
    return this.readJsonResponse(response);
  }

  private async resolveOpenAIApiKey(): Promise<string> {
    const settings = this.options.settingsService as (LiteratureContentProcessingSettingsService & {
      resolveOpenAIExtractionConfig?: () => Promise<{ apiKey?: string } | null>;
      resolveOpenAIEmbeddingConfig?: () => Promise<{ apiKey?: string } | null>;
    }) | undefined;
    const apiKey = await settings?.resolveOpenAIProviderApiKey?.()
      ?? (await settings?.resolveOpenAIExtractionConfig?.())?.apiKey?.trim()
      ?? (await settings?.resolveOpenAIEmbeddingConfig?.())?.apiKey?.trim()
      ?? process.env.OPENAI_API_KEY?.trim()
      ?? '';
    if (!apiKey) {
      throw new LlmGatewayError('AuthError', 'OpenAI API key is not configured.', { retryable: false });
    }
    return apiKey;
  }

  private async resolveDashScopeApiKey(): Promise<string> {
    const settings = this.options.settingsService as (LiteratureContentProcessingSettingsService & {
      resolveDashScopeProviderApiKey?: () => Promise<string | null>;
    }) | undefined;
    const apiKey = await settings?.resolveDashScopeProviderApiKey?.()
      ?? process.env.DASHSCOPE_API_KEY?.trim()
      ?? '';
    if (!apiKey) {
      throw new LlmGatewayError('AuthError', 'DashScope API key is not configured.', { retryable: false });
    }
    return apiKey;
  }

  private async resolveProviderApiKey(providerId: LlmModelRef['providerId']): Promise<string> {
    return providerId === 'dashscope'
      ? this.resolveDashScopeApiKey()
      : this.resolveOpenAIApiKey();
  }

  private resolveDashScopeBaseUrl(): string {
    const value = process.env.DASHSCOPE_BASE_URL?.trim()
      || 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1';
    return value.replace(/\/+$/u, '');
  }

  private mapHttpError(status: number, message: string, retryAfterMs?: number): LlmGatewayError {
    if (status === 401 || status === 403) {
      return new LlmGatewayError('AuthError', `LLM provider authentication failed with status ${status}: ${message}`, {
        statusCode: status,
        retryable: false,
      });
    }
    if (status === 429) {
      return new LlmGatewayError('RateLimitError', `LLM provider rate limited the request: ${message}`, {
        statusCode: status,
        retryable: true,
        retryAfterMs,
      });
    }
    if (status === 408) {
      return new LlmGatewayError('TimeoutError', `LLM provider timed out with status ${status}: ${message}`, {
        statusCode: status,
        retryable: true,
      });
    }
    if (status >= 400 && status < 500) {
      if (status === 404 && message.trim().length === 0) {
        return new LlmGatewayError('TransientError', 'LLM provider returned an empty 404 response.', {
          statusCode: status,
          retryable: true,
          retryAfterMs,
        });
      }
      return new LlmGatewayError('InvalidRequestError', `LLM provider rejected the request with status ${status}: ${message}`, {
        statusCode: status,
        retryable: false,
      });
    }
    if (status >= 500 && status < 600) {
      return new LlmGatewayError('TransientError', `LLM provider failed with status ${status}: ${message}`, {
        statusCode: status,
        retryable: true,
      });
    }
    return new LlmGatewayError('UpstreamError', `LLM provider returned unexpected status ${status}: ${message}`, {
      statusCode: status,
      retryable: false,
    });
  }

  private mapError(error: unknown): LlmGatewayError {
    if (error instanceof LlmGatewayError) {
      return error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmGatewayError('TimeoutError', 'LLM request timed out.', { retryable: true, cause: error });
    }
    if (error instanceof Error) {
      return new LlmGatewayError('TransientError', error.message, { retryable: true, cause: error });
    }
    return new LlmGatewayError('UpstreamError', 'Unknown LLM provider error.', { retryable: false, cause: error });
  }

  private async tryReadErrorMessage(response: Response): Promise<string> {
    try {
      const payload = await response.clone().json() as Record<string, unknown>;
      const error = payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error)
        ? payload.error as Record<string, unknown>
        : null;
      const message = typeof error?.message === 'string' ? error.message : null;
      return message ?? JSON.stringify(payload).slice(0, 500);
    } catch {
      try {
        return (await response.text()).slice(0, 500);
      } catch {
        return 'unable to read response body';
      }
    }
  }

  private readRetryAfterMs(response: Response, message: string): number | undefined {
    const header = response.headers.get('retry-after')?.trim();
    const headerSeconds = header ? Number(header) : NaN;
    if (Number.isFinite(headerSeconds) && headerSeconds >= 0) {
      return Math.min(60_000, Math.max(1, Math.ceil(headerSeconds * 1000)));
    }
    if (header) {
      const headerDate = Date.parse(header);
      if (Number.isFinite(headerDate)) {
        return Math.min(60_000, Math.max(1, headerDate - Date.now()));
      }
    }
    const messageMatch = message.match(/try again in\s+([0-9.]+)s/i);
    if (messageMatch) {
      const seconds = Number(messageMatch[1]);
      if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(60_000, Math.max(1, Math.ceil(seconds * 1000)));
      }
    }
    return undefined;
  }

  private readStructuredPayload(payload: Record<string, unknown>): Record<string, unknown> | null {
    const direct = this.tryReadObject(payload.output_parsed) ?? this.tryParseJsonObject(payload.output_text);
    if (direct) {
      return direct;
    }
    const output = Array.isArray(payload.output) ? payload.output : [];
    for (const item of output) {
      const row = this.tryReadObject(item);
      const content = Array.isArray(row?.content) ? row.content : [];
      for (const contentItem of content) {
        const contentRow = this.tryReadObject(contentItem);
        const parsed = this.tryReadObject(contentRow?.parsed) ?? this.tryParseJsonObject(contentRow?.text);
        if (parsed) {
          return parsed;
        }
      }
    }
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    for (const choice of choices) {
      const row = this.tryReadObject(choice);
      const message = this.tryReadObject(row?.message);
      const parsed = this.tryParseJsonObject(message?.content);
      if (parsed) {
        return parsed;
      }
    }
    return null;
  }

  private readEmbeddingVectors(payload: Record<string, unknown>): number[][] {
    if (Array.isArray(payload.vectors)) {
      return payload.vectors
        .map((item) => (Array.isArray(item) ? this.normalizeVector(item) : []))
        .filter((item) => item.length > 0);
    }
    if (Array.isArray(payload.data)) {
      return payload.data
        .map((row) => {
          const item = this.tryReadObject(row);
          return Array.isArray(item?.embedding) ? this.normalizeVector(item.embedding) : [];
        })
        .filter((item) => item.length > 0);
    }
    return [];
  }

  private normalizeVector(values: unknown[]): number[] {
    return values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  }

  private tryReadObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  }

  private tryParseJsonObject(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'string') {
      return null;
    }
    try {
      return this.tryReadObject(JSON.parse(value));
    } catch {
      return null;
    }
  }

  private buildTelemetry(
    model: LlmModelRef,
    prompt: LlmPromptRef | null,
    startedAt: number,
    state: RetryTelemetryState,
    raw?: Record<string, unknown>,
  ): LlmCallTelemetry {
    const usage = this.readUsage(raw);
    return {
      provider_id: model.providerId,
      model_id: model.modelId,
      profile_id: model.profileId ?? null,
      prompt_template_id: prompt?.promptTemplateId ?? null,
      prompt_template_version: prompt?.version ?? null,
      elapsed_ms: Date.now() - startedAt,
      request_count: state.requestCount,
      retry_count: state.retryCount,
      timeout_count: state.timeoutCount,
      rate_limit_count: state.rateLimitCount,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      embedding_input_tokens: prompt === null ? usage.inputTokens ?? usage.totalTokens : null,
      total_tokens: usage.totalTokens,
      cost_usd: null,
    };
  }

  private readUsage(raw?: Record<string, unknown>): {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  } {
    const usage = this.tryReadObject(raw?.usage);
    if (!usage) {
      return { inputTokens: null, outputTokens: null, totalTokens: null };
    }
    return {
      inputTokens: this.readNonNegativeNumber(usage.input_tokens) ?? this.readNonNegativeNumber(usage.prompt_tokens),
      outputTokens: this.readNonNegativeNumber(usage.output_tokens) ?? this.readNonNegativeNumber(usage.completion_tokens),
      totalTokens: this.readNonNegativeNumber(usage.total_tokens),
    };
  }

  private readNonNegativeNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  }

  private normalizePositiveInteger(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
  }

  private normalizeNonNegativeInteger(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
  }

  private computeRetryDelayMs(error: LlmGatewayError, attempt: number): number {
    if (error.retryAfterMs !== undefined) {
      return error.retryAfterMs;
    }
    if (error.code === 'RateLimitError') {
      return Math.min(3_000 * (2 ** attempt), 10_000);
    }
    return Math.min(250 * (2 ** attempt), 1_000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
