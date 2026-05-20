/**
 * T-087 Phase 3.1 — v1b authority/workflow read-only API client.
 *
 * Wraps the 4 list-by-title-card endpoints added in Phase 3.1 backend so the
 * reviewer workbench v1b Stage view can render the SliceOptionSet /
 * QuestionCandidateSet / ValueAssessment / TopicPackage surfaces.
 *
 * Backend SSOT:
 *  - `apps/backend/src/routes/topic-selection-v1b-routes.ts`
 *  - `docs/context/api/openapi.yaml` (operationIds: listTopicSelectionV1b*)
 */
import { requestGovernance } from '../../../literature/shared/api';
import type {
  TopicSelectionActorType,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionResearchSliceOptionRecord,
  TopicSelectionResearchSliceOptionSetRecord,
  TopicSelectionSliceLoopbackTarget,
  TopicSelectionSliceSelectionDecision,
  TopicSelectionSliceSelectionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionTopicQuestionCandidateRecord,
  TopicSelectionTopicQuestionCandidateSetRecord,
  TopicSelectionTopicQuestionSelectionDecision,
  TopicSelectionTopicQuestionSelectionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import type {
  TopicSelectionTopicValueAssessmentRecord,
  TopicSelectionValueDisposition,
  TopicSelectionValueDispositionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';
import type {
  TopicSelectionTopicPackageRecord,
  TopicSelectionV1bToV1cInputBundleRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-package-contracts';

export type V1bListResponse<T> = { items: T[] };

export async function listResearchSliceOptionSetsByTitleCard(
  titleCardId: string,
): Promise<TopicSelectionResearchSliceOptionSetRecord[]> {
  const payload = await requestGovernance<V1bListResponse<TopicSelectionResearchSliceOptionSetRecord>>({
    method: 'GET',
    path: `/topic-selection/v1b/title-cards/${encodeURIComponent(titleCardId)}/research-slice-option-sets`,
  });
  return payload.items ?? [];
}

export async function listTopicQuestionCandidateSetsByTitleCard(
  titleCardId: string,
): Promise<TopicSelectionTopicQuestionCandidateSetRecord[]> {
  const payload = await requestGovernance<V1bListResponse<TopicSelectionTopicQuestionCandidateSetRecord>>({
    method: 'GET',
    path: `/topic-selection/v1b/title-cards/${encodeURIComponent(titleCardId)}/topic-question-candidate-sets`,
  });
  return payload.items ?? [];
}

export async function listTopicValueAssessmentsByTitleCard(
  titleCardId: string,
): Promise<TopicSelectionTopicValueAssessmentRecord[]> {
  const payload = await requestGovernance<V1bListResponse<TopicSelectionTopicValueAssessmentRecord>>({
    method: 'GET',
    path: `/topic-selection/v1b/title-cards/${encodeURIComponent(titleCardId)}/topic-value-assessments`,
  });
  return payload.items ?? [];
}

export async function listTopicPackagesByTitleCard(
  titleCardId: string,
): Promise<TopicSelectionTopicPackageRecord[]> {
  const payload = await requestGovernance<V1bListResponse<TopicSelectionTopicPackageRecord>>({
    method: 'GET',
    path: `/topic-selection/v1b/title-cards/${encodeURIComponent(titleCardId)}/topic-packages`,
  });
  return payload.items ?? [];
}

/**
 * Phase 3.2 — list ResearchSliceOptions for an OptionSet (picker driver).
 */
export async function listResearchSliceOptionsByOptionSet(
  optionSetId: string,
): Promise<TopicSelectionResearchSliceOptionRecord[]> {
  const payload = await requestGovernance<V1bListResponse<TopicSelectionResearchSliceOptionRecord>>({
    method: 'GET',
    path: `/topic-selection/v1b/research-slice-option-sets/${encodeURIComponent(optionSetId)}/options`,
  });
  return payload.items ?? [];
}

/**
 * Phase 3.3 — list TopicQuestionCandidates for a CandidateSet (picker driver).
 */
export async function listTopicQuestionCandidatesByCandidateSet(
  candidateSetId: string,
): Promise<TopicSelectionTopicQuestionCandidateRecord[]> {
  const payload = await requestGovernance<V1bListResponse<TopicSelectionTopicQuestionCandidateRecord>>({
    method: 'GET',
    path: `/topic-selection/v1b/topic-question-candidate-sets/${encodeURIComponent(candidateSetId)}/candidates`,
  });
  return payload.items ?? [];
}

/**
 * Phase 3.2 — submit a SliceSelectionDecision for an OptionSet.
 * Body mirrors `researchSliceSelectionBody` in v1b-routes.ts.
 */
export type SubmitSliceSelectionRequest = {
  decision: TopicSelectionSliceSelectionDecision;
  selection_rationale: string;
  selected_option_id?: string | null;
  decided_by?: TopicSelectionActorType;
  selection_policy_version?: string;
  required_actions?: string[];
  loopback_target?: TopicSelectionSliceLoopbackTarget;
  loopback_reason_code?: string | null;
  requires_human_review?: boolean;
  human_review_reason?: string | null;
  confidence?: number | null;
};

export async function submitSliceSelectionDecision(
  optionSetId: string,
  body: SubmitSliceSelectionRequest,
): Promise<TopicSelectionSliceSelectionDecisionRecord> {
  return requestGovernance<TopicSelectionSliceSelectionDecisionRecord>({
    method: 'POST',
    path: `/topic-selection/v1b/research-slice-option-sets/${encodeURIComponent(optionSetId)}/selection-decisions`,
    body,
  });
}

/**
 * Phase 3.3 — submit a TopicQuestionSelectionDecision for a CandidateSet.
 * Body mirrors `topicQuestionSelectionBody` in v1b-routes.ts.
 */
export type SubmitQuestionSelectionRequest = {
  decision: TopicSelectionTopicQuestionSelectionDecision;
  decision_rationale: string;
  admitted_candidate_ids?: string[];
  decided_by?: TopicSelectionActorType;
  selection_policy_version?: string;
  priority_order?: string[];
  requires_human_review?: boolean;
  human_review_triggers?: string[];
  confidence?: number | null;
};

export async function submitQuestionSelectionDecision(
  candidateSetId: string,
  body: SubmitQuestionSelectionRequest,
): Promise<TopicSelectionTopicQuestionSelectionDecisionRecord> {
  return requestGovernance<TopicSelectionTopicQuestionSelectionDecisionRecord>({
    method: 'POST',
    path: `/topic-selection/v1b/topic-question-candidate-sets/${encodeURIComponent(candidateSetId)}/selection-decisions`,
    body,
  });
}

/**
 * Phase 3.4 — submit a ValueDispositionDecision for a TopicValueAssessment.
 * Body mirrors `valueDispositionBody` in v1b-routes.ts.
 */
export type SubmitValueDispositionRequest = {
  decision: TopicSelectionValueDisposition;
  decision_rationale: string;
  decided_by?: TopicSelectionActorType;
  required_actions?: string[];
};

export async function submitValueDispositionDecision(
  topicValueAssessmentId: string,
  body: SubmitValueDispositionRequest,
): Promise<TopicSelectionValueDispositionDecisionRecord> {
  return requestGovernance<TopicSelectionValueDispositionDecisionRecord>({
    method: 'POST',
    path: `/topic-selection/v1b/topic-value-assessments/${encodeURIComponent(topicValueAssessmentId)}/disposition-decisions`,
    body,
  });
}

/**
 * Phase 3.5 — publish a V1bToV1cInputBundle for a TopicPackage (v1b → v1c
 * handoff). Endpoint accepts an empty body; backend derives the bundle from
 * the package state.
 */
export async function publishV1cInputBundle(
  topicPackageId: string,
): Promise<TopicSelectionV1bToV1cInputBundleRecord> {
  return requestGovernance<TopicSelectionV1bToV1cInputBundleRecord>({
    method: 'POST',
    path: `/topic-selection/v1b/topic-packages/${encodeURIComponent(topicPackageId)}/v1c-input-bundles`,
  });
}
