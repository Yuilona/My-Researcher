import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  LlmCallTelemetry,
  LlmStructuredOutputRequest,
  LlmStructuredOutputResponse,
} from './llm-gateway.js';
import { BackendLlmGateway } from './llm-gateway.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID,
} from './topic-selection-model-profile-registry-service.js';
import {
  TopicSelectionProviderCanaryService,
  type TopicSelectionProviderCanaryCandidateDraftBatch,
  type TopicSelectionProviderCanaryProviderId,
} from './topic-selection-provider-canary-service.js';

class StubProviderCanaryGateway {
  readonly calls: LlmStructuredOutputRequest[] = [];

  async createStructuredOutput<T>(
    request: LlmStructuredOutputRequest,
  ): Promise<LlmStructuredOutputResponse<T>> {
    this.calls.push(request);
    const output: TopicSelectionProviderCanaryCandidateDraftBatch = {
      batch_id: `canary_batch_${request.model.providerId}`,
      drafts: [
        {
          draft_id: 'draft_canary_001',
          candidate_need: 'provider live invocation canary',
        },
      ],
    };
    return {
      parsed: output as T,
      raw: { output },
      telemetry: telemetry(request),
    };
  }
}

function telemetry(request: LlmStructuredOutputRequest): LlmCallTelemetry {
  return {
    provider_id: request.model.providerId,
    model_id: request.model.modelId,
    profile_id: request.model.profileId ?? null,
    prompt_template_id: request.prompt.promptTemplateId,
    prompt_template_version: request.prompt.version,
    elapsed_ms: 10,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: 64,
    output_tokens: 24,
    embedding_input_tokens: null,
    total_tokens: 88,
    cost_usd: null,
    provider_side_cache_hit: true,
    provider_side_cache_read_tokens: 32,
    provider_side_cache_write_tokens: 8,
  };
}

function makeCanaryService(options: {
  llmGateway?: StubProviderCanaryGateway | BackendLlmGateway;
} = {}) {
  const repository = new InMemoryTopicSelectionControlPlaneRepository();
  let sequence = 0;
  const controlPlane = new TopicSelectionControlPlaneService(repository, {
    idFactory: (prefix) => `${prefix}_${++sequence}`,
    now: () => '2026-05-30T00:00:00.000Z',
  });
  return new TopicSelectionProviderCanaryService({
    controlPlane,
    llmGateway: options.llmGateway,
    now: () => '2026-05-30T00:00:00.000Z',
  });
}

function expectedModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
  const suffix = providerId === 'openai'
    ? 'openai-balanced'
    : 'dashscope-thinking-budget';
  return `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
}

function expectedV1bN6ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
  const suffix = providerId === 'openai'
    ? 'openai-balanced'
    : 'dashscope-thinking-budget';
  return `${TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
}

async function assertPromptCacheLiveRequiredCanary(providerId: TopicSelectionProviderCanaryProviderId) {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runPromptCacheLiveRequiredCanary({
    provider_id: providerId,
  });

  assert.equal(result.provider_id, providerId);
  assert.equal(result.model_option_id, expectedModelOptionId(providerId));
  assert.equal(result.provider_required_live, true);
  assert.equal(result.first_status, 'succeeded');
  assert.equal(result.second_status, 'succeeded');
  assert.equal(result.provider_call_count, 2);
  assert.equal(gateway.calls.length, 2);
  assert.equal(gateway.calls[0]!.model.providerId, providerId);
  assert.equal(gateway.calls[1]!.model.providerId, providerId);
  assert.equal(result.first_prompt_packet_hash, result.second_prompt_packet_hash);
  assert.equal(result.prompt_artifact_ref_reused, true);
  assert.equal(result.prompt_quality_report_ref_reused, true);
  assert.deepEqual(result.provider_response_cache_statuses, ['not_applicable', 'not_applicable']);
  assert.deepEqual(result.response_reuse_refs, [null, null]);
  assert.equal(result.telemetry.length, 2);
  assert.equal(result.telemetry[1]!.provider_side_cache_hit, true);
  assert.equal(result.telemetry[1]!.provider_side_cache_read_tokens, 32);
}

