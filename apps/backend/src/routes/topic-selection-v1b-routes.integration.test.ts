import assert from 'node:assert/strict';
import test from 'node:test';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS,
  type TopicSelectionOfflineEvaluationCaseRecord,
  type TopicSelectionOfflineEvaluationObservedOutput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import type {
  TopicSelectionResearchSliceOptionDraft,
  TopicSelectionResearchSliceOptionSetLlmOutput,
  TopicSelectionV1bTopicQuestionFormationInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionFormTopicQuestionLlmOutput,
  TopicSelectionTopicQuestionAnswerabilityPlanDraft,
  TopicSelectionTopicQuestionCandidateDraft,
  TopicSelectionV1bTopicQuestionMaterialization,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
  type TopicSelectionAssessTopicValueLlmOutput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';

import { buildApp } from '../app.js';
import type { LlmCallTelemetry, LlmStructuredOutputRequest } from '../services/llm-gateway.js';

type ValueAssessmentFixtureMode =
  | 'ready'
  | 'needs_refinement'
  | 'refine_slice'
  | 'refine_question'
  | 'recheck_required';

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
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
    version_id: versionId,
    title_card_id: titleCardId,
  };
}

function assertStatus(response: { statusCode: number; body: string }, expected: number): void {
  if (response.statusCode !== expected) {
    assert.fail(`Expected HTTP ${expected}, received ${response.statusCode}: ${response.body}`);
  }
}

function minimalReplayGoldExpectation() {
  return {
    expected_unmet_need: false,
    expected_key_evidence_refs: [],
    expected_counter_evidence_refs: [],
    expected_blocker_codes: [],
    required_trace_refs: [],
    expected_recheck_action_refs: [],
    expected_negative_memory_refs: [],
    expected_downstream_rework_causes: [],
    notes: [],
  };
}

async function assertPrismaHttpSmokeDatabaseReady(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for T-054 Prisma HTTP smoke test.');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$queryRaw`SELECT 1 FROM "LiteratureRecord" LIMIT 1`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.fail(
      [
        'DATABASE_URL for T-054 Prisma HTTP smoke must point at a reachable Postgres database with repo migrations applied.',
        `Underlying Prisma error: ${message}`,
      ].join(' '),
    );
  } finally {
    await prisma.$disconnect();
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
    manual_label: `Manual locator ${input.key}`,
  };
}

function telemetry(schemaName: string): LlmCallTelemetry {
  return {
    provider_id: 'openai',
    model_id: 'gpt-5.4-mini',
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
  private valueAssessmentCallCount = 0;

  constructor(
    private readonly options: {
      valueAssessmentSequence?: ValueAssessmentFixtureMode[];
    } = {},
  ) {}

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
      const mode = this.options.valueAssessmentSequence?.[this.valueAssessmentCallCount] ?? 'ready';
      this.valueAssessmentCallCount += 1;
      return makeValueOutput(
        payload.topic_value_assessment_input_json ?? {},
        payload.research_slice_snapshot_json,
        mode,
      );
    }
    throw new Error(`Unexpected structured output schema ${schemaName}.`);
  }
}

function firstFunctionalRef(value: unknown, fallback: TopicSelectionFunctionalRef): TopicSelectionFunctionalRef {
  return isFunctionalRef(value) ? value : fallback;
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
      ? titleCardIdFromRef(planningInput.validated_need_ref, 'title_card_v1b_route')
      : 'title_card_v1b_route';
  const roleBundle = (planningInput.evidence_role_bundle ?? {}) as Record<string, unknown>;
  const supportRefs = refArray(roleBundle.support_unit_refs);
  const challengeRefs = refArray(roleBundle.challenge_unit_refs);
  const baselineRefs = refArray(roleBundle.baseline_unit_refs);
  const contextRefs = refArray(roleBundle.context_unit_refs);
  const nonGoals = stringArray(planningInput.non_goals);
  const draft: TopicSelectionResearchSliceOptionDraft = {
    option_key: 'slice-a',
    source_validated_need_refs: [
      firstFunctionalRef(planningInput.validated_need_ref, ref('validated_need', 'validated_need_route', titleCardId)),
    ],
    slice_statement: 'Bound the work to offline reviewer-aligned evidence planning.',
    problem_space: 'Reviewer-aligned evidence workflows for paper engineering.',
    target_setting: 'Local-first research assistant.',
    target_community: String(planningInput.target_community ?? 'LLM systems researchers'),
    included_boundaries: ['Offline evidence planning for reviewer-aligned topic decisions.'],
    excluded_boundaries: nonGoals.length > 0 ? nonGoals : ['Do not target production deployment.'],
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
  assert.ok(formationInput, 'fake T-059 output requires formation input');
  const evidenceByRole = new Map(
    formationInput.evidence_refs.map((record) => [record.evidence_role, record.evidence_ref]),
  );
  const supportRef = evidenceByRole.get('support') ?? formationInput.evidence_refs[0]?.evidence_ref;
  assert.ok(supportRef, 'fake T-059 output requires at least one evidence ref');
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
      frame_payload: { source: 'route-test' },
    },
    recommended_candidate_keys: [candidate.candidate_key],
    generation_notes: ['Route-test candidate set.'],
    human_review_triggers: [],
    candidates: [candidate],
  };
}

