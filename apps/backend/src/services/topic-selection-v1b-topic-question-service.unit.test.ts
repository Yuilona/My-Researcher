import assert from 'node:assert/strict';
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
  TopicSelectionFormTopicQuestionLlmOutput,
  TopicSelectionTopicQuestionAnswerabilityPlanDraft,
  TopicSelectionTopicQuestionCandidateDraft,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';

import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionV1bTopicQuestionRepository } from '../repositories/in-memory-topic-selection-v1b-topic-question-repository.js';
import {
  LlmGatewayError,
  type LlmCallTelemetry,
  type LlmStructuredOutputRequest,
} from './llm-gateway.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TopicSelectionV1bTopicQuestionService,
  type TopicSelectionV1bTopicQuestionFormationInputProvider,
  type TopicSelectionV1bTopicQuestionLlmGateway,
} from './topic-selection-v1b-topic-question-service.js';

const NOW = '2026-05-14T00:00:00.000Z';
const TITLE_CARD_ID = 'title_card_t059';
const RESEARCH_SLICE_ID = 'research_slice_1';

function ref(
  refType: string,
  refId: string,
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: TITLE_CARD_ID,
    version_id: versionId,
  };
}

function makeEvidenceRef(
  id: string,
  evidenceRef: TopicSelectionFunctionalRef,
  evidenceRole: TopicSelectionResearchSliceEvidenceRefRecord['evidence_role'],
): TopicSelectionResearchSliceEvidenceRefRecord {
  return {
    research_slice_evidence_ref_id: id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    research_slice_id: RESEARCH_SLICE_ID,
    evidence_ref: evidenceRef,
    evidence_role: evidenceRole,
    rationale: `${evidenceRole} evidence`,
    evidence_strength_snapshot: {},
    source_locator_snapshot: {},
    created_at: NOW,
  };
}

function makeBoundary(
  id: string,
  boundaryKind: TopicSelectionResearchSliceBoundaryRecord['boundary_kind'],
): TopicSelectionResearchSliceBoundaryRecord {
  return {
    research_slice_boundary_id: id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    research_slice_id: RESEARCH_SLICE_ID,
    boundary_kind: boundaryKind,
    boundary_type: 'scope',
    statement: boundaryKind === 'included'
      ? 'Offline reviewer-aligned evidence planning is in scope.'
      : 'Production deployment and broad superiority claims are out of scope.',
    reason: 'Selected ResearchSlice boundary.',
    evidence_refs: [ref('evidence_unit', 'support_1')],
    created_at: NOW,
  };
}

function makeAssumption(id: string): TopicSelectionResearchSliceAssumptionRecord {
  return {
    research_slice_assumption_id: id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    research_slice_id: RESEARCH_SLICE_ID,
    assumption_type: 'resource',
    statement: 'Offline replay traces are available.',
    status: 'open',
    evidence_refs: [ref('evidence_unit', 'context_1')],
    risk_level: 'medium',
    created_at: NOW,
  };
}

function makeFormationInput(
  overrides: Partial<TopicSelectionV1bTopicQuestionFormationInput> = {},
): TopicSelectionV1bTopicQuestionFormationInput {
  const supportRef = ref('evidence_unit', 'support_1');
  const challengeRef = ref('evidence_unit', 'challenge_1');
  const baselineRef = ref('evidence_unit', 'baseline_1');
  const contextRef = ref('evidence_unit', 'context_1');
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
    slice_statement: 'Bound the work to offline reviewer-aligned evidence planning.',
    included_boundaries: ['Offline evidence planning.'],
    excluded_boundaries: ['Production deployment.'],
    evidence_refs: [
      makeEvidenceRef('slice_evidence_support_1', supportRef, 'support'),
      makeEvidenceRef('slice_evidence_challenge_1', challengeRef, 'challenge'),
      makeEvidenceRef('slice_evidence_baseline_1', baselineRef, 'baseline'),
      makeEvidenceRef('slice_evidence_context_1', contextRef, 'context'),
    ],
    boundaries: [
      makeBoundary('boundary_include_1', 'included'),
      makeBoundary('boundary_exclude_1', 'excluded'),
    ],
    assumptions: [makeAssumption('assumption_resource_1')],
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
    recheck_request_refs: [],
    gap_codes: ['BASELINE_COVERAGE_GAP'],
    non_goals: ['Do not target production deployment'],
    claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
    topic_question_guardrails: ['Question must remain answerable by offline replay.'],
    value_assessment_inputs: ['Trace completeness', 'reviewer rubric score'],
    must_preserve_boundaries: ['Offline evidence planning.', 'Production deployment is out of scope.'],
    ...overrides,
  };
}

