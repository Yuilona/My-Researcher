import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  TopicSelectionActorRef,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionEvidenceMapRecord,
  TopicSelectionEvidenceRoleBundle,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-evidence-map-contracts';
import type {
  TopicSelectionNeedCandidateRecord,
  TopicSelectionV1aToV1bInputBundleRecord,
  TopicSelectionValidateNeedAdjudicationResultRecord,
  TopicSelectionValidatedNeedRecord,
  TopicSelectionValidationDecisionSupportPacketRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import type {
  TopicSelectionAcceptedRiskRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-recheck-risk-memory-contracts';
import type {
  TopicSelectionLiteratureResourcePoolSnapshotRecord,
  TopicSelectionSearchPlanRecord,
  TopicSelectionSearchPlanRecheckRequestRecord,
  TopicSelectionSearchRunRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-search-resource-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionEvidenceMapRepository } from '../repositories/in-memory-topic-selection-evidence-map-repository.js';
import { InMemoryTopicSelectionNeedValidationRepository } from '../repositories/in-memory-topic-selection-need-validation-repository.js';
import { InMemoryTopicSelectionRecheckRiskMemoryRepository } from '../repositories/in-memory-topic-selection-recheck-risk-memory-repository.js';
import { InMemoryTopicSelectionSearchResourceRepository } from '../repositories/in-memory-topic-selection-search-resource-repository.js';
import { InMemoryTopicSelectionV1bIntakeRepository } from '../repositories/in-memory-topic-selection-v1b-intake-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionV1bIntakeService } from './topic-selection-v1b-intake-service.js';

const NOW = '2026-05-14T00:00:00.000Z';

function ref(
  refType: string,
  refId: string,
  titleCardId = 'title_card_v1b',
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
    title_card_id: titleCardId,
  };
}

function makeContext() {
  let sequence = 0;
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const now = () => NOW;
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, { idFactory, now });
  const searchRepository = new InMemoryTopicSelectionSearchResourceRepository();
  const evidenceRepository = new InMemoryTopicSelectionEvidenceMapRepository();
  const needRepository = new InMemoryTopicSelectionNeedValidationRepository();
  const recheckRepository = new InMemoryTopicSelectionRecheckRiskMemoryRepository();
  const v1bRepository = new InMemoryTopicSelectionV1bIntakeRepository();
  const service = new TopicSelectionV1bIntakeService(
    v1bRepository,
    controlPlane,
    needRepository,
    evidenceRepository,
    searchRepository,
    recheckRepository,
    { idFactory, now },
  );

  return {
    controlPlane,
    controlPlaneRepository,
    evidenceRepository,
    needRepository,
    recheckRepository,
    searchRepository,
    service,
    v1bRepository,
  };
}

