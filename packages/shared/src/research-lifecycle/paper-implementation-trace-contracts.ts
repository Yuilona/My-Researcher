import {
  TOPIC_SELECTION_ACTOR_TYPES,
  topicSelectionFunctionalRefSchema,
  type TopicSelectionActorType,
  type TopicSelectionFunctionalRef,
} from './topic-selection-control-plane-contracts.js';
import type {
  TopicSelectionSeverity,
} from './topic-selection-recheck-risk-memory-contracts.js';

export const PAPER_IMPLEMENTATION_TRACE_LINEAGE_TYPES = [
  'literature',
  'experiment',
  'artifact',
  'decision',
  'internal_interpretation',
] as const;
export type PaperImplementationTraceLineageType =
  (typeof PAPER_IMPLEMENTATION_TRACE_LINEAGE_TYPES)[number];

export const PAPER_IMPLEMENTATION_TRACE_STATUSES = [
  'complete',
  'partial',
  'broken',
  'stale',
  'invalidated',
] as const;
export type PaperImplementationTraceStatus =
  (typeof PAPER_IMPLEMENTATION_TRACE_STATUSES)[number];

export const PAPER_IMPLEMENTATION_FIELD_ROLES = [
  'semantic_contract',
  'interpretation',
  'rationale_memo',
  'display_summary',
  'operational_instruction',
  'human_judgment',
  'source_statement',
  'normalized_source_statement',
] as const;
export type PaperImplementationFieldRole =
  (typeof PAPER_IMPLEMENTATION_FIELD_ROLES)[number];

export const PAPER_IMPLEMENTATION_CITATION_SOURCE_KINDS = [
  'literature_evidence_unit',
  'citable_source_evidence_unit',
] as const;
export type PaperImplementationCitationSourceKind =
  (typeof PAPER_IMPLEMENTATION_CITATION_SOURCE_KINDS)[number];

export const PAPER_IMPLEMENTATION_CITABLE_SOURCE_TYPES = [
  'paper',
  'survey',
  'dataset_paper',
  'software_paper',
  'benchmark_paper',
  'official_documentation',
  'standards',
] as const;
export type PaperImplementationCitableSourceType =
  (typeof PAPER_IMPLEMENTATION_CITABLE_SOURCE_TYPES)[number];

export const PAPER_IMPLEMENTATION_LOCATOR_QUALITIES = [
  'exact',
  'approximate',
  'weak',
  'missing',
] as const;
export type PaperImplementationLocatorQuality =
  (typeof PAPER_IMPLEMENTATION_LOCATOR_QUALITIES)[number];

export const PAPER_IMPLEMENTATION_CITED_FOR_REASONS = [
  'motivation_pressure',
  'baseline_gap',
  'current_solution_insufficiency',
  'method_prior_art',
  'dataset_context',
  'limitation',
  'counter_evidence',
  'benchmark_context',
  'evaluation_protocol',
] as const;
export type PaperImplementationCitedForReason =
  (typeof PAPER_IMPLEMENTATION_CITED_FOR_REASONS)[number];

export const PAPER_IMPLEMENTATION_CITATION_CANDIDATE_STATUSES = [
  'candidate',
  'reviewed',
  'rejected',
  'stale',
] as const;
export type PaperImplementationCitationCandidateStatus =
  (typeof PAPER_IMPLEMENTATION_CITATION_CANDIDATE_STATUSES)[number];

export const PAPER_IMPLEMENTATION_TRACE_QUEUE_STATUSES = [
  'open',
  'resolved',
] as const;
export type PaperImplementationTraceQueueStatus =
  (typeof PAPER_IMPLEMENTATION_TRACE_QUEUE_STATUSES)[number];

export const PAPER_IMPLEMENTATION_TRACE_GATE_STATUSES = [
  'passed',
  'warning',
  'blocked',
] as const;
export type PaperImplementationTraceGateStatus =
  (typeof PAPER_IMPLEMENTATION_TRACE_GATE_STATUSES)[number];

