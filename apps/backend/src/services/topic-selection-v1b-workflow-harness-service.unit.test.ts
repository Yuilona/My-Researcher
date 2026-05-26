import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_IDS,
  TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_POLICIES,
  TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS,
  TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION,
  type TopicSelectionV1bAcceptedConstraintProfilePayload,
  type TopicSelectionV1bAcceptedSliceSelectionPayload,
  type TopicSelectionV1bN1HarnessFrozenInputPayload,
  type TopicSelectionV1bN2HarnessFrozenInputPayload,
  type TopicSelectionV1bN3HarnessFrozenInputPayload,
  type TopicSelectionV1bN4HarnessFrozenInputPayload,
  type TopicSelectionV1bN5HarnessFrozenInputPayload,
  type TopicSelectionV1bN6HarnessFrozenInputPayload,
  type TopicSelectionV1bN7HarnessFrozenInputPayload,
  type TopicSelectionV1bCandidateGroupingSupportPayload,
  type TopicSelectionV1bN8DebateAdmissionReviewSupportPayload,
  type TopicSelectionV1bN8FailedTrialSynthesisSupportPayload,
  type TopicSelectionV1bN8HarnessFrozenInputPayload,
  type TopicSelectionV1bN8ToN7FeedbackPayload,
  type TopicSelectionV1bN9HarnessFrozenInputPayload,
  type TopicSelectionV1bN10HarnessFrozenInputPayload,
  type TopicSelectionV1bN11HarnessFrozenInputPayload,
  type TopicSelectionV1bResearchSliceOptionSetDraftPayload,
  type TopicSelectionV1bTopicQuestionCandidateSetDraftPayload,
  type TopicSelectionV1bTopicValueAssessmentDraftPayload,
  type TopicSelectionV1bWorkflowHarnessNodePolicy,
  type TopicSelectionV1bWorkflowHarnessNodeId,
  type TopicSelectionV1bWorkflowHarnessHandoff,
  type TopicSelectionV1bWorkflowHarnessRunRequest,
  type TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-workflow-harness-contracts';
import type {
  TopicSelectionResearchSliceOptionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
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
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionEvidenceMapRepository } from '../repositories/in-memory-topic-selection-evidence-map-repository.js';
import { InMemoryTopicSelectionNeedValidationRepository } from '../repositories/in-memory-topic-selection-need-validation-repository.js';
import { InMemoryTopicSelectionRecheckRiskMemoryRepository } from '../repositories/in-memory-topic-selection-recheck-risk-memory-repository.js';
import { InMemoryTopicSelectionSearchResourceRepository } from '../repositories/in-memory-topic-selection-search-resource-repository.js';
import { InMemoryTopicSelectionV1bIntakeRepository } from '../repositories/in-memory-topic-selection-v1b-intake-repository.js';
import { InMemoryTopicSelectionV1bResearchSliceRepository } from '../repositories/in-memory-topic-selection-v1b-research-slice-repository.js';
import { InMemoryTopicSelectionV1bTopicQuestionRepository } from '../repositories/in-memory-topic-selection-v1b-topic-question-repository.js';
import { InMemoryTopicSelectionV1bValueAssessmentRepository } from '../repositories/in-memory-topic-selection-v1b-value-assessment-repository.js';
import { InMemoryTopicSelectionV1bTopicPackageRepository } from '../repositories/in-memory-topic-selection-v1b-topic-package-repository.js';
import { AppError } from '../errors/app-error.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionV1bWorkflowHarnessService } from './topic-selection-v1b-workflow-harness-service.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';

const NOW = '2026-05-26T00:00:00.000Z';
const TITLE_CARD_ID = 'title_card_v1b_harness';

function makeContext(options: { withRunnerDependencies?: boolean } = {}) {
  let sequence = 0;
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const evidenceRepository = new InMemoryTopicSelectionEvidenceMapRepository();
  const needRepository = new InMemoryTopicSelectionNeedValidationRepository();
  const recheckRepository = new InMemoryTopicSelectionRecheckRiskMemoryRepository();
  const searchRepository = new InMemoryTopicSelectionSearchResourceRepository();
  const v1bRepository = new InMemoryTopicSelectionV1bIntakeRepository();
  const researchSliceRepository = new InMemoryTopicSelectionV1bResearchSliceRepository();
  const topicQuestionRepository = new InMemoryTopicSelectionV1bTopicQuestionRepository();
  const valueAssessmentRepository = new InMemoryTopicSelectionV1bValueAssessmentRepository();
  const topicPackageRepository = new InMemoryTopicSelectionV1bTopicPackageRepository(valueAssessmentRepository);
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, {
    idFactory,
    now: () => NOW,
  });
  const service = new TopicSelectionV1bWorkflowHarnessService(controlPlane, {
    idFactory,
    now: () => NOW,
    runnerDependencies: options.withRunnerDependencies
      ? {
        evidenceMapRepository: evidenceRepository,
        needValidationRepository: needRepository,
        recheckRiskMemoryRepository: recheckRepository,
        researchSliceRepository,
        searchResourceRepository: searchRepository,
        topicQuestionRepository,
        topicPackageRepository,
        valueAssessmentRepository,
        v1bIntakeRepository: v1bRepository,
      }
      : undefined,
  });

  return {
    controlPlane,
    controlPlaneRepository,
    evidenceRepository,
    needRepository,
    recheckRepository,
    researchSliceRepository,
    searchRepository,
    service,
    topicQuestionRepository,
    topicPackageRepository,
    valueAssessmentRepository,
    v1bRepository,
  };
}

function ref(
  refType: string,
  refId: string,
  titleCardId: string | null = TITLE_CARD_ID,
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: titleCardId,
    version_id: versionId,
  };
}

function frozenInputHash(payload: TopicSelectionV1bWorkflowHarnessRunRequest['frozen_input']): string {
  return sha256Text(stableStringify({
    input_contract: payload.input_contract,
    payload: payload.payload,
    snapshot_kind: payload.snapshot_kind,
    source_refs: payload.source_refs,
  }));
}

function policyForNode(nodeId: TopicSelectionV1bWorkflowHarnessNodeId): TopicSelectionV1bWorkflowHarnessNodePolicy {
  const policy = TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_POLICIES.find((item) => item.node_id === nodeId);
  if (!policy) {
    throw new Error(`Unknown test node policy: ${nodeId}.`);
  }
  return policy;
}

function slotSpecForNode(nodeId: TopicSelectionV1bWorkflowHarnessNodeId): Pick<
  TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef,
  'slot_id' | 'allowed_effect' | 'output_contract' | 'execution_mode' | 'profile_id'
> {
  const policy = policyForNode(nodeId);
  const slot = policy.semantic_support_slots.find((item) => item.required_for_progress)
    ?? policy.semantic_support_slots[0];
  if (!slot) {
    throw new Error(`No semantic slot fixture for ${nodeId}.`);
  }
  return {
    slot_id: slot.slot_id,
    allowed_effect: slot.allowed_effect,
    output_contract: slot.output_contract,
    execution_mode: slot.allowed_execution_modes.includes('codex_assisted') ? 'codex_assisted' : slot.allowed_execution_modes[0]!,
    profile_id: slot.default_profile_id,
  };
}

function requiredSlotForNode(
  nodeId: TopicSelectionV1bWorkflowHarnessNodeId,
) {
  const policy = policyForNode(nodeId);
  return policy.semantic_support_slots.find((slot) => (
    slot.required_for_progress && slot.allowed_effect === 'model_draft_for_gate'
  )) ?? policy.semantic_support_slots[0] ?? null;
}

function providerModelOptionId(nodeId: TopicSelectionV1bWorkflowHarnessNodeId): string {
  const slot = requiredSlotForNode(nodeId);
  if (!slot) {
    throw new Error(`No provider slot fixture for ${nodeId}.`);
  }
  return `${slot.default_profile_id}.openai-balanced`;
}

function semanticArtifact(
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  overrides: Partial<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> = {},
): TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef {
  const slot = slotSpecForNode(input.node_id);
  return {
    ...slot,
    node_id: input.node_id,
    run_mode: input.run_mode ?? 'acceptance',
    support_artifact_ref: ref('artifact_ref', `${input.node_attempt_id}_support`),
    support_artifact_hash: 'a'.repeat(64),
    normalized_output_ref: ref('artifact_ref', `${input.node_attempt_id}_normalized`),
    normalized_output_hash: 'b'.repeat(64),
    profile_id: slot.profile_id,
    model_option_id: null,
    input_hash: input.frozen_input.frozen_input_hash!,
    prompt_packet_hash: 'c'.repeat(64),
    structured_output_hash: 'd'.repeat(64),
    adapter_policy_version: 'topic-selection-v1b-node-policy-v1',
    slot_spec_hash: 'e'.repeat(64),
    provenance_ref: ref('artifact_ref', `${input.node_attempt_id}_provenance`),
    ...overrides,
  };
}

function request(
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): TopicSelectionV1bWorkflowHarnessRunRequest {
  const nodeId = overrides.node_id ?? 'topic-selection.v1b.generate-research-slice-options.v1';
  const policy = policyForNode(nodeId);
  const frozenInput: TopicSelectionV1bWorkflowHarnessRunRequest['frozen_input'] = {
    input_contract: policy.input_contract,
    snapshot_kind: policy.required_frozen_snapshot_kind,
    source_refs: [ref(policy.required_frozen_snapshot_kind, 'frozen_source_001')],
    payload: {
      source_object_id: 'frozen_source_001',
      warning_context: ['accepted_risk_carried_forward'],
    },
  };
  const selectedFrozenInput = overrides.frozen_input ?? frozenInput;
  const restOverrides = { ...overrides };
  delete restOverrides.frozen_input;
  delete restOverrides.node_id;
  const requiredSlot = requiredSlotForNode(nodeId);
  const runtimeDefaults: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = policy.execution_kind === 'model_like' && requiredSlot
    ? {
      run_mode: 'acceptance',
      profile_id: requiredSlot.default_profile_id,
      execution_spec: {
        execution_mode: 'codex_assisted',
        model_option_id: null,
      },
    }
    : {};
  return {
    schema_version: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION,
    workflow_run_id: 'workflow_run_v1b_harness_001',
    node_attempt_id: 'node_attempt_v1b_harness_001',
    node_id: nodeId,
    policy_version: 'topic-selection-v1b-node-policy-v1',
    frozen_input: {
      ...selectedFrozenInput,
      frozen_input_hash: selectedFrozenInput.frozen_input_hash ?? frozenInputHash(selectedFrozenInput),
    },
    created_by: 'system',
    ...runtimeDefaults,
    ...restOverrides,
  };
}

function bundleRef(bundle: TopicSelectionV1aToV1bInputBundleRecord): TopicSelectionFunctionalRef {
  return ref('v1a_to_v1b_input_bundle', bundle.v1b_input_bundle_id, bundle.title_card_id, bundle.bundle_version);
}

