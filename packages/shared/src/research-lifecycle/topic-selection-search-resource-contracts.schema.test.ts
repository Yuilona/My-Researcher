import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import type {
  TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';
import {
  TOPIC_SELECTION_SEARCH_RUN_HANDOFF_SCHEMA_VERSION,
  TOPIC_SELECTION_SEARCH_RUN_LOOPBACK_SIGNAL_SCHEMA_VERSION,
  TOPIC_SELECTION_SEARCH_RUN_RECORD_BUNDLE_SCHEMA_VERSION,
  type TopicSelectionSearchRunHandoff,
  type TopicSelectionSearchRunLoopbackSignal,
  type TopicSelectionSearchRunRecordBundle,
  topicSelectionSearchRunHandoffSchema,
  topicSelectionSearchRunLoopbackSignalSchema,
  topicSelectionSearchRunRecordBundleSchema,
} from './topic-selection-search-resource-contracts.js';

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
    title_card_id: 'title_card_001',
  };
}

function validBundle(): TopicSelectionSearchRunRecordBundle {
  const coverageRowRef = ref('coverage_row_intent', 'coverage_row_001');
  return {
    schema_version: TOPIC_SELECTION_SEARCH_RUN_RECORD_BUNDLE_SCHEMA_VERSION,
    title_card_ref: ref('title_card', 'title_card_001'),
    search_plan_ref: ref('search_plan', 'search_plan_001', 'v1'),
    literature_resource_pool_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001', 'v1'),
    expected_literature_snapshot_hash: 'snapshot-hash-001',
    run_kind: 'planned_search',
    run_status: 'succeeded',
    query_provenance: [{ query: 'RAG fine-tuning evidence' }],
    result_accounting: {
      total_result_count: 1,
      unique_literature_count: 1,
      duplicate_result_count: 0,
      failed_source_count: 0,
      skipped_source_count: 0,
    },
    source_health_summary: { source_count: 1, warning_codes: [] },
    dedup_summary: { duplicate_count: 0 },
    evidence_map_input_refs: [
      ref('literature_record', 'lit_001'),
      ref('literature_source', 'source_001'),
    ],
    coverage_observations: [{
      coverage_row_intent_ref: coverageRowRef,
      status: 'succeeded',
      result_count: 1,
      source_count: 1,
      missing_reason_codes: [],
      notes: null,
    }],
    evidence_bindings: [{
      coverage_row_intent_ref: coverageRowRef,
      literature_ref: ref('literature_record', 'lit_001'),
      source_refs: [ref('literature_source', 'source_001')],
      binding_kind: 'retrieval_hit',
      result_rank: 1,
    }],
    coverage_assessments: [{
      coverage_row_intent_ref: coverageRowRef,
      verdict: 'satisfied',
      issue_codes: [],
      confidence: 0.86,
      assessed_by: 'system',
    }],
    coverage_risk_acceptances: [],
    raw_log_artifact_ref: null,
    raw_log_artifact_payload: { provider: 'fixture', hit_count: 1 },
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
}

function validHandoff(): TopicSelectionSearchRunHandoff {
  return {
    schema_version: TOPIC_SELECTION_SEARCH_RUN_HANDOFF_SCHEMA_VERSION,
    search_run_ref: ref('search_run', 'search_run_001'),
    search_plan_ref: ref('search_plan', 'search_plan_001', 'v1'),
    literature_resource_pool_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001', 'v1'),
    literature_snapshot_hash: 'snapshot-hash-001',
    coverage_row_intent_refs: [ref('coverage_row_intent', 'coverage_row_001')],
    evidence_map_input_refs: [ref('literature_record', 'lit_001')],
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

function validLoopbackSignal(): TopicSelectionSearchRunLoopbackSignal {
  return {
    schema_version: TOPIC_SELECTION_SEARCH_RUN_LOOPBACK_SIGNAL_SCHEMA_VERSION,
    search_run_ref: ref('search_run', 'search_run_failed_001'),
    search_plan_ref: ref('search_plan', 'search_plan_001', 'v1'),
    literature_resource_pool_snapshot_ref: ref('literature_resource_pool_snapshot', 'snapshot_001', 'v1'),
    reason_codes: ['SEARCH_RUN_FAILED'],
    target_actions: ['upstream_search_execution_or_input_preparation'],
    repair_summary: 'Retry or repair upstream search execution before Node 5.',
    policy_version: 'v1',
    output_schema_version: 'v1',
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

test('topic-selection SearchRun bundle schema accepts normalized Node 4 input', async () => {
  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, validBundle()), true);
});

test('topic-selection SearchRun bundle schema rejects missing concrete result arrays', async () => {
  const bundle = validBundle() as unknown as Record<string, unknown>;
  delete bundle.coverage_observations;

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, bundle), false);
});

test('topic-selection SearchRun bundle schema rejects non-concrete authority refs', async () => {
  const bundle = validBundle();
  bundle.search_plan_ref = ref('search_plan', 'search_plan_001');

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, bundle), false);
});

test('topic-selection SearchRun bundle schema rejects raw-log and risk ref drift', async () => {
  const rawDrift = validBundle();
  rawDrift.raw_log_artifact_ref = ref('literature_record', 'lit_001');

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, rawDrift), false);

  const riskDrift = validBundle();
  riskDrift.coverage_risk_acceptances = [{
    coverage_row_intent_ref: ref('coverage_row_intent', 'coverage_row_001'),
    accepted_risk_ref: ref('coverage_row_intent', 'coverage_row_001'),
    accepted_by: { actor_type: 'human', actor_id: 'reviewer_001' },
    rationale: 'This must cite a search-coverage accepted risk, not a coverage row.',
  }];

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, riskDrift), false);
});

test('topic-selection SearchRun bundle schema rejects unsupported EvidenceMap authority refs', async () => {
  const evidenceInputDrift = validBundle();
  evidenceInputDrift.evidence_map_input_refs = [ref('search_plan', 'search_plan_001', 'v1')];

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, evidenceInputDrift), false);

  const literatureBindingDrift = validBundle();
  literatureBindingDrift.evidence_bindings = [{
    ...literatureBindingDrift.evidence_bindings[0]!,
    literature_ref: ref('literature_source', 'source_001'),
  }];

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, literatureBindingDrift), false);

  const sourceBindingDrift = validBundle();
  sourceBindingDrift.evidence_bindings = [{
    ...sourceBindingDrift.evidence_bindings[0]!,
    source_refs: [ref('search_plan', 'search_plan_001', 'v1')],
  }];

  assert.equal(await validatesBody(topicSelectionSearchRunRecordBundleSchema, sourceBindingDrift), false);
});

test('topic-selection SearchRun handoff and loopback schemas accept routing surfaces', async () => {
  assert.equal(await validatesBody(topicSelectionSearchRunHandoffSchema, validHandoff()), true);
  assert.equal(await validatesBody(topicSelectionSearchRunLoopbackSignalSchema, validLoopbackSignal()), true);
});

test('topic-selection SearchRun loopback schema rejects unknown target actions', async () => {
  const signal = validLoopbackSignal() as unknown as Record<string, unknown>;
  signal.target_actions = ['node5'];

  assert.equal(await validatesBody(topicSelectionSearchRunLoopbackSignalSchema, signal), false);
});