function makeValueOutput(
  valueInput: Record<string, unknown>,
  formationInput: TopicSelectionV1bTopicQuestionFormationInput | undefined,
  mode: ValueAssessmentFixtureMode = 'ready',
): TopicSelectionAssessTopicValueLlmOutput {
  const evidenceRecord = Array.isArray(valueInput.evidence_refs)
    ? valueInput.evidence_refs.find((record) => Boolean(record && typeof record === 'object'))
    : null;
  const evidenceRef = isFunctionalRef((evidenceRecord as { evidence_ref?: unknown } | null)?.evidence_ref)
    ? (evidenceRecord as { evidence_ref: TopicSelectionFunctionalRef }).evidence_ref
    : formationInput?.evidence_refs[0]?.evidence_ref;
  assert.ok(evidenceRef, 'fake T-060 output requires at least one inherited evidence ref');
  const contract = (valueInput.question_contract ?? {}) as Record<string, unknown>;
  const titleCardId = titleCardIdFromRef(evidenceRef, 'title_card_v1b_route');
  const assessmentRef = firstFunctionalRef(
    valueInput.topic_question_contract_ref,
    ref('topic_question_contract', 'topic_question_contract_route', titleCardId),
  );
  const readyOutput: TopicSelectionAssessTopicValueLlmOutput = {
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
  if (mode === 'ready') {
    return readyOutput;
  }
  const effectiveMode = mode === 'needs_refinement' ? 'refine_slice' : mode;
  const recommendedDisposition = effectiveMode === 'refine_question'
    ? 'refine_question'
    : effectiveMode === 'recheck_required'
      ? 'recheck_evidence_or_search'
      : 'refine_slice';
  const failedGateKey = effectiveMode === 'refine_question' ? 'answerability_sanity' : 'evidence_sanity';
  const readinessStatus = effectiveMode === 'recheck_required' ? 'recheck_required' : 'needs_refinement';
  const failedGateRationale = effectiveMode === 'refine_question'
    ? 'The question mixes workflow value and metric scope, so it must be reframed before package drafting.'
    : effectiveMode === 'recheck_required'
      ? 'Evidence freshness must be rechecked before package drafting.'
      : 'Baseline and challenge evidence must be refreshed before package drafting.';
  const weakDimension = effectiveMode === 'refine_question' ? 'claim_ceiling_fit' : 'reviewer_risk';
  const summary = effectiveMode === 'refine_question'
    ? 'The slice is promising, but the question contract must be refined before package drafting.'
    : effectiveMode === 'recheck_required'
      ? 'The topic is promising, but evidence/search freshness must be rechecked before package drafting.'
      : 'The topic is promising but the current slice needs refinement before package drafting.';
  return {
    ...readyOutput,
    readiness_status: readinessStatus,
    hard_gates: readyOutput.hard_gates.map((gate) =>
      gate.gate_key === failedGateKey
        ? {
          ...gate,
          verdict: 'fail',
          severity: 'blocking',
          rationale: failedGateRationale,
          refs: [evidenceRef],
        }
        : gate,
    ),
    dimension_scores: readyOutput.dimension_scores.map((score) =>
      score.dimension_key === 'answerability' || score.dimension_key === weakDimension
        ? {
          ...score,
          score: 56,
          uncertainty: 'The current value path leaves too much uncertainty for package drafting.',
        }
        : score,
    ),
    recommended_disposition: recommendedDisposition,
    total_score: 62,
    value_summary: summary,
    blocker_refs: [evidenceRef],
    risk_notes: [
      effectiveMode === 'recheck_required'
        ? 'Refresh or recheck evidence before advancing.'
        : 'Refine the value path before advancing.',
    ],
    reasoning_memo: {
      ...readyOutput.reasoning_memo,
      recommendation: recommendedDisposition,
      evidence_backed_rationale: effectiveMode === 'refine_question'
        ? 'The inherited evidence supports the slice but not the current question framing.'
        : effectiveMode === 'recheck_required'
          ? 'The inherited evidence must be rechecked before it can support package drafting.'
          : 'The inherited evidence shows the slice needs a narrower baseline/challenge frame.',
      uncertainty: effectiveMode === 'recheck_required'
        ? 'Evidence freshness may invalidate the current value path.'
        : 'The current value path may overstate answerability.',
      disposition_bridge: effectiveMode === 'refine_question'
        ? 'Return to TopicQuestionContract refinement before producing package input.'
        : effectiveMode === 'recheck_required'
          ? 'Return to evidence/search recheck before producing package input.'
          : 'Return to ResearchSlice refinement before producing package input.',
      cited_refs: [evidenceRef],
    },
  };
}

async function createLiterature(app: FastifyInstance, suffix: string): Promise<string> {
  const safeSuffix = suffix.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const importRes = await app.inject({
    method: 'POST',
    url: '/literature/collections/import',
    payload: {
      items: [
        {
          provider: 'manual',
          external_id: `topic-selection-v1b-api-${safeSuffix}`,
          title: `Topic Selection v1b API Evidence ${suffix}`,
          abstract: 'Evidence workflows miss reviewer-facing traceability from claims to decisions.',
          authors: ['API Route Author'],
          year: 2026,
          doi: `10.1000/topic-selection-v1b-api-${safeSuffix}`,
          source_url: `https://example.com/topic-selection-v1b-api/${safeSuffix}`,
        },
      ],
    },
  });
  assertStatus(importRes, 200);
  const body = importRes.json() as { results: Array<{ literature_id: string }> };
  const literatureId = body.results[0]?.literature_id;
  assert.ok(literatureId);
  return literatureId;
}

async function createTitleCard(app: FastifyInstance, suffix: string): Promise<string> {
  const titleCardRes = await app.inject({
    method: 'POST',
    url: '/title-cards',
    payload: {
      working_title: `Topic Selection v1b API Title ${suffix}`,
      brief: 'Validate v1b topic package drafting through HTTP routes.',
    },
  });
  assertStatus(titleCardRes, 201);
  return (titleCardRes.json() as { title_card_id: string }).title_card_id;
}

async function createV1bInputBundle(app: FastifyInstance, suffix: string) {
  const literatureId = await createLiterature(app, suffix);
  const titleCardId = await createTitleCard(app, suffix);

  const basketRes = await app.inject({
    method: 'PATCH',
    url: `/title-cards/${encodeURIComponent(titleCardId)}/evidence-basket`,
    payload: { add_literature_ids: [literatureId] },
  });
  assertStatus(basketRes, 200);

  const seedRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/topic-seeds/from-title-card',
    payload: {
      title_card_id: titleCardId,
      created_by: 'system',
    },
  });
  assertStatus(seedRes, 201);
  const seed = seedRes.json() as { topic_seed_id: string };

  const snapshotRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/literature-resource-pool-snapshots',
    payload: {
      title_card_id: titleCardId,
      topic_seed_id: seed.topic_seed_id,
      created_by: 'system',
    },
  });
  assertStatus(snapshotRes, 201);
  const snapshot = snapshotRes.json() as {
    literature_resource_pool_snapshot_id: string;
    literature_refs: TopicSelectionFunctionalRef[];
    content_source_refs: TopicSelectionFunctionalRef[];
  };
  const literatureRef = snapshot.literature_refs[0] ?? ref('literature_record', literatureId, titleCardId);
  const sourceRef = snapshot.content_source_refs[0] ?? ref('literature_source', `manual-source-${suffix}`, titleCardId);

  const coverageIntents = [
    ['support-traceability', 'support', 'support reviewer-facing traceability gap'],
    ['challenge-freshness', 'challenge', 'challenge evidence freshness for traceability workflows'],
    ['baseline-provenance', 'baseline', 'baseline decision chain misses provenance'],
    ['context-workflow', 'context', 'context local CS paper engineering workflow'],
  ].map(([coverageKey, role, query]) => ({
    coverage_key: coverageKey,
    intent_type: role,
    query,
    expected_evidence_role: role,
  }));
  const planRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/search-plans',
    payload: {
      title_card_id: titleCardId,
      topic_seed_id: seed.topic_seed_id,
      literature_resource_pool_snapshot_id: snapshot.literature_resource_pool_snapshot_id,
      query_intents: coverageIntents.map((intent) => intent.query),
      coverage_intents: coverageIntents,
      created_by: 'system',
    },
  });
  assertStatus(planRes, 201);
  const plan = planRes.json() as {
    search_plan: { search_plan_id: string; plan_version: string };
    coverage_row_intents: Array<{ coverage_row_intent_id: string; expected_evidence_role: string }>;
  };

  const runRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/search-runs',
    payload: {
      title_card_id: titleCardId,
      search_plan_id: plan.search_plan.search_plan_id,
      result_accounting: {
        total_result_count: 4,
        unique_literature_count: 1,
        duplicate_result_count: 0,
        failed_source_count: 0,
        skipped_source_count: 0,
      },
      source_health_summary: {
        source_count: 1,
        warning_codes: [],
      },
      dedup_summary: {
        canonical_work_refs: [literatureRef],
      },
      evidence_map_input_refs: [literatureRef, sourceRef],
      coverage_observations: plan.coverage_row_intents.map((row) => ({
        coverage_row_intent_id: row.coverage_row_intent_id,
        status: 'succeeded',
        result_count: 1,
        source_count: 1,
      })),
      evidence_bindings: plan.coverage_row_intents.map((row, index) => ({
        coverage_row_intent_id: row.coverage_row_intent_id,
        literature_ref: literatureRef,
        source_refs: [sourceRef],
        binding_kind: 'retrieval_hit',
        result_rank: index + 1,
      })),
      coverage_assessments: plan.coverage_row_intents.map((row) => ({
        coverage_row_intent_id: row.coverage_row_intent_id,
        verdict: 'satisfied',
        confidence: 0.88,
        assessed_by: 'system',
      })),
      created_by: 'system',
    },
  });
  assertStatus(runRes, 201);
  const run = runRes.json() as { search_run: { search_run_id: string } };

  const byRole = new Map(plan.coverage_row_intents.map((row) => [row.expected_evidence_role, row]));
  const evidenceMapRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/evidence-maps',
    payload: {
      title_card_id: titleCardId,
      search_run_id: run.search_run.search_run_id,
      evidence_units: [
        {
          client_unit_key: 'support',
          coverage_row_intent_id: byRole.get('support')?.coverage_row_intent_id,
          evidence_role: 'support',
          literature_ref: literatureRef,
          locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: `support-${suffix}` }),
          source_statement: 'Reviewers need traceability from source claims to topic-selection decisions.',
        },
        {
          client_unit_key: 'challenge',
          coverage_row_intent_id: byRole.get('challenge')?.coverage_row_intent_id,
          evidence_role: 'challenge',
          literature_ref: literatureRef,
          locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: `challenge-${suffix}` }),
          source_statement: 'Evidence freshness can weaken reviewer-facing traceability conclusions.',
        },
        {
          client_unit_key: 'baseline',
          coverage_row_intent_id: byRole.get('baseline')?.coverage_row_intent_id,
          evidence_role: 'baseline',
          literature_ref: literatureRef,
          locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: `baseline-${suffix}` }),
          source_statement: 'Baseline decision chains often collapse provenance into a single opaque status.',
        },
        {
          client_unit_key: 'context',
          coverage_row_intent_id: byRole.get('context')?.coverage_row_intent_id,
          evidence_role: 'context',
          literature_ref: literatureRef,
          locator: manualLocator({ titleCardId, literatureRef, sourceRef, key: `context-${suffix}` }),
          source_statement: 'The workflow is scoped to local CS paper engineering and reviewer-aligned evidence review.',
        },
      ],
      created_by: 'system',
    },
  });
  assertStatus(evidenceMapRes, 201);
  const evidenceMap = evidenceMapRes.json() as { evidence_map: { evidence_map_id: string } };

  const candidateRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/need-candidates',
    payload: {
      title_card_id: titleCardId,
      evidence_map_id: evidenceMap.evidence_map.evidence_map_id,
      candidate_need: 'Reviewer-aligned topic selection needs traceable evidence-to-need decisions.',
      mechanism_type: 'workflow_gap',
      mechanism_summary: 'The decision chain is hard to audit without explicit gates and evidence refs.',
      scope_notes: 'Local-first CS paper engineering workflows that prepare reviewer-facing topic decisions.',
      prior_art_status: 'no_strong_solution_found',
      created_by: 'system',
    },
  });
  assertStatus(candidateRes, 201);
  const candidate = candidateRes.json() as { need_candidate_id: string };

  const readinessRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(candidate.need_candidate_id)}/readiness-assessments`,
    payload: { assessed_by: 'system' },
  });
  assertStatus(readinessRes, 201);
  const readiness = readinessRes.json() as { readiness_assessment_id: string };

  const packetRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1a/validation-support-packets',
    payload: {
      need_candidate_id: candidate.need_candidate_id,
      readiness_assessment_id: readiness.readiness_assessment_id,
      created_by: 'system',
    },
  });
  assertStatus(packetRes, 201);
  const packet = packetRes.json() as { validation_support_packet_id: string };

  const adjudicationRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(candidate.need_candidate_id)}/adjudications`,
    payload: {
      support_packet_id: packet.validation_support_packet_id,
      final_decision: 'validate',
      rationale: 'Human reviewer confirms the need and trace boundary.',
      adjudicated_by: { actor_type: 'human', actor_id: 'route-test-reviewer' },
      human_actor: { actor_type: 'human', actor_id: 'route-test-reviewer' },
      human_rationale: 'Support, challenge, baseline, context, and handoff refs are sufficient for v1b input.',
    },
  });
  assertStatus(adjudicationRes, 201);
  const adjudication = adjudicationRes.json() as {
    validated_need: { validated_need_id: string };
    v1b_input_bundle: { v1b_input_bundle_id: string };
  };

  return {
    titleCardId,
    validatedNeedId: adjudication.validated_need.validated_need_id,
    v1bInputBundleId: adjudication.v1b_input_bundle.v1b_input_bundle_id,
  };
}

