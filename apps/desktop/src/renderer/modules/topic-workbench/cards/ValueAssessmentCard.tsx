import { useCallback, useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionTopicValueAssessmentRecord,
  TopicSelectionValueDisposition,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import { submitValueDispositionDecision } from '../api/v1b';

type ValueAssessmentCardProps = {
  valueAssessments: TopicSelectionTopicValueAssessmentRecord[];
  onMutated?: () => void;
};

function readinessTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'ready_for_disposition') return 'success';
  if (status === 'blocked' || status === 'needs_refinement') return 'warning';
  return 'info';
}

function freshnessTone(freshness: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (freshness === 'current') return 'success';
  if (freshness === 'recheck_required' || freshness === 'stale') return 'warning';
  return 'neutral';
}

/**
 * v1b TopicValueAssessment surface — Phase 3.1 read-only view.
 *
 * Lists value assessments with hard_gates, dimension scores, and legacy
 * verdict. ValueDispositionDecision human-confirm UI lands in Phase 3.4.
 */
export function ValueAssessmentCard({ valueAssessments, onMutated }: ValueAssessmentCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    valueAssessments[0]?.topic_value_assessment_id ?? null,
  );
  const active = valueAssessments.find((item) => item.topic_value_assessment_id === selectedId)
    ?? valueAssessments[0]
    ?? null;

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">TopicValueAssessment</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡的 v1b 还没生成 TopicValueAssessment。先在 Question surface 选定 TopicQuestion。
          </p>
        </div>
      </article>
    );
  }

  const failedGates = active.hard_gates.filter((gate) => gate.verdict === 'fail');
  const passedGates = active.hard_gates.filter((gate) => gate.verdict === 'pass');
  const setSelector = valueAssessments.length > 1 ? (
    <select
      data-ui="select"
      data-size="sm"
      value={active.topic_value_assessment_id}
      onChange={(event) => setSelectedId(event.target.value)}
    >
      {valueAssessments.map((item) => (
        <option key={item.topic_value_assessment_id} value={item.topic_value_assessment_id}>
          {item.topic_value_assessment_id} · {item.legacy_verdict} · {item.readiness_status}
        </option>
      ))}
    </select>
  ) : null;

  return (
    <ReviewerCard
      kind="TopicValueAssessment"
      subjectId={active.topic_value_assessment_id}
      status={{ label: active.readiness_status, tone: readinessTone(active.readiness_status) }}
      chips={[
        { label: `verdict ${active.legacy_verdict}`, tone: active.legacy_verdict === 'promote' ? 'success' : 'info' },
        { label: `freshness ${active.freshness_status}`, tone: freshnessTone(active.freshness_status) },
        { label: `score ${active.total_score.toFixed(1)}`, tone: 'info' },
        { label: `confidence ${active.confidence.toFixed(2)}`, tone: 'neutral' },
        ...(valueAssessments.length > 1 ? [{ label: `history ${valueAssessments.length}`, tone: 'neutral' as const }] : []),
      ]}
      confidenceHint={`confidence=${active.confidence.toFixed(2)}（仅参考，不可作为单独通过依据）`}
      verdict={
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="body" data-tone="primary">
            strongest claim：{active.strongest_claim_if_success}
          </p>
          {active.fallback_claim_if_success ? (
            <p data-ui="text" data-variant="caption" data-tone="muted">
              fallback：{active.fallback_claim_if_success}
            </p>
          ) : null}
          <p data-ui="text" data-variant="caption" data-tone="muted">{active.value_summary}</p>
          {setSelector ? (
            <div data-ui="stack" data-direction="row" data-gap="2" data-align="center">
              <span data-ui="text" data-variant="caption" data-tone="muted">切换 assessment</span>
              {setSelector}
            </div>
          ) : null}
        </div>
      }
      support={
        active.dimension_scores.length === 0 ? (
          <ReviewerCardEmpty label="无 dimension_scores。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="caption" data-tone="primary">
              dimension_scores（{active.dimension_scores.length}） · passed gates {passedGates.length}/{active.hard_gates.length}
            </p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              ceiling: {active.ceiling_case} · base: {active.base_case} · floor: {active.floor_case}
            </p>
          </div>
        )
      }
      challenge={
        failedGates.length === 0 && active.reviewer_objections.length === 0 ? (
          <ReviewerCardEmpty label="未发现 failed hard gate / reviewer objection。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            {failedGates.length > 0 ? (
              <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap">
                {failedGates.map((gate, idx) => (
                  <span key={`${gate.gate_key}-${idx}`} data-ui="badge" data-variant="subtle" data-tone="danger">
                    fail · {gate.gate_key}
                  </span>
                ))}
              </div>
            ) : null}
            {active.reviewer_objections.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                reviewer_objections：{active.reviewer_objections.length}
              </p>
            ) : null}
          </div>
        )
      }
      blockers={
        active.blocker_refs.length === 0 && active.accepted_risk_refs.length === 0 ? (
          <ReviewerCardEmpty label="无 blocker / accepted risk refs。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            {active.blocker_refs.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                blocker_refs：{active.blocker_refs.length}
              </p>
            ) : null}
            {active.accepted_risk_refs.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                accepted_risk_refs：{active.accepted_risk_refs.length}
              </p>
            ) : null}
            {active.risk_notes.length > 0 ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">
                risk_notes: {active.risk_notes.join(' · ')}
              </p>
            ) : null}
          </div>
        )
      }
      nextActions={
        <div data-ui="stack" data-direction="col" data-gap="2">
          {active.active_disposition_decision_id ? (
            <p data-ui="text" data-variant="caption" data-tone="primary">
              → 已有 disposition decision：{active.active_disposition_decision_id}
            </p>
          ) : null}
          <ValueDispositionForm assessment={active} onSubmitted={onMutated} />
        </div>
      }
      footer={`assess_run=${active.assess_topic_value_run_id}`}
    />
  );
}

