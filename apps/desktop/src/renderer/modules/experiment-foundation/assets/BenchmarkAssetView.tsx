import {
  EXPERIMENT_FOUNDATION_BENCHMARK_CATALOG_STATUSES,
  EXPERIMENT_FOUNDATION_BENCHMARK_VERIFICATION_STATUSES,
  type ExperimentFoundationBenchmarkCatalogStatus,
  type ExperimentFoundationBenchmarkVerificationStatus,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AssetFilterToolbar } from '../components/AssetFilterToolbar';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { MutationFeedback } from '../components/MutationFeedback';
import { RefPickerList } from '../components/RefPicker';
import { StatusBadge } from '../components/StatusBadge';
import { getBenchmarkAssetPayload } from '../payloads';
import type { JsonObject } from '../types';
import { shortText } from '../utils';
import { asEnum, asRefArray, asString, preserveCreatedAt } from './asset-helpers';
import { useTypedAssetDraft, type BuildResult } from './useTypedAssetDraft';

const KNOWN_FIELDS = new Set<string>([
  'benchmark_asset_id',
  'name',
  'description',
  'task',
  'domain',
  'dataset_version_refs',
  'default_evaluation_protocol_refs',
  'source_refs',
  'community_refs',
  'catalog_status',
  'verification_status',
  'created_at',
  'updated_at',
]);

type Draft = {
  benchmark_asset_id: string;
  name: string;
  description: string;
  task: string;
  domain: string;
  dataset_version_refs: ExperimentFoundationRef[];
  default_evaluation_protocol_refs: ExperimentFoundationRef[];
  source_refs: ExperimentFoundationRef[];
  community_refs: ExperimentFoundationRef[];
  catalog_status: ExperimentFoundationBenchmarkCatalogStatus;
  verification_status: ExperimentFoundationBenchmarkVerificationStatus;
  extras: JsonObject;
};

const BLANK: Draft = {
  benchmark_asset_id: '',
  name: '',
  description: '',
  task: '',
  domain: '',
  dataset_version_refs: [],
  default_evaluation_protocol_refs: [],
  source_refs: [],
  community_refs: [],
  catalog_status: 'registered',
  verification_status: 'unknown',
  extras: {},
};

function derive(record: ExperimentFoundationStoredRecord): Draft {
  const payload = (record.payload ?? {}) as Record<string, unknown>;
  const extras: JsonObject = {};
  for (const key of Object.keys(payload)) {
    if (!KNOWN_FIELDS.has(key)) extras[key] = payload[key];
  }
  return {
    benchmark_asset_id: asString(payload.benchmark_asset_id, record.record_id),
    name: asString(payload.name),
    description: asString(payload.description),
    task: asString(payload.task),
    domain: asString(payload.domain),
    dataset_version_refs: asRefArray(payload.dataset_version_refs),
    default_evaluation_protocol_refs: asRefArray(payload.default_evaluation_protocol_refs),
    source_refs: asRefArray(payload.source_refs),
    community_refs: asRefArray(payload.community_refs),
    catalog_status: asEnum(
      payload.catalog_status,
      EXPERIMENT_FOUNDATION_BENCHMARK_CATALOG_STATUSES,
      'registered',
    ),
    verification_status: asEnum(
      payload.verification_status,
      EXPERIMENT_FOUNDATION_BENCHMARK_VERIFICATION_STATUSES,
      'unknown',
    ),
    extras,
  };
}

function build(draft: Draft, base: Record<string, unknown> | null): BuildResult {
  if (!draft.benchmark_asset_id.trim()) {
    return { payload: {}, error: 'benchmark_asset_id is required.' };
  }
  if (!draft.name.trim()) {
    return { payload: {}, error: 'name is required.' };
  }
  if (!draft.task.trim()) {
    return { payload: {}, error: 'task is required.' };
  }
  if (!draft.domain.trim()) {
    return { payload: {}, error: 'domain is required.' };
  }
  const now = new Date().toISOString();
  const payload: JsonObject = {
    ...draft.extras,
    benchmark_asset_id: draft.benchmark_asset_id.trim(),
    name: draft.name.trim(),
    description: draft.description.trim() ? draft.description.trim() : null,
    task: draft.task.trim(),
    domain: draft.domain.trim(),
    dataset_version_refs: draft.dataset_version_refs,
    default_evaluation_protocol_refs: draft.default_evaluation_protocol_refs,
    source_refs: draft.source_refs,
    community_refs: draft.community_refs,
    catalog_status: draft.catalog_status,
    verification_status: draft.verification_status,
    created_at: preserveCreatedAt(base),
    updated_at: now,
  };
  return { payload, error: null };
}

const HELPERS = { blank: BLANK, derive, build };

