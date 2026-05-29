import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type { TopicSelectionV1bResearchSlicePlanningInput } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-intake-contracts';
import type {
  TopicSelectionResearchSliceOptionDraft,
  TopicSelectionResearchSliceOptionSetLlmOutput,
  TopicSelectionSliceSelectionDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';

import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionV1bResearchSliceRepository } from '../repositories/in-memory-topic-selection-v1b-research-slice-repository.js';
import {
  LlmGatewayError,
  type LlmCallTelemetry,
  type LlmStructuredOutputRequest,
} from './llm-gateway.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import {
  TopicSelectionV1bResearchSliceService,
  type TopicSelectionV1bResearchSliceLlmGateway,
  type TopicSelectionV1bResearchSlicePlanningInputProvider,
} from './topic-selection-v1b-research-slice-service.js';

const NOW = '2026-05-14T00:00:00.000Z';
const TITLE_CARD_ID = 'title_card_t057';

function ref(
  refType: string,
  refId: string,
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
    title_card_id: TITLE_CARD_ID,
  };
}

function makePlanningInput(overrides: Partial<TopicSelectionV1bResearchSlicePlanningInput> = {}): TopicSelectionV1bResearchSlicePlanningInput {
  const supportRef = ref('evidence_unit', 'support_1');
  const challengeRef = ref('evidence_unit', 'challenge_1');
  const baselineRef = ref('evidence_unit', 'baseline_1');
  const contextRef = ref('evidence_unit', 'context_1');
  return {
    v1b_input_bundle_ref: ref('v1a_to_v1b_input_bundle', 'bundle_1', 'v1'),
    v1b_intake_snapshot_ref: ref('v1b_intake_snapshot', 'intake_1', 'v1'),
    research_constraint_profile_ref: ref('research_constraint_profile', 'profile_1', 'v1'),
    readiness_assessment_ref: ref('v1b_intake_readiness', 'readiness_1'),
    validated_need_ref: ref('validated_need', 'validated_need_1'),
    evidence_map_ref: ref('evidence_map', 'evidence_map_1', 'v1'),
    search_run_ref: ref('search_run', 'search_run_1'),
    search_plan_ref: ref('search_plan', 'search_plan_1', 'v1'),
    literature_snapshot_ref: ref('literature_resource_pool_snapshot', 'literature_snapshot_1', 'v1'),
    evidence_role_bundle: {
      support_unit_refs: [supportRef],
      challenge_unit_refs: [challengeRef],
      baseline_unit_refs: [baselineRef],
      context_unit_refs: [contextRef],
    },
    target_community: 'LLM systems researchers',
    target_venue_class: 'systems',
    intended_contribution_style: 'workflow system',
    method_constraints: ['offline replay evaluation'],
    resource_constraints: ['single workstation'],
    available_assets: ['paper corpus', 'review rubric'],
    feasibility_budget: { person_weeks: 2 },
    non_goals: ['Do not target production deployment'],
    claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
    accepted_risk_refs: [],
    gap_codes: ['BASELINE_COVERAGE_GAP'],
    memory_suggestion_refs: [ref('memory_suggestion', 'memory_1')],
    recheck_request_refs: [],
    handoff_payload: { source: 'unit-test' },
    ...overrides,
  };
}

function makeDraft(
  planningInput = makePlanningInput(),
  overrides: Partial<TopicSelectionResearchSliceOptionDraft> = {},
): TopicSelectionResearchSliceOptionDraft {
  return {
    option_key: 'slice-a',
    source_validated_need_refs: [planningInput.validated_need_ref],
    slice_statement: 'Bound the work to offline reviewer-aligned evidence planning.',
    problem_space: 'Reviewer-aligned evidence workflows for paper engineering.',
    target_setting: 'Local-first research assistant.',
    target_community: 'LLM systems researchers',
    included_boundaries: ['Offline evidence planning for LLM systems researchers.'],
    excluded_boundaries: ['Do not target production deployment.'],
    contribution_type_candidate: 'workflow system',
    support_evidence_refs: [planningInput.evidence_role_bundle.support_unit_refs[0]!],
    challenge_evidence_refs: [planningInput.evidence_role_bundle.challenge_unit_refs[0]!],
    baseline_evidence_refs: [planningInput.evidence_role_bundle.baseline_unit_refs[0]!],
    context_evidence_refs: [planningInput.evidence_role_bundle.context_unit_refs[0]!],
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
    ...overrides,
  };
}