type V1bFlowResult = {
  titleCardId: string;
  validatedNeedId: string;
  v1bInputBundleId: string;
  intakeSnapshot: { v1b_intake_snapshot_id: string };
  constraintProfile: { research_constraint_profile_id: string };
  readiness: { v1b_intake_readiness_assessment_id: string; recommendation: string };
  sliceOptionSet: { option_set: { research_slice_option_set_id: string }; options: Array<{ research_slice_option_id: string }> };
  sliceSelection: { research_slice?: { research_slice_id: string } };
  questionCandidateSet: {
    candidate_set: { topic_question_candidate_set_id: string };
    candidates: Array<{ topic_question_candidate_id: string }>;
  };
  questionSelection: {
    materializations: TopicSelectionV1bTopicQuestionMaterialization[];
  };
  valueAssessment: { topic_value_assessment: { topic_value_assessment_id: string } };
  disposition?: { value_disposition_decision_id: string; decision: string };
  draftPackage?: { topic_package: { topic_package_id: string; package_readiness_status: string } };
};

async function runV1bDraftingPassFromReadiness(
  app: FastifyInstance,
  readinessAssessmentId: string,
): Promise<Pick<
  V1bFlowResult,
  'sliceOptionSet' | 'sliceSelection' | 'questionCandidateSet' | 'questionSelection' | 'valueAssessment' | 'disposition' | 'draftPackage'
