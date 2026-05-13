import {
  topicSelectionActorRefSchema,
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorRef,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';

export const TOPIC_SELECTION_SEED_KINDS = ['title_card', 'manual', 'imported'] as const;
export type TopicSelectionSeedKind = (typeof TOPIC_SELECTION_SEED_KINDS)[number];

export const TOPIC_SELECTION_RESOURCE_POOL_SOURCES = [
  'title_card_evidence_basket',
  'manual_selection',
  'search_result',
] as const;
export type TopicSelectionResourcePoolSource = (typeof TOPIC_SELECTION_RESOURCE_POOL_SOURCES)[number];

export const TOPIC_SELECTION_SEARCH_PLAN_STATUSES = [
  'draft',
  'ready',
  'superseded',
  'rejected',
] as const;
export type TopicSelectionSearchPlanStatus = (typeof TOPIC_SELECTION_SEARCH_PLAN_STATUSES)[number];

export const TOPIC_SELECTION_COVERAGE_INTENT_TYPES = [
  'support',
  'challenge',
  'baseline',
  'context',
  'exclusion',
] as const;
export type TopicSelectionCoverageIntentType = (typeof TOPIC_SELECTION_COVERAGE_INTENT_TYPES)[number];

export const TOPIC_SELECTION_EVIDENCE_ROLES = [
  'support',
  'challenge',
  'baseline',
  'context',
  'unknown',
] as const;
export type TopicSelectionEvidenceRole = (typeof TOPIC_SELECTION_EVIDENCE_ROLES)[number];

export const TOPIC_SELECTION_COVERAGE_EXECUTION_STATUSES = [
  'not_run',
  'succeeded',
  'partial',
  'failed',
  'blocked',
] as const;
export type TopicSelectionCoverageExecutionStatus =
  (typeof TOPIC_SELECTION_COVERAGE_EXECUTION_STATUSES)[number];

export const TOPIC_SELECTION_COVERAGE_BINDING_KINDS = [
  'retrieval_hit',
  'seeded_resource',
  'manual_source',
] as const;
export type TopicSelectionCoverageBindingKind = (typeof TOPIC_SELECTION_COVERAGE_BINDING_KINDS)[number];

export const TOPIC_SELECTION_COVERAGE_ASSESSMENT_VERDICTS = [
  'satisfied',
  'partial',
  'missing',
  'accepted_risk',
] as const;
export type TopicSelectionCoverageAssessmentVerdict =
  (typeof TOPIC_SELECTION_COVERAGE_ASSESSMENT_VERDICTS)[number];

export const TOPIC_SELECTION_SEARCH_RUN_KINDS = [
  'planned_search',
  'recheck_followup',
  'manual_import',
] as const;
export type TopicSelectionSearchRunKind = (typeof TOPIC_SELECTION_SEARCH_RUN_KINDS)[number];

export const TOPIC_SELECTION_SEARCH_RUN_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'partial',
  'failed',
  'blocked',
] as const;
export type TopicSelectionSearchRunStatus = (typeof TOPIC_SELECTION_SEARCH_RUN_STATUSES)[number];

export const TOPIC_SELECTION_RECHECK_REQUEST_STATUSES = [
  'open',
  'accepted',
  'rejected',
  'accepted_risk',
  'materialized',
] as const;
export type TopicSelectionSearchPlanRecheckRequestStatus =
  (typeof TOPIC_SELECTION_RECHECK_REQUEST_STATUSES)[number];

