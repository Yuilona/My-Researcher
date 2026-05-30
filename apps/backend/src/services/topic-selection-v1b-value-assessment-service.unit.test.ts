import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionResearchSliceAssumptionRecord,
  TopicSelectionResearchSliceBoundaryRecord,
  TopicSelectionResearchSliceEvidenceRefRecord,
  TopicSelectionV1bTopicQuestionFormationInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionTopicQuestionAnswerabilityPlanRecord,
  TopicSelectionTopicQuestionAssumptionRefRecord,
  TopicSelectionTopicQuestionBoundaryRefRecord,
  TopicSelectionTopicQuestionContractRecord,
  TopicSelectionTopicQuestionEvidenceRefRecord,
  TopicSelectionTopicQuestionFalsificationConditionRecord,
  TopicSelectionTopicQuestionNeedRefRecord,
  TopicSelectionV1bValueAssessmentInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
  type TopicSelectionAssessTopicValueLlmOutput,
  type TopicSelectionValueDisposition,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';

import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionV1bValueAssessmentRepository } from '../repositories/in-memory-topic-selection-v1b-value-assessment-repository.js';
import {
  LlmGatewayError,
  type LlmCallTelemetry,
  type LlmStructuredOutputRequest,
} from './llm-gateway.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TopicSelectionV1bValueAssessmentService,
  type TopicSelectionV1bValueAssessmentInputProvider,
  type TopicSelectionV1bValueAssessmentLlmGateway,
  type TopicSelectionV1bValueAssessmentResearchSliceProvider,
} from './topic-selection-v1b-value-assessment-service.js';

const NOW = '2026-05-14T09:00:00.000Z';
const TITLE_CARD_ID = 'title_card_t060';
const QUESTION_ID = 'topic_question_1';
const CONTRACT_ID = 'topic_question_contract_1';
const RESEARCH_SLICE_ID = 'research_slice_1';

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: TITLE_CARD_ID,
    version_id: versionId,
  };
}

function makeIdFactory() {
  const counters = new Map<string, number>();
  return (prefix: string) => {
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    return `${prefix}_${next}`;
  };
}

function makeTelemetry(): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 'gpt-5.5',
    profile_id: 'topic-selection-topic-value-assessment',
    prompt_template_id: 'topic-selection-topic-value-assessment',
    prompt_template_version: '1',
    elapsed_ms: 12,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: 100,
    output_tokens: 200,
    embedding_input_tokens: null,
    total_tokens: 300,
    cost_usd: null,
    provider_side_cache_hit: null,
    provider_side_cache_read_tokens: null,
    provider_side_cache_write_tokens: null,
  };
}

class StubLlmGateway implements TopicSelectionV1bValueAssessmentLlmGateway {
  calls: LlmStructuredOutputRequest[] = [];
  constructor(
    private readonly output: TopicSelectionAssessTopicValueLlmOutput | Error,
  ) {}

  async createStructuredOutput<T>(request: LlmStructuredOutputRequest) {
    this.calls.push(request);
    if (this.output instanceof Error) {
      throw this.output;
    }
    return {
      parsed: this.output as T,
      raw: { output: this.output },
      telemetry: makeTelemetry(),
    };
  }
}

class StubQuestionInputProvider implements TopicSelectionV1bValueAssessmentInputProvider {
  constructor(private readonly valueInput: TopicSelectionV1bValueAssessmentInput) {}
  async buildValueAssessmentInput() {
    return this.valueInput;
  }
}

class StubResearchSliceProvider implements TopicSelectionV1bValueAssessmentResearchSliceProvider {
  constructor(private readonly formationInput: TopicSelectionV1bTopicQuestionFormationInput) {}
  async buildTopicQuestionFormationInput() {
    return this.formationInput;
  }
}

function makeSliceEvidenceRef(
  id: string,
  evidenceRef: TopicSelectionFunctionalRef,
  role: TopicSelectionResearchSliceEvidenceRefRecord['evidence_role'],
): TopicSelectionResearchSliceEvidenceRefRecord {
  return {
    research_slice_evidence_ref_id: id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    research_slice_id: RESEARCH_SLICE_ID,
    evidence_ref: evidenceRef,
    evidence_role: role,
    rationale: `${role} evidence`,
    evidence_strength_snapshot: {},
    source_locator_snapshot: {},
    created_at: NOW,
  };
}

