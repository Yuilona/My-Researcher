import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EXPERIMENT_FOUNDATION_DATASET_CATALOG_STATUSES,
  type DatasetAsset,
  type ExperimentFoundationDatasetCatalogStatus,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { RefPicker, RefPickerList } from '../components/RefPicker';
import { StatusBadge } from '../components/StatusBadge';
import type { JsonObject } from '../types';
import { shortText } from '../utils';
import { useAssetKindController } from './useAssetKindController';

const KNOWN_DATASET_ASSET_FIELDS = new Set<string>([
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

type DatasetAssetDraft = {
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

const BLANK_DRAFT: DatasetAssetDraft = {
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

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function asRefArray(value: unknown): ExperimentFoundationRef[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: ExperimentFoundationRef[] = [];
  for (const entry of value) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const candidate = entry as Record<string, unknown>;
      const refType = candidate.ref_type;
      const refId = candidate.ref_id;
      if (typeof refType === 'string' && typeof refId === 'string') {
        out.push({ ref_type: refType, ref_id: refId });
      }
    }
  }
  return out;
}

function deriveDraftFromRecord(record: ExperimentFoundationStoredRecord): DatasetAssetDraft {
  const payload = (record.payload ?? {}) as Record<string, unknown>;
  const extras: JsonObject = {};
  for (const key of Object.keys(payload)) {
    if (!KNOWN_DATASET_ASSET_FIELDS.has(key)) {
      extras[key] = payload[key];
    }
  }
  const defaultVersionId = asString(payload.default_version_id, '');
  return {
    dataset_asset_id: asString(payload.dataset_asset_id, record.record_id),
    name: asString(payload.name, ''),
    description: asString(payload.description, ''),
    aliases: asStringArray(payload.aliases),
    task_types: asStringArray(payload.task_types),
    source_refs: asRefArray(payload.source_refs),
    default_version_ref: defaultVersionId
      ? { ref_type: 'dataset_version', ref_id: defaultVersionId }
      : null,
    catalog_status:
      (EXPERIMENT_FOUNDATION_DATASET_CATALOG_STATUSES as readonly string[]).includes(asString(payload.catalog_status))
        ? (payload.catalog_status as ExperimentFoundationDatasetCatalogStatus)
        : 'registered',
    schema_summary_json: JSON.stringify(payload.schema_summary ?? {}, null, 2),
    extras,
  };
}

function buildPayloadFromDraft(
  draft: DatasetAssetDraft,
  basePayload: Record<string, unknown> | null,
): { payload: JsonObject; error: string | null } {
  const now = new Date().toISOString();
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
    return { payload: {}, error: caught instanceof Error ? caught.message : String(caught) };
  }
  const payload: JsonObject = {
    ...draft.extras,
    dataset_asset_id: draft.dataset_asset_id.trim(),
    name: draft.name.trim(),
    aliases: draft.aliases.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    description: draft.description.trim() ? draft.description.trim() : null,
    source_refs: draft.source_refs,
    task_types: draft.task_types.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
    schema_summary: schemaSummary,
    default_version_id: draft.default_version_ref?.ref_id?.trim() || null,
    catalog_status: draft.catalog_status,
    created_at: asString(basePayload?.created_at, now),
    updated_at: now,
  };
  return { payload, error: null };
}

export function DatasetAssetView() {
  const controller = useAssetKindController('dataset_asset');
  const [draft, setDraft] = useState<DatasetAssetDraft>(BLANK_DRAFT);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);
  // Track the previously seen record_id so that refresh-induced reference changes
  // on the SAME record do not overwrite the user's in-progress edits. Only
  // switching to a different record_id (or clearing) re-derives the draft.
  const previousRecordIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentRecordId = controller.selectedRecord?.record_id ?? null;
    if (currentRecordId === previousRecordIdRef.current) {
      return;
    }
    previousRecordIdRef.current = currentRecordId;
    if (controller.selectedRecord) {
      setDraft(deriveDraftFromRecord(controller.selectedRecord));
      setIsEditingExisting(true);
      setDraftError(null);
    }
  }, [controller.selectedRecord]);

  const basePayload = useMemo<Record<string, unknown> | null>(() => {
    if (!isEditingExisting || !controller.selectedRecord) {
      return null;
    }
    return (controller.selectedRecord.payload ?? {}) as Record<string, unknown>;
  }, [isEditingExisting, controller.selectedRecord]);

  const updateDraft = useCallback(<K extends keyof DatasetAssetDraft>(key: K, value: DatasetAssetDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDraftError(null);
  }, []);

  const handleNewDraft = useCallback(() => {
    setDraft(BLANK_DRAFT);
    setIsEditingExisting(false);
    setDraftError(null);
    controller.selectRecord(null);
  }, [controller]);

  const handleSave = useCallback(async () => {
    const built = buildPayloadFromDraft(draft, basePayload);
    if (built.error) {
      setDraftError(built.error);
      return;
    }
    if (isEditingExisting && controller.selectedRecord) {
      await controller.upsertRecord(controller.selectedRecord.record_id, built.payload);
    } else {
      const created = await controller.createRecord(built.payload);
      if (created) {
        setIsEditingExisting(true);
      }
    }
  }, [basePayload, controller, draft, isEditingExisting]);

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
            <label data-ui="field">
              <span data-slot="label">status filter</span>
              <input
                data-ui="input"
                data-size="sm"
                value={controller.filters.status}
                onChange={(event) =>
                  controller.setFilters((current) => ({ ...current, status: event.target.value }))
                }
              />
            </label>
          </div>
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
            <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.refresh()}>
              刷新
            </button>
            <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={handleNewDraft}>
              新建
            </button>
          </div>
        </div>
        {controller.status === 'error' && controller.error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">
            {controller.error}
          </p>
        ) : null}
      </section>

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
              {isEditingExisting ? '编辑 dataset_asset' : '新建 dataset_asset'}
            </p>

            <label data-ui="field">
              <span data-slot="label">dataset_asset_id *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.dataset_asset_id}
                disabled={isEditingExisting}
                onChange={(event) => updateDraft('dataset_asset_id', event.target.value)}
              />
            </label>

            <label data-ui="field">
              <span data-slot="label">name *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.name}
                onChange={(event) => updateDraft('name', event.target.value)}
              />
            </label>

            <label data-ui="field">
              <span data-slot="label">description</span>
              <textarea
                data-ui="textarea"
                data-size="sm"
                rows={3}
                value={draft.description}
                onChange={(event) => updateDraft('description', event.target.value)}
              />
            </label>

            <label data-ui="field">
              <span data-slot="label">catalog_status</span>
              <select
                data-ui="select"
                data-size="sm"
                value={draft.catalog_status}
                onChange={(event) =>
                  updateDraft('catalog_status', event.target.value as ExperimentFoundationDatasetCatalogStatus)
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
              onChange={(next) => updateDraft('aliases', next)}
              placeholder="alias"
            />

            <StringListEditor
              label="task_types"
              values={draft.task_types}
              onChange={(next) => updateDraft('task_types', next)}
              placeholder="task type"
            />

            <RefPickerList
              label="source_refs"
              refType="literature_record"
              values={draft.source_refs}
              onChange={(next) => updateDraft('source_refs', next)}
              helpText="证据来源（典型为 literature_record / manual_observation 等 ref）。"
            />

            <RefPicker
              label="default_version"
              refType="dataset_version"
              value={draft.default_version_ref}
              onChange={(next) => updateDraft('default_version_ref', next)}
              helpText="可留空；选中 dataset_version 时将其 ref_id 写入 default_version_id。"
            />

            <JsonAdvancedPanel
              title="schema_summary"
              value={draft.schema_summary_json}
              editable
              onChange={(next) => updateDraft('schema_summary_json', next)}
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
                {isEditingExisting ? '覆盖写入' : '创建'}
              </button>
            </div>

            {controller.mutationStatus === 'success' && controller.mutationMessage ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                {controller.mutationMessage}
              </p>
            ) : null}
            {controller.mutationStatus === 'error' && controller.mutationMessage ? (
              <p data-ui="text" data-variant="caption" data-tone="danger">
                {controller.mutationMessage}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const handleItemChange = (index: number, next: string) => {
    const draft = [...values];
    draft[index] = next;
    onChange(draft);
  };
  const handleAdd = () => onChange([...values, '']);
  const handleRemove = (index: number) => {
    const draft = [...values];
    draft.splice(index, 1);
    onChange(draft);
  };
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <p data-ui="text" data-variant="label" data-tone="primary">
            {label}
          </p>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={handleAdd}>
            添加
          </button>
        </div>
        {values.length === 0 ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            （空）
          </p>
        ) : (
          values.map((value, index) => (
            <div key={index} data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
              <input
                data-ui="input"
                data-size="sm"
                placeholder={placeholder}
                value={value}
                onChange={(event) => handleItemChange(index, event.target.value)}
              />
              <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={() => handleRemove(index)}>
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </section>
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