export interface TopicSelectionTopicSeedRecord {
  topic_seed_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  seed_version: string;
  seed_kind: TopicSelectionSeedKind;
  working_title: string;
  intent_summary: string;
  scope_notes?: string | null;
  source_title_card_ref: TopicSelectionFunctionalRef;
  source_refs: TopicSelectionFunctionalRef[];
  input_snapshot_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionSourceHealthSummary {
  total_literature_count: number;
  missing_literature_ids: string[];
  rights_class_counts: Record<string, number>;
  pipeline_ready_count: number;
  abstract_ready_count: number;
  key_content_ready_count: number;
  fulltext_ready_count: number;
  source_count: number;
  stale_count: number;
  blocked_count: number;
  warning_codes: string[];
}

export interface TopicSelectionLiteratureResourcePoolSnapshotRecord {
  literature_resource_pool_snapshot_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  snapshot_version: string;
  source_scope: TopicSelectionResourcePoolSource;
  topic_seed_ref: TopicSelectionFunctionalRef;
  literature_refs: TopicSelectionFunctionalRef[];
  content_source_refs: TopicSelectionFunctionalRef[];
  source_health_summary: TopicSelectionSourceHealthSummary;
  snapshot_hash: string;
  input_snapshot_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionSearchPlanRecord {
  search_plan_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  plan_version: string;
  status: TopicSelectionSearchPlanStatus;
  topic_seed_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  parent_search_plan_ref?: TopicSelectionFunctionalRef | null;
  recheck_request_ref?: TopicSelectionFunctionalRef | null;
  query_intents: string[];
  must_check_constraints: string[];
  exclusion_rules: string[];
  coverage_strategy: Record<string, unknown>;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionCoverageRowIntentRecord {
  coverage_row_intent_id: string;
  search_plan_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  coverage_key: string;
  intent_type: TopicSelectionCoverageIntentType;
  query: string;
  rationale: string;
  required: boolean;
  priority: number;
  target_source_types: string[];
  expected_evidence_role: TopicSelectionEvidenceRole;
  refs: TopicSelectionFunctionalRef[];
  created_at: string;
}

export interface TopicSelectionCoverageExecutionObservationRecord {
  coverage_execution_observation_id: string;
  search_plan_id: string;
  coverage_row_intent_id: string;
  search_run_id?: string | null;
  status: TopicSelectionCoverageExecutionStatus;
  result_count: number;
  source_count: number;
  missing_reason_codes: string[];
  notes?: string | null;
  created_at: string;
}

export interface TopicSelectionCoverageEvidenceBindingRecord {
  coverage_evidence_binding_id: string;
  search_plan_id: string;
  coverage_row_intent_id: string;
  search_run_id: string;
  literature_ref: TopicSelectionFunctionalRef;
  source_refs: TopicSelectionFunctionalRef[];
  binding_kind: TopicSelectionCoverageBindingKind;
  result_rank?: number | null;
  created_at: string;
}

export interface TopicSelectionCoverageAssessmentRecord {
  coverage_assessment_id: string;
  search_plan_id: string;
  coverage_row_intent_id: string;
  verdict: TopicSelectionCoverageAssessmentVerdict;
  issue_codes: string[];
  confidence?: number | null;
  assessed_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionCoverageRiskAcceptanceRecord {
  coverage_risk_acceptance_id: string;
  search_plan_id: string;
  coverage_row_intent_id: string;
  accepted_risk_ref: TopicSelectionFunctionalRef;
  accepted_by: TopicSelectionActorRef;
  rationale: string;
  expires_at?: string | null;
  created_at: string;
}

export interface TopicSelectionSearchRunResultAccounting {
  total_result_count: number;
  unique_literature_count: number;
  duplicate_result_count: number;
  failed_source_count: number;
  skipped_source_count: number;
}

export interface TopicSelectionSearchRunRecord {
  search_run_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  run_kind: TopicSelectionSearchRunKind;
  run_status: TopicSelectionSearchRunStatus;
  query_provenance: Array<Record<string, unknown>>;
  result_accounting: TopicSelectionSearchRunResultAccounting;
  source_health_summary: Record<string, unknown>;
  dedup_summary: Record<string, unknown>;
  evidence_map_input_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  started_at: string;
  finished_at?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionSearchPlanRecheckRequestRecord {
  search_plan_recheck_request_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  source_ref: TopicSelectionFunctionalRef;
  target_search_plan_ref: TopicSelectionFunctionalRef;
  target_literature_snapshot_ref?: TopicSelectionFunctionalRef | null;
  reason: string;
  gap_codes: string[];
  requested_by: TopicSelectionActorType;
  status: TopicSelectionSearchPlanRecheckRequestStatus;
  decision_summary?: string | null;
  policy_version_id?: string | null;
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  resulting_search_plan_ref?: TopicSelectionFunctionalRef | null;
  resulting_search_run_ref?: TopicSelectionFunctionalRef | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface TopicSelectionSearchPlanCoverageMatrixRow {
  coverage_row_intent: TopicSelectionCoverageRowIntentRecord;
  latest_observation?: TopicSelectionCoverageExecutionObservationRecord | null;
  latest_assessment?: TopicSelectionCoverageAssessmentRecord | null;
  evidence_bindings: TopicSelectionCoverageEvidenceBindingRecord[];
  risk_acceptances: TopicSelectionCoverageRiskAcceptanceRecord[];
}

export interface TopicSelectionSearchPlanCoverageMatrix {
  search_plan_ref: TopicSelectionFunctionalRef;
  generated_at: string;
  rows: TopicSelectionSearchPlanCoverageMatrixRow[];
  summary: {
    row_count: number;
    satisfied_count: number;
    partial_count: number;
    missing_count: number;
    accepted_risk_count: number;
    unassessed_count: number;
  };
}

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const numberValue = { type: 'number' } as const;
const nullableNumber = { anyOf: [numberValue, { type: 'null' }] } as const;
const booleanValue = { type: 'boolean' } as const;
const stringArray = { type: 'array', items: stringId } as const;
const objectPayload = { type: 'object', additionalProperties: true } as const;
const functionalRefArray = { type: 'array', items: topicSelectionFunctionalRefSchema } as const;
const recordArray = { type: 'array', items: objectPayload } as const;

export const topicSelectionSourceHealthSummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'total_literature_count',
    'missing_literature_ids',
    'rights_class_counts',
    'pipeline_ready_count',
    'abstract_ready_count',
    'key_content_ready_count',
    'fulltext_ready_count',
    'source_count',
    'stale_count',
    'blocked_count',
    'warning_codes',
  ],
  properties: {
    total_literature_count: numberValue,
    missing_literature_ids: stringArray,
    rights_class_counts: { type: 'object', additionalProperties: { type: 'number' } },
    pipeline_ready_count: numberValue,
    abstract_ready_count: numberValue,
    key_content_ready_count: numberValue,
    fulltext_ready_count: numberValue,
    source_count: numberValue,
    stale_count: numberValue,
    blocked_count: numberValue,
    warning_codes: stringArray,
  },
} as const;

export const topicSelectionTopicSeedRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'topic_seed_id',
    'title_card_id',
    'seed_version',
    'seed_kind',
    'working_title',
    'intent_summary',
    'source_title_card_ref',
    'source_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    topic_seed_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    seed_version: stringId,
    seed_kind: { enum: [...TOPIC_SELECTION_SEED_KINDS] },
    working_title: stringId,
    intent_summary: stringId,
    scope_notes: nullableStringId,
    source_title_card_ref: topicSelectionFunctionalRefSchema,
    source_refs: functionalRefArray,
    input_snapshot_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    trace_snapshot_id: nullableStringId,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionLiteratureResourcePoolSnapshotRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'literature_resource_pool_snapshot_id',
    'title_card_id',
    'snapshot_version',
    'source_scope',
    'topic_seed_ref',
    'literature_refs',
    'content_source_refs',
    'source_health_summary',
    'snapshot_hash',
    'created_by',
    'created_at',
  ],
  properties: {
    literature_resource_pool_snapshot_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    snapshot_version: stringId,
    source_scope: { enum: [...TOPIC_SELECTION_RESOURCE_POOL_SOURCES] },
    topic_seed_ref: topicSelectionFunctionalRefSchema,
    literature_refs: functionalRefArray,
    content_source_refs: functionalRefArray,
    source_health_summary: topicSelectionSourceHealthSummarySchema,
    snapshot_hash: stringId,
    input_snapshot_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionSearchPlanRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'search_plan_id',
    'title_card_id',
    'plan_version',
    'status',
    'topic_seed_ref',
    'literature_snapshot_ref',
    'query_intents',
    'must_check_constraints',
    'exclusion_rules',
    'coverage_strategy',
    'artifact_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    search_plan_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    plan_version: stringId,
    status: { enum: [...TOPIC_SELECTION_SEARCH_PLAN_STATUSES] },
    topic_seed_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    parent_search_plan_ref: { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] },
    recheck_request_ref: { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] },
    query_intents: stringArray,
    must_check_constraints: stringArray,
    exclusion_rules: stringArray,
    coverage_strategy: objectPayload,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    artifact_refs: functionalRefArray,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionCoverageRowIntentRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'coverage_row_intent_id',
    'search_plan_id',
    'coverage_key',
    'intent_type',
    'query',
    'rationale',
    'required',
    'priority',
    'target_source_types',
    'expected_evidence_role',
    'refs',
    'created_at',
  ],
  properties: {
    coverage_row_intent_id: stringId,
    search_plan_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    coverage_key: stringId,
    intent_type: { enum: [...TOPIC_SELECTION_COVERAGE_INTENT_TYPES] },
    query: stringId,
    rationale: stringId,
    required: booleanValue,
    priority: numberValue,
    target_source_types: stringArray,
    expected_evidence_role: { enum: [...TOPIC_SELECTION_EVIDENCE_ROLES] },
    refs: functionalRefArray,
    created_at: stringId,
  },
} as const;

export const topicSelectionCoverageExecutionObservationRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'coverage_execution_observation_id',
    'search_plan_id',
    'coverage_row_intent_id',
    'status',
    'result_count',
    'source_count',
    'missing_reason_codes',
    'created_at',
  ],
  properties: {
    coverage_execution_observation_id: stringId,
    search_plan_id: stringId,
    coverage_row_intent_id: stringId,
    search_run_id: nullableStringId,
    status: { enum: [...TOPIC_SELECTION_COVERAGE_EXECUTION_STATUSES] },
    result_count: numberValue,
    source_count: numberValue,
    missing_reason_codes: stringArray,
    notes: nullableStringId,
    created_at: stringId,
  },
} as const;

export const topicSelectionCoverageEvidenceBindingRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'coverage_evidence_binding_id',
    'search_plan_id',
    'coverage_row_intent_id',
    'search_run_id',
    'literature_ref',
    'source_refs',
    'binding_kind',
    'created_at',
  ],
  properties: {
    coverage_evidence_binding_id: stringId,
    search_plan_id: stringId,
    coverage_row_intent_id: stringId,
    search_run_id: stringId,
    literature_ref: topicSelectionFunctionalRefSchema,
    source_refs: functionalRefArray,
    binding_kind: { enum: [...TOPIC_SELECTION_COVERAGE_BINDING_KINDS] },
    result_rank: nullableNumber,
    created_at: stringId,
  },
} as const;

export const topicSelectionCoverageAssessmentRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'coverage_assessment_id',
    'search_plan_id',
    'coverage_row_intent_id',
    'verdict',
    'issue_codes',
    'assessed_by',
    'created_at',
  ],
  properties: {
    coverage_assessment_id: stringId,
    search_plan_id: stringId,
    coverage_row_intent_id: stringId,
    verdict: { enum: [...TOPIC_SELECTION_COVERAGE_ASSESSMENT_VERDICTS] },
    issue_codes: stringArray,
    confidence: nullableNumber,
    assessed_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionCoverageRiskAcceptanceRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'coverage_risk_acceptance_id',
    'search_plan_id',
    'coverage_row_intent_id',
    'accepted_risk_ref',
    'accepted_by',
    'rationale',
    'created_at',
  ],
  properties: {
    coverage_risk_acceptance_id: stringId,
    search_plan_id: stringId,
    coverage_row_intent_id: stringId,
    accepted_risk_ref: topicSelectionFunctionalRefSchema,
    accepted_by: topicSelectionActorRefSchema,
    rationale: stringId,
    expires_at: nullableStringId,
    created_at: stringId,
  },
} as const;

export const topicSelectionSearchRunResultAccountingSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'total_result_count',
    'unique_literature_count',
    'duplicate_result_count',
    'failed_source_count',
    'skipped_source_count',
  ],
  properties: {
    total_result_count: numberValue,
    unique_literature_count: numberValue,
    duplicate_result_count: numberValue,
    failed_source_count: numberValue,
    skipped_source_count: numberValue,
  },
} as const;

