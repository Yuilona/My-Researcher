import type {
  ExperimentFoundationExternalTrainingJobStatus,
  ExperimentFoundationRecordKind,
  ExperimentFoundationTrainingAdapterKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

export type ExperimentFoundationPanelKey =
  | 'overview'
  | 'registry'
  | 'readiness'
  | 'promotion'
  | 'recipes'
  | 'execution';

export type ExperimentFoundationOperationStatus = 'idle' | 'loading' | 'success' | 'error';

export type RecordListFilters = {
  recordKind: ExperimentFoundationRecordKind | '';
  status: string;
  family: string;
  parentRecordId: string;
  ownerRefId: string;
};

export type JobListFilters = {
  adapterKind: ExperimentFoundationTrainingAdapterKind | '';
  status: ExperimentFoundationExternalTrainingJobStatus | '';
  trainingTaskSpecId: string;
  materializationResultId: string;
};

export type JsonObject = Record<string, unknown>;
