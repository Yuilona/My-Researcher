import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import type { TopicSelectionFunctionalRef } from './topic-selection-control-plane-contracts.js';
import {
  TOPIC_SELECTION_BUILD_EVIDENCE_MAP_NODE_INPUT_SCHEMA_VERSION,
  TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_CONTEXT_PACKET_SCHEMA_VERSION,
  TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_DRAFT_SCHEMA_VERSION,
  TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_REVIEW_PACKAGE_SCHEMA_VERSION,
  TOPIC_SELECTION_EVIDENCE_MAP_HANDOFF_SCHEMA_VERSION,
  TOPIC_SELECTION_EVIDENCE_MAP_MATERIALIZATION_REPORT_SCHEMA_VERSION,
  type TopicSelectionBuildEvidenceMapNodeInput,
  type TopicSelectionEvidenceMapExtractionContextPacket,
  type TopicSelectionEvidenceMapExtractionDraft,
  type TopicSelectionEvidenceMapExtractionReviewPackage,
  type TopicSelectionEvidenceMapHandoff,
  type TopicSelectionEvidenceMapMaterializationReport,
  topicSelectionBuildEvidenceMapNodeInputSchema,
  topicSelectionEvidenceMapExtractionContextPacketSchema,
  topicSelectionEvidenceMapExtractionDraftSchema,
  topicSelectionEvidenceMapExtractionReviewPackageSchema,
  topicSelectionEvidenceMapHandoffSchema,
  topicSelectionEvidenceMapMaterializationReportSchema,
} from './topic-selection-evidence-map-contracts.js';
import {
  TOPIC_SELECTION_SEARCH_RUN_HANDOFF_SCHEMA_VERSION,
  type TopicSelectionSearchRunHandoff,
} from './topic-selection-search-resource-contracts.js';

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
    title_card_id: 'title_card_001',
  };
}

