import { useCallback, useEffect, useState } from 'react';
import type {
  ExperimentFoundationReadinessCheckResponse,
  ExperimentFoundationRecordKind,
  ExperimentFoundationRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import {
  checkExperimentFoundationReadiness,
  getLatestExperimentFoundationReadiness,
} from '../api';
import type { ExperimentFoundationOperationStatus } from '../types';
import { prettyJson, toErrorMessage } from '../utils';
import { JsonAdvancedPanel } from './JsonAdvancedPanel';
import { RefPickerList } from './RefPicker';
import { StatusBadge } from './StatusBadge';

const DEFAULT_SOURCE_REFS: ExperimentFoundationRef[] = [
  { ref_type: 'desktop_workbench', ref_id: 'T-110' },
];

export type ReadinessInspectorTarget = {
  kind: ExperimentFoundationRecordKind;
  id: string;
};

export type ReadinessInspectorProps = {
  open: boolean;
  target: ReadinessInspectorTarget | null;
  onClose: () => void;
};

export function ReadinessInspector({ open, target, onClose }: ReadinessInspectorProps) {
  const [report, setReport] = useState<ExperimentFoundationReadinessCheckResponse | null>(null);
  const [status, setStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [checkKind, setCheckKind] = useState<string>('');
  const [sourceRefs, setSourceRefs] = useState<ExperimentFoundationRef[]>(DEFAULT_SOURCE_REFS);
  // Track previously inspected target so re-opening for a different record
  // refetches its latest report. Re-opening the same target preserves the
  // in-progress check_kind / source_refs edits.
  const [inspectedTargetKey, setInspectedTargetKey] = useState<string | null>(null);

  const loadLatest = useCallback(async (targetKind: ExperimentFoundationRecordKind, targetId: string) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await getLatestExperimentFoundationReadiness(targetKind, targetId);
      setReport(response);
      setStatus('success');
    } catch (caught) {
      setStatus('error');
      setError(toErrorMessage(caught));
      setReport(null);
    }
  }, []);

  useEffect(() => {
    if (!open || !target) {
      return;
    }
    const nextKey = `${target.kind}:${target.id}`;
    if (nextKey === inspectedTargetKey) {
      return;
    }
    setInspectedTargetKey(nextKey);
    setCheckKind('');
    setSourceRefs(DEFAULT_SOURCE_REFS);
    void loadLatest(target.kind, target.id);
  }, [open, target, inspectedTargetKey, loadLatest]);

  const handleRunCheck = useCallback(async () => {
    if (!target) {
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const response = await checkExperimentFoundationReadiness({
        target_ref: { ref_type: target.kind, ref_id: target.id },
        check_kind: checkKind.trim() ? checkKind.trim() : null,
        source_refs: sourceRefs.length > 0 ? sourceRefs : DEFAULT_SOURCE_REFS,
      });
      setReport(response);
      setStatus('success');
    } catch (caught) {
      setStatus('error');
      setError(toErrorMessage(caught));
    }
  }, [target, checkKind, sourceRefs]);

  if (!open || !target) {
    return null;
  }

  return (
    <div
      data-ui="modal"
      data-size="md"
      data-state="open"
      role="dialog"
      aria-modal="true"
      aria-label="Readiness 详情"
    >
      <header data-slot="header">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              Readiness · {target.kind}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              {target.id}
            </p>
          </div>
          <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
      </header>

      <div data-slot="body">
        <div data-ui="stack" data-direction="col" data-gap="3">
          {status === 'loading' ? (
            <p data-ui="text" data-variant="caption" data-tone="muted">
              加载中…
            </p>
          ) : null}
          {status === 'error' && error ? (
            <p data-ui="text" data-variant="caption" data-tone="danger">
              {error}
            </p>
          ) : null}

          {report ? (
            <section data-ui="section" data-padding="none">
              <div data-ui="stack" data-direction="col" data-gap="2">
                <div data-ui="toolbar" data-align="start" data-wrap="wrap">
                  <StatusBadge value={report.readiness_status} />
                  <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                    {report.readiness_report_id}
                  </span>
                </div>
                {report.blockers.length > 0 ? (
                  <div data-ui="stack" data-direction="col" data-gap="1">
                    <p data-ui="text" data-variant="label" data-tone="danger">
                      Blockers
                    </p>
                    <ul data-ui="list" data-variant="plain" data-density="compact">
                      {report.blockers.map((blocker, index) => (
                        <li key={`blocker-${index}`}>
                          <p data-ui="text" data-variant="caption" data-tone="danger">
                            {blocker}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {report.warnings.length > 0 ? (
                  <div data-ui="stack" data-direction="col" data-gap="1">
                    <p data-ui="text" data-variant="label" data-tone="primary">
                      Warnings
                    </p>
                    <ul data-ui="list" data-variant="plain" data-density="compact">
                      {report.warnings.map((warning, index) => (
                        <li key={`warning-${index}`}>
                          <p data-ui="text" data-variant="caption" data-tone="muted">
                            {warning}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {report.required_actions.length > 0 ? (
                  <div data-ui="stack" data-direction="col" data-gap="1">
                    <p data-ui="text" data-variant="label" data-tone="primary">
                      Required actions
                    </p>
                    <ul data-ui="list" data-variant="plain" data-density="compact">
                      {report.required_actions.map((action, index) => (
                        <li key={`action-${index}`}>
                          <p data-ui="text" data-variant="caption" data-tone="muted">
                            {action}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <JsonAdvancedPanel title="完整 readiness 报告" value={report} />
              </div>
            </section>
          ) : status !== 'loading' ? (
            <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
              <p data-slot="title">未找到 readiness 报告，可以发起一次检查。</p>
            </div>
          ) : null}

          <section data-ui="section" data-padding="none">
            <div data-ui="stack" data-direction="col" data-gap="2">
              <p data-ui="text" data-variant="label" data-tone="primary">
                发起新的 readiness 检查
              </p>
              <label data-ui="field">
                <span data-slot="label">check_kind（可选）</span>
                <input
                  data-ui="input"
                  data-size="sm"
                  value={checkKind}
                  placeholder="留空使用默认 kind"
                  onChange={(event) => setCheckKind(event.target.value)}
                />
              </label>
              <RefPickerList
                label="source_refs"
                refType="desktop_workbench"
                values={sourceRefs}
                onChange={setSourceRefs}
                helpText="调用方溯源；至少保留一个 desktop_workbench / system_check 类的引用。"
              />
              <JsonAdvancedPanel
                title="预览请求 body"
                value={prettyJson({
                  target_ref: { ref_type: target.kind, ref_id: target.id },
                  check_kind: checkKind.trim() ? checkKind.trim() : null,
                  source_refs: sourceRefs.length > 0 ? sourceRefs : DEFAULT_SOURCE_REFS,
                })}
              />
            </div>
          </section>
        </div>
      </div>

      <footer data-slot="footer">
        <div data-ui="toolbar" data-align="end" data-wrap="wrap">
          <button
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            type="button"
            onClick={() => void loadLatest(target.kind, target.id)}
          >
            刷新最新
          </button>
          <button
            data-ui="button"
            data-variant="primary"
            data-size="sm"
            type="button"
            onClick={() => void handleRunCheck()}
          >
            发起检查
          </button>
        </div>
      </footer>
    </div>
  );
}
