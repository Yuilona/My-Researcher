import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationReadinessReportStatus,
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

export type ExperimentFoundationRecordListFilter = {
  recordKind?: ExperimentFoundationRecordKind;
  status?: string;
  family?: string;
  parentRecordId?: string;
  ownerRefId?: string;
  limit?: number;
  cursor?: string;
};

export type ExperimentFoundationRecordListResult = {
  records: ExperimentFoundationStoredRecord[];
  nextCursor: string | null;
};

export type ExperimentFoundationReadinessReportRecord = {
  id: string;
  targetKind: ExperimentFoundationRecordKind;
  targetId: string;
  readinessStatus: ExperimentFoundationReadinessReportStatus;
  readinessHash: string;
  blockers: string[];
  warnings: string[];
  requiredActions: string[];
  sourceRefs: ExperimentFoundationRef[];
  checkedAt: string;
  createdAt: string;
};

export type ExperimentFoundationPromotionPersistenceInput = {
  promotionRequestRecord: ExperimentFoundationStoredRecord;
  promotionResultRecord: ExperimentFoundationStoredRecord;
  candidateRecord: ExperimentFoundationStoredRecord;
};

export type ExperimentFoundationPromotionPersistenceResult = {
  promotionRequestRecord: ExperimentFoundationStoredRecord;
  promotionResultRecord: ExperimentFoundationStoredRecord;
  candidateRecord: ExperimentFoundationStoredRecord;
};

export interface ExperimentFoundationRepository {
  createRecord(record: ExperimentFoundationStoredRecord): Promise<ExperimentFoundationStoredRecord>;
  upsertRecord(record: ExperimentFoundationStoredRecord): Promise<ExperimentFoundationStoredRecord>;
  findRecord(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
  ): Promise<ExperimentFoundationStoredRecord | null>;
  listRecords(filter: ExperimentFoundationRecordListFilter): Promise<ExperimentFoundationRecordListResult>;
  updateRecordStatus(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
    status: string,
    payload?: Record<string, unknown>,
  ): Promise<ExperimentFoundationStoredRecord | null>;
  createReadinessReport(
    report: ExperimentFoundationReadinessReportRecord,
  ): Promise<ExperimentFoundationReadinessReportRecord>;
  findLatestReadinessReport(
    targetKind: ExperimentFoundationRecordKind,
    targetId: string,
  ): Promise<ExperimentFoundationReadinessReportRecord | null>;
  recordPromotionDecision(
    input: ExperimentFoundationPromotionPersistenceInput,
  ): Promise<ExperimentFoundationPromotionPersistenceResult>;
}
