import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import {
  TopicSelectionResourceSamplingService,
  type CreateTopicSelectionResourceSampleInput,
} from '../services/topic-selection-resource-sampling-service.js';

type BodyRequest<T> = FastifyRequest<{ Body: T }>;
type ParamsRequest<T> = FastifyRequest<{ Params: T }>;

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

  const request = (reply as { request?: { log?: { error: (err: unknown, msg?: string) => void } } }).request;
  if (request?.log?.error) {
    request.log.error(error, 'topic-selection resource-sampling error');
  } else {
    console.error('[topic-selection-resource-sampling]', error);
  }
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected topic-selection resource-sampling failure.',
    },
  });
}

export class TopicSelectionResourceSamplingController {
  constructor(private readonly service: TopicSelectionResourceSamplingService) {}

  createResourceSampleSet = async (
    request: BodyRequest<CreateTopicSelectionResourceSampleInput>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.createResourceSampleSet(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getResourceSampleSet = async (
    request: ParamsRequest<{ sampleSetId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.service.getResourceSampleSet(request.params.sampleSetId);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };
}