function makeAnswerabilityPlan(
  overrides: Partial<TopicSelectionTopicQuestionAnswerabilityPlanDraft> = {},
): TopicSelectionTopicQuestionAnswerabilityPlanDraft {
  return {
    datasets_or_resources: ['Local paper corpus', 'Replay traces'],
    metrics: ['trace completeness', 'rubric agreement'],
    baselines: ['manual spreadsheet planning'],
    ablations_or_comparisons: ['with and without boundary check'],
    evaluation_setting: 'Offline replay on historical planning traces.',
    dependency_risks: ['Corpus freshness can drift.'],
    open_dependencies: ['Freeze replay snapshot.'],
    known_gaps: ['Limited venue diversity.'],
    required_evidence_refs: [ref('evidence_unit', 'support_1')],
    ...overrides,
  };
}

function makeCandidateDraft(
  key = 'question-a',
  overrides: Partial<TopicSelectionTopicQuestionCandidateDraft> = {},
): TopicSelectionTopicQuestionCandidateDraft {
  return {
    candidate_key: key,
    main_question: 'Can a local-first assistant improve trace completeness for reviewer-aligned evidence planning?',
    sub_questions: ['Which trace boundary failures are reduced?'],
    question_type: 'system',
    contribution_hypothesis: 'system',
    source_validated_need_refs: [ref('validated_need', 'validated_need_1')],
    answerability_plan: makeAnswerabilityPlan(),
    answerability_verdict: 'answerable',
    expected_claim: 'The workflow improves trace completeness in offline replay.',
    fallback_claim: 'The workflow exposes trace gaps earlier than manual planning.',
    max_claim_strength: 'Reviewer-aligned planning feasibility in offline replay.',
    observable_success_criteria: ['Trace completeness exceeds baseline.'],
    boundary_check: {
      preserved_boundary_refs: [ref('research_slice_boundary', 'boundary_include_1')],
      excluded_boundary_refs: [ref('research_slice_boundary', 'boundary_exclude_1')],
      boundary_violations: [],
      prohibited_claims: ['production deployment', 'production superiority'],
      allowed_refinements: ['narrow target venue class'],
    },
    traceability_check: {
      support_evidence_refs: [ref('evidence_unit', 'support_1')],
      challenge_evidence_refs: [ref('evidence_unit', 'challenge_1')],
      baseline_evidence_refs: [ref('evidence_unit', 'baseline_1')],
      context_evidence_refs: [ref('evidence_unit', 'context_1')],
      mapped_evidence_refs: [
        ref('evidence_unit', 'support_1'),
        ref('evidence_unit', 'baseline_1'),
      ],
      unmapped_assumptions: ['Replay snapshot availability remains unverified.'],
    },
    falsification_conditions: [
      {
        condition_type: 'solved_by_baseline',
        severity: 'hard',
        statement: 'Manual spreadsheet planning matches trace completeness.',
        trigger_evidence_refs: [ref('evidence_unit', 'baseline_1')],
        trigger_source_refs: [ref('evidence_unit', 'challenge_1')],
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
    ...overrides,
  };
}

function makeLlmOutput(
  formationInput = makeFormationInput(),
  candidates: TopicSelectionTopicQuestionCandidateDraft[] = [makeCandidateDraft()],
  overrides: Partial<TopicSelectionFormTopicQuestionLlmOutput> = {},
): TopicSelectionFormTopicQuestionLlmOutput {
  return {
    question_frame: {
      target_setting: 'Local-first research assistant.',
      target_community: formationInput.target_community,
      object_scope: 'Reviewer-aligned evidence planning workflow.',
      task_scope: 'Offline trace completeness evaluation.',
      intervention_or_approach: 'Local-first assistant workflow.',
      comparison_baseline: 'Manual spreadsheet planning.',
      observable_outcome: 'Trace completeness and rubric agreement.',
      assumption_refs: [ref('research_slice_assumption', 'assumption_resource_1')],
      evidence_refs: [ref('evidence_unit', 'support_1'), ref('evidence_unit', 'baseline_1')],
      frame_payload: { source: 'unit-test' },
    },
    recommended_candidate_keys: candidates[0] ? [candidates[0].candidate_key] : [],
    generation_notes: ['Unit-test candidate set.'],
    human_review_triggers: [],
    candidates,
    ...overrides,
  };
}

function telemetry(): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 'gpt-5.5',
    profile_id: 'topic-selection-topic-question-formation',
    prompt_template_id: 'topic-selection-topic-question-formation',
    prompt_template_version: '1',
    elapsed_ms: 10,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: 100,
    output_tokens: 80,
    embedding_input_tokens: null,
    total_tokens: 180,
    cost_usd: null,
  };
}