function v1aBundleSourceRefs(bundle: TopicSelectionV1aToV1bInputBundleRecord): TopicSelectionFunctionalRef[] {
  return uniqueRefs([
    bundleRef(bundle),
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
}

function uniqueRefs(refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] {
  const seen = new Set<string>();
  const result: TopicSelectionFunctionalRef[] = [];
  for (const item of refs) {
    const key = [item.ref_type, item.ref_id, item.title_card_id ?? '', item.version_id ?? ''].join(':');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function acceptedConstraintProfilePayload(
  overrides: Partial<TopicSelectionV1bAcceptedConstraintProfilePayload> = {},
): TopicSelectionV1bAcceptedConstraintProfilePayload {
  return {
    target_community: 'CS paper engineering researchers',
    target_venue_class: null,
    intended_contribution_style: 'workflow_system',
    method_constraints: ['local-first workflow instrumentation'],
    resource_constraints: ['no live provider calls in fixture runs'],
    available_assets: ['v1a evidence map'],
    feasibility_budget: {
      maximum_slice_count: 3,
    },
    non_goals: ['promotion decision'],
    claim_ceiling: 'A bounded workflow claim about evidence-to-need traceability.',
    human_constraint_notes: null,
    constraint_payload: {
      source: 'fixture',
    },
    ...overrides,
  };
}

function n1Request(
  bundle: TopicSelectionV1aToV1bInputBundleRecord,
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): TopicSelectionV1bWorkflowHarnessRunRequest {
  const payload: TopicSelectionV1bN1HarnessFrozenInputPayload = {
    v1b_input_bundle_id: bundle.v1b_input_bundle_id,
    v1a_bundle_ref: bundleRef(bundle),
    v1a_bundle_hash: sha256Text(stableStringify(bundle)),
    source_refs_hash: sha256Text(stableStringify(v1aBundleSourceRefs(bundle))),
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n1',
    node_attempt_id: 'node_attempt_v1b_n1',
    node_id: 'topic-selection.v1b.create-intake-snapshot.v1',
    title_card_id: bundle.title_card_id,
    frozen_input: {
      input_contract: 'V1aToV1bInputBundleFrozenRef@v1',
      snapshot_kind: 'v1a_valid_need_bundle',
      source_refs: [ref('v1a_valid_need_bundle', bundle.v1b_input_bundle_id, bundle.title_card_id, bundle.bundle_version)],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

function n2Request(
  bundle: TopicSelectionV1aToV1bInputBundleRecord,
  n1Result: { authority_ref: TopicSelectionFunctionalRef | null; hashes: { authority_hash: string | null } },
  acceptedPayload: TopicSelectionV1bAcceptedConstraintProfilePayload = acceptedConstraintProfilePayload(),
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): TopicSelectionV1bWorkflowHarnessRunRequest {
  if (!n1Result.authority_ref || !n1Result.hashes.authority_hash) {
    throw new Error('N2 fixture requires admitted N1 result.');
  }
  const acceptedHash = sha256Text(stableStringify(acceptedPayload));
  const payload: TopicSelectionV1bN2HarnessFrozenInputPayload = {
    intake_snapshot_ref: n1Result.authority_ref,
    intake_snapshot_hash: n1Result.hashes.authority_hash,
    v1a_bundle_ref: bundleRef(bundle),
    v1a_bundle_hash: sha256Text(stableStringify(bundle)),
    authority_input_provider: 'codex_delegated',
    accepted_constraint_profile_payload: acceptedPayload,
    accepted_constraint_profile_payload_hash: acceptedHash,
    delegation_artifact_hash: acceptedHash,
    previous_profile_ref: null,
    previous_profile_hash: null,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n2',
    node_attempt_id: 'node_attempt_v1b_n2',
    node_id: 'topic-selection.v1b.record-research-constraint-profile.v1',
    title_card_id: bundle.title_card_id,
    run_mode: 'acceptance',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.constraint_profile_support,
    frozen_input: {
      input_contract: 'N1ToN2Handoff@v1',
      snapshot_kind: 'v1b_intake_snapshot',
      source_refs: [n1Result.authority_ref],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

function n2CodexArtifact(
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  acceptedPayloadHash: string,
): TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef {
  return semanticArtifact(input, {
    slot_id: 'n2_constraint_profile_semantic_support',
    allowed_effect: 'delegated_payload_candidate',
    output_contract: 'ResearchConstraintProfileDraftSupport@v1',
    execution_mode: 'codex_assisted',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.constraint_profile_support,
    normalized_output_hash: acceptedPayloadHash,
    structured_output_hash: acceptedPayloadHash,
  });
}

function n3Request(
  n1Result: { authority_ref: TopicSelectionFunctionalRef | null; hashes: { authority_hash: string | null } },
  n2Result: { authority_ref: TopicSelectionFunctionalRef | null; hashes: { authority_hash: string | null; handoff_hash: string | null } },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): TopicSelectionV1bWorkflowHarnessRunRequest {
  if (!n1Result.authority_ref || !n1Result.hashes.authority_hash || !n2Result.authority_ref || !n2Result.hashes.authority_hash) {
    throw new Error('N3 fixture requires admitted N1/N2 results.');
  }
  const payload: TopicSelectionV1bN3HarnessFrozenInputPayload = {
    intake_snapshot_ref: n1Result.authority_ref,
    intake_snapshot_hash: n1Result.hashes.authority_hash,
    constraint_profile_ref: n2Result.authority_ref,
    constraint_profile_hash: n2Result.hashes.authority_hash,
    n2_handoff_hash: n2Result.hashes.handoff_hash ?? 'f'.repeat(64),
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n3',
    node_attempt_id: 'node_attempt_v1b_n3',
    node_id: 'topic-selection.v1b.assess-intake-readiness.v1',
    title_card_id: n1Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    frozen_input: {
      input_contract: 'N2ToN3Handoff@v1',
      snapshot_kind: 'research_constraint_profile',
      source_refs: [n2Result.authority_ref],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

function n4Request(
  n1Result: { authority_ref: TopicSelectionFunctionalRef | null; hashes: { authority_hash: string | null } },
  n2Result: { authority_ref: TopicSelectionFunctionalRef | null; hashes: { authority_hash: string | null; handoff_hash: string | null } },
  n3Result: { authority_ref: TopicSelectionFunctionalRef | null; hashes: { authority_hash: string | null; handoff_hash: string | null } },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): TopicSelectionV1bWorkflowHarnessRunRequest {
  if (
    !n1Result.authority_ref
    || !n1Result.hashes.authority_hash
    || !n2Result.authority_ref
    || !n2Result.hashes.authority_hash
    || !n2Result.hashes.handoff_hash
    || !n3Result.authority_ref
    || !n3Result.hashes.authority_hash
    || !n3Result.hashes.handoff_hash
  ) {
    throw new Error('N4 fixture requires admitted N1/N2/N3 results.');
  }
  const payload: TopicSelectionV1bN4HarnessFrozenInputPayload = {
    intake_snapshot_ref: n1Result.authority_ref,
    intake_snapshot_hash: n1Result.hashes.authority_hash,
    constraint_profile_ref: n2Result.authority_ref,
    constraint_profile_hash: n2Result.hashes.authority_hash,
    intake_readiness_ref: n3Result.authority_ref,
    intake_readiness_hash: n3Result.hashes.authority_hash,
    n2_handoff_hash: n2Result.hashes.handoff_hash,
    n3_handoff_hash: n3Result.hashes.handoff_hash,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n4',
    node_attempt_id: 'node_attempt_v1b_n4',
    node_id: 'topic-selection.v1b.generate-research-slice-options.v1',
    title_card_id: n1Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    execution_spec: null,
    profile_id: null,
    run_mode: null,
    frozen_input: {
      input_contract: 'N3ToN4Handoff@v1',
      snapshot_kind: 'v1b_intake_readiness_assessment',
      source_refs: [n3Result.authority_ref, n2Result.authority_ref, n1Result.authority_ref],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

function n4Draft(
  overrides: Partial<TopicSelectionV1bResearchSliceOptionSetDraftPayload> = {},
): TopicSelectionV1bResearchSliceOptionSetDraftPayload {
  const supportUnitRef = ref('evidence_unit', 'evidence_unit_support_1', TITLE_CARD_ID);
  const validatedNeedRef = ref('validated_need', 'validated_need_1', TITLE_CARD_ID);
  return {
    recommended_option_key: 'traceable_workflow_slice',
    comparison_axes: ['method feasibility', 'evidence traceability'],
    comparison_summary: 'The recommended slice keeps the claim bounded to workflow traceability.',
    missing_option_types: [],
    unresolved_disagreements: [],
    human_review_triggers: [],
    options: [
      {
        option_key: 'traceable_workflow_slice',
        source_validated_need_refs: [validatedNeedRef],
        slice_statement: 'Build a bounded evidence-to-need traceability workflow for topic selection.',
        problem_space: 'Reviewer-aligned topic selection traceability.',
        target_setting: 'Local-first CS paper engineering assistant workflows.',
        target_community: 'CS paper engineering researchers',
        included_boundaries: ['v1a evidence-to-need trace preservation'],
        excluded_boundaries: ['promotion decision', 'full paper implementation'],
        contribution_type_candidate: 'workflow_system',
        support_evidence_refs: [supportUnitRef],
        challenge_evidence_refs: [],
        baseline_evidence_refs: [],
        context_evidence_refs: [],
        resource_assumptions: ['Fixture run uses existing v1a evidence map.'],
        data_assumptions: ['Evidence units remain frozen during slice generation.'],
        evaluation_path: 'Replay the harness and inspect deterministic trace hashes.',
        baseline_assumptions: ['Route-only smoke tests are insufficient as a baseline.'],
        hard_blockers: [],
        dependency_risks: ['Downstream selection may request more options.'],
        slice_budget: {
          max_nodes: 4,
        },
        expected_claim: 'A bounded workflow can preserve evidence-to-need traceability.',
        fallback_claim: 'A harness-native workflow improves traceability checks.',
        observable_success_criteria: ['N4 emits option set refs and hashes through handoff.'],
        main_risks: ['Evidence coverage may still need review.'],
        baseline_risk: 'medium',
        execution_risk: 'medium',
        scope_risk: 'low',
        claim_ceiling_alignment: {
          status: 'aligned',
          rationale: 'The claim is bounded to traceability workflow behavior.',
          confidence: 0.8,
        },
        confidence: 0.82,
        requires_human_review: false,
        human_review_triggers: [],
        details_payload: {
          fixture: true,
        },
      },
    ],
    ...overrides,
  };
}

async function recordN4DraftArtifact(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  draft: TopicSelectionV1bResearchSliceOptionSetDraftPayload,
): Promise<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> {
  const support = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: draft as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  const normalized = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: draft as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  const provenance = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'diagnostic',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: {
      adapter_policy_version: 'topic-selection-v1b-node-policy-v1',
      source: 'fixture',
    },
    created_by: 'system',
  });
  const draftHash = sha256Text(stableStringify(draft));
  return semanticArtifact(input, {
    slot_id: 'n4_research_slice_option_draft',
    allowed_effect: 'model_draft_for_gate',
    output_contract: 'ResearchSliceOptionSetDraft@v1',
    execution_mode: 'codex_assisted',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.research_slice_options_single_agent,
    support_artifact_ref: ref('artifact_ref', support.artifact_ref_id, TITLE_CARD_ID),
    support_artifact_hash: draftHash,
    normalized_output_ref: ref('artifact_ref', normalized.artifact_ref_id, TITLE_CARD_ID),
    normalized_output_hash: draftHash,
    structured_output_hash: draftHash,
    provenance_ref: ref('artifact_ref', provenance.artifact_ref_id, TITLE_CARD_ID),
  });
}

async function runReadyN3(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload();
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const n2 = await ctx.service.invokeNode({
    ...n2Input,
    semantic_artifacts: [n2CodexArtifact(n2Input, sha256Text(stableStringify(acceptedPayload)))],
  });
  const n3 = await ctx.service.invokeNode(n3Request(n1, n2));
  return { n1, n2, n3 };
}

async function runReadyN4(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const { n1, n2, n3 } = await runReadyN3(ctx);
  const input = n4Request(n1, n2, n3);
  const n4 = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN4DraftArtifact(ctx, input, n4Draft())],
  });
  return { n1, n2, n3, n4 };
}

function hashOptionForN5(option: TopicSelectionResearchSliceOptionRecord): string {
  return sha256Text(stableStringify({
    claim_ceiling_alignment: option.claim_ceiling_alignment,
    dependency_risks: option.dependency_risks,
    evaluation_path: option.evaluation_path,
    excluded_boundaries: option.excluded_boundaries,
    expected_claim: option.expected_claim,
    fallback_claim: option.fallback_claim,
    hard_blockers: option.hard_blockers,
    included_boundaries: option.included_boundaries,
    main_risks: option.main_risks,
    option_key: option.option_key,
    option_ref: ref('research_slice_option', option.research_slice_option_id, option.title_card_id),
    option_set_id: option.research_slice_option_set_id,
    problem_space: option.problem_space,
    risk_levels: {
      baseline: option.baseline_risk,
      execution: option.execution_risk,
      scope: option.scope_risk,
    },
    slice_statement: option.slice_statement,
    source_validated_need_refs: option.source_validated_need_refs,
    status: option.status,
    target_community: option.target_community,
    target_setting: option.target_setting,
  }));
}

function acceptedSliceSelectionPayload(
  option: TopicSelectionResearchSliceOptionRecord,
  overrides: Partial<TopicSelectionV1bAcceptedSliceSelectionPayload> = {},
): TopicSelectionV1bAcceptedSliceSelectionPayload {
  return {
    decision: 'select',
    selected_option_ref: ref('research_slice_option', option.research_slice_option_id, option.title_card_id),
    selected_option_hash: hashOptionForN5(option),
    selection_rationale: 'Select the traceable workflow slice with the strongest bounded fit.',
    decision_basis: {
      selected_option_key: option.option_key,
    },
    rejected_option_reasons: [],
    required_actions: [],
    accepted_risk_refs: [],
    confidence: 0.82,
    requires_human_review: false,
    human_review_reason: null,
    loopback_target: null,
    loopback_target_ref: null,
    loopback_reason_code: null,
    ...overrides,
  };
}

async function selectedN4Option(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>, n4: {
  authority_ref: TopicSelectionFunctionalRef | null;
}) {
  if (!n4.authority_ref) {
    throw new Error('N5 fixture requires admitted N4 result.');
  }
  const options = await ctx.researchSliceRepository.listOptionsByOptionSetId(n4.authority_ref.ref_id);
  const selected = options.find((option) => option.status === 'recommended') ?? options[0];
  if (!selected) {
    throw new Error('N5 fixture requires at least one N4 option.');
  }
  return selected;
}

function n5Request(
  n4Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    hashes: { authority_hash: string | null; handoff_hash: string | null };
  },
  acceptedPayload: TopicSelectionV1bAcceptedSliceSelectionPayload,
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): TopicSelectionV1bWorkflowHarnessRunRequest {
  if (!n4Result.authority_ref || !n4Result.hashes.authority_hash || !n4Result.hashes.handoff_hash) {
    throw new Error('N5 fixture requires admitted N4 result.');
  }
  const acceptedHash = sha256Text(stableStringify(acceptedPayload));
  const authorityInputProvider = overrides.run_mode ? 'codex_delegated' : 'fixture';
  const payload: TopicSelectionV1bN5HarnessFrozenInputPayload = {
    research_slice_option_set_ref: n4Result.authority_ref,
    research_slice_option_set_hash: n4Result.hashes.authority_hash,
    n4_handoff_hash: n4Result.hashes.handoff_hash,
    authority_input_provider: authorityInputProvider,
    accepted_selection_payload: acceptedPayload,
    accepted_selection_payload_hash: acceptedHash,
    delegation_artifact_hash: authorityInputProvider === 'codex_delegated' ? acceptedHash : null,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n5',
    node_attempt_id: 'node_attempt_v1b_n5',
    node_id: 'topic-selection.v1b.select-research-slice.v1',
    title_card_id: n4Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    frozen_input: {
      input_contract: 'N4ToN5Handoff@v1',
      snapshot_kind: 'research_slice_option_set',
      source_refs: [n4Result.authority_ref],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

function n5CodexArtifact(
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  acceptedPayloadHash: string,
): TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef {
  return semanticArtifact(input, {
    slot_id: 'n5_slice_selection_review',
    allowed_effect: 'delegated_payload_candidate',
    output_contract: 'ResearchSliceSelectionReviewSupport@v1',
    execution_mode: 'codex_assisted',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.slice_selection_support,
    normalized_output_hash: acceptedPayloadHash,
    structured_output_hash: acceptedPayloadHash,
  });
}

async function runReadyN5(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const { n1, n2, n3, n4 } = await runReadyN4(ctx);
  const option = await selectedN4Option(ctx, n4);
  const n5 = await ctx.service.invokeNode(n5Request(n4, acceptedSliceSelectionPayload(option)));
  return { n1, n2, n3, n4, n5, option };
}

async function n6Request(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  n5Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { handoff_hash: string | null };
  },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n5Result.authority_ref || !n5Result.handoff_ref || !n5Result.hashes.handoff_hash) {
    throw new Error('N6 fixture requires admitted N5 result.');
  }
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n5Result.handoff_ref.ref_id);
  const handoff = handoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff | null;
  if (!handoff || handoff.envelope.handoff_kind !== 'N5ToN6Handoff') {
    throw new Error('N6 fixture requires N5ToN6 handoff artifact.');
  }
  const payload: TopicSelectionV1bN6HarnessFrozenInputPayload = {
    ...(handoff.payload as Omit<TopicSelectionV1bN6HarnessFrozenInputPayload, 'n5_handoff_hash'>),
    n5_handoff_hash: n5Result.hashes.handoff_hash,
  };
  const selectionSnapshotRef = ref(
    'research_slice_selection_decision',
    n5Result.authority_ref.ref_id,
    n5Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    n5Result.authority_ref.version_id ?? null,
  );
  return request({
    workflow_run_id: 'workflow_run_v1b_n6',
    node_attempt_id: 'node_attempt_v1b_n6',
    node_id: 'topic-selection.v1b.generate-topic-question-candidates.v1',
    title_card_id: n5Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    execution_spec: null,
    profile_id: null,
    run_mode: null,
    frozen_input: {
      input_contract: 'N5ToN6Handoff@v1',
      snapshot_kind: 'research_slice_selection_decision',
      source_refs: [selectionSnapshotRef, n5Result.handoff_ref, ...handoff.required_refs],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

async function n6Draft(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  overrides: Partial<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload> = {},
): Promise<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload> {
  const payload = input.frozen_input.payload as unknown as TopicSelectionV1bN6HarnessFrozenInputPayload;
  const evidenceRows = await ctx.researchSliceRepository.listEvidenceRefsByResearchSliceId(payload.research_slice_ref.ref_id);
  const boundaries = await ctx.researchSliceRepository.listBoundariesByResearchSliceId(payload.research_slice_ref.ref_id);
  const evidenceRef = evidenceRows[0]?.evidence_ref ?? ref('evidence_unit', 'evidence_unit_support_1', TITLE_CARD_ID);
  const includedBoundary = boundaries.find((boundary) => boundary.boundary_kind === 'included') ?? boundaries[0];
  const excludedBoundary = boundaries.find((boundary) => boundary.boundary_kind === 'excluded') ?? boundaries[0];
  const includedBoundaryRef = ref('research_slice_boundary', includedBoundary!.research_slice_boundary_id, TITLE_CARD_ID);
  const excludedBoundaryRef = ref('research_slice_boundary', excludedBoundary!.research_slice_boundary_id, TITLE_CARD_ID);
  const needRef = ref('validated_need', 'validated_need_1', TITLE_CARD_ID);
  return {
    question_frame: {
      target_setting: 'Local-first CS paper engineering assistant workflows.',
      target_community: 'CS paper engineering researchers',
      object_scope: 'v1b harness-native topic selection candidate generation',
      task_scope: 'candidate generation, deterministic gates, and replay drift checks',
      intervention_or_approach: 'WorkflowHarness-native candidate-set gate with frozen semantic artifacts',
      comparison_baseline: 'route-only smoke tests without harness-level product acceptance',
      observable_outcome: 'stable candidate-set refs and replay hashes',
      assumption_refs: [],
      evidence_refs: [evidenceRef],
      frame_payload: {
        fixture: true,
      },
    },
    recommended_candidate_keys: ['harness_candidate'],
    generation_notes: ['Candidate stays inside the selected ResearchSlice and preserves N5 lineage.'],
    human_review_triggers: [],
    candidates: [
      {
        candidate_key: 'harness_candidate',
        main_question: 'How can a WorkflowHarness-native candidate gate improve replayable v1b topic selection?',
        sub_questions: ['Which N5 lineage hashes must remain frozen before N7 admission?'],
        question_type: 'system',
        contribution_hypothesis: 'system',
        source_validated_need_refs: [needRef],
        answerability_plan: {
          datasets_or_resources: ['v1b harness trace fixtures'],
          metrics: ['hash drift detection rate'],
          baselines: ['route-only smoke coverage'],
          ablations_or_comparisons: ['without frozen semantic artifact admission'],
          evaluation_setting: 'local deterministic harness acceptance tests',
          dependency_risks: ['provider canary behavior is not exercised in this fixture'],
          open_dependencies: [],
          known_gaps: [],
          required_evidence_refs: [evidenceRef],
        },
        answerability_verdict: 'answerable',
        expected_claim: 'A harness-native candidate gate improves replayable v1b topic selection.',
        fallback_claim: 'The gate preserves candidate lineage for downstream review.',
        max_claim_strength: 'Bounded workflow claim about candidate lineage and replay.',
        observable_success_criteria: ['N6 emits candidate set refs and hashes.'],
        boundary_check: {
          preserved_boundary_refs: [includedBoundaryRef],
          excluded_boundary_refs: [excludedBoundaryRef],
          boundary_violations: [],
          prohibited_claims: ['promotion decision'],
          allowed_refinements: ['tighten candidate wording'],
        },
        traceability_check: {
          support_evidence_refs: [evidenceRef],
          challenge_evidence_refs: [evidenceRef],
          baseline_evidence_refs: [evidenceRef],
          context_evidence_refs: [evidenceRef],
          mapped_evidence_refs: [evidenceRef],
          unmapped_assumptions: [],
        },
        falsification_conditions: [
          {
            condition_type: 'claim_overstrong',
            severity: 'hard',
            statement: 'If changed frozen N5 lineage hashes are not detected, the candidate claim must be lowered.',
            trigger_evidence_refs: [evidenceRef],
            trigger_source_refs: [payload.research_slice_ref],
            related_contract_fields: ['expected_claim'],
            expected_action: 'lower_claim_strength',
            check_timing: 'before_value_assessment',
            confidence: 'high',
          },
        ],
        risk_notes: [],
        blockers: [],
        objections: [],
        human_review_triggers: [],
        confidence: 0.84,
      },
    ],
    ...overrides,
  };
}

async function recordN6DraftArtifact(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  draft: TopicSelectionV1bTopicQuestionCandidateSetDraftPayload,
): Promise<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> {
  const support = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: draft as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  const normalized = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: draft as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  const provenance = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'diagnostic',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: {
      adapter_policy_version: 'topic-selection-v1b-node-policy-v1',
      source: 'fixture',
    },
    created_by: 'system',
  });
  const draftHash = sha256Text(stableStringify(draft));
  return semanticArtifact(input, {
    slot_id: 'n6_question_candidate_draft',
    allowed_effect: 'model_draft_for_gate',
    output_contract: 'TopicQuestionCandidateSetDraft@v1',
    execution_mode: 'codex_assisted',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_question_candidates_single_agent,
    support_artifact_ref: ref('artifact_ref', support.artifact_ref_id, TITLE_CARD_ID),
    support_artifact_hash: draftHash,
    normalized_output_ref: ref('artifact_ref', normalized.artifact_ref_id, TITLE_CARD_ID),
    normalized_output_hash: draftHash,
    structured_output_hash: draftHash,
    provenance_ref: ref('artifact_ref', provenance.artifact_ref_id, TITLE_CARD_ID),
  });
}

async function runReadyN6(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  draftOverrides: Partial<TopicSelectionV1bTopicQuestionCandidateSetDraftPayload> = {},
) {
  const { n5 } = await runReadyN5(ctx);
  const input = await n6Request(ctx, n5);
  const draft = await n6Draft(ctx, input, draftOverrides);
  const n6 = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN6DraftArtifact(ctx, input, draft)],
  });
  return { n5, n6, draft };
}

async function n7Request(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  n6Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { authority_hash: string | null; handoff_hash: string | null };
  },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n6Result.authority_ref || !n6Result.handoff_ref || !n6Result.hashes.handoff_hash) {
    throw new Error('N7 fixture requires admitted N6 result.');
  }
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n6Result.handoff_ref.ref_id);
  const handoff = handoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff | null;
  if (!handoff || handoff.envelope.handoff_kind !== 'N6ToN7Handoff') {
    throw new Error('N7 fixture requires N6ToN7 handoff artifact.');
  }
  const payload: TopicSelectionV1bN7HarnessFrozenInputPayload = {
    ...(handoff.payload as Omit<TopicSelectionV1bN7HarnessFrozenInputPayload, 'input_mode' | 'n6_handoff_hash'>),
    input_mode: 'initial_from_n6',
    n6_handoff_hash: n6Result.hashes.handoff_hash,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n7',
    node_attempt_id: 'node_attempt_v1b_n7',
    node_id: 'topic-selection.v1b.materialize-topic-question-contract.v1',
    title_card_id: n6Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    run_mode: null,
    profile_id: null,
    execution_spec: null,
    frozen_input: {
      input_contract: 'N6ToN7Handoff@v1',
      snapshot_kind: 'topic_question_candidate_set',
      source_refs: [n6Result.authority_ref, n6Result.handoff_ref, ...handoff.required_refs],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

async function recordN7SupportArtifact<T extends Record<string, unknown>>(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  slot: {
    slot_id: TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef['slot_id'];
    allowed_effect: TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef['allowed_effect'];
    output_contract: string;
    profile_id: TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef['profile_id'];
  },
  payload: T,
): Promise<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> {
  const support = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload,
    created_by: 'system',
  });
  const normalized = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload,
    created_by: 'system',
  });
  const provenance = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'diagnostic',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: {
      adapter_policy_version: 'topic-selection-v1b-node-policy-v1',
      source: 'fixture',
    },
    created_by: 'system',
  });
  const payloadHash = sha256Text(stableStringify(payload));
  return semanticArtifact(input, {
    slot_id: slot.slot_id,
    allowed_effect: slot.allowed_effect,
    output_contract: slot.output_contract,
    execution_mode: 'codex_assisted',
    profile_id: slot.profile_id,
    support_artifact_ref: ref('artifact_ref', support.artifact_ref_id, TITLE_CARD_ID),
    support_artifact_hash: payloadHash,
    normalized_output_ref: ref('artifact_ref', normalized.artifact_ref_id, TITLE_CARD_ID),
    normalized_output_hash: payloadHash,
    structured_output_hash: payloadHash,
    provenance_ref: ref('artifact_ref', provenance.artifact_ref_id, TITLE_CARD_ID),
  });
}

function n7GroupingPayload(input: TopicSelectionV1bWorkflowHarnessRunRequest): TopicSelectionV1bCandidateGroupingSupportPayload {
  const payload = input.frozen_input.payload as unknown as TopicSelectionV1bN7HarnessFrozenInputPayload;
  return {
    selected_candidate_ref: payload.admissible_candidate_refs[1] ?? payload.admissible_candidate_refs[0]!,
    selected_candidate_hash: payload.admissible_candidate_hashes[1] ?? payload.admissible_candidate_hashes[0]!,
    priority_order: payload.admissible_candidate_refs.length > 1
      ? [payload.admissible_candidate_refs[1]!, payload.admissible_candidate_refs[0]!]
      : [payload.admissible_candidate_refs[0]!],
    duplicate_or_overlap_groups: [],
    candidate_relationships: {
      ordered_by: 'codex_fixture',
    },
    grouping_summary: 'Codex support prioritizes the higher-value non-overlapping candidate.',
  };
}

function n7DebateAdmissionPayload(
  overrides: Partial<TopicSelectionV1bN8DebateAdmissionReviewSupportPayload> = {},
): TopicSelectionV1bN8DebateAdmissionReviewSupportPayload {
  return {
    debate_level: 'compact_assessment_debate',
    recommended_profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_value_assessment_single_agent,
    high_value_signal_codes: ['bounded_replay_claim'],
    risk_signal_codes: [],
    rationale: 'The candidate is bounded enough for compact assessment debate.',
    ...overrides,
  };
}

async function recordN8FeedbackArtifact(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  feedback: TopicSelectionV1bN8ToN7FeedbackPayload,
): Promise<{
  artifact_ref: TopicSelectionFunctionalRef;
  artifact_hash: string;
  payload_hash: string;
}> {
  const artifact = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: feedback as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  return {
    artifact_ref: ref('artifact_ref', artifact.artifact_ref_id, TITLE_CARD_ID),
    artifact_hash: sha256Text(stableStringify(artifact)),
    payload_hash: sha256Text(stableStringify(feedback)),
  };
}

async function n7FeedbackRequest(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  initialInput: TopicSelectionV1bWorkflowHarnessRunRequest,
  n7Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { authority_hash: string | null; handoff_hash: string | null };
  },
  feedbackClass: TopicSelectionV1bN8ToN7FeedbackPayload['feedback_class'] = 'semantic_candidate_failure',
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n7Result.authority_ref || !n7Result.handoff_ref || !n7Result.hashes.handoff_hash || !n7Result.hashes.authority_hash) {
    throw new Error('N7 feedback fixture requires admitted N7 result.');
  }
  const n7HandoffArtifact = await ctx.controlPlane.getArtifactRef(n7Result.handoff_ref.ref_id);
  const n7Handoff = n7HandoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff;
  const n7HandoffPayload = n7Handoff.payload as {
    active_candidate_ref: TopicSelectionFunctionalRef;
    active_candidate_hash: string;
    topic_question_candidate_set_ref: TopicSelectionFunctionalRef;
    topic_question_candidate_set_hash: string;
    trial_ledger_ref: TopicSelectionFunctionalRef;
    trial_ledger_hash: string;
  };
  const initialPayload = initialInput.frozen_input.payload as unknown as TopicSelectionV1bN7HarnessFrozenInputPayload;
  const feedback: TopicSelectionV1bN8ToN7FeedbackPayload = {
    feedback_class: feedbackClass,
    failure_reason_code: feedbackClass === 'gate_rejected' ? 'debate_admission_too_weak' : 'value_not_supported',
    feedback_summary: 'Fixture N8 feedback rejected the active candidate trial.',
    affected_refs: [n7HandoffPayload.active_candidate_ref],
    previous_n7_handoff_ref: n7Result.handoff_ref,
    previous_n7_handoff_hash: n7Result.hashes.handoff_hash,
    previous_trial_ledger_ref: n7HandoffPayload.trial_ledger_ref,
    previous_trial_ledger_hash: n7HandoffPayload.trial_ledger_hash,
    failed_topic_question_contract_ref: n7Result.authority_ref,
    failed_topic_question_contract_hash: n7Result.hashes.authority_hash,
    failed_candidate_ref: n7HandoffPayload.active_candidate_ref,
    failed_candidate_hash: n7HandoffPayload.active_candidate_hash,
    topic_question_candidate_set_ref: n7HandoffPayload.topic_question_candidate_set_ref,
    topic_question_candidate_set_hash: n7HandoffPayload.topic_question_candidate_set_hash,
    n8_gate_result_hash: 'f'.repeat(64),
    value_assessment_ref: null,
    value_assessment_hash: null,
  };
  const feedbackArtifact = await recordN8FeedbackArtifact(ctx, initialInput, feedback);
  const payload: TopicSelectionV1bN7HarnessFrozenInputPayload = {
    ...initialPayload,
    input_mode: 'feedback_from_n8',
    n8_feedback_ref: feedbackArtifact.artifact_ref,
    n8_feedback_hash: feedbackArtifact.artifact_hash,
    n8_feedback_payload_hash: feedbackArtifact.payload_hash,
  };
  return request({
    workflow_run_id: `workflow_run_v1b_n7_feedback_${n7Result.authority_ref.ref_id}`,
    node_attempt_id: `node_attempt_v1b_n7_feedback_${n7Result.authority_ref.ref_id}`,
    node_id: 'topic-selection.v1b.materialize-topic-question-contract.v1',
    title_card_id: TITLE_CARD_ID,
    run_mode: null,
    profile_id: null,
    execution_spec: null,
    frozen_input: {
      input_contract: 'N8ToN7Feedback@v1',
      snapshot_kind: 'topic_question_candidate_set',
      source_refs: [
        n7HandoffPayload.topic_question_candidate_set_ref,
        feedbackArtifact.artifact_ref,
        initialInput.frozen_input.source_refs.find((sourceRef) => sourceRef.ref_type === 'artifact_ref')!,
        n7Result.handoff_ref,
      ],
      payload: payload as unknown as Record<string, unknown>,
    },
  });
}

async function runReadyN7(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const { n6 } = await runReadyN6(ctx);
  const input = await n7Request(ctx, n6);
  const n7 = await ctx.service.invokeNode(input);
  return { n6, n7 };
}

async function n8Request(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  n7Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { authority_hash: string | null; handoff_hash: string | null };
  },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n7Result.authority_ref || !n7Result.handoff_ref || !n7Result.hashes.handoff_hash) {
    throw new Error('N8 fixture requires admitted N7 result.');
  }
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n7Result.handoff_ref.ref_id);
  const handoff = handoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff | null;
  if (!handoff || handoff.envelope.handoff_kind !== 'N7ToN8Handoff') {
    throw new Error('N8 fixture requires N7ToN8 handoff artifact.');
  }
  const payload: TopicSelectionV1bN8HarnessFrozenInputPayload = {
    ...(handoff.payload as Omit<TopicSelectionV1bN8HarnessFrozenInputPayload, 'n7_handoff_hash'>),
    n7_handoff_hash: n7Result.hashes.handoff_hash,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n8',
    node_attempt_id: 'node_attempt_v1b_n8',
    node_id: 'topic-selection.v1b.assess-topic-value.v1',
    title_card_id: n7Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    execution_spec: null,
    profile_id: null,
    run_mode: null,
    frozen_input: {
      input_contract: 'N7ToN8Handoff@v1',
      snapshot_kind: 'topic_question_contract',
      source_refs: [n7Result.authority_ref, n7Result.handoff_ref, ...handoff.required_refs],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

function n8ValueDraft(
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  overrides: Partial<TopicSelectionV1bTopicValueAssessmentDraftPayload> = {},
): TopicSelectionV1bTopicValueAssessmentDraftPayload {
  const payload = input.frozen_input.payload as unknown as TopicSelectionV1bN8HarnessFrozenInputPayload;
  const evidenceRef = payload.topic_question_contract_ref;
  const hardGates = TOPIC_SELECTION_VALUE_GATE_KEYS.map((gateKey) => ({
    gate_key: gateKey,
    verdict: 'pass' as const,
    severity: 'info' as const,
    overridable_with_risk: false,
    rationale: `${gateKey} passes in the deterministic value fixture.`,
    refs: [evidenceRef],
  }));
  const dimensionScores = TOPIC_SELECTION_VALUE_DIMENSIONS.map((dimensionKey) => ({
    dimension_key: dimensionKey,
    score: dimensionKey === 'reviewer_risk' ? 72 : 84,
    rationale: `${dimensionKey} is sufficiently supported for the fixture.`,
    evidence_refs: [evidenceRef],
    uncertainty: 'medium',
  }));
  return {
    readiness_status: 'ready',
    strongest_claim_if_success: 'A harness-native topic-selection flow preserves replayable authority boundaries.',
    fallback_claim_if_success: 'Harness-level acceptance exposes route-only smoke gaps.',
    hard_gates: hardGates,
    dimension_scores: dimensionScores,
    risk_penalty: {
      residual_risk: 'bounded',
    },
    reviewer_objections: ['Provider canary behavior is outside this fixture run.'],
    ceiling_case: 'The topic can support a bounded workflow claim with deterministic trace evidence.',
    base_case: 'The topic supports harness-native acceptance and replay validation.',
    floor_case: 'The topic still yields useful negative gate coverage.',
    recommended_disposition: 'advance_to_package',
    total_score: 83,
    value_summary: 'The active TopicQuestionContract has enough value and answerability for draft packaging.',
    confidence: 0.82,
    accepted_risk_refs: [],
    blocker_refs: [],
    risk_notes: ['Provider canary and output quality review remain downstream checks.'],
    reasoning_memo: {
      recommendation: 'advance_to_package',
      value_thesis: 'Harness-native v1b topic selection is valuable because it closes automation, replay, and authority boundaries.',
      significance: 'It turns route-testable workflow fragments into a product-level repeatable process.',
      originality: 'The contribution is a deterministic gate and handoff workflow around LLM-assisted semantic drafts.',
      claim_leverage: 'The claim remains bounded to workflow robustness and replay evidence.',
      reviewer_risks: ['The implementation needs downstream provider canary validation.'],
      effort_to_value: 'The fixture chain gives high value for moderate implementation effort.',
      strategic_fit: 'It aligns with reviewer-aligned paper engineering workflows.',
      negative_memory_check: 'No prior negative memory blocks this topic.',
      evidence_backed_rationale: 'The N7 contract and candidate lineage provide frozen trace evidence.',
      top_objections: ['The fixture does not prove live provider quality.'],
      uncertainty: 'Medium uncertainty until provider canary is added.',
      disposition_bridge: 'Advance to package with residual risks carried into v1c.',
      requires_critic_review: false,
      critic_triggers: [],
      cited_refs: [evidenceRef],
    },
    ...overrides,
  };
}

async function recordN8ValueDraftArtifact(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  input: TopicSelectionV1bWorkflowHarnessRunRequest,
  draft: TopicSelectionV1bTopicValueAssessmentDraftPayload,
): Promise<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> {
  const support = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: draft as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  const normalized = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'structured_output',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: draft as unknown as Record<string, unknown>,
    created_by: 'system',
  });
  const provenance = await ctx.controlPlane.recordArtifactRef({
    title_card_id: TITLE_CARD_ID,
    artifact_kind: 'diagnostic',
    storage_kind: 'inline',
    workflow_run_id: input.workflow_run_id,
    payload: {
      adapter_policy_version: 'topic-selection-v1b-node-policy-v1',
      source: 'fixture',
    },
    created_by: 'system',
  });
  const draftHash = sha256Text(stableStringify(draft));
  return semanticArtifact(input, {
    slot_id: 'n8_value_assessment_draft',
    allowed_effect: 'model_draft_for_gate',
    output_contract: 'TopicValueAssessmentDraft@v1',
    execution_mode: 'codex_assisted',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_value_assessment_single_agent,
    support_artifact_ref: ref('artifact_ref', support.artifact_ref_id, TITLE_CARD_ID),
    support_artifact_hash: draftHash,
    normalized_output_ref: ref('artifact_ref', normalized.artifact_ref_id, TITLE_CARD_ID),
    normalized_output_hash: draftHash,
    structured_output_hash: draftHash,
    provenance_ref: ref('artifact_ref', provenance.artifact_ref_id, TITLE_CARD_ID),
  });
}