async function seedV1aBundle(options: {
  openRecheck?: boolean;
  acceptedRiskCoversRecheck?: boolean;
  acceptedRiskExpiresAt?: string | null;
  omitHumanDecision?: boolean;
  omitTraceSnapshot?: boolean;
  mismatchHumanDecisionRef?: boolean;
} = {}) {
  const ctx = makeContext();
  const titleCardId = 'title_card_v1b';
  const actor: TopicSelectionActorRef = { actor_type: 'human', actor_id: 'reviewer_1' };
  const evidenceMapRef = ref('evidence_map', 'evidence_map_1', titleCardId, 'v1');
  const searchRunRef = ref('search_run', 'search_run_1', titleCardId);
  const searchPlanRef = ref('search_plan', 'search_plan_1', titleCardId, 'v1');
  const literatureSnapshotRef = ref('literature_resource_pool_snapshot', 'literature_snapshot_1', titleCardId, 'v1');
  const supportUnitRef = ref('evidence_unit', 'evidence_unit_support_1', titleCardId);
  const roleBundle: TopicSelectionEvidenceRoleBundle = {
    support_unit_refs: [supportUnitRef],
    challenge_unit_refs: [],
    baseline_unit_refs: [ref('evidence_unit', 'evidence_unit_baseline_1', titleCardId)],
    context_unit_refs: [],
  };
  const humanDecisionRef = ref('human_confirmed_decision', 'human_decision_1', titleCardId);
  const validatedNeedRef = ref('validated_need', 'validated_need_1', titleCardId);
  const sourceCandidateRef = ref('need_candidate', 'need_candidate_1', titleCardId, 'v1');
  const supportPacketRef = ref('validation_decision_support_packet', 'support_packet_1', titleCardId);
  const adjudicationRef = ref('validate_need_adjudication_result', 'adjudication_1', titleCardId);
  const traceRef = ref('trace_snapshot', 'trace_1', titleCardId);
  const recheckRef = ref('search_plan_recheck_request', 'search_recheck_1', titleCardId);
  if (!options.omitTraceSnapshot) {
    await ctx.controlPlaneRepository.createTraceSnapshot({
      trace_snapshot_id: traceRef.ref_id,
      workspace_id: null,
      title_card_id: titleCardId,
      target_ref: validatedNeedRef,
      snapshot_hash: 'trace_hash_1',
      object_refs: [validatedNeedRef, sourceCandidateRef, supportPacketRef, adjudicationRef],
      lineage_link_refs: [],
      artifact_refs: [],
      quality_signal_refs: [],
      transition_attempt_refs: [],
      payload: {
        stage: 'v1a',
      },
      created_by: 'system',
      created_at: NOW,
    });
  }

  await ctx.searchRepository.createLiteratureResourcePoolSnapshot({
    literature_resource_pool_snapshot_id: literatureSnapshotRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    snapshot_version: 'v1',
    source_scope: 'title_card_evidence_basket',
    topic_seed_ref: ref('topic_seed', 'topic_seed_1', titleCardId),
    literature_refs: [ref('literature_record', 'lit_1', titleCardId)],
    content_source_refs: [],
    source_health_summary: {
      total_literature_count: 1,
      missing_literature_ids: [],
      rights_class_counts: {},
      pipeline_ready_count: 1,
      abstract_ready_count: 1,
      key_content_ready_count: 1,
      fulltext_ready_count: 1,
      source_count: 1,
      stale_count: 0,
      blocked_count: 0,
      warning_codes: [],
    },
    snapshot_hash: 'snapshot_hash_1',
    created_by: 'system',
    created_at: NOW,
  } satisfies TopicSelectionLiteratureResourcePoolSnapshotRecord);
  await ctx.searchRepository.createSearchPlanWithCoverageIntents({
    search_plan_id: searchPlanRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    plan_version: 'v1',
    status: 'ready',
    topic_seed_ref: ref('topic_seed', 'topic_seed_1', titleCardId),
    literature_snapshot_ref: literatureSnapshotRef,
    query_intents: ['reviewer traceability'],
    must_check_constraints: [],
    exclusion_rules: [],
    coverage_strategy: {},
    artifact_refs: [],
    created_by: 'system',
    created_at: NOW,
  } satisfies TopicSelectionSearchPlanRecord, []);
  await ctx.searchRepository.createSearchRunWithCoverageRecords({
    search_run_id: searchRunRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    search_plan_ref: searchPlanRef,
    literature_snapshot_ref: literatureSnapshotRef,
    run_kind: 'planned_search',
    run_status: 'succeeded',
    query_provenance: [],
    result_accounting: {
      total_result_count: 1,
      unique_literature_count: 1,
      duplicate_result_count: 0,
      failed_source_count: 0,
      skipped_source_count: 0,
    },
    source_health_summary: {},
    dedup_summary: {},
    evidence_map_input_refs: [ref('literature_record', 'lit_1', titleCardId)],
    artifact_refs: [],
    started_at: NOW,
    finished_at: NOW,
    created_by: 'system',
    created_at: NOW,
  } satisfies TopicSelectionSearchRunRecord, {
    observations: [],
    evidence_bindings: [],
    assessments: [],
    risk_acceptances: [],
  });
  await ctx.evidenceRepository.createEvidenceMapWithRecords({
    evidence_map: {
      evidence_map_id: evidenceMapRef.ref_id,
      workspace_id: null,
      title_card_id: titleCardId,
      evidence_map_version: 'v1',
      status: 'ready',
      review_status: 'machine_checked',
      freshness_status: 'current',
      search_run_ref: searchRunRef,
      search_plan_ref: searchPlanRef,
      literature_snapshot_ref: literatureSnapshotRef,
      unit_count: 1,
      support_unit_count: 1,
      challenge_unit_count: 0,
      baseline_unit_count: 1,
      context_unit_count: 0,
      digest_payload: {},
      stale_reason_codes: [],
      artifact_refs: [],
      created_by: 'system',
      created_at: NOW,
    } satisfies TopicSelectionEvidenceMapRecord,
    evidence_units: [],
    typed_links: [],
    clusters: [],
    patterns: [],
    conflict_sets: [],
  });

  const candidate: TopicSelectionNeedCandidateRecord = {
    need_candidate_id: sourceCandidateRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    evidence_map_id: evidenceMapRef.ref_id,
    candidate_version: 'v1',
    lifecycle_status: 'closed',
    decision_status: 'resulted_in_validated_need',
    review_status: 'human_confirmed',
    freshness_status: 'current',
    candidate_need: 'Evidence-to-need traceability is hard to audit.',
    unmet_need_statement: 'Reviewer-aligned topic selection needs stronger evidence-to-need traceability.',
    mechanism_type: 'workflow_gap',
    mechanism_summary: 'Traceability is brittle.',
    mechanism_payload: {},
    scope_notes: 'CS paper engineering assistants.',
    non_goal_notes: 'Do not solve final paper planning.',
    prior_art_status: 'no_strong_solution_found',
    evidence_map_ref: evidenceMapRef,
    search_run_ref: searchRunRef,
    search_plan_ref: searchPlanRef,
    literature_snapshot_ref: literatureSnapshotRef,
    evidence_role_bundle: roleBundle,
    conflict_refs: [],
    strength_assessment_refs: [],
    open_recheck_request_refs: options.openRecheck ? [recheckRef] : [],
    unresolved_challenge_refs: [],
    accepted_risk_refs: [],
    gap_codes: [],
    speculative: false,
    confidence: 0.8,
    artifact_refs: [],
    result_adjudication_id: 'adjudication_1',
    result_validated_need_id: 'validated_need_1',
    merged_into_need_candidate_ref: null,
    created_by: 'system',
    created_at: NOW,
    updated_at: NOW,
  };
  await ctx.needRepository.createNeedCandidate(candidate);

  const supportPacket: TopicSelectionValidationDecisionSupportPacketRecord = {
    validation_support_packet_id: supportPacketRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    need_candidate_id: sourceCandidateRef.ref_id,
    evidence_map_id: evidenceMapRef.ref_id,
    readiness_assessment_id: null,
    packet_status: 'ready',
    evidence_map_ref: evidenceMapRef,
    search_run_ref: searchRunRef,
    search_plan_ref: searchPlanRef,
    literature_snapshot_ref: literatureSnapshotRef,
    need_candidate_ref: sourceCandidateRef,
    readiness_assessment_ref: null,
    evidence_role_bundle: roleBundle,
    conflict_refs: [],
    strength_assessment_refs: [],
    coverage_refs: [searchPlanRef, searchRunRef, literatureSnapshotRef],
    residual_risk_refs: [],
    open_gap_codes: [],
    required_human_checks: ['confirm_unmet_need'],
    prior_art_status: 'no_strong_solution_found',
    already_solved_review: {},
    packet_payload: {},
    artifact_refs: [],
    created_by: 'system',
    created_at: NOW,
  };
  await ctx.needRepository.createValidationDecisionSupportPacket(supportPacket);

  let riskRef: TopicSelectionFunctionalRef | null = null;
  if (options.acceptedRiskCoversRecheck) {
    riskRef = ref('accepted_risk', 'accepted_risk_1', titleCardId);
    await ctx.recheckRepository.createAcceptedRisk({
      accepted_risk_id: riskRef.ref_id,
      workspace_id: null,
      title_card_id: titleCardId,
      risk_type: 'open_recheck_accepted_for_v1b_intake',
      source_type: 'manual',
      source_ref: recheckRef,
      target_ref: validatedNeedRef,
      scope_refs: [recheckRef, searchPlanRef],
      affected_object_refs: [validatedNeedRef],
      severity: 'blocking',
      status: 'active',
      rationale: 'Reviewer accepts this recheck as bounded for slice planning.',
      accepted_by: actor,
      recheck_condition: 'new counter evidence appears',
      expires_at: options.acceptedRiskExpiresAt ?? null,
      created_at: NOW,
      updated_at: NOW,
    } satisfies TopicSelectionAcceptedRiskRecord);
  }
  if (options.openRecheck) {
    await ctx.searchRepository.createSearchPlanRecheckRequest({
      search_plan_recheck_request_id: recheckRef.ref_id,
      workspace_id: null,
      title_card_id: titleCardId,
      source_ref: sourceCandidateRef,
      target_search_plan_ref: searchPlanRef,
      target_literature_snapshot_ref: literatureSnapshotRef,
      reason: 'Counter evidence should be rechecked.',
      gap_codes: ['COUNTER_EVIDENCE_COVERAGE_GAP'],
      requested_by: 'human',
      status: 'open',
      decision_summary: null,
      accepted_risk_refs: riskRef ? [riskRef] : [],
      resulting_search_plan_ref: null,
      resulting_search_run_ref: null,
      created_at: NOW,
      resolved_at: null,
    } satisfies TopicSelectionSearchPlanRecheckRequestRecord);
  }

  const adjudication: TopicSelectionValidateNeedAdjudicationResultRecord = {
    adjudication_result_id: adjudicationRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    need_candidate_id: sourceCandidateRef.ref_id,
    support_packet_id: supportPacketRef.ref_id,
    final_decision: 'validate',
    output_validated_need_id: validatedNeedRef.ref_id,
    human_decision_id: humanDecisionRef.ref_id,
    loopback_target: 'none',
    rejected_reason: null,
    merge_target_need_candidate_ref: null,
    output_searchplan_recheck_request_ref: null,
    output_memory_suggestion_ref: null,
    rationale: 'Human confirmed the need.',
    required_actions: [],
    accepted_risk_refs: riskRef ? [riskRef] : [],
    residual_risk_refs: [],
    gap_codes: [],
    decision_payload: {},
    artifact_refs: [],
    adjudicated_by: actor,
    created_at: NOW,
  };
  if (!options.omitHumanDecision) {
    await ctx.controlPlane.recordHumanDecision({
      title_card_id: titleCardId,
      target_ref: validatedNeedRef,
      decision_type: 'confirm',
      actor,
      rationale: 'Human confirmed the validated need.',
      resulting_authority_refs: [validatedNeedRef],
    });
  }
  const validatedNeed: TopicSelectionValidatedNeedRecord = {
    validated_need_id: validatedNeedRef.ref_id,
    workspace_id: null,
    title_card_id: titleCardId,
    source_need_candidate_id: sourceCandidateRef.ref_id,
    adjudication_result_id: adjudicationRef.ref_id,
    support_packet_id: supportPacketRef.ref_id,
    human_decision_id: humanDecisionRef.ref_id,
    validated_need_statement: 'Reviewer-aligned topic selection needs stronger evidence-to-need traceability.',
    mechanism_type: 'workflow_gap',
    mechanism_summary: 'Traceability is brittle.',
    mechanism_payload: {},
    scope_notes: 'CS paper engineering assistants.',
    non_goal_notes: 'Do not solve final paper planning.',
    prior_art_status: 'no_strong_solution_found',
    evidence_map_ref: evidenceMapRef,
    search_run_ref: searchRunRef,
    search_plan_ref: searchPlanRef,
    literature_snapshot_ref: literatureSnapshotRef,
    support_packet_ref: supportPacketRef,
    adjudication_result_ref: adjudicationRef,
    human_decision_ref: humanDecisionRef,
    evidence_role_bundle: roleBundle,
    strength_assessment_refs: [],
    conflict_refs: [],
    residual_risk_refs: [],
    accepted_risk_refs: riskRef ? [riskRef] : [],
    trace_refs: [traceRef],
    created_by: 'human',
    created_at: NOW,
  };
  const bundle: TopicSelectionV1aToV1bInputBundleRecord = {
    v1b_input_bundle_id: 'v1b_input_bundle_1',
    workspace_id: null,
    title_card_id: titleCardId,
    validated_need_id: validatedNeedRef.ref_id,
    source_need_candidate_id: sourceCandidateRef.ref_id,
    adjudication_result_id: adjudicationRef.ref_id,
    support_packet_id: supportPacketRef.ref_id,
    bundle_version: 'v1',
    validated_need_ref: validatedNeedRef,
    source_need_candidate_ref: sourceCandidateRef,
    adjudication_result_ref: adjudicationRef,
    support_packet_ref: supportPacketRef,
    human_decision_ref: options.mismatchHumanDecisionRef
      ? ref('human_confirmed_decision', 'human_decision_other', titleCardId)
      : humanDecisionRef,
    evidence_map_ref: evidenceMapRef,
    search_run_ref: searchRunRef,
    search_plan_ref: searchPlanRef,
    literature_snapshot_ref: literatureSnapshotRef,
    evidence_role_bundle: roleBundle,
    trace_refs: [traceRef],
    risk_refs: riskRef ? [riskRef] : [],
    gap_codes: [],
    memory_suggestion_refs: [],
    recheck_request_refs: options.openRecheck ? [recheckRef] : [],
    handoff_payload: {
      validated_need_statement: validatedNeed.validated_need_statement,
    },
    created_by: 'system',
    created_at: NOW,
  };

  await ctx.needRepository.adjudicateWithSideEffects({
    adjudication_result: adjudication,
    candidate_patch: {
      lifecycle_status: 'closed',
      decision_status: 'resulted_in_validated_need',
      review_status: 'human_confirmed',
      freshness_status: 'current',
      result_adjudication_id: adjudication.adjudication_result_id,
      result_validated_need_id: validatedNeed.validated_need_id,
      updated_at: NOW,
    },
    validated_need: validatedNeed,
    v1b_input_bundle: bundle,
  });

  return { ...ctx, bundle, evidenceMapRef, riskRef, searchPlanRef, titleCardId, validatedNeedRef };
}

