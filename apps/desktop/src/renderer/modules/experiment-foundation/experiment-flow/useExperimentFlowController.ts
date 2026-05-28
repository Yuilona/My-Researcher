import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CancelExternalTrainingJobRequest,
  CollectExternalTrainingJobRequest,
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJob,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import {
  cancelExperimentFoundationJob,
  collectExperimentFoundationJob,
  getExperimentFoundationJob,
  getExperimentFoundationRecord,
  listExperimentFoundationJobs,
  listExperimentFoundationRecords,
  submitExperimentFoundationJob,
  syncExperimentFoundationJob,
} from '../api';
import type { JobActionStatus } from './JobActionForms';
import { toErrorMessage } from '../utils';

// Timeline stages in canonical order. Each stage has a record kind that the
// flow panel queries independently. Stages without records render as
// 'pending' placeholders.
export type FlowStageKey =
  | 'recipe_draft'
  | 'run_recipe'
  | 'materialize_request'
  | 'materialization_result'
  | 'training_task_spec'
  | 'external_training_job'
  | 'experiment_result'
  | 'result_validation_report'
  | 'evidence_candidate'
  | 'paper_experiment_sidecar';

export type FlowStageSpec = {
  key: FlowStageKey;
  label: string;
  recordKind: ExperimentFoundationRecordKind | null; // null for the job stage which uses /execution/jobs
};

export const FLOW_STAGES: FlowStageSpec[] = [
  { key: 'recipe_draft', label: 'Recipe Draft', recordKind: 'recipe_draft' },
  { key: 'run_recipe', label: 'Run Recipe', recordKind: 'run_recipe' },
  { key: 'materialize_request', label: 'Materialization Request', recordKind: 'materialize_training_task_spec_request' },
  { key: 'materialization_result', label: 'Materialization Result', recordKind: 'training_task_materialization_result' },
  { key: 'training_task_spec', label: 'Training Task Spec', recordKind: 'training_task_spec' },
  { key: 'external_training_job', label: 'External Training Job', recordKind: null },
  { key: 'experiment_result', label: 'Experiment Result', recordKind: 'experiment_result' },
  { key: 'result_validation_report', label: 'Result Validation', recordKind: 'result_validation_report' },
  { key: 'evidence_candidate', label: 'Evidence Candidate', recordKind: 'evidence_candidate' },
  { key: 'paper_experiment_sidecar', label: 'Paper Sidecar', recordKind: 'paper_experiment_sidecar' },
];

