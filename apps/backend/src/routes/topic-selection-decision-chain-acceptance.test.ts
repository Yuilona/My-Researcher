import assert from 'node:assert/strict';
import test from 'node:test';
import type { FastifyInstance } from 'fastify';

import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  TOPIC_SELECTION_V1A_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_V1A_OFFLINE_EVALUATION_METRIC_KEYS,
  TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS,
  TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_METRIC_KEYS,
  type TopicSelectionOfflineEvaluationCaseRecord,
  type TopicSelectionOfflineEvaluationObservedOutput,
  type TopicSelectionOfflineEvaluationStage,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
  type TopicSelectionAssessTopicValueLlmOutput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import type {
  TopicSelectionResearchSliceOptionDraft,
  TopicSelectionResearchSliceOptionSetLlmOutput,
  TopicSelectionV1bTopicQuestionFormationInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionFormTopicQuestionLlmOutput,
  TopicSelectionTopicQuestionAnswerabilityPlanDraft,
  TopicSelectionTopicQuestionCandidateDraft,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';

import { buildApp } from '../app.js';
import type {
  LlmCallTelemetry,
  LlmStructuredOutputRequest,
  LlmStructuredOutputResponse,
} from '../services/llm-gateway.js';

type HttpMethod = 'GET' | 'POST' | 'PATCH';

type CoverageRow = {
  coverage_row_intent_id: string;
  expected_evidence_role: string;
};

type QualityBaselineConfig = {
  stage: TopicSelectionOfflineEvaluationStage;
  routePrefix: string;
  metricReadPath: 'metric-results' | 'metrics';
  diffReadPath: 'replay-diffs' | 'diffs';
  caseTypes: readonly string[];
  metricKeys: readonly string[];
  incompatibleMetricKey: string;
  metricSamples: Array<{ key: string; numerator: number; denominator: number }>;
  diffDimensions: readonly string[];
};

type AcceptanceState = {
  literatureId: string;
  titleCardId: string;
  literatureRef: TopicSelectionFunctionalRef;
  sourceRef: TopicSelectionFunctionalRef;
  topicSeedId: string;
  resourcePoolSnapshotId: string;
  searchPlanId: string;
  coverageRows: CoverageRow[];
  searchRunId: string;
  evidenceMapId: string;
  evidenceUnits: Array<{ evidence_unit_id: string; evidence_role: string }>;
  needCandidateId: string;
  readinessAssessmentId: string;
  validationSupportPacketId: string;
  validatedNeedId: string;
  v1bInputBundleId: string;
  v1bIntakeSnapshotId: string;
  researchConstraintProfileId: string;
  v1bReadinessAssessmentId: string;
  researchSliceOptionSetId: string;
  researchSliceOptionId: string;
  researchSliceId: string;
  topicQuestionCandidateSetId: string;
  topicQuestionCandidateId: string;
  topicQuestionContractId: string;
  topicValueAssessmentId: string;
  valueDispositionDecisionId: string;
  topicPackageId: string;
  v1cInputBundleId: string;
  promotionInputSnapshotId: string;
  promotionInputSnapshotHash: string;
  promotionInputSnapshotRef: TopicSelectionFunctionalRef;
  promotionDecisionSupportId: string;
  promotionDossierId: string;
  argumentReadinessMiniCheckId: string;
  promotionGateCheckId: string;
  humanPromotionDecisionId: string;
  promotionDecisionId: string;
  promotionCommitmentProfileId: string;
  paperProjectBridgeId: string;
  downstreamFeedbackId: string;
  downstreamRecheckRequestId: string;
};

const FIXTURE = {
  literature: {
    external_id: 't068-mock-literature-001',
    title: 'Traceable topic decisions for reviewer-aligned paper engineering',
    abstract: 'Reviewer-facing paper planning needs auditable evidence-to-decision traces.',
    authors: ['T. Reviewer', 'E. Engineer'],
    year: 2026,
    doi: '10.1000/t068-topic-selection-acceptance',
    source_url: 'https://example.com/t068/topic-selection-acceptance',
  },
  titleCard: {
    working_title: 'Reviewer-aligned topic selection decision chain',
    brief: 'Validate every backend node from evidence capture to promotion bridge.',
  },
  coverageIntents: [
    ['support-traceability', 'support', 'support reviewer-facing traceability gap'],
    ['challenge-freshness', 'challenge', 'challenge evidence freshness for traceability workflows'],
    ['baseline-provenance', 'baseline', 'baseline decision chains collapse provenance'],
    ['context-workflow', 'context', 'context local CS paper engineering workflow'],
  ],
  candidateNeed: 'Reviewer-aligned topic selection needs traceable evidence-to-need decisions.',
  constraintProfile: {
    target_community: 'LLM systems researchers',
    target_venue_class: 'systems',
    intended_contribution_style: 'workflow system',
    method_constraints: ['offline replay evaluation', 'manual reviewer packet inspection'],
    resource_constraints: ['single workstation', 'local corpus only'],
    available_assets: ['paper corpus', 'review rubric', 'trace contract fixtures'],
    feasibility_budget: { person_weeks: 2 },
    non_goals: ['Do not target production deployment', 'Do not claim live reviewer outcome causality'],
    claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
  },
  actor: {
    human: { actor_type: 'human', actor_id: 't068-reviewer' },
    paperOwner: { actor_type: 'human', actor_id: 't068-paper-owner' },
  },
} as const;

const QUALITY_BASELINES: readonly QualityBaselineConfig[] = [
  {
    stage: 'v1a',
    routePrefix: '/topic-selection/v1a',
    metricReadPath: 'metric-results',
    diffReadPath: 'replay-diffs',
    caseTypes: TOPIC_SELECTION_V1A_OFFLINE_EVALUATION_CASE_TYPES,
    metricKeys: TOPIC_SELECTION_V1A_OFFLINE_EVALUATION_METRIC_KEYS,
    incompatibleMetricKey: 'slice_boundary_drift_rate',
    metricSamples: [
      { key: 'false_gap_rate', numerator: 2, denominator: 7 },
      { key: 'baseline_miss_rate', numerator: 1, denominator: 1 },
      { key: 'trace_completeness', numerator: 8, denominator: 9 },
    ],
    diffDimensions: ['final_decision', 'key_evidence_set', 'blocker_set', 'trace_verdict'],
  },
  {
    stage: 'v1b',
    routePrefix: '/topic-selection/v1b',
    metricReadPath: 'metric-results',
    diffReadPath: 'replay-diffs',
    caseTypes: TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES,
    metricKeys: TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS,
    incompatibleMetricKey: 'false_gap_rate',
    metricSamples: [
      { key: 'slice_boundary_drift_rate', numerator: 1, denominator: 6 },
      { key: 'package_trace_completeness', numerator: 11, denominator: 12 },
      { key: 'package_readiness_false_pass_rate', numerator: 1, denominator: 3 },
    ],
    diffDimensions: [
      'slice_boundary',
      'answerability_verdict',
      'value_claim',
      'package_trace',
      'package_readiness',
      'loopback_cause',
    ],
  },
  {
    stage: 'v1c',
    routePrefix: '/topic-selection/v1c',
    metricReadPath: 'metrics',
    diffReadPath: 'diffs',
    caseTypes: TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_CASE_TYPES,
    metricKeys: TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_METRIC_KEYS,
    incompatibleMetricKey: 'package_trace_completeness',
    metricSamples: [
      { key: 'promotion_false_pass_rate', numerator: 1, denominator: 3 },
      { key: 'bridge_trace_completeness', numerator: 71, denominator: 72 },
      { key: 'downstream_mutation_guard_rate', numerator: 0, denominator: 1 },
    ],
    diffDimensions: [
      'promotion_input_currentness',
      'promotion_gate_blocker',
      'human_authorization',
      'promotion_gate',
      'bridge_trace',
      'commitment_profile',
      'loopback_target',
      'downstream_feedback',
    ],
  },
];

function assertStatus(response: { statusCode: number; body: string }, expected: number): void {
  if (response.statusCode !== expected) {
    assert.fail(`Expected HTTP ${expected}, received ${response.statusCode}: ${response.body}`);
  }
}

async function requestJson<T>(
  app: FastifyInstance,
  method: HttpMethod,
  url: string,
  expectedStatus: number,
  payload?: Record<string, unknown>,
): Promise<T> {
  const response = await app.inject(payload === undefined ? { method, url } : { method, url, payload });
  assertStatus(response, expectedStatus);
  return response.json() as T;
}

async function requestError(
  app: FastifyInstance,
  method: HttpMethod,
  url: string,
  expectedStatus: number,
  payload?: Record<string, unknown>,
): Promise<{ error: { code: string; message: string } }> {
  return requestJson<{ error: { code: string; message: string } }>(app, method, url, expectedStatus, payload);
}

function requireState<K extends keyof AcceptanceState>(
  state: Partial<AcceptanceState>,
  key: K,
): AcceptanceState[K] {
  const value = state[key];
  assert.notEqual(value, undefined, `Missing acceptance state key ${String(key)}.`);
  return value as AcceptanceState[K];
}

function ref(
  refType: string,
  refId: string,
  titleCardId: string,
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: titleCardId,
    version_id: versionId,
  };
}

function assertSameStringSet(actual: Iterable<string>, expected: Iterable<string>, label: string): void {
  assert.deepEqual(new Set(actual), new Set(expected), label);
}

