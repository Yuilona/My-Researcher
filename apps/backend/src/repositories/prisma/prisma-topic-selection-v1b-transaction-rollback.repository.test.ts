import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPlanResearchSliceRunRecord,
  TopicSelectionResearchSliceAssumptionRecord,
  TopicSelectionResearchSliceBoundaryRecord,
  TopicSelectionResearchSliceEvidenceRefRecord,
  TopicSelectionResearchSliceOptionRecord,
  TopicSelectionResearchSliceOptionSetRecord,
  TopicSelectionResearchSliceRecord,
  TopicSelectionSliceSelectionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionFormTopicQuestionRunRecord,
  TopicSelectionQuestionFrameRecord,
  TopicSelectionTopicQuestionAnswerabilityPlanRecord,
  TopicSelectionTopicQuestionAssumptionRefRecord,
  TopicSelectionTopicQuestionBoundaryRefRecord,
  TopicSelectionTopicQuestionCandidateRecord,
  TopicSelectionTopicQuestionCandidateSetRecord,
  TopicSelectionTopicQuestionContractRecord,
  TopicSelectionTopicQuestionEvidenceRefRecord,
  TopicSelectionTopicQuestionFalsificationConditionRecord,
  TopicSelectionTopicQuestionNeedRefRecord,
  TopicSelectionTopicQuestionRecord,
  TopicSelectionTopicQuestionSelectionDecisionRecord,
  TopicSelectionV1bTopicQuestionMaterialization,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import type {
  TopicSelectionAssessTopicValueRunRecord,
  TopicSelectionTopicValueAssessmentInputSnapshotRecord,
  TopicSelectionTopicValueAssessmentRecord,
  TopicSelectionTopicValueEvidenceRefRecord,
  TopicSelectionValueDispositionDecisionRecord,
  TopicSelectionV1bPackageDraftInput,
  TopicSelectionValueReasoningMemoRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import type {
  TopicSelectionPackageTraceBoundaryCheckRecord,
  TopicSelectionTopicPackageReadinessAssessmentRecord,
  TopicSelectionTopicPackageRecord,
  TopicSelectionV1bToV1cInputBundleRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-package-contracts';
import type {
  TopicSelectionResearchSliceCreation,
  TopicSelectionResearchSlicePlanningPersistence,
} from '../topic-selection-v1b-research-slice.repository.js';
import type {
  TopicSelectionTopicQuestionCandidatePersistence,
  TopicSelectionTopicQuestionSelectionPersistence,
} from '../topic-selection-v1b-topic-question.repository.js';
import type {
  TopicSelectionTopicValueAssessmentPersistence,
} from '../topic-selection-v1b-value-assessment.repository.js';
import type {
  TopicSelectionV1bTopicPackageAuthorityPersistence,
} from '../topic-selection-v1b-topic-package.repository.js';
import { PrismaTopicSelectionV1bResearchSliceRepository } from './prisma-topic-selection-v1b-research-slice-repository.js';
import { PrismaTopicSelectionV1bTopicQuestionRepository } from './prisma-topic-selection-v1b-topic-question-repository.js';
import { PrismaTopicSelectionV1bTopicPackageRepository } from './prisma-topic-selection-v1b-topic-package-repository.js';
import { PrismaTopicSelectionV1bValueAssessmentRepository } from './prisma-topic-selection-v1b-value-assessment-repository.js';

const RUN_PRISMA_ROLLBACK = Boolean(process.env.DATABASE_URL);
const FIXED_NOW = '2026-05-26T00:00:00.000Z';

type RollbackContext = {
  prisma: PrismaClient;
  titleCardId: string;
  id(prefix: string): string;
  ref(refType: string, refId: string, versionId?: string | null): TopicSelectionFunctionalRef;
  researchSliceRepository: PrismaTopicSelectionV1bResearchSliceRepository;
  topicQuestionRepository: PrismaTopicSelectionV1bTopicQuestionRepository;
  valueAssessmentRepository: PrismaTopicSelectionV1bValueAssessmentRepository;
  topicPackageRepository: PrismaTopicSelectionV1bTopicPackageRepository;
};

type SharedSliceIds = {
  readinessId: string;
  intakeSnapshotId: string;
  constraintProfileId: string;
  inputBundleId: string;
  validatedNeedId: string;
  evidenceMapId: string;
  searchRunId: string;
  searchPlanId: string;
  literatureSnapshotId: string;
};

type SeededQuestion = {
  questionId: string;
  questionRecordId: string;
  contractId: string;
  answerabilityPlanId: string;
  researchSliceId: string;
  researchSliceVersion: string;
};

type SeededAssessment = {
  assessmentId: string;
  assessmentRecordId: string;
  memoId: string;
  dispositionDecisionId: string;
};

function prismaRollbackTest(
  name: string,
  fn: (ctx: RollbackContext) => Promise<void>,
): void {
  test(name, {
    skip: RUN_PRISMA_ROLLBACK ? false : 'set DATABASE_URL to run Prisma-backed v1b rollback tests',
  }, async () => {
    const databaseUrl = process.env.DATABASE_URL;
    assert.ok(databaseUrl, 'DATABASE_URL is required for Prisma-backed v1b rollback tests.');
    const prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl },
      },
    });
    const runKey = `v1b_rb_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const titleCardId = `title_card_${runKey}`;
    let sequence = 0;
    const ctx: RollbackContext = {
      prisma,
      titleCardId,
      id: (prefix) => `${prefix}_${runKey}_${++sequence}`,
      ref: (refType, refId, versionId = null) => ({
        ref_type: refType,
        ref_id: refId,
        title_card_id: titleCardId,
        version_id: versionId,
      }),
      researchSliceRepository: new PrismaTopicSelectionV1bResearchSliceRepository(prisma),
      topicQuestionRepository: new PrismaTopicSelectionV1bTopicQuestionRepository(prisma),
      valueAssessmentRepository: new PrismaTopicSelectionV1bValueAssessmentRepository(prisma),
      topicPackageRepository: new PrismaTopicSelectionV1bTopicPackageRepository(prisma),
    };

    try {
      await assertDatabaseReady(prisma);
      await cleanupTitleCardScope(prisma, titleCardId);
      await fn(ctx);
    } finally {
      await cleanupTitleCardScope(prisma, titleCardId);
      await prisma.$disconnect();
    }
  });
}

async function assertDatabaseReady(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$queryRaw`SELECT 1 FROM "TopicResearchRecord" LIMIT 1`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.fail(
      [
        'DATABASE_URL for Prisma-backed v1b rollback tests must point at a reachable Postgres database',
        `with repo migrations applied. Underlying Prisma error: ${message}`,
      ].join(' '),
    );
  }
}

async function cleanupTitleCardScope(prisma: PrismaClient, titleCardId: string): Promise<void> {
  await prisma.$transaction([
    prisma.topicSelectionV1bToV1cInputBundle.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicPackageReadinessAssessment.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionPackageTraceBoundaryCheck.deleteMany({ where: { titleCardId } }),
    prisma.titleCardPackage.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionValueDispositionDecision.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicValueEvidenceRef.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionValueReasoningMemo.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicValueAssessmentInputSnapshot.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionAssessTopicValueRun.deleteMany({ where: { titleCardId } }),
    prisma.titleCardValueAssessment.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionFalsificationCondition.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionAssumptionRef.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionBoundaryRef.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionEvidenceRef.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionNeedRef.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionAnswerabilityPlan.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionContract.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionSelectionDecision.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionCandidate.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionTopicQuestionCandidateSet.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionQuestionFrame.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionFormTopicQuestionRun.deleteMany({ where: { titleCardId } }),
    prisma.titleCardResearchQuestion.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionResearchSliceAssumption.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionResearchSliceBoundary.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionResearchSliceEvidenceRef.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionResearchSlice.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionSliceSelectionDecision.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionResearchSliceOption.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionResearchSliceOptionSet.deleteMany({ where: { titleCardId } }),
    prisma.topicSelectionPlanResearchSliceRun.deleteMany({ where: { titleCardId } }),
    prisma.titleCardResearchRecord.deleteMany({ where: { titleCardId } }),
  ]);
}

function json<T>(value: T): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function assertRejectsWithPrismaCode(
  fn: () => Promise<unknown>,
  expectedCodes: string[],
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    assert.ok(
      error instanceof Prisma.PrismaClientKnownRequestError,
      `Expected PrismaClientKnownRequestError, received ${error instanceof Error ? error.message : String(error)}`,
    );
    assert.ok(
      expectedCodes.includes(error.code),
      `Expected Prisma error ${expectedCodes.join(' or ')}, received ${error.code}.`,
    );
    return;
  }
  assert.fail(`Expected Prisma error ${expectedCodes.join(' or ')}.`);
}

function sharedSliceIds(ctx: RollbackContext): SharedSliceIds {
  return {
    readinessId: ctx.id('v1b_intake_readiness'),
    intakeSnapshotId: ctx.id('v1b_intake_snapshot'),
    constraintProfileId: ctx.id('constraint_profile'),
    inputBundleId: ctx.id('v1b_input_bundle'),
    validatedNeedId: ctx.id('validated_need'),
    evidenceMapId: ctx.id('evidence_map'),
    searchRunId: ctx.id('search_run'),
    searchPlanId: ctx.id('search_plan'),
    literatureSnapshotId: ctx.id('literature_snapshot'),
  };
}

function makePlanRun(
  ctx: RollbackContext,
  ids: SharedSliceIds,
  planRunId = ctx.id('plan_run'),
): TopicSelectionPlanResearchSliceRunRecord {
  return {
    plan_research_slice_run_id: planRunId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    v1b_intake_readiness_assessment_id: ids.readinessId,
    v1b_intake_snapshot_id: ids.intakeSnapshotId,
    research_constraint_profile_id: ids.constraintProfileId,
    v1b_input_bundle_id: ids.inputBundleId,
    validated_need_id: ids.validatedNeedId,
    status: 'succeeded',
    triggered_by: 'system',
    v1b_input_bundle_ref: ctx.ref('v1b_input_bundle', ids.inputBundleId),
    v1b_intake_snapshot_ref: ctx.ref('v1b_intake_snapshot', ids.intakeSnapshotId),
    research_constraint_profile_ref: ctx.ref('research_constraint_profile', ids.constraintProfileId),
    readiness_assessment_ref: ctx.ref('v1b_intake_readiness_assessment', ids.readinessId),
    validated_need_ref: ctx.ref('validated_need', ids.validatedNeedId),
    evidence_map_ref: ctx.ref('evidence_map', ids.evidenceMapId),
    search_run_ref: ctx.ref('search_run', ids.searchRunId),
    search_plan_ref: ctx.ref('search_plan', ids.searchPlanId),
    literature_snapshot_ref: ctx.ref('literature_snapshot', ids.literatureSnapshotId),
    accepted_risk_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    gap_codes: [],
    workflow_profile_key: 'topic-selection-v1b.rollback-test',
    workflow_profile_version: 'v1',
    provider_id: null,
    model_id: null,
    prompt_template_id: null,
    prompt_template_version: null,
    input_snapshot_id: null,
    workflow_run_id: null,
    option_set_id: null,
    artifact_refs: [],
    quality_flags: [],
    failure_reason: null,
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
}

function makeOptionSet(
  ctx: RollbackContext,
  ids: SharedSliceIds,
  planRunId: string,
  optionSetId = ctx.id('option_set'),
): TopicSelectionResearchSliceOptionSetRecord {
  return {
    research_slice_option_set_id: optionSetId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    plan_research_slice_run_id: planRunId,
    v1b_intake_readiness_assessment_id: ids.readinessId,
    v1b_intake_snapshot_id: ids.intakeSnapshotId,
    research_constraint_profile_id: ids.constraintProfileId,
    v1b_input_bundle_id: ids.inputBundleId,
    validated_need_ids: [ids.validatedNeedId],
    status: 'ready_for_selection',
    recommended_option_id: null,
    selected_option_id: null,
    option_count: 2,
    high_risk_option_count: 0,
    requires_human_review: false,
    comparison_axes: ['traceability', 'answerability'],
    comparison_summary: 'Two bounded slice options for rollback verification.',
    missing_option_types: [],
    unresolved_disagreements: [],
    human_review_triggers: [],
    options_payload: { source: 'rollback-test' },
    comparison_payload: { source: 'rollback-test' },
    input_snapshot_id: null,
    workflow_run_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
}

function makeOption(
  ctx: RollbackContext,
  optionSetId: string,
  ordinal: number,
  optionId = ctx.id('slice_option'),
): TopicSelectionResearchSliceOptionRecord {
  return {
    research_slice_option_id: optionId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_slice_option_set_id: optionSetId,
    option_ordinal: ordinal,
    option_key: `option_${ordinal}`,
    status: ordinal === 1 ? 'recommended' : 'candidate',
    source_validated_need_refs: [ctx.ref('validated_need', 'need_for_option')],
    slice_statement: 'Improve evidence-to-need traceability for local paper engineering workflows.',
    problem_space: 'Reviewer-aligned paper engineering evidence workflows.',
    target_setting: 'Local-first desktop research assistant.',
    target_community: 'CS paper engineering researchers.',
    included_boundaries: ['local repository artifacts'],
    excluded_boundaries: ['live provider calls'],
    contribution_type_candidate: 'system',
    support_evidence_refs: [ctx.ref('evidence_unit', 'evidence_support')],
    challenge_evidence_refs: [],
    baseline_evidence_refs: [],
    context_evidence_refs: [],
    resource_assumptions: ['repo migrations are applied'],
    data_assumptions: ['fixtures are deterministic'],
    evaluation_path: 'Repository rollback test with retry.',
    baseline_assumptions: ['current v1b repository methods use Prisma transactions'],
    hard_blockers: [],
    dependency_risks: [],
    slice_budget: { max_nodes: 6 },
    expected_claim: 'Multi-record v1b authority writes roll back atomically.',
    fallback_claim: 'Rollback is verified for repository-level writes.',
    observable_success_criteria: ['no partial rows remain after injected DB error'],
    main_risks: [],
    baseline_risk: 'low',
    execution_risk: 'low',
    scope_risk: 'low',
    claim_ceiling_alignment: {
      status: 'aligned',
      rationale: 'The test claim matches repository transaction boundaries.',
      confidence: 0.9,
    },
    confidence: 0.82,
    requires_human_review: false,
    human_review_triggers: [],
    details_payload: { source: 'rollback-test' },
    created_at: FIXED_NOW,
  };
}

function makeResearchSlicePlanning(
  ctx: RollbackContext,
): TopicSelectionResearchSlicePlanningPersistence {
  const ids = sharedSliceIds(ctx);
  const planRun = makePlanRun(ctx, ids);
  const optionSet = makeOptionSet(ctx, ids, planRun.plan_research_slice_run_id);
  const firstOption = makeOption(ctx, optionSet.research_slice_option_set_id, 1);
  const secondOption = makeOption(ctx, optionSet.research_slice_option_set_id, 2);
  optionSet.recommended_option_id = firstOption.research_slice_option_id;
  planRun.option_set_id = optionSet.research_slice_option_set_id;
  return {
    plan_run: planRun,
    option_set: optionSet,
    options: [firstOption, secondOption],
  };
}

function makeResearchSliceCreation(
  ctx: RollbackContext,
  planning: TopicSelectionResearchSlicePlanningPersistence,
  sourceOptionId = planning.options[0]!.research_slice_option_id,
): TopicSelectionResearchSliceCreation {
  const planRun = planning.plan_run;
  const optionSet = planning.option_set;
  const decisionId = ctx.id('slice_selection_decision');
  const researchSliceId = ctx.id('research_slice');
  const sourceOption = planning.options.find((option) => option.research_slice_option_id === sourceOptionId)
    ?? planning.options[0]!;
  const decision: TopicSelectionSliceSelectionDecisionRecord = {
    slice_selection_decision_id: decisionId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_slice_option_set_id: optionSet.research_slice_option_set_id,
    selected_option_id: sourceOptionId,
    decision: 'select',
    decided_by: 'system',
    selection_policy_version: 'rollback-test-policy-v1',
    decision_basis: { source: 'rollback-test' },
    selection_rationale: 'Select the recommended slice to verify transaction rollback.',
    rejected_option_reasons: [],
    hard_blockers: [],
    open_risks: [],
    unresolved_disagreements: [],
    loopback_target: null,
    loopback_target_ref: null,
    required_actions: [],
    loopback_reason_code: null,
    source_downstream_object_ref: null,
    creates_new_run_or_version: true,
    confidence: 0.84,
    requires_human_review: false,
    human_review_reason: null,
    output_research_slice_ref: ctx.ref('research_slice', researchSliceId, 'v1'),
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
  };
  const researchSlice: TopicSelectionResearchSliceRecord = {
    research_slice_id: researchSliceId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    v1b_intake_snapshot_id: planRun.v1b_intake_snapshot_id,
    research_constraint_profile_id: planRun.research_constraint_profile_id,
    v1b_input_bundle_id: planRun.v1b_input_bundle_id,
    validated_need_id: planRun.validated_need_id,
    slice_version: 'v1',
    status: 'selected',
    v1b_intake_snapshot_ref: planRun.v1b_intake_snapshot_ref,
    research_constraint_profile_ref: planRun.research_constraint_profile_ref,
    readiness_assessment_ref: planRun.readiness_assessment_ref,
    v1b_input_bundle_ref: planRun.v1b_input_bundle_ref,
    validated_need_ref: planRun.validated_need_ref,
    evidence_map_ref: planRun.evidence_map_ref,
    search_run_ref: planRun.search_run_ref,
    search_plan_ref: planRun.search_plan_ref,
    literature_snapshot_ref: planRun.literature_snapshot_ref,
    source_option_set_ref: ctx.ref('research_slice_option_set', optionSet.research_slice_option_set_id),
    source_option_ref: ctx.ref('research_slice_option', sourceOptionId),
    slice_selection_decision_ref: ctx.ref('slice_selection_decision', decisionId),
    problem_space: sourceOption.problem_space,
    slice_statement: sourceOption.slice_statement,
    target_setting: sourceOption.target_setting,
    target_community: sourceOption.target_community,
    included_boundaries: sourceOption.included_boundaries,
    excluded_boundaries: sourceOption.excluded_boundaries,
    candidate_contribution_types: [sourceOption.contribution_type_candidate],
    preferred_contribution_type: sourceOption.contribution_type_candidate,
    contribution_rationale: 'The option has sufficient traceability for rollback verification.',
    expected_claim: sourceOption.expected_claim,
    fallback_claim: sourceOption.fallback_claim,
    observable_success_criteria: sourceOption.observable_success_criteria,
    resource_assumptions: sourceOption.resource_assumptions,
    data_assumptions: sourceOption.data_assumptions,
    evaluation_path: sourceOption.evaluation_path,
    baseline_assumptions: sourceOption.baseline_assumptions,
    dependency_risks: sourceOption.dependency_risks,
    slice_budget: sourceOption.slice_budget,
    topic_question_guardrails: ['question must preserve accepted boundaries'],
    value_assessment_inputs: ['traceability', 'answerability', 'reviewer risk'],
    must_preserve_boundaries: sourceOption.included_boundaries,
    accepted_risk_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    gap_codes: [],
    non_goals: ['promotion decision'],
    claim_ceiling: 'Repository-level rollback evidence.',
    decision_reason: 'Selected by rollback fixture.',
    supersedes_research_slice_ref: null,
    superseded_by_research_slice_ref: null,
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    trace_snapshot_id: null,
    artifact_refs: [],
    created_by: 'system',
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  return {
    decision,
    research_slice: researchSlice,
    evidence_refs: [makeResearchSliceEvidenceRef(ctx, researchSliceId)],
    boundaries: [makeResearchSliceBoundary(ctx, researchSliceId)],
    assumptions: [makeResearchSliceAssumption(ctx, researchSliceId)],
    option_set_patch: {
      status: 'selected',
      selected_option_id: sourceOptionId,
      updated_at: FIXED_NOW,
    },
  };
}

function makeResearchSliceEvidenceRef(
  ctx: RollbackContext,
  researchSliceId: string,
  evidenceRefId = ctx.id('slice_evidence_ref'),
): TopicSelectionResearchSliceEvidenceRefRecord {
  return {
    research_slice_evidence_ref_id: evidenceRefId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_slice_id: researchSliceId,
    evidence_ref: ctx.ref('evidence_unit', ctx.id('evidence_unit')),
    evidence_role: 'support',
    rationale: 'Evidence supports rollback test traceability.',
    evidence_strength_snapshot: { strength: 'medium' },
    source_locator_snapshot: { locator: 'fixture' },
    created_at: FIXED_NOW,
  };
}

function makeResearchSliceBoundary(
  ctx: RollbackContext,
  researchSliceId: string,
): TopicSelectionResearchSliceBoundaryRecord {
  return {
    research_slice_boundary_id: ctx.id('slice_boundary'),
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_slice_id: researchSliceId,
    boundary_kind: 'included',
    boundary_type: 'scope',
    statement: 'Only local repository artifacts are in scope.',
    reason: 'Keeps the rollback fixture deterministic.',
    evidence_refs: [],
    created_at: FIXED_NOW,
  };
}

function makeResearchSliceAssumption(
  ctx: RollbackContext,
  researchSliceId: string,
): TopicSelectionResearchSliceAssumptionRecord {
  return {
    research_slice_assumption_id: ctx.id('slice_assumption'),
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_slice_id: researchSliceId,
    assumption_type: 'resource',
    statement: 'The migrated database is available to the test.',
    status: 'active',
    evidence_refs: [],
    risk_level: 'low',
    created_at: FIXED_NOW,
  };
}

function makeTopicQuestionCandidatePersistence(
  ctx: RollbackContext,
): TopicSelectionTopicQuestionCandidatePersistence {
  const researchSliceId = ctx.id('research_slice_for_question');
  const runId = ctx.id('form_topic_question_run');
  const frameId = ctx.id('question_frame');
  const candidateSetId = ctx.id('candidate_set');
  const run: TopicSelectionFormTopicQuestionRunRecord = {
    form_topic_question_run_id: runId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_slice_id: researchSliceId,
    research_slice_version: 'v1',
    status: 'succeeded',
    triggered_by: 'system',
    research_slice_ref: ctx.ref('research_slice', researchSliceId, 'v1'),
    slice_selection_decision_ref: ctx.ref('slice_selection_decision', ctx.id('slice_decision_ref')),
    source_option_set_ref: ctx.ref('research_slice_option_set', ctx.id('source_option_set_ref')),
    source_option_ref: ctx.ref('research_slice_option', ctx.id('source_option_ref')),
    validated_need_ref: ctx.ref('validated_need', ctx.id('validated_need_ref')),
    v1b_intake_snapshot_ref: ctx.ref('v1b_intake_snapshot', ctx.id('intake_snapshot_ref')),
    research_constraint_profile_ref: ctx.ref('research_constraint_profile', ctx.id('constraint_profile_ref')),
    readiness_assessment_ref: ctx.ref('v1b_intake_readiness_assessment', ctx.id('readiness_ref')),
    evidence_map_ref: ctx.ref('evidence_map', ctx.id('evidence_map_ref')),
    search_run_ref: ctx.ref('search_run', ctx.id('search_run_ref')),
    search_plan_ref: ctx.ref('search_plan', ctx.id('search_plan_ref')),
    literature_snapshot_ref: ctx.ref('literature_snapshot', ctx.id('literature_snapshot_ref')),
    accepted_risk_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    gap_codes: [],
    workflow_profile_key: 'topic-selection-v1b.rollback-test',
    workflow_profile_version: 'v1',
    provider_id: null,
    model_id: null,
    prompt_template_id: null,
    prompt_template_version: null,
    input_snapshot_id: null,
    workflow_run_id: null,
    question_frame_id: frameId,
    candidate_set_id: candidateSetId,
    artifact_refs: [],
    quality_flags: [],
    failure_reason: null,
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const frame: TopicSelectionQuestionFrameRecord = {
    question_frame_id: frameId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    form_topic_question_run_id: runId,
    research_slice_id: researchSliceId,
    research_slice_version: 'v1',
    source_validated_need_refs: [run.validated_need_ref],
    target_setting: 'Local-first paper engineering workflow.',
    target_community: 'CS paper engineering researchers.',
    object_scope: 'Topic-selection workflow harness.',
    task_scope: 'Rollback verification.',
    intervention_or_approach: 'Prisma transaction boundary tests.',
    comparison_baseline: 'Unverified multi-record writes.',
    observable_outcome: 'No partial records remain after DB failures.',
    assumption_refs: [],
    evidence_refs: [],
    frame_payload: { source: 'rollback-test' },
    checksum: 'question-frame-rollback-checksum',
    created_at: FIXED_NOW,
  };
  const candidateSet: TopicSelectionTopicQuestionCandidateSetRecord = {
    topic_question_candidate_set_id: candidateSetId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    form_topic_question_run_id: runId,
    question_frame_id: frameId,
    research_slice_id: researchSliceId,
    research_slice_version: 'v1',
    status: 'ready_for_selection',
    candidate_count: 2,
    recommended_candidate_ids: [],
    admission_readiness: { ready: true },
    hard_blockers: [],
    human_review_triggers: [],
    generation_notes: ['rollback fixture'],
    input_snapshot_id: null,
    workflow_run_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const firstCandidate = makeTopicQuestionCandidate(ctx, candidateSet, 1);
  const secondCandidate = makeTopicQuestionCandidate(ctx, candidateSet, 2);
  candidateSet.recommended_candidate_ids = [firstCandidate.topic_question_candidate_id];
  return {
    form_topic_question_run: run,
    question_frame: frame,
    candidate_set: candidateSet,
    candidates: [firstCandidate, secondCandidate],
  };
}

function makeTopicQuestionCandidate(
  ctx: RollbackContext,
  candidateSet: TopicSelectionTopicQuestionCandidateSetRecord,
  ordinal: number,
  candidateId = ctx.id('question_candidate'),
): TopicSelectionTopicQuestionCandidateRecord {
  return {
    topic_question_candidate_id: candidateId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    candidate_set_id: candidateSet.topic_question_candidate_set_id,
    question_frame_id: candidateSet.question_frame_id,
    research_slice_id: candidateSet.research_slice_id,
    research_slice_version: candidateSet.research_slice_version,
    candidate_ordinal: ordinal,
    candidate_key: `candidate_${ordinal}`,
    status: ordinal === 1 ? 'recommended' : 'candidate',
    main_question: 'Does repository-level rollback preserve v1b authority consistency?',
    sub_questions: ['Which rows are written before failure?', 'Can the same IDs retry cleanly?'],
    question_type: 'system',
    contribution_hypothesis: 'system',
    source_validated_need_refs: [ctx.ref('validated_need', 'need_for_question')],
    answerability_verdict: 'answerable',
    answerability_plan_payload: answerabilityPlanDraft(ctx),
    boundary_check_payload: {
      preserved_boundary_refs: [],
      excluded_boundary_refs: [],
      boundary_violations: [],
      prohibited_claims: [],
      allowed_refinements: [],
    },
    traceability_check_payload: {
      support_evidence_refs: [],
      challenge_evidence_refs: [],
      baseline_evidence_refs: [],
      context_evidence_refs: [],
      mapped_evidence_refs: [],
      unmapped_assumptions: [],
    },
    expected_claim: 'Rollback removes all partial records.',
    fallback_claim: 'Rollback is verified for repository writes.',
    max_claim_strength: 'repository-level integration evidence',
    observable_success_criteria: ['retry with the same IDs succeeds after failure'],
    falsification_conditions_payload: [],
    risk_notes: [],
    blockers: [],
    objections: [],
    human_review_triggers: [],
    confidence: 0.86,
    created_at: FIXED_NOW,
  };
}

function answerabilityPlanDraft(ctx: RollbackContext) {
  return {
    datasets_or_resources: ['test database'],
    metrics: ['partial row count after failure'],
    baselines: ['without transaction boundary'],
    ablations_or_comparisons: ['injected unique conflict', 'missing update target'],
    evaluation_setting: 'repository integration test',
    dependency_risks: [],
    open_dependencies: [],
    known_gaps: [],
    required_evidence_refs: [ctx.ref('evidence_unit', 'answerability_evidence')],
  };
}

function makeTopicQuestionSelectionPersistence(
  ctx: RollbackContext,
  seed: TopicSelectionTopicQuestionCandidatePersistence,
): TopicSelectionTopicQuestionSelectionPersistence {
  const candidate = seed.candidates[0]!;
  const decisionId = ctx.id('topic_question_selection_decision');
  const questionId = ctx.id('topic_question');
  const questionRecordId = ctx.id('topic_question_record');
  const contractId = ctx.id('topic_question_contract');
  const answerabilityPlanId = ctx.id('answerability_plan');
  const decision: TopicSelectionTopicQuestionSelectionDecisionRecord = {
    topic_question_selection_decision_id: decisionId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    candidate_set_id: seed.candidate_set.topic_question_candidate_set_id,
    form_topic_question_run_id: seed.form_topic_question_run.form_topic_question_run_id,
    research_slice_id: seed.form_topic_question_run.research_slice_id,
    research_slice_version: seed.form_topic_question_run.research_slice_version,
    input_snapshot_ref: ctx.ref('topic_question_selection_input', ctx.id('question_selection_input')),
    decision: 'admit',
    decided_by: 'system',
    selection_policy_version: 'rollback-test-policy-v1',
    admitted_candidate_ids: [candidate.topic_question_candidate_id],
    created_topic_question_ids: [questionId],
    merged_candidate_groups: [],
    hard_gate_results: [],
    admission_review: { verdict: 'pass' },
    candidate_relationships: {},
    priority_order: [candidate.topic_question_candidate_id],
    rejected_candidate_reasons: [],
    blocking_contexts: [],
    decision_rationale: 'Admit a deterministic candidate for rollback verification.',
    requires_human_review: false,
    human_review_triggers: [],
    accepted_risk_refs: [],
    confidence: 0.86,
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
  };
  const topicQuestion: TopicSelectionTopicQuestionRecord = {
    topic_question_id: questionId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_record_id: questionRecordId,
    research_slice_id: seed.form_topic_question_run.research_slice_id,
    research_slice_version: seed.form_topic_question_run.research_slice_version,
    source_validated_need_ids: ['need_for_question'],
    source_candidate_set_id: seed.candidate_set.topic_question_candidate_set_id,
    source_candidate_id: candidate.topic_question_candidate_id,
    selection_decision_id: decisionId,
    active_question_contract_id: contractId,
    main_question: candidate.main_question,
    sub_questions: candidate.sub_questions,
    question_type: candidate.question_type,
    contribution_hypothesis: candidate.contribution_hypothesis,
    status: 'active',
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const contract: TopicSelectionTopicQuestionContractRecord = {
    topic_question_contract_id: contractId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: questionId,
    version: 'v1',
    answerability_plan_id: answerabilityPlanId,
    source_research_slice_id: seed.form_topic_question_run.research_slice_id,
    source_research_slice_version: seed.form_topic_question_run.research_slice_version,
    source_candidate_id: candidate.topic_question_candidate_id,
    selection_decision_id: decisionId,
    input_snapshot_ref: decision.input_snapshot_ref,
    contract_hash: 'topic-question-contract-rollback-hash',
    main_question: candidate.main_question,
    question_type: candidate.question_type,
    contribution_hypothesis: candidate.contribution_hypothesis,
    target_setting: seed.question_frame.target_setting,
    target_community: seed.question_frame.target_community,
    expected_claim: candidate.expected_claim,
    fallback_claim: candidate.fallback_claim,
    max_claim_strength: candidate.max_claim_strength,
    evaluation_route: 'repository rollback verification',
    claim_ceiling: 'repository-level integration evidence',
    prohibited_claims: [],
    required_evidence_categories: ['traceability'],
    allowed_refinements: [],
    stop_reopen_conditions: [],
    accepted_risk_refs: [],
    risk_notes: [],
    status: 'active',
    created_by_workflow_run_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const answerabilityPlan: TopicSelectionTopicQuestionAnswerabilityPlanRecord = {
    topic_question_answerability_plan_id: answerabilityPlanId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: questionId,
    topic_question_contract_id: contractId,
    answerability_verdict: 'answerable',
    ...answerabilityPlanDraft(ctx),
    created_at: FIXED_NOW,
  };
  const materialization: TopicSelectionV1bTopicQuestionMaterialization = {
    topic_question: topicQuestion,
    topic_question_contract: contract,
    answerability_plan: answerabilityPlan,
    need_refs: [makeTopicQuestionNeedRef(ctx, topicQuestion, contract)],
    evidence_refs: [makeTopicQuestionEvidenceRef(ctx, topicQuestion, contract)],
    boundary_refs: [makeTopicQuestionBoundaryRef(ctx, topicQuestion, contract)],
    assumption_refs: [makeTopicQuestionAssumptionRef(ctx, topicQuestion, contract)],
    falsification_conditions: [makeTopicQuestionFalsification(ctx, contract)],
  };
  return {
    decision,
    candidate_set_patch: {
      status: 'selected',
      updated_at: FIXED_NOW,
    },
    candidate_status_patches: [{
      candidate_id: candidate.topic_question_candidate_id,
      status: 'admitted',
    }],
    materializations: [materialization],
  };
}

function makeTopicQuestionNeedRef(
  ctx: RollbackContext,
  question: TopicSelectionTopicQuestionRecord,
  contract: TopicSelectionTopicQuestionContractRecord,
): TopicSelectionTopicQuestionNeedRefRecord {
  return {
    topic_question_need_ref_id: ctx.id('topic_question_need_ref'),
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: question.topic_question_id,
    topic_question_contract_id: contract.topic_question_contract_id,
    validated_need_ref: ctx.ref('validated_need', 'need_for_question'),
    source_need_candidate_ref: null,
    role: 'primary',
    inherited_from_research_slice_id: question.research_slice_id,
    coverage_note: 'Primary need carried into rollback question contract.',
    created_at: FIXED_NOW,
  };
}

function makeTopicQuestionEvidenceRef(
  ctx: RollbackContext,
  question: TopicSelectionTopicQuestionRecord,
  contract: TopicSelectionTopicQuestionContractRecord,
  evidenceRefId = ctx.id('topic_question_evidence_ref'),
): TopicSelectionTopicQuestionEvidenceRefRecord {
  return {
    topic_question_evidence_ref_id: evidenceRefId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: question.topic_question_id,
    topic_question_contract_id: contract.topic_question_contract_id,
    evidence_ref: ctx.ref('evidence_unit', ctx.id('question_evidence')),
    evidence_role: 'support',
    mapped_question_part: 'main_question',
    rationale: 'Evidence supports the admitted question.',
    source_locator_snapshot: { locator: 'fixture' },
    created_at: FIXED_NOW,
  };
}

function makeTopicQuestionBoundaryRef(
  ctx: RollbackContext,
  question: TopicSelectionTopicQuestionRecord,
  contract: TopicSelectionTopicQuestionContractRecord,
): TopicSelectionTopicQuestionBoundaryRefRecord {
  return {
    topic_question_boundary_ref_id: ctx.id('topic_question_boundary_ref'),
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: question.topic_question_id,
    topic_question_contract_id: contract.topic_question_contract_id,
    research_slice_boundary_id: ctx.id('slice_boundary_ref'),
    boundary_kind: 'preserved',
    question_part: 'scope',
    note: 'Question preserves the rollback fixture boundary.',
    created_at: FIXED_NOW,
  };
}

function makeTopicQuestionAssumptionRef(
  ctx: RollbackContext,
  question: TopicSelectionTopicQuestionRecord,
  contract: TopicSelectionTopicQuestionContractRecord,
): TopicSelectionTopicQuestionAssumptionRefRecord {
  return {
    topic_question_assumption_ref_id: ctx.id('topic_question_assumption_ref'),
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: question.topic_question_id,
    topic_question_contract_id: contract.topic_question_contract_id,
    assumption_type: 'resource',
    statement: 'The database supports transaction rollback.',
    source_assumption_id: null,
    evidence_refs: [],
    risk_level: 'low',
    status: 'active',
    created_at: FIXED_NOW,
  };
}

function makeTopicQuestionFalsification(
  ctx: RollbackContext,
  contract: TopicSelectionTopicQuestionContractRecord,
): TopicSelectionTopicQuestionFalsificationConditionRecord {
  return {
    topic_question_falsification_condition_id: ctx.id('topic_question_falsification'),
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_contract_id: contract.topic_question_contract_id,
    condition_type: 'resource_blocked',
    severity: 'hard',
    statement: 'Rollback claim is falsified if partial rows remain after a failed transaction.',
    trigger_evidence_refs: [],
    trigger_source_refs: [],
    related_contract_fields: ['repository_transaction_boundary'],
    expected_action: 'revise_question',
    check_timing: 'before_value_assessment',
    confidence: 'high',
    status: 'active',
    created_at: FIXED_NOW,
  };
}

function makeValueAssessmentPersistence(
  ctx: RollbackContext,
  seedQuestion: SeededQuestion,
): TopicSelectionTopicValueAssessmentPersistence {
  const runId = ctx.id('assess_topic_value_run');
  const inputSnapshotId = ctx.id('topic_value_input_snapshot');
  const assessmentId = ctx.id('topic_value_assessment');
  const assessmentRecordId = ctx.id('topic_value_assessment_record');
  const memoId = ctx.id('value_reasoning_memo');
  const topicQuestionRef = ctx.ref('topic_question', seedQuestion.questionId);
  const contractRef = ctx.ref('topic_question_contract', seedQuestion.contractId, 'v1');
  const answerabilityPlanRef = ctx.ref('topic_question_answerability_plan', seedQuestion.answerabilityPlanId);
  const researchSliceRef = ctx.ref('research_slice', seedQuestion.researchSliceId, seedQuestion.researchSliceVersion);
  const run: TopicSelectionAssessTopicValueRunRecord = {
    assess_topic_value_run_id: runId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_contract_id: seedQuestion.contractId,
    topic_question_id: seedQuestion.questionId,
    research_slice_id: seedQuestion.researchSliceId,
    research_slice_version: seedQuestion.researchSliceVersion,
    topic_value_assessment_id: assessmentId,
    value_reasoning_memo_id: memoId,
    status: 'succeeded',
    triggered_by: 'system',
    topic_question_ref: topicQuestionRef,
    topic_question_contract_ref: contractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    selection_decision_ref: ctx.ref('topic_question_selection_decision', ctx.id('topic_question_selection_ref')),
    validated_need_refs: [ctx.ref('validated_need', 'need_for_value')],
    evidence_refs: [ctx.ref('evidence_unit', 'value_evidence')],
    accepted_risk_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    workflow_profile_key: 'topic-selection-v1b.rollback-test',
    workflow_profile_version: 'v1',
    provider_id: null,
    model_id: null,
    prompt_template_id: null,
    prompt_template_version: null,
    topic_value_input_snapshot_id: inputSnapshotId,
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    quality_flags: [],
    failure_reason: null,
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const questionContract = minimalQuestionContract(ctx, seedQuestion, contractRef);
  const answerabilityPlan = minimalAnswerabilityPlan(ctx, seedQuestion, answerabilityPlanRef);
  const inputSnapshot: TopicSelectionTopicValueAssessmentInputSnapshotRecord = {
    topic_value_input_snapshot_id: inputSnapshotId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_contract_id: seedQuestion.contractId,
    topic_question_id: seedQuestion.questionId,
    research_slice_id: seedQuestion.researchSliceId,
    research_slice_version: seedQuestion.researchSliceVersion,
    topic_question_ref: topicQuestionRef,
    topic_question_contract_ref: contractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: run.validated_need_refs,
    evidence_refs: [],
    need_refs: [],
    boundary_refs: [],
    assumption_refs: [],
    falsification_conditions: [],
    accepted_risk_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    question_contract: questionContract,
    answerability_plan: answerabilityPlan,
    research_slice_snapshot: { research_slice_id: seedQuestion.researchSliceId },
    snapshot_hash: 'topic-value-input-rollback-hash',
    control_plane_input_snapshot_id: null,
    created_at: FIXED_NOW,
  };
  const assessment: TopicSelectionTopicValueAssessmentRecord = {
    topic_value_assessment_id: assessmentId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: seedQuestion.questionId,
    topic_question_contract_id: seedQuestion.contractId,
    research_record_id: assessmentRecordId,
    source_research_slice_id: seedQuestion.researchSliceId,
    source_research_slice_version: seedQuestion.researchSliceVersion,
    assess_topic_value_run_id: runId,
    topic_value_input_snapshot_id: inputSnapshotId,
    value_reasoning_memo_id: memoId,
    active_disposition_decision_id: null,
    readiness_status: 'ready',
    freshness_status: 'current',
    strongest_claim_if_success: 'Repository writes roll back atomically.',
    fallback_claim_if_success: 'Repository rollback has integration evidence.',
    hard_gates: [
      'value_signal',
      'non_solved_sanity',
      'answerability_sanity',
      'feasibility_sanity',
      'evidence_sanity',
      'claim_ceiling_fit',
    ].map((gateKey) => ({
      gate_key: gateKey,
      verdict: 'pass',
      severity: 'info',
      overridable_with_risk: false,
      rationale: 'Rollback fixture passes the gate.',
      refs: [],
    })) as TopicSelectionTopicValueAssessmentRecord['hard_gates'],
    dimension_scores: [
      'significance',
      'originality',
      'answerability',
      'feasibility',
      'claim_ceiling_fit',
      'reviewer_risk',
      'effort_to_value_fit',
      'strategic_fit',
      'negative_memory_check',
    ].map((dimensionKey) => ({
      dimension_key: dimensionKey,
      score: 80,
      rationale: 'Rollback fixture is adequate for this dimension.',
      evidence_refs: [],
      uncertainty: 'low',
    })) as TopicSelectionTopicValueAssessmentRecord['dimension_scores'],
    risk_penalty: { penalty: 0 },
    reviewer_objections: [],
    ceiling_case: 'Rollback verified for all v1b authority repository methods.',
    base_case: 'Rollback verified for representative failure modes.',
    floor_case: 'Transaction boundary remains explicit in code.',
    legacy_verdict: 'promote',
    total_score: 80,
    value_summary: 'Rollback behavior is acceptable for local v1b usage.',
    confidence: 0.86,
    accepted_risk_refs: [],
    blocker_refs: [],
    risk_notes: [],
    trace_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const memo: TopicSelectionValueReasoningMemoRecord = {
    value_reasoning_memo_id: memoId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_value_assessment_id: assessmentId,
    topic_question_contract_id: seedQuestion.contractId,
    recommendation: 'advance_to_package',
    value_thesis: 'Repository transaction boundaries provide acceptable rollback behavior.',
    significance: 'Prevents partial authority records.',
    originality: 'Locks existing v1b behavior as regression coverage.',
    claim_leverage: 'Supports local-first reliability claims.',
    reviewer_risks: [],
    effort_to_value: 'Low effort, high regression value.',
    strategic_fit: 'Directly addresses T-107 acceptance risk.',
    negative_memory_check: 'No known negative memory applies.',
    evidence_backed_rationale: 'The integration test injects real Prisma failures.',
    top_objections: [],
    uncertainty: 'low',
    disposition_bridge: 'Advance to package after rollback verification.',
    requires_critic_review: false,
    critic_triggers: [],
    cited_refs: [],
    created_by_workflow_run_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
  };
  return {
    assess_topic_value_run: run,
    topic_value_input_snapshot: inputSnapshot,
    topic_value_assessment: assessment,
    value_reasoning_memo: memo,
    evidence_refs: [makeTopicValueEvidenceRef(ctx, assessment, seedQuestion.contractId)],
  };
}

function minimalQuestionContract(
  ctx: RollbackContext,
  seedQuestion: SeededQuestion,
  contractRef: TopicSelectionFunctionalRef,
): TopicSelectionTopicQuestionContractRecord {
  return {
    topic_question_contract_id: seedQuestion.contractId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: seedQuestion.questionId,
    version: contractRef.version_id ?? 'v1',
    answerability_plan_id: seedQuestion.answerabilityPlanId,
    source_research_slice_id: seedQuestion.researchSliceId,
    source_research_slice_version: seedQuestion.researchSliceVersion,
    source_candidate_id: ctx.id('source_candidate_ref'),
    selection_decision_id: ctx.id('selection_decision_ref'),
    input_snapshot_ref: ctx.ref('topic_question_contract_input', ctx.id('contract_input')),
    contract_hash: 'minimal-question-contract-rollback-hash',
    main_question: 'Does repository rollback preserve authority consistency?',
    question_type: 'system',
    contribution_hypothesis: 'system',
    target_setting: 'Local repository integration tests.',
    target_community: 'CS paper engineering researchers.',
    expected_claim: 'Rollback removes all partial records.',
    fallback_claim: 'Rollback is verified for repository methods.',
    max_claim_strength: 'integration evidence',
    evaluation_route: 'Prisma rollback test',
    claim_ceiling: 'repository-level claim',
    prohibited_claims: [],
    required_evidence_categories: ['traceability'],
    allowed_refinements: [],
    stop_reopen_conditions: [],
    accepted_risk_refs: [],
    risk_notes: [],
    status: 'active',
    created_by_workflow_run_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
}

function minimalAnswerabilityPlan(
  ctx: RollbackContext,
  seedQuestion: SeededQuestion,
  answerabilityPlanRef: TopicSelectionFunctionalRef,
): TopicSelectionTopicQuestionAnswerabilityPlanRecord {
  return {
    topic_question_answerability_plan_id: answerabilityPlanRef.ref_id,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_question_id: seedQuestion.questionId,
    topic_question_contract_id: seedQuestion.contractId,
    answerability_verdict: 'answerable',
    ...answerabilityPlanDraft(ctx),
    created_at: FIXED_NOW,
  };
}

function makeTopicValueEvidenceRef(
  ctx: RollbackContext,
  assessment: TopicSelectionTopicValueAssessmentRecord,
  contractId: string,
  evidenceRefId = ctx.id('topic_value_evidence_ref'),
): TopicSelectionTopicValueEvidenceRefRecord {
  return {
    topic_value_evidence_ref_id: evidenceRefId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_value_assessment_id: assessment.topic_value_assessment_id,
    topic_question_contract_id: contractId,
    evidence_ref: ctx.ref('evidence_unit', ctx.id('topic_value_evidence')),
    evidence_role: 'support',
    value_use: 'rollback verification',
    rationale: 'Evidence supports value assessment rollback verification.',
    created_at: FIXED_NOW,
  };
}

function makeTopicPackageAuthorityPersistence(
  ctx: RollbackContext,
  seedQuestion: SeededQuestion,
  seedAssessment: SeededAssessment,
): TopicSelectionV1bTopicPackageAuthorityPersistence {
  const packageId = ctx.id('topic_package');
  const packageRecordId = ctx.id('topic_package_record');
  const traceCheckId = ctx.id('package_trace_boundary_check');
  const readinessId = ctx.id('package_readiness');
  const v1cBundleId = ctx.id('v1b_to_v1c_bundle');
  const packageRef = ctx.ref('topic_package', packageId, 'v1');
  const assessmentRef = ctx.ref('topic_value_assessment', seedAssessment.assessmentId);
  const memoRef = ctx.ref('value_reasoning_memo', seedAssessment.memoId);
  const dispositionRef = ctx.ref('value_disposition_decision', seedAssessment.dispositionDecisionId);
  const questionRef = ctx.ref('topic_question', seedQuestion.questionId);
  const contractRef = ctx.ref('topic_question_contract', seedQuestion.contractId, 'v1');
  const answerabilityPlanRef = ctx.ref('topic_question_answerability_plan', seedQuestion.answerabilityPlanId);
  const researchSliceRef = ctx.ref('research_slice', seedQuestion.researchSliceId, seedQuestion.researchSliceVersion);
  const topicPackage: TopicSelectionTopicPackageRecord = {
    topic_package_id: packageId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    research_record_id: packageRecordId,
    topic_question_id: seedQuestion.questionId,
    topic_question_contract_id: seedQuestion.contractId,
    topic_value_assessment_id: seedAssessment.assessmentId,
    value_reasoning_memo_id: seedAssessment.memoId,
    value_disposition_decision_id: seedAssessment.dispositionDecisionId,
    research_slice_id: seedQuestion.researchSliceId,
    research_slice_version: seedQuestion.researchSliceVersion,
    package_version: 'v1',
    package_readiness_status: 'ready_for_promotion_review',
    topic_package_ref: packageRef,
    topic_value_assessment_ref: assessmentRef,
    value_reasoning_memo_ref: memoRef,
    value_disposition_decision_ref: dispositionRef,
    topic_question_ref: questionRef,
    topic_question_contract_ref: contractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: [ctx.ref('validated_need', 'need_for_package')],
    evidence_refs: [],
    selected_evidence_refs: [ctx.ref('evidence_unit', 'package_evidence')],
    accepted_risk_refs: [],
    blocker_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    title_candidates: ['Repository rollback verified for v1b authority writes'],
    research_background: 'T-107 requires real Prisma rollback evidence.',
    contribution_summary: 'The package records transaction rollback acceptance evidence.',
    candidate_methods: ['Prisma integration test'],
    evaluation_plan: 'Inject late DB failure, assert no package rows, then retry.',
    key_risks: [],
    non_goals: ['promotion decision'],
    selected_literature_evidence_ids: ['package_evidence'],
    package_payload: { source: 'rollback-test' },
    trace_boundary_check_id: traceCheckId,
    readiness_assessment_id: readinessId,
    v1c_input_bundle_id: v1cBundleId,
    trace_snapshot_id: null,
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    created_by: 'system',
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
  };
  const traceCheck: TopicSelectionPackageTraceBoundaryCheckRecord = {
    package_trace_boundary_check_id: traceCheckId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_package_id: packageId,
    value_disposition_decision_id: seedAssessment.dispositionDecisionId,
    topic_value_assessment_id: seedAssessment.assessmentId,
    topic_question_contract_id: seedQuestion.contractId,
    research_slice_id: seedQuestion.researchSliceId,
    check_status: 'passed',
    package_ref: packageRef,
    topic_value_assessment_ref: assessmentRef,
    value_reasoning_memo_ref: memoRef,
    value_disposition_decision_ref: dispositionRef,
    topic_question_ref: questionRef,
    topic_question_contract_ref: contractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: topicPackage.validated_need_refs,
    evidence_refs: topicPackage.selected_evidence_refs,
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    missing_ref_codes: [],
    new_ref_codes: [],
    boundary_conflict_codes: [],
    carry_forward_codes: [],
    trace_issues: [],
    boundary_issues: [],
    narrative_consistency: { verdict: 'consistent' },
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
  };
  const readiness: TopicSelectionTopicPackageReadinessAssessmentRecord = {
    package_readiness_assessment_id: readinessId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_package_id: packageId,
    value_disposition_decision_id: seedAssessment.dispositionDecisionId,
    package_trace_boundary_check_id: traceCheckId,
    package_version: 'v1',
    package_readiness_status: 'ready_for_promotion_review',
    blockers: [],
    warnings: [],
    required_actions: [],
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    assessed_by: 'system',
    created_at: FIXED_NOW,
  };
  const v1cBundle: TopicSelectionV1bToV1cInputBundleRecord = {
    v1b_to_v1c_input_bundle_id: v1cBundleId,
    workspace_id: null,
    title_card_id: ctx.titleCardId,
    topic_package_id: packageId,
    package_version: 'v1',
    package_readiness_status: 'ready_for_promotion_review',
    bundle_status: 'ready_for_promotion_review',
    topic_package_ref: packageRef,
    package_trace_boundary_check_ref: ctx.ref('package_trace_boundary_check', traceCheckId),
    package_readiness_assessment_ref: ctx.ref('package_readiness_assessment', readinessId),
    topic_value_assessment_ref: assessmentRef,
    value_reasoning_memo_ref: memoRef,
    value_disposition_decision_ref: dispositionRef,
    topic_question_ref: questionRef,
    topic_question_contract_ref: contractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: topicPackage.validated_need_refs,
    evidence_refs: [],
    accepted_risk_refs: [],
    blocker_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    readiness_check_refs: [ctx.ref('package_readiness_assessment', readinessId)],
    package_snapshot: topicPackage,
    package_draft_input_snapshot: {
      topic_value_assessment_ref: assessmentRef,
      value_reasoning_memo_ref: memoRef,
      value_disposition_decision_ref: dispositionRef,
      topic_question_ref: questionRef,
      topic_question_contract_ref: contractRef,
      answerability_plan_ref: answerabilityPlanRef,
      research_slice_ref: researchSliceRef,
      validated_need_refs: topicPackage.validated_need_refs,
      evidence_refs: [],
      boundary_refs: [],
      assumption_refs: [],
      falsification_conditions: [],
      accepted_risk_refs: [],
      memory_suggestion_refs: [],
      recheck_request_refs: [],
      topic_value_assessment: {
        topic_value_assessment_id: seedAssessment.assessmentId,
      } as TopicSelectionTopicValueAssessmentRecord,
      value_reasoning_memo: {
        value_reasoning_memo_id: seedAssessment.memoId,
      } as TopicSelectionValueReasoningMemoRecord,
      value_disposition_decision: {
        value_disposition_decision_id: seedAssessment.dispositionDecisionId,
      } as Omit<TopicSelectionValueDispositionDecisionRecord, 'package_draft_input'>,
      question_contract: {
        topic_question_contract_id: seedQuestion.contractId,
      } as TopicSelectionTopicQuestionContractRecord,
      answerability_plan: {
        topic_question_answerability_plan_id: seedQuestion.answerabilityPlanId,
      } as TopicSelectionTopicQuestionAnswerabilityPlanRecord,
      research_slice_snapshot: { research_slice_id: seedQuestion.researchSliceId },
    } satisfies TopicSelectionV1bPackageDraftInput,
    bundle_hash: 'v1b-to-v1c-rollback-bundle-hash',
    input_snapshot_id: null,
    workflow_run_id: null,
    gate_result_id: null,
    transition_attempt_id: null,
    artifact_refs: [],
    created_at: FIXED_NOW,
  };
  return {
    topic_package: topicPackage,
    package_trace_boundary_check: traceCheck,
    package_readiness_assessment: readiness,
    v1c_input_bundle: v1cBundle,
  };
}

async function seedTitleCardQuestion(
  ctx: RollbackContext,
  overrides: Partial<SeededQuestion> = {},
): Promise<SeededQuestion> {
  const seeded: SeededQuestion = {
    questionId: overrides.questionId ?? ctx.id('seed_topic_question'),
    questionRecordId: overrides.questionRecordId ?? ctx.id('seed_topic_question_record'),
    contractId: overrides.contractId ?? ctx.id('seed_topic_question_contract'),
    answerabilityPlanId: overrides.answerabilityPlanId ?? ctx.id('seed_answerability_plan'),
    researchSliceId: overrides.researchSliceId ?? ctx.id('seed_research_slice'),
    researchSliceVersion: overrides.researchSliceVersion ?? 'v1',
  };
  await ctx.prisma.$transaction([
    ctx.prisma.titleCardResearchRecord.create({
      data: {
        id: seeded.questionRecordId,
        titleCardId: ctx.titleCardId,
        recordType: 'research_question',
        recordStatus: 'completed',
        parentRecordId: null,
        supersededByRecordId: null,
        sourceRecordIds: json([]),
        lineage: json({ source: 'rollback-test-seed' }),
        summary: 'Seed topic question for rollback verification.',
        confidence: new Prisma.Decimal(0.8),
        blockingIssues: json([]),
        missingInformation: json([]),
        nextActions: json([]),
        evidenceRefs: json([]),
        payload: json({ topic_question_id: seeded.questionId }),
        createdBy: 'system',
        createdAt: new Date(FIXED_NOW),
        updatedAt: new Date(FIXED_NOW),
        deletedAt: null,
      },
    }),
    ctx.prisma.titleCardResearchQuestion.create({
      data: {
        id: seeded.questionId,
        titleCardId: ctx.titleCardId,
        researchRecordId: seeded.questionRecordId,
        mainQuestion: 'Does rollback preserve topic-selection authority consistency?',
        subQuestions: json(['Can the same IDs retry after rollback?']),
        researchSlice: seeded.researchSliceId,
        contributionHypothesis: 'system',
        sourceNeedReviewIds: json([]),
        sourceLiteratureEvidenceIds: json([]),
        v1bResearchSliceId: seeded.researchSliceId,
        v1bResearchSliceVersion: seeded.researchSliceVersion,
        v1bSourceCandidateSetId: ctx.id('seed_candidate_set_ref'),
        v1bSourceCandidateId: ctx.id('seed_candidate_ref'),
        v1bSelectionDecisionId: ctx.id('seed_selection_decision_ref'),
        v1bActiveQuestionContractId: seeded.contractId,
        v1bQuestionType: 'system',
        v1bQuestionStatus: 'active',
        createdAt: new Date(FIXED_NOW),
        updatedAt: new Date(FIXED_NOW),
      },
    }),
  ]);
  return seeded;
}

async function seedTitleCardValueAssessment(
  ctx: RollbackContext,
  question: SeededQuestion,
  overrides: Partial<SeededAssessment> = {},
): Promise<SeededAssessment> {
  const seeded: SeededAssessment = {
    assessmentId: overrides.assessmentId ?? ctx.id('seed_topic_value_assessment'),
    assessmentRecordId: overrides.assessmentRecordId ?? ctx.id('seed_topic_value_assessment_record'),
    memoId: overrides.memoId ?? ctx.id('seed_value_reasoning_memo'),
    dispositionDecisionId: overrides.dispositionDecisionId ?? ctx.id('seed_disposition_decision'),
  };
  await ctx.prisma.$transaction([
    ctx.prisma.titleCardResearchRecord.create({
      data: {
        id: seeded.assessmentRecordId,
        titleCardId: ctx.titleCardId,
        recordType: 'value_assessment',
        recordStatus: 'completed',
        parentRecordId: null,
        supersededByRecordId: null,
        sourceRecordIds: json([question.questionId, question.contractId]),
        lineage: json({ source: 'rollback-test-seed' }),
        summary: 'Seed value assessment for package rollback verification.',
        confidence: new Prisma.Decimal(0.8),
        blockingIssues: json([]),
        missingInformation: json([]),
        nextActions: json([]),
        evidenceRefs: json([]),
        payload: json({ topic_value_assessment_id: seeded.assessmentId }),
        createdBy: 'system',
        createdAt: new Date(FIXED_NOW),
        updatedAt: new Date(FIXED_NOW),
        deletedAt: null,
      },
    }),
    ctx.prisma.titleCardValueAssessment.create({
      data: {
        id: seeded.assessmentId,
        titleCardId: ctx.titleCardId,
        researchQuestionId: question.questionId,
        researchRecordId: seeded.assessmentRecordId,
        strongestClaimIfSuccess: 'Repository rollback is verified.',
        fallbackClaimIfSuccess: 'Repository rollback has integration coverage.',
        hardGates: json([]),
        scoredDimensions: json([]),
        riskPenalty: json({ penalty: 0 }),
        reviewerObjections: json([]),
        ceilingCase: 'All relevant authority writes roll back atomically.',
        baseCase: 'Critical authority writes roll back atomically.',
        floorCase: 'Transaction boundaries are explicit.',
        verdict: 'promote',
        totalScore: new Prisma.Decimal(80),
        v1bSourceQuestionContractId: question.contractId,
        v1bSourceResearchSliceId: question.researchSliceId,
        v1bSourceResearchSliceVersion: question.researchSliceVersion,
        v1bAssessmentRunId: ctx.id('seed_assessment_run_ref'),
        v1bInputSnapshotId: ctx.id('seed_value_input_snapshot_ref'),
        v1bReasoningMemoId: seeded.memoId,
        v1bActiveDispositionDecisionId: seeded.dispositionDecisionId,
        v1bReadinessStatus: 'ready',
        v1bFreshnessStatus: 'current',
        createdAt: new Date(FIXED_NOW),
        updatedAt: new Date(FIXED_NOW),
      },
    }),
  ]);
  return seeded;
}

async function seedValueDispositionDecision(
  ctx: RollbackContext,
  question: SeededQuestion,
  assessment: SeededAssessment,
): Promise<void> {
  await ctx.prisma.topicSelectionValueDispositionDecision.create({
    data: {
      id: assessment.dispositionDecisionId,
      workspaceId: null,
      titleCardId: ctx.titleCardId,
      topicValueAssessmentId: assessment.assessmentId,
      topicQuestionContractId: question.contractId,
      valueReasoningMemoId: assessment.memoId,
      decision: 'advance_to_package',
      decidedBy: 'system',
      decisionRationale: 'Seed disposition after failed package transaction to verify retry.',
      requiredActions: [],
      loopbackTargetRef: Prisma.JsonNull,
      blockingContexts: json([]),
      acceptedRiskRefs: json([]),
      blockerRefs: json([]),
      packageDraftInput: Prisma.JsonNull,
      outputTopicPackageId: null,
      status: 'active',
      isCurrent: true,
      inputSnapshotId: null,
      workflowRunId: null,
      gateResultId: null,
      transitionAttemptId: null,
      artifactRefs: json([]),
      createdAt: new Date(FIXED_NOW),
    },
  });
}

prismaRollbackTest(
  'Prisma v1b N4 createPlanRunWithOptionSet rolls back partial option writes and retries cleanly',
  async (ctx) => {
    const persistence = makeResearchSlicePlanning(ctx);
    const duplicateOption = {
      ...persistence.options[0]!,
      option_ordinal: 2,
      option_key: 'duplicate_id_but_unique_key',
    };
    const failingPersistence = {
      ...persistence,
      options: [persistence.options[0]!, duplicateOption],
    };

    await assertRejectsWithPrismaCode(
      () => ctx.researchSliceRepository.createPlanRunWithOptionSet(failingPersistence),
      ['P2002'],
    );

    assert.equal(
      await ctx.researchSliceRepository.findPlanRunById(persistence.plan_run.plan_research_slice_run_id),
      null,
    );
    assert.equal(
      await ctx.researchSliceRepository.findOptionSetById(persistence.option_set.research_slice_option_set_id),
      null,
    );
    assert.deepEqual(
      await ctx.researchSliceRepository.listOptionsByOptionSetId(persistence.option_set.research_slice_option_set_id),
      [],
    );

    const retried = await ctx.researchSliceRepository.createPlanRunWithOptionSet(persistence);
    assert.equal(retried.options.length, 2);
    assert.equal(retried.option_set.research_slice_option_set_id, persistence.option_set.research_slice_option_set_id);
  },
);

prismaRollbackTest(
  'Prisma v1b N5 createSelectionDecisionWithSlice rolls back late option-set patches and retries cleanly',
  async (ctx) => {
    const planning = makeResearchSlicePlanning(ctx);
    await ctx.researchSliceRepository.createPlanRunWithOptionSet(planning);
    const creation = makeResearchSliceCreation(ctx, planning);
    const failingCreation = clone(creation);
    const missingOptionId = ctx.id('missing_slice_option');
    failingCreation.decision.selected_option_id = missingOptionId;
    failingCreation.research_slice.source_option_ref = ctx.ref('research_slice_option', missingOptionId);
    failingCreation.option_set_patch.selected_option_id = missingOptionId;

    await assertRejectsWithPrismaCode(
      () => ctx.researchSliceRepository.createSelectionDecisionWithSlice(failingCreation),
      ['P2025'],
    );

    assert.equal(
      await ctx.researchSliceRepository.findSelectionDecisionById(creation.decision.slice_selection_decision_id),
      null,
    );
    assert.equal(
      await ctx.researchSliceRepository.findResearchSliceById(creation.research_slice.research_slice_id),
      null,
    );
    assert.deepEqual(
      await ctx.researchSliceRepository.listEvidenceRefsByResearchSliceId(creation.research_slice.research_slice_id),
      [],
    );
    assert.equal(
      (await ctx.researchSliceRepository.findOptionSetById(planning.option_set.research_slice_option_set_id))?.status,
      'ready_for_selection',
    );

    const retried = await ctx.researchSliceRepository.createSelectionDecisionWithSlice(creation);
    assert.equal(retried.research_slice.research_slice_id, creation.research_slice.research_slice_id);
    assert.equal(
      (await ctx.researchSliceRepository.findOptionSetById(planning.option_set.research_slice_option_set_id))?.status,
      'selected',
    );
    assert.equal(
      (await ctx.researchSliceRepository.findOptionById(planning.options[0]!.research_slice_option_id))?.status,
      'selected',
    );
  },
);

prismaRollbackTest(
  'Prisma v1b N6 createFormationRunWithCandidates rolls back partial candidate writes and retries cleanly',
  async (ctx) => {
    const persistence = makeTopicQuestionCandidatePersistence(ctx);
    const duplicateCandidate = {
      ...persistence.candidates[0]!,
      candidate_ordinal: 2,
      candidate_key: 'duplicate_id_but_unique_key',
    };
    const failingPersistence = {
      ...persistence,
      candidates: [persistence.candidates[0]!, duplicateCandidate],
    };

    await assertRejectsWithPrismaCode(
      () => ctx.topicQuestionRepository.createFormationRunWithCandidates(failingPersistence),
      ['P2002'],
    );

    assert.equal(
      await ctx.topicQuestionRepository.findFormationRunById(persistence.form_topic_question_run.form_topic_question_run_id),
      null,
    );
    assert.equal(
      await ctx.topicQuestionRepository.findQuestionFrameById(persistence.question_frame.question_frame_id),
      null,
    );
    assert.equal(
      await ctx.topicQuestionRepository.findCandidateSetById(persistence.candidate_set.topic_question_candidate_set_id),
      null,
    );
    assert.deepEqual(
      await ctx.topicQuestionRepository.listCandidatesByCandidateSetId(persistence.candidate_set.topic_question_candidate_set_id),
      [],
    );

    const retried = await ctx.topicQuestionRepository.createFormationRunWithCandidates(persistence);
    assert.equal(retried.candidates.length, 2);
    assert.equal(retried.candidate_set.topic_question_candidate_set_id, persistence.candidate_set.topic_question_candidate_set_id);
  },
);

prismaRollbackTest(
  'Prisma v1b N7 createSelectionDecisionWithMaterializations rolls back status patches and materializations before retry',
  async (ctx) => {
    const candidatePersistence = makeTopicQuestionCandidatePersistence(ctx);
    await ctx.topicQuestionRepository.createFormationRunWithCandidates(candidatePersistence);
    const selection = makeTopicQuestionSelectionPersistence(ctx, candidatePersistence);
    const failingSelection = clone(selection);
    const firstEvidenceRef = failingSelection.materializations[0]!.evidence_refs[0]!;
    failingSelection.materializations[0]!.evidence_refs.push({
      ...firstEvidenceRef,
      evidence_ref: ctx.ref('evidence_unit', ctx.id('duplicate_question_evidence_ref')),
    });

    await assertRejectsWithPrismaCode(
      () => ctx.topicQuestionRepository.createSelectionDecisionWithMaterializations(failingSelection),
      ['P2002'],
    );

    const materialization = selection.materializations[0]!;
    assert.equal(
      await ctx.topicQuestionRepository.findSelectionDecisionById(selection.decision.topic_question_selection_decision_id),
      null,
    );
    assert.equal(
      await ctx.topicQuestionRepository.findTopicQuestionById(materialization.topic_question.topic_question_id),
      null,
    );
    assert.equal(
      await ctx.topicQuestionRepository.findTopicQuestionContractById(
        materialization.topic_question_contract.topic_question_contract_id,
      ),
      null,
    );
    assert.equal(
      (await ctx.topicQuestionRepository.findCandidateSetById(candidatePersistence.candidate_set.topic_question_candidate_set_id))?.status,
      'ready_for_selection',
    );
    assert.equal(
      (await ctx.topicQuestionRepository.findCandidateById(candidatePersistence.candidates[0]!.topic_question_candidate_id))?.status,
      'recommended',
    );
    assert.deepEqual(
      await ctx.topicQuestionRepository.listEvidenceRefsByContractId(
        materialization.topic_question_contract.topic_question_contract_id,
      ),
      [],
    );

    const retried = await ctx.topicQuestionRepository.createSelectionDecisionWithMaterializations(selection);
    assert.equal(
      retried.materializations[0]!.topic_question.topic_question_id,
      materialization.topic_question.topic_question_id,
    );
    assert.equal(
      (await ctx.topicQuestionRepository.findCandidateSetById(candidatePersistence.candidate_set.topic_question_candidate_set_id))?.status,
      'selected',
    );
    assert.equal(
      (await ctx.topicQuestionRepository.findCandidateById(candidatePersistence.candidates[0]!.topic_question_candidate_id))?.status,
      'admitted',
    );
  },
);

prismaRollbackTest(
  'Prisma v1b N8 createAssessmentWithMemo rolls back partial assessment rows and retries cleanly',
  async (ctx) => {
    const seededQuestion = await seedTitleCardQuestion(ctx);
    const persistence = makeValueAssessmentPersistence(ctx, seededQuestion);
    const failingPersistence = clone(persistence);
    const firstEvidenceRef = failingPersistence.evidence_refs[0]!;
    failingPersistence.evidence_refs.push({
      ...firstEvidenceRef,
      evidence_ref: ctx.ref('evidence_unit', ctx.id('duplicate_value_evidence_ref')),
    });

    await assertRejectsWithPrismaCode(
      () => ctx.valueAssessmentRepository.createAssessmentWithMemo(failingPersistence),
      ['P2002'],
    );

    assert.equal(
      await ctx.valueAssessmentRepository.findAssessmentRunById(persistence.assess_topic_value_run.assess_topic_value_run_id),
      null,
    );
    assert.equal(
      await ctx.valueAssessmentRepository.findInputSnapshotById(
        persistence.topic_value_input_snapshot.topic_value_input_snapshot_id,
      ),
      null,
    );
    assert.equal(
      await ctx.valueAssessmentRepository.findAssessmentById(persistence.topic_value_assessment.topic_value_assessment_id),
      null,
    );
    assert.equal(
      await ctx.valueAssessmentRepository.findReasoningMemoById(
        persistence.value_reasoning_memo.value_reasoning_memo_id,
      ),
      null,
    );
    assert.deepEqual(
      await ctx.valueAssessmentRepository.listEvidenceRefsByAssessmentId(
        persistence.topic_value_assessment.topic_value_assessment_id,
      ),
      [],
    );

    const retried = await ctx.valueAssessmentRepository.createAssessmentWithMemo(persistence);
    assert.equal(
      retried.topic_value_assessment.topic_value_assessment_id,
      persistence.topic_value_assessment.topic_value_assessment_id,
    );
    assert.equal(
      (await ctx.valueAssessmentRepository.listEvidenceRefsByAssessmentId(
        persistence.topic_value_assessment.topic_value_assessment_id,
      )).length,
      1,
    );
  },
);

prismaRollbackTest(
  'Prisma v1b N10 createDraftPackageAuthority rolls back late disposition patch failure and retries cleanly',
  async (ctx) => {
    const seededQuestion = await seedTitleCardQuestion(ctx);
    const seededAssessment = await seedTitleCardValueAssessment(ctx, seededQuestion);
    const persistence = makeTopicPackageAuthorityPersistence(ctx, seededQuestion, seededAssessment);

    await assertRejectsWithPrismaCode(
      () => ctx.topicPackageRepository.createDraftPackageAuthority(persistence),
      ['P2025'],
    );

    assert.equal(
      await ctx.topicPackageRepository.findPackageById(persistence.topic_package.topic_package_id),
      null,
    );
    assert.equal(
      await ctx.topicPackageRepository.findTraceBoundaryCheckById(
        persistence.package_trace_boundary_check.package_trace_boundary_check_id,
      ),
      null,
    );
    assert.equal(
      await ctx.topicPackageRepository.findReadinessAssessmentById(
        persistence.package_readiness_assessment.package_readiness_assessment_id,
      ),
      null,
    );
    assert.equal(
      await ctx.topicPackageRepository.findV1cInputBundleById(persistence.v1c_input_bundle!.v1b_to_v1c_input_bundle_id),
      null,
    );
    assert.equal(
      await ctx.prisma.titleCardResearchRecord.findUnique({
        where: { id: persistence.topic_package.research_record_id },
      }),
      null,
    );

    await seedValueDispositionDecision(ctx, seededQuestion, seededAssessment);
    const retried = await ctx.topicPackageRepository.createDraftPackageAuthority(persistence);
    assert.equal(retried.topic_package.topic_package_id, persistence.topic_package.topic_package_id);
    assert.equal(
      (await ctx.valueAssessmentRepository.findDispositionDecisionById(seededAssessment.dispositionDecisionId))
        ?.output_topic_package_id,
      persistence.topic_package.topic_package_id,
    );
  },
);
