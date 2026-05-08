import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  LiteratureContentProcessingBatchItemRecord,
  LiteratureContentProcessingBatchItemStatus,
  LiteratureContentProcessingBatchJobRecord,
  LiteratureFulltextAcquisitionItemRecord,
  LiteratureFulltextAcquisitionItemStatus,
  LiteratureFulltextAcquisitionJobRecord,
  LiteratureSourceRuntimeStateRecord,
} from '../../literature-repository.js';
import {
  toContentProcessingBatchItemRecord,
  toContentProcessingBatchJobRecord,
  toFulltextAcquisitionItemRecord,
  toFulltextAcquisitionJobRecord,
  toSourceRuntimeStateRecord,
} from './prisma-literature-record-mappers.js';

export class PrismaLiteratureBatchStore {
  constructor(private readonly prisma: PrismaClient) {}

  async createContentProcessingBatchJob(
    record: LiteratureContentProcessingBatchJobRecord,
    items: LiteratureContentProcessingBatchItemRecord[],
  ): Promise<LiteratureContentProcessingBatchJobRecord> {
    const created = await this.prisma.$transaction(async (tx) => {
      const job = await tx.literatureContentProcessingBatchJob.create({
        data: {
          id: record.id,
          status: record.status,
          targetStage: record.targetStage,
          workset: record.workset as Prisma.InputJsonValue,
          options: record.options as Prisma.InputJsonValue,
          dryRunEstimate: record.dryRunEstimate as Prisma.InputJsonValue,
          totals: record.totals as Prisma.InputJsonValue,
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
          createdAt: new Date(record.createdAt),
          startedAt: record.startedAt ? new Date(record.startedAt) : null,
          pausedAt: record.pausedAt ? new Date(record.pausedAt) : null,
          canceledAt: record.canceledAt ? new Date(record.canceledAt) : null,
          finishedAt: record.finishedAt ? new Date(record.finishedAt) : null,
          updatedAt: new Date(record.updatedAt),
        },
      });
      if (items.length > 0) {
        await tx.literatureContentProcessingBatchItem.createMany({
          data: items.map((item) => ({
            id: item.id,
            jobId: item.jobId,
            literatureId: item.literatureId,
            status: item.status,
            requestedStages: item.requestedStages,
            nextStageIndex: item.nextStageIndex,
            pipelineRunId: item.pipelineRunId,
            attemptCount: item.attemptCount,
            errorCode: item.errorCode,
            errorMessage: item.errorMessage,
            blockerCode: item.blockerCode,
            retryable: item.retryable,
            checkpoint: item.checkpoint as Prisma.InputJsonValue,
            createdAt: new Date(item.createdAt),
            startedAt: item.startedAt ? new Date(item.startedAt) : null,
            finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
            updatedAt: new Date(item.updatedAt),
          })),
        });
      }
      return job;
    });
    return toContentProcessingBatchJobRecord(created);
  }

  async findContentProcessingBatchJobById(
    jobId: string,
  ): Promise<LiteratureContentProcessingBatchJobRecord | null> {
    const row = await this.prisma.literatureContentProcessingBatchJob.findUnique({
      where: { id: jobId },
    });
    return row ? toContentProcessingBatchJobRecord(row) : null;
  }

  async listContentProcessingBatchJobs(limit?: number): Promise<LiteratureContentProcessingBatchJobRecord[]> {
    const rows = await this.prisma.literatureContentProcessingBatchJob.findMany({
      orderBy: { createdAt: 'desc' },
      ...(typeof limit === 'number' && limit > 0 ? { take: limit } : {}),
    });
    return rows.map((row) => toContentProcessingBatchJobRecord(row));
  }