export const PAPER_IMPLEMENTATION_CLAIM_STRENGTHS = [
  'tentative',
  'moderate',
  'strong',
] as const;
export type PaperImplementationClaimStrength =
  (typeof PAPER_IMPLEMENTATION_CLAIM_STRENGTHS)[number];

export interface TraceLiteratureLineage {
  literature_evidence_refs: TopicSelectionFunctionalRef[];
  source_locator_refs: TopicSelectionFunctionalRef[];
  citation_candidate_refs: TopicSelectionFunctionalRef[];
}

export interface TraceExperimentLineage {
  experiment_plan_refs: TopicSelectionFunctionalRef[];
  work_order_refs: TopicSelectionFunctionalRef[];
  run_refs: TopicSelectionFunctionalRef[];
  run_evidence_refs: TopicSelectionFunctionalRef[];
  result_packet_refs: TopicSelectionFunctionalRef[];
  metric_refs: TopicSelectionFunctionalRef[];
}

export interface TraceArtifactLineage {
  dataset_refs: TopicSelectionFunctionalRef[];
  baseline_refs: TopicSelectionFunctionalRef[];
  code_version_refs: TopicSelectionFunctionalRef[];
  model_checkpoint_refs: TopicSelectionFunctionalRef[];
  config_refs: TopicSelectionFunctionalRef[];
  log_artifact_refs: TopicSelectionFunctionalRef[];
}

export interface TraceDecisionLineage {
  validation_cycle_refs: TopicSelectionFunctionalRef[];
  motive_evolution_decision_refs: TopicSelectionFunctionalRef[];
  gate_result_refs: TopicSelectionFunctionalRef[];
  human_decision_refs: TopicSelectionFunctionalRef[];
  accepted_risk_refs: TopicSelectionFunctionalRef[];
}

export interface TraceInternalInterpretationLineage {
  result_interpretation_refs: TopicSelectionFunctionalRef[];
  llm_rationale_refs: TopicSelectionFunctionalRef[];
  board_summary_refs: TopicSelectionFunctionalRef[];
  non_citable_refs: TopicSelectionFunctionalRef[];
}

export interface TraceLineageBundle {
  literature: TraceLiteratureLineage;
  experiment: TraceExperimentLineage;
  artifact: TraceArtifactLineage;
  decision: TraceDecisionLineage;
  internal_interpretation: TraceInternalInterpretationLineage;
}

export interface TraceIntegrity {
  missing_refs: TopicSelectionFunctionalRef[];
  broken_refs: TopicSelectionFunctionalRef[];
  stale_refs: TopicSelectionFunctionalRef[];
  invalidated_refs: TopicSelectionFunctionalRef[];
  non_citable_refs: TopicSelectionFunctionalRef[];
  partial_refs: TopicSelectionFunctionalRef[];
}

