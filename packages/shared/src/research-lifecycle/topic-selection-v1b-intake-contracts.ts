import {
  topicSelectionFunctionalRefSchema,
  topicSelectionGateIssueSchema,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
  type TopicSelectionGateIssue,
} from './topic-selection-control-plane-contracts.js';
import {
  topicSelectionEvidenceRoleBundleSchema,
  type TopicSelectionEvidenceFreshnessStatus,
  type TopicSelectionEvidenceRoleBundle,
} from './topic-selection-evidence-map-contracts.js';

export const TOPIC_SELECTION_V1B_INTAKE_READINESS_RECOMMENDATIONS = [
  'ready_for_slice',
  'blocked_by_recheck',
  'blocked_by_stale_trace',
  'needs_constraint_clarification',
  'park',
] as const;
export type TopicSelectionV1bIntakeReadinessRecommendation =
  (typeof TOPIC_SELECTION_V1B_INTAKE_READINESS_RECOMMENDATIONS)[number];

export const TOPIC_SELECTION_V1B_INTAKE_TRACE_STATUSES = [
  'passed',
  'stale_or_missing',
  'mismatched',
] as const;
export type TopicSelectionV1bIntakeTraceStatus =
  (typeof TOPIC_SELECTION_V1B_INTAKE_TRACE_STATUSES)[number];

