import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify, { type FastifyInstance } from 'fastify';
import { Prisma, PrismaClient } from '@prisma/client';

import {
  TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_METRIC_KEYS,
  type TopicSelectionOfflineEvaluationCaseRecord,
  type TopicSelectionOfflineEvaluationObservedOutput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPackageTraceBoundaryCheckRecord,
  TopicSelectionTopicPackageReadinessAssessmentRecord,
  TopicSelectionTopicPackageRecord,
  TopicSelectionV1bToV1cInputBundleRecord,
  TopicSelectionV1bTopicPackageCreationResult,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-package-contracts';
import type {
  TopicSelectionTopicQuestionEvidenceRefRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import type {
  TopicSelectionPromotionGateRequiredAction,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-gate-contracts';

import { buildApp } from '../app.js';
import { TopicSelectionV1cController } from '../controllers/topic-selection-v1c-controller.js';
import { InMemoryTopicSelectionOfflineEvaluationReplayRepository } from '../repositories/in-memory-topic-selection-offline-evaluation-replay-repository.js';
import { InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository } from '../repositories/in-memory-topic-selection-v1c-downstream-feedback-recheck-repository.js';
import { InMemoryTopicSelectionV1cHumanPromotionDecisionRepository } from '../repositories/in-memory-topic-selection-v1c-human-promotion-decision-repository.js';
import { InMemoryTopicSelectionV1cPaperProjectBridgeRepository } from '../repositories/in-memory-topic-selection-v1c-paper-project-bridge-repository.js';
import { InMemoryTopicSelectionV1cPromotionGateRepository } from '../repositories/in-memory-topic-selection-v1c-promotion-gate-repository.js';
import { InMemoryTopicSelectionV1cPromotionInputRepository } from '../repositories/in-memory-topic-selection-v1c-promotion-input-repository.js';
import type {
  TopicSelectionV1bTopicPackagePersistence,
  TopicSelectionV1bTopicPackageRepository,
} from '../repositories/topic-selection-v1b-topic-package.repository.js';
import { TopicSelectionOfflineEvaluationReplayService } from '../services/topic-selection-offline-evaluation-replay-service.js';
import { sha256Text, stableStringify } from '../services/literature-content-processing-utils.js';
import type { TopicSelectionDownstreamRecheckSink } from '../services/topic-selection-v1c-downstream-feedback-recheck-service.js';
import { TopicSelectionV1cDownstreamFeedbackRecheckService } from '../services/topic-selection-v1c-downstream-feedback-recheck-service.js';
import { TopicSelectionV1cHumanPromotionDecisionService } from '../services/topic-selection-v1c-human-promotion-decision-service.js';
import { TopicSelectionV1cPaperProjectBridgeService } from '../services/topic-selection-v1c-paper-project-bridge-service.js';
import { TopicSelectionV1cPromotionGateService } from '../services/topic-selection-v1c-promotion-gate-service.js';
import { TopicSelectionV1cPromotionInputService } from '../services/topic-selection-v1c-promotion-input-service.js';
import { registerTopicSelectionV1cRoutes } from './topic-selection-v1c-routes.js';

const NOW = '2026-05-16T00:00:00.000Z';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function ref(
  refType: string,
  refId: string,
  titleCardId = 'title_card_v1c_route',
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: titleCardId,
    version_id: versionId,
  };
}

function assertStatus(response: { statusCode: number; body: string }, expected: number): void {
  if (response.statusCode !== expected) {
    assert.fail(`Expected HTTP ${expected}, received ${response.statusCode}: ${response.body}`);
  }
}

function requiredAction(
  actionCode: string,
  refs: TopicSelectionFunctionalRef[],
  loopbackTarget: TopicSelectionPromotionGateRequiredAction['loopback_target'] = 'package',
): TopicSelectionPromotionGateRequiredAction {
  return {
    action_code: actionCode,
    severity: 'blocking',
    loopback_target: loopbackTarget,
    refs,
    reason: `${actionCode} is required before continuing.`,
  };
}

class SeededTopicPackageRepository implements TopicSelectionV1bTopicPackageRepository {
  constructor(
    readonly topicPackage: TopicSelectionTopicPackageRecord,
    readonly traceBoundaryCheck: TopicSelectionPackageTraceBoundaryCheckRecord,
    readonly readinessAssessment: TopicSelectionTopicPackageReadinessAssessmentRecord,
    readonly v1cInputBundle: TopicSelectionV1bToV1cInputBundleRecord,
  ) {}

  async createDraftPackage(
    _persistence: TopicSelectionV1bTopicPackagePersistence,
  ): Promise<TopicSelectionV1bTopicPackageCreationResult> {
    throw new Error('SeededTopicPackageRepository does not support creating draft packages.');
  }

  async findPackageById(topicPackageId: string): Promise<TopicSelectionTopicPackageRecord | null> {
    return topicPackageId === this.topicPackage.topic_package_id ? this.topicPackage : null;
  }

  async findPackageByValueDispositionDecisionId(
    valueDispositionDecisionId: string,
  ): Promise<TopicSelectionTopicPackageRecord | null> {
    return valueDispositionDecisionId === this.topicPackage.value_disposition_decision_id
      ? this.topicPackage
      : null;
  }

  async findTraceBoundaryCheckById(
    traceBoundaryCheckId: string,
  ): Promise<TopicSelectionPackageTraceBoundaryCheckRecord | null> {
    return traceBoundaryCheckId === this.traceBoundaryCheck.package_trace_boundary_check_id
      ? this.traceBoundaryCheck
      : null;
  }

  async findReadinessAssessmentById(
    readinessAssessmentId: string,
  ): Promise<TopicSelectionTopicPackageReadinessAssessmentRecord | null> {
    return readinessAssessmentId === this.readinessAssessment.package_readiness_assessment_id
      ? this.readinessAssessment
      : null;
  }

  async findV1cInputBundleById(
    v1bToV1cInputBundleId: string,
  ): Promise<TopicSelectionV1bToV1cInputBundleRecord | null> {
    return v1bToV1cInputBundleId === this.v1cInputBundle.v1b_to_v1c_input_bundle_id
      ? this.v1cInputBundle
      : null;
  }

  async findV1cInputBundleByPackageId(
    topicPackageId: string,
  ): Promise<TopicSelectionV1bToV1cInputBundleRecord | null> {
    return topicPackageId === this.topicPackage.topic_package_id ? this.v1cInputBundle : null;
  }
}

class NullRecheckSink implements TopicSelectionDownstreamRecheckSink {
  async recordDownstreamFeedback() {
    return {
      event: null,
      impact: null,
      queue_item: null,
    };
  }
}

async function assertPrismaHttpSmokeDatabaseReady(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for T-067 Prisma HTTP smoke test.');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.topicSelectionV1bToV1cInputBundle.findFirst({ select: { id: true } });
    await prisma.topicSelectionDownstreamTopicFeedback.findFirst({ select: { id: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.fail(
      [
        'DATABASE_URL for T-067 Prisma HTTP smoke must point at a reachable Postgres database with repo migrations applied.',
        `Underlying Prisma error: ${message}`,
      ].join(' '),
    );
  } finally {
    await prisma.$disconnect();
  }
}

function makeSeededTopicPackageRepository(suffix: string): SeededTopicPackageRepository {
  const titleCardId = `title_card_${suffix}`;
  const topicPackageId = `topic_package_${suffix}`;
  const packageVersion = 'v1';
  const traceBoundaryCheckId = `package_trace_boundary_check_${suffix}`;
  const readinessAssessmentId = `package_readiness_assessment_${suffix}`;
  const v1cInputBundleId = `v1b_to_v1c_input_bundle_${suffix}`;
  const topicPackageRef = ref('topic_package', topicPackageId, titleCardId, packageVersion);
  const traceBoundaryCheckRef = ref('package_trace_boundary_check', traceBoundaryCheckId, titleCardId, packageVersion);
  const readinessAssessmentRef = ref('topic_package_readiness_assessment', readinessAssessmentId, titleCardId, packageVersion);
  const topicValueAssessmentRef = ref('topic_value_assessment', `topic_value_assessment_${suffix}`, titleCardId);
  const valueReasoningMemoRef = ref('value_reasoning_memo', `value_reasoning_memo_${suffix}`, titleCardId);
  const valueDispositionDecisionRef = ref('value_disposition_decision', `value_disposition_decision_${suffix}`, titleCardId);
  const topicQuestionRef = ref('topic_question', `topic_question_${suffix}`, titleCardId);
  const topicQuestionContractRef = ref('topic_question_contract', `topic_question_contract_${suffix}`, titleCardId);
  const answerabilityPlanRef = ref('topic_question_answerability_plan', `answerability_plan_${suffix}`, titleCardId);
  const researchSliceRef = ref('research_slice', `research_slice_${suffix}`, titleCardId, packageVersion);
  const validatedNeedRefs = [ref('validated_need', `validated_need_${suffix}`, titleCardId)];
  const evidenceFunctionalRef = ref('evidence_unit', `evidence_unit_${suffix}`, titleCardId);
  const evidenceRefs: TopicSelectionTopicQuestionEvidenceRefRecord[] = [
    {
      topic_question_evidence_ref_id: `topic_question_evidence_ref_${suffix}`,
      workspace_id: null,
      title_card_id: titleCardId,
      topic_question_id: topicQuestionRef.ref_id,
      topic_question_contract_id: topicQuestionContractRef.ref_id,
      evidence_ref: evidenceFunctionalRef,
      evidence_role: 'support',
      mapped_question_part: 'main_question',
      rationale: 'Supports the reviewer-facing topic promotion claim.',
      source_locator_snapshot: {},
      created_at: NOW,
    },
  ];
  const topicPackage: TopicSelectionTopicPackageRecord = {
    topic_package_id: topicPackageId,
    workspace_id: null,
    title_card_id: titleCardId,
    research_record_id: `research_record_${suffix}`,
    topic_question_id: topicQuestionRef.ref_id,
    topic_question_contract_id: topicQuestionContractRef.ref_id,
    topic_value_assessment_id: topicValueAssessmentRef.ref_id,
    value_reasoning_memo_id: valueReasoningMemoRef.ref_id,
    value_disposition_decision_id: valueDispositionDecisionRef.ref_id,
    research_slice_id: researchSliceRef.ref_id,
    research_slice_version: packageVersion,
    package_version: packageVersion,
    package_readiness_status: 'ready_for_promotion_review',
    topic_package_ref: topicPackageRef,
    topic_value_assessment_ref: topicValueAssessmentRef,
    value_reasoning_memo_ref: valueReasoningMemoRef,
    value_disposition_decision_ref: valueDispositionDecisionRef,
    topic_question_ref: topicQuestionRef,
    topic_question_contract_ref: topicQuestionContractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: validatedNeedRefs,
    evidence_refs: evidenceRefs,
    selected_evidence_refs: [evidenceFunctionalRef],
    accepted_risk_refs: [],
    blocker_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    title_candidates: ['Reviewer-aligned topic promotion bridge'],
    research_background: 'Reviewer-facing topic promotion needs traceable claims and evidence.',
    contribution_summary: 'A focused contribution summary for paper engineering workflows.',
    candidate_methods: ['offline replay', 'manual review'],
    evaluation_plan: 'Evaluate trace completeness and reviewer alignment on frozen cases.',
    key_risks: ['Evidence freshness drift.'],
    non_goals: ['Do not claim production deployment superiority.'],
    selected_literature_evidence_ids: ['LIT-v1c-route'],
    package_payload: {
      claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
      prohibited_claims: ['production deployment superiority'],
      contribution_summary: 'A focused contribution summary for paper engineering workflows.',
      evaluation_plan: 'Evaluate trace completeness and reviewer alignment on frozen cases.',
    },
    trace_boundary_check_id: traceBoundaryCheckId,
    readiness_assessment_id: readinessAssessmentId,
    v1c_input_bundle_id: v1cInputBundleId,
    trace_snapshot_id: `trace_snapshot_${suffix}`,
    input_snapshot_id: `input_snapshot_${suffix}`,
    workflow_run_id: `workflow_run_${suffix}`,
    gate_result_id: `readiness_gate_result_${suffix}`,
    transition_attempt_id: `chain_transition_attempt_${suffix}`,
    artifact_refs: [ref('artifact_ref', `artifact_ref_package_${suffix}`, titleCardId)],
    created_by: 'system',
    created_at: NOW,
    updated_at: NOW,
  };
  const traceBoundaryCheck: TopicSelectionPackageTraceBoundaryCheckRecord = {
    package_trace_boundary_check_id: traceBoundaryCheckId,
    workspace_id: null,
    title_card_id: titleCardId,
    topic_package_id: topicPackageId,
    value_disposition_decision_id: valueDispositionDecisionRef.ref_id,
    topic_value_assessment_id: topicValueAssessmentRef.ref_id,
    topic_question_contract_id: topicQuestionContractRef.ref_id,
    research_slice_id: researchSliceRef.ref_id,
    check_status: 'passed',
    package_ref: topicPackageRef,
    topic_value_assessment_ref: topicValueAssessmentRef,
    value_reasoning_memo_ref: valueReasoningMemoRef,
    value_disposition_decision_ref: valueDispositionDecisionRef,
    topic_question_ref: topicQuestionRef,
    topic_question_contract_ref: topicQuestionContractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: validatedNeedRefs,
    evidence_refs: [evidenceFunctionalRef],
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    missing_ref_codes: [],
    new_ref_codes: [],
    boundary_conflict_codes: [],
    carry_forward_codes: [],
    trace_issues: [],
    boundary_issues: [],
    narrative_consistency: {},
    input_snapshot_id: `input_snapshot_trace_${suffix}`,
    workflow_run_id: `workflow_run_trace_${suffix}`,
    gate_result_id: `readiness_gate_result_trace_${suffix}`,
    transition_attempt_id: `chain_transition_attempt_trace_${suffix}`,
    artifact_refs: [ref('artifact_ref', `artifact_ref_trace_${suffix}`, titleCardId)],
    created_at: NOW,
  };
  const readinessAssessment: TopicSelectionTopicPackageReadinessAssessmentRecord = {
    package_readiness_assessment_id: readinessAssessmentId,
    workspace_id: null,
    title_card_id: titleCardId,
    topic_package_id: topicPackageId,
    value_disposition_decision_id: valueDispositionDecisionRef.ref_id,
    package_trace_boundary_check_id: traceBoundaryCheckId,
    package_version: packageVersion,
    package_readiness_status: 'ready_for_promotion_review',
    blockers: [],
    warnings: [],
    required_actions: [],
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    input_snapshot_id: `input_snapshot_readiness_${suffix}`,
    workflow_run_id: `workflow_run_readiness_${suffix}`,
    gate_result_id: `readiness_gate_result_readiness_${suffix}`,
    transition_attempt_id: `chain_transition_attempt_readiness_${suffix}`,
    artifact_refs: [ref('artifact_ref', `artifact_ref_readiness_${suffix}`, titleCardId)],
    assessed_by: 'system',
    created_at: NOW,
  };
  const bundleHash = sha256Text(stableStringify({
    check_ref: traceBoundaryCheckRef,
    package_ref: topicPackageRef,
    package_version: packageVersion,
    readiness_ref: readinessAssessmentRef,
    value_disposition_decision_ref: valueDispositionDecisionRef,
  }));
  const v1cInputBundle: TopicSelectionV1bToV1cInputBundleRecord = {
    v1b_to_v1c_input_bundle_id: v1cInputBundleId,
    workspace_id: null,
    title_card_id: titleCardId,
    topic_package_id: topicPackageId,
    package_version: packageVersion,
    package_readiness_status: 'ready_for_promotion_review',
    bundle_status: 'ready_for_promotion_review',
    topic_package_ref: topicPackageRef,
    package_trace_boundary_check_ref: traceBoundaryCheckRef,
    package_readiness_assessment_ref: readinessAssessmentRef,
    topic_value_assessment_ref: topicValueAssessmentRef,
    value_reasoning_memo_ref: valueReasoningMemoRef,
    value_disposition_decision_ref: valueDispositionDecisionRef,
    topic_question_ref: topicQuestionRef,
    topic_question_contract_ref: topicQuestionContractRef,
    answerability_plan_ref: answerabilityPlanRef,
    research_slice_ref: researchSliceRef,
    validated_need_refs: validatedNeedRefs,
    evidence_refs: evidenceRefs,
    accepted_risk_refs: [],
    blocker_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    readiness_check_refs: [traceBoundaryCheckRef, readinessAssessmentRef],
    package_snapshot: topicPackage,
    package_draft_input_snapshot: {
      question_contract: {
        claim_ceiling: 'Can claim reviewer-aligned planning feasibility, not production superiority.',
      },
      evaluation_plan: 'Evaluate trace completeness and reviewer alignment on frozen cases.',
    } as never,
    bundle_hash: bundleHash,
    input_snapshot_id: `input_snapshot_bundle_${suffix}`,
    workflow_run_id: `workflow_run_bundle_${suffix}`,
    gate_result_id: `readiness_gate_result_bundle_${suffix}`,
    transition_attempt_id: `chain_transition_attempt_bundle_${suffix}`,
    artifact_refs: [ref('artifact_ref', `artifact_ref_bundle_${suffix}`, titleCardId)],
    created_at: NOW,
  };
  return new SeededTopicPackageRepository(
    topicPackage,
    traceBoundaryCheck,
    readinessAssessment,
    v1cInputBundle,
  );
}

async function seedReadyV1cInputBundleInPrisma(
  prisma: PrismaClient,
  suffix: string,
): Promise<SeededTopicPackageRepository> {
  const repository = makeSeededTopicPackageRepository(suffix);
  const topicPackage = repository.topicPackage;
  const traceBoundaryCheck = repository.traceBoundaryCheck;
  const readinessAssessment = repository.readinessAssessment;
  const v1cInputBundle = repository.v1cInputBundle;
  const now = new Date(NOW);
  const questionRecordId = `research_record_question_${suffix}`;
  const valueRecordId = `research_record_value_${suffix}`;

  await prisma.$transaction(async (tx) => {
    await tx.titleCard.create({
      data: {
        id: topicPackage.title_card_id,
        workingTitle: `Topic Selection v1c Prisma Smoke ${suffix}`,
        brief: 'Seeded ready v1b-to-v1c bundle for Prisma-backed v1c HTTP smoke.',
        status: 'draft',
        basketUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    await tx.titleCardResearchRecord.create({
      data: {
        id: questionRecordId,
        titleCardId: topicPackage.title_card_id,
        recordType: 'research_question',
        recordStatus: 'completed',
        sourceRecordIds: toJsonValue([]),
        lineage: toJsonValue({ source: 'topic_selection_v1c_prisma_smoke_seed' }),
        summary: 'Seeded topic question for v1c Prisma smoke.',
        confidence: new Prisma.Decimal('1.000'),
        blockingIssues: toJsonValue([]),
        missingInformation: toJsonValue([]),
        nextActions: toJsonValue([]),
        evidenceRefs: toJsonValue(topicPackage.selected_evidence_refs),
        payload: toJsonValue({}),
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    });
    await tx.titleCardResearchQuestion.create({
      data: {
        id: topicPackage.topic_question_id,
        titleCardId: topicPackage.title_card_id,
        researchRecordId: questionRecordId,
        mainQuestion: 'Can a local-first assistant improve trace completeness for reviewer-aligned paper planning?',
        subQuestions: toJsonValue(['Which promotion bridge trace gaps remain visible?']),
        researchSlice: 'Offline reviewer-aligned evidence planning workflows.',
        contributionHypothesis: 'system',
        sourceNeedReviewIds: toJsonValue(topicPackage.validated_need_refs.map((sourceRef) => sourceRef.ref_id)),
        sourceLiteratureEvidenceIds: toJsonValue(topicPackage.selected_literature_evidence_ids),
        v1bResearchSliceId: topicPackage.research_slice_id,
        v1bResearchSliceVersion: topicPackage.research_slice_version,
        v1bSourceCandidateSetId: null,
        v1bSourceCandidateId: null,
        v1bSelectionDecisionId: null,
        v1bActiveQuestionContractId: topicPackage.topic_question_contract_id,
        v1bQuestionType: 'system',
        v1bQuestionStatus: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });
    await tx.titleCardResearchRecord.create({
      data: {
        id: valueRecordId,
        titleCardId: topicPackage.title_card_id,
        recordType: 'value_assessment',
        recordStatus: 'completed',
        sourceRecordIds: toJsonValue([topicPackage.topic_question_id]),
        lineage: toJsonValue({ source: 'topic_selection_v1c_prisma_smoke_seed' }),
        summary: 'Seeded value assessment for v1c Prisma smoke.',
        confidence: new Prisma.Decimal('1.000'),
        blockingIssues: toJsonValue([]),
        missingInformation: toJsonValue([]),
        nextActions: toJsonValue([]),
        evidenceRefs: toJsonValue(topicPackage.selected_evidence_refs),
        payload: toJsonValue({}),
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    });
    await tx.titleCardValueAssessment.create({
      data: {
        id: topicPackage.topic_value_assessment_id,
        titleCardId: topicPackage.title_card_id,
        researchQuestionId: topicPackage.topic_question_id,
        researchRecordId: valueRecordId,
        strongestClaimIfSuccess: 'Reviewer-aligned planning feasibility in offline replay.',
        fallbackClaimIfSuccess: 'Trace gaps are surfaced earlier than manual planning.',
        hardGates: toJsonValue([]),
        scoredDimensions: toJsonValue([]),
        riskPenalty: toJsonValue({}),
        reviewerObjections: toJsonValue([]),
        ceilingCase: String(topicPackage.package_payload.claim_ceiling),
        baseCase: 'Trace completeness improves over manual planning.',
        floorCase: 'Trace boundary gaps become auditable.',
        verdict: 'promote',
        totalScore: new Prisma.Decimal('90.00'),
        v1bSourceQuestionContractId: topicPackage.topic_question_contract_id,
        v1bSourceResearchSliceId: topicPackage.research_slice_id,
        v1bSourceResearchSliceVersion: topicPackage.research_slice_version,
        v1bAssessmentRunId: null,
        v1bInputSnapshotId: null,
        v1bReasoningMemoId: topicPackage.value_reasoning_memo_id,
        v1bActiveDispositionDecisionId: topicPackage.value_disposition_decision_id,
        v1bReadinessStatus: 'ready',
        v1bFreshnessStatus: 'current',
        createdAt: now,
        updatedAt: now,
      },
    });
    await tx.titleCardResearchRecord.create({
      data: {
        id: topicPackage.research_record_id,
        titleCardId: topicPackage.title_card_id,
        recordType: 'package',
        recordStatus: 'completed',
        sourceRecordIds: toJsonValue([
          topicPackage.topic_question_id,
          topicPackage.topic_value_assessment_id,
          topicPackage.value_disposition_decision_id,
        ]),
        lineage: toJsonValue({ source: 'topic_selection_v1c_prisma_smoke_seed' }),
        summary: topicPackage.contribution_summary,
        confidence: new Prisma.Decimal('1.000'),
        blockingIssues: toJsonValue(topicPackage.blocker_refs),
        missingInformation: toJsonValue(topicPackage.key_risks),
        nextActions: toJsonValue([]),
        evidenceRefs: toJsonValue(topicPackage.selected_evidence_refs),
        payload: toJsonValue(topicPackage),
        createdBy: topicPackage.created_by,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    });
    await tx.titleCardPackage.create({
      data: {
        id: topicPackage.topic_package_id,
        titleCardId: topicPackage.title_card_id,
        researchQuestionId: topicPackage.topic_question_id,
        valueAssessmentId: topicPackage.topic_value_assessment_id,
        researchRecordId: topicPackage.research_record_id,
        titleCandidates: toJsonValue(topicPackage.title_candidates),
        researchBackground: topicPackage.research_background,
        contributionSummary: topicPackage.contribution_summary,
        candidateMethods: toJsonValue(topicPackage.candidate_methods),
        evaluationPlan: topicPackage.evaluation_plan,
        keyRisks: toJsonValue(topicPackage.key_risks),
        selectedLiteratureEvidenceIds: toJsonValue(topicPackage.selected_literature_evidence_ids),
        v1bPackageVersion: topicPackage.package_version,
        v1bReadinessStatus: topicPackage.package_readiness_status,
        v1bSourceValueDispositionDecisionId: topicPackage.value_disposition_decision_id,
        v1bSourceQuestionContractId: topicPackage.topic_question_contract_id,
        v1bSourceResearchSliceId: topicPackage.research_slice_id,
        v1bSourceResearchSliceVersion: topicPackage.research_slice_version,
        v1bValueReasoningMemoId: topicPackage.value_reasoning_memo_id,
        v1bTraceBoundaryCheckId: topicPackage.trace_boundary_check_id,
        v1bReadinessAssessmentId: topicPackage.readiness_assessment_id,
        v1bToV1cInputBundleId: topicPackage.v1c_input_bundle_id,
        v1bTraceSnapshotId: topicPackage.trace_snapshot_id,
        v1bInputSnapshotId: topicPackage.input_snapshot_id,
        v1bWorkflowRunId: topicPackage.workflow_run_id,
        v1bGateResultId: topicPackage.gate_result_id,
        v1bTransitionAttemptId: topicPackage.transition_attempt_id,
        v1bAuthorityRefs: toJsonValue([
          topicPackage.topic_value_assessment_ref,
          topicPackage.value_reasoning_memo_ref,
          topicPackage.value_disposition_decision_ref,
          topicPackage.topic_question_contract_ref,
          topicPackage.research_slice_ref,
          ...topicPackage.validated_need_refs,
          ...topicPackage.selected_evidence_refs,
        ]),
        v1bAuthorityPayload: toJsonValue(topicPackage),
        createdAt: now,
        updatedAt: now,
      },
    });
    await tx.topicSelectionPackageTraceBoundaryCheck.create({
      data: {
        id: traceBoundaryCheck.package_trace_boundary_check_id,
        workspaceId: traceBoundaryCheck.workspace_id ?? null,
        titleCardId: traceBoundaryCheck.title_card_id,
        topicPackageId: traceBoundaryCheck.topic_package_id,
        valueDispositionDecisionId: traceBoundaryCheck.value_disposition_decision_id,
        topicValueAssessmentId: traceBoundaryCheck.topic_value_assessment_id,
        topicQuestionContractId: traceBoundaryCheck.topic_question_contract_id,
        researchSliceId: traceBoundaryCheck.research_slice_id,
        checkStatus: traceBoundaryCheck.check_status,
        packageRef: toJsonValue(traceBoundaryCheck.package_ref),
        topicValueAssessmentRef: toJsonValue(traceBoundaryCheck.topic_value_assessment_ref),
        valueReasoningMemoRef: toJsonValue(traceBoundaryCheck.value_reasoning_memo_ref),
        valueDispositionDecisionRef: toJsonValue(traceBoundaryCheck.value_disposition_decision_ref),
        topicQuestionRef: toJsonValue(traceBoundaryCheck.topic_question_ref),
        topicQuestionContractRef: toJsonValue(traceBoundaryCheck.topic_question_contract_ref),
        answerabilityPlanRef: toJsonValue(traceBoundaryCheck.answerability_plan_ref),
        researchSliceRef: toJsonValue(traceBoundaryCheck.research_slice_ref),
        validatedNeedRefs: toJsonValue(traceBoundaryCheck.validated_need_refs),
        evidenceRefs: toJsonValue(traceBoundaryCheck.evidence_refs),
        acceptedRiskRefs: toJsonValue(traceBoundaryCheck.accepted_risk_refs),
        blockerRefs: toJsonValue(traceBoundaryCheck.blocker_refs),
        recheckRequestRefs: toJsonValue(traceBoundaryCheck.recheck_request_refs),
        missingRefCodes: traceBoundaryCheck.missing_ref_codes,
        newRefCodes: traceBoundaryCheck.new_ref_codes,
        boundaryConflictCodes: traceBoundaryCheck.boundary_conflict_codes,
        carryForwardCodes: traceBoundaryCheck.carry_forward_codes,
        traceIssues: toJsonValue(traceBoundaryCheck.trace_issues),
        boundaryIssues: toJsonValue(traceBoundaryCheck.boundary_issues),
        narrativeConsistency: toJsonValue(traceBoundaryCheck.narrative_consistency),
        inputSnapshotId: traceBoundaryCheck.input_snapshot_id,
        workflowRunId: traceBoundaryCheck.workflow_run_id,
        gateResultId: traceBoundaryCheck.gate_result_id,
        transitionAttemptId: traceBoundaryCheck.transition_attempt_id,
        artifactRefs: toJsonValue(traceBoundaryCheck.artifact_refs),
        createdAt: now,
      },
    });
    await tx.topicSelectionTopicPackageReadinessAssessment.create({
      data: {
        id: readinessAssessment.package_readiness_assessment_id,
        workspaceId: readinessAssessment.workspace_id ?? null,
        titleCardId: readinessAssessment.title_card_id,
        topicPackageId: readinessAssessment.topic_package_id,
        valueDispositionDecisionId: readinessAssessment.value_disposition_decision_id,
        packageTraceBoundaryCheckId: readinessAssessment.package_trace_boundary_check_id,
        packageVersion: readinessAssessment.package_version,
        packageReadinessStatus: readinessAssessment.package_readiness_status,
        blockers: toJsonValue(readinessAssessment.blockers),
        warnings: toJsonValue(readinessAssessment.warnings),
        requiredActions: readinessAssessment.required_actions,
        acceptedRiskRefs: toJsonValue(readinessAssessment.accepted_risk_refs),
        blockerRefs: toJsonValue(readinessAssessment.blocker_refs),
        recheckRequestRefs: toJsonValue(readinessAssessment.recheck_request_refs),
        inputSnapshotId: readinessAssessment.input_snapshot_id,
        workflowRunId: readinessAssessment.workflow_run_id,
        gateResultId: readinessAssessment.gate_result_id,
        transitionAttemptId: readinessAssessment.transition_attempt_id,
        artifactRefs: toJsonValue(readinessAssessment.artifact_refs),
        assessedBy: readinessAssessment.assessed_by,
        createdAt: now,
      },
    });
    await tx.topicSelectionV1bToV1cInputBundle.create({
      data: {
        id: v1cInputBundle.v1b_to_v1c_input_bundle_id,
        workspaceId: v1cInputBundle.workspace_id ?? null,
        titleCardId: v1cInputBundle.title_card_id,
        topicPackageId: v1cInputBundle.topic_package_id,
        packageVersion: v1cInputBundle.package_version,
        packageReadinessStatus: v1cInputBundle.package_readiness_status,
        bundleStatus: v1cInputBundle.bundle_status,
        topicPackageRef: toJsonValue(v1cInputBundle.topic_package_ref),
        packageTraceBoundaryCheckRef: toJsonValue(v1cInputBundle.package_trace_boundary_check_ref),
        packageReadinessAssessmentRef: toJsonValue(v1cInputBundle.package_readiness_assessment_ref),
        topicValueAssessmentRef: toJsonValue(v1cInputBundle.topic_value_assessment_ref),
        valueReasoningMemoRef: toJsonValue(v1cInputBundle.value_reasoning_memo_ref),
        valueDispositionDecisionRef: toJsonValue(v1cInputBundle.value_disposition_decision_ref),
        topicQuestionRef: toJsonValue(v1cInputBundle.topic_question_ref),
        topicQuestionContractRef: toJsonValue(v1cInputBundle.topic_question_contract_ref),
        answerabilityPlanRef: toJsonValue(v1cInputBundle.answerability_plan_ref),
        researchSliceRef: toJsonValue(v1cInputBundle.research_slice_ref),
        validatedNeedRefs: toJsonValue(v1cInputBundle.validated_need_refs),
        evidenceRefs: toJsonValue(v1cInputBundle.evidence_refs),
        acceptedRiskRefs: toJsonValue(v1cInputBundle.accepted_risk_refs),
        blockerRefs: toJsonValue(v1cInputBundle.blocker_refs),
        memorySuggestionRefs: toJsonValue(v1cInputBundle.memory_suggestion_refs),
        recheckRequestRefs: toJsonValue(v1cInputBundle.recheck_request_refs),
        readinessCheckRefs: toJsonValue(v1cInputBundle.readiness_check_refs),
        packageSnapshot: toJsonValue(v1cInputBundle.package_snapshot),
        packageDraftInputSnapshot: toJsonValue(v1cInputBundle.package_draft_input_snapshot),
        bundleHash: v1cInputBundle.bundle_hash,
        inputSnapshotId: v1cInputBundle.input_snapshot_id,
        workflowRunId: v1cInputBundle.workflow_run_id,
        gateResultId: v1cInputBundle.gate_result_id,
        transitionAttemptId: v1cInputBundle.transition_attempt_id,
        artifactRefs: toJsonValue(v1cInputBundle.artifact_refs),
        createdAt: now,
      },
    });
  });

  return repository;
}

type V1cRouteHarness = {
  app: FastifyInstance;
  offlineReplayService: TopicSelectionOfflineEvaluationReplayService;
};

async function makeV1cRouteApp(
  topicPackageRepository: TopicSelectionV1bTopicPackageRepository,
): Promise<FastifyInstance> {
  return (await makeV1cRouteHarness(topicPackageRepository)).app;
}

async function makeV1cRouteHarness(
  topicPackageRepository: TopicSelectionV1bTopicPackageRepository,
): Promise<V1cRouteHarness> {
  const app = Fastify({ logger: false });
  app.setErrorHandler((error, _request, reply) => {
    if ('validation' in error) {
      reply.status(400).send({
        error: {
          code: 'INVALID_PAYLOAD',
          message: error instanceof Error ? error.message : 'Request payload failed schema validation.',
        },
      });
      return;
    }
    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });
  const promotionInputService = new TopicSelectionV1cPromotionInputService({
    repository: new InMemoryTopicSelectionV1cPromotionInputRepository(),
    topicPackageRepository,
    now: () => NOW,
  });
  const promotionGateService = new TopicSelectionV1cPromotionGateService({
    repository: new InMemoryTopicSelectionV1cPromotionGateRepository(),
    promotionInputService,
    now: () => NOW,
  });
  const humanPromotionDecisionService = new TopicSelectionV1cHumanPromotionDecisionService({
    repository: new InMemoryTopicSelectionV1cHumanPromotionDecisionRepository(),
    promotionGateService,
    now: () => NOW,
  });
  const paperProjectBridgeService = new TopicSelectionV1cPaperProjectBridgeService({
    repository: new InMemoryTopicSelectionV1cPaperProjectBridgeRepository(),
    humanPromotionDecisionService,
    now: () => NOW,
  });
  const downstreamFeedbackRecheckService = new TopicSelectionV1cDownstreamFeedbackRecheckService({
    repository: new InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository(),
    paperProjectBridgeService,
    recheckRiskMemoryService: new NullRecheckSink(),
    now: () => NOW,
  });
  const offlineReplayService = new TopicSelectionOfflineEvaluationReplayService(
    new InMemoryTopicSelectionOfflineEvaluationReplayRepository(),
    { now: () => NOW },
  );
  const controller = new TopicSelectionV1cController(
    promotionInputService,
    promotionGateService,
    humanPromotionDecisionService,
    paperProjectBridgeService,
    downstreamFeedbackRecheckService,
    offlineReplayService,
  );
  await registerTopicSelectionV1cRoutes(app, controller);
  return { app, offlineReplayService };
}

async function createReadyGate(app: FastifyInstance, v1cInputBundleId: string) {
  const snapshotRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1c/promotion-input-snapshots',
    payload: {
      v1b_to_v1c_input_bundle_id: v1cInputBundleId,
      created_by: 'system',
    },
  });
  assertStatus(snapshotRes, 201);
  const snapshot = snapshotRes.json() as {
    promotion_input_snapshot_id: string;
    closure_status: string;
    promotion_input_snapshot_hash: string;
  };
  assert.equal(snapshot.closure_status, 'ready_for_gate');

  const gateRes = await app.inject({
    method: 'POST',
    url: '/topic-selection/v1c/promotion-gate-checks',
    payload: {
      promotion_input_snapshot_id: snapshot.promotion_input_snapshot_id,
      created_by: 'system',
    },
  });
  assertStatus(gateRes, 201);
  const gateBundle = gateRes.json() as {
    promotion_decision_support: { promotion_decision_support_id: string };
    promotion_dossier: { promotion_dossier_id: string };
    argument_readiness_mini_check: { argument_readiness_mini_check_id: string };
    promotion_gate_check: {
      promotion_gate_check_id: string;
      promotion_input_snapshot_hash: string;
      disposition: string;
      promote_allowed: boolean;
      promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
    };
  };
  assert.equal(gateBundle.promotion_gate_check.disposition, 'ready_for_human_decision');
  assert.equal(gateBundle.promotion_gate_check.promote_allowed, true);
  return { snapshot, gateBundle };
}

test('topic-selection v1c HTTP routes drive ready bundle to bridge and downstream recheck projection', async () => {
  const repository = makeSeededTopicPackageRepository(uniqueId('promote'));
  const app = await makeV1cRouteApp(repository);
  try {
    const { snapshot, gateBundle } = await createReadyGate(app, repository.v1cInputBundle.v1b_to_v1c_input_bundle_id);

    const earlyBridgeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/paper-project-bridges',
      payload: {
        promotion_decision_id: 'promotion_decision_missing',
        created_by: 'system',
      },
    });
    assert.equal(earlyBridgeRes.statusCode, 404);

    for (const [url, id] of [
      ['/topic-selection/v1c/promotion-input-snapshots', snapshot.promotion_input_snapshot_id],
      ['/topic-selection/v1c/promotion-decision-support', gateBundle.promotion_decision_support.promotion_decision_support_id],
      ['/topic-selection/v1c/promotion-dossiers', gateBundle.promotion_dossier.promotion_dossier_id],
      ['/topic-selection/v1c/argument-readiness-mini-checks', gateBundle.argument_readiness_mini_check.argument_readiness_mini_check_id],
      ['/topic-selection/v1c/promotion-gate-checks', gateBundle.promotion_gate_check.promotion_gate_check_id],
    ]) {
      const readRes = await app.inject({ method: 'GET', url: `${url}/${encodeURIComponent(id)}` });
      assertStatus(readRes, 200);
    }

    const supportAliasRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/promotion-decision-support',
      payload: {
        promotion_input_snapshot_id: snapshot.promotion_input_snapshot_id,
        created_by: 'system',
      },
    });
    assertStatus(supportAliasRes, 201);
    const supportAlias = supportAliasRes.json() as {
      promotion_decision_support: { promotion_decision_support_id: string };
      promotion_gate_check: { promotion_gate_check_id: string };
    };
    assert.equal(
      supportAlias.promotion_decision_support.promotion_decision_support_id,
      gateBundle.promotion_decision_support.promotion_decision_support_id,
    );
    assert.equal(
      supportAlias.promotion_gate_check.promotion_gate_check_id,
      gateBundle.promotion_gate_check.promotion_gate_check_id,
    );

    const conditionRefs = [gateBundle.promotion_gate_check.promotion_input_snapshot_ref];
    const humanRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/promotion-decisions',
      payload: {
        promotion_gate_check_id: gateBundle.promotion_gate_check.promotion_gate_check_id,
        decision: 'promote_with_conditions',
        human_actor: { actor_type: 'human', actor_id: 'route-reviewer' },
        rationale: 'Explicitly authorize promotion with bounded claim obligations.',
        confirmed_snapshot_hash: gateBundle.promotion_gate_check.promotion_input_snapshot_hash,
        conditions: [
          {
            condition_id: 'condition_route_001',
            condition_code: 'verify_claim_ceiling',
            owner: { actor_type: 'human', actor_id: 'paper-owner' },
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
    });
    assertStatus(humanRes, 201);
    const human = humanRes.json() as {
      human_promotion_decision: { human_promotion_decision_id: string };
      promotion_decision: {
        promotion_decision_id: string;
        bridge_eligible: boolean;
        promotion_commitment_profile_id: string;
      };
      promotion_commitment_profile: { promotion_commitment_profile_id: string; conditions: unknown[] };
      bridge_handoff: unknown;
    };
    assert.equal(human.promotion_decision.bridge_eligible, true);
    assert.ok(human.bridge_handoff);
    assert.equal(human.promotion_commitment_profile.conditions.length, 1);

    for (const url of [
      `/topic-selection/v1c/human-promotion-decisions/${encodeURIComponent(human.human_promotion_decision.human_promotion_decision_id)}`,
      `/topic-selection/v1c/promotion-decisions/${encodeURIComponent(human.promotion_decision.promotion_decision_id)}`,
      `/topic-selection/v1c/promotion-decisions/${encodeURIComponent(human.promotion_decision.promotion_decision_id)}/bundle`,
      `/topic-selection/v1c/promotion-commitment-profiles/${encodeURIComponent(human.promotion_commitment_profile.promotion_commitment_profile_id)}`,
    ]) {
      const readRes = await app.inject({ method: 'GET', url });
      assertStatus(readRes, 200);
    }

    const bridgeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/paper-project-bridges',
      payload: {
        promotion_decision_id: human.promotion_decision.promotion_decision_id,
        created_by: 'system',
      },
    });
    assertStatus(bridgeRes, 201);
    const bridge = bridgeRes.json() as {
      paper_project_bridge: {
        paper_project_bridge_id: string;
        bridge_status: string;
        paper_project_intake_ref: null;
      };
    };
    assert.equal(bridge.paper_project_bridge.bridge_status, 'active');
    assert.equal(bridge.paper_project_bridge.paper_project_intake_ref, null);

    const bridgeReadRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/paper-project-bridges/${encodeURIComponent(bridge.paper_project_bridge.paper_project_bridge_id)}`,
    });
    assertStatus(bridgeReadRes, 200);
    assert.equal(
      (bridgeReadRes.json() as { paper_project_bridge_id: string }).paper_project_bridge_id,
      bridge.paper_project_bridge.paper_project_bridge_id,
    );

    const duplicateBridgeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/paper-project-bridges',
      payload: {
        promotion_decision_id: human.promotion_decision.promotion_decision_id,
        created_by: 'system',
      },
    });
    assertStatus(duplicateBridgeRes, 201);
    assert.equal(
      (duplicateBridgeRes.json() as { paper_project_bridge: { paper_project_bridge_id: string } }).paper_project_bridge.paper_project_bridge_id,
      bridge.paper_project_bridge.paper_project_bridge_id,
    );

    const feedbackRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/downstream-feedback',
      payload: {
        paper_project_bridge_id: bridge.paper_project_bridge.paper_project_bridge_id,
        downstream_source_kind: 'paper_project',
        downstream_source_ref: ref('paper_project_section', 'introduction'),
        feedback_signal: 'overclaim',
        severity: 'blocking',
        summary: 'Draft introduction overclaims beyond the frozen promotion commitment.',
        required_action: 'Reassess value claim ceiling before continuing the paper draft.',
        created_by: 'human',
      },
    });
    assertStatus(feedbackRes, 201);
    const feedback = feedbackRes.json() as {
      downstream_topic_feedback: { downstream_topic_feedback_id: string; recheck_request: { downstream_recheck_request_id: string } };
      classification: { loopback_target: string; loopback_cause: string; requires_recheck: boolean };
    };
    assert.equal(feedback.classification.loopback_target, 'value_assessment');
    assert.equal(feedback.classification.loopback_cause, 'overclaim');
    assert.equal(feedback.classification.requires_recheck, true);

    const feedbackReadRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/downstream-feedback/${encodeURIComponent(feedback.downstream_topic_feedback.downstream_topic_feedback_id)}`,
    });
    assertStatus(feedbackReadRes, 200);
    assert.equal(
      (feedbackReadRes.json() as { downstream_topic_feedback_id: string }).downstream_topic_feedback_id,
      feedback.downstream_topic_feedback.downstream_topic_feedback_id,
    );

    const recheckByFeedbackRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/downstream-feedback/${encodeURIComponent(feedback.downstream_topic_feedback.downstream_topic_feedback_id)}/recheck-request`,
    });
    assertStatus(recheckByFeedbackRes, 200);
    const recheckByIdRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/recheck-requests/${encodeURIComponent(feedback.downstream_topic_feedback.recheck_request.downstream_recheck_request_id)}`,
    });
    assertStatus(recheckByIdRes, 200);
    const listRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/paper-project-bridges/${encodeURIComponent(bridge.paper_project_bridge.paper_project_bridge_id)}/downstream-feedback`,
    });
    assertStatus(listRes, 200);
    assert.equal((listRes.json() as { items: unknown[] }).items.length, 1);

    const noRecheckFeedbackRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/downstream-feedback',
      payload: {
        paper_project_bridge_id: bridge.paper_project_bridge.paper_project_bridge_id,
        downstream_source_kind: 'paper_project',
        downstream_source_ref: ref('paper_project_section', 'related_work'),
        feedback_signal: 'no_recheck_needed',
        severity: 'info',
        summary: 'Downstream note is recorded for lineage only.',
        created_by: 'human',
      },
    });
    assertStatus(noRecheckFeedbackRes, 201);
    const noRecheckFeedback = noRecheckFeedbackRes.json() as {
      downstream_topic_feedback: { downstream_topic_feedback_id: string; recheck_request: null };
      classification: { requires_recheck: boolean };
      recheck_request: null;
    };
    assert.equal(noRecheckFeedback.classification.requires_recheck, false);
    assert.equal(noRecheckFeedback.downstream_topic_feedback.recheck_request, null);
    assert.equal(noRecheckFeedback.recheck_request, null);
    const missingRecheckProjectionRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/downstream-feedback/${encodeURIComponent(noRecheckFeedback.downstream_topic_feedback.downstream_topic_feedback_id)}/recheck-request`,
    });
    assert.equal(missingRecheckProjectionRes.statusCode, 404);
    const listAfterNoRecheckRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/paper-project-bridges/${encodeURIComponent(bridge.paper_project_bridge.paper_project_bridge_id)}/downstream-feedback`,
    });
    assertStatus(listAfterNoRecheckRes, 200);
    assert.equal((listAfterNoRecheckRes.json() as { items: unknown[] }).items.length, 2);
  } finally {
    await app.close();
  }
});

test('topic-selection v1c HTTP routes keep non-promote decisions out of bridge creation', async () => {
  const repository = makeSeededTopicPackageRepository(uniqueId('non-promote'));
  const app = await makeV1cRouteApp(repository);
  try {
    const { gateBundle } = await createReadyGate(app, repository.v1cInputBundle.v1b_to_v1c_input_bundle_id);
    const actionRefs = [gateBundle.promotion_gate_check.promotion_input_snapshot_ref];
    const decisionRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/promotion-decisions',
      payload: {
        promotion_gate_check_id: gateBundle.promotion_gate_check.promotion_gate_check_id,
        decision: 'refine_package',
        human_actor: { actor_type: 'human', actor_id: 'route-reviewer' },
        rationale: 'Do not promote until the package narrative is refined.',
        confirmed_snapshot_hash: gateBundle.promotion_gate_check.promotion_input_snapshot_hash,
        required_actions: [requiredAction('refine_package_narrative', actionRefs)],
        loopback_target: 'package',
      },
    });
    assertStatus(decisionRes, 201);
    const decision = decisionRes.json() as {
      promotion_decision: { promotion_decision_id: string; bridge_eligible: boolean; loopback_target: string };
      bridge_handoff: null;
    };
    assert.equal(decision.promotion_decision.bridge_eligible, false);
    assert.equal(decision.promotion_decision.loopback_target, 'package');
    assert.equal(decision.bridge_handoff, null);

    const bridgeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/paper-project-bridges',
      payload: {
        promotion_decision_id: decision.promotion_decision.promotion_decision_id,
      },
    });
    assert.equal(bridgeRes.statusCode, 409);
    assert.equal((bridgeRes.json() as { error: { code: string } }).error.code, 'GATE_CONSTRAINT_FAILED');
  } finally {
    await app.close();
  }
});

test('topic-selection v1c offline replay routes force v1c stage and reject incompatible cases or metrics', async () => {
  const repository = makeSeededTopicPackageRepository(uniqueId('replay'));
  const { app, offlineReplayService } = await makeV1cRouteHarness(repository);
  try {
    const invalidDatasetStageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/datasets',
      payload: {
        dataset_key: 'attempt-v1a-through-v1c-route',
        dataset_version: '1',
        stage: 'v1a',
      },
    });
    assert.equal(invalidDatasetStageRes.statusCode, 400);

    const validDatasetStageRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/datasets',
      payload: {
        dataset_key: uniqueId('explicit-v1c-dataset'),
        dataset_version: '1',
        stage: 'v1c',
      },
    });
    assertStatus(validDatasetStageRes, 201);
    assert.equal((validDatasetStageRes.json() as { stage: string }).stage, 'v1c');

    const syntheticRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/datasets/synthetic-baseline',
    });
    assertStatus(syntheticRes, 201);
    const synthetic = syntheticRes.json() as {
      dataset: { offline_evaluation_dataset_id: string; stage: string; case_count: number };
      cases: TopicSelectionOfflineEvaluationCaseRecord[];
    };
    assert.equal(synthetic.dataset.stage, 'v1c');
    assert.equal(synthetic.dataset.case_count, TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_CASE_TYPES.length);
    assert.deepEqual(
      new Set(synthetic.cases.map((record) => record.case_type)),
      new Set(TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_CASE_TYPES),
    );

    const invalidCaseTypeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/cases',
      payload: {
        dataset_id: synthetic.dataset.offline_evaluation_dataset_id,
        case_key: 'v1b-case-type-through-v1c-api',
        case_type: TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES[0],
        frozen_input_bundle: {
          stage: 'v1c',
          frozen_at: NOW,
          source_refs: [],
          artifact_refs: [],
          stage_snapshots: {},
          payload: {},
        },
        gold_expectation: {
          expected_unmet_need: false,
          expected_key_evidence_refs: [],
          expected_counter_evidence_refs: [],
          expected_blocker_codes: [],
          required_trace_refs: [],
          expected_recheck_action_refs: [],
          expected_negative_memory_refs: [],
          expected_downstream_rework_causes: [],
          notes: [],
        },
      },
    });
    assert.equal(invalidCaseTypeRes.statusCode, 400);

    const invalidMetricRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/runs',
      payload: {
        dataset_id: synthetic.dataset.offline_evaluation_dataset_id,
        workflow_profile_key: 'topic-selection-v1c-frozen-fixture',
        metric_keys: ['false_gap_rate'],
      },
    });
    assert.equal(invalidMetricRes.statusCode, 400);

    const v1bDataset = await offlineReplayService.createSyntheticV1bBaselineDataset({
      dataset_key: uniqueId('v1b-run-via-v1c-guard'),
    });
    const wrongStageRunCreateRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/runs',
      payload: {
        dataset_id: v1bDataset.dataset.offline_evaluation_dataset_id,
        workflow_profile_key: 'topic-selection-v1b-frozen-fixture',
      },
    });
    assert.equal(wrongStageRunCreateRes.statusCode, 404);

    const v1bRun = await offlineReplayService.startRun({
      dataset_id: v1bDataset.dataset.offline_evaluation_dataset_id,
      workflow_profile_key: 'topic-selection-v1b-frozen-fixture',
    });
    const wrongStageCaseResultRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/case-results',
      payload: {
        run_id: v1bRun.offline_evaluation_run_id,
        case_id: v1bDataset.cases[0]?.offline_evaluation_case_id,
        observed_output: v1bDataset.cases[0]?.frozen_input_bundle.payload.fixture_observed_output,
      },
    });
    assert.equal(wrongStageCaseResultRes.statusCode, 404);

    const wrongStageCompleteRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1c/offline-evaluation/runs/${encodeURIComponent(v1bRun.offline_evaluation_run_id)}/complete`,
    });
    assert.equal(wrongStageCompleteRes.statusCode, 404);
    const wrongStageMetricsRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/offline-evaluation/runs/${encodeURIComponent(v1bRun.offline_evaluation_run_id)}/metrics`,
    });
    assert.equal(wrongStageMetricsRes.statusCode, 404);
    const wrongStageDiffsRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/offline-evaluation/runs/${encodeURIComponent(v1bRun.offline_evaluation_run_id)}/diffs`,
    });
    assert.equal(wrongStageDiffsRes.statusCode, 404);

    const runRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/runs',
      payload: {
        dataset_id: synthetic.dataset.offline_evaluation_dataset_id,
        workflow_profile_key: 'topic-selection-v1c-frozen-fixture',
      },
    });
    assertStatus(runRes, 201);
    const run = runRes.json() as { offline_evaluation_run_id: string; metric_keys: string[] };
    assert.deepEqual(new Set(run.metric_keys), new Set(TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_METRIC_KEYS));

    for (const evaluationCase of synthetic.cases) {
      const resultRes = await app.inject({
        method: 'POST',
        url: '/topic-selection/v1c/offline-evaluation/case-results',
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
      url: `/topic-selection/v1c/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/complete`,
    });
    assertStatus(completeRes, 200);

    const metricsRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/metrics`,
    });
    assertStatus(metricsRes, 200);
    const metricKeys = new Set((metricsRes.json() as { items: Array<{ metric_key: string }> }).items.map((item) => item.metric_key));
    assert.deepEqual(metricKeys, new Set(TOPIC_SELECTION_V1C_OFFLINE_EVALUATION_METRIC_KEYS));

    const diffRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/offline-evaluation/runs/${encodeURIComponent(run.offline_evaluation_run_id)}/diffs`,
    });
    assertStatus(diffRes, 200);
    const changedDimensions = new Set(
      (diffRes.json() as { items: Array<{ changed_dimensions: string[] }> }).items.flatMap((item) => item.changed_dimensions),
    );
    for (const dimension of [
      'promotion_input_currentness',
      'promotion_gate_blocker',
      'human_authorization',
      'promotion_gate',
      'bridge_trace',
      'commitment_profile',
      'loopback_target',
      'downstream_feedback',
    ]) {
      assert.equal(changedDimensions.has(dimension), true, `missing replay diff dimension ${dimension}`);
    }
  } finally {
    await app.close();
  }
});

