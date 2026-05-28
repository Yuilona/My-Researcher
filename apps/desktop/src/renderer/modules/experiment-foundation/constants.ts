import type { ExperimentFoundationPanelKey } from './types';

export const experimentFoundationTabs: Array<{ key: ExperimentFoundationPanelKey; label: string }> = [
  { key: 'overview', label: '概览' },
  { key: 'assets', label: '资产库' },
  { key: 'readiness', label: 'Readiness' },
  { key: 'promotion', label: '候选晋升' },
  { key: 'recipes', label: 'Recipe/Materialization' },
  { key: 'execution', label: '执行/证据' },
];

export type ExperimentFoundationAssetSubTabKey =
  | 'dataset'
  | 'benchmark'
  | 'baseline'
  | 'protocol';

export const experimentFoundationAssetSubTabs: Array<{
  key: ExperimentFoundationAssetSubTabKey;
  label: string;
}> = [
  { key: 'dataset', label: 'Dataset' },
  { key: 'benchmark', label: 'Benchmark' },
  { key: 'baseline', label: 'Baseline' },
  { key: 'protocol', label: 'Protocol' },
];

// Runtime-checkable membership list for guarding sub-tab writes from the
// Topbar. Keep in sync with `experimentFoundationAssetSubTabs`.
export const experimentFoundationAssetSubTabKeys: ReadonlyArray<ExperimentFoundationAssetSubTabKey> =
  experimentFoundationAssetSubTabs.map((tab) => tab.key);

export const experimentFoundationSubTabsByTab: Partial<
  Record<ExperimentFoundationPanelKey, Array<{ key: string; label: string }>>
> = {
  assets: experimentFoundationAssetSubTabs.map((tab) => ({ key: tab.key, label: tab.label })),
};