>> {
  const sliceOptionsRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/research-slice-option-sets',
    payload: {
      readiness_assessment_id: readinessAssessmentId,
      triggered_by: 'system',
    },
  });
  assertStatus(sliceOptionsRes, 201);
  const sliceOptionSet = sliceOptionsRes.json() as V1bFlowResult['sliceOptionSet'];
  assert.ok(sliceOptionSet.options[0]?.research_slice_option_id);

  const sliceSelectionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/research-slice-option-sets/${encodeURIComponent(sliceOptionSet.option_set.research_slice_option_set_id)}/selection-decisions`,
    payload: {
      option_set_id: 'ignored-by-path',
      decision: 'select',
      selected_option_id: sliceOptionSet.options[0].research_slice_option_id,
      decided_by: 'human',
      selection_rationale: 'Selected as the refined bounded option.',
      confidence: 0.86,
    },
  });
  assertStatus(sliceSelectionRes, 201);
  const sliceSelection = sliceSelectionRes.json() as V1bFlowResult['sliceSelection'];
  assert.ok(sliceSelection.research_slice?.research_slice_id);

  const questionCandidateRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-question-candidate-sets',
    payload: {
      research_slice_id: sliceSelection.research_slice.research_slice_id,
      triggered_by: 'system',
    },
  });
  assertStatus(questionCandidateRes, 201);
  const questionCandidateSet = questionCandidateRes.json() as V1bFlowResult['questionCandidateSet'];
  assert.ok(questionCandidateSet.candidates[0]?.topic_question_candidate_id);

  const questionSelectionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-question-candidate-sets/${encodeURIComponent(questionCandidateSet.candidate_set.topic_question_candidate_set_id)}/selection-decisions`,
    payload: {
      candidate_set_id: 'ignored-by-path',
      decision: 'admit',
      admitted_candidate_ids: [questionCandidateSet.candidates[0].topic_question_candidate_id],
      decided_by: 'human',
      decision_rationale: 'Refined question is answerable and within the selected slice.',
      confidence: 0.87,
    },
  });
  assertStatus(questionSelectionRes, 201);
  const questionSelection = questionSelectionRes.json() as V1bFlowResult['questionSelection'];
  const contractId = questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id;
  assert.ok(contractId);

  const valueAssessmentRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-value-assessments',
    payload: {
      topic_question_contract_id: contractId,
      triggered_by: 'system',
    },
  });
  assertStatus(valueAssessmentRes, 201);
  const valueAssessment = valueAssessmentRes.json() as V1bFlowResult['valueAssessment'];
  assert.ok(valueAssessment.topic_value_assessment.topic_value_assessment_id);

  const dispositionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(valueAssessment.topic_value_assessment.topic_value_assessment_id)}/disposition-decisions`,
    payload: {
      topic_value_assessment_id: 'ignored-by-path',
      decision: 'advance_to_package',
      decided_by: 'human',
      decision_rationale: 'Refined slice is now ready for draft package handoff.',
    },
  });
  assertStatus(dispositionRes, 201);
  const disposition = dispositionRes.json() as { value_disposition_decision_id: string; decision: string };
  assert.equal(disposition.decision, 'advance_to_package');

  const packageRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-packages/drafts',
    payload: {
      value_disposition_decision_id: disposition.value_disposition_decision_id,
      created_by: 'system',
    },
  });
  assertStatus(packageRes, 201);
  const draftPackage = packageRes.json() as {
    topic_package: { topic_package_id: string; package_readiness_status: string };
  };
  assert.equal(draftPackage.topic_package.package_readiness_status, 'ready_for_promotion_review');

  const bundleRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-packages/${encodeURIComponent(draftPackage.topic_package.topic_package_id)}/v1c-input-bundles`,
  });
  assertStatus(bundleRes, 200);

  return {
    sliceOptionSet,
    sliceSelection,
    questionCandidateSet,
    questionSelection,
    valueAssessment,
    disposition,
    draftPackage,
  };
}

async function runV1bValuePassFromQuestionContract(
  app: FastifyInstance,
  contractId: string,
): Promise<Pick<V1bFlowResult, 'valueAssessment' | 'disposition' | 'draftPackage'>> {
  const valueAssessmentRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-value-assessments',
    payload: {
      topic_question_contract_id: contractId,
      triggered_by: 'system',
    },
  });
  assertStatus(valueAssessmentRes, 201);
  const valueAssessment = valueAssessmentRes.json() as V1bFlowResult['valueAssessment'];
  assert.ok(valueAssessment.topic_value_assessment.topic_value_assessment_id);

  const dispositionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(valueAssessment.topic_value_assessment.topic_value_assessment_id)}/disposition-decisions`,
    payload: {
      topic_value_assessment_id: 'ignored-by-path',
      decision: 'advance_to_package',
      decided_by: 'human',
      decision_rationale: 'Re-entered value path is ready for draft package handoff.',
    },
  });
  assertStatus(dispositionRes, 201);
  const disposition = dispositionRes.json() as { value_disposition_decision_id: string; decision: string };
  assert.equal(disposition.decision, 'advance_to_package');

  const packageRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-packages/drafts',
    payload: {
      value_disposition_decision_id: disposition.value_disposition_decision_id,
      created_by: 'system',
    },
  });
  assertStatus(packageRes, 201);
  const draftPackage = packageRes.json() as {
    topic_package: { topic_package_id: string; package_readiness_status: string };
  };
  assert.equal(draftPackage.topic_package.package_readiness_status, 'ready_for_promotion_review');

  const bundleRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-packages/${encodeURIComponent(draftPackage.topic_package.topic_package_id)}/v1c-input-bundles`,
  });
  assertStatus(bundleRes, 200);

  return {
    valueAssessment,
    disposition,
    draftPackage,
  };
}

async function runV1bQuestionValuePassFromSlice(
  app: FastifyInstance,
  researchSliceId: string,
): Promise<Pick<
  V1bFlowResult,
  'questionCandidateSet' | 'questionSelection' | 'valueAssessment' | 'disposition' | 'draftPackage'
