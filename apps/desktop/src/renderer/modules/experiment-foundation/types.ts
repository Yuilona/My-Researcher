import type {
  ExperimentFoundationExternalTrainingJobStatus,
  ExperimentFoundationRecordKind,
  ExperimentFoundationTrainingAdapterKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

export type ExperimentFoundationPanelKey =
  | 'overview'
  | 'assets'
  | 'flow'
  | 'promotion';

export type ExperimentFoundationOperationStatus = 'idle' | 'loading' | 'success' | 'error';

export type RecordListFilters = {
  recordKind: ExperimentFoundationRecordKind | '';
  status: string;
  family: string;
  parentRecordId: string;
  ownerRefId: string;
  // Optional pagination knobs. When omitted, the API client falls back to a
  // sensible default. Cursor is the opaque string returned by the previous
  // page's `next_cursor`.
  limit?: number;
  cursor?: string;
};

export type JobListFilters = {
  adapterKind: ExperimentFoundationTrainingAdapterKind | '';
  status: ExperimentFoundationExternalTrainingJobStatus | '';
  trainingTaskSpecId: string;
  materializationResultId: string;
};

export type JsonObject = Record<string, unknown>;
