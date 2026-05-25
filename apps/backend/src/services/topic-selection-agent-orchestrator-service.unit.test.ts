import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  LlmCallTelemetry,
  LlmStructuredOutputRequest,
  LlmStructuredOutputResponse,
} from './llm-gateway.js';
import { LlmGatewayError } from './llm-gateway.js';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TopicSelectionAgentOrchestratorService,
  type TopicSelectionAgentOrchestratorLlmGateway,
} from './topic-selection-agent-orchestrator-service.js';
import { TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID } from './topic-selection-model-profile-registry-service.js';

type CandidateDraftBatch = {
  batch_id: string;
  drafts: Array<{
    draft_id: string;
    candidate_need: string;
  }>;
};

class StubLlmGateway {
  readonly calls: LlmStructuredOutputRequest[] = [];

  constructor(private readonly output: CandidateDraftBatch) {}

  async createStructuredOutput<T>(
    request: LlmStructuredOutputRequest,
  ): Promise<LlmStructuredOutputResponse<T>> {
    this.calls.push(request);
    return {
      parsed: this.output as T,
      raw: { output: this.output },
      telemetry: telemetry(),
    };
  }
}

class FailingLlmGateway {
  readonly calls: LlmStructuredOutputRequest[] = [];

  async createStructuredOutput<T>(
    request: LlmStructuredOutputRequest,
  ): Promise<LlmStructuredOutputResponse<T>> {
    this.calls.push(request);
    throw new LlmGatewayError(
      'InvalidRequestError',
      'Provider rejected request with Bearer sk-test-secret and api_key=local-secret: unsupported request option.',
      { statusCode: 400, telemetry: telemetry() },
    );
  }
}

function makeOrchestrator(options: { llmGateway?: TopicSelectionAgentOrchestratorLlmGateway } = {}) {
  const repository = new InMemoryTopicSelectionControlPlaneRepository();
  let sequence = 0;
  const controlPlane = new TopicSelectionControlPlaneService(repository, {
    idFactory: (prefix) => `${prefix}_${++sequence}`,
    now: () => '2026-05-19T00:00:00.000Z',
  });
  const orchestrator = new TopicSelectionAgentOrchestratorService({
    controlPlane,
    llmGateway: options.llmGateway,
    now: () => '2026-05-19T00:00:00.000Z',
  });
  return { orchestrator, repository };
}

function telemetry(): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 'gpt-test',
    profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    prompt_template_id: 'topic-selection-generate-need-candidate',
    prompt_template_version: 'v1',
    elapsed_ms: 10,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: null,
    output_tokens: null,
    embedding_input_tokens: null,
    total_tokens: null,
    cost_usd: null,
  };
}

function output(): CandidateDraftBatch {
  return {
    batch_id: 'draft_batch_001',
    drafts: [
      {
        draft_id: 'draft_001',
        candidate_need: 'Need a risk-aware evaluation workflow for RAG fine-tuning.',
      },
    ],
  };
}

function schema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['batch_id', 'drafts'],
    properties: {
      batch_id: { type: 'string', minLength: 1 },
      drafts: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['draft_id', 'candidate_need'],
          properties: {
            draft_id: { type: 'string', minLength: 1 },
            candidate_need: { type: 'string', minLength: 1 },
          },
        },
      },
    },
  };
}

function baseInvocation() {
  return {
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    executor_kind: 'single_agent' as const,
    run_mode: 'acceptance' as const,
    profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    output_contract: 'RankedCandidateDraftBatch@v1',
    prompt: {
      promptTemplateId: 'topic-selection-generate-need-candidate',
      version: 'v1',
    },
    schema_name: 'topic_selection_ranked_candidate_draft_batch',
    schema: schema(),
    messages: [
      {
        role: 'system' as const,
        content: 'Return a grounded ranked candidate draft batch.',
      },
      {
        role: 'user' as const,
        content: '{"context_packet_ref":"artifact_ref_001"}',
      },
    ],
    context_packet_refs: [
      {
        ref_type: 'artifact_ref' as const,
        ref_id: 'context_packet_001',
        title_card_id: 'title_card_001',
      },
    ],
  };
}