>> {
  const questionCandidateRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-question-candidate-sets',
    payload: {
      research_slice_id: researchSliceId,
      triggered_by: 'system',
    },
  });
  assertStatus(questionCandidateRes, 201);
  const questionCandidateSet = questionCandidateRes.json() as V1bFlowResult['questionCandidateSet'];
  assert.ok(questionCandidateSet.candidates[0]?.topic_question_candidate_id);

  const questionSelectionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-question-candidate-sets/${encodeURIComponent(questionCandidateSet.candidate_set.topic_question_candidate_set_id)}/selection-decisions`,
    payload: {
      candidate_set_id: 'ignored-by-path',
      decision: 'admit',
      admitted_candidate_ids: [questionCandidateSet.candidates[0].topic_question_candidate_id],
      decided_by: 'human',
      decision_rationale: 'Refined question is answerable within the existing slice.',
      confidence: 0.87,
    },
  });
  assertStatus(questionSelectionRes, 201);
  const questionSelection = questionSelectionRes.json() as V1bFlowResult['questionSelection'];
  const contractId = questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id;
  assert.ok(contractId);

  return {
    questionCandidateSet,
    questionSelection,
    ...(await runV1bValuePassFromQuestionContract(app, contractId)),
  };
}

async function runV1bHttpFlow(
  app: FastifyInstance,
  suffix: string,
  options: { stopAtAssessment?: boolean } = {},
): Promise<V1bFlowResult> {
  const base = await createV1bInputBundle(app, suffix);

  const intakeRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/intake-snapshots',
    payload: {
      v1b_input_bundle_id: base.v1bInputBundleId,
      created_by: 'system',
    },
  });
  assertStatus(intakeRes, 201);
  const intakeSnapshot = intakeRes.json() as V1bFlowResult['intakeSnapshot'];

  const profileRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/research-constraint-profiles',
    payload: {
      v1b_intake_snapshot_id: intakeSnapshot.v1b_intake_snapshot_id,
      target_community: 'LLM systems researchers',
      target_venue_class: 'systems',
      intended_contribution_style: 'workflow system',
      method_constraints: ['offline replay evaluation'],
      resource_constraints: ['single workstation'],
      available_assets: ['paper corpus', 'review rubric'],
      feasibility_budget: { person_weeks: 2 },
      non_goals: ['Do not target production deployment'],
      claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
      created_by: 'human',
    },
  });
  assertStatus(profileRes, 201);
  const constraintProfile = profileRes.json() as V1bFlowResult['constraintProfile'];

  const readinessRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/intake-readiness-assessments',
    payload: {
      v1b_intake_snapshot_id: intakeSnapshot.v1b_intake_snapshot_id,
      research_constraint_profile_id: constraintProfile.research_constraint_profile_id,
      assessed_by: 'system',
    },
  });
  assertStatus(readinessRes, 201);
  const readiness = readinessRes.json() as V1bFlowResult['readiness'];
  assert.equal(readiness.recommendation, 'ready_for_slice');

  const sliceOptionsRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/research-slice-option-sets',
    payload: {
      readiness_assessment_id: readiness.v1b_intake_readiness_assessment_id,
      triggered_by: 'system',
    },
  });
  assertStatus(sliceOptionsRes, 201);
  const sliceOptionSet = sliceOptionsRes.json() as V1bFlowResult['sliceOptionSet'];
  assert.ok(sliceOptionSet.options[0]?.research_slice_option_id);

  const sliceSelectionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/research-slice-option-sets/${encodeURIComponent(sliceOptionSet.option_set.research_slice_option_set_id)}/selection-decisions`,
    payload: {
      option_set_id: 'ignored-by-path',
      decision: 'select',
      selected_option_id: sliceOptionSet.options[0].research_slice_option_id,
      decided_by: 'human',
      selection_rationale: 'Selected as the most bounded option.',
      confidence: 0.84,
    },
  });
  assertStatus(sliceSelectionRes, 201);
  const sliceSelection = sliceSelectionRes.json() as V1bFlowResult['sliceSelection'];
  assert.ok(sliceSelection.research_slice?.research_slice_id);

  const questionCandidateRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-question-candidate-sets',
    payload: {
      research_slice_id: sliceSelection.research_slice.research_slice_id,
      triggered_by: 'system',
    },
  });
  assertStatus(questionCandidateRes, 201);
  const questionCandidateSet = questionCandidateRes.json() as V1bFlowResult['questionCandidateSet'];
  assert.ok(questionCandidateSet.candidates[0]?.topic_question_candidate_id);

  const questionSelectionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-question-candidate-sets/${encodeURIComponent(questionCandidateSet.candidate_set.topic_question_candidate_set_id)}/selection-decisions`,
    payload: {
      candidate_set_id: 'ignored-by-path',
      decision: 'admit',
      admitted_candidate_ids: [questionCandidateSet.candidates[0].topic_question_candidate_id],
      decided_by: 'human',
      decision_rationale: 'Question is answerable and within the selected slice.',
      confidence: 0.85,
    },
  });
  assertStatus(questionSelectionRes, 201);
  const questionSelection = questionSelectionRes.json() as V1bFlowResult['questionSelection'];
  const contractId = questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id;
  assert.ok(contractId);

  const valueAssessmentRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-value-assessments',
    payload: {
      topic_question_contract_id: contractId,
      triggered_by: 'system',
    },
  });
  assertStatus(valueAssessmentRes, 201);
  const valueAssessment = valueAssessmentRes.json() as V1bFlowResult['valueAssessment'];
  assert.ok(valueAssessment.topic_value_assessment.topic_value_assessment_id);

  const result: V1bFlowResult = {
    ...base,
    intakeSnapshot,
    constraintProfile,
    readiness,
    sliceOptionSet,
    sliceSelection,
    questionCandidateSet,
    questionSelection,
    valueAssessment,
  };
  if (options.stopAtAssessment) {
    return result;
  }

  const dispositionRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(valueAssessment.topic_value_assessment.topic_value_assessment_id)}/disposition-decisions`,
    payload: {
      topic_value_assessment_id: 'ignored-by-path',
      decision: 'advance_to_package',
      decided_by: 'human',
      decision_rationale: 'Advance only to draft package for v1c handoff.',
    },
  });
  assertStatus(dispositionRes, 201);
  const disposition = dispositionRes.json() as { value_disposition_decision_id: string; decision: string };
  assert.equal(disposition.decision, 'advance_to_package');

  const packageRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1b/topic-packages/drafts',
    payload: {
      value_disposition_decision_id: disposition.value_disposition_decision_id,
      created_by: 'system',
    },
  });
  assertStatus(packageRes, 201);
  const draftPackage = packageRes.json() as {
    topic_package: { topic_package_id: string; package_readiness_status: string };
  };
  assert.equal(draftPackage.topic_package.package_readiness_status, 'ready_for_promotion_review');

  const readPackageRes = await app.inject({
    method: 'GET',
    url: `/topic-selection/v1b/topic-packages/${encodeURIComponent(draftPackage.topic_package.topic_package_id)}`,
  });
  assertStatus(readPackageRes, 200);
  const readPackage = readPackageRes.json() as { topic_package_id: string; package_readiness_status: string };
  assert.equal(readPackage.topic_package_id, draftPackage.topic_package.topic_package_id);
  assert.equal(readPackage.package_readiness_status, 'ready_for_promotion_review');

  const bundleRes = await app.inject({
    method: 'POST',
    url: `/topic-selection/v1b/topic-packages/${encodeURIComponent(draftPackage.topic_package.topic_package_id)}/v1c-input-bundles`,
  });
  assertStatus(bundleRes, 200);
  const v1cBundle = bundleRes.json() as {
    topic_package_id: string;
    value_disposition_decision_ref: TopicSelectionFunctionalRef;
  };
  assert.equal(v1cBundle.topic_package_id, draftPackage.topic_package.topic_package_id);
  assert.equal(v1cBundle.value_disposition_decision_ref.ref_id, disposition.value_disposition_decision_id);

  return {
    ...result,
    disposition,
    draftPackage,
  };
}

test('topic-selection v1b HTTP routes drive v1b input bundle to draft package and v1c handoff', async () => {
  const fakeLlmGateway = new FakeTopicSelectionV1bLlmGateway();
  const app = buildApp({ topicSelectionV1bLlmGateway: fakeLlmGateway });
  try {
    const result = await runV1bHttpFlow(app, uniqueId('v1b-api'));

    assert.equal(result.draftPackage?.topic_package.package_readiness_status, 'ready_for_promotion_review');
    assert.deepEqual(
      fakeLlmGateway.calls.map((call) => call.schemaName),
      [
        'topic_selection_research_slice_option_set',
        'topic_selection_topic_question_candidate_set',
        'topic_selection_topic_value_assessment',
      ],
    );
  } finally {
    await app.close();
  }
});

