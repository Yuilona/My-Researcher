import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJob,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AssetLibraryPanel } from './assets/AssetLibraryPanel';
import type { ExperimentFoundationAssetSubTabKey } from './constants';
import { StatusBadge } from './components/StatusBadge';
import { OverviewPanel } from './overview/OverviewPanel';
import type { ExperimentFoundationPanelKey } from './types';
import { useExperimentFoundationController } from './useExperimentFoundationController';
import {
  experimentFoundationExternalJobStatuses,
  experimentFoundationRecordKinds,
  experimentFoundationTrainingAdapterKinds,
  formatRefList,
  shortText,
} from './utils';

type Controller = ReturnType<typeof useExperimentFoundationController>;

export type ExperimentFoundationModuleProps = {
  activePanel: ExperimentFoundationPanelKey;
  onSelectPanel: (panel: ExperimentFoundationPanelKey) => void;
  assetSubTab: ExperimentFoundationAssetSubTabKey;
  onSelectAssetSubTab: (sub: ExperimentFoundationAssetSubTabKey) => void;
};

function StatusLine({ status, message }: { status: string; message?: string | null }) {
  if (!message) {
    return null;
  }
  if (status === 'error') {
    return (
      <p data-ui="text" data-variant="caption" data-tone="danger">
        {message}
      </p>
    );
  }
  if (status === 'success') {
    return (
      <p data-ui="text" data-variant="caption" data-tone="secondary">
        {message}
      </p>
    );
  }
  return (
    <p data-ui="text" data-variant="caption" data-tone="muted">
      {message}
    </p>
  );
}