test('agent orchestrator normalizes mocked, codex, and provider execution onto one result shape', async () => {
  const providerGateway = new StubLlmGateway(output());
  const { orchestrator } = makeOrchestrator({ llmGateway: providerGateway });

  const mocked = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    execution_mode: 'mocked_llm',
    mocked_output: {
      fixture_id: 'fixture_generate_need_candidate_happy_path',
      output: output(),
      mock_profile: 'happy_path',
    },
  });
  const codex = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    execution_mode: 'codex_assisted',
    codex_response: {
      output: output(),
      operator_label: 'codex-local',
    },
  });
  const provider = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    execution_mode: 'provider_llm',
    run_mode: 'product',
  });

  for (const result of [mocked, codex, provider]) {
    assert.equal(result.schema_version, 'v1');
    assert.equal(result.status, 'succeeded');
    assert.equal(result.validation.valid, true);
    assert.equal(result.structured_output?.drafts.length, 1);
    assert.equal(result.audit_snapshot.node_id, 'topic-selection.v1a.generate-need-candidate.v1');
    assert.equal(result.audit_artifact_ref?.ref_type, 'artifact_ref');
  }
  assert.equal(mocked.provenance.non_provider, true);
  assert.equal(codex.provenance.non_provider, true);
  assert.equal(provider.provenance.non_provider, false);
  assert.equal(provider.provenance.source_kind, 'provider_response');
  assert.equal(provider.provenance.profile_version, 'v1');
  assert.equal(provider.provenance.model_option_id, `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.openai-balanced`);
  assert.equal(provider.provenance.invocation_attempt_id, 'node_attempt_001');
  assert.equal(provider.provenance.cache_status, 'not_applicable');
  assert.match(provider.provenance.profile_hash, /^[a-f0-9]{64}$/);
  assert.match(provider.provenance.normalized_params_hash ?? '', /^[a-f0-9]{64}$/);
  assert.match(provider.provenance.structured_output_hash ?? '', /^[a-f0-9]{64}$/);
  assert.equal(providerGateway.calls.length, 1);
  assert.equal(providerGateway.calls[0]!.schemaName, 'topic_selection_ranked_candidate_draft_batch');
  assert.deepEqual(providerGateway.calls[0]!.model, {
    providerId: 'openai',
    modelId: 'gpt-5.4-mini',
    profileId: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  });
  assert.equal(providerGateway.calls[0]!.policy?.timeoutMs, 180000);
  assert.equal(providerGateway.calls[0]!.policy?.maxRetries, 1);
  assert.deepEqual(providerGateway.calls[0]!.normalizedParams, {
    creativity: 'medium',
    reasoning_depth: 'medium',
    output_budget: 'medium',
    structured_output_required: true,
    output_format: 'json_schema',
  });
});

