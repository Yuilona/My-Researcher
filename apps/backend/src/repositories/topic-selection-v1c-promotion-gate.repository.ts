import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionChainTransitionAttemptRecord,
  TopicSelectionInputSnapshotRecord,
  TopicSelectionLlmWorkflowRunRecord,
  TopicSelectionReadinessGateResultRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionArgumentReadinessMiniCheckRecord,
  TopicSelectionPromotionDecisionSupportRecord,
  TopicSelectionPromotionDossierRecord,
  TopicSelectionPromotionGateCheckRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-gate-contracts';

export type TopicSelectionV1cPromotionGateControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
  artifact_refs: TopicSelectionArtifactRefRecord[];
  readiness_gate_result: TopicSelectionReadinessGateResultRecord;
  transition_attempt: TopicSelectionChainTransitionAttemptRecord;
  trace_snapshot: TopicSelectionTraceSnapshotRecord;
};

export type TopicSelectionV1cPromotionGatePersistenceBundle = {
  promotion_decision_support: TopicSelectionPromotionDecisionSupportRecord;
  promotion_dossier: TopicSelectionPromotionDossierRecord;
  argument_readiness_mini_check: TopicSelectionArgumentReadinessMiniCheckRecord;
  promotion_gate_check: TopicSelectionPromotionGateCheckRecord;
  control_plane: TopicSelectionV1cPromotionGateControlPlanePersistence;
};

export type TopicSelectionV1cPromotionGateRecordBundle = {
  promotion_decision_support: TopicSelectionPromotionDecisionSupportRecord;
  promotion_dossier: TopicSelectionPromotionDossierRecord;
  argument_readiness_mini_check: TopicSelectionArgumentReadinessMiniCheckRecord;
  promotion_gate_check: TopicSelectionPromotionGateCheckRecord;
};

export interface TopicSelectionV1cPromotionGateRepository {
  createBundle(
    persistence: TopicSelectionV1cPromotionGatePersistenceBundle,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle>;

  findBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null>;

  findLatestBundleByPromotionInputSnapshotId(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null>;

  findDecisionSupportById(
    promotionDecisionSupportId: string,
  ): Promise<TopicSelectionPromotionDecisionSupportRecord | null>;

  findDossierById(
    promotionDossierId: string,
  ): Promise<TopicSelectionPromotionDossierRecord | null>;

  findArgumentReadinessMiniCheckById(
    argumentReadinessMiniCheckId: string,
  ): Promise<TopicSelectionArgumentReadinessMiniCheckRecord | null>;

  findGateCheckById(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionPromotionGateCheckRecord | null>;

  findBundleByGateCheckId(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null>;
}