function JsonEditor({
  label,
  value,
  onChange,
  rows = 12,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  rows?: number;
}) {
  return (
    <label data-ui="field">
      <span data-slot="label">{label}</span>
      <textarea
        data-ui="textarea"
        data-size="sm"
        rows={rows}
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function JsonViewer({ label, value }: { label: string; value: unknown }) {
  return (
    <label data-ui="field">
      <span data-slot="label">{label}</span>
      <textarea
        data-ui="textarea"
        data-size="sm"
        rows={12}
        readOnly
        value={JSON.stringify(value ?? null, null, 2)}
        spellCheck={false}
      />
    </label>
  );
}

function RecordKindSelect({
  value,
  onChange,
  options = experimentFoundationRecordKinds,
}: {
  value: ExperimentFoundationRecordKind | '';
  onChange: (nextValue: ExperimentFoundationRecordKind | '') => void;
  options?: readonly ExperimentFoundationRecordKind[];
}) {
  const visibleOptions =
    value && !(options as readonly string[]).includes(value)
      ? ([value, ...options] as readonly ExperimentFoundationRecordKind[])
      : options;

  return (
    <select
      data-ui="select"
      data-size="sm"
      value={value}
      onChange={(event) => onChange(event.target.value as ExperimentFoundationRecordKind | '')}
    >
      <option value="">全部 record_kind</option>
      {visibleOptions.map((kind) => (
        <option key={kind} value={kind}>
          {kind}
        </option>
      ))}
    </select>
  );
}

function RecordTable({
  records,
  selectedRecord,
  onSelect,
}: {
  records: ExperimentFoundationStoredRecord[];
  selectedRecord: ExperimentFoundationStoredRecord | null;
  onSelect: (record: ExperimentFoundationStoredRecord) => void;
}) {
  if (records.length === 0) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">No records</p>
      </div>
    );
  }

  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>record</th>
          <th>status</th>
          <th>hash</th>
          <th>refs</th>
          <th>updated</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const isSelected =
            selectedRecord?.record_kind === record.record_kind && selectedRecord.record_id === record.record_id;
          return (
            <tr key={`${record.record_kind}:${record.record_id}`}>
              <td>
                <button
                  data-ui="button"
                  data-variant={isSelected ? 'primary' : 'ghost'}
                  data-size="sm"
                  type="button"
                  onClick={() => onSelect(record)}
                  title={`${record.record_kind}:${record.record_id}`}
                >
                  {shortText(`${record.record_kind}:${record.record_id}`, 50)}
                </button>
              </td>
              <td>
                <StatusBadge value={record.status} />
              </td>
              <td>{shortText(record.record_hash, 28)}</td>
              <td>{shortText(formatRefList(record.traceability_refs), 38)}</td>
              <td>{shortText(record.updated_at, 24)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RecordEditor({
  controller,
  recordKindOptions,
}: {
  controller: Controller;
  recordKindOptions?: readonly ExperimentFoundationRecordKind[];
}) {
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="stack" data-direction="col" data-gap="3">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
            <label data-ui="field">
              <span data-slot="label">record_kind</span>
              <RecordKindSelect
                value={controller.recordEditorKind}
                options={recordKindOptions}
                onChange={(recordKind) => {
                  if (recordKind) {
                    controller.setRecordEditorKind(recordKind);
                  }
                }}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">record_id</span>
              <input
                data-ui="input"
                data-size="sm"
                value={controller.recordEditorId}
                onChange={(event) => controller.setRecordEditorId(event.target.value)}
              />
            </label>
          </div>
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
            <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.createRecord()}>
              创建
            </button>
            <button data-ui="button" data-variant="primary" data-size="sm" type="button" onClick={() => void controller.upsertRecord()}>
              覆盖写入
            </button>
          </div>
        </div>
        <JsonEditor label="合同 JSON" value={controller.recordEditorPayload} onChange={controller.setRecordEditorPayload} rows={16} />
        <StatusLine status={controller.recordMutationStatus} message={controller.recordMutationMessage} />
      </div>
    </section>
  );
}

function ReadinessPanel({ controller }: { controller: Controller }) {
  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
            <label data-ui="field">
              <span data-slot="label">target_kind</span>
              <RecordKindSelect
                value={controller.readinessTargetKind}
                onChange={(recordKind) => {
                  if (recordKind) {
                    controller.setReadinessTargetKind(recordKind);
                  }
                }}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">target_id</span>
              <input
                data-ui="input"
                data-size="sm"
                value={controller.readinessTargetId}
                onChange={(event) => controller.setReadinessTargetId(event.target.value)}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">check_kind</span>
              <input
                data-ui="input"
                data-size="sm"
                value={controller.readinessCheckKind}
                onChange={(event) => controller.setReadinessCheckKind(event.target.value)}
              />
            </label>
          </div>
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
            <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.loadLatestReadiness()}>
              Latest
            </button>
            <button data-ui="button" data-variant="primary" data-size="sm" type="button" onClick={() => void controller.checkReadiness()}>
              Check
            </button>
          </div>
        </div>
        {controller.selectedRecordRef ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            selected: {controller.selectedRecordRef.ref_type}:{controller.selectedRecordRef.ref_id}
          </p>
        ) : null}
        <StatusLine status={controller.readinessStatus} message={controller.readinessError} />
      </section>
      <JsonEditor label="source_refs" value={controller.readinessSourceRefs} onChange={controller.setReadinessSourceRefs} rows={5} />
      {controller.readinessReport ? (
        <section data-ui="section" data-padding="none">
          <div data-ui="toolbar" data-align="start" data-wrap="wrap">
            <StatusBadge value={controller.readinessReport.readiness_status} />
            <span data-ui="badge" data-variant="subtle" data-tone="neutral">
              {shortText(controller.readinessReport.readiness_hash, 34)}
            </span>
          </div>
          <JsonViewer label="Readiness report" value={controller.readinessReport} />
        </section>
      ) : null}
    </div>
  );
}

function PromotionPanel({ controller }: { controller: Controller }) {
  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
            <label data-ui="field">
              <span data-slot="label">candidate kind</span>
              <RecordKindSelect
                value={controller.candidateFilters.recordKind}
                options={controller.promotionCandidateRecordKinds}
                onChange={(recordKind) => controller.setCandidateFilters((current) => ({ ...current, recordKind }))}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">candidate_id</span>
              <input
                data-ui="input"
                data-size="sm"
                value={controller.promotionCandidateId}
                onChange={(event) => controller.setPromotionCandidateId(event.target.value)}
              />
            </label>
          </div>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.loadRecords()}>
            刷新候选
          </button>
        </div>
      </section>
      <RecordTable records={controller.records} selectedRecord={controller.selectedRecord} onSelect={controller.selectRecord} />
      <JsonEditor label="promotion request/result JSON" value={controller.promotionPayload} onChange={controller.setPromotionPayload} rows={14} />
      <div data-ui="toolbar" data-align="end" data-wrap="wrap">
        <button data-ui="button" data-variant="primary" data-size="sm" type="button" onClick={() => void controller.decidePromotion()}>
          提交晋升决策
        </button>
      </div>
      <StatusLine status={controller.promotionStatus} message={controller.promotionMessage} />
    </div>
  );
}