function makeContext(options: {
  formationInput?: TopicSelectionV1bTopicQuestionFormationInput;
  llmOutput?: TopicSelectionFormTopicQuestionLlmOutput;
  handoffError?: Error;
  llmError?: Error;
} = {}) {
  let sequence = 0;
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, {
    idFactory,
    now: () => NOW,
  });
  const repository = new InMemoryTopicSelectionV1bTopicQuestionRepository();
  const formationInput = options.formationInput ?? makeFormationInput();
  const handoffCalls: string[] = [];
  const researchSliceService: TopicSelectionV1bTopicQuestionFormationInputProvider = {
    async buildTopicQuestionFormationInput(input) {
      handoffCalls.push(input.research_slice_id);
      if (options.handoffError) {
        throw options.handoffError;
      }
      return formationInput;
    },
  };
  const llmCalls: LlmStructuredOutputRequest[] = [];
  const llmGateway: TopicSelectionV1bTopicQuestionLlmGateway = {
    async createStructuredOutput<T>(request: LlmStructuredOutputRequest) {
      llmCalls.push(request);
      if (options.llmError) {
        throw options.llmError;
      }
      return {
        parsed: (options.llmOutput ?? makeLlmOutput(formationInput)) as T,
        raw: { ok: true },
        telemetry: telemetry(),
      };
    },
  };
  const service = new TopicSelectionV1bTopicQuestionService({
    repository,
    researchSliceService,
    controlPlaneService: controlPlane,
    llmGateway,
    idFactory,
    now: () => NOW,
  });

  return {
    controlPlaneRepository,
    formationInput,
    handoffCalls,
    llmCalls,
    repository,
    service,
  };
}

async function formOnce(ctx: ReturnType<typeof makeContext>) {
  return ctx.service.formTopicQuestionCandidates({
    research_slice_id: ctx.formationInput.research_slice_ref.ref_id,
  });
}

test('T-057 handoff forms and persists trace-ready TopicQuestion candidates', async () => {
  const ctx = makeContext();

  const result = await formOnce(ctx);

  assert.equal(ctx.handoffCalls[0], RESEARCH_SLICE_ID);
  assert.equal(ctx.llmCalls.length, 1);
  assert.equal(result.form_topic_question_run.status, 'succeeded');
  assert.equal(result.candidate_set.status, 'ready_for_selection');
  assert.equal(result.candidate_set.candidate_count, 1);
  assert.equal(result.candidate_set.recommended_candidate_ids[0], result.candidates[0]!.topic_question_candidate_id);
  assert.equal(result.question_frame.frame_payload.inherited_claim_ceiling, ctx.formationInput.claim_ceiling);
  assert.equal(
    Array.isArray(result.question_frame.frame_payload.inherited_assumptions)
      ? result.question_frame.frame_payload.inherited_assumptions.length
      : 0,
    1,
  );
  assert.equal(result.candidates[0]!.source_validated_need_refs[0]!.ref_id, 'validated_need_1');
});

test('prompt directs topic-question formation to cite boundary ids, not research_slice_ref', async () => {
  const ctx = makeContext();

  await formOnce(ctx);

  const systemMessage = ctx.llmCalls[0]?.messages.find((message) => message.role === 'system')?.content ?? '';
  assert.match(systemMessage, /boundary_check\.preserved_boundary_refs/);
  assert.match(systemMessage, /research_slice_boundary/);
  assert.match(systemMessage, /never cite the research_slice_ref as a boundary/);
  assert.match(systemMessage, /For assumption_refs/);
  assert.match(systemMessage, /never cite the research_slice_ref as an assumption/);
  assert.match(systemMessage, /do not cite research_slice_boundary or research_slice_assumption refs as evidence/);
  assert.match(systemMessage, /Use blockers only for hard answerability failures or boundary violations/);
});

