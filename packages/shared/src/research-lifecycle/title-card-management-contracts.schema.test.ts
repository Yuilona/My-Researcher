import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {
  createNeedReviewRequestSchema,
  createPromotionDecisionRequestSchema,
  createResearchQuestionRequestSchema,
  createTitleCardRequestSchema,
} from './title-card-management-contracts.js';
import * as autoPullContracts from './auto-pull-contracts.js';
import * as literatureContracts from './literature-contracts.js';
import * as paperProjectContracts from './paper-project-contracts.js';
import * as researchArgumentContracts from './research-argument-contracts.js';
import * as researchLifecycleContracts from './index.js';
import * as researchLifecycleCoreContracts from './research-lifecycle-core-contracts.js';
import * as titleCardManagementContracts from './title-card-management-contracts.js';
import * as topicSelectionControlPlaneContracts from './topic-selection-control-plane-contracts.js';
import * as topicSelectionEvidenceMapContracts from './topic-selection-evidence-map-contracts.js';
import * as topicSelectionNeedValidationContracts from './topic-selection-need-validation-contracts.js';
import * as topicSelectionOfflineEvaluationReplayContracts from './topic-selection-offline-evaluation-replay-contracts.js';
import * as topicSelectionRecheckRiskMemoryContracts from './topic-selection-recheck-risk-memory-contracts.js';
import * as topicSelectionSearchResourceContracts from './topic-selection-search-resource-contracts.js';
import * as topicSelectionV1bIntakeContracts from './topic-selection-v1b-intake-contracts.js';
import * as topicSelectionV1bResearchSliceContracts from './topic-selection-v1b-research-slice-contracts.js';
import * as topicSelectionV1bTopicQuestionContracts from './topic-selection-v1b-topic-question-contracts.js';
import * as topicSelectionV1bTopicPackageContracts from './topic-selection-v1b-topic-package-contracts.js';
import * as topicSelectionV1bValueAssessmentContracts from './topic-selection-v1b-value-assessment-contracts.js';
import * as topicSelectionV1cPromotionGateContracts from './topic-selection-v1c-promotion-gate-contracts.js';
import * as topicSelectionV1cHumanPromotionDecisionContracts from './topic-selection-v1c-human-promotion-decision-contracts.js';
import * as topicSelectionV1cPaperProjectBridgeContracts from './topic-selection-v1c-paper-project-bridge-contracts.js';
import * as topicSelectionV1cPromotionInputContracts from './topic-selection-v1c-promotion-input-contracts.js';
import type {
  ReleaseGateReviewResponse,
  StageGateVerifyRequest,
} from './paper-project-contracts.js';
import type {
  LiteratureContentProcessingRunDTO,
  PaperLiteratureLinkView,
  UpdatePaperLiteratureLinkResponse,
} from './literature-contracts.js';
import type {
  CreateAutoPullRunRequest,
  TopicProfileDTO,
} from './auto-pull-contracts.js';
import type {
  ReadinessVerifyRequest,
  SubmissionRiskReport,
  WritingEntryPacket,
} from './research-argument-contracts.js';

const directModuleTypeSmoke:
  | [
      StageGateVerifyRequest,
      ReleaseGateReviewResponse,
      PaperLiteratureLinkView,
      UpdatePaperLiteratureLinkResponse,
      CreateAutoPullRunRequest,
      TopicProfileDTO,
      LiteratureContentProcessingRunDTO,
      ReadinessVerifyRequest,
      WritingEntryPacket,
      SubmissionRiskReport,
    ]
  | null = null;

void directModuleTypeSmoke;

function functionalRefForSchema(refType: string, refId: string) {
  return {
    ref_type: refType,
    ref_id: refId,
  };
}

function topicQuestionEvidenceRefForSchema() {
  return {
    topic_question_evidence_ref_id: 'topic_question_evidence_ref_001',
    title_card_id: 'title_card_001',
    topic_question_id: 'topic_question_001',
    topic_question_contract_id: 'topic_question_contract_001',
    evidence_ref: functionalRefForSchema('evidence_unit', 'evidence_unit_001'),
    evidence_role: 'support',
    mapped_question_part: 'main_question',
    rationale: 'Supports the selected topic package.',
    source_locator_snapshot: {},
    created_at: '2026-05-15T00:00:00.000Z',
  };
}

test('title-card management schemas load', () => {
  assert.ok(createTitleCardRequestSchema);
  assert.ok(createResearchQuestionRequestSchema);
  assert.ok(createPromotionDecisionRequestSchema);
});

test('research-argument bridge schemas load', () => {
  assert.ok(researchArgumentContracts.seedWorkspaceFromTitleCardRequestSchema);
  assert.ok(researchArgumentContracts.readinessVerifyRequestSchema);
  assert.ok(researchArgumentContracts.decisionActionRequestSchema);
  assert.ok(researchArgumentContracts.promoteToPaperProjectRequestSchema);
  assert.ok(researchArgumentContracts.writingEntryPacketSchema);
  assert.ok(researchArgumentContracts.submissionRiskReportSchema);
});

test('topic-selection control-plane schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionContextPolicyVersionRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionWorkflowProfilePolicyRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionTransitionPolicyVersionRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionInputSnapshotRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionArtifactRefRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionLlmWorkflowRunRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionQualitySignalRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionReadinessGateResultRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionChainTransitionAttemptRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionFunctionalLineageLinkRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionTraceSnapshotRecordSchema);
  assert.ok(topicSelectionControlPlaneContracts.topicSelectionHumanConfirmedDecisionRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionInputSnapshotRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionHumanConfirmedDecisionRecordSchema);
});

test('topic-selection search/resource schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionTopicSeedRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionLiteratureResourcePoolSnapshotRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionSearchPlanRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionCoverageRowIntentRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionCoverageExecutionObservationRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionCoverageEvidenceBindingRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionCoverageAssessmentRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionCoverageRiskAcceptanceRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionSearchRunRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionSearchPlanRecheckRequestRecordSchema);
  assert.ok(topicSelectionSearchResourceContracts.topicSelectionSearchPlanCoverageMatrixSchema);
  assert.ok(researchLifecycleContracts.topicSelectionSearchRunRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionSearchPlanCoverageMatrixSchema);
});

test('topic-selection evidence-map schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceMapRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceUnitRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceSourceLocatorSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceTypedLinkRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceClusterRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidencePatternRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceConflictSetRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionEvidenceStrengthAssessmentRecordSchema);
  assert.ok(topicSelectionEvidenceMapContracts.topicSelectionNeedValidationEvidenceBundleSchema);
  assert.ok(researchLifecycleContracts.topicSelectionEvidenceMapRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionEvidenceStrengthAssessmentRecordSchema);
});

test('topic-selection need-validation schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionNeedCandidateRecordSchema);
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionNeedCandidateReadinessAssessmentRecordSchema);
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionValidationDecisionSupportPacketRecordSchema);
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionValidateNeedAdjudicationResultRecordSchema);
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionValidatedNeedRecordSchema);
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionCandidateDecisionMemorySuggestionRecordSchema);
  assert.ok(topicSelectionNeedValidationContracts.topicSelectionV1aToV1bInputBundleRecordSchema);
  assert.deepEqual([...topicSelectionNeedValidationContracts.TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_STATUSES], [
    'suggested',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionNeedCandidateRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionV1aToV1bInputBundleRecordSchema);
});

test('topic-selection recheck/risk/memory schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionRecheckEventRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionRecheckImpactRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionRecheckResolutionRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionAcceptedRiskRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionHumanOverrideRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionBlockerPolicyRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionDecisionMemoryEntryRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionCandidateDecisionMemoryRecordSchema);
  assert.ok(topicSelectionRecheckRiskMemoryContracts.topicSelectionDecisionWorkQueueItemRecordSchema);
  assert.deepEqual(topicSelectionRecheckRiskMemoryContracts.TOPIC_SELECTION_IMPACT_LEVELS, [
    'no_impact',
    'stale',
    'recheck_required',
    'invalidated',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionDecisionWorkQueueItemRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionAcceptedRiskRecordSchema);
});

