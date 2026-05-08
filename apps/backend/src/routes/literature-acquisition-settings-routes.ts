import {
  updateLiteratureAcquisitionSettingsRequestSchema,
  type UpdateLiteratureAcquisitionSettingsRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/literature-contracts';
import type { FastifyInstance } from 'fastify';
import { LiteratureAcquisitionSettingsController } from '../controllers/literature-acquisition-settings-controller.js';

export async function registerLiteratureAcquisitionSettingsRoutes(
  app: FastifyInstance,
  controller: LiteratureAcquisitionSettingsController,
): Promise<void> {
  app.get('/settings/literature-acquisition', async (request, reply) =>
    controller.getSettings(request, reply),
  );

  app.patch<{ Body: UpdateLiteratureAcquisitionSettingsRequest }>(
    '/settings/literature-acquisition',
    {
      schema: {
        body: updateLiteratureAcquisitionSettingsRequestSchema,
      },
    },
    async (request, reply) => controller.updateSettings(request, reply),
  );
}
