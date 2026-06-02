#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

import { InMemoryTopicSelectionV1cPromotionInputRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-promotion-input-repository.ts';
import { PrismaTopicSelectionControlPlaneRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-control-plane-repository.ts';
import { PrismaTopicSelectionPromptPacketCacheStore } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-prompt-packet-cache-store.ts';
import { PrismaTopicSelectionV1cHumanPromotionDecisionRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-v1c-human-promotion-decision-repository.ts';
import { PrismaTopicSelectionV1cPaperProjectBridgeRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-v1c-paper-project-bridge-repository.ts';
import { PrismaTopicSelectionV1cPromotionGateRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-v1c-promotion-gate-repository.ts';
import { TopicSelectionAgentOrchestratorService } from '../../apps/backend/src/services/topic-selection-agent-orchestrator-service.ts';
import { TopicSelectionControlPlaneService } from '../../apps/backend/src/services/topic-selection-control-plane-service.ts';
import { TopicSelectionModelProfileRegistryService } from '../../apps/backend/src/services/topic-selection-model-profile-registry-service.ts';
import { TopicSelectionPromptPacketCacheService } from '../../apps/backend/src/services/topic-selection-prompt-packet-cache-service.ts';
import {
  createTopicSelectionV1cAcceptanceGraph,
  TopicSelectionV1cAcceptanceTopicPackageRepository,
} from '../../apps/backend/src/services/topic-selection-v1c-acceptance-scenario-fixtures.ts';
import {
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER,
  TopicSelectionV1cN2BoundedDebateAdmissionService,
} from '../../apps/backend/src/services/topic-selection-v1c-n2-bounded-debate-admission-service.ts';
import { TopicSelectionV1cN2BoundedDebateRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n2-bounded-debate-runtime-service.ts';
import { TopicSelectionV1cN4DelegatedPromotionDecisionAdmissionService } from '../../apps/backend/src/services/topic-selection-v1c-n4-delegated-promotion-decision-admission-service.ts';
import { TopicSelectionV1cN4DelegatedPromotionDecisionRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n4-delegated-promotion-decision-runtime-service.ts';
import { TopicSelectionV1cHumanPromotionDecisionService } from '../../apps/backend/src/services/topic-selection-v1c-human-promotion-decision-service.ts';
import { TopicSelectionV1cPaperProjectBridgeService } from '../../apps/backend/src/services/topic-selection-v1c-paper-project-bridge-service.ts';
import { TopicSelectionV1cPromotionGateService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-gate-service.ts';
import { TopicSelectionV1cPromotionInputService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-input-service.ts';
import {
  TOPIC_SELECTION_V1C_DELEGATED_PROMOTION_DECISION_CANDIDATE_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const STARTED_AT = new Date();
const RUN_ID = process.env.TOPIC_SELECTION_V1C_N4_RUNTIME_SMOKE_RUN_ID?.trim()
  || `v1c-n4-runtime-smoke-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
const RUN_KEY = RUN_ID.replaceAll(/[^a-zA-Z0-9_]/g, '_');
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1c-n4-runtime-smoke', RUN_ID);

function createRunIdFactory() {
  const counts = new Map();
  return (prefix) => {
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    return `${prefix}_${RUN_KEY}_${String(next).padStart(3, '0')}`;
  };
}

function assertPromptPacketIndexModelMetadataOnly(prisma) {
  const fields = prisma._runtimeDataModel?.models?.TopicSelectionPromptPacketCacheIndex?.fields
    ?.map((field) => field.name);
  assert.ok(Array.isArray(fields), 'Expected Prisma runtime model metadata for TopicSelectionPromptPacketCacheIndex.');
  assert.ok(fields.includes('promptPacketHash'), 'Prompt packet index model metadata is incomplete.');
  for (const forbiddenField of [
    'messages',
    'promptPayload',
    'providerResponse',
    'providerResponsePayload',
    'providerTelemetry',
    'providerTelemetryPayload',
    'rawProviderLogs',
    'authorityPayload',
    'secret',
  ]) {
    assert.equal(fields.includes(forbiddenField), false, `Prompt packet index must not persist ${forbiddenField}.`);
  }
}

async function promptRowsForHashes(prisma, hashes) {
  return prisma.topicSelectionPromptPacketCacheIndex.findMany({
    where: { promptPacketHash: { in: [...hashes] } },
    select: {
      promptPacketHash: true,
      invocationSlotId: true,
      promptTemplateId: true,
      promptTemplateVersion: true,
      promptVariantKey: true,
      contextPolicyProfileId: true,
      outputContract: true,
      modelOptionId: true,
      qualityDecision: true,
      freshnessStatus: true,
      provenanceRef: true,
      redactedPromptArtifactRef: true,
      promptQualityReportRef: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

function summarizePromptRows(rows) {
  return rows.map((row) => ({
    prompt_packet_hash: row.promptPacketHash,
    invocation_slot_id: row.invocationSlotId,
    prompt_template_id: row.promptTemplateId,
    prompt_template_version: row.promptTemplateVersion,
    prompt_variant_key: row.promptVariantKey,
    context_policy_profile_id: row.contextPolicyProfileId,
    output_contract: row.outputContract,
    model_option_id: row.modelOptionId,
    quality_decision: row.qualityDecision,
    freshness_status: row.freshnessStatus,
    has_provenance_ref: Boolean(row.provenanceRef),
    has_redacted_prompt_artifact_ref: Boolean(row.redactedPromptArtifactRef),
    has_prompt_quality_report_ref: Boolean(row.promptQualityReportRef),
    created_at: row.createdAt.toISOString(),
  }));
}

function roleOutput(slot, handoff) {
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

function n4ConditionFromGateHandoff(handoff) {
  const topicPackageRef = handoff.support.source_refs.find((item) => item.ref_type === 'topic_package')
    ?? handoff.gate_check.source_refs.find((item) => item.ref_type === 'topic_package')
    ?? handoff.promotion_input_snapshot_ref;
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

function candidateOutput(handoff, overrides = {}) {
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

function createSubject(prisma) {
  const graph = createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      package_payload: {
        claim_ceiling: 'Correlation and mechanism claims only.',
      },
      recheck_request_refs: [],
    },
  });
  const idFactory = createRunIdFactory();
  const promotionInputService = new TopicSelectionV1cPromotionInputService({
    repository: new InMemoryTopicSelectionV1cPromotionInputRepository(),
    topicPackageRepository: new TopicSelectionV1cAcceptanceTopicPackageRepository(graph),
    idFactory,
    now: () => STARTED_AT.toISOString(),
  });
  const controlPlane = new TopicSelectionControlPlaneService(
    new PrismaTopicSelectionControlPlaneRepository(prisma),
    {
      idFactory,
      now: () => STARTED_AT.toISOString(),
    },
  );
  const modelProfileRegistry = new TopicSelectionModelProfileRegistryService();
  const promptPacketCache = new TopicSelectionPromptPacketCacheService({
    store: new PrismaTopicSelectionPromptPacketCacheStore(prisma, {
      allowMissingTableFallback: false,
      now: () => STARTED_AT,
    }),
  });
  const agentOrchestrator = new TopicSelectionAgentOrchestratorService({
    controlPlane,
    modelProfileRegistry,
    promptPacketCache,
    now: () => STARTED_AT.toISOString(),
  });
  const promotionGateService = new TopicSelectionV1cPromotionGateService({
    repository: new PrismaTopicSelectionV1cPromotionGateRepository(prisma),
    promotionInputService,
    idFactory,
    now: () => STARTED_AT.toISOString(),
  });
  const n2Runtime = new TopicSelectionV1cN2BoundedDebateRuntimeService(controlPlane, {
    agentOrchestrator,
    modelProfileRegistry,
  });
  const n4Runtime = new TopicSelectionV1cN4DelegatedPromotionDecisionRuntimeService(controlPlane, {
    agentOrchestrator,
    modelProfileRegistry,
  });
  const humanPromotionDecisionService = new TopicSelectionV1cHumanPromotionDecisionService({
    repository: new PrismaTopicSelectionV1cHumanPromotionDecisionRepository(prisma),
    promotionGateService,
    idFactory,
    now: () => STARTED_AT.toISOString(),
  });
  return {
    graph,
    promotionInputService,
    promotionGateService,
    humanPromotionDecisionService,
    paperProjectBridgeService: new TopicSelectionV1cPaperProjectBridgeService({
      repository: new PrismaTopicSelectionV1cPaperProjectBridgeRepository(prisma),
      humanPromotionDecisionService,
      idFactory,
      now: () => STARTED_AT.toISOString(),
    }),
    n2Runtime,
    n2Admission: new TopicSelectionV1cN2BoundedDebateAdmissionService(n2Runtime),
    n4Runtime,
    n4Admission: new TopicSelectionV1cN4DelegatedPromotionDecisionAdmissionService(n4Runtime),
  };
}

async function createPromotionInputSnapshot(subject) {
  return subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
}

async function createPromotionGate(subject, promotionInputSnapshotId) {
  const handoff = await subject.promotionInputService.getPromotionInputHandoff(promotionInputSnapshotId);
  const workflowRunId = `workflow_run_${RUN_KEY}_n2_bounded_debate`;
  const nodeAttemptId = `node_attempt_${RUN_KEY}_n2_bounded_debate`;
  const priorArtifacts = [];
  const candidates = [];
  let finalInvocation = null;

  for (const slot of TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER) {
    const generated = await subject.n2Runtime.generateRoleArtifact({
      handoff,
      slot_id: slot,
      prior_role_artifacts: priorArtifacts,
      workflow_run_id: workflowRunId,
      node_attempt_id: nodeAttemptId,
      execution_mode: 'codex_assisted',
      run_mode: 'acceptance',
      codex_response: {
        output: roleOutput(slot, handoff),
        operator_label: 'v1c-n4-runtime-smoke-n2-setup',
      },
      created_by: 'system',
    });
    assert.equal(generated.status, 'succeeded');
    if (generated.status !== 'succeeded') {
      assert.fail(`N2 setup runtime role blocked: ${JSON.stringify(generated.invocation_result)}`);
    }
    candidates.push({
      artifact: generated.role_artifact,
      structured_output: generated.structured_output,
    });
    priorArtifacts.push(generated.role_artifact);
    finalInvocation = generated.invocation_result;
  }

  const admitted = subject.n2Admission.admit({
    handoff,
    role_results: candidates,
  });
  assert.equal(admitted.admitted, true);
  if (!admitted.admitted) {
    assert.fail(`N2 setup admission blocked: ${JSON.stringify(admitted.blocker)}`);
  }
  assert.ok(finalInvocation?.provenance, 'N2 setup final invocation provenance is required.');
  assert.ok(finalInvocation?.audit_snapshot, 'N2 setup final invocation audit snapshot is required.');

  const support = await subject.promotionGateService.createPromotionDecisionSupportFromVerifiedRuntimeDraft({
    promotion_input_snapshot_id: promotionInputSnapshotId,
    verified_runtime_draft: {
      draft: admitted.promotion_support_draft,
      provenance: finalInvocation.provenance,
      telemetry: finalInvocation.provenance.telemetry ?? null,
      audit_snapshot: finalInvocation.audit_snapshot,
      admission_identity: admitted.admission_identity,
      admission_identity_hash: admitted.admission_identity_hash,
    },
  });
  const gate = await subject.promotionGateService.createPromotionGateCheckFromSupport({
    promotion_decision_support_id: support.promotion_decision_support.promotion_decision_support_id,
  });
  assert.equal(gate.promotion_gate_check.disposition, 'ready_for_human_decision');
  return {
    ...gate,
    supportBundle: support,
  };
}

async function runN4Runtime(subject, gate, options = {}) {
  const generated = await subject.n4Runtime.generateCandidate({
    gate_handoff: gate.handoff,
    workflow_run_id: `workflow_run_${RUN_KEY}_n4_delegated_decision`,
    node_attempt_id: `node_attempt_${RUN_KEY}_n4_delegated_decision`,
    execution_mode: 'codex_assisted',
    run_mode: 'acceptance',
    codex_response: {
      output: candidateOutput(gate.handoff, options.outputOverrides ?? {}),
      operator_label: options.operatorLabel ?? 'v1c-n4-runtime-smoke',
    },
    created_by: 'system',
  });
  if (generated.status !== 'succeeded') {
    assert.fail(`N4 runtime blocked: ${JSON.stringify(generated.invocation_result)}`);
  }
  return generated;
}

function admitN4(subject, gate, generated, overrides = {}) {
  return subject.n4Admission.admit({
    gate_handoff: gate.handoff,
    candidate_artifact: {
      ...generated.candidate_artifact,
      ...(overrides.artifactOverrides ?? {}),
    },
    candidate: {
      ...generated.structured_output,
      ...(overrides.candidateOverrides ?? {}),
    },
    human_actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    policy_version_id: 'topic-selection-v1c-n4-runtime-smoke-policy-v1',
  });
}

async function persistedAuthorityCounts(prisma) {
  return {
    human_promotion_decision: await prisma.topicSelectionHumanPromotionDecision.count({
      where: { id: { contains: RUN_KEY } },
    }),
    promotion_decision: await prisma.topicSelectionPromotionDecision.count({
      where: { id: { contains: RUN_KEY } },
    }),
    promotion_commitment_profile: await prisma.topicSelectionPromotionCommitmentProfile.count({
      where: { id: { contains: RUN_KEY } },
    }),
    paper_project_bridge: await prisma.topicSelectionPaperProjectBridge.count({
      where: { id: { contains: RUN_KEY } },
    }),
  };
}

async function buildSmokeManifest(prisma) {
  assertPromptPacketIndexModelMetadataOnly(prisma);
  const subject = createSubject(prisma);
  const promotionInputSnapshot = await createPromotionInputSnapshot(subject);
  const gate = await createPromotionGate(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  const beforeN4 = await persistedAuthorityCounts(prisma);

  const firstRuntime = await runN4Runtime(subject, gate);
  const admitted = admitN4(subject, gate, firstRuntime);
  assert.equal(admitted.admitted, true);
  if (!admitted.admitted) {
    assert.fail(`Expected N4 admission to pass: ${JSON.stringify(admitted.blocker)}`);
  }

  const afterAdmissionBeforeHuman = await persistedAuthorityCounts(prisma);
  assert.deepEqual(afterAdmissionBeforeHuman, beforeN4);
  const firstHumanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision(
    admitted.create_input,
  );
  const replayHumanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision(
    admitted.create_input,
  );
  assert.equal(
    replayHumanDecision.promotion_decision.promotion_decision_id,
    firstHumanDecision.promotion_decision.promotion_decision_id,
  );
  const afterHumanBeforeN5 = await persistedAuthorityCounts(prisma);
  assert.equal(afterHumanBeforeN5.human_promotion_decision, 1);
  assert.equal(afterHumanBeforeN5.promotion_decision, 1);
  assert.equal(afterHumanBeforeN5.promotion_commitment_profile, 1);
  assert.equal(afterHumanBeforeN5.paper_project_bridge, 0);

  const explicitBridge = await subject.paperProjectBridgeService.createPaperProjectBridge({
    promotion_decision_id: firstHumanDecision.promotion_decision.promotion_decision_id,
    workspace_id: 'workspace_001',
  });
  const replayBridge = await subject.paperProjectBridgeService.createPaperProjectBridge({
    promotion_decision_id: firstHumanDecision.promotion_decision.promotion_decision_id,
    workspace_id: 'workspace_001',
  });
  assert.equal(
    replayBridge.paper_project_bridge.paper_project_bridge_id,
    explicitBridge.paper_project_bridge.paper_project_bridge_id,
  );

  const promptRowsAfterFirst = await promptRowsForHashes(prisma, [
    firstRuntime.candidate_artifact.prompt_packet_hash,
  ]);
  assert.equal(promptRowsAfterFirst.length, 1);
  assert.equal(promptRowsAfterFirst[0].invocationSlotId, 'n4_delegated_promotion_decision_candidate');
  assert.equal(promptRowsAfterFirst[0].promptTemplateId, 'topic-selection-v1c-delegated-promotion-decision');
  assert.equal(promptRowsAfterFirst[0].promptTemplateVersion, '1');
  assert.equal(promptRowsAfterFirst[0].outputContract, 'TopicSelectionV1cDelegatedPromotionDecisionCandidate@v1');
  assert.equal(promptRowsAfterFirst[0].freshnessStatus, 'fresh');
  assert.ok(promptRowsAfterFirst[0].redactedPromptArtifactRef);
  assert.ok(promptRowsAfterFirst[0].promptQualityReportRef);

  const promptCacheReplay = await runN4Runtime(subject, gate, {
    operatorLabel: 'v1c-n4-runtime-smoke-prompt-cache-replay',
  });
  assert.equal(
    promptCacheReplay.candidate_artifact.prompt_packet_hash,
    firstRuntime.candidate_artifact.prompt_packet_hash,
  );
  assert.equal(
    promptCacheReplay.invocation_result.provenance.redacted_prompt_artifact_ref?.ref_id,
    firstRuntime.invocation_result.provenance.redacted_prompt_artifact_ref?.ref_id,
  );
  assert.equal(
    promptCacheReplay.invocation_result.provenance.prompt_quality_report_ref?.ref_id,
    firstRuntime.invocation_result.provenance.prompt_quality_report_ref?.ref_id,
  );
  const promptRowsAfterReplay = await promptRowsForHashes(prisma, [
    firstRuntime.candidate_artifact.prompt_packet_hash,
  ]);
  assert.equal(promptRowsAfterReplay.length, 1);

  const driftedAdmission = admitN4(subject, gate, firstRuntime, {
    artifactOverrides: {
      prompt_packet_hash: '0'.repeat(64),
    },
  });
  assert.equal(driftedAdmission.admitted, false);
  if (driftedAdmission.admitted) {
    assert.fail('Expected N4 prompt drift admission to block.');
  }
  assert.equal(driftedAdmission.blocker.code, 'N4_DELEGATED_DECISION_ARTIFACT_PROMPT_DRIFT');

  const afterExplicitN5 = await persistedAuthorityCounts(prisma);
  assert.equal(afterExplicitN5.paper_project_bridge, 1);

  return {
    schema_version: 'topic-selection-v1c-n4-runtime-smoke-summary-v0',
    run_id: RUN_ID,
    started_at: STARTED_AT.toISOString(),
    completed_at: new Date().toISOString(),
    status: 'pass',
    prisma: {
      prompt_index_model_metadata_only: true,
      human_promotion_decision_prisma_repository: 'PrismaTopicSelectionV1cHumanPromotionDecisionRepository',
      paper_project_bridge_prisma_repository: 'PrismaTopicSelectionV1cPaperProjectBridgeRepository',
      control_plane_prisma_repository: 'PrismaTopicSelectionControlPlaneRepository',
    },
    n4_runtime: {
      slot_id: firstRuntime.candidate_artifact.slot_id,
      runtime_provenance_class: firstRuntime.candidate_artifact.runtime_provenance_class,
      candidate_prompt_packet_hash: firstRuntime.candidate_artifact.prompt_packet_hash,
      admission_identity_hash: admitted.admission_identity_hash,
      human_promotion_decision_id: firstHumanDecision.human_promotion_decision.human_promotion_decision_id,
      promotion_decision_id: firstHumanDecision.promotion_decision.promotion_decision_id,
    },
    prompt_index: {
      rows_after_first: summarizePromptRows(promptRowsAfterFirst),
      row_count_after_prompt_cache_replay: promptRowsAfterReplay.length,
      prompt_cache_replay: {
        redacted_prompt_artifact_ref_reused:
          promptCacheReplay.invocation_result.provenance.redacted_prompt_artifact_ref?.ref_id
          === firstRuntime.invocation_result.provenance.redacted_prompt_artifact_ref?.ref_id,
        prompt_quality_report_ref_reused:
          promptCacheReplay.invocation_result.provenance.prompt_quality_report_ref?.ref_id
          === firstRuntime.invocation_result.provenance.prompt_quality_report_ref?.ref_id,
      },
    },
    replay: {
      human_decision_id_stable: replayHumanDecision.promotion_decision.promotion_decision_id
        === firstHumanDecision.promotion_decision.promotion_decision_id,
      bridge_id_stable: replayBridge.paper_project_bridge.paper_project_bridge_id
        === explicitBridge.paper_project_bridge.paper_project_bridge_id,
      prompt_index_row_count_stable: promptRowsAfterReplay.length === promptRowsAfterFirst.length,
    },
    drift: {
      blocked: true,
      blocker_code: driftedAdmission.blocker.code,
    },
    no_n5_bypass: {
      counts_before_n4_runtime: beforeN4,
      counts_after_runtime_admission_before_human: afterAdmissionBeforeHuman,
      counts_after_human_before_explicit_n5: afterHumanBeforeN5,
      explicit_n5_bridge_id: explicitBridge.paper_project_bridge.paper_project_bridge_id,
      counts_after_explicit_n5: afterExplicitN5,
    },
  };
}

async function writeManifest(manifest) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const manifestPath = path.join(ARTIFACT_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const manifest = await buildSmokeManifest(prisma);
    const manifestPath = await writeManifest(manifest);
    console.log(JSON.stringify({
      status: manifest.status,
      run_id: RUN_ID,
      manifest_path: manifestPath,
      prompt_index_row_count: manifest.prompt_index.rows_after_first.length,
      replay: manifest.replay,
      drift: manifest.drift,
      no_n5_bypass: manifest.no_n5_bypass,
    }, null, 2));
  } catch (error) {
    const manifest = {
      schema_version: 'topic-selection-v1c-n4-runtime-smoke-summary-v0',
      run_id: RUN_ID,
      started_at: STARTED_AT.toISOString(),
      completed_at: new Date().toISOString(),
      status: 'fail',
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : null,
    };
    const manifestPath = await writeManifest(manifest);
    console.error(`topic-selection v1c N4 runtime smoke failed; manifest written to ${manifestPath}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