function RecipePanel({ controller }: { controller: Controller }) {
  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <label data-ui="field">
            <span data-slot="label">recipe/materialization kind</span>
            <RecordKindSelect
              value={controller.recipeFilters.recordKind}
              options={controller.recipeRecordKinds}
              onChange={(recordKind) => controller.setRecipeFilters((current) => ({ ...current, recordKind }))}
            />
          </label>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.loadRecords()}>
            刷新
          </button>
        </div>
      </section>
      <div data-ui="grid" data-cols="2" data-gap="4">
        <RecordTable records={controller.records} selectedRecord={controller.selectedRecord} onSelect={controller.selectRecord} />
        <RecordEditor controller={controller} recordKindOptions={controller.recipeRecordKinds} />
      </div>
    </div>
  );
}

function JobFilters({ controller }: { controller: Controller }) {
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="toolbar" data-align="between" data-wrap="wrap">
        <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
          <label data-ui="field">
            <span data-slot="label">adapter</span>
            <select
              data-ui="select"
              data-size="sm"
              value={controller.jobFilters.adapterKind}
              onChange={(event) =>
                controller.setJobFilters((current) => ({
                  ...current,
                  adapterKind: event.target.value as Controller['jobFilters']['adapterKind'],
                }))
              }
            >
              <option value="">全部 adapter</option>
              {experimentFoundationTrainingAdapterKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <label data-ui="field">
            <span data-slot="label">job status</span>
            <select
              data-ui="select"
              data-size="sm"
              value={controller.jobFilters.status}
              onChange={(event) =>
                controller.setJobFilters((current) => ({
                  ...current,
                  status: event.target.value as Controller['jobFilters']['status'],
                }))
              }
            >
              <option value="">全部 status</option>
              {experimentFoundationExternalJobStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label data-ui="field">
            <span data-slot="label">task_spec</span>
            <input
              data-ui="input"
              data-size="sm"
              value={controller.jobFilters.trainingTaskSpecId}
              onChange={(event) =>
                controller.setJobFilters((current) => ({ ...current, trainingTaskSpecId: event.target.value }))
              }
            />
          </label>
          <label data-ui="field">
            <span data-slot="label">materialization</span>
            <input
              data-ui="input"
              data-size="sm"
              value={controller.jobFilters.materializationResultId}
              onChange={(event) =>
                controller.setJobFilters((current) => ({ ...current, materializationResultId: event.target.value }))
              }
            />
          </label>
        </div>
        <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.loadJobs()}>
          刷新 Jobs
        </button>
      </div>
      <StatusLine status={controller.jobStatus} message={controller.jobError} />
    </section>
  );
}