test('topic-selection v1b HTTP loopback re-enters from refine_slice and advances after refinement', async () => {
  const fakeLlmGateway = new FakeTopicSelectionV1bLlmGateway({
    valueAssessmentSequence: ['needs_refinement', 'ready'],
  });
  const app = buildApp({ topicSelectionV1bLlmGateway: fakeLlmGateway });
  try {
    const firstPass = await runV1bHttpFlow(app, uniqueId('v1b-loopback'), { stopAtAssessment: true });
    const firstAssessment = firstPass.valueAssessment.topic_value_assessment as unknown as {
      topic_value_assessment_id: string;
      readiness_status: string;
    };
    assert.equal(firstAssessment.readiness_status, 'needs_refinement');

    const loopbackRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(firstAssessment.topic_value_assessment_id)}/disposition-decisions`,
      payload: {
        topic_value_assessment_id: 'ignored-by-path',
        decision: 'refine_slice',
        decided_by: 'human',
        decision_rationale: 'Return to ResearchSlice because evidence sanity failed.',
        required_actions: ['narrow slice and refresh baseline/challenge evidence'],
      },
    });
    assertStatus(loopbackRes, 201);
    const loopback = loopbackRes.json() as {
      value_disposition_decision_id: string;
      decision: string;
      loopback_target_ref: TopicSelectionFunctionalRef;
      package_draft_input: unknown;
    };
    assert.equal(loopback.decision, 'refine_slice');
    assert.equal(loopback.loopback_target_ref.ref_type, 'research_slice');
    assert.equal(
      loopback.loopback_target_ref.ref_id,
      firstPass.sliceSelection.research_slice?.research_slice_id,
    );
    assert.equal(loopback.package_draft_input, null);

    const blockedPackageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/topic-packages/drafts',
      payload: {
        value_disposition_decision_id: loopback.value_disposition_decision_id,
        created_by: 'system',
      },
    });
    assert.equal(blockedPackageRes.statusCode, 409);
    const blockedPackage = blockedPackageRes.json() as { error: { code: string; message: string } };
    assert.equal(blockedPackage.error.code, 'GATE_CONSTRAINT_FAILED');
    assert.match(blockedPackage.error.message, /advance_to_package/);

    const refinedPass = await runV1bDraftingPassFromReadiness(
      app,
      firstPass.readiness.v1b_intake_readiness_assessment_id,
    );
    const refinedAssessment = refinedPass.valueAssessment.topic_value_assessment as unknown as {
      readiness_status: string;
    };
    assert.equal(refinedAssessment.readiness_status, 'ready');
    assert.notEqual(
      refinedPass.sliceSelection.research_slice?.research_slice_id,
      firstPass.sliceSelection.research_slice?.research_slice_id,
    );
    assert.notEqual(
      refinedPass.questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id,
      firstPass.questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id,
    );
    assert.equal(refinedPass.disposition?.decision, 'advance_to_package');
    assert.equal(refinedPass.draftPackage?.topic_package.package_readiness_status, 'ready_for_promotion_review');
    assert.deepEqual(
      fakeLlmGateway.calls.map((call) => call.schemaName),
      [
        'topic_selection_research_slice_option_set',
        'topic_selection_topic_question_candidate_set',
        'topic_selection_topic_value_assessment',
        'topic_selection_research_slice_option_set',
        'topic_selection_topic_question_candidate_set',
        'topic_selection_topic_value_assessment',
      ],
    );
  } finally {
    await app.close();
  }
});

test('topic-selection v1b HTTP loopback re-enters from refine_question and advances after reframing', async () => {
  const fakeLlmGateway = new FakeTopicSelectionV1bLlmGateway({
    valueAssessmentSequence: ['refine_question', 'ready'],
  });
  const app = buildApp({ topicSelectionV1bLlmGateway: fakeLlmGateway });
  try {
    const firstPass = await runV1bHttpFlow(app, uniqueId('v1b-refine-question'), { stopAtAssessment: true });
    const firstAssessment = firstPass.valueAssessment.topic_value_assessment as unknown as {
      topic_value_assessment_id: string;
      readiness_status: string;
    };
    const firstContractId =
      firstPass.questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id;
    assert.ok(firstContractId);
    assert.equal(firstAssessment.readiness_status, 'needs_refinement');

    const loopbackRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(firstAssessment.topic_value_assessment_id)}/disposition-decisions`,
      payload: {
        topic_value_assessment_id: 'ignored-by-path',
        decision: 'refine_question',
        decided_by: 'human',
        decision_rationale: 'Return to TopicQuestionContract because the question framing failed value checks.',
        required_actions: ['separate workflow value from metric scope and regenerate the question contract'],
      },
    });
    assertStatus(loopbackRes, 201);
    const loopback = loopbackRes.json() as {
      value_disposition_decision_id: string;
      decision: string;
      loopback_target_ref: TopicSelectionFunctionalRef;
      package_draft_input: unknown;
    };
    assert.equal(loopback.decision, 'refine_question');
    assert.equal(loopback.loopback_target_ref.ref_type, 'topic_question_contract');
    assert.equal(loopback.loopback_target_ref.ref_id, firstContractId);
    assert.equal(loopback.package_draft_input, null);
    assert.equal((loopback as { status?: string }).status, 'active');
    assert.equal((loopback as { is_current?: boolean }).is_current, true);
    assert.equal((loopback as { output_topic_package_id?: string | null }).output_topic_package_id, null);

    const blockedPackageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/topic-packages/drafts',
      payload: {
        value_disposition_decision_id: loopback.value_disposition_decision_id,
        created_by: 'system',
      },
    });
    assert.equal(blockedPackageRes.statusCode, 409);
    const blockedPackage = blockedPackageRes.json() as { error: { code: string; message: string } };
    assert.equal(blockedPackage.error.code, 'GATE_CONSTRAINT_FAILED');
    assert.match(blockedPackage.error.message, /advance_to_package/);

    const forcedAdvanceRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(firstAssessment.topic_value_assessment_id)}/disposition-decisions`,
      payload: {
        topic_value_assessment_id: 'ignored-by-path',
        decision: 'advance_to_package',
        decided_by: 'human',
        decision_rationale: 'This should fail because the original assessment was not ready.',
      },
    });
    assert.equal(forcedAdvanceRes.statusCode, 409);
    const forcedAdvance = forcedAdvanceRes.json() as { error: { code: string; message: string } };
    assert.equal(forcedAdvance.error.code, 'GATE_CONSTRAINT_FAILED');
    assert.match(forcedAdvance.error.message, /requires ready value assessment/);

    const refinedPass = await runV1bQuestionValuePassFromSlice(
      app,
      firstPass.sliceSelection.research_slice?.research_slice_id ?? '',
    );
    const refinedAssessment = refinedPass.valueAssessment.topic_value_assessment as unknown as {
      readiness_status: string;
    };
    const firstMaterialization = firstPass.questionSelection.materializations[0];
    const refinedMaterialization = refinedPass.questionSelection.materializations[0];
    assert.ok(firstMaterialization);
    assert.ok(refinedMaterialization);
    const sourceResearchSliceId = firstPass.sliceSelection.research_slice?.research_slice_id;
    assert.ok(sourceResearchSliceId);
    assert.equal(
      refinedMaterialization.topic_question_contract.source_research_slice_id,
      sourceResearchSliceId,
    );
    assert.equal(
      refinedMaterialization.topic_question_contract.source_research_slice_version,
      firstMaterialization.topic_question_contract.source_research_slice_version,
    );
    assert.deepEqual(
      refinedMaterialization.topic_question_contract.accepted_risk_refs,
      firstMaterialization.topic_question_contract.accepted_risk_refs,
    );
    const requiredEvidenceRoles = ['support', 'challenge', 'baseline', 'context'] as const;
    const refinedEvidenceRoles = new Set(refinedMaterialization.evidence_refs.map((record) => record.evidence_role));
    for (const requiredRole of requiredEvidenceRoles) {
      assert.equal(refinedEvidenceRoles.has(requiredRole), true, `missing repaired evidence role ${requiredRole}`);
    }
    assert.equal(refinedMaterialization.boundary_refs.length > 0, true);
    assert.equal(
      refinedMaterialization.boundary_refs.every((record) => record.research_slice_boundary_id.length > 0),
      true,
    );
    assert.equal(refinedMaterialization.assumption_refs.length > 0, true);
    assert.equal(
      refinedMaterialization.assumption_refs.some((record) => Boolean(record.source_assumption_id)),
      true,
    );
    const refinedSnapshot = (refinedPass.valueAssessment as unknown as {
      topic_value_input_snapshot: {
        topic_question_contract_ref: TopicSelectionFunctionalRef;
        research_slice_ref: TopicSelectionFunctionalRef;
        evidence_refs: Array<{ evidence_role: string; evidence_ref: TopicSelectionFunctionalRef }>;
        boundary_refs: unknown[];
        assumption_refs: unknown[];
      };
    }).topic_value_input_snapshot;
    assert.equal(refinedSnapshot.topic_question_contract_ref.ref_id, refinedMaterialization.topic_question_contract.topic_question_contract_id);
    assert.equal(refinedSnapshot.research_slice_ref.ref_id, sourceResearchSliceId);
    const refinedSnapshotEvidenceRoles = new Set(refinedSnapshot.evidence_refs.map((record) => record.evidence_role));
    for (const requiredRole of requiredEvidenceRoles) {
      assert.equal(
        refinedSnapshotEvidenceRoles.has(requiredRole),
        true,
        `missing repaired value snapshot evidence role ${requiredRole}`,
      );
    }
    assert.equal(refinedSnapshot.boundary_refs.length, refinedMaterialization.boundary_refs.length);
    assert.equal(refinedSnapshot.assumption_refs.length, refinedMaterialization.assumption_refs.length);
    assert.equal(refinedAssessment.readiness_status, 'ready');
    assert.notEqual(
      refinedPass.questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id,
      firstContractId,
    );
    assert.equal(refinedPass.disposition?.decision, 'advance_to_package');
    assert.equal(refinedPass.draftPackage?.topic_package.package_readiness_status, 'ready_for_promotion_review');

    const staleLoopbackPackageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/topic-packages/drafts',
      payload: {
        value_disposition_decision_id: loopback.value_disposition_decision_id,
        created_by: 'system',
      },
    });
    assert.equal(staleLoopbackPackageRes.statusCode, 409);
    const staleLoopbackPackage = staleLoopbackPackageRes.json() as { error: { code: string; message: string } };
    assert.equal(staleLoopbackPackage.error.code, 'GATE_CONSTRAINT_FAILED');
    assert.match(staleLoopbackPackage.error.message, /advance_to_package/);
    assert.deepEqual(
      fakeLlmGateway.calls.map((call) => call.schemaName),
      [
        'topic_selection_research_slice_option_set',
        'topic_selection_topic_question_candidate_set',
        'topic_selection_topic_value_assessment',
        'topic_selection_topic_question_candidate_set',
        'topic_selection_topic_value_assessment',
      ],
    );
  } finally {
    await app.close();
  }
});

test('topic-selection v1b HTTP loopback rechecks evidence and advances after reassessment', async () => {
  const fakeLlmGateway = new FakeTopicSelectionV1bLlmGateway({
    valueAssessmentSequence: ['recheck_required', 'ready'],
  });
  const app = buildApp({ topicSelectionV1bLlmGateway: fakeLlmGateway });
  try {
    const firstPass = await runV1bHttpFlow(app, uniqueId('v1b-recheck-evidence'), { stopAtAssessment: true });
    const firstAssessment = firstPass.valueAssessment.topic_value_assessment as unknown as {
      topic_value_assessment_id: string;
      readiness_status: string;
    };
    const contractId =
      firstPass.questionSelection.materializations[0]?.topic_question_contract.topic_question_contract_id;
    assert.ok(contractId);
    assert.equal(firstAssessment.readiness_status, 'recheck_required');

    const loopbackRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(firstAssessment.topic_value_assessment_id)}/disposition-decisions`,
      payload: {
        topic_value_assessment_id: 'ignored-by-path',
        decision: 'recheck_evidence_or_search',
        decided_by: 'human',
        decision_rationale: 'Return to evidence/search recheck because freshness blocks package drafting.',
        required_actions: ['refresh or recheck evidence before reassessing the question contract'],
      },
    });
    assertStatus(loopbackRes, 201);
    const loopback = loopbackRes.json() as {
      value_disposition_decision_id: string;
      decision: string;
      loopback_target_ref: TopicSelectionFunctionalRef;
      package_draft_input: unknown;
    };
    assert.equal(loopback.decision, 'recheck_evidence_or_search');
    assert.equal(loopback.loopback_target_ref.ref_type, 'recheck_request');
    assert.equal(loopback.loopback_target_ref.ref_id, 'pending');
    assert.equal(loopback.package_draft_input, null);

    const blockedPackageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/topic-packages/drafts',
      payload: {
        value_disposition_decision_id: loopback.value_disposition_decision_id,
        created_by: 'system',
      },
    });
    assert.equal(blockedPackageRes.statusCode, 409);
    const blockedPackage = blockedPackageRes.json() as { error: { code: string; message: string } };
    assert.equal(blockedPackage.error.code, 'GATE_CONSTRAINT_FAILED');
    assert.match(blockedPackage.error.message, /advance_to_package/);

    const reassessedPass = await runV1bValuePassFromQuestionContract(app, contractId);
    const reassessed = reassessedPass.valueAssessment.topic_value_assessment as unknown as {
      topic_value_assessment_id: string;
      readiness_status: string;
    };
    assert.equal(reassessed.readiness_status, 'ready');
    assert.notEqual(reassessed.topic_value_assessment_id, firstAssessment.topic_value_assessment_id);
    assert.equal(reassessedPass.disposition?.decision, 'advance_to_package');
    assert.equal(reassessedPass.draftPackage?.topic_package.package_readiness_status, 'ready_for_promotion_review');
    assert.deepEqual(
      fakeLlmGateway.calls.map((call) => call.schemaName),
      [
        'topic_selection_research_slice_option_set',
        'topic_selection_topic_question_candidate_set',
        'topic_selection_topic_value_assessment',
        'topic_selection_topic_value_assessment',
      ],
    );
  } finally {
    await app.close();
  }
});

