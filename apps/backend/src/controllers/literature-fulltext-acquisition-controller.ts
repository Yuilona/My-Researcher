import type {
  CreateLiteratureFulltextAcquisitionJobResponse,
  LiteratureFulltextAcquisitionCreateJobRequest,
  LiteratureFulltextAcquisitionDryRunRequest,
  LiteratureFulltextAcquisitionDryRunResponse,
  LiteratureFulltextAcquisitionJobResponse,
  ListLiteratureFulltextAcquisitionJobsQuery,
  ListLiteratureFulltextAcquisitionJobsResponse,
} from '@paper-engineering-assistant/shared/research-lifecycle/literature-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { LiteratureFulltextAcquisitionService } from '../services/literature-fulltext-acquisition-service.js';

type JobParams = {
  jobId: string;
};

export class LiteratureFulltextAcquisitionController {
  constructor(private readonly service: LiteratureFulltextAcquisitionService) {}

  async dryRun(
    request: FastifyRequest<{ Body: LiteratureFulltextAcquisitionDryRunRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await this.service.dryRun(request.body ?? {});
      reply.status(200).send(result satisfies LiteratureFulltextAcquisitionDryRunResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async createJob(
    request: FastifyRequest<{ Body: LiteratureFulltextAcquisitionCreateJobRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await this.service.createJob(request.body ?? {});
      reply.status(201).send(result satisfies CreateLiteratureFulltextAcquisitionJobResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async listJobs(
    request: FastifyRequest<{ Querystring: ListLiteratureFulltextAcquisitionJobsQuery }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await this.service.listJobs(request.query);
      reply.status(200).send(result satisfies ListLiteratureFulltextAcquisitionJobsResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async getJob(request: FastifyRequest<{ Params: JobParams }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await this.service.getJob(request.params.jobId);
      reply.status(200).send(result satisfies LiteratureFulltextAcquisitionJobResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async pauseJob(request: FastifyRequest<{ Params: JobParams }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await this.service.pauseJob(request.params.jobId);
      reply.status(200).send(result satisfies LiteratureFulltextAcquisitionJobResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async resumeJob(request: FastifyRequest<{ Params: JobParams }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await this.service.resumeJob(request.params.jobId);
      reply.status(200).send(result satisfies LiteratureFulltextAcquisitionJobResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async cancelJob(request: FastifyRequest<{ Params: JobParams }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await this.service.cancelJob(request.params.jobId);
      reply.status(200).send(result satisfies LiteratureFulltextAcquisitionJobResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async retryFailed(request: FastifyRequest<{ Params: JobParams }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await this.service.retryFailed(request.params.jobId);
      reply.status(200).send(result satisfies LiteratureFulltextAcquisitionJobResponse);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async deleteJob(request: FastifyRequest<{ Params: JobParams }>, reply: FastifyReply): Promise<void> {
    try {
      await this.service.deleteJob(request.params.jobId);
      reply.status(204).send();
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  private handleError(reply: FastifyReply, error: unknown): void {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        error: {
          code: error.errorCode,
          message: error.message,
          details: error.details,
        },
      });
      return;
    }

    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}
