import { useCallback, useState } from 'react';
import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AssetLibraryPanel } from './assets/AssetLibraryPanel';
import { PaperBindingPanel } from './binding/PaperBindingPanel';
import type { ExperimentFoundationAssetSubTabKey } from './constants';
import {
  ReadinessInspector,
  type ReadinessInspectorTarget,
} from './components/ReadinessInspector';
import { StatusBadge } from './components/StatusBadge';
import { ExperimentFlowPanel } from './experiment-flow/ExperimentFlowPanel';
import { OverviewPanel } from './overview/OverviewPanel';
import type { ExperimentFoundationPanelKey } from './types';
import { useExperimentFoundationController } from './useExperimentFoundationController';
import {
  experimentFoundationRecordKinds,
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

export function ExperimentFoundationModule({
  activePanel,
  onSelectPanel,
  assetSubTab,
  onSelectAssetSubTab,
}: ExperimentFoundationModuleProps) {
  const [readinessTarget, setReadinessTarget] = useState<ReadinessInspectorTarget | null>(null);
  const [readinessOpen, setReadinessOpen] = useState<boolean>(false);
  // Pending preselect for the experiment flow panel; cleared after the panel
  // consumes it via onPreselectConsumed. Currently advisory: the flow panel
  // reads it on mount and selects the matching job.
  const [pendingFlowJobId, setPendingFlowJobId] = useState<string | null>(null);
  // S4 reverse-drill bridge: PaperBindingPanel raises this; module switches to
  // the 实验流 tab and the panel preselects the matching run_recipe.
  const [pendingFlowRunRecipeId, setPendingFlowRunRecipeId] = useState<string | null>(null);

  const openReadinessInspector = useCallback(
    (kind: ExperimentFoundationRecordKind, recordId: string) => {
      setReadinessTarget({ kind, id: recordId });
      setReadinessOpen(true);
    },
    [],
  );

  const requestFlowJobPreselect = useCallback((externalJobId: string) => {
    setPendingFlowJobId(externalJobId);
  }, []);

  const handleJumpToFlowRunRecipe = useCallback(
    (runRecipeId: string) => {
      setPendingFlowRunRecipeId(runRecipeId);
      onSelectPanel('flow');
    },
    [onSelectPanel],
  );

  const controller = useExperimentFoundationController({
    activePanel,
    setActivePanel: onSelectPanel,
    onOpenReadinessInspector: openReadinessInspector,
    onRequestFlowJobPreselect: requestFlowJobPreselect,
  });

  // pendingFlowJobId is consumed by ExperimentFlowPanel via its
  // onPreselectConsumed callback once the matching job is selected. That
  // callback clears the sentinel, so we do not need a timeout-based reset.

  return (
    <section className="module-dashboard" data-ui="page" data-density="compact">
      <div data-ui="stack" data-direction="col" data-gap="4">
        {activePanel === 'overview' ? (
          <OverviewPanel
            deepLinks={{
              goToJob: (externalJobId) => controller.goToJob(externalJobId),
              goToReadiness: controller.goToReadiness,
              goToPromotion: controller.goToPromotion,
            }}
          />
        ) : null}
        {activePanel === 'assets' ? (
          <AssetLibraryPanel activeSubTab={assetSubTab} onSelectSubTab={onSelectAssetSubTab} />
        ) : null}
        {activePanel === 'flow' ? (
          <ExperimentFlowPanel
            onInspectReadiness={openReadinessInspector}
            preselectJobId={pendingFlowJobId}
            onPreselectConsumed={() => setPendingFlowJobId(null)}
            preselectRunRecipeId={pendingFlowRunRecipeId}
            onPreselectRunRecipeConsumed={() => setPendingFlowRunRecipeId(null)}
          />
        ) : null}
        {activePanel === 'binding' ? (
          <PaperBindingPanel onJumpToFlowRunRecipe={handleJumpToFlowRunRecipe} />
        ) : null}
        {activePanel === 'promotion' ? <PromotionPanel controller={controller} /> : null}
      </div>

      <ReadinessInspector
        open={readinessOpen}
        target={readinessTarget}
        onClose={() => setReadinessOpen(false)}
      />
    </section>
  );
}

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
  return (
    <p data-ui="text" data-variant="caption" data-tone="muted">
      {message}
    </p>
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
        {controller.recordStatus === 'error' && controller.recordError ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">
            {controller.recordError}
          </p>
        ) : null}
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