test('topic-selection offline-evaluation/replay schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationDatasetRecordSchema);
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationCaseRecordSchema);
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationRunRecordSchema);
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationCaseResultRecordSchema);
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationMetricResultRecordSchema);
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionReplayDiffRecordSchema);
  assert.ok(topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationObservedSnapshotSchema);
  assert.deepEqual(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_V1A_OFFLINE_EVALUATION_CASE_TYPES, [
    'true_unmet_need',
    'pseudo_gap',
    'strong_baseline_solved',
    'author_future_work_misleading',
    'abstract_overclaim_body_unsupported',
    'terminology_shift_same_task',
    'same_team_duplicate_claim',
    'source_health_or_missing_fulltext',
    'downstream_failure_feedback',
  ]);
  assert.deepEqual(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES, [
    'slice_boundary_drift',
    'answerability_false_pass',
    'value_overclaim',
    'package_trace_gap',
    'package_readiness_false_pass',
    'downstream_loopback_feedback',
  ]);
  assert.deepEqual(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_V1A_OFFLINE_EVALUATION_METRIC_KEYS, [
    'false_gap_rate',
    'baseline_miss_rate',
    'counter_evidence_recall',
    'trace_completeness',
    'readiness_false_pass_rate',
    'human_override_rate',
    'rerun_instability',
    'recheck_precision',
    'negative_memory_usefulness',
    'downstream_rework_cause',
  ]);
  assert.deepEqual(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS, [
    'slice_boundary_drift_rate',
    'answerability_false_pass_rate',
    'value_overclaim_rate',
    'package_trace_completeness',
    'package_readiness_false_pass_rate',
    'downstream_loopback_cause_distribution',
  ]);
  assert.equal(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES.includes('package_trace_gap'), true);
  assert.equal(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS.includes('package_trace_completeness'), true);
  assert.equal(topicSelectionOfflineEvaluationReplayContracts.TOPIC_SELECTION_REPLAY_DIFF_DIMENSIONS.includes('package_readiness'), true);
  assert.ok(researchLifecycleContracts.topicSelectionOfflineEvaluationDatasetRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionReplayDiffRecordSchema);
});

test('topic-selection v1b intake schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1bIntakeContracts.topicSelectionV1bIntakeSnapshotRecordSchema);
  assert.ok(topicSelectionV1bIntakeContracts.topicSelectionResearchConstraintProfileRecordSchema);
  assert.ok(topicSelectionV1bIntakeContracts.topicSelectionV1bIntakeReadinessAssessmentRecordSchema);
  assert.ok(topicSelectionV1bIntakeContracts.topicSelectionV1bResearchSlicePlanningInputSchema);
  assert.deepEqual([...topicSelectionV1bIntakeContracts.TOPIC_SELECTION_V1B_INTAKE_READINESS_RECOMMENDATIONS], [
    'ready_for_slice',
    'blocked_by_recheck',
    'blocked_by_stale_trace',
    'needs_constraint_clarification',
    'park',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionV1bIntakeSnapshotRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionV1bResearchSlicePlanningInputSchema);
});

test('topic-selection v1b research-slice schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionPlanResearchSliceRunRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceOptionSetRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceOptionRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionSliceSelectionDecisionRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceEvidenceRefRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceBoundaryRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceAssumptionRecordSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionV1bTopicQuestionFormationInputSchema);
  assert.ok(topicSelectionV1bResearchSliceContracts.topicSelectionResearchSliceOptionSetLlmOutputSchema);
  assert.deepEqual([...topicSelectionV1bResearchSliceContracts.TOPIC_SELECTION_SLICE_SELECTION_DECISIONS], [
    'select',
    'request_more_options',
    'park',
    'reject',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionPlanResearchSliceRunRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionV1bTopicQuestionFormationInputSchema);
});

test('topic-selection v1b topic-question schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionFormTopicQuestionRunRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionQuestionFrameRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionCandidateSetRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionCandidateRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionSelectionDecisionRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionContractRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionAnswerabilityPlanRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionNeedRefRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionEvidenceRefRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionBoundaryRefRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionAssumptionRefRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionTopicQuestionFalsificationConditionRecordSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionV1bValueAssessmentInputSchema);
  assert.ok(topicSelectionV1bTopicQuestionContracts.topicSelectionFormTopicQuestionLlmOutputSchema);
  assert.deepEqual([...topicSelectionV1bTopicQuestionContracts.TOPIC_SELECTION_TOPIC_QUESTION_SELECTION_DECISIONS], [
    'admit',
    'admit_multiple',
    'merge_then_admit',
    'park',
    'reject_all',
    'no_admissible_candidate',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionFormTopicQuestionRunRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionV1bValueAssessmentInputSchema);
});

test('topic-selection v1b value-assessment schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionAssessTopicValueRunRecordSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionTopicValueAssessmentInputSnapshotRecordSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionTopicValueAssessmentRecordSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionTopicValueGateResultSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionTopicValueDimensionScoreSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionValueReasoningMemoRecordSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionValueDispositionDecisionRecordSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionV1bPackageDraftInputSchema);
  assert.ok(topicSelectionV1bValueAssessmentContracts.topicSelectionAssessTopicValueLlmOutputSchema);
  assert.deepEqual([...topicSelectionV1bValueAssessmentContracts.TOPIC_SELECTION_VALUE_DISPOSITIONS], [
    'advance_to_package',
    'refine_question',
    'refine_slice',
    'recheck_evidence_or_search',
    'park',
    'drop',
  ]);
  assert.deepEqual([...topicSelectionV1bValueAssessmentContracts.TOPIC_SELECTION_VALUE_DIMENSIONS], [
    'significance',
    'originality',
    'answerability',
    'feasibility',
    'claim_ceiling_fit',
    'reviewer_risk',
    'effort_to_value_fit',
    'strategic_fit',
    'negative_memory_check',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionTopicValueAssessmentRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionV1bPackageDraftInputSchema);
});

test('topic-selection v1b topic-package schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1bTopicPackageContracts.topicSelectionTopicPackageRecordSchema);
  assert.ok(topicSelectionV1bTopicPackageContracts.topicSelectionPackageTraceBoundaryCheckRecordSchema);
  assert.ok(topicSelectionV1bTopicPackageContracts.topicSelectionTopicPackageReadinessAssessmentRecordSchema);
  assert.ok(topicSelectionV1bTopicPackageContracts.topicSelectionV1bToV1cInputBundleRecordSchema);
  assert.deepEqual([...topicSelectionV1bTopicPackageContracts.TOPIC_SELECTION_TOPIC_PACKAGE_READINESS_STATUSES], [
    'draft',
    'ready_for_promotion_review',
    'blocked',
    'needs_revision',
    'superseded',
  ]);
  assert.ok(researchLifecycleContracts.topicSelectionTopicPackageRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionV1bToV1cInputBundleRecordSchema);
});

test('topic-selection v1c promotion-input schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1cPromotionInputContracts.topicSelectionPromotionInputSnapshotCheckDetailSchema);
  assert.ok(topicSelectionV1cPromotionInputContracts.topicSelectionPromotionInputSnapshotRecordSchema);
  assert.ok(topicSelectionV1cPromotionInputContracts.topicSelectionPromotionInputSnapshotHandoffSchema);
  assert.deepEqual(
    [...topicSelectionV1cPromotionInputContracts.TOPIC_SELECTION_PROMOTION_INPUT_SNAPSHOT_CLOSURE_STATUSES],
    ['ready_for_gate', 'blocked', 'needs_upstream_refresh', 'superseded'],
  );
  assert.ok(researchLifecycleContracts.topicSelectionPromotionInputSnapshotRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionPromotionInputSnapshotHandoffSchema);
});