test('known research_slice boundary placeholders are normalized by boundary kind before validation', async () => {
  const candidate = makeCandidateDraft('question-a', {
    boundary_check: {
      ...makeCandidateDraft().boundary_check,
      preserved_boundary_refs: [ref('research_slice_boundary', RESEARCH_SLICE_ID)],
      excluded_boundary_refs: [ref('research_slice', RESEARCH_SLICE_ID, 'v1')],
    },
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  const result = await formOnce(ctx);

  assert.deepEqual(
    result.candidates[0]!.boundary_check_payload.preserved_boundary_refs,
    [ref('research_slice_boundary', 'boundary_include_1')],
  );
  assert.deepEqual(
    result.candidates[0]!.boundary_check_payload.excluded_boundary_refs,
    [ref('research_slice_boundary', 'boundary_exclude_1')],
  );
});

test('extra unknown boundary refs are dropped when canonical boundary refs remain', async () => {
  const candidate = makeCandidateDraft('question-a', {
    boundary_check: {
      ...makeCandidateDraft().boundary_check,
      preserved_boundary_refs: [
        ref('research_slice_boundary', 'boundary_include_1'),
      ],
      excluded_boundary_refs: [
        ref('research_slice_boundary', 'boundary_exclude_1'),
        ref('research_slice_boundary', 'research_slice_invented_boundary'),
      ],
    },
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  const result = await formOnce(ctx);

  assert.deepEqual(
    result.candidates[0]!.boundary_check_payload.excluded_boundary_refs,
    [ref('research_slice_boundary', 'boundary_exclude_1')],
  );
  assert.equal(result.candidates[0]!.human_review_triggers.includes('boundary_refs_normalized'), true);
});

test('known research_slice placeholders in assumption refs are normalized to inherited assumptions', async () => {
  const formationInput = makeFormationInput();
  const output = makeLlmOutput(formationInput);
  output.question_frame = {
    ...output.question_frame,
    assumption_refs: [ref('research_slice_assumption', RESEARCH_SLICE_ID)],
  };
  const ctx = makeContext({ formationInput, llmOutput: output });

  const result = await formOnce(ctx);

  assert.deepEqual(result.question_frame.assumption_refs, [
    ref('research_slice_assumption', 'assumption_resource_1'),
  ]);
});

test('assumption refs with dropped assumption prefix are normalized to inherited assumptions', async () => {
  const formationInput = makeFormationInput({
    assumptions: [makeAssumption('research_slice_assumption_852e0b42-5609-42c3-80c0-e1424aaad89d')],
  });
  const output = makeLlmOutput(formationInput);
  output.question_frame = {
    ...output.question_frame,
    assumption_refs: [ref('research_slice_assumption', 'research_slice_852e0b42-5609-42c3-80c0-e1424aaad89d')],
  };
  const ctx = makeContext({ formationInput, llmOutput: output });

  const result = await formOnce(ctx);

  assert.deepEqual(result.question_frame.assumption_refs, [
    ref('research_slice_assumption', 'research_slice_assumption_852e0b42-5609-42c3-80c0-e1424aaad89d'),
  ]);
});

test('known slice wrapper refs in evidence fields are normalized to inherited evidence refs', async () => {
  const formationInput = makeFormationInput();
  const candidate = makeCandidateDraft('question-a', {
    answerability_plan: makeAnswerabilityPlan({
      required_evidence_refs: [ref('research_slice_boundary', 'boundary_include_1')],
    }),
    traceability_check: {
      ...makeCandidateDraft().traceability_check,
      support_evidence_refs: [ref('research_slice_evidence_ref', 'slice_evidence_support_1')],
      mapped_evidence_refs: [ref('research_slice_assumption', 'assumption_resource_1')],
    },
    falsification_conditions: [
      {
        ...makeCandidateDraft().falsification_conditions[0]!,
        trigger_evidence_refs: [ref('research_slice_boundary', 'boundary_exclude_1')],
      },
    ],
  });
  const output = makeLlmOutput(formationInput, [candidate]);
  output.question_frame = {
    ...output.question_frame,
    evidence_refs: [ref('research_slice_assumption', 'assumption_resource_1')],
  };
  const ctx = makeContext({ formationInput, llmOutput: output });

  const result = await formOnce(ctx);

  assert.deepEqual(result.question_frame.evidence_refs, [ref('evidence_unit', 'context_1')]);
  assert.deepEqual(
    result.candidates[0]!.answerability_plan_payload.required_evidence_refs,
    [ref('evidence_unit', 'support_1')],
  );
  assert.deepEqual(
    result.candidates[0]!.traceability_check_payload.support_evidence_refs,
    [ref('evidence_unit', 'support_1')],
  );
  assert.deepEqual(
    result.candidates[0]!.traceability_check_payload.mapped_evidence_refs,
    [ref('evidence_unit', 'context_1')],
  );
  assert.deepEqual(
    result.candidates[0]!.falsification_conditions_payload[0]!.trigger_evidence_refs,
    [ref('evidence_unit', 'support_1')],
  );
});

test('known evidence refs with drifted title_card_id are normalized to inherited refs', async () => {
  const formationInput = makeFormationInput();
  const candidate = makeCandidateDraft('question-a', {
    traceability_check: {
      ...makeCandidateDraft().traceability_check,
      support_evidence_refs: [
        {
          ...ref('evidence_unit', 'support_1'),
          title_card_id: 'wrong_title_card',
        },
      ],
    },
  });
  const ctx = makeContext({ formationInput, llmOutput: makeLlmOutput(formationInput, [candidate]) });

  const result = await formOnce(ctx);

  assert.equal(result.form_topic_question_run.status, 'succeeded');
  assert.deepEqual(
    result.candidates[0]!.traceability_check_payload.support_evidence_refs,
    [ref('evidence_unit', 'support_1')],
  );
});

test('non-blocking blocker prose is demoted to risk notes before candidate status is computed', async () => {
  const candidate = makeCandidateDraft('question-a', {
    blockers: [
      'No blocker is explicit from the slice metadata, but sufficiency of comparative evidence remains an open risk.',
    ],
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  const result = await formOnce(ctx);

  assert.equal(result.candidates[0]!.status, 'recommended');
  assert.deepEqual(result.candidates[0]!.blockers, []);
  assert.ok(result.candidates[0]!.risk_notes.some((note) => /No blocker is explicit/.test(note)));
  assert.ok(result.candidates[0]!.human_review_triggers.includes('non_blocking_risk_note_demoted_from_blocker'));
});

test('mismatched T-057 handoff blocks before any LLM call', async () => {
  const ctx = makeContext({
    formationInput: makeFormationInput({
      research_slice_ref: ref('research_slice', 'different_slice', 'v1'),
    }),
  });

  await assert.rejects(
    () => ctx.service.formTopicQuestionCandidates({ research_slice_id: RESEARCH_SLICE_ID }),
    (error) => error instanceof AppError && /does not match/.test(error.message),
  );
  assert.equal(ctx.llmCalls.length, 0);
});

test('falsification source refs may cite inherited non-evidence slice refs', async () => {
  const candidate = makeCandidateDraft('question-a', {
    falsification_conditions: [
      {
        ...makeCandidateDraft().falsification_conditions[0]!,
        trigger_source_refs: [ref('research_slice_boundary', 'boundary_exclude_1')],
      },
    ],
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  const result = await formOnce(ctx);

  assert.equal(result.form_topic_question_run.status, 'succeeded');
  assert.equal(result.candidates[0]!.falsification_conditions_payload[0]!.trigger_source_refs[0]!.ref_type, 'research_slice_boundary');
});

test('falsification source refs normalize copied boundary ids with missing boundary prefix', async () => {
  const formationInput = makeFormationInput({
    boundaries: [
      makeBoundary('research_slice_boundary_real_boundary_1', 'excluded'),
    ],
  });
  const candidate = makeCandidateDraft('question-a', {
    boundary_check: {
      ...makeCandidateDraft().boundary_check,
      preserved_boundary_refs: [],
      excluded_boundary_refs: [ref('research_slice_boundary', 'research_slice_boundary_real_boundary_1')],
    },
    falsification_conditions: [
      {
        ...makeCandidateDraft().falsification_conditions[0]!,
        trigger_source_refs: [ref('research_slice_boundary', 'research_slice_real_boundary_1')],
      },
    ],
  });
  const ctx = makeContext({ formationInput, llmOutput: makeLlmOutput(formationInput, [candidate]) });

  const result = await formOnce(ctx);

  assert.equal(result.form_topic_question_run.status, 'succeeded');
  assert.deepEqual(
    result.candidates[0]!.falsification_conditions_payload[0]!.trigger_source_refs,
    [ref('research_slice_boundary', 'research_slice_boundary_real_boundary_1')],
  );
});

test('unknown falsification source refs are dropped without dropping evidence triggers', async () => {
  const candidate = makeCandidateDraft('question-a', {
    falsification_conditions: [
      {
        ...makeCandidateDraft().falsification_conditions[0]!,
        trigger_evidence_refs: [ref('evidence_unit', 'baseline_1')],
        trigger_source_refs: [ref('research_slice_assumption', 'research_slice_assumption_unknown')],
      },
    ],
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  const result = await formOnce(ctx);

  assert.deepEqual(result.candidates[0]!.falsification_conditions_payload[0]!.trigger_source_refs, []);
  assert.deepEqual(
    result.candidates[0]!.falsification_conditions_payload[0]!.trigger_evidence_refs,
    [ref('evidence_unit', 'baseline_1')],
  );
  assert.equal(result.candidates[0]!.human_review_triggers.includes('falsification_source_refs_normalized'), true);
});

test('LLM failure records a failed formation run and creates no candidate set', async () => {
  const ctx = makeContext({
    llmError: new LlmGatewayError('UpstreamError', 'LLM unavailable.', {
      telemetry: telemetry(),
    }),
  });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError
      && error.details?.form_topic_question_run_id === 'form_topic_question_run_1',
  );
  const failedRun = await ctx.repository.findFormationRunById('form_topic_question_run_1');
  assert.equal(failedRun?.status, 'failed');
  assert.equal(await ctx.repository.findCandidateSetById('topic_question_candidate_set_3'), null);
});

test('unknown evidence refs block candidate persistence', async () => {
  const candidate = makeCandidateDraft('question-a', {
    traceability_check: {
      ...makeCandidateDraft().traceability_check,
      support_evidence_refs: [ref('evidence_unit', 'unknown_evidence')],
    },
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
  assert.equal((await ctx.repository.findFormationRunById('form_topic_question_run_1'))?.status, 'failed');
});

test('drifted evidence ref type blocks candidate persistence even when the id matches', async () => {
  const candidate = makeCandidateDraft('question-a', {
    traceability_check: {
      ...makeCandidateDraft().traceability_check,
      support_evidence_refs: [ref('wrong_evidence_type', 'support_1')],
    },
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /drifted evidence ref/.test(error.message),
  );
});

test('new unmet-need refs block candidate persistence', async () => {
  const candidate = makeCandidateDraft('question-a', {
    source_validated_need_refs: [ref('validated_need', 'new_need')],
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /unknown need ref/.test(error.message),
  );
});

test('drifted ValidatedNeed ref type blocks candidate persistence even when the id matches', async () => {
  const candidate = makeCandidateDraft('question-a', {
    source_validated_need_refs: [ref('need_candidate', 'validated_need_1')],
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /unknown need ref/.test(error.message),
  );
});

test('boundary drift in the question frame blocks candidate persistence', async () => {
  const formationInput = makeFormationInput();
  const ctx = makeContext({
    formationInput,
    llmOutput: makeLlmOutput(formationInput, [makeCandidateDraft()], {
      question_frame: {
        ...makeLlmOutput(formationInput).question_frame,
        target_community: 'HCI researchers',
      },
    }),
  });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /target community drifts/.test(error.message),
  );
});

test('duplicate candidate keys block candidate persistence before repository uniqueness errors', async () => {
  const candidates = [
    makeCandidateDraft('question-a'),
    makeCandidateDraft('question-a', {
      main_question: 'Can a duplicate-key candidate slip through?',
    }),
  ];
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), candidates) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /Duplicate TopicQuestion candidate key/.test(error.message),
  );
});

test('missing answerability plan fields block candidate persistence', async () => {
  const candidate = makeCandidateDraft('question-a', {
    answerability_plan: makeAnswerabilityPlan({ datasets_or_resources: [] }),
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /answerability plan/.test(error.message),
  );
});

test('missing required evidence refs in answerability plan blocks candidate persistence', async () => {
  const candidate = makeCandidateDraft('question-a', {
    answerability_plan: makeAnswerabilityPlan({ required_evidence_refs: [] }),
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /answerability plan/.test(error.message),
  );
});

test('claims that exceed the inherited slice ceiling block candidate persistence', async () => {
  const candidate = makeCandidateDraft('question-a', {
    expected_claim: 'The workflow proves production superiority.',
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /claim ceiling/.test(error.message),
  );
});

test('broad underspecified topic questions are blocked before selection', async () => {
  const candidate = makeCandidateDraft('question-a', {
    main_question: 'How can AI improve research?',
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /too broad or underspecified/.test(error.message),
  );
});

test('admittable topic questions require full support challenge baseline context traceability', async () => {
  const candidate = makeCandidateDraft('question-a', {
    traceability_check: {
      ...makeCandidateDraft().traceability_check,
      challenge_evidence_refs: [],
      context_evidence_refs: [],
    },
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError
      && /missing required traceability evidence roles/.test(error.message)
      && Array.isArray(error.details?.missing_evidence_roles)
      && error.details.missing_evidence_roles.includes('challenge')
      && error.details.missing_evidence_roles.includes('context'),
  );
});

test('admittable topic questions require actionable falsification conditions', async () => {
  const candidate = makeCandidateDraft('question-a', {
    falsification_conditions: [
      {
        ...makeCandidateDraft().falsification_conditions[0]!,
        statement: 'Check later.',
        trigger_evidence_refs: [],
        trigger_source_refs: [],
        related_contract_fields: [],
      },
    ],
  });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });

  await assert.rejects(
    () => formOnce(ctx),
    (error) => error instanceof AppError && /underspecified falsification/.test(error.message),
  );
});

test('park decision records selection context but creates no TopicQuestion', async () => {
  const ctx = makeContext();
  const formed = await formOnce(ctx);

  const result = await ctx.service.selectTopicQuestion({
    candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
    decision: 'park',
    decision_rationale: 'Defer until evidence freshness is rechecked.',
  });

  assert.equal(result.materializations.length, 0);
  assert.deepEqual(result.decision.created_topic_question_ids, []);
  assert.equal(
    (await ctx.repository.findCandidateSetById(formed.candidate_set.topic_question_candidate_set_id))?.status,
    'parked',
  );
  assert.equal(
    (await ctx.repository.findCandidateById(formed.candidates[0]!.topic_question_candidate_id))?.status,
    'parked',
  );
  const transition = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.decision.transition_attempt_id!,
  );
  assert.equal(transition?.transition_key, 'v1b-topic-question-candidate-set-to-selection-decision');
});

test('reject_all records selection context and marks candidates rejected without creating output', async () => {
  const ctx = makeContext();
  const formed = await formOnce(ctx);

  const result = await ctx.service.selectTopicQuestion({
    candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
    decision: 'reject_all',
    decision_rationale: 'No candidate has adequate fit after human review.',
  });

  assert.equal(result.materializations.length, 0);
  assert.deepEqual(result.decision.created_topic_question_ids, []);
  assert.equal(
    (await ctx.repository.findCandidateSetById(formed.candidate_set.topic_question_candidate_set_id))?.status,
    'rejected',
  );
  assert.equal(
    (await ctx.repository.findCandidateById(formed.candidates[0]!.topic_question_candidate_id))?.status,
    'rejected',
  );
});

test('admit creates a formal question contract and T-060 value-assessment handoff', async () => {
  const ctx = makeContext();
  const formed = await formOnce(ctx);

  const selected = await ctx.service.selectTopicQuestion({
    candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
    decision: 'admit',
    admitted_candidate_ids: [formed.candidates[0]!.topic_question_candidate_id],
    decision_rationale: 'Candidate is answerable and within slice boundaries.',
  });

  assert.equal(selected.materializations.length, 1);
  const materialization = selected.materializations[0]!;
  const handoff = await ctx.service.buildValueAssessmentInput({
    topic_question_contract_id: materialization.topic_question_contract.topic_question_contract_id,
  });
  assert.equal(handoff.question_contract.topic_question_contract_id, materialization.topic_question_contract.topic_question_contract_id);
  assert.equal(handoff.research_slice_ref.ref_id, RESEARCH_SLICE_ID);
  assert.equal(handoff.validated_need_refs[0]!.ref_id, 'validated_need_1');
  assert.equal(handoff.answerability_plan.answerability_verdict, 'answerable');
  assert.ok(handoff.evidence_refs.length >= 4);
  assert.ok(handoff.evidence_refs.some((evidenceRef) => evidenceRef.evidence_role === 'claim'));
  assert.ok(handoff.assumption_refs.some((assumptionRef) =>
    assumptionRef.source_assumption_id === 'assumption_resource_1'
    && assumptionRef.statement === 'Offline replay traces are available.',
  ));
});

test('accepted risk refs are preserved on contract and T-060 handoff', async () => {
  const riskRef = ref('accepted_risk', 'risk_1');
  const candidate = makeCandidateDraft('question-a', { answerability_verdict: 'answerable_with_risk' });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });
  const formed = await formOnce(ctx);

  const selected = await ctx.service.selectTopicQuestion({
    candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
    decision: 'admit',
    admitted_candidate_ids: [formed.candidates[0]!.topic_question_candidate_id],
    accepted_risk_refs: [riskRef],
    decision_rationale: 'Risk is explicitly accepted for value-assessment entry.',
  });
  const materialization = selected.materializations[0]!;
  const handoff = await ctx.service.buildValueAssessmentInput({
    topic_question_contract_id: materialization.topic_question_contract.topic_question_contract_id,
  });

  assert.equal(materialization.topic_question_contract.accepted_risk_refs[0]!.ref_id, 'risk_1');
  assert.equal(handoff.accepted_risk_refs[0]!.ref_id, 'risk_1');
  assert.equal(
    handoff.question_contract.answerability_plan_id,
    handoff.answerability_plan.topic_question_answerability_plan_id,
  );
});

test('answerable_with_risk requires accepted risk refs for system admission', async () => {
  const candidate = makeCandidateDraft('question-a', { answerability_verdict: 'answerable_with_risk' });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });
  const formed = await formOnce(ctx);

  await assert.rejects(
    () => ctx.service.selectTopicQuestion({
      candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
      decision: 'admit',
      admitted_candidate_ids: [formed.candidates[0]!.topic_question_candidate_id],
      decision_rationale: 'Risk still needs acceptance.',
    }),
    (error) => error instanceof AppError && /answerable_with_risk/.test(error.message),
  );
});

test('answerable_with_risk admission rejects non-risk authority refs', async () => {
  const candidate = makeCandidateDraft('question-a', { answerability_verdict: 'answerable_with_risk' });
  const ctx = makeContext({ llmOutput: makeLlmOutput(makeFormationInput(), [candidate]) });
  const formed = await formOnce(ctx);

  await assert.rejects(
    () => ctx.service.selectTopicQuestion({
      candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
      decision: 'admit',
      admitted_candidate_ids: [formed.candidates[0]!.topic_question_candidate_id],
      accepted_risk_refs: [ref('evidence_unit', 'support_1')],
      decision_rationale: 'Wrong ref type should not satisfy accepted risk.',
    }),
    (error) => error instanceof AppError && /accepted_risk/.test(error.message),
  );
});

test('merge_then_admit keeps merged candidates as sources but creates one canonical TopicQuestion', async () => {
  const formationInput = makeFormationInput();
  const candidates = [
    makeCandidateDraft('question-a'),
    makeCandidateDraft('question-b', {
      main_question: 'Can boundary-aware planning improve reviewer trace completeness in offline replay?',
    }),
  ];
  const ctx = makeContext({ formationInput, llmOutput: makeLlmOutput(formationInput, candidates) });
  const formed = await formOnce(ctx);

  const selected = await ctx.service.selectTopicQuestion({
    candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
    decision: 'merge_then_admit',
    admitted_candidate_ids: formed.candidates.map((candidate) => candidate.topic_question_candidate_id),
    decision_rationale: 'Candidate B is merged into canonical candidate A.',
    merged_candidate_groups: [{ canonical: formed.candidates[0]!.topic_question_candidate_id }],
  });

  assert.equal(selected.decision.admitted_candidate_ids.length, 2);
  assert.equal(selected.decision.created_topic_question_ids.length, 1);
  assert.equal(selected.materializations.length, 1);
  assert.equal(
    (await ctx.repository.findCandidateById(formed.candidates[0]!.topic_question_candidate_id))?.status,
    'admitted',
  );
  assert.equal(
    (await ctx.repository.findCandidateById(formed.candidates[1]!.topic_question_candidate_id))?.status,
    'merged',
  );
});

test('duplicate admitted candidate ids are rejected before materialization', async () => {
  const formationInput = makeFormationInput();
  const candidates = [
    makeCandidateDraft('question-a'),
    makeCandidateDraft('question-b', {
      main_question: 'Can offline replay identify answerability false-passes for reviewer-aligned planning?',
    }),
  ];
  const ctx = makeContext({ formationInput, llmOutput: makeLlmOutput(formationInput, candidates) });
  const formed = await formOnce(ctx);
  const duplicateId = formed.candidates[0]!.topic_question_candidate_id;

  await assert.rejects(
    () => ctx.service.selectTopicQuestion({
      candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
      decision: 'admit_multiple',
      admitted_candidate_ids: [duplicateId, duplicateId],
      decision_rationale: 'Duplicate id should not materialize two contracts.',
    }),
    (error) => error instanceof AppError && /duplicates/.test(error.message),
  );
});

test('admit_multiple creates one active contract for each admitted candidate', async () => {
  const formationInput = makeFormationInput();
  const candidates = [
    makeCandidateDraft('question-a'),
    makeCandidateDraft('question-b', {
      main_question: 'Can offline replay identify answerability false-passes for reviewer-aligned planning?',
    }),
  ];
  const ctx = makeContext({ formationInput, llmOutput: makeLlmOutput(formationInput, candidates) });
  const formed = await formOnce(ctx);

  const selected = await ctx.service.selectTopicQuestion({
    candidate_set_id: formed.candidate_set.topic_question_candidate_set_id,
    decision: 'admit_multiple',
    admitted_candidate_ids: formed.candidates.map((candidate) => candidate.topic_question_candidate_id),
    decision_rationale: 'Both candidates are independently answerable under the slice.',
  });

  assert.equal(selected.materializations.length, 2);
  assert.equal(selected.decision.created_topic_question_ids.length, 2);
  assert.notEqual(
    selected.materializations[0]!.topic_question_contract.topic_question_contract_id,
    selected.materializations[1]!.topic_question_contract.topic_question_contract_id,
  );
});
