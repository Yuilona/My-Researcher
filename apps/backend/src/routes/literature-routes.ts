import {
  createLiteratureContentProcessingRunRequestSchema,
  downloadLiteratureContentAssetRequestSchema,
  importLiteratureKeyContentDossierRequestSchema,
  literatureClusterCandidateGenerationRequestSchema,
  listLiteratureContentProcessingRunsQuerySchema,
  listLiteratureClustersQuerySchema,
  literatureOverviewQuerySchema,
  literatureRetrieveRequestSchema,
  literatureCollectionImportRequestSchema,
  registerLiteratureContentAssetRequestSchema,
  syncPaperLiteratureFromTopicRequestSchema,
  updateLiteratureClusterRequestSchema,
  updateLiteratureMetadataRequestSchema,
  updatePaperLiteratureLinkRequestSchema,
  updateTopicLiteratureEvidenceActivationRequestSchema,
  upsertTopicLiteratureScopeRequestSchema,
  zoteroImportRequestSchema,
  type LiteratureOverviewQuery,
  type LiteratureClusterCandidateGenerationRequest,
  type LiteratureCollectionImportRequest,
  type LiteratureRetrieveRequest,
  type ListLiteratureClustersQuery,
  type ListLiteratureContentProcessingRunsQuery,
  type CreateLiteratureContentProcessingRunRequest,
  type DownloadLiteratureContentAssetRequest,
  type ImportLiteratureKeyContentDossierRequest,
  type RegisterLiteratureContentAssetRequest,
  type SyncPaperLiteratureFromTopicRequest,
  type UpdateLiteratureClusterRequest,
  type UpdateLiteratureMetadataRequest,
  type UpdatePaperLiteratureLinkRequest,
  type UpdateTopicLiteratureEvidenceActivationRequest,
  type UpsertTopicLiteratureScopeRequest,
  type ZoteroImportRequest,
  type ZoteroPreviewRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/literature-contracts';
import type { FastifyInstance } from 'fastify';
import { LiteratureController } from '../controllers/literature-controller.js';

const topicParamsSchema = {
  type: 'object',
  required: ['topicId'],
  properties: {
    topicId: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const paperParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const paperLinkParamsSchema = {
  type: 'object',
  required: ['id', 'linkId'],
  properties: {
    id: { type: 'string', minLength: 1 },
    linkId: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const literatureParamsSchema = {
  type: 'object',
  required: ['literatureId'],
  properties: {
    literatureId: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const literatureClusterParamsSchema = {
  type: 'object',
  required: ['clusterId'],
  properties: {
    clusterId: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export async function registerLiteratureRoutes(
  app: FastifyInstance,
  controller: LiteratureController,
): Promise<void> {
  app.post<{ Body: LiteratureCollectionImportRequest }>(
    '/literature/collections/import',
    {
      schema: {
        body: literatureCollectionImportRequestSchema,
      },
    },
    async (request, reply) => controller.collectionImport(request, reply),
  );

  app.post<{ Body: ZoteroImportRequest }>(
    '/literature/collections/zotero-import',
    {
      schema: {
        body: zoteroImportRequestSchema,
      },
    },
    async (request, reply) => controller.zoteroCollectionImport(request, reply),
  );

  app.post<{ Body: ZoteroPreviewRequest }>(
    '/literature/collections/zotero-preview',
    {
      schema: {
        body: zoteroImportRequestSchema,
      },
    },
    async (request, reply) => controller.zoteroCollectionPreview(request, reply),
  );

  app.get<{ Querystring: LiteratureOverviewQuery }>(
    '/literature/overview',
    {
      schema: {
        querystring: literatureOverviewQuerySchema,
      },
    },
    async (request, reply) => controller.getOverview(request, reply),
  );

  app.post<{ Body: LiteratureRetrieveRequest }>(
    '/literature/retrieve',
    {
      schema: {
        body: literatureRetrieveRequestSchema,
      },
    },
    async (request, reply) => controller.retrieve(request, reply),
  );

  app.post<{ Body: LiteratureClusterCandidateGenerationRequest }>(
    '/literature/clusters/candidates',
    {
      schema: {
        body: literatureClusterCandidateGenerationRequestSchema,
      },
    },
    async (request, reply) => controller.generateClusterCandidates(request, reply),
  );

  app.get<{ Querystring: ListLiteratureClustersQuery }>(
    '/literature/clusters',
    {
      schema: {
        querystring: listLiteratureClustersQuerySchema,
      },
    },
    async (request, reply) => controller.listClusters(request, reply),
  );

  app.patch<{ Params: { clusterId: string }; Body: UpdateLiteratureClusterRequest }>(
    '/literature/clusters/:clusterId',
    {
      schema: {
        params: literatureClusterParamsSchema,
        body: updateLiteratureClusterRequestSchema,
      },
    },
    async (request, reply) => controller.updateCluster(request, reply),
  );

  app.get<{ Params: { topicId: string } }>(
    '/topics/:topicId/literature-scope',
    {
      schema: {
        params: topicParamsSchema,
      },
    },
    async (request, reply) => controller.getTopicScope(request, reply),
  );

  app.post<{ Params: { topicId: string }; Body: UpsertTopicLiteratureScopeRequest }>(
    '/topics/:topicId/literature-scope',
    {
      schema: {
        params: topicParamsSchema,
        body: upsertTopicLiteratureScopeRequestSchema,
      },
    },
    async (request, reply) => controller.upsertTopicScope(request, reply),
  );

  app.patch<{ Params: { topicId: string }; Body: UpdateTopicLiteratureEvidenceActivationRequest }>(
    '/topics/:topicId/literature-activation',
    {
      schema: {
        params: topicParamsSchema,
        body: updateTopicLiteratureEvidenceActivationRequestSchema,
      },
    },
    async (request, reply) => controller.updateTopicEvidenceActivation(request, reply),
  );

  app.post<{ Params: { id: string }; Body: SyncPaperLiteratureFromTopicRequest }>(
    '/paper-projects/:id/literature-links/from-topic',
    {
      schema: {
        params: paperParamsSchema,
        body: syncPaperLiteratureFromTopicRequestSchema,
      },
    },
    async (request, reply) => controller.syncPaperFromTopic(request, reply),
  );

  app.get<{ Params: { id: string } }>(
    '/paper-projects/:id/literature',
    {
      schema: {
        params: paperParamsSchema,
      },
    },
    async (request, reply) => controller.getPaperLiterature(request, reply),
  );

  app.patch<{ Params: { id: string; linkId: string }; Body: UpdatePaperLiteratureLinkRequest }>(
    '/paper-projects/:id/literature-links/:linkId',
    {
      schema: {
        params: paperLinkParamsSchema,
        body: updatePaperLiteratureLinkRequestSchema,
      },
    },
    async (request, reply) => controller.updatePaperLiteratureLink(request, reply),
  );

  app.patch<{ Params: { literatureId: string }; Body: UpdateLiteratureMetadataRequest }>(
    '/literature/:literatureId/metadata',
    {
      schema: {
        params: literatureParamsSchema,
        body: updateLiteratureMetadataRequestSchema,
      },
    },
    async (request, reply) => controller.updateLiteratureMetadata(request, reply),
  );

  app.get<{ Params: { literatureId: string } }>(
    '/literature/:literatureId/metadata',
    {
      schema: {
        params: literatureParamsSchema,
      },
    },
    async (request, reply) => controller.getLiteratureMetadata(request, reply),
  );

  app.post<{ Params: { literatureId: string }; Body: RegisterLiteratureContentAssetRequest }>(
    '/literature/:literatureId/content-assets',
    {
      schema: {
        params: literatureParamsSchema,
        body: registerLiteratureContentAssetRequestSchema,
      },
    },
    async (request, reply) => controller.registerContentAsset(request, reply),
  );

  app.post<{ Params: { literatureId: string }; Body: DownloadLiteratureContentAssetRequest }>(
    '/literature/:literatureId/content-assets/download',
    {
      schema: {
        params: literatureParamsSchema,
        body: downloadLiteratureContentAssetRequestSchema,
      },
    },
    async (request, reply) => controller.downloadContentAsset(request, reply),
  );

  app.get<{ Params: { literatureId: string } }>(
    '/literature/:literatureId/content-assets',
    {
      schema: {
        params: literatureParamsSchema,
      },
    },
    async (request, reply) => controller.listContentAssets(request, reply),
  );

  app.get<{ Params: { literatureId: string } }>(
    '/literature/:literatureId/content-processing',
    {
      schema: {
        params: literatureParamsSchema,
      },
    },
    async (request, reply) => controller.getContentProcessing(request, reply),
  );

  app.get<{ Params: { literatureId: string } }>(
    '/literature/:literatureId/content-processing/key-content-curation-bundle',
    {
      schema: {
        params: literatureParamsSchema,
      },
    },
    async (request, reply) => controller.getKeyContentCurationBundle(request, reply),
  );

  app.post<{ Params: { literatureId: string }; Body: ImportLiteratureKeyContentDossierRequest }>(
    '/literature/:literatureId/content-processing/key-content-dossier/dry-run',
    {
      schema: {
        params: literatureParamsSchema,
        body: importLiteratureKeyContentDossierRequestSchema,
      },
    },
    async (request, reply) => controller.dryRunImportKeyContentDossier(request, reply),
  );

  app.post<{ Params: { literatureId: string }; Body: ImportLiteratureKeyContentDossierRequest }>(
    '/literature/:literatureId/content-processing/key-content-dossier',
    {
      schema: {
        params: literatureParamsSchema,
        body: importLiteratureKeyContentDossierRequestSchema,
      },
    },
    async (request, reply) => controller.importKeyContentDossier(request, reply),
  );

  app.post<{ Params: { literatureId: string }; Body: CreateLiteratureContentProcessingRunRequest }>(
    '/literature/:literatureId/content-processing/runs',
    {
      schema: {
        params: literatureParamsSchema,
        body: createLiteratureContentProcessingRunRequestSchema,
      },
    },
    async (request, reply) => controller.createContentProcessingRun(request, reply),
  );

  app.get<{ Params: { literatureId: string }; Querystring: ListLiteratureContentProcessingRunsQuery }>(
    '/literature/:literatureId/content-processing/runs',
    {
      schema: {
        params: literatureParamsSchema,
        querystring: listLiteratureContentProcessingRunsQuerySchema,
      },
    },
    async (request, reply) => controller.listContentProcessingRuns(request, reply),
  );
}
