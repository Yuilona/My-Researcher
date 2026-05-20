import { useCallback, useEffect, useState } from 'react';
import { ReviewerCard, ReviewerCardEmpty } from './ReviewerCard';
import type {
  TopicSelectionTopicQuestionCandidateRecord,
  TopicSelectionTopicQuestionCandidateSetRecord,
  TopicSelectionTopicQuestionSelectionDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import {
  listTopicQuestionCandidatesByCandidateSet,
  submitQuestionSelectionDecision,
} from '../api/v1b';

type QuestionCandidateSetCardProps = {
  candidateSets: TopicSelectionTopicQuestionCandidateSetRecord[];
  onMutated?: () => void;
};

function statusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'closed' || status === 'selected') return 'success';
  if (status === 'pending_human_review') return 'warning';
  return 'info';
}

/**
 * v1b TopicQuestionCandidateSet surface — Phase 3.1 read-only view.
 *
 * Lists candidate sets produced by `FormTopicQuestion` runs. Selection
 * decisions / materialization (TopicQuestion + TopicQuestionContract)
 * land in Phase 3.3 (interactive forms).
 */
export function QuestionCandidateSetCard({ candidateSets, onMutated }: QuestionCandidateSetCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    candidateSets[0]?.topic_question_candidate_set_id ?? null,
  );
  const active = candidateSets.find((item) => item.topic_question_candidate_set_id === selectedId)
    ?? candidateSets[0]
    ?? null;

  if (!active) {
    return (
      <article data-ui="card">
        <div data-ui="stack" data-direction="col" data-gap="2">
          <p data-ui="text" data-variant="label" data-tone="primary">TopicQuestionCandidateSet</p>
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该题目卡的 v1b 还没生成 TopicQuestionCandidateSet。先在 Slice surface 选定 ResearchSlice。
          </p>
        </div>
      </article>
    );
  }

  const setSelector = candidateSets.length > 1 ? (
    <select
      data-ui="select"
      data-size="sm"
      value={active.topic_question_candidate_set_id}
      onChange={(event) => setSelectedId(event.target.value)}
    >
      {candidateSets.map((item) => (
        <option key={item.topic_question_candidate_set_id} value={item.topic_question_candidate_set_id}>
          {item.topic_question_candidate_set_id} · {item.status}
        </option>
      ))}
    </select>
  ) : null;

  return (
    <ReviewerCard
      kind="TopicQuestionCandidateSet"
      subjectId={active.topic_question_candidate_set_id}
      status={{ label: active.status, tone: statusTone(active.status) }}
      chips={[
        { label: `candidates ${active.candidate_count}`, tone: 'info' },
        { label: `recommended ${active.recommended_candidate_ids.length}`, tone: 'info' },
        { label: `slice ${active.research_slice_id}`, tone: 'neutral' },
        ...(candidateSets.length > 1 ? [{ label: `history ${candidateSets.length}`, tone: 'neutral' as const }] : []),
      ]}
      verdict={
        <div data-ui="stack" data-direction="col" data-gap="1">
          <p data-ui="text" data-variant="body" data-tone="primary">
            基于 research_slice_version={active.research_slice_version} 生成 {active.candidate_count} 个 TopicQuestion candidate
          </p>
          {setSelector ? (
            <div data-ui="stack" data-direction="row" data-gap="2" data-align="center">
              <span data-ui="text" data-variant="caption" data-tone="muted">切换 candidate set</span>
              {setSelector}
            </div>
          ) : null}
        </div>
      }
      support={
        active.recommended_candidate_ids.length === 0 ? (
          <ReviewerCardEmpty label="无推荐 candidate。" />
        ) : (
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="caption" data-tone="primary">
              recommended_candidate_ids（{active.recommended_candidate_ids.length}）
            </p>
            <ul data-ui="stack" data-direction="col" data-gap="0">
              {active.recommended_candidate_ids.slice(0, 4).map((id) => (
                <li key={id}>
                  <p data-ui="text" data-variant="caption" data-tone="muted">· {id}</p>
                </li>
              ))}
            </ul>
          </div>
        )
      }
      challenge={
        active.hard_blockers.length === 0 ? (
          <ReviewerCardEmpty label="无 hard_blockers。" />
        ) : (
          <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap">
            {active.hard_blockers.map((code) => (
              <span key={code} data-ui="badge" data-variant="subtle" data-tone="danger">{code}</span>
            ))}
          </div>
        )
      }
      blockers={
        active.human_review_triggers.length === 0 ? (
          <ReviewerCardEmpty label="无 human_review_triggers。" />
        ) : (
          <div data-ui="stack" data-direction="row" data-gap="1" data-wrap="wrap">
            {active.human_review_triggers.map((trigger) => (
              <span key={trigger} data-ui="badge" data-variant="subtle" data-tone="warning">{trigger}</span>
            ))}
          </div>
        )
      }
      nextActions={
        <div data-ui="stack" data-direction="col" data-gap="2">
          <QuestionSelectionForm candidateSet={active} onSubmitted={onMutated} />
          {active.generation_notes.length > 0 ? (
            <p data-ui="text" data-variant="caption" data-tone="muted">
              generation_notes: {active.generation_notes.join(' · ')}
            </p>
          ) : null}
        </div>
      }
      footer={`created_at=${active.created_at} · updated_at=${active.updated_at}`}
    />
  );
}

