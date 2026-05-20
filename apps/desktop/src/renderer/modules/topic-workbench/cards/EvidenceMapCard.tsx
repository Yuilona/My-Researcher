import { useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionEvidenceMapRecord,
  TopicSelectionEvidenceUnitRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-evidence-map-contracts';
import { listEvidenceUnitsByEvidenceMap, markEvidenceMapStale } from '../api/v1a';

type EvidenceMapCardProps = {
  evidenceMaps: TopicSelectionEvidenceMapRecord[];
  /** Phase 2.3 — refresh v1a data after a mutation succeeds. */
  onMutated?: () => void;
};

function freshnessTone(freshness: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (freshness === 'fresh') return 'success';
  if (freshness === 'stale') return 'warning';
  return 'neutral';
}

type RoleKey = 'support' | 'challenge' | 'baseline' | 'context';

/**
 * Role badge — branches `data-tone` into explicit string literals so the UI
 * governance gate's static analyser can verify enum membership without
 * dynamic-expression false positives.
 */
function RoleBadge({ role, label }: { role: RoleKey; label: string }) {
  if (role === 'support') {
    return <span data-ui="badge" data-variant="subtle" data-tone="success">{label}</span>;
  }
  if (role === 'challenge') {
    return <span data-ui="badge" data-variant="subtle" data-tone="warning">{label}</span>;
  }
  if (role === 'baseline') {
    return <span data-ui="badge" data-variant="subtle" data-tone="info">{label}</span>;
  }
  return <span data-ui="badge" data-variant="subtle" data-tone="neutral">{label}</span>;
}

type DrilldownPanelProps = {
  evidenceMapId: string;
  refreshToken: number;
};

/**
 * Phase 2.3 — EvidenceUnit drilldown panel.
 *
 * Loads all EvidenceUnits for the active EvidenceMap and groups by
 * `evidence_role` (support / challenge / baseline / context). Renders up to
 * 5 units per group with role badge + source_statement preview + ref id.
 * Reviewer can scan support/challenge balance without opening every unit.
 *
 * ContentRef-level drilldown (→ source locator, paragraph anchor) is left
 * for a future iteration since it requires deeper navigation primitives.
 */
function DrilldownPanel({ evidenceMapId, refreshToken }: DrilldownPanelProps) {
  const [units, setUnits] = useState<TopicSelectionEvidenceUnitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void listEvidenceUnitsByEvidenceMap(evidenceMapId)
      .then((records) => {
        if (mounted) setUnits(records);
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : '加载 EvidenceUnit 失败。');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [evidenceMapId, refreshToken]);

  if (loading) {
    return (
      <p data-ui="text" data-variant="caption" data-tone="muted">加载 EvidenceUnit…</p>
    );
  }
  if (error) {
    return <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p>;
  }
  if (units.length === 0) {
    return (
      <p data-ui="text" data-variant="caption" data-tone="muted">无 EvidenceUnit 记录。</p>
    );
  }

  const grouped: Record<RoleKey, TopicSelectionEvidenceUnitRecord[]> = {
    support: [],
    challenge: [],
    baseline: [],
    context: [],
  };
  for (const unit of units) {
    const role = unit.evidence_role;
    if (role === 'support' || role === 'challenge' || role === 'baseline' || role === 'context') {
      grouped[role].push(unit);
    }
  }
  const groups: Array<{ key: RoleKey; label: string }> = [
    { key: 'support', label: 'Support' },
    { key: 'challenge', label: 'Challenge' },
    { key: 'baseline', label: 'Baseline' },
    { key: 'context', label: 'Context' },
  ];

  return (
    <div data-ui="stack" data-direction="col" data-gap="2">
      {groups.map(({ key, label }) => {
        const items = grouped[key];
        if (items.length === 0) {
          return (
            <div key={key} data-ui="stack" data-direction="col" data-gap="0">
              <div data-ui="stack" data-direction="row" data-gap="1" data-align="center">
                <RoleBadge role={key} label={label} />
                <p data-ui="text" data-variant="caption" data-tone="muted">无 EvidenceUnit。</p>
              </div>
            </div>
          );
        }
        const preview = items.slice(0, 5);
        return (
          <div key={key} data-ui="stack" data-direction="col" data-gap="1">
            <div data-ui="stack" data-direction="row" data-gap="1" data-align="center" data-wrap="wrap">
              <RoleBadge role={key} label={label} />
              <span data-ui="text" data-variant="caption" data-tone="muted">{items.length}</span>
            </div>
            {preview.map((unit) => (
              <div key={unit.evidence_unit_id} data-ui="stack" data-direction="col" data-gap="0">
                <p data-ui="text" data-variant="caption" data-tone="primary">
                  {unit.source_statement.slice(0, 160) || '— 无 source_statement —'}
                </p>
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  literature={unit.literature_ref.ref_id} · attribution={unit.source_attribution_kind}
                </p>
              </div>
            ))}
            {items.length > preview.length ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                仅显示前 {preview.length}/{items.length} 条；其余可在后续版本展开查看。
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type StaleFormProps = {
  evidenceMap: TopicSelectionEvidenceMapRecord;
  onMarked: () => void;
};

function StaleForm({ evidenceMap, onMarked }: StaleFormProps) {
  const [reasonsText, setReasonsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marked, setMarked] = useState<string | null>(null);

  useEffect(() => {
    setReasonsText('');
    setError(null);
    setMarked(null);
  }, [evidenceMap.evidence_map_id]);

  const canSubmit = reasonsText.trim().length > 0 && !busy && evidenceMap.freshness_status !== 'stale';

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const codes = reasonsText.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
      const result = await markEvidenceMapStale(evidenceMap.evidence_map_id, { stale_reason_codes: codes });
      setMarked(result.evidence_map_id);
      onMarked();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '标记 stale 失败。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">Phase 2.3 · 标记 EvidenceMap 为 stale</p>
        {evidenceMap.freshness_status === 'stale' ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            当前 EvidenceMap 已是 stale；如需进一步处理，请触发 SearchPlan revision 重建。
          </p>
        ) : (
          <>
            <textarea
              data-ui="textarea"
              data-size="sm"
              rows={2}
              placeholder="stale_reason_codes（每行一条）"
              value={reasonsText}
              onChange={(event) => setReasonsText(event.target.value)}
            />
            <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
              {canSubmit ? (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="danger"
                  data-size="sm"
                  onClick={() => void handleSubmit()}
                  disabled={busy}
                >
                  {busy ? '标记中…' : '标记为 stale'}
                </button>
              ) : (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="secondary"
                  data-size="sm"
                  disabled
                >
                  标记为 stale
                </button>
              )}
              {marked ? (
                <span data-ui="badge" data-variant="subtle" data-tone="warning">已标记：{marked}</span>
              ) : null}
            </div>
          </>
        )}
        {error ? <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p> : null}
      </div>
    </section>
  );
}

/**
 * v1a EvidenceMap surface — Phase 2.3 ships:
 *  - EvidenceUnit drilldown grouped by role (top 5 per group)
 *  - "标记为 stale" inline form
 *
 * ContentRef-level locator drilldown is intentionally deferred until the
 * reviewer workbench gains a dedicated trace drawer (Phase 5 横切).
 */
export function EvidenceMapCard({ evidenceMaps, onMutated }: EvidenceMapCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(evidenceMaps[0]?.evidence_map_id ?? null);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [unitsRefreshToken, setUnitsRefreshToken] = useState(0);
  const active = evidenceMaps.find((item) => item.evidence_map_id === selectedId) ?? evidenceMaps[0] ?? null;

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">EvidenceMap</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡还没有 EvidenceMap。先在 SearchPlan 标签触发 SearchRun，再回这里构建 EvidenceMap。
          </p>
        </div>
      </article>
    );
  }

  const versionSelector = evidenceMaps.length > 1 ? (
    <select
      data-ui="select"
      data-size="sm"
      value={active.evidence_map_id}
      onChange={(event) => setSelectedId(event.target.value)}
    >
      {evidenceMaps.map((item) => (
        <option key={item.evidence_map_id} value={item.evidence_map_id}>
          {item.evidence_map_version} · {item.freshness_status}
        </option>
      ))}
    </select>
  ) : null;

  return (
    <ReviewerCard
      kind="EvidenceMap"
      subjectId={active.evidence_map_id}
      status={{ label: active.status, tone: 'info' }}
      chips={[
        { label: `version ${active.evidence_map_version}`, tone: 'info' },
        { label: `review ${active.review_status}`, tone: 'neutral' },
        { label: `freshness ${active.freshness_status}`, tone: freshnessTone(active.freshness_status) },
        ...(evidenceMaps.length > 1 ? [{ label: `history ${evidenceMaps.length}`, tone: 'neutral' as const }] : []),
      ]}
      verdict={
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="body" data-tone="primary">
            EvidenceMap 已构建，等待 NeedCandidate 生成。
          </p>
          {versionSelector ? (
            <div data-ui="stack" data-direction="row" data-gap="2" data-align="center">
              <span data-ui="text" data-variant="caption" data-tone="muted">切换 evidence map 版本</span>
              {versionSelector}
            </div>
          ) : null}
        </div>
      }
      support={
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="body" data-tone="primary">
            support_unit_count = {active.support_unit_count}
          </p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            baseline {active.baseline_unit_count} · context {active.context_unit_count} · 共 {active.unit_count} 条 EvidenceUnit
          </p>
        </div>
      }
      challenge={
        active.challenge_unit_count === 0 ? (
          <ReviewerCardEmpty label="未发现 challenge 类 EvidenceUnit。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="body" data-tone="primary">
              challenge_unit_count = {active.challenge_unit_count}
            </p>
          </div>
        )
      }
      blockers={
        active.freshness_status === 'stale' || active.stale_reason_codes.length > 0 ? (
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="caption" data-tone="muted">
              evidence map 被标记为 stale，相关 NeedCandidate 可能需要 recheck。
            </p>
            {active.stale_reason_codes.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                stale 原因：{active.stale_reason_codes.join(' · ')}
              </p>
            ) : null}
          </div>
        ) : (
          <ReviewerCardEmpty label="未发现 EvidenceMap 级 blocker。" />
        )
      }
      nextActions={
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="caption" data-tone="muted">
            → 进入 NeedCandidate 标签查看由此 evidence map 派生的候选。
          </p>
          <section data-ui="section" data-padding="sm">
            <div data-ui="stack" data-direction="col" data-gap="1">
              <p data-ui="text" data-variant="label" data-tone="muted">EvidenceUnit drilldown</p>
              <div data-ui="stack" data-direction="row" data-gap="1" data-align="center">
                {unitsOpen ? (
                  <button
                    type="button"
                    data-ui="button"
                    data-variant="ghost"
                    data-size="sm"
                    onClick={() => setUnitsOpen(false)}
                  >
                    收起 EvidenceUnit
                  </button>
                ) : (
                  <button
                    type="button"
                    data-ui="button"
                    data-variant="secondary"
                    data-size="sm"
                    onClick={() => setUnitsOpen(true)}
                  >
                    展开 EvidenceUnit drilldown
                  </button>
                )}
              </div>
              {unitsOpen ? (
                <DrilldownPanel
                  evidenceMapId={active.evidence_map_id}
                  refreshToken={unitsRefreshToken}
                />
              ) : null}
            </div>
          </section>
          <StaleForm
            evidenceMap={active}
            onMarked={() => {
              setUnitsRefreshToken((token) => token + 1);
              onMutated?.();
            }}
          />
        </div>
      }
      footer={`created_at=${active.created_at}`}
    />
  );
}
