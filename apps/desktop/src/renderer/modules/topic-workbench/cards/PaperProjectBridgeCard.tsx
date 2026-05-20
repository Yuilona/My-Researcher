import { useCallback, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionPromotionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import type {
  TopicSelectionPaperProjectBridgeRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import {
  createPaperProjectBridge,
  createPaperProjectIntakeFromBridge,
} from '../api/v1c';

type PaperProjectBridgeCardProps = {
  bridges: TopicSelectionPaperProjectBridgeRecord[];
  promotionDecisions: TopicSelectionPromotionDecisionRecord[];
  onMutated?: () => void;
};

function bridgeStatusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'active' || status === 'intake_created') return 'success';
  if (status === 'pending_intake') return 'info';
  if (status === 'reopened' || status === 'paused') return 'warning';
  if (status === 'closed' || status === 'rejected') return 'neutral';
  return 'info';
}

/**
 * v1c PaperProjectBridge surface — design-spec §357 only promote /
 * promote_with_conditions decisions create a PaperProjectBridge. Phase 4
 * ships:
 *   - List of existing bridges for the title-card
 *   - Inline form to create a bridge from a promote-class PromotionDecision
 *   - Intake button to push a working-copy payload to paper-project
 *     (idempotent on the bridge state).
 */
export function PaperProjectBridgeCard({
  bridges,
  promotionDecisions,
  onMutated,
}: PaperProjectBridgeCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    bridges[0]?.paper_project_bridge_id ?? null,
  );
  const active = bridges.find((item) => item.paper_project_bridge_id === selectedId) ?? bridges[0] ?? null;
  const promoteEligible = promotionDecisions.filter(
    (d) => d.bridge_eligible && !bridges.some((b) => b.source_promotion_decision_id === d.promotion_decision_id),
  );

  return (
    <div data-ui="stack" data-direction="col" data-gap="2">
      {bridges.length > 1 ? (
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <span data-ui="text" data-variant="caption" data-tone="muted">
            PaperProjectBridges（{bridges.length}）
          </span>
          <select
            data-ui="select"
            data-size="sm"
            value={active?.paper_project_bridge_id ?? ''}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {bridges.map((item) => (
              <option key={item.paper_project_bridge_id} value={item.paper_project_bridge_id}>
                {item.paper_project_bridge_id} · {item.bridge_status}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {active ? (
        <ReviewerCard
          kind="PaperProjectBridge"
          subjectId={active.paper_project_bridge_id}
          status={{ label: active.bridge_status, tone: bridgeStatusTone(active.bridge_status) }}
          chips={[
            { label: `decision ${active.decision}`, tone: 'info' },
            { label: `pkg ${active.package_version}`, tone: 'neutral' },
            ...(active.paper_project_intake_ref ? [{ label: 'intake created', tone: 'success' as const }] : []),
            ...(active.target_paper_project_ref ? [{ label: `paper=${active.target_paper_project_ref.ref_id}`, tone: 'success' as const }] : []),
          ]}
          verdict={
            <div data-ui="stack" data-direction="col" data-gap="1">
              <p data-ui="text" data-variant="body" data-tone="primary">
                Bridge from PromotionDecision {active.source_promotion_decision_id}
              </p>
              <p data-ui="text" data-variant="caption" data-tone="muted">
                snapshot_hash={active.promotion_input_snapshot_hash.slice(0, 16)}… · payload_hash={active.bridge_payload_hash.slice(0, 16)}…
              </p>
            </div>
          }
          support={
            active.conditions.length === 0 && active.allowed_refinements.length === 0 ? (
              <ReviewerCardEmpty label="bridge 不携带 conditions / allowed_refinements。" />
            ) : (
              <div data-ui="stack" data-direction="col" data-gap="1">
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  conditions {active.conditions.length} · allowed_refinements {active.allowed_refinements.length}
                </p>
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  early_check_obligations {active.early_check_obligations.length} · accepted_risk_refs {active.accepted_risk_refs.length}
                </p>
              </div>
            )
          }
          challenge={
            active.stop_conditions.length === 0 && active.reopen_conditions.length === 0 ? (
              <ReviewerCardEmpty label="bridge 不携带 stop / reopen conditions。" />
            ) : (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                stop_conditions {active.stop_conditions.length} · reopen_conditions {active.reopen_conditions.length}
              </p>
            )
          }
          blockers={
            <ReviewerCardEmpty label="bridge 自身不维护 blocker；upstream 异常通过 DownstreamFeedback 回传。" />
          }
          nextActions={<IntakeAction bridge={active} onSubmitted={onMutated} />}
          footer={`commitment=${active.promotion_commitment_profile_id} · gate=${active.promotion_gate_check_ref.ref_id}`}
        />
      ) : (
        <article data-ui="card">
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡尚无 PaperProjectBridge。需在 Decision 标签完成 promote_to_paper_project 或 promote_with_conditions 决策后，从下方表单创建。
          </p>
        </article>
      )}

      <CreateBridgeForm
        promoteEligibleDecisions={promoteEligible}
        onSubmitted={onMutated}
      />
    </div>
  );
}

type CreateBridgeFormProps = {
  promoteEligibleDecisions: TopicSelectionPromotionDecisionRecord[];
  onSubmitted?: () => void;
};

function CreateBridgeForm({ promoteEligibleDecisions, onSubmitted }: CreateBridgeFormProps) {
  const [decisionId, setDecisionId] = useState<string>(
    promoteEligibleDecisions[0]?.promotion_decision_id ?? '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const canSubmit = !submitting && decisionId.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createPaperProjectBridge({
        promotion_decision_id: decisionId.trim(),
        created_by: 'human',
      });
      setCreatedId(result.paper_project_bridge_id);
      onSubmitted?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '创建 PaperProjectBridge 失败。');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, decisionId, onSubmitted]);

  return (
    <article data-ui="card" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="2">
        <p data-ui="text" data-variant="label" data-tone="primary">创建 PaperProjectBridge</p>
        {promoteEligibleDecisions.length === 0 ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            无可用 promote-class PromotionDecision。先在 Decision 标签提交 promote_to_paper_project 或 promote_with_conditions 决策。
          </p>
        ) : (
          <>
            <section data-ui="section" data-padding="sm">
              <div data-ui="stack" data-direction="col" data-gap="1">
                <p data-ui="text" data-variant="label" data-tone="muted">Source PromotionDecision</p>
                <select
                  data-ui="select"
                  data-size="md"
                  value={decisionId}
                  onChange={(event) => setDecisionId(event.target.value)}
                >
                  {promoteEligibleDecisions.map((decision) => (
                    <option key={decision.promotion_decision_id} value={decision.promotion_decision_id}>
                      {decision.promotion_decision_id} · {decision.decision}
                    </option>
                  ))}
                </select>
              </div>
            </section>
            <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
              {canSubmit ? (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="primary"
                  data-size="md"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? '创建中…' : '创建 PaperProjectBridge'}
                </button>
              ) : (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="secondary"
                  data-size="md"
                  disabled
                >
                  创建 PaperProjectBridge
                </button>
              )}
              {createdId ? (
                <span data-ui="badge" data-variant="subtle" data-tone="success">已创建：{createdId}</span>
              ) : null}
            </div>
            {error ? <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p> : null}
          </>
        )}
      </div>
    </article>
  );
}

