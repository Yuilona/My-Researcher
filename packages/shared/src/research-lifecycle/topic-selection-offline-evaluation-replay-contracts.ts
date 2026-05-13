import {
  TOPIC_SELECTION_ACTOR_TYPES,
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';
import {
  TOPIC_SELECTION_NEED_ADJUDICATION_DECISIONS,
  TOPIC_SELECTION_NEED_READINESS_RECOMMENDATIONS,
  type TopicSelectionNeedAdjudicationDecision,
  type TopicSelectionNeedReadinessRecommendation,
} from './topic-selection-need-validation-contracts.js';

export const TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES = [
  'true_unmet_need',
  'pseudo_gap',
  'strong_baseline_solved',
  'author_future_work_misleading',
  'abstract_overclaim_body_unsupported',
  'terminology_shift_same_task',
  'same_team_duplicate_claim',
  'source_health_or_missing_fulltext',
  'downstream_failure_feedback',
] as const;
export type TopicSelectionOfflineEvaluationCaseType =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES)[number];

export const TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_STATUSES = [
  'draft',
  'active',
  'archived',
] as const;
export type TopicSelectionOfflineEvaluationDatasetStatus =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_STATUSES)[number];

export const TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_SOURCES = [
  'synthetic_fixture',
  'frozen_snapshot',
  'mixed',
] as const;
export type TopicSelectionOfflineEvaluationDatasetSource =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_SOURCES)[number];

export const TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_STATUSES = [
  'active',
  'retired',
] as const;
export type TopicSelectionOfflineEvaluationCaseStatus =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_STATUSES)[number];

export const TOPIC_SELECTION_OFFLINE_EVALUATION_RUN_STATUSES = [
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;
export type TopicSelectionOfflineEvaluationRunStatus =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_RUN_STATUSES)[number];

export const TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_RESULT_STATUSES = [
  'recorded',
  'evaluated',
  'failed',
] as const;
export type TopicSelectionOfflineEvaluationCaseResultStatus =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_RESULT_STATUSES)[number];

export const TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS = [
  'false_gap_rate',
  'baseline_miss_rate',
  'counter_evidence_recall',
  'trace_completeness',
  'readiness_false_pass_rate',
  'human_override_rate',
  'rerun_instability',
  'recheck_precision',
  'negative_memory_usefulness',
  'downstream_rework_cause',
] as const;
export type TopicSelectionOfflineEvaluationMetricKey =
  (typeof TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS)[number];

export const TOPIC_SELECTION_REPLAY_DIFF_STATUSES = ['match', 'mismatch'] as const;
export type TopicSelectionReplayDiffStatus = (typeof TOPIC_SELECTION_REPLAY_DIFF_STATUSES)[number];

export const TOPIC_SELECTION_REPLAY_DIFF_DIMENSIONS = [
  'final_decision',
  'key_evidence_set',
  'blocker_set',
  'trace_verdict',
] as const;
export type TopicSelectionReplayDiffDimension = (typeof TOPIC_SELECTION_REPLAY_DIFF_DIMENSIONS)[number];

export interface TopicSelectionOfflineFrozenInputBundle {
  stage: 'v1a';
  frozen_at: string;
  source_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  stage_snapshots: {
    control_plane?: Record<string, unknown>;
    search_resource?: Record<string, unknown>;
    evidence_map?: Record<string, unknown>;
    need_validation?: Record<string, unknown>;
    recheck_risk_memory?: Record<string, unknown>;
    downstream_feedback?: Record<string, unknown>;
  };
  payload: Record<string, unknown>;
}

export interface TopicSelectionOfflineEvaluationGoldExpectation {
  expected_unmet_need: boolean;
  expected_final_decision?: TopicSelectionNeedAdjudicationDecision | null;
  expected_readiness_passed?: boolean | null;
  expected_key_evidence_refs: TopicSelectionFunctionalRef[];
  expected_counter_evidence_refs: TopicSelectionFunctionalRef[];
  expected_blocker_codes: string[];
  required_trace_refs: TopicSelectionFunctionalRef[];
  expected_trace_verdict?: string | null;
  expected_recheck_action_refs: TopicSelectionFunctionalRef[];
  expected_negative_memory_refs: TopicSelectionFunctionalRef[];
  expected_downstream_rework_causes: string[];
  expected_baseline_solved?: boolean;
  notes: string[];
}