const VALUE_DISPOSITIONS: Array<{ value: TopicSelectionValueDisposition; label: string }> = [
  { value: 'advance_to_package', label: 'advance_to_package · 进入 v1b 出口（创建 TopicPackage）' },
  { value: 'refine_question', label: 'refine_question · 回流到 QuestionSelection' },
  { value: 'refine_slice', label: 'refine_slice · 回流到 SliceSelection' },
  { value: 'recheck_evidence_or_search', label: 'recheck_evidence_or_search · 回流 v1a recheck' },
  { value: 'park', label: 'park · 暂搁' },
  { value: 'drop', label: 'drop · 放弃' },
];

type ValueDispositionFormProps = {
  assessment: TopicSelectionTopicValueAssessmentRecord;
  onSubmitted?: () => void;
};

/**
 * Phase 3.4 inline form — submit a ValueDispositionDecision.
 *
 * 6 个出口，对应 design-spec v1b 链路：advance_to_package 是成功出口；其它
 * 是回流/暂搁/放弃路径。Rationale 必填。
 */
function ValueDispositionForm({ assessment, onSubmitted }: ValueDispositionFormProps) {
  const recommended: TopicSelectionValueDisposition = assessment.legacy_verdict === 'promote'
    ? 'advance_to_package'
    : assessment.legacy_verdict === 'refine'
      ? 'refine_question'
      : assessment.legacy_verdict === 'park'
        ? 'park'
        : 'drop';
  const [decision, setDecision] = useState<TopicSelectionValueDisposition>(recommended);
  const [rationale, setRationale] = useState('');
  const [requiredActionsText, setRequiredActionsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    setDecision(recommended);
    setRationale('');
    setRequiredActionsText('');
    setSubmitError(null);
    setSubmittedId(null);
  }, [assessment.topic_value_assessment_id, recommended]);

  const isTerminal = Boolean(assessment.active_disposition_decision_id);
  const canSubmit = !submitting && !isTerminal && rationale.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const required = requiredActionsText.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
      const result = await submitValueDispositionDecision(assessment.topic_value_assessment_id, {
        decision,
        decision_rationale: rationale.trim(),
        decided_by: 'human',
        required_actions: required,
      });
      setSubmittedId(result.value_disposition_decision_id);
      onSubmitted?.();
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : '提交 ValueDispositionDecision 失败。');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, assessment.topic_value_assessment_id, decision, rationale, requiredActionsText, onSubmitted]);

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">ValueDispositionDecision · human confirm</p>
        {isTerminal ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该 assessment 已经存在生效中的 disposition decision（{assessment.active_disposition_decision_id}）；如需重做，需 agent 层重新触发 AssessTopicValue。
          </p>
        ) : (
          <>
            <select
              data-ui="select"
              data-size="md"
              value={decision}
              onChange={(event) => setDecision(event.target.value as TopicSelectionValueDisposition)}
            >
              {VALUE_DISPOSITIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <textarea
              data-ui="textarea"
              data-size="md"
              rows={3}
              placeholder="decision_rationale（必填）"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
            />
            <textarea
              data-ui="textarea"
              data-size="sm"
              rows={2}
              placeholder="required_actions（每行一条，可选）"
              value={requiredActionsText}
              onChange={(event) => setRequiredActionsText(event.target.value)}
            />
            <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap" data-align="center">
              {canSubmit ? (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="primary"
                  data-size="sm"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? '提交中…' : '提交 ValueDispositionDecision'}
                </button>
              ) : (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="secondary"
                  data-size="sm"
                  disabled
                >
                  提交 ValueDispositionDecision
                </button>
              )}
              {submittedId ? (
                <span data-ui="badge" data-variant="subtle" data-tone="success">已创建：{submittedId}</span>
              ) : null}
            </div>
            {submitError ? (
              <p data-ui="text" data-variant="caption" data-tone="danger">{submitError}</p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
