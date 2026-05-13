import crypto from 'node:crypto';
import type {
  TopicSelectionActorRef,
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
  TopicSelectionGateIssue,
  TopicSelectionStateWriteIntent,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionEvidenceRoleBundle,
  TopicSelectionEvidenceUnitRecord,
  TopicSelectionNeedValidationEvidenceBundle,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-evidence-map-contracts';
import type {
  TopicSelectionCandidateDecisionMemorySuggestionRecord,
  TopicSelectionCandidateMemorySuggestionType,
  TopicSelectionNeedAdjudicationDecision,
  TopicSelectionNeedCandidateDecisionStatus,
  TopicSelectionNeedCandidateReadinessAssessmentRecord,
  TopicSelectionNeedCandidateRecord,
  TopicSelectionNeedLoopbackTarget,
  TopicSelectionNeedMechanismType,
  TopicSelectionNeedPriorArtStatus,
  TopicSelectionNeedReadinessRecommendation,
  TopicSelectionNeedRejectedReason,
  TopicSelectionV1aToV1bInputBundleRecord,
  TopicSelectionValidateNeedAdjudicationResultRecord,
  TopicSelectionValidatedNeedRecord,
  TopicSelectionValidationDecisionSupportPacketRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import type {
  TopicSelectionNeedValidationAdjudicationWriteResult,
  TopicSelectionNeedValidationRepository,
} from '../repositories/topic-selection-need-validation.repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionEvidenceMapService } from './topic-selection-evidence-map-service.js';
import { TopicSelectionSearchResourceService } from './topic-selection-search-resource-service.js';

type IdFactory = (prefix: string) => string;

type ServiceOptions = {
  idFactory?: IdFactory;
  now?: () => string;
};

type CreateNeedCandidateInput = {
  workspace_id?: string | null;
  title_card_id: string;
  evidence_map_id: string;
  candidate_version?: string;
  candidate_need: string;
  unmet_need_statement?: string;
  mechanism_type?: TopicSelectionNeedMechanismType;
  mechanism_summary?: string | null;
  mechanism_payload?: Record<string, unknown>;
  scope_notes?: string | null;
  non_goal_notes?: string | null;
  prior_art_status?: TopicSelectionNeedPriorArtStatus;
  support_unit_ids?: string[];
  challenge_unit_ids?: string[];
  baseline_unit_ids?: string[];
  context_unit_ids?: string[];
  conflict_refs?: TopicSelectionFunctionalRef[];
  unresolved_challenge_refs?: TopicSelectionFunctionalRef[];
  open_recheck_request_refs?: TopicSelectionFunctionalRef[];
  accepted_risk_refs?: TopicSelectionFunctionalRef[];
  gap_codes?: string[];
  speculative?: boolean;
  confidence?: number | null;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type AssessCandidateReadinessInput = {
  workspace_id?: string | null;
  need_candidate_id: string;
  assessment_workflow_version?: string;
  open_recheck_request_refs?: TopicSelectionFunctionalRef[];
  strong_unresolved_challenge_refs?: TopicSelectionFunctionalRef[];
  accepted_risk_refs?: TopicSelectionFunctionalRef[];
  policy_version_id?: string | null;
  assessed_by?: TopicSelectionActorType;
};

type CreateValidationDecisionSupportPacketInput = {
  workspace_id?: string | null;
  need_candidate_id: string;
  readiness_assessment_id?: string | null;
  required_human_checks?: string[];
  residual_risk_refs?: TopicSelectionFunctionalRef[];
  coverage_refs?: TopicSelectionFunctionalRef[];
  already_solved_review?: Record<string, unknown>;
  packet_payload?: Record<string, unknown>;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type CandidateMemorySuggestionInput = {
  suggestion_type: TopicSelectionCandidateMemorySuggestionType;
  rationale: string;
  suggestion_payload?: Record<string, unknown>;
};

type AdjudicateNeedInput = {
  workspace_id?: string | null;
  need_candidate_id: string;
  support_packet_id: string;
  final_decision: TopicSelectionNeedAdjudicationDecision;
  rationale: string;
  adjudicated_by?: TopicSelectionActorRef;
  human_actor?: TopicSelectionActorRef;
  human_rationale?: string | null;
  rejected_reason?: TopicSelectionNeedRejectedReason | null;
  loopback_target?: TopicSelectionNeedLoopbackTarget;
  required_actions?: string[];
  gap_codes?: string[];
  residual_risk_refs?: TopicSelectionFunctionalRef[];
  accepted_risk_refs?: TopicSelectionFunctionalRef[];
  merge_target_need_candidate_ref?: TopicSelectionFunctionalRef | null;
  searchplan_recheck_reason?: string;
  searchplan_recheck_gap_codes?: string[];
  memory_suggestion?: CandidateMemorySuggestionInput | null;
  decision_payload?: Record<string, unknown>;
  policy_version_id?: string | null;
};

type PublishV1bInputBundleInput = {
  validated_need_id: string;
  bundle_version?: string;
  created_by?: TopicSelectionActorType;
};

const VALIDATE_READY_STATUSES = new Set<TopicSelectionNeedCandidateDecisionStatus>([
  'ready_for_validation',
]);

export class TopicSelectionNeedValidationService {
  private readonly idFactory: IdFactory;
  private readonly now: () => string;

  constructor(
    private readonly repository: TopicSelectionNeedValidationRepository,
    private readonly controlPlane: TopicSelectionControlPlaneService,
    private readonly evidenceMaps: TopicSelectionEvidenceMapService,
    private readonly searchResources: TopicSelectionSearchResourceService,
    options: ServiceOptions = {},
  ) {
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async createNeedCandidateFromEvidenceMap(input: CreateNeedCandidateInput): Promise<TopicSelectionNeedCandidateRecord> {
    const bundle = await this.evidenceMaps.getNeedValidationEvidenceBundle(input.evidence_map_id);
    this.assertSameTitleCard(input.title_card_id, bundle.evidence_map_ref.title_card_id, 'EvidenceMap');
    const candidateId = this.idFactory('need_candidate');
    const candidateVersion = input.candidate_version ?? this.versionFromId(candidateId);
    const candidateRef = this.ref('need_candidate', candidateId, input.title_card_id, candidateVersion);
    const roleBundle = this.resolveRoleBundle(input, bundle);
    const evidenceRefs = this.flattenRoleBundle(roleBundle);
    const sourceRefs = this.uniqueRefs([
      bundle.evidence_map_ref,
      bundle.search_run_ref,
      bundle.search_plan_ref,
      bundle.literature_snapshot_ref,
      ...evidenceRefs,
      ...bundle.conflict_set_refs,
      ...(input.conflict_refs ?? []),
      ...(input.unresolved_challenge_refs ?? []),
      ...(input.open_recheck_request_refs ?? []),
    ]);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      target_ref: candidateRef,
      source_refs: sourceRefs,
      payload: {
        candidate_need: input.candidate_need,
        evidence_role_bundle: roleBundle,
        speculative: input.speculative ?? false,
        prior_art_status: input.prior_art_status ?? 'unknown',
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      workflow_key: 'topic-selection.need-candidate-hypothesis',
      workflow_profile_key: 'deterministic-evidence-bundle',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      output_summary: {
        support_count: roleBundle.support_unit_refs.length,
        challenge_count: roleBundle.challenge_unit_refs.length,
        speculative: input.speculative ?? false,
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            candidate_need: input.candidate_need,
            unmet_need_statement: input.unmet_need_statement ?? input.candidate_need,
            evidence_role_bundle: roleBundle,
          },
        },
      ],
      created_by: input.created_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      gate_key: 'topic-selection.need-candidate-hypothesis-ready',
      target_ref: candidateRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      blockers: this.candidateCreationBlockers(input),
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      transition_key: 'evidence-map-to-need-candidate',
      source_ref: bundle.evidence_map_ref,
      target_ref: candidateRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(candidateRef, 'decision', 'need_candidate', 'hypothesis')],
      created_authority_refs: [candidateRef],
    });
    this.assertTransitionPassed(transition.result, 'NeedCandidate');
    const lineage = await this.controlPlane.linkLineage({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      source_ref: bundle.evidence_map_ref,
      target_ref: candidateRef,
      relation_type: 'derived_from',
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, input.title_card_id)),
      created_by: input.created_by ?? 'system',
    });
    const trace = await this.controlPlane.buildTraceSnapshot({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      target_ref: candidateRef,
      object_refs: [candidateRef, ...sourceRefs],
      lineage_link_refs: [this.ref('functional_lineage_link', lineage.functional_lineage_link_id, input.title_card_id)],
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, input.title_card_id)),
      transition_attempt_refs: [this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, input.title_card_id)],
      payload: {
        role_counts: this.roleCounts(roleBundle),
        note: 'NeedCandidate is a hypothesis and is not a ValidatedNeed.',
      },
      created_by: input.created_by ?? 'system',
    });
    const now = this.now();
    return this.repository.createNeedCandidate({
      need_candidate_id: candidateId,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      evidence_map_id: input.evidence_map_id,
      candidate_version: candidateVersion,
      lifecycle_status: 'hypothesis',
      decision_status: 'hypothesis',
      review_status: 'machine_checked',
      freshness_status: this.freshnessFromEvidenceBundle(bundle),
      candidate_need: input.candidate_need,
      unmet_need_statement: input.unmet_need_statement ?? input.candidate_need,
      mechanism_type: input.mechanism_type ?? 'workflow_gap',
      mechanism_summary: input.mechanism_summary ?? null,
      mechanism_payload: input.mechanism_payload ?? {},
      scope_notes: input.scope_notes ?? null,
      non_goal_notes: input.non_goal_notes ?? null,
      prior_art_status: input.prior_art_status ?? 'unknown',
      evidence_map_ref: bundle.evidence_map_ref,
      search_run_ref: bundle.search_run_ref,
      search_plan_ref: bundle.search_plan_ref,
      literature_snapshot_ref: bundle.literature_snapshot_ref,
      evidence_role_bundle: roleBundle,
      conflict_refs: input.conflict_refs ?? bundle.conflict_set_refs,
      strength_assessment_refs: bundle.strength_assessment_refs,
      open_recheck_request_refs: input.open_recheck_request_refs ?? [],
      unresolved_challenge_refs: input.unresolved_challenge_refs ?? [],
      accepted_risk_refs: input.accepted_risk_refs ?? [],
      gap_codes: input.gap_codes ?? [],
      speculative: input.speculative ?? false,
      confidence: input.confidence ?? null,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      trace_snapshot_id: trace.trace_snapshot_id,
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, input.title_card_id)),
      result_adjudication_id: null,
      result_validated_need_id: null,
      merged_into_need_candidate_ref: null,
      created_by: input.created_by ?? 'system',
      created_at: now,
      updated_at: now,
    });
  }

  async assessCandidateReadiness(
    input: AssessCandidateReadinessInput,
  ): Promise<TopicSelectionNeedCandidateReadinessAssessmentRecord> {
    const candidate = await this.requireCandidate(input.need_candidate_id);
    const bundle = await this.evidenceMaps.getNeedValidationEvidenceBundle(candidate.evidence_map_id);
    const roleBundle = this.resolveRoleBundleFromCurrentBundle(candidate.evidence_role_bundle, bundle);
    const selectedEvidenceRefs = this.flattenRoleBundle(roleBundle);
    const strength = selectedEvidenceRefs.length > 0
      ? await this.evidenceMaps.assessEvidenceStrength({
          workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
          evidence_map_id: candidate.evidence_map_id,
          target_ref: this.candidateRef(candidate),
          purpose: 'readiness',
          granularity: 'bundle',
          role_bundle: {
            support_unit_ids: roleBundle.support_unit_refs.map((ref) => ref.ref_id),
            challenge_unit_ids: roleBundle.challenge_unit_refs.map((ref) => ref.ref_id),
            baseline_unit_ids: roleBundle.baseline_unit_refs.map((ref) => ref.ref_id),
            context_unit_ids: roleBundle.context_unit_refs.map((ref) => ref.ref_id),
          },
          assessment_workflow_version: input.assessment_workflow_version ?? 'v1',
          policy_version_id: input.policy_version_id ?? null,
          created_by: input.assessed_by ?? 'system',
        })
      : null;
    const strengthRef = strength
      ? this.ref('evidence_strength_assessment', strength.evidence_strength_assessment_id, candidate.title_card_id)
      : null;
    const openRecheckRefs = this.uniqueRefs([
      ...candidate.open_recheck_request_refs,
      ...(input.open_recheck_request_refs ?? []),
    ]);
    const strongUnresolvedChallengeRefs = this.uniqueRefs([
      ...candidate.unresolved_challenge_refs,
      ...(input.strong_unresolved_challenge_refs ?? []),
    ]);
    const acceptedRiskRefs = this.uniqueRefs([
      ...candidate.accepted_risk_refs,
      ...(input.accepted_risk_refs ?? []),
    ]);
    const blockers = this.readinessBlockers(candidate, bundle, roleBundle, openRecheckRefs, strongUnresolvedChallengeRefs);
    const strengthGapCodes = strength?.gap_codes ?? [];
    const warnings = this.readinessWarnings(strengthGapCodes);
    const recommendation = this.readinessRecommendation(blockers);
    const readinessId = this.idFactory('need_readiness');
    const readinessRef = this.ref('need_candidate_readiness', readinessId, candidate.title_card_id);
    const sourceRefs = this.uniqueRefs([
      this.candidateRef(candidate),
      bundle.evidence_map_ref,
      bundle.search_run_ref,
      bundle.search_plan_ref,
      bundle.literature_snapshot_ref,
      strengthRef,
      ...selectedEvidenceRefs,
      ...bundle.conflict_set_refs,
      ...openRecheckRefs,
      ...strongUnresolvedChallengeRefs,
    ]);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      target_ref: readinessRef,
      source_refs: sourceRefs,
      payload: {
        recommendation,
        blockers,
        strength_verdict: strength?.strength_verdict ?? null,
        evidence_freshness_status: bundle.freshness_status,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.assessed_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      workflow_key: 'topic-selection.need-candidate-readiness',
      workflow_profile_key: 'deterministic-readiness-policy',
      workflow_profile_version: input.assessment_workflow_version ?? 'v1',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      status: blockers.length > 0 ? 'blocked' : 'succeeded',
      output_summary: {
        recommendation,
        blocker_codes: blockers.map((blocker) => blocker.code),
        strength_verdict: strength?.strength_verdict ?? null,
      },
      created_by: input.assessed_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      gate_key: 'topic-selection.need-candidate-ready-for-validation',
      target_ref: this.candidateRef(candidate),
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      blockers,
      warnings,
      required_actions: blockers.map((blocker) => blocker.code),
      loopback_target: blockers.length > 0 ? this.candidateRef(candidate) : null,
      accepted_risk_refs: acceptedRiskRefs,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      transition_key: 'need-candidate-readiness-assessment',
      source_ref: this.candidateRef(candidate),
      target_ref: readinessRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.assessed_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(this.candidateRef(candidate), 'decision', 'need_candidate', 'ready_for_validation')],
      created_authority_refs: [readinessRef],
    });
    const readiness: TopicSelectionNeedCandidateReadinessAssessmentRecord = {
      readiness_assessment_id: readinessId,
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      need_candidate_id: candidate.need_candidate_id,
      evidence_map_id: candidate.evidence_map_id,
      recommendation,
      blockers,
      warnings,
      required_actions: blockers.map((blocker) => blocker.code),
      strength_assessment_ref: strengthRef,
      evidence_map_ref: bundle.evidence_map_ref,
      search_run_ref: bundle.search_run_ref,
      search_plan_ref: bundle.search_plan_ref,
      literature_snapshot_ref: bundle.literature_snapshot_ref,
      support_unit_refs: roleBundle.support_unit_refs,
      challenge_unit_refs: roleBundle.challenge_unit_refs,
      baseline_unit_refs: roleBundle.baseline_unit_refs,
      context_unit_refs: roleBundle.context_unit_refs,
      conflict_refs: bundle.conflict_set_refs,
      open_recheck_request_refs: openRecheckRefs,
      accepted_risk_refs: acceptedRiskRefs,
      gap_codes: this.uniqueStrings([...candidate.gap_codes, ...strengthGapCodes]),
      support_count: roleBundle.support_unit_refs.length,
      challenge_count: roleBundle.challenge_unit_refs.length,
      abstract_only_support_count: this.countSelectedAbstractOnlySupport(roleBundle, bundle),
      strong_unresolved_challenge_count: strongUnresolvedChallengeRefs.length,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      policy_version_id: input.policy_version_id ?? null,
      assessed_by: input.assessed_by ?? 'system',
      created_at: this.now(),
    };
    const saved = await this.repository.createReadinessAssessment(readiness);
    if (transition.result === 'passed') {
      await this.repository.updateNeedCandidateStatus(candidate.need_candidate_id, {
        decision_status: 'ready_for_validation',
        review_status: 'needs_human_review',
        open_recheck_request_refs: openRecheckRefs,
        gap_codes: readiness.gap_codes,
        updated_at: this.now(),
      });
    }
    return saved;
  }

  async createValidationDecisionSupportPacket(
    input: CreateValidationDecisionSupportPacketInput,
  ): Promise<TopicSelectionValidationDecisionSupportPacketRecord> {
    const candidate = await this.requireCandidate(input.need_candidate_id);
    if (!VALIDATE_READY_STATUSES.has(candidate.decision_status)) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ValidationDecisionSupportPacket requires a ready NeedCandidate.');
    }
    const bundle = await this.evidenceMaps.getNeedValidationEvidenceBundle(candidate.evidence_map_id);
    const readiness = input.readiness_assessment_id
      ? await this.requireReadiness(input.readiness_assessment_id)
      : (await this.repository.listReadinessAssessmentsByNeedCandidateId(candidate.need_candidate_id))[0] ?? null;
    if (readiness && readiness.need_candidate_id !== candidate.need_candidate_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'ReadinessAssessment belongs to a different NeedCandidate.');
    }
    if (readiness && readiness.recommendation !== 'ready_for_validation') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ValidationDecisionSupportPacket requires ready readiness assessment.');
    }
    const roleBundle = this.resolveRoleBundleFromCurrentBundle(candidate.evidence_role_bundle, bundle);
    const supportPacketId = this.idFactory('validation_packet');
    const supportPacketRef = this.ref('validation_decision_support_packet', supportPacketId, candidate.title_card_id);
    const requiredHumanChecks = input.required_human_checks ?? [
      'confirm_unmet_need',
      'review_prior_art_status',
      'review_counter_evidence',
      'confirm_scope_and_non_goals',
      'confirm_v1b_handoff_readiness',
    ];
    const coverageRefs = input.coverage_refs ?? [
      bundle.search_plan_ref,
      bundle.search_run_ref,
      bundle.literature_snapshot_ref,
    ];
    const sourceRefs = this.uniqueRefs([
      this.candidateRef(candidate),
      bundle.evidence_map_ref,
      bundle.search_run_ref,
      bundle.search_plan_ref,
      bundle.literature_snapshot_ref,
      ...this.flattenRoleBundle(roleBundle),
      ...bundle.conflict_set_refs,
      ...candidate.strength_assessment_refs,
      ...coverageRefs,
      ...(readiness ? [this.ref('need_candidate_readiness', readiness.readiness_assessment_id, candidate.title_card_id)] : []),
    ]);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      target_ref: supportPacketRef,
      source_refs: sourceRefs,
      payload: {
        required_human_checks: requiredHumanChecks,
        open_gap_codes: candidate.gap_codes,
        prior_art_status: candidate.prior_art_status,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      workflow_key: 'topic-selection.validation-support-packet',
      workflow_profile_key: 'deterministic-packet-builder',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      output_summary: {
        required_human_check_count: requiredHumanChecks.length,
        residual_risk_count: (input.residual_risk_refs ?? candidate.accepted_risk_refs).length,
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            candidate_need: candidate.candidate_need,
            evidence_role_bundle: roleBundle,
            required_human_checks: requiredHumanChecks,
          },
        },
      ],
      created_by: input.created_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      gate_key: 'topic-selection.validation-support-packet-ready',
      target_ref: supportPacketRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      transition_key: 'need-candidate-to-validation-support-packet',
      source_ref: this.candidateRef(candidate),
      target_ref: supportPacketRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(supportPacketRef, 'execution', 'validation_support_packet', 'ready')],
      created_authority_refs: [supportPacketRef],
    });
    this.assertTransitionPassed(transition.result, 'ValidationDecisionSupportPacket');
    const trace = await this.controlPlane.buildTraceSnapshot({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      target_ref: supportPacketRef,
      object_refs: [supportPacketRef, ...sourceRefs],
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, candidate.title_card_id)),
      transition_attempt_refs: [this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, candidate.title_card_id)],
      payload: {
        packet_status: 'ready',
        open_gap_codes: candidate.gap_codes,
      },
      created_by: input.created_by ?? 'system',
    });
    return this.repository.createValidationDecisionSupportPacket({
      validation_support_packet_id: supportPacketId,
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      need_candidate_id: candidate.need_candidate_id,
      evidence_map_id: candidate.evidence_map_id,
      readiness_assessment_id: readiness?.readiness_assessment_id ?? null,
      packet_status: 'ready',
      evidence_map_ref: bundle.evidence_map_ref,
      search_run_ref: bundle.search_run_ref,
      search_plan_ref: bundle.search_plan_ref,
      literature_snapshot_ref: bundle.literature_snapshot_ref,
      need_candidate_ref: this.candidateRef(candidate),
      readiness_assessment_ref: readiness
        ? this.ref('need_candidate_readiness', readiness.readiness_assessment_id, candidate.title_card_id)
        : null,
      evidence_role_bundle: roleBundle,
      conflict_refs: bundle.conflict_set_refs,
      strength_assessment_refs: this.uniqueRefs([
        ...candidate.strength_assessment_refs,
        ...(readiness?.strength_assessment_ref ? [readiness.strength_assessment_ref] : []),
      ]),
      coverage_refs: coverageRefs,
      residual_risk_refs: input.residual_risk_refs ?? candidate.accepted_risk_refs,
      open_gap_codes: candidate.gap_codes,
      required_human_checks: requiredHumanChecks,
      prior_art_status: candidate.prior_art_status,
      already_solved_review: input.already_solved_review ?? {
        prior_art_status: candidate.prior_art_status,
        requires_human_confirmation: true,
      },
      packet_payload: input.packet_payload ?? {},
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      trace_snapshot_id: trace.trace_snapshot_id,
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, candidate.title_card_id)),
      created_by: input.created_by ?? 'system',
      created_at: this.now(),
    });
  }

  async adjudicateNeed(input: AdjudicateNeedInput): Promise<TopicSelectionNeedValidationAdjudicationWriteResult> {
    const candidate = await this.requireCandidate(input.need_candidate_id);
    const supportPacket = await this.requireSupportPacket(input.support_packet_id);
    if (supportPacket.need_candidate_id !== candidate.need_candidate_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Support packet belongs to a different NeedCandidate.');
    }
    this.assertCandidateCanBeAdjudicated(candidate);
    if (input.final_decision === 'merge' && !input.merge_target_need_candidate_ref) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Merge adjudication requires merge_target_need_candidate_ref.');
    }
    this.assertValidateHumanActor(input);

    const adjudicationId = this.idFactory('need_adjudication');
    const adjudicationRef = this.ref('validate_need_adjudication_result', adjudicationId, candidate.title_card_id);
    const validatedNeedId = input.final_decision === 'validate' ? this.idFactory('validated_need') : null;
    const validatedNeedRef = validatedNeedId ? this.ref('validated_need', validatedNeedId, candidate.title_card_id) : null;
    const memorySuggestion = this.buildMemorySuggestion(candidate, adjudicationId, input);
    const memorySuggestionRef = memorySuggestion
      ? this.ref('candidate_decision_memory_suggestion', memorySuggestion.memory_suggestion_id, candidate.title_card_id)
      : null;
    const searchPlanRecheckRequest = input.final_decision === 'request_searchplan_recheck'
      ? await this.searchResources.createSearchPlanRecheckRequest({
          workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
          title_card_id: candidate.title_card_id,
          source_ref: this.candidateRef(candidate),
          target_search_plan_id: candidate.search_plan_ref.ref_id,
          reason: input.searchplan_recheck_reason ?? input.rationale,
          gap_codes: input.searchplan_recheck_gap_codes ?? input.gap_codes ?? candidate.gap_codes,
          requested_by: input.adjudicated_by?.actor_type ?? 'human',
          policy_version_id: input.policy_version_id ?? null,
        })
      : null;
    const recheckRef = searchPlanRecheckRequest
      ? this.ref('search_plan_recheck_request', searchPlanRecheckRequest.search_plan_recheck_request_id, candidate.title_card_id)
      : null;
    const targetRef = validatedNeedRef ?? adjudicationRef;
    const humanDecision = input.final_decision === 'validate'
      ? await this.controlPlane.recordHumanDecision({
          workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
          title_card_id: candidate.title_card_id,
          target_ref: targetRef,
          decision_type: 'confirm',
          actor: input.human_actor ?? input.adjudicated_by ?? { actor_type: 'human' },
          rationale: input.human_rationale ?? input.rationale,
          policy_version_id: input.policy_version_id ?? null,
          resulting_authority_refs: validatedNeedRef ? [validatedNeedRef] : [],
        })
      : null;
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      target_ref: targetRef,
      source_refs: this.uniqueRefs([
        this.candidateRef(candidate),
        this.supportPacketRef(supportPacket),
        candidate.evidence_map_ref,
        candidate.search_run_ref,
        candidate.search_plan_ref,
        candidate.literature_snapshot_ref,
        ...(humanDecision ? [this.ref('human_confirmed_decision', humanDecision.human_confirmed_decision_id, candidate.title_card_id)] : []),
        ...(recheckRef ? [recheckRef] : []),
        ...(memorySuggestionRef ? [memorySuggestionRef] : []),
      ]),
      payload: {
        final_decision: input.final_decision,
        rationale: input.rationale,
        output_validated_need_id: validatedNeedId,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.adjudicated_by?.actor_type ?? 'human',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      workflow_key: 'topic-selection.validate-need-adjudication',
      workflow_profile_key: 'human-adjudication-record',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      output_summary: {
        final_decision: input.final_decision,
        output_validated_need_id: validatedNeedId,
        human_decision_id: humanDecision?.human_confirmed_decision_id ?? null,
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            final_decision: input.final_decision,
            rationale: input.rationale,
            required_actions: input.required_actions ?? [],
          },
        },
      ],
      created_by: input.adjudicated_by?.actor_type ?? 'human',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      gate_key: 'topic-selection.validate-need-adjudication-ready',
      target_ref: targetRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      verdict: input.final_decision === 'validate' ? 'needs_human_review' : 'pass',
    });
    const createdAuthorityRefs = this.uniqueRefs([
      adjudicationRef,
      ...(validatedNeedRef ? [validatedNeedRef] : []),
      ...(memorySuggestionRef ? [memorySuggestionRef] : []),
      ...(recheckRef ? [recheckRef] : []),
    ]);
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      transition_key: 'need-candidate-adjudication',
      source_ref: this.candidateRef(candidate),
      target_ref: targetRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: input.adjudicated_by ?? input.human_actor ?? { actor_type: 'human' },
      human_decision_refs: humanDecision
        ? [this.ref('human_confirmed_decision', humanDecision.human_confirmed_decision_id, candidate.title_card_id)]
        : [],
      state_write_intents: [
        this.stateWriteIntent(this.candidateRef(candidate), 'decision', 'need_candidate', this.statusForDecision(input.final_decision)),
      ],
      created_authority_refs: createdAuthorityRefs,
    });
    this.assertTransitionPassed(transition.result, 'ValidateNeedAdjudicationResult');
    const trace = await this.controlPlane.buildTraceSnapshot({
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      target_ref: targetRef,
      object_refs: this.uniqueRefs([
        targetRef,
        adjudicationRef,
        this.candidateRef(candidate),
        this.supportPacketRef(supportPacket),
        candidate.evidence_map_ref,
        candidate.search_run_ref,
        candidate.search_plan_ref,
        candidate.literature_snapshot_ref,
        ...(humanDecision ? [this.ref('human_confirmed_decision', humanDecision.human_confirmed_decision_id, candidate.title_card_id)] : []),
        ...(memorySuggestionRef ? [memorySuggestionRef] : []),
        ...(recheckRef ? [recheckRef] : []),
      ]),
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, candidate.title_card_id)),
      transition_attempt_refs: [this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, candidate.title_card_id)],
      payload: {
        final_decision: input.final_decision,
        output_validated_need_id: validatedNeedId,
      },
      created_by: input.adjudicated_by?.actor_type ?? 'human',
    });
    const adjudicationResult = this.buildAdjudicationResult({
      candidate,
      supportPacket,
      adjudicationId,
      input,
      humanDecisionId: humanDecision?.human_confirmed_decision_id ?? null,
      validatedNeedId,
      searchPlanRecheckRequestRef: recheckRef,
      memorySuggestionRef,
      inputSnapshotId: inputSnapshot.input_snapshot_id,
      workflowRunId: workflow.workflow_run.workflow_run_id,
      gateResultId: gate.readiness_gate_result_id,
      transitionAttemptId: transition.chain_transition_attempt_id,
      traceSnapshotId: trace.trace_snapshot_id,
      artifactRefs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, candidate.title_card_id)),
    });
    const validatedNeed = validatedNeedRef && humanDecision
      ? this.buildValidatedNeed(candidate, supportPacket, adjudicationResult, validatedNeedRef, humanDecision, trace)
      : null;
    const v1bInputBundle = validatedNeed
      ? this.buildV1bInputBundle(validatedNeed, candidate, supportPacket, adjudicationResult, memorySuggestionRef ? [memorySuggestionRef] : [], recheckRef ? [recheckRef] : [], 'v1')
      : null;
    return this.repository.adjudicateWithSideEffects({
      adjudication_result: adjudicationResult,
      candidate_patch: {
        lifecycle_status: this.lifecycleStatusForDecision(input.final_decision),
        decision_status: this.statusForDecision(input.final_decision),
        review_status: input.final_decision === 'validate' ? 'human_confirmed' : 'human_reviewed',
        freshness_status: recheckRef ? 'recheck_required' : candidate.freshness_status,
        result_adjudication_id: adjudicationId,
        result_validated_need_id: validatedNeedId,
        merged_into_need_candidate_ref: input.merge_target_need_candidate_ref ?? null,
        open_recheck_request_refs: recheckRef
          ? this.uniqueRefs([...candidate.open_recheck_request_refs, recheckRef])
          : candidate.open_recheck_request_refs,
        gap_codes: this.uniqueStrings([
          ...candidate.gap_codes,
          ...(input.gap_codes ?? []),
          ...(input.searchplan_recheck_gap_codes ?? []),
        ]),
        updated_at: this.now(),
      },
      validated_need: validatedNeed,
      memory_suggestion: memorySuggestion,
      v1b_input_bundle: v1bInputBundle,
    });
  }

  async publishV1bInputBundle(input: PublishV1bInputBundleInput): Promise<TopicSelectionV1aToV1bInputBundleRecord> {
    const validatedNeed = await this.repository.findValidatedNeedById(input.validated_need_id);
    if (!validatedNeed) {
      throw new AppError(404, 'NOT_FOUND', `ValidatedNeed ${input.validated_need_id} not found.`);
    }
    const candidate = await this.requireCandidate(validatedNeed.source_need_candidate_id);
    const supportPacket = await this.requireSupportPacket(validatedNeed.support_packet_id);
    const adjudication = await this.repository.findAdjudicationResultById(validatedNeed.adjudication_result_id);
    if (!adjudication) {
      throw new AppError(404, 'NOT_FOUND', `AdjudicationResult ${validatedNeed.adjudication_result_id} not found.`);
    }
    const memorySuggestions = await this.repository.listCandidateDecisionMemorySuggestionsByNeedCandidateId(candidate.need_candidate_id);
    const bundle = this.buildV1bInputBundle(
      validatedNeed,
      candidate,
      supportPacket,
      adjudication,
      memorySuggestions.map((suggestion) => this.ref('candidate_decision_memory_suggestion', suggestion.memory_suggestion_id, suggestion.title_card_id)),
      candidate.open_recheck_request_refs,
      input.bundle_version ?? this.versionFromId(this.idFactory('v1b_bundle_version')),
      input.created_by,
    );
    return this.repository.createV1aToV1bInputBundle(bundle);
  }

  private buildAdjudicationResult(input: {
    candidate: TopicSelectionNeedCandidateRecord;
    supportPacket: TopicSelectionValidationDecisionSupportPacketRecord;
    adjudicationId: string;
    input: AdjudicateNeedInput;
    humanDecisionId: string | null;
    validatedNeedId: string | null;
    searchPlanRecheckRequestRef: TopicSelectionFunctionalRef | null;
    memorySuggestionRef: TopicSelectionFunctionalRef | null;
    inputSnapshotId: string;
    workflowRunId: string;
    gateResultId: string;
    transitionAttemptId: string;
    traceSnapshotId: string;
    artifactRefs: TopicSelectionFunctionalRef[];
  }): TopicSelectionValidateNeedAdjudicationResultRecord {
    return {
      adjudication_result_id: input.adjudicationId,
      workspace_id: input.input.workspace_id ?? input.candidate.workspace_id ?? null,
      title_card_id: input.candidate.title_card_id,
      need_candidate_id: input.candidate.need_candidate_id,
      support_packet_id: input.supportPacket.validation_support_packet_id,
      final_decision: input.input.final_decision,
      output_validated_need_id: input.validatedNeedId,
      human_decision_id: input.humanDecisionId,
      loopback_target: input.input.loopback_target ?? this.loopbackForDecision(input.input.final_decision),
      rejected_reason: input.input.rejected_reason ?? null,
      merge_target_need_candidate_ref: input.input.merge_target_need_candidate_ref ?? null,
      output_searchplan_recheck_request_ref: input.searchPlanRecheckRequestRef,
      output_memory_suggestion_ref: input.memorySuggestionRef,
      rationale: input.input.rationale,
      required_actions: input.input.required_actions ?? [],
      accepted_risk_refs: input.input.accepted_risk_refs ?? [],
      residual_risk_refs: input.input.residual_risk_refs ?? input.supportPacket.residual_risk_refs,
      gap_codes: this.uniqueStrings([
        ...input.candidate.gap_codes,
        ...(input.input.gap_codes ?? []),
        ...(input.input.searchplan_recheck_gap_codes ?? []),
      ]),
      decision_payload: input.input.decision_payload ?? {},
      input_snapshot_id: input.inputSnapshotId,
      workflow_run_id: input.workflowRunId,
      gate_result_id: input.gateResultId,
      transition_attempt_id: input.transitionAttemptId,
      trace_snapshot_id: input.traceSnapshotId,
      artifact_refs: input.artifactRefs,
      adjudicated_by: input.input.adjudicated_by ?? input.input.human_actor ?? { actor_type: 'human' },
      created_at: this.now(),
    };
  }

  private buildValidatedNeed(
    candidate: TopicSelectionNeedCandidateRecord,
    supportPacket: TopicSelectionValidationDecisionSupportPacketRecord,
    adjudication: TopicSelectionValidateNeedAdjudicationResultRecord,
    validatedNeedRef: TopicSelectionFunctionalRef,
    humanDecision: { human_confirmed_decision_id: string; actor: TopicSelectionActorRef },
    trace: { trace_snapshot_id: string },
  ): TopicSelectionValidatedNeedRecord {
    const adjudicationRef = this.ref('validate_need_adjudication_result', adjudication.adjudication_result_id, candidate.title_card_id);
    const supportPacketRef = this.supportPacketRef(supportPacket);
    const humanDecisionRef = this.ref('human_confirmed_decision', humanDecision.human_confirmed_decision_id, candidate.title_card_id);
    return {
      validated_need_id: validatedNeedRef.ref_id,
      workspace_id: candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      source_need_candidate_id: candidate.need_candidate_id,
      adjudication_result_id: adjudication.adjudication_result_id,
      support_packet_id: supportPacket.validation_support_packet_id,
      human_decision_id: humanDecision.human_confirmed_decision_id,
      validated_need_statement: candidate.unmet_need_statement,
      mechanism_type: candidate.mechanism_type,
      mechanism_summary: candidate.mechanism_summary,
      mechanism_payload: candidate.mechanism_payload,
      scope_notes: candidate.scope_notes,
      non_goal_notes: candidate.non_goal_notes,
      prior_art_status: candidate.prior_art_status,
      evidence_map_ref: candidate.evidence_map_ref,
      search_run_ref: candidate.search_run_ref,
      search_plan_ref: candidate.search_plan_ref,
      literature_snapshot_ref: candidate.literature_snapshot_ref,
      support_packet_ref: supportPacketRef,
      adjudication_result_ref: adjudicationRef,
      human_decision_ref: humanDecisionRef,
      evidence_role_bundle: supportPacket.evidence_role_bundle,
      strength_assessment_refs: supportPacket.strength_assessment_refs,
      conflict_refs: supportPacket.conflict_refs,
      residual_risk_refs: adjudication.residual_risk_refs,
      accepted_risk_refs: adjudication.accepted_risk_refs,
      trace_refs: this.uniqueRefs([
        this.ref('trace_snapshot', trace.trace_snapshot_id, candidate.title_card_id),
        ...(candidate.trace_snapshot_id ? [this.ref('trace_snapshot', candidate.trace_snapshot_id, candidate.title_card_id)] : []),
        ...(supportPacket.trace_snapshot_id ? [this.ref('trace_snapshot', supportPacket.trace_snapshot_id, candidate.title_card_id)] : []),
      ]),
      created_by: humanDecision.actor.actor_type,
      created_at: this.now(),
    };
  }

  private buildV1bInputBundle(
    validatedNeed: TopicSelectionValidatedNeedRecord,
    candidate: TopicSelectionNeedCandidateRecord,
    supportPacket: TopicSelectionValidationDecisionSupportPacketRecord,
    adjudication: TopicSelectionValidateNeedAdjudicationResultRecord,
    memorySuggestionRefs: TopicSelectionFunctionalRef[],
    recheckRequestRefs: TopicSelectionFunctionalRef[],
    bundleVersion: string,
    createdBy?: TopicSelectionActorType,
  ): TopicSelectionV1aToV1bInputBundleRecord {
    const bundleId = this.idFactory('v1b_input_bundle');
    return {
      v1b_input_bundle_id: bundleId,
      workspace_id: validatedNeed.workspace_id ?? null,
      title_card_id: validatedNeed.title_card_id,
      validated_need_id: validatedNeed.validated_need_id,
      source_need_candidate_id: candidate.need_candidate_id,
      adjudication_result_id: adjudication.adjudication_result_id,
      support_packet_id: supportPacket.validation_support_packet_id,
      bundle_version: bundleVersion,
      validated_need_ref: this.ref('validated_need', validatedNeed.validated_need_id, validatedNeed.title_card_id),
      source_need_candidate_ref: this.candidateRef(candidate),
      adjudication_result_ref: this.ref('validate_need_adjudication_result', adjudication.adjudication_result_id, validatedNeed.title_card_id),
      support_packet_ref: this.supportPacketRef(supportPacket),
      human_decision_ref: validatedNeed.human_decision_ref,
      evidence_map_ref: validatedNeed.evidence_map_ref,
      search_run_ref: validatedNeed.search_run_ref,
      search_plan_ref: validatedNeed.search_plan_ref,
      literature_snapshot_ref: validatedNeed.literature_snapshot_ref,
      evidence_role_bundle: validatedNeed.evidence_role_bundle,
      trace_refs: validatedNeed.trace_refs,
      risk_refs: this.uniqueRefs([...validatedNeed.residual_risk_refs, ...validatedNeed.accepted_risk_refs]),
      gap_codes: adjudication.gap_codes,
      memory_suggestion_refs: memorySuggestionRefs,
      recheck_request_refs: recheckRequestRefs,
      handoff_payload: {
        validated_need_statement: validatedNeed.validated_need_statement,
        mechanism_type: validatedNeed.mechanism_type,
        prior_art_status: validatedNeed.prior_art_status,
        support_packet_id: supportPacket.validation_support_packet_id,
        adjudication_result_id: adjudication.adjudication_result_id,
        output_validated_need_id: adjudication.output_validated_need_id,
      },
      created_by: createdBy ?? 'system',
      created_at: this.now(),
    };
  }

  private buildMemorySuggestion(
    candidate: TopicSelectionNeedCandidateRecord,
    adjudicationId: string,
    input: AdjudicateNeedInput,
  ): TopicSelectionCandidateDecisionMemorySuggestionRecord | null {
    if (!['reject', 'park', 'merge'].includes(input.final_decision) && !input.memory_suggestion) {
      return null;
    }
    const suggestionType = input.memory_suggestion?.suggestion_type ?? this.memorySuggestionTypeForDecision(input.final_decision);
    if (!suggestionType) {
      return null;
    }
    return {
      memory_suggestion_id: this.idFactory('candidate_memory_suggestion'),
      workspace_id: input.workspace_id ?? candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      source_need_candidate_id: candidate.need_candidate_id,
      adjudication_result_id: adjudicationId,
      suggestion_type: suggestionType,
      status: 'suggested',
      target_ref: this.candidateRef(candidate),
      suggestion_payload: input.memory_suggestion?.suggestion_payload ?? {
        final_decision: input.final_decision,
        rejected_reason: input.rejected_reason ?? null,
        merge_target_need_candidate_ref: input.merge_target_need_candidate_ref ?? null,
      },
      rationale: input.memory_suggestion?.rationale ?? input.rationale,
      policy_version_id: input.policy_version_id ?? null,
      created_by: input.adjudicated_by?.actor_type ?? 'human',
      created_at: this.now(),
    };
  }

  private memorySuggestionTypeForDecision(
    decision: TopicSelectionNeedAdjudicationDecision,
  ): TopicSelectionCandidateMemorySuggestionType | null {
    if (decision === 'reject') {
      return 'rejection_reason';
    }
    if (decision === 'park') {
      return 'parked_candidate';
    }
    if (decision === 'merge') {
      return 'merge_note';
    }
    return null;
  }

  private candidateCreationBlockers(input: CreateNeedCandidateInput): TopicSelectionGateIssue[] {
    const blockers: TopicSelectionGateIssue[] = [];
    if (input.candidate_need.trim().length === 0) {
      blockers.push(this.blocker('NEED_CANDIDATE_STATEMENT_REQUIRED', 'NeedCandidate requires a non-empty candidate need.'));
    }
    return blockers;
  }

  private readinessBlockers(
    candidate: TopicSelectionNeedCandidateRecord,
    bundle: TopicSelectionNeedValidationEvidenceBundle,
    roleBundle: TopicSelectionEvidenceRoleBundle,
    openRecheckRefs: TopicSelectionFunctionalRef[],
    strongUnresolvedChallengeRefs: TopicSelectionFunctionalRef[],
  ): TopicSelectionGateIssue[] {
    const blockers: TopicSelectionGateIssue[] = [];
    if (roleBundle.support_unit_refs.length === 0) {
      blockers.push(this.blocker('SUPPORT_EVIDENCE_REQUIRED', 'NeedCandidate requires support evidence before validation.'));
    }
    if (
      roleBundle.support_unit_refs.length > 0
      && roleBundle.support_unit_refs.every((unitRef) => {
        const unit = bundle.support_units.find((item) => item.evidence_unit_id === unitRef.ref_id);
        return unit?.abstract_only === true;
      })
    ) {
      blockers.push(this.blocker('SECTION_BACKED_SUPPORT_REQUIRED', 'Abstract-only support cannot make a candidate validation-ready.'));
    }
    if (bundle.freshness_status !== 'current') {
      blockers.push(this.blocker('EVIDENCE_MAP_CURRENT_REQUIRED', 'NeedCandidate readiness requires a current EvidenceMap.'));
    }
    if (candidate.speculative) {
      blockers.push(this.blocker('SPECULATIVE_CANDIDATE_SCOPE_REVISION_REQUIRED', 'Speculative candidates require scope revision before validation.'));
    }
    if (openRecheckRefs.length > 0) {
      blockers.push(this.blocker('OPEN_HIGH_PRIORITY_RECHECK', 'Open high-priority SearchPlan recheck must be resolved first.', openRecheckRefs));
    }
    if (strongUnresolvedChallengeRefs.length > 0) {
      blockers.push(this.blocker('STRONG_UNRESOLVED_CHALLENGE', 'Strong unresolved challenge evidence blocks validation.', strongUnresolvedChallengeRefs));
    }
    if (candidate.prior_art_status === 'already_solved' || candidate.prior_art_status === 'falsified') {
      blockers.push(this.blocker('PRIOR_ART_ALREADY_SOLVES_NEED', 'Prior art status blocks unmet-need validation.'));
    }
    if (!candidate.scope_notes || candidate.scope_notes.trim().length === 0) {
      blockers.push(this.blocker('SCOPE_REVIEW_REQUIRED', 'NeedCandidate requires explicit scope notes before validation.'));
    }
    if (roleBundle.baseline_unit_refs.length === 0 && roleBundle.context_unit_refs.length === 0) {
      blockers.push(this.blocker('COVERAGE_BASELINE_OR_CONTEXT_REQUIRED', 'Validation needs baseline or context coverage.'));
    }
    if (candidate.gap_codes.includes('PSEUDO_GAP_RISK')) {
      blockers.push(this.blocker('PSEUDO_GAP_RISK_UNRESOLVED', 'Pseudo-gap risk must be resolved before validation.'));
    }
    return blockers;
  }

  private readinessWarnings(gapCodes: string[]): TopicSelectionGateIssue[] {
    return gapCodes.map((code) => ({
      code,
      message: `Evidence strength assessment reported ${code}.`,
      severity: 'warning',
    }));
  }

  private readinessRecommendation(blockers: TopicSelectionGateIssue[]): TopicSelectionNeedReadinessRecommendation {
    if (blockers.length === 0) {
      return 'ready_for_validation';
    }
    const codes = new Set(blockers.map((blocker) => blocker.code));
    if (codes.has('OPEN_HIGH_PRIORITY_RECHECK') || codes.has('EVIDENCE_MAP_CURRENT_REQUIRED')) {
      return 'searchplan_recheck';
    }
    if (codes.has('SPECULATIVE_CANDIDATE_SCOPE_REVISION_REQUIRED') || codes.has('SCOPE_REVIEW_REQUIRED')) {
      return 'needs_scope_revision';
    }
    if (codes.has('STRONG_UNRESOLVED_CHALLENGE') || codes.has('PRIOR_ART_ALREADY_SOLVES_NEED')) {
      return 'reject';
    }
    return 'evidence_gap';
  }

  private statusForDecision(decision: TopicSelectionNeedAdjudicationDecision): TopicSelectionNeedCandidateDecisionStatus {
    switch (decision) {
      case 'validate':
        return 'resulted_in_validated_need';
      case 'return_to_candidate':
        return 'returned_for_revision';
      case 'request_searchplan_recheck':
        return 'searchplan_recheck_requested';
      case 'reject':
        return 'rejected';
      case 'park':
        return 'parked';
      case 'merge':
        return 'merged';
    }
  }

  private lifecycleStatusForDecision(decision: TopicSelectionNeedAdjudicationDecision): TopicSelectionNeedCandidateRecord['lifecycle_status'] {
    return decision === 'return_to_candidate' || decision === 'request_searchplan_recheck' || decision === 'park'
      ? 'hypothesis'
      : 'closed';
  }

  private loopbackForDecision(decision: TopicSelectionNeedAdjudicationDecision): TopicSelectionNeedLoopbackTarget {
    if (decision === 'return_to_candidate') {
      return 'need_candidate';
    }
    if (decision === 'request_searchplan_recheck') {
      return 'search_plan';
    }
    return 'none';
  }

  private resolveRoleBundle(
    input: CreateNeedCandidateInput,
    bundle: TopicSelectionNeedValidationEvidenceBundle,
  ): TopicSelectionEvidenceRoleBundle {
    return {
      support_unit_refs: this.unitRefsByIds(bundle.support_units, input.support_unit_ids, 'support_unit_ids'),
      challenge_unit_refs: this.unitRefsByIds(bundle.challenge_units, input.challenge_unit_ids, 'challenge_unit_ids'),
      baseline_unit_refs: this.unitRefsByIds(bundle.baseline_units, input.baseline_unit_ids, 'baseline_unit_ids'),
      context_unit_refs: this.unitRefsByIds(bundle.context_units, input.context_unit_ids, 'context_unit_ids'),
    };
  }

  private resolveRoleBundleFromCurrentBundle(
    roleBundle: TopicSelectionEvidenceRoleBundle,
    bundle: TopicSelectionNeedValidationEvidenceBundle,
  ): TopicSelectionEvidenceRoleBundle {
    return {
      support_unit_refs: this.keepCurrentUnitRefs(roleBundle.support_unit_refs, bundle.support_units),
      challenge_unit_refs: this.keepCurrentUnitRefs(roleBundle.challenge_unit_refs, bundle.challenge_units),
      baseline_unit_refs: this.keepCurrentUnitRefs(roleBundle.baseline_unit_refs, bundle.baseline_units),
      context_unit_refs: this.keepCurrentUnitRefs(roleBundle.context_unit_refs, bundle.context_units),
    };
  }

  private unitRefsByIds(
    units: TopicSelectionEvidenceUnitRecord[],
    unitIds: string[] | undefined,
    fieldName: string,
  ): TopicSelectionFunctionalRef[] {
    if (!unitIds) {
      return units.map((unit) => this.ref('evidence_unit', unit.evidence_unit_id, unit.title_card_id));
    }
    const availableIds = new Set(units.map((unit) => unit.evidence_unit_id));
    const missingIds = unitIds.filter((unitId) => !availableIds.has(unitId));
    if (missingIds.length > 0) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        `NeedCandidate ${fieldName} reference EvidenceUnit ids outside the EvidenceMap role bundle: ${missingIds.join(', ')}.`,
      );
    }
    const selectedIds = new Set(unitIds);
    return units
      .filter((unit) => selectedIds.has(unit.evidence_unit_id))
      .map((unit) => this.ref('evidence_unit', unit.evidence_unit_id, unit.title_card_id));
  }

  private keepCurrentUnitRefs(
    refs: TopicSelectionFunctionalRef[],
    units: TopicSelectionEvidenceUnitRecord[],
  ): TopicSelectionFunctionalRef[] {
    const currentIds = new Set(units.map((unit) => unit.evidence_unit_id));
    return refs.filter((ref) => currentIds.has(ref.ref_id));
  }

  private flattenRoleBundle(roleBundle: TopicSelectionEvidenceRoleBundle): TopicSelectionFunctionalRef[] {
    return [
      ...roleBundle.support_unit_refs,
      ...roleBundle.challenge_unit_refs,
      ...roleBundle.baseline_unit_refs,
      ...roleBundle.context_unit_refs,
    ];
  }

  private roleCounts(roleBundle: TopicSelectionEvidenceRoleBundle): Record<string, number> {
    return {
      support: roleBundle.support_unit_refs.length,
      challenge: roleBundle.challenge_unit_refs.length,
      baseline: roleBundle.baseline_unit_refs.length,
      context: roleBundle.context_unit_refs.length,
    };
  }

  private freshnessFromEvidenceBundle(
    bundle: TopicSelectionNeedValidationEvidenceBundle,
  ): TopicSelectionNeedCandidateRecord['freshness_status'] {
    if (bundle.freshness_status === 'superseded') {
      return 'superseded';
    }
    return bundle.freshness_status;
  }

  private async requireCandidate(needCandidateId: string): Promise<TopicSelectionNeedCandidateRecord> {
    const candidate = await this.repository.findNeedCandidateById(needCandidateId);
    if (!candidate) {
      throw new AppError(404, 'NOT_FOUND', `NeedCandidate ${needCandidateId} not found.`);
    }
    return candidate;
  }

  private async requireReadiness(
    readinessAssessmentId: string,
  ): Promise<TopicSelectionNeedCandidateReadinessAssessmentRecord> {
    const readiness = await this.repository.findReadinessAssessmentById(readinessAssessmentId);
    if (!readiness) {
      throw new AppError(404, 'NOT_FOUND', `NeedCandidateReadinessAssessment ${readinessAssessmentId} not found.`);
    }
    return readiness;
  }

  private async requireSupportPacket(
    supportPacketId: string,
  ): Promise<TopicSelectionValidationDecisionSupportPacketRecord> {
    const supportPacket = await this.repository.findValidationDecisionSupportPacketById(supportPacketId);
    if (!supportPacket) {
      throw new AppError(404, 'NOT_FOUND', `ValidationDecisionSupportPacket ${supportPacketId} not found.`);
    }
    return supportPacket;
  }

  private candidateRef(candidate: TopicSelectionNeedCandidateRecord): TopicSelectionFunctionalRef {
    return this.ref('need_candidate', candidate.need_candidate_id, candidate.title_card_id, candidate.candidate_version);
  }

  private supportPacketRef(packet: TopicSelectionValidationDecisionSupportPacketRecord): TopicSelectionFunctionalRef {
    return this.ref('validation_decision_support_packet', packet.validation_support_packet_id, packet.title_card_id);
  }

  private countSelectedAbstractOnlySupport(
    roleBundle: TopicSelectionEvidenceRoleBundle,
    bundle: TopicSelectionNeedValidationEvidenceBundle,
  ): number {
    const selectedSupportIds = new Set(roleBundle.support_unit_refs.map((unitRef) => unitRef.ref_id));
    return bundle.support_units.filter((unit) => selectedSupportIds.has(unit.evidence_unit_id) && unit.abstract_only).length;
  }

  private ref(
    refType: string,
    refId: string,
    titleCardId?: string | null,
    versionId?: string | null,
  ): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: refId,
      version_id: versionId ?? null,
      title_card_id: titleCardId ?? null,
    };
  }

  private blocker(code: string, message: string, refs: TopicSelectionFunctionalRef[] = []): TopicSelectionGateIssue {
    return {
      code,
      message,
      severity: 'blocking',
      refs,
    };
  }

  private stateWriteIntent(
    targetRef: TopicSelectionFunctionalRef,
    axis: TopicSelectionStateWriteIntent['axis'],
    stateKey: string,
    nextValue: string,
  ): TopicSelectionStateWriteIntent {
    return {
      axis,
      target_ref: targetRef,
      state_key: stateKey,
      next_value: nextValue,
    };
  }

  private assertTransitionPassed(result: string, targetName: string): void {
    if (result !== 'passed' && result !== 'passed_with_risk') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `${targetName} transition did not pass: ${result}.`);
    }
  }

  private assertCandidateCanBeAdjudicated(candidate: TopicSelectionNeedCandidateRecord): void {
    if (candidate.result_validated_need_id || candidate.decision_status === 'resulted_in_validated_need') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'NeedCandidate already produced a ValidatedNeed.');
    }
    if (candidate.lifecycle_status === 'closed') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Closed NeedCandidate cannot be adjudicated again.');
    }
    if (candidate.decision_status !== 'ready_for_validation') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Adjudication requires ready_for_validation NeedCandidate.');
    }
  }

  private assertValidateHumanActor(input: AdjudicateNeedInput): void {
    if (input.final_decision !== 'validate') {
      return;
    }
    const actor = input.human_actor ?? input.adjudicated_by ?? { actor_type: 'human' };
    if (actor.actor_type !== 'human' && actor.actor_type !== 'hybrid') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Validate adjudication requires a human or hybrid human_actor.');
    }
  }

  private assertSameTitleCard(expected: string, actual: string | null | undefined, objectName: string): void {
    if (actual && actual !== expected) {
      throw new AppError(409, 'VERSION_CONFLICT', `${objectName} belongs to a different title card.`);
    }
  }

  private versionFromId(id: string): string {
    return `v-${id.slice(-8)}`;
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values)];
  }

  private uniqueRefs(refs: Array<TopicSelectionFunctionalRef | null | undefined>): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const result: TopicSelectionFunctionalRef[] = [];
    for (const ref of refs) {
      if (!ref) {
        continue;
      }
      const key = `${ref.ref_type}:${ref.ref_id}:${ref.version_id ?? ''}:${ref.title_card_id ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(ref);
      }
    }
    return result;
  }
}
