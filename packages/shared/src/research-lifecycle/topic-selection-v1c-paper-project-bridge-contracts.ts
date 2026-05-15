import {
  TOPIC_SELECTION_ACTOR_TYPES,
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';
import type {
  TopicSelectionAllowedPromotionRefinement,
  TopicSelectionPromotionBridgeHandoff,
  TopicSelectionPromotionCondition,
  TopicSelectionPromotionStopOrReopenCondition,
  TopicSelectionPromoteClassDecision,
} from './topic-selection-v1c-human-promotion-decision-contracts.js';
import {
  TOPIC_SELECTION_PROMOTE_CLASS_DECISIONS,
  topicSelectionPromotionAllowedRefinementSchema,
  topicSelectionPromotionBridgeHandoffSchema,
  topicSelectionPromotionConditionSchema,
  topicSelectionPromotionStopOrReopenConditionSchema,
} from './topic-selection-v1c-human-promotion-decision-contracts.js';

export const TOPIC_SELECTION_PAPER_PROJECT_BRIDGE_STATUSES = [
  'active',
  'blocked',
  'superseded',
  'archived',
] as const;
export type TopicSelectionPaperProjectBridgeStatus =
  (typeof TOPIC_SELECTION_PAPER_PROJECT_BRIDGE_STATUSES)[number];

export interface TopicSelectionPaperProjectBridgeWorkingCopyPayload {
  editable_title: string;
  problem_statement: string;
  contribution_summary: string;
  evaluation_plan: string;
  initial_planning_notes: string[];
  claim_ceiling: string;
  prohibited_claims: string[];
  conditions: TopicSelectionPromotionCondition[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  early_check_obligations: string[];
  source_lineage_summary: Record<string, unknown>;
}

export interface TopicSelectionPaperProjectBridgeCreateInput {
  promotion_decision_id: string;
  workspace_id?: string | null;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
}

export interface TopicSelectionPaperProjectBridgeRecord {
  paper_project_bridge_id: string;
  bridge_status: TopicSelectionPaperProjectBridgeStatus;
  workspace_id?: string | null;
  title_card_id: string;
  source_promotion_decision_id: string;
  source_promotion_decision_ref: TopicSelectionFunctionalRef;
  human_promotion_decision_ref: TopicSelectionFunctionalRef;
  human_confirmed_decision_ref: TopicSelectionFunctionalRef;
  promotion_commitment_profile_id: string;
  promotion_commitment_profile_ref: TopicSelectionFunctionalRef;
  promotion_gate_check_ref: TopicSelectionFunctionalRef;
  promotion_input_snapshot_id: string;
  promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
  promotion_input_snapshot_hash: string;
  topic_package_id: string;
  package_version: string;
  decision: TopicSelectionPromoteClassDecision;
  conditions: TopicSelectionPromotionCondition[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  allowed_refinements: TopicSelectionAllowedPromotionRefinement[];
  early_check_obligations: string[];
  stop_conditions: TopicSelectionPromotionStopOrReopenCondition[];
  reopen_conditions: TopicSelectionPromotionStopOrReopenCondition[];
  source_refs: TopicSelectionFunctionalRef[];
  snapshot_hashes: TopicSelectionPromotionBridgeHandoff['snapshot_hashes'];
  working_copy_payload: TopicSelectionPaperProjectBridgeWorkingCopyPayload;
  working_copy_payload_hash: string;
  bridge_payload_hash: string;
  paper_project_intake_ref?: TopicSelectionFunctionalRef | null;
  target_paper_project_ref?: TopicSelectionFunctionalRef | null;
  source_promotion_handoff: TopicSelectionPromotionBridgeHandoff;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  policy_version_id?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionPaperProjectBridgeHandoff {
  paper_project_bridge_id: string;
  paper_project_bridge_ref: TopicSelectionFunctionalRef;
  bridge_status: 'active';
  source_promotion_decision_id: string;
  source_promotion_decision_ref: TopicSelectionFunctionalRef;
  promotion_commitment_profile_ref: TopicSelectionFunctionalRef;
  promotion_input_snapshot_id: string;
  promotion_input_snapshot_ref: TopicSelectionFunctionalRef;
  promotion_input_snapshot_hash: string;
  topic_package_id: string;
  package_version: string;
  decision: TopicSelectionPromoteClassDecision;
  working_copy_payload: TopicSelectionPaperProjectBridgeWorkingCopyPayload;
  working_copy_payload_hash: string;
  bridge_payload_hash: string;
  conditions: TopicSelectionPromotionCondition[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
  allowed_refinements: TopicSelectionAllowedPromotionRefinement[];
  early_check_obligations: string[];
  stop_conditions: TopicSelectionPromotionStopOrReopenCondition[];
  reopen_conditions: TopicSelectionPromotionStopOrReopenCondition[];
  source_refs: TopicSelectionFunctionalRef[];
  snapshot_hashes: TopicSelectionPromotionBridgeHandoff['snapshot_hashes'];
  paper_project_intake_ref?: TopicSelectionFunctionalRef | null;
  target_paper_project_ref?: TopicSelectionFunctionalRef | null;
  bridge: TopicSelectionPaperProjectBridgeRecord;
  source_promotion_handoff: TopicSelectionPromotionBridgeHandoff;
}

export type PaperProjectBridgeRecord = TopicSelectionPaperProjectBridgeRecord;
export type PaperProjectBridgeWorkingCopyPayload =
  TopicSelectionPaperProjectBridgeWorkingCopyPayload;
export type PaperProjectBridgeCreateInput = TopicSelectionPaperProjectBridgeCreateInput;
export type PaperProjectBridgeHandoff = TopicSelectionPaperProjectBridgeHandoff;
export type PaperProjectBridgeStatus = TopicSelectionPaperProjectBridgeStatus;

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const actorTypeSchema = { enum: [...TOPIC_SELECTION_ACTOR_TYPES] } as const;
const objectPayload = { type: 'object', additionalProperties: true } as const;
const stringArray = { type: 'array', items: stringId } as const;
const functionalRefArray = { type: 'array', items: topicSelectionFunctionalRefSchema } as const;
const nullableFunctionalRef = {
  anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }],
} as const;
const promotionConditionArray = {
  type: 'array',
  items: topicSelectionPromotionConditionSchema,
} as const;
const allowedRefinementArray = {
  type: 'array',
  items: topicSelectionPromotionAllowedRefinementSchema,
} as const;
const stopOrReopenConditionArray = {
  type: 'array',
  items: topicSelectionPromotionStopOrReopenConditionSchema,
} as const;
const snapshotHashesSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'bundle_hash',
    'package_snapshot_hash',
    'package_draft_input_snapshot_hash',
    'promotion_input_snapshot_hash',
  ],
  properties: {
    bundle_hash: stringId,
    package_snapshot_hash: stringId,
    package_draft_input_snapshot_hash: stringId,
    promotion_input_snapshot_hash: stringId,
  },
} as const;

export const topicSelectionPaperProjectBridgeWorkingCopyPayloadSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'editable_title',
    'problem_statement',
    'contribution_summary',
    'evaluation_plan',
    'initial_planning_notes',
    'claim_ceiling',
    'prohibited_claims',
    'conditions',
    'accepted_risk_refs',
    'early_check_obligations',
    'source_lineage_summary',
  ],
  properties: {
    editable_title: stringId,
    problem_statement: stringId,
    contribution_summary: stringId,
    evaluation_plan: stringId,
    initial_planning_notes: stringArray,
    claim_ceiling: stringId,
    prohibited_claims: stringArray,
    conditions: promotionConditionArray,
    accepted_risk_refs: functionalRefArray,
    early_check_obligations: stringArray,
    source_lineage_summary: objectPayload,
  },
} as const;

