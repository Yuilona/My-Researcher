import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJob,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { StatusBadge } from '../components/StatusBadge';
import { getRunRecipePayload } from '../payloads';
import type { ExperimentFoundationOperationStatus } from '../types';
import { formatRefList, shortText } from '../utils';
import {
  CancelJobForm,
  CollectJobForm,
  SubmitJobForm,
  SyncJobForm,
  type JobActionStatus,
} from './JobActionForms';
import type {
  CancelExternalTrainingJobRequest,
  CollectExternalTrainingJobRequest,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { FLOW_STAGES, type FlowStageKey, type FlowStageState } from './useExperimentFlowController';

export type RunRecipeTimelineProps = {
  selectedRunRecipe: ExperimentFoundationStoredRecord | null;
  stages: Record<FlowStageKey, FlowStageState>;
  onRefreshStage: (key: FlowStageKey) => void;
  onLoadMoreStage: (key: FlowStageKey) => void;
  onInspectReadiness: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
  jobs: ExternalTrainingJob[];
  selectedJob: ExternalTrainingJob | null;
  onSelectJob: (job: ExternalTrainingJob | null) => void;
  jobsStatus: ExperimentFoundationOperationStatus;
  jobsError: string | null;
  jobActionStatus: JobActionStatus;
  jobActionMessage: string | null;
  onSubmitJob: (body: SubmitExternalTrainingJobRequest) => Promise<void>;
  onSyncJob: (body: SyncExternalTrainingJobRequest) => Promise<void>;
  onCancelJob: (body: CancelExternalTrainingJobRequest) => Promise<void>;
  onCollectJob: (body: CollectExternalTrainingJobRequest) => Promise<void>;
};

export function RunRecipeTimeline(props: RunRecipeTimelineProps) {
  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      {FLOW_STAGES.map((stage) => {
        const stageState = props.stages[stage.key];
        if (stage.key === 'external_training_job') {
          return (
            <JobStageCard
              key={stage.key}
              label={stage.label}
              jobs={props.jobs}
              selectedJob={props.selectedJob}
              onSelectJob={props.onSelectJob}
              jobsStatus={props.jobsStatus}
              jobsError={props.jobsError}
              jobActionStatus={props.jobActionStatus}
              jobActionMessage={props.jobActionMessage}
              onSubmitJob={props.onSubmitJob}
              onSyncJob={props.onSyncJob}
              onCancelJob={props.onCancelJob}
              onCollectJob={props.onCollectJob}
              selectedRunRecipe={props.selectedRunRecipe}
              onInspectReadiness={props.onInspectReadiness}
              onRefresh={() => props.onRefreshStage(stage.key)}
            />
          );
        }
        return (
          <RecordStageCard
            key={stage.key}
            label={stage.label}
            stageState={stageState}
            recordKind={stage.recordKind}
            onRefresh={() => props.onRefreshStage(stage.key)}
            onLoadMore={() => props.onLoadMoreStage(stage.key)}
            onInspectReadiness={props.onInspectReadiness}
          />
        );
      })}
    </div>
  );
}

type RecordStageCardProps = {
  label: string;
  stageState: FlowStageState;
  recordKind: ExperimentFoundationRecordKind | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onInspectReadiness: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
};

