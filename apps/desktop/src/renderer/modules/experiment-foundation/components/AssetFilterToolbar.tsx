import type { AssetKindController } from '../assets/useAssetKindController';

export type AssetFilterToolbarProps = {
  controller: AssetKindController;
  onNew: () => void;
};

/**
 * Shared filter toolbar for every typed asset view. Owns the `status` filter
 * input, the "刷新" CTA, and the "新建" CTA — each typed view only declares
 * the `handleNew` callback that resets its draft.
 */
export function AssetFilterToolbar({ controller, onNew }: AssetFilterToolbarProps) {
  return (
    <section data-ui="section" data-padding="none">
      <div data-ui="toolbar" data-align="between" data-wrap="wrap">
        <label data-ui="field">
          <span data-slot="label">status filter</span>
          <input
            data-ui="input"
            data-size="sm"
            value={controller.filters.status}
            onChange={(event) =>
              controller.setFilters((current) => ({ ...current, status: event.target.value }))
            }
          />
        </label>
        <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap">
          <button
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            type="button"
            onClick={() => void controller.refresh()}
          >
            刷新
          </button>
          <button data-ui="button" data-variant="ghost" data-size="sm" type="button" onClick={onNew}>
            新建
          </button>
        </div>
      </div>
      {controller.status === 'error' && controller.error ? (
        <p data-ui="text" data-variant="caption" data-tone="danger">
          {controller.error}
        </p>
      ) : null}
    </section>
  );
}