function makeFormationInput(
  overrides: Partial<TopicSelectionV1bTopicQuestionFormationInput> = {},
): TopicSelectionV1bTopicQuestionFormationInput {
  const supportRef = ref('evidence_unit', 'support_1');
  const baselineRef = ref('evidence_unit', 'baseline_1');
  const challengeRef = ref('evidence_unit', 'challenge_1');
  const boundary: TopicSelectionResearchSliceBoundaryRecord = {
    research_slice_boundary_id: 'boundary_exclude_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    research_slice_id: RESEARCH_SLICE_ID,
    boundary_kind: 'excluded',
    boundary_type: 'scope',
    statement: 'Production deployment is out of scope.',
    reason: 'Selected ResearchSlice boundary.',
    evidence_refs: [challengeRef],
    created_at: NOW,
  };
  const assumption: TopicSelectionResearchSliceAssumptionRecord = {
    research_slice_assumption_id: 'slice_assumption_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    research_slice_id: RESEARCH_SLICE_ID,
    assumption_type: 'resource',
    statement: 'Replay traces are available.',
    status: 'open',
    evidence_refs: [supportRef],
    risk_level: 'medium',
    created_at: NOW,
  };
  return {
    research_slice_ref: ref('research_slice', RESEARCH_SLICE_ID, 'v1'),
    slice_selection_decision_ref: ref('slice_selection_decision', 'slice_decision_1'),
    source_option_set_ref: ref('research_slice_option_set', 'slice_options_1'),
    source_option_ref: ref('research_slice_option', 'slice_option_1'),
    validated_need_ref: ref('validated_need', 'validated_need_1'),
    v1b_intake_snapshot_ref: ref('v1b_intake_snapshot', 'intake_1', 'v1'),
    research_constraint_profile_ref: ref('research_constraint_profile', 'profile_1', 'v1'),
    readiness_assessment_ref: ref('v1b_intake_readiness', 'readiness_1'),
    evidence_map_ref: ref('evidence_map', 'evidence_map_1', 'v1'),
    search_run_ref: ref('search_run', 'search_run_1'),
    search_plan_ref: ref('search_plan', 'search_plan_1', 'v1'),
    literature_snapshot_ref: ref('literature_resource_pool_snapshot', 'literature_snapshot_1', 'v1'),
    target_community: 'LLM systems researchers',
    problem_space: 'Reviewer-aligned evidence workflows for paper engineering.',
    slice_statement: 'Assess offline reviewer-aligned trace completeness.',
    included_boundaries: ['Offline evidence planning.'],
    excluded_boundaries: ['Production deployment.'],
    evidence_refs: [
      makeSliceEvidenceRef('slice_evidence_support_1', supportRef, 'support'),
      makeSliceEvidenceRef('slice_evidence_baseline_1', baselineRef, 'baseline'),
      makeSliceEvidenceRef('slice_evidence_challenge_1', challengeRef, 'challenge'),
    ],
    boundaries: [boundary],
    assumptions: [assumption],
    candidate_contribution_types: ['system'],
    preferred_contribution_type: 'system',
    expected_claim: 'The workflow improves trace completeness in offline replay.',
    fallback_claim: 'The workflow exposes trace gaps earlier than manual planning.',
    observable_success_criteria: ['Trace completeness exceeds baseline.'],
    resource_assumptions: ['Use the existing local corpus.'],
    data_assumptions: ['Replay traces are available.'],
    evaluation_path: 'Offline replay plus reviewer rubric scoring.',
    baseline_assumptions: ['Compare against manual spreadsheet planning.'],
    dependency_risks: ['Evidence freshness can drift.'],
    slice_budget: { person_weeks: 2 },
    accepted_risk_refs: [],
    memory_suggestion_refs: [ref('memory_suggestion', 'memory_1')],
    recheck_request_refs: [ref('recheck_request', 'recheck_1')],
    gap_codes: ['BASELINE_COVERAGE_GAP'],
    non_goals: ['production deployment'],
    claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
    topic_question_guardrails: ['Question must remain answerable by offline replay.'],
    value_assessment_inputs: ['Trace completeness', 'reviewer rubric score'],
    must_preserve_boundaries: ['Production deployment is out of scope.'],
    ...overrides,
  };
}