function RecordStageCard({
  label,
  stageState,
  recordKind,
  onRefresh,
  onLoadMore,
  onInspectReadiness,
}: RecordStageCardProps) {
  const records = stageState.records;
  const latest = records[0] ?? null;

  return (
    <section data-ui="card" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              {label}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              {recordKind ?? '(no record kind)'} · {records.length} record{records.length === 1 ? '' : 's'}
            </p>
          </div>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={onRefresh}>
            刷新
          </button>
        </div>
        {stageState.status === 'error' && stageState.error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">
            {stageState.error}
          </p>
        ) : null}
        {latest === null ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">pending（暂无记录）</p>
          </div>
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="2">
            <div data-ui="toolbar" data-align="start" data-wrap="wrap">
              <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                latest: {shortText(latest.record_id, 36)}
              </span>
              <StatusBadge value={latest.status} />
              {recordKind ? (
                <button
                  data-ui="button"
                  data-variant="ghost"
                  data-size="sm"
                  type="button"
                  onClick={() => onInspectReadiness(recordKind, latest.record_id)}
                >
                  查看 readiness
                </button>
              ) : null}
            </div>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              hash {shortText(latest.record_hash, 28)} · refs {shortText(formatRefList(latest.traceability_refs), 40)}
            </p>
            <JsonAdvancedPanel title="latest payload" value={latest.payload ?? {}} />
            {records.length > 1 ? (
              <details>
                <summary>
                  <span data-ui="text" data-variant="caption" data-tone="muted">
                    其它 {records.length - 1} 条
                  </span>
                </summary>
                <ul data-ui="list" data-variant="plain" data-density="compact">
                  {records.slice(1, 6).map((record) => (
                    <li key={`${record.record_kind}:${record.record_id}`}>
                      <p data-ui="text" data-variant="caption" data-tone="muted">
                        {shortText(record.record_id, 60)} · <StatusBadge value={record.status} />
                      </p>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {stageState.nextCursor ? (
              <div data-ui="toolbar" data-align="start" data-wrap="wrap">
                <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={onLoadMore}>
                  加载更多
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

type JobStageCardProps = {
  label: string;
  jobs: ExternalTrainingJob[];
  selectedJob: ExternalTrainingJob | null;
  onSelectJob: (job: ExternalTrainingJob | null) => void;
  jobsStatus: ExperimentFoundationOperationStatus;
  jobsError: string | null;
  jobActionStatus: JobActionStatus;
  jobActionMessage: string | null;
  onSubmitJob: (body: SubmitExternalTrainingJobRequest) => Promise<void>;
  onSyncJob: (body: SyncExternalTrainingJobRequest) => Promise<void>;
  onCancelJob: (body: CancelExternalTrainingJobRequest) => Promise<void>;
  onCollectJob: (body: CollectExternalTrainingJobRequest) => Promise<void>;
  selectedRunRecipe: ExperimentFoundationStoredRecord | null;
  onInspectReadiness: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
  onRefresh: () => void;
};

function JobStageCard(props: JobStageCardProps) {
  const { jobs, selectedJob, jobActionStatus, jobActionMessage } = props;
  const hasSelectedJob = Boolean(selectedJob);

  return (
    <section data-ui="card" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="3">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              {props.label}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              external_training_job · {jobs.length} job{jobs.length === 1 ? '' : 's'}
            </p>
          </div>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={props.onRefresh}>
            刷新 jobs
          </button>
        </div>
        {props.jobsStatus === 'error' && props.jobsError ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">
            {props.jobsError}
          </p>
        ) : null}

        {jobs.length === 0 ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">尚无 job，提交一个开始</p>
          </div>
        ) : (
          <table data-ui="table" data-density="compact">
            <thead>
              <tr>
                <th>job</th>
                <th>status</th>
                <th>adapter</th>
                <th>task_spec</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 8).map((job) => {
                const isSelected = selectedJob?.external_job_id === job.external_job_id;
                return (
                  <tr key={job.external_job_id}>
                    <td>
                      <button
                        data-ui="button"
                        data-variant={isSelected ? 'primary' : 'ghost'}
                        data-size="sm"
                        type="button"
                        title={job.external_job_id}
                        onClick={() => props.onSelectJob(job)}
                      >
                        {shortText(job.external_job_id, 32)}
                      </button>
                    </td>
                    <td>
                      <StatusBadge value={job.job_status} />
                    </td>
                    <td>{job.adapter_kind}</td>
                    <td>{shortText(job.training_task_spec_ref.ref_id, 24)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {selectedJob ? (
          <section data-ui="section" data-padding="none">
            <div data-ui="stack" data-direction="col" data-gap="2">
              <p data-ui="text" data-variant="label" data-tone="primary">
                selected job · {shortText(selectedJob.external_job_id, 40)}
              </p>
              <div data-ui="toolbar" data-align="start" data-wrap="wrap">
                <StatusBadge value={selectedJob.job_status} />
                <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                  {selectedJob.adapter_kind}
                </span>
                <button
                  data-ui="button"
                  data-variant="ghost"
                  data-size="sm"
                  type="button"
                  onClick={() =>
                    props.onInspectReadiness('training_task_spec', selectedJob.training_task_spec_ref.ref_id)
                  }
                >
                  task spec readiness
                </button>
              </div>
              <p data-ui="text" data-variant="caption" data-tone="muted">
                result refs {shortText(formatRefList(selectedJob.result_refs), 60)}
              </p>
              <JsonAdvancedPanel title="job payload" value={selectedJob} />
            </div>
          </section>
        ) : null}

        <div data-ui="grid" data-cols="2" data-gap="3">
          {(() => {
            const recipe = getRunRecipePayload(props.selectedRunRecipe);
            return (
              <SubmitJobForm
                status={jobActionStatus}
                message={jobActionMessage}
                onSubmit={props.onSubmitJob}
                initial={
                  recipe
                    ? {
                        trainingTaskSpecRef: selectedJob?.training_task_spec_ref ?? null,
                        trainingTaskSpecHash: recipe.run_recipe_hash,
                        materializationResultRef: null,
                        materializationResultHash: '',
                      }
                    : undefined
                }
              />
            );
          })()}
          <SyncJobForm
            status={jobActionStatus}
            message={jobActionMessage}
            disabled={!hasSelectedJob}
            onSubmit={props.onSyncJob}
          />
          <CancelJobForm
            status={jobActionStatus}
            message={jobActionMessage}
            disabled={!hasSelectedJob}
            onSubmit={props.onCancelJob}
          />
          <CollectJobForm
            status={jobActionStatus}
            message={jobActionMessage}
            disabled={!hasSelectedJob}
            onSubmit={props.onCollectJob}
          />
        </div>
      </div>
    </section>
  );
}
