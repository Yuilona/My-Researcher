import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  LlmCallTelemetry,
  LlmStructuredOutputRequest,
  LlmStructuredOutputResponse,
} from './llm-gateway.js';
import {
  type TopicSelectionV1bTopicQuestionCandidateSetDraftPayload,
  type TopicSelectionV1bTopicValueAssessmentDraftPayload,
  topicSelectionV1bTopicQuestionCandidateSetDraftPayloadSchema,
  topicSelectionV1bTopicValueAssessmentDraftPayloadSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-workflow-harness-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import { BackendLlmGateway } from './llm-gateway.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1B_TOPIC_QUESTION_CANDIDATES_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_V1B_TOPIC_VALUE_ASSESSMENT_SINGLE_AGENT_PROFILE_ID,
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
    const output = providerCanaryOutput(request);
    return {
      parsed: output as T,
      raw: { output },
      telemetry: telemetry(request),
    };
  }
}

function providerCanaryOutput(request: LlmStructuredOutputRequest) {
  if (request.schemaName === 'topic_selection_v1b_n6_provider_canary_draft') {
    return v1bN6CanaryOutput();
  }
  if (request.schemaName === 'topic_selection_v1b_n8_provider_canary_draft') {
    return v1bN8CanaryOutput();
  }
  return v1aCanaryOutput(request);
}

function v1aCanaryOutput(request: LlmStructuredOutputRequest): TopicSelectionProviderCanaryCandidateDraftBatch {
  return {
    batch_id: `canary_batch_${request.model.providerId}`,
    drafts: [
      {
        draft_id: 'draft_canary_001',
        candidate_need: 'provider live invocation canary',
      },
    ],
  };
}

function functionalRef(refType: string, refId: string) {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_provider_canary',
    version_id: null,
  };
}

function v1bN6CanaryOutput(): TopicSelectionV1bTopicQuestionCandidateSetDraftPayload {
  const evidenceRef = functionalRef('evidence_unit', 'provider_canary_evidence_001');
  const boundaryRef = functionalRef('research_slice_boundary', 'provider_canary_boundary_001');
  const needRef = functionalRef('validated_need', 'provider_canary_need_001');
  return {
    question_frame: {
      target_setting: 'Local-first CS paper engineering assistant workflows.',
      target_community: 'LLM systems researchers',
      object_scope: 'v1b N6 provider live invocation canary',
      task_scope: 'topic-question candidate generation and runtime provenance checks',
      intervention_or_approach: 'Shared runtime provider canary over AgentOrchestrator and BackendLlmGateway',
      comparison_baseline: 'transport-only provider canary without the N6 output contract',
      observable_outcome: 'valid structured TopicQuestionCandidateSetDraft output and live provider telemetry',
      assumption_refs: [],
      evidence_refs: [evidenceRef],
      frame_payload: {
        canary: true,
        non_authority: true,
      },
    },
    recommended_candidate_keys: ['provider_canary_candidate'],
    generation_notes: ['Synthetic canary draft for provider/runtime validation only.'],
    human_review_triggers: [],
    candidates: [
      {
        candidate_key: 'provider_canary_candidate',
        main_question:
          'How can a shared LLM runtime preserve provider-live semantics for v1b N6 topic-question generation?',
        sub_questions: [
          'Which prompt-cache and token-budget signals must remain auditable before deterministic N6 gates run?',
        ],
        question_type: 'system',
        contribution_hypothesis: 'system',
        source_validated_need_refs: [needRef],
        answerability_plan: {
          datasets_or_resources: ['provider canary trace fixtures'],
          metrics: ['provider call count', 'prompt packet hash equality', 'response reuse absence'],
          baselines: ['transport-only canary'],
          ablations_or_comparisons: ['prompt cache hit without response reuse'],
          evaluation_setting: 'local/dev provider canary execution',
          dependency_risks: ['provider structured output behavior may drift'],
          open_dependencies: [],
          known_gaps: [],
          required_evidence_refs: [evidenceRef],
        },
        answerability_verdict: 'answerable',
        expected_claim:
          'The shared runtime can keep provider-required calls live while reusing prompt packet metadata.',
        fallback_claim: 'The canary validates provider transport and runtime provenance for N6.',
        max_claim_strength: 'Bounded workflow-runtime claim only.',
        observable_success_criteria: ['two provider calls occur', 'response reuse refs remain null'],
        boundary_check: {
          preserved_boundary_refs: [boundaryRef],
          excluded_boundary_refs: [],
          boundary_violations: [],
          prohibited_claims: ['business authority creation', 'topic promotion decision'],
          allowed_refinements: ['tighten canary wording'],
        },
        traceability_check: {
          support_evidence_refs: [evidenceRef],
          challenge_evidence_refs: [evidenceRef],
          baseline_evidence_refs: [evidenceRef],
          context_evidence_refs: [evidenceRef],
          mapped_evidence_refs: [evidenceRef],
          unmapped_assumptions: [],
        },
        falsification_conditions: [
          {
            condition_type: 'claim_overstrong',
            severity: 'hard',
            statement: 'If response reuse is non-null, the provider-live runtime claim is false.',
            trigger_evidence_refs: [evidenceRef],
            trigger_source_refs: [needRef],
            related_contract_fields: ['response_reuse_refs'],
            expected_action: 'lower_claim_strength',
            check_timing: 'before_value_assessment',
            confidence: 'high',
          },
        ],
        risk_notes: ['Synthetic provider canary output is non-authority.'],
        blockers: [],
        objections: [],
        human_review_triggers: [],
        confidence: 0.8,
      },
    ],
  };
}

