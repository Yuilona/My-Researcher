import type {
  TopicSelectionArtifactRefRecord,
  TopicSelectionChainTransitionAttemptRecord,
  TopicSelectionInputSnapshotRecord,
  TopicSelectionLlmWorkflowRunRecord,
  TopicSelectionReadinessGateResultRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPackageTraceBoundaryCheckRecord,
  TopicSelectionTopicPackageReadinessAssessmentRecord,
  TopicSelectionTopicPackageRecord,
  TopicSelectionV1bToV1cInputBundleRecord,
  TopicSelectionV1bTopicPackageCreationResult,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-package-contracts';

export type TopicSelectionV1bTopicPackageControlPlanePersistence = {
  input_snapshot: TopicSelectionInputSnapshotRecord;
  workflow_run: TopicSelectionLlmWorkflowRunRecord;
  artifact_refs: TopicSelectionArtifactRefRecord[];
  readiness_gate_result: TopicSelectionReadinessGateResultRecord;
  transition_attempt: TopicSelectionChainTransitionAttemptRecord;
  trace_snapshot: TopicSelectionTraceSnapshotRecord;
};

export type TopicSelectionV1bTopicPackagePersistence = {
  topic_package: TopicSelectionTopicPackageRecord;
  package_trace_boundary_check: TopicSelectionPackageTraceBoundaryCheckRecord;
  package_readiness_assessment: TopicSelectionTopicPackageReadinessAssessmentRecord;
  v1c_input_bundle: TopicSelectionV1bToV1cInputBundleRecord | null;
  control_plane: TopicSelectionV1bTopicPackageControlPlanePersistence;
};

export type TopicSelectionV1bTopicPackageAuthorityPersistence = Omit<
  TopicSelectionV1bTopicPackagePersistence,
  'control_plane'
>;

export interface TopicSelectionV1bTopicPackageRepository {
  createDraftPackage(
    persistence: TopicSelectionV1bTopicPackagePersistence,
  ): Promise<TopicSelectionV1bTopicPackageCreationResult>;

  createDraftPackageAuthority(
    persistence: TopicSelectionV1bTopicPackageAuthorityPersistence,
  ): Promise<TopicSelectionV1bTopicPackageCreationResult>;

  findPackageById(
    topicPackageId: string,
  ): Promise<TopicSelectionTopicPackageRecord | null>;
  /**
   * T-087 Phase 3.1 read-only projection — list TopicPackages under a title-card.
   */
  listPackagesByTitleCardId(
    titleCardId: string,
  ): Promise<TopicSelectionTopicPackageRecord[]>;
  findPackageByValueDispositionDecisionId(
    valueDispositionDecisionId: string,
  ): Promise<TopicSelectionTopicPackageRecord | null>;
  findTraceBoundaryCheckById(
    traceBoundaryCheckId: string,
  ): Promise<TopicSelectionPackageTraceBoundaryCheckRecord | null>;
  findReadinessAssessmentById(
    readinessAssessmentId: string,
  ): Promise<TopicSelectionTopicPackageReadinessAssessmentRecord | null>;
  findV1cInputBundleById(
    v1bToV1cInputBundleId: string,
  ): Promise<TopicSelectionV1bToV1cInputBundleRecord | null>;
  findV1cInputBundleByPackageId(
    topicPackageId: string,
  ): Promise<TopicSelectionV1bToV1cInputBundleRecord | null>;
}
