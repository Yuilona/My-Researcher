import type { ExperimentFoundationPanelKey } from './types';

export const experimentFoundationTabs: Array<{ key: ExperimentFoundationPanelKey; label: string }> = [
  { key: 'overview', label: '概览' },
  { key: 'assets', label: '资产库' },
  { key: 'flow', label: '实验流' },
  { key: 'promotion', label: '候选晋升' },
];

export type ExperimentFoundationAssetSubTabKey =
  | 'dataset'
  | 'benchmark'
  | 'baseline'
  | 'protocol'
  | 'facts';

export const experimentFoundationAssetSubTabs: Array<{
  key: ExperimentFoundationAssetSubTabKey;
  label: string;
}> = [
  { key: 'dataset', label: 'Dataset' },
  { key: 'benchmark', label: 'Benchmark' },
  { key: 'baseline', label: 'Baseline' },
  { key: 'protocol', label: 'Protocol' },
  { key: 'facts', label: 'Facts' },
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
