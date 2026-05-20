import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  TitleCardPrimaryTabKey,
} from '../../../literature/shared/types';
import type {
  TopicSelectionNeedCandidateRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import type {
  TopicSelectionResearchSliceOptionSetRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionTopicQuestionCandidateSetRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import type {
  TopicSelectionTopicValueAssessmentRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import type {
  TopicSelectionTopicPackageRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-package-contracts';
import type {
  TopicSelectionPromotionGateCheckRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-promotion-gate-contracts';
import type {
  TopicSelectionPromotionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';
import {
  listEvidenceMapsByTitleCard,
  listNeedCandidatesByTitleCard,
  listSearchPlansByTitleCard,
} from '../api/v1a';
import {
  listResearchSliceOptionSetsByTitleCard,
  listTopicPackagesByTitleCard,
  listTopicQuestionCandidateSetsByTitleCard,
  listTopicValueAssessmentsByTitleCard,
} from '../api/v1b';
import {
  listPaperProjectBridgesByTitleCard,
  listPromotionDecisionsByTitleCard,
  listPromotionGateChecksByTitleCard,
} from '../api/v1c';

type StageTab = Exclude<TitleCardPrimaryTabKey, 'overview'>;

export type WorkbenchQueueItem = {
  /** stable id (record id) for React keys / dedupe. */
  id: string;
  /** Human label rendered in the queue list. */
  label: string;
  /** Stage tab to jump to when reviewer clicks. */
  stage: StageTab;
  /** Sub-tab inside the stage. */
  subTab: string;
  /** Optional short caption shown under the label. */
  caption?: string;
};

export type WorkbenchQueues = {
  humanReview: WorkbenchQueueItem[];
  recheck: WorkbenchQueueItem[];
  blocker: WorkbenchQueueItem[];
  acceptedRisk: WorkbenchQueueItem[];
};

const EMPTY_QUEUES: WorkbenchQueues = {
  humanReview: [],
  recheck: [],
  blocker: [],
  acceptedRisk: [],
};

export type UseWorkbenchQueuesResult = {
  queues: WorkbenchQueues;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * T-087 Phase 5 横切 — derive 4 reviewer-workbench queue surfaces from the
 * v1a/v1b/v1c title-card-scoped projections (no new backend endpoints
 * required).
 *
 * Queue semantics (design-spec §4018):
 *   - human-review:    items that need a reviewer human-confirm action
 *   - recheck:         items with open_recheck_request_refs / recheck_request_refs
 *   - blocker:         items with blocker_refs / hard_blockers / failed gates
 *   - accepted-risk:   items carrying accepted_risk_refs (live observation;
 *                      expiry checking requires backend support, surfaced in
 *                      Phase 6 once recheck-event hooks land)
 *
 * Items are limited to top-N per queue inside the panel render to keep the
 * panel concise; the full set is returned here for future filtering.
 */
export function useWorkbenchQueues(
  titleCardId: string | null,
  refreshToken: number,
): UseWorkbenchQueuesResult {
  const [needCandidates, setNeedCandidates] = useState<TopicSelectionNeedCandidateRecord[]>([]);
  const [sliceOptionSets, setSliceOptionSets] = useState<TopicSelectionResearchSliceOptionSetRecord[]>([]);
  const [questionCandidateSets, setQuestionCandidateSets] = useState<TopicSelectionTopicQuestionCandidateSetRecord[]>([]);
  const [valueAssessments, setValueAssessments] = useState<TopicSelectionTopicValueAssessmentRecord[]>([]);
  const [topicPackages, setTopicPackages] = useState<TopicSelectionTopicPackageRecord[]>([]);
  const [gateChecks, setGateChecks] = useState<TopicSelectionPromotionGateCheckRecord[]>([]);
  const [promotionDecisions, setPromotionDecisions] = useState<TopicSelectionPromotionDecisionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!titleCardId) {
      setNeedCandidates([]);
      setSliceOptionSets([]);
      setQuestionCandidateSets([]);
      setValueAssessments([]);
      setTopicPackages([]);
      setGateChecks([]);
      setPromotionDecisions([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const settled = await Promise.allSettled([
      listSearchPlansByTitleCard(titleCardId),
      listEvidenceMapsByTitleCard(titleCardId),
      listNeedCandidatesByTitleCard(titleCardId),
      listResearchSliceOptionSetsByTitleCard(titleCardId),
      listTopicQuestionCandidateSetsByTitleCard(titleCardId),
      listTopicValueAssessmentsByTitleCard(titleCardId),
      listTopicPackagesByTitleCard(titleCardId),
      listPromotionGateChecksByTitleCard(titleCardId),
      listPromotionDecisionsByTitleCard(titleCardId),
      listPaperProjectBridgesByTitleCard(titleCardId),
    ]);
    // [0] searchPlans and [1] evidenceMaps + [9] bridges are reserved for
    // future queues (SearchPlan recheck / EvidenceMap stale / bridge feedback).
    const [, , candidatesRes, sliceRes, questionRes, valueRes, packagesRes, gateRes, decisionsRes] = settled;
    setNeedCandidates(candidatesRes.status === 'fulfilled' ? candidatesRes.value : []);
    setSliceOptionSets(sliceRes.status === 'fulfilled' ? sliceRes.value : []);
    setQuestionCandidateSets(questionRes.status === 'fulfilled' ? questionRes.value : []);
    setValueAssessments(valueRes.status === 'fulfilled' ? valueRes.value : []);
    setTopicPackages(packagesRes.status === 'fulfilled' ? packagesRes.value : []);
    setGateChecks(gateRes.status === 'fulfilled' ? gateRes.value : []);
    setPromotionDecisions(decisionsRes.status === 'fulfilled' ? decisionsRes.value : []);
    const firstError = settled.find((entry) => entry.status === 'rejected');
    if (firstError && firstError.status === 'rejected') {
      const reason = firstError.reason;
      setError(reason instanceof Error ? reason.message : '加载工作队列数据失败。');
    }
    setLoading(false);
  }, [titleCardId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshToken]);

  const queues = useMemo<WorkbenchQueues>(() => {
    if (!titleCardId) {
      return EMPTY_QUEUES;
    }

    const humanReview: WorkbenchQueueItem[] = [];
    const recheck: WorkbenchQueueItem[] = [];
    const blocker: WorkbenchQueueItem[] = [];
    const acceptedRisk: WorkbenchQueueItem[] = [];

    // v1a NeedCandidate ready_for_validation → human-review
    for (const candidate of needCandidates) {
      if (candidate.decision_status === 'ready_for_validation' && !candidate.result_validated_need_id) {
        humanReview.push({
          id: `nc-${candidate.need_candidate_id}`,
          label: candidate.candidate_need.slice(0, 80) || candidate.need_candidate_id,
          stage: 'v1a',
          subTab: 'need-candidate',
          caption: `NeedCandidate · ${candidate.need_candidate_id}`,
        });
      }
      if (candidate.open_recheck_request_refs.length > 0) {
        recheck.push({
          id: `nc-recheck-${candidate.need_candidate_id}`,
          label: `${candidate.open_recheck_request_refs.length} 个 recheck · NeedCandidate`,
          stage: 'v1a',
          subTab: 'need-candidate',
          caption: candidate.candidate_need.slice(0, 60) || candidate.need_candidate_id,
        });
      }
      if (candidate.unresolved_challenge_refs.length > 0) {
        blocker.push({
          id: `nc-blocker-${candidate.need_candidate_id}`,
          label: `${candidate.unresolved_challenge_refs.length} 条未解 challenge · NeedCandidate`,
          stage: 'v1a',
          subTab: 'need-candidate',
          caption: candidate.candidate_need.slice(0, 60) || candidate.need_candidate_id,
        });
      }
      if (candidate.accepted_risk_refs.length > 0) {
        acceptedRisk.push({
          id: `nc-risk-${candidate.need_candidate_id}`,
          label: `${candidate.accepted_risk_refs.length} 个 accepted risk · NeedCandidate`,
          stage: 'v1a',
          subTab: 'need-candidate',
          caption: candidate.candidate_need.slice(0, 60) || candidate.need_candidate_id,
        });
      }
    }

    // v1b SliceOptionSet pending selection → human-review
    for (const set of sliceOptionSets) {
      if (set.status === 'ready_for_selection' && !set.selected_option_id) {
        humanReview.push({
          id: `slice-${set.research_slice_option_set_id}`,
          label: `Slice OptionSet 待选 · option_count=${set.option_count}`,
          stage: 'v1b',
          subTab: 'slice',
          caption: set.research_slice_option_set_id,
        });
      }
      if (set.requires_human_review && set.status !== 'selected' && set.status !== 'rejected') {
        blocker.push({
          id: `slice-blocker-${set.research_slice_option_set_id}`,
          label: `Slice OptionSet 要求人审 · ${set.human_review_triggers.length} 触发`,
          stage: 'v1b',
          subTab: 'slice',
          caption: set.research_slice_option_set_id,
        });
      }
    }

    // v1b QuestionCandidateSet pending selection → human-review
    for (const set of questionCandidateSets) {
      if (set.status === 'ready_for_selection') {
        humanReview.push({
          id: `q-${set.topic_question_candidate_set_id}`,
          label: `Question CandidateSet 待选 · candidates=${set.candidate_count}`,
          stage: 'v1b',
          subTab: 'question',
          caption: set.topic_question_candidate_set_id,
        });
      }
      if (set.hard_blockers.length > 0) {
        blocker.push({
          id: `q-blocker-${set.topic_question_candidate_set_id}`,
          label: `Question CandidateSet hard_blockers=${set.hard_blockers.length}`,
          stage: 'v1b',
          subTab: 'question',
          caption: set.topic_question_candidate_set_id,
        });
      }
    }

    // v1b ValueAssessment 等待 disposition → human-review
    for (const assessment of valueAssessments) {
      if ((assessment.readiness_status === 'ready' || assessment.readiness_status === 'ready_with_accepted_risk')
        && !assessment.active_disposition_decision_id) {
        humanReview.push({
          id: `value-${assessment.topic_value_assessment_id}`,
          label: `ValueAssessment 等待 disposition · verdict=${assessment.legacy_verdict}`,
          stage: 'v1b',
          subTab: 'value',
          caption: assessment.topic_value_assessment_id,
        });
      }
      if (assessment.blocker_refs.length > 0) {
        blocker.push({
          id: `value-blocker-${assessment.topic_value_assessment_id}`,
          label: `ValueAssessment blocker_refs=${assessment.blocker_refs.length}`,
          stage: 'v1b',
          subTab: 'value',
          caption: assessment.topic_value_assessment_id,
        });
      }
      if (assessment.accepted_risk_refs.length > 0) {
        acceptedRisk.push({
          id: `value-risk-${assessment.topic_value_assessment_id}`,
          label: `${assessment.accepted_risk_refs.length} 个 accepted risk · ValueAssessment`,
          stage: 'v1b',
          subTab: 'value',
          caption: assessment.topic_value_assessment_id,
        });
      }
    }

    // v1b TopicPackage → blocker / recheck / accepted-risk
    for (const pkg of topicPackages) {
      if (pkg.blocker_refs.length > 0) {
        blocker.push({
          id: `pkg-blocker-${pkg.topic_package_id}`,
          label: `TopicPackage blocker_refs=${pkg.blocker_refs.length}`,
          stage: 'v1b',
          subTab: 'package',
          caption: pkg.topic_package_id,
        });
      }
      if (pkg.recheck_request_refs.length > 0) {
        recheck.push({
          id: `pkg-recheck-${pkg.topic_package_id}`,
          label: `${pkg.recheck_request_refs.length} 个 recheck · TopicPackage`,
          stage: 'v1b',
          subTab: 'package',
          caption: pkg.topic_package_id,
        });
      }
      if (pkg.accepted_risk_refs.length > 0) {
        acceptedRisk.push({
          id: `pkg-risk-${pkg.topic_package_id}`,
          label: `${pkg.accepted_risk_refs.length} 个 accepted risk · TopicPackage`,
          stage: 'v1b',
          subTab: 'package',
          caption: pkg.topic_package_id,
        });
      }
    }

    // v1c GateCheck → human-review (when promote_allowed but no decision yet) / blockers / recheck
    for (const gate of gateChecks) {
      const hasDecision = promotionDecisions.some((d) => d.promotion_gate_check_id === gate.promotion_gate_check_id);
      if (!hasDecision) {
        humanReview.push({
          id: `gate-${gate.promotion_gate_check_id}`,
          label: gate.promote_allowed
            ? 'PromotionGateCheck promote-allowed · 等待 human decision'
            : `PromotionGateCheck ${gate.disposition} · 等待 non-promote 决策`,
          stage: 'v1c',
          subTab: 'decision',
          caption: gate.promotion_gate_check_id,
        });
      }
      if (gate.blockers.length > 0) {
        blocker.push({
          id: `gate-blocker-${gate.promotion_gate_check_id}`,
          label: `GateCheck blockers=${gate.blockers.length}`,
          stage: 'v1c',
          subTab: 'gate-check',
          caption: gate.promotion_gate_check_id,
        });
      }
      if (gate.recheck_request_refs.length > 0) {
        recheck.push({
          id: `gate-recheck-${gate.promotion_gate_check_id}`,
          label: `${gate.recheck_request_refs.length} 个 recheck · GateCheck`,
          stage: 'v1c',
          subTab: 'gate-check',
          caption: gate.promotion_gate_check_id,
        });
      }
      if (gate.accepted_risk_refs.length > 0) {
        acceptedRisk.push({
          id: `gate-risk-${gate.promotion_gate_check_id}`,
          label: `${gate.accepted_risk_refs.length} 个 accepted risk · GateCheck`,
          stage: 'v1c',
          subTab: 'gate-check',
          caption: gate.promotion_gate_check_id,
        });
      }
    }

    // v1c PromotionDecision → bridge-pending → human-review
    for (const decision of promotionDecisions) {
      if (decision.bridge_eligible && decision.promotion_decision_status === 'current') {
        humanReview.push({
          id: `decision-bridge-${decision.promotion_decision_id}`,
          label: `PromotionDecision bridge-eligible · 等待创建 Bridge`,
          stage: 'v1c',
          subTab: 'bridge',
          caption: decision.promotion_decision_id,
        });
      }
      if (decision.accepted_risk_refs.length > 0) {
        acceptedRisk.push({
          id: `decision-risk-${decision.promotion_decision_id}`,
          label: `${decision.accepted_risk_refs.length} 个 accepted risk · PromotionDecision`,
          stage: 'v1c',
          subTab: 'decision',
          caption: decision.promotion_decision_id,
        });
      }
    }

    return { humanReview, recheck, blocker, acceptedRisk };
  }, [
    titleCardId,
    needCandidates,
    sliceOptionSets,
    questionCandidateSets,
    valueAssessments,
    topicPackages,
    gateChecks,
    promotionDecisions,
  ]);

  return { queues, loading, error, reload };
}
