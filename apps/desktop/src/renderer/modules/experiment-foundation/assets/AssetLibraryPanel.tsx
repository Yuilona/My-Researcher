import type { ExperimentFoundationAssetSubTabKey } from '../constants';
import { BaselineAssetView } from './BaselineAssetView';
import { BenchmarkAssetView } from './BenchmarkAssetView';
import { DatasetAssetView } from './DatasetAssetView';
import { EvaluationProtocolView } from './EvaluationProtocolView';
import { FactsView } from './FactsView';

export type AssetLibraryPanelProps = {
  activeSubTab: ExperimentFoundationAssetSubTabKey;
  // Sub-tab switching is owned by the Topbar at the App level; the panel
  // itself does not change sub-tabs. Kept optional so future deep-link
  // scenarios (e.g. "jump from Baseline detail to Dataset row X") can wire
  // an upward callback without changing the panel's signature.
  onSelectSubTab?: (next: ExperimentFoundationAssetSubTabKey) => void;
};

export function AssetLibraryPanel({ activeSubTab }: AssetLibraryPanelProps) {
  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      {activeSubTab === 'dataset' ? <DatasetAssetView /> : null}
      {activeSubTab === 'benchmark' ? <BenchmarkAssetView /> : null}
      {activeSubTab === 'baseline' ? <BaselineAssetView /> : null}
      {activeSubTab === 'protocol' ? <EvaluationProtocolView /> : null}
      {activeSubTab === 'facts' ? <FactsView /> : null}
    </div>
  );
}
