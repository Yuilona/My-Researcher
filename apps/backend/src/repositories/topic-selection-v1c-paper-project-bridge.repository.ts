import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionChainTransitionAttemptRecord,
  TopicSelectionInputSnapshotRecord,
  TopicSelectionLlmWorkflowRunRecord,
  TopicSelectionReadinessGateResultRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPaperProjectBridgeRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';

export type TopicSelectionV1cPaperProjectBridgeControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
  artifact_refs: TopicSelectionArtifactRefRecord[];
  readiness_gate_result: TopicSelectionReadinessGateResultRecord;
  transition_attempt: TopicSelectionChainTransitionAttemptRecord;
  trace_snapshot: TopicSelectionTraceSnapshotRecord;
};

export type TopicSelectionV1cPaperProjectBridgePersistence = {
  paper_project_bridge: TopicSelectionPaperProjectBridgeRecord;
  control_plane: TopicSelectionV1cPaperProjectBridgeControlPlanePersistence;
};

export class TopicSelectionV1cPaperProjectBridgeSourceConflictError extends Error {
  constructor(public readonly sourcePromotionDecisionId: string) {
    super(
      `PromotionDecision ${sourcePromotionDecisionId} already has a PaperProjectBridge.`,
    );
    this.name = 'TopicSelectionV1cPaperProjectBridgeSourceConflictError';
  }
}

export interface TopicSelectionV1cPaperProjectBridgeRepository {
  createBridge(
    persistence: TopicSelectionV1cPaperProjectBridgePersistence,
  ): Promise<TopicSelectionPaperProjectBridgeRecord>;

  findBridgeById(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord | null>;

  findBridgeBySourcePromotionDecisionId(
    sourcePromotionDecisionId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord | null>;
}