test('topic-selection v1b routes reject malformed payloads and invalid enum decisions', async () => {
  const app = buildApp({ topicSelectionV1bLlmGateway: new FakeTopicSelectionV1bLlmGateway() });
  try {
    const malformedRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/research-slice-option-sets',
      payload: {},
    });
    assert.equal(malformedRes.statusCode, 400);
    const malformed = malformedRes.json() as { error: { code: string; message: string } };
    assert.equal(malformed.error.code, 'INVALID_PAYLOAD');
    assert.match(malformed.error.message, /readiness_assessment_id/);

    const invalidEnumRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/research-slice-option-sets/option-set-route/selection-decisions',
      payload: {
        decision: 'bogus',
        selection_rationale: 'Should fail at route schema.',
      },
    });
    assert.equal(invalidEnumRes.statusCode, 400);
    const invalidEnum = invalidEnumRes.json() as { error: { code: string } };
    assert.equal(invalidEnum.error.code, 'INVALID_PAYLOAD');

    const invalidReplayCaseTypeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/offline-evaluation/cases',
      payload: {
        dataset_id: 'offline-evaluation-dataset-route',
        case_key: 'v1a-case-type-through-v1b-api',
        case_type: 'true_unmet_need',
        frozen_input_bundle: {
          stage: 'v1b',
          frozen_at: '2026-05-14T00:00:00.000Z',
          source_refs: [],
          artifact_refs: [],
          stage_snapshots: {},
          payload: {},
        },
        gold_expectation: minimalReplayGoldExpectation(),
      },
    });
    assert.equal(invalidReplayCaseTypeRes.statusCode, 400);
    const invalidReplayCaseType = invalidReplayCaseTypeRes.json() as { error: { code: string } };
    assert.equal(invalidReplayCaseType.error.code, 'INVALID_PAYLOAD');

    const invalidReplayMetricRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/offline-evaluation/runs',
      payload: {
        dataset_id: 'offline-evaluation-dataset-route',
        workflow_profile_key: 'topic-selection-v1b-frozen-fixture',
        metric_keys: ['false_gap_rate'],
      },
    });
    assert.equal(invalidReplayMetricRes.statusCode, 400);
    const invalidReplayMetric = invalidReplayMetricRes.json() as { error: { code: string } };
    assert.equal(invalidReplayMetric.error.code, 'INVALID_PAYLOAD');
  } finally {
    await app.close();
  }
});

