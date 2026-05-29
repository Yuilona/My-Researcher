import {
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION =
  'TopicSelectionV1aWorkflowHarnessRunRequest@v1' as const;
export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_RESULT_SCHEMA_VERSION =
  'TopicSelectionV1aWorkflowHarnessRunResult@v1' as const;
export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION =
  'topic-selection-v1a-workflow-route-policy-v1' as const;

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS = [
  'topic-selection.v1a.create-topic-seed.v1',
  'topic-selection.v1a.snapshot-literature-resource-pool.v1',
  'topic-selection.v1a.create-search-plan.v1',
  'topic-selection.v1a.record-search-run.v1',
  'topic-selection.v1a.build-evidence-map.v1',
  'topic-selection.v1a.generate-need-candidate.v1',
  'topic-selection.v1a.validate-need-adjudication.v1',
  'topic-selection.v1a.human-confirm-need.v1',
  'topic-selection.v1a.publish-v1b-input-bundle.v1',
] as const;
export type TopicSelectionV1aWorkflowHarnessNodeId =
  (typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS)[number];

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_TARGET_NODE_IDS = [
  ...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS,
  'v1b.entry',
] as const;
export type TopicSelectionV1aWorkflowHarnessRouteTargetNodeId =
  (typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_TARGET_NODE_IDS)[number];

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_DECISIONS = [
  'invoke_next',
  'blocked',
  'wait',
  'loopback',
  'stop_no_advance',
  'hold',
  'stop_v1a_complete',
] as const;
export type TopicSelectionV1aWorkflowHarnessRouteDecision =
  (typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_DECISIONS)[number];

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_STATUSES = [
  'succeeded',
  'ready',
  'review_required',
  'require_human_review',
  'blocked',
  'terminal_no_advance',
] as const;
export type TopicSelectionV1aWorkflowHarnessNodeStatus =
  (typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_STATUSES)[number];

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_HANDOFF_KINDS = [
  'N1ToN2Handoff',
  'N2ToN3Handoff',
  'N3ToN4Handoff',
  'N4ToN5Handoff',
  'N5ToN6Handoff',
  'N6ToN7Handoff',
  'N7ToN8Handoff',
  'N8ToN9Handoff',
  'V1bInputBundle',
] as const;
export type TopicSelectionV1aWorkflowHarnessHandoffKind =
  (typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_HANDOFF_KINDS)[number];

export interface TopicSelectionV1aWorkflowHarnessRouteEdgePolicy {
  route_id: string;
  from_node_id: TopicSelectionV1aWorkflowHarnessNodeId;
  route_signal: string;
  route_decision: TopicSelectionV1aWorkflowHarnessRouteDecision;
  route_target_node_id: TopicSelectionV1aWorkflowHarnessRouteTargetNodeId | null;
  handoff_kind: TopicSelectionV1aWorkflowHarnessHandoffKind | null;
  allowed_statuses: readonly TopicSelectionV1aWorkflowHarnessNodeStatus[];
}

export interface TopicSelectionV1aWorkflowHarnessNodePolicy {
  node_index: number;
  node_id: TopicSelectionV1aWorkflowHarnessNodeId;
  node_policy: string;
  input_contract: string;
  authority_kind: string;
  output_handoff_kind: TopicSelectionV1aWorkflowHarnessHandoffKind | null;
  route_edges: readonly TopicSelectionV1aWorkflowHarnessRouteEdgePolicy[];
  allowed_statuses: readonly TopicSelectionV1aWorkflowHarnessNodeStatus[];
  blocker_codes: readonly string[];
  loopback_target_codes: readonly string[];
}

export interface TopicSelectionV1aWorkflowHarnessRunRequest {
  schema_version: typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION;
  node_id: TopicSelectionV1aWorkflowHarnessNodeId;
  workflow_run_id: string;
  node_attempt_id: string;
  policy_version: typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION;
  workspace_id?: string | null;
  title_card_id?: string | null;
  scenario_input: Record<string, unknown>;
  created_by?: TopicSelectionActorType;
}

export interface TopicSelectionV1aWorkflowHarnessRoutePolicyRef {
  policy_version: typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION;
  route_id: string;
  from_node_id: TopicSelectionV1aWorkflowHarnessNodeId;
  route_signal: string;
}

export interface TopicSelectionV1aWorkflowHarnessRunResult {
  schema_version: typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_RESULT_SCHEMA_VERSION;
  node_id: TopicSelectionV1aWorkflowHarnessNodeId;
  workflow_run_id: string;
  node_attempt_id: string;
  policy_version: typeof TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION;
  scenario_result: Record<string, unknown>;
  route_decision: TopicSelectionV1aWorkflowHarnessRouteDecision;
  route_signal: string;
  route_target_node_id: TopicSelectionV1aWorkflowHarnessRouteTargetNodeId | null;
  handoff_kind: TopicSelectionV1aWorkflowHarnessHandoffKind | null;
  route_policy_ref: TopicSelectionV1aWorkflowHarnessRoutePolicyRef;
  harness_trace_artifact_ref: TopicSelectionFunctionalRef | null;
  error_code: string | null;
  error_message: string | null;
}

const edge = (
  route_id: string,
  from_node_id: TopicSelectionV1aWorkflowHarnessNodeId,
  route_signal: string,
  route_decision: TopicSelectionV1aWorkflowHarnessRouteDecision,
  route_target_node_id: TopicSelectionV1aWorkflowHarnessRouteTargetNodeId | null,
  handoff_kind: TopicSelectionV1aWorkflowHarnessHandoffKind | null,
  allowed_statuses: readonly TopicSelectionV1aWorkflowHarnessNodeStatus[],
): TopicSelectionV1aWorkflowHarnessRouteEdgePolicy => ({
  route_id,
  from_node_id,
  route_signal,
  route_decision,
  route_target_node_id,
  handoff_kind,
  allowed_statuses,
});

export const TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES = [
  {
    node_index: 1,
    node_id: 'topic-selection.v1a.create-topic-seed.v1',
    node_policy: 'deterministic_create_topic_seed',
    input_contract: 'CreateTopicSeedScenarioInput@v1',
    authority_kind: 'TopicSeed',
    output_handoff_kind: 'N1ToN2Handoff',
    route_edges: [
      edge(
        'R1_N1_N2',
        'topic-selection.v1a.create-topic-seed.v1',
        'topic_seed_created',
        'invoke_next',
        'topic-selection.v1a.snapshot-literature-resource-pool.v1',
        'N1ToN2Handoff',
        ['succeeded'],
      ),
      edge('RB_N1_BLOCKED', 'topic-selection.v1a.create-topic-seed.v1', 'topic_seed_blocked', 'blocked', null, null, ['blocked']),
    ],
    allowed_statuses: ['succeeded', 'blocked'],
    blocker_codes: ['INVALID_PAYLOAD', 'NOT_FOUND', 'GATE_CONSTRAINT_FAILED'],
    loopback_target_codes: [],
  },
  {
    node_index: 2,
    node_id: 'topic-selection.v1a.snapshot-literature-resource-pool.v1',
    node_policy: 'deterministic_snapshot_literature_resource_pool',
    input_contract: 'SnapshotLiteratureResourcePoolScenarioInput@v1',
    authority_kind: 'LiteratureResourcePoolSnapshot',
    output_handoff_kind: 'N2ToN3Handoff',
    route_edges: [
      edge(
        'R2_N2_N3',
        'topic-selection.v1a.snapshot-literature-resource-pool.v1',
        'literature_resource_pool_snapshot_created',
        'invoke_next',
        'topic-selection.v1a.create-search-plan.v1',
        'N2ToN3Handoff',
        ['succeeded'],
      ),
      edge(
        'RB_N2_BLOCKED',
        'topic-selection.v1a.snapshot-literature-resource-pool.v1',
        'literature_resource_pool_snapshot_blocked',
        'blocked',
        null,
        null,
        ['blocked'],
      ),
    ],
    allowed_statuses: ['succeeded', 'blocked'],
    blocker_codes: ['UNSUPPORTED_SOURCE_SCOPE_FOR_NORMALIZED_V1A', 'INVALID_PAYLOAD', 'NOT_FOUND'],
    loopback_target_codes: [],
  },
  {
    node_index: 3,
    node_id: 'topic-selection.v1a.create-search-plan.v1',
    node_policy: 'deterministic_create_search_plan',
    input_contract: 'CreateSearchPlanScenarioInput@v1',
    authority_kind: 'SearchPlan',
    output_handoff_kind: 'N3ToN4Handoff',
    route_edges: [
      edge(
        'R3_N3_N4',
        'topic-selection.v1a.create-search-plan.v1',
        'search_plan_created',
        'invoke_next',
        'topic-selection.v1a.record-search-run.v1',
        'N3ToN4Handoff',
        ['succeeded'],
      ),
      edge(
        'RB_N3_BLOCKED',
        'topic-selection.v1a.create-search-plan.v1',
        'search_plan_blocked',
        'blocked',
        null,
        null,
        ['blocked'],
      ),
    ],
    allowed_statuses: ['succeeded', 'blocked'],
    blocker_codes: ['SEARCH_PLAN_BLUEPRINT_REQUIRED', 'INVALID_PAYLOAD', 'NOT_FOUND'],
    loopback_target_codes: [],
  },
  {
    node_index: 4,
    node_id: 'topic-selection.v1a.record-search-run.v1',
    node_policy: 'deterministic_record_search_run_with_search_coverage_gate',
    input_contract: 'RecordSearchRunScenarioInput@v1',
    authority_kind: 'SearchRun',
    output_handoff_kind: 'N4ToN5Handoff',
    route_edges: [
      edge(
        'R4_N4_N5',
        'topic-selection.v1a.record-search-run.v1',
        'search_run_consumable',
        'invoke_next',
        'topic-selection.v1a.build-evidence-map.v1',
        'N4ToN5Handoff',
        ['succeeded'],
      ),
      edge(
        'LB_N4_N4_RETRY_SEARCH_EXECUTION',
        'topic-selection.v1a.record-search-run.v1',
        'search_execution_retry_required',
        'loopback',
        'topic-selection.v1a.record-search-run.v1',
        null,
        ['succeeded'],
      ),
      edge(
        'LB_N4_N3_RECHECK_SEARCH_PLAN',
        'topic-selection.v1a.record-search-run.v1',
        'search_plan_recheck_required',
        'loopback',
        'topic-selection.v1a.create-search-plan.v1',
        null,
        ['succeeded'],
      ),
      edge(
        'LB_N4_N2_REFRESH_SNAPSHOT',
        'topic-selection.v1a.record-search-run.v1',
        'source_health_snapshot_refresh',
        'loopback',
        'topic-selection.v1a.snapshot-literature-resource-pool.v1',
        null,
        ['succeeded'],
      ),
      edge(
        'W_N4_HUMAN_COVERAGE_ACCEPTANCE',
        'topic-selection.v1a.record-search-run.v1',
        'search_coverage_human_review_required',
        'wait',
        null,
        null,
        ['succeeded', 'review_required'],
      ),
      edge('RB_N4_BLOCKED', 'topic-selection.v1a.record-search-run.v1', 'search_run_blocked', 'blocked', null, null, ['blocked']),
    ],
    allowed_statuses: ['succeeded', 'review_required', 'blocked'],
    blocker_codes: ['SEARCH_RUN_BUNDLE_REQUIRED', 'INVALID_PAYLOAD', 'NOT_FOUND', 'GATE_CONSTRAINT_FAILED'],
    loopback_target_codes: ['retry_search_execution', 'recheck_search_plan', 'refresh_literature_resource_pool'],
  },
  {
    node_index: 5,
    node_id: 'topic-selection.v1a.build-evidence-map.v1',
    node_policy: 'model_like_build_evidence_map_with_materialization_gate',
    input_contract: 'BuildEvidenceMapScenarioInput@v1',
    authority_kind: 'EvidenceMap',
    output_handoff_kind: 'N5ToN6Handoff',
    route_edges: [
      edge(
        'R5_N5_N6',
        'topic-selection.v1a.build-evidence-map.v1',
        'evidence_map_ready',
        'invoke_next',
        'topic-selection.v1a.generate-need-candidate.v1',
        'N5ToN6Handoff',
        ['succeeded'],
      ),
      edge(
        'W_N5_REVIEW_REQUIRED',
        'topic-selection.v1a.build-evidence-map.v1',
        'evidence_map_review_required',
        'wait',
        null,
        null,
        ['review_required'],
      ),
      edge('RB_N5_BLOCKED', 'topic-selection.v1a.build-evidence-map.v1', 'evidence_map_blocked', 'blocked', null, null, ['blocked']),
    ],
    allowed_statuses: ['succeeded', 'review_required', 'blocked'],
    blocker_codes: ['EVIDENCE_MAP_GATE_BLOCKED', 'INVALID_PAYLOAD', 'NOT_FOUND'],
    loopback_target_codes: [],
  },
  {
    node_index: 6,
    node_id: 'topic-selection.v1a.generate-need-candidate.v1',
    node_policy: 'model_like_generate_need_candidate_with_supplemental_round_gate',
    input_contract: 'GenerateNeedCandidateScenarioInput@v1',
    authority_kind: 'NeedCandidate',
    output_handoff_kind: 'N6ToN7Handoff',
    route_edges: [
      edge(
        'R6_N6_N7',
        'topic-selection.v1a.generate-need-candidate.v1',
        'need_candidate_batch_finalized',
        'invoke_next',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'N6ToN7Handoff',
        ['succeeded', 'ready'],
      ),
      edge(
        'LB_N6_N6_SUPPLEMENTAL',
        'topic-selection.v1a.generate-need-candidate.v1',
        'need_candidate_supplemental_round',
        'loopback',
        'topic-selection.v1a.generate-need-candidate.v1',
        null,
        ['succeeded', 'blocked'],
      ),
      edge(
        'W_N6_HUMAN_REVIEW',
        'topic-selection.v1a.generate-need-candidate.v1',
        'need_candidate_human_review_required',
        'wait',
        null,
        null,
        ['require_human_review', 'review_required'],
      ),
      edge('RB_N6_BLOCKED', 'topic-selection.v1a.generate-need-candidate.v1', 'need_candidate_blocked', 'blocked', null, null, ['blocked']),
    ],
    allowed_statuses: ['succeeded', 'ready', 'require_human_review', 'review_required', 'blocked'],
    blocker_codes: ['MINIMUM_SCHEMA_VALIDATION_FAILED', 'DRAFT_BATCH_ADMISSION_BLOCKED', 'INVALID_PAYLOAD'],
    loopback_target_codes: ['run_supplemental_round'],
  },
  {
    node_index: 7,
    node_id: 'topic-selection.v1a.validate-need-adjudication.v1',
    node_policy: 'model_like_validate_need_adjudication_with_decision_router',
    input_contract: 'ValidateNeedAdjudicationScenarioInput@v1',
    authority_kind: 'ValidateNeedAdjudicationResult',
    output_handoff_kind: 'N7ToN8Handoff',
    route_edges: [
      edge(
        'R7_N7_N8',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'need_adjudication_validated',
        'invoke_next',
        'topic-selection.v1a.human-confirm-need.v1',
        'N7ToN8Handoff',
        ['ready'],
      ),
      edge(
        'LB_N7_N6_REPAIR_CANDIDATE',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'need_candidate_repair_required',
        'loopback',
        'topic-selection.v1a.generate-need-candidate.v1',
        null,
        ['ready', 'blocked'],
      ),
      edge(
        'LB_N7_N3_RECHECK_SEARCH_PLAN',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'search_plan_recheck_required',
        'loopback',
        'topic-selection.v1a.create-search-plan.v1',
        null,
        ['ready', 'blocked'],
      ),
      edge(
        'S_N7_REJECTED',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'candidate_rejected',
        'stop_no_advance',
        null,
        null,
        ['ready', 'terminal_no_advance'],
      ),
      edge(
        'H_N7_PARKED',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'candidate_parked',
        'hold',
        null,
        null,
        ['ready', 'terminal_no_advance'],
      ),
      edge(
        'S_N7_MERGED',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'candidate_merged',
        'stop_no_advance',
        null,
        null,
        ['ready', 'terminal_no_advance'],
      ),
      edge(
        'W_N7_HUMAN_REVIEW',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'adjudication_human_review_required',
        'wait',
        null,
        null,
        ['require_human_review', 'review_required'],
      ),
      edge(
        'RB_N7_BLOCKED',
        'topic-selection.v1a.validate-need-adjudication.v1',
        'adjudication_blocked',
        'blocked',
        null,
        null,
        ['blocked'],
      ),
    ],
    allowed_statuses: ['ready', 'require_human_review', 'review_required', 'blocked', 'terminal_no_advance'],
    blocker_codes: ['DUPLICATE_OR_PENDING_ADJUDICATION', 'GATE_CONSTRAINT_FAILED', 'INVALID_PAYLOAD'],
    loopback_target_codes: ['need_candidate_repair', 'search_plan_recheck'],
  },
  {
    node_index: 8,
    node_id: 'topic-selection.v1a.human-confirm-need.v1',
    node_policy: 'human_confirm_need_with_semantic_review_gate',
    input_contract: 'HumanConfirmNeedScenarioInput@v1',
    authority_kind: 'ValidatedNeed',
    output_handoff_kind: 'N8ToN9Handoff',
    route_edges: [
      edge(
        'R8_N8_N9',
        'topic-selection.v1a.human-confirm-need.v1',
        'human_confirmation_ready',
        'invoke_next',
        'topic-selection.v1a.publish-v1b-input-bundle.v1',
        'N8ToN9Handoff',
        ['ready'],
      ),
      edge(
        'W_N8_HUMAN_REVIEW',
        'topic-selection.v1a.human-confirm-need.v1',
        'human_confirmation_review_required',
        'wait',
        null,
        null,
        ['require_human_review', 'review_required'],
      ),
      edge(
        'RB_N8_BLOCKED',
        'topic-selection.v1a.human-confirm-need.v1',
        'human_confirmation_blocked',
        'blocked',
        null,
        null,
        ['blocked'],
      ),
    ],
    allowed_statuses: ['ready', 'require_human_review', 'review_required', 'blocked'],
    blocker_codes: ['DUPLICATE_VALIDATED_NEED', 'SEMANTIC_CONFIRMATION_BLOCKED', 'INVALID_PAYLOAD'],
    loopback_target_codes: [],
  },
  {
    node_index: 9,
    node_id: 'topic-selection.v1a.publish-v1b-input-bundle.v1',
    node_policy: 'publish_v1b_input_bundle_once',
    input_contract: 'PublishV1bInputBundleScenarioInput@v1',
    authority_kind: 'V1bInputBundle',
    output_handoff_kind: 'V1bInputBundle',
    route_edges: [
      edge(
        'R9_N9_V1B',
        'topic-selection.v1a.publish-v1b-input-bundle.v1',
        'v1b_input_bundle_published',
        'stop_v1a_complete',
        'v1b.entry',
        'V1bInputBundle',
        ['ready'],
      ),
      edge(
        'RB_N9_BLOCKED',
        'topic-selection.v1a.publish-v1b-input-bundle.v1',
        'v1b_input_bundle_blocked',
        'blocked',
        null,
        null,
        ['blocked'],
      ),
    ],
    allowed_statuses: ['ready', 'blocked'],
    blocker_codes: ['MISSING_BUNDLE_LINEAGE', 'VERSION_CONFLICT', 'INVALID_PAYLOAD'],
    loopback_target_codes: [],
  },
] as const satisfies readonly TopicSelectionV1aWorkflowHarnessNodePolicy[];

export function findTopicSelectionV1aWorkflowHarnessNodePolicy(
  nodeId: TopicSelectionV1aWorkflowHarnessNodeId,
): TopicSelectionV1aWorkflowHarnessNodePolicy {
  const policy = TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_POLICIES.find((item) => item.node_id === nodeId);
  if (!policy) {
    throw new Error(`Unknown v1a workflow harness node policy: ${nodeId}`);
  }
  return policy;
}

export function findTopicSelectionV1aWorkflowHarnessRouteEdge(
  nodeId: TopicSelectionV1aWorkflowHarnessNodeId,
  routeSignal: string,
): TopicSelectionV1aWorkflowHarnessRouteEdgePolicy | null {
  return findTopicSelectionV1aWorkflowHarnessNodePolicy(nodeId).route_edges.find(
    (item) => item.route_signal === routeSignal,
  ) ?? null;
}

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const recordPayload = { type: 'object', additionalProperties: true } as const;
const nullableFunctionalRef = {
  anyOf: [
    topicSelectionFunctionalRefSchema,
    { type: 'null' },
  ],
} as const;

export const topicSelectionV1aWorkflowHarnessRouteEdgePolicySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'route_id',
    'from_node_id',
    'route_signal',
    'route_decision',
    'route_target_node_id',
    'handoff_kind',
    'allowed_statuses',
  ],
  properties: {
    route_id: stringId,
    from_node_id: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS] },
    route_signal: stringId,
    route_decision: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_DECISIONS] },
    route_target_node_id: {
      anyOf: [
        { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_TARGET_NODE_IDS] },
        { type: 'null' },
      ],
    },
    handoff_kind: {
      anyOf: [
        { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_HANDOFF_KINDS] },
        { type: 'null' },
      ],
    },
    allowed_statuses: {
      type: 'array',
      items: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_STATUSES] },
      minItems: 1,
      uniqueItems: true,
    },
  },
} as const;

