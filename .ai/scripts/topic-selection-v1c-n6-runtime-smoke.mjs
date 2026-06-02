#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

import { InMemoryTopicSelectionV1cPaperProjectBridgeRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-paper-project-bridge-repository.ts';
import { PrismaTopicSelectionControlPlaneRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-control-plane-repository.ts';
import { PrismaTopicSelectionPromptPacketCacheStore } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-prompt-packet-cache-store.ts';
import { PrismaTopicSelectionV1cDownstreamFeedbackRecheckRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-v1c-downstream-feedback-recheck-repository.ts';
import { TopicSelectionAgentOrchestratorService } from '../../apps/backend/src/services/topic-selection-agent-orchestrator-service.ts';
import { TopicSelectionControlPlaneService } from '../../apps/backend/src/services/topic-selection-control-plane-service.ts';
import { TopicSelectionModelProfileRegistryService } from '../../apps/backend/src/services/topic-selection-model-profile-registry-service.ts';
import { TopicSelectionPromptPacketCacheService } from '../../apps/backend/src/services/topic-selection-prompt-packet-cache-service.ts';
import {
  createTopicSelectionV1cPromotionBridgeHandoffFixture,
  TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  topicSelectionV1cAcceptanceRef,
  TopicSelectionV1cAcceptancePromotionBridgeHandoffProvider,
} from '../../apps/backend/src/services/topic-selection-v1c-acceptance-scenario-fixtures.ts';
import { TopicSelectionV1cDownstreamFeedbackRecheckService } from '../../apps/backend/src/services/topic-selection-v1c-downstream-feedback-recheck-service.ts';
import { TopicSelectionV1cN6FeedbackNormalizationAdmissionService } from '../../apps/backend/src/services/topic-selection-v1c-n6-feedback-normalization-admission-service.ts';
import { TopicSelectionV1cN6FeedbackNormalizationRuntimeService } from '../../apps/backend/src/services/topic-selection-v1c-n6-feedback-normalization-runtime-service.ts';
import { TopicSelectionV1cPaperProjectBridgeService } from '../../apps/backend/src/services/topic-selection-v1c-paper-project-bridge-service.ts';
import {
  TOPIC_SELECTION_V1C_DOWNSTREAM_FEEDBACK_CANDIDATE_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const STARTED_AT = new Date();
const RUN_ID = process.env.TOPIC_SELECTION_V1C_N6_RUNTIME_SMOKE_RUN_ID?.trim()
  || `v1c-n6-runtime-smoke-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
const RUN_KEY = RUN_ID.replaceAll(/[^a-zA-Z0-9_]/g, '_');
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1c-n6-runtime-smoke', RUN_ID);

function createRunIdFactory() {
  const counts = new Map();
  return (prefix) => {
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    return `${prefix}_${RUN_KEY}_${String(next).padStart(3, '0')}`;
  };
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
    const suffix = `${RUN_KEY}_${String(this.calls.length).padStart(3, '0')}`;
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
  const idFactory = createRunIdFactory();
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
  const n6Runtime = new TopicSelectionV1cN6FeedbackNormalizationRuntimeService(controlPlane, {
    agentOrchestrator,
    modelProfileRegistry,
  });
  const n6Admission = new TopicSelectionV1cN6FeedbackNormalizationAdmissionService(n6Runtime);
  const bridgeService = new TopicSelectionV1cPaperProjectBridgeService({
    repository: new InMemoryTopicSelectionV1cPaperProjectBridgeRepository(),
    humanPromotionDecisionService: new TopicSelectionV1cAcceptancePromotionBridgeHandoffProvider(
      createTopicSelectionV1cPromotionBridgeHandoffFixture(),
    ),
    idFactory,
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const recheckSink = new RecordingRecheckSink();
  const downstreamFeedbackService = new TopicSelectionV1cDownstreamFeedbackRecheckService({
    repository: new PrismaTopicSelectionV1cDownstreamFeedbackRecheckRepository(prisma),
    paperProjectBridgeService: bridgeService,
    recheckRiskMemoryService: recheckSink,
    idFactory,
    now: () => STARTED_AT.toISOString(),
  });
  return {
    bridgeService,
    downstreamFeedbackService,
    n6Admission,
    n6Runtime,
    recheckSink,
  };
}

function sourceForBridge(handoff) {
  return {
    paper_project_bridge_id: handoff.paper_project_bridge_id,
    workspace_id: 'workspace_001',
    downstream_source_kind: 'reviewer_check',
    downstream_source_ref: topicSelectionV1cAcceptanceRef('reviewer_check', `reviewer_check_${RUN_KEY}_001`),
    source_feedback_refs: [topicSelectionV1cAcceptanceRef('review_comment', `review_comment_${RUN_KEY}_001`)],
    observed_blocker_refs: [],
    artifact_refs: [topicSelectionV1cAcceptanceRef('artifact_ref', `artifact_feedback_${RUN_KEY}_001`)],
    raw_feedback_text: 'Reviewer check says the selected evidence is stale for the current paper framing.',
    policy_version_id: 'topic-selection-v1c-n6-runtime-smoke-policy-v1',
    created_by: 'system',
  };
}

function candidateOutput(handoff, source, overrides = {}) {
  return {
    schema_version: TOPIC_SELECTION_V1C_DOWNSTREAM_FEEDBACK_CANDIDATE_SCHEMA_VERSION,
    paper_project_bridge_id: handoff.paper_project_bridge_id,
    workspace_id: 'workspace_001',
    downstream_source_kind: source.downstream_source_kind,
    downstream_source_ref: source.downstream_source_ref,
    source_feedback_refs: source.source_feedback_refs ?? [],
    observed_blocker_refs: source.observed_blocker_refs ?? [],
    feedback_signal: 'stale_evidence',
    severity: 'blocking',
    summary: 'The selected evidence is stale for the current paper framing.',
    required_action: 'Refresh selected evidence before continuing downstream work.',
    artifact_refs: source.artifact_refs ?? [],
    feedback_payload: {
      normalized_by: 'v1c_n6_runtime_smoke',
    },
    normalization_hints: {
      requires_recheck_hint: true,
      loopback_target_hint: null,
      affected_ref_hint: null,
      reason_codes: ['stale_evidence'],
    },
    cited_refs: [
      handoff.paper_project_bridge_ref,
      source.downstream_source_ref,
      ...(source.source_feedback_refs ?? []),
      ...(source.artifact_refs ?? []),
    ],
    no_upstream_mutation_confirmed: true,
    ...overrides,
  };
}

async function runN6Runtime(subject, bridge, source, options = {}) {
  const generated = await subject.n6Runtime.generateCandidate({
    bridge_handoff: bridge.handoff,
    source,
    workflow_run_id: `workflow_run_${RUN_KEY}_n6_feedback_normalization`,
    node_attempt_id: `node_attempt_${RUN_KEY}_n6_feedback_normalization`,
    execution_mode: 'codex_assisted',
    run_mode: 'acceptance',
    codex_response: {
      output: candidateOutput(bridge.handoff, source, options.outputOverrides ?? {}),
      operator_label: options.operatorLabel ?? 'v1c-n6-runtime-smoke',
    },
    created_by: 'system',
  });
  assert.equal(generated.status, 'succeeded');
  if (generated.status !== 'succeeded') {
    assert.fail(`N6 runtime blocked: ${JSON.stringify(generated.invocation_result)}`);
  }
  return generated;
}

async function upstreamAuthorityCounts(prisma) {
  return {
    promotion_input_snapshot: await prisma.topicSelectionPromotionInputSnapshot.count({
      where: { id: { contains: RUN_KEY } },
    }),
    promotion_decision_support: await prisma.topicSelectionPromotionDecisionSupport.count({
      where: { id: { contains: RUN_KEY } },
    }),
    promotion_gate_check: await prisma.topicSelectionPromotionGateCheck.count({
      where: { id: { contains: RUN_KEY } },
    }),
    human_promotion_decision: await prisma.topicSelectionHumanPromotionDecision.count({
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
  const bridge = await subject.bridgeService.createPaperProjectBridge({
    promotion_decision_id: 'promotion_decision_001',
    workspace_id: 'workspace_001',
  });
  const source = sourceForBridge(bridge.handoff);
  const beforeUpstream = await upstreamAuthorityCounts(prisma);

  const firstRuntime = await runN6Runtime(subject, bridge, source);
  const admitted = subject.n6Admission.admit({
    bridge_handoff: bridge.handoff,
    source,
    candidate_artifact: firstRuntime.candidate_artifact,
    candidate: firstRuntime.structured_output,
  });
  assert.equal(admitted.admitted, true);
  if (!admitted.admitted) {
    assert.fail(`Expected N6 admission to pass: ${JSON.stringify(admitted.blocker)}`);
  }
  const firstFeedback = await subject.downstreamFeedbackService.recordDownstreamTopicFeedback(
    admitted.create_input,
  );
  const replayFeedback = await subject.downstreamFeedbackService.recordDownstreamTopicFeedback(
    admitted.create_input,
  );
  assert.equal(
    replayFeedback.downstream_topic_feedback.downstream_topic_feedback_id,
    firstFeedback.downstream_topic_feedback.downstream_topic_feedback_id,
  );
  assert.equal(subject.recheckSink.calls.length, 1);

  const promptRowsAfterFirst = await promptRowsForHashes(prisma, [
    firstRuntime.candidate_artifact.prompt_packet_hash,
  ]);
  assert.equal(promptRowsAfterFirst.length, 1);
  assert.equal(promptRowsAfterFirst[0].invocationSlotId, 'downstream_feedback_normalization');
  assert.equal(promptRowsAfterFirst[0].promptTemplateId, 'topic-selection-v1c-downstream-feedback-normalization');
  assert.equal(promptRowsAfterFirst[0].promptTemplateVersion, '1');
  assert.equal(promptRowsAfterFirst[0].outputContract, 'TopicSelectionV1cDownstreamFeedbackCandidate@v1');
  assert.equal(promptRowsAfterFirst[0].freshnessStatus, 'fresh');
  assert.ok(promptRowsAfterFirst[0].redactedPromptArtifactRef);
  assert.ok(promptRowsAfterFirst[0].promptQualityReportRef);

  const promptCacheReplay = await runN6Runtime(subject, bridge, source, {
    operatorLabel: 'v1c-n6-runtime-smoke-prompt-cache-replay',
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

  const driftedAdmission = subject.n6Admission.admit({
    bridge_handoff: bridge.handoff,
    source,
    candidate_artifact: {
      ...firstRuntime.candidate_artifact,
      prompt_packet_hash: '0'.repeat(64),
    },
    candidate: firstRuntime.structured_output,
  });
  assert.equal(driftedAdmission.admitted, false);
  if (driftedAdmission.admitted) {
    assert.fail('Expected N6 prompt drift admission to block.');
  }
  assert.equal(driftedAdmission.blocker.code, 'N6_FEEDBACK_NORMALIZATION_ARTIFACT_PROMPT_DRIFT');

  const afterUpstream = await upstreamAuthorityCounts(prisma);
  assert.deepEqual(afterUpstream, beforeUpstream);
  const downstreamRows = await prisma.topicSelectionDownstreamTopicFeedback.findMany({
    where: { paperProjectBridgeId: bridge.paper_project_bridge.paper_project_bridge_id },
    orderBy: { createdAt: 'asc' },
  });
  assert.equal(downstreamRows.length, 1);

  return {
    schema_version: 'topic-selection-v1c-n6-runtime-smoke-summary-v0',
    run_id: RUN_ID,
    started_at: STARTED_AT.toISOString(),
    completed_at: new Date().toISOString(),
    status: 'pass',
    prisma: {
      prompt_index_model_metadata_only: true,
      downstream_feedback_prisma_repository: 'PrismaTopicSelectionV1cDownstreamFeedbackRecheckRepository',
      control_plane_prisma_repository: 'PrismaTopicSelectionControlPlaneRepository',
    },
    n6_runtime: {
      slot_id: firstRuntime.candidate_artifact.slot_id,
      runtime_provenance_class: firstRuntime.candidate_artifact.runtime_provenance_class,
      candidate_prompt_packet_hash: firstRuntime.candidate_artifact.prompt_packet_hash,
      admission_identity_hash: admitted.admission_identity_hash,
      feedback_id: firstFeedback.downstream_topic_feedback.downstream_topic_feedback_id,
      recheck_request_id: firstFeedback.recheck_request?.downstream_recheck_request_id ?? null,
      recheck_sink_calls: subject.recheckSink.calls.length,
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
      feedback_id_stable: replayFeedback.downstream_topic_feedback.downstream_topic_feedback_id
        === firstFeedback.downstream_topic_feedback.downstream_topic_feedback_id,
      prompt_index_row_count_stable: promptRowsAfterReplay.length === promptRowsAfterFirst.length,
    },
    drift: {
      blocked: true,
      blocker_code: driftedAdmission.blocker.code,
    },
    no_side_effect_bypass: {
      upstream_counts_unchanged: afterUpstream,
      downstream_feedback_row_count: downstreamRows.length,
      recheck_sink_calls: subject.recheckSink.calls.length,
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
      no_side_effect_bypass: manifest.no_side_effect_bypass,
    }, null, 2));
  } catch (error) {
    const manifest = {
      schema_version: 'topic-selection-v1c-n6-runtime-smoke-summary-v0',
      run_id: RUN_ID,
      started_at: STARTED_AT.toISOString(),
      completed_at: new Date().toISOString(),
      status: 'fail',
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : null,
    };
    const manifestPath = await writeManifest(manifest);
    console.error(`topic-selection v1c N6 runtime smoke failed; manifest written to ${manifestPath}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