async function runReadyN8(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  draftOverrides: Partial<TopicSelectionV1bTopicValueAssessmentDraftPayload> = {},
) {
  const { n7 } = await runReadyN7(ctx);
  const input = await n8Request(ctx, n7);
  const draft = n8ValueDraft(input, draftOverrides);
  const n8 = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN8ValueDraftArtifact(ctx, input, draft)],
  });
  return { n7, n8, draft };
}

function hashValueMemoForHarness(memo: {
  cited_refs: TopicSelectionFunctionalRef[];
  recommendation: string;
  requires_critic_review: boolean;
  topic_question_contract_id: string;
  topic_value_assessment_id: string;
  value_reasoning_memo_id: string;
  value_thesis: string;
}): string {
  return sha256Text(stableStringify({
    cited_refs: memo.cited_refs,
    recommendation: memo.recommendation,
    requires_critic_review: memo.requires_critic_review,
    topic_question_contract_id: memo.topic_question_contract_id,
    topic_value_assessment_id: memo.topic_value_assessment_id,
    value_reasoning_memo_id: memo.value_reasoning_memo_id,
    value_thesis: memo.value_thesis,
  }));
}

async function n9Request(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  n8Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { authority_hash: string | null; handoff_hash: string | null };
  },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n8Result.authority_ref || !n8Result.handoff_ref || !n8Result.hashes.authority_hash || !n8Result.hashes.handoff_hash) {
    throw new Error('N9 fixture requires admitted N8 result.');
  }
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n8Result.handoff_ref.ref_id);
  const handoff = handoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff | null;
  if (!handoff || handoff.envelope.handoff_kind !== 'N8ToN9Handoff') {
    throw new Error('N9 fixture requires N8ToN9 handoff artifact.');
  }
  const assessment = await ctx.valueAssessmentRepository.findAssessmentById(n8Result.authority_ref.ref_id);
  if (!assessment) {
    throw new Error('N9 fixture requires persisted assessment.');
  }
  const memo = await ctx.valueAssessmentRepository.findReasoningMemoById(assessment.value_reasoning_memo_id);
  if (!memo) {
    throw new Error('N9 fixture requires persisted value memo.');
  }
  const payload: TopicSelectionV1bN9HarnessFrozenInputPayload = {
    ...(handoff.payload as Omit<TopicSelectionV1bN9HarnessFrozenInputPayload, 'n8_handoff_hash' | 'value_reasoning_memo_ref' | 'value_reasoning_memo_hash' | 'recommended_disposition'>),
    n8_handoff_hash: n8Result.hashes.handoff_hash,
    value_reasoning_memo_ref: ref('value_reasoning_memo', memo.value_reasoning_memo_id, memo.title_card_id),
    value_reasoning_memo_hash: hashValueMemoForHarness(memo),
    recommended_disposition: memo.recommendation,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n9',
    node_attempt_id: 'node_attempt_v1b_n9',
    node_id: 'topic-selection.v1b.decide-value-disposition.v1',
    title_card_id: n8Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    frozen_input: {
      input_contract: 'N8ToN9Handoff@v1',
      snapshot_kind: 'topic_value_assessment',
      source_refs: [n8Result.authority_ref, payload.value_reasoning_memo_ref, n8Result.handoff_ref, ...handoff.required_refs],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

async function runReadyN9(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const { n8 } = await runReadyN8(ctx);
  const input = await n9Request(ctx, n8);
  const n9 = await ctx.service.invokeNode(input);
  return { n8, n9 };
}

async function n10Request(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  n9Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { handoff_hash: string | null };
  },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n9Result.authority_ref || !n9Result.handoff_ref || !n9Result.hashes.handoff_hash) {
    throw new Error('N10 fixture requires admitted N9 result.');
  }
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n9Result.handoff_ref.ref_id);
  const handoff = handoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff | null;
  if (!handoff || handoff.envelope.handoff_kind !== 'N9ToN10Handoff') {
    throw new Error('N10 fixture requires N9ToN10 handoff artifact.');
  }
  const payload: TopicSelectionV1bN10HarnessFrozenInputPayload = {
    ...(handoff.payload as Omit<TopicSelectionV1bN10HarnessFrozenInputPayload, 'n9_handoff_hash'>),
    n9_handoff_hash: n9Result.hashes.handoff_hash,
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n10',
    node_attempt_id: 'node_attempt_v1b_n10',
    node_id: 'topic-selection.v1b.create-draft-topic-package.v1',
    title_card_id: n9Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    frozen_input: {
      input_contract: 'N9ToN10Handoff@v1',
      snapshot_kind: 'value_disposition_decision',
      source_refs: [n9Result.authority_ref, n9Result.handoff_ref, ...handoff.required_refs],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

async function runReadyN10(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const { n9 } = await runReadyN9(ctx);
  const input = await n10Request(ctx, n9);
  const n10 = await ctx.service.invokeNode(input);
  return { n9, n10 };
}

function hashPackageForHarness(pkg: {
  package_payload: Record<string, unknown>;
  package_readiness_status: string;
  package_version: string;
  research_slice_id: string;
  selected_evidence_refs: TopicSelectionFunctionalRef[];
  title_candidates: string[];
  topic_package_id: string;
  topic_question_contract_id: string;
  topic_value_assessment_id: string;
  value_disposition_decision_id: string;
  v1c_input_bundle_id?: string | null;
}): string {
  return sha256Text(stableStringify({
    package_payload: pkg.package_payload,
    package_readiness_status: pkg.package_readiness_status,
    package_version: pkg.package_version,
    research_slice_id: pkg.research_slice_id,
    selected_evidence_refs: pkg.selected_evidence_refs,
    title_candidates: pkg.title_candidates,
    topic_package_id: pkg.topic_package_id,
    topic_question_contract_id: pkg.topic_question_contract_id,
    topic_value_assessment_id: pkg.topic_value_assessment_id,
    value_disposition_decision_id: pkg.value_disposition_decision_id,
    v1c_input_bundle_id: pkg.v1c_input_bundle_id,
  }));
}

function hashV1cBundleForHarness(bundle: {
  bundle_hash: string;
  bundle_status: string;
  package_readiness_status: string;
  package_version: string;
  topic_package_id: string;
  v1b_to_v1c_input_bundle_id: string;
}): string {
  return sha256Text(stableStringify({
    bundle_hash: bundle.bundle_hash,
    bundle_status: bundle.bundle_status,
    package_readiness_status: bundle.package_readiness_status,
    package_version: bundle.package_version,
    topic_package_id: bundle.topic_package_id,
    v1b_to_v1c_input_bundle_id: bundle.v1b_to_v1c_input_bundle_id,
  }));
}

async function n11Request(
  ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>,
  n10Result: {
    authority_ref: TopicSelectionFunctionalRef | null;
    handoff_ref: TopicSelectionFunctionalRef | null;
    hashes: { authority_hash: string | null; handoff_hash: string | null };
  },
  overrides: Partial<TopicSelectionV1bWorkflowHarnessRunRequest> = {},
): Promise<TopicSelectionV1bWorkflowHarnessRunRequest> {
  if (!n10Result.authority_ref || !n10Result.handoff_ref || !n10Result.hashes.authority_hash || !n10Result.hashes.handoff_hash) {
    throw new Error('N11 fixture requires admitted N10 result.');
  }
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n10Result.handoff_ref.ref_id);
  const handoff = handoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff | null;
  if (!handoff || handoff.envelope.handoff_kind !== 'N10ToN11Handoff') {
    throw new Error('N11 fixture requires N10ToN11 handoff artifact.');
  }
  const pkg = await ctx.topicPackageRepository.findPackageById(n10Result.authority_ref.ref_id);
  if (!pkg) {
    throw new Error('N11 fixture requires persisted draft package.');
  }
  const bundle = await ctx.topicPackageRepository.findV1cInputBundleByPackageId(pkg.topic_package_id);
  if (!bundle) {
    throw new Error('N11 fixture requires persisted v1c input bundle.');
  }
  const payload: TopicSelectionV1bN11HarnessFrozenInputPayload = {
    ...(handoff.payload as Omit<TopicSelectionV1bN11HarnessFrozenInputPayload, 'n10_handoff_hash' | 'v1c_input_bundle_ref' | 'v1c_input_bundle_hash'>),
    n10_handoff_hash: n10Result.hashes.handoff_hash,
    v1c_input_bundle_ref: ref('v1b_to_v1c_input_bundle', bundle.v1b_to_v1c_input_bundle_id, bundle.title_card_id),
    v1c_input_bundle_hash: hashV1cBundleForHarness(bundle),
  };
  return request({
    workflow_run_id: 'workflow_run_v1b_n11',
    node_attempt_id: 'node_attempt_v1b_n11',
    node_id: 'topic-selection.v1b.publish-v1c-input-bundle.v1',
    title_card_id: n10Result.authority_ref.title_card_id ?? TITLE_CARD_ID,
    frozen_input: {
      input_contract: 'N10ToN11Handoff@v1',
      snapshot_kind: 'topic_package',
      source_refs: [n10Result.authority_ref, payload.v1c_input_bundle_ref, n10Result.handoff_ref, ...handoff.required_refs],
      payload: payload as unknown as Record<string, unknown>,
    },
    ...overrides,
  });
}

async function runReadyN11(ctx: Awaited<ReturnType<typeof seedHarnessV1aBundle>>) {
  const { n10 } = await runReadyN10(ctx);
  const input = await n11Request(ctx, n10);
  const n11 = await ctx.service.invokeNode(input);
  return { n10, n11 };
}

async function seedHarnessV1aBundle(options: {
  openRecheck?: boolean;
  acceptedRiskCoversRecheck?: boolean;
  acceptedRiskExpiresAt?: string | null;
} = {}) {
  const ctx = makeContext({ withRunnerDependencies: true });
  const actor: TopicSelectionActorRef = { actor_type: 'human', actor_id: 'reviewer_1' };
  const evidenceMapRef = ref('evidence_map', 'evidence_map_1', TITLE_CARD_ID, 'v1');
  const searchRunRef = ref('search_run', 'search_run_1', TITLE_CARD_ID);
  const searchPlanRef = ref('search_plan', 'search_plan_1', TITLE_CARD_ID, 'v1');
  const literatureSnapshotRef = ref('literature_resource_pool_snapshot', 'literature_snapshot_1', TITLE_CARD_ID, 'v1');
  const supportUnitRef = ref('evidence_unit', 'evidence_unit_support_1', TITLE_CARD_ID);
  const roleBundle: TopicSelectionEvidenceRoleBundle = {
    support_unit_refs: [supportUnitRef],
    challenge_unit_refs: [],
    baseline_unit_refs: [ref('evidence_unit', 'evidence_unit_baseline_1', TITLE_CARD_ID)],
    context_unit_refs: [],
  };
  const humanDecisionRef = ref('human_confirmed_decision', 'human_decision_1', TITLE_CARD_ID);
  const validatedNeedRef = ref('validated_need', 'validated_need_1', TITLE_CARD_ID);
  const sourceCandidateRef = ref('need_candidate', 'need_candidate_1', TITLE_CARD_ID, 'v1');
  const supportPacketRef = ref('validation_decision_support_packet', 'support_packet_1', TITLE_CARD_ID);
  const adjudicationRef = ref('validate_need_adjudication_result', 'adjudication_1', TITLE_CARD_ID);
  const traceRef = ref('trace_snapshot', 'trace_1', TITLE_CARD_ID);
  const recheckRef = ref('search_plan_recheck_request', 'search_recheck_1', TITLE_CARD_ID);
  await ctx.controlPlaneRepository.createTraceSnapshot({
    trace_snapshot_id: traceRef.ref_id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    target_ref: validatedNeedRef,
    snapshot_hash: 'trace_hash_1',
    object_refs: [validatedNeedRef, sourceCandidateRef, supportPacketRef, adjudicationRef],
    lineage_link_refs: [],
    artifact_refs: [],
    quality_signal_refs: [],
    transition_attempt_refs: [],
    payload: { stage: 'v1a' },
    created_by: 'system',
    created_at: NOW,
  });
  await ctx.searchRepository.createLiteratureResourcePoolSnapshot({
    literature_resource_pool_snapshot_id: literatureSnapshotRef.ref_id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
    snapshot_version: 'v1',
    source_scope: 'title_card_evidence_basket',
    topic_seed_ref: ref('topic_seed', 'topic_seed_1', TITLE_CARD_ID),
    literature_refs: [ref('literature_record', 'lit_1', TITLE_CARD_ID)],
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
    title_card_id: TITLE_CARD_ID,
    plan_version: 'v1',
    status: 'ready',
    topic_seed_ref: ref('topic_seed', 'topic_seed_1', TITLE_CARD_ID),
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
    title_card_id: TITLE_CARD_ID,
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
    evidence_map_input_refs: [ref('literature_record', 'lit_1', TITLE_CARD_ID)],
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
      title_card_id: TITLE_CARD_ID,
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
    title_card_id: TITLE_CARD_ID,
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
    result_adjudication_id: adjudicationRef.ref_id,
    result_validated_need_id: validatedNeedRef.ref_id,
    merged_into_need_candidate_ref: null,
    created_by: 'system',
    created_at: NOW,
    updated_at: NOW,
  };
  await ctx.needRepository.createNeedCandidate(candidate);
  const supportPacket: TopicSelectionValidationDecisionSupportPacketRecord = {
    validation_support_packet_id: supportPacketRef.ref_id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
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
    riskRef = ref('accepted_risk', 'accepted_risk_1', TITLE_CARD_ID);
    await ctx.recheckRepository.createAcceptedRisk({
      accepted_risk_id: riskRef.ref_id,
      workspace_id: null,
      title_card_id: TITLE_CARD_ID,
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
      title_card_id: TITLE_CARD_ID,
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
    title_card_id: TITLE_CARD_ID,
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
  await ctx.controlPlane.recordHumanDecision({
    title_card_id: TITLE_CARD_ID,
    target_ref: validatedNeedRef,
    decision_type: 'confirm',
    actor,
    rationale: 'Human confirmed the validated need.',
    resulting_authority_refs: [validatedNeedRef],
  });
  const validatedNeed: TopicSelectionValidatedNeedRecord = {
    validated_need_id: validatedNeedRef.ref_id,
    workspace_id: null,
    title_card_id: TITLE_CARD_ID,
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
    title_card_id: TITLE_CARD_ID,
    validated_need_id: validatedNeedRef.ref_id,
    source_need_candidate_id: sourceCandidateRef.ref_id,
    adjudication_result_id: adjudicationRef.ref_id,
    support_packet_id: supportPacketRef.ref_id,
    bundle_version: 'v1',
    validated_need_ref: validatedNeedRef,
    source_need_candidate_ref: sourceCandidateRef,
    adjudication_result_ref: adjudicationRef,
    support_packet_ref: supportPacketRef,
    human_decision_ref: humanDecisionRef,
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

  return { ...ctx, bundle, riskRef };
}

test('v1b workflow harness node policy registry covers all N1-N11 nodes with expected execution classes', () => {
  const ctx = makeContext();
  const policies = ctx.service.getNodePolicies();
  assert.deepEqual(
    policies.map((policy) => policy.node_id),
    [...TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_IDS],
  );
  assert.equal(policies.length, 11);

  const deterministic = policies.filter((policy) => policy.execution_kind === 'deterministic').map((policy) => policy.node_id);
  const delegated = policies.filter((policy) => policy.execution_kind === 'delegated').map((policy) => policy.node_id);
  const modelLike = policies.filter((policy) => policy.execution_kind === 'model_like').map((policy) => policy.node_id);

  assert.deepEqual(deterministic, [
    'topic-selection.v1b.create-intake-snapshot.v1',
    'topic-selection.v1b.assess-intake-readiness.v1',
    'topic-selection.v1b.decide-value-disposition.v1',
    'topic-selection.v1b.create-draft-topic-package.v1',
    'topic-selection.v1b.publish-v1c-input-bundle.v1',
  ]);
  assert.deepEqual(delegated, [
    'topic-selection.v1b.record-research-constraint-profile.v1',
    'topic-selection.v1b.select-research-slice.v1',
    'topic-selection.v1b.materialize-topic-question-contract.v1',
  ]);
  assert.deepEqual(modelLike, [
    'topic-selection.v1b.generate-research-slice-options.v1',
    'topic-selection.v1b.generate-topic-question-candidates.v1',
    'topic-selection.v1b.assess-topic-value.v1',
  ]);
  assert.equal(policies.every((policy) => policy.gate_id && policy.input_contract), true);
  assert.equal(policies.every((policy) => policy.replay_hash_components.includes('frozen_input_hash')), true);
  assert.deepEqual(
    policies.filter((policy) => policy.semantic_support_slots.length > 0).map((policy) => policy.node_id),
    [
      'topic-selection.v1b.record-research-constraint-profile.v1',
      'topic-selection.v1b.assess-intake-readiness.v1',
      'topic-selection.v1b.generate-research-slice-options.v1',
      'topic-selection.v1b.select-research-slice.v1',
      'topic-selection.v1b.generate-topic-question-candidates.v1',
      'topic-selection.v1b.materialize-topic-question-contract.v1',
      'topic-selection.v1b.assess-topic-value.v1',
    ],
  );
});

test('v1b workflow harness shell blocks before runner when dependencies are not configured', async () => {
  const ctx = makeContext();
  const result = await ctx.service.invokeNode(request({
    node_id: 'topic-selection.v1b.assess-topic-value.v1',
  }));

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.route_decision, 'blocked');
  assert.equal(result.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  assert.ok(result.gate_result_ref);
  assert.ok(result.transition_attempt_ref);
  assert.ok(result.trace_snapshot_ref);
  assert.ok(result.harness_trace_artifact_ref);

  const transition = await ctx.controlPlane.getTraceSnapshot(result.trace_snapshot_ref.ref_id);
  assert.ok(transition);
  const attempts = await ctx.controlPlane.listArtifactRefsByWorkflowRunId(result.workflow_run_id);
  assert.equal(attempts.some((artifact) => artifact.artifact_kind === 'trace'), true);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, []);
});

test('v1b workflow harness N1 creates intake snapshot authority and N1 handoff from frozen v1a bundle', async () => {
  const ctx = await seedHarnessV1aBundle();
  const result = await ctx.service.invokeNode(n1Request(ctx.bundle));

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.error_code, null);
  assert.equal(result.authority_ref?.ref_type, 'v1b_intake_snapshot');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  assert.equal(result.hashes.authority_hash?.length, 64);
  assert.equal(result.hashes.handoff_hash?.length, 64);

  const snapshot = await ctx.v1bRepository.findIntakeSnapshotById(result.authority_ref!.ref_id);
  assert.equal(snapshot?.trace_status, 'passed');
  assert.equal(snapshot?.v1b_input_bundle_id, ctx.bundle.v1b_input_bundle_id);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, [result.authority_ref]);
});

test('v1b workflow harness N2 creates constraint profile from Codex delegated accepted payload with matching provenance', async () => {
  const ctx = await seedHarnessV1aBundle();
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload();
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const acceptedHash = sha256Text(stableStringify(acceptedPayload));
  const result = await ctx.service.invokeNode({
    ...n2Input,
    semantic_artifacts: [n2CodexArtifact(n2Input, acceptedHash)],
  });

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.authority_ref?.ref_type, 'research_constraint_profile');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  const profile = await ctx.v1bRepository.findResearchConstraintProfileById(result.authority_ref!.ref_id);
  assert.equal(profile?.target_community, acceptedPayload.target_community);
  assert.deepEqual(profile?.method_constraints, acceptedPayload.method_constraints);
});

test('v1b workflow harness N2 blocks Codex support without accepted payload authority input', async () => {
  const ctx = await seedHarnessV1aBundle();
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload();
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const brokenPayload = { ...n2Input.frozen_input.payload };
  delete brokenPayload.accepted_constraint_profile_payload;
  const brokenInput: TopicSelectionV1bWorkflowHarnessRunRequest = {
    ...n2Input,
    frozen_input: {
      ...n2Input.frozen_input,
      payload: brokenPayload,
      frozen_input_hash: frozenInputHash({
        ...n2Input.frozen_input,
        payload: brokenPayload,
        frozen_input_hash: null,
      }),
    },
  };
  const result = await ctx.service.invokeNode({
    ...brokenInput,
    semantic_artifacts: [n2CodexArtifact(brokenInput, sha256Text(stableStringify(acceptedPayload)))],
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N2_ACCEPTED_PROFILE_PAYLOAD_INVALID');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
});

test('v1b workflow harness N3 ready profile emits readiness authority and N3 handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload();
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const n2 = await ctx.service.invokeNode({
    ...n2Input,
    semantic_artifacts: [n2CodexArtifact(n2Input, sha256Text(stableStringify(acceptedPayload)))],
  });
  const result = await ctx.service.invokeNode(n3Request(n1, n2));

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.authority_ref?.ref_type, 'v1b_intake_readiness_assessment');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  const readiness = await ctx.v1bRepository.findReadinessAssessmentById(result.authority_ref!.ref_id);
  assert.equal(readiness?.recommendation, 'ready_for_slice');
  assert.equal(readiness?.blockers.length, 0);
});

test('v1b workflow harness N3 blocks missing constraints without N4 handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload({
    target_community: '',
    method_constraints: [],
    resource_constraints: [],
    non_goals: [],
    claim_ceiling: '',
  });
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const n2 = await ctx.service.invokeNode({
    ...n2Input,
    semantic_artifacts: [n2CodexArtifact(n2Input, sha256Text(stableStringify(acceptedPayload)))],
  });
  const result = await ctx.service.invokeNode(n3Request(n1, n2));

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.route_decision, 'loopback');
  assert.equal(result.handoff_ref, null);
  assert.equal(result.error_code, 'RESEARCH_CONSTRAINT_PROFILE_INCOMPLETE');
  const readiness = await ctx.v1bRepository.findReadinessAssessmentById(result.authority_ref!.ref_id);
  assert.equal(readiness?.recommendation, 'needs_constraint_clarification');
  assert.ok(readiness?.missing_constraint_codes.includes('TARGET_COMMUNITY_REQUIRED'));
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, [result.authority_ref]);
});