function makeQuestionContract(
  overrides: Partial<TopicSelectionTopicQuestionContractRecord> = {},
): TopicSelectionTopicQuestionContractRecord {
  return {
    topic_question_contract_id: CONTRACT_ID,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_id: QUESTION_ID,
    version: 'v1',
    answerability_plan_id: 'answerability_plan_1',
    source_research_slice_id: RESEARCH_SLICE_ID,
    source_research_slice_version: 'v1',
    source_candidate_id: 'topic_question_candidate_1',
    selection_decision_id: 'selection_decision_1',
    input_snapshot_ref: ref('input_snapshot', 't059_input_1'),
    contract_hash: 'contract_hash_1',
    main_question: 'Can a local-first assistant improve trace completeness for reviewer-aligned evidence planning?',
    question_type: 'system',
    contribution_hypothesis: 'system',
    target_setting: 'Offline paper-engineering workflows.',
    target_community: 'LLM systems researchers',
    expected_claim: 'The workflow improves trace completeness in offline replay.',
    fallback_claim: 'The workflow exposes trace gaps earlier than manual planning.',
    max_claim_strength: 'Reviewer-aligned planning feasibility in offline replay.',
    evaluation_route: 'Offline replay.',
    claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
    prohibited_claims: ['production deployment', 'production superiority'],
    required_evidence_categories: ['trace completeness', 'baseline comparison'],
    allowed_refinements: ['narrow venue class'],
    stop_reopen_conditions: ['baseline equals trace completeness'],
    accepted_risk_refs: [],
    risk_notes: [],
    status: 'active',
    created_by_workflow_run_id: 'workflow_t059',
    artifact_refs: [],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeAnswerabilityPlan(
  overrides: Partial<TopicSelectionTopicQuestionAnswerabilityPlanRecord> = {},
): TopicSelectionTopicQuestionAnswerabilityPlanRecord {
  return {
    topic_question_answerability_plan_id: 'answerability_plan_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_id: QUESTION_ID,
    topic_question_contract_id: CONTRACT_ID,
    answerability_verdict: 'answerable',
    datasets_or_resources: ['Local paper corpus', 'Replay traces'],
    metrics: ['trace completeness', 'rubric agreement'],
    baselines: ['manual spreadsheet planning'],
    ablations_or_comparisons: ['with and without boundary check'],
    evaluation_setting: 'Offline replay on historical planning traces.',
    dependency_risks: ['Corpus freshness can drift.'],
    open_dependencies: ['Freeze replay snapshot.'],
    known_gaps: ['Limited venue diversity.'],
    required_evidence_refs: [ref('evidence_unit', 'support_1')],
    created_at: NOW,
    ...overrides,
  };
}

function makeValueInput(
  overrides: Partial<TopicSelectionV1bValueAssessmentInput> = {},
): TopicSelectionV1bValueAssessmentInput {
  const questionContract = makeQuestionContract();
  const answerabilityPlan = makeAnswerabilityPlan();
  const needRef: TopicSelectionTopicQuestionNeedRefRecord = {
    topic_question_need_ref_id: 'question_need_ref_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_id: QUESTION_ID,
    topic_question_contract_id: CONTRACT_ID,
    validated_need_ref: ref('validated_need', 'validated_need_1'),
    source_need_candidate_ref: ref('need_candidate', 'need_candidate_1'),
    role: 'primary',
    inherited_from_research_slice_id: RESEARCH_SLICE_ID,
    coverage_note: 'Primary need inherited from v1a.',
    created_at: NOW,
  };
  const evidenceRef: TopicSelectionTopicQuestionEvidenceRefRecord = {
    topic_question_evidence_ref_id: 'question_evidence_ref_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_id: QUESTION_ID,
    topic_question_contract_id: CONTRACT_ID,
    evidence_ref: ref('evidence_unit', 'support_1'),
    evidence_role: 'support',
    mapped_question_part: 'trace completeness',
    rationale: 'Supports trace completeness value.',
    source_locator_snapshot: {},
    created_at: NOW,
  };
  const boundaryRef: TopicSelectionTopicQuestionBoundaryRefRecord = {
    topic_question_boundary_ref_id: 'question_boundary_ref_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_id: QUESTION_ID,
    topic_question_contract_id: CONTRACT_ID,
    research_slice_boundary_id: 'boundary_exclude_1',
    boundary_kind: 'excluded',
    question_part: 'production deployment',
    note: 'Preserve excluded deployment boundary.',
    created_at: NOW,
  };
  const assumptionRef: TopicSelectionTopicQuestionAssumptionRefRecord = {
    topic_question_assumption_ref_id: 'question_assumption_ref_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_id: QUESTION_ID,
    topic_question_contract_id: CONTRACT_ID,
    assumption_type: 'resource',
    statement: 'Replay traces are available.',
    source_assumption_id: 'slice_assumption_1',
    evidence_refs: [ref('evidence_unit', 'support_1')],
    risk_level: 'medium',
    status: 'open',
    created_at: NOW,
  };
  const falsificationCondition: TopicSelectionTopicQuestionFalsificationConditionRecord = {
    topic_question_falsification_condition_id: 'falsification_1',
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    topic_question_contract_id: CONTRACT_ID,
    condition_type: 'solved_by_baseline',
    severity: 'hard',
    statement: 'Manual baseline matches trace completeness.',
    trigger_evidence_refs: [ref('evidence_unit', 'baseline_1')],
    trigger_source_refs: [ref('evidence_unit', 'challenge_1')],
    related_contract_fields: ['expected_claim'],
    expected_action: 'lower_claim_strength',
    check_timing: 'during_value_assessment',
    confidence: 'medium',
    status: 'active',
    created_at: NOW,
  };
  return {
    topic_question_ref: ref('topic_question', QUESTION_ID, 'v1'),
    topic_question_contract_ref: ref('topic_question_contract', CONTRACT_ID, 'v1'),
    answerability_plan_ref: ref('topic_question_answerability_plan', 'answerability_plan_1'),
    research_slice_ref: ref('research_slice', RESEARCH_SLICE_ID, 'v1'),
    selection_decision_ref: ref('topic_question_selection_decision', 'selection_decision_1'),
    candidate_set_ref: ref('topic_question_candidate_set', 'candidate_set_1'),
    source_candidate_ref: ref('topic_question_candidate', 'topic_question_candidate_1'),
    validated_need_refs: [ref('validated_need', 'validated_need_1')],
    evidence_refs: [evidenceRef],
    need_refs: [needRef],
    boundary_refs: [boundaryRef],
    assumption_refs: [assumptionRef],
    falsification_conditions: [falsificationCondition],
    accepted_risk_refs: [],
    memory_suggestion_refs: [ref('memory_suggestion', 'memory_1')],
    recheck_request_refs: [ref('recheck_request', 'recheck_1')],
    question_contract: questionContract,
    answerability_plan: answerabilityPlan,
    ...overrides,
  };
}

function makeGate(
  gateKey: TopicSelectionAssessTopicValueLlmOutput['hard_gates'][number]['gate_key'],
  overrides: Partial<TopicSelectionAssessTopicValueLlmOutput['hard_gates'][number]> = {},
) {
  return {
    gate_key: gateKey,
    verdict: 'pass' as const,
    severity: 'info' as const,
    overridable_with_risk: false,
    rationale: `${gateKey} passed.`,
    refs: [ref('topic_question_contract', CONTRACT_ID, 'v1')],
    ...overrides,
  };
}

function makeDimension(
  dimensionKey: TopicSelectionAssessTopicValueLlmOutput['dimension_scores'][number]['dimension_key'],
  overrides: Partial<TopicSelectionAssessTopicValueLlmOutput['dimension_scores'][number]> = {},
) {
  return {
    dimension_key: dimensionKey,
    score: 82,
    rationale: `${dimensionKey} rationale.`,
    evidence_refs: [ref('evidence_unit', 'support_1')],
    uncertainty: 'Moderate sample-size uncertainty.',
    ...overrides,
  };
}

function makeLlmOutput(
  overrides: Partial<TopicSelectionAssessTopicValueLlmOutput> = {},
): TopicSelectionAssessTopicValueLlmOutput {
  const output: TopicSelectionAssessTopicValueLlmOutput = {
    readiness_status: 'ready',
    strongest_claim_if_success: 'The workflow improves trace completeness in offline replay.',
    fallback_claim_if_success: 'The workflow exposes trace gaps earlier than manual planning.',
    hard_gates: [
      makeGate('value_signal'),
      makeGate('non_solved_sanity'),
      makeGate('answerability_sanity'),
      makeGate('feasibility_sanity'),
      makeGate('evidence_sanity'),
      makeGate('claim_ceiling_fit'),
    ],
    dimension_scores: [
      makeDimension('significance'),
      makeDimension('originality'),
      makeDimension('answerability'),
      makeDimension('feasibility'),
      makeDimension('claim_ceiling_fit'),
      makeDimension('reviewer_risk'),
      makeDimension('effort_to_value_fit'),
      makeDimension('strategic_fit'),
      makeDimension('negative_memory_check'),
    ],
    risk_penalty: { freshness: 4 },
    reviewer_objections: ['Replay traces may be too narrow.'],
    ceiling_case: 'Reviewer-aligned planning feasibility in offline replay.',
    base_case: 'Trace completeness improves over manual planning.',
    floor_case: 'Trace boundary gaps are surfaced earlier.',
    recommended_disposition: 'advance_to_package',
    total_score: 84,
    value_summary: 'Strong bounded value for offline reviewer-aligned evidence planning.',
    confidence: 0.82,
    accepted_risk_refs: [],
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
      cited_refs: [ref('evidence_unit', 'support_1')],
    },
  };
  return {
    ...output,
    ...overrides,
    reasoning_memo: {
      ...output.reasoning_memo,
      ...(overrides.reasoning_memo ?? {}),
    },
  };
}

function makeNeedsRefinementOutput(): TopicSelectionAssessTopicValueLlmOutput {
  const blockerRef = ref('evidence_unit', 'baseline_1');
  return makeLlmOutput({
    readiness_status: 'needs_refinement',
    hard_gates: [
      makeGate('value_signal'),
      makeGate('non_solved_sanity'),
      makeGate('answerability_sanity'),
      makeGate('feasibility_sanity'),
      makeGate('evidence_sanity', {
        verdict: 'fail',
        severity: 'blocking',
        rationale: 'Baseline evidence must be repaired before package drafting.',
        refs: [blockerRef],
      }),
      makeGate('claim_ceiling_fit'),
    ],
    dimension_scores: [
      makeDimension('significance'),
      makeDimension('originality'),
      makeDimension('answerability', {
        score: 58,
        uncertainty: 'Baseline evidence is not sufficient for the proposed claim.',
      }),
      makeDimension('feasibility'),
      makeDimension('claim_ceiling_fit'),
      makeDimension('reviewer_risk', {
        score: 54,
        uncertainty: 'Reviewer risk remains high until the slice is narrowed.',
      }),
      makeDimension('effort_to_value_fit'),
      makeDimension('strategic_fit'),
      makeDimension('negative_memory_check'),
    ],
    recommended_disposition: 'refine_slice',
    total_score: 62,
    blocker_refs: [blockerRef],
    reasoning_memo: {
      ...makeLlmOutput().reasoning_memo,
      recommendation: 'refine_slice',
      evidence_backed_rationale: 'The baseline evidence ref shows the slice cannot support package drafting yet.',
      uncertainty: 'The current slice may be too broad for the available baseline evidence.',
      disposition_bridge: 'Return to ResearchSlice refinement before producing package input.',
      cited_refs: [blockerRef],
    },
  });
}

function makeSubject(options: {
  output?: TopicSelectionAssessTopicValueLlmOutput | Error;
  valueInput?: TopicSelectionV1bValueAssessmentInput;
  formationInput?: TopicSelectionV1bTopicQuestionFormationInput;
} = {}) {
  const repository = new InMemoryTopicSelectionV1bValueAssessmentRepository();
  const controlPlane = new TopicSelectionControlPlaneService(
    new InMemoryTopicSelectionControlPlaneRepository(),
    { idFactory: makeIdFactory(), now: () => NOW },
  );
  const llmGateway = new StubLlmGateway(options.output ?? makeLlmOutput());
  const service = new TopicSelectionV1bValueAssessmentService({
    repository,
    topicQuestionService: new StubQuestionInputProvider(options.valueInput ?? makeValueInput()),
    researchSliceService: new StubResearchSliceProvider(options.formationInput ?? makeFormationInput()),
    controlPlaneService: controlPlane,
    llmGateway,
    idFactory: makeIdFactory(),
    now: () => NOW,
  });
  return { service, repository, llmGateway };
}

async function assessReadySubject() {
  const subject = makeSubject();
  const result = await subject.service.assessTopicValue({
    topic_question_contract_id: CONTRACT_ID,
  });
  return { ...subject, assessment: result.topic_value_assessment, memo: result.value_reasoning_memo };
}

test('valid assessment creates TopicValueAssessment and ValueReasoningMemo only', async () => {
  const { service, llmGateway } = makeSubject();
  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  assert.equal(result.topic_value_assessment.topic_question_contract_id, CONTRACT_ID);
  assert.equal(result.value_reasoning_memo.topic_value_assessment_id, result.topic_value_assessment.topic_value_assessment_id);
  assert.equal(result.topic_value_assessment.active_disposition_decision_id, null);
  assert.equal(result.assess_topic_value_run.status, 'succeeded');
  assert.equal(llmGateway.calls.length, 1);
});

test('prompt directs value assessment to cite nested evidence_ref values, not wrapper refs', async () => {
  const { service, llmGateway } = makeSubject();
  await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  const systemMessage = llmGateway.calls[0]?.messages.find((message) => message.role === 'system')?.content ?? '';
  const userPayload = JSON.parse(llmGateway.calls[0]?.messages.find((message) => message.role === 'user')?.content ?? '{}') as {
    allowed_functional_refs_json?: { evidence_refs?: TopicSelectionFunctionalRef[] };
  };
  assert.match(systemMessage, /nested evidence_ref functional refs/);
  assert.match(systemMessage, /allowed_functional_refs_json as the complete copy list/);
  assert.match(systemMessage, /topic_question_evidence_ref_id/);
  assert.match(systemMessage, /research_slice_evidence_ref_id/);
  assert.match(systemMessage, /do not output ref_type topic_question_evidence_ref or research_slice_evidence_ref/i);
  assert.match(systemMessage, /Never invent placeholder refs or synthetic evidence_unit ids/);
  assert.match(systemMessage, /accepted_risk_refs must contain only inherited ref_type accepted_risk/);
  assert.match(systemMessage, /Assess package-drafting readiness, not promotion readiness/);
  assert.match(systemMessage, /Return exactly 6 hard_gates/);
  assert.match(systemMessage, new RegExp(TOPIC_SELECTION_VALUE_GATE_KEYS.join(', ')));
  assert.match(systemMessage, /Return exactly 9 dimension_scores/);
  assert.match(systemMessage, new RegExp(TOPIC_SELECTION_VALUE_DIMENSIONS.join(', ')));
  assert.ok(userPayload.allowed_functional_refs_json?.evidence_refs?.some((item) => item.ref_id === 'support_1'));
});

test('value assessment normalizes known evidence wrapper refs before hard-gate validation', async () => {
  const output = makeLlmOutput();
  output.dimension_scores = output.dimension_scores.map((score, index) =>
    index === 0
      ? {
        ...score,
        evidence_refs: [ref('research_slice_evidence_ref', 'slice_evidence_support_1')],
      }
      : score,
  );
  output.reasoning_memo = {
    ...output.reasoning_memo,
    cited_refs: [ref('topic_question_evidence_ref', 'question_evidence_ref_1')],
  };
  const { service } = makeSubject({ output });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  assert.deepEqual(
    result.topic_value_assessment.dimension_scores[0]?.evidence_refs,
    [ref('evidence_unit', 'support_1')],
  );
  assert.deepEqual(result.value_reasoning_memo.cited_refs, [ref('evidence_unit', 'support_1')]);
});

test('value assessment normalizes research_slice_ref wrapper back to inherited research_slice ref', async () => {
  const output = makeLlmOutput();
  output.hard_gates = output.hard_gates.map((gate, index) =>
    index === 0
      ? {
        ...gate,
        refs: [ref('research_slice_ref', RESEARCH_SLICE_ID, 'v_untrusted_model_alias')],
      }
      : gate,
  );
  output.reasoning_memo = {
    ...output.reasoning_memo,
    cited_refs: [ref('research_slice_ref', RESEARCH_SLICE_ID, 'v_untrusted_model_alias')],
  };
  const { service } = makeSubject({ output });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  assert.deepEqual(
    result.topic_value_assessment.hard_gates[0]?.refs,
    [ref('research_slice', RESEARCH_SLICE_ID, 'v1')],
  );
  assert.deepEqual(result.value_reasoning_memo.cited_refs, [ref('research_slice', RESEARCH_SLICE_ID, 'v1')]);
});

test('value assessment drops evidence refs mistakenly returned as accepted risk refs', async () => {
  const { service } = makeSubject({
    output: makeLlmOutput({
      accepted_risk_refs: [ref('evidence_unit', 'support_1')],
    }),
  });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  assert.deepEqual(result.topic_value_assessment.accepted_risk_refs, []);
  assert.deepEqual(result.assess_topic_value_run.accepted_risk_refs, []);
});

test('LLM failure records failed run and no assessment', async () => {
  const { service, repository } = makeSubject({
    output: new LlmGatewayError('UpstreamError', 'model failed'),
  });
  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && error.details?.assess_topic_value_run_id === 'assess_topic_value_run_1',
  );

  const run = await repository.findAssessmentRunById('assess_topic_value_run_1');
  assert.equal(run?.status, 'failed');
  assert.equal(run?.topic_value_assessment_id, null);
  assert.equal(await repository.findAssessmentById('topic_value_assessment_1'), null);
});

