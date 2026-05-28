import { useCallback } from 'react';
import type {
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { AssetFilterToolbar } from '../components/AssetFilterToolbar';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { MutationFeedback } from '../components/MutationFeedback';
import { RefPicker, RefPickerList } from '../components/RefPicker';
import { StatusBadge } from '../components/StatusBadge';
import { getEvaluationProtocolPayload } from '../payloads';
import type { JsonObject } from '../types';
import { shortText, toErrorMessage } from '../utils';
import { asRefArray, asString, preserveCreatedAt } from './asset-helpers';
import { useTypedAssetDraft, type BuildResult } from './useTypedAssetDraft';

const CONFIG_FIELDS = [
  'aggregation',
  'seed_policy',
  'repeat_policy',
  'reporting_protocol',
  'comparison_policy',
  'statistical_protocol',
  'budget_fairness_policy',
  'tuning_fairness_policy',
] as const;
type ConfigField = (typeof CONFIG_FIELDS)[number];

const KNOWN_FIELDS = new Set<string>([
  'evaluation_protocol_id',
  'benchmark_asset_id',
  'protocol_version',
  'protocol_hash',
  'metric_definition_refs',
  'evaluator_refs',
  'created_at',
  'updated_at',
  ...CONFIG_FIELDS,
]);

type Draft = {
  evaluation_protocol_id: string;
  benchmark_asset_ref: ExperimentFoundationRef | null;
  protocol_version: string;
  protocol_hash: string;
  metric_definition_refs: ExperimentFoundationRef[];
  evaluator_refs: ExperimentFoundationRef[];
  configs: Record<ConfigField, string>;
  extras: JsonObject;
};

function blankConfigs(): Record<ConfigField, string> {
  const out = {} as Record<ConfigField, string>;
  for (const key of CONFIG_FIELDS) out[key] = '{}';
  return out;
}

const BLANK: Draft = {
  evaluation_protocol_id: '',
  benchmark_asset_ref: null,
  protocol_version: '',
  protocol_hash: '',
  metric_definition_refs: [],
  evaluator_refs: [],
  configs: blankConfigs(),
  extras: {},
};

function derive(record: ExperimentFoundationStoredRecord): Draft {
  const payload = (record.payload ?? {}) as Record<string, unknown>;
  const extras: JsonObject = {};
  for (const key of Object.keys(payload)) {
    if (!KNOWN_FIELDS.has(key)) extras[key] = payload[key];
  }
  const configs = blankConfigs();
  for (const key of CONFIG_FIELDS) {
    const raw = payload[key];
    configs[key] = raw === undefined ? '{}' : JSON.stringify(raw ?? {}, null, 2);
  }
  const benchmarkAssetId = asString(payload.benchmark_asset_id);
  return {
    evaluation_protocol_id: asString(payload.evaluation_protocol_id, record.record_id),
    benchmark_asset_ref: benchmarkAssetId
      ? { ref_type: 'benchmark_asset', ref_id: benchmarkAssetId }
      : null,
    protocol_version: asString(payload.protocol_version),
    protocol_hash: asString(payload.protocol_hash),
    metric_definition_refs: asRefArray(payload.metric_definition_refs),
    evaluator_refs: asRefArray(payload.evaluator_refs),
    configs,
    extras,
  };
}

function build(draft: Draft, base: Record<string, unknown> | null): BuildResult {
  if (!draft.evaluation_protocol_id.trim()) {
    return { payload: {}, error: 'evaluation_protocol_id is required.' };
  }
  if (!draft.benchmark_asset_ref || !draft.benchmark_asset_ref.ref_id.trim()) {
    return { payload: {}, error: 'benchmark_asset_ref is required.' };
  }
  if (!draft.protocol_version.trim()) {
    return { payload: {}, error: 'protocol_version is required.' };
  }
  if (!draft.protocol_hash.trim()) {
    return { payload: {}, error: 'protocol_hash is required.' };
  }
  const parsedConfigs: Record<string, unknown> = {};
  for (const key of CONFIG_FIELDS) {
    try {
      const parsed = JSON.parse(draft.configs[key]) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { payload: {}, error: `${key} must be a JSON object.` };
      }
      parsedConfigs[key] = parsed;
    } catch (caught) {
      return {
        payload: {},
        error: `${key}: ${toErrorMessage(caught)}`,
      };
    }
  }
  const now = new Date().toISOString();
  const payload: JsonObject = {
    ...draft.extras,
    evaluation_protocol_id: draft.evaluation_protocol_id.trim(),
    benchmark_asset_id: draft.benchmark_asset_ref.ref_id.trim(),
    protocol_version: draft.protocol_version.trim(),
    protocol_hash: draft.protocol_hash.trim(),
    metric_definition_refs: draft.metric_definition_refs,
    evaluator_refs: draft.evaluator_refs,
    ...parsedConfigs,
    created_at: preserveCreatedAt(base),
    updated_at: now,
  };
  return { payload, error: null };
}