test('v1b workflow harness N3 blocks drifted frozen authority hash before N4 handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload();
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const n2 = await ctx.service.invokeNode({
    ...n2Input,
    semantic_artifacts: [n2CodexArtifact(n2Input, sha256Text(stableStringify(acceptedPayload)))],
  });
  const input = n3Request(n1, n2);
  const result = await ctx.service.invokeNode({
    ...input,
    frozen_input: {
      ...input.frozen_input,
      payload: {
        ...input.frozen_input.payload,
        constraint_profile_hash: 'b'.repeat(64),
      },
      frozen_input_hash: null,
    },
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N3_CONSTRAINT_PROFILE_HASH_MISMATCH');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
});

test('v1b workflow harness N3 carries accepted risk warning into result and handoff evidence', async () => {
  const ctx = await seedHarnessV1aBundle({ openRecheck: true, acceptedRiskCoversRecheck: true });
  const n1 = await ctx.service.invokeNode(n1Request(ctx.bundle));
  const acceptedPayload = acceptedConstraintProfilePayload();
  const n2Input = n2Request(ctx.bundle, n1, acceptedPayload);
  const n2 = await ctx.service.invokeNode({
    ...n2Input,
    semantic_artifacts: [n2CodexArtifact(n2Input, sha256Text(stableStringify(acceptedPayload)))],
  });
  const result = await ctx.service.invokeNode(n3Request(n1, n2));

  assert.equal(result.gate_status, 'admitted_with_warnings');
  assert.equal(result.route_decision, 'invoke_next');
  assert.ok(result.warnings.some((warning) => warning.code === 'ACCEPTED_RISK_CARRIED_FORWARD'));
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  const readiness = await ctx.v1bRepository.findReadinessAssessmentById(result.authority_ref!.ref_id);
  assert.equal(readiness?.accepted_risk_refs.length, 1);
});

test('v1b workflow harness N4 creates research slice option set from frozen semantic draft artifact', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n1, n2, n3 } = await runReadyN3(ctx);
  const input = n4Request(n1, n2, n3);
  const draft = n4Draft();
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN4DraftArtifact(ctx, input, draft)],
  });

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.error_code, null);
  assert.equal(result.authority_ref?.ref_type, 'research_slice_option_set');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  assert.equal(result.hashes.authority_hash?.length, 64);
  assert.equal(result.hashes.handoff_hash?.length, 64);

  const optionSet = await ctx.researchSliceRepository.findOptionSetById(result.authority_ref!.ref_id);
  assert.equal(optionSet?.status, 'ready_for_selection');
  assert.equal(optionSet?.option_count, 1);
  assert.ok(optionSet?.recommended_option_id);
  const options = await ctx.researchSliceRepository.listOptionsByOptionSetId(result.authority_ref!.ref_id);
  assert.equal(options.length, 1);
  assert.equal(options[0]?.option_key, 'traceable_workflow_slice');
  assert.equal(options[0]?.status, 'recommended');
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, [result.authority_ref]);
});

