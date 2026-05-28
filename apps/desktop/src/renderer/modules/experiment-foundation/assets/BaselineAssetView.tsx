import {
  EXPERIMENT_FOUNDATION_BASELINE_CATALOG_STATUSES,
  EXPERIMENT_FOUNDATION_BASELINE_FAMILIES,
  type ExperimentFoundationBaselineCatalogStatus,
  type ExperimentFoundationBaselineFamily,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AssetFilterToolbar } from '../components/AssetFilterToolbar';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { MutationFeedback } from '../components/MutationFeedback';
import { RefPickerList } from '../components/RefPicker';
import { StatusBadge } from '../components/StatusBadge';
import { StringListEditor } from '../components/StringListEditor';
import { getBaselineAssetPayload } from '../payloads';
import type { JsonObject } from '../types';
import { shortText } from '../utils';
import {
  asEnum,
  asRefArray,
  asString,
  asStringArray,
  preserveCreatedAt,
  trimAndCompact,
} from './asset-helpers';
import { useTypedAssetDraft, type BuildResult } from './useTypedAssetDraft';

const KNOWN_FIELDS = new Set<string>([
  'baseline_asset_id',
  'name',
  'aliases',
  'description',
  'baseline_family',
  'source_refs',
  'supported_benchmark_refs',
  'recommended_use',
  'catalog_status',
  'created_at',
  'updated_at',
]);

type Draft = {
  baseline_asset_id: string;
  name: string;
  aliases: string[];
  description: string;
  baseline_family: ExperimentFoundationBaselineFamily;
  source_refs: ExperimentFoundationRef[];
  supported_benchmark_refs: ExperimentFoundationRef[];
  recommended_use: string;
  catalog_status: ExperimentFoundationBaselineCatalogStatus;
  extras: JsonObject;
};

const BLANK: Draft = {
  baseline_asset_id: '',
  name: '',
  aliases: [],
  description: '',
  baseline_family: 'method',
  source_refs: [],
  supported_benchmark_refs: [],
  recommended_use: '',
  catalog_status: 'registered',
  extras: {},
};

function derive(record: ExperimentFoundationStoredRecord): Draft {
  const payload = (record.payload ?? {}) as Record<string, unknown>;
  const extras: JsonObject = {};
  for (const key of Object.keys(payload)) {
    if (!KNOWN_FIELDS.has(key)) extras[key] = payload[key];
  }
  return {
    baseline_asset_id: asString(payload.baseline_asset_id, record.record_id),
    name: asString(payload.name),
    aliases: asStringArray(payload.aliases),
    description: asString(payload.description),
    baseline_family: asEnum(payload.baseline_family, EXPERIMENT_FOUNDATION_BASELINE_FAMILIES, 'method'),
    source_refs: asRefArray(payload.source_refs),
    supported_benchmark_refs: asRefArray(payload.supported_benchmark_refs),
    recommended_use: asString(payload.recommended_use),
    catalog_status: asEnum(
      payload.catalog_status,
      EXPERIMENT_FOUNDATION_BASELINE_CATALOG_STATUSES,
      'registered',
    ),
    extras,
  };
}

function build(draft: Draft, base: Record<string, unknown> | null): BuildResult {
  if (!draft.baseline_asset_id.trim()) {
    return { payload: {}, error: 'baseline_asset_id is required.' };
  }
  if (!draft.name.trim()) {
    return { payload: {}, error: 'name is required.' };
  }
  const now = new Date().toISOString();
  const payload: JsonObject = {
    ...draft.extras,
    baseline_asset_id: draft.baseline_asset_id.trim(),
    name: draft.name.trim(),
    aliases: trimAndCompact(draft.aliases),
    description: draft.description.trim() ? draft.description.trim() : null,
    baseline_family: draft.baseline_family,
    source_refs: draft.source_refs,
    supported_benchmark_refs: draft.supported_benchmark_refs,
    recommended_use: draft.recommended_use.trim() ? draft.recommended_use.trim() : null,
    catalog_status: draft.catalog_status,
    created_at: preserveCreatedAt(base),
    updated_at: now,
  };
  return { payload, error: null };
}

const HELPERS = { blank: BLANK, derive, build };

export function BaselineAssetView() {
  const { controller, draft, update, draftError, isEditing, handleNew, handleSave } =
    useTypedAssetDraft<Draft>('baseline_asset', HELPERS);

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <AssetFilterToolbar controller={controller} onNew={handleNew} />
      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <BaselineAssetTable
            records={controller.records}
            selectedRecord={controller.selectedRecord}
            onSelect={controller.selectRecord}
          />
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="3">
            <p data-ui="text" data-variant="label" data-tone="primary">
              {isEditing ? '编辑 baseline_asset' : '新建 baseline_asset'}
            </p>
            <label data-ui="field">
              <span data-slot="label">baseline_asset_id *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.baseline_asset_id}
                disabled={isEditing}
                onChange={(event) => update('baseline_asset_id', event.target.value)}
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
              <span data-slot="label">baseline_family *</span>
              <select
                data-ui="select"
                data-size="sm"
                value={draft.baseline_family}
                onChange={(event) =>
                  update('baseline_family', event.target.value as ExperimentFoundationBaselineFamily)
                }
              >
                {EXPERIMENT_FOUNDATION_BASELINE_FAMILIES.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label data-ui="field">
              <span data-slot="label">catalog_status *</span>
              <select
                data-ui="select"
                data-size="sm"
                value={draft.catalog_status}
                onChange={(event) =>
                  update(
                    'catalog_status',
                    event.target.value as ExperimentFoundationBaselineCatalogStatus,
                  )
                }
              >
                {EXPERIMENT_FOUNDATION_BASELINE_CATALOG_STATUSES.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label data-ui="field">
              <span data-slot="label">recommended_use</span>
              <textarea
                data-ui="textarea"
                data-size="sm"
                rows={2}
                value={draft.recommended_use}
                onChange={(event) => update('recommended_use', event.target.value)}
              />
            </label>
            <StringListEditor
              label="aliases"
              values={draft.aliases}
              onChange={(next) => update('aliases', next)}
              placeholder="alias"
            />
            <RefPickerList
              label="source_refs"
              refType="literature_record"
              values={draft.source_refs}
              onChange={(next) => update('source_refs', next)}
              helpText="证据来源（文献 / 手动观察）。"
            />
            <RefPickerList
              label="supported_benchmark_refs"
              refType="benchmark_asset"
              allowedRefTypes={['benchmark_asset']}
              values={draft.supported_benchmark_refs}
              onChange={(next) => update('supported_benchmark_refs', next)}
              helpText="该基线在哪些 benchmark 上经过验证。"
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

function BaselineAssetTable({
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
        <p data-slot="title">No baseline_asset</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>family</th>
          <th>catalog</th>
          <th>updated</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const payload = getBaselineAssetPayload(record);
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
                  {shortText(record.record_id, 30)}
                </button>
              </td>
              <td>{shortText(payload?.name, 26)}</td>
              <td>{payload?.baseline_family ?? '--'}</td>
              <td>
                <StatusBadge value={record.status ?? payload?.catalog_status ?? null} />
              </td>
              <td>{shortText(record.updated_at, 24)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