function JobTable({
  jobs,
  selectedJob,
  onSelect,
}: {
  jobs: ExternalTrainingJob[];
  selectedJob: ExternalTrainingJob | null;
  onSelect: (externalJobId: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">No jobs</p>
      </div>
    );
  }

  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>job</th>
          <th>status</th>
          <th>adapter</th>
          <th>task</th>
          <th>result refs</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => {
          const isSelected = selectedJob?.external_job_id === job.external_job_id;
          return (
            <tr key={job.external_job_id}>
              <td>
                <button
                  data-ui="button"
                  data-variant={isSelected ? 'primary' : 'ghost'}
                  data-size="sm"
                  type="button"
                  onClick={() => onSelect(job.external_job_id)}
                  title={job.external_job_id}
                >
                  {shortText(job.external_job_id, 34)}
                </button>
              </td>
              <td>
                <StatusBadge value={job.job_status} />
              </td>
              <td>{job.adapter_kind}</td>
              <td>{shortText(job.training_task_spec_ref.ref_id, 28)}</td>
              <td>{shortText(formatRefList(job.result_refs), 40)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ExecutionPanel({ controller }: { controller: Controller }) {
  const actionDisabled = !controller.selectedJob || controller.jobMutationStatus === 'loading';

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <JobFilters controller={controller} />
      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <JobTable jobs={controller.jobs} selectedJob={controller.selectedJob} onSelect={(id) => void controller.selectJobById(id)} />
        </section>
        <section data-ui="section" data-padding="none">
          <JsonEditor label="submit job JSON" value={controller.submitJobPayload} onChange={controller.setSubmitJobPayload} rows={12} />
          <div data-ui="toolbar" data-align="end" data-wrap="wrap">
            <button data-ui="button" data-variant="primary" data-size="sm" type="button" onClick={() => void controller.submitJob()}>
              Submit
            </button>
          </div>
        </section>
      </div>
      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <JsonEditor label="sync source_refs" value={controller.jobSourceRefs} onChange={controller.setJobSourceRefs} rows={5} />
          <div data-ui="toolbar" data-align="start" data-wrap="wrap">
            <button
              data-ui="button"
              data-variant="secondary"
              data-size="sm"
              type="button"
              disabled={actionDisabled}
              onClick={() => void controller.syncJob()}
            >
              Sync
            </button>
          </div>
          <JsonEditor label="cancel JSON" value={controller.cancelJobPayload} onChange={controller.setCancelJobPayload} rows={8} />
          <div data-ui="toolbar" data-align="start" data-wrap="wrap">
            <button
              data-ui="button"
              data-variant="danger"
              data-size="sm"
              type="button"
              disabled={actionDisabled}
              onClick={() => void controller.cancelJob()}
            >
              Cancel
            </button>
          </div>
        </section>
        <section data-ui="section" data-padding="none">
          <JsonEditor label="collect JSON" value={controller.collectJobPayload} onChange={controller.setCollectJobPayload} rows={8} />
          <div data-ui="toolbar" data-align="start" data-wrap="wrap">
            <button
              data-ui="button"
              data-variant="secondary"
              data-size="sm"
              type="button"
              disabled={actionDisabled}
              onClick={() => void controller.collectJob()}
            >
              Collect
            </button>
          </div>
          <StatusLine status={controller.jobMutationStatus} message={controller.jobMutationMessage} />
        </section>
      </div>
      {controller.selectedJob ? <JsonViewer label="Selected external job" value={controller.selectedJob} /> : null}
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <label data-ui="field">
            <span data-slot="label">evidence record kind</span>
            <RecordKindSelect
              value={controller.evidenceFilters.recordKind}
              options={controller.evidenceRecordKinds}
              onChange={(recordKind) => controller.setEvidenceFilters((current) => ({ ...current, recordKind }))}
            />
          </label>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.loadRecords()}>
            刷新 Evidence
          </button>
        </div>
      </section>
      <div data-ui="grid" data-cols="2" data-gap="4">
        <RecordTable records={controller.records} selectedRecord={controller.selectedRecord} onSelect={controller.selectRecord} />
        <RecordEditor controller={controller} recordKindOptions={controller.evidenceRecordKinds} />
      </div>
      {controller.selectedRecord ? <JsonViewer label="Selected evidence/sidecar record" value={controller.selectedRecord} /> : null}
    </div>
  );
}

export function ExperimentFoundationModule({
  activePanel,
  onSelectPanel,
  assetSubTab,
  onSelectAssetSubTab,
}: ExperimentFoundationModuleProps) {
  const controller = useExperimentFoundationController({
    activePanel,
    setActivePanel: onSelectPanel,
  });

  return (
    <section className="module-dashboard" data-ui="page" data-density="compact">
      <div data-ui="stack" data-direction="col" data-gap="4">
        {activePanel === 'overview' ? (
          <OverviewPanel
            deepLinks={{
              goToJob: (externalJobId) => void controller.goToJob(externalJobId),
              goToReadiness: controller.goToReadiness,
              goToPromotion: controller.goToPromotion,
            }}
          />
        ) : null}
        {activePanel === 'assets' ? (
          <AssetLibraryPanel activeSubTab={assetSubTab} onSelectSubTab={onSelectAssetSubTab} />
        ) : null}
        {activePanel === 'readiness' ? <ReadinessPanel controller={controller} /> : null}
        {activePanel === 'promotion' ? <PromotionPanel controller={controller} /> : null}
        {activePanel === 'recipes' ? <RecipePanel controller={controller} /> : null}
        {activePanel === 'execution' ? <ExecutionPanel controller={controller} /> : null}
      </div>
    </section>
  );
}