async function createReadyIntake() {
  const ctx = await seedV1aBundle();
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS paper engineering researchers',
    method_constraints: ['local-first workflow instrumentation'],
    resource_constraints: [],
    non_goals: ['promotion decision', 'paper project bridge'],
    claim_ceiling: 'A bounded workflow claim about evidence-to-need traceability.',
    created_by: 'human',
  });
  return { ...ctx, profile, snapshot };
}

test('valid v1a bundle creates ready intake handoff for ResearchSlice planning', async () => {
  const ctx = await createReadyIntake();
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: ctx.snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: ctx.profile.research_constraint_profile_id,
  });
  const handoff = await ctx.service.buildResearchSlicePlanningInput({
    readiness_assessment_id: readiness.v1b_intake_readiness_assessment_id,
  });

  assert.equal(ctx.snapshot.trace_status, 'passed');
  assert.equal(readiness.recommendation, 'ready_for_slice');
  assert.equal(readiness.blockers.length, 0);
  assert.equal(handoff.target_community, 'CS paper engineering researchers');
  assert.equal(handoff.validated_need_ref.ref_id, ctx.validatedNeedRef.ref_id);
});

test('missing constraints produce needs_constraint_clarification and block planning', async () => {
  const ctx = await seedV1aBundle();
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    created_by: 'human',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'needs_constraint_clarification');
  assert.ok(readiness.missing_constraint_codes.includes('TARGET_COMMUNITY_REQUIRED'));
  await assert.rejects(
    () => ctx.service.buildResearchSlicePlanningInput({
      readiness_assessment_id: readiness.v1b_intake_readiness_assessment_id,
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 409
      && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('open recheck blocks v1b intake readiness without accepted risk coverage', async () => {
  const ctx = await seedV1aBundle({ openRecheck: true });
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS systems researchers',
    method_constraints: ['deterministic replay'],
    non_goals: ['promotion'],
    claim_ceiling: 'A bounded evidence workflow claim.',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'blocked_by_recheck');
  assert.equal(readiness.uncovered_recheck_request_refs.length, 1);
  assert.ok(readiness.blockers.some((blocker) => blocker.code === 'OPEN_HIGH_PRIORITY_RECHECK'));
});

test('open recheck covered by active accepted risk can proceed to ready_for_slice', async () => {
  const ctx = await seedV1aBundle({ openRecheck: true, acceptedRiskCoversRecheck: true });
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS systems researchers',
    method_constraints: ['deterministic replay'],
    non_goals: ['promotion'],
    claim_ceiling: 'A bounded evidence workflow claim.',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'ready_for_slice');
  assert.equal(readiness.uncovered_recheck_request_refs.length, 0);
  assert.equal(readiness.accepted_risk_refs[0]?.ref_id, ctx.riskRef?.ref_id);
});

test('expired accepted risk does not cover an open recheck', async () => {
  const ctx = await seedV1aBundle({
    openRecheck: true,
    acceptedRiskCoversRecheck: true,
    acceptedRiskExpiresAt: '2026-05-13T23:59:59.000Z',
  });
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS systems researchers',
    method_constraints: ['deterministic replay'],
    non_goals: ['promotion'],
    claim_ceiling: 'A bounded evidence workflow claim.',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'blocked_by_recheck');
  assert.equal(readiness.accepted_risk_refs.length, 0);
  assert.equal(readiness.uncovered_recheck_request_refs.length, 1);
});

test('mismatched upstream refs block as stale trace before slice planning', async () => {
  const ctx = await seedV1aBundle({ mismatchHumanDecisionRef: true });
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS systems researchers',
    method_constraints: ['deterministic replay'],
    non_goals: ['promotion'],
    claim_ceiling: 'A bounded evidence workflow claim.',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(snapshot.trace_status, 'mismatched');
  assert.equal(readiness.recommendation, 'blocked_by_stale_trace');
  assert.ok(readiness.stale_ref_codes.includes('HUMAN_DECISION_REF_MISMATCH'));
});

test('missing human decision record blocks v1b intake as stale trace', async () => {
  const ctx = await seedV1aBundle({ omitHumanDecision: true });
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS systems researchers',
    method_constraints: ['deterministic replay'],
    non_goals: ['promotion'],
    claim_ceiling: 'A bounded evidence workflow claim.',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'blocked_by_stale_trace');
  assert.ok(readiness.stale_ref_codes.includes('HUMAN_DECISION_NOT_FOUND'));
});