test('invalid LLM output blocks persistence', async () => {
  const { service, repository } = makeSubject({
    output: makeLlmOutput({ dimension_scores: [makeDimension('significance')] }),
  });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
  const run = await repository.findAssessmentRunById('assess_topic_value_run_1');
  assert.equal(run?.status, 'failed');
  assert.equal(await repository.findAssessmentById('topic_value_assessment_1'), null);
});

test('unknown evidence refs are dropped before value assessment persistence', async () => {
  const output = makeLlmOutput({
    dimension_scores: [
      makeDimension('significance', { evidence_refs: [ref('evidence_unit', 'unknown_evidence')] }),
      makeDimension('originality'),
      makeDimension('answerability'),
      makeDimension('feasibility'),
      makeDimension('claim_ceiling_fit'),
      makeDimension('reviewer_risk'),
      makeDimension('effort_to_value_fit'),
      makeDimension('strategic_fit'),
      makeDimension('negative_memory_check'),
    ],
  });
  const { service } = makeSubject({ output });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });
  const significance = result.topic_value_assessment.dimension_scores.find((score) =>
    score.dimension_key === 'significance');
  assert.deepEqual(significance?.evidence_refs, []);
});

test('new need ref blocks persistence', async () => {
  const { service } = makeSubject({
    output: makeLlmOutput({
      reasoning_memo: {
        ...makeLlmOutput().reasoning_memo,
        cited_refs: [ref('validated_need', 'validated_need_2')],
      },
    }),
  });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('prohibited claim and claim ceiling drift block persistence', async () => {
  const { service } = makeSubject({
    output: makeLlmOutput({
      strongest_claim_if_success: 'The workflow is ready for production deployment.',
    }),
  });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && /prohibited boundaries/.test(error.message),
  );
});

test('missing memo sections block persistence', async () => {
  const { service } = makeSubject({
    output: makeLlmOutput({
      reasoning_memo: {
        ...makeLlmOutput().reasoning_memo,
        value_thesis: '',
      },
    }),
  });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && /missing required narrative/.test(error.message),
  );
});

