import {
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';
import type { TopicSelectionEvidenceRole } from './topic-selection-search-resource-contracts.js';

export const TOPIC_SELECTION_EVIDENCE_LOCATOR_TYPES = [
  'abstract',
  'section',
  'paragraph',
  'anchor',
  'manual',
] as const;
export type TopicSelectionEvidenceLocatorType = (typeof TOPIC_SELECTION_EVIDENCE_LOCATOR_TYPES)[number];

export const TOPIC_SELECTION_EVIDENCE_REVIEW_STATUSES = [
  'draft',
  'machine_checked',
  'human_reviewed',
  'rejected',
] as const;
export type TopicSelectionEvidenceReviewStatus = (typeof TOPIC_SELECTION_EVIDENCE_REVIEW_STATUSES)[number];

export const TOPIC_SELECTION_EVIDENCE_FRESHNESS_STATUSES = [
  'current',
  'stale',
  'recheck_required',
  'superseded',
] as const;
export type TopicSelectionEvidenceFreshnessStatus = (typeof TOPIC_SELECTION_EVIDENCE_FRESHNESS_STATUSES)[number];

export const TOPIC_SELECTION_EVIDENCE_ATTRIBUTION_KINDS = [
  'source_claim',
  'counter_evidence',
  'human_judgment',
  'llm_inference',
] as const;
export type TopicSelectionEvidenceAttributionKind = (typeof TOPIC_SELECTION_EVIDENCE_ATTRIBUTION_KINDS)[number];

export const TOPIC_SELECTION_EVIDENCE_MAP_STATUSES = [
  'draft',
  'ready',
  'stale',
  'rejected',
] as const;
export type TopicSelectionEvidenceMapStatus = (typeof TOPIC_SELECTION_EVIDENCE_MAP_STATUSES)[number];

export const TOPIC_SELECTION_EVIDENCE_LINK_TYPES = [
  'supports',
  'challenges',
  'baselines',
  'contextualizes',
  'duplicates',
  'refines',
  'conflicts_with',
] as const;
export type TopicSelectionEvidenceLinkType = (typeof TOPIC_SELECTION_EVIDENCE_LINK_TYPES)[number];

export const TOPIC_SELECTION_EVIDENCE_CLUSTER_TYPES = [
  'same_claim',
  'same_source_family',
  'method_family',
  'limitation_family',
  'baseline_family',
] as const;
export type TopicSelectionEvidenceClusterType = (typeof TOPIC_SELECTION_EVIDENCE_CLUSTER_TYPES)[number];

export const TOPIC_SELECTION_EVIDENCE_PATTERN_TYPES = [
  'problem',
  'solution',
  'limitation',
  'unresolved',
  'baseline',
  'context',
] as const;
export type TopicSelectionEvidencePatternType = (typeof TOPIC_SELECTION_EVIDENCE_PATTERN_TYPES)[number];

export const TOPIC_SELECTION_EVIDENCE_CONFLICT_TYPES = [
  'claim_conflict',
  'baseline_conflict',
  'locator_conflict',
  'source_health_conflict',
] as const;
export type TopicSelectionEvidenceConflictType = (typeof TOPIC_SELECTION_EVIDENCE_CONFLICT_TYPES)[number];

export const TOPIC_SELECTION_EVIDENCE_CONFLICT_SEVERITIES = [
  'minor',
  'moderate',
  'material',
  'blocking',
] as const;
export type TopicSelectionEvidenceConflictSeverity =
  (typeof TOPIC_SELECTION_EVIDENCE_CONFLICT_SEVERITIES)[number];

export const TOPIC_SELECTION_EVIDENCE_ASSESSMENT_PURPOSES = [
  'need_validation',
  'readiness',
  'recheck',
  'audit',
] as const;
export type TopicSelectionEvidenceAssessmentPurpose =
  (typeof TOPIC_SELECTION_EVIDENCE_ASSESSMENT_PURPOSES)[number];

export const TOPIC_SELECTION_EVIDENCE_ASSESSMENT_GRANULARITIES = [
  'bundle',
  'role_bundle',
  'unit_drilldown',
] as const;
export type TopicSelectionEvidenceAssessmentGranularity =
  (typeof TOPIC_SELECTION_EVIDENCE_ASSESSMENT_GRANULARITIES)[number];

export const TOPIC_SELECTION_EVIDENCE_STRENGTH_VERDICTS = [
  'strong_support',
  'moderate_support',
  'weak_support',
  'mixed',
  'insufficient',
  'stale',
  'blocked',
] as const;
export type TopicSelectionEvidenceStrengthVerdict =
  (typeof TOPIC_SELECTION_EVIDENCE_STRENGTH_VERDICTS)[number];

export interface TopicSelectionEvidenceSourceLocator {
  locator_type: TopicSelectionEvidenceLocatorType;
  locator_ref: TopicSelectionFunctionalRef;
  literature_ref: TopicSelectionFunctionalRef;
  source_ref: TopicSelectionFunctionalRef;
  content_ref?: TopicSelectionFunctionalRef | null;
  document_ref?: TopicSelectionFunctionalRef | null;
  section_ref?: TopicSelectionFunctionalRef | null;
  paragraph_ref?: TopicSelectionFunctionalRef | null;
  anchor_ref?: TopicSelectionFunctionalRef | null;
  manual_label?: string | null;
  quote_hash?: string | null;
  start_offset?: number | null;
  end_offset?: number | null;
  page_number?: number | null;
}

export interface TopicSelectionEvidenceMapRecord {
  evidence_map_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  evidence_map_version: string;
  status: TopicSelectionEvidenceMapStatus;
  review_status: TopicSelectionEvidenceReviewStatus;
  freshness_status: TopicSelectionEvidenceFreshnessStatus;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  unit_count: number;
  support_unit_count: number;
  challenge_unit_count: number;
  baseline_unit_count: number;
  context_unit_count: number;
  digest_payload: Record<string, unknown>;
  stale_reason_codes: string[];
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  trace_snapshot_id?: string | null;
  artifact_refs: TopicSelectionFunctionalRef[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionEvidenceUnitRecord {
  evidence_unit_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  evidence_map_id: string;
  evidence_map_version: string;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  coverage_row_intent_ref?: TopicSelectionFunctionalRef | null;
  literature_ref: TopicSelectionFunctionalRef;
  source_refs: TopicSelectionFunctionalRef[];
  locator: TopicSelectionEvidenceSourceLocator;
  evidence_role: Exclude<TopicSelectionEvidenceRole, 'unknown'>;
  source_attribution_kind: TopicSelectionEvidenceAttributionKind;
  source_statement: string;
  normalized_statement?: string | null;
  interpretation_payload: Record<string, unknown>;
  extraction_confidence?: number | null;
  abstract_only: boolean;
  review_status: TopicSelectionEvidenceReviewStatus;
  freshness_status: TopicSelectionEvidenceFreshnessStatus;
  issue_codes: string[];
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionEvidenceTypedLinkRecord {
  evidence_typed_link_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  evidence_map_id: string;
  evidence_map_version: string;
  link_type: TopicSelectionEvidenceLinkType;
  source_unit_ref: TopicSelectionFunctionalRef;
  target_unit_ref: TopicSelectionFunctionalRef;
  rationale?: string | null;
  confidence?: number | null;
  created_at: string;
}

export interface TopicSelectionEvidenceClusterRecord {
  evidence_cluster_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  evidence_map_id: string;
  evidence_map_version: string;
  cluster_type: TopicSelectionEvidenceClusterType;
  cluster_key: string;
  unit_refs: TopicSelectionFunctionalRef[];
  label: string;
  rationale?: string | null;
  confidence?: number | null;
  created_at: string;
}

export interface TopicSelectionEvidencePatternRecord {
  evidence_pattern_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  evidence_map_id: string;
  evidence_map_version: string;
  pattern_type: TopicSelectionEvidencePatternType;
  evidence_role: Exclude<TopicSelectionEvidenceRole, 'unknown'>;
  unit_refs: TopicSelectionFunctionalRef[];
  pattern_statement: string;
  confidence?: number | null;
  created_at: string;
}

export interface TopicSelectionEvidenceConflictSetRecord {
  evidence_conflict_set_id: string;
  workspace_id?: string | null;
  title_card_id?: string | null;
  evidence_map_id: string;
  evidence_map_version: string;
  conflict_type: TopicSelectionEvidenceConflictType;
  severity: TopicSelectionEvidenceConflictSeverity;
  support_unit_refs: TopicSelectionFunctionalRef[];
  challenge_unit_refs: TopicSelectionFunctionalRef[];
  baseline_unit_refs: TopicSelectionFunctionalRef[];
  context_unit_refs: TopicSelectionFunctionalRef[];
  issue_codes: string[];
  created_at: string;
}

export interface TopicSelectionEvidenceRoleBundle {
  support_unit_refs: TopicSelectionFunctionalRef[];
  challenge_unit_refs: TopicSelectionFunctionalRef[];
  baseline_unit_refs: TopicSelectionFunctionalRef[];
  context_unit_refs: TopicSelectionFunctionalRef[];
}

export interface TopicSelectionEvidenceStrengthAssessmentRecord {
  evidence_strength_assessment_id: string;
  workspace_id?: string | null;
  title_card_id: string;
  evidence_map_id: string;
  evidence_map_version: string;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  target_ref: TopicSelectionFunctionalRef;
  purpose: TopicSelectionEvidenceAssessmentPurpose;
  granularity: TopicSelectionEvidenceAssessmentGranularity;
  role_bundle: TopicSelectionEvidenceRoleBundle;
  unit_refs: TopicSelectionFunctionalRef[];
  conflict_refs: TopicSelectionFunctionalRef[];
  cache_key: string;
  strength_verdict: TopicSelectionEvidenceStrengthVerdict;
  confidence?: number | null;
  gap_codes: string[];
  quality_signal_refs: TopicSelectionFunctionalRef[];
  stale_reason_codes: string[];
  freshness_status: TopicSelectionEvidenceFreshnessStatus;
  input_snapshot_id?: string | null;
  workflow_run_id?: string | null;
  gate_result_id?: string | null;
  transition_attempt_id?: string | null;
  policy_version_id?: string | null;
  assessment_workflow_version: string;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TopicSelectionNeedValidationEvidenceBundle {
  evidence_map_ref: TopicSelectionFunctionalRef;
  search_run_ref: TopicSelectionFunctionalRef;
  search_plan_ref: TopicSelectionFunctionalRef;
  literature_snapshot_ref: TopicSelectionFunctionalRef;
  generated_at: string;
  freshness_status: TopicSelectionEvidenceFreshnessStatus;
  support_units: TopicSelectionEvidenceUnitRecord[];
  challenge_units: TopicSelectionEvidenceUnitRecord[];
  baseline_units: TopicSelectionEvidenceUnitRecord[];
  context_units: TopicSelectionEvidenceUnitRecord[];
  conflict_set_refs: TopicSelectionFunctionalRef[];
  strength_assessment_refs: TopicSelectionFunctionalRef[];
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
const evidenceRoleSchema = { enum: ['support', 'challenge', 'baseline', 'context'] } as const;

export const topicSelectionEvidenceSourceLocatorSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['locator_type', 'locator_ref', 'literature_ref', 'source_ref'],
  properties: {
    locator_type: { enum: [...TOPIC_SELECTION_EVIDENCE_LOCATOR_TYPES] },
    locator_ref: topicSelectionFunctionalRefSchema,
    literature_ref: topicSelectionFunctionalRefSchema,
    source_ref: topicSelectionFunctionalRefSchema,
    content_ref: nullableFunctionalRef,
    document_ref: nullableFunctionalRef,
    section_ref: nullableFunctionalRef,
    paragraph_ref: nullableFunctionalRef,
    anchor_ref: nullableFunctionalRef,
    manual_label: nullableStringId,
    quote_hash: nullableStringId,
    start_offset: nullableNumber,
    end_offset: nullableNumber,
    page_number: nullableNumber,
  },
} as const;

export const topicSelectionEvidenceMapRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_map_id',
    'title_card_id',
    'evidence_map_version',
    'status',
    'review_status',
    'freshness_status',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'unit_count',
    'support_unit_count',
    'challenge_unit_count',
    'baseline_unit_count',
    'context_unit_count',
    'digest_payload',
    'stale_reason_codes',
    'artifact_refs',
    'created_by',
    'created_at',
  ],
  properties: {
    evidence_map_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    evidence_map_version: stringId,
    status: { enum: [...TOPIC_SELECTION_EVIDENCE_MAP_STATUSES] },
    review_status: { enum: [...TOPIC_SELECTION_EVIDENCE_REVIEW_STATUSES] },
    freshness_status: { enum: [...TOPIC_SELECTION_EVIDENCE_FRESHNESS_STATUSES] },
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    unit_count: numberValue,
    support_unit_count: numberValue,
    challenge_unit_count: numberValue,
    baseline_unit_count: numberValue,
    context_unit_count: numberValue,
    digest_payload: objectPayload,
    stale_reason_codes: stringArray,
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

export const topicSelectionEvidenceUnitRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_unit_id',
    'title_card_id',
    'evidence_map_id',
    'evidence_map_version',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'literature_ref',
    'source_refs',
    'locator',
    'evidence_role',
    'source_attribution_kind',
    'source_statement',
    'interpretation_payload',
    'abstract_only',
    'review_status',
    'freshness_status',
    'issue_codes',
    'created_by',
    'created_at',
  ],
  properties: {
    evidence_unit_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    evidence_map_id: stringId,
    evidence_map_version: stringId,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    coverage_row_intent_ref: nullableFunctionalRef,
    literature_ref: topicSelectionFunctionalRefSchema,
    source_refs: functionalRefArray,
    locator: topicSelectionEvidenceSourceLocatorSchema,
    evidence_role: evidenceRoleSchema,
    source_attribution_kind: { enum: [...TOPIC_SELECTION_EVIDENCE_ATTRIBUTION_KINDS] },
    source_statement: stringId,
    normalized_statement: nullableStringId,
    interpretation_payload: objectPayload,
    extraction_confidence: nullableNumber,
    abstract_only: booleanValue,
    review_status: { enum: [...TOPIC_SELECTION_EVIDENCE_REVIEW_STATUSES] },
    freshness_status: { enum: [...TOPIC_SELECTION_EVIDENCE_FRESHNESS_STATUSES] },
    issue_codes: stringArray,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionEvidenceTypedLinkRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_typed_link_id',
    'evidence_map_id',
    'evidence_map_version',
    'link_type',
    'source_unit_ref',
    'target_unit_ref',
    'created_at',
  ],
  properties: {
    evidence_typed_link_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    evidence_map_id: stringId,
    evidence_map_version: stringId,
    link_type: { enum: [...TOPIC_SELECTION_EVIDENCE_LINK_TYPES] },
    source_unit_ref: topicSelectionFunctionalRefSchema,
    target_unit_ref: topicSelectionFunctionalRefSchema,
    rationale: nullableStringId,
    confidence: nullableNumber,
    created_at: stringId,
  },
} as const;

export const topicSelectionEvidenceClusterRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_cluster_id',
    'evidence_map_id',
    'evidence_map_version',
    'cluster_type',
    'cluster_key',
    'unit_refs',
    'label',
    'created_at',
  ],
  properties: {
    evidence_cluster_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    evidence_map_id: stringId,
    evidence_map_version: stringId,
    cluster_type: { enum: [...TOPIC_SELECTION_EVIDENCE_CLUSTER_TYPES] },
    cluster_key: stringId,
    unit_refs: functionalRefArray,
    label: stringId,
    rationale: nullableStringId,
    confidence: nullableNumber,
    created_at: stringId,
  },
} as const;

export const topicSelectionEvidencePatternRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_pattern_id',
    'evidence_map_id',
    'evidence_map_version',
    'pattern_type',
    'evidence_role',
    'unit_refs',
    'pattern_statement',
    'created_at',
  ],
  properties: {
    evidence_pattern_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    evidence_map_id: stringId,
    evidence_map_version: stringId,
    pattern_type: { enum: [...TOPIC_SELECTION_EVIDENCE_PATTERN_TYPES] },
    evidence_role: evidenceRoleSchema,
    unit_refs: functionalRefArray,
    pattern_statement: stringId,
    confidence: nullableNumber,
    created_at: stringId,
  },
} as const;

export const topicSelectionEvidenceConflictSetRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_conflict_set_id',
    'evidence_map_id',
    'evidence_map_version',
    'conflict_type',
    'severity',
    'support_unit_refs',
    'challenge_unit_refs',
    'baseline_unit_refs',
    'context_unit_refs',
    'issue_codes',
    'created_at',
  ],
  properties: {
    evidence_conflict_set_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: nullableStringId,
    evidence_map_id: stringId,
    evidence_map_version: stringId,
    conflict_type: { enum: [...TOPIC_SELECTION_EVIDENCE_CONFLICT_TYPES] },
    severity: { enum: [...TOPIC_SELECTION_EVIDENCE_CONFLICT_SEVERITIES] },
    support_unit_refs: functionalRefArray,
    challenge_unit_refs: functionalRefArray,
    baseline_unit_refs: functionalRefArray,
    context_unit_refs: functionalRefArray,
    issue_codes: stringArray,
    created_at: stringId,
  },
} as const;

export const topicSelectionEvidenceRoleBundleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['support_unit_refs', 'challenge_unit_refs', 'baseline_unit_refs', 'context_unit_refs'],
  properties: {
    support_unit_refs: functionalRefArray,
    challenge_unit_refs: functionalRefArray,
    baseline_unit_refs: functionalRefArray,
    context_unit_refs: functionalRefArray,
  },
} as const;

