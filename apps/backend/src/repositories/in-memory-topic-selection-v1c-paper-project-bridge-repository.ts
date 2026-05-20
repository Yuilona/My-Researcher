import type {
  TopicSelectionFunctionalRef,
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
import {
  TopicSelectionV1cPaperProjectBridgeAttachmentConflictError,
  TopicSelectionV1cPaperProjectBridgeHashConflictError,
  type TopicSelectionV1cPaperProjectBridgePersistence,
  type TopicSelectionV1cPaperProjectBridgeRepository,
} from './topic-selection-v1c-paper-project-bridge.repository.js';

export class InMemoryTopicSelectionV1cPaperProjectBridgeRepository
implements TopicSelectionV1cPaperProjectBridgeRepository {
  private readonly bridges = new Map<string, TopicSelectionPaperProjectBridgeRecord>();
  private readonly bridgeIdsBySourcePromotionDecisionId = new Map<string, string>();
  private readonly inputSnapshots = new Map<string, TopicSelectionInputSnapshotRecord>();
  private readonly workflowRuns = new Map<string, TopicSelectionLlmWorkflowRunRecord>();
  private readonly artifactRefs = new Map<string, TopicSelectionArtifactRefRecord>();
  private readonly gateResults = new Map<string, TopicSelectionReadinessGateResultRecord>();
  private readonly transitionAttempts = new Map<string, TopicSelectionChainTransitionAttemptRecord>();
  private readonly traceSnapshots = new Map<string, TopicSelectionTraceSnapshotRecord>();

  async createBridge(
    persistence: TopicSelectionV1cPaperProjectBridgePersistence,
  ): Promise<TopicSelectionPaperProjectBridgeRecord> {
    const bridge = persistence.paper_project_bridge;
    const existingId = this.bridgeIdsBySourcePromotionDecisionId.get(
      bridge.source_promotion_decision_id,
    );
    if (existingId) {
      const existing = this.bridges.get(existingId);
      if (existing) {
        return existing;
      }
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
    this.bridges.set(bridge.paper_project_bridge_id, bridge);
    this.bridgeIdsBySourcePromotionDecisionId.set(
      bridge.source_promotion_decision_id,
      bridge.paper_project_bridge_id,
    );
    return bridge;
  }

  async findBridgeById(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord | null> {
    return this.bridges.get(paperProjectBridgeId) ?? null;
  }

  async listBridgesByTitleCardId(
    titleCardId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord[]> {
    return [...this.bridges.values()]
      .filter((record) => record.title_card_id === titleCardId)
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  async findBridgeBySourcePromotionDecisionId(
    sourcePromotionDecisionId: string,
  ): Promise<TopicSelectionPaperProjectBridgeRecord | null> {
    const bridgeId = this.bridgeIdsBySourcePromotionDecisionId.get(sourcePromotionDecisionId);
    return bridgeId ? this.bridges.get(bridgeId) ?? null : null;
  }

  async attachPaperProjectRefs(
    paperProjectBridgeId: string,
    input: {
      expected_bridge_payload_hash: string;
      paper_project_intake_ref: TopicSelectionFunctionalRef;
      target_paper_project_ref: TopicSelectionFunctionalRef;
    },
  ): Promise<TopicSelectionPaperProjectBridgeRecord> {
    const bridge = this.bridges.get(paperProjectBridgeId);
    if (!bridge) {
      throw new Error(`PaperProjectBridge ${paperProjectBridgeId} not found.`);
    }
    if (bridge.bridge_payload_hash !== input.expected_bridge_payload_hash) {
      throw new TopicSelectionV1cPaperProjectBridgeHashConflictError(paperProjectBridgeId);
    }
    if (bridge.paper_project_intake_ref || bridge.target_paper_project_ref) {
      throw new TopicSelectionV1cPaperProjectBridgeAttachmentConflictError(paperProjectBridgeId);
    }
    const updated: TopicSelectionPaperProjectBridgeRecord = {
      ...bridge,
      paper_project_intake_ref: input.paper_project_intake_ref,
      target_paper_project_ref: input.target_paper_project_ref,
    };
    this.bridges.set(paperProjectBridgeId, updated);
    return updated;
  }
}
