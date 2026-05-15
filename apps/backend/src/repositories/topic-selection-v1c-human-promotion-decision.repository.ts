import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionChainTransitionAttemptRecord,
  TopicSelectionHumanConfirmedDecisionRecord,
  TopicSelectionInputSnapshotRecord,
  TopicSelectionLlmWorkflowRunRecord,
  TopicSelectionReadinessGateResultRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionHumanPromotionDecisionRecord,
  TopicSelectionPromotionCommitmentProfileRecord,
  TopicSelectionPromotionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';

export type TopicSelectionV1cHumanPromotionDecisionControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
  artifact_refs: TopicSelectionArtifactRefRecord[];
  readiness_gate_result: TopicSelectionReadinessGateResultRecord;
  transition_attempt: TopicSelectionChainTransitionAttemptRecord;
  trace_snapshot: TopicSelectionTraceSnapshotRecord;
  human_confirmed_decision: TopicSelectionHumanConfirmedDecisionRecord;
};

export type TopicSelectionV1cHumanPromotionDecisionPersistenceBundle = {
  human_promotion_decision: TopicSelectionHumanPromotionDecisionRecord;
  promotion_decision: TopicSelectionPromotionDecisionRecord;
  promotion_commitment_profile?: TopicSelectionPromotionCommitmentProfileRecord | null;
  control_plane: TopicSelectionV1cHumanPromotionDecisionControlPlanePersistence;
};

export type TopicSelectionV1cHumanPromotionDecisionRecordBundle = {
  human_promotion_decision: TopicSelectionHumanPromotionDecisionRecord;
  promotion_decision: TopicSelectionPromotionDecisionRecord;
  promotion_commitment_profile?: TopicSelectionPromotionCommitmentProfileRecord | null;
};

export class TopicSelectionV1cHumanPromotionDecisionCurrentConflictError extends Error {
  constructor(public readonly promotionInputSnapshotId: string) {
    super(
      `PromotionInputSnapshot ${promotionInputSnapshotId} already has a current PromotionDecision.`,
    );
    this.name = 'TopicSelectionV1cHumanPromotionDecisionCurrentConflictError';
  }
}

export interface TopicSelectionV1cHumanPromotionDecisionRepository {
  createBundle(
    persistence: TopicSelectionV1cHumanPromotionDecisionPersistenceBundle,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle>;

  findBundleByHumanPromotionDecisionKey(
    humanPromotionDecisionKey: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null>;

  findCurrentBundleByPromotionInputSnapshotId(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null>;

  findHumanPromotionDecisionById(
    humanPromotionDecisionId: string,
  ): Promise<TopicSelectionHumanPromotionDecisionRecord | null>;

  findPromotionDecisionById(
    promotionDecisionId: string,
  ): Promise<TopicSelectionPromotionDecisionRecord | null>;

  findCommitmentProfileById(
    promotionCommitmentProfileId: string,
  ): Promise<TopicSelectionPromotionCommitmentProfileRecord | null>;

  findBundleByPromotionDecisionId(
    promotionDecisionId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null>;

  findBundleByGateCheckId(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null>;
}