export interface TopicSelectionV1bIntakeSnapshotRecord {
  v1b_intake_snapshot_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  v1b_input_bundle_id: string;
  validated_need_id: string;
  snapshot_version: string;
  v1b_input_bundle_ref: TopicSelectionFunctionalRef;
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
  trace_status: TopicSelectionV1bIntakeTraceStatus;
  trace_issues: TopicSelectionGateIssue[];
  evidence_map_freshness_status?: TopicSelectionEvidenceFreshnessStatus | null;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionResearchConstraintProfileRecord {
  research_constraint_profile_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  v1b_intake_snapshot_id: string;
  v1b_input_bundle_id: string;
  validated_need_id: string;
  profile_version: string;
  v1b_intake_snapshot_ref: TopicSelectionFunctionalRef;
  v1b_input_bundle_ref: TopicSelectionFunctionalRef;
  validated_need_ref: TopicSelectionFunctionalRef;
  supersedes_profile_ref?: TopicSelectionFunctionalRef | null;
  target_community: string;
  target_venue_class?: string | null;
  intended_contribution_style?: string | null;
  method_constraints: string[];
  resource_constraints: string[];
  available_assets: string[];
  feasibility_budget: Record<string, unknown>;
  non_goals: string[];
  claim_ceiling: string;
  human_constraint_notes?: string | null;
  constraint_payload: Record<string, unknown>;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionV1bIntakeReadinessAssessmentRecord {
  v1b_intake_readiness_assessment_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  v1b_intake_snapshot_id: string;
  research_constraint_profile_id: string;
  v1b_input_bundle_id: string;
  validated_need_id: string;
  profile_version: string;
  recommendation: TopicSelectionV1bIntakeReadinessRecommendation;
  blockers: TopicSelectionGateIssue[];
  warnings: TopicSelectionGateIssue[];
  required_actions: string[];
  v1b_intake_snapshot_ref: TopicSelectionFunctionalRef;
  research_constraint_profile_ref: TopicSelectionFunctionalRef;
  v1b_input_bundle_ref: TopicSelectionFunctionalRef;
  validated_need_ref: TopicSelectionFunctionalRef;
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  open_recheck_request_refs: TopicSelectionFunctionalRef[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  uncovered_recheck_request_refs: TopicSelectionFunctionalRef[];
  stale_ref_codes: string[];
  missing_constraint_codes: string[];
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  policy_version_id?: string | null;
  assessed_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionV1bResearchSlicePlanningInput {
  v1b_input_bundle_ref: TopicSelectionFunctionalRef;
  v1b_intake_snapshot_ref: TopicSelectionFunctionalRef;
  research_constraint_profile_ref: TopicSelectionFunctionalRef;
  readiness_assessment_ref: TopicSelectionFunctionalRef;
  validated_need_ref: TopicSelectionFunctionalRef;
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  evidence_role_bundle: TopicSelectionEvidenceRoleBundle;
  target_community: string;
  target_venue_class?: string | null;
  intended_contribution_style?: string | null;
  method_constraints: string[];
  resource_constraints: string[];
  available_assets: string[];
  feasibility_budget: Record<string, unknown>;
  non_goals: string[];
  claim_ceiling: string;
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  gap_codes: string[];
  memory_suggestion_refs: TopicSelectionFunctionalRef[];
  recheck_request_refs: TopicSelectionFunctionalRef[];
  handoff_payload: Record<string, unknown>;
}

const stringId = { type: 'string', minLength: 1 } as const;
const stringValue = { type: 'string' } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const stringArray = { type: 'array', items: stringId } as const;
const objectPayload = { type: 'object', additionalProperties: true } as const;
const functionalRefArray = { type: 'array', items: topicSelectionFunctionalRefSchema } as const;
const nullableFunctionalRef = { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] } as const;
const gateIssueArray = { type: 'array', items: topicSelectionGateIssueSchema } as const;

export const topicSelectionV1bIntakeSnapshotRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'v1b_intake_snapshot_id',
    'title_card_id',
    'v1b_input_bundle_id',
    'validated_need_id',
    'snapshot_version',
    'v1b_input_bundle_ref',
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
    'trace_status',
    'trace_issues',
    'artifact_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    v1b_intake_snapshot_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    v1b_input_bundle_id: stringId,
    validated_need_id: stringId,
    snapshot_version: stringId,
    v1b_input_bundle_ref: topicSelectionFunctionalRefSchema,
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
    trace_status: { enum: [...TOPIC_SELECTION_V1B_INTAKE_TRACE_STATUSES] },
    trace_issues: gateIssueArray,
    evidence_map_freshness_status: nullableStringId,
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

export const topicSelectionResearchConstraintProfileRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'research_constraint_profile_id',
    'title_card_id',
    'v1b_intake_snapshot_id',
    'v1b_input_bundle_id',
    'validated_need_id',
    'profile_version',
    'v1b_intake_snapshot_ref',
    'v1b_input_bundle_ref',
    'validated_need_ref',
    'target_community',
    'method_constraints',
    'resource_constraints',
    'available_assets',
    'feasibility_budget',
    'non_goals',
    'claim_ceiling',
    'constraint_payload',
    'artifact_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    research_constraint_profile_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    v1b_intake_snapshot_id: stringId,
    v1b_input_bundle_id: stringId,
    validated_need_id: stringId,
    profile_version: stringId,
    v1b_intake_snapshot_ref: topicSelectionFunctionalRefSchema,
    v1b_input_bundle_ref: topicSelectionFunctionalRefSchema,
    validated_need_ref: topicSelectionFunctionalRefSchema,
    supersedes_profile_ref: nullableFunctionalRef,
    target_community: stringValue,
    target_venue_class: nullableStringId,
    intended_contribution_style: nullableStringId,
    method_constraints: stringArray,
    resource_constraints: stringArray,
    available_assets: stringArray,
    feasibility_budget: objectPayload,
    non_goals: stringArray,
    claim_ceiling: stringValue,
    human_constraint_notes: nullableStringId,
    constraint_payload: objectPayload,
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

export const topicSelectionV1bIntakeReadinessAssessmentRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'v1b_intake_readiness_assessment_id',
    'title_card_id',
    'v1b_intake_snapshot_id',
    'research_constraint_profile_id',
    'v1b_input_bundle_id',
    'validated_need_id',
    'profile_version',
    'recommendation',
    'blockers',
    'warnings',
    'required_actions',
    'v1b_intake_snapshot_ref',
    'research_constraint_profile_ref',
    'v1b_input_bundle_ref',
    'validated_need_ref',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'open_recheck_request_refs',
    'accepted_risk_refs',
    'uncovered_recheck_request_refs',
    'stale_ref_codes',
    'missing_constraint_codes',
    'assessed_by',
    'created_at',
  ],
  properties: {
    v1b_intake_readiness_assessment_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    v1b_intake_snapshot_id: stringId,
    research_constraint_profile_id: stringId,
    v1b_input_bundle_id: stringId,
    validated_need_id: stringId,
    profile_version: stringId,
    recommendation: { enum: [...TOPIC_SELECTION_V1B_INTAKE_READINESS_RECOMMENDATIONS] },
    blockers: gateIssueArray,
    warnings: gateIssueArray,
    required_actions: stringArray,
    v1b_intake_snapshot_ref: topicSelectionFunctionalRefSchema,
    research_constraint_profile_ref: topicSelectionFunctionalRefSchema,
    v1b_input_bundle_ref: topicSelectionFunctionalRefSchema,
    validated_need_ref: topicSelectionFunctionalRefSchema,
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    open_recheck_request_refs: functionalRefArray,
    accepted_risk_refs: functionalRefArray,
    uncovered_recheck_request_refs: functionalRefArray,
    stale_ref_codes: stringArray,
    missing_constraint_codes: stringArray,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    policy_version_id: nullableStringId,
    assessed_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionV1bResearchSlicePlanningInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'v1b_input_bundle_ref',
    'v1b_intake_snapshot_ref',
    'research_constraint_profile_ref',
    'readiness_assessment_ref',
    'validated_need_ref',
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'evidence_role_bundle',
    'target_community',
    'method_constraints',
    'resource_constraints',
    'available_assets',
    'feasibility_budget',
    'non_goals',
    'claim_ceiling',
    'accepted_risk_refs',
    'gap_codes',
    'memory_suggestion_refs',
    'recheck_request_refs',
    'handoff_payload',
  ],
  properties: {
    v1b_input_bundle_ref: topicSelectionFunctionalRefSchema,
    v1b_intake_snapshot_ref: topicSelectionFunctionalRefSchema,
    research_constraint_profile_ref: topicSelectionFunctionalRefSchema,
    readiness_assessment_ref: topicSelectionFunctionalRefSchema,
    validated_need_ref: topicSelectionFunctionalRefSchema,
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    evidence_role_bundle: topicSelectionEvidenceRoleBundleSchema,
    target_community: stringId,
    target_venue_class: nullableStringId,
    intended_contribution_style: nullableStringId,
    method_constraints: stringArray,
    resource_constraints: stringArray,
    available_assets: stringArray,
    feasibility_budget: objectPayload,
    non_goals: stringArray,
    claim_ceiling: stringId,
    accepted_risk_refs: functionalRefArray,
    gap_codes: stringArray,
    memory_suggestion_refs: functionalRefArray,
    recheck_request_refs: functionalRefArray,
    handoff_payload: objectPayload,
  },
} as const;
