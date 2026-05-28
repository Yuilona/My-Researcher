import { useEffect, useRef, useState } from 'react';
import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { StatusBadge } from '../components/StatusBadge';
import type { JsonObject } from '../types';
import {
  emptyObjectJson,
  formatRefList,
  parseJsonObject,
  prettyJson,
  shortText,
} from '../utils';
import { useAssetKindController } from './useAssetKindController';

type GenericAssetKindViewProps = {
  recordKind: ExperimentFoundationRecordKind;
  description?: string;
};

export function GenericAssetKindView({ recordKind, description }: GenericAssetKindViewProps) {
  const controller = useAssetKindController(recordKind);
  const [draftRecordId, setDraftRecordId] = useState<string>('');
  const [draftPayload, setDraftPayload] = useState<string>(emptyObjectJson);
  const [draftError, setDraftError] = useState<string | null>(null);
  const previousRecordIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentRecordId = controller.selectedRecord?.record_id ?? null;
    if (currentRecordId === previousRecordIdRef.current) {
      return;
    }
    previousRecordIdRef.current = currentRecordId;
    if (controller.selectedRecord) {
      setDraftRecordId(controller.selectedRecord.record_id);
      setDraftPayload(prettyJson(controller.selectedRecord.payload));
      setDraftError(null);
    }
  }, [controller.selectedRecord]);

  // Reset draft when sub-tab changes.
  useEffect(() => {
    setDraftRecordId('');
    setDraftPayload(emptyObjectJson);
    setDraftError(null);
  }, [recordKind]);

  function handlePayloadChange(next: string) {
    setDraftPayload(next);
    setDraftError(null);
  }

  function parseDraftPayload(): JsonObject | null {
    try {
      return parseJsonObject(draftPayload);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async function handleCreate() {
    const payload = parseDraftPayload();
    if (!payload) {
      return;
    }
    await controller.createRecord(payload);
  }

  async function handleUpsert() {
    const payload = parseDraftPayload();
    if (!payload) {
      return;
    }
    await controller.upsertRecord(draftRecordId.trim(), payload);
  }

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      {description ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          {description}
        </p>
      ) : null}
      <section data-ui="section" data-padding="none">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
            <label data-ui="field">
              <span data-slot="label">status</span>
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
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.refresh()}>
            刷新
          </button>
        </div>
        {controller.status === 'error' && controller.error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">
            {controller.error}
          </p>
        ) : null}
      </section>

      <div data-ui="grid" data-cols="2" data-gap="4">
        <section data-ui="section" data-padding="none">
          <RecordTable
            records={controller.records}
            selectedRecord={controller.selectedRecord}
            onSelect={controller.selectRecord}
          />
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="3">
            <div data-ui="toolbar" data-align="between" data-wrap="wrap">
              <label data-ui="field">
                <span data-slot="label">record_id</span>
                <input
                  data-ui="input"
                  data-size="sm"
                  value={draftRecordId}
                  onChange={(event) => setDraftRecordId(event.target.value)}
                />
              </label>
              <div data-ui="stack" data-direction="row" data-gap="2">
                <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void handleCreate()}>
                  创建
                </button>
                <button data-ui="button" data-variant="primary" data-size="sm" type="button" onClick={() => void handleUpsert()}>
                  覆盖写入
                </button>
              </div>
            </div>
            <JsonAdvancedPanel
              title="payload JSON"
              value={draftPayload}
              editable
              onChange={handlePayloadChange}
              helpText={`record_kind = ${recordKind}；S1 该资产暂用契约 JSON 写入，typed 表单将在 S3 落地。`}
            />
            {draftError ? (
              <p data-ui="text" data-variant="caption" data-tone="danger">
                {draftError}
              </p>
            ) : null}
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
          <th>record_id</th>
          <th>status</th>
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
                  title={record.record_id}
                >
                  {shortText(record.record_id, 44)}
                </button>
              </td>
              <td>
                <StatusBadge value={record.status} />
              </td>
              <td>{shortText(formatRefList(record.traceability_refs), 38)}</td>
              <td>{shortText(record.updated_at, 24)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