export interface TopicSelectionOfflineEvaluationObservedSnapshot {
  final_decision?: TopicSelectionNeedAdjudicationDecision | null;
  readiness_recommendation?: TopicSelectionNeedReadinessRecommendation | null;
  readiness_passed?: boolean | null;
  key_evidence_refs: TopicSelectionFunctionalRef[];
  counter_evidence_refs: TopicSelectionFunctionalRef[];
  evidence_refs: TopicSelectionFunctionalRef[];
  blocker_codes: string[];
  trace_refs: TopicSelectionFunctionalRef[];
  trace_verdict?: string | null;
  human_override_refs: TopicSelectionFunctionalRef[];
  recheck_action_refs: TopicSelectionFunctionalRef[];
  memory_refs: TopicSelectionFunctionalRef[];
  memory_used_as_evidence_refs: TopicSelectionFunctionalRef[];
  downstream_rework_causes: string[];
  payload: Record<string, unknown>;
}

export interface TopicSelectionOfflineEvaluationObservedOutput
  extends TopicSelectionOfflineEvaluationObservedSnapshot {
  baseline_observed_output?: TopicSelectionOfflineEvaluationObservedSnapshot | null;
}

export interface TopicSelectionOfflineEvaluationDatasetRecord {
  offline_evaluation_dataset_id: string;
  workspace_id?: string | null;
  dataset_key: string;
  dataset_version: string;
  stage: 'v1a';
  source: TopicSelectionOfflineEvaluationDatasetSource;
  status: TopicSelectionOfflineEvaluationDatasetStatus;
  description?: string | null;
  case_count: number;
  case_type_coverage: TopicSelectionOfflineEvaluationCaseType[];
  payload: Record<string, unknown>;
  created_by: TopicSelectionActorType;
  created_at: string;
  updated_at: string;
}

export interface TopicSelectionOfflineEvaluationCaseRecord {
  offline_evaluation_case_id: string;
  workspace_id?: string | null;
  dataset_id: string;
  title_card_id?: string | null;
  case_key: string;
  case_type: TopicSelectionOfflineEvaluationCaseType;
  status: TopicSelectionOfflineEvaluationCaseStatus;
  frozen_input_bundle: TopicSelectionOfflineFrozenInputBundle;
  gold_expectation: TopicSelectionOfflineEvaluationGoldExpectation;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TopicSelectionOfflineEvaluationRunRecord {
  offline_evaluation_run_id: string;
  workspace_id?: string | null;
  dataset_id: string;
  run_key: string;
  status: TopicSelectionOfflineEvaluationRunStatus;
  workflow_profile_key: string;
  workflow_profile_version?: string | null;
  model_profile_key?: string | null;
  search_profile_key?: string | null;
  policy_version_id?: string | null;
  metric_keys: TopicSelectionOfflineEvaluationMetricKey[];
  case_count: number;
  run_payload: Record<string, unknown>;
  created_by: TopicSelectionActorType;
  started_at: string;
  finished_at?: string | null;
}

export interface TopicSelectionOfflineEvaluationCaseResultRecord {
  offline_evaluation_case_result_id: string;
  workspace_id?: string | null;
  run_id: string;
  dataset_id: string;
  case_id: string;
  case_type: TopicSelectionOfflineEvaluationCaseType;
  status: TopicSelectionOfflineEvaluationCaseResultStatus;
  observed_output: TopicSelectionOfflineEvaluationObservedOutput;
  replay_diff_ref?: TopicSelectionFunctionalRef | null;
  metric_contribution_payload: Record<string, unknown>;
  failure_examples: string[];
  created_at: string;
}

export interface TopicSelectionOfflineEvaluationMetricResultRecord {
  offline_evaluation_metric_result_id: string;
  workspace_id?: string | null;
  run_id: string;
  dataset_id: string;
  metric_key: TopicSelectionOfflineEvaluationMetricKey;
  numerator: number;
  denominator: number;
  value: number | null;
  contributing_case_refs: TopicSelectionFunctionalRef[];
  failure_case_refs: TopicSelectionFunctionalRef[];
  notes: string[];
  metric_payload: Record<string, unknown>;
  created_at: string;
}

export interface TopicSelectionReplayDiffRecord {
  replay_diff_id: string;
  workspace_id?: string | null;
  run_id: string;
  dataset_id: string;
  case_id: string;
  status: TopicSelectionReplayDiffStatus;
  changed_dimensions: TopicSelectionReplayDiffDimension[];
  final_decision_changed: boolean;
  key_evidence_set_changed: boolean;
  blocker_set_changed: boolean;
  trace_verdict_changed: boolean;
  expected_snapshot: Record<string, unknown>;
  observed_snapshot: TopicSelectionOfflineEvaluationObservedOutput;
  baseline_snapshot?: TopicSelectionOfflineEvaluationObservedSnapshot | null;
  diff_payload: Record<string, unknown>;
  created_at: string;
}

export function createTopicSelectionOfflineFrozenInputBundle(
  input: Partial<TopicSelectionOfflineFrozenInputBundle> & { frozen_at: string },
): TopicSelectionOfflineFrozenInputBundle {
  return {
    stage: 'v1a',
    frozen_at: input.frozen_at,
    source_refs: input.source_refs ?? [],
    artifact_refs: input.artifact_refs ?? [],
    stage_snapshots: input.stage_snapshots ?? {},
    payload: input.payload ?? {},
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
const nullableFunctionalRef = { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] } as const;
const nullableNeedAdjudicationDecision = {
  anyOf: [{ enum: [...TOPIC_SELECTION_NEED_ADJUDICATION_DECISIONS] }, { type: 'null' }],
} as const;
const nullableNeedReadinessRecommendation = {
  anyOf: [{ enum: [...TOPIC_SELECTION_NEED_READINESS_RECOMMENDATIONS] }, { type: 'null' }],
} as const;

export const topicSelectionOfflineFrozenInputBundleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['stage', 'frozen_at', 'source_refs', 'artifact_refs', 'stage_snapshots', 'payload'],
  properties: {
    stage: { enum: ['v1a'] },
    frozen_at: stringId,
    source_refs: functionalRefArray,
    artifact_refs: functionalRefArray,
    stage_snapshots: objectPayload,
    payload: objectPayload,
  },
} as const;

export const topicSelectionOfflineEvaluationGoldExpectationSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'expected_unmet_need',
    'expected_key_evidence_refs',
    'expected_counter_evidence_refs',
    'expected_blocker_codes',
    'required_trace_refs',
    'expected_recheck_action_refs',
    'expected_negative_memory_refs',
    'expected_downstream_rework_causes',
    'notes',
  ],
  properties: {
    expected_unmet_need: booleanValue,
    expected_final_decision: nullableNeedAdjudicationDecision,
    expected_readiness_passed: { anyOf: [booleanValue, { type: 'null' }] },
    expected_key_evidence_refs: functionalRefArray,
    expected_counter_evidence_refs: functionalRefArray,
    expected_blocker_codes: stringArray,
    required_trace_refs: functionalRefArray,
    expected_trace_verdict: nullableStringId,
    expected_recheck_action_refs: functionalRefArray,
    expected_negative_memory_refs: functionalRefArray,
    expected_downstream_rework_causes: stringArray,
    expected_baseline_solved: booleanValue,
    notes: stringArray,
  },
} as const;