export const topicSelectionV1aWorkflowHarnessNodePolicySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'node_index',
    'node_id',
    'node_policy',
    'input_contract',
    'authority_kind',
    'output_handoff_kind',
    'route_edges',
    'allowed_statuses',
    'blocker_codes',
    'loopback_target_codes',
  ],
  properties: {
    node_index: { type: 'integer', minimum: 1, maximum: 9 },
    node_id: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS] },
    node_policy: stringId,
    input_contract: stringId,
    authority_kind: stringId,
    output_handoff_kind: {
      anyOf: [
        { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_HANDOFF_KINDS] },
        { type: 'null' },
      ],
    },
    route_edges: {
      type: 'array',
      items: topicSelectionV1aWorkflowHarnessRouteEdgePolicySchema,
      minItems: 1,
    },
    allowed_statuses: {
      type: 'array',
      items: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_STATUSES] },
      minItems: 1,
      uniqueItems: true,
    },
    blocker_codes: {
      type: 'array',
      items: stringId,
    },
    loopback_target_codes: {
      type: 'array',
      items: stringId,
    },
  },
} as const;

export const topicSelectionV1aWorkflowHarnessNodePolicyRegistrySchema = {
  type: 'array',
  minItems: 9,
  maxItems: 9,
  items: topicSelectionV1aWorkflowHarnessNodePolicySchema,
} as const;

