import type { FastifyInstance } from 'fastify';
import {
  bootstrapImplementationProjectRequestSchema,
  recordImplementationFeedbackEventRequestSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import {
  createCitationCandidateRequestSchema,
  createClaimTracePacketRequestSchema,
  createTraceManifestRequestSchema,
  evaluateTraceGateRequestSchema,
  registerNaturalLanguageFieldRoleRequestSchema,
  resolveTraceRepairQueueItemRequestSchema,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-trace-contracts';

import { PaperImplementationController } from '../controllers/paper-implementation-controller.js';

const stringId = { type: 'string', minLength: 1 } as const;

function paramsSchema(properties: Record<string, unknown>) {
  return {
    params: {
      type: 'object',
      additionalProperties: false,
      required: Object.keys(properties),
      properties,
    },
  };
}

const implementationProjectParams = paramsSchema({ implementation_project_id: stringId });
const paperProjectBridgeParams = paramsSchema({ paper_project_bridge_id: stringId });
const traceManifestParams = paramsSchema({
  implementation_project_id: stringId,
  trace_manifest_id: stringId,
});
const traceRepairQueueItemParams = paramsSchema({
  implementation_project_id: stringId,
  queue_item_id: stringId,
});

export async function registerPaperImplementationRoutes(
  fastify: FastifyInstance,
  controller: PaperImplementationController,
): Promise<void> {
  fastify.post(
    '/paper-implementation/projects/bootstrap',
    { schema: { body: bootstrapImplementationProjectRequestSchema } },
    controller.bootstrapProject,
  );
  fastify.get(
    '/paper-implementation/projects/:implementation_project_id',
    { schema: implementationProjectParams },
    controller.getProject,
  );
  fastify.get(
    '/paper-implementation/projects/by-bridge/:paper_project_bridge_id',
    { schema: paperProjectBridgeParams },
    controller.getProjectByBridge,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/feedback-events',
    {
      schema: {
        ...implementationProjectParams,
        body: recordImplementationFeedbackEventRequestSchema,
      },
    },
    controller.recordFeedbackEvent,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/trace-manifests',
    {
      schema: {
        ...implementationProjectParams,
        body: createTraceManifestRequestSchema,
      },
    },
    controller.createTraceManifest,
  );
  fastify.get(
    '/paper-implementation/projects/:implementation_project_id/trace-manifests',
    { schema: implementationProjectParams },
    controller.listTraceManifests,
  );
  fastify.get(
    '/paper-implementation/projects/:implementation_project_id/trace-manifests/:trace_manifest_id',
    { schema: traceManifestParams },
    controller.getTraceManifest,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/citation-candidates',
    {
      schema: {
        ...implementationProjectParams,
        body: createCitationCandidateRequestSchema,
      },
    },
    controller.createCitationCandidate,
  );
  fastify.get(
    '/paper-implementation/projects/:implementation_project_id/citation-candidates',
    { schema: implementationProjectParams },
    controller.listCitationCandidates,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/claim-trace-packets',
    {
      schema: {
        ...implementationProjectParams,
        body: createClaimTracePacketRequestSchema,
      },
    },
    controller.createClaimTracePacket,
  );
  fastify.get(
    '/paper-implementation/projects/:implementation_project_id/claim-trace-packets',
    { schema: implementationProjectParams },
    controller.listClaimTracePackets,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/natural-language-field-roles',
    {
      schema: {
        ...implementationProjectParams,
        body: registerNaturalLanguageFieldRoleRequestSchema,
      },
    },
    controller.registerNaturalLanguageFieldRole,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/trace-gates/evaluate',
    {
      schema: {
        ...implementationProjectParams,
        body: evaluateTraceGateRequestSchema,
      },
    },
    controller.evaluateTraceGate,
  );
  fastify.get(
    '/paper-implementation/projects/:implementation_project_id/trace-repair-queue',
    { schema: implementationProjectParams },
    controller.listTraceRepairQueue,
  );
  fastify.post(
    '/paper-implementation/projects/:implementation_project_id/trace-repair-queue/:queue_item_id/resolve',
    {
      schema: {
        ...traceRepairQueueItemParams,
        body: resolveTraceRepairQueueItemRequestSchema,
      },
    },
    controller.resolveTraceRepairQueueItem,
  );
}
