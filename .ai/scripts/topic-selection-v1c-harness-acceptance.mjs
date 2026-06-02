#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-downstream-feedback-recheck-repository.ts';
import { InMemoryTopicSelectionV1cHumanPromotionDecisionRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-human-promotion-decision-repository.ts';
import { InMemoryTopicSelectionV1cPaperProjectBridgeRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-paper-project-bridge-repository.ts';
import { InMemoryTopicSelectionV1cPromotionGateRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-promotion-gate-repository.ts';
import { InMemoryTopicSelectionV1cPromotionInputRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-promotion-input-repository.ts';
import { InMemoryTopicSelectionControlPlaneRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-control-plane-repository.ts';
import {
  TOPIC_SELECTION_V1C_DOWNSTREAM_FEEDBACK_CANDIDATE_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts.ts';
import {
  TOPIC_SELECTION_V1C_DELEGATED_PROMOTION_DECISION_CANDIDATE_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts.ts';
import {
  TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
  normalizeN1PromotionInputSnapshot,
  normalizeN2PromotionSupport,
  normalizeN3PromotionGate,
  normalizeN4HumanPromotionDecision,
  normalizeN5PaperProjectBridge,
  normalizeN6DownstreamFeedback,
} from '../../apps/backend/src/services/topic-selection-v1c-harness-adapter.ts';
import {
  createTopicSelectionV1cAcceptanceGraph,
  createTopicSelectionV1cAcceptanceIdFactory,
  TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  topicSelectionV1cAcceptanceRef,
  TopicSelectionV1cAcceptanceTopicPackageRepository,
} from '../../apps/backend/src/services/topic-selection-v1c-acceptance-scenario-fixtures.ts';
import { TopicSelectionControlPlaneService } from '../../apps/backend/src/services/topic-selection-control-plane-service.ts';
import {
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER,
  TopicSelectionV1cN2BoundedDebateAdmissionService,
} from '../../apps/backend/src/services/topic-selection-v1c-n2-bounded-debate-admission-service.ts';
import { TopicSelectionV1cN2BoundedDebateRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n2-bounded-debate-runtime-service.ts';
import { TopicSelectionV1cDownstreamFeedbackRecheckService } from '../../apps/backend/src/services/topic-selection-v1c-downstream-feedback-recheck-service.ts';
import { TopicSelectionV1cN4DelegatedPromotionDecisionAdmissionService } from '../../apps/backend/src/services/topic-selection-v1c-n4-delegated-promotion-decision-admission-service.ts';
import { TopicSelectionV1cN4DelegatedPromotionDecisionRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n4-delegated-promotion-decision-runtime-service.ts';
import { TopicSelectionV1cN6FeedbackNormalizationAdmissionService } from '../../apps/backend/src/services/topic-selection-v1c-n6-feedback-normalization-admission-service.ts';
import { TopicSelectionV1cN6FeedbackNormalizationRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n6-feedback-normalization-runtime-service.ts';
import { TopicSelectionV1cHumanPromotionDecisionService } from '../../apps/backend/src/services/topic-selection-v1c-human-promotion-decision-service.ts';
import { TopicSelectionV1cPaperProjectBridgeService } from '../../apps/backend/src/services/topic-selection-v1c-paper-project-bridge-service.ts';
import { TopicSelectionV1cPromotionGateService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-gate-service.ts';
import { TopicSelectionV1cPromotionInputService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-input-service.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const STARTED_AT = new Date().toISOString();
const RUN_ID = process.env.TOPIC_SELECTION_V1C_ACCEPTANCE_RUN_ID?.trim()
  || `v1c-harness-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1c-acceptance', RUN_ID);
const execFileAsync = promisify(execFile);

class RecordingPromotionInputRepository extends InMemoryTopicSelectionV1cPromotionInputRepository {
  writes = [];

  async createSnapshot(persistence) {
    this.writes.push(persistence);
    return super.createSnapshot(persistence);
  }
}

class RecordingPromotionGateRepository extends InMemoryTopicSelectionV1cPromotionGateRepository {
  writes = [];
  supportWrites = [];
  gateCheckWrites = [];

  async createBundle(persistence) {
    this.writes.push(persistence);
    return super.createBundle(persistence);
  }

  async createSupportBundle(persistence) {
    this.supportWrites.push(persistence);
    return super.createSupportBundle(persistence);
  }

  async createGateCheckBundle(persistence) {
    this.gateCheckWrites.push(persistence);
    return super.createGateCheckBundle(persistence);
  }
}

class RecordingHumanPromotionDecisionRepository extends InMemoryTopicSelectionV1cHumanPromotionDecisionRepository {
  writes = [];

  async createBundle(persistence) {
    this.writes.push(persistence);
    return super.createBundle(persistence);
  }
}

class RecordingPaperProjectBridgeRepository extends InMemoryTopicSelectionV1cPaperProjectBridgeRepository {
  writes = [];

  async createBridge(persistence) {
    this.writes.push(persistence);
    return super.createBridge(persistence);
  }
}

class RecordingDownstreamFeedbackRepository extends InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository {
  writes = [];

  async createFeedback(record) {
    this.writes.push(record);
    return super.createFeedback(record);
  }
}

class RecordingRecheckSink {
  calls = [];

  async recordDownstreamFeedback(input) {
    this.calls.push({
      source_ref: input.source_ref,
      affected_ref: input.affected_ref,
      feedback_type: input.feedback_type,
      reason_codes: input.reason_codes,
      summary: input.summary,
    });
    const suffix = String(this.calls.length).padStart(3, '0');
    return {
      event: {
        recheck_event_id: `recheck_event_${suffix}`,
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
      },
      impact: {
        recheck_impact_id: `recheck_impact_${suffix}`,
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
      },
      queue_item: {
        decision_work_queue_item_id: `decision_work_queue_item_${suffix}`,
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
      },
    };
  }
}

function createReadyGraph() {
  return createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      package_payload: {
        claim_ceiling: 'Correlation and mechanism claims only.',
      },
      recheck_request_refs: [],
    },
  });
}

function createActionRequiredGraph() {
  return createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      contribution_summary: '',
      package_payload: {
        claim_ceiling: 'Correlation and mechanism claims only.',
      },
      recheck_request_refs: [],
    },
  });
}

function createWorkflowSubject(graph = createReadyGraph()) {
  const promotionInputRepository = new RecordingPromotionInputRepository();
  const promotionGateRepository = new RecordingPromotionGateRepository();
  const humanPromotionDecisionRepository = new RecordingHumanPromotionDecisionRepository();
  const paperProjectBridgeRepository = new RecordingPaperProjectBridgeRepository();
  const downstreamFeedbackRepository = new RecordingDownstreamFeedbackRepository();
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const controlPlaneService = new TopicSelectionControlPlaneService(controlPlaneRepository, {
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const n2BoundedDebateRuntimeService = new TopicSelectionV1cN2BoundedDebateRuntimeService(controlPlaneService);
  const n2BoundedDebateAdmissionService = new TopicSelectionV1cN2BoundedDebateAdmissionService(
    n2BoundedDebateRuntimeService,
  );
  const n4DelegatedPromotionDecisionRuntimeService =
    new TopicSelectionV1cN4DelegatedPromotionDecisionRuntimeService(controlPlaneService);
  const n4DelegatedPromotionDecisionAdmissionService =
    new TopicSelectionV1cN4DelegatedPromotionDecisionAdmissionService(
      n4DelegatedPromotionDecisionRuntimeService,
    );
  const n6FeedbackNormalizationRuntimeService = new TopicSelectionV1cN6FeedbackNormalizationRuntimeService(
    controlPlaneService,
  );
  const n6FeedbackNormalizationAdmissionService = new TopicSelectionV1cN6FeedbackNormalizationAdmissionService(
    n6FeedbackNormalizationRuntimeService,
  );
  const recheckSink = new RecordingRecheckSink();
  const promotionInputService = new TopicSelectionV1cPromotionInputService({
    repository: promotionInputRepository,
    topicPackageRepository: new TopicSelectionV1cAcceptanceTopicPackageRepository(graph),
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const promotionGateService = new TopicSelectionV1cPromotionGateService({
    repository: promotionGateRepository,
    promotionInputService,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const humanPromotionDecisionService = new TopicSelectionV1cHumanPromotionDecisionService({
    repository: humanPromotionDecisionRepository,
    promotionGateService,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const paperProjectBridgeService = new TopicSelectionV1cPaperProjectBridgeService({
    repository: paperProjectBridgeRepository,
    humanPromotionDecisionService,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const downstreamFeedbackService = new TopicSelectionV1cDownstreamFeedbackRecheckService({
    repository: downstreamFeedbackRepository,
    paperProjectBridgeService,
    recheckRiskMemoryService: recheckSink,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  return {
    graph,
    promotionInputRepository,
    promotionGateRepository,
    humanPromotionDecisionRepository,
    paperProjectBridgeRepository,
    downstreamFeedbackRepository,
    controlPlaneRepository,
    controlPlaneService,
    n2BoundedDebateRuntimeService,
    n2BoundedDebateAdmissionService,
    n4DelegatedPromotionDecisionRuntimeService,
    n4DelegatedPromotionDecisionAdmissionService,
    n6FeedbackNormalizationRuntimeService,
    n6FeedbackNormalizationAdmissionService,
    recheckSink,
    promotionInputService,
    promotionGateService,
    humanPromotionDecisionService,
    paperProjectBridgeService,
    downstreamFeedbackService,
  };
}

function v1cN2BoundedDebateRoleOutput(slot, handoff) {
  const evidenceRefs = handoff.evidence_refs.map((item) => item.evidence_ref);
  const sourceRefs = [handoff.topic_package_ref, ...evidenceRefs];
  if (slot === 'n2_bounded_micro_debate.promotion_supporter_draft') {
    return {
      schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-role.v1',
      role_slot: slot,
      support_summary: 'Support draft preserves bounded claim, selected evidence, and carried obligations.',
      support_points: [{
        point_id: 'support_point_001',
        point: 'The topic package has selected evidence and a bounded evaluation plan.',
        source_refs: sourceRefs,
      }],
      risk_acknowledgements: handoff.accepted_risk_refs.map((riskRef) => ({
        risk_ref: riskRef,
        handling: 'Carry forward for deterministic gate and human review.',
      })),
      recheck_obligations: handoff.recheck_request_refs.map((recheckRef) => ({
        recheck_ref: recheckRef,
        handling: 'Preserve without automatic loopback.',
      })),
    };
  }
  if (slot === 'n2_bounded_micro_debate.reviewer_critic_review') {
    return {
      schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-role.v1',
      role_slot: slot,
      critic_findings: [{
        finding_id: 'critic_finding_001',
        severity: 'warning',
        issue: 'Final support must preserve claim ceiling, accepted risks, selected evidence, and recheck refs.',
        required_resolution: 'Address all required facts in the final N3 semantic layer.',
        source_refs: sourceRefs,
      }],
      required_repairs: ['Preserve accepted risk and recheck refs in the final semantic layer.'],
    };
  }
  if (slot === 'n2_bounded_micro_debate.promotion_supporter_repair') {
    return {
      schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-role.v1',
      role_slot: slot,
      repaired_summary: 'Repair addresses critic finding by adding explicit final semantic-layer coverage.',
      accepted_findings: ['critic_finding_001'],
      rebutted_findings: [],
      repair_actions: [{
        finding_id: 'critic_finding_001',
        resolution_status: 'accepted_and_repaired',
        repair_note: 'Added final semantic layer coverage for deterministic N3.',
        source_refs: sourceRefs,
      }],
    };
  }
  return {
    schema_version: 'topic-selection-v1c-n2-bounded-micro-debate-final.v1',
    role_slot: slot,
    final_support_summary: 'Final runtime-admitted support is ready for N3 deterministic gate review.',
    dossier_markdown: 'Runtime-admitted dossier preserves claim ceiling, selected evidence, accepted risks, and recheck obligations.',
    reviewer_questions: ['Are selected evidence refs still current before outline lock?'],
    risk_notes: handoff.accepted_risk_refs.map((riskRef) => `Accepted risk preserved: ${riskRef.ref_type}:${riskRef.ref_id}.`),
    recheck_notes: handoff.recheck_request_refs.map((recheckRef) => `Recheck obligation preserved: ${recheckRef.ref_type}:${recheckRef.ref_id}.`),
    n3_semantic_layer: {
      claim_ceiling_alignment: {
        status: 'addressed',
        summary: 'Correlation and mechanism claims only.',
        source_refs: [handoff.topic_question_contract_ref, handoff.topic_package_ref],
      },
      contribution_summary: {
        status: 'addressed',
        summary: 'A focused contribution summary is visible in the frozen package.',
        source_refs: [handoff.topic_package_ref],
      },
      evaluation_plan_summary: {
        status: 'addressed',
        summary: 'A bounded evaluation plan is visible in the frozen package.',
        source_refs: [handoff.topic_package_ref, handoff.answerability_plan_ref],
      },
      evidence_support_map: {
        status: 'addressed',
        evidence_refs: evidenceRefs,
      },
      accepted_risk_acknowledgements: {
        status: 'addressed',
        risk_refs: handoff.accepted_risk_refs,
      },
      recheck_obligation_summary: {
        status: handoff.recheck_request_refs.length > 0 ? 'addressed' : 'none_required',
        recheck_refs: handoff.recheck_request_refs,
      },
      critic_finding_resolution_map: [{
        finding_id: 'critic_finding_001',
        resolution_status: 'accepted_and_repaired',
        resolution_note: 'Handled in final semantic layer.',
        source_refs: sourceRefs,
      }],
      readiness_coverage_items: [
        { slot: 'claim_ceiling', status: 'addressed', source_refs: [handoff.topic_question_contract_ref] },
        { slot: 'selected_evidence', status: 'addressed', source_refs: evidenceRefs },
      ],
    },
  };
}

async function createN2BoundedDebateSupportBundle(subject, promotionInputSnapshotId) {
  const handoff = await subject.promotionInputService.getPromotionInputHandoff(promotionInputSnapshotId);
  const workflowRunId = `workflow_run_v1c_n2_bounded_debate_${promotionInputSnapshotId}`;
  const nodeAttemptId = `node_attempt_v1c_n2_bounded_debate_${promotionInputSnapshotId}`;
  const priorArtifacts = [];
  const candidates = [];
  let finalInvocation = null;

  for (const slot of TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER) {
    const output = v1cN2BoundedDebateRoleOutput(slot, handoff);
    const generated = await subject.n2BoundedDebateRuntimeService.generateRoleArtifact({
      handoff,
      slot_id: slot,
      prior_role_artifacts: priorArtifacts,
      workflow_run_id: workflowRunId,
      node_attempt_id: nodeAttemptId,
      execution_mode: 'codex_assisted',
      run_mode: 'acceptance',
      codex_response: {
        output,
        operator_label: 'v1c-harness-acceptance-n2-bounded-runtime',
      },
      created_by: 'system',
    });
    assert.equal(generated.status, 'succeeded');
    if (generated.status !== 'succeeded') {
      assert.fail(`N2 bounded runtime role blocked: ${JSON.stringify(generated.invocation_result)}`);
    }
    candidates.push({
      artifact: generated.role_artifact,
      structured_output: generated.structured_output,
    });
    priorArtifacts.push(generated.role_artifact);
    finalInvocation = generated.invocation_result;
  }

  const admitted = subject.n2BoundedDebateAdmissionService.admit({
    handoff,
    role_results: candidates,
  });
  assert.equal(admitted.admitted, true);
  if (!admitted.admitted) {
    assert.fail(`N2 bounded debate admission blocked: ${JSON.stringify(admitted.blocker)}`);
  }
  assert.ok(finalInvocation?.provenance, 'N2 bounded runtime final invocation provenance is required.');
  assert.ok(finalInvocation?.audit_snapshot, 'N2 bounded runtime final invocation audit snapshot is required.');

  const verifiedRuntimeDraft = {
    draft: admitted.promotion_support_draft,
    provenance: finalInvocation.provenance,
    telemetry: finalInvocation?.provenance?.telemetry ?? null,
    audit_snapshot: finalInvocation.audit_snapshot,
    admission_identity: admitted.admission_identity,
    admission_identity_hash: admitted.admission_identity_hash,
  };
  const supportBundle = await subject.promotionGateService.createPromotionDecisionSupportFromVerifiedRuntimeDraft({
    promotion_input_snapshot_id: promotionInputSnapshotId,
    verified_runtime_draft: verifiedRuntimeDraft,
  });
  return {
    supportBundle,
    handoff,
    role_candidates: candidates,
    final_artifact: admitted.final_artifact,
    final_output: admitted.final_output,
    final_invocation: finalInvocation,
    verified_runtime_draft: verifiedRuntimeDraft,
  };
}

function normalizeBoundedN2Support(boundedSupport) {
  return normalizeN2PromotionSupport({
    ...boundedSupport.supportBundle,
    provider_involved: boundedSupport.final_invocation?.provenance?.non_provider === false,
  });
}

function n4ConditionFromGateHandoff(handoff) {
  const topicPackageRef = handoff.support.source_refs.find((item) => item.ref_type === 'topic_package')
    ?? handoff.gate_check.source_refs.find((item) => item.ref_type === 'topic_package')
    ?? topicSelectionV1cAcceptanceRef('topic_package', 'topic_package_001', 'v1');
  const action = {
    action_code: 'clarify_contribution_claim',
    severity: 'warning',
    loopback_target: 'package',
    refs: [topicPackageRef],
    reason: 'Clarify contribution claim before outline lock.',
  };
  return {
    condition_id: 'promotion_condition_001',
    condition_code: 'clarify_contribution_claim',
    owner: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    required_action: action,
    refs: action.refs,
    early_check_obligations: ['Re-check contribution claim before outline lock.'],
    verification_note: 'Condition is reviewer-visible.',
  };
}

function v1cN4DelegatedPromotionDecisionCandidate(handoff, overrides = {}) {
  const condition = n4ConditionFromGateHandoff(handoff);
  return {
    schema_version: TOPIC_SELECTION_V1C_DELEGATED_PROMOTION_DECISION_CANDIDATE_SCHEMA_VERSION,
    promotion_gate_check_id: handoff.promotion_gate_check_id,
    promotion_input_snapshot_id: handoff.promotion_input_snapshot_id,
    promotion_input_snapshot_hash: handoff.promotion_input_snapshot_hash,
    workspace_id: handoff.gate_check.workspace_id ?? null,
    title_card_id: handoff.gate_check.title_card_id,
    decision: 'promote_with_conditions',
    rationale: 'Ready for bridge authorization with one explicit condition.',
    confirmed_snapshot_hash: handoff.promotion_input_snapshot_hash,
    conditions: [condition],
    required_actions: [],
    loopback_target: null,
    allowed_refinements: [],
    stop_conditions: [],
    reopen_conditions: [],
    cited_refs: [
      handoff.promotion_gate_check_ref,
      handoff.promotion_input_snapshot_ref,
      ...condition.refs,
    ],
    decision_support_refs: [
      handoff.promotion_gate_check_ref,
      handoff.promotion_input_snapshot_ref,
      handoff.promotion_decision_support_ref,
    ],
    no_authority_write_confirmed: true,
    no_bridge_creation_confirmed: true,
    human_review_required: true,
    ...overrides,
  };
}

async function createN4DelegatedPromotionDecisionInput(subject, gateSupport) {
  const output = v1cN4DelegatedPromotionDecisionCandidate(gateSupport.handoff);
  const beforeHumanDecisionWrites = subject.humanPromotionDecisionRepository.writes.length;
  const beforeBridgeWrites = subject.paperProjectBridgeRepository.writes.length;
  const generated = await subject.n4DelegatedPromotionDecisionRuntimeService.generateCandidate({
    gate_handoff: gateSupport.handoff,
    workflow_run_id: `workflow_run_v1c_n4_delegated_decision_${gateSupport.promotion_gate_check.promotion_gate_check_id}`,
    node_attempt_id: `node_attempt_v1c_n4_delegated_decision_${gateSupport.promotion_gate_check.promotion_gate_check_id}`,
    execution_mode: 'codex_assisted',
    run_mode: 'acceptance',
    codex_response: {
      output,
      operator_label: 'v1c-harness-acceptance-n4-delegated-runtime',
    },
    created_by: 'system',
  });
  assert.equal(generated.status, 'succeeded');
  if (generated.status !== 'succeeded') {
    assert.fail(`N4 delegated runtime candidate blocked: ${JSON.stringify(generated.invocation_result)}`);
  }
  const admitted = subject.n4DelegatedPromotionDecisionAdmissionService.admit({
    gate_handoff: gateSupport.handoff,
    candidate_artifact: generated.candidate_artifact,
    candidate: generated.structured_output,
    human_actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    policy_version_id: 'topic-selection-v1c-harness-n4-delegated-policy-v1',
  });
  assert.equal(admitted.admitted, true);
  if (!admitted.admitted) {
    assert.fail(`N4 delegated runtime candidate admission blocked: ${JSON.stringify(admitted.blocker)}`);
  }
  assert.equal(subject.humanPromotionDecisionRepository.writes.length, beforeHumanDecisionWrites);
  assert.equal(subject.paperProjectBridgeRepository.writes.length, beforeBridgeWrites);
  return {
    generated,
    admitted,
  };
}

async function createSplitGateSupport(subject, promotionInputSnapshotId) {
  const boundedSupport = await createN2BoundedDebateSupportBundle(subject, promotionInputSnapshotId);
  const supportBundle = boundedSupport.supportBundle;
  const gateBundle = await subject.promotionGateService.createPromotionGateCheckFromSupport({
    promotion_decision_support_id: supportBundle.promotion_decision_support.promotion_decision_support_id,
  });
  return {
    ...gateBundle,
    supportBundle,
    n2_bounded_runtime: boundedSupport,
  };
}

async function runHappyBridgeChain(subject = createWorkflowSubject()) {
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeBoundedN2Support(gateSupport.n2_bounded_runtime));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  const n4DelegatedRuntime = await createN4DelegatedPromotionDecisionInput(subject, gateSupport);
  const humanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision(
    n4DelegatedRuntime.admitted.create_input,
  );
  nodeTrace.push(normalizeN4HumanPromotionDecision(humanDecision));

  const bridge = await subject.paperProjectBridgeService.createPaperProjectBridge({
    promotion_decision_id: humanDecision.promotion_decision.promotion_decision_id,
  });
  nodeTrace.push(normalizeN5PaperProjectBridge({
    bridge: bridge.paper_project_bridge,
    handoff: bridge.handoff,
  }));

  return {
    subject,
    nodeTrace,
    promotionInputSnapshot,
    gateSupport,
    n4DelegatedRuntime,
    humanDecision,
    bridge,
  };
}

async function runActionRequiredStop() {
  const subject = createWorkflowSubject(createActionRequiredGraph());
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeBoundedN2Support(gateSupport.n2_bounded_runtime));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  assert.equal(gateSupport.promotion_gate_check.promote_allowed, false);
  assert.equal(subject.humanPromotionDecisionRepository.writes.length, 0);
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    gateSupport,
  };
}

async function runReadyGateOnly() {
  const subject = createWorkflowSubject();
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeBoundedN2Support(gateSupport.n2_bounded_runtime));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  assert.equal(gateSupport.promotion_gate_check.disposition, 'ready_for_human_decision');
  assert.equal(subject.humanPromotionDecisionRepository.writes.length, 0);
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    gateSupport,
  };
}

async function runN2SupportOnlyNoN3Bypass() {
  const subject = createWorkflowSubject();
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const boundedSupport = await createN2BoundedDebateSupportBundle(
    subject,
    promotionInputSnapshot.promotion_input_snapshot_id,
  );
  const n2Node = normalizeBoundedN2Support(boundedSupport);
  nodeTrace.push(n2Node);

  assert.equal(subject.promotionGateRepository.gateCheckWrites.length, 0);
  assert.equal(subject.humanPromotionDecisionRepository.writes.length, 0);
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  assert.equal(subject.downstreamFeedbackRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    n2Node,
    boundedSupport,
  };
}

async function runN4NoBridgeCreationScenario() {
  const subject = createWorkflowSubject();
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeBoundedN2Support(gateSupport.n2_bounded_runtime));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  const n4DelegatedRuntime = await createN4DelegatedPromotionDecisionInput(subject, gateSupport);
  const humanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision(
    n4DelegatedRuntime.admitted.create_input,
  );
  const n4Node = normalizeN4HumanPromotionDecision(humanDecision);
  nodeTrace.push(n4Node);

  assert.equal(n4Node.routing_outcome, 'bridge_authorized');
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  assert.equal(subject.downstreamFeedbackRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    gateSupport,
    n4DelegatedRuntime,
    humanDecision,
    n4Node,
  };
}

async function runReplayScenario() {
  const subject = createWorkflowSubject();
  const first = await runHappyBridgeChain(subject);
  const replayPromotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  const replaySupportBundle = await subject.promotionGateService.createPromotionDecisionSupportFromVerifiedRuntimeDraft({
    promotion_input_snapshot_id: replayPromotionInputSnapshot.promotion_input_snapshot_id,
    verified_runtime_draft: first.gateSupport.n2_bounded_runtime.verified_runtime_draft,
  });
  const replayGateBundle = await subject.promotionGateService.createPromotionGateCheckFromSupport({
    promotion_decision_support_id: replaySupportBundle.promotion_decision_support.promotion_decision_support_id,
  });
  const replayGateSupport = {
    ...replayGateBundle,
    supportBundle: replaySupportBundle,
    n2_bounded_runtime: first.gateSupport.n2_bounded_runtime,
  };
  const replayN4DelegatedRuntime = await createN4DelegatedPromotionDecisionInput(subject, replayGateSupport);
  const replayHumanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision(
    replayN4DelegatedRuntime.admitted.create_input,
  );
  const replayBridge = await subject.paperProjectBridgeService.createPaperProjectBridge({
    promotion_decision_id: replayHumanDecision.promotion_decision.promotion_decision_id,
  });
  const second = {
    promotionInputSnapshot: replayPromotionInputSnapshot,
    gateSupport: replayGateSupport,
    n4DelegatedRuntime: replayN4DelegatedRuntime,
    humanDecision: replayHumanDecision,
    bridge: replayBridge,
  };
  assert.equal(
    second.promotionInputSnapshot.promotion_input_snapshot_id,
    first.promotionInputSnapshot.promotion_input_snapshot_id,
  );
  assert.equal(
    second.gateSupport.promotion_gate_check.promotion_gate_check_id,
    first.gateSupport.promotion_gate_check.promotion_gate_check_id,
  );
  assert.equal(
    second.humanDecision.promotion_decision.promotion_decision_id,
    first.humanDecision.promotion_decision.promotion_decision_id,
  );
  assert.equal(
    second.bridge.paper_project_bridge.paper_project_bridge_id,
    first.bridge.paper_project_bridge.paper_project_bridge_id,
  );
  assert.deepEqual(workflowWriteCounts(subject), {
    promotion_input_snapshot: 1,
    promotion_decision_support: 1,
    promotion_gate_check: 1,
    human_promotion_decision: 1,
    paper_project_bridge: 1,
    downstream_feedback: 0,
    recheck_sink_calls: 0,
  });
  return {
    subject,
    first,
    second,
  };
}

function uniqueRefs(refs) {
  const seen = new Set();
  const result = [];
  for (const ref of refs) {
    if (!ref) {
      continue;
    }
    const key = JSON.stringify({
      ref_type: ref.ref_type,
      ref_id: ref.ref_id,
      title_card_id: ref.title_card_id ?? null,
      version_id: ref.version_id ?? null,
    });
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(ref);
  }
  return result;
}

function createN6FeedbackSource(handoff, spec) {
  return {
    paper_project_bridge_id: handoff.paper_project_bridge_id,
    workspace_id: spec.workspace_id ?? 'workspace_001',
    downstream_source_kind: spec.downstream_source_kind,
    downstream_source_ref: spec.downstream_source_ref,
    source_feedback_refs: spec.source_feedback_refs ?? [],
    observed_blocker_refs: spec.observed_blocker_refs ?? [],
    artifact_refs: spec.artifact_refs ?? [],
    raw_feedback_text: [
      spec.feedback_signal,
      spec.summary,
      spec.required_action ?? '',
    ].filter((item) => item.trim().length > 0).join('\n'),
    policy_version_id: spec.policy_version_id ?? null,
    created_by: spec.created_by ?? 'system',
  };
}

function createN6CandidateOutput(handoff, source, spec) {
  const requiresRecheck = spec.feedback_signal !== 'no_recheck_needed';
  return {
    schema_version: TOPIC_SELECTION_V1C_DOWNSTREAM_FEEDBACK_CANDIDATE_SCHEMA_VERSION,
    paper_project_bridge_id: handoff.paper_project_bridge_id,
    workspace_id: source.workspace_id ?? null,
    downstream_source_kind: source.downstream_source_kind,
    downstream_source_ref: source.downstream_source_ref,
    source_feedback_refs: source.source_feedback_refs ?? [],
    observed_blocker_refs: source.observed_blocker_refs ?? [],
    feedback_signal: spec.feedback_signal,
    severity: spec.severity,
    summary: spec.summary,
    required_action: spec.required_action ?? null,
    artifact_refs: source.artifact_refs ?? [],
    feedback_payload: {
      normalized_by: 'v1c_harness_acceptance_n6_runtime_fixture',
    },
    normalization_hints: {
      requires_recheck_hint: requiresRecheck,
      loopback_target_hint: null,
      affected_ref_hint: null,
      reason_codes: requiresRecheck ? [spec.feedback_signal] : [],
    },
    cited_refs: uniqueRefs([
      handoff.paper_project_bridge_ref,
      source.downstream_source_ref,
      ...(source.source_feedback_refs ?? []),
      ...(source.observed_blocker_refs ?? []),
      ...(source.artifact_refs ?? []),
    ]),
    no_upstream_mutation_confirmed: true,
  };
}

async function recordN6FeedbackThroughRuntime(chain, spec, suffix) {
  const handoff = chain.bridge.handoff;
  const source = createN6FeedbackSource(handoff, spec);
  const generated = await chain.subject.n6FeedbackNormalizationRuntimeService.generateCandidate({
    bridge_handoff: handoff,
    source,
    workflow_run_id: `workflow_run_v1c_n6_feedback_${suffix}`,
    node_attempt_id: `node_attempt_v1c_n6_feedback_${suffix}`,
    execution_mode: 'codex_assisted',
    run_mode: 'acceptance',
    codex_response: {
      output: createN6CandidateOutput(handoff, source, spec),
      operator_label: 'v1c-harness-acceptance-n6-feedback-normalization',
    },
    created_by: 'system',
  });
  assert.equal(generated.status, 'succeeded');
  if (generated.status !== 'succeeded') {
    assert.fail(`N6 feedback normalization runtime blocked: ${JSON.stringify(generated.invocation_result)}`);
  }
  const admitted = chain.subject.n6FeedbackNormalizationAdmissionService.admit({
    bridge_handoff: handoff,
    source,
    candidate_artifact: generated.candidate_artifact,
    candidate: generated.structured_output,
  });
  assert.equal(admitted.admitted, true);
  if (!admitted.admitted) {
    assert.fail(`N6 feedback normalization admission blocked: ${JSON.stringify(admitted.blocker)}`);
  }
  const feedback = await chain.subject.downstreamFeedbackService.recordDownstreamTopicFeedback(
    admitted.create_input,
  );
  return {
    source,
    generated,
    admitted,
    feedback,
  };
}

async function runN6NoRecheckScenario() {
  const chain = await runHappyBridgeChain();
  const beforeCounts = workflowWriteCounts(chain.subject);
  const runtimeFeedback = await recordN6FeedbackThroughRuntime(chain, {
    downstream_source_kind: 'reviewer_check',
    downstream_source_ref: topicSelectionV1cAcceptanceRef('reviewer_check', 'reviewer_check_no_recheck_001'),
    source_feedback_refs: [topicSelectionV1cAcceptanceRef('review_comment', 'review_comment_no_recheck_001')],
    feedback_signal: 'no_recheck_needed',
    severity: 'info',
    summary: 'Reviewer confirms the bridge remains usable without recheck.',
    created_by: 'system',
  }, 'no_recheck_001');
  const feedback = runtimeFeedback.feedback;
  const n6Node = normalizeN6DownstreamFeedback(feedback.downstream_topic_feedback);
  const afterCounts = workflowWriteCounts(chain.subject);
  assert.equal(n6Node.routing_outcome, 'feedback_recorded');
  assert.equal(feedback.recheck_request, null);
  assert.equal(afterCounts.downstream_feedback, beforeCounts.downstream_feedback + 1);
  assert.equal(afterCounts.recheck_sink_calls, beforeCounts.recheck_sink_calls);
  assert.deepEqual(
    {
      ...afterCounts,
      downstream_feedback: beforeCounts.downstream_feedback,
    },
    beforeCounts,
  );
  return {
    ...chain,
    ...runtimeFeedback,
    feedback,
    n6Node,
    beforeCounts,
    afterCounts,
  };
}

async function runN6NoAutoLoopScenario() {
  const chain = await runHappyBridgeChain();
  const beforeCounts = workflowWriteCounts(chain.subject);
  const runtimeFeedback = await recordN6FeedbackThroughRuntime(chain, {
    downstream_source_kind: 'reviewer_check',
    downstream_source_ref: topicSelectionV1cAcceptanceRef('reviewer_check', 'reviewer_check_001'),
    source_feedback_refs: [topicSelectionV1cAcceptanceRef('review_comment', 'review_comment_001')],
    feedback_signal: 'stale_evidence',
    severity: 'blocking',
    summary: 'The selected evidence is stale for the current paper framing.',
    required_action: 'Refresh selected evidence before continuing.',
    created_by: 'system',
  }, 'stale_evidence_001');
  const feedback = runtimeFeedback.feedback;
  const n6Node = normalizeN6DownstreamFeedback(feedback.downstream_topic_feedback);
  const afterCounts = workflowWriteCounts(chain.subject);
  assert.deepEqual(
    {
      ...afterCounts,
      downstream_feedback: beforeCounts.downstream_feedback,
      recheck_sink_calls: beforeCounts.recheck_sink_calls,
    },
    beforeCounts,
  );
  assert.equal(afterCounts.downstream_feedback, 1);
  assert.equal(afterCounts.recheck_sink_calls, 1);
  return {
    ...chain,
    ...runtimeFeedback,
    feedback,
    n6Node,
    beforeCounts,
    afterCounts,
  };
}

async function buildManifest() {
  const nodeTrace = [];
  const rowResults = [];

  const happy = await runHappyBridgeChain();
  nodeTrace.push(...happy.nodeTrace);
  assert.deepEqual(workflowWriteCounts(happy.subject), {
    promotion_input_snapshot: 1,
    promotion_decision_support: 1,
    promotion_gate_check: 1,
    human_promotion_decision: 1,
    paper_project_bridge: 1,
    downstream_feedback: 0,
    recheck_sink_calls: 0,
  });
  rowResults.push(rowPass('X-01', 'forward_only_happy_chain', happy.nodeTrace, {
    bridge_id: happy.bridge.paper_project_bridge.paper_project_bridge_id,
    bridge_payload_hash: happy.bridge.paper_project_bridge.bridge_payload_hash,
  }));
  rowResults.push(rowPass('N1-01', 'ready_snapshot', happy.nodeTrace.filter((node) => node.node_id === 'N1'), {
    promotion_input_snapshot_id: happy.promotionInputSnapshot.promotion_input_snapshot_id,
  }));
  rowResults.push(rowPass('N2-01', 'bounded_runtime_support_admitted', happy.nodeTrace.filter((node) => node.node_id === 'N2'), {
    promotion_decision_support_id: happy.gateSupport.supportBundle.promotion_decision_support.promotion_decision_support_id,
    final_slot_id: happy.gateSupport.n2_bounded_runtime.final_artifact.slot_id,
    final_prompt_packet_hash: happy.gateSupport.n2_bounded_runtime.final_artifact.prompt_packet_hash,
    runtime_role_count: happy.gateSupport.n2_bounded_runtime.role_candidates.length,
    runtime_provenance_class: happy.gateSupport.n2_bounded_runtime.final_artifact.runtime_provenance_class,
  }));
  rowResults.push(rowPass('N3-01', 'ready_gate_happy_path', happy.nodeTrace.filter((node) => node.node_id === 'N3'), {
    promotion_gate_check_id: happy.gateSupport.promotion_gate_check.promotion_gate_check_id,
  }));
  rowResults.push(rowPass('N4-01', 'bridge_authorized_happy_path', happy.nodeTrace.filter((node) => node.node_id === 'N4'), {
    promotion_decision_id: happy.humanDecision.promotion_decision.promotion_decision_id,
    candidate_prompt_packet_hash: happy.n4DelegatedRuntime.generated.candidate_artifact.prompt_packet_hash,
    runtime_provenance_class: happy.n4DelegatedRuntime.generated.candidate_artifact.runtime_provenance_class,
    admission_identity_hash: happy.n4DelegatedRuntime.admitted.admission_identity_hash,
    runtime_allowed_effect: happy.n4DelegatedRuntime.generated.candidate_artifact.allowed_effect,
  }));
  rowResults.push(rowPass('N5-01', 'bridge_ready_happy_path', happy.nodeTrace.filter((node) => node.node_id === 'N5'), {
    paper_project_bridge_id: happy.bridge.paper_project_bridge.paper_project_bridge_id,
  }));
  rowResults.push(rowPass('N5-10', 'no_downstream_side_effect', happy.nodeTrace.filter((node) => node.node_id === 'N5'), {
    downstream_feedback_writes: happy.subject.downstreamFeedbackRepository.writes.length,
    recheck_sink_calls: happy.subject.recheckSink.calls.length,
    paper_project_boundary: 'not_entered_by_v1c_harness_acceptance',
  }));

  const stop = await runActionRequiredStop();
  nodeTrace.push(...stop.nodeTrace);
  rowResults.push(rowPass('X-03', 'stop_outcomes', stop.nodeTrace, {
    n3_required_action_count: stop.gateSupport.promotion_gate_check.required_actions.length,
    human_decision_writes: stop.subject.humanPromotionDecisionRepository.writes.length,
    bridge_writes: stop.subject.paperProjectBridgeRepository.writes.length,
  }));
  rowResults.push(rowPass('N3-06', 'mini_check_gaps', stop.nodeTrace.filter((node) => node.node_id === 'N3'), {
    disposition: stop.gateSupport.promotion_gate_check.disposition,
  }));

  const readyGateOnly = await runReadyGateOnly();
  nodeTrace.push(...readyGateOnly.nodeTrace);
  rowResults.push(rowPass('N3-08', 'ready_is_not_promote', readyGateOnly.nodeTrace.filter((node) => node.node_id === 'N3'), {
    promotion_gate_check_id: readyGateOnly.gateSupport.promotion_gate_check.promotion_gate_check_id,
    human_decision_writes: readyGateOnly.subject.humanPromotionDecisionRepository.writes.length,
    bridge_writes: readyGateOnly.subject.paperProjectBridgeRepository.writes.length,
  }));

  const n2Only = await runN2SupportOnlyNoN3Bypass();
  nodeTrace.push(...n2Only.nodeTrace);
  rowResults.push(rowPass('N2-10', 'support_only_no_n3_bypass', [n2Only.n2Node], {
    promotion_decision_support_id: n2Only.boundedSupport.supportBundle.promotion_decision_support.promotion_decision_support_id,
    gate_check_writes: n2Only.subject.promotionGateRepository.gateCheckWrites.length,
    human_decision_writes: n2Only.subject.humanPromotionDecisionRepository.writes.length,
    bridge_writes: n2Only.subject.paperProjectBridgeRepository.writes.length,
    downstream_feedback_writes: n2Only.subject.downstreamFeedbackRepository.writes.length,
  }));

  const n4NoBridge = await runN4NoBridgeCreationScenario();
  nodeTrace.push(...n4NoBridge.nodeTrace);
  rowResults.push(rowPass('N4-11', 'no_bridge_creation', [n4NoBridge.n4Node], {
    promotion_decision_id: n4NoBridge.humanDecision.promotion_decision.promotion_decision_id,
    bridge_writes: n4NoBridge.subject.paperProjectBridgeRepository.writes.length,
    downstream_feedback_writes: n4NoBridge.subject.downstreamFeedbackRepository.writes.length,
    candidate_prompt_packet_hash: n4NoBridge.n4DelegatedRuntime.generated.candidate_artifact.prompt_packet_hash,
    admission_identity_hash: n4NoBridge.n4DelegatedRuntime.admitted.admission_identity_hash,
    runtime_allowed_effect: n4NoBridge.n4DelegatedRuntime.generated.candidate_artifact.allowed_effect,
  }));

  const replay = await runReplayScenario();
  rowResults.push(rowPass('X-06', 'replay_no_duplicate_writes', replay.first.nodeTrace, {
    persistence_summary: workflowWriteCounts(replay.subject),
    replay_bridge_id: replay.second.bridge.paper_project_bridge.paper_project_bridge_id,
    replay_n4_candidate_prompt_packet_hash:
      replay.second.n4DelegatedRuntime.generated.candidate_artifact.prompt_packet_hash,
    replay_n4_admission_identity_hash: replay.second.n4DelegatedRuntime.admitted.admission_identity_hash,
  }));

  const n6NoRecheck = await runN6NoRecheckScenario();
  nodeTrace.push(...n6NoRecheck.nodeTrace, n6NoRecheck.n6Node);
  rowResults.push(rowPass('N6-02', 'structured_no_recheck', [n6NoRecheck.n6Node], {
    feedback_id: n6NoRecheck.feedback.downstream_topic_feedback.downstream_topic_feedback_id,
    recheck_request_id: n6NoRecheck.feedback.recheck_request?.downstream_recheck_request_id ?? null,
    candidate_prompt_packet_hash: n6NoRecheck.generated.candidate_artifact.prompt_packet_hash,
    runtime_provenance_class: n6NoRecheck.generated.candidate_artifact.runtime_provenance_class,
    admission_identity_hash: n6NoRecheck.admitted.admission_identity_hash,
    before_counts: n6NoRecheck.beforeCounts,
    after_counts: n6NoRecheck.afterCounts,
  }));

  const n6 = await runN6NoAutoLoopScenario();
  nodeTrace.push(...n6.nodeTrace, n6.n6Node);
  rowResults.push(rowPass('X-09', 'n6_no_auto_loop', [n6.n6Node], {
    before_counts: n6.beforeCounts,
    after_counts: n6.afterCounts,
  }));
  rowResults.push(rowPass('N6-01', 'structured_recheck_happy_path', [n6.n6Node], {
    feedback_id: n6.feedback.downstream_topic_feedback.downstream_topic_feedback_id,
    recheck_request_id: n6.feedback.recheck_request?.downstream_recheck_request_id ?? null,
    candidate_prompt_packet_hash: n6.generated.candidate_artifact.prompt_packet_hash,
    runtime_provenance_class: n6.generated.candidate_artifact.runtime_provenance_class,
    admission_identity_hash: n6.admitted.admission_identity_hash,
  }));
  rowResults.push(rowPass('N6-10', 'no_upstream_mutation_auto_loop', [n6.n6Node], {
    unchanged_upstream_counts: {
      promotion_input_snapshot: n6.afterCounts.promotion_input_snapshot === n6.beforeCounts.promotion_input_snapshot,
      promotion_decision_support: n6.afterCounts.promotion_decision_support === n6.beforeCounts.promotion_decision_support,
      promotion_gate_check: n6.afterCounts.promotion_gate_check === n6.beforeCounts.promotion_gate_check,
      human_promotion_decision: n6.afterCounts.human_promotion_decision === n6.beforeCounts.human_promotion_decision,
      paper_project_bridge: n6.afterCounts.paper_project_bridge === n6.beforeCounts.paper_project_bridge,
    },
    recheck_sink_calls: n6.afterCounts.recheck_sink_calls,
  }));

  const persistenceSummary = mergePersistenceSummaries([
    workflowWriteCounts(happy.subject),
    workflowWriteCounts(stop.subject),
    workflowWriteCounts(readyGateOnly.subject),
    workflowWriteCounts(n2Only.subject),
    workflowWriteCounts(n4NoBridge.subject),
    workflowWriteCounts(replay.subject),
    workflowWriteCounts(n6NoRecheck.subject),
    workflowWriteCounts(n6.subject),
  ]);
  const gitSha = await resolveGitSha();

  return {
    schema_version: 'topic-selection-v1c-acceptance-manifest-v0',
    run_id: RUN_ID,
    adapter_version: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
    created_at: new Date().toISOString(),
    started_at: STARTED_AT,
    completed_at: new Date().toISOString(),
    command: `node ${process.argv.slice(1).join(' ')}`,
    git_sha: gitSha,
    selected_gate: process.env.TOPIC_SELECTION_V1C_ACCEPTANCE_GATE?.trim() || 'local',
    environment_status: {
      node_version: process.version,
      ts_node_project: process.env.TS_NODE_PROJECT ?? null,
      real_codex: 'not_applicable_deterministic_runner',
    },
    profile_versions: {
      harness_adapter: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
      deterministic_acceptance: 'topic-selection-v1c-deterministic-acceptance-v0',
    },
    status: 'pass',
    row_results: rowResults,
    node_trace: nodeTrace,
    persistence_summary: persistenceSummary,
    evidence_files: [
      path.join(ARTIFACT_DIR, 'manifest.json'),
      path.join(ARTIFACT_DIR, 'acceptance-row-results.jsonl'),
      path.join(ARTIFACT_DIR, 'row-results.json'),
      path.join(ARTIFACT_DIR, 'harness-trace.json'),
      path.join(ARTIFACT_DIR, 'node-trace.json'),
      path.join(ARTIFACT_DIR, 'persistence-summary.json'),
    ],
    pending_gaps: [],
  };
}

async function resolveGitSha() {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function workflowWriteCounts(subject) {
  return {
    promotion_input_snapshot: subject.promotionInputRepository.writes.length,
    promotion_decision_support: subject.promotionGateRepository.writes.length
      + subject.promotionGateRepository.supportWrites.length,
    promotion_gate_check: subject.promotionGateRepository.writes.length
      + subject.promotionGateRepository.gateCheckWrites.length,
    human_promotion_decision: subject.humanPromotionDecisionRepository.writes.length,
    paper_project_bridge: subject.paperProjectBridgeRepository.writes.length,
    downstream_feedback: subject.downstreamFeedbackRepository.writes.length,
    recheck_sink_calls: subject.recheckSink.calls.length,
  };
}

function rowPass(rowId, scenario, nodes, evidence) {
  return {
    row_id: rowId,
    status: 'pass',
    scenario,
    node_ids: nodes.map((node) => node.node_id),
    routing_outcomes: nodes.map((node) => node.routing_outcome),
    evidence,
    notes: nodes.flatMap((node) => node.notes),
  };
}

function mergePersistenceSummaries(summaries) {
  const merged = {};
  for (const summary of summaries) {
    for (const [key, value] of Object.entries(summary)) {
      if (Number.isNaN(value)) {
        continue;
      }
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

async function writeManifest(manifest) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const acceptanceRowResultsJsonlPath = path.join(ARTIFACT_DIR, 'acceptance-row-results.jsonl');
  const rowResultsPath = path.join(ARTIFACT_DIR, 'row-results.json');
  const harnessTracePath = path.join(ARTIFACT_DIR, 'harness-trace.json');
  const nodeTracePath = path.join(ARTIFACT_DIR, 'node-trace.json');
  const persistenceSummaryPath = path.join(ARTIFACT_DIR, 'persistence-summary.json');
  const manifestPath = path.join(ARTIFACT_DIR, 'manifest.json');
  await fs.writeFile(
    acceptanceRowResultsJsonlPath,
    `${manifest.row_results.map((row) => JSON.stringify(row)).join('\n')}\n`,
    'utf8',
  );
  await fs.writeFile(rowResultsPath, `${JSON.stringify(manifest.row_results, null, 2)}\n`, 'utf8');
  await fs.writeFile(harnessTracePath, `${JSON.stringify(manifest.node_trace, null, 2)}\n`, 'utf8');
  await fs.writeFile(nodeTracePath, `${JSON.stringify(manifest.node_trace, null, 2)}\n`, 'utf8');
  await fs.writeFile(
    persistenceSummaryPath,
    `${JSON.stringify(manifest.persistence_summary, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

async function main() {
  try {
    const manifest = await buildManifest();
    const manifestPath = await writeManifest(manifest);
    console.log(JSON.stringify({
      status: manifest.status,
      run_id: manifest.run_id,
      manifest_path: manifestPath,
      row_count: manifest.row_results.length,
      node_trace_count: manifest.node_trace.length,
    }, null, 2));
  } catch (error) {
    const gitSha = await resolveGitSha();
    const manifest = {
      schema_version: 'topic-selection-v1c-acceptance-manifest-v0',
      run_id: RUN_ID,
      adapter_version: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
      created_at: new Date().toISOString(),
      started_at: STARTED_AT,
      completed_at: new Date().toISOString(),
      command: `node ${process.argv.slice(1).join(' ')}`,
      git_sha: gitSha,
      selected_gate: process.env.TOPIC_SELECTION_V1C_ACCEPTANCE_GATE?.trim() || 'local',
      environment_status: {
        node_version: process.version,
        ts_node_project: process.env.TS_NODE_PROJECT ?? null,
        real_codex: 'not_applicable_deterministic_runner',
      },
      profile_versions: {
        harness_adapter: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
        deterministic_acceptance: 'topic-selection-v1c-deterministic-acceptance-v0',
      },
      status: 'fail',
      row_results: [{
        row_id: 'runner-failure',
        status: 'fail',
        scenario: 'topic-selection-v1c-harness-acceptance',
        node_ids: [],
        routing_outcomes: [],
        evidence: {
          error_message: error instanceof Error ? error.message : String(error),
          error_stack: error instanceof Error ? error.stack : null,
        },
        notes: ['Runner failed before completing deterministic acceptance.'],
      }],
      node_trace: [],
      persistence_summary: {},
      evidence_files: [
        path.join(ARTIFACT_DIR, 'manifest.json'),
        path.join(ARTIFACT_DIR, 'acceptance-row-results.jsonl'),
        path.join(ARTIFACT_DIR, 'row-results.json'),
        path.join(ARTIFACT_DIR, 'harness-trace.json'),
        path.join(ARTIFACT_DIR, 'node-trace.json'),
        path.join(ARTIFACT_DIR, 'persistence-summary.json'),
      ],
      pending_gaps: [],
    };
    const manifestPath = await writeManifest(manifest);
    console.error(`topic-selection v1c harness acceptance failed; manifest written to ${manifestPath}`);
    process.exitCode = 1;
  }
}

await main();