test('v1b workflow harness N4 requires frozen semantic draft artifact and never live-executes execution_spec alone', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n1, n2, n3 } = await runReadyN3(ctx);
  const input = n4Request(n1, n2, n3, {
    execution_spec: {
      execution_mode: 'codex_assisted',
      model_option_id: null,
    },
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.research_slice_options_single_agent,
    run_mode: 'acceptance',
  });
  const result = await ctx.service.invokeNode(input);

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N4_FROZEN_DRAFT_ARTIFACT_REQUIRED');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  assert.deepEqual(await ctx.researchSliceRepository.listOptionSetsByTitleCardId(TITLE_CARD_ID), []);
});

test('v1b workflow harness N4 blocks malformed option drafts before authority write', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n1, n2, n3 } = await runReadyN3(ctx);
  const input = n4Request(n1, n2, n3);
  const draft = n4Draft({
    options: [
      n4Draft().options[0]!,
      {
        ...n4Draft().options[0]!,
        included_boundaries: [],
      },
    ],
  });
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN4DraftArtifact(ctx, input, draft)],
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N4_DUPLICATE_RESEARCH_SLICE_OPTION_KEY');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  assert.deepEqual(await ctx.researchSliceRepository.listOptionSetsByTitleCardId(TITLE_CARD_ID), []);
});

test('v1b workflow harness N4 blocks semantic artifact hash drift before authority write', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n1, n2, n3 } = await runReadyN3(ctx);
  const input = n4Request(n1, n2, n3);
  const artifact = await recordN4DraftArtifact(ctx, input, n4Draft());
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [
      {
        ...artifact,
        normalized_output_hash: 'f'.repeat(64),
      },
    ],
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N4_FROZEN_DRAFT_ARTIFACT_HASH_MISMATCH');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
});

test('v1b workflow harness N4 blocks frozen readiness hash drift before authority write', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n1, n2, n3 } = await runReadyN3(ctx);
  const input = n4Request(n1, n2, n3);
  const driftedInput: TopicSelectionV1bWorkflowHarnessRunRequest = {
    ...input,
    frozen_input: {
      ...input.frozen_input,
      payload: {
        ...input.frozen_input.payload,
        intake_readiness_hash: 'b'.repeat(64),
      },
      frozen_input_hash: frozenInputHash({
        ...input.frozen_input,
        payload: {
          ...input.frozen_input.payload,
          intake_readiness_hash: 'b'.repeat(64),
        },
        frozen_input_hash: null,
      }),
    },
  };
  const result = await ctx.service.invokeNode({
    ...driftedInput,
    semantic_artifacts: [await recordN4DraftArtifact(ctx, driftedInput, n4Draft())],
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N4_INTAKE_READINESS_HASH_MISMATCH');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  assert.deepEqual(await ctx.researchSliceRepository.listOptionSetsByTitleCardId(TITLE_CARD_ID), []);
});

test('v1b workflow harness N5 selects a research slice and emits N5 handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n4 } = await runReadyN4(ctx);
  const option = await selectedN4Option(ctx, n4);
  const accepted = acceptedSliceSelectionPayload(option);
  const result = await ctx.service.invokeNode(n5Request(n4, accepted));

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.error_code, null);
  assert.equal(result.authority_ref?.ref_type, 'slice_selection_decision');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');

  const decision = await ctx.researchSliceRepository.findSelectionDecisionById(result.authority_ref!.ref_id);
  assert.equal(decision?.decision, 'select');
  assert.equal(decision?.selected_option_id, option.research_slice_option_id);
  assert.equal(decision?.output_research_slice_ref?.ref_type, 'research_slice');
  const researchSlice = await ctx.researchSliceRepository.findResearchSliceById(
    decision!.output_research_slice_ref!.ref_id,
  );
  assert.equal(researchSlice?.source_option_ref.ref_id, option.research_slice_option_id);
  assert.equal(researchSlice?.slice_selection_decision_ref.ref_id, result.authority_ref!.ref_id);

  const optionSet = await ctx.researchSliceRepository.findOptionSetById(n4.authority_ref!.ref_id);
  assert.equal(optionSet?.status, 'selected');
  assert.equal(optionSet?.selected_option_id, option.research_slice_option_id);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, [
    result.authority_ref,
    decision?.output_research_slice_ref,
  ]);
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(result.handoff_ref!.ref_id);
  const handoffPayload = handoffArtifact?.payload as {
    payload?: {
      constraint_profile_hash?: string;
      constraint_profile_ref?: TopicSelectionFunctionalRef;
      intake_readiness_hash?: string;
      intake_readiness_ref?: TopicSelectionFunctionalRef;
      research_slice_ref?: TopicSelectionFunctionalRef;
    };
  } | null;
  assert.equal(handoffPayload?.payload?.constraint_profile_ref?.ref_type, 'research_constraint_profile');
  assert.match(handoffPayload?.payload?.constraint_profile_hash ?? '', /^[a-f0-9]{64}$/);
  assert.equal(handoffPayload?.payload?.intake_readiness_ref?.ref_type, 'v1b_intake_readiness_assessment');
  assert.match(handoffPayload?.payload?.intake_readiness_hash ?? '', /^[a-f0-9]{64}$/);
  assert.equal(
    handoffPayload?.payload?.research_slice_ref?.ref_id,
    decision?.output_research_slice_ref?.ref_id,
  );
});

test('v1b workflow harness N5 authority write failure does not leave replayable admitted trace', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n4 } = await runReadyN4(ctx);
  const option = await selectedN4Option(ctx, n4);
  const input = n5Request(n4, acceptedSliceSelectionPayload(option));
  const originalCreate = ctx.researchSliceRepository.createSelectionDecisionWithSlice.bind(ctx.researchSliceRepository);
  let failNextWrite = true;
  ctx.researchSliceRepository.createSelectionDecisionWithSlice = async (creation) => {
    if (failNextWrite) {
      failNextWrite = false;
      throw new Error('injected N5 authority write failure');
    }
    return originalCreate(creation);
  };

  await assert.rejects(
    () => ctx.service.invokeNode(input),
    /injected N5 authority write failure/,
  );
  const failedAttemptArtifacts = await ctx.controlPlane.listArtifactRefsByWorkflowRunId(input.workflow_run_id);
  const failedN5TraceArtifacts = failedAttemptArtifacts.filter((artifact) =>
    artifact.artifact_kind === 'trace'
    && (artifact.payload as { node_id?: string } | null)?.node_id === input.node_id
  );
  assert.equal(failedN5TraceArtifacts.length, 0);

  const result = await ctx.service.invokeNode(input);
  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.replay_provenance, null);
  const replay = await ctx.service.invokeNode(input);
  assert.equal(replay.replay_provenance?.replayed, true);
  assert.equal(replay.authority_ref?.ref_id, result.authority_ref?.ref_id);
});

test('v1b workflow harness N5 accepts Codex delegated selection only with matching semantic provenance', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n4 } = await runReadyN4(ctx);
  const option = await selectedN4Option(ctx, n4);
  const accepted = acceptedSliceSelectionPayload(option);
  const input = n5Request(n4, accepted, {
    workflow_run_id: 'workflow_run_v1b_n5_codex',
    node_attempt_id: 'node_attempt_v1b_n5_codex',
    run_mode: 'acceptance',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.slice_selection_support,
  });
  const acceptedHash = sha256Text(stableStringify(accepted));
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [n5CodexArtifact(input, acceptedHash)],
  });

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.error_code, null);
  assert.equal(result.hashes.semantic_artifact_hash?.length, 64);
});

test('v1b workflow harness N5 blocks Codex delegated payload without matching artifact before authority write', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n4 } = await runReadyN4(ctx);
  const option = await selectedN4Option(ctx, n4);
  const accepted = acceptedSliceSelectionPayload(option);
  const input = n5Request(n4, accepted);
  const acceptedHash = sha256Text(stableStringify(accepted));
  const result = await ctx.service.invokeNode({
    ...input,
    frozen_input: {
      ...input.frozen_input,
      payload: {
        ...input.frozen_input.payload,
        authority_input_provider: 'codex_delegated',
        delegation_artifact_hash: acceptedHash,
      },
      frozen_input_hash: null,
    },
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N5_CODEX_DELEGATION_ARTIFACT_REQUIRED');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
});

test('v1b workflow harness N5 request_more_options writes only decision and loops back without N6 handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n4 } = await runReadyN4(ctx);
  const option = await selectedN4Option(ctx, n4);
  const accepted = acceptedSliceSelectionPayload(option, {
    decision: 'request_more_options',
    selected_option_ref: null,
    selected_option_hash: null,
    selection_rationale: 'The option set is too narrow for downstream candidate generation.',
    required_actions: ['regenerate broader research slice options'],
    loopback_target: 'plan_research_slice_run',
    loopback_reason_code: 'insufficient_option_coverage',
  });
  const result = await ctx.service.invokeNode(n5Request(n4, accepted));

  assert.equal(result.gate_status, 'terminal_no_advance');
  assert.equal(result.failure_class, 'terminal_no_advance');
  assert.equal(result.route_decision, 'loopback');
  assert.equal(result.authority_ref?.ref_type, 'slice_selection_decision');
  assert.equal(result.handoff_ref, null);
  const decision = await ctx.researchSliceRepository.findSelectionDecisionById(result.authority_ref!.ref_id);
  assert.equal(decision?.decision, 'request_more_options');
  assert.equal(decision?.output_research_slice_ref, null);
  const optionSet = await ctx.researchSliceRepository.findOptionSetById(n4.authority_ref!.ref_id);
  assert.equal(optionSet?.status, 'needs_more_options');
  assert.equal(optionSet?.selected_option_id, null);
});

test('v1b workflow harness N5 blocks option hash drift and high-risk selection without delegation', async () => {
  const driftCtx = await seedHarnessV1aBundle();
  const { n4: driftN4 } = await runReadyN4(driftCtx);
  const option = await selectedN4Option(driftCtx, driftN4);
  const driftResult = await driftCtx.service.invokeNode(n5Request(driftN4, acceptedSliceSelectionPayload(option, {
    selected_option_hash: 'f'.repeat(64),
  })));
  assert.equal(driftResult.gate_status, 'blocked');
  assert.equal(driftResult.error_code, 'N5_SELECTED_OPTION_HASH_MISMATCH');
  assert.equal(driftResult.authority_ref, null);
  assert.equal(driftResult.handoff_ref, null);

  const riskCtx = await seedHarnessV1aBundle();
  const { n1, n2, n3 } = await runReadyN3(riskCtx);
  const n4Input = n4Request(n1, n2, n3);
  const highRiskDraft = n4Draft({
    options: [
      {
        ...n4Draft().options[0]!,
        baseline_risk: 'high',
        human_review_triggers: ['high baseline risk'],
      },
    ],
  });
  const highRiskN4 = await riskCtx.service.invokeNode({
    ...n4Input,
    semantic_artifacts: [await recordN4DraftArtifact(riskCtx, n4Input, highRiskDraft)],
  });
  const highRiskOption = await selectedN4Option(riskCtx, highRiskN4);
  const highRiskResult = await riskCtx.service.invokeNode(
    n5Request(highRiskN4, acceptedSliceSelectionPayload(highRiskOption)),
  );
  assert.equal(highRiskResult.gate_status, 'blocked');
  assert.equal(highRiskResult.error_code, 'N5_HIGH_RISK_SELECTION_REQUIRES_ACCEPTED_RISK');
  assert.equal(highRiskResult.authority_ref, null);
  assert.equal(highRiskResult.handoff_ref, null);
});

test('v1b workflow harness N6 creates candidate set from frozen semantic draft artifact', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n5 } = await runReadyN5(ctx);
  const input = await n6Request(ctx, n5);
  const draft = await n6Draft(ctx, input);
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN6DraftArtifact(ctx, input, draft)],
  });

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.error_code, null);
  assert.equal(result.authority_ref?.ref_type, 'topic_question_candidate_set');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  assert.match(result.hashes.authority_hash ?? '', /^[a-f0-9]{64}$/);

  const candidateSet = await ctx.topicQuestionRepository.findCandidateSetById(result.authority_ref!.ref_id);
  assert.equal(candidateSet?.status, 'ready_for_selection');
  assert.equal(candidateSet?.candidate_count, 1);
  const candidates = await ctx.topicQuestionRepository.listCandidatesByCandidateSetId(result.authority_ref!.ref_id);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.candidate_key, 'harness_candidate');
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(result.handoff_ref!.ref_id);
  const handoff = handoffArtifact?.payload as TopicSelectionV1bWorkflowHarnessHandoff | null;
  const handoffPayload = handoff?.payload as {
    admissible_candidate_hashes?: string[];
    admissible_candidate_refs?: TopicSelectionFunctionalRef[];
    topic_question_candidate_set_hash?: string;
  } | null;
  assert.equal(handoffPayload?.topic_question_candidate_set_hash, result.hashes.authority_hash);
  assert.equal(handoffPayload?.admissible_candidate_refs?.length, handoffPayload?.admissible_candidate_hashes?.length);
  assert.equal(handoffPayload?.admissible_candidate_refs?.[0]?.ref_id, candidates[0]?.topic_question_candidate_id);
  assert.match(handoffPayload?.admissible_candidate_hashes?.[0] ?? '', /^[a-f0-9]{64}$/);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.equal(
    transitionRecord?.created_authority_refs.some((authorityRef) => authorityRef.ref_type === 'topic_question_contract') ?? false,
    false,
  );
});