export const topicSelectionEvidenceStrengthAssessmentRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_strength_assessment_id',
    'title_card_id',
    'evidence_map_id',
    'evidence_map_version',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'target_ref',
    'purpose',
    'granularity',
    'role_bundle',
    'unit_refs',
    'conflict_refs',
    'cache_key',
    'strength_verdict',
    'gap_codes',
    'quality_signal_refs',
    'stale_reason_codes',
    'freshness_status',
    'assessment_workflow_version',
    'created_by',
    'created_at',
  ],
  properties: {
    evidence_strength_assessment_id: stringId,
    workspace_id: nullableStringId,
    title_card_id: stringId,
    evidence_map_id: stringId,
    evidence_map_version: stringId,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    target_ref: topicSelectionFunctionalRefSchema,
    purpose: { enum: [...TOPIC_SELECTION_EVIDENCE_ASSESSMENT_PURPOSES] },
    granularity: { enum: [...TOPIC_SELECTION_EVIDENCE_ASSESSMENT_GRANULARITIES] },
    role_bundle: topicSelectionEvidenceRoleBundleSchema,
    unit_refs: functionalRefArray,
    conflict_refs: functionalRefArray,
    cache_key: stringId,
    strength_verdict: { enum: [...TOPIC_SELECTION_EVIDENCE_STRENGTH_VERDICTS] },
    confidence: nullableNumber,
    gap_codes: stringArray,
    quality_signal_refs: functionalRefArray,
    stale_reason_codes: stringArray,
    freshness_status: { enum: [...TOPIC_SELECTION_EVIDENCE_FRESHNESS_STATUSES] },
    input_snapshot_id: nullableStringId,
    workflow_run_id: nullableStringId,
    gate_result_id: nullableStringId,
    transition_attempt_id: nullableStringId,
    policy_version_id: nullableStringId,
    assessment_workflow_version: stringId,
    created_by: { enum: ['human', 'llm', 'system', 'hybrid'] },
    created_at: stringId,
  },
} as const;

