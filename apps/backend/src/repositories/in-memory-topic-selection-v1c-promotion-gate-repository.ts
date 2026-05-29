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
import type {
  TopicSelectionV1cPromotionGatePersistenceBundle,
  TopicSelectionV1cPromotionGateCheckPersistenceBundle,
  TopicSelectionV1cPromotionGateCheckRecordBundle,
  TopicSelectionV1cPromotionGateRecordBundle,
  TopicSelectionV1cPromotionGateRepository,
  TopicSelectionV1cPromotionSupportPersistenceBundle,
  TopicSelectionV1cPromotionSupportRecordBundle,
} from './topic-selection-v1c-promotion-gate.repository.js';

export class InMemoryTopicSelectionV1cPromotionGateRepository
implements TopicSelectionV1cPromotionGateRepository {
  private readonly supports = new Map<string, TopicSelectionPromotionDecisionSupportRecord>();
  private readonly dossiers = new Map<string, TopicSelectionPromotionDossierRecord>();
  private readonly miniChecks = new Map<string, TopicSelectionArgumentReadinessMiniCheckRecord>();
  private readonly gateChecks = new Map<string, TopicSelectionPromotionGateCheckRecord>();
  private readonly supportIdsByRunKey = new Map<string, string>();
  private readonly supportRunKeysByGateCheckId = new Map<string, string>();
  private readonly inputSnapshots = new Map<string, TopicSelectionInputSnapshotRecord>();
  private readonly workflowRuns = new Map<string, TopicSelectionLlmWorkflowRunRecord>();
  private readonly artifactRefs = new Map<string, TopicSelectionArtifactRefRecord>();
  private readonly gateResults = new Map<string, TopicSelectionReadinessGateResultRecord>();
  private readonly transitionAttempts = new Map<string, TopicSelectionChainTransitionAttemptRecord>();
  private readonly traceSnapshots = new Map<string, TopicSelectionTraceSnapshotRecord>();

  async createBundle(
    persistence: TopicSelectionV1cPromotionGatePersistenceBundle,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle> {
    const support = persistence.promotion_decision_support;
    if (this.supportIdsByRunKey.has(support.support_run_key)) {
      throw new Error('Promotion gate support already exists for this support run key.');
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
    this.supports.set(support.promotion_decision_support_id, support);
    this.dossiers.set(
      persistence.promotion_dossier.promotion_dossier_id,
      persistence.promotion_dossier,
    );
    this.miniChecks.set(
      persistence.argument_readiness_mini_check.argument_readiness_mini_check_id,
      persistence.argument_readiness_mini_check,
    );
    this.gateChecks.set(
      persistence.promotion_gate_check.promotion_gate_check_id,
      persistence.promotion_gate_check,
    );
    this.supportIdsByRunKey.set(support.support_run_key, support.promotion_decision_support_id);
    this.supportRunKeysByGateCheckId.set(
      persistence.promotion_gate_check.promotion_gate_check_id,
      support.support_run_key,
    );
    return this.toRecordBundle(support.support_run_key);
  }

  async createSupportBundle(
    persistence: TopicSelectionV1cPromotionSupportPersistenceBundle,
  ): Promise<TopicSelectionV1cPromotionSupportRecordBundle> {
    const support = persistence.promotion_decision_support;
    if (this.supportIdsByRunKey.has(support.support_run_key)) {
      const existing = await this.findSupportBundleBySupportRunKey(support.support_run_key);
      if (existing) return existing;
      throw new Error('Promotion decision support already exists for this support run key.');
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
    this.supports.set(support.promotion_decision_support_id, support);
    this.dossiers.set(
      persistence.promotion_dossier.promotion_dossier_id,
      persistence.promotion_dossier,
    );
    this.supportIdsByRunKey.set(support.support_run_key, support.promotion_decision_support_id);
    return {
      promotion_decision_support: support,
      promotion_dossier: persistence.promotion_dossier,
    };
  }

  async createGateCheckBundle(
    persistence: TopicSelectionV1cPromotionGateCheckPersistenceBundle,
  ): Promise<TopicSelectionV1cPromotionGateCheckRecordBundle> {
    const gateCheck = persistence.promotion_gate_check;
    if (this.gateChecks.has(gateCheck.promotion_gate_check_id) || this.supportRunKeysByGateCheckId.has(gateCheck.promotion_gate_check_id)) {
      const existing = await this.findGateCheckBundleBySupportRunKey(gateCheck.support_run_key);
      if (existing) return existing;
      throw new Error('Promotion gate check already exists for this support run key.');
    }
    if ([...this.gateChecks.values()].some((record) => record.support_run_key === gateCheck.support_run_key)) {
      const existing = await this.findGateCheckBundleBySupportRunKey(gateCheck.support_run_key);
      if (existing) return existing;
      throw new Error('Promotion gate check already exists for this support run key.');
    }
    this.inputSnapshots.set(
      persistence.control_plane.input_snapshot.input_snapshot_id,
      persistence.control_plane.input_snapshot,
    );
    this.workflowRuns.set(
      persistence.control_plane.workflow_run.workflow_run_id,
      persistence.control_plane.workflow_run,
    );
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
    this.miniChecks.set(
      persistence.argument_readiness_mini_check.argument_readiness_mini_check_id,
      persistence.argument_readiness_mini_check,
    );
    this.gateChecks.set(gateCheck.promotion_gate_check_id, gateCheck);
    this.supportRunKeysByGateCheckId.set(gateCheck.promotion_gate_check_id, gateCheck.support_run_key);
    return {
      argument_readiness_mini_check: persistence.argument_readiness_mini_check,
      promotion_gate_check: gateCheck,
    };
  }

  async findBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null> {
    return this.hasBundle(supportRunKey) ? this.toRecordBundle(supportRunKey) : null;
  }

  async findSupportBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionSupportRecordBundle | null> {
    const supportId = this.supportIdsByRunKey.get(supportRunKey);
    const support = supportId ? this.supports.get(supportId) : undefined;
    const dossier = [...this.dossiers.values()].find((record) => record.support_run_key === supportRunKey);
    return support && dossier
      ? { promotion_decision_support: support, promotion_dossier: dossier }
      : null;
  }

  async findSupportBundleByDecisionSupportId(
    promotionDecisionSupportId: string,
  ): Promise<TopicSelectionV1cPromotionSupportRecordBundle | null> {
    const support = this.supports.get(promotionDecisionSupportId);
    return support ? this.findSupportBundleBySupportRunKey(support.support_run_key) : null;
  }

  async findGateCheckBundleBySupportRunKey(
    supportRunKey: string,
  ): Promise<TopicSelectionV1cPromotionGateCheckRecordBundle | null> {
    const miniCheck = [...this.miniChecks.values()].find((record) => record.support_run_key === supportRunKey);
    const gateCheck = [...this.gateChecks.values()].find((record) => record.support_run_key === supportRunKey);
    return miniCheck && gateCheck
      ? { argument_readiness_mini_check: miniCheck, promotion_gate_check: gateCheck }
      : null;
  }

  async findLatestBundleByPromotionInputSnapshotId(
    promotionInputSnapshotId: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null> {
    const latestGate = [...this.gateChecks.values()]
      .filter((gate) => gate.promotion_input_snapshot_id === promotionInputSnapshotId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return latestGate ? this.findBundleBySupportRunKey(latestGate.support_run_key) : null;
  }

  async findDecisionSupportById(
    promotionDecisionSupportId: string,
  ): Promise<TopicSelectionPromotionDecisionSupportRecord | null> {
    return this.supports.get(promotionDecisionSupportId) ?? null;
  }

  async findDossierById(
    promotionDossierId: string,
  ): Promise<TopicSelectionPromotionDossierRecord | null> {
    return this.dossiers.get(promotionDossierId) ?? null;
  }

  async findArgumentReadinessMiniCheckById(
    argumentReadinessMiniCheckId: string,
  ): Promise<TopicSelectionArgumentReadinessMiniCheckRecord | null> {
    return this.miniChecks.get(argumentReadinessMiniCheckId) ?? null;
  }

  async findGateCheckById(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionPromotionGateCheckRecord | null> {
    return this.gateChecks.get(promotionGateCheckId) ?? null;
  }

  async listGateChecksByTitleCardId(
    titleCardId: string,
  ): Promise<TopicSelectionPromotionGateCheckRecord[]> {
    return [...this.gateChecks.values()]
      .filter((record) => record.title_card_id === titleCardId)
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  async findBundleByGateCheckId(
    promotionGateCheckId: string,
  ): Promise<TopicSelectionV1cPromotionGateRecordBundle | null> {
    const supportRunKey = this.supportRunKeysByGateCheckId.get(promotionGateCheckId);
    return supportRunKey ? this.findBundleBySupportRunKey(supportRunKey) : null;
  }

  private hasBundle(supportRunKey: string): boolean {
    const supportId = this.supportIdsByRunKey.get(supportRunKey);
    if (!supportId) {
      return false;
    }
    return Boolean(
      this.supports.get(supportId)
        && [...this.dossiers.values()].some((dossier) => dossier.support_run_key === supportRunKey)
        && [...this.miniChecks.values()].some((miniCheck) => miniCheck.support_run_key === supportRunKey)
        && [...this.gateChecks.values()].some((gateCheck) => gateCheck.support_run_key === supportRunKey),
    );
  }

  private toRecordBundle(supportRunKey: string): TopicSelectionV1cPromotionGateRecordBundle {
    const supportId = this.supportIdsByRunKey.get(supportRunKey);
    const support = supportId ? this.supports.get(supportId) : undefined;
    const dossier = [...this.dossiers.values()].find((record) => record.support_run_key === supportRunKey);
    const miniCheck = [...this.miniChecks.values()].find((record) => record.support_run_key === supportRunKey);
    const gateCheck = [...this.gateChecks.values()].find((record) => record.support_run_key === supportRunKey);
    if (!support || !dossier || !miniCheck || !gateCheck) {
      throw new Error(`Promotion gate support bundle ${supportRunKey} is incomplete.`);
    }
    return {
      promotion_decision_support: support,
      promotion_dossier: dossier,
      argument_readiness_mini_check: miniCheck,
      promotion_gate_check: gateCheck,
    };
  }
}
