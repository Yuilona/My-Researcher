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

export type TopicSelectionV1cPromotionSupportControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
  artifact_refs: TopicSelectionArtifactRefRecord[];
};

export type TopicSelectionV1cPromotionGateCheckControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
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

export type TopicSelectionV1cPromotionSupportPersistenceBundle = {
  promotion_decision_support: TopicSelectionPromotionDecisionSupportRecord;
  promotion_dossier: TopicSelectionPromotionDossierRecord;
  control_plane: TopicSelectionV1cPromotionSupportControlPlanePersistence;
};

export type TopicSelectionV1cPromotionGateCheckPersistenceBundle = {
  argument_readiness_mini_check: TopicSelectionArgumentReadinessMiniCheckRecord;
  promotion_gate_check: TopicSelectionPromotionGateCheckRecord;
  control_plane: TopicSelectionV1cPromotionGateCheckControlPlanePersistence;
};

export type TopicSelectionV1cPromotionSupportRecordBundle = {
  promotion_decision_support: TopicSelectionPromotionDecisionSupportRecord;
  promotion_dossier: TopicSelectionPromotionDossierRecord;
};

export type TopicSelectionV1cPromotionGateCheckRecordBundle = {
  argument_readiness_mini_check: TopicSelectionArgumentReadinessMiniCheckRecord;
  promotion_gate_check: TopicSelectionPromotionGateCheckRecord;
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

  createSupportBundle(
    persistence: TopicSelectionV1cPromotionSupportPersistenceBundle,
  ): Promise<TopicSelectionV1cPromotionSupportRecordBundle>;

  createGateCheckBundle(
    persistence: TopicSelectionV1cPromotionGateCheckPersistenceBundle,
  ): Promise<TopicSelectionV1cPromotionGateCheckRecordBundle>;

  findBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null>;

  findSupportBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionSupportRecordBundle | null>;

  findSupportBundleByDecisionSupportId(
    promotionDecisionSupportId: string,
  ): Promise<TopicSelectionV1cPromotionSupportRecordBundle | null>;

  findGateCheckBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionGateCheckRecordBundle | null>;

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
  /**
   * T-087 Phase 4 read-only projection — list PromotionGateChecks under a
   * title-card so the reviewer workbench v1c GateCheck surface can iterate
   * over them without going through individual support_run_keys.
   */
  listGateChecksByTitleCardId(
    titleCardId: string,
  ): Promise<TopicSelectionPromotionGateCheckRecord[]>;

  findBundleByGateCheckId(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null>;
}