test('v1b workflow harness N6 requires frozen draft artifact and does not live execute execution_spec alone', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n5 } = await runReadyN5(ctx);
  const input = await n6Request(ctx, n5, {
    execution_spec: {
      execution_mode: 'codex_assisted',
      model_option_id: null,
    },
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_question_candidates_single_agent,
    run_mode: 'acceptance',
  });
  const result = await ctx.service.invokeNode(input);

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'N6_FROZEN_DRAFT_ARTIFACT_REQUIRED');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  assert.deepEqual(await ctx.topicQuestionRepository.listCandidateSetsByTitleCardId(TITLE_CARD_ID), []);
});

test('v1b workflow harness N6 blocks malformed or structurally drifting candidate drafts', async () => {
  const duplicateCtx = await seedHarnessV1aBundle();
  const { n5: duplicateN5 } = await runReadyN5(duplicateCtx);
  const duplicateInput = await n6Request(duplicateCtx, duplicateN5);
  const baseDraft = await n6Draft(duplicateCtx, duplicateInput);
  const duplicateResult = await duplicateCtx.service.invokeNode({
    ...duplicateInput,
    semantic_artifacts: [
      await recordN6DraftArtifact(duplicateCtx, duplicateInput, {
        ...baseDraft,
        candidates: [
          baseDraft.candidates[0]!,
          {
            ...baseDraft.candidates[0]!,
            main_question: 'How can a second candidate test duplicate candidate-key blocking in N6?',
          },
        ],
      }),
    ],
  });
  assert.equal(duplicateResult.gate_status, 'blocked');
  assert.equal(duplicateResult.error_code, 'N6_DUPLICATE_TOPIC_QUESTION_CANDIDATE_KEY');
  assert.equal(duplicateResult.authority_ref, null);

  const driftCtx = await seedHarnessV1aBundle();
  const { n5: driftN5 } = await runReadyN5(driftCtx);
  const driftInput = await n6Request(driftCtx, driftN5);
  const driftDraft = await n6Draft(driftCtx, driftInput);
  const driftResult = await driftCtx.service.invokeNode({
    ...driftInput,
    semantic_artifacts: [
      await recordN6DraftArtifact(driftCtx, driftInput, {
        ...driftDraft,
        candidates: [
          {
            ...driftDraft.candidates[0]!,
            traceability_check: {
              ...driftDraft.candidates[0]!.traceability_check,
              support_evidence_refs: [ref('evidence_unit', 'unknown_evidence_unit', TITLE_CARD_ID)],
            },
          },
        ],
      }),
    ],
  });
  assert.equal(driftResult.gate_status, 'blocked');
  assert.equal(driftResult.error_code, 'N6_UNKNOWN_EVIDENCE_REF');
  assert.equal(driftResult.authority_ref, null);

  const hashCtx = await seedHarnessV1aBundle();
  const { n5: hashN5 } = await runReadyN5(hashCtx);
  const hashInput = await n6Request(hashCtx, hashN5);
  const hashDraft = await n6Draft(hashCtx, hashInput);
  const hashArtifact = await recordN6DraftArtifact(hashCtx, hashInput, hashDraft);
  const hashResult = await hashCtx.service.invokeNode({
    ...hashInput,
    semantic_artifacts: [
      {
        ...hashArtifact,
        structured_output_hash: 'f'.repeat(64),
      },
    ],
  });
  assert.equal(hashResult.gate_status, 'blocked');
  assert.equal(hashResult.error_code, 'N6_FROZEN_DRAFT_ARTIFACT_HASH_MISMATCH');
  assert.equal(hashResult.authority_ref, null);
});

test('v1b workflow harness N6 emits loopback with no authority when all candidates fail semantic gate', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n5 } = await runReadyN5(ctx);
  const input = await n6Request(ctx, n5);
  const draft = await n6Draft(ctx, input);
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [
      await recordN6DraftArtifact(ctx, input, {
        ...draft,
        candidates: [
          {
            ...draft.candidates[0]!,
            answerability_verdict: 'not_answerable',
            main_question: 'How can AI improve research?',
          },
        ],
      }),
    ],
  });

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.failure_class, 'semantic_non_pass');
  assert.equal(result.route_decision, 'loopback');
  assert.equal(result.error_code, 'N6_NO_ADMISSIBLE_TOPIC_QUESTION_CANDIDATE');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  assert.deepEqual(await ctx.topicQuestionRepository.listCandidateSetsByTitleCardId(TITLE_CARD_ID), []);
});

test('v1b workflow harness N6 carries warnings and detects replay drift', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n5 } = await runReadyN5(ctx);
  const input = await n6Request(ctx, n5, {
    workflow_run_id: 'workflow_run_v1b_n6_replay',
    node_attempt_id: 'node_attempt_v1b_n6_replay',
  });
  const draft = await n6Draft(ctx, input, {
    human_review_triggers: ['review candidate risk note'],
  });
  draft.candidates[0] = {
    ...draft.candidates[0]!,
    risk_notes: ['Evidence coverage should be checked before value assessment.'],
  };
  const semanticArtifactRef = await recordN6DraftArtifact(ctx, input, draft);
  const first = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [semanticArtifactRef],
  });
  assert.equal(first.gate_status, 'admitted_with_warnings');
  assert.ok(first.warnings.some((warning) => warning.code === 'CANDIDATE_RISK_NOTE_PRESENT'));

  const replay = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [semanticArtifactRef],
  });
  assert.equal(replay.replay_provenance?.replayed, true);
  assert.equal(replay.authority_ref?.ref_id, first.authority_ref?.ref_id);

  const driftDraft = await n6Draft(ctx, input, {
    generation_notes: ['Changed semantic artifact should drift replay identity.'],
  });
  const drift = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN6DraftArtifact(ctx, input, driftDraft)],
  });
  assert.equal(drift.gate_status, 'blocked');
  assert.equal(drift.error_code, 'REPLAY_SEMANTIC_ARTIFACT_HASH_MISMATCH');
});

test('v1b workflow harness N7 materializes an active TopicQuestionContract from N6 handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n6 } = await runReadyN6(ctx);
  const input = await n7Request(ctx, n6);
  const result = await ctx.service.invokeNode(input);

  assert.equal(result.gate_status, 'admitted');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.error_code, null);
  assert.equal(result.authority_ref?.ref_type, 'topic_question_contract');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');

  const contract = await ctx.topicQuestionRepository.findTopicQuestionContractById(result.authority_ref!.ref_id);
  assert.equal(contract?.status, 'active');
  const question = contract ? await ctx.topicQuestionRepository.findTopicQuestionById(contract.topic_question_id) : null;
  const plan = contract
    ? await ctx.topicQuestionRepository.findAnswerabilityPlanByContractId(contract.topic_question_contract_id)
    : null;
  const decision = contract
    ? await ctx.topicQuestionRepository.findSelectionDecisionById(contract.selection_decision_id)
    : null;
  assert.equal(question?.active_question_contract_id, result.authority_ref!.ref_id);
  assert.equal(plan?.answerability_verdict, 'answerable');
  assert.equal(decision?.decision, 'admit');

  const handoffArtifact = await ctx.controlPlane.getArtifactRef(result.handoff_ref!.ref_id);
  const handoff = handoffArtifact?.payload as TopicSelectionV1bWorkflowHarnessHandoff | null;
  const handoffPayload = handoff?.payload as {
    answerability_plan_ref?: TopicSelectionFunctionalRef;
    n8_debate_admission_ref?: TopicSelectionFunctionalRef;
    topic_question_contract_ref?: TopicSelectionFunctionalRef;
    trial_ledger_ref?: TopicSelectionFunctionalRef;
  } | null;
  assert.equal(handoff?.envelope.handoff_kind, 'N7ToN8Handoff');
  assert.equal(handoffPayload?.topic_question_contract_ref?.ref_id, result.authority_ref!.ref_id);
  assert.equal(handoffPayload?.answerability_plan_ref?.ref_id, plan?.topic_question_answerability_plan_id);
  assert.equal(handoffPayload?.trial_ledger_ref?.ref_id, decision?.topic_question_selection_decision_id);
  assert.equal(handoffPayload?.n8_debate_admission_ref?.ref_type, 'artifact_ref');

  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.equal(
    transitionRecord?.created_authority_refs.some((authorityRef) => authorityRef.ref_type === 'topic_value_assessment') ?? false,
    false,
  );
});

test('v1b workflow harness N7 accepts Codex grouping support but blocks unknown grouping refs', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n5 } = await runReadyN5(ctx);
  const n6Input = await n6Request(ctx, n5);
  const draft = await n6Draft(ctx, n6Input);
  const second = {
    ...draft.candidates[0]!,
    candidate_key: 'second_harness_candidate',
    main_question: 'How can a second WorkflowHarness candidate improve N7 grouping robustness?',
    expected_claim: 'A second candidate exercises deterministic grouping selection.',
  };
  const n6 = await ctx.service.invokeNode({
    ...n6Input,
    semantic_artifacts: [
      await recordN6DraftArtifact(ctx, n6Input, {
        ...draft,
        recommended_candidate_keys: ['harness_candidate', 'second_harness_candidate'],
        candidates: [draft.candidates[0]!, second],
      }),
    ],
  });
  const input = await n7Request(ctx, n6);
  const grouping = n7GroupingPayload(input);
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [
      await recordN7SupportArtifact(ctx, input, {
        allowed_effect: 'support_only',
        output_contract: 'CandidateGroupingSupport@v1',
        profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.n7_candidate_grouping_support,
        slot_id: 'n7_candidate_grouping',
      }, grouping as unknown as Record<string, unknown>),
      await recordN7SupportArtifact(ctx, input, {
        allowed_effect: 'support_only',
        output_contract: 'N8DebateAdmissionReviewSupport@v1',
        profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.n7_n8_debate_admission_support,
        slot_id: 'n7_n8_debate_admission_review',
      }, n7DebateAdmissionPayload({
        debate_level: 'provider_diverse_deep_debate',
        rationale: 'Escalate valuable second candidate to deep debate.',
      }) as unknown as Record<string, unknown>),
    ],
  });
  const contract = await ctx.topicQuestionRepository.findTopicQuestionContractById(result.authority_ref!.ref_id);
  assert.equal(contract?.source_candidate_id, grouping.selected_candidate_ref.ref_id);
  assert.ok(result.warnings.some((warning) => warning.code === 'candidate_grouping_preserved'));
  assert.ok(result.warnings.some((warning) => warning.code === 'n8_debate_level_selected'));

  const badCtx = await seedHarnessV1aBundle();
  const { n6: badN6 } = await runReadyN6(badCtx);
  const badInput = await n7Request(badCtx, badN6);
  const badGrouping: TopicSelectionV1bCandidateGroupingSupportPayload = {
    ...n7GroupingPayload(badInput),
    selected_candidate_ref: ref('topic_question_candidate', 'unknown_candidate', TITLE_CARD_ID),
    priority_order: [ref('topic_question_candidate', 'unknown_candidate', TITLE_CARD_ID)],
  };
  const blocked = await badCtx.service.invokeNode({
    ...badInput,
    semantic_artifacts: [
      await recordN7SupportArtifact(badCtx, badInput, {
        allowed_effect: 'support_only',
        output_contract: 'CandidateGroupingSupport@v1',
        profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.n7_candidate_grouping_support,
        slot_id: 'n7_candidate_grouping',
      }, badGrouping as unknown as Record<string, unknown>),
    ],
  });
  assert.equal(blocked.gate_status, 'blocked');
  assert.equal(blocked.error_code, 'N7_GROUPING_UNKNOWN_CANDIDATE_REF');
  assert.equal(blocked.authority_ref, null);
});

test('v1b workflow harness N7 consumes N8 feedback to select next candidate or loop back to N6', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n5 } = await runReadyN5(ctx);
  const n6Input = await n6Request(ctx, n5);
  const draft = await n6Draft(ctx, n6Input);
  const second = {
    ...draft.candidates[0]!,
    candidate_key: 'second_harness_candidate',
    main_question: 'How can N7 select a second candidate after N8 semantic failure feedback?',
    expected_claim: 'N7 can preserve failed feedback and select another admissible candidate.',
  };
  const n6 = await ctx.service.invokeNode({
    ...n6Input,
    semantic_artifacts: [
      await recordN6DraftArtifact(ctx, n6Input, {
        ...draft,
        recommended_candidate_keys: ['harness_candidate', 'second_harness_candidate'],
        candidates: [draft.candidates[0]!, second],
      }),
    ],
  });
  const initialInput = await n7Request(ctx, n6);
  const first = await ctx.service.invokeNode(initialInput);
  const feedbackInput = await n7FeedbackRequest(ctx, initialInput, first);
  const secondTrial = await ctx.service.invokeNode(feedbackInput);

  assert.equal(secondTrial.gate_status, 'admitted');
  assert.equal(secondTrial.route_decision, 'invoke_next');
  assert.equal(secondTrial.authority_ref?.ref_type, 'topic_question_contract');
  const firstHandoffArtifact = await ctx.controlPlane.getArtifactRef(first.handoff_ref!.ref_id);
  const firstHandoff = firstHandoffArtifact?.payload as unknown as TopicSelectionV1bWorkflowHarnessHandoff;
  const firstHandoffPayload = firstHandoff.payload as { active_candidate_ref: TopicSelectionFunctionalRef };
  const secondContract = await ctx.topicQuestionRepository.findTopicQuestionContractById(secondTrial.authority_ref!.ref_id);
  assert.notEqual(secondContract?.source_candidate_id, firstHandoffPayload.active_candidate_ref.ref_id);
  const candidates = await ctx.topicQuestionRepository.listCandidatesByCandidateSetId(n6.authority_ref!.ref_id);
  assert.equal(candidates.filter((candidate) => candidate.status === 'admitted').length, 1);
  assert.equal(candidates.filter((candidate) => candidate.status === 'rejected').length, 1);

  const exhaustedInput = await n7FeedbackRequest(ctx, initialInput, secondTrial);
  const synthesisPayload: TopicSelectionV1bN8FailedTrialSynthesisSupportPayload = {
    exhausted_candidate_refs: candidates.map((candidate) =>
      ref('topic_question_candidate', candidate.topic_question_candidate_id, TITLE_CARD_ID)),
    failure_reason_codes: ['value_not_supported'],
    synthesis_summary: 'Both N8 trials failed value support and should regenerate candidates.',
    n6_regeneration_hints: ['Add stronger value evidence before regenerating candidates.'],
    affected_refs: [n6.authority_ref!],
  };
  const exhausted = await ctx.service.invokeNode({
    ...exhaustedInput,
    semantic_artifacts: [
      await recordN7SupportArtifact(ctx, exhaustedInput, {
        allowed_effect: 'support_only',
        output_contract: 'N8FailedTrialSynthesisSupport@v1',
        profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.n7_failed_trial_synthesis_support,
        slot_id: 'n7_failed_trial_synthesis',
      }, synthesisPayload as unknown as Record<string, unknown>),
    ],
  });
  assert.equal(exhausted.gate_status, 'blocked');
  assert.equal(exhausted.error_code, 'N7_CANDIDATE_TRIALS_EXHAUSTED');
  assert.equal(exhausted.failure_class, 'semantic_non_pass');
  assert.equal(exhausted.route_decision, 'loopback');
  assert.equal(exhausted.handoff_ref, null);
  assert.equal(exhausted.authority_ref?.ref_type, 'topic_question_selection_decision');
});

test('v1b workflow harness N7 blocks technical N8 feedback and replays exact admitted result', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n6 } = await runReadyN6(ctx);
  const input = await n7Request(ctx, n6, {
    workflow_run_id: 'workflow_run_v1b_n7_replay',
    node_attempt_id: 'node_attempt_v1b_n7_replay',
  });
  const first = await ctx.service.invokeNode(input);
  const replay = await ctx.service.invokeNode(input);
  assert.equal(replay.replay_provenance?.replayed, true);
  assert.equal(replay.authority_ref?.ref_id, first.authority_ref?.ref_id);

  const technicalInput = await n7FeedbackRequest(ctx, input, first, 'technical_failure');
  const technical = await ctx.service.invokeNode(technicalInput);
  assert.equal(technical.gate_status, 'blocked');
  assert.equal(technical.error_code, 'N7_TECHNICAL_FEEDBACK_WRONG_TARGET');
  assert.equal(technical.authority_ref, null);
});