export const topicSelectionSearchRunRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'search_run_id',
    'title_card_id',
    'search_plan_ref',
    'literature_snapshot_ref',
    'run_kind',
    'run_status',
    'query_provenance',
    'result_accounting',
    'source_health_summary',
    'dedup_summary',
    'evidence_map_input_refs',
    'artifact_refs',
    'started_at',
    'created_by',
    'created_at',
  ],
  properties: {
    search_run_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    run_kind: { enum: [...TOPIC_SELECTION_SEARCH_RUN_KINDS] },
    run_status: { enum: [...TOPIC_SELECTION_SEARCH_RUN_STATUSES] },
    query_provenance: recordArray,
    result_accounting: topicSelectionSearchRunResultAccountingSchema,
    source_health_summary: objectPayload,
    dedup_summary: objectPayload,
    evidence_map_input_refs: functionalRefArray,
    artifact_refs: functionalRefArray,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    started_at: stringId,
    finished_at: nullableStringId,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionSearchPlanRecheckRequestRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'search_plan_recheck_request_id',
    'title_card_id',
    'source_ref',
    'target_search_plan_ref',
    'reason',
    'gap_codes',
    'requested_by',
    'status',
    'accepted_risk_refs',
    'created_at',
  ],
  properties: {
    search_plan_recheck_request_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    source_ref: topicSelectionFunctionalRefSchema,
    target_search_plan_ref: topicSelectionFunctionalRefSchema,
    target_literature_snapshot_ref: { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] },
    reason: stringId,
    gap_codes: stringArray,
    requested_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    status: { enum: [...TOPIC_SELECTION_RECHECK_REQUEST_STATUSES] },
    decision_summary: nullableStringId,
    policy_version_id: nullableStringId,
    accepted_risk_refs: functionalRefArray,
    resulting_search_plan_ref: { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] },
    resulting_search_run_ref: { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] },
    created_at: stringId,
    resolved_at: nullableStringId,
  },
} as const;

export const topicSelectionSearchPlanCoverageMatrixSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['search_plan_ref', 'generated_at', 'rows', 'summary'],
  properties: {
    search_plan_ref: topicSelectionFunctionalRefSchema,
    generated_at: stringId,
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['coverage_row_intent', 'evidence_bindings', 'risk_acceptances'],
        properties: {
          coverage_row_intent: topicSelectionCoverageRowIntentRecordSchema,
          latest_observation: {
            anyOf: [topicSelectionCoverageExecutionObservationRecordSchema, { type: 'null' }],
          },
          latest_assessment: {
            anyOf: [topicSelectionCoverageAssessmentRecordSchema, { type: 'null' }],
          },
          evidence_bindings: {
            type: 'array',
            items: topicSelectionCoverageEvidenceBindingRecordSchema,
          },
          risk_acceptances: {
            type: 'array',
            items: topicSelectionCoverageRiskAcceptanceRecordSchema,
          },
        },
      },
    },
    summary: {
      type: 'object',
      additionalProperties: false,
      required: [
        'row_count',
        'satisfied_count',
        'partial_count',
        'missing_count',
        'accepted_risk_count',
        'unassessed_count',
      ],
      properties: {
        row_count: numberValue,
        satisfied_count: numberValue,
        partial_count: numberValue,
        missing_count: numberValue,
        accepted_risk_count: numberValue,
        unassessed_count: numberValue,
      },
    },
  },
} as const;
