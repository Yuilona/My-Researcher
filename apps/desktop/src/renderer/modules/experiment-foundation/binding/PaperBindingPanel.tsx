import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
  PaperExperimentSidecar,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { StatusBadge } from '../components/StatusBadge';
import { listExperimentFoundationRecords } from '../api';
import { getPaperExperimentSidecarPayload } from '../payloads';
import type { ExperimentFoundationOperationStatus } from '../types';
import { formatRef, shortText, toErrorMessage } from '../utils';

export type PaperBindingPanelProps = {
  // Deep-link bridge: clicking "jump to 实验流" raises this. The module then
  // switches to the 实验流 tab and the panel preselects the matching
  // run_recipe.
  onJumpToFlowRunRecipe: (runRecipeId: string) => void;
};

type SidecarEntry = {
  record: ExperimentFoundationStoredRecord;
  payload: PaperExperimentSidecar | null;
  paperProjectId: string;
};

export function PaperBindingPanel({ onJumpToFlowRunRecipe }: PaperBindingPanelProps) {
  const [records, setRecords] = useState<ExperimentFoundationStoredRecord[]>([]);
  const [status, setStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ExperimentFoundationStoredRecord | null>(null);
  const [paperFilter, setPaperFilter] = useState<string>('');

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await listExperimentFoundationRecords({
        recordKind: 'paper_experiment_sidecar',
        status: '',
        family: '',
        parentRecordId: '',
        ownerRefId: '',
        limit: 50,
      });
      setRecords(response.records);
      setStatus('success');
      setSelectedRecord((current) => {
        if (!current) return response.records[0] ?? null;
        return (
          response.records.find(
            (record) =>
              record.record_kind === current.record_kind && record.record_id === current.record_id,
          ) ?? response.records[0] ?? null
        );
      });
    } catch (caught) {
      setStatus('error');
      setError(toErrorMessage(caught));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const entries = useMemo<SidecarEntry[]>(() => {
    return records.map((record) => {
      const payload = getPaperExperimentSidecarPayload(record);
      return {
        record,
        payload,
        paperProjectId: payload?.paper_project_id ?? '(unknown paper)',
      };
    });
  }, [records]);

  const grouped = useMemo<Array<{ paperProjectId: string; entries: SidecarEntry[] }>>(() => {
    const map = new Map<string, SidecarEntry[]>();
    for (const entry of entries) {
      if (paperFilter.trim() && !entry.paperProjectId.toLowerCase().includes(paperFilter.trim().toLowerCase())) {
        continue;
      }
      const list = map.get(entry.paperProjectId) ?? [];
      list.push(entry);
      map.set(entry.paperProjectId, list);
    }
    return Array.from(map.entries())
      .map(([paperProjectId, items]) => ({ paperProjectId, entries: items }))
      .sort((a, b) => a.paperProjectId.localeCompare(b.paperProjectId));
  }, [entries, paperFilter]);

  const selectedEntry = useMemo<SidecarEntry | null>(() => {
    if (!selectedRecord) return null;
    return entries.find((entry) => entry.record.record_id === selectedRecord.record_id) ?? null;
  }, [entries, selectedRecord]);

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              论文绑定（只读）
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              按 paper_project_id 分组的 paper_experiment_sidecar；挂载/写入路径由 paper-implementation 负责。
            </p>
          </div>
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
            <label data-ui="field">
              <span data-slot="label">paper_project_id 过滤</span>
              <input
                data-ui="input"
                data-size="sm"
                value={paperFilter}
                onChange={(event) => setPaperFilter(event.target.value)}
                placeholder="P001 / PAPER-..."
              />
            </label>
            <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void refresh()}>
              刷新
            </button>
          </div>
        </div>
        {status === 'error' && error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">
            {error}
          </p>
        ) : null}
      </section>

      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <SidecarGroupedList
            groups={grouped}
            selectedRecord={selectedRecord}
            onSelectRecord={setSelectedRecord}
          />
        </section>
        <section data-ui="section" data-padding="none">
          <SidecarDetail entry={selectedEntry} onJumpToFlowRunRecipe={onJumpToFlowRunRecipe} />
        </section>
      </div>
    </div>
  );
}

