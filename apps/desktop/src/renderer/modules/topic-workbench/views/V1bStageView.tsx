import type { TitleCardPrimaryTabKey } from '../../../literature/shared/types';
import { useV1bStageData } from '../hooks/useV1bStageData';
import { SliceOptionSetCard } from '../cards/SliceOptionSetCard';
import { QuestionCandidateSetCard } from '../cards/QuestionCandidateSetCard';
import { ValueAssessmentCard } from '../cards/ValueAssessmentCard';
import { TopicPackageCard } from '../cards/TopicPackageCard';

type V1bStageViewProps = {
  titleCardId: string | null;
  subTab: string | null;
  refreshToken: number;
  onSelectSecondaryTab: (
    tab: Exclude<TitleCardPrimaryTabKey, 'overview'>,
    subTab: string,
  ) => void;
};

const SUB_TABS = ['slice', 'question', 'value', 'package'] as const;

/**
 * v1b stage view — composes 4 reviewer surfaces.
 *
 * Phase 3.1 shipped the read-only ReviewerCard renders for each v1b
 * authority object. Phase 3.2-3.5 added inline interactive forms:
 *   - SliceSelectionDecision / QuestionSelectionDecision / ValueDisposition
 *     human-confirm forms (Phase 3.2-3.4)
 *   - V1bToV1cInputBundle publish action (Phase 3.5)
 * Mutations bubble up via `onMutated → reload()` so every form refresh keeps
 * the active stage data fresh after a write.
 */
export function V1bStageView({
  titleCardId,
  subTab,
  refreshToken,
  onSelectSecondaryTab,
}: V1bStageViewProps) {
  const { data, loading, error, reload } = useV1bStageData(titleCardId, refreshToken);
  const activeSubTab = (SUB_TABS as readonly string[]).includes(subTab ?? '')
    ? (subTab as (typeof SUB_TABS)[number])
    : 'slice';

  if (!titleCardId) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">v1b 切片-题目-价值-方案</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            请先在侧边栏选择一个题目卡。v1b 决策链消费 v1a 出口 ValidatedNeed + V1bInputBundle。
          </p>
        </div>
      </article>
    );
  }

  return (
    <div data-ui="stack" data-direction="col" data-gap="3">
      <div data-ui="toolbar" data-align="between" data-wrap="wrap">
        <div data-ui="stack" data-direction="row" data-gap="2" data-align="center" data-wrap="wrap">
          <span data-ui="badge" data-variant="solid" data-tone="info">v1b 切片-题目-价值-方案</span>
          {loading ? (
            <span data-ui="text" data-variant="caption" data-tone="muted">加载中…</span>
          ) : null}
          {error ? (
            <span data-ui="text" data-variant="caption" data-tone="danger">{error}</span>
          ) : null}
        </div>
        <button
          type="button"
          data-ui="button"
          data-variant="secondary"
          data-size="sm"
          onClick={() => void reload()}
          disabled={loading}
        >
          刷新 v1b 数据
        </button>
      </div>

      {activeSubTab === 'slice' ? (
        <SliceOptionSetCard
          sliceOptionSets={data.sliceOptionSets}
          onMutated={() => void reload()}
        />
      ) : null}
      {activeSubTab === 'question' ? (
        <QuestionCandidateSetCard
          candidateSets={data.questionCandidateSets}
          onMutated={() => void reload()}
        />
      ) : null}
      {activeSubTab === 'value' ? (
        <ValueAssessmentCard
          valueAssessments={data.valueAssessments}
          onMutated={() => void reload()}
        />
      ) : null}
      {activeSubTab === 'package' ? (
        <TopicPackageCard
          topicPackages={data.topicPackages}
          onMutated={() => void reload()}
        />
      ) : null}

      <article data-ui="card" data-padding="sm">
        <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
          <span data-ui="text" data-variant="caption" data-tone="muted">快速跳转：</span>
          {SUB_TABS.map((key) => (
            <button
              key={key}
              type="button"
              data-ui="button"
              data-variant={activeSubTab === key ? 'primary' : 'ghost'}
              data-size="sm"
              onClick={() => onSelectSecondaryTab('v1b', key)}
            >
              {key}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
