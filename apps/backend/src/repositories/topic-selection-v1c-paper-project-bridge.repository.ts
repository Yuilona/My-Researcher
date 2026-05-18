import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionChainTransitionAttemptRecord,
  TopicSelectionInputSnapshotRecord,
  TopicSelectionLlmWorkflowRunRecord,
  TopicSelectionReadinessGateResultRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionFunctionalRef,
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

export class TopicSelectionV1cPaperProjectBridgeAttachmentConflictError extends Error {
  constructor(public readonly paperProjectBridgeId: string) {
    super(`PaperProjectBridge ${paperProjectBridgeId} already has downstream paper-project refs.`);
    this.name = 'TopicSelectionV1cPaperProjectBridgeAttachmentConflictError';
  }
}

export class TopicSelectionV1cPaperProjectBridgeHashConflictError extends Error {
  constructor(public readonly paperProjectBridgeId: string) {
    super(`PaperProjectBridge ${paperProjectBridgeId} bridge_payload_hash does not match.`);
    this.name = 'TopicSelectionV1cPaperProjectBridgeHashConflictError';
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

  attachPaperProjectRefs(
    paperProjectBridgeId: string,
    input: {
      expected_bridge_payload_hash: string;
      paper_project_intake_ref: TopicSelectionFunctionalRef;
      target_paper_project_ref: TopicSelectionFunctionalRef;
    },
  ): Promise<TopicSelectionPaperProjectBridgeRecord>;
}
