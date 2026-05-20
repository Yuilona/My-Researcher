import { useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionCandidateDecisionMemorySuggestionRecord,
  TopicSelectionNeedAdjudicationDecision,
  TopicSelectionNeedCandidateReadinessAssessmentRecord,
  TopicSelectionNeedCandidateRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import {
  assessNeedCandidateReadiness,
  createValidationSupportPacket,
  listMemorySuggestionsByNeedCandidate,
} from '../api/v1a';

type NeedCandidateReviewCardProps = {
  needCandidates: TopicSelectionNeedCandidateRecord[];
  /**
   * Phase 2.4/2.5 — open the adjudication confirm form for a candidate,
   * optionally pre-selecting a non-validate decision (reject / park /
   * request_searchplan_recheck / etc.) for quick-action triage.
   */
  onAdjudicate?: (
    candidate: TopicSelectionNeedCandidateRecord,
    initialDecision?: TopicSelectionNeedAdjudicationDecision,
  ) => void;
  /** Phase 2.4 — request a v1a data reload after a triage action mutates state. */
  onMutated?: () => void;
};

function decisionTone(decision: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (decision === 'resulted_in_validated_need') return 'success';
  if (decision === 'rejected') return 'danger';
  if (decision === 'parked' || decision === 'ready_for_validation' || decision === 'searchplan_recheck_requested') return 'warning';
  if (decision === 'returned_for_revision') return 'warning';
  if (decision === 'merged') return 'info';
  return 'neutral';
}

function lifecycleTone(lifecycle: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (lifecycle === 'closed') return 'neutral';
  if (lifecycle === 'merged') return 'info';
  return 'info';
}

type AdjudicateButtonProps = {
  candidate: TopicSelectionNeedCandidateRecord;
  onAdjudicate?: NeedCandidateReviewCardProps['onAdjudicate'];
};

/**
 * Primary `adjudication confirm` entry button. Branches the data-variant
 * literal so the UI governance gate's static analyser can verify the enum
 * without dynamic-string false positives.
 */
function AdjudicateButton({ candidate, onAdjudicate }: AdjudicateButtonProps) {
  const isReady = candidate.decision_status === 'ready_for_validation'
    && !candidate.result_validated_need_id;
  const isLocked = !onAdjudicate || candidate.result_validated_need_id !== null
    && candidate.result_validated_need_id !== undefined;
  if (isReady) {
    return (
      <button
        type="button"
        data-ui="button"
        data-variant="primary"
        data-size="sm"
        disabled={isLocked}
        onClick={() => onAdjudicate?.(candidate)}
      >
        打开 adjudication confirm
      </button>
    );
  }
  return (
    <button
      type="button"
      data-ui="button"
      data-variant="secondary"
      data-size="sm"
      disabled={isLocked}
      onClick={() => onAdjudicate?.(candidate)}
    >
      打开 adjudication confirm
    </button>
  );
}

type QuickActionButtonProps = {
  candidate: TopicSelectionNeedCandidateRecord;
  decision: TopicSelectionNeedAdjudicationDecision;
  label: string;
  variant: 'secondary' | 'danger';
  disabled?: boolean;
  onAdjudicate?: NeedCandidateReviewCardProps['onAdjudicate'];
};

/**
 * Quick-action button for a non-validate adjudication path. Each label
 * pre-selects the corresponding decision on the AdjudicationConfirmForm
 * so reviewer can land directly on the right form path.
 *
 * `data-variant` is split into two literal branches so static analysis can
 * verify enum membership.
 */
function QuickActionButton({
  candidate,
  decision,
  label,
  variant,
  disabled,
  onAdjudicate,
}: QuickActionButtonProps) {
  if (variant === 'danger') {
    return (
      <button
        type="button"
        data-ui="button"
        data-variant="danger"
        data-size="sm"
        disabled={disabled || !onAdjudicate}
        onClick={() => onAdjudicate?.(candidate, decision)}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      data-ui="button"
      data-variant="secondary"
      data-size="sm"
      disabled={disabled || !onAdjudicate}
      onClick={() => onAdjudicate?.(candidate, decision)}
    >
      {label}
    </button>
  );
}

type TriageSectionProps = {
  candidate: TopicSelectionNeedCandidateRecord;
  onMutated?: () => void;
};

/**
 * Phase 2.4 — readiness assessment + support packet quick triggers.
 *
 * - "评估就绪度" calls POST /need-candidates/:id/readiness-assessments.
 * - "创建 support packet" calls POST /validation-support-packets after
 *   passing the latest readiness assessment id when available.
 *
 * Both succeed silently if the candidate is already ready_for_validation
 * or has packets; the buttons are intentionally idempotent triggers.
 */
function TriageSection({ candidate, onMutated }: TriageSectionProps) {
  const [readiness, setReadiness] = useState<TopicSelectionNeedCandidateReadinessAssessmentRecord | null>(null);
  const [busy, setBusy] = useState<'readiness' | 'packet' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setReadiness(null);
    setError(null);
    setMessage(null);
  }, [candidate.need_candidate_id]);

  const handleReadiness = async () => {
    setBusy('readiness');
    setError(null);
    setMessage(null);
    try {
      const result = await assessNeedCandidateReadiness(candidate.need_candidate_id);
      setReadiness(result);
      setMessage(`readiness=${result.recommendation}`);
      onMutated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '评估 readiness 失败。');
    } finally {
      setBusy(null);
    }
  };

  const handlePacket = async () => {
    setBusy('packet');
    setError(null);
    setMessage(null);
    try {
      const result = await createValidationSupportPacket({
        need_candidate_id: candidate.need_candidate_id,
        readiness_assessment_id: readiness?.readiness_assessment_id ?? null,
      });
      setMessage(`packet ${result.packet_status} · ${result.validation_support_packet_id}`);
      onMutated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '创建 support packet 失败。');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">Phase 2.4 · 就绪度 / 支撑包</p>
        <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
          <button
            type="button"
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            disabled={busy !== null}
            onClick={() => void handleReadiness()}
          >
            {busy === 'readiness' ? '评估中…' : '评估就绪度'}
          </button>
          <button
            type="button"
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            disabled={busy !== null}
            onClick={() => void handlePacket()}
          >
            {busy === 'packet' ? '创建中…' : '创建 support packet'}
          </button>
          {readiness ? (
            <span data-ui="badge" data-variant="subtle" data-tone="info">
              {readiness.recommendation}
            </span>
          ) : null}
        </div>
        {error ? <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p> : null}
        {message && !error ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">{message}</p>
        ) : null}
      </div>
    </section>
  );
}