function searchRunHandoff(): TopicSelectionSearchRunHandoff {
  return {
    schema_version: TOPIC_SELECTION_SEARCH_RUN_HANDOFF_SCHEMA_VERSION,
    search_run_ref: ref('search_run', 'search_run_001'),
    search_plan_ref: ref('search_plan', 'search_plan_001', 'v1'),
    literature_resource_pool_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001', 'v1'),
    literature_snapshot_hash: 'snapshot-hash-001',
    coverage_row_intent_refs: [ref('coverage_row_intent', 'coverage_row_001')],
    coverage_role_expectations: [{
      coverage_row_intent_ref: ref('coverage_row_intent', 'coverage_row_001'),
      expected_evidence_role: 'support',
    }],
    method_family_targets: ['retrieval_augmented_generation', 'fine_tuning'],
    evidence_map_input_refs: [
      ref('literature_record', 'lit_001'),
      ref('literature_source', 'source_001'),
    ],
    coverage_binding_refs: [ref('coverage_evidence_binding', 'binding_001')],
    coverage_assessment_refs: [ref('coverage_assessment', 'assessment_001')],
    coverage_summary: { binding_count: 1 },
    source_health_summary: { source_count: 1, warning_codes: [] },
    result_accounting: {
      total_result_count: 1,
      unique_literature_count: 1,
      duplicate_result_count: 0,
      failed_source_count: 0,
      skipped_source_count: 0,
    },
    raw_log_artifact_refs: [ref('artifact_ref', 'raw_log_001')],
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
}

function validDraft(): TopicSelectionEvidenceMapExtractionDraft {
  return {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_DRAFT_SCHEMA_VERSION,
    title_card_ref: ref('title_card', 'title_card_001'),
    search_run_ref: ref('search_run', 'search_run_001'),
    search_plan_ref: ref('search_plan', 'search_plan_001', 'v1'),
    literature_resource_pool_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001', 'v1'),
    literature_snapshot_hash: 'snapshot-hash-001',
    producer_kind: 'fixture',
    profile_id: 'topic-selection.evidence-map-extraction.single-agent.v1',
    input_refs_hash: 'input-refs-hash-001',
    draft_units: [{
      client_unit_key: 'unit_support_001',
      coverage_row_intent_ref: ref('coverage_row_intent', 'coverage_row_001'),
      evidence_role: 'support',
      literature_ref: ref('literature_record', 'lit_001'),
      source_refs: [ref('literature_source', 'source_001')],
      locator: {
        locator_type: 'abstract',
        locator_ref: ref('literature_abstract', 'lit_001_abstract'),
        literature_ref: ref('literature_record', 'lit_001'),
        source_ref: ref('literature_source', 'source_001'),
      },
      source_statement: 'The paper reports a risk-aware RAG fine-tuning workflow.',
      source_attribution_kind: 'source_claim',
      normalized_statement: null,
      interpretation_payload: { role_hint: 'support' },
      confidence: 0.84,
      issue_codes: [],
    }],
    draft_links: [],
    draft_clusters: [],
    draft_patterns: [],
    draft_conflicts: [],
    warning_codes: [],
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
}

function contextPacket(): TopicSelectionEvidenceMapExtractionContextPacket {
  return {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_CONTEXT_PACKET_SCHEMA_VERSION,
    node_id: 'topic-selection.v1a.build-evidence-map.v1',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    context_family: 'evidence_extraction_context',
    input_refs: [ref('search_run', 'search_run_001')],
    input_refs_hash: 'input-refs-hash-001',
    search_run_handoff_hash: 'handoff-hash-001',
    context_compiler_version: 'v1',
    policy_version: 'v1',
    output_schema_version: 'v1',
    execution_mode: 'mocked_llm',
    profile_id: 'topic-selection.evidence-map-extraction.single-agent.v1',
    cache_key: 'evidence-extraction-cache-key-001',
    cache_hit: false,
    redaction_policy: 'topic_selection_evidence_map_extraction_context_redaction_v1',
    payload: { instructions: ['extract source-grounded EvidenceUnits only'] },
    created_at: '2026-05-21T00:00:00.000Z',
  };
}

async function validatesBody(schema: Record<string, unknown>, body: unknown): Promise<boolean> {
  const app = Fastify();
  app.post('/validate', { schema: { body: schema } }, async () => ({ ok: true }));
  try {
    const result = await app.inject({
      method: 'POST',
      url: '/validate',
      payload: body as Record<string, unknown>,
    });
    return result.statusCode === 200;
  } finally {
    await app.close();
  }
}

test('topic-selection EvidenceMap extraction draft schema accepts Node 5 draft', async () => {
  assert.equal(await validatesBody(topicSelectionEvidenceMapExtractionDraftSchema, validDraft()), true);
});

test('topic-selection EvidenceMap extraction draft schema rejects hidden reasoning drift', async () => {
  const draft = validDraft() as unknown as Record<string, unknown>;
  draft.hidden_reasoning = 'do not persist this';

  assert.equal(await validatesBody(topicSelectionEvidenceMapExtractionDraftSchema, draft), false);
});

test('topic-selection BuildEvidenceMap node input and context packet schemas accept normalized Node 5 input', async () => {
  const nodeInput: TopicSelectionBuildEvidenceMapNodeInput = {
    schema_version: TOPIC_SELECTION_BUILD_EVIDENCE_MAP_NODE_INPUT_SCHEMA_VERSION,
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    title_card_ref: ref('title_card', 'title_card_001'),
    search_run_handoff: searchRunHandoff() as unknown as Record<string, unknown>,
    extraction_context_packet_ref: ref('artifact_ref', 'context_packet_001'),
    extraction_context_packet: contextPacket(),
    extraction_draft: validDraft(),
    execution_mode: 'mocked_llm',
    profile_id: 'topic-selection.evidence-map-extraction.single-agent.v1',
    revision_of_attempt_ref: null,
    review_package_ref: null,
    operator_reuse_approval_ref: null,
    policy_version: 'v1',
    output_schema_version: 'v1',
  };

  assert.equal(await validatesBody(topicSelectionEvidenceMapExtractionContextPacketSchema, contextPacket()), true);
  assert.equal(await validatesBody(topicSelectionBuildEvidenceMapNodeInputSchema, nodeInput), true);
});

test('topic-selection EvidenceMap materialization report, review package, and handoff schemas accept routing surfaces', async () => {
  const report: TopicSelectionEvidenceMapMaterializationReport = {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_MATERIALIZATION_REPORT_SCHEMA_VERSION,
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    status: 'ready',
    accepted_unit_count: 1,
    rejected_unit_count: 0,
    rejection_reasons_by_client_unit_key: {},
    warning_codes: [],
    review_codes: [],
    blocker_codes: [],
    failed_validation_layer: null,
    repair_target: null,
    normalized_role_counts: { support: 1, challenge: 0, baseline: 0, context: 0 },
    materialization_input_hash: 'materialization-input-hash-001',
    draft_hash: 'draft-hash-001',
    input_refs_hash: 'input-refs-hash-001',
    mapped_input: { search_run_id: 'search_run_001', evidence_unit_count: 1 },
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
  const reviewPackage: TopicSelectionEvidenceMapExtractionReviewPackage = {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_REVIEW_PACKAGE_SCHEMA_VERSION,
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    review_package_ref: ref('artifact_ref', 'review_package_001'),
    materialization_report_ref: ref('artifact_ref', 'materialization_report_001'),
    materialization_report_hash: 'report-hash-001',
    extraction_context_packet_ref: ref('artifact_ref', 'context_packet_001'),
    extraction_context_packet_hash: 'context-hash-001',
    draft_ref: ref('artifact_ref', 'draft_001'),
    draft_hash: 'draft-hash-001',
    ambiguous_unit_keys: ['unit_support_001'],
    review_codes: ['LOW_CONFIDENCE_CORE_SUPPORT'],
    accepted_draft_ref_summary: {},
    rejected_draft_ref_summary: {},
    required_revision_actions: ['revise locator and source statement'],
    allowed_revision_producers: ['human', 'codex_assisted', 'provider_llm'],
    policy_version: 'v1',
    output_schema_version: 'v1',
    execution_mode: 'codex_assisted',
    profile_id: 'topic-selection.evidence-map-extraction.single-agent.v1',
  };
  const handoff: TopicSelectionEvidenceMapHandoff = {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_HANDOFF_SCHEMA_VERSION,
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    handoff_ref: ref('workflow_handoff', 'evidence_map_handoff_001'),
    title_card_ref: ref('title_card', 'title_card_001'),
    evidence_map_ref: ref('evidence_map', 'evidence_map_001', 'v1'),
    search_run_ref: ref('search_run', 'search_run_001'),
    search_plan_ref: ref('search_plan', 'search_plan_001', 'v1'),
    literature_resource_pool_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001', 'v1'),
    materialization_report_ref: ref('artifact_ref', 'materialization_report_001'),
    materialization_report_hash: 'report-hash-001',
    need_validation_evidence_bundle_ref: ref('read_projection', 'need_validation_bundle_001'),
    evidence_unit_count: 1,
    role_counts: { support: 1, challenge: 0, baseline: 0, context: 0 },
    abstract_only_support_count: 1,
    warning_summary: {},
    issue_summary: { ABSTRACT_ONLY_SUPPORT: 1 },
    source_refs_hash: 'source-refs-hash-001',
    method_family_targets: ['retrieval_augmented_generation', 'fine_tuning'],
    policy_version: 'v1',
    output_schema_version: 'v1',
  };

  assert.equal(await validatesBody(topicSelectionEvidenceMapMaterializationReportSchema, report), true);
  assert.equal(await validatesBody(topicSelectionEvidenceMapExtractionReviewPackageSchema, reviewPackage), true);
  assert.equal(await validatesBody(topicSelectionEvidenceMapHandoffSchema, handoff), true);
});
