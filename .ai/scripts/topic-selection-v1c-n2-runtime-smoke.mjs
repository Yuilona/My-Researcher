#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

import { InMemoryTopicSelectionV1cPromotionInputRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-promotion-input-repository.ts';
import { PrismaTopicSelectionControlPlaneRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-control-plane-repository.ts';
import { PrismaTopicSelectionPromptPacketCacheStore } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-prompt-packet-cache-store.ts';
import { PrismaTopicSelectionV1cPromotionGateRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-v1c-promotion-gate-repository.ts';
import {
  createTopicSelectionV1cAcceptanceGraph,
  TopicSelectionV1cAcceptanceTopicPackageRepository,
} from '../../apps/backend/src/services/topic-selection-v1c-acceptance-scenario-fixtures.ts';
import { TopicSelectionAgentOrchestratorService } from '../../apps/backend/src/services/topic-selection-agent-orchestrator-service.ts';
import { TopicSelectionControlPlaneService } from '../../apps/backend/src/services/topic-selection-control-plane-service.ts';
import { TopicSelectionModelProfileRegistryService } from '../../apps/backend/src/services/topic-selection-model-profile-registry-service.ts';
import { TopicSelectionPromptPacketCacheService } from '../../apps/backend/src/services/topic-selection-prompt-packet-cache-service.ts';
import {
  TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER,
  TopicSelectionV1cN2BoundedDebateAdmissionService,
} from '../../apps/backend/src/services/topic-selection-v1c-n2-bounded-debate-admission-service.ts';
import { TopicSelectionV1cN2BoundedDebateRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n2-bounded-debate-runtime-service.ts';
import { TopicSelectionV1cPromotionGateService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-gate-service.ts';
import { TopicSelectionV1cPromotionInputService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-input-service.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const STARTED_AT = new Date();
const RUN_ID = process.env.TOPIC_SELECTION_V1C_N2_RUNTIME_SMOKE_RUN_ID?.trim()
  || `v1c-n2-runtime-smoke-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
const RUN_KEY = RUN_ID.replaceAll(/[^a-zA-Z0-9_]/g, '_');
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1c-n2-runtime-smoke', RUN_ID);

function createRunIdFactory() {
  const counts = new Map();
  return (prefix) => {
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    return `${prefix}_${RUN_KEY}_${String(next).padStart(3, '0')}`;
  };
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
  const n2Runtime = new TopicSelectionV1cN2BoundedDebateRuntimeService(controlPlane, {
    agentOrchestrator,
    modelProfileRegistry,
  });
  return {
    graph,
    promotionInputService,
    promotionGateService: new TopicSelectionV1cPromotionGateService({
      repository: new PrismaTopicSelectionV1cPromotionGateRepository(prisma),
      promotionInputService,
      idFactory,
      now: () => STARTED_AT.toISOString(),
    }),
    n2Runtime,
    n2Admission: new TopicSelectionV1cN2BoundedDebateAdmissionService(n2Runtime),
  };
}

async function createPromotionInputSnapshot(subject) {
  return subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
}

async function runN2Runtime(subject, promotionInputSnapshotId, options = {}) {
  const handoff = await subject.promotionInputService.getPromotionInputHandoff(promotionInputSnapshotId);
  const workflowRunId = `workflow_run_${RUN_KEY}_n2_bounded_debate`;
  const nodeAttemptId = `node_attempt_${RUN_KEY}_n2_bounded_debate`;
  const priorArtifacts = [];
  const candidates = [];
  const invocations = [];
  let finalInvocation = null;

  for (const slot of TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER) {
    const output = {
      ...roleOutput(slot, handoff),
      ...(options.outputOverrides?.[slot] ?? {}),
    };
    const generated = await subject.n2Runtime.generateRoleArtifact({
      handoff,
      slot_id: slot,
      prior_role_artifacts: priorArtifacts,
      workflow_run_id: workflowRunId,
      node_attempt_id: nodeAttemptId,
      execution_mode: 'codex_assisted',
      run_mode: 'acceptance',
      codex_response: {
        output,
        operator_label: 'v1c-n2-runtime-smoke',
      },
      created_by: 'system',
    });
    assert.equal(generated.status, 'succeeded');
    if (generated.status !== 'succeeded') {
      assert.fail(`N2 runtime role blocked: ${JSON.stringify(generated.invocation_result)}`);
    }
    candidates.push({
      artifact: {
        ...generated.role_artifact,
        ...(options.artifactOverrides?.[slot] ?? {}),
      },
      structured_output: generated.structured_output,
    });
    priorArtifacts.push(generated.role_artifact);
    invocations.push(generated.invocation_result);
    finalInvocation = generated.invocation_result;
  }

  const admitted = subject.n2Admission.admit({
    handoff,
    role_results: candidates,
  });
  return {
    handoff,
    candidates,
    invocations,
    admitted,
    final_invocation: finalInvocation,
    prompt_packet_hashes: candidates.map((candidate) => candidate.artifact.prompt_packet_hash),
  };
}

async function replayFirstN2SlotForPromptCache(subject, promotionInputSnapshotId) {
  const handoff = await subject.promotionInputService.getPromotionInputHandoff(promotionInputSnapshotId);
  const slot = 'n2_bounded_micro_debate.promotion_supporter_draft';
  const generated = await subject.n2Runtime.generateRoleArtifact({
    handoff,
    slot_id: slot,
    prior_role_artifacts: [],
    workflow_run_id: `workflow_run_${RUN_KEY}_n2_bounded_debate`,
    node_attempt_id: `node_attempt_${RUN_KEY}_n2_bounded_debate`,
    execution_mode: 'codex_assisted',
    run_mode: 'acceptance',
    codex_response: {
      output: roleOutput(slot, handoff),
      operator_label: 'v1c-n2-runtime-smoke-prompt-cache-replay',
    },
    created_by: 'system',
  });
  assert.equal(generated.status, 'succeeded');
  if (generated.status !== 'succeeded') {
    assert.fail(`N2 prompt cache replay role blocked: ${JSON.stringify(generated.invocation_result)}`);
  }
  return generated;
}

async function createVerifiedSupport(subject, runtimeResult, promotionInputSnapshotId) {
  assert.equal(runtimeResult.admitted.admitted, true);
  if (!runtimeResult.admitted.admitted) {
    assert.fail(`Expected N2 admission to pass: ${JSON.stringify(runtimeResult.admitted.blocker)}`);
  }
  assert.ok(runtimeResult.final_invocation?.provenance, 'N2 final invocation provenance is required.');
  assert.ok(runtimeResult.final_invocation?.audit_snapshot, 'N2 final invocation audit snapshot is required.');
  return subject.promotionGateService.createPromotionDecisionSupportFromVerifiedRuntimeDraft({
    promotion_input_snapshot_id: promotionInputSnapshotId,
    verified_runtime_draft: {
      draft: runtimeResult.admitted.promotion_support_draft,
      provenance: runtimeResult.final_invocation.provenance,
      telemetry: runtimeResult.final_invocation.provenance.telemetry ?? null,
      audit_snapshot: runtimeResult.final_invocation.audit_snapshot,
      admission_identity: runtimeResult.admitted.admission_identity,
      admission_identity_hash: runtimeResult.admitted.admission_identity_hash,
    },
  });
}

async function buildSmokeManifest(prisma) {
  assertPromptPacketIndexModelMetadataOnly(prisma);
  const subject = createSubject(prisma);
  const promotionInputSnapshot = await createPromotionInputSnapshot(subject);

  const firstRuntime = await runN2Runtime(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  assert.equal(firstRuntime.admitted.admitted, true);
  const supportOnly = await createVerifiedSupport(subject, firstRuntime, promotionInputSnapshot.promotion_input_snapshot_id);
  const gateBefore = await prisma.topicSelectionPromotionGateCheck.findUnique({
    where: { supportRunKey: supportOnly.promotion_decision_support.support_run_key },
  });
  assert.equal(gateBefore, null, 'N2 support persistence must not create N3 gate check.');

  const promptRowsAfterFirst = await promptRowsForHashes(prisma, firstRuntime.prompt_packet_hashes);
  assert.equal(promptRowsAfterFirst.length, TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER.length);
  assert.deepEqual(
    promptRowsAfterFirst.map((row) => row.invocationSlotId).sort(),
    [...TOPIC_SELECTION_V1C_N2_BOUNDED_DEBATE_ROLE_ORDER].sort(),
  );
  for (const row of promptRowsAfterFirst) {
    assert.equal(row.promptTemplateId, 'topic-selection-v1c-promotion-support-bounded-micro-debate');
    assert.equal(row.promptTemplateVersion, '1');
    assert.equal(row.outputContract, 'TopicSelectionV1cBoundedMicroDebateRoleOrFinal@v1');
    assert.equal(row.freshnessStatus, 'fresh');
    assert.ok(row.redactedPromptArtifactRef);
    assert.ok(row.promptQualityReportRef);
  }

  const replaySupport = await createVerifiedSupport(subject, firstRuntime, promotionInputSnapshot.promotion_input_snapshot_id);
  assert.equal(
    replaySupport.promotion_decision_support.promotion_decision_support_id,
    supportOnly.promotion_decision_support.promotion_decision_support_id,
  );
  const promptRowsAfterReplay = await promptRowsForHashes(prisma, firstRuntime.prompt_packet_hashes);
  assert.equal(promptRowsAfterReplay.length, promptRowsAfterFirst.length);

  const promptCacheReplay = await replayFirstN2SlotForPromptCache(
    subject,
    promotionInputSnapshot.promotion_input_snapshot_id,
  );
  assert.equal(
    promptCacheReplay.role_artifact.prompt_packet_hash,
    firstRuntime.candidates[0].artifact.prompt_packet_hash,
  );
  assert.equal(
    promptCacheReplay.invocation_result.provenance.redacted_prompt_artifact_ref?.ref_id,
    firstRuntime.invocations[0].provenance.redacted_prompt_artifact_ref?.ref_id,
  );
  assert.equal(
    promptCacheReplay.invocation_result.provenance.prompt_quality_report_ref?.ref_id,
    firstRuntime.invocations[0].provenance.prompt_quality_report_ref?.ref_id,
  );
  const promptRowsAfterPromptCacheReplay = await promptRowsForHashes(prisma, firstRuntime.prompt_packet_hashes);
  assert.equal(promptRowsAfterPromptCacheReplay.length, promptRowsAfterFirst.length);

  const gate = await subject.promotionGateService.createPromotionGateCheckFromSupport({
    promotion_decision_support_id: supportOnly.promotion_decision_support.promotion_decision_support_id,
  });
  assert.equal(gate.promotion_gate_check.disposition, 'ready_for_human_decision');
  const replayGate = await subject.promotionGateService.createPromotionGateCheckFromSupport({
    promotion_decision_support_id: supportOnly.promotion_decision_support.promotion_decision_support_id,
  });
  assert.equal(replayGate.promotion_gate_check.promotion_gate_check_id, gate.promotion_gate_check.promotion_gate_check_id);

  const driftRuntime = await runN2Runtime(subject, promotionInputSnapshot.promotion_input_snapshot_id, {
    artifactOverrides: {
      'n2_bounded_micro_debate.synthesizer_final': {
        prompt_packet_hash: '0'.repeat(64),
      },
    },
  });
  assert.equal(driftRuntime.admitted.admitted, false);
  if (driftRuntime.admitted.admitted) {
    assert.fail('Expected prompt drift admission to block.');
  }
  assert.equal(driftRuntime.admitted.blocker.code, 'N2_BOUNDED_DEBATE_ARTIFACT_PROMPT_DRIFT');

  return {
    schema_version: 'topic-selection-v1c-n2-runtime-smoke-summary-v0',
    run_id: RUN_ID,
    started_at: STARTED_AT.toISOString(),
    completed_at: new Date().toISOString(),
    status: 'pass',
    prisma: {
      prompt_index_model_metadata_only: true,
      support_prisma_repository: 'PrismaTopicSelectionV1cPromotionGateRepository',
      control_plane_prisma_repository: 'PrismaTopicSelectionControlPlaneRepository',
    },
    n2_runtime: {
      role_count: firstRuntime.candidates.length,
      final_slot_id: firstRuntime.admitted.final_artifact.slot_id,
      runtime_provenance_class: firstRuntime.admitted.final_artifact.runtime_provenance_class,
      prompt_packet_hashes: firstRuntime.prompt_packet_hashes,
    },
    prompt_index: {
      rows_after_first: summarizePromptRows(promptRowsAfterFirst),
      row_count_after_replay: promptRowsAfterReplay.length,
      row_count_after_prompt_cache_replay: promptRowsAfterPromptCacheReplay.length,
      prompt_cache_replay: {
        replayed_slot_id: promptCacheReplay.role_artifact.slot_id,
        prompt_packet_hash: promptCacheReplay.role_artifact.prompt_packet_hash,
        redacted_prompt_artifact_ref_reused:
          promptCacheReplay.invocation_result.provenance.redacted_prompt_artifact_ref?.ref_id
          === firstRuntime.invocations[0].provenance.redacted_prompt_artifact_ref?.ref_id,
        prompt_quality_report_ref_reused:
          promptCacheReplay.invocation_result.provenance.prompt_quality_report_ref?.ref_id
          === firstRuntime.invocations[0].provenance.prompt_quality_report_ref?.ref_id,
      },
    },
    replay: {
      support_id_stable: replaySupport.promotion_decision_support.promotion_decision_support_id
        === supportOnly.promotion_decision_support.promotion_decision_support_id,
      gate_id_stable: replayGate.promotion_gate_check.promotion_gate_check_id
        === gate.promotion_gate_check.promotion_gate_check_id,
      prompt_index_row_count_stable: promptRowsAfterPromptCacheReplay.length === promptRowsAfterFirst.length,
    },
    drift: {
      blocked: true,
      blocker_code: driftRuntime.admitted.blocker.code,
    },
    no_n3_bypass: {
      gate_before_explicit_n3: gateBefore === null,
      explicit_n3_gate_check_id: gate.promotion_gate_check.promotion_gate_check_id,
      n3_disposition: gate.promotion_gate_check.disposition,
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
      no_n3_bypass: manifest.no_n3_bypass,
    }, null, 2));
  } catch (error) {
    const manifest = {
      schema_version: 'topic-selection-v1c-n2-runtime-smoke-summary-v0',
      run_id: RUN_ID,
      started_at: STARTED_AT.toISOString(),
      completed_at: new Date().toISOString(),
      status: 'fail',
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : null,
    };
    const manifestPath = await writeManifest(manifest);
    console.error(`topic-selection v1c N2 runtime smoke failed; manifest written to ${manifestPath}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