const QUESTION_DECISIONS: Array<{
  value: TopicSelectionTopicQuestionSelectionDecision;
  label: string;
  needsAdmitted: boolean;
}> = [
  { value: 'admit', label: 'admit · 选定 1 个 candidate', needsAdmitted: true },
  { value: 'admit_multiple', label: 'admit_multiple · 选定多个 candidate', needsAdmitted: true },
  { value: 'merge_then_admit', label: 'merge_then_admit · 合并后再选', needsAdmitted: true },
  { value: 'park', label: 'park · 暂搁', needsAdmitted: false },
  { value: 'reject_all', label: 'reject_all · 全部否决', needsAdmitted: false },
  { value: 'no_admissible_candidate', label: 'no_admissible_candidate · 无可纳入 candidate', needsAdmitted: false },
];

type QuestionSelectionFormProps = {
  candidateSet: TopicSelectionTopicQuestionCandidateSetRecord;
  onSubmitted?: () => void;
};

/**
 * Phase 3.3 inline form — submit a TopicQuestionSelectionDecision.
 *
 * `admit / admit_multiple / merge_then_admit` 路径需要勾选 candidate_ids；
 * 其它路径不需要。Rationale 必填（design-spec §4039 红线）。
 */
function QuestionSelectionForm({ candidateSet, onSubmitted }: QuestionSelectionFormProps) {
  const initialDecision: TopicSelectionTopicQuestionSelectionDecision = candidateSet.recommended_candidate_ids.length > 1
    ? 'admit_multiple'
    : 'admit';
  const [decision, setDecision] = useState<TopicSelectionTopicQuestionSelectionDecision>(initialDecision);
  const [admittedIds, setAdmittedIds] = useState<string[]>(candidateSet.recommended_candidate_ids);
  const [rationale, setRationale] = useState('');
  const [candidates, setCandidates] = useState<TopicSelectionTopicQuestionCandidateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    setDecision(initialDecision);
    setAdmittedIds(candidateSet.recommended_candidate_ids);
    setRationale('');
    setSubmitError(null);
    setSubmittedId(null);
  }, [candidateSet.topic_question_candidate_set_id, initialDecision, candidateSet.recommended_candidate_ids]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    void listTopicQuestionCandidatesByCandidateSet(candidateSet.topic_question_candidate_set_id)
      .then((records) => {
        if (mounted) setCandidates(records);
      })
      .catch((caught) => {
        if (mounted) setLoadError(caught instanceof Error ? caught.message : '加载 candidates 失败。');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [candidateSet.topic_question_candidate_set_id]);

  const activeDecision = QUESTION_DECISIONS.find((opt) => opt.value === decision) ?? QUESTION_DECISIONS[0];
  const isTerminal = candidateSet.status === 'selected'
    || candidateSet.status === 'rejected'
    || candidateSet.status === 'parked'
    || candidateSet.status === 'no_admissible_candidate';
  const canSubmit = !submitting
    && !isTerminal
    && rationale.trim().length > 0
    && (!activeDecision.needsAdmitted || admittedIds.length > 0);

  const toggleAdmittedId = (id: string) => {
    setAdmittedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return decision === 'admit' ? [id] : [...current, id];
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuestionSelectionDecision(candidateSet.topic_question_candidate_set_id, {
        decision,
        decision_rationale: rationale.trim(),
        admitted_candidate_ids: activeDecision.needsAdmitted ? admittedIds : [],
        decided_by: 'human',
      });
      setSubmittedId(result.topic_question_selection_decision_id);
      onSubmitted?.();
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : '提交 QuestionSelectionDecision 失败。');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, candidateSet.topic_question_candidate_set_id, decision, rationale, activeDecision.needsAdmitted, admittedIds, onSubmitted]);

  return (
    <section data-ui="section" data-padding="sm">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="label" data-tone="muted">QuestionSelectionDecision · human confirm</p>
        {isTerminal ? (
          <p data-ui="text" data-variant="caption" data-tone="muted">
            该 candidate set 已 {candidateSet.status}；如需新一轮，需 agent 层重新触发 FormTopicQuestion。
          </p>
        ) : (
          <>
            <select
              data-ui="select"
              data-size="md"
              value={decision}
              onChange={(event) => setDecision(event.target.value as TopicSelectionTopicQuestionSelectionDecision)}
            >
              {QUESTION_DECISIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {activeDecision.needsAdmitted ? (
              loading ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">加载 candidates…</p>
              ) : loadError ? (
                <p data-ui="text" data-variant="caption" data-tone="danger">{loadError}</p>
              ) : candidates.length === 0 ? (
                <p data-ui="text" data-variant="caption" data-tone="muted">该 candidate set 无可勾选 candidate。</p>
              ) : (
                <div data-ui="stack" data-direction="col" data-gap="0">
                  {candidates.map((cand) => {
                    const checked = admittedIds.includes(cand.topic_question_candidate_id);
                    return (
                      <label
                        key={cand.topic_question_candidate_id}
                        data-ui="field"
                        data-state="default"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAdmittedId(cand.topic_question_candidate_id)}
                        />
                        <span data-ui="text" data-variant="caption" data-tone="primary">
                          {' '}
                          [{cand.candidate_ordinal}] {cand.main_question.slice(0, 100) || cand.topic_question_candidate_id}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )
            ) : null}
            <textarea
              data-ui="textarea"
              data-size="md"
              rows={3}
              placeholder="decision_rationale（必填）"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
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
                  {submitting ? '提交中…' : '提交 QuestionSelectionDecision'}
                </button>
              ) : (
                <button
                  type="button"
                  data-ui="button"
                  data-variant="secondary"
                  data-size="sm"
                  disabled
                >
                  提交 QuestionSelectionDecision
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
