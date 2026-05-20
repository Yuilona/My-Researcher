import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import * as paperImplementationContracts from './paper-implementation-contracts.js';
import * as researchLifecycleContracts from './index.js';
import {
  TOPIC_SELECTION_DOWNSTREAM_FEEDBACK_SOURCE_KINDS,
  topicSelectionDownstreamTopicFeedbackCreateInputSchema,
} from './topic-selection-v1c-downstream-feedback-recheck-contracts.js';

type JsonSchema = Readonly<Record<string, unknown>>;

function functionalRef(refType: string, refId: string) {
  return {
    ref_type: refType,
    ref_id: refId,
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

test('paper-implementation schemas load through direct and aggregate exports', () => {
  assert.ok(paperImplementationContracts.bootstrapImplementationProjectRequestSchema);
  assert.ok(paperImplementationContracts.implementationIntakeSnapshotSchema);
  assert.ok(paperImplementationContracts.implementationProjectSchema);
  assert.ok(paperImplementationContracts.recordImplementationFeedbackEventRequestSchema);
  assert.ok(paperImplementationContracts.implementationFeedbackEventSchema);
  assert.ok(researchLifecycleContracts.bootstrapImplementationProjectRequestSchema);
  assert.ok(researchLifecycleContracts.implementationProjectSchema);
});

test('bootstrap implementation project request validates required bridge fields', async () => {
  assert.equal(
    await validateWithSchema(
      paperImplementationContracts.bootstrapImplementationProjectRequestSchema,
      {
        paper_project_bridge_id: 'paper_project_bridge_001',
        bridge_payload_hash: 'bridge_hash_001',
        workspace_id: 'workspace_001',
        created_by: 'hybrid',
      },
    ),
    200,
  );
  assert.equal(
    await validateWithSchema(
      paperImplementationContracts.bootstrapImplementationProjectRequestSchema,
      {
        paper_project_bridge_id: 'paper_project_bridge_001',
      },
    ),
    400,
  );
});

test('implementation feedback request validates event type and severity', async () => {
  assert.equal(
    await validateWithSchema(
      paperImplementationContracts.recordImplementationFeedbackEventRequestSchema,
      {
        feedback_type: 'infeasible_route',
        severity: 'blocking',
        summary: 'The admitted route cannot be executed under the current dataset constraints.',
        source_object_refs: [functionalRef('implementation_project', 'implementation_project_001')],
        recommended_upstream_action: 'recheck_topic_selection',
      },
    ),
    200,
  );
  assert.equal(
    await validateWithSchema(
      paperImplementationContracts.recordImplementationFeedbackEventRequestSchema,
      {
        feedback_type: 'paper_project_drift',
        severity: 'blocking',
        summary: 'Invalid feedback type.',
      },
    ),
    400,
  );
  assert.equal(
    await validateWithSchema(
      paperImplementationContracts.recordImplementationFeedbackEventRequestSchema,
      {
        feedback_type: 'infeasible_route',
        severity: 'fatal',
        summary: 'Invalid severity.',
      },
    ),
    400,
  );
});

test('topic-selection downstream feedback accepts paper_implementation source kind', async () => {
  assert.ok(TOPIC_SELECTION_DOWNSTREAM_FEEDBACK_SOURCE_KINDS.includes('paper_implementation'));
  assert.equal(
    await validateWithSchema(
      topicSelectionDownstreamTopicFeedbackCreateInputSchema,
      {
        paper_project_bridge_id: 'paper_project_bridge_001',
        downstream_source_kind: 'paper_implementation',
        downstream_source_ref: functionalRef('implementation_feedback_event', 'feedback_event_001'),
        feedback_signal: 'unanswerable_question',
        severity: 'blocking',
        summary: 'Implementation found the promoted question is not answerable.',
      },
    ),
    200,
  );
});
