import {
  literatureFulltextAcquisitionCreateJobRequestSchema,
  literatureFulltextAcquisitionDryRunRequestSchema,
  listLiteratureFulltextAcquisitionJobsQuerySchema,
  type LiteratureFulltextAcquisitionCreateJobRequest,
  type LiteratureFulltextAcquisitionDryRunRequest,
  type ListLiteratureFulltextAcquisitionJobsQuery,
} from '@paper-engineering-assistant/shared/research-lifecycle/literature-contracts';
import type { FastifyInstance } from 'fastify';
import { LiteratureFulltextAcquisitionController } from '../controllers/literature-fulltext-acquisition-controller.js';

const jobParamsSchema = {
  type: 'object',
  required: ['jobId'],
  properties: {
    jobId: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export async function registerLiteratureFulltextAcquisitionRoutes(
  app: FastifyInstance,
  controller: LiteratureFulltextAcquisitionController,
): Promise<void> {
  app.post<{ Body: LiteratureFulltextAcquisitionDryRunRequest }>(
    '/literature/fulltext-acquisition/dry-runs',
    {
      schema: {
        body: literatureFulltextAcquisitionDryRunRequestSchema,
      },
    },
    async (request, reply) => controller.dryRun(request, reply),
  );

  app.post<{ Body: LiteratureFulltextAcquisitionCreateJobRequest }>(
    '/literature/fulltext-acquisition/jobs',
    {
      schema: {
        body: literatureFulltextAcquisitionCreateJobRequestSchema,
      },
    },
    async (request, reply) => controller.createJob(request, reply),
  );

  app.get<{ Querystring: ListLiteratureFulltextAcquisitionJobsQuery }>(
    '/literature/fulltext-acquisition/jobs',
    {
      schema: {
        querystring: listLiteratureFulltextAcquisitionJobsQuerySchema,
      },
    },
    async (request, reply) => controller.listJobs(request, reply),
  );

  app.get<{ Params: { jobId: string } }>(
    '/literature/fulltext-acquisition/jobs/:jobId',
    {
      schema: {
        params: jobParamsSchema,
      },
    },
    async (request, reply) => controller.getJob(request, reply),
  );

  app.post<{ Params: { jobId: string } }>(
    '/literature/fulltext-acquisition/jobs/:jobId/pause',
    {
      schema: {
        params: jobParamsSchema,
      },
    },
    async (request, reply) => controller.pauseJob(request, reply),
  );

  app.post<{ Params: { jobId: string } }>(
    '/literature/fulltext-acquisition/jobs/:jobId/resume',
    {
      schema: {
        params: jobParamsSchema,
      },
    },
    async (request, reply) => controller.resumeJob(request, reply),
  );

  app.post<{ Params: { jobId: string } }>(
    '/literature/fulltext-acquisition/jobs/:jobId/cancel',
    {
      schema: {
        params: jobParamsSchema,
      },
    },
    async (request, reply) => controller.cancelJob(request, reply),
  );

  app.post<{ Params: { jobId: string } }>(
    '/literature/fulltext-acquisition/jobs/:jobId/retry-failed',
    {
      schema: {
        params: jobParamsSchema,
      },
    },
    async (request, reply) => controller.retryFailed(request, reply),
  );

  app.delete<{ Params: { jobId: string } }>(
    '/literature/fulltext-acquisition/jobs/:jobId',
    {
      schema: {
        params: jobParamsSchema,
      },
    },
    async (request, reply) => controller.deleteJob(request, reply),
  );
}