function SidecarGroupedList({
  groups,
  selectedRecord,
  onSelectRecord,
}: {
  groups: Array<{ paperProjectId: string; entries: SidecarEntry[] }>;
  selectedRecord: ExperimentFoundationStoredRecord | null;
  onSelectRecord: (record: ExperimentFoundationStoredRecord) => void;
}) {
  if (groups.length === 0) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">No paper_experiment_sidecar</p>
      </div>
    );
  }
  return (
    <div data-ui="stack" data-direction="col" data-gap="3">
      {groups.map((group) => (
        <section key={group.paperProjectId} data-ui="card" data-padding="md">
          <div data-ui="stack" data-direction="col" data-gap="2">
            <div data-ui="toolbar" data-align="between" data-wrap="wrap">
              <p data-ui="text" data-variant="label" data-tone="primary">
                paper_project_id · {shortText(group.paperProjectId, 32)}
              </p>
              <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                {group.entries.length} sidecar{group.entries.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul data-ui="list" data-variant="rows" data-density="compact">
              {group.entries.slice(0, 8).map((entry) => {
                const isSelected = selectedRecord?.record_id === entry.record.record_id;
                return (
                  <li key={entry.record.record_id}>
                    <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
                      <button
                        data-ui="button"
                        data-variant={isSelected ? 'primary' : 'ghost'}
                        data-size="sm"
                        type="button"
                        onClick={() => onSelectRecord(entry.record)}
                        title={entry.record.record_id}
                      >
                        {shortText(entry.record.record_id, 42)}
                      </button>
                      <StatusBadge value={entry.payload?.sidecar_status ?? null} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}

function SidecarDetail({
  entry,
  onJumpToFlowRunRecipe,
}: {
  entry: SidecarEntry | null;
  onJumpToFlowRunRecipe: (runRecipeId: string) => void;
}) {
  if (!entry) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">选一个 sidecar 查看 trace 链</p>
      </div>
    );
  }
  const payload = entry.payload;
  if (!payload) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">无法解析 payload</p>
      </div>
    );
  }
  return (
    <div data-ui="stack" data-direction="col" data-gap="3">
      <div data-ui="toolbar" data-align="between" data-wrap="wrap">
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="label" data-tone="primary">
            sidecar · {shortText(payload.paper_experiment_sidecar_id, 36)}
          </p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            paper_project_id {shortText(payload.paper_project_id, 32)} · status {payload.sidecar_status}
          </p>
        </div>
        <button
          data-ui="button"
          data-variant="primary"
          data-size="sm"
          type="button"
          onClick={() => onJumpToFlowRunRecipe(payload.run_recipe_ref.ref_id)}
          title={`跳到 实验流 选中 run_recipe ${payload.run_recipe_ref.ref_id}`}
        >
          跳到 实验流
        </button>
      </div>

      <RefSummary label="run_recipe_ref" refValue={payload.run_recipe_ref} hash={payload.run_recipe_hash} />
      <RefSummary
        label="dataset_version_lock_ref"
        refValue={payload.dataset_version_lock_ref}
        hash={payload.dataset_version_lock_hash}
      />
      <RefSummary
        label="evaluation_protocol_lock_ref"
        refValue={payload.evaluation_protocol_lock_ref}
        hash={payload.evaluation_protocol_hash}
      />
      <RefSummary label="benchmark_asset_ref" refValue={payload.benchmark_asset_ref} hash={null} />
      <RefSummary
        label="training_task_spec_ref"
        refValue={payload.training_task_spec_ref}
        hash={payload.training_task_spec_hash}
      />
      <RefSummary
        label="materialization_result_ref"
        refValue={payload.materialization_result_ref}
        hash={payload.materialization_result_hash}
      />
      {payload.external_job_ref ? (
        <RefSummary
          label="external_job_ref"
          refValue={payload.external_job_ref}
          hash={payload.external_job_hash ?? null}
        />
      ) : null}
      <RefListSummary
        label={`result_refs (${payload.result_refs.length})`}
        refs={payload.result_refs}
      />
      <RefListSummary
        label={`validation_report_refs (${payload.validation_report_refs.length})`}
        refs={payload.validation_report_refs}
      />
      <RefListSummary
        label={`evidence_candidate_refs (${payload.evidence_candidate_refs.length})`}
        refs={payload.evidence_candidate_refs}
      />
      <RefListSummary
        label={`evaluation_fact_refs (${payload.evaluation_fact_refs.length})`}
        refs={payload.evaluation_fact_refs}
      />
      <RefListSummary
        label={`paper_table_fact_set_refs (${payload.paper_table_fact_set_refs.length})`}
        refs={payload.paper_table_fact_set_refs}
      />

      <JsonAdvancedPanel title="完整 sidecar payload" value={payload} />
    </div>
  );
}

function RefSummary({
  label,
  refValue,
  hash,
}: {
  label: string;
  refValue: ExperimentFoundationRef;
  hash: string | null;
}) {
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">
          {label}
        </p>
        <p data-ui="text" data-variant="caption" data-tone="primary">
          {formatRef(refValue)}
        </p>
        {hash ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            hash {shortText(hash, 40)}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RefListSummary({
  label,
  refs,
}: {
  label: string;
  refs: ExperimentFoundationRef[];
}) {
  if (refs.length === 0) {
    return (
      <section data-ui="section" data-padding="none">
        <p data-ui="text" data-variant="label" data-tone="muted">
          {label}
        </p>
        <p data-ui="text" data-variant="caption" data-tone="muted">
          （空）
        </p>
      </section>
    );
  }
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">
          {label}
        </p>
        <ul data-ui="list" data-variant="plain" data-density="compact">
          {refs.slice(0, 6).map((ref, index) => (
            <li key={`${ref.ref_type}:${ref.ref_id}:${index}`}>
              <p data-ui="text" data-variant="caption" data-tone="primary">
                {formatRef(ref)}
              </p>
            </li>
          ))}
        </ul>
        {refs.length > 6 ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            +{refs.length - 6} 条未显示
          </p>
        ) : null}
      </div>
    </section>
  );
}
