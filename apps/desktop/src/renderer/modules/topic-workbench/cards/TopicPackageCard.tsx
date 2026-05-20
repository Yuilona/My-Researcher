import { useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionTopicPackageRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-package-contracts';
import { publishV1cInputBundle } from '../api/v1b';

type TopicPackageCardProps = {
  topicPackages: TopicSelectionTopicPackageRecord[];
  onMutated?: () => void;
};

function readinessTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'ready_for_promotion_review') return 'success';
  if (status === 'blocked' || status === 'needs_recheck') return 'warning';
  return 'info';
}

/**
 * v1b TopicPackage(draft) surface — Phase 3.1 read-only view.
 *
 * Lists package drafts produced by `CreateDraftPackage`. v1b's success
 * outlet. V1cInputBundle publish (analogous to v1a → v1b bundle publish)
 * is wired in Phase 3.5 once interactive forms land.
 */
export function TopicPackageCard({ topicPackages, onMutated }: TopicPackageCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    topicPackages[0]?.topic_package_id ?? null,
  );
  const active = topicPackages.find((item) => item.topic_package_id === selectedId)
    ?? topicPackages[0]
    ?? null;

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">TopicPackage(draft)</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡还没有 TopicPackage 草案。先在 Value surface 触发 advance_to_package disposition。
          </p>
        </div>
      </article>
    );
  }

  const packageSelector = topicPackages.length > 1 ? (
    <select
      data-ui="select"
      data-size="sm"
      value={active.topic_package_id}
      onChange={(event) => setSelectedId(event.target.value)}
    >
      {topicPackages.map((item) => (
        <option key={item.topic_package_id} value={item.topic_package_id}>
          {item.package_version} · {item.package_readiness_status}
        </option>
      ))}
    </select>
  ) : null;

  return (
    <ReviewerCard
      kind="TopicPackage(draft)"
      subjectId={active.topic_package_id}
      status={{ label: active.package_readiness_status, tone: readinessTone(active.package_readiness_status) }}
      chips={[
        { label: `version ${active.package_version}`, tone: 'info' },
        { label: `titles ${active.title_candidates.length}`, tone: 'neutral' },
        { label: `methods ${active.candidate_methods.length}`, tone: 'neutral' },
        ...(topicPackages.length > 1 ? [{ label: `history ${topicPackages.length}`, tone: 'neutral' as const }] : []),
      ]}
      verdict={
        <div data-ui="stack" data-direction="col" data-gap="1">
          {active.title_candidates.length > 0 ? (
            <p data-ui="text" data-variant="body" data-tone="primary">
              title 候选：{active.title_candidates[0]}
            </p>
          ) : (
            <p data-ui="text" data-variant="body" data-tone="muted">— 无 title_candidates —</p>
          )}
          <p data-ui="text" data-variant="caption" data-tone="muted">contribution: {active.contribution_summary || '—'}</p>
          {packageSelector ? (
            <div data-ui="stack" data-direction="row" data-gap="2" data-align="center">
              <span data-ui="text" data-variant="caption" data-tone="muted">切换 package version</span>
              {packageSelector}
            </div>
          ) : null}
        </div>
      }
      support={
        active.candidate_methods.length === 0 && active.selected_literature_evidence_ids.length === 0 ? (
          <ReviewerCardEmpty label="尚无 candidate_methods / selected_literature_evidence。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            {active.candidate_methods.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="primary">
                candidate_methods（{active.candidate_methods.length}）
              </p>
            ) : null}
            <p data-ui="text" data-variant="caption" data-tone="muted">
              evidence_refs {active.evidence_refs.length} · selected_literature_evidence {active.selected_literature_evidence_ids.length} · validated_need_refs {active.validated_need_refs.length}
            </p>
            {active.evaluation_plan ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">evaluation_plan: {active.evaluation_plan}</p>
            ) : null}
          </div>
        )
      }
      challenge={
        active.key_risks.length === 0 ? (
          <ReviewerCardEmpty label="无声明的 key_risks。" />
        ) : (
          <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap">
            {active.key_risks.map((risk, idx) => (
              <span key={`${risk}-${idx}`} data-ui="badge" data-variant="subtle" data-tone="warning">{risk}</span>
            ))}
          </div>
        )
      }
      blockers={
        active.blocker_refs.length === 0
          && active.recheck_request_refs.length === 0
          && active.accepted_risk_refs.length === 0 ? (
          <ReviewerCardEmpty label="无 blocker / recheck / accepted risk refs。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            {active.blocker_refs.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">blocker_refs：{active.blocker_refs.length}</p>
            ) : null}
            {active.recheck_request_refs.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">recheck_request_refs：{active.recheck_request_refs.length}</p>
            ) : null}
            {active.accepted_risk_refs.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">accepted_risk_refs：{active.accepted_risk_refs.length}</p>
            ) : null}
          </div>
        )
      }
      nextActions={
        <div data-ui="stack" data-direction="col" data-gap="2">
          {active.package_readiness_status === 'ready_for_promotion_review' ? (
            <p data-ui="text" data-variant="caption" data-tone="primary">
              → 已 ready_for_promotion_review，可发布 V1bToV1cInputBundle 进入 v1c 晋升桥。
            </p>
          ) : (
            <p data-ui="text" data-variant="caption" data-tone="muted">
              package_readiness_status={active.package_readiness_status}，发布将由后端按当前状态决定接受/拒绝。
            </p>
          )}
          <PublishV1cBundleAction topicPackageId={active.topic_package_id} onPublished={onMutated} />
        </div>
      }
      footer={`research_record=${active.research_record_id}`}
    />
  );
}

type PublishV1cBundleActionProps = {
  topicPackageId: string;
  onPublished?: () => void;
};

/**
 * Phase 3.5 — publish a V1bToV1cInputBundle from a TopicPackage. Endpoint
 * accepts an empty body and is idempotent; backend derives the bundle from
 * the current package state. UI just exposes a single primary button.
 */
function PublishV1cBundleAction({ topicPackageId, onPublished }: PublishV1cBundleActionProps) {
  const [publishing, setPublishing] = useState(false);
  const [bundleId, setBundleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBundleId(null);
    setError(null);
  }, [topicPackageId]);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await publishV1cInputBundle(topicPackageId);
      setBundleId(result.v1b_to_v1c_input_bundle_id);
      onPublished?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '发布 V1bToV1cInputBundle 失败。');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">V1bToV1cInputBundle · publish</p>
        <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
          <button
            type="button"
            data-ui="button"
            data-variant="primary"
            data-size="sm"
            disabled={publishing}
            onClick={() => void handlePublish()}
          >
            {publishing ? '发布中…' : '发布 V1bToV1cInputBundle'}
          </button>
          {bundleId ? (
            <span data-ui="badge" data-variant="subtle" data-tone="success">已发布：{bundleId}</span>
          ) : null}
        </div>
        {error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
