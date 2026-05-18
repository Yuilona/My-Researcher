import type {
  ExperimentFoundationExternalTrainingJobStatus,
  ExperimentFoundationTrainingAdapterKind,
  ExternalTrainingJob,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

export type ExperimentFoundationExternalTrainingJobListFilter = {
  adapterKind?: ExperimentFoundationTrainingAdapterKind;
  status?: ExperimentFoundationExternalTrainingJobStatus;
  trainingTaskSpecId?: string;
  materializationResultId?: string;
  limit?: number;
  cursor?: string;
};

export type ExperimentFoundationExternalTrainingJobListResult = {
  jobs: ExternalTrainingJob[];
  nextCursor: string | null;
};

export interface ExperimentFoundationExecutionRepository {
  createExternalTrainingJob(job: ExternalTrainingJob): Promise<ExternalTrainingJob>;
  updateExternalTrainingJob(job: ExternalTrainingJob): Promise<ExternalTrainingJob>;
  findExternalTrainingJobById(externalJobId: string): Promise<ExternalTrainingJob | null>;
  findExternalTrainingJobByIdempotencyKey(idempotencyKey: string): Promise<ExternalTrainingJob | null>;
  listExternalTrainingJobs(
    filter: ExperimentFoundationExternalTrainingJobListFilter,
  ): Promise<ExperimentFoundationExternalTrainingJobListResult>;
}