export interface TraceManifest {
  trace_manifest_id: string;
  implementation_project_id: string;
  target_ref: TopicSelectionFunctionalRef;
  lineage: TraceLineageBundle;
  integrity: TraceIntegrity;
  trace_status: PaperImplementationTraceStatus;
  broken_ref_count: number;
  stale_ref_count: number;
  missing_ref_count: number;
  non_citable_ref_count: number;
  trace_policy_version_id?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface SourceLocatorPayload {
  section?: string | null;
  page?: string | null;
  paragraph?: string | null;
  table?: string | null;
  figure?: string | null;
  appendix?: string | null;
  quote_or_span_ref?: string | null;
  extraction_artifact_ref?: string | null;
}

export interface CitationCandidate {
  citation_candidate_id: string;
  implementation_project_id: string;
  trace_manifest_id: string;
  trace_manifest_ref: TopicSelectionFunctionalRef;
  source_kind: PaperImplementationCitationSourceKind;
  source_type: PaperImplementationCitableSourceType;
  source_id: string;
  source_evidence_unit_ref: TopicSelectionFunctionalRef;
  source_locator_id: string;
  locator_quality: PaperImplementationLocatorQuality;
  locator: SourceLocatorPayload;
  cited_for: PaperImplementationCitedForReason[];
  linked_target_refs: TopicSelectionFunctionalRef[];
  status: PaperImplementationCitationCandidateStatus;
  normalized_source_statement: string;
  citation_limitation?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface ClaimTraceChallenge {
  challenging_result_refs: TopicSelectionFunctionalRef[];
  counter_evidence_refs: TopicSelectionFunctionalRef[];
  unresolved_objections: string[];
}

export interface ClaimTraceScope {
  dataset_scope?: string | null;
  task_scope?: string | null;
  baseline_scope?: string | null;
  method_scope?: string | null;
  evaluation_scope?: string | null;
}

export interface ClaimTraceBoundary {
  forbidden_overclaims: string[];
  claim_strength: PaperImplementationClaimStrength;
  human_confirmation_required: boolean;
}

export interface ClaimTracePacket {
  claim_trace_packet_id: string;
  implementation_project_id: string;
  claim_ref: TopicSelectionFunctionalRef;
  claim_statement: string;
  trace_manifest_id: string;
  trace_manifest_ref: TopicSelectionFunctionalRef;
  lineage: TraceLineageBundle;
  challenge: ClaimTraceChallenge;
  scope: ClaimTraceScope;
  boundary: ClaimTraceBoundary;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface NaturalLanguageFieldRoleRecord {
  field_role_record_id: string;
  implementation_project_id: string;
  field_owner_ref: TopicSelectionFunctionalRef;
  field_name: string;
  field_role: PaperImplementationFieldRole;
  can_feed_workflow: boolean;
  can_feed_hard_gate: boolean;
  can_be_cited: boolean;
  policy_version_id?: string | null;
  created_by: TopicSelectionActorType;
  created_at: string;
}

export interface TraceRepairQueueItem {
  queue_item_id: string;
  implementation_project_id: string;
  trace_manifest_id: string;
  target_ref: TopicSelectionFunctionalRef;
  lineage_type: PaperImplementationTraceLineageType;
  blocker_code: string;
  severity: TopicSelectionSeverity;
  status: PaperImplementationTraceQueueStatus;
  source_ref?: TopicSelectionFunctionalRef | null;
  created_by: TopicSelectionActorType;
  created_at: string;
  resolved_by?: TopicSelectionActorType | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
}

export interface TraceGateResult {
  gate_result_id: string;
  implementation_project_id: string;
  trace_manifest_id: string;
  gate_status: PaperImplementationTraceGateStatus;
  trace_status: PaperImplementationTraceStatus;
  blocker_codes: string[];
  repair_queue_item_refs: TopicSelectionFunctionalRef[];
  created_at: string;
}

export interface CreateTraceManifestRequest {
  target_ref: TopicSelectionFunctionalRef;
  lineage: TraceLineageBundle;
  integrity?: Partial<TraceIntegrity>;
  trace_policy_version_id?: string | null;
  created_by?: TopicSelectionActorType;
}

export interface CreateCitationCandidateRequest {
  trace_manifest_id: string;
  source_kind: PaperImplementationCitationSourceKind;
  source_type: PaperImplementationCitableSourceType;
  source_id: string;
  source_evidence_unit_ref: TopicSelectionFunctionalRef;
  source_locator_id: string;
  locator_quality: PaperImplementationLocatorQuality;
  locator: SourceLocatorPayload;
  cited_for: PaperImplementationCitedForReason[];
  linked_target_refs: TopicSelectionFunctionalRef[];
  normalized_source_statement: string;
  citation_limitation?: string | null;
  created_by?: TopicSelectionActorType;
}

export interface CreateClaimTracePacketRequest {
  claim_ref: TopicSelectionFunctionalRef;
  claim_statement: string;
  trace_manifest_id: string;
  lineage: TraceLineageBundle;
  challenge: ClaimTraceChallenge;
  scope: ClaimTraceScope;
  boundary: ClaimTraceBoundary;
  created_by?: TopicSelectionActorType;
}

export interface RegisterNaturalLanguageFieldRoleRequest {
  field_owner_ref: TopicSelectionFunctionalRef;
  field_name: string;
  field_role: PaperImplementationFieldRole;
  can_feed_workflow: boolean;
  can_feed_hard_gate: boolean;
  can_be_cited: boolean;
  policy_version_id?: string | null;
  created_by?: TopicSelectionActorType;
}

export interface EvaluateTraceGateRequest {
  trace_manifest_id: string;
}

export interface ResolveTraceRepairQueueItemRequest {
  resolution_note?: string | null;
  resolved_by?: TopicSelectionActorType;
}

export interface ListTraceManifestsResponse {
  items: TraceManifest[];
}

export interface ListCitationCandidatesResponse {
  items: CitationCandidate[];
}

export interface ListClaimTracePacketsResponse {
  items: ClaimTracePacket[];
}

export interface ListTraceRepairQueueResponse {
  items: TraceRepairQueueItem[];
}

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const actorTypeSchema = { enum: [...TOPIC_SELECTION_ACTOR_TYPES] } as const;
const functionalRefArray = { type: 'array', items: topicSelectionFunctionalRefSchema } as const;
const nonEmptyFunctionalRefArray = {
  type: 'array',
  minItems: 1,
  items: topicSelectionFunctionalRefSchema,
} as const;
const stringArray = { type: 'array', items: stringId } as const;
const nonNegativeInteger = { type: 'integer', minimum: 0 } as const;
const severitySchema = { enum: ['info', 'warning', 'blocking', 'critical'] } as const;

const traceLineageTypeSchema = { enum: [...PAPER_IMPLEMENTATION_TRACE_LINEAGE_TYPES] } as const;
const traceStatusSchema = { enum: [...PAPER_IMPLEMENTATION_TRACE_STATUSES] } as const;
const fieldRoleSchema = { enum: [...PAPER_IMPLEMENTATION_FIELD_ROLES] } as const;
const citationSourceKindSchema = { enum: [...PAPER_IMPLEMENTATION_CITATION_SOURCE_KINDS] } as const;
const citableSourceTypeSchema = { enum: [...PAPER_IMPLEMENTATION_CITABLE_SOURCE_TYPES] } as const;
const locatorQualitySchema = { enum: [...PAPER_IMPLEMENTATION_LOCATOR_QUALITIES] } as const;
const citedForReasonSchema = { enum: [...PAPER_IMPLEMENTATION_CITED_FOR_REASONS] } as const;
const citationCandidateStatusSchema = {
  enum: [...PAPER_IMPLEMENTATION_CITATION_CANDIDATE_STATUSES],
} as const;
const traceQueueStatusSchema = { enum: [...PAPER_IMPLEMENTATION_TRACE_QUEUE_STATUSES] } as const;
const traceGateStatusSchema = { enum: [...PAPER_IMPLEMENTATION_TRACE_GATE_STATUSES] } as const;
const claimStrengthSchema = { enum: [...PAPER_IMPLEMENTATION_CLAIM_STRENGTHS] } as const;

const literatureLineageSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['literature_evidence_refs', 'source_locator_refs', 'citation_candidate_refs'],
  properties: {
    literature_evidence_refs: functionalRefArray,
    source_locator_refs: functionalRefArray,
    citation_candidate_refs: functionalRefArray,
  },
} as const;

const experimentLineageSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'experiment_plan_refs',
    'work_order_refs',
    'run_refs',
    'run_evidence_refs',
    'result_packet_refs',
    'metric_refs',
  ],
  properties: {
    experiment_plan_refs: functionalRefArray,
    work_order_refs: functionalRefArray,
    run_refs: functionalRefArray,
    run_evidence_refs: functionalRefArray,
    result_packet_refs: functionalRefArray,
    metric_refs: functionalRefArray,
  },
} as const;

const artifactLineageSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'dataset_refs',
    'baseline_refs',
    'code_version_refs',
    'model_checkpoint_refs',
    'config_refs',
    'log_artifact_refs',
  ],
  properties: {
    dataset_refs: functionalRefArray,
    baseline_refs: functionalRefArray,
    code_version_refs: functionalRefArray,
    model_checkpoint_refs: functionalRefArray,
    config_refs: functionalRefArray,
    log_artifact_refs: functionalRefArray,
  },
} as const;

const decisionLineageSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'validation_cycle_refs',
    'motive_evolution_decision_refs',
    'gate_result_refs',
    'human_decision_refs',
    'accepted_risk_refs',
  ],
  properties: {
    validation_cycle_refs: functionalRefArray,
    motive_evolution_decision_refs: functionalRefArray,
    gate_result_refs: functionalRefArray,
    human_decision_refs: functionalRefArray,
    accepted_risk_refs: functionalRefArray,
  },
} as const;

const internalInterpretationLineageSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'result_interpretation_refs',
    'llm_rationale_refs',
    'board_summary_refs',
    'non_citable_refs',
  ],
  properties: {
    result_interpretation_refs: functionalRefArray,
    llm_rationale_refs: functionalRefArray,
    board_summary_refs: functionalRefArray,
    non_citable_refs: functionalRefArray,
  },
} as const;

