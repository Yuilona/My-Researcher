import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AppError } from '../../errors/app-error.js';
import type {
  ExperimentFoundationReadinessReportRecord,
  ExperimentFoundationPromotionPersistenceInput,
  ExperimentFoundationPromotionPersistenceResult,
  ExperimentFoundationRecordListFilter,
  ExperimentFoundationRecordListResult,
  ExperimentFoundationRepository,
} from '../experiment-foundation.repository.js';

type PrismaExperimentFoundationRecord = Awaited<
  ReturnType<PrismaClient['experimentFoundationRecord']['findFirstOrThrow']>
>;
type PrismaExperimentFoundationReadinessReport = Awaited<
  ReturnType<PrismaClient['experimentFoundationReadinessReport']['findFirstOrThrow']>
>;

export class PrismaExperimentFoundationRepository implements ExperimentFoundationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createRecord(record: ExperimentFoundationStoredRecord): Promise<ExperimentFoundationStoredRecord> {
    try {
      const created = await this.prisma.experimentFoundationRecord.create({
        data: toPrismaRecordData(record),
      });
      return toStoredRecord(created);
    } catch (error) {
      throw mapUniqueConflict(error, `${record.record_kind} ${record.record_id} already exists.`);
    }
  }

  async upsertRecord(record: ExperimentFoundationStoredRecord): Promise<ExperimentFoundationStoredRecord> {
    const updated = await this.prisma.experimentFoundationRecord.upsert({
      where: {
        recordKind_recordId: {
          recordKind: record.record_kind,
          recordId: record.record_id,
        },
      },
      create: toPrismaRecordData(record),
      update: {
        recordHash: record.record_hash ?? null,
        status: record.status ?? null,
        family: record.family ?? null,
        parentRecordKind: record.parent_record_kind ?? null,
        parentRecordId: record.parent_record_id ?? null,
        ownerRefType: record.owner_ref_type ?? null,
        ownerRefId: record.owner_ref_id ?? null,
        payload: record.payload as Prisma.InputJsonValue,
        sourceRefs: record.source_refs as unknown as Prisma.InputJsonValue,
        traceabilityRefs: record.traceability_refs as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(record.updated_at),
      },
    });
    return toStoredRecord(updated);
  }

  async findRecord(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
  ): Promise<ExperimentFoundationStoredRecord | null> {
    const row = await this.prisma.experimentFoundationRecord.findUnique({
      where: {
        recordKind_recordId: {
          recordKind,
          recordId,
        },
      },
    });
    return row ? toStoredRecord(row) : null;
  }

  async listRecords(filter: ExperimentFoundationRecordListFilter): Promise<ExperimentFoundationRecordListResult> {
    const limit = normalizeLimit(filter.limit);
    const where: Prisma.ExperimentFoundationRecordWhereInput = {
      recordKind: filter.recordKind,
      status: filter.status,
      family: filter.family,
      parentRecordId: filter.parentRecordId,
      ownerRefId: filter.ownerRefId,
    };
    const rows = await this.prisma.experimentFoundationRecord.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, limit);
    return {
      records: page.map((row) => toStoredRecord(row)),
      nextCursor: rows.length > limit ? page.at(-1)?.id ?? null : null,
    };
  }

  async updateRecordStatus(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
    status: string,
    payload?: Record<string, unknown>,
  ): Promise<ExperimentFoundationStoredRecord | null> {
    const current = await this.findRecord(recordKind, recordId);
    if (!current) {
      return null;
    }
    const updated = await this.prisma.experimentFoundationRecord.update({
      where: {
        recordKind_recordId: {
          recordKind,
          recordId,
        },
      },
      data: {
        status,
        payload: (payload ?? current.payload) as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
    return toStoredRecord(updated);
  }

  async createReadinessReport(
    report: ExperimentFoundationReadinessReportRecord,
  ): Promise<ExperimentFoundationReadinessReportRecord> {
    const created = await this.prisma.experimentFoundationReadinessReport.create({
      data: {
        id: report.id,
        targetKind: report.targetKind,
        targetId: report.targetId,
        readinessStatus: report.readinessStatus,
        readinessHash: report.readinessHash,
        blockers: report.blockers as Prisma.InputJsonValue,
        warnings: report.warnings as Prisma.InputJsonValue,
        requiredActions: report.requiredActions as Prisma.InputJsonValue,
        sourceRefs: report.sourceRefs as unknown as Prisma.InputJsonValue,
        checkedAt: new Date(report.checkedAt),
        createdAt: new Date(report.createdAt),
      },
    });
    return toReadinessReportRecord(created);
  }

  async findLatestReadinessReport(
    targetKind: ExperimentFoundationRecordKind,
    targetId: string,
  ): Promise<ExperimentFoundationReadinessReportRecord | null> {
    const row = await this.prisma.experimentFoundationReadinessReport.findFirst({
      where: {
        targetKind,
        targetId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? toReadinessReportRecord(row) : null;
  }

  async recordPromotionDecision(
    input: ExperimentFoundationPromotionPersistenceInput,
  ): Promise<ExperimentFoundationPromotionPersistenceResult> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const promotionRequestRow = await tx.experimentFoundationRecord.create({
          data: toPrismaRecordData(input.promotionRequestRecord),
        });
        const promotionResultRow = await tx.experimentFoundationRecord.create({
          data: toPrismaRecordData(input.promotionResultRecord),
        });
        const candidateRow = await tx.experimentFoundationRecord.update({
          where: {
            recordKind_recordId: {
              recordKind: input.candidateRecord.record_kind,
              recordId: input.candidateRecord.record_id,
            },
          },
          data: {
            status: input.candidateRecord.status ?? null,
            payload: input.candidateRecord.payload as Prisma.InputJsonValue,
            updatedAt: new Date(input.candidateRecord.updated_at),
          },
        });
        return {
          promotionRequestRecord: toStoredRecord(promotionRequestRow),
          promotionResultRecord: toStoredRecord(promotionResultRow),
          candidateRecord: toStoredRecord(candidateRow),
        };
      });
      return result;
    } catch (error) {
      throw mapUniqueConflict(error, 'Experiment-foundation promotion decision already exists.');
    }
  }
}

function toPrismaRecordData(record: ExperimentFoundationStoredRecord): Prisma.ExperimentFoundationRecordCreateInput {
  return {
    id: record.id,
    recordKind: record.record_kind,
    recordId: record.record_id,
    recordHash: record.record_hash ?? null,
    status: record.status ?? null,
    family: record.family ?? null,
    parentRecordKind: record.parent_record_kind ?? null,
    parentRecordId: record.parent_record_id ?? null,
    ownerRefType: record.owner_ref_type ?? null,
    ownerRefId: record.owner_ref_id ?? null,
    payload: record.payload as Prisma.InputJsonValue,
    sourceRefs: record.source_refs as unknown as Prisma.InputJsonValue,
    traceabilityRefs: record.traceability_refs as unknown as Prisma.InputJsonValue,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

function toStoredRecord(row: PrismaExperimentFoundationRecord): ExperimentFoundationStoredRecord {
  return {
    id: row.id,
    record_kind: row.recordKind as ExperimentFoundationRecordKind,
    record_id: row.recordId,
    record_hash: row.recordHash,
    status: row.status,
    family: row.family,
    parent_record_kind: row.parentRecordKind as ExperimentFoundationRecordKind | null,
    parent_record_id: row.parentRecordId,
    owner_ref_type: row.ownerRefType,
    owner_ref_id: row.ownerRefId,
    payload: isRecord(row.payload) ? row.payload : {},
    source_refs: readRefs(row.sourceRefs),
    traceability_refs: readRefs(row.traceabilityRefs),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function toReadinessReportRecord(
  row: PrismaExperimentFoundationReadinessReport,
): ExperimentFoundationReadinessReportRecord {
  return {
    id: row.id,
    targetKind: row.targetKind as ExperimentFoundationRecordKind,
    targetId: row.targetId,
    readinessStatus: row.readinessStatus as ExperimentFoundationReadinessReportRecord['readinessStatus'],
    readinessHash: row.readinessHash,
    blockers: readStringArray(row.blockers),
    warnings: readStringArray(row.warnings),
    requiredActions: readStringArray(row.requiredActions),
    sourceRefs: readRefs(row.sourceRefs),
    checkedAt: row.checkedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.trunc(limit)));
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
