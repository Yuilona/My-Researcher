import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import {
  TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS,
  TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES,
  TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION,
  TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION,
  TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_RESULT_SCHEMA_VERSION,
  findTopicSelectionV1aWorkflowHarnessNodePolicy,
  topicSelectionV1aWorkflowHarnessNodePolicySchema,
  topicSelectionV1aWorkflowHarnessNodePolicyRegistrySchema,
  topicSelectionV1aWorkflowHarnessRouteEdgePolicySchema,
  topicSelectionV1aWorkflowHarnessRunRequestSchema,
  topicSelectionV1aWorkflowHarnessRunResultSchema,
  type TopicSelectionV1aWorkflowHarnessRunRequest,
  type TopicSelectionV1aWorkflowHarnessRunResult,
} from './topic-selection-v1a-workflow-harness-contracts.js';

async function validatesBody(schema: Record<string, unknown>, body: unknown): Promise<boolean> {
  const app = Fastify({
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });
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

function canonicalRequest(): TopicSelectionV1aWorkflowHarnessRunRequest {
  return {
    schema_version: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION,
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    workflow_run_id: 'workflow_run_v1a_001',
    node_attempt_id: 'node_attempt_v1a_001',
    policy_version: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION,
    workspace_id: null,
    title_card_id: 'title_card_001',
    scenario_input: {
      scenario_id: 'scenario_001',
      title_card_id: 'title_card_001',
    },
    created_by: 'system',
  };
}

function canonicalResult(): TopicSelectionV1aWorkflowHarnessRunResult {
  return {
    schema_version: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_RESULT_SCHEMA_VERSION,
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    workflow_run_id: 'workflow_run_v1a_001',
    node_attempt_id: 'node_attempt_v1a_001',
    policy_version: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION,
    scenario_result: {
      schema_version: 'v1',
      scenario_status: 'passed',
    },
    route_decision: 'loopback',
    route_signal: 'need_candidate_supplemental_round',
    route_target_node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    handoff_kind: null,
    route_policy_ref: {
      policy_version: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION,
      route_id: 'LB_N6_N6_SUPPLEMENTAL',
      from_node_id: 'topic-selection.v1a.generate-need-candidate.v1',
      route_signal: 'need_candidate_supplemental_round',
    },
    harness_trace_artifact_ref: {
      ref_type: 'artifact_ref',
      ref_id: 'artifact_001',
      version_id: null,
      title_card_id: 'title_card_001',
    },
    error_code: null,
    error_message: null,
  };
}

test('v1a workflow harness policy registry validates all N1-N9 policies', async () => {
  assert.deepEqual(
    TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES.map((policy) => policy.node_id),
    TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS,
  );
  assert.equal(
    await validatesBody(
      topicSelectionV1aWorkflowHarnessNodePolicyRegistrySchema,
      TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES,
    ),
    true,
  );
});

test('v1a workflow harness schemas reject unknown nodes, decisions, targets, and missing edges', async () => {
  const policy = findTopicSelectionV1aWorkflowHarnessNodePolicy('topic-selection.v1a.generate-need-candidate.v1');
  const edge = policy.route_edges[0];

  assert.equal(
    await validatesBody(topicSelectionV1aWorkflowHarnessRunRequestSchema, {
      ...canonicalRequest(),
      node_id: 'topic-selection.v1a.unknown.v1',
    }),
    false,
  );
  assert.equal(
    await validatesBody(topicSelectionV1aWorkflowHarnessRouteEdgePolicySchema, {
      ...edge,
      route_decision: 'invoke_previous',
    }),
    false,
  );
  assert.equal(
    await validatesBody(topicSelectionV1aWorkflowHarnessRouteEdgePolicySchema, {
      ...edge,
      route_target_node_id: 'topic-selection.v1a.non-existent.v1',
    }),
    false,
  );
  assert.equal(
    await validatesBody(topicSelectionV1aWorkflowHarnessNodePolicySchema, {
      ...policy,
      route_edges: [],
    }),
    false,
  );
  assert.equal(
    await validatesBody(topicSelectionV1aWorkflowHarnessRunRequestSchema, {
      ...canonicalRequest(),
      policy_version: 'topic-selection-v1a-workflow-route-policy-v0',
    }),
    false,
  );
  assert.equal(
    await validatesBody(topicSelectionV1aWorkflowHarnessRunResultSchema, {
      ...canonicalResult(),
      policy_version: 'topic-selection-v1a-workflow-route-policy-v0',
      route_policy_ref: {
        ...canonicalResult().route_policy_ref,
        policy_version: 'topic-selection-v1a-workflow-route-policy-v0',
      },
    }),
    false,
  );
});

test('v1a workflow harness run request and result envelopes validate', async () => {
  assert.equal(await validatesBody(topicSelectionV1aWorkflowHarnessRunRequestSchema, canonicalRequest()), true);
  assert.equal(await validatesBody(topicSelectionV1aWorkflowHarnessRunResultSchema, canonicalResult()), true);
});

test('v1a workflow harness N4-N9 emitted signals map to exactly one policy edge', () => {
  const expectedSignalsByNode = new Map<string, readonly string[]>([
    [
      'topic-selection.v1a.record-search-run.v1',
      [
        'search_run_consumable',
        'search_execution_retry_required',
        'search_plan_recheck_required',
        'source_health_snapshot_refresh',
        'search_coverage_human_review_required',
        'search_run_blocked',
      ],
    ],
    [
      'topic-selection.v1a.build-evidence-map.v1',
      ['evidence_map_ready', 'evidence_map_review_required', 'evidence_map_blocked'],
    ],
    [
      'topic-selection.v1a.generate-need-candidate.v1',
      [
        'need_candidate_batch_finalized',
        'need_candidate_supplemental_round',
        'need_candidate_human_review_required',
        'need_candidate_blocked',
      ],
    ],
    [
      'topic-selection.v1a.validate-need-adjudication.v1',
      [
        'need_adjudication_validated',
        'need_candidate_repair_required',
        'search_plan_recheck_required',
        'candidate_rejected',
        'candidate_parked',
        'candidate_merged',
        'adjudication_human_review_required',
        'adjudication_blocked',
      ],
    ],
    [
      'topic-selection.v1a.human-confirm-need.v1',
      ['human_confirmation_ready', 'human_confirmation_review_required', 'human_confirmation_blocked'],
    ],
    [
      'topic-selection.v1a.publish-v1b-input-bundle.v1',
      ['v1b_input_bundle_published', 'v1b_input_bundle_blocked'],
    ],
  ]);

  for (const [nodeId, signals] of expectedSignalsByNode.entries()) {
    const policy = TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES.find((item) => item.node_id === nodeId);
    assert.ok(policy, `policy exists for ${nodeId}`);
    for (const signal of signals) {
      let matchingEdgeCount = 0;
      for (const routeEdge of policy.route_edges) {
        if (routeEdge.route_signal === signal) {
          matchingEdgeCount += 1;
        }
      }
      assert.equal(matchingEdgeCount, 1, `${nodeId} signal ${signal} maps to one edge`);
    }
  }
});

test('v1a workflow harness policy registry keeps route ids, node ids, and edge ownership unique', () => {
  const nodeIds = new Set<string>();
  const routeIds = new Set<string>();

  for (const policy of TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES) {
    assert.equal(nodeIds.has(policy.node_id), false, `duplicate node policy ${policy.node_id}`);
    nodeIds.add(policy.node_id);
    const nodeSignals = new Set<string>();

    for (const routeEdge of policy.route_edges) {
      const allowedStatuses = policy.allowed_statuses as readonly string[];
      assert.equal(routeEdge.from_node_id, policy.node_id, `${routeEdge.route_id} must belong to ${policy.node_id}`);
      assert.equal(routeIds.has(routeEdge.route_id), false, `duplicate route_id ${routeEdge.route_id}`);
      routeIds.add(routeEdge.route_id);
      assert.equal(nodeSignals.has(routeEdge.route_signal), false, `${policy.node_id} duplicate ${routeEdge.route_signal}`);
      nodeSignals.add(routeEdge.route_signal);
      for (const status of routeEdge.allowed_statuses) {
        assert.equal(
          allowedStatuses.includes(status),
          true,
          `${routeEdge.route_id} status ${status} must be allowed by node policy`,
        );
      }
    }
  }
});

test('v1a workflow harness N7 policy includes repair, hold, and merge stop positive routes', () => {
  const policy = findTopicSelectionV1aWorkflowHarnessNodePolicy('topic-selection.v1a.validate-need-adjudication.v1');
  assert.equal(
    policy.route_edges.find((edge) => edge.route_signal === 'need_candidate_repair_required')?.route_decision,
    'loopback',
  );
  assert.equal(policy.route_edges.find((edge) => edge.route_signal === 'candidate_parked')?.route_decision, 'hold');
  assert.equal(
    policy.route_edges.find((edge) => edge.route_signal === 'candidate_merged')?.route_decision,
    'stop_no_advance',
  );
});