test('topic-selection v1c promotion-input schemas validate snapshot and handoff payloads', async () => {
  const app = Fastify();
  app.post(
    '/v',
    {
      schema: {
        body: topicSelectionV1cPromotionInputContracts.topicSelectionPromotionInputSnapshotRecordSchema,
      },
    },
    async () => ({ ok: true }),
  );
  app.post(
    '/handoff',
    {
      schema: {
        body: topicSelectionV1cPromotionInputContracts.topicSelectionPromotionInputSnapshotHandoffSchema,
      },
    },
    async () => ({ ok: true }),
  );
  await app.ready();
  const base = {
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    title_card_id: 'title_card_001',
    v1b_to_v1c_input_bundle_id: 'v1b_to_v1c_input_bundle_001',
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    closure_status: 'ready_for_gate',
    required_actions: [],
    blockers: [],
    warnings: [],
    check_details: [],
    bundle_hash: 'bundle_hash_001',
    package_snapshot_hash: 'package_hash_001',
    package_draft_input_snapshot_hash: 'draft_hash_001',
    promotion_input_snapshot_hash: 'promotion_hash_001',
    source_bundle_ref: functionalRefForSchema('v1b_to_v1c_input_bundle', 'v1b_to_v1c_input_bundle_001'),
    promotion_input_snapshot_ref: functionalRefForSchema('promotion_input_snapshot', 'promotion_input_snapshot_001'),
    topic_package_ref: functionalRefForSchema('topic_package', 'topic_package_001'),
    package_trace_boundary_check_ref: functionalRefForSchema(
      'package_trace_boundary_check',
      'package_trace_boundary_check_001',
    ),
    package_readiness_assessment_ref: functionalRefForSchema(
      'topic_package_readiness_assessment',
      'package_readiness_assessment_001',
    ),
    topic_value_assessment_ref: functionalRefForSchema('topic_value_assessment', 'topic_value_assessment_001'),
    value_reasoning_memo_ref: functionalRefForSchema('value_reasoning_memo', 'value_reasoning_memo_001'),
    value_disposition_decision_ref: functionalRefForSchema(
      'value_disposition_decision',
      'value_disposition_decision_001',
    ),
    topic_question_ref: functionalRefForSchema('topic_question', 'topic_question_001'),
    topic_question_contract_ref: functionalRefForSchema('topic_question_contract', 'topic_question_contract_001'),
    answerability_plan_ref: functionalRefForSchema('topic_question_answerability_plan', 'answerability_plan_001'),
    research_slice_ref: functionalRefForSchema('research_slice', 'research_slice_001'),
    validated_need_refs: [functionalRefForSchema('validated_need', 'validated_need_001')],
    evidence_refs: [topicQuestionEvidenceRefForSchema()],
    accepted_risk_refs: [],
    blocker_refs: [],
    memory_suggestion_refs: [],
    recheck_request_refs: [],
    readiness_check_refs: [
      functionalRefForSchema('package_trace_boundary_check', 'package_trace_boundary_check_001'),
      functionalRefForSchema('topic_package_readiness_assessment', 'package_readiness_assessment_001'),
    ],
    source_bundle_snapshot: {},
    package_snapshot: {},
    package_draft_input_snapshot: {},
    artifact_refs: [],
    created_by: 'system',
    created_at: '2026-05-15T00:00:00.000Z',
  };
  const valid = await app.inject({ method: 'POST', url: '/v', payload: base });
  const handoff = await app.inject({
    method: 'POST',
    url: '/handoff',
    payload: {
      promotion_input_snapshot_id: base.promotion_input_snapshot_id,
      promotion_input_snapshot_ref: base.promotion_input_snapshot_ref,
      v1b_to_v1c_input_bundle_id: base.v1b_to_v1c_input_bundle_id,
      topic_package_id: base.topic_package_id,
      package_version: base.package_version,
      closure_status: 'ready_for_gate',
      topic_package_ref: base.topic_package_ref,
      package_trace_boundary_check_ref: base.package_trace_boundary_check_ref,
      package_readiness_assessment_ref: base.package_readiness_assessment_ref,
      topic_value_assessment_ref: base.topic_value_assessment_ref,
      value_reasoning_memo_ref: base.value_reasoning_memo_ref,
      value_disposition_decision_ref: base.value_disposition_decision_ref,
      topic_question_ref: base.topic_question_ref,
      topic_question_contract_ref: base.topic_question_contract_ref,
      answerability_plan_ref: base.answerability_plan_ref,
      research_slice_ref: base.research_slice_ref,
      validated_need_refs: base.validated_need_refs,
      evidence_refs: base.evidence_refs,
      accepted_risk_refs: base.accepted_risk_refs,
      blocker_refs: base.blocker_refs,
      memory_suggestion_refs: base.memory_suggestion_refs,
      recheck_request_refs: base.recheck_request_refs,
      readiness_check_refs: base.readiness_check_refs,
      snapshot_hashes: {
        bundle_hash: base.bundle_hash,
        package_snapshot_hash: base.package_snapshot_hash,
        package_draft_input_snapshot_hash: base.package_draft_input_snapshot_hash,
        promotion_input_snapshot_hash: base.promotion_input_snapshot_hash,
      },
      snapshot: base,
    },
  });
  const invalid = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      ...base,
      readiness_check_refs: undefined,
    },
  });
  const invalidEvidence = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      ...base,
      evidence_refs: [{}],
    },
  });
  await app.close();

  assert.equal(valid.statusCode, 200);
  assert.equal(handoff.statusCode, 200);
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalidEvidence.statusCode, 400);
});

test('topic-selection v1c promotion-gate schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1cPromotionGateContracts.topicSelectionPromotionDecisionSupportRecordSchema);
  assert.ok(topicSelectionV1cPromotionGateContracts.topicSelectionPromotionDossierRecordSchema);
  assert.ok(topicSelectionV1cPromotionGateContracts.topicSelectionArgumentReadinessMiniCheckRecordSchema);
  assert.ok(topicSelectionV1cPromotionGateContracts.topicSelectionPromotionGateCheckRecordSchema);
  assert.ok(topicSelectionV1cPromotionGateContracts.topicSelectionPromotionGateHandoffSchema);
  assert.deepEqual(
    [...topicSelectionV1cPromotionGateContracts.TOPIC_SELECTION_PROMOTION_GATE_DISPOSITIONS],
    ['ready_for_human_decision', 'blocked', 'needs_revision', 'recheck_required', 'park'],
  );
  assert.ok(researchLifecycleContracts.topicSelectionPromotionDecisionSupportRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionPromotionGateHandoffSchema);
});