async function assertQualityBaseline(app: FastifyInstance, config: QualityBaselineConfig): Promise<void> {
  const synthetic = await requestJson<{
    dataset: {
      offline_evaluation_dataset_id: string;
      stage: string;
      source: string;
      status: string;
      case_count: number;
      case_type_coverage: string[];
    };
    cases: TopicSelectionOfflineEvaluationCaseRecord[];
  }>(
    app,
    'POST',
    `${config.routePrefix}/offline-evaluation/datasets/synthetic-baseline`,
    201,
    {
      dataset_key: `t068-quality-baseline-${config.stage}`,
    },
  );

  assert.equal(synthetic.dataset.stage, config.stage);
  assert.equal(synthetic.dataset.source, 'synthetic_fixture');
  assert.equal(synthetic.dataset.status, 'active');
  assert.equal(synthetic.dataset.case_count, config.caseTypes.length);
  assert.equal(synthetic.dataset.case_count, synthetic.cases.length);
  assertSameStringSet(synthetic.dataset.case_type_coverage, config.caseTypes, `${config.stage} dataset coverage`);
  assertSameStringSet(
    synthetic.cases.map((evaluationCase) => evaluationCase.case_type),
    config.caseTypes,
    `${config.stage} case coverage`,
  );
  assert.equal(
    synthetic.cases.every((evaluationCase) => evaluationCase.frozen_input_bundle.stage === config.stage),
    true,
  );
  assert.equal(
    synthetic.cases.every((evaluationCase) => Boolean(evaluationCase.frozen_input_bundle.payload.fixture_observed_output)),
    true,
  );

  const invalidMetric = await requestError(
    app,
    'POST',
    `${config.routePrefix}/offline-evaluation/runs`,
    400,
    {
      dataset_id: synthetic.dataset.offline_evaluation_dataset_id,
      workflow_profile_key: `topic-selection-${config.stage}-frozen-fixture`,
      metric_keys: [config.incompatibleMetricKey],
    },
  );
  assert.equal(invalidMetric.error.code, 'INVALID_PAYLOAD');

  const run = await requestJson<{ offline_evaluation_run_id: string; metric_keys: string[] }>(
    app,
    'POST',
    `${config.routePrefix}/offline-evaluation/runs`,
    201,
    {
      dataset_id: synthetic.dataset.offline_evaluation_dataset_id,
      workflow_profile_key: `topic-selection-${config.stage}-frozen-fixture`,
      workflow_profile_version: 'v1',
      model_profile_key: 'offline-fixture',
      search_profile_key: 'offline-fixture',
      policy_version_id: `policy_${config.stage}`,
    },
  );
  assertSameStringSet(run.metric_keys, config.metricKeys, `${config.stage} run metric keys`);

  for (const evaluationCase of synthetic.cases) {
    await requestJson<unknown>(
      app,
      'POST',
      `${config.routePrefix}/offline-evaluation/case-results`,
      201,
      {
        run_id: run.offline_evaluation_run_id,
        case_id: evaluationCase.offline_evaluation_case_id,
        observed_output: evaluationCase.frozen_input_bundle.payload.fixture_observed_output as TopicSelectionOfflineEvaluationObservedOutput,
      },
    );
  }

  await requestJson<unknown>(
    app,
    'POST',
    `${config.routePrefix}/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/complete`,
    200,
  );

  const metricRead = await requestJson<{
    items: Array<{
      metric_key: string;
      numerator: number;
      denominator: number;
      contributing_case_refs: unknown[];
      failure_case_refs: unknown[];
      notes: string[];
    }>;
  }>(
    app,
    'GET',
    `${config.routePrefix}/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/${config.metricReadPath}`,
    200,
  );
  assertSameStringSet(
    metricRead.items.map((item) => item.metric_key),
    config.metricKeys,
    `${config.stage} metric results`,
  );
  const metricByKey = new Map(metricRead.items.map((item) => [item.metric_key, item]));
  for (const metric of metricRead.items) {
    assert.equal(typeof metric.numerator, 'number');
    assert.equal(typeof metric.denominator, 'number');
    assert.ok(metric.denominator > 0, `${metric.metric_key} must have a denominator`);
    assert.equal(Array.isArray(metric.contributing_case_refs), true);
    assert.equal(Array.isArray(metric.failure_case_refs), true);
    assert.equal(metric.notes.length > 0, true);
  }
  for (const sample of config.metricSamples) {
    const metric = metricByKey.get(sample.key);
    assert.ok(metric, `missing ${config.stage} metric sample ${sample.key}`);
    assert.equal(metric.numerator, sample.numerator);
    assert.equal(metric.denominator, sample.denominator);
  }

  const diffRead = await requestJson<{ items: Array<{ changed_dimensions: string[] }> }>(
    app,
    'GET',
    `${config.routePrefix}/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/${config.diffReadPath}`,
    200,
  );
  const changedDimensions = new Set(diffRead.items.flatMap((item) => item.changed_dimensions));
  for (const dimension of config.diffDimensions) {
    assert.equal(changedDimensions.has(dimension), true, `${config.stage} missing replay diff ${dimension}`);
  }
}

function manualLocator(input: {
  titleCardId: string;
  literatureRef: TopicSelectionFunctionalRef;
  sourceRef: TopicSelectionFunctionalRef;
  key: string;
}) {
  return {
    locator_type: 'manual',
    locator_ref: ref('manual_locator', input.key, input.titleCardId),
    literature_ref: input.literatureRef,
    source_ref: input.sourceRef,
    content_ref: null,
    section_ref: null,
    paragraph_ref: null,
    anchor_ref: null,
    manual_label: `T-068 manual locator ${input.key}`,
  };
}

function telemetry(schemaName: string): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 't068-deterministic-fixture',
    profile_id: schemaName,
    prompt_template_id: schemaName,
    prompt_template_version: '1',
    elapsed_ms: 1,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: 100,
    output_tokens: 100,
    embedding_input_tokens: null,
    total_tokens: 200,
    cost_usd: null,
  };
}

class FakeTopicSelectionV1bLlmGateway {
  readonly calls: LlmStructuredOutputRequest[] = [];

  async createStructuredOutput<T>(request: LlmStructuredOutputRequest) {
    this.calls.push(request);
    const parsedUserPayload = JSON.parse(request.messages.find((message) => message.role === 'user')?.content ?? '{}') as {
      planning_input_json?: Record<string, unknown>;
      topic_question_formation_input_json?: TopicSelectionV1bTopicQuestionFormationInput;
      topic_value_assessment_input_json?: Record<string, unknown>;
      research_slice_snapshot_json?: TopicSelectionV1bTopicQuestionFormationInput;
    };
    const parsed = this.outputFor(request.schemaName, parsedUserPayload);
    return {
      parsed: parsed as T,
      raw: { schemaName: request.schemaName, parsed },
      telemetry: telemetry(request.schemaName),
    };
  }

  private outputFor(schemaName: string, payload: {
    planning_input_json?: Record<string, unknown>;
    topic_question_formation_input_json?: TopicSelectionV1bTopicQuestionFormationInput;
    topic_value_assessment_input_json?: Record<string, unknown>;
    research_slice_snapshot_json?: TopicSelectionV1bTopicQuestionFormationInput;
  }) {
    if (schemaName === 'topic_selection_research_slice_option_set') {
      return makeSliceOutput(payload.planning_input_json ?? {});
    }
    if (schemaName === 'topic_selection_topic_question_candidate_set') {
      return makeQuestionOutput(payload.topic_question_formation_input_json);
    }
    if (schemaName === 'topic_selection_topic_value_assessment') {
      return makeValueOutput(
        payload.topic_value_assessment_input_json ?? {},
        payload.research_slice_snapshot_json,
      );
    }
    throw new Error(`Unexpected structured output schema ${schemaName}.`);
  }
}

class NoUnexpectedV1cLlmGateway {
  readonly calls: LlmStructuredOutputRequest[] = [];

  async createStructuredOutput<T>(request: LlmStructuredOutputRequest): Promise<LlmStructuredOutputResponse<T>> {
    this.calls.push(request);
    throw new Error(`T-068 v1c acceptance expects deterministic support, not LLM schema ${request.schemaName}.`);
  }
}

function isFunctionalRef(value: unknown): value is TopicSelectionFunctionalRef {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && typeof (value as { ref_type?: unknown }).ref_type === 'string'
    && typeof (value as { ref_id?: unknown }).ref_id === 'string',
  );
}

function firstFunctionalRef(value: unknown, fallback: TopicSelectionFunctionalRef): TopicSelectionFunctionalRef {
  return isFunctionalRef(value) ? value : fallback;
}

function refArray(value: unknown): TopicSelectionFunctionalRef[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isFunctionalRef);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function titleCardIdFromRef(value: TopicSelectionFunctionalRef | undefined, fallback: string): string {
  return typeof value?.title_card_id === 'string' && value.title_card_id.length > 0
    ? value.title_card_id
    : fallback;
}

function makeSliceOutput(planningInput: Record<string, unknown>): TopicSelectionResearchSliceOptionSetLlmOutput {
  const titleCardId =
    isFunctionalRef(planningInput.validated_need_ref)
      ? titleCardIdFromRef(planningInput.validated_need_ref, 'title_card_t068')
      : 'title_card_t068';
  const roleBundle = (planningInput.evidence_role_bundle ?? {}) as Record<string, unknown>;
  const supportRefs = refArray(roleBundle.support_unit_refs);
  const challengeRefs = refArray(roleBundle.challenge_unit_refs);
  const baselineRefs = refArray(roleBundle.baseline_unit_refs);
  const contextRefs = refArray(roleBundle.context_unit_refs);
  const nonGoals = stringArray(planningInput.non_goals);
  const draft: TopicSelectionResearchSliceOptionDraft = {
    option_key: 'slice-a',
    source_validated_need_refs: [
      firstFunctionalRef(planningInput.validated_need_ref, ref('validated_need', 'validated_need_t068', titleCardId)),
    ],
    slice_statement: 'Bound the work to offline reviewer-aligned evidence planning.',
    problem_space: 'Reviewer-aligned evidence workflows for paper engineering.',
    target_setting: 'Local-first research assistant.',
    target_community: String(planningInput.target_community ?? FIXTURE.constraintProfile.target_community),
    included_boundaries: ['Offline evidence planning for reviewer-aligned topic decisions.'],
    excluded_boundaries: nonGoals.length > 0 ? nonGoals : [...FIXTURE.constraintProfile.non_goals],
    contribution_type_candidate: String(planningInput.intended_contribution_style ?? 'workflow system'),
    support_evidence_refs: supportRefs,
    challenge_evidence_refs: challengeRefs,
    baseline_evidence_refs: baselineRefs,
    context_evidence_refs: contextRefs,
    resource_assumptions: ['Use the existing local corpus.'],
    data_assumptions: ['Replay traces are available.'],
    evaluation_path: 'Offline replay plus reviewer rubric scoring.',
    baseline_assumptions: ['Compare against manual spreadsheet planning.'],
    hard_blockers: [],
    dependency_risks: ['Evidence freshness can drift.'],
    slice_budget: { person_weeks: 2 },
    expected_claim: 'The workflow improves trace completeness in offline replay.',
    fallback_claim: 'The workflow exposes trace gaps earlier than manual planning.',
    observable_success_criteria: ['Trace completeness exceeds baseline.'],
    main_risks: ['Scope creep.'],
    baseline_risk: 'medium',
    execution_risk: 'medium',
    scope_risk: 'low',
    claim_ceiling_alignment: {
      status: 'aligned',
      rationale: 'Expected and fallback claims stay within the supplied claim ceiling.',
      confidence: 0.82,
    },
    confidence: 0.82,
    requires_human_review: false,
    human_review_triggers: [],
    details_payload: {},
  };
  return {
    recommended_option_key: draft.option_key,
    comparison_axes: ['traceability', 'feasibility'],
    comparison_summary: 'slice-a is the most bounded option.',
    missing_option_types: [],
    unresolved_disagreements: [],
    human_review_triggers: [],
    options: [draft],
  };
}