const topicSelectionOfflineEvaluationObservedSnapshotRequired = [
  'key_evidence_refs',
  'counter_evidence_refs',
  'evidence_refs',
  'blocker_codes',
  'trace_refs',
  'human_override_refs',
  'recheck_action_refs',
  'memory_refs',
  'memory_used_as_evidence_refs',
  'downstream_rework_causes',
  'payload',
] as const;

const topicSelectionOfflineEvaluationObservedSnapshotProperties = {
  final_decision: nullableNeedAdjudicationDecision,
  readiness_recommendation: nullableNeedReadinessRecommendation,
  readiness_passed: { anyOf: [booleanValue, { type: 'null' }] },
  key_evidence_refs: functionalRefArray,
  counter_evidence_refs: functionalRefArray,
  evidence_refs: functionalRefArray,
  blocker_codes: stringArray,
  trace_refs: functionalRefArray,
  trace_verdict: nullableStringId,
  human_override_refs: functionalRefArray,
  recheck_action_refs: functionalRefArray,
  memory_refs: functionalRefArray,
  memory_used_as_evidence_refs: functionalRefArray,
  downstream_rework_causes: stringArray,
  payload: objectPayload,
} as const;

export const topicSelectionOfflineEvaluationObservedSnapshotSchema = {
  type: 'object',
  additionalProperties: false,
  required: [...topicSelectionOfflineEvaluationObservedSnapshotRequired],
  properties: topicSelectionOfflineEvaluationObservedSnapshotProperties,
} as const;

export const topicSelectionOfflineEvaluationObservedOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [...topicSelectionOfflineEvaluationObservedSnapshotRequired],
  properties: {
    ...topicSelectionOfflineEvaluationObservedSnapshotProperties,
    baseline_observed_output: {
      anyOf: [topicSelectionOfflineEvaluationObservedSnapshotSchema, { type: 'null' }],
    },
  },
} as const;

export const topicSelectionOfflineEvaluationDatasetRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'offline_evaluation_dataset_id',
    'dataset_key',
    'dataset_version',
    'stage',
    'source',
    'status',
    'case_count',
    'case_type_coverage',
    'payload',
    'created_by',
    'created_at',
    'updated_at',
  ],
  properties: {
    offline_evaluation_dataset_id: stringId,
    workspace_id: nullableStringId,
    dataset_key: stringId,
    dataset_version: stringId,
    stage: { enum: ['v1a'] },
    source: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_SOURCES] },
    status: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_STATUSES] },
    description: nullableStringId,
    case_count: numberValue,
    case_type_coverage: {
      type: 'array',
      items: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES] },
    },
    payload: objectPayload,
    created_by: { enum: [...TOPIC_SELECTION_ACTOR_TYPES] },
    created_at: stringId,
    updated_at: stringId,
  },
} as const;

export const topicSelectionOfflineEvaluationCaseRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'offline_evaluation_case_id',
    'dataset_id',
    'case_key',
    'case_type',
    'status',
    'frozen_input_bundle',
    'gold_expectation',
    'tags',
    'created_at',
    'updated_at',
  ],
  properties: {
    offline_evaluation_case_id: stringId,
    workspace_id: nullableStringId,
    dataset_id: stringId,
    title_card_id: nullableStringId,
    case_key: stringId,
    case_type: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES] },
    status: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_STATUSES] },
    frozen_input_bundle: topicSelectionOfflineFrozenInputBundleSchema,
    gold_expectation: topicSelectionOfflineEvaluationGoldExpectationSchema,
    tags: stringArray,
    created_at: stringId,
    updated_at: stringId,
  },
} as const;

export const topicSelectionOfflineEvaluationRunRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'offline_evaluation_run_id',
    'dataset_id',
    'run_key',
    'status',
    'workflow_profile_key',
    'metric_keys',
    'case_count',
    'run_payload',
    'created_by',
    'started_at',
  ],
  properties: {
    offline_evaluation_run_id: stringId,
    workspace_id: nullableStringId,
    dataset_id: stringId,
    run_key: stringId,
    status: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_RUN_STATUSES] },
    workflow_profile_key: stringId,
    workflow_profile_version: nullableStringId,
    model_profile_key: nullableStringId,
    search_profile_key: nullableStringId,
    policy_version_id: nullableStringId,
    metric_keys: {
      type: 'array',
      items: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS] },
    },
    case_count: numberValue,
    run_payload: objectPayload,
    created_by: { enum: [...TOPIC_SELECTION_ACTOR_TYPES] },
    started_at: stringId,
    finished_at: nullableStringId,
  },
} as const;

export const topicSelectionOfflineEvaluationCaseResultRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'offline_evaluation_case_result_id',
    'run_id',
    'dataset_id',
    'case_id',
    'case_type',
    'status',
    'observed_output',
    'metric_contribution_payload',
    'failure_examples',
    'created_at',
  ],
  properties: {
    offline_evaluation_case_result_id: stringId,
    workspace_id: nullableStringId,
    run_id: stringId,
    dataset_id: stringId,
    case_id: stringId,
    case_type: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES] },
    status: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_RESULT_STATUSES] },
    observed_output: topicSelectionOfflineEvaluationObservedOutputSchema,
    replay_diff_ref: nullableFunctionalRef,
    metric_contribution_payload: objectPayload,
    failure_examples: stringArray,
    created_at: stringId,
  },
} as const;

export const topicSelectionOfflineEvaluationMetricResultRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'offline_evaluation_metric_result_id',
    'run_id',
    'dataset_id',
    'metric_key',
    'numerator',
    'denominator',
    'value',
    'contributing_case_refs',
    'failure_case_refs',
    'notes',
    'metric_payload',
    'created_at',
  ],
  properties: {
    offline_evaluation_metric_result_id: stringId,
    workspace_id: nullableStringId,
    run_id: stringId,
    dataset_id: stringId,
    metric_key: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS] },
    numerator: numberValue,
    denominator: numberValue,
    value: nullableNumber,
    contributing_case_refs: functionalRefArray,
    failure_case_refs: functionalRefArray,
    notes: stringArray,
    metric_payload: objectPayload,
    created_at: stringId,
  },
} as const;

export const topicSelectionReplayDiffRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'replay_diff_id',
    'run_id',
    'dataset_id',
    'case_id',
    'status',
    'changed_dimensions',
    'final_decision_changed',
    'key_evidence_set_changed',
    'blocker_set_changed',
    'trace_verdict_changed',
    'expected_snapshot',
    'observed_snapshot',
    'diff_payload',
    'created_at',
  ],
  properties: {
    replay_diff_id: stringId,
    workspace_id: nullableStringId,
    run_id: stringId,
    dataset_id: stringId,
    case_id: stringId,
    status: { enum: [...TOPIC_SELECTION_REPLAY_DIFF_STATUSES] },
    changed_dimensions: {
      type: 'array',
      items: { enum: [...TOPIC_SELECTION_REPLAY_DIFF_DIMENSIONS] },
    },
    final_decision_changed: booleanValue,
    key_evidence_set_changed: booleanValue,
    blocker_set_changed: booleanValue,
    trace_verdict_changed: booleanValue,
    expected_snapshot: objectPayload,
    observed_snapshot: topicSelectionOfflineEvaluationObservedOutputSchema,
    baseline_snapshot: { anyOf: [topicSelectionOfflineEvaluationObservedSnapshotSchema, { type: 'null' }] },
    diff_payload: objectPayload,
    created_at: stringId,
  },
} as const;