type IntakeActionProps = {
  bridge: TopicSelectionPaperProjectBridgeRecord;
  onSubmitted?: () => void;
};

function IntakeAction({ bridge, onSubmitted }: IntakeActionProps) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intakeRefId, setIntakeRefId] = useState<string | null>(
    bridge.paper_project_intake_ref?.ref_id ?? null,
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createPaperProjectIntakeFromBridge(bridge.paper_project_bridge_id, {
        bridge_payload_hash: bridge.bridge_payload_hash,
        title: title.trim() || null,
        created_by: { actor_type: 'human', actor_id: 'reviewer' },
      });
      setIntakeRefId(result.paper_project_intake_ref.ref_id);
      onSubmitted?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '创建 PaperProjectIntake 失败。');
    } finally {
      setSubmitting(false);
    }
  }, [bridge.paper_project_bridge_id, bridge.bridge_payload_hash, title, onSubmitted]);

  if (intakeRefId) {
    return (
      <p data-ui="text" data-variant="caption" data-tone="primary">
        → 已交接到 paper-project intake：{intakeRefId}。后续在论文管理模块查看。
      </p>
    );
  }

  return (
    <div data-ui="stack" data-direction="col" data-gap="1">
      <p data-ui="text" data-variant="caption" data-tone="primary">
        → 进入 paper-project：触发 PaperProjectIntake 把 working-copy 交接给论文管理模块（idempotent）。
      </p>
      <input
        data-ui="input"
        data-size="sm"
        placeholder="paper title（可选）"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
        <button
          type="button"
          data-ui="button"
          data-variant="primary"
          data-size="sm"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? '创建中…' : '创建 PaperProjectIntake'}
        </button>
      </div>
      {error ? <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p> : null}
    </div>
  );
}