function makeAnswerabilityPlan(
  formationInput: TopicSelectionV1bTopicQuestionFormationInput,
): TopicSelectionTopicQuestionAnswerabilityPlanDraft {
  const requiredEvidenceRefs = formationInput.evidence_refs.map((record) => record.evidence_ref).slice(0, 2);
  return {
    datasets_or_resources: ['Local paper corpus', 'Replay traces'],
    metrics: ['trace completeness', 'rubric agreement'],
    baselines: ['manual spreadsheet planning'],
    ablations_or_comparisons: ['with and without boundary check'],
    evaluation_setting: 'Offline replay on historical planning traces.',
    dependency_risks: formationInput.dependency_risks.length > 0
      ? formationInput.dependency_risks
      : ['Corpus freshness can drift.'],
    open_dependencies: ['Freeze replay snapshot.'],
    known_gaps: ['Limited venue diversity.'],
    required_evidence_refs: requiredEvidenceRefs,
  };
}

function makeQuestionOutput(
  formationInput: TopicSelectionV1bTopicQuestionFormationInput | undefined,
): TopicSelectionFormTopicQuestionLlmOutput {
  assert.ok(formationInput, 'T-068 topic-question mock requires formation input');
  const evidenceByRole = new Map(
    formationInput.evidence_refs.map((record) => [record.evidence_role, record.evidence_ref]),
  );
  const supportRef = evidenceByRole.get('support') ?? formationInput.evidence_refs[0]?.evidence_ref;
  assert.ok(supportRef, 'T-068 topic-question mock requires at least one evidence ref');
  const candidate: TopicSelectionTopicQuestionCandidateDraft = {
    candidate_key: 'question-a',
    main_question: 'Can a local-first assistant improve trace completeness for reviewer-aligned evidence planning?',
    sub_questions: ['Which trace boundary failures are reduced?'],
    question_type: 'system',
    contribution_hypothesis: 'system',
    source_validated_need_refs: [formationInput.validated_need_ref],
    answerability_plan: makeAnswerabilityPlan(formationInput),
    answerability_verdict: 'answerable',
    expected_claim: formationInput.expected_claim,
    fallback_claim: formationInput.fallback_claim,
    max_claim_strength: 'Reviewer-aligned planning feasibility in offline replay.',
    observable_success_criteria: formationInput.observable_success_criteria,
    boundary_check: {
      preserved_boundary_refs: formationInput.boundaries
        .filter((boundary) => boundary.boundary_kind === 'included')
        .map((boundary) => ref('research_slice_boundary', boundary.research_slice_boundary_id, boundary.title_card_id)),
      excluded_boundary_refs: formationInput.boundaries
        .filter((boundary) => boundary.boundary_kind === 'excluded')
        .map((boundary) => ref('research_slice_boundary', boundary.research_slice_boundary_id, boundary.title_card_id)),
      boundary_violations: [],
      prohibited_claims: ['production deployment', 'production superiority'],
      allowed_refinements: ['narrow target venue class'],
    },
    traceability_check: {
      support_evidence_refs: formationInput.evidence_refs
        .filter((record) => record.evidence_role === 'support')
        .map((record) => record.evidence_ref),
      challenge_evidence_refs: formationInput.evidence_refs
        .filter((record) => record.evidence_role === 'challenge')
        .map((record) => record.evidence_ref),
      baseline_evidence_refs: formationInput.evidence_refs
        .filter((record) => record.evidence_role === 'baseline')
        .map((record) => record.evidence_ref),
      context_evidence_refs: formationInput.evidence_refs
        .filter((record) => record.evidence_role === 'context')
        .map((record) => record.evidence_ref),
      mapped_evidence_refs: formationInput.evidence_refs.map((record) => record.evidence_ref),
      unmapped_assumptions: ['Replay snapshot availability remains unverified.'],
    },
    falsification_conditions: [
      {
        condition_type: 'solved_by_baseline',
        severity: 'hard',
        statement: 'Manual spreadsheet planning matches trace completeness.',
        trigger_evidence_refs: [supportRef],
        trigger_source_refs: [supportRef],
        related_contract_fields: ['expected_claim'],
        expected_action: 'lower_claim_strength',
        check_timing: 'before_value_assessment',
        confidence: 'medium',
      },
    ],
    risk_notes: ['Replay corpus freshness can drift.'],
    blockers: [],
    objections: [],
    human_review_triggers: [],
    confidence: 0.82,
  };
  return {
    question_frame: {
      target_setting: 'Local-first research assistant.',
      target_community: formationInput.target_community,
      object_scope: 'Reviewer-aligned evidence planning workflow.',
      task_scope: 'Offline trace completeness evaluation.',
      intervention_or_approach: 'Local-first assistant workflow.',
      comparison_baseline: 'Manual spreadsheet planning.',
      observable_outcome: 'Trace completeness and rubric agreement.',
      assumption_refs: formationInput.assumptions.map((assumption) =>
        ref('research_slice_assumption', assumption.research_slice_assumption_id, assumption.title_card_id)
      ),
      evidence_refs: formationInput.evidence_refs.map((record) => record.evidence_ref),
      frame_payload: { source: 't068-acceptance' },
    },
    recommended_candidate_keys: [candidate.candidate_key],
    generation_notes: ['T-068 deterministic candidate set.'],
    human_review_triggers: [],
    candidates: [candidate],
  };
}

function makeValueOutput(
  valueInput: Record<string, unknown>,
  formationInput: TopicSelectionV1bTopicQuestionFormationInput | undefined,
): TopicSelectionAssessTopicValueLlmOutput {
  const evidenceRecord = Array.isArray(valueInput.evidence_refs)
    ? valueInput.evidence_refs.find((record) => Boolean(record && typeof record === 'object'))
    : null;
  const evidenceRef = isFunctionalRef((evidenceRecord as { evidence_ref?: unknown } | null)?.evidence_ref)
    ? (evidenceRecord as { evidence_ref: TopicSelectionFunctionalRef }).evidence_ref
    : formationInput?.evidence_refs[0]?.evidence_ref;
  assert.ok(evidenceRef, 'T-068 value mock requires at least one inherited evidence ref');
  const contract = (valueInput.question_contract ?? {}) as Record<string, unknown>;
  const titleCardId = titleCardIdFromRef(evidenceRef, 'title_card_t068');
  const assessmentRef = firstFunctionalRef(
    valueInput.topic_question_contract_ref,
    ref('topic_question_contract', 'topic_question_contract_t068', titleCardId),
  );
  return {
    readiness_status: 'ready',
    strongest_claim_if_success: 'The workflow improves trace completeness in offline replay.',
    fallback_claim_if_success: 'The workflow exposes trace gaps earlier than manual planning.',
    hard_gates: TOPIC_SELECTION_VALUE_GATE_KEYS.map((gateKey) => ({
      gate_key: gateKey,
      verdict: 'pass',
      severity: 'info',
      overridable_with_risk: false,
      rationale: `${gateKey} passed.`,
      refs: [assessmentRef],
    })),
    dimension_scores: TOPIC_SELECTION_VALUE_DIMENSIONS.map((dimensionKey) => ({
      dimension_key: dimensionKey,
      score: 82,
      rationale: `${dimensionKey} rationale.`,
      evidence_refs: [evidenceRef],
      uncertainty: 'Moderate sample-size uncertainty.',
    })),
    risk_penalty: { freshness: 4 },
    reviewer_objections: ['Replay traces may be too narrow.'],
    ceiling_case: String(contract.max_claim_strength ?? 'Reviewer-aligned planning feasibility in offline replay.'),
    base_case: 'Trace completeness improves over manual planning.',
    floor_case: 'Trace boundary gaps are surfaced earlier.',
    recommended_disposition: 'advance_to_package',
    total_score: 84,
    value_summary: 'Strong bounded value for offline reviewer-aligned evidence planning.',
    confidence: 0.82,
    accepted_risk_refs: refArray(valueInput.accepted_risk_refs),
    blocker_refs: [],
    risk_notes: ['Evidence freshness can drift.'],
    reasoning_memo: {
      recommendation: 'advance_to_package',
      value_thesis: 'The topic is valuable because trace completeness is a reviewer-visible bottleneck.',
      significance: 'The workflow targets a common planning failure.',
      originality: 'It combines local-first trace contracts with reviewer-aligned replay.',
      claim_leverage: 'The claim is bounded to offline replay feasibility.',
      reviewer_risks: ['Venue specificity may be questioned.'],
      effort_to_value: 'The evidence can be collected within the slice budget.',
      strategic_fit: 'It advances the paper-engineering assistant roadmap.',
      negative_memory_check: 'No negative memory ref blocks this exact slice.',
      evidence_backed_rationale: 'Support evidence and baseline refs justify a bounded assessment.',
      top_objections: ['Manual planning may already be sufficient.'],
      uncertainty: 'Replay diversity remains uncertain.',
      disposition_bridge: 'Advance only to draft package, not promotion.',
      requires_critic_review: false,
      critic_triggers: [],
      cited_refs: [evidenceRef],
    },
  };
}

function requiredAction(actionCode: string, refs: TopicSelectionFunctionalRef[]) {
  return {
    action_code: actionCode,
    severity: 'blocking',
    loopback_target: 'package',
    refs,
    reason: `${actionCode} must be checked before the draft moves downstream.`,
  };
}