export const topicSelectionPaperProjectBridgeCreateInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['promotion_decision_id'],
  properties: {
    promotion_decision_id: stringId,
    workspace_id: nullableStringId,
    created_by: actorTypeSchema,
    policy_version_id: nullableStringId,
  },
} as const;

export const topicSelectionPaperProjectBridgeRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'paper_project_bridge_id',
    'bridge_status',
    'title_card_id',
    'source_promotion_decision_id',
    'source_promotion_decision_ref',
    'human_promotion_decision_ref',
    'human_confirmed_decision_ref',
    'promotion_commitment_profile_id',
    'promotion_commitment_profile_ref',
    'promotion_gate_check_ref',
    'promotion_input_snapshot_id',
    'promotion_input_snapshot_ref',
    'promotion_input_snapshot_hash',
    'topic_package_id',
    'package_version',
    'decision',
    'conditions',
    'accepted_risk_refs',
    'allowed_refinements',
    'early_check_obligations',
    'stop_conditions',
    'reopen_conditions',
    'source_refs',
    'snapshot_hashes',
    'working_copy_payload',
    'working_copy_payload_hash',
    'bridge_payload_hash',
    'source_promotion_handoff',
    'artifact_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    paper_project_bridge_id: stringId,
    bridge_status: { enum: [...TOPIC_SELECTION_PAPER_PROJECT_BRIDGE_STATUSES] },
    workspace_id: nullableStringId,
    title_card_id: stringId,
    source_promotion_decision_id: stringId,
    source_promotion_decision_ref: topicSelectionFunctionalRefSchema,
    human_promotion_decision_ref: topicSelectionFunctionalRefSchema,
    human_confirmed_decision_ref: topicSelectionFunctionalRefSchema,
    promotion_commitment_profile_id: stringId,
    promotion_commitment_profile_ref: topicSelectionFunctionalRefSchema,
    promotion_gate_check_ref: topicSelectionFunctionalRefSchema,
    promotion_input_snapshot_id: stringId,
    promotion_input_snapshot_ref: topicSelectionFunctionalRefSchema,
    promotion_input_snapshot_hash: stringId,
    topic_package_id: stringId,
    package_version: stringId,
    decision: { enum: [...TOPIC_SELECTION_PROMOTE_CLASS_DECISIONS] },
    conditions: promotionConditionArray,
    accepted_risk_refs: functionalRefArray,
    allowed_refinements: allowedRefinementArray,
    early_check_obligations: stringArray,
    stop_conditions: stopOrReopenConditionArray,
    reopen_conditions: stopOrReopenConditionArray,
    source_refs: functionalRefArray,
    snapshot_hashes: snapshotHashesSchema,
    working_copy_payload: topicSelectionPaperProjectBridgeWorkingCopyPayloadSchema,
    working_copy_payload_hash: stringId,
    bridge_payload_hash: stringId,
    paper_project_intake_ref: nullableFunctionalRef,
    target_paper_project_ref: nullableFunctionalRef,
    source_promotion_handoff: topicSelectionPromotionBridgeHandoffSchema,
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    trace_snapshot_id: nullableStringId,
    artifact_refs: functionalRefArray,
    policy_version_id: nullableStringId,
    created_by: actorTypeSchema,
    created_at: stringId,
  },
} as const;

