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
import {
  TopicSelectionV1cHumanPromotionDecisionCurrentConflictError,
  type TopicSelectionV1cHumanPromotionDecisionPersistenceBundle,
  type TopicSelectionV1cHumanPromotionDecisionRecordBundle,
  type TopicSelectionV1cHumanPromotionDecisionRepository,
} from './topic-selection-v1c-human-promotion-decision.repository.js';

export class InMemoryTopicSelectionV1cHumanPromotionDecisionRepository
implements TopicSelectionV1cHumanPromotionDecisionRepository {
  private readonly humanPromotionDecisions = new Map<string, TopicSelectionHumanPromotionDecisionRecord>();
  private readonly promotionDecisions = new Map<string, TopicSelectionPromotionDecisionRecord>();
  private readonly commitmentProfiles = new Map<string, TopicSelectionPromotionCommitmentProfileRecord>();
  private readonly humanConfirmedDecisions = new Map<string, TopicSelectionHumanConfirmedDecisionRecord>();
  private readonly decisionIdsByHumanPromotionDecisionKey = new Map<string, string>();
  private readonly currentDecisionIdsByPromotionInputSnapshotId = new Map<string, string>();
  private readonly decisionIdsByGateCheckId = new Map<string, string>();
  private readonly inputSnapshots = new Map<string, TopicSelectionInputSnapshotRecord>();
  private readonly workflowRuns = new Map<string, TopicSelectionLlmWorkflowRunRecord>();
  private readonly artifactRefs = new Map<string, TopicSelectionArtifactRefRecord>();
  private readonly gateResults = new Map<string, TopicSelectionReadinessGateResultRecord>();
  private readonly transitionAttempts = new Map<string, TopicSelectionChainTransitionAttemptRecord>();
  private readonly traceSnapshots = new Map<string, TopicSelectionTraceSnapshotRecord>();

  async createBundle(
    persistence: TopicSelectionV1cHumanPromotionDecisionPersistenceBundle,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle> {
    const humanDecision = persistence.human_promotion_decision;
    const promotionDecision = persistence.promotion_decision;
    if (this.decisionIdsByHumanPromotionDecisionKey.has(humanDecision.human_promotion_decision_key)) {
      throw new Error('HumanPromotionDecision already exists for this decision key.');
    }
    if (
      promotionDecision.current_promotion_input_snapshot_key
      && this.currentDecisionIdsByPromotionInputSnapshotId.has(
        promotionDecision.current_promotion_input_snapshot_key,
      )
    ) {
      throw new TopicSelectionV1cHumanPromotionDecisionCurrentConflictError(
        promotionDecision.current_promotion_input_snapshot_key,
      );
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
    this.humanConfirmedDecisions.set(
      persistence.control_plane.human_confirmed_decision.human_confirmed_decision_id,
      persistence.control_plane.human_confirmed_decision,
    );
    this.humanPromotionDecisions.set(
      humanDecision.human_promotion_decision_id,
      humanDecision,
    );
    this.promotionDecisions.set(
      promotionDecision.promotion_decision_id,
      promotionDecision,
    );
    if (persistence.promotion_commitment_profile) {
      this.commitmentProfiles.set(
        persistence.promotion_commitment_profile.promotion_commitment_profile_id,
        persistence.promotion_commitment_profile,
      );
    }
    this.decisionIdsByHumanPromotionDecisionKey.set(
      humanDecision.human_promotion_decision_key,
      promotionDecision.promotion_decision_id,
    );
    if (promotionDecision.current_promotion_input_snapshot_key) {
      this.currentDecisionIdsByPromotionInputSnapshotId.set(
        promotionDecision.current_promotion_input_snapshot_key,
        promotionDecision.promotion_decision_id,
      );
    }
    this.decisionIdsByGateCheckId.set(
      promotionDecision.promotion_gate_check_id,
      promotionDecision.promotion_decision_id,
    );

    return this.toRecordBundle(promotionDecision.promotion_decision_id);
  }

  async findBundleByHumanPromotionDecisionKey(
    humanPromotionDecisionKey: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const decisionId = this.decisionIdsByHumanPromotionDecisionKey.get(humanPromotionDecisionKey);
    return decisionId ? this.toRecordBundle(decisionId) : null;
  }

  async findCurrentBundleByPromotionInputSnapshotId(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const decisionId = this.currentDecisionIdsByPromotionInputSnapshotId.get(promotionInputSnapshotId);
    return decisionId ? this.toRecordBundle(decisionId) : null;
  }

  async findHumanPromotionDecisionById(
    humanPromotionDecisionId: string,
  ): Promise<TopicSelectionHumanPromotionDecisionRecord | null> {
    return this.humanPromotionDecisions.get(humanPromotionDecisionId) ?? null;
  }

  async findPromotionDecisionById(
    promotionDecisionId: string,
  ): Promise<TopicSelectionPromotionDecisionRecord | null> {
    return this.promotionDecisions.get(promotionDecisionId) ?? null;
  }

  async listPromotionDecisionsByTitleCardId(
    titleCardId: string,
  ): Promise<TopicSelectionPromotionDecisionRecord[]> {
    return [...this.promotionDecisions.values()]
      .filter((record) => record.title_card_id === titleCardId)
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  async findCommitmentProfileById(
    promotionCommitmentProfileId: string,
  ): Promise<TopicSelectionPromotionCommitmentProfileRecord | null> {
    return this.commitmentProfiles.get(promotionCommitmentProfileId) ?? null;
  }

  async findBundleByPromotionDecisionId(
    promotionDecisionId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    return this.promotionDecisions.has(promotionDecisionId)
      ? this.toRecordBundle(promotionDecisionId)
      : null;
  }

  async findBundleByGateCheckId(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionV1cHumanPromotionDecisionRecordBundle | null> {
    const decisionId = this.decisionIdsByGateCheckId.get(promotionGateCheckId);
    return decisionId ? this.toRecordBundle(decisionId) : null;
  }

  private toRecordBundle(
    promotionDecisionId: string,
  ): TopicSelectionV1cHumanPromotionDecisionRecordBundle {
    const promotionDecision = this.promotionDecisions.get(promotionDecisionId);
    if (!promotionDecision) {
      throw new Error(`PromotionDecision ${promotionDecisionId} is missing.`);
    }
    const humanPromotionDecision = this.humanPromotionDecisions.get(
      promotionDecision.human_promotion_decision_id,
    );
    if (!humanPromotionDecision) {
      throw new Error(
        `HumanPromotionDecision ${promotionDecision.human_promotion_decision_id} is missing.`,
      );
    }
    const commitmentProfile = promotionDecision.promotion_commitment_profile_id
      ? this.commitmentProfiles.get(promotionDecision.promotion_commitment_profile_id) ?? null
      : null;
    return {
      human_promotion_decision: humanPromotionDecision,
      promotion_decision: promotionDecision,
      promotion_commitment_profile: commitmentProfile,
    };
  }
}