export const traceLineageBundleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['literature', 'experiment', 'artifact', 'decision', 'internal_interpretation'],
  properties: {
    literature: literatureLineageSchema,
    experiment: experimentLineageSchema,
    artifact: artifactLineageSchema,
    decision: decisionLineageSchema,
    internal_interpretation: internalInterpretationLineageSchema,
  },
} as const;

export const traceIntegritySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'missing_refs',
    'broken_refs',
    'stale_refs',
    'invalidated_refs',
    'non_citable_refs',
    'partial_refs',
  ],
  properties: {
    missing_refs: functionalRefArray,
    broken_refs: functionalRefArray,
    stale_refs: functionalRefArray,
    invalidated_refs: functionalRefArray,
    non_citable_refs: functionalRefArray,
    partial_refs: functionalRefArray,
  },
} as const;

const partialTraceIntegritySchema = {
  type: 'object',
  additionalProperties: false,
  properties: traceIntegritySchema.properties,
} as const;

const sourceLocatorPayloadSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    section: nullableStringId,
    page: nullableStringId,
    paragraph: nullableStringId,
    table: nullableStringId,
    figure: nullableStringId,
    appendix: nullableStringId,
    quote_or_span_ref: nullableStringId,
    extraction_artifact_ref: nullableStringId,
  },
} as const;

export const createTraceManifestRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['target_ref', 'lineage'],
  properties: {
    target_ref: topicSelectionFunctionalRefSchema,
    lineage: traceLineageBundleSchema,
    integrity: partialTraceIntegritySchema,
    trace_policy_version_id: nullableStringId,
    created_by: actorTypeSchema,
  },
} as const;

export const traceManifestSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'trace_manifest_id',
    'implementation_project_id',
    'target_ref',
    'lineage',
    'integrity',
    'trace_status',
    'broken_ref_count',
    'stale_ref_count',
    'missing_ref_count',
    'non_citable_ref_count',
    'created_by',
    'created_at',
  ],
  properties: {
    trace_manifest_id: stringId,
    implementation_project_id: stringId,
    target_ref: topicSelectionFunctionalRefSchema,
    lineage: traceLineageBundleSchema,
    integrity: traceIntegritySchema,
    trace_status: traceStatusSchema,
    broken_ref_count: nonNegativeInteger,
    stale_ref_count: nonNegativeInteger,
    missing_ref_count: nonNegativeInteger,
    non_citable_ref_count: nonNegativeInteger,
    trace_policy_version_id: nullableStringId,
    created_by: actorTypeSchema,
    created_at: stringId,
  },
} as const;

