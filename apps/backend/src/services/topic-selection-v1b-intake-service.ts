import crypto from 'node:crypto';
import type {
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
  TopicSelectionGateIssue,
  TopicSelectionHumanConfirmedDecisionRecord,
  TopicSelectionTraceSnapshotRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionNeedCandidateRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import type {
  TopicSelectionSearchPlanRecheckRequestRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-search-resource-contracts';
import type {
  TopicSelectionAcceptedRiskRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-recheck-risk-memory-contracts';
import type {
  TopicSelectionResearchConstraintProfileRecord,
  TopicSelectionV1bIntakeReadinessAssessmentRecord,
  TopicSelectionV1bIntakeReadinessRecommendation,
  TopicSelectionV1bIntakeSnapshotRecord,
  TopicSelectionV1bResearchSlicePlanningInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-intake-contracts';
import { AppError } from '../errors/app-error.js';
import type { TopicSelectionEvidenceMapRepository } from '../repositories/topic-selection-evidence-map.repository.js';
import type { TopicSelectionNeedValidationRepository } from '../repositories/topic-selection-need-validation.repository.js';
import type { TopicSelectionRecheckRiskMemoryRepository } from '../repositories/topic-selection-recheck-risk-memory.repository.js';
import type { TopicSelectionSearchResourceRepository } from '../repositories/topic-selection-search-resource.repository.js';
import type { TopicSelectionV1bIntakeRepository } from '../repositories/topic-selection-v1b-intake.repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { assertTopicSelectionAcceptedRiskUsableForTarget } from './topic-selection-recheck-risk-memory-service.js';

type IdFactory = (prefix: string) => string;

type ServiceOptions = {
  idFactory?: IdFactory;
  now?: () => string;
};

type CreateV1bIntakeSnapshotInput = {
  workspace_id?: string | null;
  v1b_input_bundle_id: string;
  snapshot_version?: string;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type CreateOrUpdateResearchConstraintProfileInput = {
  workspace_id?: string | null;
  v1b_intake_snapshot_id: string;
  previous_profile_id?: string | null;
  profile_version?: string;
  target_community?: string;
  target_venue_class?: string | null;
  intended_contribution_style?: string | null;
  method_constraints?: string[];
  resource_constraints?: string[];
  available_assets?: string[];
  feasibility_budget?: Record<string, unknown>;
  non_goals?: string[];
  claim_ceiling?: string;
  human_constraint_notes?: string | null;
  constraint_payload?: Record<string, unknown>;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type AssessV1bIntakeReadinessInput = {
  workspace_id?: string | null;
  v1b_intake_snapshot_id: string;
  research_constraint_profile_id: string;
  policy_version_id?: string | null;
  assessed_by?: TopicSelectionActorType;
};

type BuildResearchSlicePlanningInput = {
  readiness_assessment_id: string;
};

type RecheckResolution = {
  missing_recheck_refs: TopicSelectionFunctionalRef[];
  open_recheck_requests: TopicSelectionSearchPlanRecheckRequestRecord[];
};

type TraceRefResolution = {
  invalid_trace_refs: TopicSelectionFunctionalRef[];
  missing_trace_refs: TopicSelectionFunctionalRef[];
  trace_snapshots: TopicSelectionTraceSnapshotRecord[];
};

export class TopicSelectionV1bIntakeService {
  private readonly idFactory: IdFactory;
  private readonly now: () => string;

  constructor(
    private readonly repository: TopicSelectionV1bIntakeRepository,
    private readonly controlPlane: TopicSelectionControlPlaneService,
    private readonly needValidationRepository: TopicSelectionNeedValidationRepository,
    private readonly evidenceMapRepository: TopicSelectionEvidenceMapRepository,
    private readonly searchResourceRepository: TopicSelectionSearchResourceRepository,
    private readonly recheckRiskMemoryRepository: TopicSelectionRecheckRiskMemoryRepository,
    options: ServiceOptions = {},
  ) {
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async createV1bIntakeSnapshot(
    input: CreateV1bIntakeSnapshotInput,
  ): Promise<TopicSelectionV1bIntakeSnapshotRecord> {
    const bundle = await this.needValidationRepository.findV1aToV1bInputBundleById(input.v1b_input_bundle_id);
    if (!bundle) {
      throw new AppError(404, 'NOT_FOUND', `V1aToV1bInputBundle ${input.v1b_input_bundle_id} not found.`);
    }

    const validatedNeed = await this.needValidationRepository.findValidatedNeedById(bundle.validated_need_id);
    const needCandidate = await this.needValidationRepository.findNeedCandidateById(bundle.source_need_candidate_id);
    const supportPacket = await this.needValidationRepository.findValidationDecisionSupportPacketById(
      bundle.support_packet_id,
    );
    const adjudication = await this.needValidationRepository.findAdjudicationResultById(bundle.adjudication_result_id);
    const humanDecision = this.isHumanDecisionRef(bundle.human_decision_ref)
      ? await this.controlPlane.getHumanDecision(bundle.human_decision_ref.ref_id)
      : null;
    const traceRefResolution = await this.resolveTraceRefs(bundle.trace_refs);
    const evidenceMap = await this.evidenceMapRepository.findEvidenceMapById(bundle.evidence_map_ref.ref_id);
    const searchRun = await this.searchResourceRepository.findSearchRunById(bundle.search_run_ref.ref_id);
    const searchPlan = await this.searchResourceRepository.findSearchPlanById(bundle.search_plan_ref.ref_id);
    const literatureSnapshot = await this.searchResourceRepository.findLiteratureResourcePoolSnapshotById(
      bundle.literature_snapshot_ref.ref_id,
    );
    const traceIssues = this.intakeTraceIssues({
      bundle,
      validatedNeed,
      needCandidate,
      supportPacket,
      adjudication,
      humanDecision,
      traceRefResolution,
      evidenceMapExists: Boolean(evidenceMap),
      evidenceMapFreshnessStatus: evidenceMap?.freshness_status ?? null,
      searchRunExists: Boolean(searchRun),
      searchPlanExists: Boolean(searchPlan),
      literatureSnapshotExists: Boolean(literatureSnapshot),
    });
    const traceStatus = this.traceStatus(traceIssues);
    const snapshotId = this.idFactory('v1b_intake_snapshot');
    const snapshotVersion = input.snapshot_version ?? this.versionFromId(snapshotId);
    const snapshotRef = this.ref('v1b_intake_snapshot', snapshotId, bundle.title_card_id, snapshotVersion);
    const bundleRef = this.ref('v1a_to_v1b_input_bundle', bundle.v1b_input_bundle_id, bundle.title_card_id, bundle.bundle_version);
    const sourceRefs = this.uniqueRefs([
      bundleRef,
      bundle.validated_need_ref,
      bundle.source_need_candidate_ref,
      bundle.adjudication_result_ref,
      bundle.support_packet_ref,
      bundle.human_decision_ref,
      bundle.evidence_map_ref,
      bundle.search_run_ref,
      bundle.search_plan_ref,
      bundle.literature_snapshot_ref,
      ...bundle.trace_refs,
      ...bundle.risk_refs,
      ...bundle.memory_suggestion_refs,
      ...bundle.recheck_request_refs,
    ]);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? bundle.workspace_id ?? null,
      title_card_id: bundle.title_card_id,
      target_ref: snapshotRef,
      source_refs: sourceRefs,
      payload: {
        v1b_input_bundle_id: bundle.v1b_input_bundle_id,
        trace_status: traceStatus,
        trace_issue_codes: traceIssues.map((issue) => issue.code),
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? bundle.workspace_id ?? null,
      title_card_id: bundle.title_card_id,
      workflow_key: 'topic-selection.v1b-intake-snapshot',
      workflow_profile_key: 'deterministic-v1a-handoff-intake',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      status: traceIssues.length > 0 ? 'blocked' : 'succeeded',
      output_summary: {
        trace_status: traceStatus,
        trace_issue_codes: traceIssues.map((issue) => issue.code),
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            v1b_input_bundle_id: bundle.v1b_input_bundle_id,
            validated_need_id: bundle.validated_need_id,
            trace_status: traceStatus,
            trace_issues: traceIssues,
          },
        },
      ],
      created_by: input.created_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? bundle.workspace_id ?? null,
      title_card_id: bundle.title_card_id,
      gate_key: 'topic-selection.v1b-intake-snapshot-trace-check',
      target_ref: snapshotRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      blockers: traceIssues,
      required_actions: traceIssues.map((issue) => issue.code),
      created_by: input.created_by ?? 'system',
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? bundle.workspace_id ?? null,
      title_card_id: bundle.title_card_id,
      transition_key: 'v1a-bundle-to-v1b-intake-snapshot',
      source_ref: bundleRef,
      target_ref: snapshotRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      created_authority_refs: [snapshotRef],
    });
    const trace = await this.controlPlane.buildTraceSnapshot({
      workspace_id: input.workspace_id ?? bundle.workspace_id ?? null,
      title_card_id: bundle.title_card_id,
      target_ref: snapshotRef,
      object_refs: [snapshotRef, ...sourceRefs],
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, bundle.title_card_id)),
      transition_attempt_refs: [this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, bundle.title_card_id)],
      payload: {
        trace_status: traceStatus,
        note: 'v1b intake snapshot does not revalidate unmet need.',
      },
      created_by: input.created_by ?? 'system',
    });

    return this.repository.createIntakeSnapshot({
      v1b_intake_snapshot_id: snapshotId,
      workspace_id: input.workspace_id ?? bundle.workspace_id ?? null,
      title_card_id: bundle.title_card_id,
      v1b_input_bundle_id: bundle.v1b_input_bundle_id,
      validated_need_id: bundle.validated_need_id,
      snapshot_version: snapshotVersion,
      v1b_input_bundle_ref: bundleRef,
      validated_need_ref: bundle.validated_need_ref,
      source_need_candidate_ref: bundle.source_need_candidate_ref,
      adjudication_result_ref: bundle.adjudication_result_ref,
      support_packet_ref: bundle.support_packet_ref,
      human_decision_ref: bundle.human_decision_ref,
      evidence_map_ref: bundle.evidence_map_ref,
      search_run_ref: bundle.search_run_ref,
      search_plan_ref: bundle.search_plan_ref,
      literature_snapshot_ref: bundle.literature_snapshot_ref,
      evidence_role_bundle: bundle.evidence_role_bundle,
      trace_refs: bundle.trace_refs,
      risk_refs: bundle.risk_refs,
      gap_codes: bundle.gap_codes,
      memory_suggestion_refs: bundle.memory_suggestion_refs,
      recheck_request_refs: bundle.recheck_request_refs,
      handoff_payload: bundle.handoff_payload,
      trace_status: traceStatus,
      trace_issues: traceIssues,
      evidence_map_freshness_status: evidenceMap?.freshness_status ?? null,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      trace_snapshot_id: trace.trace_snapshot_id,
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, bundle.title_card_id)),
      created_by: input.created_by ?? 'system',
      created_at: this.now(),
    });
  }

  async createOrUpdateResearchConstraintProfile(
    input: CreateOrUpdateResearchConstraintProfileInput,
  ): Promise<TopicSelectionResearchConstraintProfileRecord> {
    const snapshot = await this.requireSnapshot(input.v1b_intake_snapshot_id);
    const previousProfile = input.previous_profile_id
      ? await this.requireProfile(input.previous_profile_id)
      : null;
    if (previousProfile && previousProfile.v1b_input_bundle_id !== snapshot.v1b_input_bundle_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Previous ResearchConstraintProfile belongs to a different v1b bundle.');
    }

    const profileId = this.idFactory('research_constraint_profile');
    const profileVersion = input.profile_version ?? this.versionFromId(profileId);
    const profileRef = this.ref('research_constraint_profile', profileId, snapshot.title_card_id, profileVersion);
    const sourceRefs = this.uniqueRefs([
      this.snapshotRef(snapshot),
      snapshot.v1b_input_bundle_ref,
      snapshot.validated_need_ref,
      ...(previousProfile ? [this.profileRef(previousProfile)] : []),
    ]);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      target_ref: profileRef,
      source_refs: sourceRefs,
      payload: {
        target_community: input.target_community ?? '',
        claim_ceiling: input.claim_ceiling ?? '',
        non_goals: input.non_goals ?? [],
        method_constraints: input.method_constraints ?? [],
        resource_constraints: input.resource_constraints ?? [],
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'human',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      workflow_key: 'topic-selection.v1b-research-constraint-profile',
      workflow_profile_key: 'human-authored-constraint-profile',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      output_summary: {
        target_community_present: Boolean((input.target_community ?? '').trim()),
        claim_ceiling_present: Boolean((input.claim_ceiling ?? '').trim()),
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            target_community: input.target_community ?? '',
            claim_ceiling: input.claim_ceiling ?? '',
            non_goals: input.non_goals ?? [],
            method_constraints: input.method_constraints ?? [],
            resource_constraints: input.resource_constraints ?? [],
          },
        },
      ],
      created_by: input.created_by ?? 'human',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      gate_key: 'topic-selection.v1b-research-constraint-profile-recorded',
      target_ref: profileRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'human',
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      transition_key: 'v1b-intake-snapshot-to-constraint-profile',
      source_ref: this.snapshotRef(snapshot),
      target_ref: profileRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'human' },
      created_authority_refs: [profileRef],
    });
    const trace = await this.controlPlane.buildTraceSnapshot({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      target_ref: profileRef,
      object_refs: [profileRef, ...sourceRefs],
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, snapshot.title_card_id)),
      transition_attempt_refs: [this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, snapshot.title_card_id)],
      payload: {
        profile_version: profileVersion,
        note: 'ResearchConstraintProfile bounds v1b slice planning before ResearchSlice generation.',
      },
      created_by: input.created_by ?? 'human',
    });

    return this.repository.createResearchConstraintProfile({
      research_constraint_profile_id: profileId,
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
      v1b_input_bundle_id: snapshot.v1b_input_bundle_id,
      validated_need_id: snapshot.validated_need_id,
      profile_version: profileVersion,
      v1b_intake_snapshot_ref: this.snapshotRef(snapshot),
      v1b_input_bundle_ref: snapshot.v1b_input_bundle_ref,
      validated_need_ref: snapshot.validated_need_ref,
      supersedes_profile_ref: previousProfile ? this.profileRef(previousProfile) : null,
      target_community: input.target_community ?? '',
      target_venue_class: input.target_venue_class ?? null,
      intended_contribution_style: input.intended_contribution_style ?? null,
      method_constraints: input.method_constraints ?? [],
      resource_constraints: input.resource_constraints ?? [],
      available_assets: input.available_assets ?? [],
      feasibility_budget: input.feasibility_budget ?? {},
      non_goals: input.non_goals ?? [],
      claim_ceiling: input.claim_ceiling ?? '',
      human_constraint_notes: input.human_constraint_notes ?? null,
      constraint_payload: input.constraint_payload ?? {},
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      trace_snapshot_id: trace.trace_snapshot_id,
      artifact_refs: workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, snapshot.title_card_id)),
      created_by: input.created_by ?? 'human',
      created_at: this.now(),
    });
  }

  async assessV1bIntakeReadiness(
    input: AssessV1bIntakeReadinessInput,
  ): Promise<TopicSelectionV1bIntakeReadinessAssessmentRecord> {
    const snapshot = await this.requireSnapshot(input.v1b_intake_snapshot_id);
    const profile = await this.requireProfile(input.research_constraint_profile_id);
    if (profile.v1b_intake_snapshot_id !== snapshot.v1b_intake_snapshot_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'ResearchConstraintProfile belongs to a different intake snapshot.');
    }
    const existing = await this.repository.findReadinessAssessmentBySnapshotAndProfile(
      snapshot.v1b_intake_snapshot_id,
      profile.research_constraint_profile_id,
      profile.profile_version,
    );
    if (existing) {
      return existing;
    }

    const rechecks = await this.resolveOpenRechecks(snapshot.recheck_request_refs);
    const acceptedRisks = await this.resolveUsableAcceptedRisks(snapshot.risk_refs, snapshot);
    const coveredOpenRechecks = rechecks.open_recheck_requests.filter((request) =>
      acceptedRisks.some((risk) => this.riskCoversRecheck(risk, request, snapshot)),
    );
    const uncoveredOpenRechecks = rechecks.open_recheck_requests.filter((request) =>
      !coveredOpenRechecks.some((covered) =>
        covered.search_plan_recheck_request_id === request.search_plan_recheck_request_id
      ),
    );
    const staleRefCodes = this.uniqueStrings([
      ...snapshot.trace_issues.map((issue) => issue.code),
      ...rechecks.missing_recheck_refs.map((ref) => `MISSING_RECHECK_REF:${ref.ref_id}`),
      ...(snapshot.evidence_map_freshness_status && snapshot.evidence_map_freshness_status !== 'current'
        ? ['EVIDENCE_MAP_CURRENT_REQUIRED']
        : []),
    ]);
    const missingConstraintCodes = this.missingConstraintCodes(profile);
    const parkReason = this.profileParkReason(profile);
    const blockers = this.readinessBlockers(
      snapshot,
      staleRefCodes,
      missingConstraintCodes,
      uncoveredOpenRechecks,
      parkReason,
    );
    const acceptedRiskRefs = acceptedRisks.map((risk) => this.ref('accepted_risk', risk.accepted_risk_id, risk.title_card_id ?? snapshot.title_card_id));
    const recommendation = this.readinessRecommendation(
      snapshot.trace_status,
      staleRefCodes,
      uncoveredOpenRechecks,
      missingConstraintCodes,
      parkReason,
    );
    const readinessId = this.idFactory('v1b_intake_readiness');
    const readinessRef = this.ref('v1b_intake_readiness', readinessId, snapshot.title_card_id);
    const sourceRefs = this.uniqueRefs([
      this.snapshotRef(snapshot),
      this.profileRef(profile),
      snapshot.v1b_input_bundle_ref,
      snapshot.validated_need_ref,
      snapshot.evidence_map_ref,
      snapshot.search_run_ref,
      snapshot.search_plan_ref,
      snapshot.literature_snapshot_ref,
      ...snapshot.recheck_request_refs,
      ...acceptedRiskRefs,
    ]);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      target_ref: readinessRef,
      source_refs: sourceRefs,
      payload: {
        recommendation,
        blocker_codes: blockers.map((blocker) => blocker.code),
        missing_constraint_codes: missingConstraintCodes,
        stale_ref_codes: staleRefCodes,
        park_reason: parkReason,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.assessed_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      workflow_key: 'topic-selection.v1b-intake-readiness',
      workflow_profile_key: 'deterministic-intake-readiness-policy',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      status: blockers.length > 0 ? 'blocked' : 'succeeded',
      output_summary: {
        recommendation,
        blocker_codes: blockers.map((blocker) => blocker.code),
        accepted_risk_count: acceptedRiskRefs.length,
      },
      created_by: input.assessed_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      gate_key: 'topic-selection.v1b-ready-for-slice',
      target_ref: this.snapshotRef(snapshot),
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      verdict: blockers.length === 0 && acceptedRiskRefs.length > 0 ? 'pass_with_risk' : undefined,
      blockers,
      warnings: acceptedRiskRefs.length > 0
        ? [this.warning('ACCEPTED_RISK_CARRIED_FORWARD', 'v1b intake carries active accepted risk refs.', acceptedRiskRefs)]
        : [],
      required_actions: blockers.map((blocker) => blocker.code),
      accepted_risk_refs: acceptedRiskRefs,
      created_by: input.assessed_by ?? 'system',
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      transition_key: 'v1b-intake-ready-for-slice',
      source_ref: this.snapshotRef(snapshot),
      target_ref: readinessRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.assessed_by ?? 'system' },
      accepted_risk_refs: acceptedRiskRefs,
      created_authority_refs: [readinessRef],
    });

    return this.repository.createReadinessAssessment({
      v1b_intake_readiness_assessment_id: readinessId,
      workspace_id: input.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: snapshot.title_card_id,
      v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
      research_constraint_profile_id: profile.research_constraint_profile_id,
      v1b_input_bundle_id: snapshot.v1b_input_bundle_id,
      validated_need_id: snapshot.validated_need_id,
      profile_version: profile.profile_version,
      recommendation,
      blockers,
      warnings: gate.warnings,
      required_actions: gate.required_actions,
      v1b_intake_snapshot_ref: this.snapshotRef(snapshot),
      research_constraint_profile_ref: this.profileRef(profile),
      v1b_input_bundle_ref: snapshot.v1b_input_bundle_ref,
      validated_need_ref: snapshot.validated_need_ref,
      evidence_map_ref: snapshot.evidence_map_ref,
      search_run_ref: snapshot.search_run_ref,
      search_plan_ref: snapshot.search_plan_ref,
      literature_snapshot_ref: snapshot.literature_snapshot_ref,
      open_recheck_request_refs: rechecks.open_recheck_requests.map((request) =>
        this.ref('search_plan_recheck_request', request.search_plan_recheck_request_id, request.title_card_id)
      ),
      accepted_risk_refs: acceptedRiskRefs,
      uncovered_recheck_request_refs: uncoveredOpenRechecks.map((request) =>
        this.ref('search_plan_recheck_request', request.search_plan_recheck_request_id, request.title_card_id)
      ),
      stale_ref_codes: staleRefCodes,
      missing_constraint_codes: missingConstraintCodes,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      policy_version_id: input.policy_version_id ?? null,
      assessed_by: input.assessed_by ?? 'system',
      created_at: this.now(),
    });
  }

  async buildResearchSlicePlanningInput(
    input: BuildResearchSlicePlanningInput,
  ): Promise<TopicSelectionV1bResearchSlicePlanningInput> {
    const readiness = await this.repository.findReadinessAssessmentById(input.readiness_assessment_id);
    if (!readiness) {
      throw new AppError(404, 'NOT_FOUND', `V1bIntakeReadinessAssessment ${input.readiness_assessment_id} not found.`);
    }
    if (readiness.recommendation !== 'ready_for_slice') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ResearchSlice planning requires ready_for_slice intake readiness.');
    }
    const snapshot = await this.requireSnapshot(readiness.v1b_intake_snapshot_id);
    const profile = await this.requireProfile(readiness.research_constraint_profile_id);
    return {
      v1b_input_bundle_ref: readiness.v1b_input_bundle_ref,
      v1b_intake_snapshot_ref: readiness.v1b_intake_snapshot_ref,
      research_constraint_profile_ref: readiness.research_constraint_profile_ref,
      readiness_assessment_ref: this.ref('v1b_intake_readiness', readiness.v1b_intake_readiness_assessment_id, readiness.title_card_id),
      validated_need_ref: readiness.validated_need_ref,
      evidence_map_ref: readiness.evidence_map_ref,
      search_run_ref: readiness.search_run_ref,
      search_plan_ref: readiness.search_plan_ref,
      literature_snapshot_ref: readiness.literature_snapshot_ref,
      evidence_role_bundle: snapshot.evidence_role_bundle,
      target_community: profile.target_community,
      target_venue_class: profile.target_venue_class,
      intended_contribution_style: profile.intended_contribution_style,
      method_constraints: profile.method_constraints,
      resource_constraints: profile.resource_constraints,
      available_assets: profile.available_assets,
      feasibility_budget: profile.feasibility_budget,
      non_goals: profile.non_goals,
      claim_ceiling: profile.claim_ceiling,
      accepted_risk_refs: readiness.accepted_risk_refs,
      gap_codes: snapshot.gap_codes,
      memory_suggestion_refs: snapshot.memory_suggestion_refs,
      recheck_request_refs: snapshot.recheck_request_refs,
      handoff_payload: snapshot.handoff_payload,
    };
  }

  private intakeTraceIssues(input: {
    bundle: NonNullable<Awaited<ReturnType<TopicSelectionNeedValidationRepository['findV1aToV1bInputBundleById']>>>;
    validatedNeed: Awaited<ReturnType<TopicSelectionNeedValidationRepository['findValidatedNeedById']>>;
    needCandidate: TopicSelectionNeedCandidateRecord | null;
    supportPacket: Awaited<ReturnType<TopicSelectionNeedValidationRepository['findValidationDecisionSupportPacketById']>>;
    adjudication: Awaited<ReturnType<TopicSelectionNeedValidationRepository['findAdjudicationResultById']>>;
    humanDecision: TopicSelectionHumanConfirmedDecisionRecord | null;
    traceRefResolution: TraceRefResolution;
    evidenceMapExists: boolean;
    evidenceMapFreshnessStatus: string | null;
    searchRunExists: boolean;
    searchPlanExists: boolean;
    literatureSnapshotExists: boolean;
  }): TopicSelectionGateIssue[] {
    const issues: TopicSelectionGateIssue[] = [];
    const {
      bundle,
      validatedNeed,
      needCandidate,
      supportPacket,
      adjudication,
      humanDecision,
      traceRefResolution,
    } = input;
    if (!needCandidate) {
      issues.push(this.blocker('SOURCE_NEED_CANDIDATE_NOT_FOUND', 'v1b intake requires the source NeedCandidate.', [bundle.source_need_candidate_ref]));
    } else {
      this.pushRefMismatchIssue(issues, 'SOURCE_NEED_CANDIDATE_REF_MISMATCH', bundle.source_need_candidate_ref, this.ref('need_candidate', needCandidate.need_candidate_id, needCandidate.title_card_id, needCandidate.candidate_version));
      this.pushRefMismatchIssue(issues, 'SOURCE_CANDIDATE_EVIDENCE_MAP_REF_MISMATCH', bundle.evidence_map_ref, needCandidate.evidence_map_ref);
      this.pushRefMismatchIssue(issues, 'SOURCE_CANDIDATE_SEARCH_RUN_REF_MISMATCH', bundle.search_run_ref, needCandidate.search_run_ref);
      this.pushRefMismatchIssue(issues, 'SOURCE_CANDIDATE_SEARCH_PLAN_REF_MISMATCH', bundle.search_plan_ref, needCandidate.search_plan_ref);
      this.pushRefMismatchIssue(issues, 'SOURCE_CANDIDATE_LITERATURE_SNAPSHOT_REF_MISMATCH', bundle.literature_snapshot_ref, needCandidate.literature_snapshot_ref);
    }
    if (!validatedNeed) {
      issues.push(this.blocker('VALIDATED_NEED_NOT_FOUND', 'v1b intake requires a persisted ValidatedNeed.', [bundle.validated_need_ref]));
    } else {
      this.pushRefMismatchIssue(issues, 'VALIDATED_NEED_REF_MISMATCH', bundle.validated_need_ref, this.ref('validated_need', validatedNeed.validated_need_id, validatedNeed.title_card_id));
      this.pushRefMismatchIssue(issues, 'HUMAN_DECISION_REF_MISMATCH', bundle.human_decision_ref, validatedNeed.human_decision_ref);
      this.pushRefMismatchIssue(issues, 'SUPPORT_PACKET_REF_MISMATCH', bundle.support_packet_ref, validatedNeed.support_packet_ref);
      this.pushRefMismatchIssue(issues, 'ADJUDICATION_RESULT_REF_MISMATCH', bundle.adjudication_result_ref, validatedNeed.adjudication_result_ref);
      this.pushRefMismatchIssue(issues, 'EVIDENCE_MAP_REF_MISMATCH', bundle.evidence_map_ref, validatedNeed.evidence_map_ref);
      this.pushRefMismatchIssue(issues, 'SEARCH_RUN_REF_MISMATCH', bundle.search_run_ref, validatedNeed.search_run_ref);
      this.pushRefMismatchIssue(issues, 'SEARCH_PLAN_REF_MISMATCH', bundle.search_plan_ref, validatedNeed.search_plan_ref);
      this.pushRefMismatchIssue(issues, 'LITERATURE_SNAPSHOT_REF_MISMATCH', bundle.literature_snapshot_ref, validatedNeed.literature_snapshot_ref);
    }
    if (!this.isHumanDecisionRef(bundle.human_decision_ref)) {
      issues.push(this.blocker('HUMAN_DECISION_REF_TYPE_INVALID', 'v1b intake requires a human confirmed decision ref.', [bundle.human_decision_ref]));
    } else if (!humanDecision) {
      issues.push(this.blocker('HUMAN_DECISION_NOT_FOUND', 'v1b intake requires the persisted human confirmed decision.', [bundle.human_decision_ref]));
    } else {
      this.pushRefMismatchIssue(
        issues,
        'HUMAN_DECISION_TARGET_MISMATCH',
        humanDecision.target_ref,
        bundle.validated_need_ref,
      );
      if (humanDecision.decision_type !== 'confirm') {
        issues.push(this.blocker('HUMAN_DECISION_CONFIRM_REQUIRED', 'v1b intake requires a confirming human decision.', [bundle.human_decision_ref]));
      }
      if (!this.isHumanActor(humanDecision.actor.actor_type)) {
        issues.push(this.blocker('HUMAN_DECISION_HUMAN_ACTOR_REQUIRED', 'v1b intake requires a human or hybrid decision actor.', [bundle.human_decision_ref]));
      }
    }
    if (!supportPacket) {
      issues.push(this.blocker('SUPPORT_PACKET_NOT_FOUND', 'v1b intake requires the v1a validation support packet.', [bundle.support_packet_ref]));
    } else if (supportPacket.validation_support_packet_id !== bundle.support_packet_id) {
      issues.push(this.blocker('SUPPORT_PACKET_ID_MISMATCH', 'Support packet id does not match the v1b input bundle.', [bundle.support_packet_ref]));
    } else {
      this.pushRefMismatchIssue(
        issues,
        'SUPPORT_PACKET_REF_MISMATCH',
        bundle.support_packet_ref,
        this.ref('validation_decision_support_packet', supportPacket.validation_support_packet_id, supportPacket.title_card_id),
      );
      this.pushRefMismatchIssue(issues, 'SUPPORT_PACKET_EVIDENCE_MAP_REF_MISMATCH', bundle.evidence_map_ref, supportPacket.evidence_map_ref);
      this.pushRefMismatchIssue(issues, 'SUPPORT_PACKET_SEARCH_RUN_REF_MISMATCH', bundle.search_run_ref, supportPacket.search_run_ref);
      this.pushRefMismatchIssue(issues, 'SUPPORT_PACKET_SEARCH_PLAN_REF_MISMATCH', bundle.search_plan_ref, supportPacket.search_plan_ref);
      this.pushRefMismatchIssue(issues, 'SUPPORT_PACKET_LITERATURE_SNAPSHOT_REF_MISMATCH', bundle.literature_snapshot_ref, supportPacket.literature_snapshot_ref);
    }
    if (!adjudication) {
      issues.push(this.blocker('ADJUDICATION_RESULT_NOT_FOUND', 'v1b intake requires the v1a adjudication result.', [bundle.adjudication_result_ref]));
    } else {
      this.pushRefMismatchIssue(
        issues,
        'ADJUDICATION_RESULT_REF_MISMATCH',
        bundle.adjudication_result_ref,
        this.ref('validate_need_adjudication_result', adjudication.adjudication_result_id, adjudication.title_card_id),
      );
      if (adjudication.final_decision !== 'validate') {
        issues.push(this.blocker('ADJUDICATION_NOT_VALIDATED', 'v1b only accepts validated need adjudications.', [bundle.adjudication_result_ref]));
      }
      if (adjudication.output_validated_need_id !== bundle.validated_need_id) {
        issues.push(this.blocker('ADJUDICATION_OUTPUT_MISMATCH', 'Adjudication output does not match the bundle ValidatedNeed.', [bundle.adjudication_result_ref, bundle.validated_need_ref]));
      }
    }
    if (!input.evidenceMapExists) {
      issues.push(this.blocker('EVIDENCE_MAP_NOT_FOUND', 'v1b intake requires a traceable EvidenceMap.', [bundle.evidence_map_ref]));
    }
    if (input.evidenceMapFreshnessStatus && input.evidenceMapFreshnessStatus !== 'current') {
      issues.push(this.blocker('EVIDENCE_MAP_CURRENT_REQUIRED', 'v1b intake requires a current EvidenceMap.', [bundle.evidence_map_ref]));
    }
    if (!input.searchRunExists) {
      issues.push(this.blocker('SEARCH_RUN_NOT_FOUND', 'v1b intake requires a traceable SearchRun.', [bundle.search_run_ref]));
    }
    if (!input.searchPlanExists) {
      issues.push(this.blocker('SEARCH_PLAN_NOT_FOUND', 'v1b intake requires a traceable SearchPlan.', [bundle.search_plan_ref]));
    }
    if (!input.literatureSnapshotExists) {
      issues.push(this.blocker('LITERATURE_SNAPSHOT_NOT_FOUND', 'v1b intake requires a traceable literature resource pool snapshot.', [bundle.literature_snapshot_ref]));
    }
    if (bundle.trace_refs.length === 0) {
      issues.push(this.blocker('TRACE_REFS_REQUIRED', 'v1b intake requires inherited v1a trace refs.', [bundle.validated_need_ref]));
    }
    if (traceRefResolution.invalid_trace_refs.length > 0) {
      issues.push(this.blocker('TRACE_REF_TYPE_INVALID', 'v1b intake trace refs must reference trace snapshots.', traceRefResolution.invalid_trace_refs));
    }
    if (traceRefResolution.missing_trace_refs.length > 0) {
      issues.push(this.blocker('TRACE_REF_NOT_FOUND', 'v1b intake requires persisted inherited trace snapshots.', traceRefResolution.missing_trace_refs));
    }
    for (const traceSnapshot of traceRefResolution.trace_snapshots) {
      if (traceSnapshot.title_card_id && traceSnapshot.title_card_id !== bundle.title_card_id) {
        issues.push(this.blocker(
          'TRACE_REF_TITLE_CARD_MISMATCH',
          'Inherited trace snapshot belongs to a different title card.',
          [this.ref('trace_snapshot', traceSnapshot.trace_snapshot_id, traceSnapshot.title_card_id)],
        ));
      }
    }
    return issues;
  }

  private traceStatus(issues: TopicSelectionGateIssue[]): TopicSelectionV1bIntakeSnapshotRecord['trace_status'] {
    if (issues.length === 0) {
      return 'passed';
    }
    return issues.some((issue) => issue.code.endsWith('_MISMATCH')) ? 'mismatched' : 'stale_or_missing';
  }

  private async resolveOpenRechecks(recheckRefs: TopicSelectionFunctionalRef[]): Promise<RecheckResolution> {
    const missing: TopicSelectionFunctionalRef[] = [];
    const open: TopicSelectionSearchPlanRecheckRequestRecord[] = [];
    for (const recheckRef of recheckRefs) {
      if (recheckRef.ref_type !== 'search_plan_recheck_request') {
        continue;
      }
      const request = await this.searchResourceRepository.findSearchPlanRecheckRequestById(recheckRef.ref_id);
      if (!request) {
        missing.push(recheckRef);
        continue;
      }
      if (request.status === 'open') {
        open.push(request);
      }
    }
    return {
      missing_recheck_refs: missing,
      open_recheck_requests: open,
    };
  }

  private async resolveUsableAcceptedRisks(
    riskRefs: TopicSelectionFunctionalRef[],
    snapshot: TopicSelectionV1bIntakeSnapshotRecord,
  ): Promise<TopicSelectionAcceptedRiskRecord[]> {
    const usableRisks: TopicSelectionAcceptedRiskRecord[] = [];
    for (const riskRef of riskRefs) {
      if (riskRef.ref_type !== 'accepted_risk') {
        continue;
      }
      const risk = await this.recheckRiskMemoryRepository.findAcceptedRiskById(riskRef.ref_id);
      if (!risk) {
        continue;
      }
      try {
        assertTopicSelectionAcceptedRiskUsableForTarget(risk, snapshot.validated_need_ref, {
          now: this.now(),
          workspace_id: snapshot.workspace_id ?? null,
          title_card_id: snapshot.title_card_id,
        });
        usableRisks.push(risk);
      } catch (error) {
        if (!(error instanceof AppError)) {
          throw error;
        }
      }
    }
    return usableRisks;
  }

  private riskCoversRecheck(
    risk: TopicSelectionAcceptedRiskRecord,
    recheck: TopicSelectionSearchPlanRecheckRequestRecord,
    snapshot: TopicSelectionV1bIntakeSnapshotRecord,
  ): boolean {
    const recheckRef = this.ref('search_plan_recheck_request', recheck.search_plan_recheck_request_id, recheck.title_card_id);
    const coverageRefs = this.uniqueRefs([
      risk.source_ref ?? null,
      risk.target_ref,
      ...risk.scope_refs,
      ...risk.affected_object_refs,
    ]);
    return coverageRefs.some((ref) =>
      this.refsEqual(ref, recheckRef)
      || this.refsEqual(ref, recheck.target_search_plan_ref)
      || this.refsEqual(ref, snapshot.search_plan_ref)
      || this.refsEqual(ref, snapshot.validated_need_ref)
    );
  }

  private missingConstraintCodes(profile: TopicSelectionResearchConstraintProfileRecord): string[] {
    const missing: string[] = [];
    if (!profile.target_community.trim()) {
      missing.push('TARGET_COMMUNITY_REQUIRED');
    }
    if (!profile.claim_ceiling.trim()) {
      missing.push('CLAIM_CEILING_REQUIRED');
    }
    if (!profile.non_goals.some((item) => item.trim())) {
      missing.push('NON_GOALS_REQUIRED');
    }
    if (
      !profile.method_constraints.some((item) => item.trim())
      && !profile.resource_constraints.some((item) => item.trim())
    ) {
      missing.push('METHOD_OR_RESOURCE_CONSTRAINT_REQUIRED');
    }
    return missing;
  }

  private readinessBlockers(
    snapshot: TopicSelectionV1bIntakeSnapshotRecord,
    staleRefCodes: string[],
    missingConstraintCodes: string[],
    uncoveredRechecks: TopicSelectionSearchPlanRecheckRequestRecord[],
    parkReason: string | null,
  ): TopicSelectionGateIssue[] {
    const blockers: TopicSelectionGateIssue[] = [];
    if (snapshot.trace_status !== 'passed' || staleRefCodes.length > 0) {
      blockers.push(this.blocker('STALE_OR_INVALID_V1A_TRACE', 'v1b intake has stale, missing, or mismatched upstream trace refs.', [
        snapshot.v1b_input_bundle_ref,
        snapshot.validated_need_ref,
      ]));
    }
    if (uncoveredRechecks.length > 0) {
      blockers.push(this.blocker(
        'OPEN_HIGH_PRIORITY_RECHECK',
        'Open SearchPlan recheck must be resolved or covered by active accepted risk before slice planning.',
        uncoveredRechecks.map((request) =>
          this.ref('search_plan_recheck_request', request.search_plan_recheck_request_id, request.title_card_id)
        ),
      ));
    }
    if (parkReason) {
      blockers.push(this.blocker(
        'INTAKE_PARKED',
        'v1b intake is explicitly parked before ResearchSlice planning.',
        [snapshot.v1b_input_bundle_ref],
      ));
    }
    if (missingConstraintCodes.length > 0) {
      blockers.push(this.blocker(
        'RESEARCH_CONSTRAINT_PROFILE_INCOMPLETE',
        'ResearchConstraintProfile is missing fields required to bound ResearchSlice planning.',
        [snapshot.validated_need_ref],
      ));
    }
    return blockers;
  }

  private readinessRecommendation(
    traceStatus: TopicSelectionV1bIntakeSnapshotRecord['trace_status'],
    staleRefCodes: string[],
    uncoveredRechecks: TopicSelectionSearchPlanRecheckRequestRecord[],
    missingConstraintCodes: string[],
    parkReason: string | null,
  ): TopicSelectionV1bIntakeReadinessRecommendation {
    if (traceStatus !== 'passed' || staleRefCodes.length > 0) {
      return 'blocked_by_stale_trace';
    }
    if (uncoveredRechecks.length > 0) {
      return 'blocked_by_recheck';
    }
    if (parkReason) {
      return 'park';
    }
    if (missingConstraintCodes.length > 0) {
      return 'needs_constraint_clarification';
    }
    return 'ready_for_slice';
  }

  private async resolveTraceRefs(traceRefs: TopicSelectionFunctionalRef[]): Promise<TraceRefResolution> {
    const invalid: TopicSelectionFunctionalRef[] = [];
    const missing: TopicSelectionFunctionalRef[] = [];
    const snapshots: TopicSelectionTraceSnapshotRecord[] = [];
    for (const traceRef of traceRefs) {
      if (traceRef.ref_type !== 'trace_snapshot') {
        invalid.push(traceRef);
        continue;
      }
      const traceSnapshot = await this.controlPlane.getTraceSnapshot(traceRef.ref_id);
      if (!traceSnapshot) {
        missing.push(traceRef);
        continue;
      }
      snapshots.push(traceSnapshot);
    }
    return {
      invalid_trace_refs: invalid,
      missing_trace_refs: missing,
      trace_snapshots: snapshots,
    };
  }

  private profileParkReason(profile: TopicSelectionResearchConstraintProfileRecord): string | null {
    const disposition = profile.constraint_payload.v1b_intake_disposition;
    if (disposition === 'park') {
      return typeof profile.constraint_payload.park_reason === 'string'
        ? profile.constraint_payload.park_reason
        : 'ResearchConstraintProfile requested park.';
    }
    return null;
  }

  private async requireSnapshot(intakeSnapshotId: string): Promise<TopicSelectionV1bIntakeSnapshotRecord> {
    const snapshot = await this.repository.findIntakeSnapshotById(intakeSnapshotId);
    if (!snapshot) {
      throw new AppError(404, 'NOT_FOUND', `V1bIntakeSnapshot ${intakeSnapshotId} not found.`);
    }
    return snapshot;
  }

  private async requireProfile(profileId: string): Promise<TopicSelectionResearchConstraintProfileRecord> {
    const profile = await this.repository.findResearchConstraintProfileById(profileId);
    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', `ResearchConstraintProfile ${profileId} not found.`);
    }
    return profile;
  }

  private pushRefMismatchIssue(
    issues: TopicSelectionGateIssue[],
    code: string,
    actual: TopicSelectionFunctionalRef,
    expected: TopicSelectionFunctionalRef,
  ): void {
    if (!this.refsEqual(actual, expected)) {
      issues.push(this.blocker(code, `${code} blocks v1b intake readiness.`, [actual, expected]));
    }
  }

  private isHumanDecisionRef(ref: TopicSelectionFunctionalRef): boolean {
    return ref.ref_type === 'human_confirmed_decision' || ref.ref_type === 'human_decision';
  }

  private isHumanActor(actorType: string): boolean {
    return actorType === 'human' || actorType === 'hybrid';
  }

  private snapshotRef(snapshot: TopicSelectionV1bIntakeSnapshotRecord): TopicSelectionFunctionalRef {
    return this.ref(
      'v1b_intake_snapshot',
      snapshot.v1b_intake_snapshot_id,
      snapshot.title_card_id,
      snapshot.snapshot_version,
    );
  }

  private profileRef(profile: TopicSelectionResearchConstraintProfileRecord): TopicSelectionFunctionalRef {
    return this.ref(
      'research_constraint_profile',
      profile.research_constraint_profile_id,
      profile.title_card_id,
      profile.profile_version,
    );
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

  private blocker(
    code: string,
    message: string,
    refs?: TopicSelectionFunctionalRef[],
  ): TopicSelectionGateIssue {
    return {
      code,
      message,
      severity: 'blocking',
      refs,
    };
  }

  private warning(
    code: string,
    message: string,
    refs?: TopicSelectionFunctionalRef[],
  ): TopicSelectionGateIssue {
    return {
      code,
      message,
      severity: 'warning',
      refs,
    };
  }

  private refsEqual(left: TopicSelectionFunctionalRef, right: TopicSelectionFunctionalRef): boolean {
    return left.ref_type === right.ref_type
      && left.ref_id === right.ref_id
      && (left.version_id ?? null) === (right.version_id ?? null)
      && (left.title_card_id ?? null) === (right.title_card_id ?? null);
  }

  private uniqueRefs(refs: Array<TopicSelectionFunctionalRef | null | undefined>): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const result: TopicSelectionFunctionalRef[] = [];
    for (const ref of refs) {
      if (!ref) {
        continue;
      }
      const key = [
        ref.ref_type,
        ref.ref_id,
        ref.version_id ?? '',
        ref.title_card_id ?? '',
      ].join(':');
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(ref);
    }
    return result;
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values)];
  }

  private versionFromId(id: string): string {
    return `v_${id.split('_').at(-1) ?? '1'}`;
  }
}