test('weak answerability cannot pass ready assessment', async () => {
  const valueInput = makeValueInput({
    answerability_plan: makeAnswerabilityPlan({ answerability_verdict: 'not_answerable' }),
  });
  const { service } = makeSubject({ valueInput });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && /Weak answerability/.test(error.message),
  );
});

test('ready assessment requires consistent advance disposition and sufficient score', async () => {
  await assert.rejects(
    () => makeSubject({
      output: makeLlmOutput({
        recommended_disposition: 'refine_question',
        reasoning_memo: {
          ...makeLlmOutput().reasoning_memo,
          recommendation: 'refine_question',
        },
      }),
    }).service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && /must recommend advance_to_package/.test(error.message),
  );

  await assert.rejects(
    () => makeSubject({
      output: makeLlmOutput({
        total_score: 54,
      }),
    }).service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && /total_score >= 70/.test(error.message),
  );
});

test('ready assessment rejects weak dimension scores', async () => {
  const output = makeLlmOutput({
    dimension_scores: [
      makeDimension('significance'),
      makeDimension('originality'),
      makeDimension('answerability', { score: 42 }),
      makeDimension('feasibility'),
      makeDimension('claim_ceiling_fit'),
      makeDimension('reviewer_risk'),
      makeDimension('effort_to_value_fit'),
      makeDimension('strategic_fit'),
      makeDimension('negative_memory_check'),
    ],
  });
  const { service } = makeSubject({ output });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError
      && /weak dimension scores/.test(error.message)
      && Array.isArray(error.details?.weak_dimensions)
      && error.details.weak_dimensions.includes('answerability'),
  );
});

