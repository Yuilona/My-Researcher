import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionChainTransitionAttemptRecord,
  TopicSelectionInputSnapshotRecord,
  TopicSelectionLlmWorkflowRunRecord,
  TopicSelectionReadinessGateResultRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPromotionInputSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-input-contracts';

export type TopicSelectionV1cPromotionInputControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
  artifact_refs: TopicSelectionArtifactRefRecord[];
  readiness_gate_result: TopicSelectionReadinessGateResultRecord;
  transition_attempt: TopicSelectionChainTransitionAttemptRecord;
  trace_snapshot: TopicSelectionTraceSnapshotRecord;
};

export type TopicSelectionV1cPromotionInputPersistence = {
  promotion_input_snapshot: TopicSelectionPromotionInputSnapshotRecord;
  control_plane: TopicSelectionV1cPromotionInputControlPlanePersistence;
};

export interface TopicSelectionV1cPromotionInputRepository {
  createSnapshot(
    persistence: TopicSelectionV1cPromotionInputPersistence,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord>;

  findSnapshotById(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord | null>;

  findSnapshotByBundleId(
    v1bToV1cInputBundleId: string,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord | null>;

  findReadySnapshotById(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord | null>;
}
