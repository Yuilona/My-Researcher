import {
  topicSelectionActorRefSchema,
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorRef,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';

export const TOPIC_SELECTION_RECHECK_EVENT_TYPES = [
  'quality_signal',
  'gate_result',
  'workflow_failure',
  'searchplan_recheck_request',
  'accepted_risk_expiry',
  'downstream_feedback',
  'manual',
] as const;
export type TopicSelectionRecheckEventType = (typeof TOPIC_SELECTION_RECHECK_EVENT_TYPES)[number];

export const TOPIC_SELECTION_RECHECK_EVENT_STATUSES = [
  'open',
  'merged',
  'resolved',
  'dismissed',
  'superseded',
] as const;
export type TopicSelectionRecheckEventStatus = (typeof TOPIC_SELECTION_RECHECK_EVENT_STATUSES)[number];

export const TOPIC_SELECTION_IMPACT_LEVELS = [
  'no_impact',
  'stale',
  'recheck_required',
  'invalidated',
] as const;
export type TopicSelectionImpactLevel = (typeof TOPIC_SELECTION_IMPACT_LEVELS)[number];

export const TOPIC_SELECTION_RECHECK_IMPACT_STATUSES = [
  'open',
  'queued',
  'in_progress',
  'resolved',
  'dismissed',
  'superseded',
] as const;
export type TopicSelectionRecheckImpactStatus = (typeof TOPIC_SELECTION_RECHECK_IMPACT_STATUSES)[number];

export const TOPIC_SELECTION_RECHECK_RESOLUTION_TYPES = [
  'confirmed_no_impact',
  'rerun_completed',
  'revised_version_created',
  'accepted_risk',
  'human_dismissed',
  'superseded',
  'retracted',
  'deferred',
] as const;
export type TopicSelectionRecheckResolutionType = (typeof TOPIC_SELECTION_RECHECK_RESOLUTION_TYPES)[number];

export const TOPIC_SELECTION_ACCEPTED_RISK_STATUSES = [
  'active',
  'expired',
  'resolved',
  'revoked',
  'superseded',
] as const;
export type TopicSelectionAcceptedRiskStatus = (typeof TOPIC_SELECTION_ACCEPTED_RISK_STATUSES)[number];

export const TOPIC_SELECTION_ACCEPTED_RISK_SOURCE_TYPES = [
  'pass_with_risk',
  'human_override',
  'coverage_risk_acceptance',
  'recheck_resolution',
  'manual',
] as const;
export type TopicSelectionAcceptedRiskSourceType = (typeof TOPIC_SELECTION_ACCEPTED_RISK_SOURCE_TYPES)[number];

export const TOPIC_SELECTION_HUMAN_OVERRIDE_STATUSES = ['active', 'revoked', 'superseded'] as const;
export type TopicSelectionHumanOverrideStatus = (typeof TOPIC_SELECTION_HUMAN_OVERRIDE_STATUSES)[number];

export const TOPIC_SELECTION_BLOCKER_POLICY_CATEGORIES = [
  'non_overridable',
  'overrideable_with_risk',
  'escalation_only',
] as const;
export type TopicSelectionBlockerPolicyCategory = (typeof TOPIC_SELECTION_BLOCKER_POLICY_CATEGORIES)[number];

export const TOPIC_SELECTION_DECISION_MEMORY_TYPES = [
  'rejection_reason',
  'duplicate_candidate',
  'parked_candidate',
  'recheck_learning',
  'merge_note',
  'downstream_failure',
  'pseudo_gap',
  'already_solved',
  'trace_integrity',
] as const;
export type TopicSelectionDecisionMemoryType = (typeof TOPIC_SELECTION_DECISION_MEMORY_TYPES)[number];

export const TOPIC_SELECTION_DECISION_MEMORY_EFFECT_POLICIES = [
  'none',
  'warn',
  'suppress_duplicate',
  'block_until_rechecked',
  'require_human_review',
] as const;
export type TopicSelectionDecisionMemoryEffectPolicy =
  (typeof TOPIC_SELECTION_DECISION_MEMORY_EFFECT_POLICIES)[number];

export const TOPIC_SELECTION_DECISION_MEMORY_STATUSES = [
  'active',
  'expired',
  'dismissed',
  'superseded',
] as const;
export type TopicSelectionDecisionMemoryStatus = (typeof TOPIC_SELECTION_DECISION_MEMORY_STATUSES)[number];

export const TOPIC_SELECTION_QUEUE_ITEM_TYPES = [
  'recheck',
  'blocker',
  'human_review',
  'accepted_risk_expiry',
  'workflow_failure',
  'memory_review',
  'searchplan_recheck',
  'downstream_feedback',
] as const;
export type TopicSelectionQueueItemType = (typeof TOPIC_SELECTION_QUEUE_ITEM_TYPES)[number];

export const TOPIC_SELECTION_QUEUE_ITEM_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'dismissed',
  'superseded',
] as const;
export type TopicSelectionQueueItemStatus = (typeof TOPIC_SELECTION_QUEUE_ITEM_STATUSES)[number];