function makeLlmOutput(
  planningInput = makePlanningInput(),
  options: TopicSelectionResearchSliceOptionDraft[] = [makeDraft(planningInput)],
): TopicSelectionResearchSliceOptionSetLlmOutput {
  return {
    recommended_option_key: options[0]?.option_key ?? null,
    comparison_axes: ['traceability', 'feasibility'],
    comparison_summary: 'slice-a is the most bounded option.',
    missing_option_types: [],
    unresolved_disagreements: [],
    human_review_triggers: [],
    options,
  };
}

function telemetry(): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 'gpt-5.5',
    profile_id: 'topic-selection-research-slice-planning',
    prompt_template_id: 'topic-selection-research-slice-planning',
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
  planningInput?: TopicSelectionV1bResearchSlicePlanningInput;
  llmOutput?: TopicSelectionResearchSliceOptionSetLlmOutput;
  intakeError?: Error;
  llmError?: Error;
} = {}) {
  let sequence = 0;
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, {
    idFactory,
    now: () => NOW,
  });
  const repository = new InMemoryTopicSelectionV1bResearchSliceRepository();
  const planningInput = options.planningInput ?? makePlanningInput();
  const intakeCalls: string[] = [];
  const intakeService: TopicSelectionV1bResearchSlicePlanningInputProvider = {
    async buildResearchSlicePlanningInput(input) {
      intakeCalls.push(input.readiness_assessment_id);
      if (options.intakeError) {
        throw options.intakeError;
      }
      return planningInput;
    },
  };
  const llmCalls: LlmStructuredOutputRequest[] = [];
  const llmGateway: TopicSelectionV1bResearchSliceLlmGateway = {
    async createStructuredOutput<T>(request: LlmStructuredOutputRequest) {
      llmCalls.push(request);
      if (options.llmError) {
        throw options.llmError;
      }
      return {
        parsed: (options.llmOutput ?? makeLlmOutput(planningInput)) as T,
        raw: { ok: true },
        telemetry: telemetry(),
      };
    },
  };
  const service = new TopicSelectionV1bResearchSliceService({
    repository,
    intakeService,
    controlPlaneService: controlPlane,
    llmGateway,
    idFactory,
    now: () => NOW,
  });

  return {
    controlPlaneRepository,
    intakeCalls,
    llmCalls,
    planningInput,
    repository,
    service,
  };
}

async function planOnce(ctx: ReturnType<typeof makeContext>) {
  return ctx.service.planResearchSliceOptions({
    readiness_assessment_id: ctx.planningInput.readiness_assessment_ref.ref_id,
  });
}

test('ready T-055 handoff plans and persists ResearchSlice options through the LLM gateway', async () => {
  const ctx = makeContext();

  const result = await planOnce(ctx);

  assert.equal(ctx.llmCalls.length, 1);
  assert.equal(result.plan_run.status, 'succeeded');
  assert.equal(result.option_set.status, 'ready_for_selection');
  assert.equal(result.option_set.option_count, 1);
  assert.equal(result.option_set.recommended_option_id, result.options[0]!.research_slice_option_id);
  assert.equal(result.options[0]!.status, 'recommended');
  assert.equal(
    (result.options[0]!.details_payload.inherited_constraints as Record<string, unknown>).claim_ceiling,
    ctx.planningInput.claim_ceiling,
  );
});

