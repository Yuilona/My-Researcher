import type { FastifyInstance } from 'fastify';
import {
  EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_STATUSES,
  EXPERIMENT_FOUNDATION_TRAINING_ADAPTER_KINDS,
  cancelExternalTrainingJobRequestSchema,
  collectExternalTrainingJobRequestSchema,
  submitExternalTrainingJobRequestSchema,
  syncExternalTrainingJobRequestSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { ExperimentFoundationExecutionController } from '../controllers/experiment-foundation-execution-controller.js';

const jobParamsSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['external_job_id'],
    properties: {
      external_job_id: { type: 'string', minLength: 1 },
    },
  },
} as const;

const listJobsQuerySchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      adapter_kind: { enum: [...EXPERIMENT_FOUNDATION_TRAINING_ADAPTER_KINDS] },
      status: { enum: [...EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_STATUSES] },
      training_task_spec_id: { type: 'string', minLength: 1 },
      materialization_result_id: { type: 'string', minLength: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      cursor: { type: 'string', minLength: 1 },
    },
  },
} as const;

function withJobParams<T extends { body?: unknown }>(schema: T) {
  return { ...schema, params: jobParamsSchema.params };
}

export async function registerExperimentFoundationExecutionRoutes(
  fastify: FastifyInstance,
  controller: ExperimentFoundationExecutionController,
): Promise<void> {
  fastify.post(
    '/experiment-foundation/execution/jobs/submit',
    { schema: submitExternalTrainingJobRequestSchema },
    controller.submitJob,
  );
  fastify.get(
    '/experiment-foundation/execution/jobs/:external_job_id',
    { schema: jobParamsSchema },
    controller.getJob,
  );
  fastify.get(
    '/experiment-foundation/execution/jobs',
    { schema: listJobsQuerySchema },
    controller.listJobs,
  );
  fastify.post(
    '/experiment-foundation/execution/jobs/:external_job_id/sync',
    { schema: withJobParams(syncExternalTrainingJobRequestSchema) },
    controller.syncJob,
  );
  fastify.post(
    '/experiment-foundation/execution/jobs/:external_job_id/cancel',
    { schema: withJobParams(cancelExternalTrainingJobRequestSchema) },
    controller.cancelJob,
  );
  fastify.post(
    '/experiment-foundation/execution/jobs/:external_job_id/collect',
    { schema: withJobParams(collectExternalTrainingJobRequestSchema) },
    controller.collectJob,
  );
}
