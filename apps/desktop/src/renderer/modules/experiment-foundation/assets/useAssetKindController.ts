import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import {
  createExperimentFoundationRecord,
  listExperimentFoundationRecords,
  upsertExperimentFoundationRecord,
} from '../api';
import type { ExperimentFoundationOperationStatus, JsonObject } from '../types';
import { toErrorMessage } from '../utils';

export type AssetKindFilters = {
  status: string;
};

const INITIAL_FILTERS: AssetKindFilters = { status: '' };

export type AssetKindController = {
  recordKind: ExperimentFoundationRecordKind;
  filters: AssetKindFilters;
  setFilters: (next: AssetKindFilters | ((current: AssetKindFilters) => AssetKindFilters)) => void;
  records: ExperimentFoundationStoredRecord[];
  selectedRecord: ExperimentFoundationStoredRecord | null;
  selectRecord: (record: ExperimentFoundationStoredRecord | null) => void;
  status: ExperimentFoundationOperationStatus;
  error: string | null;
  refresh: () => Promise<void>;
  mutationStatus: ExperimentFoundationOperationStatus;
  mutationMessage: string;
  createRecord: (payload: JsonObject) => Promise<ExperimentFoundationStoredRecord | null>;
  upsertRecord: (recordId: string, payload: JsonObject) => Promise<ExperimentFoundationStoredRecord | null>;
};

export function useAssetKindController(recordKind: ExperimentFoundationRecordKind): AssetKindController {
  const [filters, setFiltersState] = useState<AssetKindFilters>(INITIAL_FILTERS);
  const [records, setRecords] = useState<ExperimentFoundationStoredRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExperimentFoundationStoredRecord | null>(null);
  const [status, setStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [mutationMessage, setMutationMessage] = useState<string>('');

  // Hold a ref to the latest filters so that refresh() can read current values
  // without making `filters.status` a useCallback dependency (which would re-fire
  // the fetch on every keystroke in the filter input).
  const filtersRef = useRef<AssetKindFilters>(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const setFilters = useCallback(
    (next: AssetKindFilters | ((current: AssetKindFilters) => AssetKindFilters)) => {
      setFiltersState((current) => (typeof next === 'function' ? next(current) : next));
    },
    [],
  );

  // Reset selection when record kind switches.
  useEffect(() => {
    setSelectedRecord(null);
    setMutationStatus('idle');
    setMutationMessage('');
    setFiltersState(INITIAL_FILTERS);
  }, [recordKind]);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await listExperimentFoundationRecords({
        recordKind,
        status: filtersRef.current.status,
        family: '',
        parentRecordId: '',
        ownerRefId: '',
      });
      setRecords(response.records);
      setStatus('success');
      setSelectedRecord((current) => {
        if (!current) {
          return response.records[0] ?? null;
        }
        return (
          response.records.find(
            (record) => record.record_kind === current.record_kind && record.record_id === current.record_id,
          ) ?? response.records[0] ?? null
        );
      });
    } catch (caught) {
      setStatus('error');
      setError(toErrorMessage(caught));
    }
  }, [recordKind]);

  // Auto-fetch when the kind changes; manual refresh handles filter edits.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectRecord = useCallback((record: ExperimentFoundationStoredRecord | null) => {
    setSelectedRecord(record);
    setMutationStatus('idle');
    setMutationMessage('');
  }, []);

  const createRecord = useCallback(
    async (payload: JsonObject) => {
      setMutationStatus('loading');
      setMutationMessage('');
      try {
        const created = await createExperimentFoundationRecord(recordKind, payload);
        setMutationStatus('success');
        setMutationMessage(`created ${created.record_kind}:${created.record_id}`);
        await refresh();
        setSelectedRecord(created);
        return created;
      } catch (caught) {
        setMutationStatus('error');
        setMutationMessage(toErrorMessage(caught));
        return null;
      }
    },
    [recordKind, refresh],
  );

  const upsertRecord = useCallback(
    async (recordId: string, payload: JsonObject) => {
      if (!recordId.trim()) {
        setMutationStatus('error');
        setMutationMessage('record_id is required for upsert.');
        return null;
      }
      setMutationStatus('loading');
      setMutationMessage('');
      try {
        const updated = await upsertExperimentFoundationRecord(recordKind, recordId.trim(), payload);
        setMutationStatus('success');
        setMutationMessage(`upserted ${updated.record_kind}:${updated.record_id}`);
        await refresh();
        setSelectedRecord(updated);
        return updated;
      } catch (caught) {
        setMutationStatus('error');
        setMutationMessage(toErrorMessage(caught));
        return null;
      }
    },
    [recordKind, refresh],
  );

  return {
    recordKind,
    filters,
    setFilters,
    records,
    selectedRecord,
    selectRecord,
    status,
    error,
    refresh,
    mutationStatus,
    mutationMessage,
    createRecord,
    upsertRecord,
  };
}
