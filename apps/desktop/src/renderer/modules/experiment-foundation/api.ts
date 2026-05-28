import type {
  CancelExternalTrainingJobRequest,
  CollectExternalTrainingJobRequest,
  ExperimentFoundationPromotionDecisionRequest,
  ExperimentFoundationPromotionDecisionResponse,
  ExperimentFoundationReadinessCheckRequest,
  ExperimentFoundationReadinessCheckResponse,
  ExperimentFoundationReadinessReportStatus,
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJobResponse,
  ListExperimentFoundationReadinessReportsResponse,
  ListExperimentFoundationRecordsResponse,
  ListExternalTrainingJobsResponse,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { requestGovernance } from '../../literature/shared/api';
import type { JsonObject, JobListFilters, RecordListFilters } from './types';

function appendParam(params: URLSearchParams, key: string, value: string | number | null | undefined): void {
  if (value === null || value === undefined || value === '') {
    return;
  }
  params.set(key, String(value));
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function listExperimentFoundationRecords(
  filters: RecordListFilters,
): Promise<ListExperimentFoundationRecordsResponse> {
  const params = new URLSearchParams();
  appendParam(params, 'record_kind', filters.recordKind);
  appendParam(params, 'status', filters.status.trim());
  appendParam(params, 'family', filters.family.trim());
  appendParam(params, 'parent_record_id', filters.parentRecordId.trim());
  appendParam(params, 'owner_ref_id', filters.ownerRefId.trim());
  appendParam(params, 'limit', 50);
  return requestGovernance<ListExperimentFoundationRecordsResponse>({
    method: 'GET',
    path: withQuery('/experiment-foundation/records', params),
  });
}

export function createExperimentFoundationRecord(
  recordKind: ExperimentFoundationRecordKind,
  payload: JsonObject,
): Promise<ExperimentFoundationStoredRecord> {
  return requestGovernance<ExperimentFoundationStoredRecord>({
    method: 'POST',
    path: '/experiment-foundation/records',
    body: {
      record_kind: recordKind,
      payload,
    },
  });
}

export function upsertExperimentFoundationRecord(
  recordKind: ExperimentFoundationRecordKind,
  recordId: string,
  payload: JsonObject,
): Promise<ExperimentFoundationStoredRecord> {
  return requestGovernance<ExperimentFoundationStoredRecord>({
    method: 'PUT',
    path: `/experiment-foundation/records/${encodeURIComponent(recordKind)}/${encodeURIComponent(recordId)}`,
    body: {
      record_kind: recordKind,
      payload,
    },
  });
}

export function getLatestExperimentFoundationReadiness(
  targetKind: ExperimentFoundationRecordKind,
  targetId: string,
): Promise<ExperimentFoundationReadinessCheckResponse> {
  return requestGovernance<ExperimentFoundationReadinessCheckResponse>({
    method: 'GET',
    path: `/experiment-foundation/readiness/${encodeURIComponent(targetKind)}/${encodeURIComponent(targetId)}/latest`,
  });
}

export function checkExperimentFoundationReadiness(
  body: ExperimentFoundationReadinessCheckRequest,
): Promise<ExperimentFoundationReadinessCheckResponse> {
  return requestGovernance<ExperimentFoundationReadinessCheckResponse>({
    method: 'POST',
    path: '/experiment-foundation/readiness/check',
    body,
  });
}

export type ReadinessReportListFilters = {
  status?: ExperimentFoundationReadinessReportStatus;
  targetKind?: ExperimentFoundationRecordKind;
  limit?: number;
  cursor?: string;
};

export function listExperimentFoundationReadinessReports(
  filters: ReadinessReportListFilters = {},
): Promise<ListExperimentFoundationReadinessReportsResponse> {
  const params = new URLSearchParams();
  appendParam(params, 'status', filters.status);
  appendParam(params, 'target_kind', filters.targetKind);
  appendParam(params, 'limit', filters.limit ?? 50);
  appendParam(params, 'cursor', filters.cursor);
  return requestGovernance<ListExperimentFoundationReadinessReportsResponse>({
    method: 'GET',
    path: withQuery('/experiment-foundation/readiness', params),
  });
}

export function decideExperimentFoundationPromotion(
  candidateId: string,
  body: ExperimentFoundationPromotionDecisionRequest,
): Promise<ExperimentFoundationPromotionDecisionResponse> {
  return requestGovernance<ExperimentFoundationPromotionDecisionResponse>({
    method: 'POST',
    path: `/experiment-foundation/candidates/${encodeURIComponent(candidateId)}/promotion`,
    body,
  });
}

export function listExperimentFoundationJobs(filters: JobListFilters): Promise<ListExternalTrainingJobsResponse> {
  const params = new URLSearchParams();
  appendParam(params, 'adapter_kind', filters.adapterKind);
  appendParam(params, 'status', filters.status);
  appendParam(params, 'training_task_spec_id', filters.trainingTaskSpecId.trim());
  appendParam(params, 'materialization_result_id', filters.materializationResultId.trim());
  appendParam(params, 'limit', 50);
  return requestGovernance<ListExternalTrainingJobsResponse>({
    method: 'GET',
    path: withQuery('/experiment-foundation/execution/jobs', params),
  });
}

export function getExperimentFoundationJob(externalJobId: string): Promise<ExternalTrainingJobResponse> {
  return requestGovernance<ExternalTrainingJobResponse>({
    method: 'GET',
    path: `/experiment-foundation/execution/jobs/${encodeURIComponent(externalJobId)}`,
  });
}

export function submitExperimentFoundationJob(body: SubmitExternalTrainingJobRequest): Promise<ExternalTrainingJobResponse> {
  return requestGovernance<ExternalTrainingJobResponse>({
    method: 'POST',
    path: '/experiment-foundation/execution/jobs/submit',
    body,
  });
}

export function syncExperimentFoundationJob(
  externalJobId: string,
  body: SyncExternalTrainingJobRequest,
): Promise<ExternalTrainingJobResponse> {
  return requestGovernance<ExternalTrainingJobResponse>({
    method: 'POST',
    path: `/experiment-foundation/execution/jobs/${encodeURIComponent(externalJobId)}/sync`,
    body,
  });
}

export function cancelExperimentFoundationJob(
  externalJobId: string,
  body: CancelExternalTrainingJobRequest,
): Promise<ExternalTrainingJobResponse> {
  return requestGovernance<ExternalTrainingJobResponse>({
    method: 'POST',
    path: `/experiment-foundation/execution/jobs/${encodeURIComponent(externalJobId)}/cancel`,
    body,
  });
}

export function collectExperimentFoundationJob(
  externalJobId: string,
  body: CollectExternalTrainingJobRequest,
): Promise<ExternalTrainingJobResponse> {
  return requestGovernance<ExternalTrainingJobResponse>({
    method: 'POST',
    path: `/experiment-foundation/execution/jobs/${encodeURIComponent(externalJobId)}/collect`,
    body,
  });
}