test('v1b workflow harness N8 creates value assessment from frozen value draft artifact', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n7 } = await runReadyN7(ctx);
  const input = await n8Request(ctx, n7);
  const draft = n8ValueDraft(input);
  const result = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN8ValueDraftArtifact(ctx, input, draft)],
  });

  assert.equal(result.gate_status, 'admitted_with_warnings');
  assert.equal(result.route_decision, 'invoke_next');
  assert.equal(result.error_code, null);
  assert.equal(result.authority_ref?.ref_type, 'topic_value_assessment');
  assert.equal(result.handoff_ref?.ref_type, 'artifact_ref');
  assert.match(result.hashes.authority_hash ?? '', /^[a-f0-9]{64}$/);

  const assessment = await ctx.valueAssessmentRepository.findAssessmentById(result.authority_ref!.ref_id);
  assert.equal(assessment?.readiness_status, 'ready');
  assert.equal(assessment?.legacy_verdict, 'promote');
  assert.equal(assessment?.hard_gates.length, TOPIC_SELECTION_VALUE_GATE_KEYS.length);
  assert.equal(assessment?.dimension_scores.length, TOPIC_SELECTION_VALUE_DIMENSIONS.length);
  const memo = assessment ? await ctx.valueAssessmentRepository.findReasoningMemoById(assessment.value_reasoning_memo_id) : null;
  assert.equal(memo?.recommendation, 'advance_to_package');

  const handoffArtifact = await ctx.controlPlane.getArtifactRef(result.handoff_ref!.ref_id);
  const handoff = handoffArtifact?.payload as TopicSelectionV1bWorkflowHarnessHandoff | null;
  assert.equal(handoff?.envelope.handoff_kind, 'N8ToN9Handoff');
  assert.equal((handoff?.payload as { topic_value_assessment_ref?: TopicSelectionFunctionalRef }).topic_value_assessment_ref?.ref_id, result.authority_ref!.ref_id);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.equal(
    transitionRecord?.created_authority_refs.some((authorityRef) => authorityRef.ref_type === 'value_disposition_decision') ?? false,
    false,
  );
});

test('v1b workflow harness N8 blocks missing value draft and risk-dropping drafts before authority write', async () => {
  const noDraftCtx = await seedHarnessV1aBundle();
  const { n7: noDraftN7 } = await runReadyN7(noDraftCtx);
  const noDraftInput = await n8Request(noDraftCtx, noDraftN7, {
    execution_spec: {
      execution_mode: 'codex_assisted',
      model_option_id: null,
    },
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_value_assessment_single_agent,
    run_mode: 'acceptance',
  });
  const noDraft = await noDraftCtx.service.invokeNode(noDraftInput);
  assert.equal(noDraft.gate_status, 'blocked');
  assert.equal(noDraft.error_code, 'N8_FROZEN_VALUE_DRAFT_ARTIFACT_REQUIRED');
  assert.equal(noDraft.authority_ref, null);

  const riskCtx = await seedHarnessV1aBundle({ openRecheck: true, acceptedRiskCoversRecheck: true });
  const { n7 } = await runReadyN7(riskCtx);
  const input = await n8Request(riskCtx, n7);
  const draft = n8ValueDraft(input, {
    accepted_risk_refs: [],
  });
  const riskDropped = await riskCtx.service.invokeNode({
    ...input,
    semantic_artifacts: [await recordN8ValueDraftArtifact(riskCtx, input, draft)],
  });
  assert.equal(riskDropped.gate_status, 'blocked');
  assert.equal(riskDropped.error_code, 'N8_VALUE_ASSESSMENT_DROPS_RISKS');
  assert.equal(riskDropped.authority_ref, null);
});

test('v1b workflow harness N8 rejects schema-valid-looking value drafts with extra gate or dimension drift', async () => {
  const gateCtx = await seedHarnessV1aBundle();
  const { n7: gateN7 } = await runReadyN7(gateCtx);
  const gateInput = await n8Request(gateCtx, gateN7);
  const gateBaseDraft = n8ValueDraft(gateInput);
  const gateDriftDraft = {
    ...gateBaseDraft,
    hard_gates: [
      ...gateBaseDraft.hard_gates,
      {
        gate_key: 'unsupported_value_gate',
        verdict: 'pass',
        severity: 'info',
        overridable_with_risk: false,
        rationale: 'This extra gate must not be admitted into authority.',
        refs: [gateBaseDraft.reasoning_memo.cited_refs[0]!],
      },
    ],
  } as unknown as TopicSelectionV1bTopicValueAssessmentDraftPayload;
  const gateDrift = await gateCtx.service.invokeNode({
    ...gateInput,
    semantic_artifacts: [await recordN8ValueDraftArtifact(gateCtx, gateInput, gateDriftDraft)],
  });
  assert.equal(gateDrift.gate_status, 'blocked');
  assert.equal(gateDrift.error_code, 'N8_VALUE_GATE_COVERAGE_INVALID');
  assert.equal(gateDrift.authority_ref, null);

  const dimensionCtx = await seedHarnessV1aBundle();
  const { n7: dimensionN7 } = await runReadyN7(dimensionCtx);
  const dimensionInput = await n8Request(dimensionCtx, dimensionN7);
  const dimensionBaseDraft = n8ValueDraft(dimensionInput);
  const dimensionDriftDraft = {
    ...dimensionBaseDraft,
    dimension_scores: [
      ...dimensionBaseDraft.dimension_scores,
      {
        dimension_key: 'unsupported_value_dimension',
        score: 77,
        rationale: 'This extra dimension must not be admitted into authority.',
        evidence_refs: [dimensionBaseDraft.reasoning_memo.cited_refs[0]!],
        uncertainty: 'medium',
      },
    ],
  } as unknown as TopicSelectionV1bTopicValueAssessmentDraftPayload;
  const dimensionDrift = await dimensionCtx.service.invokeNode({
    ...dimensionInput,
    semantic_artifacts: [await recordN8ValueDraftArtifact(dimensionCtx, dimensionInput, dimensionDriftDraft)],
  });
  assert.equal(dimensionDrift.gate_status, 'blocked');
  assert.equal(dimensionDrift.error_code, 'N8_VALUE_DIMENSION_COVERAGE_INVALID');
  assert.equal(dimensionDrift.authority_ref, null);
});

test('v1b workflow harness N9 creates advance disposition and N10 creates draft package plus v1c bundle', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n8 } = await runReadyN8(ctx);
  const n9Input = await n9Request(ctx, n8);
  const n9 = await ctx.service.invokeNode(n9Input);

  assert.equal(n9.gate_status, 'admitted_with_warnings');
  assert.equal(n9.route_decision, 'invoke_next');
  assert.equal(n9.authority_ref?.ref_type, 'value_disposition_decision');
  const decision = await ctx.valueAssessmentRepository.findDispositionDecisionById(n9.authority_ref!.ref_id);
  assert.equal(decision?.decision, 'advance_to_package');
  assert.ok(decision?.package_draft_input);
  assert.equal(n9.handoff_ref?.ref_type, 'artifact_ref');

  const n10Input = await n10Request(ctx, n9);
  const n10 = await ctx.service.invokeNode(n10Input);
  assert.equal(n10.gate_status, 'admitted_with_warnings');
  assert.equal(n10.route_decision, 'invoke_next');
  assert.equal(n10.authority_ref?.ref_type, 'topic_package');
  const pkg = await ctx.topicPackageRepository.findPackageById(n10.authority_ref!.ref_id);
  assert.equal(pkg?.package_readiness_status, 'ready_for_promotion_review');
  assert.equal(pkg ? hashPackageForHarness(pkg) : null, n10.hashes.authority_hash);
  const bundle = pkg ? await ctx.topicPackageRepository.findV1cInputBundleByPackageId(pkg.topic_package_id) : null;
  assert.equal(bundle?.bundle_status, 'ready_for_promotion_review');
  assert.equal(decision ? (await ctx.valueAssessmentRepository.findDispositionDecisionById(decision.value_disposition_decision_id))?.output_topic_package_id : null, pkg?.topic_package_id);
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n10.handoff_ref!.ref_id);
  const handoff = handoffArtifact?.payload as TopicSelectionV1bWorkflowHarnessHandoff | null;
  assert.equal(handoff?.envelope.handoff_kind, 'N10ToN11Handoff');

  const duplicateInput = await n10Request(ctx, n9, {
    workflow_run_id: 'workflow_run_v1b_n10_duplicate',
    node_attempt_id: 'node_attempt_v1b_n10_duplicate',
  });
  const duplicate = await ctx.service.invokeNode(duplicateInput);
  assert.equal(duplicate.gate_status, 'admitted_with_warnings');
  assert.equal(duplicate.authority_ref?.ref_id, n10.authority_ref?.ref_id);
  assert.equal(duplicate.warnings.some((warning) => warning.code === 'N10_PACKAGE_EXISTING_RETURNED'), true);
  assert.equal((await ctx.topicPackageRepository.listPackagesByTitleCardId(TITLE_CARD_ID)).length, 1);
});

test('v1b workflow harness N9 terminal non-advance prevents package creation handoff', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n7 } = await runReadyN7(ctx);
  const n8Input = await n8Request(ctx, n7);
  const draft = n8ValueDraft(n8Input, {
    readiness_status: 'needs_refinement',
    recommended_disposition: 'refine_question',
    reasoning_memo: {
      ...n8ValueDraft(n8Input).reasoning_memo,
      recommendation: 'refine_question',
      disposition_bridge: 'Refine the question before package creation.',
    },
    total_score: 58,
  });
  const n8 = await ctx.service.invokeNode({
    ...n8Input,
    semantic_artifacts: [await recordN8ValueDraftArtifact(ctx, n8Input, draft)],
  });
  assert.equal(n8.gate_status, 'admitted_with_warnings');

  const n9Input = await n9Request(ctx, n8);
  const n9 = await ctx.service.invokeNode(n9Input);
  assert.equal(n9.gate_status, 'terminal_no_advance');
  assert.equal(n9.failure_class, 'terminal_no_advance');
  assert.equal(n9.route_decision, 'blocked');
  assert.equal(n9.handoff_ref, null);
  const decision = await ctx.valueAssessmentRepository.findDispositionDecisionById(n9.authority_ref!.ref_id);
  assert.equal(decision?.decision, 'refine_question');
  assert.equal(decision?.package_draft_input, null);
  assert.deepEqual(await ctx.topicPackageRepository.listPackagesByTitleCardId(TITLE_CARD_ID), []);
});

test('v1b workflow harness N11 publishes v1c input bundle and closes N1-N11 service-level E2E', async () => {
  const ctx = await seedHarnessV1aBundle();
  const { n10, n11 } = await runReadyN11(ctx);

  assert.equal(n11.gate_status, 'admitted_with_warnings');
  assert.equal(n11.route_decision, 'stop_v1b_complete');
  assert.equal(n11.error_code, null);
  assert.equal(n11.authority_ref?.ref_type, 'v1b_to_v1c_input_bundle');
  assert.equal(n11.handoff_ref?.ref_type, 'artifact_ref');
  assert.match(n11.hashes.authority_hash ?? '', /^[a-f0-9]{64}$/);

  const pkg = await ctx.topicPackageRepository.findPackageById(n10.authority_ref!.ref_id);
  const bundle = await ctx.topicPackageRepository.findV1cInputBundleById(n11.authority_ref!.ref_id);
  assert.equal(bundle?.topic_package_id, pkg?.topic_package_id);
  assert.equal(bundle ? hashV1cBundleForHarness(bundle) : null, n11.hashes.authority_hash);
  const handoffArtifact = await ctx.controlPlane.getArtifactRef(n11.handoff_ref!.ref_id);
  const handoff = handoffArtifact?.payload as TopicSelectionV1bWorkflowHarnessHandoff | null;
  assert.equal(handoff?.envelope.handoff_kind, 'V1cInputBundle');
  assert.equal(handoff?.target_node_id, 'v1c.entry');
  const payload = handoff?.payload as {
    draft_topic_package_ref?: TopicSelectionFunctionalRef;
    v1c_input_bundle_ref?: TopicSelectionFunctionalRef;
  } | null;
  assert.equal(payload?.draft_topic_package_ref?.ref_id, pkg?.topic_package_id);
  assert.equal(payload?.v1c_input_bundle_ref?.ref_id, bundle?.v1b_to_v1c_input_bundle_id);
  assert.equal(JSON.stringify(bundle).includes('paper_project'), false);
  assert.equal(JSON.stringify(bundle).includes('promotion_decision'), false);

  const replay = await ctx.service.invokeNode(await n11Request(ctx, n10));
  assert.equal(replay.replay_provenance?.replayed, true);
  assert.equal(replay.authority_ref?.ref_id, n11.authority_ref?.ref_id);

  const sideEffectInput = await n11Request(ctx, n10, {
    workflow_run_id: 'workflow_run_v1b_n11_side_effect',
    node_attempt_id: 'node_attempt_v1b_n11_side_effect',
  });
  const sideEffectFrozenInput = {
    ...sideEffectInput.frozen_input,
    frozen_input_hash: null,
    payload: {
      ...sideEffectInput.frozen_input.payload,
      paper_project_ref: ref('paper_project', 'paper_project_001', TITLE_CARD_ID),
    },
  };
  const sideEffectResult = await ctx.service.invokeNode(request({
    ...sideEffectInput,
    frozen_input: sideEffectFrozenInput,
  }));
  assert.equal(sideEffectResult.gate_status, 'blocked');
  assert.equal(sideEffectResult.error_code, 'N11_FROZEN_PAYLOAD_INVALID');
  assert.equal(sideEffectResult.authority_ref, null);
});

test('v1b workflow harness N1 admitted replay is exact and changed frozen input detects drift', async () => {
  const ctx = await seedHarnessV1aBundle();
  const input = n1Request(ctx.bundle, {
    workflow_run_id: 'workflow_run_v1b_n1_replay',
    node_attempt_id: 'node_attempt_v1b_n1_replay',
  });
  const first = await ctx.service.invokeNode(input);
  const replay = await ctx.service.invokeNode(input);
  assert.equal(replay.replay_provenance?.replayed, true);
  assert.equal(replay.hashes.authority_hash, first.hashes.authority_hash);

  const drift = await ctx.service.invokeNode({
    ...input,
    frozen_input: {
      ...input.frozen_input,
      payload: {
        ...input.frozen_input.payload,
        source_refs_hash: 'b'.repeat(64),
      },
      frozen_input_hash: null,
    },
  });
  assert.equal(drift.error_code, 'REPLAY_INPUT_HASH_MISMATCH');
});

test('v1b workflow harness blocks model-like execution specs on deterministic nodes', async () => {
  const ctx = makeContext();
  const result = await ctx.service.invokeNode(request({
    node_id: 'topic-selection.v1b.assess-intake-readiness.v1',
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: 'topic-selection.v1b.readiness.invalid-provider',
    },
  }));

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'INVALID_NODE_PROVIDER_SPEC');
  assert.equal(result.authority_ref, null);
  assert.equal(result.handoff_ref, null);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    result.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, []);
});

test('v1b workflow harness rejects raw provider fields by request schema before persistence', async () => {
  const ctx = makeContext();
  const invalid = {
    ...request({
      node_id: 'topic-selection.v1b.assess-intake-readiness.v1',
    }),
    provider_id: 'openai',
  };

  await assert.rejects(
    () => ctx.service.invokeNode(invalid as TopicSelectionV1bWorkflowHarnessRunRequest),
    (error) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  assert.deepEqual(await ctx.controlPlane.listArtifactRefsByWorkflowRunId('workflow_run_v1b_harness_001'), []);
});

test('v1b workflow harness rejects invalid actor metadata before persistence', async () => {
  const ctx = makeContext();
  const invalidCreatedBy = request({
    created_by: 'provider' as TopicSelectionV1bWorkflowHarnessRunRequest['created_by'],
  });
  const invalidActor = request({
    workflow_run_id: 'workflow_run_v1b_harness_invalid_actor',
    actor: {
      actor_type: 'provider' as NonNullable<TopicSelectionV1bWorkflowHarnessRunRequest['actor']>['actor_type'],
    },
  });

  await assert.rejects(
    () => ctx.service.invokeNode(invalidCreatedBy),
    (error) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  await assert.rejects(
    () => ctx.service.invokeNode(invalidActor),
    (error) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  assert.deepEqual(await ctx.controlPlane.listArtifactRefsByWorkflowRunId('workflow_run_v1b_harness_001'), []);
  assert.deepEqual(await ctx.controlPlane.listArtifactRefsByWorkflowRunId('workflow_run_v1b_harness_invalid_actor'), []);
});

test('v1b workflow harness rejects malformed frozen source refs before persistence', async () => {
  const ctx = makeContext();
  const malformedFrozenInput: TopicSelectionV1bWorkflowHarnessRunRequest['frozen_input'] = {
    input_contract: 'N3ToN4Handoff@v1',
    snapshot_kind: 'v1b_intake_readiness_assessment',
    source_refs: [
      {
        ref_type: '',
        ref_id: 'readiness_001',
        title_card_id: TITLE_CARD_ID,
      },
    ],
    payload: {
      readiness_assessment_id: 'readiness_001',
    },
  };

  await assert.rejects(
    () => ctx.service.invokeNode(request({
      frozen_input: {
        ...malformedFrozenInput,
        frozen_input_hash: frozenInputHash(malformedFrozenInput),
      },
    })),
    (error) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  assert.deepEqual(await ctx.controlPlane.listArtifactRefsByWorkflowRunId('workflow_run_v1b_harness_001'), []);
});

test('v1b workflow harness blocks frozen input contract and snapshot drift before runner execution', async () => {
  const ctx = makeContext();
  const contractMismatch = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_contract_mismatch',
    node_attempt_id: 'node_attempt_v1b_contract_mismatch',
    frozen_input: {
      ...request().frozen_input,
      input_contract: 'N8ToN9Handoff@v1',
      frozen_input_hash: null,
    },
  }));
  assert.equal(contractMismatch.error_code, 'FROZEN_INPUT_CONTRACT_MISMATCH');
  assert.equal(contractMismatch.authority_ref, null);
  assert.equal(contractMismatch.handoff_ref, null);

  const snapshotMismatch = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_snapshot_mismatch',
    node_attempt_id: 'node_attempt_v1b_snapshot_mismatch',
    frozen_input: {
      ...request().frozen_input,
      snapshot_kind: 'topic_value_assessment',
      source_refs: [ref('topic_value_assessment', 'value_001')],
      frozen_input_hash: null,
    },
  }));
  assert.equal(snapshotMismatch.error_code, 'FROZEN_INPUT_SNAPSHOT_KIND_MISMATCH');

  const sourceRefMismatch = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_source_ref_mismatch',
    node_attempt_id: 'node_attempt_v1b_source_ref_mismatch',
    frozen_input: {
      ...request().frozen_input,
      source_refs: [ref('wrong_snapshot_kind', 'wrong_001')],
      frozen_input_hash: null,
    },
  }));
  assert.equal(sourceRefMismatch.error_code, 'FROZEN_INPUT_SOURCE_REF_KIND_MISMATCH');
});