export function BenchmarkAssetView() {
  const { controller, draft, update, draftError, isEditing, handleNew, handleSave } =
    useTypedAssetDraft<Draft>('benchmark_asset', HELPERS);

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <AssetFilterToolbar controller={controller} onNew={handleNew} />
      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <BenchmarkAssetTable
            records={controller.records}
            selectedRecord={controller.selectedRecord}
            onSelect={controller.selectRecord}
          />
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="3">
            <p data-ui="text" data-variant="label" data-tone="primary">
              {isEditing ? '编辑 benchmark_asset' : '新建 benchmark_asset'}
            </p>
            <label data-ui="field">
              <span data-slot="label">benchmark_asset_id *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.benchmark_asset_id}
                disabled={isEditing}
                onChange={(event) => update('benchmark_asset_id', event.target.value)}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">name *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.name}
                onChange={(event) => update('name', event.target.value)}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">task *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.task}
                onChange={(event) => update('task', event.target.value)}
                placeholder="text_classification / qa / ..."
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">domain *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.domain}
                onChange={(event) => update('domain', event.target.value)}
                placeholder="news / biomedical / ..."
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">description</span>
              <textarea
                data-ui="textarea"
                data-size="sm"
                rows={3}
                value={draft.description}
                onChange={(event) => update('description', event.target.value)}
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">catalog_status *</span>
              <select
                data-ui="select"
                data-size="sm"
                value={draft.catalog_status}
                onChange={(event) =>
                  update('catalog_status', event.target.value as ExperimentFoundationBenchmarkCatalogStatus)
                }
              >
                {EXPERIMENT_FOUNDATION_BENCHMARK_CATALOG_STATUSES.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label data-ui="field">
              <span data-slot="label">verification_status *</span>
              <select
                data-ui="select"
                data-size="sm"
                value={draft.verification_status}
                onChange={(event) =>
                  update(
                    'verification_status',
                    event.target.value as ExperimentFoundationBenchmarkVerificationStatus,
                  )
                }
              >
                {EXPERIMENT_FOUNDATION_BENCHMARK_VERIFICATION_STATUSES.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <RefPickerList
              label="dataset_version_refs"
              refType="dataset_version"
              allowedRefTypes={['dataset_version']}
              values={draft.dataset_version_refs}
              onChange={(next) => update('dataset_version_refs', next)}
              helpText="benchmark 引用哪些 dataset_version。"
            />
            <RefPickerList
              label="default_evaluation_protocol_refs"
              refType="evaluation_protocol"
              allowedRefTypes={['evaluation_protocol']}
              values={draft.default_evaluation_protocol_refs}
              onChange={(next) => update('default_evaluation_protocol_refs', next)}
              helpText="该 benchmark 的默认评测协议。"
            />
            <RefPickerList
              label="source_refs"
              refType="literature_record"
              values={draft.source_refs}
              onChange={(next) => update('source_refs', next)}
              helpText="证据来源。"
            />
            <RefPickerList
              label="community_refs"
              refType="external_link"
              values={draft.community_refs}
              onChange={(next) => update('community_refs', next)}
              helpText="社区/leaderboard 链接（自由 ref_type）。"
            />
            {Object.keys(draft.extras).length > 0 ? (
              <JsonAdvancedPanel
                title="高级 JSON（未 typed 字段）"
                value={draft.extras}
                helpText="此处只读：本表单未覆盖的契约字段。"
              />
            ) : null}
            {draftError ? (
              <p data-ui="text" data-variant="caption" data-tone="danger">
                {draftError}
              </p>
            ) : null}
            <div data-ui="toolbar" data-align="end" data-wrap="wrap">
              <button data-ui="button" data-variant="primary" data-size="sm" type="button" onClick={() => void handleSave()}>
                {isEditing ? '覆盖写入' : '创建'}
              </button>
            </div>
            <MutationFeedback status={controller.mutationStatus} message={controller.mutationMessage} />
          </div>
        </section>
      </div>
    </div>
  );
}

function BenchmarkAssetTable({
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
        <p data-slot="title">No benchmark_asset</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>task</th>
          <th>verification</th>
          <th>updated</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const payload = getBenchmarkAssetPayload(record);
          const isSelected =
            selectedRecord?.record_kind === record.record_kind &&
            selectedRecord.record_id === record.record_id;
          return (
            <tr key={`${record.record_kind}:${record.record_id}`}>
              <td>
                <button
                  data-ui="button"
                  data-variant={isSelected ? 'primary' : 'ghost'}
                  data-size="sm"
                  type="button"
                  onClick={() => onSelect(record)}
                  title={record.record_id}
                >
                  {shortText(record.record_id, 28)}
                </button>
              </td>
              <td>{shortText(payload?.name, 24)}</td>
              <td>{shortText(payload?.task, 16)}</td>
              <td>
                <StatusBadge value={payload?.verification_status ?? null} />
              </td>
              <td>{shortText(record.updated_at, 24)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
