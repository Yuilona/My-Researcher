import {
  EXPERIMENT_FOUNDATION_DATASET_CATALOG_STATUSES,
  type DatasetAsset,
  type ExperimentFoundationDatasetCatalogStatus,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AssetFilterToolbar } from '../components/AssetFilterToolbar';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { MutationFeedback } from '../components/MutationFeedback';
import { RefPicker, RefPickerList } from '../components/RefPicker';
import { StatusBadge } from '../components/StatusBadge';
import { StringListEditor } from '../components/StringListEditor';
import type { JsonObject } from '../types';
import { shortText, toErrorMessage } from '../utils';
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
  'dataset_asset_id',
  'name',
  'aliases',
  'description',
  'source_refs',
  'task_types',
  'schema_summary',
  'default_version_id',
  'catalog_status',
  'created_at',
  'updated_at',
]);

type Draft = {
  dataset_asset_id: string;
  name: string;
  description: string;
  aliases: string[];
  task_types: string[];
  source_refs: ExperimentFoundationRef[];
  default_version_ref: ExperimentFoundationRef | null;
  catalog_status: ExperimentFoundationDatasetCatalogStatus;
  schema_summary_json: string;
  extras: JsonObject;
};

const BLANK: Draft = {
  dataset_asset_id: '',
  name: '',
  description: '',
  aliases: [],
  task_types: [],
  source_refs: [],
  default_version_ref: null,
  catalog_status: 'registered',
  schema_summary_json: '{}',
  extras: {},
};

function derive(record: ExperimentFoundationStoredRecord): Draft {
  const payload = (record.payload ?? {}) as Record<string, unknown>;
  const extras: JsonObject = {};
  for (const key of Object.keys(payload)) {
    if (!KNOWN_FIELDS.has(key)) extras[key] = payload[key];
  }
  const defaultVersionId = asString(payload.default_version_id);
  return {
    dataset_asset_id: asString(payload.dataset_asset_id, record.record_id),
    name: asString(payload.name),
    description: asString(payload.description),
    aliases: asStringArray(payload.aliases),
    task_types: asStringArray(payload.task_types),
    source_refs: asRefArray(payload.source_refs),
    default_version_ref: defaultVersionId
      ? { ref_type: 'dataset_version', ref_id: defaultVersionId }
      : null,
    catalog_status: asEnum(
      payload.catalog_status,
      EXPERIMENT_FOUNDATION_DATASET_CATALOG_STATUSES,
      'registered',
    ),
    schema_summary_json: JSON.stringify(payload.schema_summary ?? {}, null, 2),
    extras,
  };
}

function build(draft: Draft, base: Record<string, unknown> | null): BuildResult {
  if (!draft.dataset_asset_id.trim()) {
    return { payload: {}, error: 'dataset_asset_id is required.' };
  }
  if (!draft.name.trim()) {
    return { payload: {}, error: 'name is required.' };
  }
  let schemaSummary: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(draft.schema_summary_json) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { payload: {}, error: 'schema_summary must be a JSON object.' };
    }
    schemaSummary = parsed as Record<string, unknown>;
  } catch (caught) {
    return { payload: {}, error: toErrorMessage(caught) };
  }
  const now = new Date().toISOString();
  const payload: JsonObject = {
    ...draft.extras,
    dataset_asset_id: draft.dataset_asset_id.trim(),
    name: draft.name.trim(),
    aliases: trimAndCompact(draft.aliases),
    description: draft.description.trim() ? draft.description.trim() : null,
    source_refs: draft.source_refs,
    task_types: trimAndCompact(draft.task_types),
    schema_summary: schemaSummary,
    default_version_id: draft.default_version_ref?.ref_id.trim() || null,
    catalog_status: draft.catalog_status,
    created_at: preserveCreatedAt(base),
    updated_at: now,
  };
  return { payload, error: null };
}

const HELPERS = { blank: BLANK, derive, build };

export function DatasetAssetView() {
  const {
    controller,
    draft,
    update,
    draftError,
    isEditing,
    handleNew,
    handleSave,
  } = useTypedAssetDraft<Draft>('dataset_asset', HELPERS);

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <AssetFilterToolbar controller={controller} onNew={handleNew} />
      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <DatasetAssetTable
            records={controller.records}
            selectedRecord={controller.selectedRecord}
            onSelect={controller.selectRecord}
          />
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="3">
            <p data-ui="text" data-variant="label" data-tone="primary">
              {isEditing ? '编辑 dataset_asset' : '新建 dataset_asset'}
            </p>
            <label data-ui="field">
              <span data-slot="label">dataset_asset_id *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.dataset_asset_id}
                disabled={isEditing}
                onChange={(event) => update('dataset_asset_id', event.target.value)}
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
              <span data-slot="label">catalog_status</span>
              <select
                data-ui="select"
                data-size="sm"
                value={draft.catalog_status}
                onChange={(event) =>
                  update('catalog_status', event.target.value as ExperimentFoundationDatasetCatalogStatus)
                }
              >
                {EXPERIMENT_FOUNDATION_DATASET_CATALOG_STATUSES.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <StringListEditor
              label="aliases"
              values={draft.aliases}
              onChange={(next) => update('aliases', next)}
              placeholder="alias"
            />
            <StringListEditor
              label="task_types"
              values={draft.task_types}
              onChange={(next) => update('task_types', next)}
              placeholder="task type"
            />
            <RefPickerList
              label="source_refs"
              refType="literature_record"
              values={draft.source_refs}
              onChange={(next) => update('source_refs', next)}
              helpText="证据来源（典型为 literature_record / manual_observation 等 ref）。"
            />
            <RefPicker
              label="default_version"
              refType="dataset_version"
              value={draft.default_version_ref}
              onChange={(next) => update('default_version_ref', next)}
              helpText="可留空；选中 dataset_version 时将其 ref_id 写入 default_version_id。"
            />
            <JsonAdvancedPanel
              title="schema_summary"
              value={draft.schema_summary_json}
              editable
              onChange={(next) => update('schema_summary_json', next)}
              helpText="自由 JSON 对象，描述数据集字段/列。"
            />
            {Object.keys(draft.extras).length > 0 ? (
              <JsonAdvancedPanel
                title="高级 JSON（未 typed 字段）"
                value={draft.extras}
                helpText="此处只读：本表单未覆盖的契约字段。后续 typed 完整化后会消失。"
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

function DatasetAssetTable({
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
        <p data-slot="title">No dataset_asset</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>catalog_status</th>
          <th>updated</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const payload = (record.payload ?? {}) as Partial<DatasetAsset>;
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
                  title={record.record_id}
                >
                  {shortText(record.record_id, 34)}
                </button>
              </td>
              <td>{shortText(payload.name, 30)}</td>
              <td>
                <StatusBadge value={record.status ?? payload.catalog_status ?? null} />
              </td>
              <td>{shortText(record.updated_at, 24)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
