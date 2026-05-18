import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import type {
  ExperimentFoundationReadinessReportRecord,
  ExperimentFoundationPromotionPersistenceInput,
  ExperimentFoundationPromotionPersistenceResult,
  ExperimentFoundationRecordListFilter,
  ExperimentFoundationRecordListResult,
  ExperimentFoundationRepository,
} from './experiment-foundation.repository.js';

export class InMemoryExperimentFoundationRepository implements ExperimentFoundationRepository {
  private readonly records = new Map<string, ExperimentFoundationStoredRecord>();
  private readonly readinessReports: ExperimentFoundationReadinessReportRecord[] = [];

  async createRecord(record: ExperimentFoundationStoredRecord): Promise<ExperimentFoundationStoredRecord> {
    const key = recordKey(record.record_kind, record.record_id);
    if (this.records.has(key)) {
      throw new Error(`ExperimentFoundationRecord ${key} already exists.`);
    }
    this.records.set(key, cloneRecord(record));
    return cloneRecord(record);
  }

  async upsertRecord(record: ExperimentFoundationStoredRecord): Promise<ExperimentFoundationStoredRecord> {
    const key = recordKey(record.record_kind, record.record_id);
    this.records.set(key, cloneRecord(record));
    return cloneRecord(record);
  }

  async findRecord(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
  ): Promise<ExperimentFoundationStoredRecord | null> {
    const record = this.records.get(recordKey(recordKind, recordId));
    return record ? cloneRecord(record) : null;
  }

  async listRecords(filter: ExperimentFoundationRecordListFilter): Promise<ExperimentFoundationRecordListResult> {
    const limit = normalizeLimit(filter.limit);
    const filtered = [...this.records.values()]
      .filter((record) => matchesRecordFilter(record, filter))
      .sort((left, right) => {
        const byUpdatedAt = right.updated_at.localeCompare(left.updated_at);
        return byUpdatedAt || right.id.localeCompare(left.id);
      });
    const startIndex = filter.cursor
      ? Math.max(0, filtered.findIndex((record) => record.id === filter.cursor) + 1)
      : 0;
    const page = filtered.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < filtered.length ? page.at(-1)?.id ?? null : null;
    return {
      records: page.map((record) => cloneRecord(record)),
      nextCursor,
    };
  }

  async updateRecordStatus(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
    status: string,
    payload?: Record<string, unknown>,
  ): Promise<ExperimentFoundationStoredRecord | null> {
    const key = recordKey(recordKind, recordId);
    const current = this.records.get(key);
    if (!current) {
      return null;
    }
    const updated = {
      ...current,
      status,
      payload: payload ?? current.payload,
      updated_at: new Date().toISOString(),
    };
    this.records.set(key, cloneRecord(updated));
    return cloneRecord(updated);
  }

  async createReadinessReport(
    report: ExperimentFoundationReadinessReportRecord,
  ): Promise<ExperimentFoundationReadinessReportRecord> {
    const cloned = cloneReadinessReport(report);
    this.readinessReports.push(cloned);
    return cloneReadinessReport(cloned);
  }

  async findLatestReadinessReport(
    targetKind: ExperimentFoundationRecordKind,
    targetId: string,
  ): Promise<ExperimentFoundationReadinessReportRecord | null> {
    const reports = this.readinessReports
      .filter((report) => report.targetKind === targetKind && report.targetId === targetId)
      .sort((left, right) => {
        const byCreatedAt = right.createdAt.localeCompare(left.createdAt);
        return byCreatedAt || right.id.localeCompare(left.id);
      });
    return reports[0] ? cloneReadinessReport(reports[0]) : null;
  }

  async recordPromotionDecision(
    input: ExperimentFoundationPromotionPersistenceInput,
  ): Promise<ExperimentFoundationPromotionPersistenceResult> {
    const recordsSnapshot = new Map(this.records);
    const reportsSnapshot = [...this.readinessReports];
    try {
      const promotionRequestRecord = await this.createRecord(input.promotionRequestRecord);
      const promotionResultRecord = await this.createRecord(input.promotionResultRecord);
      const candidateRecord = await this.upsertRecord(input.candidateRecord);
      return {
        promotionRequestRecord,
        promotionResultRecord,
        candidateRecord,
      };
    } catch (error) {
      this.records.clear();
      for (const [key, value] of recordsSnapshot) {
        this.records.set(key, value);
      }
      this.readinessReports.splice(0, this.readinessReports.length, ...reportsSnapshot);
      throw error;
    }
  }
}

function recordKey(recordKind: ExperimentFoundationRecordKind, recordId: string): string {
  return `${recordKind}:${recordId}`;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function matchesRecordFilter(
  record: ExperimentFoundationStoredRecord,
  filter: ExperimentFoundationRecordListFilter,
): boolean {
  return (!filter.recordKind || record.record_kind === filter.recordKind)
    && (!filter.status || record.status === filter.status)
    && (!filter.family || record.family === filter.family)
    && (!filter.parentRecordId || record.parent_record_id === filter.parentRecordId)
    && (!filter.ownerRefId || record.owner_ref_id === filter.ownerRefId);
}

function cloneRecord(record: ExperimentFoundationStoredRecord): ExperimentFoundationStoredRecord {
  return structuredClone(record);
}

function cloneReadinessReport(
  report: ExperimentFoundationReadinessReportRecord,
): ExperimentFoundationReadinessReportRecord {
  return structuredClone(report);
}