type MemorySectionProps = {
  candidateId: string;
};

/**
 * Phase 2.4 — inline negative-memory section.
 *
 * Pulls `CandidateDecisionMemorySuggestion` records linked to the active
 * candidate (`source_need_candidate_id`) so reviewer can see prior reasons
 * this direction was rejected / parked / superseded before deciding.
 *
 * Renders as a card section inside the broader ReviewerCard.next-actions
 * slot via the parent.
 */
function MemorySection({ candidateId }: MemorySectionProps) {
  const [memories, setMemories] = useState<TopicSelectionCandidateDecisionMemorySuggestionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void listMemorySuggestionsByNeedCandidate(candidateId)
      .then((items) => {
        if (mounted) {
          setMemories(items);
        }
      })
      .catch((caught) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : '加载 negative memory 失败。');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [candidateId]);

  if (loading) {
    return (
      <section data-ui="section" data-padding="sm">
        <p data-ui="text" data-variant="caption" data-tone="muted">加载 negative memory…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section data-ui="section" data-padding="sm">
        <p data-ui="text" data-variant="caption" data-tone="danger">{error}</p>
      </section>
    );
  }

  if (memories.length === 0) {
    return (
      <section data-ui="section" data-padding="sm">
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="label" data-tone="muted">Negative memory</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            此候选无历史 CandidateDecisionMemorySuggestion。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">
          Negative memory（{memories.length}）
        </p>
        {memories.map((memory) => (
          <div key={memory.memory_suggestion_id} data-ui="stack" data-direction="col" data-gap="0">
            <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
              <span data-ui="badge" data-variant="subtle" data-tone="warning">{memory.suggestion_type}</span>
              <span data-ui="badge" data-variant="subtle" data-tone="neutral">{memory.status}</span>
            </div>
            <p data-ui="text" data-variant="caption" data-tone="muted">{memory.rationale}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * v1a NeedCandidate Review surface — design-spec §4039 5-section reviewer
 * card driving the candidate triage workflow:
 *  - 结论: candidate_need + decision/lifecycle/review status
 *  - 证据: support refs + strength_assessment_refs (Phase 2.3 to drill into)
 *  - 反证: unresolved_challenge_refs + conflict_refs
 *  - 阻断: open_recheck_request_refs + accepted_risk_refs + gap_codes
 *  - 下一步: required actions / readiness triggers / quick triage actions
 *           / negative memory inline
 *
 * Phase 2.1 shipped read-only ReviewerCard with refs as chips.
 * Phase 2.4 adds: readiness assessment / support packet quick triggers,
 * non-validate quick action buttons (reject / return_to_candidate /
 * request_searchplan_recheck / park / merge) pre-selecting the
 * AdjudicationConfirmForm's decision, and inline negative-memory
 * section.
 */
export function NeedCandidateReviewCard({
  needCandidates,
  onAdjudicate,
  onMutated,
}: NeedCandidateReviewCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    needCandidates[0]?.need_candidate_id ?? null,
  );
  const active = needCandidates.find(
    (item) => item.need_candidate_id === selectedId,
  ) ?? needCandidates[0] ?? null;

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">NeedCandidate</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡还没有 NeedCandidate。先到 EvidenceMap 标签确认 evidence map 就绪后再生成候选。
          </p>
        </div>
      </article>
    );
  }

  const supportRoles = active.evidence_role_bundle;
  const isTerminal = Boolean(active.result_validated_need_id)
    || active.decision_status === 'rejected'
    || active.decision_status === 'merged';

  return (
    <div data-ui="stack" data-direction="col" data-gap="2">
      {needCandidates.length > 1 ? (
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <span data-ui="text" data-variant="caption" data-tone="muted">候选列表（{needCandidates.length}）</span>
          <select
            data-ui="select"
            data-size="sm"
            value={active.need_candidate_id}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {needCandidates.map((item) => (
              <option key={item.need_candidate_id} value={item.need_candidate_id}>
                {item.candidate_need.slice(0, 60) || item.need_candidate_id} · {item.decision_status}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <ReviewerCard
        kind="NeedCandidate"
        subjectId={active.need_candidate_id}
        status={{ label: active.decision_status, tone: decisionTone(active.decision_status) }}
        chips={[
          { label: `lifecycle ${active.lifecycle_status}`, tone: lifecycleTone(active.lifecycle_status) },
          { label: `review ${active.review_status}`, tone: 'neutral' },
          { label: `prior_art ${active.prior_art_status}`, tone: 'neutral' },
          { label: `mechanism ${active.mechanism_type}`, tone: 'info' },
          ...(active.speculative ? [{ label: 'speculative', tone: 'warning' as const }] : []),
        ]}
        confidenceHint={
          active.confidence !== null && active.confidence !== undefined
            ? `confidence=${active.confidence.toFixed(2)}（仅参考，不可作为单独通过依据）`
            : '— 未提供 confidence —'
        }
        verdict={
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="body" data-tone="primary">{active.candidate_need}</p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              unmet need: {active.unmet_need_statement}
            </p>
            {active.scope_notes ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">scope: {active.scope_notes}</p>
            ) : null}
            {active.non_goal_notes ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">non-goal: {active.non_goal_notes}</p>
            ) : null}
          </div>
        }
        support={
          supportRoles.support_unit_refs.length === 0 ? (
            <ReviewerCardEmpty label="无支持类 EvidenceUnit 引用。" />
          ) : (
            <div data-ui="stack" data-direction="col" data-gap="1">
              <p data-ui="text" data-variant="caption" data-tone="primary">
                support_unit_refs（{supportRoles.support_unit_refs.length}）
              </p>
              <p data-ui="text" data-variant="caption" data-tone="muted">
                baseline {supportRoles.baseline_unit_refs.length} · context {supportRoles.context_unit_refs.length} · 强度评估 {active.strength_assessment_refs.length}
              </p>
              <p data-ui="text" data-variant="caption" data-tone="muted">
                逐条 EvidenceUnit 见 EvidenceMap surface 的 drilldown 面板。
              </p>
            </div>
          )
        }
        challenge={
          supportRoles.challenge_unit_refs.length === 0
            && active.unresolved_challenge_refs.length === 0
            && active.conflict_refs.length === 0 ? (
            <ReviewerCardEmpty label="未发现 challenge / conflict / 未解争议。" />
          ) : (
            <div data-ui="stack" data-direction="col" data-gap="1">
              {supportRoles.challenge_unit_refs.length > 0 ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  challenge_unit_refs：{supportRoles.challenge_unit_refs.length}
                </p>
              ) : null}
              {active.unresolved_challenge_refs.length > 0 ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  unresolved_challenge_refs：{active.unresolved_challenge_refs.length}
                </p>
              ) : null}
              {active.conflict_refs.length > 0 ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  conflict_refs：{active.conflict_refs.length}
                </p>
              ) : null}
            </div>
          )
        }
        blockers={
          active.open_recheck_request_refs.length === 0
            && active.accepted_risk_refs.length === 0
            && active.gap_codes.length === 0 ? (
            <ReviewerCardEmpty label="未发现 blocker / recheck / accepted risk / gap。" />
          ) : (
            <div data-ui="stack" data-direction="col" data-gap="1">
              {active.open_recheck_request_refs.length > 0 ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  open_recheck_requests：{active.open_recheck_request_refs.length}
                </p>
              ) : null}
              {active.accepted_risk_refs.length > 0 ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">
                  accepted_risks：{active.accepted_risk_refs.length}
                </p>
              ) : null}
              {active.gap_codes.length > 0 ? (
                <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap">
                  {active.gap_codes.map((code) => (
                    <span key={code} data-ui="badge" data-variant="subtle" data-tone="warning">{code}</span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        }
        nextActions={
          <div data-ui="stack" data-direction="col" data-gap="2">
            {active.result_validated_need_id ? (
              <p data-ui="text" data-variant="caption" data-tone="primary">
                → 已产出 ValidatedNeed：{active.result_validated_need_id}
              </p>
            ) : active.decision_status === 'ready_for_validation' ? (
              <p data-ui="text" data-variant="caption" data-tone="primary">
                → 此候选已 ready_for_validation，可直接发起 adjudication（6 段人审确认）。
              </p>
            ) : active.decision_status === 'rejected' ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                → 已被 reject，相关 CandidateDecisionMemory 应记录拒绝原因。
              </p>
            ) : (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                → 先 "评估就绪度" → "创建 support packet" → 再发起 adjudication。
              </p>
            )}

            <TriageSection candidate={active} onMutated={onMutated} />

            <section data-ui="section" data-padding="sm">
              <div data-ui="stack" data-direction="col" data-gap="1">
                <p data-ui="text" data-variant="label" data-tone="muted">人审入口</p>
                <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
                  <AdjudicateButton candidate={active} onAdjudicate={onAdjudicate} />
                </div>
              </div>
            </section>

            <section data-ui="section" data-padding="sm">
              <div data-ui="stack" data-direction="col" data-gap="1">
                <p data-ui="text" data-variant="label" data-tone="muted">快捷回流（预选 decision 打开人审表单）</p>
                <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
                  <QuickActionButton
                    candidate={active}
                    decision="return_to_candidate"
                    label="return_to_candidate"
                    variant="secondary"
                    disabled={isTerminal}
                    onAdjudicate={onAdjudicate}
                  />
                  <QuickActionButton
                    candidate={active}
                    decision="request_searchplan_recheck"
                    label="request_searchplan_recheck"
                    variant="secondary"
                    disabled={isTerminal}
                    onAdjudicate={onAdjudicate}
                  />
                  <QuickActionButton
                    candidate={active}
                    decision="park"
                    label="park"
                    variant="secondary"
                    disabled={isTerminal}
                    onAdjudicate={onAdjudicate}
                  />
                  <QuickActionButton
                    candidate={active}
                    decision="merge"
                    label="merge"
                    variant="secondary"
                    disabled={isTerminal}
                    onAdjudicate={onAdjudicate}
                  />
                  <QuickActionButton
                    candidate={active}
                    decision="reject"
                    label="reject"
                    variant="danger"
                    disabled={isTerminal}
                    onAdjudicate={onAdjudicate}
                  />
                </div>
              </div>
            </section>

            <MemorySection candidateId={active.need_candidate_id} />
          </div>
        }
        footer={`created_at=${active.created_at} · updated_at=${active.updated_at}`}
      />
    </div>
  );
}
