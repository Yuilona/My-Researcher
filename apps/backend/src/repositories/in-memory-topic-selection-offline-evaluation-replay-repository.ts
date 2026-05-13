import type {
  TopicSelectionOfflineEvaluationCaseRecord,
  TopicSelectionOfflineEvaluationCaseResultRecord,
  TopicSelectionOfflineEvaluationDatasetRecord,
  TopicSelectionOfflineEvaluationMetricResultRecord,
  TopicSelectionOfflineEvaluationRunRecord,
  TopicSelectionReplayDiffRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import type {
  TopicSelectionOfflineEvaluationDatasetPatch,
  TopicSelectionOfflineEvaluationReplayRepository,
  TopicSelectionOfflineEvaluationRunPatch,
} from './topic-selection-offline-evaluation-replay.repository.js';

export class InMemoryTopicSelectionOfflineEvaluationReplayRepository
implements TopicSelectionOfflineEvaluationReplayRepository {
  private readonly datasets = new Map<string, TopicSelectionOfflineEvaluationDatasetRecord>();
  private readonly cases = new Map<string, TopicSelectionOfflineEvaluationCaseRecord>();
  private readonly runs = new Map<string, TopicSelectionOfflineEvaluationRunRecord>();
  private readonly caseResults = new Map<string, TopicSelectionOfflineEvaluationCaseResultRecord>();
  private readonly metricResults = new Map<string, TopicSelectionOfflineEvaluationMetricResultRecord>();
  private readonly replayDiffs = new Map<string, TopicSelectionReplayDiffRecord>();

  async createDataset(
    record: TopicSelectionOfflineEvaluationDatasetRecord,
  ): Promise<TopicSelectionOfflineEvaluationDatasetRecord> {
    this.datasets.set(record.offline_evaluation_dataset_id, record);
    return record;
  }

  async findDatasetById(datasetId: string): Promise<TopicSelectionOfflineEvaluationDatasetRecord | null> {
    return this.datasets.get(datasetId) ?? null;
  }

  async updateDataset(
    datasetId: string,
    patch: TopicSelectionOfflineEvaluationDatasetPatch,
  ): Promise<TopicSelectionOfflineEvaluationDatasetRecord> {
    const current = this.require(this.datasets, datasetId, 'OfflineEvaluationDataset');
    const next = { ...current, ...patch };
    this.datasets.set(datasetId, next);
    return next;
  }

  async createCase(record: TopicSelectionOfflineEvaluationCaseRecord): Promise<TopicSelectionOfflineEvaluationCaseRecord> {
    this.cases.set(record.offline_evaluation_case_id, record);
    return record;
  }

  async findCaseById(caseId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord | null> {
    return this.cases.get(caseId) ?? null;
  }

  async listCasesByDatasetId(datasetId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord[]> {
    return [...this.cases.values()]
      .filter((record) => record.dataset_id === datasetId)
      .sort((left, right) => left.case_key.localeCompare(right.case_key));
  }

  async createRun(record: TopicSelectionOfflineEvaluationRunRecord): Promise<TopicSelectionOfflineEvaluationRunRecord> {
    this.runs.set(record.offline_evaluation_run_id, record);
    return record;
  }

  async findRunById(runId: string): Promise<TopicSelectionOfflineEvaluationRunRecord | null> {
    return this.runs.get(runId) ?? null;
  }

  async updateRun(
    runId: string,
    patch: TopicSelectionOfflineEvaluationRunPatch,
  ): Promise<TopicSelectionOfflineEvaluationRunRecord> {
    const current = this.require(this.runs, runId, 'OfflineEvaluationRun');
    const next = { ...current, ...patch };
    this.runs.set(runId, next);
    return next;
  }

  async createCaseResult(
    record: TopicSelectionOfflineEvaluationCaseResultRecord,
  ): Promise<TopicSelectionOfflineEvaluationCaseResultRecord> {
    const existing = await this.findCaseResultByRunAndCaseId(record.run_id, record.case_id);
    if (existing) {
      throw new Error(`OfflineEvaluationCaseResult already exists for run ${record.run_id} and case ${record.case_id}.`);
    }
    this.caseResults.set(record.offline_evaluation_case_result_id, record);
    return record;
  }

  async findCaseResultByRunAndCaseId(
    runId: string,
    caseId: string,
  ): Promise<TopicSelectionOfflineEvaluationCaseResultRecord | null> {
    return [...this.caseResults.values()].find((record) =>
      record.run_id === runId && record.case_id === caseId) ?? null;
  }

  async listCaseResultsByRunId(runId: string): Promise<TopicSelectionOfflineEvaluationCaseResultRecord[]> {
    return [...this.caseResults.values()]
      .filter((record) => record.run_id === runId)
      .sort((left, right) => left.created_at.localeCompare(right.created_at));
  }

  async createMetricResult(
    record: TopicSelectionOfflineEvaluationMetricResultRecord,
  ): Promise<TopicSelectionOfflineEvaluationMetricResultRecord> {
    const existing = [...this.metricResults.values()].find((candidate) =>
      candidate.run_id === record.run_id && candidate.metric_key === record.metric_key);
    if (existing) {
      throw new Error(`OfflineEvaluationMetricResult already exists for run ${record.run_id} and metric ${record.metric_key}.`);
    }
    this.metricResults.set(record.offline_evaluation_metric_result_id, record);
    return record;
  }

  async listMetricResultsByRunId(runId: string): Promise<TopicSelectionOfflineEvaluationMetricResultRecord[]> {
    return [...this.metricResults.values()]
      .filter((record) => record.run_id === runId)
      .sort((left, right) => left.metric_key.localeCompare(right.metric_key));
  }

  async createReplayDiff(record: TopicSelectionReplayDiffRecord): Promise<TopicSelectionReplayDiffRecord> {
    this.replayDiffs.set(record.replay_diff_id, record);
    return record;
  }

  async listReplayDiffsByRunId(runId: string): Promise<TopicSelectionReplayDiffRecord[]> {
    return [...this.replayDiffs.values()]
      .filter((record) => record.run_id === runId)
      .sort((left, right) => left.created_at.localeCompare(right.created_at));
  }

  private require<T>(records: Map<string, T>, id: string, label: string): T {
    const record = records.get(id);
    if (!record) {
      throw new Error(`${label} ${id} not found.`);
    }
    return record;
  }
}