function v1bN8CanaryOutput(): TopicSelectionV1bTopicValueAssessmentDraftPayload {
  const contractRef = functionalRef('topic_question_contract', 'provider_canary_contract_001');
  const evidenceRef = functionalRef('evidence_unit', 'provider_canary_evidence_001');
  return {
    readiness_status: 'ready_with_accepted_risk',
    strongest_claim_if_success:
      'The shared runtime can keep N8 provider-required calls live while preserving prompt-cache provenance.',
    fallback_claim_if_success: 'The canary validates N8 provider transport and runtime provenance only.',
    hard_gates: TOPIC_SELECTION_VALUE_GATE_KEYS.map((gateKey) => ({
      gate_key: gateKey,
      verdict: gateKey === 'answerability_sanity' ? 'pass_with_risk' : 'pass',
      severity: gateKey === 'answerability_sanity' ? 'warning' : 'info',
      overridable_with_risk: gateKey === 'answerability_sanity',
      rationale: `${gateKey} is satisfied for the synthetic non-authority N8 provider canary.`,
      refs: [contractRef],
    })),
    dimension_scores: TOPIC_SELECTION_VALUE_DIMENSIONS.map((dimensionKey) => ({
      dimension_key: dimensionKey,
      score: dimensionKey === 'reviewer_risk' ? 72 : 80,
      rationale: `${dimensionKey} is adequate for a synthetic provider/runtime canary.`,
      evidence_refs: [evidenceRef],
      uncertainty: 'medium',
    })),
    risk_penalty: {
      residual_risk: 'provider output quality may drift and remains non-authority',
    },
    reviewer_objections: ['Synthetic provider canary output is not business authority.'],
    ceiling_case: 'The canary can show provider-live runtime semantics, not topic value.',
    base_case: 'The canary validates prompt cache and provider telemetry separation for N8.',
    floor_case: 'The canary still blocks unsafe over-budget provider execution.',
    recommended_disposition: 'advance_to_package',
    total_score: 76,
    value_summary:
      'The synthetic N8 canary is value-positive only as runtime evidence for prompt-cache/provider semantics.',
    confidence: 0.78,
    accepted_risk_refs: [],
    blocker_refs: [],
    risk_notes: ['Provider response reuse must remain null for this canary.'],
    reasoning_memo: {
      recommendation: 'advance_to_package',
      value_thesis: 'The N8 provider canary is useful because it verifies provider-live behavior at the value-draft slot.',
      significance: 'It gives workflow agents evidence that prompt packet reuse does not become response reuse.',
      originality: 'The canary targets N8 value-draft runtime provenance rather than generic provider transport.',
      claim_leverage: 'The claim is bounded to runtime semantics and auditability.',
      reviewer_risks: ['Synthetic output does not prove topic quality.'],
      effort_to_value: 'The canary has high diagnostic value for low implementation effort.',
      strategic_fit: 'It supports reviewer-aligned workflow robustness checks.',
      negative_memory_check: 'No negative memory is allowed to become standalone evidence.',
      evidence_backed_rationale: 'Prompt hashes, cache metadata, and provider telemetry are ref-backed runtime evidence.',
      top_objections: ['Provider output may require normalization in full workflow runs.'],
      uncertainty: 'Medium uncertainty remains for live provider schema drift.',
      disposition_bridge: 'Use this only as non-authority provider/runtime evidence.',
      requires_critic_review: false,
      critic_triggers: [],
      cited_refs: [contractRef, evidenceRef],
    },
  };
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

function expectedV1bN8ModelOptionId(providerId: TopicSelectionProviderCanaryProviderId): string {
  const suffix = providerId === 'openai'
    ? 'openai-balanced'
    : 'dashscope-thinking-budget';
  return `${TOPIC_SELECTION_V1B_TOPIC_VALUE_ASSESSMENT_SINGLE_AGENT_PROFILE_ID}.${suffix}`;
}

function assertV1bN8PromptCacheLiveRequiredResult(
  result: Awaited<ReturnType<TopicSelectionProviderCanaryService['runV1bN8PromptCacheLiveRequiredCanary']>>,
  providerId: TopicSelectionProviderCanaryProviderId,
) {
  assert.equal(result.provider_id, providerId);
  assert.equal(result.model_option_id, expectedV1bN8ModelOptionId(providerId));
  assert.equal(result.provider_required_live, true);
  assert.equal(result.first_status, 'succeeded');
  assert.equal(result.second_status, 'succeeded');
  assert.equal(result.provider_call_count, 2);
  assert.equal(result.first_prompt_packet_hash, result.second_prompt_packet_hash);
  assert.equal(result.prompt_artifact_ref_reused, true);
  assert.equal(result.prompt_quality_report_ref_reused, true);
  assert.deepEqual(result.provider_response_cache_statuses, ['not_applicable', 'not_applicable']);
  assert.deepEqual(result.response_reuse_refs, [null, null]);
  assert.equal(result.telemetry.length, 2);
  assert.equal(result.telemetry[0]?.provider_id, providerId);
  assert.equal(result.telemetry[1]?.provider_id, providerId);
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
  assert.deepEqual(gateway.calls[0]!.schema, topicSelectionV1bTopicQuestionCandidateSetDraftPayloadSchema);
  assert.equal(gateway.calls[1]!.model.providerId, providerId);
  assert.equal(result.first_prompt_packet_hash, result.second_prompt_packet_hash);
  assert.equal(result.prompt_artifact_ref_reused, true);
  assert.equal(result.prompt_quality_report_ref_reused, true);
  assert.deepEqual(result.provider_response_cache_statuses, ['not_applicable', 'not_applicable']);
  assert.deepEqual(result.response_reuse_refs, [null, null]);
  assert.equal(result.telemetry.length, 2);
  assert.equal(result.telemetry[1]!.provider_side_cache_hit, true);
}

async function assertV1bN8PromptCacheLiveRequiredCanary(providerId: TopicSelectionProviderCanaryProviderId) {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runV1bN8PromptCacheLiveRequiredCanary({
    provider_id: providerId,
  });

  assertV1bN8PromptCacheLiveRequiredResult(result, providerId);
  assert.equal(gateway.calls.length, 2);
  assert.equal(gateway.calls[0]!.model.providerId, providerId);
  assert.equal(gateway.calls[0]!.model.profileId, TOPIC_SELECTION_V1B_TOPIC_VALUE_ASSESSMENT_SINGLE_AGENT_PROFILE_ID);
  assert.equal(gateway.calls[0]!.prompt.promptTemplateId, 'topic-selection-v1b-n8-provider-canary-live-required');
  assert.equal(gateway.calls[0]!.schemaName, 'topic_selection_v1b_n8_provider_canary_draft');
  assert.ok(gateway.calls[0]!.schemaName.length <= 64);
  assert.deepEqual(gateway.calls[0]!.schema, topicSelectionV1bTopicValueAssessmentDraftPayloadSchema);
  assert.equal(gateway.calls[1]!.model.providerId, providerId);
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

test('provider canary proves v1b N8 OpenAI prompt cache hits still require live provider calls', async () => {
  await assertV1bN8PromptCacheLiveRequiredCanary('openai');
});

test('provider canary proves v1b N8 DashScope prompt cache hits still require live provider calls', async () => {
  await assertV1bN8PromptCacheLiveRequiredCanary('dashscope');
});

test('provider canary blocks over-budget v1b N8 OpenAI fixtures before gateway calls', async () => {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runV1bN8OverBudgetZeroCallCanary({
    provider_id: 'openai',
  });

  assert.equal(result.provider_id, 'openai');
  assert.equal(result.model_option_id, expectedV1bN8ModelOptionId('openai'));
  assert.equal(result.provider_call_count, 0);
  assert.equal(gateway.calls.length, 0);
  assert.equal(result.status, 'blocked');
  assert.equal(result.error_code, 'TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION');
  assert.equal(result.token_budget_gate_decision, 'blocked_over_budget');
  assert.deepEqual(result.blocker_codes, ['TOKEN_BUDGET_OVER_LIMIT_AFTER_COMPRESSION']);
});

test('provider canary blocks over-budget v1b N8 DashScope fixtures before gateway calls', async () => {
  const gateway = new StubProviderCanaryGateway();
  const service = makeCanaryService({ llmGateway: gateway });

  const result = await service.runV1bN8OverBudgetZeroCallCanary({
    provider_id: 'dashscope',
  });

  assert.equal(result.provider_id, 'dashscope');
  assert.equal(result.model_option_id, expectedV1bN8ModelOptionId('dashscope'));
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

function shouldRunLiveV1bN8Canary(providerId: TopicSelectionProviderCanaryProviderId): boolean {
  if (
    process.env.T112_V1B_N8_PROVIDER_CANARY_LIVE !== '1'
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

test(
  'provider canary live v1b N8 OpenAI invocation uses the configured provider gateway',
  {
    skip: shouldRunLiveV1bN8Canary('openai')
      ? false
      : 'set T112_V1B_N8_PROVIDER_CANARY_LIVE=1, BACKEND_TEST_PRESERVE_REAL_ENV=1, and OPENAI_API_KEY to run',
    timeout: 300_000,
  },
  async () => {
    const service = makeCanaryService({
      llmGateway: new BackendLlmGateway({
        defaultTimeoutMs: 300_000,
        defaultMaxRetries: 0,
      }),
    });

    const result = await service.runV1bN8PromptCacheLiveRequiredCanary({
      provider_id: 'openai',
    });

    assertV1bN8PromptCacheLiveRequiredResult(result, 'openai');
  },
);

test(
  'provider canary live v1b N8 DashScope invocation uses the configured provider gateway',
  {
    skip: shouldRunLiveV1bN8Canary('dashscope')
      ? false
      : 'set T112_V1B_N8_PROVIDER_CANARY_LIVE=1, BACKEND_TEST_PRESERVE_REAL_ENV=1, and DASHSCOPE_API_KEY to run',
    timeout: 300_000,
  },
  async () => {
    const service = makeCanaryService({
      llmGateway: new BackendLlmGateway({
        defaultTimeoutMs: 300_000,
        defaultMaxRetries: 0,
      }),
    });

    const result = await service.runV1bN8PromptCacheLiveRequiredCanary({
      provider_id: 'dashscope',
    });

    assertV1bN8PromptCacheLiveRequiredResult(result, 'dashscope');
  },
);