test('non-ready assessment cannot recommend advance_to_package', async () => {
  const { service } = makeSubject({
    output: makeLlmOutput({
      readiness_status: 'needs_refinement',
      recommended_disposition: 'advance_to_package',
    }),
  });

  await assert.rejects(
    () => service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID }),
    (error) => error instanceof AppError && /advance_to_package requires a ready/.test(error.message),
  );
});

test('accepted risks are preserved', async () => {
  const riskRef = ref('accepted_risk', 'risk_1');
  const contract = makeQuestionContract({ accepted_risk_refs: [riskRef] });
  const valueInput = makeValueInput({
    accepted_risk_refs: [riskRef],
    question_contract: contract,
  });
  const { service } = makeSubject({
    valueInput,
    output: makeLlmOutput({
      readiness_status: 'ready_with_accepted_risk',
      accepted_risk_refs: [riskRef],
    }),
  });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });
  assert.deepEqual(result.topic_value_assessment.accepted_risk_refs, [riskRef]);
});

test('ready_with_accepted_risk inherits accepted risk refs when LLM omits them', async () => {
  const riskRef = ref('accepted_risk', 'risk_1');
  const contract = makeQuestionContract({ accepted_risk_refs: [riskRef] });
  const valueInput = makeValueInput({
    accepted_risk_refs: [riskRef],
    question_contract: contract,
  });
  const { service } = makeSubject({
    valueInput,
    output: makeLlmOutput({
      readiness_status: 'ready_with_accepted_risk',
      accepted_risk_refs: [],
    }),
  });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });
  assert.deepEqual(result.topic_value_assessment.accepted_risk_refs, [riskRef]);
  assert.deepEqual(result.assess_topic_value_run.accepted_risk_refs, [riskRef]);
});