export const topicSelectionNeedValidationEvidenceBundleSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'evidence_map_ref',
    'search_run_ref',
    'search_plan_ref',
    'literature_snapshot_ref',
    'generated_at',
    'freshness_status',
    'support_units',
    'challenge_units',
    'baseline_units',
    'context_units',
    'conflict_set_refs',
    'strength_assessment_refs',
  ],
  properties: {
    evidence_map_ref: topicSelectionFunctionalRefSchema,
    search_run_ref: topicSelectionFunctionalRefSchema,
    search_plan_ref: topicSelectionFunctionalRefSchema,
    literature_snapshot_ref: topicSelectionFunctionalRefSchema,
    generated_at: stringId,
    freshness_status: { enum: [...TOPIC_SELECTION_EVIDENCE_FRESHNESS_STATUSES] },
    support_units: { type: 'array', items: topicSelectionEvidenceUnitRecordSchema },
    challenge_units: { type: 'array', items: topicSelectionEvidenceUnitRecordSchema },
    baseline_units: { type: 'array', items: topicSelectionEvidenceUnitRecordSchema },
    context_units: { type: 'array', items: topicSelectionEvidenceUnitRecordSchema },
    conflict_set_refs: functionalRefArray,
    strength_assessment_refs: functionalRefArray,
  },
} as const;
