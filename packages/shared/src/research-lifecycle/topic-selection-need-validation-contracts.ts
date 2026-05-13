import {
  topicSelectionActorRefSchema,
  topicSelectionFunctionalRefSchema,
  topicSelectionGateIssueSchema,
  type TopicSelectionActorRef,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
  type TopicSelectionGateIssue,
} from './topic-selection-control-plane-contracts.js';
import {
  topicSelectionEvidenceRoleBundleSchema,
  type TopicSelectionEvidenceRoleBundle,
} from './topic-selection-evidence-map-contracts.js';

export const TOPIC_SELECTION_NEED_CANDIDATE_LIFECYCLE_STATUSES = [
  'hypothesis',
  'closed',
  'archived',
] as const;
export type TopicSelectionNeedCandidateLifecycleStatus =
  (typeof TOPIC_SELECTION_NEED_CANDIDATE_LIFECYCLE_STATUSES)[number];

export const TOPIC_SELECTION_NEED_CANDIDATE_DECISION_STATUSES = [
  'hypothesis',
  'ready_for_validation',
  'returned_for_revision',
  'searchplan_recheck_requested',
  'rejected',
  'parked',
  'merged',
  'resulted_in_validated_need',
] as const;
export type TopicSelectionNeedCandidateDecisionStatus =
  (typeof TOPIC_SELECTION_NEED_CANDIDATE_DECISION_STATUSES)[number];

export const TOPIC_SELECTION_NEED_CANDIDATE_REVIEW_STATUSES = [
  'unreviewed',
  'machine_checked',
  'needs_human_review',
  'human_reviewed',
  'human_confirmed',
] as const;
export type TopicSelectionNeedCandidateReviewStatus =
  (typeof TOPIC_SELECTION_NEED_CANDIDATE_REVIEW_STATUSES)[number];

export const TOPIC_SELECTION_NEED_CANDIDATE_FRESHNESS_STATUSES = [
  'current',
  'stale',
  'recheck_required',
  'superseded',
] as const;
export type TopicSelectionNeedCandidateFreshnessStatus =
  (typeof TOPIC_SELECTION_NEED_CANDIDATE_FRESHNESS_STATUSES)[number];

export const TOPIC_SELECTION_NEED_PRIOR_ART_STATUSES = [
  'unknown',
  'no_strong_solution_found',
  'partial_solution_known',
  'already_solved',
  'falsified',
] as const;
export type TopicSelectionNeedPriorArtStatus =
  (typeof TOPIC_SELECTION_NEED_PRIOR_ART_STATUSES)[number];

export const TOPIC_SELECTION_NEED_MECHANISM_TYPES = [
  'workflow_gap',
  'evaluation_gap',
  'method_gap',
  'system_gap',
  'data_gap',
  'theory_gap',
  'other',
] as const;
export type TopicSelectionNeedMechanismType =
  (typeof TOPIC_SELECTION_NEED_MECHANISM_TYPES)[number];

export const TOPIC_SELECTION_NEED_READINESS_RECOMMENDATIONS = [
  'ready_for_validation',
  'needs_scope_revision',
  'evidence_gap',
  'searchplan_recheck',
  'merge_required',
  'reject',
  'park',
] as const;
export type TopicSelectionNeedReadinessRecommendation =
  (typeof TOPIC_SELECTION_NEED_READINESS_RECOMMENDATIONS)[number];

export const TOPIC_SELECTION_NEED_ADJUDICATION_DECISIONS = [
  'validate',
  'return_to_candidate',
  'request_searchplan_recheck',
  'reject',
  'park',
  'merge',
] as const;
export type TopicSelectionNeedAdjudicationDecision =
  (typeof TOPIC_SELECTION_NEED_ADJUDICATION_DECISIONS)[number];

export const TOPIC_SELECTION_NEED_LOOPBACK_TARGETS = [
  'none',
  'need_candidate',
  'evidence_map',
  'search_plan',
  'human_review',
] as const;
export type TopicSelectionNeedLoopbackTarget =
  (typeof TOPIC_SELECTION_NEED_LOOPBACK_TARGETS)[number];

export const TOPIC_SELECTION_NEED_REJECTED_REASONS = [
  'pseudo_gap',
  'already_solved',
  'too_narrow',
  'too_broad',
  'weak_value',
  'insufficient_evidence',
  'out_of_scope',
  'duplicate',
  'other',
] as const;
export type TopicSelectionNeedRejectedReason =
  (typeof TOPIC_SELECTION_NEED_REJECTED_REASONS)[number];