const HELPERS = { blank: BLANK, derive, build };

export function EvaluationProtocolView() {
  const { controller, draft, update, draftError, isEditing, handleNew, handleSave } =
    useTypedAssetDraft<Draft>('evaluation_protocol', HELPERS);

  const updateConfig = useCallback(
    (field: ConfigField, nextJson: string) => {
      update('configs', { ...draft.configs, [field]: nextJson });
    },
    [draft.configs, update],
  );

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <AssetFilterToolbar controller={controller} onNew={handleNew} />
      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <EvaluationProtocolTable
            records={controller.records}
            selectedRecord={controller.selectedRecord}
            onSelect={controller.selectRecord}
          />
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="3">
            <p data-ui="text" data-variant="label" data-tone="primary">
              {isEditing ? '编辑 evaluation_protocol' : '新建 evaluation_protocol'}
            </p>
            <label data-ui="field">
              <span data-slot="label">evaluation_protocol_id *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.evaluation_protocol_id}
                disabled={isEditing}
                onChange={(event) => update('evaluation_protocol_id', event.target.value)}
              />
            </label>
            <RefPicker
              label="benchmark_asset"
              refType="benchmark_asset"
              allowedRefTypes={['benchmark_asset']}
              value={draft.benchmark_asset_ref}
              onChange={(next) => update('benchmark_asset_ref', next)}
              required
              helpText="该协议属于哪个 benchmark。"
            />
            <label data-ui="field">
              <span data-slot="label">protocol_version *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.protocol_version}
                onChange={(event) => update('protocol_version', event.target.value)}
                placeholder="v1 / v2.1 / ..."
              />
            </label>
            <label data-ui="field">
              <span data-slot="label">protocol_hash *</span>
              <input
                data-ui="input"
                data-size="sm"
                value={draft.protocol_hash}
                onChange={(event) => update('protocol_hash', event.target.value)}
                placeholder="sha256:..."
              />
            </label>
            <RefPickerList
              label="metric_definition_refs"
              refType="metric_definition"
              allowedRefTypes={['metric_definition']}
              values={draft.metric_definition_refs}
              onChange={(next) => update('metric_definition_refs', next)}
              helpText="该协议要算哪些指标。"
            />
            <RefPickerList
              label="evaluator_refs"
              refType="evaluator"
              values={draft.evaluator_refs}
              onChange={(next) => update('evaluator_refs', next)}
              helpText="评测器引用（自由 ref_type）。"
            />
            {CONFIG_FIELDS.map((field) => (
              <JsonAdvancedPanel
                key={field}
                title={field}
                value={draft.configs[field]}
                editable
                onChange={(next) => updateConfig(field, next)}
                helpText={`${field} 自由 JSON 对象。`}
              />
            ))}
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

function EvaluationProtocolTable({
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
        <p data-slot="title">No evaluation_protocol</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>id</th>
          <th>version</th>
          <th>benchmark</th>
          <th>status</th>
          <th>updated</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const payload = getEvaluationProtocolPayload(record);
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
              <td>{shortText(payload?.protocol_version, 12)}</td>
              <td>{shortText(payload?.benchmark_asset_id, 26)}</td>
              <td>
                <StatusBadge value={record.status} />
              </td>
              <td>{shortText(record.updated_at, 24)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
