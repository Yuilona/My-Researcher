import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  TOPIC_SELECTION_ACTOR_TYPES,
  TOPIC_SELECTION_ARTIFACT_KINDS,
  TOPIC_SELECTION_ARTIFACT_STORAGE_KINDS,
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
  TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_IDS,
  topicSelectionV1bWorkflowHarnessRunRequestSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-workflow-harness-contracts';
import {
  TopicSelectionV1bController,
  type OfflineDatasetBody,
  type WorkflowHarnessArtifactBody,
  type WorkflowHarnessRunBody,
} from '../controllers/topic-selection-v1b-controller.js';

type JsonSchema = Record<string, unknown>;

const stringId = { type: 'string', minLength: 1 } as const;
const nullableStringId = { anyOf: [stringId, { type: 'null' }] } as const;
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] } as const;
const stringArray = { type: 'array', items: stringId } as const;
const recordPayload = { type: 'object', additionalProperties: true } as const;
const actorType = { enum: [...TOPIC_SELECTION_ACTOR_TYPES] } as const;

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

async function normalizeOptionalBody(request: FastifyRequest): Promise<void> {
  if (request.body === undefined) {
    (request as FastifyRequest & { body: unknown }).body = {};
  }
}

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
const workflowHarnessNodeParams = paramsSchema({
  nodeId: { enum: [...TOPIC_SELECTION_V1B_WORKFLOW_HARNESS_NODE_IDS] },
});
const workflowHarnessRunBody = {
  ...workflowHarnessNodeParams,
  body: topicSelectionV1bWorkflowHarnessRunRequestSchema,
};
const workflowHarnessArtifactParams = paramsSchema({ artifactRefId: stringId });
const workflowHarnessArtifactBody = bodySchema(['artifact_kind'], {
  workspace_id: nullableStringId,
  title_card_id: nullableStringId,
  artifact_kind: { enum: [...TOPIC_SELECTION_ARTIFACT_KINDS] },
  storage_kind: { enum: [...TOPIC_SELECTION_ARTIFACT_STORAGE_KINDS] },
  uri: nullableStringId,
  payload: { anyOf: [recordPayload, { type: 'null' }] },
  checksum: nullableStringId,
  byte_size: nullableNumber,
  mime_type: nullableStringId,
  workflow_run_id: nullableStringId,
  input_snapshot_id: nullableStringId,
  created_by: actorType,
});

export async function registerTopicSelectionV1bRoutes(
  fastify: FastifyInstance,
  controller: TopicSelectionV1bController,
): Promise<void> {
  fastify.post<{ Body: WorkflowHarnessRunBody; Params: { nodeId: string } }>(
    '/topic-selection/v1b/workflow-harness/nodes/:nodeId/invocations',
    { schema: workflowHarnessRunBody },
    controller.invokeWorkflowHarnessNode,
  );
  fastify.post<{ Body: WorkflowHarnessArtifactBody }>(
    '/topic-selection/v1b/workflow-harness/artifacts',
    { schema: workflowHarnessArtifactBody },
    controller.recordWorkflowHarnessArtifact,
  );
  fastify.get<{ Params: { artifactRefId: string } }>(
    '/topic-selection/v1b/workflow-harness/artifacts/:artifactRefId',
    { schema: workflowHarnessArtifactParams },
    controller.getWorkflowHarnessArtifact,
  );
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
  // T-087 Phase 3.2/3.3 — read-only detail projections for harness-written authority.
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
  fastify.get('/topic-selection/v1b/topic-packages/:topicPackageId', { schema: packageParams }, controller.getDraftPackage);
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