test('non-ready T-055 handoff blocks before any LLM call', async () => {
  const ctx = makeContext({
    intakeError: new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ResearchSlice planning requires ready_for_slice.'),
  });

  await assert.rejects(
    () => planOnce(ctx),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
  assert.equal(ctx.llmCalls.length, 0);
});

test('LLM failure records a failed plan run and creates no option set', async () => {
  const ctx = makeContext({
    llmError: new LlmGatewayError('UpstreamError', 'LLM unavailable.', {
      telemetry: telemetry(),
    }),
  });
  let failedPlanRunId = '';

  await assert.rejects(
    () => planOnce(ctx),
    (error) => {
      assert.ok(error instanceof AppError);
      failedPlanRunId = String(error.details?.plan_research_slice_run_id ?? '');
      return error.errorCode === 'INTERNAL_ERROR';
    },
  );

  const failedRun = await ctx.repository.findPlanRunById(failedPlanRunId);
  assert.equal(failedRun?.status, 'failed');
  assert.equal(failedRun?.option_set_id, null);
  assert.equal(ctx.llmCalls.length, 1);
});

test('invalid LLM option output records failed run and blocks option persistence', async () => {
  const planningInput = makePlanningInput();
  const invalidOutput = makeLlmOutput(planningInput, [
    makeDraft(planningInput, {
      support_evidence_refs: [ref('evidence_unit', 'foreign_evidence')],
    }),
  ]);
  const ctx = makeContext({ planningInput, llmOutput: invalidOutput });
  let failedPlanRunId = '';

  await assert.rejects(
    () => planOnce(ctx),
    (error) => {
      assert.ok(error instanceof AppError);
      failedPlanRunId = String(error.details?.plan_research_slice_run_id ?? '');
      return error.errorCode === 'GATE_CONSTRAINT_FAILED';
    },
  );

  const failedRun = await ctx.repository.findPlanRunById(failedPlanRunId);
  assert.equal(failedRun?.status, 'failed');
  assert.equal(failedRun?.option_set_id, null);
});

test('known non-evidence planning refs in evidence slots are removed with a quality flag', async () => {
  const planningInput = makePlanningInput();
  const invalidEvidenceRef = planningInput.v1b_intake_snapshot_ref;
  const output = makeLlmOutput(planningInput, [
    makeDraft(planningInput, {
      support_evidence_refs: [
        planningInput.evidence_role_bundle.support_unit_refs[0]!,
        invalidEvidenceRef,
      ],
    }),
  ]);
  const ctx = makeContext({ planningInput, llmOutput: output });

  const result = await planOnce(ctx);
  const option = result.options[0]!;

  assert.equal(result.plan_run.status, 'succeeded');
  assert.equal(option.support_evidence_refs.some((item) => item.ref_id === invalidEvidenceRef.ref_id), false);
  assert.equal(result.plan_run.quality_flags.includes('NON_EVIDENCE_REFS_REMOVED_FROM_SLICE_OPTION'), true);
  assert.equal(option.requires_human_review, true);
  assert.equal(option.human_review_triggers.includes('non_evidence_refs_removed'), true);
  const normalization = option.details_payload.evidence_ref_normalization as Record<string, unknown>;
  assert.ok(Array.isArray(normalization.dropped_non_evidence_refs));
});

test('known evidence refs are canonicalized before ResearchSlice persistence', async () => {
  const planningInput = makePlanningInput();
  const canonicalSupportRef = planningInput.evidence_role_bundle.support_unit_refs[0]!;
  const driftedSupportRef = {
    ...canonicalSupportRef,
    title_card_id: 'title_card_drifted',
  };
  const output = makeLlmOutput(planningInput, [
    makeDraft(planningInput, {
      support_evidence_refs: [driftedSupportRef],
    }),
  ]);
  const ctx = makeContext({ planningInput, llmOutput: output });

  const result = await planOnce(ctx);
  const option = result.options[0]!;

  assert.deepEqual(option.support_evidence_refs, [canonicalSupportRef]);
  assert.equal(result.plan_run.quality_flags.includes('EVIDENCE_REFS_CANONICALIZED'), true);
  assert.equal(option.requires_human_review, true);
  assert.equal(option.human_review_triggers.includes('evidence_refs_canonicalized'), true);
  const canonicalization = option.details_payload.evidence_ref_canonicalization as Record<string, unknown>;
  assert.ok(Array.isArray(canonicalization.canonicalized_evidence_refs));
});

test('claim-ceiling exceeding options are blocked before option persistence', async () => {
  const planningInput = makePlanningInput();
  const invalidOutput = makeLlmOutput(planningInput, [
    makeDraft(planningInput, {
      expected_claim: 'The workflow proves production superiority for deployed assistants.',
      claim_ceiling_alignment: {
        status: 'exceeds',
        rationale: 'The expected claim exceeds the supplied ceiling.',
        confidence: 0.9,
      },
    }),
  ]);
  const ctx = makeContext({ planningInput, llmOutput: invalidOutput });

  await assert.rejects(
    () => planOnce(ctx),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('select decision creates ResearchSlice plus evidence, boundary, and assumption rows', async () => {
  const ctx = makeContext();
  const planned = await planOnce(ctx);

  const selected = await ctx.service.selectResearchSlice({
    option_set_id: planned.option_set.research_slice_option_set_id,
    decision: 'select',
    selected_option_id: planned.options[0]!.research_slice_option_id,
    decided_by: 'system',
    selection_rationale: 'Best bounded option for question formation.',
  });

  assert.equal(selected.decision.decision, 'select');
  assert.ok(selected.research_slice);
  assert.equal(selected.research_slice?.status, 'selected');
  assert.equal(selected.evidence_refs?.length, 4);
  assert.ok((selected.boundaries?.length ?? 0) >= 3);
  assert.ok((selected.assumptions?.length ?? 0) >= 5);

  const handoff = await ctx.service.buildTopicQuestionFormationInput({
    research_slice_id: selected.research_slice!.research_slice_id,
  });
  assert.equal(handoff.validated_need_ref.ref_id, ctx.planningInput.validated_need_ref.ref_id);
  assert.equal(handoff.claim_ceiling, ctx.planningInput.claim_ceiling);
  assert.deepEqual(handoff.non_goals, ctx.planningInput.non_goals);
  assert.deepEqual(handoff.memory_suggestion_refs, ctx.planningInput.memory_suggestion_refs);
  assert.deepEqual(handoff.recheck_request_refs, ctx.planningInput.recheck_request_refs);
});

test('request_more_options, park, and reject decisions create no ResearchSlice', async () => {
  const decisions: Array<Exclude<TopicSelectionSliceSelectionDecision, 'select'>> = [
    'request_more_options',
    'park',
    'reject',
  ];

  for (const decision of decisions) {
    const ctx = makeContext();
    const planned = await planOnce(ctx);

    const result = await ctx.service.selectResearchSlice({
      option_set_id: planned.option_set.research_slice_option_set_id,
      decision,
      decided_by: 'human',
      selection_rationale: `${decision} from unit test.`,
      required_actions: ['revise_slice_options'],
    });

    assert.equal(result.decision.decision, decision);
    assert.equal(result.research_slice, undefined);
    const updatedSet = await ctx.repository.findOptionSetById(planned.option_set.research_slice_option_set_id);
    assert.notEqual(updatedSet?.status, 'selected');

    await assert.rejects(
      () => ctx.service.selectResearchSlice({
        option_set_id: planned.option_set.research_slice_option_set_id,
        decision: 'select',
        selected_option_id: planned.options[0]!.research_slice_option_id,
        decided_by: 'human',
        selection_rationale: 'A looped-back option set must not be selected later.',
      }),
      /cannot create a new SliceSelectionDecision/,
    );
  }
});

test('hard-blocked and high-risk options cannot be auto-selected without handling', async () => {
  const planningInput = makePlanningInput();
  const blockedCtx = makeContext({
    planningInput,
    llmOutput: makeLlmOutput(planningInput, [
      makeDraft(planningInput, {
        hard_blockers: ['No viable baseline.'],
      }),
    ]),
  });
  const blockedPlan = await planOnce(blockedCtx);

  await assert.rejects(
    () => blockedCtx.service.selectResearchSlice({
      option_set_id: blockedPlan.option_set.research_slice_option_set_id,
      decision: 'select',
      selected_option_id: blockedPlan.options[0]!.research_slice_option_id,
      decided_by: 'human',
      selection_rationale: 'Try selecting blocked option.',
    }),
    /Hard-blocked ResearchSlice options cannot be selected/,
  );

  const highRiskCtx = makeContext({
    planningInput,
    llmOutput: makeLlmOutput(planningInput, [
      makeDraft(planningInput, {
        baseline_risk: 'high',
        confidence: 0.4,
      }),
    ]),
  });
  const highRiskPlan = await planOnce(highRiskCtx);

  await assert.rejects(
    () => highRiskCtx.service.selectResearchSlice({
      option_set_id: highRiskPlan.option_set.research_slice_option_set_id,
      decision: 'select',
      selected_option_id: highRiskPlan.options[0]!.research_slice_option_id,
      decided_by: 'system',
      selection_rationale: 'Try auto-selecting high-risk option.',
    }),
    /require human handling or accepted risk refs/,
  );

  const selectedWithRisk = await highRiskCtx.service.selectResearchSlice({
    option_set_id: highRiskPlan.option_set.research_slice_option_set_id,
    decision: 'select',
    selected_option_id: highRiskPlan.options[0]!.research_slice_option_id,
    decided_by: 'system',
    selection_rationale: 'Select with explicit accepted risk coverage.',
    accepted_risk_refs: [ref('accepted_risk', 'risk_1')],
  });
  assert.equal(selectedWithRisk.research_slice?.status, 'selected');
});
