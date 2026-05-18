import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  CancelExternalTrainingJobRequest,
  CollectExternalTrainingJobRequest,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AppError } from '../errors/app-error.js';
import { ExperimentFoundationExecutionService } from '../services/experiment-foundation-execution-service.js';

type JobParams = {
  external_job_id: string;
};

type ListJobsQuery = {
  adapter_kind?: string;
  status?: string;
  training_task_spec_id?: string;
  materialization_result_id?: string;
  limit?: string;
  cursor?: string;
};

function handleError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.details,
      },
    });
  }
  const req = (reply as { request?: { log?: { error: (err: unknown, msg?: string) => void } } }).request;
  if (req?.log?.error) {
    req.log.error(error, 'experiment-foundation execution error');
  } else {
    console.error('[experiment-foundation-execution]', error);
  }
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected experiment-foundation execution failure.',
    },
  });
}

export class ExperimentFoundationExecutionController {
  constructor(private readonly service: ExperimentFoundationExecutionService) {}

  submitJob = async (
    request: FastifyRequest<{ Body: SubmitExternalTrainingJobRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.submitJob(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getJob = async (
    request: FastifyRequest<{ Params: JobParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.getJob(request.params.external_job_id);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listJobs = async (
    request: FastifyRequest<{ Querystring: ListJobsQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.listJobs(request.query);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  syncJob = async (
    request: FastifyRequest<{ Params: JobParams; Body: SyncExternalTrainingJobRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.syncJob(request.params.external_job_id, request.body);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  cancelJob = async (
    request: FastifyRequest<{ Params: JobParams; Body: CancelExternalTrainingJobRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.cancelJob(request.params.external_job_id, request.body);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  collectJob = async (
    request: FastifyRequest<{ Params: JobParams; Body: CollectExternalTrainingJobRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.collectJob(request.params.external_job_id, request.body);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };
}
