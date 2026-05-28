import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EXPERIMENT_FOUNDATION_RECORD_KINDS,
  type ExperimentFoundationRecordKind,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { listExperimentFoundationRecords } from '../api';
import type { ExperimentFoundationOperationStatus } from '../types';
import { shortText, toErrorMessage } from '../utils';

const TYPEAHEAD_DEBOUNCE_MS = 220;
const TYPEAHEAD_PAGE_SIZE = 20;

const KNOWN_RECORD_KINDS = new Set<string>(EXPERIMENT_FOUNDATION_RECORD_KINDS);

function isKnownRecordKind(value: string): value is ExperimentFoundationRecordKind {
  return KNOWN_RECORD_KINDS.has(value);
}

export type RefPickerProps = {
  label: string;
  refType: string;
  value: ExperimentFoundationRef | null;
  onChange: (next: ExperimentFoundationRef | null) => void;
  allowedRefTypes?: ReadonlyArray<string>;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
};

export function RefPicker({
  label,
  refType,
  value,
  onChange,
  allowedRefTypes,
  required = false,
  helpText,
  disabled = false,
}: RefPickerProps) {
  // Resolve initial ref_type: if an allowlist exists, prefer a value already in
  // it. This prevents the select from rendering an out-of-options value when a
  // caller passes mismatched (refType, allowedRefTypes).
  const initialRefType =
    value?.ref_type && (!allowedRefTypes || allowedRefTypes.includes(value.ref_type))
      ? value.ref_type
      : allowedRefTypes && allowedRefTypes.length > 0
        ? allowedRefTypes[0]
        : refType;
  const [refTypeInput, setRefTypeInput] = useState<string>(initialRefType);
  const [idInput, setIdInput] = useState<string>(value?.ref_id ?? '');
  const [candidates, setCandidates] = useState<ExperimentFoundationStoredRecord[]>([]);
  const [loadStatus, setLoadStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openSuggestions, setOpenSuggestions] = useState<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track external value updates (e.g. clearing or initial load). When the
  // incoming value.ref_type is outside the allowlist, fall back to the first
  // allowed option so the select never points at an invalid value.
  useEffect(() => {
    const incomingRefType = value?.ref_type;
    if (incomingRefType && (!allowedRefTypes || allowedRefTypes.includes(incomingRefType))) {
      setRefTypeInput(incomingRefType);
    } else if (allowedRefTypes && allowedRefTypes.length > 0) {
      setRefTypeInput(allowedRefTypes[0]);
    } else {
      setRefTypeInput(refType);
    }
    setIdInput(value?.ref_id ?? '');
  }, [value?.ref_type, value?.ref_id, refType, allowedRefTypes]);

  const effectiveRefType = refTypeInput.trim() || refType;
  const isRefTypeKnown = isKnownRecordKind(effectiveRefType);

  const allowedRefTypeOptions = useMemo<string[]>(() => {
    if (allowedRefTypes && allowedRefTypes.length > 0) {
      return [...allowedRefTypes];
    }
    return [refType];
  }, [allowedRefTypes, refType]);

  const showRefTypeSelector = allowedRefTypeOptions.length > 1;

  const refreshCandidates = useCallback(
    async (rawQuery: string) => {
      if (!isRefTypeKnown) {
        setCandidates([]);
        setLoadStatus('idle');
        setLoadError(null);
        return;
      }
      setLoadStatus('loading');
      setLoadError(null);
      try {
        const response = await listExperimentFoundationRecords({
          recordKind: effectiveRefType as ExperimentFoundationRecordKind,
          status: '',
          family: '',
          parentRecordId: '',
          ownerRefId: '',
        });
        const trimmed = rawQuery.trim().toLowerCase();
        const filtered = trimmed
          ? response.records.filter((record) => record.record_id.toLowerCase().includes(trimmed))
          : response.records;
        setCandidates(filtered.slice(0, TYPEAHEAD_PAGE_SIZE));
        setLoadStatus('success');
      } catch (error) {
        setLoadStatus('error');
        setLoadError(toErrorMessage(error));
      }
    },
    [effectiveRefType, isRefTypeKnown],
  );

  useEffect(() => {
    if (!openSuggestions || !isRefTypeKnown) {
      return;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      void refreshCandidates(idInput);
    }, TYPEAHEAD_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [idInput, openSuggestions, isRefTypeKnown, refreshCandidates]);

  const emit = useCallback(
    (nextRefType: string, nextRefId: string) => {
      const cleanedRefType = nextRefType.trim();
      const cleanedRefId = nextRefId.trim();
      if (!cleanedRefType || !cleanedRefId) {
        onChange(null);
        return;
      }
      onChange({ ref_type: cleanedRefType, ref_id: cleanedRefId });
    },
    [onChange],
  );

  const handleRefTypeChange = useCallback(
    (next: string) => {
      setRefTypeInput(next);
      emit(next, idInput);
    },
    [emit, idInput],
  );

  const handleIdChange = useCallback(
    (next: string) => {
      setIdInput(next);
      emit(effectiveRefType, next);
    },
    [effectiveRefType, emit],
  );

  const handleSelectCandidate = useCallback(
    (record: ExperimentFoundationStoredRecord) => {
      setRefTypeInput(record.record_kind);
      setIdInput(record.record_id);
      setOpenSuggestions(false);
      emit(record.record_kind, record.record_id);
    },
    [emit],
  );

  const handleClear = useCallback(() => {
    setRefTypeInput(allowedRefTypeOptions[0] ?? refType);
    setIdInput('');
    setOpenSuggestions(false);
    onChange(null);
  }, [allowedRefTypeOptions, onChange, refType]);

  const showUnknownWarning =
    isRefTypeKnown &&
    loadStatus === 'success' &&
    idInput.trim().length > 0 &&
    !candidates.some((candidate) => candidate.record_id === idInput.trim());

  return (
    <div data-ui="stack" data-direction="col" data-gap="1">
      <label data-ui="field">
        <span data-slot="label">{required ? `${label} *` : label}</span>
        <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
          {showRefTypeSelector ? (
            <select
              data-ui="select"
              data-size="sm"
              value={effectiveRefType}
              disabled={disabled}
              onChange={(event) => handleRefTypeChange(event.target.value)}
            >
              {allowedRefTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              data-ui="input"
              data-size="sm"
              type="text"
              value={effectiveRefType}
              readOnly
              aria-readonly="true"
              disabled={disabled}
            />
          )}
          <input
            data-ui="input"
            data-size="sm"
            type="text"
            placeholder="ref_id"
            value={idInput}
            disabled={disabled}
            onChange={(event) => handleIdChange(event.target.value)}
            onFocus={() => {
              if (isRefTypeKnown) {
                setOpenSuggestions(true);
              }
            }}
            onBlur={() => {
              // Defer close so a click on a suggestion can register first.
              setTimeout(() => setOpenSuggestions(false), 120);
            }}
          />
          <button
            data-ui="button"
            data-variant="ghost"
            data-size="sm"
            type="button"
            disabled={disabled || (!idInput && !value)}
            onClick={handleClear}
          >
            清除
          </button>
        </div>
      </label>
      {helpText ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          {helpText}
        </p>
      ) : null}
      {openSuggestions && isRefTypeKnown && loadStatus === 'loading' ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          加载候选…
        </p>
      ) : null}
      {openSuggestions && isRefTypeKnown && loadStatus === 'error' && loadError ? (
        <p data-ui="text" data-variant="caption" data-tone="danger">
          {loadError}
        </p>
      ) : null}
      {openSuggestions && isRefTypeKnown && loadStatus === 'success' && candidates.length > 0 ? (
        <ul data-ui="list" data-variant="plain" data-density="compact" role="listbox">
          {candidates.map((candidate) => (
            <li key={`${candidate.record_kind}:${candidate.record_id}`} role="option">
              <button
                data-ui="button"
                data-variant="ghost"
                data-size="sm"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelectCandidate(candidate)}
                title={`${candidate.record_kind}:${candidate.record_id}`}
              >
                {shortText(candidate.record_id, 60)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!isRefTypeKnown && idInput.trim().length > 0 ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          自由 ref_type，跳过候选检查。
        </p>
      ) : null}
      {showUnknownWarning ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          注意：未在最近候选中匹配到 ref_id（后端仍会按提交值校验）。
        </p>
      ) : null}
    </div>
  );
}

export type RefPickerListProps = {
  label: string;
  refType: string;
  values: ExperimentFoundationRef[];
  onChange: (next: ExperimentFoundationRef[]) => void;
  allowedRefTypes?: ReadonlyArray<string>;
  minItems?: number;
  helpText?: string;
  disabled?: boolean;
};

export function RefPickerList({
  label,
  refType,
  values,
  onChange,
  allowedRefTypes,
  minItems = 0,
  helpText,
  disabled = false,
}: RefPickerListProps) {
  const handleItemChange = useCallback(
    (index: number, next: ExperimentFoundationRef | null) => {
      const draft = [...values];
      if (next === null) {
        draft.splice(index, 1);
      } else {
        draft[index] = next;
      }
      onChange(draft);
    },
    [onChange, values],
  );

  const handleAdd = useCallback(() => {
    onChange([...values, { ref_type: refType, ref_id: '' }]);
  }, [onChange, refType, values]);

  const handleRemove = useCallback(
    (index: number) => {
      const draft = [...values];
      draft.splice(index, 1);
      onChange(draft);
    },
    [onChange, values],
  );

  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <p data-ui="text" data-variant="label" data-tone="primary">
            {minItems > 0 ? `${label} *` : label}
          </p>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" disabled={disabled} onClick={handleAdd}>
            添加
          </button>
        </div>
        {helpText ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            {helpText}
          </p>
        ) : null}
        {values.length === 0 ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">无引用</p>
          </div>
        ) : null}
        {values.map((entry, index) => (
          <div key={`${entry.ref_type}:${entry.ref_id}:${index}`} data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
            <div data-ui="stack" data-direction="col" data-gap="1">
              <RefPicker
                label={`#${index + 1}`}
                refType={entry.ref_type || refType}
                value={entry.ref_id ? entry : null}
                onChange={(next) => handleItemChange(index, next)}
                allowedRefTypes={allowedRefTypes}
                disabled={disabled}
              />
            </div>
            <button
              data-ui="button"
              data-variant="ghost"
              data-size="sm"
              type="button"
              disabled={disabled}
              onClick={() => handleRemove(index)}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