test('ready_with_accepted_risk without inherited accepted risks normalizes to ready', async () => {
  const { service } = makeSubject({
    output: makeLlmOutput({
      readiness_status: 'ready_with_accepted_risk',
      accepted_risk_refs: [],
    }),
  });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });
  assert.equal(result.topic_value_assessment.readiness_status, 'ready');
  assert.deepEqual(result.topic_value_assessment.accepted_risk_refs, []);
});

test('slice-side inherited refs are accepted and preserved', async () => {
  const riskRef = ref('accepted_risk', 'slice_risk_1');
  const memoryRef = ref('memory_suggestion', 'slice_memory_1');
  const recheckRef = ref('recheck_request', 'slice_recheck_1');
  const formationInput = makeFormationInput({
    accepted_risk_refs: [riskRef],
    memory_suggestion_refs: [memoryRef],
    recheck_request_refs: [recheckRef],
  });
  const { service } = makeSubject({
    formationInput,
    output: makeLlmOutput({
      readiness_status: 'ready_with_accepted_risk',
      accepted_risk_refs: [riskRef],
      reasoning_memo: {
        ...makeLlmOutput().reasoning_memo,
        cited_refs: [riskRef],
      },
    }),
  });

  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  assert.deepEqual(result.topic_value_assessment.accepted_risk_refs, [riskRef]);
  assert.deepEqual(result.topic_value_input_snapshot.accepted_risk_refs, [riskRef]);
  assert.deepEqual(result.topic_value_input_snapshot.memory_suggestion_refs, [
    ref('memory_suggestion', 'memory_1'),
    memoryRef,
  ]);
  assert.deepEqual(result.topic_value_input_snapshot.recheck_request_refs, [
    ref('recheck_request', 'recheck_1'),
    recheckRef,
  ]);
});

test('advance_to_package creates package draft input but no package id', async () => {
  const { service, assessment } = await assessReadySubject();

  const decision = await service.decideValueDisposition({
    topic_value_assessment_id: assessment.topic_value_assessment_id,
    decision: 'advance_to_package',
    decision_rationale: 'Value gates passed.',
  });
  const packageInput = await service.buildPackageDraftInput({
    value_disposition_decision_id: decision.value_disposition_decision_id,
  });

  assert.equal(assessment.legacy_verdict, 'refine');
  assert.equal(decision.output_topic_package_id, null);
  assert.ok(decision.package_draft_input);
  assert.equal(packageInput.value_disposition_decision_ref.ref_id, decision.value_disposition_decision_id);
  assert.equal(packageInput.research_slice_snapshot.research_slice_id, RESEARCH_SLICE_ID);
  assert.equal(packageInput.research_slice_snapshot.title_card_id, TITLE_CARD_ID);
  assert.equal(packageInput.research_slice_snapshot.slice_version, 'v1');
});

test('disposition rejects new refs, missing actions, and unknown loopback targets', async () => {
  const { service, assessment } = await assessReadySubject();

  await assert.rejects(
    () => service.decideValueDisposition({
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      decision: 'advance_to_package',
      decision_rationale: 'Try to accept an untracked risk.',
      accepted_risk_refs: [ref('accepted_risk', 'new_risk')],
    }),
    (error) => error instanceof AppError && /unknown accepted risk refs/.test(error.message),
  );
  await assert.rejects(
    () => service.decideValueDisposition({
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      decision: 'park',
      decision_rationale: 'Park without actions.',
    }),
    (error) => error instanceof AppError && /required_actions/.test(error.message),
  );
  await assert.rejects(
    () => service.decideValueDisposition({
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      decision: 'refine_question',
      decision_rationale: 'Refine through an unknown target.',
      required_actions: ['narrow the question'],
      loopback_target_ref: ref('topic_question_contract', 'unknown_contract', 'v1'),
    }),
    (error) => error instanceof AppError && /unknown loopback target ref/.test(error.message),
  );
});

test('loopback dispositions target upstream authorities and create no package handoff', async () => {
  const cases = [
    {
      disposition: 'refine_question',
      targetRef: ref('topic_question_contract', CONTRACT_ID, 'v1'),
    },
    {
      disposition: 'refine_slice',
      targetRef: ref('research_slice', RESEARCH_SLICE_ID, 'v1'),
    },
    {
      disposition: 'recheck_evidence_or_search',
      targetRef: ref('recheck_request', 'recheck_1'),
    },
  ] satisfies Array<{ disposition: TopicSelectionValueDisposition; targetRef: TopicSelectionFunctionalRef }>;

  for (const { disposition, targetRef } of cases) {
    const { service, assessment } = await assessReadySubject();
    const decision = await service.decideValueDisposition({
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      decision: disposition,
      decision_rationale: `Use ${disposition}.`,
      required_actions: ['record loopback'],
    });

    assert.deepEqual(decision.loopback_target_ref, targetRef);
    assert.equal(decision.package_draft_input, null);
    assert.equal(decision.output_topic_package_id, null);
    await assert.rejects(
      () => service.buildPackageDraftInput({
        value_disposition_decision_id: decision.value_disposition_decision_id,
      }),
      (error) => error instanceof AppError && /advance_to_package/.test(error.message),
    );
  }
});

