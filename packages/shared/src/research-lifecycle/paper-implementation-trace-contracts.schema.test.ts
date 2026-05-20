import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import * as traceContracts from './paper-implementation-trace-contracts.js';
import * as researchLifecycleContracts from './index.js';

type JsonSchema = Readonly<Record<string, unknown>>;

function functionalRef(refType: string, refId: string, versionId: string | null = null) {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
    version_id: versionId,
  };
}

function emptyLineage() {
  return {
    literature: {
      literature_evidence_refs: [],
      source_locator_refs: [],
      citation_candidate_refs: [],
    },
    experiment: {
      experiment_plan_refs: [],
      work_order_refs: [],
      run_refs: [],
      run_evidence_refs: [],
      result_packet_refs: [],
      metric_refs: [],
    },
    artifact: {
      dataset_refs: [],
      baseline_refs: [],
      code_version_refs: [],
      model_checkpoint_refs: [],
      config_refs: [],
      log_artifact_refs: [],
    },
    decision: {
      validation_cycle_refs: [],
      motive_evolution_decision_refs: [],
      gate_result_refs: [],
      human_decision_refs: [],
      accepted_risk_refs: [],
    },
    internal_interpretation: {
      result_interpretation_refs: [],
      llm_rationale_refs: [],
      board_summary_refs: [],
      non_citable_refs: [],
    },
  };
}

async function validateWithSchema(schema: JsonSchema, payload: object) {
  const app = Fastify();
  app.post('/validate', { schema: { body: schema } }, async () => ({ ok: true }));
  await app.ready();
  const response = await app.inject({
    method: 'POST',
    url: '/validate',
    payload,
  });
  await app.close();
  return response.statusCode;
}

test('paper-implementation trace schemas load through direct and aggregate exports', () => {
  assert.ok(traceContracts.traceManifestSchema);
  assert.ok(traceContracts.createCitationCandidateRequestSchema);
  assert.ok(traceContracts.createClaimTracePacketRequestSchema);
  assert.ok(traceContracts.registerNaturalLanguageFieldRoleRequestSchema);
  assert.ok(researchLifecycleContracts.traceManifestSchema);
  assert.ok(researchLifecycleContracts.createTraceManifestRequestSchema);
});

test('TraceManifest request requires target ref and categorized lineage', async () => {
  assert.equal(
    await validateWithSchema(
      traceContracts.createTraceManifestRequestSchema,
      {
        target_ref: functionalRef('core_motive_version', 'core_motive_version_001', 'v1'),
        lineage: emptyLineage(),
        integrity: {
          missing_refs: [functionalRef('source_locator', 'source_locator_missing')],
        },
        created_by: 'system',
      },
    ),
    200,
  );
  assert.equal(
    await validateWithSchema(
      traceContracts.createTraceManifestRequestSchema,
      {
        target_ref: functionalRef('core_motive_version', 'core_motive_version_001', 'v1'),
      },
    ),
    400,
  );
});

test('CitationCandidate rejects missing locator missing linked target invalid source kind and memo-like source kinds', async () => {
  const valid = {
    trace_manifest_id: 'trace_manifest_001',
    source_kind: 'literature_evidence_unit',
    source_type: 'paper',
    source_id: 'literature_source_001',
    source_evidence_unit_ref: functionalRef('literature_evidence_unit', 'literature_evidence_unit_001'),
    source_locator_id: 'source_locator_001',
    locator_quality: 'exact',
    locator: { section: '3.1', paragraph: '2' },
    cited_for: ['method_prior_art'],
    linked_target_refs: [functionalRef('claim_candidate', 'claim_candidate_001')],
    normalized_source_statement: 'Prior work reports the baseline gap.',
  };
  assert.equal(
    await validateWithSchema(traceContracts.createCitationCandidateRequestSchema, valid),
    200,
  );
  assert.equal(
    await validateWithSchema(traceContracts.createCitationCandidateRequestSchema, {
      ...valid,
      source_kind: 'citable_source_evidence_unit',
      source_evidence_unit_ref: functionalRef('citable_source_evidence_unit', 'citable_source_evidence_unit_001'),
    }),
    200,
  );
  assert.equal(
    await validateWithSchema(traceContracts.createCitationCandidateRequestSchema, {
      ...valid,
      source_locator_id: '',
    }),
    400,
  );
  assert.equal(
    await validateWithSchema(traceContracts.createCitationCandidateRequestSchema, {
      ...valid,
      linked_target_refs: [],
    }),
    400,
  );
  assert.equal(
    await validateWithSchema(traceContracts.createCitationCandidateRequestSchema, {
      ...valid,
      source_kind: 'llm_summary',
    }),
    400,
  );
  assert.equal(
    await validateWithSchema(traceContracts.createCitationCandidateRequestSchema, {
      ...valid,
      source_type: 'rationale_memo',
    }),
    400,
  );
});

test('TraceManifest internal interpretation lineage rejects human judgment refs', async () => {
  const schema = traceContracts.traceLineageBundleSchema.properties.internal_interpretation;
  assert.equal(
    Object.hasOwn(schema.properties, 'human_judgment_refs'),
    false,
  );
});

test('natural-language field role schema validates supported role vocabulary and booleans', async () => {
  assert.equal(
    await validateWithSchema(
      traceContracts.registerNaturalLanguageFieldRoleRequestSchema,
      {
        field_owner_ref: functionalRef('core_motive_version', 'core_motive_version_001', 'v1'),
        field_name: 'problem_statement',
        field_role: 'semantic_contract',
        can_feed_workflow: true,
        can_feed_hard_gate: true,
        can_be_cited: false,
      },
    ),
    200,
  );
  assert.equal(
    await validateWithSchema(
      traceContracts.registerNaturalLanguageFieldRoleRequestSchema,
      {
        field_owner_ref: functionalRef('core_motive_version', 'core_motive_version_001', 'v1'),
        field_name: 'problem_statement',
        field_role: 'memo',
        can_feed_workflow: true,
        can_feed_hard_gate: false,
        can_be_cited: false,
      },
    ),
    400,
  );
  assert.equal(
    await validateWithSchema(
      traceContracts.registerNaturalLanguageFieldRoleRequestSchema,
      {
        field_owner_ref: functionalRef('core_motive_version', 'core_motive_version_001', 'v1'),
        field_name: 'problem_statement',
        field_role: 'semantic_contract',
        can_feed_workflow: 'yes',
        can_feed_hard_gate: true,
        can_be_cited: false,
      },
    ),
    400,
  );
});