async function assertV1bN6PromptCacheLiveRequiredCanary(providerId: TopicSelectionProviderCanaryProviderId) {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runV1bN6PromptCacheLiveRequiredCanary({
    provider_id: providerId,
  });

  assert.equal(result.provider_id, providerId);
  assert.equal(result.model_option_id, expectedV1bN6ModelOptionId(providerId));
  assert.equal(result.provider_required_live, true);
  assert.equal(result.first_status, 'succeeded');
  assert.equal(result.second_status, 'succeeded');
  assert.equal(result.provider_call_count, 2);
  assert.equal(gateway.calls.length, 2);
  assert.equal(gateway.calls[0]!.model.providerId, providerId);
  assert.equal(gateway.calls[0]!.model.profileId, TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID);
  assert.equal(gateway.calls[0]!.prompt.promptTemplateId, 'topic-selection-v1b-n6-provider-canary-live-required');
  assert.equal(gateway.calls[0]!.schemaName, 'topic_selection_v1b_n6_provider_canary_draft');
  assert.ok(gateway.calls[0]!.schemaName.length <= 64);
  assert.equal(gateway.calls[1]!.model.providerId, providerId);
  assert.equal(result.first_prompt_packet_hash, result.second_prompt_packet_hash);
  assert.equal(result.prompt_artifact_ref_reused, true);
  assert.equal(result.prompt_quality_report_ref_reused, true);
  assert.deepEqual(result.provider_response_cache_statuses, ['not_applicable', 'not_applicable']);
  assert.deepEqual(result.response_reuse_refs, [null, null]);
  assert.equal(result.telemetry.length, 2);
  assert.equal(result.telemetry[1]!.provider_side_cache_hit, true);
}

test('provider canary proves OpenAI prompt cache hits still require live provider calls', async () => {
  await assertPromptCacheLiveRequiredCanary('openai');
});

test('provider canary proves DashScope prompt cache hits still require live provider calls', async () => {
  await assertPromptCacheLiveRequiredCanary('dashscope');
});

test('provider canary blocks over-budget OpenAI fixtures before gateway calls', async () => {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runOverBudgetZeroCallCanary({
    provider_id: 'openai',
  });

  assert.equal(result.provider_id, 'openai');
  assert.equal(result.model_option_id, expectedModelOptionId('openai'));
  assert.equal(result.provider_call_count, 0);
  assert.equal(gateway.calls.length, 0);
  assert.equal(result.status, 'blocked');
  assert.equal(result.error_code, 'TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION');
  assert.equal(result.token_budget_gate_decision, 'blocked_over_budget');
  assert.deepEqual(result.blocker_codes, ['TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION']);
});

test('provider canary blocks over-budget DashScope fixtures before gateway calls', async () => {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runOverBudgetZeroCallCanary({
    provider_id: 'dashscope',
  });

  assert.equal(result.provider_id, 'dashscope');
  assert.equal(result.model_option_id, expectedModelOptionId('dashscope'));
  assert.equal(result.provider_call_count, 0);
  assert.equal(gateway.calls.length, 0);
  assert.equal(result.status, 'blocked');
  assert.equal(result.error_code, 'TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION');
  assert.equal(result.token_budget_gate_decision, 'blocked_over_budget');
  assert.deepEqual(result.blocker_codes, ['TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION']);
});

test('provider canary proves v1b N6 OpenAI prompt cache hits still require live provider calls', async () => {
  await assertV1bN6PromptCacheLiveRequiredCanary('openai');
});

test('provider canary proves v1b N6 DashScope prompt cache hits still require live provider calls', async () => {
  await assertV1bN6PromptCacheLiveRequiredCanary('dashscope');
});

test('provider canary blocks over-budget v1b N6 OpenAI fixtures before gateway calls', async () => {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runV1bN6OverBudgetZeroCallCanary({
    provider_id: 'openai',
  });

  assert.equal(result.provider_id, 'openai');
  assert.equal(result.model_option_id, expectedV1bN6ModelOptionId('openai'));
  assert.equal(result.provider_call_count, 0);
  assert.equal(gateway.calls.length, 0);
  assert.equal(result.status, 'blocked');
  assert.equal(result.error_code, 'TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION');
  assert.equal(result.token_budget_gate_decision, 'blocked_over_budget');
  assert.deepEqual(result.blocker_codes, ['TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION']);
});

test('provider canary blocks over-budget v1b N6 DashScope fixtures before gateway calls', async () => {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runV1bN6OverBudgetZeroCallCanary({
    provider_id: 'dashscope',
  });

  assert.equal(result.provider_id, 'dashscope');
  assert.equal(result.model_option_id, expectedV1bN6ModelOptionId('dashscope'));
  assert.equal(result.provider_call_count, 0);
  assert.equal(gateway.calls.length, 0);
  assert.equal(result.status, 'blocked');
  assert.equal(result.error_code, 'TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION');
  assert.equal(result.token_budget_gate_decision, 'blocked_over_budget');
  assert.deepEqual(result.blocker_codes, ['TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION']);
});

