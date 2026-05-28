import type { ExperimentFoundationAssetSubTabKey } from '../constants';
import { DatasetAssetView } from './DatasetAssetView';
import { GenericAssetKindView } from './GenericAssetKindView';

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
      {activeSubTab === 'benchmark' ? (
        <GenericAssetKindView
          recordKind="benchmark_asset"
          description="基准（comparison rules）。S1 阶段以契约 JSON 写入；typed 表单在 S3 落地。"
        />
      ) : null}
      {activeSubTab === 'baseline' ? (
        <GenericAssetKindView
          recordKind="baseline_asset"
          description="基线（comparison target）。S1 阶段以契约 JSON 写入；typed 表单在 S3 落地。"
        />
      ) : null}
      {activeSubTab === 'protocol' ? (
        <GenericAssetKindView
          recordKind="evaluation_protocol"
          description="评测协议。S1 阶段以契约 JSON 写入；typed 表单在 S3 落地。"
        />
      ) : null}
    </div>
  );
}
