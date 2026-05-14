import type {
  TopicSelectionFormTopicQuestionRunRecord,
  TopicSelectionQuestionFrameRecord,
  TopicSelectionTopicQuestionAnswerabilityPlanRecord,
  TopicSelectionTopicQuestionAssumptionRefRecord,
  TopicSelectionTopicQuestionBoundaryRefRecord,
  TopicSelectionTopicQuestionCandidateRecord,
  TopicSelectionTopicQuestionCandidateSetRecord,
  TopicSelectionTopicQuestionContractRecord,
  TopicSelectionTopicQuestionEvidenceRefRecord,
  TopicSelectionTopicQuestionFalsificationConditionRecord,
  TopicSelectionTopicQuestionNeedRefRecord,
  TopicSelectionTopicQuestionRecord,
  TopicSelectionTopicQuestionSelectionDecisionRecord,
  TopicSelectionV1bTopicQuestionMaterialization,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';

export type TopicSelectionTopicQuestionCandidatePersistence = {
  form_topic_question_run: TopicSelectionFormTopicQuestionRunRecord;
  question_frame: TopicSelectionQuestionFrameRecord;
  candidate_set: TopicSelectionTopicQuestionCandidateSetRecord;
  candidates: TopicSelectionTopicQuestionCandidateRecord[];
};

export type TopicSelectionTopicQuestionSelectionPersistence = {
  decision: TopicSelectionTopicQuestionSelectionDecisionRecord;
  candidate_set_patch: {
    status: TopicSelectionTopicQuestionCandidateSetRecord['status'];
    updated_at: string;
  };
  candidate_status_patches: Array<{
    candidate_id: string;
    status: TopicSelectionTopicQuestionCandidateRecord['status'];
  }>;
  materializations: TopicSelectionV1bTopicQuestionMaterialization[];
};

export interface TopicSelectionV1bTopicQuestionRepository {
  createFormationRun(
    record: TopicSelectionFormTopicQuestionRunRecord,
  ): Promise<TopicSelectionFormTopicQuestionRunRecord>;
  findFormationRunById(runId: string): Promise<TopicSelectionFormTopicQuestionRunRecord | null>;

  createFormationRunWithCandidates(
    persistence: TopicSelectionTopicQuestionCandidatePersistence,
  ): Promise<{
    form_topic_question_run: TopicSelectionFormTopicQuestionRunRecord;
    question_frame: TopicSelectionQuestionFrameRecord;
    candidate_set: TopicSelectionTopicQuestionCandidateSetRecord;
    candidates: TopicSelectionTopicQuestionCandidateRecord[];
  }>;

  findCandidateSetById(
    candidateSetId: string,
  ): Promise<TopicSelectionTopicQuestionCandidateSetRecord | null>;
  findQuestionFrameById(frameId: string): Promise<TopicSelectionQuestionFrameRecord | null>;
  listCandidatesByCandidateSetId(
    candidateSetId: string,
  ): Promise<TopicSelectionTopicQuestionCandidateRecord[]>;
  findCandidateById(candidateId: string): Promise<TopicSelectionTopicQuestionCandidateRecord | null>;

  createSelectionDecisionWithMaterializations(
    persistence: TopicSelectionTopicQuestionSelectionPersistence,
  ): Promise<{
    decision: TopicSelectionTopicQuestionSelectionDecisionRecord;
    materializations: TopicSelectionV1bTopicQuestionMaterialization[];
  }>;
  findSelectionDecisionById(
    decisionId: string,
  ): Promise<TopicSelectionTopicQuestionSelectionDecisionRecord | null>;

  findTopicQuestionById(questionId: string): Promise<TopicSelectionTopicQuestionRecord | null>;
  findTopicQuestionContractById(
    contractId: string,
  ): Promise<TopicSelectionTopicQuestionContractRecord | null>;
  findAnswerabilityPlanByContractId(
    contractId: string,
  ): Promise<TopicSelectionTopicQuestionAnswerabilityPlanRecord | null>;
  listNeedRefsByContractId(contractId: string): Promise<TopicSelectionTopicQuestionNeedRefRecord[]>;
  listEvidenceRefsByContractId(contractId: string): Promise<TopicSelectionTopicQuestionEvidenceRefRecord[]>;
  listBoundaryRefsByContractId(contractId: string): Promise<TopicSelectionTopicQuestionBoundaryRefRecord[]>;
  listAssumptionRefsByContractId(contractId: string): Promise<TopicSelectionTopicQuestionAssumptionRefRecord[]>;
  listFalsificationConditionsByContractId(
    contractId: string,
  ): Promise<TopicSelectionTopicQuestionFalsificationConditionRecord[]>;
}
