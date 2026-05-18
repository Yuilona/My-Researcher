import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  ExperimentFoundationExternalTrainingJobStatus,
  ExperimentFoundationRef,
  ExperimentFoundationTrainingAdapterKind,
  ExternalTrainingJob,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AppError } from '../../errors/app-error.js';
import type {
  ExperimentFoundationExecutionRepository,
  ExperimentFoundationExternalTrainingJobListFilter,
  ExperimentFoundationExternalTrainingJobListResult,
} from '../experiment-foundation-execution.repository.js';

type PrismaExternalTrainingJob = Awaited<
  ReturnType<PrismaClient['experimentFoundationExternalTrainingJob']['findFirstOrThrow']>
>;

export class PrismaExperimentFoundationExecutionRepository implements ExperimentFoundationExecutionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createExternalTrainingJob(job: ExternalTrainingJob): Promise<ExternalTrainingJob> {
    try {
      const created = await this.prisma.experimentFoundationExternalTrainingJob.create({
        data: toCreateInput(job),
      });
      return toExternalTrainingJob(created);
    } catch (error) {
      throw mapUniqueConflict(error, `ExternalTrainingJob ${job.external_job_id} already exists.`);
    }
  }

  async updateExternalTrainingJob(job: ExternalTrainingJob): Promise<ExternalTrainingJob> {
    const updated = await this.prisma.experimentFoundationExternalTrainingJob.update({
      where: { externalJobId: job.external_job_id },
      data: toUpdateInput(job),
    });
    return toExternalTrainingJob(updated);
  }

  async findExternalTrainingJobById(externalJobId: string): Promise<ExternalTrainingJob | null> {
    const row = await this.prisma.experimentFoundationExternalTrainingJob.findUnique({
      where: { externalJobId },
    });
    return row ? toExternalTrainingJob(row) : null;
  }

  async findExternalTrainingJobByIdempotencyKey(idempotencyKey: string): Promise<ExternalTrainingJob | null> {
    const row = await this.prisma.experimentFoundationExternalTrainingJob.findUnique({
      where: { idempotencyKey },
    });
    return row ? toExternalTrainingJob(row) : null;
  }

  async listExternalTrainingJobs(
    filter: ExperimentFoundationExternalTrainingJobListFilter,
  ): Promise<ExperimentFoundationExternalTrainingJobListResult> {
    const limit = normalizeLimit(filter.limit);
    const where: Prisma.ExperimentFoundationExternalTrainingJobWhereInput = {
      adapterKind: filter.adapterKind,
      jobStatus: filter.status,
      trainingTaskSpecId: filter.trainingTaskSpecId,
      materializationResultId: filter.materializationResultId,
    };
    const rows = await this.prisma.experimentFoundationExternalTrainingJob.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { externalJobId: 'desc' }],
      take: limit + 1,
      ...(filter.cursor ? { cursor: { externalJobId: filter.cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, limit);
    return {
      jobs: page.map((row) => toExternalTrainingJob(row)),
      nextCursor: rows.length > limit ? page.at(-1)?.externalJobId ?? null : null,
    };
  }
}

function toCreateInput(job: ExternalTrainingJob): Prisma.ExperimentFoundationExternalTrainingJobCreateInput {
  return {
    id: job.external_job_id,
    externalJobId: job.external_job_id,
    trainingTaskSpecId: job.training_task_spec_ref.ref_id,
    trainingTaskSpecHash: job.training_task_spec_hash,
    materializationResultId: job.materialization_result_ref.ref_id,
    materializationResultHash: job.materialization_result_hash,
    adapterKind: job.adapter_kind,
    adapterVersion: job.adapter_version,
    platformKind: job.platform_ref.platform_kind,
    platformId: job.platform_ref.platform_id,
    idempotencyKey: job.idempotency_key,
    externalJobRef: job.external_job_ref as unknown as Prisma.InputJsonValue,
    externalJobHash: job.external_job_hash,
    jobStatus: job.job_status,
    submittedAt: new Date(job.submitted_at),
    lastSyncedAt: job.last_synced_at ? new Date(job.last_synced_at) : null,
    completedAt: job.completed_at ? new Date(job.completed_at) : null,
    stageEventRefs: job.stage_event_refs as unknown as Prisma.InputJsonValue,
    partialResultRefs: job.partial_result_refs as unknown as Prisma.InputJsonValue,
    resultRefs: job.result_refs as unknown as Prisma.InputJsonValue,
    adapterMetadataRefs: job.adapter_metadata_refs as unknown as Prisma.InputJsonValue,
    adapterMetadataHashes: job.adapter_metadata_hashes as unknown as Prisma.InputJsonValue,
    traceabilityRefs: job.traceability_refs as unknown as Prisma.InputJsonValue,
    payload: job as unknown as Prisma.InputJsonValue,
    createdAt: new Date(job.created_at),
    updatedAt: new Date(job.updated_at),
  };
}

