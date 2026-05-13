import type {
  TopicSelectionOfflineEvaluationCaseRecord,
  TopicSelectionOfflineEvaluationCaseResultRecord,
  TopicSelectionOfflineEvaluationDatasetRecord,
  TopicSelectionOfflineEvaluationMetricResultRecord,
  TopicSelectionOfflineEvaluationRunRecord,
  TopicSelectionReplayDiffRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';

export type TopicSelectionOfflineEvaluationDatasetPatch = Partial<Omit<
  TopicSelectionOfflineEvaluationDatasetRecord,
  'offline_evaluation_dataset_id' | 'created_at'
>>;

export type TopicSelectionOfflineEvaluationRunPatch = Partial<Omit<
  TopicSelectionOfflineEvaluationRunRecord,
  'offline_evaluation_run_id' | 'dataset_id' | 'started_at'
>>;

export interface TopicSelectionOfflineEvaluationReplayRepository {
  createDataset(
    record: TopicSelectionOfflineEvaluationDatasetRecord,
  ): Promise<TopicSelectionOfflineEvaluationDatasetRecord>;
  findDatasetById(datasetId: string): Promise<TopicSelectionOfflineEvaluationDatasetRecord | null>;
  updateDataset(
    datasetId: string,
    patch: TopicSelectionOfflineEvaluationDatasetPatch,
  ): Promise<TopicSelectionOfflineEvaluationDatasetRecord>;

  createCase(record: TopicSelectionOfflineEvaluationCaseRecord): Promise<TopicSelectionOfflineEvaluationCaseRecord>;
  findCaseById(caseId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord | null>;
  listCasesByDatasetId(datasetId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord[]>;

  createRun(record: TopicSelectionOfflineEvaluationRunRecord): Promise<TopicSelectionOfflineEvaluationRunRecord>;
  findRunById(runId: string): Promise<TopicSelectionOfflineEvaluationRunRecord | null>;
  updateRun(
    runId: string,
    patch: TopicSelectionOfflineEvaluationRunPatch,
  ): Promise<TopicSelectionOfflineEvaluationRunRecord>;

  createCaseResult(
    record: TopicSelectionOfflineEvaluationCaseResultRecord,
  ): Promise<TopicSelectionOfflineEvaluationCaseResultRecord>;
  findCaseResultByRunAndCaseId(
    runId: string,
    caseId: string,
  ): Promise<TopicSelectionOfflineEvaluationCaseResultRecord | null>;
  listCaseResultsByRunId(runId: string): Promise<TopicSelectionOfflineEvaluationCaseResultRecord[]>;

  createMetricResult(
    record: TopicSelectionOfflineEvaluationMetricResultRecord,
  ): Promise<TopicSelectionOfflineEvaluationMetricResultRecord>;
  listMetricResultsByRunId(runId: string): Promise<TopicSelectionOfflineEvaluationMetricResultRecord[]>;

  createReplayDiff(record: TopicSelectionReplayDiffRecord): Promise<TopicSelectionReplayDiffRecord>;
  listReplayDiffsByRunId(runId: string): Promise<TopicSelectionReplayDiffRecord[]>;
}