test('v1b workflow harness rejects semantic artifact legacy refs before persistence', async () => {
  const ctx = makeContext();
  const input = request({
    workflow_run_id: 'workflow_run_v1b_semantic_legacy_ref',
    node_attempt_id: 'node_attempt_v1b_semantic_legacy_ref',
  });

  await assert.rejects(
    () => ctx.service.invokeNode({
      ...input,
      semantic_artifacts: [
        semanticArtifact(input, {
          support_artifact_ref: {
            ...ref('artifact_ref', 'support_with_legacy'),
            legacy_ref: { raw_provider_response: true },
          },
        }),
      ],
    }),
    (error) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  assert.deepEqual(await ctx.controlPlane.listArtifactRefsByWorkflowRunId(input.workflow_run_id), []);
});

test('v1b workflow harness accepts provider-mode execution spec shape on model-like nodes without invoking providers', async () => {
  const ctx = makeContext();
  const result = await ctx.service.invokeNode(request({
    node_id: 'topic-selection.v1b.assess-topic-value.v1',
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: providerModelOptionId('topic-selection.v1b.assess-topic-value.v1'),
    },
  }));

  assert.equal(result.gate_status, 'blocked');
  assert.equal(result.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');
  assert.equal(result.hashes.execution_spec_hash.length, 64);
});

test('v1b workflow harness admits model-like codex mocked and provider specs through registry-backed runtime shell', async () => {
  const ctx = makeContext();
  const nodeId: TopicSelectionV1bWorkflowHarnessNodeId = 'topic-selection.v1b.assess-topic-value.v1';
  const providerOptionId = providerModelOptionId(nodeId);

  const codex = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_codex_runtime_admission',
    node_attempt_id: 'node_attempt_v1b_codex_runtime_admission',
    node_id: nodeId,
    execution_spec: {
      execution_mode: 'codex_assisted',
      model_option_id: null,
    },
  }));
  assert.equal(codex.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');
  assert.equal(codex.hashes.runtime_admission_hash?.length, 64);

  const mocked = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_mock_runtime_admission',
    node_attempt_id: 'node_attempt_v1b_mock_runtime_admission',
    node_id: nodeId,
    run_mode: 'test',
    execution_spec: {
      execution_mode: 'mocked_llm',
      model_option_id: null,
    },
  }));
  assert.equal(mocked.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');
  assert.equal(mocked.hashes.runtime_admission_hash?.length, 64);

  const provider = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_provider_runtime_admission',
    node_attempt_id: 'node_attempt_v1b_provider_runtime_admission',
    node_id: nodeId,
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: providerOptionId,
    },
  }));
  assert.equal(provider.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');
  assert.equal(provider.hashes.runtime_admission_hash?.length, 64);
});

test('v1b workflow harness blocks missing model-like invocation and invalid provider/profile admission', async () => {
  const ctx = makeContext();
  const missingInvocation = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_missing_invocation',
    node_attempt_id: 'node_attempt_v1b_missing_invocation',
    execution_spec: null,
    run_mode: null,
    profile_id: null,
  }));
  assert.equal(missingInvocation.error_code, 'MISSING_INVOCATION_SLOT_INPUT');

  const artifactOnlyInput = request({
    workflow_run_id: 'workflow_run_v1b_artifact_only_invocation',
    node_attempt_id: 'node_attempt_v1b_artifact_only_invocation',
    node_id: 'topic-selection.v1b.assess-topic-value.v1',
    execution_spec: null,
    run_mode: null,
    profile_id: null,
  });
  const artifactOnly = await ctx.service.invokeNode({
    ...artifactOnlyInput,
    semantic_artifacts: [semanticArtifact(artifactOnlyInput)],
  });
  assert.equal(artifactOnly.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');

  const missingModelOption = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_missing_model_option',
    node_attempt_id: 'node_attempt_v1b_missing_model_option',
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: null,
    },
  }));
  assert.equal(missingModelOption.error_code, 'RUNTIME_MODEL_OPTION_REQUIRED');

  const disallowedProfile = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_disallowed_profile',
    node_attempt_id: 'node_attempt_v1b_disallowed_profile',
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_value_assessment_single_agent,
  }));
  assert.equal(disallowedProfile.error_code, 'RUNTIME_PROFILE_NOT_ALLOWED');
});

test('v1b workflow harness deterministic-only nodes reject semantic artifacts and execution specs', async () => {
  const ctx = makeContext();
  const semanticSourceInput = request({
    workflow_run_id: 'workflow_run_v1b_semantic_source',
    node_attempt_id: 'node_attempt_v1b_semantic_source',
  });
  const deterministicOnlyNodes: TopicSelectionV1bWorkflowHarnessNodeId[] = [
    'topic-selection.v1b.create-intake-snapshot.v1',
    'topic-selection.v1b.decide-value-disposition.v1',
    'topic-selection.v1b.create-draft-topic-package.v1',
    'topic-selection.v1b.publish-v1c-input-bundle.v1',
  ];

  for (const nodeId of deterministicOnlyNodes) {
    const base = request({
      workflow_run_id: `workflow_run_${nodeId.replaceAll('.', '_')}_deterministic_only`,
      node_attempt_id: `node_attempt_${nodeId.replaceAll('.', '_')}_deterministic_only`,
      node_id: nodeId,
    });
    const semanticResult = await ctx.service.invokeNode({
      ...base,
      semantic_artifacts: [
        semanticArtifact(semanticSourceInput, {
          node_id: nodeId,
          input_hash: base.frozen_input.frozen_input_hash!,
        }),
      ],
    });
    assert.equal(semanticResult.error_code, 'SEMANTIC_ARTIFACT_NOT_ALLOWED');

    const executionResult = await ctx.service.invokeNode({
      ...base,
      workflow_run_id: `${base.workflow_run_id}_execution_spec`,
      node_attempt_id: `${base.node_attempt_id}_execution_spec`,
      execution_spec: {
        execution_mode: 'provider_llm',
        model_option_id: 'topic-selection.v1b.invalid-provider',
      },
    });
    assert.equal(executionResult.error_code, 'INVALID_NODE_PROVIDER_SPEC');

    const runtimeResult = await ctx.service.invokeNode({
      ...base,
      workflow_run_id: `${base.workflow_run_id}_runtime_profile`,
      node_attempt_id: `${base.node_attempt_id}_runtime_profile`,
      run_mode: 'acceptance',
      profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.research_slice_options_single_agent,
    });
    assert.equal(runtimeResult.error_code, 'INVALID_NODE_RUNTIME_SPEC');
  }
});

test('v1b workflow harness delegated and support nodes reject provider specs but accept allowed Codex semantic artifacts', async () => {
  const ctx = makeContext();
  const nodes: TopicSelectionV1bWorkflowHarnessNodeId[] = [
    'topic-selection.v1b.record-research-constraint-profile.v1',
    'topic-selection.v1b.assess-intake-readiness.v1',
    'topic-selection.v1b.select-research-slice.v1',
    'topic-selection.v1b.materialize-topic-question-contract.v1',
  ];

  for (const nodeId of nodes) {
    const providerResult = await ctx.service.invokeNode(request({
      workflow_run_id: `workflow_run_${nodeId.replaceAll('.', '_')}_provider_reject`,
      node_attempt_id: `node_attempt_${nodeId.replaceAll('.', '_')}_provider_reject`,
      node_id: nodeId,
      execution_spec: {
        execution_mode: 'provider_llm',
        model_option_id: 'topic-selection.v1b.invalid-provider',
      },
    }));
    assert.equal(providerResult.error_code, 'INVALID_NODE_PROVIDER_SPEC');

    const input = request({
      workflow_run_id: `workflow_run_${nodeId.replaceAll('.', '_')}_codex_accept`,
      node_attempt_id: `node_attempt_${nodeId.replaceAll('.', '_')}_codex_accept`,
      node_id: nodeId,
      run_mode: 'acceptance',
      profile_id: slotSpecForNode(nodeId).profile_id,
    });
    const accepted = await ctx.service.invokeNode({
      ...input,
      semantic_artifacts: [semanticArtifact(input)],
    });
    assert.equal(accepted.error_code, 'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED');
    assert.equal(accepted.hashes.semantic_artifact_hash?.length, 64);
    assert.equal(accepted.authority_ref, null);
  }
});

test('v1b workflow harness model-like nodes accept allowed execution specs and semantic artifacts', async () => {
  const ctx = makeContext();
  const nodes: TopicSelectionV1bWorkflowHarnessNodeId[] = [
    'topic-selection.v1b.generate-research-slice-options.v1',
    'topic-selection.v1b.generate-topic-question-candidates.v1',
    'topic-selection.v1b.assess-topic-value.v1',
  ];

  for (const nodeId of nodes) {
    const modelOptionId = providerModelOptionId(nodeId);
    const input = request({
      workflow_run_id: `workflow_run_${nodeId.replaceAll('.', '_')}_model_like`,
      node_attempt_id: `node_attempt_${nodeId.replaceAll('.', '_')}_model_like`,
      node_id: nodeId,
      execution_spec: {
        execution_mode: 'provider_llm',
        model_option_id: modelOptionId,
      },
    });
    const result = await ctx.service.invokeNode({
      ...input,
      semantic_artifacts: [
        semanticArtifact(input, {
          execution_mode: 'provider_llm',
          model_option_id: modelOptionId,
        }),
      ],
    });
    assert.ok([
      'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED',
    ].includes(result.error_code ?? ''));
    assert.equal(result.hashes.execution_spec_hash.length, 64);
    assert.equal(result.hashes.semantic_artifact_hash?.length, 64);
  }
});

test('v1b workflow harness blocks wrong semantic slot node and effect with specific policy codes', async () => {
  const ctx = makeContext();
  const input = request({
    workflow_run_id: 'workflow_run_v1b_wrong_semantic_slot',
    node_attempt_id: 'node_attempt_v1b_wrong_semantic_slot',
    node_id: 'topic-selection.v1b.generate-research-slice-options.v1',
  });

  const wrongSlot = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [
      semanticArtifact(input, {
        slot_id: 'n8_value_assessment_draft',
      }),
    ],
  });
  assert.equal(wrongSlot.error_code, 'UNKNOWN_SEMANTIC_SUPPORT_SLOT');

  const wrongNode = await ctx.service.invokeNode({
    ...input,
    workflow_run_id: 'workflow_run_v1b_wrong_semantic_node',
    node_attempt_id: 'node_attempt_v1b_wrong_semantic_node',
    semantic_artifacts: [
      semanticArtifact(input, {
        node_id: 'topic-selection.v1b.generate-topic-question-candidates.v1',
      }),
    ],
  });
  assert.equal(wrongNode.error_code, 'SEMANTIC_ARTIFACT_NODE_MISMATCH');

  const wrongEffect = await ctx.service.invokeNode({
    ...input,
    workflow_run_id: 'workflow_run_v1b_wrong_semantic_effect',
    node_attempt_id: 'node_attempt_v1b_wrong_semantic_effect',
    semantic_artifacts: [
      semanticArtifact(input, {
        allowed_effect: 'support_only',
      }),
    ],
  });
  assert.equal(wrongEffect.error_code, 'SEMANTIC_ARTIFACT_EFFECT_NOT_ALLOWED');
});

test('v1b workflow harness exact replay returns existing trace result without writing a new trace', async () => {
  const ctx = makeContext();
  const input = request();
  const first = await ctx.service.invokeNode(input);
  const traceCountAfterFirst = (await ctx.controlPlane.listArtifactRefsByWorkflowRunId(input.workflow_run_id)).length;
  const replay = await ctx.service.invokeNode(input);
  const traceCountAfterReplay = (await ctx.controlPlane.listArtifactRefsByWorkflowRunId(input.workflow_run_id)).length;

  assert.equal(replay.replay_provenance?.replayed, true);
  assert.equal(replay.replay_identity.node_replay_key, first.replay_identity.node_replay_key);
  assert.equal(replay.harness_trace_artifact_ref?.ref_id, first.harness_trace_artifact_ref?.ref_id);
  assert.equal(traceCountAfterReplay, traceCountAfterFirst);
});

test('v1b workflow harness blocks changed input for an existing node attempt id', async () => {
  const ctx = makeContext();
  const input = request();
  const first = await ctx.service.invokeNode(input);

  const changedFrozenInput: TopicSelectionV1bWorkflowHarnessRunRequest['frozen_input'] = {
    input_contract: input.frozen_input.input_contract,
    snapshot_kind: input.frozen_input.snapshot_kind,
    source_refs: input.frozen_input.source_refs,
    payload: {
      readiness_assessment_id: 'readiness_001',
      warning_context: ['accepted_risk_carried_forward', 'changed_input'],
    },
  };
  const mismatch = await ctx.service.invokeNode(request({
    frozen_input: {
      ...changedFrozenInput,
      frozen_input_hash: frozenInputHash(changedFrozenInput),
    },
  }));

  assert.equal(mismatch.gate_status, 'blocked');
  assert.equal(mismatch.error_code, 'REPLAY_INPUT_HASH_MISMATCH');
  assert.notEqual(mismatch.replay_identity.node_replay_key, first.replay_identity.node_replay_key);
  const transitionRecord = await ctx.controlPlaneRepository.findChainTransitionAttemptById(
    mismatch.transition_attempt_ref!.ref_id,
  );
  assert.deepEqual(transitionRecord?.created_authority_refs, []);
});

test('v1b workflow harness distinguishes execution spec replay drift from input drift', async () => {
  const ctx = makeContext();
  const input = request({
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: `${TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.research_slice_options_single_agent}.openai-balanced`,
    },
  });
  await ctx.service.invokeNode(input);

  const mismatch = await ctx.service.invokeNode(request({
    execution_spec: {
      execution_mode: 'provider_llm',
      model_option_id: `${TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.research_slice_options_single_agent}.openai-quality`,
    },
  }));

  assert.equal(mismatch.gate_status, 'blocked');
  assert.equal(mismatch.error_code, 'REPLAY_EXECUTION_SPEC_HASH_MISMATCH');
  assert.match(mismatch.error_message ?? '', /execution_spec_hash/);
});

test('v1b workflow harness distinguishes runtime admission replay drift from input drift', async () => {
  const ctx = makeContext();
  const input = request({
    workflow_run_id: 'workflow_run_v1b_runtime_replay_drift',
    node_attempt_id: 'node_attempt_v1b_runtime_replay_drift',
    execution_spec: {
      execution_mode: 'codex_assisted',
      model_option_id: null,
    },
  });
  await ctx.service.invokeNode(input);

  const mismatch = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_runtime_replay_drift',
    node_attempt_id: 'node_attempt_v1b_runtime_replay_drift',
    execution_spec: {
      execution_mode: 'codex_assisted',
      model_option_id: null,
    },
    profile_id: TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_PROFILE_IDS.topic_question_candidates_single_agent,
  }));

  assert.equal(mismatch.gate_status, 'blocked');
  assert.equal(mismatch.error_code, 'REPLAY_RUNTIME_ADMISSION_HASH_MISMATCH');
  assert.match(mismatch.error_message ?? '', /runtime_admission_hash/);
});

test('v1b workflow harness distinguishes semantic artifact replay drift from input drift', async () => {
  const ctx = makeContext();
  const input = request({
    workflow_run_id: 'workflow_run_v1b_semantic_replay_drift',
    node_attempt_id: 'node_attempt_v1b_semantic_replay_drift',
  });
  await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [semanticArtifact(input)],
  });

  const mismatch = await ctx.service.invokeNode({
    ...input,
    semantic_artifacts: [
      semanticArtifact(input, {
        normalized_output_hash: 'f'.repeat(64),
      }),
    ],
  });

  assert.equal(mismatch.gate_status, 'blocked');
  assert.equal(mismatch.error_code, 'REPLAY_SEMANTIC_ARTIFACT_HASH_MISMATCH');
  assert.match(mismatch.error_message ?? '', /semantic_artifact_hash/);
});

test('v1b workflow harness semantic hashes are stable across fresh persistence ids', async () => {
  const ctx = makeContext();
  const first = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_harness_stable_hash_a',
  }));
  const second = await ctx.service.invokeNode(request({
    workflow_run_id: 'workflow_run_v1b_harness_stable_hash_b',
  }));

  assert.notEqual(first.gate_result_ref?.ref_id, second.gate_result_ref?.ref_id);
  assert.equal(first.replay_identity.node_replay_key, second.replay_identity.node_replay_key);
  assert.equal(first.hashes.gate_result_hash, second.hashes.gate_result_hash);
  assert.equal(first.hashes.route_hash, second.hashes.route_hash);
});

test('v1b workflow harness validates every node id through the shell without authority writes', async () => {
  const ctx = makeContext();
  for (const nodeId of TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_IDS) {
    const result = await ctx.service.invokeNode(request({
      workflow_run_id: `workflow_run_${nodeId.replaceAll('.', '_')}`,
      node_attempt_id: `node_attempt_${nodeId.replaceAll('.', '_')}`,
      node_id: nodeId as TopicSelectionV1bWorkflowHarnessNodeId,
    }));
    assert.equal(result.authority_ref, null);
    assert.equal(result.handoff_ref, null);
    assert.ok([
      'NODE_RUNNER_DEPENDENCY_NOT_CONFIGURED',
      'INVALID_NODE_PROVIDER_SPEC',
    ].includes(result.error_code ?? ''));
  }
});
