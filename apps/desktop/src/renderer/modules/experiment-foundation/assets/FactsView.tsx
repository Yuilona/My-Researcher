import { useEffect, useMemo, useState } from 'react';
import type { ExperimentFoundationStoredRecord } from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { JsonAdvancedPanel } from '../components/JsonAdvancedPanel';
import { StatusBadge } from '../components/StatusBadge';
import {
  getComparisonObservationPayload,
  getEvaluationFactPayload,
  getMetricObservationPayload,
} from '../payloads';
import { formatRef, shortText } from '../utils';
import { SparklineSvg, type SparklinePoint } from '../viz/SparklineSvg';
import { useAssetKindController } from './useAssetKindController';

type SortDir = 'asc' | 'desc';

function readNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function compareStrings(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  const left = a ?? '';
  const right = b ?? '';
  if (left === right) return 0;
  return (dir === 'asc' ? 1 : -1) * (left < right ? -1 : 1);
}

function compareNumbers(a: number | null | undefined, b: number | null | undefined, dir: SortDir): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a === b) return 0;
  return (dir === 'asc' ? 1 : -1) * (a < b ? -1 : 1);
}

export function FactsView() {
  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <EvaluationFactsSection />
      <MetricObservationsSection />
      <ComparisonObservationsSection />
    </div>
  );
}