export const topicSelectionPaperProjectBridgeHandoffSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'paper_project_bridge_id',
    'paper_project_bridge_ref',
    'bridge_status',
    'source_promotion_decision_id',
    'source_promotion_decision_ref',
    'promotion_commitment_profile_ref',
    'promotion_input_snapshot_id',
    'promotion_input_snapshot_ref',
    'promotion_input_snapshot_hash',
    'topic_package_id',
    'package_version',
    'decision',
    'working_copy_payload',
    'working_copy_payload_hash',
    'bridge_payload_hash',
    'conditions',
    'accepted_risk_refs',
    'allowed_refinements',
    'early_check_obligations',
    'stop_conditions',
    'reopen_conditions',
    'source_refs',
    'snapshot_hashes',
    'bridge',
    'source_promotion_handoff',
  ],
  properties: {
    paper_project_bridge_id: stringId,
    paper_project_bridge_ref: topicSelectionFunctionalRefSchema,
    bridge_status: { enum: ['active'] },
    source_promotion_decision_id: stringId,
    source_promotion_decision_ref: topicSelectionFunctionalRefSchema,
    promotion_commitment_profile_ref: topicSelectionFunctionalRefSchema,
    promotion_input_snapshot_id: stringId,
    promotion_input_snapshot_ref: topicSelectionFunctionalRefSchema,
    promotion_input_snapshot_hash: stringId,
    topic_package_id: stringId,
    package_version: stringId,
    decision: { enum: [...TOPIC_SELECTION_PROMOTE_CLASS_DECISIONS] },
    working_copy_payload: topicSelectionPaperProjectBridgeWorkingCopyPayloadSchema,
    working_copy_payload_hash: stringId,
    bridge_payload_hash: stringId,
    conditions: promotionConditionArray,
    accepted_risk_refs: functionalRefArray,
    allowed_refinements: allowedRefinementArray,
    early_check_obligations: stringArray,
    stop_conditions: stopOrReopenConditionArray,
    reopen_conditions: stopOrReopenConditionArray,
    source_refs: functionalRefArray,
    snapshot_hashes: snapshotHashesSchema,
    paper_project_intake_ref: nullableFunctionalRef,
    target_paper_project_ref: nullableFunctionalRef,
    bridge: topicSelectionPaperProjectBridgeRecordSchema,
    source_promotion_handoff: topicSelectionPromotionBridgeHandoffSchema,
  },
} as const;