function shouldRunLiveCanary(providerId: TopicSelectionProviderCanaryProviderId): boolean {
  if (
    process.env.T112_PROVIDER_CANARY_LIVE !== '1'
    || process.env.BACKEND_TEST_PRESERVE_REAL_ENV !== '1'
  ) {
    return false;
  }
  return providerId === 'openai'
    ? Boolean(process.env.OPENAI_API_KEY?.trim())
    : Boolean(process.env.DASHSCOPE_API_KEY?.trim());
}

function shouldRunLiveV1bN6Canary(providerId: TopicSelectionProviderCanaryProviderId): boolean {
  if (
    process.env.T112_V1B_N6_PROVIDER_CANARY_LIVE !== '1'
    || process.env.BACKEND_TEST_PRESERVE_REAL_ENV !== '1'
  ) {
    return false;
  }
  return providerId === 'openai'
    ? Boolean(process.env.OPENAI_API_KEY?.trim())
    : Boolean(process.env.DASHSCOPE_API_KEY?.trim());
}

test(
  'provider canary live OpenAI invocation uses the configured provider gateway',
  {
    skip: shouldRunLiveCanary('openai')
      ? false
      : 'set T112_PROVIDER_CANARY_LIVE=1, BACKEND_TEST_PRESERVE_REAL_ENV=1, and OPENAI_API_KEY to run',
    timeout: 300_000,
  },
  async () => {
    const service = makeCanaryService({
      llmGateway: new BackendLlmGateway({
        defaultTimeoutMs: 300_000,
        defaultMaxRetries: 0,
      }),
    });

    const result = await service.runPromptCacheLiveRequiredCanary({
      provider_id: 'openai',
    });

    assert.equal(result.first_status, 'succeeded');
    assert.equal(result.second_status, 'succeeded');
    assert.equal(result.provider_call_count, 2);
    assert.equal(result.telemetry[0]?.provider_id, 'openai');
  },
);

test(
  'provider canary live DashScope invocation uses the configured provider gateway',
  {
    skip: shouldRunLiveCanary('dashscope')
      ? false
      : 'set T112_PROVIDER_CANARY_LIVE=1, BACKEND_TEST_PRESERVE_REAL_ENV=1, and DASHSCOPE_API_KEY to run',
    timeout: 300_000,
  },
  async () => {
    const service = makeCanaryService({
      llmGateway: new BackendLlmGateway({
        defaultTimeoutMs: 300_000,
        defaultMaxRetries: 0,
      }),
    });

    const result = await service.runPromptCacheLiveRequiredCanary({
      provider_id: 'dashscope',
    });

    assert.equal(result.first_status, 'succeeded');
    assert.equal(result.second_status, 'succeeded');
    assert.equal(result.provider_call_count, 2);
    assert.equal(result.telemetry[0]?.provider_id, 'dashscope');
  },
);

test(
  'provider canary live v1b N6 OpenAI invocation uses the configured provider gateway',
  {
    skip: shouldRunLiveV1bN6Canary('openai')
      ? false
      : 'set T112_V1B_N6_PROVIDER_CANARY_LIVE=1, BACKEND_TEST_PRESERVE_REAL_ENV=1, and OPENAI_API_KEY to run',
    timeout: 300_000,
  },
  async () => {
    const service = makeCanaryService({
      llmGateway: new BackendLlmGateway({
        defaultTimeoutMs: 300_000,
        defaultMaxRetries: 0,
      }),
    });

    const result = await service.runV1bN6PromptCacheLiveRequiredCanary({
      provider_id: 'openai',
    });

    assert.equal(result.first_status, 'succeeded');
    assert.equal(result.second_status, 'succeeded');
    assert.equal(result.provider_call_count, 2);
    assert.equal(result.model_option_id, expectedV1bN6ModelOptionId('openai'));
    assert.equal(result.telemetry[0]?.provider_id, 'openai');
  },
);

test(
  'provider canary live v1b N6 DashScope invocation uses the configured provider gateway',
  {
    skip: shouldRunLiveV1bN6Canary('dashscope')
      ? false
      : 'set T112_V1B_N6_PROVIDER_CANARY_LIVE=1, BACKEND_TEST_PRESERVE_REAL_ENV=1, and DASHSCOPE_API_KEY to run',
    timeout: 300_000,
  },
  async () => {
    const service = makeCanaryService({
      llmGateway: new BackendLlmGateway({
        defaultTimeoutMs: 300_000,
        defaultMaxRetries: 0,
      }),
    });

    const result = await service.runV1bN6PromptCacheLiveRequiredCanary({
      provider_id: 'dashscope',
    });

    assert.equal(result.first_status, 'succeeded');
    assert.equal(result.second_status, 'succeeded');
    assert.equal(result.provider_call_count, 2);
    assert.equal(result.model_option_id, expectedV1bN6ModelOptionId('dashscope'));
    assert.equal(result.telemetry[0]?.provider_id, 'dashscope');
  },
);