test('topic-selection v1c promotion-gate schemas validate support, dossier, mini-check, gate, and handoff payloads', async () => {
  const app = Fastify();
  app.post('/support', {
    schema: {
      body: topicSelectionV1cPromotionGateContracts.topicSelectionPromotionDecisionSupportRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/dossier', {
    schema: {
      body: topicSelectionV1cPromotionGateContracts.topicSelectionPromotionDossierRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/mini', {
    schema: {
      body: topicSelectionV1cPromotionGateContracts.topicSelectionArgumentReadinessMiniCheckRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/gate', {
    schema: {
      body: topicSelectionV1cPromotionGateContracts.topicSelectionPromotionGateCheckRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/handoff', {
    schema: {
      body: topicSelectionV1cPromotionGateContracts.topicSelectionPromotionGateHandoffSchema,
    },
  }, async () => ({ ok: true }));
  await app.ready();

  const now = '2026-05-15T00:00:00.000Z';
  const promotionInputSnapshotRef = functionalRefForSchema(
    'promotion_input_snapshot',
    'promotion_input_snapshot_001',
  );
  const support = {
    promotion_decision_support_id: 'promotion_decision_support_001',
    support_run_key: 'support_run_key_001',
    title_card_id: 'title_card_001',
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_ref: promotionInputSnapshotRef,
    promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    support_generation_mode: 'deterministic',
    support_status: 'succeeded',
    summary: 'Package is ready for human promotion review.',
    reviewer_questions: [],
    risk_notes: [],
    recheck_notes: [],
    source_refs: [promotionInputSnapshotRef],
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    memory_suggestion_refs: [],
    warnings: [],
    artifact_refs: [],
    created_by: 'system',
    created_at: now,
  };
  const dossierArtifactRef = functionalRefForSchema('artifact_ref', 'artifact_ref_dossier_001');
  const dossier = {
    promotion_dossier_id: 'promotion_dossier_001',
    support_run_key: support.support_run_key,
    title_card_id: support.title_card_id,
    promotion_decision_support_id: support.promotion_decision_support_id,
    promotion_input_snapshot_id: support.promotion_input_snapshot_id,
    topic_package_id: support.topic_package_id,
    package_version: support.package_version,
    summary: 'Reviewer packet summary.',
    reviewer_packet_artifact_ref: dossierArtifactRef,
    dossier_payload: {
      sections: ['lineage', 'argument mini-check'],
    },
    source_refs: support.source_refs,
    artifact_refs: [dossierArtifactRef],
    created_by: 'system',
    created_at: now,
  };
  const miniCheck = {
    argument_readiness_mini_check_id: 'argument_readiness_mini_check_001',
    support_run_key: support.support_run_key,
    title_card_id: support.title_card_id,
    promotion_decision_support_id: support.promotion_decision_support_id,
    promotion_input_snapshot_id: support.promotion_input_snapshot_id,
    check_status: 'passed',
    check_items: [
      {
        check_key: 'claim_ceiling_visible',
        status: 'passed',
        message: 'Claim ceiling is visible.',
        refs: [functionalRefForSchema('topic_question_contract', 'topic_question_contract_001')],
      },
    ],
    blockers: [],
    warnings: [],
    required_actions: [],
    early_check_obligations: [],
    source_refs: support.source_refs,
    artifact_refs: [],
    created_by: 'system',
    created_at: now,
  };
  const snapshotHashes = {
    bundle_hash: 'bundle_hash_001',
    package_snapshot_hash: 'package_hash_001',
    package_draft_input_snapshot_hash: 'draft_hash_001',
    promotion_input_snapshot_hash: support.promotion_input_snapshot_hash,
  };
  const gate = {
    promotion_gate_check_id: 'promotion_gate_check_001',
    support_run_key: support.support_run_key,
    title_card_id: support.title_card_id,
    promotion_decision_support_id: support.promotion_decision_support_id,
    promotion_dossier_id: dossier.promotion_dossier_id,
    argument_readiness_mini_check_id: miniCheck.argument_readiness_mini_check_id,
    promotion_input_snapshot_id: support.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: promotionInputSnapshotRef,
    promotion_input_snapshot_hash: support.promotion_input_snapshot_hash,
    disposition: 'ready_for_human_decision',
    promote_allowed: true,
    blockers: [],
    warnings: [],
    required_actions: [],
    loopback_hints: [],
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    memory_suggestion_refs: [],
    source_refs: support.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [],
    created_by: 'system',
    created_at: now,
  };
  const handoff = {
    promotion_gate_check_id: gate.promotion_gate_check_id,
    promotion_gate_check_ref: functionalRefForSchema('promotion_gate_check', gate.promotion_gate_check_id),
    promotion_decision_support_ref: functionalRefForSchema(
      'promotion_decision_support',
      support.promotion_decision_support_id,
    ),
    promotion_dossier_ref: functionalRefForSchema('promotion_dossier', dossier.promotion_dossier_id),
    argument_readiness_mini_check_ref: functionalRefForSchema(
      'argument_readiness_mini_check',
      miniCheck.argument_readiness_mini_check_id,
    ),
    promotion_input_snapshot_id: support.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: promotionInputSnapshotRef,
    promotion_input_snapshot_hash: support.promotion_input_snapshot_hash,
    topic_package_id: support.topic_package_id,
    package_version: support.package_version,
    disposition: gate.disposition,
    promote_allowed: true,
    required_actions: [],
    loopback_hints: [],
    accepted_risk_refs: [],
    blocker_refs: [],
    recheck_request_refs: [],
    memory_suggestion_refs: [],
    snapshot_hashes: snapshotHashes,
    support,
    dossier,
    argument_readiness_mini_check: miniCheck,
    gate_check: gate,
  };
  const typedRequiredAction = {
    action_code: 'resolve_recheck_before_promotion',
    severity: 'blocking',
    loopback_target: 'evidence_or_search',
    refs: [functionalRefForSchema('recheck_request', 'recheck_request_001')],
    reason: 'Carried recheck must be resolved before promotion.',
  };

  const validSupport = await app.inject({ method: 'POST', url: '/support', payload: support });
  const validDossier = await app.inject({ method: 'POST', url: '/dossier', payload: dossier });
  const validMini = await app.inject({ method: 'POST', url: '/mini', payload: miniCheck });
  const validGate = await app.inject({ method: 'POST', url: '/gate', payload: gate });
  const validHandoff = await app.inject({ method: 'POST', url: '/handoff', payload: handoff });
  const invalidPromoteAllowed = await app.inject({
    method: 'POST',
    url: '/handoff',
    payload: {
      ...handoff,
      disposition: 'blocked',
      promote_allowed: true,
      gate_check: {
        ...gate,
        disposition: 'blocked',
        promote_allowed: true,
      },
    },
  });
  const invalidRequiredAction = await app.inject({
    method: 'POST',
    url: '/gate',
    payload: {
      ...gate,
      disposition: 'recheck_required',
      promote_allowed: false,
      required_actions: [
        {
          ...typedRequiredAction,
          reason: undefined,
        },
      ],
      loopback_hints: [
        {
          loopback_target: 'evidence_or_search',
          loopback_cause: 'carried_recheck',
          required_actions: [typedRequiredAction],
          refs: typedRequiredAction.refs,
        },
      ],
    },
  });
  await app.close();

  assert.equal(validSupport.statusCode, 200);
  assert.equal(validDossier.statusCode, 200);
  assert.equal(validMini.statusCode, 200);
  assert.equal(validGate.statusCode, 200);
  assert.equal(validHandoff.statusCode, 200);
  assert.equal(invalidPromoteAllowed.statusCode, 400);
  assert.equal(invalidRequiredAction.statusCode, 400);
});

test('topic-selection v1c human-promotion-decision schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionHumanPromotionDecisionRecordSchema);
  assert.ok(topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionDecisionRecordSchema);
  assert.ok(topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionCommitmentProfileRecordSchema);
  assert.ok(topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionDecisionBundleSchema);
  assert.ok(topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionBridgeHandoffSchema);
  assert.deepEqual(
    [...topicSelectionV1cHumanPromotionDecisionContracts.TOPIC_SELECTION_HUMAN_PROMOTION_DECISIONS],
    [
      'promote_to_paper_project',
      'promote_with_conditions',
      'merge_packages',
      'refine_package',
      'reassess_value',
      'revise_question',
      'revise_slice',
      'recheck_evidence_or_search',
      'park',
      'drop',
    ],
  );
  assert.ok(researchLifecycleContracts.topicSelectionHumanPromotionDecisionRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionPromotionBridgeHandoffSchema);
});

test('topic-selection v1c human-promotion-decision schemas validate decisions and handoff invariants', async () => {
  const app = Fastify();
  app.post('/human', {
    schema: {
      body: topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionHumanPromotionDecisionRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/decision', {
    schema: {
      body: topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionDecisionRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/commitment', {
    schema: {
      body: topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionCommitmentProfileRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/bundle', {
    schema: {
      body: topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionDecisionBundleSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/bridge', {
    schema: {
      body: topicSelectionV1cHumanPromotionDecisionContracts.topicSelectionPromotionBridgeHandoffSchema,
    },
  }, async () => ({ ok: true }));
  await app.ready();

  const now = '2026-05-15T00:00:00.000Z';
  const gateRef = functionalRefForSchema('promotion_gate_check', 'promotion_gate_check_001');
  const inputRef = functionalRefForSchema('promotion_input_snapshot', 'promotion_input_snapshot_001');
  const humanRef = functionalRefForSchema('human_promotion_decision', 'human_promotion_decision_001');
  const humanConfirmedRef = functionalRefForSchema('human_confirmed_decision', 'human_confirmed_decision_001');
  const decisionRef = functionalRefForSchema('promotion_decision', 'promotion_decision_001');
  const commitmentRef = functionalRefForSchema('promotion_commitment_profile', 'promotion_commitment_profile_001');
  const artifactRef = functionalRefForSchema('artifact_ref', 'artifact_ref_001');
  const snapshotHashes = {
    bundle_hash: 'bundle_hash_001',
    package_snapshot_hash: 'package_hash_001',
    package_draft_input_snapshot_hash: 'draft_hash_001',
    promotion_input_snapshot_hash: 'promotion_hash_001',
  };
  const requiredAction = {
    action_code: 'resolve_condition_before_outline_lock',
    severity: 'warning',
    loopback_target: 'package',
    refs: [functionalRefForSchema('topic_package', 'topic_package_001')],
    reason: 'Clarify the contribution wording before outline lock.',
  };
  const condition = {
    condition_id: 'promotion_condition_001',
    condition_code: 'clarify_contribution_claim',
    owner: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    required_action: requiredAction,
    refs: requiredAction.refs,
    early_check_obligations: ['Re-check contribution claim before outline lock.'],
    verification_note: 'Condition is reviewer-visible.',
  };
  const humanDecision = {
    human_promotion_decision_id: 'human_promotion_decision_001',
    human_confirmed_decision_id: 'human_confirmed_decision_001',
    human_promotion_decision_key: 'decision_key_001',
    title_card_id: 'title_card_001',
    promotion_gate_check_id: 'promotion_gate_check_001',
    promotion_gate_check_ref: gateRef,
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_hash: 'promotion_hash_001',
    decision: 'promote_with_conditions',
    decision_class: 'promote',
    actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    decision_timestamp: now,
    confirmed_snapshot_hash: 'promotion_hash_001',
    rationale: 'Ready to promote with one explicit condition.',
    conditions: [condition],
    required_actions: [],
    loopback_refs: [],
    accepted_risk_refs: [functionalRefForSchema('accepted_risk', 'accepted_risk_001')],
    allowed_refinements: [
      {
        refinement_code: 'wording_only',
        scope: 'title_and_abstract_claim_wording',
        refs: [functionalRefForSchema('topic_package', 'topic_package_001')],
      },
    ],
    stop_conditions: [
      {
        condition_code: 'new_blocker_found',
        reason: 'Stop if a new blocking evidence conflict appears.',
        refs: [functionalRefForSchema('evidence_unit', 'evidence_unit_001')],
      },
    ],
    reopen_conditions: [],
    source_refs: [gateRef, inputRef],
    artifact_refs: [artifactRef],
    created_at: now,
  };
  const promotionDecision = {
    promotion_decision_id: 'promotion_decision_001',
    promotion_decision_status: 'current',
    current_promotion_input_snapshot_key: 'promotion_input_snapshot_001',
    human_promotion_decision_id: humanDecision.human_promotion_decision_id,
    human_confirmed_decision_id: humanDecision.human_confirmed_decision_id,
    title_card_id: humanDecision.title_card_id,
    promotion_gate_check_id: humanDecision.promotion_gate_check_id,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    gate_disposition: 'ready_for_human_decision',
    decision: humanDecision.decision,
    decision_class: humanDecision.decision_class,
    bridge_eligible: true,
    promotion_commitment_profile_id: 'promotion_commitment_profile_001',
    required_actions: [],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    conditions: humanDecision.conditions,
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [artifactRef],
    created_at: now,
  };
  const commitment = {
    promotion_commitment_profile_id: 'promotion_commitment_profile_001',
    promotion_decision_id: promotionDecision.promotion_decision_id,
    human_promotion_decision_id: humanDecision.human_promotion_decision_id,
    human_confirmed_decision_id: humanDecision.human_confirmed_decision_id,
    title_card_id: humanDecision.title_card_id,
    promotion_gate_check_id: humanDecision.promotion_gate_check_id,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    scope: {
      contribution_summary: 'A focused contribution summary.',
    },
    claim_ceiling: 'Correlation and mechanism claims only.',
    prohibited_claims: ['Do not claim causal proof.'],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    conditions: [condition],
    allowed_refinements: humanDecision.allowed_refinements,
    early_check_obligations: ['Re-check contribution claim before outline lock.'],
    stop_conditions: humanDecision.stop_conditions,
    reopen_conditions: [],
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [artifactRef],
    created_at: now,
  };
  const bridgeHandoff = {
    promotion_decision_id: promotionDecision.promotion_decision_id,
    promotion_decision_ref: decisionRef,
    human_promotion_decision_ref: humanRef,
    human_confirmed_decision_ref: humanConfirmedRef,
    promotion_commitment_profile_ref: commitmentRef,
    promotion_gate_check_ref: gateRef,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: inputRef,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    topic_package_id: commitment.topic_package_id,
    package_version: commitment.package_version,
    decision: 'promote_with_conditions',
    promotion_decision_status: 'current',
    conditions: [condition],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    allowed_refinements: humanDecision.allowed_refinements,
    early_check_obligations: commitment.early_check_obligations,
    stop_conditions: humanDecision.stop_conditions,
    reopen_conditions: [],
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [artifactRef],
    human_promotion_decision: humanDecision,
    promotion_decision: promotionDecision,
    promotion_commitment_profile: commitment,
  };
  const nonPromoteHumanDecision = {
    ...humanDecision,
    human_promotion_decision_id: 'human_promotion_decision_002',
    human_confirmed_decision_id: 'human_confirmed_decision_002',
    decision: 'recheck_evidence_or_search',
    decision_class: 'non_promote',
    conditions: [],
    required_actions: [
      {
        action_code: 'resolve_recheck_before_promotion',
        severity: 'blocking',
        loopback_target: 'evidence_or_search',
        refs: [functionalRefForSchema('recheck_request', 'recheck_request_001')],
        reason: 'Resolve carried recheck.',
      },
    ],
    loopback_target: 'evidence_or_search',
    loopback_refs: [functionalRefForSchema('recheck_request', 'recheck_request_001')],
  };

  const validHuman = await app.inject({ method: 'POST', url: '/human', payload: humanDecision });
  const validDecision = await app.inject({ method: 'POST', url: '/decision', payload: promotionDecision });
  const validCommitment = await app.inject({ method: 'POST', url: '/commitment', payload: commitment });
  const validBundle = await app.inject({
    method: 'POST',
    url: '/bundle',
    payload: {
      human_promotion_decision: humanDecision,
      promotion_decision: promotionDecision,
      promotion_commitment_profile: commitment,
    },
  });
  const validBridge = await app.inject({ method: 'POST', url: '/bridge', payload: bridgeHandoff });
  const invalidMissingCondition = await app.inject({
    method: 'POST',
    url: '/human',
    payload: {
      ...humanDecision,
      conditions: [],
    },
  });
  const invalidConditionMissingOwner = await app.inject({
    method: 'POST',
    url: '/human',
    payload: {
      ...humanDecision,
      conditions: [
        {
          ...condition,
          owner: undefined,
        },
      ],
    },
  });
  const invalidConditionMissingEarlyCheck = await app.inject({
    method: 'POST',
    url: '/human',
    payload: {
      ...humanDecision,
      conditions: [
        {
          ...condition,
          early_check_obligations: [],
        },
      ],
    },
  });
  const invalidNonPromoteActions = await app.inject({
    method: 'POST',
    url: '/human',
    payload: {
      ...nonPromoteHumanDecision,
      required_actions: [],
    },
  });
  const invalidBridgeDecision = await app.inject({
    method: 'POST',
    url: '/bridge',
    payload: {
      ...bridgeHandoff,
      decision: 'drop',
      promotion_decision: {
        ...promotionDecision,
        decision: 'drop',
        decision_class: 'non_promote',
        bridge_eligible: false,
      },
    },
  });
  const invalidBridgeNestedDecision = await app.inject({
    method: 'POST',
    url: '/bridge',
    payload: {
      ...bridgeHandoff,
      promotion_decision: {
        ...promotionDecision,
        promotion_commitment_profile_id: null,
      },
    },
  });
  await app.close();

  assert.equal(validHuman.statusCode, 200);
  assert.equal(validDecision.statusCode, 200);
  assert.equal(validCommitment.statusCode, 200);
  assert.equal(validBundle.statusCode, 200);
  assert.equal(validBridge.statusCode, 200);
  assert.equal(invalidMissingCondition.statusCode, 400);
  assert.equal(invalidConditionMissingOwner.statusCode, 400);
  assert.equal(invalidConditionMissingEarlyCheck.statusCode, 400);
  assert.equal(invalidNonPromoteActions.statusCode, 400);
  assert.equal(invalidBridgeDecision.statusCode, 400);
  assert.equal(invalidBridgeNestedDecision.statusCode, 400);
});

test('topic-selection v1c paper-project-bridge schemas load through direct and aggregate exports', () => {
  assert.ok(topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeWorkingCopyPayloadSchema);
  assert.ok(topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeCreateInputSchema);
  assert.ok(topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeRecordSchema);
  assert.ok(topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeHandoffSchema);
  assert.deepEqual(
    [...topicSelectionV1cPaperProjectBridgeContracts.TOPIC_SELECTION_PAPER_PROJECT_BRIDGE_STATUSES],
    ['active', 'blocked', 'superseded', 'archived'],
  );
  assert.ok(researchLifecycleContracts.topicSelectionPaperProjectBridgeRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionPaperProjectBridgeHandoffSchema);
});

test('topic-selection v1c paper-project-bridge schemas validate bridge handoff invariants', async () => {
  const app = Fastify();
  app.post('/create', {
    schema: {
      body: topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeCreateInputSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/record', {
    schema: {
      body: topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeRecordSchema,
    },
  }, async () => ({ ok: true }));
  app.post('/handoff', {
    schema: {
      body: topicSelectionV1cPaperProjectBridgeContracts.topicSelectionPaperProjectBridgeHandoffSchema,
    },
  }, async () => ({ ok: true }));
  await app.ready();

  const now = '2026-05-15T00:00:00.000Z';
  const artifactRef = functionalRefForSchema('artifact_ref', 'artifact_ref_001');
  const gateRef = functionalRefForSchema('promotion_gate_check', 'promotion_gate_check_001');
  const inputRef = functionalRefForSchema('promotion_input_snapshot', 'promotion_input_snapshot_001');
  const humanRef = functionalRefForSchema('human_promotion_decision', 'human_promotion_decision_001');
  const humanConfirmedRef = functionalRefForSchema('human_confirmed_decision', 'human_confirmed_decision_001');
  const decisionRef = functionalRefForSchema('promotion_decision', 'promotion_decision_001');
  const commitmentRef = functionalRefForSchema('promotion_commitment_profile', 'promotion_commitment_profile_001');
  const bridgeRef = functionalRefForSchema('paper_project_bridge', 'paper_project_bridge_001');
  const acceptedRiskRef = functionalRefForSchema('accepted_risk', 'accepted_risk_001');
  const packageRef = functionalRefForSchema('topic_package', 'topic_package_001');
  const snapshotHashes = {
    bundle_hash: 'bundle_hash_001',
    package_snapshot_hash: 'package_hash_001',
    package_draft_input_snapshot_hash: 'draft_hash_001',
    promotion_input_snapshot_hash: 'promotion_hash_001',
  };
  const requiredAction = {
    action_code: 'resolve_condition_before_outline_lock',
    severity: 'warning',
    loopback_target: 'package',
    refs: [packageRef],
    reason: 'Clarify the contribution wording before outline lock.',
  };
  const condition = {
    condition_id: 'promotion_condition_001',
    condition_code: 'clarify_contribution_claim',
    owner: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    required_action: requiredAction,
    refs: [packageRef],
    early_check_obligations: ['Re-check contribution claim before outline lock.'],
  };
  const humanDecision = {
    human_promotion_decision_id: 'human_promotion_decision_001',
    human_confirmed_decision_id: 'human_confirmed_decision_001',
    human_promotion_decision_key: 'decision_key_001',
    title_card_id: 'title_card_001',
    promotion_gate_check_id: 'promotion_gate_check_001',
    promotion_gate_check_ref: gateRef,
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_hash: 'promotion_hash_001',
    decision: 'promote_with_conditions',
    decision_class: 'promote',
    actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    decision_timestamp: now,
    confirmed_snapshot_hash: 'promotion_hash_001',
    rationale: 'Ready to promote with one explicit condition.',
    conditions: [condition],
    required_actions: [],
    loopback_refs: [],
    accepted_risk_refs: [acceptedRiskRef],
    allowed_refinements: [
      {
        refinement_code: 'wording_only',
        scope: 'title_and_abstract_claim_wording',
        refs: [packageRef],
      },
    ],
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: [gateRef, inputRef, packageRef],
    artifact_refs: [artifactRef],
    created_at: now,
  };
  const promotionDecision = {
    promotion_decision_id: 'promotion_decision_001',
    promotion_decision_status: 'current',
    current_promotion_input_snapshot_key: 'promotion_input_snapshot_001',
    human_promotion_decision_id: humanDecision.human_promotion_decision_id,
    human_confirmed_decision_id: humanDecision.human_confirmed_decision_id,
    title_card_id: humanDecision.title_card_id,
    promotion_gate_check_id: humanDecision.promotion_gate_check_id,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    gate_disposition: 'ready_for_human_decision',
    decision: humanDecision.decision,
    decision_class: humanDecision.decision_class,
    bridge_eligible: true,
    promotion_commitment_profile_id: 'promotion_commitment_profile_001',
    required_actions: [],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    conditions: humanDecision.conditions,
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [artifactRef],
    created_at: now,
  };
  const commitment = {
    promotion_commitment_profile_id: 'promotion_commitment_profile_001',
    promotion_decision_id: promotionDecision.promotion_decision_id,
    human_promotion_decision_id: humanDecision.human_promotion_decision_id,
    human_confirmed_decision_id: humanDecision.human_confirmed_decision_id,
    title_card_id: humanDecision.title_card_id,
    promotion_gate_check_id: humanDecision.promotion_gate_check_id,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    scope: {
      contribution_summary: 'A focused contribution summary.',
    },
    claim_ceiling: 'Correlation and mechanism claims only.',
    prohibited_claims: ['Do not claim causal proof.'],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    conditions: humanDecision.conditions,
    allowed_refinements: humanDecision.allowed_refinements,
    early_check_obligations: ['Re-check contribution claim before outline lock.'],
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [artifactRef],
    created_at: now,
  };
  const sourcePromotionHandoff = {
    promotion_decision_id: promotionDecision.promotion_decision_id,
    promotion_decision_ref: decisionRef,
    human_promotion_decision_ref: humanRef,
    human_confirmed_decision_ref: humanConfirmedRef,
    promotion_commitment_profile_ref: commitmentRef,
    promotion_gate_check_ref: gateRef,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: inputRef,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    topic_package_id: commitment.topic_package_id,
    package_version: commitment.package_version,
    decision: 'promote_with_conditions',
    promotion_decision_status: 'current',
    conditions: humanDecision.conditions,
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    allowed_refinements: humanDecision.allowed_refinements,
    early_check_obligations: commitment.early_check_obligations,
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    artifact_refs: [artifactRef],
    human_promotion_decision: humanDecision,
    promotion_decision: promotionDecision,
    promotion_commitment_profile: commitment,
  };
  const workingCopy = {
    editable_title: 'Working paper title',
    problem_statement: 'A concise problem statement.',
    contribution_summary: 'A focused contribution summary.',
    evaluation_plan: 'Run early feasibility checks.',
    initial_planning_notes: ['Preserve accepted risks during intake.'],
    claim_ceiling: commitment.claim_ceiling,
    prohibited_claims: commitment.prohibited_claims,
    conditions: [condition],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    early_check_obligations: commitment.early_check_obligations,
    source_lineage_summary: {
      topic_package_id: commitment.topic_package_id,
    },
  };
  const bridge = {
    paper_project_bridge_id: 'paper_project_bridge_001',
    bridge_status: 'active',
    title_card_id: humanDecision.title_card_id,
    source_promotion_decision_id: promotionDecision.promotion_decision_id,
    source_promotion_decision_ref: decisionRef,
    human_promotion_decision_ref: humanRef,
    human_confirmed_decision_ref: humanConfirmedRef,
    promotion_commitment_profile_id: commitment.promotion_commitment_profile_id,
    promotion_commitment_profile_ref: commitmentRef,
    promotion_gate_check_ref: gateRef,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: inputRef,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    topic_package_id: commitment.topic_package_id,
    package_version: commitment.package_version,
    decision: 'promote_with_conditions',
    conditions: [condition],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    allowed_refinements: humanDecision.allowed_refinements,
    early_check_obligations: commitment.early_check_obligations,
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    working_copy_payload: workingCopy,
    working_copy_payload_hash: 'working_copy_hash_001',
    bridge_payload_hash: 'bridge_payload_hash_001',
    paper_project_intake_ref: null,
    target_paper_project_ref: null,
    source_promotion_handoff: sourcePromotionHandoff,
    artifact_refs: [artifactRef],
    created_by: 'system',
    created_at: now,
  };
  const handoff = {
    paper_project_bridge_id: bridge.paper_project_bridge_id,
    paper_project_bridge_ref: bridgeRef,
    bridge_status: 'active',
    source_promotion_decision_id: promotionDecision.promotion_decision_id,
    source_promotion_decision_ref: decisionRef,
    promotion_commitment_profile_ref: commitmentRef,
    promotion_input_snapshot_id: humanDecision.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: inputRef,
    promotion_input_snapshot_hash: humanDecision.promotion_input_snapshot_hash,
    topic_package_id: commitment.topic_package_id,
    package_version: commitment.package_version,
    decision: 'promote_with_conditions',
    working_copy_payload: workingCopy,
    working_copy_payload_hash: bridge.working_copy_payload_hash,
    bridge_payload_hash: bridge.bridge_payload_hash,
    conditions: [condition],
    accepted_risk_refs: humanDecision.accepted_risk_refs,
    allowed_refinements: humanDecision.allowed_refinements,
    early_check_obligations: commitment.early_check_obligations,
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: humanDecision.source_refs,
    snapshot_hashes: snapshotHashes,
    paper_project_intake_ref: null,
    target_paper_project_ref: null,
    bridge,
    source_promotion_handoff: sourcePromotionHandoff,
  };

  const validCreate = await app.inject({
    method: 'POST',
    url: '/create',
    payload: { promotion_decision_id: 'promotion_decision_001', created_by: 'system' },
  });
  const validRecord = await app.inject({ method: 'POST', url: '/record', payload: bridge });
  const validHandoff = await app.inject({ method: 'POST', url: '/handoff', payload: handoff });
  const invalidNestedDecision = await app.inject({
    method: 'POST',
    url: '/handoff',
    payload: {
      ...handoff,
      source_promotion_handoff: {
        ...sourcePromotionHandoff,
        promotion_decision: {
          ...promotionDecision,
          decision: 'drop',
          decision_class: 'non_promote',
          bridge_eligible: false,
        },
      },
    },
  });
  const invalidWorkingCopy = await app.inject({
    method: 'POST',
    url: '/record',
    payload: {
      ...bridge,
      working_copy_payload: {
        ...workingCopy,
        editable_title: '',
      },
    },
  });
  const invalidSourceHash = await app.inject({
    method: 'POST',
    url: '/record',
    payload: {
      ...bridge,
      snapshot_hashes: {
        ...snapshotHashes,
        promotion_input_snapshot_hash: '',
      },
    },
  });
  const invalidCreatedBy = await app.inject({
    method: 'POST',
    url: '/create',
    payload: {
      promotion_decision_id: 'promotion_decision_001',
      created_by: 'automation',
    },
  });
  await app.close();

  assert.equal(validCreate.statusCode, 200);
  assert.equal(validRecord.statusCode, 200);
  assert.equal(validHandoff.statusCode, 200);
  assert.equal(invalidNestedDecision.statusCode, 400);
  assert.equal(invalidWorkingCopy.statusCode, 400);
  assert.equal(invalidSourceHash.statusCode, 400);
  assert.equal(invalidCreatedBy.statusCode, 400);
});

test('topic-selection v1b constraint profile schema accepts draft constraint gaps', async () => {
  const app = Fastify();
  app.post('/v', {
    schema: {
      body: topicSelectionV1bIntakeContracts.topicSelectionResearchConstraintProfileRecordSchema,
    },
  }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      research_constraint_profile_id: 'research_constraint_profile_001',
      title_card_id: 'title_card_001',
      v1b_intake_snapshot_id: 'v1b_intake_snapshot_001',
      v1b_input_bundle_id: 'v1b_input_bundle_001',
      validated_need_id: 'validated_need_001',
      profile_version: 'v1',
      v1b_intake_snapshot_ref: functionalRefForSchema('v1b_intake_snapshot', 'v1b_intake_snapshot_001'),
      v1b_input_bundle_ref: functionalRefForSchema('v1a_to_v1b_input_bundle', 'v1b_input_bundle_001'),
      validated_need_ref: functionalRefForSchema('validated_need', 'validated_need_001'),
      target_community: '',
      method_constraints: [],
      resource_constraints: [],
      available_assets: [],
      feasibility_budget: {},
      non_goals: [],
      claim_ceiling: '',
      constraint_payload: {},
      artifact_refs: [],
      created_by: 'human',
      created_at: '2026-05-14T00:00:00.000Z',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('topic-selection offline-evaluation observed output rejects drifted final decision vocabulary', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationObservedOutputSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const validObservedOutput = {
    final_decision: 'validate',
    readiness_recommendation: 'ready_for_validation',
    key_evidence_refs: [],
    counter_evidence_refs: [],
    evidence_refs: [],
    blocker_codes: [],
    trace_refs: [],
    human_override_refs: [],
    recheck_action_refs: [],
    memory_refs: [],
    memory_used_as_evidence_refs: [],
    downstream_rework_causes: [],
    payload: {},
  };
  const valid = await app.inject({
    method: 'POST',
    url: '/v',
    payload: validObservedOutput,
  });
  const invalid = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      ...validObservedOutput,
      final_decision: 'promote_to_v1b',
    },
  });
  const invalidBaseline = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      ...validObservedOutput,
      baseline_observed_output: {
        ...validObservedOutput,
        final_decision: 'promote_to_v1b',
      },
    },
  });
  await app.close();

  assert.equal(valid.statusCode, 200);
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalidBaseline.statusCode, 400);
});

test('topic-selection offline-evaluation schemas accept v1b frozen replay payloads', async () => {
  const app = Fastify();
  app.post(
    '/v',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['bundle', 'gold', 'observed'],
          properties: {
            bundle: topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineFrozenInputBundleSchema,
            gold: topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationGoldExpectationSchema,
            observed: topicSelectionOfflineEvaluationReplayContracts.topicSelectionOfflineEvaluationObservedOutputSchema,
          },
        },
      },
    },
    async () => ({ ok: true }),
  );
  await app.ready();
  const payload = {
    bundle: {
      stage: 'v1b',
      frozen_at: '2026-05-14T00:00:00.000Z',
      source_refs: [],
      artifact_refs: [],
      stage_snapshots: {
        v1b_intake: {},
        research_slice: {},
        topic_question_contract: {},
        topic_value_assessment: {},
        topic_package: {},
        v1c_input_bundle: {},
      },
      payload: {},
    },
    gold: {
      expected_unmet_need: true,
      expected_key_evidence_refs: [],
      expected_counter_evidence_refs: [],
      expected_blocker_codes: [],
      required_trace_refs: [],
      expected_recheck_action_refs: [],
      expected_negative_memory_refs: [],
      expected_downstream_rework_causes: [],
      allowed_slice_boundary_drift_codes: [],
      expected_answerability_passed: false,
      allowed_value_overclaim_codes: [],
      required_package_trace_refs: [functionalRefForSchema('topic_package', 'package_001')],
      expected_package_ready: false,
      expected_package_readiness_status: 'blocked',
      expected_downstream_loopback_causes: ['refine_question'],
      notes: ['v1b frozen replay fixture'],
    },
    observed: {
      key_evidence_refs: [],
      counter_evidence_refs: [],
      evidence_refs: [],
      blocker_codes: [],
      trace_refs: [],
      human_override_refs: [],
      recheck_action_refs: [],
      memory_refs: [],
      memory_used_as_evidence_refs: [],
      downstream_rework_causes: [],
      slice_boundary_drift_codes: ['target_community_expanded'],
      answerability_verdict: 'answerable',
      answerability_passed: true,
      value_overclaim_codes: ['production_superiority'],
      package_trace_refs: [],
      package_trace_verdict: 'incomplete',
      package_readiness_status: 'ready_for_promotion_review',
      package_readiness_passed: true,
      downstream_loopback_causes: ['refine_slice'],
      payload: {},
    },
  };
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload,
  });
  await app.close();

  assert.equal(res.statusCode, 200);
});

