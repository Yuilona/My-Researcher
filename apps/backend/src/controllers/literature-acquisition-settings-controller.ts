import type {
  LiteratureAcquisitionSettingsDTO,
  UpdateLiteratureAcquisitionSettingsRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/literature-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { LiteratureAcquisitionSettingsService } from '../services/literature-acquisition-settings-service.js';

export class LiteratureAcquisitionSettingsController {
  constructor(private readonly service: LiteratureAcquisitionSettingsService) {}

  async getSettings(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const result = await this.service.getSettings();
      reply.status(200).send(result satisfies LiteratureAcquisitionSettingsDTO);
    } catch (error) {
      this.handleError(reply, error);
    }
  }

  async updateSettings(
    request: FastifyRequest<{ Body: UpdateLiteratureAcquisitionSettingsRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await this.service.updateSettings(request.body ?? {});
      reply.status(200).send(result satisfies LiteratureAcquisitionSettingsDTO);
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