test('agent orchestrator blocks invalid structured output without mode-specific result shape', async () => {
  const { orchestrator } = makeOrchestrator();
  const result = await orchestrator.invokeStructuredOutput<Record<string, unknown>>({
    ...baseInvocation(),
    execution_mode: 'codex_assisted',
    codex_response: {
      output: {
        batch_id: 'draft_batch_001',
        drafts: [],
      },
      operator_label: 'codex-local',
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.structured_output, null);
  assert.equal(result.error_code, 'SCHEMA_VALIDATION_FAILED');
  assert.deepEqual(result.blocker_codes, ['SCHEMA_VALIDATION_FAILED']);
  assert.equal(result.provenance.execution_mode, 'codex_assisted');
  assert.equal(result.validation.valid, false);
});

test('agent orchestrator rejects mocked product execution and forbidden raw output fields', async () => {
  const { orchestrator } = makeOrchestrator();
  await assert.rejects(
    () => orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
      ...baseInvocation(),
      execution_mode: 'mocked_llm',
      run_mode: 'product',
      mocked_output: {
        fixture_id: 'fixture_generate_need_candidate_happy_path',
        output: output(),
      },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  await assert.rejects(
    () => orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
      ...baseInvocation(),
      execution_mode: 'mocked_llm',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  await assert.rejects(
    () => orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
      ...baseInvocation(),
      execution_mode: 'codex_assisted',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const forbidden = await orchestrator.invokeStructuredOutput<Record<string, unknown>>({
    ...baseInvocation(),
    execution_mode: 'mocked_llm',
    mocked_output: {
      fixture_id: 'fixture_bad_raw_material',
      output: {
        ...output(),
        hidden_reasoning: 'do not persist this',
      },
    },
  });
  assert.equal(forbidden.status, 'blocked');
  assert.equal(forbidden.error_code, 'FORBIDDEN_AGENT_OUTPUT_FIELD');
  assert.equal(forbidden.structured_output, null);
});

test('agent orchestrator enforces profile output contract and explicit provider option selection', async () => {
  const providerGateway = new StubLlmGateway(output());
  const { orchestrator } = makeOrchestrator({ llmGateway: providerGateway });

  await assert.rejects(
    () => orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
      ...baseInvocation(),
      execution_mode: 'provider_llm',
      run_mode: 'product',
      output_contract: 'NeedDiscoveryExplorerNotes@v1',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const dashscope = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    execution_mode: 'provider_llm',
    run_mode: 'product',
    model_option_id: `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.dashscope-thinking-budget`,
  });

  assert.equal(dashscope.status, 'succeeded');
  assert.equal(providerGateway.calls.at(-1)?.model.providerId, 'dashscope');
  assert.equal(providerGateway.calls.at(-1)?.model.modelId, 'qwen3.6-plus');
  assert.deepEqual(providerGateway.calls.at(-1)?.providerOverrides, { enable_thinking: true });
});

test('agent orchestrator accepts canonical execution_spec and rejects ambiguous dual-track values', async () => {
  const providerGateway = new StubLlmGateway(output());
  const { orchestrator } = makeOrchestrator({ llmGateway: providerGateway });

  const result = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    execution_mode: 'provider_llm',
    run_mode: 'product',
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.openai-deep-reasoning`,
    },
  });

  assert.equal(result.status, 'succeeded');
  assert.equal(
    result.provenance.model_option_id,
    `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.openai-deep-reasoning`,
  );
  assert.equal(providerGateway.calls.at(-1)?.model.modelId, 'gpt-5.5');
  assert.equal(
    (providerGateway.calls.at(-1)?.normalizedParams as { reasoning_depth?: string } | undefined)?.reasoning_depth,
    'high',
  );

  await assert.rejects(
    () => orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
      ...baseInvocation(),
      execution_mode: 'provider_llm',
      run_mode: 'product',
      execution_spec: {
        execution_mode: 'codex_assisted',
      },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  await assert.rejects(
    () => orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
      ...baseInvocation(),
      execution_mode: 'codex_assisted',
      execution_spec: {
        execution_mode: 'codex_assisted',
        model_option_id: `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.openai-balanced`,
      },
      codex_response: {
        operator_label: 'codex-local',
        output: output(),
      },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('agent orchestrator records a sanitized provider failure summary for blocked invocations', async () => {
  const providerGateway = new FailingLlmGateway();
  const { orchestrator } = makeOrchestrator({ llmGateway: providerGateway });

  const result = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    execution_mode: 'provider_llm',
    run_mode: 'product',
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.structured_output, null);
  assert.equal(result.error_code, 'InvalidRequestError');
  assert.deepEqual(result.blocker_codes, ['InvalidRequestError']);
  assert.equal(result.validation.valid, false);
  assert.equal(result.validation.error_count, 1);
  assert.match(result.validation.errors[0] ?? '', /^InvalidRequestError status=400:/);
  assert.equal(JSON.stringify(result.validation).includes('sk-test-secret'), false);
  assert.equal(JSON.stringify(result.validation).includes('local-secret'), false);
  assert.equal(result.audit_snapshot.validation.errors[0], result.validation.errors[0]);
});

test('agent orchestrator audit artifact stores hashes and provenance but not full structured output', async () => {
  const { orchestrator, repository } = makeOrchestrator();
  const result = await orchestrator.invokeStructuredOutput<CandidateDraftBatch>({
    ...baseInvocation(),
    title_card_id: 'title_card_001',
    execution_mode: 'mocked_llm',
    mocked_output: {
      fixture_id: 'fixture_generate_need_candidate_happy_path',
      output: output(),
    },
  });

  const artifact = await repository.findArtifactRefById(result.audit_artifact_ref!.ref_id);
  assert.equal(artifact?.artifact_kind, 'diagnostic');
  assert.equal(artifact?.workflow_run_id, 'workflow_run_001');
  const serialized = JSON.stringify(artifact?.payload);
  assert.equal(serialized.includes('Need a risk-aware evaluation workflow'), false);
  assert.equal(serialized.includes('invocation_attempt_id'), true);
  assert.equal(serialized.includes('response_hash'), true);
  assert.equal(serialized.includes('fixture_generate_need_candidate_happy_path'), true);
});