test('T-068 node-level backend decision-chain acceptance uses deterministic mock data', async (t) => {
  const v1bGateway = new FakeTopicSelectionV1bLlmGateway();
  const v1cGateway = new NoUnexpectedV1cLlmGateway();
  const app = buildApp({
    topicSelectionV1bLlmGateway: v1bGateway,
    topicSelectionV1cPromotionGateLlmGateway: v1cGateway,
  });
  const state: Partial<AcceptanceState> = {};

  try {
    await t.test('fixture node creates mock literature, title card, and evidence basket', async () => {
      const importBody = await requestJson<{ results: Array<{ literature_id: string }> }>(
        app,
        'POST',
        '/literature/collections/import',
        200,
        {
          items: [
            {
              provider: 'manual',
              ...FIXTURE.literature,
            },
          ],
        },
      );
      const literatureId = importBody.results[0]?.literature_id;
      assert.ok(literatureId);

      const titleCard = await requestJson<{ title_card_id: string; working_title: string }>(
        app,
        'POST',
        '/title-cards',
        201,
        FIXTURE.titleCard,
      );
      assert.equal(titleCard.working_title, FIXTURE.titleCard.working_title);

      const basket = await requestJson<{ title_card_id: string; items: Array<{ literature_id: string }> }>(
        app,
        'PATCH',
        `/title-cards/${encodeURIComponent(titleCard.title_card_id)}/evidence-basket`,
        200,
        { add_literature_ids: [literatureId] },
      );
      assert.equal(basket.title_card_id, titleCard.title_card_id);
      assert.deepEqual(basket.items.map((item) => item.literature_id), [literatureId]);

      state.literatureId = literatureId;
      state.titleCardId = titleCard.title_card_id;
    });

    await t.test('v1a node 01 creates topic seed from title-card fixture', async () => {
      const titleCardId = requireState(state, 'titleCardId');
      const seed = await requestJson<{ topic_seed_id: string; title_card_id: string; seed_version: string }>(
        app,
        'POST',
        '/topic-selection/v1a/topic-seeds/from-title-card',
        201,
        {
          title_card_id: titleCardId,
          intent_summary: 'Use the fixture title card to seed T-068 acceptance.',
          created_by: 'system',
        },
      );

      assert.equal(seed.title_card_id, titleCardId);
      assert.ok(seed.seed_version);
      state.topicSeedId = seed.topic_seed_id;
    });

    await t.test('v1a node 02 snapshots literature resource pool with source refs', async () => {
      const titleCardId = requireState(state, 'titleCardId');
      const snapshot = await requestJson<{
        literature_resource_pool_snapshot_id: string;
        literature_refs: TopicSelectionFunctionalRef[];
        content_source_refs: TopicSelectionFunctionalRef[];
      }>(
        app,
        'POST',
        '/topic-selection/v1a/literature-resource-pool-snapshots',
        201,
        {
          title_card_id: titleCardId,
          topic_seed_id: requireState(state, 'topicSeedId'),
          source_scope: 'title_card_evidence_basket',
          created_by: 'system',
        },
      );

      assert.equal(snapshot.literature_refs.length, 1);
      assert.equal(snapshot.content_source_refs.length, 1);
      assert.equal(snapshot.literature_refs[0]?.title_card_id, titleCardId);
      state.resourcePoolSnapshotId = snapshot.literature_resource_pool_snapshot_id;
      state.literatureRef = snapshot.literature_refs[0]!;
      state.sourceRef = snapshot.content_source_refs[0]!;
    });

    await t.test('v1a node 03 creates role-complete search plan', async () => {
      const titleCardId = requireState(state, 'titleCardId');
      const coverageIntents = FIXTURE.coverageIntents.map(([coverageKey, role, query]) => ({
        coverage_key: coverageKey,
        intent_type: role,
        query,
        expected_evidence_role: role,
        required: true,
        priority: 1,
      }));
      const plan = await requestJson<{
        search_plan: { search_plan_id: string; plan_version: string };
        coverage_row_intents: CoverageRow[];
      }>(
        app,
        'POST',
        '/topic-selection/v1a/search-plans',
        201,
        {
          title_card_id: titleCardId,
          topic_seed_id: requireState(state, 'topicSeedId'),
          literature_resource_pool_snapshot_id: requireState(state, 'resourcePoolSnapshotId'),
          query_intents: coverageIntents.map((intent) => intent.query),
          coverage_intents: coverageIntents,
          created_by: 'system',
        },
      );

      assert.equal(plan.coverage_row_intents.length, 4);
      assert.deepEqual(
        new Set(plan.coverage_row_intents.map((row) => row.expected_evidence_role)),
        new Set(['support', 'challenge', 'baseline', 'context']),
      );
      state.searchPlanId = plan.search_plan.search_plan_id;
      state.coverageRows = plan.coverage_row_intents;
    });

    await t.test('v1a node 04 records search run and satisfied coverage matrix', async () => {
      const titleCardId = requireState(state, 'titleCardId');
      const coverageRows = requireState(state, 'coverageRows');
      const literatureRef = requireState(state, 'literatureRef');
      const sourceRef = requireState(state, 'sourceRef');

      const run = await requestJson<{ search_run: { search_run_id: string; run_status: string } }>(
        app,
        'POST',
        '/topic-selection/v1a/search-runs',
        201,
        {
          title_card_id: titleCardId,
          search_plan_id: requireState(state, 'searchPlanId'),
          result_accounting: {
            total_result_count: 4,
            unique_literature_count: 1,
            duplicate_result_count: 0,
            failed_source_count: 0,
            skipped_source_count: 0,
          },
          source_health_summary: { source_count: 1, warning_codes: [] },
          dedup_summary: { canonical_work_refs: [literatureRef] },
          evidence_map_input_refs: [literatureRef, sourceRef],
          coverage_observations: coverageRows.map((row) => ({
            coverage_row_intent_id: row.coverage_row_intent_id,
            status: 'succeeded',
            result_count: 1,
            source_count: 1,
          })),
          evidence_bindings: coverageRows.map((row, index) => ({
            coverage_row_intent_id: row.coverage_row_intent_id,
            literature_ref: literatureRef,
            source_refs: [sourceRef],
            binding_kind: 'retrieval_hit',
            result_rank: index + 1,
          })),
          coverage_assessments: coverageRows.map((row) => ({
            coverage_row_intent_id: row.coverage_row_intent_id,
            verdict: 'satisfied',
            confidence: 0.9,
            assessed_by: 'system',
          })),
          created_by: 'system',
        },
      );
      assert.equal(run.search_run.run_status, 'succeeded');

      const matrix = await requestJson<{ summary: { satisfied_count: number } }>(
        app,
        'GET',
        `/topic-selection/v1a/search-plans/${encodeURIComponent(requireState(state, 'searchPlanId'))}/coverage-matrix`,
        200,
      );
      assert.equal(matrix.summary.satisfied_count, 4);
      state.searchRunId = run.search_run.search_run_id;
    });

    await t.test('v1a node 05 creates evidence map and validation evidence bundle', async () => {
      const titleCardId = requireState(state, 'titleCardId');
      const literatureRef = requireState(state, 'literatureRef');
      const sourceRef = requireState(state, 'sourceRef');
      const rowsByRole = new Map(requireState(state, 'coverageRows').map((row) => [row.expected_evidence_role, row]));

      const evidenceMap = await requestJson<{
        evidence_map: {
          evidence_map_id: string;
          support_unit_count: number;
          challenge_unit_count: number;
          baseline_unit_count: number;
          context_unit_count: number;
        };
        evidence_units: Array<{ evidence_unit_id: string; evidence_role: string }>;
      }>(
        app,
        'POST',
        '/topic-selection/v1a/evidence-maps',
        201,
        {
          title_card_id: titleCardId,
          search_run_id: requireState(state, 'searchRunId'),
          evidence_units: [
            {
              client_unit_key: 'support',
              coverage_row_intent_id: rowsByRole.get('support')?.coverage_row_intent_id,
              evidence_role: 'support',
              literature_ref: literatureRef,
              locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: 'support' }),
              source_statement: 'Reviewers need traceability from source claims to topic-selection decisions.',
            },
            {
              client_unit_key: 'challenge',
              coverage_row_intent_id: rowsByRole.get('challenge')?.coverage_row_intent_id,
              evidence_role: 'challenge',
              literature_ref: literatureRef,
              locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: 'challenge' }),
              source_statement: 'Evidence freshness can weaken reviewer-facing traceability conclusions.',
            },
            {
              client_unit_key: 'baseline',
              coverage_row_intent_id: rowsByRole.get('baseline')?.coverage_row_intent_id,
              evidence_role: 'baseline',
              literature_ref: literatureRef,
              locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: 'baseline' }),
              source_statement: 'Baseline decision chains often collapse provenance into a single opaque status.',
            },
            {
              client_unit_key: 'context',
              coverage_row_intent_id: rowsByRole.get('context')?.coverage_row_intent_id,
              evidence_role: 'context',
              literature_ref: literatureRef,
              locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: 'context' }),
              source_statement: 'The workflow is scoped to local CS paper engineering and reviewer-aligned evidence review.',
            },
          ],
          conflict_sets: [
            {
              conflict_type: 'claim_conflict',
              severity: 'moderate',
              support_unit_keys: ['support'],
              challenge_unit_keys: ['challenge'],
              issue_codes: ['EVIDENCE_FRESHNESS_CHALLENGE'],
            },
          ],
          created_by: 'system',
        },
      );

      assert.equal(evidenceMap.evidence_map.support_unit_count, 1);
      assert.equal(evidenceMap.evidence_map.challenge_unit_count, 1);
      assert.equal(evidenceMap.evidence_map.baseline_unit_count, 1);
      assert.equal(evidenceMap.evidence_map.context_unit_count, 1);
      assert.equal(evidenceMap.evidence_units.length, 4);

      const bundle = await requestJson<{
        support_units: unknown[];
        challenge_units: unknown[];
        baseline_units: unknown[];
        context_units: unknown[];
        conflict_set_refs: TopicSelectionFunctionalRef[];
      }>(
        app,
        'GET',
        `/topic-selection/v1a/evidence-maps/${encodeURIComponent(evidenceMap.evidence_map.evidence_map_id)}/need-validation-bundle`,
        200,
      );
      assert.equal(bundle.support_units.length, 1);
      assert.equal(bundle.challenge_units.length, 1);
      assert.equal(bundle.baseline_units.length, 1);
      assert.equal(bundle.context_units.length, 1);
      assert.equal(bundle.conflict_set_refs.length, 1);

      state.evidenceMapId = evidenceMap.evidence_map.evidence_map_id;
      state.evidenceUnits = evidenceMap.evidence_units;
    });

    await t.test('v1a invariant blocks support packet when readiness is not ready', async () => {
      const blockedCandidate = await requestJson<{ need_candidate_id: string; decision_status: string }>(
        app,
        'POST',
        '/topic-selection/v1a/need-candidates',
        201,
        {
          title_card_id: requireState(state, 'titleCardId'),
          evidence_map_id: requireState(state, 'evidenceMapId'),
          candidate_need: 'Traceability may be useful, but this branch intentionally carries no evidence.',
          mechanism_type: 'workflow_gap',
          mechanism_summary: 'Negative fixture branch with no support, baseline, or context refs.',
          scope_notes: 'Only verifies readiness blocking; it must not become a v1b input.',
          prior_art_status: 'no_strong_solution_found',
          support_unit_ids: [],
          challenge_unit_ids: [],
          baseline_unit_ids: [],
          context_unit_ids: [],
          created_by: 'system',
        },
      );
      assert.equal(blockedCandidate.decision_status, 'hypothesis');

      const blockedReadiness = await requestJson<{
        readiness_assessment_id: string;
        recommendation: string;
        blockers: Array<{ code: string }>;
      }>(
        app,
        'POST',
        `/topic-selection/v1a/need-candidates/${encodeURIComponent(blockedCandidate.need_candidate_id)}/readiness-assessments`,
        201,
        { assessed_by: 'system' },
      );
      assert.equal(blockedReadiness.recommendation, 'evidence_gap');
      const blockerCodes = blockedReadiness.blockers.map((blocker) => blocker.code);
      assert.ok(blockerCodes.includes('SUPPORT_EVIDENCE_REQUIRED'));
      assert.ok(blockerCodes.includes('COVERAGE_BASELINE_OR_CONTEXT_REQUIRED'));

      const packetError = await requestError(
        app,
        'POST',
        '/topic-selection/v1a/validation-support-packets',
        409,
        {
          need_candidate_id: blockedCandidate.need_candidate_id,
          readiness_assessment_id: blockedReadiness.readiness_assessment_id,
          created_by: 'system',
        },
      );
      assert.equal(packetError.error.code, 'GATE_CONSTRAINT_FAILED');
    });

    await t.test('v1a node 06 creates need candidate as hypothesis only', async () => {
      const candidate = await requestJson<{
        need_candidate_id: string;
        decision_status: string;
        result_validated_need_id: string | null;
        evidence_map_ref: TopicSelectionFunctionalRef;
      }>(
        app,
        'POST',
        '/topic-selection/v1a/need-candidates',
        201,
        {
          title_card_id: requireState(state, 'titleCardId'),
          evidence_map_id: requireState(state, 'evidenceMapId'),
          candidate_need: FIXTURE.candidateNeed,
          mechanism_type: 'workflow_gap',
          mechanism_summary: 'The decision chain is hard to audit without explicit gates and evidence refs.',
          scope_notes: 'Local-first CS paper engineering workflows that prepare reviewer-facing topic decisions.',
          prior_art_status: 'no_strong_solution_found',
          created_by: 'system',
        },
      );

      assert.equal(candidate.decision_status, 'hypothesis');
      assert.equal(candidate.result_validated_need_id, null);
      assert.equal(candidate.evidence_map_ref.ref_id, requireState(state, 'evidenceMapId'));
      state.needCandidateId = candidate.need_candidate_id;
    });

    await t.test('v1a node 07 assesses readiness and creates human support packet', async () => {
      const readiness = await requestJson<{
        readiness_assessment_id: string;
        recommendation: string;
        blockers: unknown[];
      }>(
        app,
        'POST',
        `/topic-selection/v1a/need-candidates/${encodeURIComponent(requireState(state, 'needCandidateId'))}/readiness-assessments`,
        201,
        { assessed_by: 'system' },
      );
      assert.equal(readiness.recommendation, 'ready_for_validation');
      assert.equal(readiness.blockers.length, 0);

      const packet = await requestJson<{
        validation_support_packet_id: string;
        need_candidate_id: string;
        readiness_assessment_id: string;
        required_human_checks: string[];
      }>(
        app,
        'POST',
        '/topic-selection/v1a/validation-support-packets',
        201,
        {
          need_candidate_id: requireState(state, 'needCandidateId'),
          readiness_assessment_id: readiness.readiness_assessment_id,
          created_by: 'system',
        },
      );
      assert.equal(packet.need_candidate_id, requireState(state, 'needCandidateId'));
      assert.equal(packet.readiness_assessment_id, readiness.readiness_assessment_id);
      assert.ok(packet.required_human_checks.length > 0);

      state.readinessAssessmentId = readiness.readiness_assessment_id;
      state.validationSupportPacketId = packet.validation_support_packet_id;
    });

    await t.test('v1a negative boundary rejects system-only human confirmation', async () => {
      const error = await requestError(
        app,
        'POST',
        '/topic-selection/v1a/adjudications/missing-adjudication/human-confirmations',
        400,
        {
          human_actor: { actor_type: 'system' },
          human_rationale: 'Invalid fixture branch.',
        },
      );
      assert.equal(error.error.code, 'INVALID_PAYLOAD');
    });

    await t.test('v1a node 08 records human adjudication and v1b handoff', async () => {
      const adjudication = await requestJson<{
        adjudication_result: {
          adjudication_result_id: string;
          final_decision: string;
          human_decision_id: string | null;
          output_validated_need_id: string | null;
        };
        validated_need: null;
        v1b_input_bundle: null;
      }>(
        app,
        'POST',
        `/topic-selection/v1a/need-candidates/${encodeURIComponent(requireState(state, 'needCandidateId'))}/adjudications`,
        201,
        {
          support_packet_id: requireState(state, 'validationSupportPacketId'),
          final_decision: 'validate',
          rationale: 'Human reviewer confirms the need and trace boundary.',
          adjudicated_by: FIXTURE.actor.human,
        },
      );

      assert.equal(adjudication.adjudication_result.final_decision, 'validate');
      assert.equal(adjudication.adjudication_result.human_decision_id, null);
      assert.ok(adjudication.adjudication_result.output_validated_need_id);
      assert.equal(adjudication.validated_need, null);
      assert.equal(adjudication.v1b_input_bundle, null);

      const confirmation = await requestJson<{
        validated_need: { validated_need_id: string; source_need_candidate_id: string };
        need_candidate: { result_validated_need_id: string | null };
      }>(
        app,
        'POST',
        `/topic-selection/v1a/adjudications/${encodeURIComponent(
          adjudication.adjudication_result.adjudication_result_id,
        )}/human-confirmations`,
        201,
        {
          human_actor: FIXTURE.actor.human,
          human_rationale: 'Support, challenge, baseline, context, and handoff refs are sufficient for v1b input.',
        },
      );
      assert.equal(adjudication.adjudication_result.output_validated_need_id, confirmation.validated_need.validated_need_id);
      assert.equal(confirmation.validated_need.source_need_candidate_id, requireState(state, 'needCandidateId'));
      assert.equal(confirmation.need_candidate.result_validated_need_id, confirmation.validated_need.validated_need_id);

      const bundle = await requestJson<{
        v1b_input_bundle_id: string;
        validated_need_id: string;
        support_packet_id: string;
      }>(
        app,
        'POST',
        '/topic-selection/v1a/v1b-input-bundles',
        201,
        { validated_need_id: confirmation.validated_need.validated_need_id, created_by: 'system' },
      );
      assert.equal(bundle.validated_need_id, confirmation.validated_need.validated_need_id);
      assert.equal(bundle.support_packet_id, requireState(state, 'validationSupportPacketId'));

      state.validatedNeedId = confirmation.validated_need.validated_need_id;
      state.v1bInputBundleId = bundle.v1b_input_bundle_id;
    });

    await t.test('v1a invariant rejects duplicate adjudication after ValidatedNeed authority closes candidate', async () => {
      const error = await requestError(
        app,
        'POST',
        `/topic-selection/v1a/need-candidates/${encodeURIComponent(requireState(state, 'needCandidateId'))}/adjudications`,
        409,
        {
          support_packet_id: requireState(state, 'validationSupportPacketId'),
          final_decision: 'validate',
          rationale: 'A second validate attempt must not mint a duplicate ValidatedNeed.',
          adjudicated_by: FIXTURE.actor.human,
        },
      );
      assert.equal(error.error.code, 'GATE_CONSTRAINT_FAILED');
    });

    await t.test('v1b node 01 creates intake snapshot from v1a handoff', async () => {
      const intake = await requestJson<{
        v1b_intake_snapshot_id: string;
        v1b_input_bundle_id: string;
        validated_need_ref: TopicSelectionFunctionalRef;
      }>(
        app,
        'POST',
        '/topic-selection/v1b/intake-snapshots',
        201,
        {
          v1b_input_bundle_id: requireState(state, 'v1bInputBundleId'),
          created_by: 'system',
        },
      );

      assert.equal(intake.v1b_input_bundle_id, requireState(state, 'v1bInputBundleId'));
      assert.equal(intake.validated_need_ref.ref_id, requireState(state, 'validatedNeedId'));
      state.v1bIntakeSnapshotId = intake.v1b_intake_snapshot_id;
    });

    await t.test('v1b node 02 freezes human research constraints', async () => {
      const profile = await requestJson<{
        research_constraint_profile_id: string;
        v1b_intake_snapshot_id: string;
        target_community: string;
        claim_ceiling: string;
        non_goals: string[];
      }>(
        app,
        'POST',
        '/topic-selection/v1b/research-constraint-profiles',
        201,
        {
          v1b_intake_snapshot_id: requireState(state, 'v1bIntakeSnapshotId'),
          ...FIXTURE.constraintProfile,
          created_by: 'human',
        },
      );

      assert.equal(profile.v1b_intake_snapshot_id, requireState(state, 'v1bIntakeSnapshotId'));
      assert.equal(profile.target_community, FIXTURE.constraintProfile.target_community);
      assert.equal(profile.claim_ceiling, FIXTURE.constraintProfile.claim_ceiling);
      assert.deepEqual(profile.non_goals, FIXTURE.constraintProfile.non_goals);
      state.researchConstraintProfileId = profile.research_constraint_profile_id;
    });

    await t.test('v1b node 03 passes intake readiness gate', async () => {
      const readiness = await requestJson<{
        v1b_intake_readiness_assessment_id: string;
        recommendation: string;
        blockers: unknown[];
      }>(
        app,
        'POST',
        '/topic-selection/v1b/intake-readiness-assessments',
        201,
        {
          v1b_intake_snapshot_id: requireState(state, 'v1bIntakeSnapshotId'),
          research_constraint_profile_id: requireState(state, 'researchConstraintProfileId'),
          assessed_by: 'system',
        },
      );

      assert.equal(readiness.recommendation, 'ready_for_slice');
      assert.equal(readiness.blockers.length, 0);
      state.v1bReadinessAssessmentId = readiness.v1b_intake_readiness_assessment_id;
    });

    await t.test('v1b node 04 generates mock research-slice options', async () => {
      const options = await requestJson<{
        option_set: { research_slice_option_set_id: string; status: string; recommended_option_id: string | null };
        options: Array<{ research_slice_option_id: string; option_key: string; support_evidence_refs: TopicSelectionFunctionalRef[] }>;
      }>(
        app,
        'POST',
        '/topic-selection/v1b/research-slice-option-sets',
        201,
        {
          readiness_assessment_id: requireState(state, 'v1bReadinessAssessmentId'),
          triggered_by: 'system',
        },
      );

      assert.equal(options.option_set.status, 'ready_for_selection');
      assert.equal(options.options.length, 1);
      assert.equal(options.options[0]?.option_key, 'slice-a');
      assert.ok(options.options[0]?.support_evidence_refs.length);
      state.researchSliceOptionSetId = options.option_set.research_slice_option_set_id;
      state.researchSliceOptionId = options.options[0]!.research_slice_option_id;
    });

    await t.test('v1b node 05 records human slice selection and materializes ResearchSlice', async () => {
      const selection = await requestJson<{
        decision: { decision: string; selected_option_id: string | null; output_research_slice_ref: TopicSelectionFunctionalRef };
        research_slice: { research_slice_id: string; status: string; validated_need_id: string; claim_ceiling: string };
      }>(
        app,
        'POST',
        `/topic-selection/v1b/research-slice-option-sets/${encodeURIComponent(requireState(state, 'researchSliceOptionSetId'))}/selection-decisions`,
        201,
        {
          decision: 'select',
          selected_option_id: requireState(state, 'researchSliceOptionId'),
          decided_by: 'human',
          selection_rationale: 'Selected as the most bounded option for T-068 acceptance.',
          confidence: 0.84,
        },
      );

      assert.equal(selection.decision.decision, 'select');
      assert.equal(selection.decision.selected_option_id, requireState(state, 'researchSliceOptionId'));
      assert.equal(selection.research_slice.status, 'selected');
      assert.equal(selection.research_slice.validated_need_id, requireState(state, 'validatedNeedId'));
      assert.equal(selection.research_slice.claim_ceiling, FIXTURE.constraintProfile.claim_ceiling);
      state.researchSliceId = selection.research_slice.research_slice_id;
    });

    await t.test('v1b node 06 generates mock topic-question candidates', async () => {
      const candidates = await requestJson<{
        candidate_set: { topic_question_candidate_set_id: string; status: string };
        candidates: Array<{ topic_question_candidate_id: string; candidate_key: string; answerability_verdict: string }>;
      }>(
        app,
        'POST',
        '/topic-selection/v1b/topic-question-candidate-sets',
        201,
        {
          research_slice_id: requireState(state, 'researchSliceId'),
          triggered_by: 'system',
        },
      );

      assert.equal(candidates.candidate_set.status, 'ready_for_selection');
      assert.equal(candidates.candidates.length, 1);
      assert.equal(candidates.candidates[0]?.candidate_key, 'question-a');
      assert.equal(candidates.candidates[0]?.answerability_verdict, 'answerable');
      state.topicQuestionCandidateSetId = candidates.candidate_set.topic_question_candidate_set_id;
      state.topicQuestionCandidateId = candidates.candidates[0]!.topic_question_candidate_id;
    });

    await t.test('v1b node 07 records human question selection and materializes contract', async () => {
      const selection = await requestJson<{
        decision: { decision: string; admitted_candidate_ids: string[] };
        materializations: Array<{
          topic_question: { topic_question_id: string };
          topic_question_contract: { topic_question_contract_id: string; status: string; claim_ceiling: string };
        }>;
      }>(
        app,
        'POST',
        `/topic-selection/v1b/topic-question-candidate-sets/${encodeURIComponent(requireState(state, 'topicQuestionCandidateSetId'))}/selection-decisions`,
        201,
        {
          decision: 'admit',
          admitted_candidate_ids: [requireState(state, 'topicQuestionCandidateId')],
          decided_by: 'human',
          decision_rationale: 'Question is answerable and stays within the selected slice.',
          confidence: 0.85,
        },
      );

      assert.equal(selection.decision.decision, 'admit');
      assert.deepEqual(selection.decision.admitted_candidate_ids, [requireState(state, 'topicQuestionCandidateId')]);
      assert.equal(selection.materializations.length, 1);
      assert.equal(selection.materializations[0]?.topic_question_contract.status, 'active');
      assert.equal(selection.materializations[0]?.topic_question_contract.claim_ceiling, FIXTURE.constraintProfile.claim_ceiling);
      state.topicQuestionContractId = selection.materializations[0]!.topic_question_contract.topic_question_contract_id;
    });

    await t.test('v1b node 08 assesses value with mock gates and dimensions', async () => {
      const assessment = await requestJson<{
        topic_value_assessment: {
          topic_value_assessment_id: string;
          readiness_status: string;
          total_score: number;
          hard_gates: Array<{ gate_key: string; verdict: string }>;
          dimension_scores: Array<{ dimension_key: string; score: number }>;
        };
        value_reasoning_memo: { recommendation: string; cited_refs: TopicSelectionFunctionalRef[] };
      }>(
        app,
        'POST',
        '/topic-selection/v1b/topic-value-assessments',
        201,
        {
          topic_question_contract_id: requireState(state, 'topicQuestionContractId'),
          triggered_by: 'system',
        },
      );

      assert.equal(assessment.topic_value_assessment.readiness_status, 'ready');
      assert.equal(assessment.topic_value_assessment.total_score, 84);
      assert.equal(assessment.topic_value_assessment.hard_gates.every((gate) => gate.verdict === 'pass'), true);
      assert.equal(assessment.topic_value_assessment.dimension_scores.length, TOPIC_SELECTION_VALUE_DIMENSIONS.length);
      assert.equal(assessment.value_reasoning_memo.recommendation, 'advance_to_package');
      assert.ok(assessment.value_reasoning_memo.cited_refs.length > 0);
      state.topicValueAssessmentId = assessment.topic_value_assessment.topic_value_assessment_id;
    });

    await t.test('v1b invariant blocks draft package creation for non-advance disposition', async () => {
      const disposition = await requestJson<{ value_disposition_decision_id: string; decision: string }>(
        app,
        'POST',
        `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(requireState(state, 'topicValueAssessmentId'))}/disposition-decisions`,
        201,
        {
          decision: 'park',
          decided_by: 'human',
          decision_rationale: 'Park until the package boundary is narrowed.',
          required_actions: ['narrow package boundary'],
        },
      );
      assert.equal(disposition.decision, 'park');

      const packageError = await requestError(
        app,
        'POST',
        '/topic-selection/v1b/topic-packages/drafts',
        409,
        {
          value_disposition_decision_id: disposition.value_disposition_decision_id,
          created_by: 'system',
        },
      );
      assert.equal(packageError.error.code, 'GATE_CONSTRAINT_FAILED');
    });

    await t.test('v1b node 09 records value disposition and creates trace-ready draft package', async () => {
      const disposition = await requestJson<{ value_disposition_decision_id: string; decision: string }>(
        app,
        'POST',
        `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(requireState(state, 'topicValueAssessmentId'))}/disposition-decisions`,
        201,
        {
          decision: 'advance_to_package',
          decided_by: 'human',
          decision_rationale: 'Advance only to draft package for v1c handoff.',
        },
      );
      assert.equal(disposition.decision, 'advance_to_package');

      const draftPackage = await requestJson<{
        topic_package: {
          topic_package_id: string;
          package_readiness_status: string;
          value_disposition_decision_id: string;
          trace_boundary_check_id: string;
          readiness_assessment_id: string;
          v1c_input_bundle_id: string;
        };
        package_trace_boundary_check: { check_status: string };
        package_readiness_assessment: { package_readiness_status: string };
        v1c_input_bundle: { v1b_to_v1c_input_bundle_id: string };
      }>(
        app,
        'POST',
        '/topic-selection/v1b/topic-packages/drafts',
        201,
        {
          value_disposition_decision_id: disposition.value_disposition_decision_id,
          created_by: 'system',
        },
      );

      assert.equal(draftPackage.topic_package.value_disposition_decision_id, disposition.value_disposition_decision_id);
      assert.equal(draftPackage.topic_package.package_readiness_status, 'ready_for_promotion_review');
      assert.equal(draftPackage.package_trace_boundary_check.check_status, 'passed');
      assert.equal(draftPackage.package_readiness_assessment.package_readiness_status, 'ready_for_promotion_review');
      assert.equal(
        draftPackage.topic_package.v1c_input_bundle_id,
        draftPackage.v1c_input_bundle.v1b_to_v1c_input_bundle_id,
      );

      const readBack = await requestJson<{ topic_package_id: string; package_readiness_status: string }>(
        app,
        'GET',
        `/topic-selection/v1b/topic-packages/${encodeURIComponent(draftPackage.topic_package.topic_package_id)}`,
        200,
      );
      assert.equal(readBack.package_readiness_status, 'ready_for_promotion_review');

      const duplicatePackage = await requestError(
        app,
        'POST',
        '/topic-selection/v1b/topic-packages/drafts',
        409,
        {
          value_disposition_decision_id: disposition.value_disposition_decision_id,
          created_by: 'system',
        },
      );
      assert.equal(duplicatePackage.error.code, 'VERSION_CONFLICT');

      state.valueDispositionDecisionId = disposition.value_disposition_decision_id;
      state.topicPackageId = draftPackage.topic_package.topic_package_id;
      state.v1cInputBundleId = draftPackage.v1c_input_bundle.v1b_to_v1c_input_bundle_id;
    });

    await t.test('v1b node 10 republishes v1c handoff idempotently', async () => {
      const bundle = await requestJson<{
        v1b_to_v1c_input_bundle_id: string;
        topic_package_id: string;
        value_disposition_decision_ref: TopicSelectionFunctionalRef;
      }>(
        app,
        'POST',
        `/topic-selection/v1b/topic-packages/${encodeURIComponent(requireState(state, 'topicPackageId'))}/v1c-input-bundles`,
        200,
      );

      assert.equal(bundle.v1b_to_v1c_input_bundle_id, requireState(state, 'v1cInputBundleId'));
      assert.equal(bundle.topic_package_id, requireState(state, 'topicPackageId'));
      assert.equal(bundle.value_disposition_decision_ref.ref_id, requireState(state, 'valueDispositionDecisionId'));
      assert.deepEqual(
        v1bGateway.calls.map((call) => call.schemaName),
        [
          'topic_selection_research_slice_option_set',
          'topic_selection_topic_question_candidate_set',
          'topic_selection_topic_value_assessment',
        ],
      );
    });

    await t.test('v1c node 01 creates promotion input snapshot from v1b package handoff', async () => {
      const snapshot = await requestJson<{
        promotion_input_snapshot_id: string;
        promotion_input_snapshot_hash: string;
        promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
        topic_package_id: string;
        closure_status: string;
        bundle_hash: string;
      }>(
        app,
        'POST',
        '/topic-selection/v1c/promotion-input-snapshots',
        201,
        {
          v1b_to_v1c_input_bundle_id: requireState(state, 'v1cInputBundleId'),
          created_by: 'system',
        },
      );

      assert.equal(snapshot.topic_package_id, requireState(state, 'topicPackageId'));
      assert.equal(snapshot.closure_status, 'ready_for_gate');
      assert.ok(snapshot.bundle_hash);
      state.promotionInputSnapshotId = snapshot.promotion_input_snapshot_id;
      state.promotionInputSnapshotHash = snapshot.promotion_input_snapshot_hash;
      state.promotionInputSnapshotRef = snapshot.promotion_input_snapshot_ref;
    });

    await t.test('v1c node 02 creates deterministic gate support, dossier, mini-check, and gate', async () => {
      const gateBundle = await requestJson<{
        promotion_decision_support: {
          promotion_decision_support_id: string;
          support_generation_mode: string;
          support_status: string;
        };
        promotion_dossier: { promotion_dossier_id: string; source_refs: TopicSelectionFunctionalRef[] };
        argument_readiness_mini_check: {
          argument_readiness_mini_check_id: string;
          check_status: string;
          required_actions: unknown[];
        };
        promotion_gate_check: {
          promotion_gate_check_id: string;
          disposition: string;
          promote_allowed: boolean;
          promotion_input_snapshot_hash: string;
          promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
        };
      }>(
        app,
        'POST',
        '/topic-selection/v1c/promotion-gate-checks',
        201,
        {
          promotion_input_snapshot_id: requireState(state, 'promotionInputSnapshotId'),
          created_by: 'system',
          support_generation_mode: 'deterministic',
        },
      );

      assert.equal(gateBundle.promotion_decision_support.support_generation_mode, 'deterministic');
      assert.equal(gateBundle.promotion_decision_support.support_status, 'succeeded');
      assert.ok(gateBundle.promotion_dossier.source_refs.length > 0);
      assert.equal(gateBundle.argument_readiness_mini_check.check_status, 'passed');
      assert.equal(gateBundle.argument_readiness_mini_check.required_actions.length, 0);
      assert.equal(gateBundle.promotion_gate_check.disposition, 'ready_for_human_decision');
      assert.equal(gateBundle.promotion_gate_check.promote_allowed, true);
      assert.equal(gateBundle.promotion_gate_check.promotion_input_snapshot_hash, requireState(state, 'promotionInputSnapshotHash'));

      for (const [url, id] of [
        ['/topic-selection/v1c/promotion-input-snapshots', requireState(state, 'promotionInputSnapshotId')],
        ['/topic-selection/v1c/promotion-decision-support', gateBundle.promotion_decision_support.promotion_decision_support_id],
        ['/topic-selection/v1c/promotion-dossiers', gateBundle.promotion_dossier.promotion_dossier_id],
        ['/topic-selection/v1c/argument-readiness-mini-checks', gateBundle.argument_readiness_mini_check.argument_readiness_mini_check_id],
        ['/topic-selection/v1c/promotion-gate-checks', gateBundle.promotion_gate_check.promotion_gate_check_id],
      ]) {
        await requestJson<unknown>(app, 'GET', `${url}/${encodeURIComponent(id)}`, 200);
      }

      state.promotionDecisionSupportId = gateBundle.promotion_decision_support.promotion_decision_support_id;
      state.promotionDossierId = gateBundle.promotion_dossier.promotion_dossier_id;
      state.argumentReadinessMiniCheckId = gateBundle.argument_readiness_mini_check.argument_readiness_mini_check_id;
      state.promotionGateCheckId = gateBundle.promotion_gate_check.promotion_gate_check_id;
      state.promotionInputSnapshotRef = gateBundle.promotion_gate_check.promotion_input_snapshot_ref;
    });

    await t.test('v1c negative boundary rejects premature bridge and non-human promotion actor', async () => {
      const earlyBridge = await requestError(
        app,
        'POST',
        '/topic-selection/v1c/paper-project-bridges',
        404,
        {
          promotion_decision_id: 'promotion_decision_missing_before_human_decision',
          created_by: 'system',
        },
      );
      assert.equal(earlyBridge.error.code, 'NOT_FOUND');

      const systemActor = await requestError(
        app,
        'POST',
        '/topic-selection/v1c/promotion-decisions',
        400,
        {
          promotion_gate_check_id: requireState(state, 'promotionGateCheckId'),
          decision: 'promote',
          human_actor: { actor_type: 'system' },
          rationale: 'A system actor must not authorize promotion.',
          confirmed_snapshot_hash: requireState(state, 'promotionInputSnapshotHash'),
        },
      );
      assert.equal(systemActor.error.code, 'INVALID_PAYLOAD');

      const branchDisposition = await requestJson<{ value_disposition_decision_id: string; decision: string }>(
        app,
        'POST',
        `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(requireState(state, 'topicValueAssessmentId'))}/disposition-decisions`,
        201,
        {
          decision: 'advance_to_package',
          decided_by: 'human',
          decision_rationale: 'Create an isolated negative branch for non-promote bridge blocking.',
        },
      );
      assert.equal(branchDisposition.decision, 'advance_to_package');

      const branchPackage = await requestJson<{
        topic_package: { topic_package_id: string };
        v1c_input_bundle: { v1b_to_v1c_input_bundle_id: string };
      }>(
        app,
        'POST',
        '/topic-selection/v1b/topic-packages/drafts',
        201,
        {
          value_disposition_decision_id: branchDisposition.value_disposition_decision_id,
          created_by: 'system',
        },
      );
      assert.ok(branchPackage.topic_package.topic_package_id);

      const branchSnapshot = await requestJson<{
        promotion_input_snapshot_id: string;
        promotion_input_snapshot_hash: string;
      }>(
        app,
        'POST',
        '/topic-selection/v1c/promotion-input-snapshots',
        201,
        {
          v1b_to_v1c_input_bundle_id: branchPackage.v1c_input_bundle.v1b_to_v1c_input_bundle_id,
          created_by: 'system',
        },
      );

      const branchGate = await requestJson<{
        promotion_gate_check: {
          promotion_gate_check_id: string;
          promotion_input_snapshot_hash: string;
          promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
        };
      }>(
        app,
        'POST',
        '/topic-selection/v1c/promotion-gate-checks',
        201,
        {
          promotion_input_snapshot_id: branchSnapshot.promotion_input_snapshot_id,
          created_by: 'system',
          support_generation_mode: 'deterministic',
        },
      );
      assert.equal(
        branchGate.promotion_gate_check.promotion_input_snapshot_hash,
        branchSnapshot.promotion_input_snapshot_hash,
      );

      const actionRefs = [branchGate.promotion_gate_check.promotion_input_snapshot_ref];
      const nonPromote = await requestJson<{
        promotion_decision: { promotion_decision_id: string; bridge_eligible: boolean; loopback_target: string };
        bridge_handoff: null;
      }>(
        app,
        'POST',
        '/topic-selection/v1c/promotion-decisions',
        201,
        {
          promotion_gate_check_id: branchGate.promotion_gate_check.promotion_gate_check_id,
          decision: 'refine_package',
          human_actor: FIXTURE.actor.human,
          rationale: 'Do not promote until the package narrative is refined.',
          confirmed_snapshot_hash: branchSnapshot.promotion_input_snapshot_hash,
          required_actions: [requiredAction('refine_package_narrative', actionRefs)],
          loopback_target: 'package',
        },
      );
      assert.equal(nonPromote.promotion_decision.bridge_eligible, false);
      assert.equal(nonPromote.promotion_decision.loopback_target, 'package');
      assert.equal(nonPromote.bridge_handoff, null);

      const bridgeError = await requestError(
        app,
        'POST',
        '/topic-selection/v1c/paper-project-bridges',
        409,
        {
          promotion_decision_id: nonPromote.promotion_decision.promotion_decision_id,
          created_by: 'system',
        },
      );
      assert.equal(bridgeError.error.code, 'GATE_CONSTRAINT_FAILED');
    });

    await t.test('v1c node 03 records human promotion decision and commitment profile', async () => {
      const conditionRefs = [requireState(state, 'promotionInputSnapshotRef')];
      const human = await requestJson<{
        human_promotion_decision: {
          human_promotion_decision_id: string;
          actor: { actor_type: string; actor_id: string };
        };
        promotion_decision: {
          promotion_decision_id: string;
          decision: string;
          bridge_eligible: boolean;
          promotion_commitment_profile_id: string;
        };
        promotion_commitment_profile: {
          promotion_commitment_profile_id: string;
          conditions: unknown[];
          early_check_obligations: string[];
        };
        bridge_handoff: {
          promotion_decision_id: string;
          promotion_input_snapshot_id: string;
        };
      }>(
        app,
        'POST',
        '/topic-selection/v1c/promotion-decisions',
        201,
        {
          promotion_gate_check_id: requireState(state, 'promotionGateCheckId'),
          decision: 'promote_with_conditions',
          human_actor: FIXTURE.actor.human,
          rationale: 'Explicitly authorize promotion with bounded claim obligations.',
          confirmed_snapshot_hash: requireState(state, 'promotionInputSnapshotHash'),
          conditions: [
            {
              condition_id: 't068_condition_verify_claim_ceiling',
              condition_code: 'verify_claim_ceiling',
              owner: FIXTURE.actor.paperOwner,
              required_action: requiredAction('verify_claim_ceiling', conditionRefs),
              refs: conditionRefs,
              early_check_obligations: ['Verify claim ceiling before outline lock.'],
            },
          ],
          allowed_refinements: [
            {
              refinement_code: 'tighten_claim_wording',
              scope: 'claim_wording',
              refs: conditionRefs,
              reason: 'Allow wording tightening without upstream mutation.',
            },
          ],
          stop_conditions: [
            {
              condition_code: 'evidence_invalidated',
              reason: 'Stop if selected evidence is invalidated.',
              refs: conditionRefs,
            },
          ],
          reopen_conditions: [
            {
              condition_code: 'new_supporting_evidence',
              reason: 'Reopen if new supporting evidence is added downstream.',
              refs: conditionRefs,
            },
          ],
        },
      );

      assert.equal(human.human_promotion_decision.actor.actor_type, 'human');
      assert.equal(human.human_promotion_decision.actor.actor_id, FIXTURE.actor.human.actor_id);
      assert.equal(human.promotion_decision.decision, 'promote_with_conditions');
      assert.equal(human.promotion_decision.bridge_eligible, true);
      assert.equal(
        human.promotion_decision.promotion_commitment_profile_id,
        human.promotion_commitment_profile.promotion_commitment_profile_id,
      );
      assert.equal(human.promotion_commitment_profile.conditions.length, 1);
      assert.deepEqual(human.promotion_commitment_profile.early_check_obligations, ['Verify claim ceiling before outline lock.']);
      assert.equal(human.bridge_handoff.promotion_input_snapshot_id, requireState(state, 'promotionInputSnapshotId'));

      state.humanPromotionDecisionId = human.human_promotion_decision.human_promotion_decision_id;
      state.promotionDecisionId = human.promotion_decision.promotion_decision_id;
      state.promotionCommitmentProfileId = human.promotion_commitment_profile.promotion_commitment_profile_id;
    });

    await t.test('v1c node 04 reads promotion decision artifacts by id', async () => {
      await requestJson<unknown>(
        app,
        'GET',
        `/topic-selection/v1c/human-promotion-decisions/${encodeURIComponent(requireState(state, 'humanPromotionDecisionId'))}`,
        200,
      );
      const promotionDecision = await requestJson<{ promotion_decision_id: string; bridge_eligible: boolean }>(
        app,
        'GET',
        `/topic-selection/v1c/promotion-decisions/${encodeURIComponent(requireState(state, 'promotionDecisionId'))}`,
        200,
      );
      assert.equal(promotionDecision.bridge_eligible, true);

      const bundle = await requestJson<{
        promotion_decision: { promotion_decision_id: string };
        promotion_commitment_profile: { promotion_commitment_profile_id: string };
      }>(
        app,
        'GET',
        `/topic-selection/v1c/promotion-decisions/${encodeURIComponent(requireState(state, 'promotionDecisionId'))}/bundle`,
        200,
      );
      assert.equal(bundle.promotion_decision.promotion_decision_id, requireState(state, 'promotionDecisionId'));
      assert.equal(
        bundle.promotion_commitment_profile.promotion_commitment_profile_id,
        requireState(state, 'promotionCommitmentProfileId'),
      );

      await requestJson<unknown>(
        app,
        'GET',
        `/topic-selection/v1c/promotion-commitment-profiles/${encodeURIComponent(requireState(state, 'promotionCommitmentProfileId'))}`,
        200,
      );
    });

    await t.test('v1c node 05 creates active PaperProjectBridge without PaperProject side effect', async () => {
      const bridge = await requestJson<{
        paper_project_bridge: {
          paper_project_bridge_id: string;
          bridge_status: string;
          source_promotion_decision_id: string;
          paper_project_intake_ref: null;
        };
      }>(
        app,
        'POST',
        '/topic-selection/v1c/paper-project-bridges',
        201,
        {
          promotion_decision_id: requireState(state, 'promotionDecisionId'),
          created_by: 'system',
        },
      );

      assert.equal(bridge.paper_project_bridge.bridge_status, 'active');
      assert.equal(bridge.paper_project_bridge.source_promotion_decision_id, requireState(state, 'promotionDecisionId'));
      assert.equal(bridge.paper_project_bridge.paper_project_intake_ref, null);
      state.paperProjectBridgeId = bridge.paper_project_bridge.paper_project_bridge_id;

      const readBack = await requestJson<{ paper_project_bridge_id: string; bridge_status: string }>(
        app,
        'GET',
        `/topic-selection/v1c/paper-project-bridges/${encodeURIComponent(state.paperProjectBridgeId)}`,
        200,
      );
      assert.equal(readBack.bridge_status, 'active');
    });

    await t.test('v1c node 06 records downstream feedback and recheck projection', async () => {
      const feedback = await requestJson<{
        downstream_topic_feedback: {
          downstream_topic_feedback_id: string;
          recheck_request: { downstream_recheck_request_id: string };
        };
        classification: { loopback_target: string; loopback_cause: string; requires_recheck: boolean };
        recheck_request: { downstream_recheck_request_id: string };
      }>(
        app,
        'POST',
        '/topic-selection/v1c/downstream-feedback',
        201,
        {
          paper_project_bridge_id: requireState(state, 'paperProjectBridgeId'),
          downstream_source_kind: 'paper_project',
          downstream_source_ref: ref('paper_project_section', 't068-introduction', requireState(state, 'titleCardId')),
          feedback_signal: 'overclaim',
          severity: 'blocking',
          summary: 'Draft introduction overclaims beyond the frozen promotion commitment.',
          required_action: 'Reassess value claim ceiling before continuing the paper draft.',
          created_by: 'human',
        },
      );

      assert.equal(feedback.classification.loopback_target, 'value_assessment');
      assert.equal(feedback.classification.loopback_cause, 'overclaim');
      assert.equal(feedback.classification.requires_recheck, true);
      assert.equal(
        feedback.downstream_topic_feedback.recheck_request.downstream_recheck_request_id,
        feedback.recheck_request.downstream_recheck_request_id,
      );

      state.downstreamFeedbackId = feedback.downstream_topic_feedback.downstream_topic_feedback_id;
      state.downstreamRecheckRequestId = feedback.recheck_request.downstream_recheck_request_id;

      const feedbackRead = await requestJson<{ downstream_topic_feedback_id: string }>(
        app,
        'GET',
        `/topic-selection/v1c/downstream-feedback/${encodeURIComponent(state.downstreamFeedbackId)}`,
        200,
      );
      assert.equal(feedbackRead.downstream_topic_feedback_id, state.downstreamFeedbackId);

      const recheckByFeedback = await requestJson<{ recheck_request: { downstream_recheck_request_id: string } }>(
        app,
        'GET',
        `/topic-selection/v1c/downstream-feedback/${encodeURIComponent(state.downstreamFeedbackId)}/recheck-request`,
        200,
      );
      assert.equal(recheckByFeedback.recheck_request.downstream_recheck_request_id, state.downstreamRecheckRequestId);

      const recheckById = await requestJson<{ recheck_request: { downstream_recheck_request_id: string } }>(
        app,
        'GET',
        `/topic-selection/v1c/recheck-requests/${encodeURIComponent(state.downstreamRecheckRequestId)}`,
        200,
      );
      assert.equal(recheckById.recheck_request.downstream_recheck_request_id, state.downstreamRecheckRequestId);

      const list = await requestJson<{ items: unknown[] }>(
        app,
        'GET',
        `/topic-selection/v1c/paper-project-bridges/${encodeURIComponent(requireState(state, 'paperProjectBridgeId'))}/downstream-feedback`,
        200,
      );
      assert.equal(list.items.length, 1);

      const noRecheckFeedback = await requestJson<{
        downstream_topic_feedback: {
          downstream_topic_feedback_id: string;
          recheck_request: null;
        };
        classification: { requires_recheck: boolean };
        recheck_request: null;
      }>(
        app,
        'POST',
        '/topic-selection/v1c/downstream-feedback',
        201,
        {
          paper_project_bridge_id: requireState(state, 'paperProjectBridgeId'),
          downstream_source_kind: 'paper_project',
          downstream_source_ref: ref('paper_project_section', 't068-related-work-note', requireState(state, 'titleCardId')),
          feedback_signal: 'no_recheck_needed',
          severity: 'info',
          summary: 'Downstream note is recorded for lineage only.',
          created_by: 'human',
        },
      );
      assert.equal(noRecheckFeedback.classification.requires_recheck, false);
      assert.equal(noRecheckFeedback.downstream_topic_feedback.recheck_request, null);
      assert.equal(noRecheckFeedback.recheck_request, null);

      const missingRecheckProjection = await requestError(
        app,
        'GET',
        `/topic-selection/v1c/downstream-feedback/${encodeURIComponent(noRecheckFeedback.downstream_topic_feedback.downstream_topic_feedback_id)}/recheck-request`,
        404,
      );
      assert.equal(missingRecheckProjection.error.code, 'NOT_FOUND');

      const listAfterNoRecheck = await requestJson<{ items: unknown[] }>(
        app,
        'GET',
        `/topic-selection/v1c/paper-project-bridges/${encodeURIComponent(requireState(state, 'paperProjectBridgeId'))}/downstream-feedback`,
        200,
      );
      assert.equal(listAfterNoRecheck.items.length, 2);
      assert.equal(v1cGateway.calls.length, 0);
    });
  } finally {
    await app.close();
  }
});

