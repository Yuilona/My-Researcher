import { useEffect } from 'react';
import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { StatusBadge } from '../components/StatusBadge';
import { shortText } from '../utils';
import { RunRecipeTimeline } from './RunRecipeTimeline';
import {
  useExperimentFlowController,
  type ExperimentFlowController,
} from './useExperimentFlowController';

export type ExperimentFlowPanelProps = {
  onInspectReadiness: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
  // Advisory deep-link target from Overview → goToJob. The panel selects the
  // matching job once jobs have loaded, then signals consumption so the
  // sentinel does not refire on subsequent renders.
  preselectJobId?: string | null;
  onPreselectConsumed?: () => void;
  // Advisory deep-link target from PaperBindingPanel → jump-to-flow. The panel
  // selects the matching run_recipe (in-page first, single-record fetch
  // fallback), then signals consumption.
  preselectRunRecipeId?: string | null;
  onPreselectRunRecipeConsumed?: () => void;
};

export function ExperimentFlowPanel({
  onInspectReadiness,
  preselectJobId,
  onPreselectConsumed,
  preselectRunRecipeId,
  onPreselectRunRecipeConsumed,
}: ExperimentFlowPanelProps) {
  const controller = useExperimentFlowController();

  // Resolve a preselect request once the job list has loaded. If the target
  // job is in the latest page, select locally (no network). Otherwise fall
  // back to selectJobById which fetches by id. Either way, signal that the
  // sentinel has been consumed.
  useEffect(() => {
    if (!preselectJobId) {
      return;
    }
    if (controller.jobsStatus !== 'success') {
      return;
    }
    const local = controller.jobs.find((job) => job.external_job_id === preselectJobId);
    if (local) {
      controller.selectJobLocally(local);
      onPreselectConsumed?.();
      return;
    }
    void (async () => {
      await controller.selectJobById(preselectJobId);
      onPreselectConsumed?.();
    })();
  }, [preselectJobId, controller, onPreselectConsumed]);

  // Same in-page → single-record fallback pattern for the run_recipe preselect.
  useEffect(() => {
    if (!preselectRunRecipeId) {
      return;
    }
    if (controller.stages.run_recipe.status !== 'success') {
      return;
    }
    const local = controller.stages.run_recipe.records.find(
      (record) => record.record_id === preselectRunRecipeId,
    );
    if (local) {
      controller.selectRunRecipe(local);
      onPreselectRunRecipeConsumed?.();
      return;
    }
    void (async () => {
      await controller.selectRunRecipeById(preselectRunRecipeId);
      onPreselectRunRecipeConsumed?.();
    })();
  }, [preselectRunRecipeId, controller, onPreselectRunRecipeConsumed]);
  const runRecipes = controller.stages.run_recipe.records;

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <RunRecipeSelector controller={controller} runRecipes={runRecipes} />
      <RunRecipeTimeline
        selectedRunRecipe={controller.selectedRunRecipe}
        stages={controller.stages}
        onRefreshStage={(key) => void controller.refreshStage(key)}
        onLoadMoreStage={(key) => void controller.loadMoreStage(key)}
        onInspectReadiness={onInspectReadiness}
        jobs={controller.jobs}
        selectedJob={controller.selectedJob}
        onSelectJob={controller.selectJobLocally}
        jobsStatus={controller.jobsStatus}
        jobsError={controller.jobsError}
        jobActionStatus={controller.jobActionStatus}
        jobActionMessage={controller.jobActionMessage}
        onSubmitJob={controller.submitJob}
        onSyncJob={controller.syncJob}
        onCancelJob={controller.cancelJob}
        onCollectJob={controller.collectJob}
      />
    </div>
  );
}

type RunRecipeSelectorProps = {
  controller: ExperimentFlowController;
  runRecipes: ExperimentFoundationStoredRecord[];
};

function RunRecipeSelector({ controller, runRecipes }: RunRecipeSelectorProps) {
  return (
    <section data-ui="section" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <p data-ui="text" data-variant="label" data-tone="primary">
            选择 run_recipe（驱动整条实验流）
          </p>
          <button
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            type="button"
            onClick={() => void controller.refreshAll()}
          >
            刷新整条流
          </button>
        </div>
        {runRecipes.length === 0 ? (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
            <p data-slot="title">尚无 run_recipe；先在 资产库 / Recipe 之后的流程中创建</p>
          </div>
        ) : (
          <ul data-ui="list" data-variant="rows" data-density="compact">
            {runRecipes.slice(0, 8).map((record) => {
              const isSelected =
                controller.selectedRunRecipe?.record_id === record.record_id &&
                controller.selectedRunRecipe.record_kind === record.record_kind;
              return (
                <li key={record.record_id}>
                  <button
                    data-ui="button"
                    data-variant={isSelected ? 'primary' : 'ghost'}
                    data-size="sm"
                    type="button"
                    onClick={() => controller.selectRunRecipe(record)}
                    title={record.record_id}
                  >
                    {shortText(record.record_id, 60)}
                  </button>
                  <StatusBadge value={record.status} />
                </li>
              );
            })}
          </ul>
        )}
        {controller.selectedRunRecipe ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            当前选中：{controller.selectedRunRecipe.record_id} · hash{' '}
            {shortText(controller.selectedRunRecipe.record_hash, 28)}
          </p>
        ) : (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            未选 recipe；下面各阶段仍展示最近记录用于探查。
          </p>
        )}
      </div>
    </section>
  );
}
