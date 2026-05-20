import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  TOPIC_SELECTION_ACTOR_TYPES,
  topicSelectionFunctionalRefSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_SOURCES,
  TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_STATUSES,
  TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS,
  topicSelectionOfflineEvaluationGoldExpectationSchema,
  topicSelectionOfflineEvaluationObservedOutputSchema,
  topicSelectionOfflineFrozenInputBundleSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import {
  TOPIC_SELECTION_SLICE_LOOPBACK_TARGETS,
  TOPIC_SELECTION_SLICE_SELECTION_DECISIONS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import {
  TOPIC_SELECTION_TOPIC_QUESTION_SELECTION_DECISIONS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import {
  TOPIC_SELECTION_VALUE_DISPOSITIONS,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import {
  TopicSelectionV1bController,
  type OfflineDatasetBody,
} from '../controllers/topic-selection-v1b-controller.js';

type JsonSchema = Record<string, unknown>;

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] } as const;
const stringArray = { type: 'array', items: stringId } as const;
const functionalRefArray = { type: 'array', items: topicSelectionFunctionalRefSchema } as const;
const recordPayload = { type: 'object', additionalProperties: true } as const;
const recordArray = { type: 'array', items: recordPayload } as const;
const actorType = { enum: [...TOPIC_SELECTION_ACTOR_TYPES] } as const;
const nullableFunctionalRef = { anyOf: [topicSelectionFunctionalRefSchema, { type: 'null' }] } as const;

function bodySchema(required: string[], properties: JsonSchema): JsonSchema {
  const body: JsonSchema = {
    type: 'object',
    additionalProperties: true,
    properties,
  };
  if (required.length > 0) {
    body.required = required;
  }
  return { body };
}

function paramsSchema(properties: JsonSchema): JsonSchema {
  return {
    params: {
      type: 'object',
      additionalProperties: false,
      required: Object.keys(properties),
      properties,
    },
  };
}

function bodyAndParamsSchema(required: string[], properties: JsonSchema, params: JsonSchema): JsonSchema {
  return {
    ...bodySchema(required, properties),
    ...paramsSchema(params),
  };
}

async function normalizeOptionalBody(request: FastifyRequest): Promise<void> {
  if (request.body === undefined) {
    (request as FastifyRequest & { body: unknown }).body = {};
  }
}

const intakeSnapshotBody = bodySchema(['v1b_input_bundle_id'], {
  workspace_id: nullableStringId,
  v1b_input_bundle_id: stringId,
  snapshot_version: stringId,
  created_by: actorType,
  policy_version_id: nullableStringId,
});

const researchConstraintProfileBody = bodySchema(['v1b_intake_snapshot_id', 'target_community', 'claim_ceiling'], {
  workspace_id: nullableStringId,
  v1b_intake_snapshot_id: stringId,
  previous_profile_id: nullableStringId,
  profile_version: stringId,
  target_community: stringId,
  target_venue_class: nullableStringId,
  intended_contribution_style: nullableStringId,
  method_constraints: stringArray,
  resource_constraints: stringArray,
  available_assets: stringArray,
  feasibility_budget: recordPayload,
  non_goals: stringArray,
  claim_ceiling: stringId,
  human_constraint_notes: nullableStringId,
  constraint_payload: recordPayload,
  created_by: actorType,
  policy_version_id: nullableStringId,
});

const intakeReadinessBody = bodySchema(['v1b_intake_snapshot_id', 'research_constraint_profile_id'], {
  workspace_id: nullableStringId,
  v1b_intake_snapshot_id: stringId,
  research_constraint_profile_id: stringId,
  policy_version_id: nullableStringId,
  assessed_by: actorType,
});

const researchSliceOptionSetBody = bodySchema(['readiness_assessment_id'], {
  workspace_id: nullableStringId,
  readiness_assessment_id: stringId,
  triggered_by: actorType,
  workflow_profile_version: nullableStringId,
  prompt_template_version: nullableStringId,
  policy_version_id: nullableStringId,
  model: recordPayload,
});

const researchSliceSelectionBody = bodyAndParamsSchema(['decision', 'selection_rationale'], {
  option_set_id: stringId,
  decision: { enum: [...TOPIC_SELECTION_SLICE_SELECTION_DECISIONS] },
  selected_option_id: nullableStringId,
  decided_by: actorType,
  selection_policy_version: stringId,
  selection_rationale: stringId,
  decision_basis: recordPayload,
  rejected_option_reasons: recordArray,
  required_actions: stringArray,
  loopback_target: { enum: [...TOPIC_SELECTION_SLICE_LOOPBACK_TARGETS] },
  loopback_target_ref: nullableFunctionalRef,
  loopback_reason_code: nullableStringId,
  source_downstream_object_ref: nullableFunctionalRef,
  accepted_risk_refs: functionalRefArray,
  confidence: nullableNumber,
  requires_human_review: { type: 'boolean' },
  human_review_reason: nullableStringId,
  policy_version_id: nullableStringId,
}, { optionSetId: stringId });

const topicQuestionCandidateSetBody = bodySchema(['research_slice_id'], {
  research_slice_id: stringId,
  workspace_id: nullableStringId,
  triggered_by: actorType,
  workflow_profile_version: nullableStringId,
  prompt_template_version: nullableStringId,
  policy_version_id: nullableStringId,
  model: recordPayload,
});

const topicQuestionSelectionBody = bodyAndParamsSchema(['decision', 'decision_rationale'], {
  candidate_set_id: stringId,
  decision: { enum: [...TOPIC_SELECTION_TOPIC_QUESTION_SELECTION_DECISIONS] },
  admitted_candidate_ids: stringArray,
  decided_by: actorType,
  selection_policy_version: stringId,
  decision_rationale: stringId,
  merged_candidate_groups: recordArray,
  candidate_relationships: recordPayload,
  priority_order: stringArray,
  rejected_candidate_reasons: recordArray,
  blocking_contexts: recordArray,
  accepted_risk_refs: functionalRefArray,
  confidence: nullableNumber,
  requires_human_review: { type: 'boolean' },
  human_review_triggers: stringArray,
  policy_version_id: nullableStringId,
}, { candidateSetId: stringId });

const topicValueAssessmentBody = bodySchema(['topic_question_contract_id'], {
  topic_question_contract_id: stringId,
  workspace_id: nullableStringId,
  triggered_by: actorType,
  workflow_profile_version: nullableStringId,
  prompt_template_version: nullableStringId,
  policy_version_id: nullableStringId,
  model: recordPayload,
});

const valueDispositionBody = bodyAndParamsSchema(['decision', 'decision_rationale'], {
  topic_value_assessment_id: stringId,
  decision: { enum: [...TOPIC_SELECTION_VALUE_DISPOSITIONS] },
  decided_by: actorType,
  decision_rationale: stringId,
  required_actions: stringArray,
  loopback_target_ref: nullableFunctionalRef,
  blocking_contexts: recordArray,
  accepted_risk_refs: functionalRefArray,
  blocker_refs: functionalRefArray,
  policy_version_id: nullableStringId,
}, { topicValueAssessmentId: stringId });

const draftPackageBody = bodySchema(['value_disposition_decision_id'], {
  value_disposition_decision_id: stringId,
  workspace_id: nullableStringId,
  created_by: actorType,
  policy_version_id: nullableStringId,
});

const packageParams = paramsSchema({ topicPackageId: stringId });

const offlineDatasetBody = bodySchema([], {
  workspace_id: nullableStringId,
  dataset_key: stringId,
  dataset_version: stringId,
  stage: { enum: ['v1b'] },
  source: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_SOURCES] },
  status: { enum: [...TOPIC_SELECTION_OFFLINE_EVALUATION_DATASET_STATUSES] },
  description: nullableStringId,
  payload: recordPayload,
  created_by: actorType,
});

