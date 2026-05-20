import { useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionSearchPlanCoverageMatrix,
  TopicSelectionSearchPlanRecheckRequestRecord,
  TopicSelectionSearchPlanRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-search-resource-contracts';
import {
  createSearchPlanRecheckRequest,
  getSearchPlanCoverageMatrix,
  listSearchPlanRecheckRequestsByTitleCard,
} from '../api/v1a';

type SearchPlanCardProps = {
  searchPlans: TopicSelectionSearchPlanRecord[];
  /** Phase 2.2 — refresh v1a data after a mutation succeeds. */
  onMutated?: () => void;
};

function statusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'ready') return 'success';
  if (status === 'rejected' || status === 'superseded') return 'neutral';
  if (status === 'draft') return 'info';
  return 'info';
}

type RecheckPanelProps = {
  titleCardId: string;
  refreshToken: number;
};

/**
 * Inline list of SearchPlanRecheckRequests for the active title-card.
 * Reviewer can scan open revision requests + their status / decision_summary
 * before triggering another.
 */
function RecheckPanel({ titleCardId, refreshToken }: RecheckPanelProps) {
  const [items, setItems] = useState<TopicSelectionSearchPlanRecheckRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void listSearchPlanRecheckRequestsByTitleCard(titleCardId)
      .then((records) => {
        if (mounted) setItems(records);
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : '加载 recheck requests 失败。');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [titleCardId, refreshToken]);

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">SearchPlan recheck requests</p>
        {loading ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">加载 recheck 列表…</p>
        ) : null}
        {error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">无 recheck request。</p>
        ) : null}
        {items.map((item) => (
          <div key={item.search_plan_recheck_request_id} data-ui="stack" data-direction="col" data-gap="0">
            <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
              <span data-ui="badge" data-variant="subtle" data-tone="info">{item.status}</span>
              <span data-ui="text" data-variant="caption" data-tone="muted">
                target={item.target_search_plan_ref.ref_id}
              </span>
            </div>
            <p data-ui="text" data-variant="caption" data-tone="muted">{item.reason}</p>
            {item.decision_summary ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                decision: {item.decision_summary}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

type RevisionFormProps = {
  titleCardId: string;
  searchPlan: TopicSelectionSearchPlanRecord;
  onSubmitted: () => void;
};

/**
 * Inline form to submit a new SearchPlanRecheckRequest. `source_ref` is set
 * to the active SearchPlan itself for reviewer-initiated revisions; the
 * backend later wires it into the queue + downstream rerun pipeline.
 */
function RevisionForm({ titleCardId, searchPlan, onSubmitted }: RevisionFormProps) {
  const [reason, setReason] = useState('');
  const [gapCodesText, setGapCodesText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    setReason('');
    setGapCodesText('');
    setError(null);
    setCreatedId(null);
  }, [searchPlan.search_plan_id]);

  const canSubmit = reason.trim().length > 0 && !busy;
  const variant = canSubmit ? 'primary' : 'secondary';

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const gapCodes = gapCodesText.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
      const result = await createSearchPlanRecheckRequest({
        title_card_id: titleCardId,
        target_search_plan_id: searchPlan.search_plan_id,
        source_ref: {
          ref_type: 'search_plan',
          ref_id: searchPlan.search_plan_id,
          title_card_id: titleCardId,
        },
        reason: reason.trim(),
        gap_codes: gapCodes,
      });
      setCreatedId(result.search_plan_recheck_request_id);
      onSubmitted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '创建 recheck request 失败。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">Phase 2.2 · 触发 SearchPlan revision</p>
        <textarea
          data-ui="textarea"
          data-size="sm"
          rows={2}
          placeholder="reason：e.g. baseline 2022-2024 coverage 缺失，请补搜 …"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <textarea
          data-ui="textarea"
          data-size="sm"
          rows={2}
          placeholder="gap_codes（每行一条，可选）"
          value={gapCodesText}
          onChange={(event) => setGapCodesText(event.target.value)}
        />
        <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
          {variant === 'primary' ? (
            <button
              type="button"
              data-ui="button"
              data-variant="primary"
              data-size="sm"
              onClick={() => void handleSubmit()}
              disabled={busy}
            >
              {busy ? '提交中…' : '提交 revision 请求'}
            </button>
          ) : (
            <button
              type="button"
              data-ui="button"
              data-variant="secondary"
              data-size="sm"
              disabled
            >
              提交 revision 请求
            </button>
          )}
          {createdId ? (
            <span data-ui="badge" data-variant="subtle" data-tone="success">已创建：{createdId}</span>
          ) : null}
        </div>
        {error ? (
          <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p>
        ) : null}
      </div>
    </section>
  );
}

type CoverageMatrixPanelProps = {
  searchPlanId: string;
};

/**
 * Coverage-matrix inline view — toggled below the SearchPlan card.
 *
 * For Phase 2.2 we show summary counts + first N rows in a table. Reviewer
 * can use this to confirm "what's missing" before submitting a revision.
 */
function CoverageMatrixPanel({ searchPlanId }: CoverageMatrixPanelProps) {
  const [matrix, setMatrix] = useState<TopicSelectionSearchPlanCoverageMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void getSearchPlanCoverageMatrix(searchPlanId)
      .then((result) => {
        if (mounted) setMatrix(result);
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : '加载 coverage matrix 失败。');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [searchPlanId]);

  if (loading) {
    return (
      <p data-ui="text" data-variant="caption" data-tone="muted">加载 coverage matrix…</p>
    );
  }
  if (error) {
    return <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p>;
  }
  if (!matrix) {
    return <p data-ui="text" data-variant="caption" data-tone="muted">无 coverage matrix 数据。</p>;
  }

  const previewRows = matrix.rows.slice(0, 6);
  const remaining = matrix.rows.length - previewRows.length;

  return (
    <div data-ui="stack" data-direction="col" data-gap="1">
      <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
        <span data-ui="badge" data-variant="subtle" data-tone="info">rows {matrix.summary.row_count}</span>
        <span data-ui="badge" data-variant="subtle" data-tone="success">satisfied {matrix.summary.satisfied_count}</span>
        <span data-ui="badge" data-variant="subtle" data-tone="warning">partial {matrix.summary.partial_count}</span>
        <span data-ui="badge" data-variant="subtle" data-tone="danger">missing {matrix.summary.missing_count}</span>
        <span data-ui="badge" data-variant="subtle" data-tone="neutral">accepted_risk {matrix.summary.accepted_risk_count}</span>
        <span data-ui="badge" data-variant="subtle" data-tone="neutral">unassessed {matrix.summary.unassessed_count}</span>
      </div>
      {previewRows.length === 0 ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">无 coverage row。</p>
      ) : (
        <table data-ui="table" data-density="compact">
          <thead>
            <tr>
              <th>coverage_key</th>
              <th>intent_type</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr key={`${row.coverage_row_intent.coverage_row_intent_id}-${idx}`}>
                <td>{row.coverage_row_intent.coverage_key}</td>
                <td>{row.coverage_row_intent.intent_type}</td>
                <td>{row.latest_assessment?.verdict ?? 'unassessed'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {remaining > 0 ? (
        <p data-ui="text" data-variant="caption" data-tone="muted">
          仅显示前 {previewRows.length} 行；剩余 {remaining} 行未显示。
        </p>
      ) : null}
    </div>
  );
}

/**
 * v1a SearchPlan surface — Phase 2.2 ships:
 *  - revision form (POST /search-plan-recheck-requests)
 *  - coverage matrix inline toggle (GET /search-plans/:id/coverage-matrix)
 *  - inline list of existing SearchPlanRecheckRequests for the title-card
 *
 * SearchRun trigger (POST /search-runs) is intentionally deferred — it
 * requires a long-form payload (query_provenance, result_accounting, etc.)
 * that's outside the lightweight reviewer workbench; instead reviewer
 * submits revision and the agent layer runs the new plan downstream.
 */
export function SearchPlanCard({ searchPlans, onMutated }: SearchPlanCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(searchPlans[0]?.search_plan_id ?? null);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [recheckRefreshToken, setRecheckRefreshToken] = useState(0);
  const active = searchPlans.find((item) => item.search_plan_id === selectedId) ?? searchPlans[0] ?? null;

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">SearchPlan</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡还没有 SearchPlan。先由 agent 层从 TopicSeed 生成；当前不在桌面端创建。
          </p>
        </div>
      </article>
    );
  }

  const planSelector = searchPlans.length > 1 ? (
    <select
      data-ui="select"
      data-size="sm"
      value={active.search_plan_id}
      onChange={(event) => setSelectedId(event.target.value)}
    >
      {searchPlans.map((plan) => (
        <option key={plan.search_plan_id} value={plan.search_plan_id}>
          {plan.plan_version} · {plan.status}
        </option>
      ))}
    </select>
  ) : null;

  return (
    <div data-ui="stack" data-direction="col" data-gap="2">
      <ReviewerCard
        kind="SearchPlan"
        subjectId={active.search_plan_id}
        status={{ label: active.status, tone: statusTone(active.status) }}
        chips={[
          { label: `version ${active.plan_version}`, tone: 'info' },
          { label: `created_by ${active.created_by}`, tone: 'neutral' },
          ...(searchPlans.length > 1 ? [{ label: `history ${searchPlans.length}`, tone: 'neutral' as const }] : []),
        ]}
        verdict={
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="body" data-tone="primary">
              {active.query_intents.length} 个 query intents 驱动当前覆盖计划
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              topic_seed_ref={active.topic_seed_ref.ref_id} · snapshot_ref={active.literature_snapshot_ref.ref_id}
            </p>
            {planSelector ? (
              <div data-ui="stack" data-direction="row" data-gap="2" data-align="center">
                <span data-ui="text" data-variant="caption" data-tone="muted">切换 plan 版本</span>
                {planSelector}
              </div>
            ) : null}
          </div>
        }
        support={
          active.query_intents.length === 0 && active.must_check_constraints.length === 0 ? (
            <ReviewerCardEmpty label="该 SearchPlan 还没有 query intent / must-check 约束。" />
          ) : (
            <div data-ui="stack" data-direction="col" data-gap="1">
              <p data-ui="text" data-variant="caption" data-tone="primary">Query intents（{active.query_intents.length}）</p>
              <ul data-ui="stack" data-direction="col" data-gap="0">
                {active.query_intents.slice(0, 5).map((intent, idx) => (
                  <li key={`${intent}-${idx}`}>
                    <p data-ui="text" data-variant="caption" data-tone="muted">· {intent}</p>
                  </li>
                ))}
                {active.query_intents.length > 5 ? (
                  <li>
                    <p data-ui="text" data-variant="caption" data-tone="muted">… 共 {active.query_intents.length} 项</p>
                  </li>
                ) : null}
              </ul>
              {active.must_check_constraints.length > 0 ? (
                <>
                  <p data-ui="text" data-variant="caption" data-tone="primary">
                    must-check（{active.must_check_constraints.length}）
                  </p>
                  <ul data-ui="stack" data-direction="col" data-gap="0">
                    {active.must_check_constraints.slice(0, 5).map((cstr, idx) => (
                      <li key={`${cstr}-${idx}`}>
                        <p data-ui="text" data-variant="caption" data-tone="muted">· {cstr}</p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )
        }
        challenge={
          active.exclusion_rules.length === 0 ? (
            <ReviewerCardEmpty label="没有声明的排除规则；任何 challenge 都通过 EvidenceMap 中的 challenge_refs 看到。" />
          ) : (
            <div data-ui="stack" data-direction="col" data-gap="1">
              <p data-ui="text" data-variant="caption" data-tone="primary">
                exclusion rules（{active.exclusion_rules.length}）
              </p>
              <ul data-ui="stack" data-direction="col" data-gap="0">
                {active.exclusion_rules.slice(0, 5).map((rule, idx) => (
                  <li key={`${rule}-${idx}`}>
                    <p data-ui="text" data-variant="caption" data-tone="muted">· {rule}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        blockers={
          active.recheck_request_ref ? (
            <p data-ui="text" data-variant="caption" data-tone="muted">
              该 plan 由 recheck 请求触发：{active.recheck_request_ref.ref_id}
            </p>
          ) : (
            <ReviewerCardEmpty label="未发现 plan 级 blocker。" />
          )
        }
        nextActions={
          <div data-ui="stack" data-direction="col" data-gap="2">
            <p data-ui="text" data-variant="caption" data-tone="muted">
              → 在 EvidenceMap 标签查看由该 plan 的 SearchRun 构建的 EvidenceMap
            </p>
            <section data-ui="section" data-padding="sm">
              <div data-ui="stack" data-direction="col" data-gap="1">
                <p data-ui="text" data-variant="label" data-tone="muted">Coverage matrix</p>
                <div data-ui="stack" data-direction="row" data-gap="1" data-align="center">
                  {coverageOpen ? (
                    <button
                      type="button"
                      data-ui="button"
                      data-variant="ghost"
                      data-size="sm"
                      onClick={() => setCoverageOpen(false)}
                    >
                      收起 coverage matrix
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-ui="button"
                      data-variant="secondary"
                      data-size="sm"
                      onClick={() => setCoverageOpen(true)}
                    >
                      查看 coverage matrix
                    </button>
                  )}
                </div>
                {coverageOpen ? <CoverageMatrixPanel searchPlanId={active.search_plan_id} /> : null}
              </div>
            </section>
            <RevisionForm
              titleCardId={active.title_card_id}
              searchPlan={active}
              onSubmitted={() => {
                setRecheckRefreshToken((token) => token + 1);
                onMutated?.();
              }}
            />
            <RecheckPanel titleCardId={active.title_card_id} refreshToken={recheckRefreshToken} />
          </div>
        }
        footer={`created_at=${active.created_at}`}
      />
    </div>
  );
}