function toUpdateInput(job: ExternalTrainingJob): Prisma.ExperimentFoundationExternalTrainingJobUpdateInput {
  return {
    trainingTaskSpecHash: job.training_task_spec_hash,
    materializationResultHash: job.materialization_result_hash,
    adapterKind: job.adapter_kind,
    adapterVersion: job.adapter_version,
    platformKind: job.platform_ref.platform_kind,
    platformId: job.platform_ref.platform_id,
    externalJobRef: job.external_job_ref as unknown as Prisma.InputJsonValue,
    externalJobHash: job.external_job_hash,
    jobStatus: job.job_status,
    submittedAt: new Date(job.submitted_at),
    lastSyncedAt: job.last_synced_at ? new Date(job.last_synced_at) : null,
    completedAt: job.completed_at ? new Date(job.completed_at) : null,
    stageEventRefs: job.stage_event_refs as unknown as Prisma.InputJsonValue,
    partialResultRefs: job.partial_result_refs as unknown as Prisma.InputJsonValue,
    resultRefs: job.result_refs as unknown as Prisma.InputJsonValue,
    adapterMetadataRefs: job.adapter_metadata_refs as unknown as Prisma.InputJsonValue,
    adapterMetadataHashes: job.adapter_metadata_hashes as unknown as Prisma.InputJsonValue,
    traceabilityRefs: job.traceability_refs as unknown as Prisma.InputJsonValue,
    payload: job as unknown as Prisma.InputJsonValue,
    updatedAt: new Date(job.updated_at),
  };
}

function toExternalTrainingJob(row: PrismaExternalTrainingJob): ExternalTrainingJob {
  const payload = isRecord(row.payload) ? row.payload : {};
  return {
    external_job_id: row.externalJobId,
    training_task_spec_ref: readRef(payload.training_task_spec_ref) ?? {
      ref_type: 'training_task_spec',
      ref_id: row.trainingTaskSpecId,
    },
    training_task_spec_hash: row.trainingTaskSpecHash,
    materialization_result_ref: readRef(payload.materialization_result_ref) ?? {
      ref_type: 'training_task_materialization_result',
      ref_id: row.materializationResultId,
    },
    materialization_result_hash: row.materializationResultHash,
    adapter_kind: row.adapterKind as ExperimentFoundationTrainingAdapterKind,
    adapter_version: row.adapterVersion,
    platform_ref: isRecord(payload.platform_ref)
      ? payload.platform_ref as unknown as ExternalTrainingJob['platform_ref']
      : {
          platform_id: row.platformId,
          platform_kind: row.platformKind as ExternalTrainingJob['platform_ref']['platform_kind'],
          adapter_kind: row.adapterKind as ExperimentFoundationTrainingAdapterKind,
          adapter_version: row.adapterVersion,
          capability_refs: [],
        },
    idempotency_key: row.idempotencyKey,
    external_job_ref: readRef(row.externalJobRef) ?? { ref_type: 'external_training_job', ref_id: row.externalJobId },
    external_job_hash: row.externalJobHash,
    job_status: row.jobStatus as ExperimentFoundationExternalTrainingJobStatus,
    submitted_at: row.submittedAt.toISOString(),
    last_synced_at: row.lastSyncedAt?.toISOString() ?? null,
    completed_at: row.completedAt?.toISOString() ?? null,
    stage_event_refs: readRefs(row.stageEventRefs),
    partial_result_refs: readRefs(row.partialResultRefs),
    result_refs: readRefs(row.resultRefs),
    adapter_metadata_refs: readRefs(row.adapterMetadataRefs),
    adapter_metadata_hashes: readStringArray(row.adapterMetadataHashes),
    traceability_refs: readRefs(row.traceabilityRefs),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function readRef(value: unknown): ExperimentFoundationRef | null {
  return isExperimentFoundationRef(value) ? value : null;
}

function readRefs(value: Prisma.JsonValue): ExperimentFoundationRef[] {
  const items: unknown[] = Array.isArray(value) ? value : [];
  return items.filter(isExperimentFoundationRef);
}

function readStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isExperimentFoundationRef(value: unknown): value is ExperimentFoundationRef {
  return Boolean(
    value
      && typeof value === 'object'
      && !Array.isArray(value)
      && typeof (value as { ref_type?: unknown }).ref_type === 'string'
      && typeof (value as { ref_id?: unknown }).ref_id === 'string',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mapUniqueConflict(error: unknown, message: string): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new AppError(409, 'VERSION_CONFLICT', message);
  }
  return error;
}
