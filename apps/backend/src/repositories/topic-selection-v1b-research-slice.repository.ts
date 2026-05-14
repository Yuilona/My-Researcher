import type {
  TopicSelectionPlanResearchSliceRunRecord,
  TopicSelectionResearchSliceAssumptionRecord,
  TopicSelectionResearchSliceBoundaryRecord,
  TopicSelectionResearchSliceEvidenceRefRecord,
  TopicSelectionResearchSliceOptionRecord,
  TopicSelectionResearchSliceOptionSetRecord,
  TopicSelectionResearchSliceRecord,
  TopicSelectionSliceSelectionDecisionRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';

export type TopicSelectionResearchSliceCreation = {
  decision: TopicSelectionSliceSelectionDecisionRecord;
  research_slice: TopicSelectionResearchSliceRecord;
  evidence_refs: TopicSelectionResearchSliceEvidenceRefRecord[];
  boundaries: TopicSelectionResearchSliceBoundaryRecord[];
  assumptions: TopicSelectionResearchSliceAssumptionRecord[];
  option_set_patch: {
    status: TopicSelectionResearchSliceOptionSetRecord['status'];
    selected_option_id?: string | null;
    updated_at: string;
  };
};

export type TopicSelectionResearchSlicePlanningPersistence = {
  plan_run: TopicSelectionPlanResearchSliceRunRecord;
  option_set: TopicSelectionResearchSliceOptionSetRecord;
  options: TopicSelectionResearchSliceOptionRecord[];
};

export interface TopicSelectionV1bResearchSliceRepository {
  createPlanRun(
    record: TopicSelectionPlanResearchSliceRunRecord,
  ): Promise<TopicSelectionPlanResearchSliceRunRecord>;
  updatePlanRun(
    planRunId: string,
    patch: Partial<Pick<
      TopicSelectionPlanResearchSliceRunRecord,
      'status' | 'workflow_run_id' | 'option_set_id' | 'artifact_refs' | 'quality_flags' | 'failure_reason' | 'updated_at'
    >>,
  ): Promise<TopicSelectionPlanResearchSliceRunRecord>;
  findPlanRunById(planRunId: string): Promise<TopicSelectionPlanResearchSliceRunRecord | null>;

  createPlanRunWithOptionSet(
    persistence: TopicSelectionResearchSlicePlanningPersistence,
  ): Promise<{
    plan_run: TopicSelectionPlanResearchSliceRunRecord;
    option_set: TopicSelectionResearchSliceOptionSetRecord;
    options: TopicSelectionResearchSliceOptionRecord[];
  }>;
  findOptionSetById(optionSetId: string): Promise<TopicSelectionResearchSliceOptionSetRecord | null>;
  updateOptionSet(
    optionSetId: string,
    patch: Partial<Pick<
      TopicSelectionResearchSliceOptionSetRecord,
      'status' | 'selected_option_id' | 'updated_at'
    >>,
  ): Promise<TopicSelectionResearchSliceOptionSetRecord>;
  listOptionsByOptionSetId(optionSetId: string): Promise<TopicSelectionResearchSliceOptionRecord[]>;
  findOptionById(optionId: string): Promise<TopicSelectionResearchSliceOptionRecord | null>;

  createSelectionDecision(
    record: TopicSelectionSliceSelectionDecisionRecord,
  ): Promise<TopicSelectionSliceSelectionDecisionRecord>;
  createSelectionDecisionWithSlice(
    creation: TopicSelectionResearchSliceCreation,
  ): Promise<{
    decision: TopicSelectionSliceSelectionDecisionRecord;
    research_slice: TopicSelectionResearchSliceRecord;
    evidence_refs: TopicSelectionResearchSliceEvidenceRefRecord[];
    boundaries: TopicSelectionResearchSliceBoundaryRecord[];
    assumptions: TopicSelectionResearchSliceAssumptionRecord[];
  }>;
  findSelectionDecisionById(
    decisionId: string,
  ): Promise<TopicSelectionSliceSelectionDecisionRecord | null>;

  findResearchSliceById(researchSliceId: string): Promise<TopicSelectionResearchSliceRecord | null>;
  listEvidenceRefsByResearchSliceId(
    researchSliceId: string,
  ): Promise<TopicSelectionResearchSliceEvidenceRefRecord[]>;
  listBoundariesByResearchSliceId(
    researchSliceId: string,
  ): Promise<TopicSelectionResearchSliceBoundaryRecord[]>;
  listAssumptionsByResearchSliceId(
    researchSliceId: string,
  ): Promise<TopicSelectionResearchSliceAssumptionRecord[]>;
}