export type FlowStageState = {
  records: ExperimentFoundationStoredRecord[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  nextCursor: string | null;
};

// Per-stage page size for the timeline's first paint. Each stage card surfaces
// a "加载更多" button when `nextCursor !== null`, which pulls another page of
// FLOW_STAGE_PAGE_SIZE rows and appends to the existing list.
const FLOW_STAGE_PAGE_SIZE = 10;

export type ExperimentFlowController = {
  selectedRunRecipe: ExperimentFoundationStoredRecord | null;
  selectRunRecipe: (record: ExperimentFoundationStoredRecord | null) => void;
  selectRunRecipeById: (recordId: string) => Promise<void>;
  selectRunRecipeStatus: 'idle' | 'loading' | 'success' | 'error';
  selectRunRecipeError: string | null;

  stages: Record<FlowStageKey, FlowStageState>;
  refreshStage: (key: FlowStageKey) => Promise<void>;
  loadMoreStage: (key: FlowStageKey) => Promise<void>;
  refreshAll: () => Promise<void>;

  jobs: ExternalTrainingJob[];
  selectedJob: ExternalTrainingJob | null;
  selectJobById: (externalJobId: string) => Promise<void>;
  selectJobLocally: (job: ExternalTrainingJob | null) => void;
  jobsStatus: 'idle' | 'loading' | 'success' | 'error';
  jobsError: string | null;

  jobActionStatus: JobActionStatus;
  jobActionMessage: string | null;
  submitJob: (body: SubmitExternalTrainingJobRequest) => Promise<void>;
  syncJob: (body: SyncExternalTrainingJobRequest) => Promise<void>;
  cancelJob: (body: CancelExternalTrainingJobRequest) => Promise<void>;
  collectJob: (body: CollectExternalTrainingJobRequest) => Promise<void>;
};

const INITIAL_STAGE_STATE: FlowStageState = {
  records: [],
  status: 'idle',
  error: null,
  nextCursor: null,
};

function buildInitialStages(): Record<FlowStageKey, FlowStageState> {
  const out = {} as Record<FlowStageKey, FlowStageState>;
  for (const stage of FLOW_STAGES) {
    out[stage.key] = INITIAL_STAGE_STATE;
  }
  return out;
}

export function useExperimentFlowController(): ExperimentFlowController {
  const [selectedRunRecipe, setSelectedRunRecipe] = useState<ExperimentFoundationStoredRecord | null>(null);
  const [selectRunRecipeStatus, setSelectRunRecipeStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [selectRunRecipeError, setSelectRunRecipeError] = useState<string | null>(null);
  const [stages, setStages] = useState<Record<FlowStageKey, FlowStageState>>(buildInitialStages);

  const [jobs, setJobs] = useState<ExternalTrainingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ExternalTrainingJob | null>(null);
  const [jobsStatus, setJobsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [jobActionStatus, setJobActionStatus] = useState<JobActionStatus>('idle');
  const [jobActionMessage, setJobActionMessage] = useState<string | null>(null);

  const updateStage = useCallback((key: FlowStageKey, updater: (current: FlowStageState) => FlowStageState) => {
    setStages((current) => ({ ...current, [key]: updater(current[key]) }));
  }, []);

  const loadJobs = useCallback(async () => {
    setJobsStatus('loading');
    setJobsError(null);
    try {
      const response = await listExperimentFoundationJobs({
        adapterKind: '',
        status: '',
        trainingTaskSpecId: '',
        materializationResultId: '',
      });
      setJobs(response.jobs);
      setJobsStatus('success');
      setSelectedJob((current) => {
        if (!current) {
          return response.jobs[0] ?? null;
        }
        return (
          response.jobs.find((job) => job.external_job_id === current.external_job_id) ??
          response.jobs[0] ??
          null
        );
      });
    } catch (caught) {
      setJobsStatus('error');
      setJobsError(toErrorMessage(caught));
    }
  }, []);

  // Mirror of `stages` for closures that need the latest nextCursor without
  // re-creating loadStagePage on every record change.
  const stagesRef = useRef<Record<FlowStageKey, FlowStageState>>(stages);
  useEffect(() => {
    stagesRef.current = stages;
  }, [stages]);

  const loadStagePage = useCallback(
    async (key: FlowStageKey, mode: 'replace' | 'append') => {
      const spec = FLOW_STAGES.find((stage) => stage.key === key);
      if (!spec) {
        return;
      }
      if (spec.recordKind === null) {
        // The job stage delegates to /execution/jobs and has no cursor.
        await loadJobs();
        return;
      }
      updateStage(key, (current) => ({ ...current, status: 'loading', error: null }));
      try {
        const cursorAtRequestTime =
          mode === 'append' ? stagesRef.current[key].nextCursor ?? undefined : undefined;
        const response = await listExperimentFoundationRecords({
          recordKind: spec.recordKind,
          status: '',
          family: '',
          parentRecordId: '',
          ownerRefId: '',
          limit: FLOW_STAGE_PAGE_SIZE,
          cursor: cursorAtRequestTime,
        });
        updateStage(key, (current) => ({
          records:
            mode === 'append'
              ? [...current.records, ...response.records]
              : response.records,
          status: 'success',
          error: null,
          nextCursor: response.next_cursor ?? null,
        }));
      } catch (caught) {
        updateStage(key, (current) => ({
          ...current,
          status: 'error',
          error: toErrorMessage(caught),
        }));
      }
    },
    [loadJobs, updateStage],
  );

  const refreshStage = useCallback(
    async (key: FlowStageKey) => {
      await loadStagePage(key, 'replace');
    },
    [loadStagePage],
  );

  const loadMoreStage = useCallback(
    async (key: FlowStageKey) => {
      await loadStagePage(key, 'append');
    },
    [loadStagePage],
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(FLOW_STAGES.map((stage) => loadStagePage(stage.key, 'replace')));
  }, [loadStagePage]);

  // Eager load on mount.
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const selectRunRecipe = useCallback((record: ExperimentFoundationStoredRecord | null) => {
    setSelectedRunRecipe(record);
    setSelectRunRecipeStatus(record ? 'success' : 'idle');
    setSelectRunRecipeError(null);
  }, []);

  const selectRunRecipeById = useCallback(async (recordId: string) => {
    setSelectRunRecipeStatus('loading');
    setSelectRunRecipeError(null);
    try {
      const record = await getExperimentFoundationRecord('run_recipe', recordId);
      setSelectedRunRecipe(record);
      setSelectRunRecipeStatus('success');
    } catch (caught) {
      setSelectRunRecipeStatus('error');
      setSelectRunRecipeError(toErrorMessage(caught));
    }
  }, []);

  const selectJobLocally = useCallback((job: ExternalTrainingJob | null) => {
    setSelectedJob(job);
    setJobActionStatus('idle');
    setJobActionMessage(null);
  }, []);

  const selectJobById = useCallback(async (externalJobId: string) => {
    setJobActionStatus('loading');
    setJobActionMessage(null);
    try {
      const response = await getExperimentFoundationJob(externalJobId);
      setSelectedJob(response.external_job);
      setJobActionStatus('success');
      setJobActionMessage(`loaded ${response.external_job.external_job_id}`);
    } catch (caught) {
      setJobActionStatus('error');
      setJobActionMessage(toErrorMessage(caught));
    }
  }, []);

  const submitJob = useCallback(
    async (body: SubmitExternalTrainingJobRequest) => {
      setJobActionStatus('loading');
      setJobActionMessage(null);
      try {
        const response = await submitExperimentFoundationJob(body);
        setSelectedJob(response.external_job);
        setJobActionStatus('success');
        setJobActionMessage(`submitted ${response.external_job.external_job_id}`);
        await loadJobs();
      } catch (caught) {
        setJobActionStatus('error');
        setJobActionMessage(toErrorMessage(caught));
      }
    },
    [loadJobs],
  );

  const syncJob = useCallback(
    async (body: SyncExternalTrainingJobRequest) => {
      if (!selectedJob) {
        setJobActionStatus('error');
        setJobActionMessage('请先选择一个 job。');
        return;
      }
      setJobActionStatus('loading');
      setJobActionMessage(null);
      try {
        const response = await syncExperimentFoundationJob(selectedJob.external_job_id, body);
        setSelectedJob(response.external_job);
        setJobActionStatus('success');
        setJobActionMessage(`synced ${response.external_job.external_job_id}`);
        await loadJobs();
      } catch (caught) {
        setJobActionStatus('error');
        setJobActionMessage(toErrorMessage(caught));
      }
    },
    [loadJobs, selectedJob],
  );

  const cancelJob = useCallback(
    async (body: CancelExternalTrainingJobRequest) => {
      if (!selectedJob) {
        setJobActionStatus('error');
        setJobActionMessage('请先选择一个 job。');
        return;
      }
      setJobActionStatus('loading');
      setJobActionMessage(null);
      try {
        const response = await cancelExperimentFoundationJob(selectedJob.external_job_id, body);
        setSelectedJob(response.external_job);
        setJobActionStatus('success');
        setJobActionMessage(`cancelled ${response.external_job.external_job_id}`);
        await loadJobs();
      } catch (caught) {
        setJobActionStatus('error');
        setJobActionMessage(toErrorMessage(caught));
      }
    },
    [loadJobs, selectedJob],
  );

  const collectJob = useCallback(
    async (body: CollectExternalTrainingJobRequest) => {
      if (!selectedJob) {
        setJobActionStatus('error');
        setJobActionMessage('请先选择一个 job。');
        return;
      }
      setJobActionStatus('loading');
      setJobActionMessage(null);
      try {
        const response = await collectExperimentFoundationJob(selectedJob.external_job_id, body);
        setSelectedJob(response.external_job);
        setJobActionStatus('success');
        setJobActionMessage(`collected ${response.external_job.external_job_id}`);
        await loadJobs();
        // The collect step often produces new result / evidence records; refresh
        // the downstream stages so they show up without waiting for refreshAll.
        await refreshStage('experiment_result');
        await refreshStage('result_validation_report');
        await refreshStage('evidence_candidate');
      } catch (caught) {
        setJobActionStatus('error');
        setJobActionMessage(toErrorMessage(caught));
      }
    },
    [loadJobs, refreshStage, selectedJob],
  );

  return {
    selectedRunRecipe,
    selectRunRecipe,
    selectRunRecipeById,
    selectRunRecipeStatus,
    selectRunRecipeError,
    stages,
    refreshStage,
    loadMoreStage,
    refreshAll,
    jobs,
    selectedJob,
    selectJobById,
    selectJobLocally,
    jobsStatus,
    jobsError,
    jobActionStatus,
    jobActionMessage,
    submitJob,
    syncJob,
    cancelJob,
    collectJob,
  };
}