export const TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_TYPES = [
  'rejection_reason',
  'duplicate_candidate',
  'parked_candidate',
  'recheck_learning',
  'merge_note',
] as const;
export type TopicSelectionCandidateMemorySuggestionType =
  (typeof TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_TYPES)[number];

export const TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_STATUSES = [
  'suggested',
] as const;
export type TopicSelectionCandidateMemorySuggestionStatus =
  (typeof TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_STATUSES)[number];

export interface TopicSelectionNeedCandidateRecord {
  need_candidate_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  evidence_map_id: string;
  candidate_version: string;
  lifecycle_status: TopicSelectionNeedCandidateLifecycleStatus;
  decision_status: TopicSelectionNeedCandidateDecisionStatus;
  review_status: TopicSelectionNeedCandidateReviewStatus;
  freshness_status: TopicSelectionNeedCandidateFreshnessStatus;
  candidate_need: string;
  unmet_need_statement: string;
  mechanism_type: TopicSelectionNeedMechanismType;
  mechanism_summary?: string | null;
  mechanism_payload: Record<string, unknown>;
  scope_notes?: string | null;
  non_goal_notes?: string | null;
  prior_art_status: TopicSelectionNeedPriorArtStatus;
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  evidence_role_bundle: TopicSelectionEvidenceRoleBundle;
  conflict_refs: TopicSelectionFunctionalRef[];
  strength_assessment_refs: TopicSelectionFunctionalRef[];
  open_recheck_request_refs: TopicSelectionFunctionalRef[];
  unresolved_challenge_refs: TopicSelectionFunctionalRef[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  gap_codes: string[];
  speculative: boolean;
  confidence?: number | null;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  result_adjudication_id?: string | null;
  result_validated_need_id?: string | null;
  merged_into_need_candidate_ref?: TopicSelectionFunctionalRef | null;
  created_by: TopicSelectionActorType;
  created_at: string;
  updated_at: string;
}

export interface TopicSelectionNeedCandidateReadinessAssessmentRecord {
  readiness_assessment_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  need_candidate_id: string;
  evidence_map_id: string;
  recommendation: TopicSelectionNeedReadinessRecommendation;
  blockers: TopicSelectionGateIssue[];
  warnings: TopicSelectionGateIssue[];
  required_actions: string[];
  strength_assessment_ref?: TopicSelectionFunctionalRef | null;
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  support_unit_refs: TopicSelectionFunctionalRef[];
  challenge_unit_refs: TopicSelectionFunctionalRef[];
  baseline_unit_refs: TopicSelectionFunctionalRef[];
  context_unit_refs: TopicSelectionFunctionalRef[];
  conflict_refs: TopicSelectionFunctionalRef[];
  open_recheck_request_refs: TopicSelectionFunctionalRef[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  gap_codes: string[];
  support_count: number;
  challenge_count: number;
  abstract_only_support_count: number;
  strong_unresolved_challenge_count: number;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  policy_version_id?: string | null;
  assessed_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionValidationDecisionSupportPacketRecord {
  validation_support_packet_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  need_candidate_id: string;
  evidence_map_id: string;
  readiness_assessment_id?: string | null;
  packet_status: 'draft' | 'ready' | 'superseded';
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  need_candidate_ref: TopicSelectionFunctionalRef;
  readiness_assessment_ref?: TopicSelectionFunctionalRef | null;
  evidence_role_bundle: TopicSelectionEvidenceRoleBundle;
  conflict_refs: TopicSelectionFunctionalRef[];
  strength_assessment_refs: TopicSelectionFunctionalRef[];
  coverage_refs: TopicSelectionFunctionalRef[];
  residual_risk_refs: TopicSelectionFunctionalRef[];
  open_gap_codes: string[];
  required_human_checks: string[];
  prior_art_status: TopicSelectionNeedPriorArtStatus;
  already_solved_review: Record<string, unknown>;
  packet_payload: Record<string, unknown>;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionValidateNeedAdjudicationResultRecord {
  adjudication_result_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  need_candidate_id: string;
  support_packet_id: string;
  final_decision: TopicSelectionNeedAdjudicationDecision;
  output_validated_need_id?: string | null;
  human_decision_id?: string | null;
  loopback_target: TopicSelectionNeedLoopbackTarget;
  rejected_reason?: TopicSelectionNeedRejectedReason | null;
  merge_target_need_candidate_ref?: TopicSelectionFunctionalRef | null;
  output_searchplan_recheck_request_ref?: TopicSelectionFunctionalRef | null;
  output_memory_suggestion_ref?: TopicSelectionFunctionalRef | null;
  rationale: string;
  required_actions: string[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  residual_risk_refs: TopicSelectionFunctionalRef[];
  gap_codes: string[];
  decision_payload: Record<string, unknown>;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  adjudicated_by: TopicSelectionActorRef;
  created_at: string;
}

export interface TopicSelectionValidatedNeedRecord {
  validated_need_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  source_need_candidate_id: string;
  adjudication_result_id: string;
  support_packet_id: string;
  human_decision_id: string;
  validated_need_statement: string;
  mechanism_type: TopicSelectionNeedMechanismType;
  mechanism_summary?: string | null;
  mechanism_payload: Record<string, unknown>;
  scope_notes?: string | null;
  non_goal_notes?: string | null;
  prior_art_status: TopicSelectionNeedPriorArtStatus;
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  support_packet_ref: TopicSelectionFunctionalRef;
  adjudication_result_ref: TopicSelectionFunctionalRef;
  human_decision_ref: TopicSelectionFunctionalRef;
  evidence_role_bundle: TopicSelectionEvidenceRoleBundle;
  strength_assessment_refs: TopicSelectionFunctionalRef[];
  conflict_refs: TopicSelectionFunctionalRef[];
  residual_risk_refs: TopicSelectionFunctionalRef[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  trace_refs: TopicSelectionFunctionalRef[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionCandidateDecisionMemorySuggestionRecord {
  memory_suggestion_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  source_need_candidate_id: string;
  adjudication_result_id?: string | null;
  suggestion_type: TopicSelectionCandidateMemorySuggestionType;
  status: TopicSelectionCandidateMemorySuggestionStatus;
  target_ref: TopicSelectionFunctionalRef;
  suggestion_payload: Record<string, unknown>;
  rationale: string;
  policy_version_id?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionV1aToV1bInputBundleRecord {
  v1b_input_bundle_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  validated_need_id: string;
  source_need_candidate_id: string;
  adjudication_result_id: string;
  support_packet_id: string;
  bundle_version: string;
  validated_need_ref: TopicSelectionFunctionalRef;
  source_need_candidate_ref: TopicSelectionFunctionalRef;
  adjudication_result_ref: TopicSelectionFunctionalRef;
  support_packet_ref: TopicSelectionFunctionalRef;
  human_decision_ref: TopicSelectionFunctionalRef;
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  evidence_role_bundle: TopicSelectionEvidenceRoleBundle;
  trace_refs: TopicSelectionFunctionalRef[];
  risk_refs: TopicSelectionFunctionalRef[];
  gap_codes: string[];
  memory_suggestion_refs: TopicSelectionFunctionalRef[];
  recheck_request_refs: TopicSelectionFunctionalRef[];
  handoff_payload: Record<string, unknown>;
  created_by: TopicSelectionActorType;
  created_at: string;
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

export const topicSelectionNeedCandidateRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'need_candidate_id',
    'title_card_id',
    'evidence_map_id',
    'candidate_version',
    'lifecycle_status',
    'decision_status',
    'review_status',
    'freshness_status',
    'candidate_need',
    'unmet_need_statement',
    'mechanism_type',
    'mechanism_payload',
    'prior_art_status',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'evidence_role_bundle',
    'conflict_refs',
    'strength_assessment_refs',
    'open_recheck_request_refs',
    'unresolved_challenge_refs',
    'accepted_risk_refs',
    'gap_codes',
    'speculative',
    'artifact_refs',
    'created_by',
    'created_at',
    'updated_at',
  ],
  properties: {
    need_candidate_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    evidence_map_id: stringId,
    candidate_version: stringId,
    lifecycle_status: { enum: [...TOPIC_SELECTION_NEED_CANDIDATE_LIFECYCLE_STATUSES] },
    decision_status: { enum: [...TOPIC_SELECTION_NEED_CANDIDATE_DECISION_STATUSES] },
    review_status: { enum: [...TOPIC_SELECTION_NEED_CANDIDATE_REVIEW_STATUSES] },
    freshness_status: { enum: [...TOPIC_SELECTION_NEED_CANDIDATE_FRESHNESS_STATUSES] },
    candidate_need: stringId,
    unmet_need_statement: stringId,
    mechanism_type: { enum: [...TOPIC_SELECTION_NEED_MECHANISM_TYPES] },
    mechanism_summary: nullableStringId,
    mechanism_payload: objectPayload,
    scope_notes: nullableStringId,
    non_goal_notes: nullableStringId,
    prior_art_status: { enum: [...TOPIC_SELECTION_NEED_PRIOR_ART_STATUSES] },
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    evidence_role_bundle: topicSelectionEvidenceRoleBundleSchema,
    conflict_refs: functionalRefArray,
    strength_assessment_refs: functionalRefArray,
    open_recheck_request_refs: functionalRefArray,
    unresolved_challenge_refs: functionalRefArray,
    accepted_risk_refs: functionalRefArray,
    gap_codes: stringArray,
    speculative: booleanValue,
    confidence: nullableNumber,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    trace_snapshot_id: nullableStringId,
    artifact_refs: functionalRefArray,
    result_adjudication_id: nullableStringId,
    result_validated_need_id: nullableStringId,
    merged_into_need_candidate_ref: nullableFunctionalRef,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
    updated_at: stringId,
  },
} as const;

export const topicSelectionNeedCandidateReadinessAssessmentRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'readiness_assessment_id',
    'title_card_id',
    'need_candidate_id',
    'evidence_map_id',
    'recommendation',
    'blockers',
    'warnings',
    'required_actions',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'support_unit_refs',
    'challenge_unit_refs',
    'baseline_unit_refs',
    'context_unit_refs',
    'conflict_refs',
    'open_recheck_request_refs',
    'accepted_risk_refs',
    'gap_codes',
    'support_count',
    'challenge_count',
    'abstract_only_support_count',
    'strong_unresolved_challenge_count',
    'assessed_by',
    'created_at',
  ],
  properties: {
    readiness_assessment_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    need_candidate_id: stringId,
    evidence_map_id: stringId,
    recommendation: { enum: [...TOPIC_SELECTION_NEED_READINESS_RECOMMENDATIONS] },
    blockers: { type: 'array', items: topicSelectionGateIssueSchema },
    warnings: { type: 'array', items: topicSelectionGateIssueSchema },
    required_actions: stringArray,
    strength_assessment_ref: nullableFunctionalRef,
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    support_unit_refs: functionalRefArray,
    challenge_unit_refs: functionalRefArray,
    baseline_unit_refs: functionalRefArray,
    context_unit_refs: functionalRefArray,
    conflict_refs: functionalRefArray,
    open_recheck_request_refs: functionalRefArray,
    accepted_risk_refs: functionalRefArray,
    gap_codes: stringArray,
    support_count: numberValue,
    challenge_count: numberValue,
    abstract_only_support_count: numberValue,
    strong_unresolved_challenge_count: numberValue,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    policy_version_id: nullableStringId,
    assessed_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionValidationDecisionSupportPacketRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'validation_support_packet_id',
    'title_card_id',
    'need_candidate_id',
    'evidence_map_id',
    'packet_status',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'need_candidate_ref',
    'evidence_role_bundle',
    'conflict_refs',
    'strength_assessment_refs',
    'coverage_refs',
    'residual_risk_refs',
    'open_gap_codes',
    'required_human_checks',
    'prior_art_status',
    'already_solved_review',
    'packet_payload',
    'artifact_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    validation_support_packet_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    need_candidate_id: stringId,
    evidence_map_id: stringId,
    readiness_assessment_id: nullableStringId,
    packet_status: { enum: ['draft', 'ready', 'superseded'] },
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    need_candidate_ref: topicSelectionFunctionalRefSchema,
    readiness_assessment_ref: nullableFunctionalRef,
    evidence_role_bundle: topicSelectionEvidenceRoleBundleSchema,
    conflict_refs: functionalRefArray,
    strength_assessment_refs: functionalRefArray,
    coverage_refs: functionalRefArray,
    residual_risk_refs: functionalRefArray,
    open_gap_codes: stringArray,
    required_human_checks: stringArray,
    prior_art_status: { enum: [...TOPIC_SELECTION_NEED_PRIOR_ART_STATUSES] },
    already_solved_review: objectPayload,
    packet_payload: objectPayload,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    trace_snapshot_id: nullableStringId,
    artifact_refs: functionalRefArray,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionValidateNeedAdjudicationResultRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'adjudication_result_id',
    'title_card_id',
    'need_candidate_id',
    'support_packet_id',
    'final_decision',
    'loopback_target',
    'rationale',
    'required_actions',
    'accepted_risk_refs',
    'residual_risk_refs',
    'gap_codes',
    'decision_payload',
    'artifact_refs',
    'adjudicated_by',
    'created_at',
  ],
  properties: {
    adjudication_result_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    need_candidate_id: stringId,
    support_packet_id: stringId,
    final_decision: { enum: [...TOPIC_SELECTION_NEED_ADJUDICATION_DECISIONS] },
    output_validated_need_id: nullableStringId,
    human_decision_id: nullableStringId,
    loopback_target: { enum: [...TOPIC_SELECTION_NEED_LOOPBACK_TARGETS] },
    rejected_reason: { anyOf: [{ enum: [...TOPIC_SELECTION_NEED_REJECTED_REASONS] }, { type: 'null' }] },
    merge_target_need_candidate_ref: nullableFunctionalRef,
    output_searchplan_recheck_request_ref: nullableFunctionalRef,
    output_memory_suggestion_ref: nullableFunctionalRef,
    rationale: stringId,
    required_actions: stringArray,
    accepted_risk_refs: functionalRefArray,
    residual_risk_refs: functionalRefArray,
    gap_codes: stringArray,
    decision_payload: objectPayload,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    trace_snapshot_id: nullableStringId,
    artifact_refs: functionalRefArray,
    adjudicated_by: topicSelectionActorRefSchema,
    created_at: stringId,
  },
} as const;

export const topicSelectionValidatedNeedRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'validated_need_id',
    'title_card_id',
    'source_need_candidate_id',
    'adjudication_result_id',
    'support_packet_id',
    'human_decision_id',
    'validated_need_statement',
    'mechanism_type',
    'mechanism_payload',
    'prior_art_status',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'support_packet_ref',
    'adjudication_result_ref',
    'human_decision_ref',
    'evidence_role_bundle',
    'strength_assessment_refs',
    'conflict_refs',
    'residual_risk_refs',
    'accepted_risk_refs',
    'trace_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    validated_need_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    source_need_candidate_id: stringId,
    adjudication_result_id: stringId,
    support_packet_id: stringId,
    human_decision_id: stringId,
    validated_need_statement: stringId,
    mechanism_type: { enum: [...TOPIC_SELECTION_NEED_MECHANISM_TYPES] },
    mechanism_summary: nullableStringId,
    mechanism_payload: objectPayload,
    scope_notes: nullableStringId,
    non_goal_notes: nullableStringId,
    prior_art_status: { enum: [...TOPIC_SELECTION_NEED_PRIOR_ART_STATUSES] },
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    support_packet_ref: topicSelectionFunctionalRefSchema,
    adjudication_result_ref: topicSelectionFunctionalRefSchema,
    human_decision_ref: topicSelectionFunctionalRefSchema,
    evidence_role_bundle: topicSelectionEvidenceRoleBundleSchema,
    strength_assessment_refs: functionalRefArray,
    conflict_refs: functionalRefArray,
    residual_risk_refs: functionalRefArray,
    accepted_risk_refs: functionalRefArray,
    trace_refs: functionalRefArray,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionCandidateDecisionMemorySuggestionRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'memory_suggestion_id',
    'title_card_id',
    'source_need_candidate_id',
    'suggestion_type',
    'status',
    'target_ref',
    'suggestion_payload',
    'rationale',
    'created_by',
    'created_at',
  ],
  properties: {
    memory_suggestion_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    source_need_candidate_id: stringId,
    adjudication_result_id: nullableStringId,
    suggestion_type: { enum: [...TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_TYPES] },
    status: { enum: [...TOPIC_SELECTION_CANDIDATE_MEMORY_SUGGESTION_STATUSES] },
    target_ref: topicSelectionFunctionalRefSchema,
    suggestion_payload: objectPayload,
    rationale: stringId,
    policy_version_id: nullableStringId,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionV1aToV1bInputBundleRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'v1b_input_bundle_id',
    'title_card_id',
    'validated_need_id',
    'source_need_candidate_id',
    'adjudication_result_id',
    'support_packet_id',
    'bundle_version',
    'validated_need_ref',
    'source_need_candidate_ref',
    'adjudication_result_ref',
    'support_packet_ref',
    'human_decision_ref',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'evidence_role_bundle',
    'trace_refs',
    'risk_refs',
    'gap_codes',
    'memory_suggestion_refs',
    'recheck_request_refs',
    'handoff_payload',
    'created_by',
    'created_at',
  ],
  properties: {
    v1b_input_bundle_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    validated_need_id: stringId,
    source_need_candidate_id: stringId,
    adjudication_result_id: stringId,
    support_packet_id: stringId,
    bundle_version: stringId,
    validated_need_ref: topicSelectionFunctionalRefSchema,
    source_need_candidate_ref: topicSelectionFunctionalRefSchema,
    adjudication_result_ref: topicSelectionFunctionalRefSchema,
    support_packet_ref: topicSelectionFunctionalRefSchema,
    human_decision_ref: topicSelectionFunctionalRefSchema,
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    evidence_role_bundle: topicSelectionEvidenceRoleBundleSchema,
    trace_refs: functionalRefArray,
    risk_refs: functionalRefArray,
    gap_codes: stringArray,
    memory_suggestion_refs: functionalRefArray,
    recheck_request_refs: functionalRefArray,
    handoff_payload: objectPayload,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;