function EvaluationFactsSection() {
  const controller = useAssetKindController('evaluation_fact');
  const [sortKey, setSortKey] = useState<'created_at' | 'fact_kind' | 'run_recipe_id'>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<ExperimentFoundationStoredRecord | null>(null);

  const sorted = useMemo(() => {
    return [...controller.records].sort((a, b) => {
      const pa = getEvaluationFactPayload(a);
      const pb = getEvaluationFactPayload(b);
      if (sortKey === 'created_at') {
        return compareStrings(pa?.created_at ?? a.created_at, pb?.created_at ?? b.created_at, sortDir);
      }
      if (sortKey === 'fact_kind') {
        return compareStrings(pa?.fact_kind, pb?.fact_kind, sortDir);
      }
      return compareStrings(pa?.run_recipe_id, pb?.run_recipe_id, sortDir);
    });
  }, [controller.records, sortKey, sortDir]);

  return (
    <section data-ui="card" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              evaluation_fact · {controller.records.length}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              字段级 evaluation 表。点击列头切换排序。
            </p>
          </div>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.refresh()}>
            刷新
          </button>
        </div>
        {controller.records.length === 0 ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">无 evaluation_fact</p>
          </div>
        ) : (
          <table data-ui="table" data-density="compact">
            <thead>
              <tr>
                <th>
                  <SortHeader
                    label="id"
                    active={false}
                    onSort={() => undefined}
                    direction={null}
                    sortable={false}
                  />
                </th>
                <th>
                  <SortHeader
                    label="fact_kind"
                    active={sortKey === 'fact_kind'}
                    onSort={() => {
                      setSortKey('fact_kind');
                      setSortDir((current) => (sortKey === 'fact_kind' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'fact_kind' ? sortDir : null}
                    sortable
                  />
                </th>
                <th>
                  <SortHeader
                    label="run_recipe_id"
                    active={sortKey === 'run_recipe_id'}
                    onSort={() => {
                      setSortKey('run_recipe_id');
                      setSortDir((current) => (sortKey === 'run_recipe_id' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'run_recipe_id' ? sortDir : null}
                    sortable
                  />
                </th>
                <th>
                  <SortHeader
                    label="created_at"
                    active={sortKey === 'created_at'}
                    onSort={() => {
                      setSortKey('created_at');
                      setSortDir((current) => (sortKey === 'created_at' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'created_at' ? sortDir : null}
                    sortable
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 12).map((record) => {
                const payload = getEvaluationFactPayload(record);
                const isSelected = selected?.record_id === record.record_id;
                return (
                  <tr key={record.record_id}>
                    <td>
                      <button
                        data-ui="button"
                        data-variant={isSelected ? 'primary' : 'ghost'}
                        data-size="sm"
                        type="button"
                        onClick={() => setSelected(record)}
                        title={record.record_id}
                      >
                        {shortText(record.record_id, 28)}
                      </button>
                    </td>
                    <td>{shortText(payload?.fact_kind, 18)}</td>
                    <td>{shortText(payload?.run_recipe_id, 24)}</td>
                    <td>{shortText(payload?.created_at ?? record.created_at, 24)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {selected ? (
          <JsonAdvancedPanel title="selected fact_payload" value={getEvaluationFactPayload(selected) ?? selected.payload} />
        ) : null}
      </div>
    </section>
  );
}

function MetricObservationsSection() {
  const controller = useAssetKindController('metric_observation');
  const [sortKey, setSortKey] = useState<'created_at' | 'metric_key' | 'value'>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [metricRefFilter, setMetricRefFilter] = useState<string>('');
  const [selected, setSelected] = useState<ExperimentFoundationStoredRecord | null>(null);

  // Cache derived values once per record.
  const enriched = useMemo(() => {
    return controller.records.map((record) => {
      const payload = getMetricObservationPayload(record);
      return {
        record,
        payload,
        metricRefKey: payload ? formatRef(payload.metric_definition_ref) : '',
        numericValue: readNumericValue(payload?.value),
      };
    });
  }, [controller.records]);

  const availableMetricRefs = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const item of enriched) {
      if (item.metricRefKey) set.add(item.metricRefKey);
    }
    return Array.from(set).sort();
  }, [enriched]);

  // Default the sparkline metric to the first available ref.
  useEffect(() => {
    if (!metricRefFilter && availableMetricRefs.length > 0) {
      setMetricRefFilter(availableMetricRefs[0]);
    }
  }, [availableMetricRefs, metricRefFilter]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      if (sortKey === 'created_at') {
        return compareStrings(
          a.payload?.created_at ?? a.record.created_at,
          b.payload?.created_at ?? b.record.created_at,
          sortDir,
        );
      }
      if (sortKey === 'metric_key') {
        return compareStrings(a.payload?.metric_key, b.payload?.metric_key, sortDir);
      }
      return compareNumbers(a.numericValue, b.numericValue, sortDir);
    });
  }, [enriched, sortKey, sortDir]);

  const sparklinePoints = useMemo<SparklinePoint[]>(() => {
    if (!metricRefFilter) return [];
    return enriched
      .filter((item) => item.metricRefKey === metricRefFilter && item.numericValue !== null)
      .map((item) => ({
        x: item.payload?.created_at ?? item.record.created_at ?? '',
        y: item.numericValue as number,
      }))
      .sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0));
  }, [enriched, metricRefFilter]);

  const sparklineStats = useMemo(() => {
    if (sparklinePoints.length === 0) return null;
    const values = sparklinePoints.map((point) => point.y);
    return {
      latest: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }, [sparklinePoints]);

  return (
    <section data-ui="card" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="3">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              metric_observation · {controller.records.length}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              选一个 metric_definition_ref 看其数值序列。
            </p>
          </div>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.refresh()}>
            刷新
          </button>
        </div>

        {availableMetricRefs.length > 0 ? (
          <section data-ui="section" data-padding="none">
            <div data-ui="stack" data-direction="col" data-gap="2">
              <label data-ui="field">
                <span data-slot="label">metric_definition_ref</span>
                <select
                  data-ui="select"
                  data-size="sm"
                  value={metricRefFilter}
                  onChange={(event) => setMetricRefFilter(event.target.value)}
                >
                  {availableMetricRefs.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <div data-ui="toolbar" data-align="start" data-wrap="wrap">
                <SparklineSvg points={sparklinePoints} ariaLabel={`sparkline for ${metricRefFilter}`} />
                {sparklineStats ? (
                  <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
                    <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                      latest {sparklineStats.latest}
                    </span>
                    <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                      min {sparklineStats.min}
                    </span>
                    <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                      max {sparklineStats.max}
                    </span>
                    <span data-ui="badge" data-variant="subtle" data-tone="neutral">
                      n {sparklineStats.count}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {controller.records.length === 0 ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">无 metric_observation</p>
          </div>
        ) : (
          <table data-ui="table" data-density="compact">
            <thead>
              <tr>
                <th>
                  <SortHeader label="id" active={false} onSort={() => undefined} direction={null} sortable={false} />
                </th>
                <th>
                  <SortHeader
                    label="metric_key"
                    active={sortKey === 'metric_key'}
                    onSort={() => {
                      setSortKey('metric_key');
                      setSortDir((current) => (sortKey === 'metric_key' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'metric_key' ? sortDir : null}
                    sortable
                  />
                </th>
                <th>
                  <SortHeader
                    label="value"
                    active={sortKey === 'value'}
                    onSort={() => {
                      setSortKey('value');
                      setSortDir((current) => (sortKey === 'value' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'value' ? sortDir : null}
                    sortable
                  />
                </th>
                <th>metric_ref</th>
                <th>
                  <SortHeader
                    label="created_at"
                    active={sortKey === 'created_at'}
                    onSort={() => {
                      setSortKey('created_at');
                      setSortDir((current) => (sortKey === 'created_at' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'created_at' ? sortDir : null}
                    sortable
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 12).map((item) => {
                const isSelected = selected?.record_id === item.record.record_id;
                return (
                  <tr key={item.record.record_id}>
                    <td>
                      <button
                        data-ui="button"
                        data-variant={isSelected ? 'primary' : 'ghost'}
                        data-size="sm"
                        type="button"
                        onClick={() => setSelected(item.record)}
                        title={item.record.record_id}
                      >
                        {shortText(item.record.record_id, 26)}
                      </button>
                    </td>
                    <td>{shortText(item.payload?.metric_key, 18)}</td>
                    <td>{item.numericValue ?? '--'}</td>
                    <td>{shortText(item.metricRefKey, 24)}</td>
                    <td>{shortText(item.payload?.created_at ?? item.record.created_at, 24)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {selected ? (
          <JsonAdvancedPanel title="selected metric_observation" value={getMetricObservationPayload(selected) ?? selected.payload} />
        ) : null}
      </div>
    </section>
  );
}

function ComparisonObservationsSection() {
  const controller = useAssetKindController('comparison_observation');
  const [sortKey, setSortKey] = useState<'created_at' | 'delta' | 'comparison_outcome'>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<ExperimentFoundationStoredRecord | null>(null);

  const sorted = useMemo(() => {
    return [...controller.records].sort((a, b) => {
      const pa = getComparisonObservationPayload(a);
      const pb = getComparisonObservationPayload(b);
      if (sortKey === 'created_at') {
        return compareStrings(pa?.created_at ?? a.created_at, pb?.created_at ?? b.created_at, sortDir);
      }
      if (sortKey === 'comparison_outcome') {
        return compareStrings(pa?.comparison_outcome, pb?.comparison_outcome, sortDir);
      }
      return compareNumbers(pa?.delta ?? null, pb?.delta ?? null, sortDir);
    });
  }, [controller.records, sortKey, sortDir]);

  return (
    <section data-ui="card" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="label" data-tone="primary">
              comparison_observation · {controller.records.length}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              主指标 vs baseline 的对比结果。
            </p>
          </div>
          <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void controller.refresh()}>
            刷新
          </button>
        </div>
        {controller.records.length === 0 ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">无 comparison_observation</p>
          </div>
        ) : (
          <table data-ui="table" data-density="compact">
            <thead>
              <tr>
                <th>
                  <SortHeader label="id" active={false} onSort={() => undefined} direction={null} sortable={false} />
                </th>
                <th>
                  <SortHeader
                    label="comparison_outcome"
                    active={sortKey === 'comparison_outcome'}
                    onSort={() => {
                      setSortKey('comparison_outcome');
                      setSortDir((current) => (sortKey === 'comparison_outcome' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'comparison_outcome' ? sortDir : null}
                    sortable
                  />
                </th>
                <th>
                  <SortHeader
                    label="delta"
                    active={sortKey === 'delta'}
                    onSort={() => {
                      setSortKey('delta');
                      setSortDir((current) => (sortKey === 'delta' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'delta' ? sortDir : null}
                    sortable
                  />
                </th>
                <th>relative_delta</th>
                <th>baseline</th>
                <th>
                  <SortHeader
                    label="created_at"
                    active={sortKey === 'created_at'}
                    onSort={() => {
                      setSortKey('created_at');
                      setSortDir((current) => (sortKey === 'created_at' && current === 'asc' ? 'desc' : 'asc'));
                    }}
                    direction={sortKey === 'created_at' ? sortDir : null}
                    sortable
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 12).map((record) => {
                const payload = getComparisonObservationPayload(record);
                const isSelected = selected?.record_id === record.record_id;
                return (
                  <tr key={record.record_id}>
                    <td>
                      <button
                        data-ui="button"
                        data-variant={isSelected ? 'primary' : 'ghost'}
                        data-size="sm"
                        type="button"
                        onClick={() => setSelected(record)}
                        title={record.record_id}
                      >
                        {shortText(record.record_id, 28)}
                      </button>
                    </td>
                    <td>
                      <StatusBadge value={payload?.comparison_outcome ?? null} />
                    </td>
                    <td>{payload?.delta ?? '--'}</td>
                    <td>{payload?.relative_delta ?? '--'}</td>
                    <td>{shortText(payload?.baseline_asset_ref ? formatRef(payload.baseline_asset_ref) : '', 20)}</td>
                    <td>{shortText(payload?.created_at ?? record.created_at, 24)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {selected ? (
          <JsonAdvancedPanel title="selected comparison_observation" value={getComparisonObservationPayload(selected) ?? selected.payload} />
        ) : null}
      </div>
    </section>
  );
}

type SortHeaderProps = {
  label: string;
  active: boolean;
  direction: SortDir | null;
  onSort: () => void;
  sortable: boolean;
};

function SortHeader({ label, active, direction, onSort, sortable }: SortHeaderProps) {
  if (!sortable) {
    return <span>{label}</span>;
  }
  const arrow = active ? (direction === 'asc' ? '↑' : '↓') : '';
  return (
    <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={onSort}>
      {label} {arrow}
    </button>
  );
}