export const TOPIC_SELECTION_QUEUE_HANDLER_KEYS = [
  'human_review',
  'rerun_workflow',
  'revise_search_plan',
  'resolve_recheck',
  'accept_risk',
  'materialize_memory',
  'inspect_trace',
] as const;
export type TopicSelectionQueueHandlerKey = (typeof TOPIC_SELECTION_QUEUE_HANDLER_KEYS)[number];

export type TopicSelectionSeverity = 'info' | 'warning' | 'blocking' | 'critical';

export interface TopicSelectionRecheckEventRecord {
  recheck_event_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  origin_stage: string;
  event_type: TopicSelectionRecheckEventType;
  source_ref: TopicSelectionFunctionalRef;
  affected_scope_ref?: TopicSelectionFunctionalRef | null;
  event_fingerprint: string;
  severity: TopicSelectionSeverity;
  reason_codes: string[];
  summary: string;
  state_signal_refs: TopicSelectionFunctionalRef[];
  evidence_refs: TopicSelectionFunctionalRef[];
  artifact_refs: TopicSelectionFunctionalRef[];
  policy_version_id?: string | null;
  status: TopicSelectionRecheckEventStatus;
  observation_count: number;
  first_seen_at: string;
  last_seen_at: string;
  cooldown_until?: string | null;
  payload: Record<string, unknown>;
}

