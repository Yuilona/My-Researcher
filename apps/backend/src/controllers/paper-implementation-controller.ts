import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  BootstrapImplementationProjectRequest,
  RecordImplementationFeedbackEventRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  CreateCitationCandidateRequest,
  CreateClaimTracePacketRequest,
  CreateTraceManifestRequest,
  EvaluateTraceGateRequest,
  RegisterNaturalLanguageFieldRoleRequest,
  ResolveTraceRepairQueueItemRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-trace-contracts';

import { AppError } from '../errors/app-error.js';
import { PaperImplementationIntakeBootstrapService } from '../services/paper-implementation-intake-bootstrap-service.js';
import { PaperImplementationTraceKernelService } from '../services/paper-implementation-trace-kernel-service.js';

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
    request.log.error(error, 'paper-implementation error');
  } else {
    console.error('[paper-implementation]', error);
  }
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected paper-implementation failure.',
    },
  });
}

export class PaperImplementationController {
  constructor(
    private readonly intakeBootstrap: PaperImplementationIntakeBootstrapService,
    private readonly traceKernel: PaperImplementationTraceKernelService,
  ) {}

  bootstrapProject = async (
    request: BodyRequest<BootstrapImplementationProjectRequest>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.intakeBootstrap.bootstrapProject(request.body);
      return reply.status(result.project_created ? 201 : 200).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getProject = async (
    request: ParamsRequest<{ implementation_project_id: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.intakeBootstrap.getProject(request.params.implementation_project_id);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getProjectByBridge = async (
    request: ParamsRequest<{ paper_project_bridge_id: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.intakeBootstrap.getProjectByBridge(request.params.paper_project_bridge_id);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  recordFeedbackEvent = async (
    request: FastifyRequest<{
      Params: { implementation_project_id: string };
      Body: RecordImplementationFeedbackEventRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.intakeBootstrap.recordFeedbackEvent(
        request.params.implementation_project_id,
        request.body,
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createTraceManifest = async (
    request: FastifyRequest<{
      Params: { implementation_project_id: string };
      Body: CreateTraceManifestRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.createTraceManifest(
        request.params.implementation_project_id,
        request.body,
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listTraceManifests = async (
    request: ParamsRequest<{ implementation_project_id: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.traceKernel.listTraceManifests(
        request.params.implementation_project_id,
      );
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getTraceManifest = async (
    request: ParamsRequest<{
      implementation_project_id: string;
      trace_manifest_id: string;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.getTraceManifest(
        request.params.implementation_project_id,
        request.params.trace_manifest_id,
      );
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createCitationCandidate = async (
    request: FastifyRequest<{
      Params: { implementation_project_id: string };
      Body: CreateCitationCandidateRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.createCitationCandidate(
        request.params.implementation_project_id,
        request.body,
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listCitationCandidates = async (
    request: ParamsRequest<{ implementation_project_id: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.traceKernel.listCitationCandidates(
        request.params.implementation_project_id,
      );
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createClaimTracePacket = async (
    request: FastifyRequest<{
      Params: { implementation_project_id: string };
      Body: CreateClaimTracePacketRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.createClaimTracePacket(
        request.params.implementation_project_id,
        request.body,
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listClaimTracePackets = async (
    request: ParamsRequest<{ implementation_project_id: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.traceKernel.listClaimTracePackets(
        request.params.implementation_project_id,
      );
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  registerNaturalLanguageFieldRole = async (
    request: FastifyRequest<{
      Params: { implementation_project_id: string };
      Body: RegisterNaturalLanguageFieldRoleRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.registerNaturalLanguageFieldRole(
        request.params.implementation_project_id,
        request.body,
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  evaluateTraceGate = async (
    request: FastifyRequest<{
      Params: { implementation_project_id: string };
      Body: EvaluateTraceGateRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.evaluateTraceGate(
        request.params.implementation_project_id,
        request.body,
      );
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listTraceRepairQueue = async (
    request: ParamsRequest<{ implementation_project_id: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.traceKernel.listTraceRepairQueue(
        request.params.implementation_project_id,
      );
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  resolveTraceRepairQueueItem = async (
    request: FastifyRequest<{
      Params: {
        implementation_project_id: string;
        queue_item_id: string;
      };
      Body: ResolveTraceRepairQueueItemRequest;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.traceKernel.resolveTraceRepairQueueItem(
        request.params.implementation_project_id,
        request.params.queue_item_id,
        request.body,
      );
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };
}