test('T-067 Prisma HTTP smoke requires DATABASE_URL and drives v1c routes against Prisma repositories', async () => {
  await assertPrismaHttpSmokeDatabaseReady();
  const suffix = uniqueId('v1c-prisma');
  const prisma = new PrismaClient();
  let repository: SeededTopicPackageRepository | null = null;
  try {
    repository = await seedReadyV1cInputBundleInPrisma(prisma, suffix);
  } finally {
    await prisma.$disconnect();
  }
  assert.ok(repository);

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

  const app = buildApp();
  try {
    const { snapshot, gateBundle } = await createReadyGate(
      app,
      repository.v1cInputBundle.v1b_to_v1c_input_bundle_id,
    );
    const humanRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/promotion-decisions',
      payload: {
        promotion_gate_check_id: gateBundle.promotion_gate_check.promotion_gate_check_id,
        decision: 'promote_to_paper_project',
        human_actor: { actor_type: 'human', actor_id: 'route-prisma-reviewer' },
        rationale: 'Explicitly authorize Prisma-backed promotion bridge smoke.',
        confirmed_snapshot_hash: gateBundle.promotion_gate_check.promotion_input_snapshot_hash,
      },
    });
    assertStatus(humanRes, 201);
    const human = humanRes.json() as {
      promotion_decision: {
        promotion_decision_id: string;
        bridge_eligible: boolean;
        promotion_commitment_profile_id: string;
      };
      promotion_commitment_profile: { promotion_commitment_profile_id: string };
    };
    assert.equal(human.promotion_decision.bridge_eligible, true);
    assert.ok(human.promotion_decision.promotion_commitment_profile_id);

    const bridgeRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/paper-project-bridges',
      payload: {
        promotion_decision_id: human.promotion_decision.promotion_decision_id,
        created_by: 'system',
      },
    });
    assertStatus(bridgeRes, 201);
    const bridge = bridgeRes.json() as {
      paper_project_bridge: {
        paper_project_bridge_id: string;
        bridge_status: string;
        promotion_input_snapshot_id: string;
      };
    };
    assert.equal(bridge.paper_project_bridge.bridge_status, 'active');
    assert.equal(bridge.paper_project_bridge.promotion_input_snapshot_id, snapshot.promotion_input_snapshot_id);

    const feedbackRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/downstream-feedback',
      payload: {
        paper_project_bridge_id: bridge.paper_project_bridge.paper_project_bridge_id,
        downstream_source_kind: 'paper_project',
        downstream_source_ref: ref('paper_project_section', `introduction_${suffix}`, repository.topicPackage.title_card_id),
        feedback_signal: 'overclaim',
        severity: 'blocking',
        summary: 'Prisma-backed draft introduction exceeds the frozen promotion claim ceiling.',
        required_action: 'Reassess value claim ceiling before continuing the Prisma-backed paper draft.',
        created_by: 'human',
      },
    });
    assertStatus(feedbackRes, 201);
    const feedback = feedbackRes.json() as {
      downstream_topic_feedback: {
        downstream_topic_feedback_id: string;
        recheck_request: { downstream_recheck_request_id: string };
      };
      classification: { loopback_target: string; requires_recheck: boolean };
    };
    assert.equal(feedback.classification.loopback_target, 'value_assessment');
    assert.equal(feedback.classification.requires_recheck, true);

    const recheckRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1c/recheck-requests/${encodeURIComponent(feedback.downstream_topic_feedback.recheck_request.downstream_recheck_request_id)}`,
    });
    assertStatus(recheckRes, 200);

    const persisted = new PrismaClient();
    try {
      const persistedBridge = await persisted.topicSelectionPaperProjectBridge.findUnique({
        where: { id: bridge.paper_project_bridge.paper_project_bridge_id },
      });
      assert.ok(persistedBridge);
      const persistedFeedback = await persisted.topicSelectionDownstreamTopicFeedback.findUnique({
        where: { id: feedback.downstream_topic_feedback.downstream_topic_feedback_id },
      });
      assert.ok(persistedFeedback);
    } finally {
      await persisted.$disconnect();
    }
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

test('buildApp registers topic-selection v1c routes', async () => {
  const app = buildApp();
  try {
    const res = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1c/offline-evaluation/datasets/synthetic-baseline',
    });
    assertStatus(res, 201);
    assert.equal((res.json() as { dataset: { stage: string } }).dataset.stage, 'v1c');
  } finally {
    await app.close();
  }
});