export interface TopicSelectionRecheckImpactRecord {
  recheck_impact_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  recheck_event_ref: TopicSelectionFunctionalRef;
  affected_ref: TopicSelectionFunctionalRef;
  affected_stage: string;
  impact_level: TopicSelectionImpactLevel;
  impact_dedup_key: string;
  required_actions: string[];
  status: TopicSelectionRecheckImpactStatus;
  retry_count: number;
  retry_budget: number;
  cooldown_until?: string | null;
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  queue_item_refs: TopicSelectionFunctionalRef[];
  assessment_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TopicSelectionRecheckResolutionRecord {
  recheck_resolution_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  recheck_impact_ref: TopicSelectionFunctionalRef;
  resolution_type: TopicSelectionRecheckResolutionType;
  resolved_by: TopicSelectionActorRef;
  rationale: string;
  output_refs: TopicSelectionFunctionalRef[];
  accepted_risk_ref?: TopicSelectionFunctionalRef | null;
  created_at: string;
}

export interface TopicSelectionAcceptedRiskRecord {
  accepted_risk_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  risk_type: string;
  source_type: TopicSelectionAcceptedRiskSourceType;
  source_ref?: TopicSelectionFunctionalRef | null;
  target_ref: TopicSelectionFunctionalRef;
  scope_refs: TopicSelectionFunctionalRef[];
  affected_object_refs: TopicSelectionFunctionalRef[];
  severity: TopicSelectionSeverity;
  status: TopicSelectionAcceptedRiskStatus;
  rationale: string;
  accepted_by: TopicSelectionActorRef;
  policy_version_id?: string | null;
  expiry_condition?: string | null;
  recheck_condition?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface TopicSelectionHumanOverrideRecord {
  human_override_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  target_ref: TopicSelectionFunctionalRef;
  overridden_ref?: TopicSelectionFunctionalRef | null;
  blocker_type: string;
  accepted_risk_ref: TopicSelectionFunctionalRef;
  actor: TopicSelectionActorRef;
  rationale: string;
  policy_version_id?: string | null;
  scope: Record<string, unknown>;
  status: TopicSelectionHumanOverrideStatus;
  created_at: string;
}

export interface TopicSelectionBlockerPolicyRecord {
  blocker_policy_id: string;
  blocker_code: string;
  category: TopicSelectionBlockerPolicyCategory;
  default_action: string;
  allowed_handler_keys: TopicSelectionQueueHandlerKey[];
  policy_version_id?: string | null;
  status: 'active' | 'retired';
  created_at: string;
  retired_at?: string | null;
}

export interface TopicSelectionDecisionMemoryEntryRecord {
  decision_memory_entry_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  source_stage: string;
  source_ref: TopicSelectionFunctionalRef;
  target_scope_ref?: TopicSelectionFunctionalRef | null;
  memory_type: TopicSelectionDecisionMemoryType;
  effect_policy: TopicSelectionDecisionMemoryEffectPolicy;
  severity: TopicSelectionSeverity;
  confidence?: number | null;
  status: TopicSelectionDecisionMemoryStatus;
  rationale: string;
  applicability_scope: Record<string, unknown>;
  payload: Record<string, unknown>;
  evidence_policy: 'not_evidence';
  created_by: TopicSelectionActorType;
  created_at: string;
  expires_at?: string | null;
  recheck_condition?: string | null;
}

export interface TopicSelectionCandidateDecisionMemoryRecord {
  candidate_decision_memory_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  decision_memory_entry_ref: TopicSelectionFunctionalRef;
  source_suggestion_ref?: TopicSelectionFunctionalRef | null;
  need_candidate_ref: TopicSelectionFunctionalRef;
  status: TopicSelectionDecisionMemoryStatus;
  reason_codes: string[];
  evidence_policy: 'not_evidence';
  created_at: string;
}

export interface TopicSelectionDecisionWorkQueueItemRecord {
  decision_work_queue_item_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  queue_item_type: TopicSelectionQueueItemType;
  handler_key: TopicSelectionQueueHandlerKey;
  target_ref: TopicSelectionFunctionalRef;
  source_ref: TopicSelectionFunctionalRef;
  queue_dedup_key: string;
  priority: number;
  status: TopicSelectionQueueItemStatus;
  required_actions: string[];
  reason_codes: string[];
  blocked_transition_keys: string[];
  retry_count: number;
  retry_budget: number;
  cooldown_until?: string | null;
  policy_version_id?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const numberValue = { type: 'number' } as const;
const nullableNumber = { anyOf: [numberValue, { type: 'null' }] } as const;
const stringArray = { type: 'array', items: stringId } as const;
const objectPayload = { type: 'object', additionalProperties: true } as const;
const functionalRefArray = { type: 'array', items: topicSelectionFunctionalRefSchema } as const;
const nullableFunctionalRef = { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] } as const;
const severitySchema = { enum: ['info', 'warning', 'blocking', 'critical'] } as const;

export const topicSelectionRecheckEventRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'recheck_event_id',
    'origin_stage',
    'event_type',
    'source_ref',
    'event_fingerprint',
    'severity',
    'reason_codes',
    'summary',
    'state_signal_refs',
    'evidence_refs',
    'artifact_refs',
    'status',
    'observation_count',
    'first_seen_at',
    'last_seen_at',
    'payload',
  ],
  properties: {
    recheck_event_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    origin_stage: stringId,
    event_type: { enum: [...TOPIC_SELECTION_RECHECK_EVENT_TYPES] },
    source_ref: topicSelectionFunctionalRefSchema,
    affected_scope_ref: nullableFunctionalRef,
    event_fingerprint: stringId,
    severity: severitySchema,
    reason_codes: stringArray,
    summary: stringId,
    state_signal_refs: functionalRefArray,
    evidence_refs: functionalRefArray,
    artifact_refs: functionalRefArray,
    policy_version_id: nullableStringId,
    status: { enum: [...TOPIC_SELECTION_RECHECK_EVENT_STATUSES] },
    observation_count: numberValue,
    first_seen_at: stringId,
    last_seen_at: stringId,
    cooldown_until: nullableStringId,
    payload: objectPayload,
  },
} as const;

export const topicSelectionRecheckImpactRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'recheck_impact_id',
    'recheck_event_ref',
    'affected_ref',
    'affected_stage',
    'impact_level',
    'impact_dedup_key',
    'required_actions',
    'status',
    'retry_count',
    'retry_budget',
    'accepted_risk_refs',
    'queue_item_refs',
    'assessment_payload',
    'created_at',
    'updated_at',
  ],
  properties: {
    recheck_impact_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    recheck_event_ref: topicSelectionFunctionalRefSchema,
    affected_ref: topicSelectionFunctionalRefSchema,
    affected_stage: stringId,
    impact_level: { enum: [...TOPIC_SELECTION_IMPACT_LEVELS] },
    impact_dedup_key: stringId,
    required_actions: stringArray,
    status: { enum: [...TOPIC_SELECTION_RECHECK_IMPACT_STATUSES] },
    retry_count: numberValue,
    retry_budget: numberValue,
    cooldown_until: nullableStringId,
    accepted_risk_refs: functionalRefArray,
    queue_item_refs: functionalRefArray,
    assessment_payload: objectPayload,
    created_at: stringId,
    updated_at: stringId,
  },
} as const;

export const topicSelectionRecheckResolutionRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'recheck_resolution_id',
    'recheck_impact_ref',
    'resolution_type',
    'resolved_by',
    'rationale',
    'output_refs',
    'created_at',
  ],
  properties: {
    recheck_resolution_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    recheck_impact_ref: topicSelectionFunctionalRefSchema,
    resolution_type: { enum: [...TOPIC_SELECTION_RECHECK_RESOLUTION_TYPES] },
    resolved_by: topicSelectionActorRefSchema,
    rationale: stringId,
    output_refs: functionalRefArray,
    accepted_risk_ref: nullableFunctionalRef,
    created_at: stringId,
  },
} as const;

export const topicSelectionAcceptedRiskRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'accepted_risk_id',
    'risk_type',
    'source_type',
    'target_ref',
    'scope_refs',
    'affected_object_refs',
    'severity',
    'status',
    'rationale',
    'accepted_by',
    'created_at',
    'updated_at',
  ],
  properties: {
    accepted_risk_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    risk_type: stringId,
    source_type: { enum: [...TOPIC_SELECTION_ACCEPTED_RISK_SOURCE_TYPES] },
    source_ref: nullableFunctionalRef,
    target_ref: topicSelectionFunctionalRefSchema,
    scope_refs: functionalRefArray,
    affected_object_refs: functionalRefArray,
    severity: severitySchema,
    status: { enum: [...TOPIC_SELECTION_ACCEPTED_RISK_STATUSES] },
    rationale: stringId,
    accepted_by: topicSelectionActorRefSchema,
    policy_version_id: nullableStringId,
    expiry_condition: nullableStringId,
    recheck_condition: nullableStringId,
    expires_at: nullableStringId,
    created_at: stringId,
    updated_at: stringId,
    resolved_at: nullableStringId,
  },
} as const;

export const topicSelectionHumanOverrideRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'human_override_id',
    'target_ref',
    'blocker_type',
    'accepted_risk_ref',
    'actor',
    'rationale',
    'scope',
    'status',
    'created_at',
  ],
  properties: {
    human_override_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    target_ref: topicSelectionFunctionalRefSchema,
    overridden_ref: nullableFunctionalRef,
    blocker_type: stringId,
    accepted_risk_ref: topicSelectionFunctionalRefSchema,
    actor: topicSelectionActorRefSchema,
    rationale: stringId,
    policy_version_id: nullableStringId,
    scope: objectPayload,
    status: { enum: [...TOPIC_SELECTION_HUMAN_OVERRIDE_STATUSES] },
    created_at: stringId,
  },
} as const;

export const topicSelectionBlockerPolicyRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'blocker_policy_id',
    'blocker_code',
    'category',
    'default_action',
    'allowed_handler_keys',
    'status',
    'created_at',
  ],
  properties: {
    blocker_policy_id: stringId,
    blocker_code: stringId,
    category: { enum: [...TOPIC_SELECTION_BLOCKER_POLICY_CATEGORIES] },
    default_action: stringId,
    allowed_handler_keys: { type: 'array', items: { enum: [...TOPIC_SELECTION_QUEUE_HANDLER_KEYS] } },
    policy_version_id: nullableStringId,
    status: { enum: ['active', 'retired'] },
    created_at: stringId,
    retired_at: nullableStringId,
  },
} as const;

export const topicSelectionDecisionMemoryEntryRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'decision_memory_entry_id',
    'source_stage',
    'source_ref',
    'memory_type',
    'effect_policy',
    'severity',
    'status',
    'rationale',
    'applicability_scope',
    'payload',
    'evidence_policy',
    'created_by',
    'created_at',
  ],
  properties: {
    decision_memory_entry_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    source_stage: stringId,
    source_ref: topicSelectionFunctionalRefSchema,
    target_scope_ref: nullableFunctionalRef,
    memory_type: { enum: [...TOPIC_SELECTION_DECISION_MEMORY_TYPES] },
    effect_policy: { enum: [...TOPIC_SELECTION_DECISION_MEMORY_EFFECT_POLICIES] },
    severity: severitySchema,
    confidence: nullableNumber,
    status: { enum: [...TOPIC_SELECTION_DECISION_MEMORY_STATUSES] },
    rationale: stringId,
    applicability_scope: objectPayload,
    payload: objectPayload,
    evidence_policy: { enum: ['not_evidence'] },
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
    expires_at: nullableStringId,
    recheck_condition: nullableStringId,
  },
} as const;

export const topicSelectionCandidateDecisionMemoryRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'candidate_decision_memory_id',
    'title_card_id',
    'decision_memory_entry_ref',
    'need_candidate_ref',
    'status',
    'reason_codes',
    'evidence_policy',
    'created_at',
  ],
  properties: {
    candidate_decision_memory_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    decision_memory_entry_ref: topicSelectionFunctionalRefSchema,
    source_suggestion_ref: nullableFunctionalRef,
    need_candidate_ref: topicSelectionFunctionalRefSchema,
    status: { enum: [...TOPIC_SELECTION_DECISION_MEMORY_STATUSES] },
    reason_codes: stringArray,
    evidence_policy: { enum: ['not_evidence'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionDecisionWorkQueueItemRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'decision_work_queue_item_id',
    'queue_item_type',
    'handler_key',
    'target_ref',
    'source_ref',
    'queue_dedup_key',
    'priority',
    'status',
    'required_actions',
    'reason_codes',
    'blocked_transition_keys',
    'retry_count',
    'retry_budget',
    'payload',
    'created_at',
    'updated_at',
  ],
  properties: {
    decision_work_queue_item_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    queue_item_type: { enum: [...TOPIC_SELECTION_QUEUE_ITEM_TYPES] },
    handler_key: { enum: [...TOPIC_SELECTION_QUEUE_HANDLER_KEYS] },
    target_ref: topicSelectionFunctionalRefSchema,
    source_ref: topicSelectionFunctionalRefSchema,
    queue_dedup_key: stringId,
    priority: numberValue,
    status: { enum: [...TOPIC_SELECTION_QUEUE_ITEM_STATUSES] },
    required_actions: stringArray,
    reason_codes: stringArray,
    blocked_transition_keys: stringArray,
    retry_count: numberValue,
    retry_budget: numberValue,
    cooldown_until: nullableStringId,
    policy_version_id: nullableStringId,
    payload: objectPayload,
    created_at: stringId,
    updated_at: stringId,
    resolved_at: nullableStringId,
  },
} as const;