  async updateContentProcessingBatchJob(
    jobId: string,
    patch: Partial<Omit<LiteratureContentProcessingBatchJobRecord, 'id' | 'createdAt'>>,
  ): Promise<LiteratureContentProcessingBatchJobRecord> {
    const updated = await this.prisma.literatureContentProcessingBatchJob.update({
      where: { id: jobId },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.targetStage !== undefined ? { targetStage: patch.targetStage } : {}),
        ...(patch.workset !== undefined ? { workset: patch.workset as Prisma.InputJsonValue } : {}),
        ...(patch.options !== undefined ? { options: patch.options as Prisma.InputJsonValue } : {}),
        ...(patch.dryRunEstimate !== undefined ? { dryRunEstimate: patch.dryRunEstimate as Prisma.InputJsonValue } : {}),
        ...(patch.totals !== undefined ? { totals: patch.totals as Prisma.InputJsonValue } : {}),
        ...(patch.errorCode !== undefined ? { errorCode: patch.errorCode } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.startedAt !== undefined ? { startedAt: patch.startedAt ? new Date(patch.startedAt) : null } : {}),
        ...(patch.pausedAt !== undefined ? { pausedAt: patch.pausedAt ? new Date(patch.pausedAt) : null } : {}),
        ...(patch.canceledAt !== undefined ? { canceledAt: patch.canceledAt ? new Date(patch.canceledAt) : null } : {}),
        ...(patch.finishedAt !== undefined ? { finishedAt: patch.finishedAt ? new Date(patch.finishedAt) : null } : {}),
        ...(patch.updatedAt !== undefined ? { updatedAt: new Date(patch.updatedAt) } : {}),
      },
    });
    return toContentProcessingBatchJobRecord(updated);
  }

  async deleteContentProcessingBatchJob(jobId: string): Promise<void> {
    await this.prisma.literatureContentProcessingBatchJob.delete({
      where: { id: jobId },
    });
  }

  async listContentProcessingBatchItemsByJobId(jobId: string): Promise<LiteratureContentProcessingBatchItemRecord[]> {
    const rows = await this.prisma.literatureContentProcessingBatchItem.findMany({
      where: { jobId },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });
    return rows.map((row) => toContentProcessingBatchItemRecord(row));
  }

  async listContentProcessingBatchItemsByJobIdAndStatuses(
    jobId: string,
    statuses: LiteratureContentProcessingBatchItemStatus[],
    limit?: number,
  ): Promise<LiteratureContentProcessingBatchItemRecord[]> {
    if (statuses.length === 0) {
      return [];
    }
    const rows = await this.prisma.literatureContentProcessingBatchItem.findMany({
      where: {
        jobId,
        status: {
          in: statuses,
        },
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      ...(typeof limit === 'number' && limit > 0 ? { take: limit } : {}),
    });
    return rows.map((row) => toContentProcessingBatchItemRecord(row));
  }

  async updateContentProcessingBatchItem(
    itemId: string,
    patch: Partial<Omit<LiteratureContentProcessingBatchItemRecord, 'id' | 'jobId' | 'literatureId' | 'createdAt'>>,
  ): Promise<LiteratureContentProcessingBatchItemRecord> {
    const updated = await this.prisma.literatureContentProcessingBatchItem.update({
      where: { id: itemId },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.requestedStages !== undefined ? { requestedStages: patch.requestedStages } : {}),
        ...(patch.nextStageIndex !== undefined ? { nextStageIndex: patch.nextStageIndex } : {}),
        ...(patch.pipelineRunId !== undefined ? { pipelineRunId: patch.pipelineRunId } : {}),
        ...(patch.attemptCount !== undefined ? { attemptCount: patch.attemptCount } : {}),
        ...(patch.errorCode !== undefined ? { errorCode: patch.errorCode } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.blockerCode !== undefined ? { blockerCode: patch.blockerCode } : {}),
        ...(patch.retryable !== undefined ? { retryable: patch.retryable } : {}),
        ...(patch.checkpoint !== undefined ? { checkpoint: patch.checkpoint as Prisma.InputJsonValue } : {}),
        ...(patch.startedAt !== undefined ? { startedAt: patch.startedAt ? new Date(patch.startedAt) : null } : {}),
        ...(patch.finishedAt !== undefined ? { finishedAt: patch.finishedAt ? new Date(patch.finishedAt) : null } : {}),
        ...(patch.updatedAt !== undefined ? { updatedAt: new Date(patch.updatedAt) } : {}),
      },
    });
    return toContentProcessingBatchItemRecord(updated);
  }

  async createFulltextAcquisitionJob(
    record: LiteratureFulltextAcquisitionJobRecord,
    items: LiteratureFulltextAcquisitionItemRecord[],
  ): Promise<LiteratureFulltextAcquisitionJobRecord> {
    const created = await this.prisma.$transaction(async (tx) => {
      const job = await tx.literatureFulltextAcquisitionJob.create({
        data: {
          id: record.id,
          status: record.status,
          workset: record.workset as Prisma.InputJsonValue,
          options: record.options as Prisma.InputJsonValue,
          dryRunEstimate: record.dryRunEstimate as Prisma.InputJsonValue,
          totals: record.totals as Prisma.InputJsonValue,
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
          createdAt: new Date(record.createdAt),
          startedAt: record.startedAt ? new Date(record.startedAt) : null,
          pausedAt: record.pausedAt ? new Date(record.pausedAt) : null,
          canceledAt: record.canceledAt ? new Date(record.canceledAt) : null,
          finishedAt: record.finishedAt ? new Date(record.finishedAt) : null,
          updatedAt: new Date(record.updatedAt),
        },
      });
      if (items.length > 0) {
        await tx.literatureFulltextAcquisitionItem.createMany({
          data: items.map((item) => ({
            id: item.id,
            jobId: item.jobId,
            literatureId: item.literatureId,
            status: item.status,
            selectedSourceKind: item.selectedSourceKind,
            sourceUrl: item.sourceUrl,
            finalUrl: item.finalUrl,
            contentAssetId: item.contentAssetId,
            attemptCount: item.attemptCount,
            errorCode: item.errorCode,
            errorMessage: item.errorMessage,
            blockerCode: item.blockerCode,
            retryable: item.retryable,
            resolutionCandidates: item.resolutionCandidates as Prisma.InputJsonValue,
            checkpoint: item.checkpoint as Prisma.InputJsonValue,
            createdAt: new Date(item.createdAt),
            startedAt: item.startedAt ? new Date(item.startedAt) : null,
            finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
            updatedAt: new Date(item.updatedAt),
          })),
        });
      }
      return job;
    });
    return toFulltextAcquisitionJobRecord(created);
  }

  async findFulltextAcquisitionJobById(jobId: string): Promise<LiteratureFulltextAcquisitionJobRecord | null> {
    const row = await this.prisma.literatureFulltextAcquisitionJob.findUnique({
      where: { id: jobId },
    });
    return row ? toFulltextAcquisitionJobRecord(row) : null;
  }

  async listFulltextAcquisitionJobs(limit?: number): Promise<LiteratureFulltextAcquisitionJobRecord[]> {
    const rows = await this.prisma.literatureFulltextAcquisitionJob.findMany({
      orderBy: { createdAt: 'desc' },
      ...(typeof limit === 'number' && limit > 0 ? { take: limit } : {}),
    });
    return rows.map((row) => toFulltextAcquisitionJobRecord(row));
  }

  async updateFulltextAcquisitionJob(
    jobId: string,
    patch: Partial<Omit<LiteratureFulltextAcquisitionJobRecord, 'id' | 'createdAt'>>,
  ): Promise<LiteratureFulltextAcquisitionJobRecord> {
    const updated = await this.prisma.literatureFulltextAcquisitionJob.update({
      where: { id: jobId },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.workset !== undefined ? { workset: patch.workset as Prisma.InputJsonValue } : {}),
        ...(patch.options !== undefined ? { options: patch.options as Prisma.InputJsonValue } : {}),
        ...(patch.dryRunEstimate !== undefined ? { dryRunEstimate: patch.dryRunEstimate as Prisma.InputJsonValue } : {}),
        ...(patch.totals !== undefined ? { totals: patch.totals as Prisma.InputJsonValue } : {}),
        ...(patch.errorCode !== undefined ? { errorCode: patch.errorCode } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.startedAt !== undefined ? { startedAt: patch.startedAt ? new Date(patch.startedAt) : null } : {}),
        ...(patch.pausedAt !== undefined ? { pausedAt: patch.pausedAt ? new Date(patch.pausedAt) : null } : {}),
        ...(patch.canceledAt !== undefined ? { canceledAt: patch.canceledAt ? new Date(patch.canceledAt) : null } : {}),
        ...(patch.finishedAt !== undefined ? { finishedAt: patch.finishedAt ? new Date(patch.finishedAt) : null } : {}),
        ...(patch.updatedAt !== undefined ? { updatedAt: new Date(patch.updatedAt) } : {}),
      },
    });
    return toFulltextAcquisitionJobRecord(updated);
  }

  async deleteFulltextAcquisitionJob(jobId: string): Promise<void> {
    await this.prisma.literatureFulltextAcquisitionJob.delete({
      where: { id: jobId },
    });
  }

  async listFulltextAcquisitionItemsByJobId(jobId: string): Promise<LiteratureFulltextAcquisitionItemRecord[]> {
    const rows = await this.prisma.literatureFulltextAcquisitionItem.findMany({
      where: { jobId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => toFulltextAcquisitionItemRecord(row));
  }

  async listFulltextAcquisitionItemsByJobIdAndStatuses(
    jobId: string,
    statuses: LiteratureFulltextAcquisitionItemStatus[],
    limit?: number,
  ): Promise<LiteratureFulltextAcquisitionItemRecord[]> {
    if (statuses.length === 0) {
      return [];
    }
    const rows = await this.prisma.literatureFulltextAcquisitionItem.findMany({
      where: {
        jobId,
        status: { in: statuses },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      ...(typeof limit === 'number' && limit > 0 ? { take: limit } : {}),
    });
    return rows.map((row) => toFulltextAcquisitionItemRecord(row));
  }

  async updateFulltextAcquisitionItem(
    itemId: string,
    patch: Partial<Omit<LiteratureFulltextAcquisitionItemRecord, 'id' | 'jobId' | 'literatureId' | 'createdAt'>>,
  ): Promise<LiteratureFulltextAcquisitionItemRecord> {
    const updated = await this.prisma.literatureFulltextAcquisitionItem.update({
      where: { id: itemId },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.selectedSourceKind !== undefined ? { selectedSourceKind: patch.selectedSourceKind } : {}),
        ...(patch.sourceUrl !== undefined ? { sourceUrl: patch.sourceUrl } : {}),
        ...(patch.finalUrl !== undefined ? { finalUrl: patch.finalUrl } : {}),
        ...(patch.contentAssetId !== undefined ? { contentAssetId: patch.contentAssetId } : {}),
        ...(patch.attemptCount !== undefined ? { attemptCount: patch.attemptCount } : {}),
        ...(patch.errorCode !== undefined ? { errorCode: patch.errorCode } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.blockerCode !== undefined ? { blockerCode: patch.blockerCode } : {}),
        ...(patch.retryable !== undefined ? { retryable: patch.retryable } : {}),
        ...(patch.resolutionCandidates !== undefined ? { resolutionCandidates: patch.resolutionCandidates as Prisma.InputJsonValue } : {}),
        ...(patch.checkpoint !== undefined ? { checkpoint: patch.checkpoint as Prisma.InputJsonValue } : {}),
        ...(patch.startedAt !== undefined ? { startedAt: patch.startedAt ? new Date(patch.startedAt) : null } : {}),
        ...(patch.finishedAt !== undefined ? { finishedAt: patch.finishedAt ? new Date(patch.finishedAt) : null } : {}),
        ...(patch.updatedAt !== undefined ? { updatedAt: new Date(patch.updatedAt) } : {}),
      },
    });
    return toFulltextAcquisitionItemRecord(updated);
  }

  async upsertSourceRuntimeState(
    record: LiteratureSourceRuntimeStateRecord,
  ): Promise<{ record: LiteratureSourceRuntimeStateRecord; created: boolean }> {
    const existing = await this.prisma.literatureSourceRuntimeState.findUnique({
      where: { source: record.source },
    });
    const data = {
      id: record.id,
      source: record.source,
      status: record.status,
      cooldownUntil: record.cooldownUntil ? new Date(record.cooldownUntil) : null,
      failureCount: record.failureCount,
      lastErrorCode: record.lastErrorCode,
      lastErrorMessage: record.lastErrorMessage,
      lastRequestAt: record.lastRequestAt ? new Date(record.lastRequestAt) : null,
      lastSuccessAt: record.lastSuccessAt ? new Date(record.lastSuccessAt) : null,
      lastFailureAt: record.lastFailureAt ? new Date(record.lastFailureAt) : null,
      metadata: record.metadata as Prisma.InputJsonValue,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
    const row = existing
      ? await this.prisma.literatureSourceRuntimeState.update({
          where: { source: record.source },
          data: {
            status: data.status,
            cooldownUntil: data.cooldownUntil,
            failureCount: data.failureCount,
            lastErrorCode: data.lastErrorCode,
            lastErrorMessage: data.lastErrorMessage,
            lastRequestAt: data.lastRequestAt,
            lastSuccessAt: data.lastSuccessAt,
            lastFailureAt: data.lastFailureAt,
            metadata: data.metadata,
            updatedAt: data.updatedAt,
          },
        })
      : await this.prisma.literatureSourceRuntimeState.create({ data });
    return { record: toSourceRuntimeStateRecord(row), created: !existing };
  }

  async findSourceRuntimeState(source: string): Promise<LiteratureSourceRuntimeStateRecord | null> {
    const row = await this.prisma.literatureSourceRuntimeState.findUnique({
      where: { source },
    });
    return row ? toSourceRuntimeStateRecord(row) : null;
  }

  async listSourceRuntimeStates(): Promise<LiteratureSourceRuntimeStateRecord[]> {
    const rows = await this.prisma.literatureSourceRuntimeState.findMany({
      orderBy: { source: 'asc' },
    });
    return rows.map((row) => toSourceRuntimeStateRecord(row));
  }
}