const v1bFrozenInputBundleSchema = {
  ...topicSelectionOfflineFrozenInputBundleSchema,
  properties: {
    ...(topicSelectionOfflineFrozenInputBundleSchema.properties as Record<string, unknown>),
    stage: { const: 'v1b' },
  },
} as const;

const offlineCaseBody = bodySchema([
  'dataset_id',
  'case_key',
  'case_type',
  'frozen_input_bundle',
  'gold_expectation',
], {
  workspace_id: nullableStringId,
  dataset_id: stringId,
  title_card_id: nullableStringId,
  case_key: stringId,
  case_type: { enum: [...TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_CASE_TYPES] },
  frozen_input_bundle: v1bFrozenInputBundleSchema,
  gold_expectation: topicSelectionOfflineEvaluationGoldExpectationSchema,
  tags: stringArray,
});

const offlineRunBody = bodySchema(['dataset_id', 'workflow_profile_key'], {
  workspace_id: nullableStringId,
  dataset_id: stringId,
  run_key: stringId,
  workflow_profile_key: stringId,
  workflow_profile_version: nullableStringId,
  model_profile_key: nullableStringId,
  search_profile_key: nullableStringId,
  policy_version_id: nullableStringId,
  metric_keys: {
    type: 'array',
    items: { enum: [...TOPIC_SELECTION_V1B_OFFLINE_EVALUATION_METRIC_KEYS] },
  },
  run_payload: recordPayload,
  created_by: actorType,
});

const offlineCaseResultBody = bodySchema(['run_id', 'case_id', 'observed_output'], {
  workspace_id: nullableStringId,
  run_id: stringId,
  case_id: stringId,
  observed_output: topicSelectionOfflineEvaluationObservedOutputSchema,
});

const runParams = paramsSchema({ runId: stringId });