export const topicSelectionV1aWorkflowHarnessRunRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'schema_version',
    'node_id',
    'workflow_run_id',
    'node_attempt_id',
    'policy_version',
    'scenario_input',
  ],
  properties: {
    schema_version: {
      const: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_REQUEST_SCHEMA_VERSION,
    },
    node_id: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS] },
    workflow_run_id: stringId,
    node_attempt_id: stringId,
    policy_version: { const: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION },
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    scenario_input: recordPayload,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
  },
} as const;

export const topicSelectionV1aWorkflowHarnessRoutePolicyRefSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['policy_version', 'route_id', 'from_node_id', 'route_signal'],
  properties: {
    policy_version: { const: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION },
    route_id: stringId,
    from_node_id: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS] },
    route_signal: stringId,
  },
} as const;

export const topicSelectionV1aWorkflowHarnessRunResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'schema_version',
    'node_id',
    'workflow_run_id',
    'node_attempt_id',
    'policy_version',
    'scenario_result',
    'route_decision',
    'route_signal',
    'route_target_node_id',
    'handoff_kind',
    'route_policy_ref',
    'harness_trace_artifact_ref',
    'error_code',
    'error_message',
  ],
  properties: {
    schema_version: {
      const: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_RUN_RESULT_SCHEMA_VERSION,
    },
    node_id: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_NODE_IDS] },
    workflow_run_id: stringId,
    node_attempt_id: stringId,
    policy_version: { const: TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_POLICY_VERSION },
    scenario_result: recordPayload,
    route_decision: { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_DECISIONS] },
    route_signal: stringId,
    route_target_node_id: {
      anyOf: [
        { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_ROUTE_TARGET_NODE_IDS] },
        { type: 'null' },
      ],
    },
    handoff_kind: {
      anyOf: [
        { enum: [...TOPIC_SELECTION_V1A_WORKFLOW_HARNESS_HANDOFF_KINDS] },
        { type: 'null' },
      ],
    },
    route_policy_ref: topicSelectionV1aWorkflowHarnessRoutePolicyRefSchema,
    harness_trace_artifact_ref: nullableFunctionalRef,
    error_code: nullableStringId,
    error_message: nullableStringId,
  },
} as const;
