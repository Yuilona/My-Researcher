import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EXPERIMENT_FOUNDATION_ASSET_CANDIDATE_ATTENTION_STATUSES,
  EXPERIMENT_FOUNDATION_EVIDENCE_CANDIDATE_REVIEW_STATUSES,
  EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_IN_FLIGHT_STATUSES,
  EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES,
  type ExperimentFoundationReadinessCheckResponse,
  type ExperimentFoundationStoredRecord,
  type ExternalTrainingJob,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import {
  listExperimentFoundationJobs,
  listExperimentFoundationReadinessReports,
  listExperimentFoundationRecords,
} from '../api';
import type { ExperimentFoundationOperationStatus } from '../types';
import { toErrorMessage } from '../utils';

const IN_FLIGHT_JOB_STATUSES = new Set<string>(EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_IN_FLIGHT_STATUSES);
const ATTENTION_STATUSES = new Set<string>(EXPERIMENT_FOUNDATION_ASSET_CANDIDATE_ATTENTION_STATUSES);
const EVIDENCE_REVIEW_STATUSES = new Set<string>(EXPERIMENT_FOUNDATION_EVIDENCE_CANDIDATE_REVIEW_STATUSES);

const LIST_LIMIT = 5;

export type OverviewCounters = {
  jobsInFlight: number;
  blockedReadiness: number;
  pendingPromotion: number;
  evidenceUnderReview: number;
};

export function useOverviewController() {
  const [records, setRecords] = useState<ExperimentFoundationStoredRecord[]>([]);
  const [jobs, setJobs] = useState<ExternalTrainingJob[]>([]);
  const [blockedReadinessReports, setBlockedReadinessReports] = useState<
    ExperimentFoundationReadinessCheckResponse[]
  >([]);
  const [status, setStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [recordsResp, jobsResp, blockedResp] = await Promise.all([
        listExperimentFoundationRecords({
          recordKind: '',
          status: '',
          family: '',
          parentRecordId: '',
          ownerRefId: '',
        }),
        listExperimentFoundationJobs({
          adapterKind: '',
          status: '',
          trainingTaskSpecId: '',
          materializationResultId: '',
        }),
        listExperimentFoundationReadinessReports({
          status: EXPERIMENT_FOUNDATION_READINESS_BLOCKED_STATUSES[0],
          limit: 50,
        }),
      ]);
      setRecords(recordsResp.records);
      setJobs(jobsResp.jobs);
      setBlockedReadinessReports(blockedResp.reports);
      setStatus('success');
    } catch (caught) {
      setStatus('error');
      setError(toErrorMessage(caught));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counters = useMemo<OverviewCounters>(() => {
    const jobsInFlight = jobs.filter((job) => IN_FLIGHT_JOB_STATUSES.has(job.job_status)).length;
    const blockedReadiness = blockedReadinessReports.length;
    const pendingPromotion = records.filter(
      (record) =>
        record.record_kind.endsWith('_candidate') &&
        record.status !== null &&
        record.status !== undefined &&
        ATTENTION_STATUSES.has(record.status),
    ).length;
    const evidenceUnderReview = records.filter(
      (record) =>
        record.record_kind === 'evidence_candidate' &&
        record.status !== null &&
        record.status !== undefined &&
        EVIDENCE_REVIEW_STATUSES.has(record.status),
    ).length;
    return { jobsInFlight, blockedReadiness, pendingPromotion, evidenceUnderReview };
  }, [records, jobs, blockedReadinessReports]);

  const recentJobs = useMemo(() => jobs.slice(0, LIST_LIMIT), [jobs]);

  const blockedReadinessList = useMemo(
    () => blockedReadinessReports.slice(0, LIST_LIMIT),
    [blockedReadinessReports],
  );

  const pendingCandidates = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.record_kind.endsWith('_candidate') &&
            record.status !== null &&
            record.status !== undefined &&
            ATTENTION_STATUSES.has(record.status),
        )
        .slice(0, LIST_LIMIT),
    [records],
  );

  return {
    status,
    error,
    counters,
    recentJobs,
    blockedReadinessList,
    pendingCandidates,
    refresh,
  };
}
