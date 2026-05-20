import { useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionPromotionCommitmentProfileRecord,
  TopicSelectionPromotionDecisionBundle,
  TopicSelectionPromotionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import { getPromotionDecisionBundle } from '../api/v1c';

type PromotionCommitmentProfileCardProps = {
  promotionDecisions: TopicSelectionPromotionDecisionRecord[];
};

/**
 * v1c PromotionCommitmentProfile surface — design-spec §380 mandates 7
 * fields are frozen at promote-class human-confirm time: scope /
 * claim_ceiling / non_negotiable_boundaries (prohibited_claims) /
 * accepted_risk_refs / early_check_obligations / allowed_refinements /
 * stop_reopen_conditions.
 *
 * The profile is derived server-side and exposed via the PromotionDecision
 * bundle endpoint. This card fetches the bundle for the active decision and
 * surfaces all 7 fields in read-only form.
 */
export function PromotionCommitmentProfileCard({
  promotionDecisions,
}: PromotionCommitmentProfileCardProps) {
  const promoteDecisions = promotionDecisions.filter(
    (item) => Boolean(item.promotion_commitment_profile_id) && item.bridge_eligible,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    promoteDecisions[0]?.promotion_decision_id ?? null,
  );
  const active = promoteDecisions.find((item) => item.promotion_decision_id === selectedId)
    ?? promoteDecisions[0]
    ?? null;

  const [bundle, setBundle] = useState<TopicSelectionPromotionDecisionBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      setBundle(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    void getPromotionDecisionBundle(active.promotion_decision_id)
      .then((result) => {
        if (mounted) setBundle(result);
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : '加载 commitment profile 失败。');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [active?.promotion_decision_id]);

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">PromotionCommitmentProfile</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡还没有 promote-class 决策的 CommitmentProfile。先在 Decision 标签提交 promote_to_paper_project 或 promote_with_conditions。
          </p>
        </div>
      </article>
    );
  }

  const profile: TopicSelectionPromotionCommitmentProfileRecord | null = bundle?.promotion_commitment_profile ?? null;
  const decisionSelector = promoteDecisions.length > 1 ? (
    <select
      data-ui="select"
      data-size="sm"
      value={active.promotion_decision_id}
      onChange={(event) => setSelectedId(event.target.value)}
    >
      {promoteDecisions.map((item) => (
        <option key={item.promotion_decision_id} value={item.promotion_decision_id}>
          {item.promotion_decision_id} · {item.decision}
        </option>
      ))}
    </select>
  ) : null;

  if (loading) {
    return (
      <article data-ui="card">
        <p data-ui="text" data-variant="caption" data-tone="muted">加载 commitment profile…</p>
      </article>
    );
  }

  if (error || !profile) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">PromotionCommitmentProfile</p>
          <p data-ui="text" data-variant="caption" data-tone={error ? 'danger' : 'muted'}>
            {error ?? '该决策尚未生成 commitment profile（backend 可能仅在 promote-class 路径生成）。'}
          </p>
        </div>
      </article>
    );
  }

  return (
    <ReviewerCard
      kind="PromotionCommitmentProfile"
      subjectId={profile.promotion_commitment_profile_id}
      status={{ label: 'frozen', tone: 'success' }}
      chips={[
        { label: `decision ${active.decision}`, tone: 'info' },
        { label: `package ${profile.package_version}`, tone: 'neutral' },
        ...(promoteDecisions.length > 1 ? [{ label: `history ${promoteDecisions.length}`, tone: 'neutral' as const }] : []),
      ]}
      verdict={
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="body" data-tone="primary">
            claim_ceiling：{profile.claim_ceiling}
          </p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            topic_package_id={profile.topic_package_id} · gate_check={profile.promotion_gate_check_id}
          </p>
          {decisionSelector ? (
            <div data-ui="stack" data-direction="row" data-gap="2" data-align="center">
              <span data-ui="text" data-variant="caption" data-tone="muted">切换 commitment</span>
              {decisionSelector}
            </div>
          ) : null}
        </div>
      }
      support={
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="caption" data-tone="primary">
            scope 字段
          </p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            scope keys：{Object.keys(profile.scope).join(', ') || '— 空 scope —'}
          </p>
          <p data-ui="text" data-variant="caption" data-tone="primary">
            allowed_refinements（{profile.allowed_refinements.length}）
          </p>
          {profile.allowed_refinements.length > 0 ? (
            <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap">
              {profile.allowed_refinements.slice(0, 6).map((ref, idx) => (
                <span key={idx} data-ui="badge" data-variant="subtle" data-tone="info">
                  {ref.refinement_code}
                </span>
              ))}
            </div>
          ) : null}
          <p data-ui="text" data-variant="caption" data-tone="primary">
            early_check_obligations（{profile.early_check_obligations.length}）
          </p>
          {profile.early_check_obligations.length > 0 ? (
            <ul data-ui="stack" data-direction="col" data-gap="0">
              {profile.early_check_obligations.slice(0, 4).map((obl, idx) => (
                <li key={idx}>
                  <p data-ui="text" data-variant="caption" data-tone="muted">· {obl}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      }
      challenge={
        profile.prohibited_claims.length === 0 ? (
          <ReviewerCardEmpty label="无 prohibited_claims（commitment 未声明禁区）。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="caption" data-tone="primary">
              prohibited_claims（{profile.prohibited_claims.length}）
            </p>
            <ul data-ui="stack" data-direction="col" data-gap="0">
              {profile.prohibited_claims.slice(0, 4).map((claim, idx) => (
                <li key={idx}>
                  <p data-ui="text" data-variant="caption" data-tone="muted">· {claim}</p>
                </li>
              ))}
            </ul>
          </div>
        )
      }
      blockers={
        profile.stop_conditions.length === 0 && profile.reopen_conditions.length === 0 ? (
          <ReviewerCardEmpty label="无 stop / reopen conditions。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="caption" data-tone="muted">
              stop_conditions：{profile.stop_conditions.length} · reopen_conditions：{profile.reopen_conditions.length}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              accepted_risk_refs：{profile.accepted_risk_refs.length}
            </p>
          </div>
        )
      }
      nextActions={
        <p data-ui="text" data-variant="caption" data-tone="primary">
          → 进入 Bridge 标签可基于此 commitment 创建 PaperProjectBridge。
        </p>
      }
      footer={`created_at=${profile.created_at}`}
    />
  );
}