test('T-068 route contract acceptance rejects malformed payloads with stable error envelopes', async () => {
  const app = buildApp({
    topicSelectionV1bLlmGateway: new FakeTopicSelectionV1bLlmGateway(),
    topicSelectionV1cPromotionGateLlmGateway: new NoUnexpectedV1cLlmGateway(),
  });
  try {
    const v1aMalformed = await requestError(app, 'POST', '/topic-selection/v1a/search-plans', 400, {});
    assert.equal(v1aMalformed.error.code, 'INVALID_PAYLOAD');

    const v1bInvalidEnum = await requestError(
      app,
      'POST',
      '/topic-selection/v1b/research-slice-option-sets/option-set-t068/selection-decisions',
      400,
      {
        decision: 'bogus',
        selection_rationale: 'Invalid enum should fail before service execution.',
      },
    );
    assert.equal(v1bInvalidEnum.error.code, 'INVALID_PAYLOAD');

    const v1cMalformedDecision = await requestError(app, 'POST', '/topic-selection/v1c/promotion-decisions', 400, {});
    assert.equal(v1cMalformedDecision.error.code, 'INVALID_PAYLOAD');

    const v1cMalformedFeedback = await requestError(app, 'POST', '/topic-selection/v1c/downstream-feedback', 400, {});
    assert.equal(v1cMalformedFeedback.error.code, 'INVALID_PAYLOAD');
  } finally {
    await app.close();
  }
});

test('T-068 quality baseline acceptance covers synthetic replay datasets, metrics, and diffs', async () => {
  const app = buildApp({
    topicSelectionV1bLlmGateway: new FakeTopicSelectionV1bLlmGateway(),
    topicSelectionV1cPromotionGateLlmGateway: new NoUnexpectedV1cLlmGateway(),
  });
  try {
    for (const config of QUALITY_BASELINES) {
      await assertQualityBaseline(app, config);
    }
  } finally {
    await app.close();
  }
});
