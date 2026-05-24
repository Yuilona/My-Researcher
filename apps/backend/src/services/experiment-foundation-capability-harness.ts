import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import type {
  CollectExternalTrainingJobRequest,
  CreateExperimentFoundationRecordRequest,
  ExperimentFoundationPromotionDecisionRequest,
  ExperimentFoundationPromotionDecisionResponse,
  ExperimentFoundationRecordKind,
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJobResponse,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { buildApp } from '../app.js';
import type { AppErrorCode } from '../errors/app-error.js';

type InjectResponse = Awaited<ReturnType<FastifyInstance['inject']>>;
type TerminalJobStatus = 'succeeded' | 'failed' | 'cancelled';

export type ExperimentFoundationSyncUntilTerminalOptions = {
  expectedStatus?: TerminalJobStatus;
  timeoutMs?: number;
  pollMs?: number;
};

export type ExperimentFoundationCapabilityHarness = {
  readonly app: FastifyInstance;
  close(): Promise<void>;
  createRecord<T extends ExperimentFoundationStoredRecord = ExperimentFoundationStoredRecord>(
    recordKind: ExperimentFoundationRecordKind,
    payload: Record<string, unknown>,
  ): Promise<T>;
  upsertRecord<T extends ExperimentFoundationStoredRecord = ExperimentFoundationStoredRecord>(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
    payload: Record<string, unknown>,
  ): Promise<T>;
  getRecord<T extends ExperimentFoundationStoredRecord = ExperimentFoundationStoredRecord>(
    recordKind: ExperimentFoundationRecordKind,
    recordId: string,
  ): Promise<T>;
  listRecords(query?: {
    record_kind?: ExperimentFoundationRecordKind;
    status?: string;
    family?: string;
    limit?: number;
  }): Promise<{ records: ExperimentFoundationStoredRecord[]; next_cursor?: string | null }>;
  checkReadiness(targetRef: ExperimentFoundationRef): Promise<{
    readiness_report_id: string;
    readiness_status: string;
    blockers: string[];
    warnings: string[];
    required_actions: string[];
  }>;
  getLatestReadiness(targetRef: ExperimentFoundationRef): Promise<{
    readiness_report_id: string;
    readiness_status: string;
  }>;
  promoteCandidate(
    candidateId: string,
    input: ExperimentFoundationPromotionDecisionRequest,
  ): Promise<ExperimentFoundationPromotionDecisionResponse>;
  submitJob(input: SubmitExternalTrainingJobRequest): Promise<ExternalTrainingJobResponse>;
  syncJob(externalJobId: string, input?: SyncExternalTrainingJobRequest): Promise<ExternalTrainingJobResponse>;
  syncJobUntilTerminal(
    externalJobId: string,
    options?: TerminalJobStatus | ExperimentFoundationSyncUntilTerminalOptions,
  ): Promise<ExternalTrainingJobResponse>;
  collectJob(
    externalJobId: string,
    input?: CollectExternalTrainingJobRequest,
  ): Promise<ExternalTrainingJobResponse>;
  expectError(response: InjectResponse, statusCode: number, code: AppErrorCode | 'INVALID_PAYLOAD'): void;
};

export async function buildExperimentFoundationCapabilityHarness(): Promise<ExperimentFoundationCapabilityHarness> {
  const app = buildApp();
  await app.ready();
  return {
    app,
    close: () => app.close(),
    createRecord: async <T extends ExperimentFoundationStoredRecord = ExperimentFoundationStoredRecord>(
      recordKind: ExperimentFoundationRecordKind,
      payload: Record<string, unknown>,
    ) => {
      const response = await app.inject({
        method: 'POST',
        url: '/experiment-foundation/records',
        payload: { record_kind: recordKind, payload } satisfies CreateExperimentFoundationRecordRequest,
      });
      assert.equal(response.statusCode, 201, response.body);
      return response.json() as T;
    },
    upsertRecord: async <T extends ExperimentFoundationStoredRecord = ExperimentFoundationStoredRecord>(
      recordKind: ExperimentFoundationRecordKind,
      recordId: string,
      payload: Record<string, unknown>,
    ) => {
      const response = await app.inject({
        method: 'PUT',
        url: `/experiment-foundation/records/${recordKind}/${recordId}`,
        payload: { record_kind: recordKind, payload } satisfies CreateExperimentFoundationRecordRequest,
      });
      assert.equal(response.statusCode, 200, response.body);
      return response.json() as T;
    },
    getRecord: async <T extends ExperimentFoundationStoredRecord = ExperimentFoundationStoredRecord>(
      recordKind: ExperimentFoundationRecordKind,
      recordId: string,
    ) => {
      const response = await app.inject({
        method: 'GET',
        url: `/experiment-foundation/records/${recordKind}/${recordId}`,
      });
      assert.equal(response.statusCode, 200, response.body);
      return response.json() as T;
    },
    listRecords: async (query = {}) => {
      const response = await app.inject({
        method: 'GET',
        url: `/experiment-foundation/records${queryString(query)}`,
      });
      assert.equal(response.statusCode, 200, response.body);
      return response.json() as { records: ExperimentFoundationStoredRecord[]; next_cursor?: string | null };
    },
    checkReadiness: async (targetRef: ExperimentFoundationRef) => {
      const response = await app.inject({
        method: 'POST',
        url: '/experiment-foundation/readiness/check',
        payload: {
          target_ref: targetRef,
          source_refs: [{ ref_type: 'test_case', ref_id: 'capability_readiness' }],
        },
      });
      assert.equal(response.statusCode, 201, response.body);
      return response.json() as {
        readiness_report_id: string;
        readiness_status: string;
        blockers: string[];
        warnings: string[];
        required_actions: string[];
      };
    },
    getLatestReadiness: async (targetRef: ExperimentFoundationRef) => {
      const response = await app.inject({
        method: 'GET',
        url: `/experiment-foundation/readiness/${targetRef.ref_type}/${targetRef.ref_id}/latest`,
      });
      assert.equal(response.statusCode, 200, response.body);
      return response.json() as { readiness_report_id: string; readiness_status: string };
    },
    promoteCandidate: async (candidateId: string, input: ExperimentFoundationPromotionDecisionRequest) => {
      const response = await app.inject({
        method: 'POST',
        url: `/experiment-foundation/candidates/${candidateId}/promotion`,
        payload: input,
      });
      assert.equal(response.statusCode, 201, response.body);
      return response.json() as ExperimentFoundationPromotionDecisionResponse;
    },
    submitJob: async (input: SubmitExternalTrainingJobRequest) => {
      const response = await app.inject({
        method: 'POST',
        url: '/experiment-foundation/execution/jobs/submit',
        payload: input,
      });
      assert.equal(response.statusCode, 201, response.body);
      return response.json() as ExternalTrainingJobResponse;
    },
    syncJob: async (externalJobId: string, input: SyncExternalTrainingJobRequest = { source_refs: [] }) => {
      const response = await app.inject({
        method: 'POST',
        url: `/experiment-foundation/execution/jobs/${externalJobId}/sync`,
        payload: input,
      });
      assert.equal(response.statusCode, 200, response.body);
      return response.json() as ExternalTrainingJobResponse;
    },
    syncJobUntilTerminal: async (externalJobId: string, options = {}) => {
      const normalized = normalizeSyncUntilTerminalOptions(options);
      let latest: ExternalTrainingJobResponse | null = null;
      const startedAt = Date.now();
      while (Date.now() - startedAt <= normalized.timeoutMs) {
        latest = await injectSync(app, externalJobId);
        if (latest.external_job.job_status === normalized.expectedStatus) {
          return latest;
        }
        await sleep(normalized.pollMs);
      }
      assert.fail(
        `External job ${externalJobId} did not reach ${normalized.expectedStatus} within `
        + `${normalized.timeoutMs}ms; latest=${latest?.external_job.job_status}`,
      );
    },
    collectJob: async (
      externalJobId: string,
      input: CollectExternalTrainingJobRequest = {
        source_refs: [{ ref_type: 'test_case', ref_id: 'capability_collect' }],
      },
    ) => {
      const response = await app.inject({
        method: 'POST',
        url: `/experiment-foundation/execution/jobs/${externalJobId}/collect`,
        payload: input,
      });
      assert.equal(response.statusCode, 200, response.body);
      return response.json() as ExternalTrainingJobResponse;
    },
    expectError: (response: InjectResponse, statusCode: number, code: AppErrorCode | 'INVALID_PAYLOAD') => {
      assert.equal(response.statusCode, statusCode, response.body);
      assert.equal((response.json() as { error?: { code?: string } }).error?.code, code, response.body);
    },
  };
}

async function injectSync(app: FastifyInstance, externalJobId: string): Promise<ExternalTrainingJobResponse> {
  const response = await app.inject({
    method: 'POST',
    url: `/experiment-foundation/execution/jobs/${externalJobId}/sync`,
    payload: { source_refs: [{ ref_type: 'test_case', ref_id: 'capability_sync' }] },
  });
  assert.equal(response.statusCode, 200, response.body);
  return response.json() as ExternalTrainingJobResponse;
}

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function normalizeSyncUntilTerminalOptions(
  options: TerminalJobStatus | ExperimentFoundationSyncUntilTerminalOptions,
): Required<ExperimentFoundationSyncUntilTerminalOptions> {
  if (typeof options === 'string') {
    return {
      expectedStatus: options,
      timeoutMs: 5000,
      pollMs: 50,
    };
  }
  return {
    expectedStatus: options.expectedStatus ?? 'succeeded',
    timeoutMs: options.timeoutMs ?? 5000,
    pollMs: options.pollMs ?? 50,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