test('topic-selection v1b draft package route maps non-advance disposition conflicts', async () => {
  const app = buildApp({ topicSelectionV1bLlmGateway: new FakeTopicSelectionV1bLlmGateway() });
  try {
    const flow = await runV1bHttpFlow(app, uniqueId('v1b-non-advance'), { stopAtAssessment: true });
    const dispositionRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(flow.valueAssessment.topic_value_assessment.topic_value_assessment_id)}/disposition-decisions`,
      payload: {
        topic_value_assessment_id: 'ignored-by-path',
        decision: 'park',
        decided_by: 'human',
        decision_rationale: 'Park until the question is narrowed.',
        required_actions: ['narrow question'],
      },
    });
    assertStatus(dispositionRes, 201);
    const disposition = dispositionRes.json() as { value_disposition_decision_id: string; decision: string };
    assert.equal(disposition.decision, 'park');

    const packageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/topic-packages/drafts',
      payload: {
        value_disposition_decision_id: disposition.value_disposition_decision_id,
        created_by: 'system',
      },
    });
    assert.equal(packageRes.statusCode, 409);
    const body = packageRes.json() as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'GATE_CONSTRAINT_FAILED');
    assert.match(body.error.message, /advance_to_package/);
  } finally {
    await app.close();
  }
});

test('topic-selection v1b offline replay HTTP routes calculate metrics and expose diffs', async () => {
  const app = buildApp({ topicSelectionV1bLlmGateway: new FakeTopicSelectionV1bLlmGateway() });
  try {
    const datasetRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/offline-evaluation/datasets/synthetic-baseline',
    });
    assertStatus(datasetRes, 201);
    const synthetic = datasetRes.json() as {
      dataset: { offline_evaluation_dataset_id: string; stage: string; case_count: number };
      cases: TopicSelectionOfflineEvaluationCaseRecord[];
    };
    assert.equal(synthetic.dataset.stage, 'v1b');
    assert.equal(synthetic.dataset.case_count, 6);
    assert.equal(synthetic.cases.every((record) => record.frozen_input_bundle.stage === 'v1b'), true);

    const runRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1b/offline-evaluation/runs',
      payload: {
        dataset_id: synthetic.dataset.offline_evaluation_dataset_id,
        workflow_profile_key: 'topic-selection-v1b-frozen-fixture',
        workflow_profile_version: 'v1',
      },
    });
    assertStatus(runRes, 201);
    const run = runRes.json() as { offline_evaluation_run_id: string };

    for (const evaluationCase of synthetic.cases) {
      const resultRes = await app.inject({
        method: 'POST',
        url: '/topic-selection/v1b/offline-evaluation/case-results',
        payload: {
          run_id: run.offline_evaluation_run_id,
          case_id: evaluationCase.offline_evaluation_case_id,
          observed_output: evaluationCase.frozen_input_bundle.payload.fixture_observed_output as TopicSelectionOfflineEvaluationObservedOutput,
        },
      });
      assertStatus(resultRes, 201);
    }

    const completeRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1b/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/complete`,
    });
    assertStatus(completeRes, 200);

    const metricRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1b/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/metric-results`,
    });
    assertStatus(metricRes, 200);
    const metrics = metricRes.json() as { items: Array<{ metric_key: string; numerator: number; denominator: number }> };
    assert.deepEqual(
      new Set(metrics.items.map((item) => item.metric_key)),
      new Set(TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS),
    );

    const diffRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1b/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/replay-diffs`,
    });
    assertStatus(diffRes, 200);
    const diffs = diffRes.json() as { items: Array<{ changed_dimensions: string[] }> };
    const changedDimensions = new Set(diffs.items.flatMap((record) => record.changed_dimensions));
    for (const dimension of [
      'slice_boundary',
      'answerability_verdict',
      'value_claim',
      'package_trace',
      'package_readiness',
      'loopback_cause',
    ]) {
      assert.equal(changedDimensions.has(dimension), true, `missing replay diff dimension ${dimension}`);
    }
  } finally {
    await app.close();
  }
});

test('T-054 Prisma HTTP smoke requires DATABASE_URL and drives v1b routes against Prisma repositories', async () => {
  await assertPrismaHttpSmokeDatabaseReady();
  const previousEnv = {
    TITLE_CARD_REPOSITORY: process.env.TITLE_CARD_REPOSITORY,
    RESEARCH_LIFECYCLE_REPOSITORY: process.env.RESEARCH_LIFECYCLE_REPOSITORY,
    AUTO_PULL_REPOSITORY: process.env.AUTO_PULL_REPOSITORY,
    APPLICATION_SETTINGS_REPOSITORY: process.env.APPLICATION_SETTINGS_REPOSITORY,
    AUTO_PULL_SCHEDULER_ENABLED: process.env.AUTO_PULL_SCHEDULER_ENABLED,
  };
  process.env.TITLE_CARD_REPOSITORY = 'prisma';
  process.env.RESEARCH_LIFECYCLE_REPOSITORY = 'prisma';
  process.env.AUTO_PULL_REPOSITORY = 'prisma';
  process.env.APPLICATION_SETTINGS_REPOSITORY = 'prisma';
  process.env.AUTO_PULL_SCHEDULER_ENABLED = 'false';

  const app = buildApp({ topicSelectionV1bLlmGateway: new FakeTopicSelectionV1bLlmGateway() });
  try {
    const result = await runV1bHttpFlow(app, uniqueId('v1b-prisma'));
    assert.equal(result.draftPackage?.topic_package.package_readiness_status, 'ready_for_promotion_review');
  } finally {
    await app.close();
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key as keyof NodeJS.ProcessEnv];
      } else {
        process.env[key as keyof NodeJS.ProcessEnv] = value;
      }
    }
  }
});