test('topic-selection evidence locator schema requires source_ref provenance', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: topicSelectionEvidenceMapContracts.topicSelectionEvidenceSourceLocatorSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const valid = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      locator_type: 'abstract',
      locator_ref: functionalRefForSchema('literature_abstract', 'lit_001'),
      literature_ref: functionalRefForSchema('literature_record', 'lit_001'),
      source_ref: functionalRefForSchema('literature_source', 'source_001'),
    },
  });
  const invalid = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      locator_type: 'abstract',
      locator_ref: functionalRefForSchema('literature_abstract', 'lit_001'),
      literature_ref: functionalRefForSchema('literature_record', 'lit_001'),
    },
  });
  await app.close();

  assert.equal(valid.statusCode, 200);
  assert.equal(invalid.statusCode, 400);
});

test('validate with trivial schema', async () => {
  const app = Fastify();
  app.post('/v', { schema: { body: { type: 'object', required: ['x'], properties: { x: { type: 'string' } } } } }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({ method: 'POST', url: '/v', payload: { x: 'ok' } });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('title-card create schema accepts working_title and brief', async () => {
  const app = Fastify();
  app.post('/v', { schema: createTitleCardRequestSchema }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      working_title: 'Robust Retrieval for Literature Reasoning',
      brief: 'A working title card for robust retrieval direction.',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('research-argument readiness verify schema accepts canonical workspace_id', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.readinessVerifyRequestSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      workspace_id: 'raw_001',
      branch_id: 'branch_001',
      requested_by: 'human',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('research-argument readiness verify schema rejects legacy project_id', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.readinessVerifyRequestSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      project_id: 'raw_001',
      branch_id: 'branch_001',
      requested_by: 'human',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('writing entry packet schema accepts canonical payload', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.writingEntryPacketSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      packet_id: 'packet_001',
      workspace_id: 'raw_001',
      branch_id: 'branch_001',
      title_card_id: 'title_card_001',
      claim_summary: [
        {
          claim_id: 'claim_001',
          claim_text: 'The method improves retrieval robustness.',
          claim_strength: 'moderate',
          evidence_requirement_ids: ['er_001'],
          boundary_ids: ['boundary_001'],
        },
      ],
      evidence_summary: {
        evidence_item_ids: ['evidence_001'],
        mandatory_requirement_ids: ['er_001'],
        missing_requirement_ids: [],
      },
      baseline_protocol_repro_summary: {
        baseline_set_ids: ['baseline_001'],
        protocol_ids: ['protocol_001'],
        repro_item_ids: ['repro_001'],
        run_ids: ['run_001'],
        artifact_ids: ['artifact_001'],
      },
      source_trace_refs: [
        {
          source_kind: 'title_card',
          source_id: 'title_card_001',
        },
      ],
      object_pointers: [
        {
          pointer_kind: 'claim',
          object_id: 'claim_001',
        },
      ],
      report_pointers: [
        {
          report_kind: 'writing_entry',
          report_id: 'packet_001',
        },
      ],
      audit_ref: 'AUD-PACKET-001',
      created_at: '2026-03-31T00:00:00.000Z',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('writing entry packet schema rejects unsupported claim_strength', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.writingEntryPacketSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      packet_id: 'packet_001',
      workspace_id: 'raw_001',
      branch_id: 'branch_001',
      title_card_id: 'title_card_001',
      claim_summary: [
        {
          claim_id: 'claim_001',
          claim_text: 'The method improves retrieval robustness.',
          claim_strength: 'unsupported_strength',
          evidence_requirement_ids: ['er_001'],
          boundary_ids: ['boundary_001'],
        },
      ],
      evidence_summary: {
        evidence_item_ids: ['evidence_001'],
        mandatory_requirement_ids: ['er_001'],
        missing_requirement_ids: [],
      },
      baseline_protocol_repro_summary: {
        baseline_set_ids: ['baseline_001'],
        protocol_ids: ['protocol_001'],
        repro_item_ids: ['repro_001'],
        run_ids: ['run_001'],
        artifact_ids: ['artifact_001'],
      },
      source_trace_refs: [
        {
          source_kind: 'title_card',
          source_id: 'title_card_001',
        },
      ],
      object_pointers: [
        {
          pointer_kind: 'claim',
          object_id: 'claim_001',
        },
      ],
      report_pointers: [
        {
          report_kind: 'writing_entry',
          report_id: 'packet_001',
        },
      ],
      audit_ref: 'AUD-PACKET-001',
      created_at: '2026-03-31T00:00:00.000Z',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('submission risk report schema accepts canonical payload', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.submissionRiskReportSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      report_id: 'risk_001',
      workspace_id: 'raw_001',
      branch_id: 'branch_001',
      dimension_summary: [
        {
          dimension_name: 'EvaluationSoundness',
          level: 'Partial',
          score: 62,
          confidence: 0.8,
        },
      ],
      blockers: [
        {
          blocker_id: 'blocker_001',
          severity: 'high',
          summary: 'Strong baseline missing.',
        },
      ],
      missing_items: ['strong baseline'],
      findings: [
        {
          finding_id: 'finding_001',
          finding_group: 'evaluation_fairness',
          severity: 'high',
          detail: 'Strong baseline comparison is missing.',
          pointers: [
            {
              pointer_kind: 'baseline_set',
              object_id: 'baseline_001',
            },
          ],
        },
      ],
      report_pointers: [
        {
          report_kind: 'submission_risk',
          report_id: 'risk_001',
        },
      ],
      audit_ref: 'AUD-RISK-001',
      created_at: '2026-03-31T00:00:00.000Z',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('submission risk report schema rejects missing grouped risk vocabulary', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.submissionRiskReportSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      report_id: 'risk_001',
      workspace_id: 'raw_001',
      branch_id: 'branch_001',
      dimension_summary: [
        {
          dimension_name: 'EvaluationSoundness',
          level: 'Partial',
          score: 62,
          confidence: 0.8,
        },
      ],
      blockers: [
        {
          blocker_id: 'blocker_001',
          severity: 'high',
          summary: 'Strong baseline missing.',
        },
      ],
      missing_items: ['strong baseline'],
      findings: [
        {
          finding_id: 'finding_001',
          severity: 'high',
          detail: 'Strong baseline comparison is missing.',
          pointers: [
            {
              pointer_kind: 'baseline_set',
              object_id: 'baseline_001',
            },
          ],
        },
      ],
      report_pointers: [
        {
          report_kind: 'submission_risk',
          report_id: 'risk_001',
        },
      ],
      audit_ref: 'AUD-RISK-001',
      created_at: '2026-03-31T00:00:00.000Z',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('promote to paper-project response schema rejects mismatched sidecar report kinds', async () => {
  const app = Fastify();
  app.post(
    '/v',
    { schema: { body: researchArgumentContracts.promoteToPaperProjectResponseSchema } },
    async () => ({ ok: true }),
  );
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      paper_id: 'paper_001',
      workspace_id: 'raw_001',
      branch_id: 'branch_001',
      packet_ref: {
        report_kind: 'coverage',
        report_id: 'packet_001',
      },
      report_ref: {
        report_kind: 'decision_timeline',
        report_id: 'risk_001',
      },
      audit_ref: 'AUD-PROMOTE-001',
      promoted_at: '2026-03-31T00:00:00.000Z',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('need review schema accepts payload without evidence_review_refs', async () => {
  const app = Fastify();
  app.post('/v', { schema: createNeedReviewRequestSchema }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      need_statement: 'Existing methods degrade sharply under long-context retrieval settings.',
      who_needs_it: 'RAG researchers',
      scenario: 'Long-context retrieval and answer synthesis for CS literature tasks.',
      literature_ids: ['lit_001'],
      unmet_need_category: 'robustness',
      falsification_verdict: 'validated',
      significance_score: 4,
      measurability_score: 4,
      feasibility_signal: 'medium',
      validated_need: true,
      judgement_summary: 'The need is measurable and not already fully solved.',
      confidence: 0.82,
      evidence_refs: [{ literature_id: 'lit_001', source_type: 'abstract' }],
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('research question schema requires at least one upstream source array', async () => {
  const app = Fastify();
  app.post('/v', { schema: createResearchQuestionRequestSchema }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      main_question: 'How can retrieval remain stable under long-context literature reasoning?',
      research_slice: 'robust long-context retrieval',
      contribution_hypothesis: 'method',
      judgement_summary: 'Question derived from validated robustness need.',
      confidence: 0.81,
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('research question schema accepts canonical literature evidence ids and rejects legacy field name', async () => {
  const app = Fastify();
  app.post('/v', { schema: createResearchQuestionRequestSchema }, async () => ({ ok: true }));
  await app.ready();

  const canonicalRes = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      main_question: 'How can retrieval remain stable under long-context literature reasoning?',
      research_slice: 'robust long-context retrieval',
      contribution_hypothesis: 'method',
      source_literature_evidence_ids: ['lit_001'],
      judgement_summary: 'Question grounded in selected literature evidence.',
      confidence: 0.81,
    },
  });

  const legacyRes = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      main_question: 'How can retrieval remain stable under long-context literature reasoning?',
      research_slice: 'robust long-context retrieval',
      contribution_hypothesis: 'method',
      source_evidence_review_ids: ['lit_001'],
      judgement_summary: 'Question grounded in selected literature evidence.',
      confidence: 0.81,
    },
  });

  await app.close();
  assert.equal(canonicalRes.statusCode, 200);
  assert.equal(legacyRes.statusCode, 400);
});

test('promotion decision schema requires package_id and target_paper_title for promote verdict', async () => {
  const app = Fastify();
  app.post('/v', { schema: createPromotionDecisionRequestSchema }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      research_question_id: 'research_question_001',
      value_assessment_id: 'value_001',
      decision: 'promote',
      reason_summary: 'All gates pass.',
      created_by: 'hybrid',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('promotion decision schema requires loopback_target for loopback verdict', async () => {
  const app = Fastify();
  app.post('/v', { schema: createPromotionDecisionRequestSchema }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      research_question_id: 'research_question_001',
      value_assessment_id: 'value_001',
      decision: 'loopback',
      reason_summary: 'Need more evidence.',
      created_by: 'llm',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 400);
});

test('promotion decision schema accepts valid promote payload', async () => {
  const app = Fastify();
  app.post('/v', { schema: createPromotionDecisionRequestSchema }, async () => ({ ok: true }));
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/v',
    payload: {
      research_question_id: 'research_question_001',
      value_assessment_id: 'value_001',
      package_id: 'package_001',
      decision: 'promote',
      reason_summary: 'All gates pass and the package is aligned.',
      target_paper_title: 'Robust Retrieval for Literature Reasoning',
      created_by: 'hybrid',
    },
  });
  await app.close();
  assert.equal(res.statusCode, 200);
});

test('research-lifecycle barrel re-exports the runtime value surface of split modules', () => {
  const expectedKeys = new Set([
    ...Object.keys(researchLifecycleCoreContracts),
    ...Object.keys(paperProjectContracts),
    ...Object.keys(literatureContracts),
    ...Object.keys(autoPullContracts),
    ...Object.keys(titleCardManagementContracts),
    ...Object.keys(researchArgumentContracts),
    ...Object.keys(topicSelectionControlPlaneContracts),
    ...Object.keys(topicSelectionSearchResourceContracts),
    ...Object.keys(topicSelectionEvidenceMapContracts),
    ...Object.keys(topicSelectionNeedValidationContracts),
    ...Object.keys(topicSelectionRecheckRiskMemoryContracts),
    ...Object.keys(topicSelectionOfflineEvaluationReplayContracts),
    ...Object.keys(topicSelectionV1bIntakeContracts),
    ...Object.keys(topicSelectionV1bResearchSliceContracts),
    ...Object.keys(topicSelectionV1bTopicQuestionContracts),
    ...Object.keys(topicSelectionV1bValueAssessmentContracts),
    ...Object.keys(topicSelectionV1bTopicPackageContracts),
    ...Object.keys(topicSelectionV1cPromotionInputContracts),
    ...Object.keys(topicSelectionV1cPromotionGateContracts),
    ...Object.keys(topicSelectionV1cHumanPromotionDecisionContracts),
    ...Object.keys(topicSelectionV1cPaperProjectBridgeContracts),
  ]);

  assert.deepEqual(Object.keys(researchLifecycleContracts).sort(), [...expectedKeys].sort());
});

test('research-lifecycle barrel keeps key contract helpers and schemas reachable', () => {
  assert.equal([...researchLifecycleContracts.AUTO_PULL_SOURCES].includes('ZOTERO'), true);
  assert.equal([...researchLifecycleContracts.LITERATURE_CONTENT_PROCESSING_STAGE_CODES].includes('INDEXED'), true);
  assert.deepEqual([...researchLifecycleContracts.LITERATURE_CONTENT_PROCESSING_STAGE_CODES], [
    'CITATION_NORMALIZED',
    'ABSTRACT_READY',
    'FULLTEXT_PREPROCESSED',
    'KEY_CONTENT_READY',
    'CHUNKED',
    'EMBEDDED',
    'INDEXED',
  ]);
  assert.equal([...researchLifecycleContracts.LITERATURE_CONTENT_PROCESSING_STAGE_STATUSES].includes('STALE'), true);
  assert.deepEqual([...researchLifecycleContracts.LITERATURE_CONTENT_PROCESSING_ACTION_CODES], [
    'process_content',
    'process_to_retrievable',
    'rebuild_index',
    'reextract',
    'retry_failed',
    'view_reason',
  ]);
  assert.deepEqual([...researchLifecycleContracts.LITERATURE_CONTENT_PROCESSING_PROVIDER_IDS], ['openai', 'dashscope']);
  assert.deepEqual([...researchLifecycleContracts.LITERATURE_EMBEDDING_PROFILE_IDS], ['default', 'economy']);
  assert.deepEqual([...researchLifecycleContracts.LITERATURE_KEY_CONTENT_ITEM_PROVENANCES], ['model_generated', 'user_edited']);
  assert.deepEqual([...researchLifecycleContracts.LITERATURE_KEY_CONTENT_BACKFILL_CURATION_STATUSES], [
    'NOT_APPLICABLE',
    'CURATION_REQUIRED',
    'WAITING_FOR_DOSSIER',
    'READY_TO_IMPORT',
    'IMPORT_FAILED',
  ]);
  assert.ok(researchLifecycleContracts.updateLiteratureContentProcessingSettingsRequestSchema);
  assert.equal(
    researchLifecycleContracts.validateNoM6OverrideContext({
      candidate_node_ids: ['node-1'],
      config_version: 'cfg-1',
      reviewer_mode: 'hybrid',
      analysis_contract: 'no_m6',
      override_context: {
        skip_m6_reason: 'manual policy override',
        training_claim_allowed: false,
      },
    }).ok,
    true,
  );
  assert.ok(researchLifecycleContracts.createPaperProjectRequestSchema);
  assert.ok(researchLifecycleContracts.literatureCollectionImportRequestSchema);
  assert.ok(researchLifecycleContracts.createAutoPullRuleRequestSchema);
  assert.ok(researchLifecycleContracts.createResearchQuestionRequestSchema);
  assert.ok(researchLifecycleContracts.readinessVerifyRequestSchema);
  assert.ok(researchLifecycleContracts.topicSelectionChainTransitionAttemptRecordSchema);
  assert.ok(researchLifecycleContracts.topicSelectionOfflineEvaluationMetricResultRecordSchema);
  assert.ok(researchLifecycleContracts.writingEntryPacketSchema);
  assert.ok(researchLifecycleContracts.submissionRiskReportSchema);
});