test('recheck loopback defaults to a pending target when no recheck request exists', async () => {
  const { service } = makeSubject({
    valueInput: makeValueInput({ recheck_request_refs: [] }),
    formationInput: makeFormationInput({ recheck_request_refs: [] }),
  });
  const result = await service.assessTopicValue({
    topic_question_contract_id: CONTRACT_ID,
  });
  const decision = await service.decideValueDisposition({
    topic_value_assessment_id: result.topic_value_assessment.topic_value_assessment_id,
    decision: 'recheck_evidence_or_search',
    decision_rationale: 'Search evidence again before package drafting.',
    required_actions: ['open a recheck request for baseline freshness'],
  });

  assert.deepEqual(decision.loopback_target_ref, ref('recheck_request', 'pending'));
  assert.equal(decision.package_draft_input, null);
  assert.equal(decision.output_topic_package_id, null);
});

test('park and drop create no package handoff and no loopback target', async () => {
  for (const disposition of ['park', 'drop'] satisfies TopicSelectionValueDisposition[]) {
    const { service, assessment } = await assessReadySubject();
    const decision = await service.decideValueDisposition({
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      decision: disposition,
      decision_rationale: `Use ${disposition}.`,
      required_actions: ['record disposition rationale'],
    });

    assert.equal(decision.loopback_target_ref, null);
    assert.equal(decision.package_draft_input, null);
    assert.equal(decision.output_topic_package_id, null);
  }
});

test('needs_refinement assessment returns to loopback and rejects forced package advancement', async () => {
  const { service } = makeSubject({ output: makeNeedsRefinementOutput() });
  const result = await service.assessTopicValue({
    topic_question_contract_id: CONTRACT_ID,
  });
  const assessment = result.topic_value_assessment;

  assert.equal(assessment.readiness_status, 'needs_refinement');
  assert.equal(assessment.legacy_verdict, 'refine');

  await assert.rejects(
    () => service.decideValueDisposition({
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      decision: 'advance_to_package',
      decision_rationale: 'Force package drafting despite refinement status.',
    }),
    (error) => error instanceof AppError && /requires ready value assessment/.test(error.message),
  );

  const loopback = await service.decideValueDisposition({
    topic_value_assessment_id: assessment.topic_value_assessment_id,
    decision: 'refine_slice',
    decision_rationale: 'Baseline evidence is insufficient for package drafting.',
    required_actions: ['narrow the research slice and refresh baseline evidence'],
  });

  assert.deepEqual(loopback.loopback_target_ref, ref('research_slice', RESEARCH_SLICE_ID, 'v1'));
  assert.equal(loopback.package_draft_input, null);
  assert.equal(loopback.output_topic_package_id, null);
  await assert.rejects(
    () => service.buildPackageDraftInput({
      value_disposition_decision_id: loopback.value_disposition_decision_id,
    }),
    (error) => error instanceof AppError && /advance_to_package/.test(error.message),
  );
});

test('buildPackageDraftInput rejects superseded loopback history and non-advance decisions', async () => {
  const { service, repository, assessment } = await assessReadySubject();
  const advance = await service.decideValueDisposition({
    topic_value_assessment_id: assessment.topic_value_assessment_id,
    decision: 'advance_to_package',
    decision_rationale: 'Advance first.',
  });
  const refineSlice = await service.decideValueDisposition({
    topic_value_assessment_id: assessment.topic_value_assessment_id,
    decision: 'refine_slice',
    decision_rationale: 'Supersede advance after a quality review.',
    required_actions: ['narrow the slice before package drafting'],
  });

  const storedAdvance = await repository.findDispositionDecisionById(advance.value_disposition_decision_id);
  const storedRefineSlice = await repository.findDispositionDecisionById(refineSlice.value_disposition_decision_id);
  const storedAssessment = await repository.findAssessmentById(assessment.topic_value_assessment_id);
  assert.equal(storedAdvance?.status, 'superseded');
  assert.equal(storedAdvance?.is_current, false);
  assert.equal(storedRefineSlice?.status, 'active');
  assert.equal(storedRefineSlice?.is_current, true);
  assert.equal(storedAssessment?.active_disposition_decision_id, refineSlice.value_disposition_decision_id);

  await assert.rejects(
    () => service.buildPackageDraftInput({
      value_disposition_decision_id: advance.value_disposition_decision_id,
    }),
    (error) => error instanceof AppError && /active\/current/.test(error.message),
  );
  await assert.rejects(
    () => service.buildPackageDraftInput({
      value_disposition_decision_id: refineSlice.value_disposition_decision_id,
    }),
    (error) => error instanceof AppError && /advance_to_package/.test(error.message),
  );
});

test('critic trigger is recorded without running a second critic workflow', async () => {
  const output = makeLlmOutput({
    reasoning_memo: {
      ...makeLlmOutput().reasoning_memo,
      requires_critic_review: true,
      critic_triggers: ['high_reviewer_risk'],
    },
  });
  const { service, llmGateway } = makeSubject({ output });
  const result = await service.assessTopicValue({ topic_question_contract_id: CONTRACT_ID });

  assert.equal(result.value_reasoning_memo.requires_critic_review, true);
  assert.deepEqual(result.value_reasoning_memo.critic_triggers, ['high_reviewer_risk']);
  assert.equal(llmGateway.calls.length, 1);
});

test('Prisma migration prevents dual-current value disposition decisions', async () => {
  const migration = await fs.readFile(
    new URL('../../../../prisma/migrations/20260514170000_add_topic_selection_v1b_value_assessment/migration.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /CREATE UNIQUE INDEX "TSValueDisposition_current_assessment_uidx"/);
  assert.match(migration, /WHERE "isCurrent" = true/);
});
