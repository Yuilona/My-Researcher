import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';

import * as varianceContracts from './paper-implementation-provider-variance-contracts.js';
import * as harnessContracts from './paper-implementation-ai-workflow-harness-contracts.js';
import * as researchLifecycleContracts from './index.js';

type JsonSchema = Readonly<Record<string, unknown>>;

function ref(refType: string, refId: string, versionId: string | null = null) {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
    version_id: versionId,
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

function validRunRequest() {
  return {
    harness_id: 'implementation_harness_001',
    input_snapshot_id: 'implementation_input_snapshot_001',
    workflow_type: 'claim_boundary_review',
    workflow_version: 'workflow_v1',
    prompt_template_version_id: 'prompt_v1',
    output_schema_version_id: 'schema_v1',
    repeat_count: 2,
    profiles: [{
      profile_id: 'fake_profile_001',
      profile_mode: 'deterministic_fake',
      model_profile_id: 'mock.provider_variance',
      execution_mode: 'mocked_llm',
      run_mode: 'mock',
    }],
    cases: [{
      case_id: 'case_happy_001',
      case_kind: 'happy_path',
      target_ref: ref('claim_candidate', 'claim_candidate_001'),
      source_refs: [ref('run_evidence_unit', 'run_evidence_unit_001')],
      trace_manifest_refs: [ref('trace_manifest', 'trace_manifest_001')],
      artifact_ref: ref('proposal_artifact', 'proposal_artifact_001'),
      expected_handoff_ready: true,
    }],
  };
}

test('provider variance schemas load through direct and aggregate exports', () => {
  assert.ok(varianceContracts.runProviderVarianceEvaluationRequestSchema);
  assert.ok(varianceContracts.runProviderVarianceEvaluationResponseSchema);
  assert.ok(researchLifecycleContracts.runProviderVarianceEvaluationRequestSchema);
});

test('provider variance request requires profiles cases and bounded repeat count', async () => {
  assert.equal(
    await validateWithSchema(
      varianceContracts.runProviderVarianceEvaluationRequestSchema,
      validRunRequest(),
    ),
    200,
  );
  const missingProfiles = validRunRequest();
  delete (missingProfiles as Record<string, unknown>).profiles;
  assert.equal(
    await validateWithSchema(
      varianceContracts.runProviderVarianceEvaluationRequestSchema,
      missingProfiles,
    ),
    400,
  );
  const tooManyRepeats = validRunRequest();
  tooManyRepeats.repeat_count = 99;
  assert.equal(
    await validateWithSchema(
      varianceContracts.runProviderVarianceEvaluationRequestSchema,
      tooManyRepeats,
    ),
    400,
  );
});

test('provider variance extends proposal and quality signal vocabularies without authority fields', () => {
  assert.equal(
    [...harnessContracts.PAPER_IMPLEMENTATION_PROPOSAL_ARTIFACT_KINDS].includes('evaluation_report'),
    true,
  );
  assert.equal(
    [...harnessContracts.PAPER_IMPLEMENTATION_QUALITY_SIGNAL_TYPES]
      .includes('provider_variance_claim_safety_violation'),
    true,
  );
});