export const createCitationCandidateRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'trace_manifest_id',
    'source_kind',
    'source_type',
    'source_id',
    'source_evidence_unit_ref',
    'source_locator_id',
    'locator_quality',
    'locator',
    'cited_for',
    'linked_target_refs',
    'normalized_source_statement',
  ],
  properties: {
    trace_manifest_id: stringId,
    source_kind: citationSourceKindSchema,
    source_type: citableSourceTypeSchema,
    source_id: stringId,
    source_evidence_unit_ref: topicSelectionFunctionalRefSchema,
    source_locator_id: stringId,
    locator_quality: locatorQualitySchema,
    locator: sourceLocatorPayloadSchema,
    cited_for: { type: 'array', minItems: 1, items: citedForReasonSchema },
    linked_target_refs: nonEmptyFunctionalRefArray,
    normalized_source_statement: stringId,
    citation_limitation: nullableStringId,
    created_by: actorTypeSchema,
  },
} as const;

export const citationCandidateSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'citation_candidate_id',
    'implementation_project_id',
    'trace_manifest_id',
    'trace_manifest_ref',
    'source_kind',
    'source_type',
    'source_id',
    'source_evidence_unit_ref',
    'source_locator_id',
    'locator_quality',
    'locator',
    'cited_for',
    'linked_target_refs',
    'status',
    'normalized_source_statement',
    'created_by',
    'created_at',
  ],
  properties: {
    citation_candidate_id: stringId,
    implementation_project_id: stringId,
    trace_manifest_id: stringId,
    trace_manifest_ref: topicSelectionFunctionalRefSchema,
    source_kind: citationSourceKindSchema,
    source_type: citableSourceTypeSchema,
    source_id: stringId,
    source_evidence_unit_ref: topicSelectionFunctionalRefSchema,
    source_locator_id: stringId,
    locator_quality: locatorQualitySchema,
    locator: sourceLocatorPayloadSchema,
    cited_for: { type: 'array', minItems: 1, items: citedForReasonSchema },
    linked_target_refs: nonEmptyFunctionalRefArray,
    status: citationCandidateStatusSchema,
    normalized_source_statement: stringId,
    citation_limitation: nullableStringId,
    created_by: actorTypeSchema,
    created_at: stringId,
  },
} as const;

const claimTraceChallengeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['challenging_result_refs', 'counter_evidence_refs', 'unresolved_objections'],
  properties: {
    challenging_result_refs: functionalRefArray,
    counter_evidence_refs: functionalRefArray,
    unresolved_objections: stringArray,
  },
} as const;

const claimTraceScopeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dataset_scope: nullableStringId,
    task_scope: nullableStringId,
    baseline_scope: nullableStringId,
    method_scope: nullableStringId,
    evaluation_scope: nullableStringId,
  },
} as const;

const claimTraceBoundarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['forbidden_overclaims', 'claim_strength', 'human_confirmation_required'],
  properties: {
    forbidden_overclaims: stringArray,
    claim_strength: claimStrengthSchema,
    human_confirmation_required: { type: 'boolean' },
  },
} as const;

export const createClaimTracePacketRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'claim_ref',
    'claim_statement',
    'trace_manifest_id',
    'lineage',
    'challenge',
    'scope',
    'boundary',
  ],
  properties: {
    claim_ref: topicSelectionFunctionalRefSchema,
    claim_statement: stringId,
    trace_manifest_id: stringId,
    lineage: traceLineageBundleSchema,
    challenge: claimTraceChallengeSchema,
    scope: claimTraceScopeSchema,
    boundary: claimTraceBoundarySchema,
    created_by: actorTypeSchema,
  },
} as const;

export const claimTracePacketSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'claim_trace_packet_id',
    'implementation_project_id',
    'claim_ref',
    'claim_statement',
    'trace_manifest_id',
    'trace_manifest_ref',
    'lineage',
    'challenge',
    'scope',
    'boundary',
    'created_by',
    'created_at',
  ],
  properties: {
    claim_trace_packet_id: stringId,
    implementation_project_id: stringId,
    claim_ref: topicSelectionFunctionalRefSchema,
    claim_statement: stringId,
    trace_manifest_id: stringId,
    trace_manifest_ref: topicSelectionFunctionalRefSchema,
    lineage: traceLineageBundleSchema,
    challenge: claimTraceChallengeSchema,
    scope: claimTraceScopeSchema,
    boundary: claimTraceBoundarySchema,
    created_by: actorTypeSchema,
    created_at: stringId,
  },
} as const;

export const registerNaturalLanguageFieldRoleRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'field_owner_ref',
    'field_name',
    'field_role',
    'can_feed_workflow',
    'can_feed_hard_gate',
    'can_be_cited',
  ],
  properties: {
    field_owner_ref: topicSelectionFunctionalRefSchema,
    field_name: stringId,
    field_role: fieldRoleSchema,
    can_feed_workflow: { type: 'boolean' },
    can_feed_hard_gate: { type: 'boolean' },
    can_be_cited: { type: 'boolean' },
    policy_version_id: nullableStringId,
    created_by: actorTypeSchema,
  },
} as const;

export const naturalLanguageFieldRoleRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'field_role_record_id',
    'implementation_project_id',
    'field_owner_ref',
    'field_name',
    'field_role',
    'can_feed_workflow',
    'can_feed_hard_gate',
    'can_be_cited',
    'created_by',
    'created_at',
  ],
  properties: {
    field_role_record_id: stringId,
    implementation_project_id: stringId,
    field_owner_ref: topicSelectionFunctionalRefSchema,
    field_name: stringId,
    field_role: fieldRoleSchema,
    can_feed_workflow: { type: 'boolean' },
    can_feed_hard_gate: { type: 'boolean' },
    can_be_cited: { type: 'boolean' },
    policy_version_id: nullableStringId,
    created_by: actorTypeSchema,
    created_at: stringId,
  },
} as const;

export const evaluateTraceGateRequestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['trace_manifest_id'],
  properties: {
    trace_manifest_id: stringId,
  },
} as const;

export const traceGateResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'gate_result_id',
    'implementation_project_id',
    'trace_manifest_id',
    'gate_status',
    'trace_status',
    'blocker_codes',
    'repair_queue_item_refs',
    'created_at',
  ],
  properties: {
    gate_result_id: stringId,
    implementation_project_id: stringId,
    trace_manifest_id: stringId,
    gate_status: traceGateStatusSchema,
    trace_status: traceStatusSchema,
    blocker_codes: stringArray,
    repair_queue_item_refs: functionalRefArray,
    created_at: stringId,
  },
} as const;

export const traceRepairQueueItemSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'queue_item_id',
    'implementation_project_id',
    'trace_manifest_id',
    'target_ref',
    'lineage_type',
    'blocker_code',
    'severity',
    'status',
    'created_by',
    'created_at',
  ],
  properties: {
    queue_item_id: stringId,
    implementation_project_id: stringId,
    trace_manifest_id: stringId,
    target_ref: topicSelectionFunctionalRefSchema,
    lineage_type: traceLineageTypeSchema,
    blocker_code: stringId,
    severity: severitySchema,
    status: traceQueueStatusSchema,
    source_ref: {
      anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }],
    },
    created_by: actorTypeSchema,
    created_at: stringId,
    resolved_by: {
      anyOf: [actorTypeSchema, { type: 'null' }],
    },
    resolved_at: nullableStringId,
    resolution_note: nullableStringId,
  },
} as const;

export const resolveTraceRepairQueueItemRequestSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    resolution_note: nullableStringId,
    resolved_by: actorTypeSchema,
  },
} as const;

export const listTraceManifestsResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: { items: { type: 'array', items: traceManifestSchema } },
} as const;

export const listCitationCandidatesResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: { items: { type: 'array', items: citationCandidateSchema } },
} as const;

export const listClaimTracePacketsResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: { items: { type: 'array', items: claimTracePacketSchema } },
} as const;

export const listTraceRepairQueueResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: { items: { type: 'array', items: traceRepairQueueItemSchema } },
} as const;