test('missing inherited trace snapshot blocks v1b intake as stale trace', async () => {
  const ctx = await seedV1aBundle({ omitTraceSnapshot: true });
  const snapshot = await ctx.service.createV1bIntakeSnapshot({
    v1b_input_bundle_id: ctx.bundle.v1b_input_bundle_id,
  });
  const profile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    target_community: 'CS systems researchers',
    method_constraints: ['deterministic replay'],
    non_goals: ['promotion'],
    claim_ceiling: 'A bounded evidence workflow claim.',
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: profile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'blocked_by_stale_trace');
  assert.ok(readiness.stale_ref_codes.includes('TRACE_REF_NOT_FOUND'));
});

test('parked constraint profile produces park and blocks planning', async () => {
  const ctx = await createReadyIntake();
  const parkedProfile = await ctx.service.createOrUpdateResearchConstraintProfile({
    v1b_intake_snapshot_id: ctx.snapshot.v1b_intake_snapshot_id,
    previous_profile_id: ctx.profile.research_constraint_profile_id,
    target_community: ctx.profile.target_community,
    method_constraints: ctx.profile.method_constraints,
    non_goals: ctx.profile.non_goals,
    claim_ceiling: ctx.profile.claim_ceiling,
    constraint_payload: {
      v1b_intake_disposition: 'park',
      park_reason: 'Human wants to defer slice planning.',
    },
  });
  const readiness = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: ctx.snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: parkedProfile.research_constraint_profile_id,
  });

  assert.equal(readiness.recommendation, 'park');
  assert.ok(readiness.blockers.some((blocker) => blocker.code === 'INTAKE_PARKED'));
  await assert.rejects(
    () => ctx.service.buildResearchSlicePlanningInput({
      readiness_assessment_id: readiness.v1b_intake_readiness_assessment_id,
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 409
      && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('readiness is idempotent for the same intake snapshot and profile version', async () => {
  const ctx = await createReadyIntake();
  const first = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: ctx.snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: ctx.profile.research_constraint_profile_id,
  });
  const second = await ctx.service.assessV1bIntakeReadiness({
    v1b_intake_snapshot_id: ctx.snapshot.v1b_intake_snapshot_id,
    research_constraint_profile_id: ctx.profile.research_constraint_profile_id,
  });

  assert.equal(second.v1b_intake_readiness_assessment_id, first.v1b_intake_readiness_assessment_id);
  assert.equal(second.created_at, first.created_at);
});