export async function registerTopicSelectionV1bRoutes(
  fastify: FastifyInstance,
  controller: TopicSelectionV1bController,
): Promise<void> {
  // T-087 Phase 3.1 — reviewer workbench v1b read-only projections.
  fastify.get(
    '/topic-selection/v1b/title-cards/:titleCardId/research-slice-option-sets',
    { schema: paramsSchema({ titleCardId: stringId }) },
    controller.listResearchSliceOptionSetsByTitleCard,
  );
  fastify.get(
    '/topic-selection/v1b/title-cards/:titleCardId/topic-question-candidate-sets',
    { schema: paramsSchema({ titleCardId: stringId }) },
    controller.listTopicQuestionCandidateSetsByTitleCard,
  );
  fastify.get(
    '/topic-selection/v1b/title-cards/:titleCardId/topic-value-assessments',
    { schema: paramsSchema({ titleCardId: stringId }) },
    controller.listTopicValueAssessmentsByTitleCard,
  );
  fastify.get(
    '/topic-selection/v1b/title-cards/:titleCardId/topic-packages',
    { schema: paramsSchema({ titleCardId: stringId }) },
    controller.listTopicPackagesByTitleCard,
  );
  // T-087 Phase 3.2/3.3 — picker drivers for selection-decision forms.
  fastify.get(
    '/topic-selection/v1b/research-slice-option-sets/:optionSetId/options',
    { schema: paramsSchema({ optionSetId: stringId }) },
    controller.listResearchSliceOptionsByOptionSet,
  );
  fastify.get(
    '/topic-selection/v1b/topic-question-candidate-sets/:candidateSetId/candidates',
    { schema: paramsSchema({ candidateSetId: stringId }) },
    controller.listTopicQuestionCandidatesByCandidateSet,
  );
  fastify.post('/topic-selection/v1b/intake-snapshots', { schema: intakeSnapshotBody }, controller.createIntakeSnapshot);
  fastify.post(
    '/topic-selection/v1b/research-constraint-profiles',
    { schema: researchConstraintProfileBody },
    controller.createResearchConstraintProfile,
  );
  fastify.post(
    '/topic-selection/v1b/intake-readiness-assessments',
    { schema: intakeReadinessBody },
    controller.assessIntakeReadiness,
  );
  fastify.post(
    '/topic-selection/v1b/research-slice-option-sets',
    { schema: researchSliceOptionSetBody },
    controller.planResearchSliceOptions,
  );
  fastify.post(
    '/topic-selection/v1b/research-slice-option-sets/:optionSetId/selection-decisions',
    { schema: researchSliceSelectionBody },
    controller.selectResearchSlice,
  );
  fastify.post(
    '/topic-selection/v1b/topic-question-candidate-sets',
    { schema: topicQuestionCandidateSetBody },
    controller.formTopicQuestionCandidates,
  );
  fastify.post(
    '/topic-selection/v1b/topic-question-candidate-sets/:candidateSetId/selection-decisions',
    { schema: topicQuestionSelectionBody },
    controller.selectTopicQuestion,
  );
  fastify.post(
    '/topic-selection/v1b/topic-value-assessments',
    { schema: topicValueAssessmentBody },
    controller.assessTopicValue,
  );
  fastify.post(
    '/topic-selection/v1b/topic-value-assessments/:topicValueAssessmentId/disposition-decisions',
    { schema: valueDispositionBody },
    controller.decideValueDisposition,
  );
  fastify.post('/topic-selection/v1b/topic-packages/drafts', { schema: draftPackageBody }, controller.createDraftPackage);
  fastify.get('/topic-selection/v1b/topic-packages/:topicPackageId', { schema: packageParams }, controller.getDraftPackage);
  fastify.post(
    '/topic-selection/v1b/topic-packages/:topicPackageId/v1c-input-bundles',
    { schema: packageParams },
    controller.publishV1cInputBundle,
  );
  fastify.post<{ Body: OfflineDatasetBody }>(
    '/topic-selection/v1b/offline-evaluation/datasets',
    { schema: offlineDatasetBody, preValidation: normalizeOptionalBody },
    controller.createOfflineEvaluationDataset,
  );
  fastify.post<{ Body: OfflineDatasetBody }>(
    '/topic-selection/v1b/offline-evaluation/datasets/synthetic-baseline',
    { schema: offlineDatasetBody, preValidation: normalizeOptionalBody },
    controller.createSyntheticOfflineEvaluationDataset,
  );
  fastify.post('/topic-selection/v1b/offline-evaluation/cases', { schema: offlineCaseBody }, controller.addOfflineEvaluationCase);
  fastify.post('/topic-selection/v1b/offline-evaluation/runs', { schema: offlineRunBody }, controller.startOfflineEvaluationRun);
  fastify.post(
    '/topic-selection/v1b/offline-evaluation/case-results',
    { schema: offlineCaseResultBody },
    controller.recordOfflineEvaluationCaseResult,
  );
  fastify.post(
    '/topic-selection/v1b/offline-evaluation/runs/:runId/complete',
    { schema: runParams },
    controller.completeOfflineEvaluationRun,
  );
  fastify.get(
    '/topic-selection/v1b/offline-evaluation/runs/:runId/metric-results',
    { schema: runParams },
    controller.listOfflineEvaluationMetricResults,
  );
  fastify.get(
    '/topic-selection/v1b/offline-evaluation/runs/:runId/replay-diffs',
    { schema: runParams },
    controller.listOfflineEvaluationReplayDiffs,
  );
}
