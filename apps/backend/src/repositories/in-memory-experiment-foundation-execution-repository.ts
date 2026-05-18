import type { ExternalTrainingJob } from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import type {
  ExperimentFoundationExecutionRepository,
  ExperimentFoundationExternalTrainingJobListFilter,
  ExperimentFoundationExternalTrainingJobListResult,
} from './experiment-foundation-execution.repository.js';
import { AppError } from '../errors/app-error.js';

export class InMemoryExperimentFoundationExecutionRepository implements ExperimentFoundationExecutionRepository {
  private readonly jobs = new Map<string, ExternalTrainingJob>();
  private readonly idempotencyIndex = new Map<string, string>();

  async createExternalTrainingJob(job: ExternalTrainingJob): Promise<ExternalTrainingJob> {
    if (this.jobs.has(job.external_job_id)) {
      throw new AppError(409, 'VERSION_CONFLICT', `ExternalTrainingJob ${job.external_job_id} already exists.`);
    }
    if (this.idempotencyIndex.has(job.idempotency_key)) {
      throw new AppError(409, 'VERSION_CONFLICT', `ExternalTrainingJob idempotency key ${job.idempotency_key} already exists.`);
    }
    this.jobs.set(job.external_job_id, cloneJob(job));
    this.idempotencyIndex.set(job.idempotency_key, job.external_job_id);
    return cloneJob(job);
  }

  async updateExternalTrainingJob(job: ExternalTrainingJob): Promise<ExternalTrainingJob> {
    if (!this.jobs.has(job.external_job_id)) {
      throw new AppError(404, 'NOT_FOUND', `ExternalTrainingJob ${job.external_job_id} not found.`);
    }
    this.jobs.set(job.external_job_id, cloneJob(job));
    this.idempotencyIndex.set(job.idempotency_key, job.external_job_id);
    return cloneJob(job);
  }

  async findExternalTrainingJobById(externalJobId: string): Promise<ExternalTrainingJob | null> {
    const job = this.jobs.get(externalJobId);
    return job ? cloneJob(job) : null;
  }

  async findExternalTrainingJobByIdempotencyKey(idempotencyKey: string): Promise<ExternalTrainingJob | null> {
    const externalJobId = this.idempotencyIndex.get(idempotencyKey);
    if (!externalJobId) {
      return null;
    }
    return this.findExternalTrainingJobById(externalJobId);
  }

  async listExternalTrainingJobs(
    filter: ExperimentFoundationExternalTrainingJobListFilter,
  ): Promise<ExperimentFoundationExternalTrainingJobListResult> {
    const limit = normalizeLimit(filter.limit);
    const filtered = [...this.jobs.values()]
      .filter((job) => matchesFilter(job, filter))
      .sort((left, right) => {
        const byUpdated = right.updated_at.localeCompare(left.updated_at);
        return byUpdated || right.external_job_id.localeCompare(left.external_job_id);
      });
    const startIndex = filter.cursor
      ? Math.max(0, filtered.findIndex((job) => job.external_job_id === filter.cursor) + 1)
      : 0;
    const page = filtered.slice(startIndex, startIndex + limit);
    return {
      jobs: page.map((job) => cloneJob(job)),
      nextCursor: startIndex + limit < filtered.length ? page.at(-1)?.external_job_id ?? null : null,
    };
  }
}

function matchesFilter(
  job: ExternalTrainingJob,
  filter: ExperimentFoundationExternalTrainingJobListFilter,
): boolean {
  return (!filter.adapterKind || job.adapter_kind === filter.adapterKind)
    && (!filter.status || job.job_status === filter.status)
    && (!filter.trainingTaskSpecId || job.training_task_spec_ref.ref_id === filter.trainingTaskSpecId)
    && (!filter.materializationResultId || job.materialization_result_ref.ref_id === filter.materializationResultId);
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function cloneJob(job: ExternalTrainingJob): ExternalTrainingJob {
  return structuredClone(job);
}
