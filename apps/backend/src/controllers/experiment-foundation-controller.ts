import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  CreateExperimentFoundationRecordRequest,
  ExperimentFoundationPromotionDecisionRequest,
  ExperimentFoundationReadinessCheckRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AppError } from '../errors/app-error.js';
import { ExperimentFoundationService } from '../services/experiment-foundation-service.js';

type RecordParams = {
  record_kind: string;
  record_id: string;
};

type ListQuery = {
  record_kind?: string;
  status?: string;
  family?: string;
  parent_record_id?: string;
  owner_ref_id?: string;
  limit?: string;
  cursor?: string;
};

type ReadinessParams = {
  target_kind: string;
  target_id: string;
};

type CandidateParams = {
  candidate_id: string;
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
    req.log.error(error, 'experiment-foundation error');
  } else {
    console.error('[experiment-foundation]', error);
  }
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected experiment-foundation failure.',
    },
  });
}

export class ExperimentFoundationController {
  constructor(private readonly service: ExperimentFoundationService) {}

  createRecord = async (
    request: FastifyRequest<{ Body: CreateExperimentFoundationRecordRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.createRecord(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  upsertRecord = async (
    request: FastifyRequest<{ Params: RecordParams; Body: CreateExperimentFoundationRecordRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.upsertRecord(
        request.params.record_kind,
        request.params.record_id,
        request.body,
      );
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getRecord = async (
    request: FastifyRequest<{ Params: RecordParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.getRecord(request.params.record_kind, request.params.record_id);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listRecords = async (
    request: FastifyRequest<{ Querystring: ListQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.listRecords(request.query);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  checkReadiness = async (
    request: FastifyRequest<{ Body: ExperimentFoundationReadinessCheckRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.checkReadiness(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getLatestReadiness = async (
    request: FastifyRequest<{ Params: ReadinessParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.getLatestReadinessReport(
        request.params.target_kind,
        request.params.target_id,
      );
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  decidePromotion = async (
    request: FastifyRequest<{ Params: CandidateParams; Body: ExperimentFoundationPromotionDecisionRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.decidePromotion(request.params.candidate_id, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };
}
