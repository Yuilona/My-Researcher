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
import type {
  TopicSelectionV1cPromotionInputPersistence,
  TopicSelectionV1cPromotionInputRepository,
} from './topic-selection-v1c-promotion-input.repository.js';

export class InMemoryTopicSelectionV1cPromotionInputRepository
implements TopicSelectionV1cPromotionInputRepository {
  private readonly snapshots = new Map<string, TopicSelectionPromotionInputSnapshotRecord>();
  private readonly snapshotIdsByBundleId = new Map<string, string>();
  private readonly inputSnapshots = new Map<string, TopicSelectionInputSnapshotRecord>();
  private readonly workflowRuns = new Map<string, TopicSelectionLlmWorkflowRunRecord>();
  private readonly artifactRefs = new Map<string, TopicSelectionArtifactRefRecord>();
  private readonly gateResults = new Map<string, TopicSelectionReadinessGateResultRecord>();
  private readonly transitionAttempts = new Map<string, TopicSelectionChainTransitionAttemptRecord>();
  private readonly traceSnapshots = new Map<string, TopicSelectionTraceSnapshotRecord>();

  async createSnapshot(
    persistence: TopicSelectionV1cPromotionInputPersistence,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord> {
    const snapshot = persistence.promotion_input_snapshot;
    if (this.snapshots.has(snapshot.promotion_input_snapshot_id)) {
      throw new Error('PromotionInputSnapshot already exists.');
    }
    if (this.snapshotIdsByBundleId.has(snapshot.v1b_to_v1c_input_bundle_id)) {
      throw new Error('PromotionInputSnapshot already exists for this v1b-to-v1c input bundle.');
    }
    this.inputSnapshots.set(
      persistence.control_plane.input_snapshot.input_snapshot_id,
      persistence.control_plane.input_snapshot,
    );
    this.workflowRuns.set(
      persistence.control_plane.workflow_run.workflow_run_id,
      persistence.control_plane.workflow_run,
    );
    for (const artifactRef of persistence.control_plane.artifact_refs) {
      this.artifactRefs.set(artifactRef.artifact_ref_id, artifactRef);
    }
    this.gateResults.set(
      persistence.control_plane.readiness_gate_result.readiness_gate_result_id,
      persistence.control_plane.readiness_gate_result,
    );
    this.transitionAttempts.set(
      persistence.control_plane.transition_attempt.chain_transition_attempt_id,
      persistence.control_plane.transition_attempt,
    );
    this.traceSnapshots.set(
      persistence.control_plane.trace_snapshot.trace_snapshot_id,
      persistence.control_plane.trace_snapshot,
    );
    this.snapshots.set(snapshot.promotion_input_snapshot_id, snapshot);
    this.snapshotIdsByBundleId.set(
      snapshot.v1b_to_v1c_input_bundle_id,
      snapshot.promotion_input_snapshot_id,
    );
    return snapshot;
  }

  async findSnapshotById(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord | null> {
    return this.snapshots.get(promotionInputSnapshotId) ?? null;
  }

  async findSnapshotByBundleId(
    v1bToV1cInputBundleId: string,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord | null> {
    const snapshotId = this.snapshotIdsByBundleId.get(v1bToV1cInputBundleId);
    return snapshotId ? this.snapshots.get(snapshotId) ?? null : null;
  }

  async findReadySnapshotById(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionPromotionInputSnapshotRecord | null> {
    const snapshot = await this.findSnapshotById(promotionInputSnapshotId);
    return snapshot?.closure_status === 'ready_for_gate' ? snapshot : null;
  }
}
