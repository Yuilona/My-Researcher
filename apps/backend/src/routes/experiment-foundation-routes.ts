import type { FastifyInstance } from 'fastify';
import {
  EXPERIMENT_FOUNDATION_RECORD_KINDS,
  createExperimentFoundationRecordRequestSchema,
  experimentFoundationPromotionDecisionRequestSchema,
  experimentFoundationReadinessCheckRequestSchema,
  listExperimentFoundationReadinessReportsQuerySchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { ExperimentFoundationController } from '../controllers/experiment-foundation-controller.js';

const recordParamsSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['record_kind', 'record_id'],
    properties: {
      record_kind: { enum: [...EXPERIMENT_FOUNDATION_RECORD_KINDS] },
      record_id: { type: 'string', minLength: 1 },
    },
  },
} as const;

const listRecordsQuerySchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      record_kind: { enum: [...EXPERIMENT_FOUNDATION_RECORD_KINDS] },
      status: { type: 'string', minLength: 1 },
      family: { type: 'string', minLength: 1 },
      parent_record_id: { type: 'string', minLength: 1 },
      owner_ref_id: { type: 'string', minLength: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      cursor: { type: 'string', minLength: 1 },
    },
  },
} as const;

const readinessParamsSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['target_kind', 'target_id'],
    properties: {
      target_kind: { enum: [...EXPERIMENT_FOUNDATION_RECORD_KINDS] },
      target_id: { type: 'string', minLength: 1 },
    },
  },
} as const;

const candidateParamsSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['candidate_id'],
    properties: {
      candidate_id: { type: 'string', minLength: 1 },
    },
  },
} as const;

function withRecordParams<T extends { body?: unknown }>(schema: T) {
  return { ...schema, params: recordParamsSchema.params };
}

function withCandidateParams<T extends { body?: unknown }>(schema: T) {
  return { ...schema, params: candidateParamsSchema.params };
}

export async function registerExperimentFoundationRoutes(
  fastify: FastifyInstance,
  controller: ExperimentFoundationController,
): Promise<void> {
  fastify.post(
    '/experiment-foundation/records',
    { schema: createExperimentFoundationRecordRequestSchema },
    controller.createRecord,
  );
  fastify.put(
    '/experiment-foundation/records/:record_kind/:record_id',
    { schema: withRecordParams(createExperimentFoundationRecordRequestSchema) },
    controller.upsertRecord,
  );
  fastify.get(
    '/experiment-foundation/records/:record_kind/:record_id',
    { schema: recordParamsSchema },
    controller.getRecord,
  );
  fastify.get(
    '/experiment-foundation/records',
    { schema: listRecordsQuerySchema },
    controller.listRecords,
  );
  fastify.post(
    '/experiment-foundation/readiness/check',
    { schema: experimentFoundationReadinessCheckRequestSchema },
    controller.checkReadiness,
  );
  fastify.get(
    '/experiment-foundation/readiness/:target_kind/:target_id/latest',
    { schema: readinessParamsSchema },
    controller.getLatestReadiness,
  );
  fastify.get(
    '/experiment-foundation/readiness',
    { schema: listExperimentFoundationReadinessReportsQuerySchema },
    controller.listReadinessReports,
  );
  fastify.post(
    '/experiment-foundation/candidates/:candidate_id/promotion',
    { schema: withCandidateParams(experimentFoundationPromotionDecisionRequestSchema) },
    controller.decidePromotion,
  );
}
