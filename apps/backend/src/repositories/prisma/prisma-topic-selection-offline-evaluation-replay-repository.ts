import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionOfflineEvaluationCaseRecord,
  TopicSelectionOfflineEvaluationCaseResultRecord,
  TopicSelectionOfflineEvaluationDatasetRecord,
  TopicSelectionOfflineEvaluationMetricKey,
  TopicSelectionOfflineEvaluationMetricResultRecord,
  TopicSelectionOfflineEvaluationRunRecord,
  TopicSelectionReplayDiffRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import type {
  TopicSelectionOfflineEvaluationDatasetPatch,
  TopicSelectionOfflineEvaluationReplayRepository,
  TopicSelectionOfflineEvaluationRunPatch,
} from '../topic-selection-offline-evaluation-replay.repository.js';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNullableFunctionalRef(value: unknown): TopicSelectionFunctionalRef | null {
  return value === null || value === undefined ? null : asRecord(value) as unknown as TopicSelectionFunctionalRef;
}

function dateOrNull(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function jsonOrNull(value: unknown | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined ? Prisma.JsonNull : toJsonValue(value);
}

function optionalJson(value: unknown | undefined): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : toJsonValue(value);
}

type DatasetRow = {
  id: string;
  workspaceId: string | null;
  datasetKey: string;
  datasetVersion: string;
  stage: string;
  source: string;
  status: string;
  description: string | null;
  caseCount: number;
  caseTypeCoverage: string[];
  payload: Prisma.JsonValue;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type CaseRow = {
  id: string;
  workspaceId: string | null;
  datasetId: string;
  titleCardId: string | null;
  caseKey: string;
  caseType: string;
  status: string;
  frozenInputBundle: Prisma.JsonValue;
  goldExpectation: Prisma.JsonValue;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

type RunRow = {
  id: string;
  workspaceId: string | null;
  datasetId: string;
  runKey: string;
  status: string;
  workflowProfileKey: string;
  workflowProfileVersion: string | null;
  modelProfileKey: string | null;
  searchProfileKey: string | null;
  policyVersionId: string | null;
  metricKeys: string[];
  caseCount: number;
  runPayload: Prisma.JsonValue;
  createdBy: string;
  startedAt: Date;
  finishedAt: Date | null;
};

type CaseResultRow = {
  id: string;
  workspaceId: string | null;
  runId: string;
  datasetId: string;
  caseId: string;
  caseType: string;
  status: string;
  observedOutput: Prisma.JsonValue;
  replayDiffRef: Prisma.JsonValue | null;
  metricContributionPayload: Prisma.JsonValue;
  failureExamples: string[];
  createdAt: Date;
};

type MetricResultRow = {
  id: string;
  workspaceId: string | null;
  runId: string;
  datasetId: string;
  metricKey: string;
  numerator: number;
  denominator: number;
  value: number | null;
  contributingCaseRefs: Prisma.JsonValue;
  failureCaseRefs: Prisma.JsonValue;
  notes: string[];
  metricPayload: Prisma.JsonValue;
  createdAt: Date;
};

type ReplayDiffRow = {
  id: string;
  workspaceId: string | null;
  runId: string;
  datasetId: string;
  caseId: string;
  status: string;
  changedDimensions: string[];
  finalDecisionChanged: boolean;
  keyEvidenceSetChanged: boolean;
  blockerSetChanged: boolean;
  traceVerdictChanged: boolean;
  expectedSnapshot: Prisma.JsonValue;
  observedSnapshot: Prisma.JsonValue;
  baselineSnapshot: Prisma.JsonValue | null;
  diffPayload: Prisma.JsonValue;
  createdAt: Date;
};

function toDatasetRecord(row: DatasetRow): TopicSelectionOfflineEvaluationDatasetRecord {
  return {
    offline_evaluation_dataset_id: row.id,
    workspace_id: row.workspaceId,
    dataset_key: row.datasetKey,
    dataset_version: row.datasetVersion,
    stage: row.stage as TopicSelectionOfflineEvaluationDatasetRecord['stage'],
    source: row.source as TopicSelectionOfflineEvaluationDatasetRecord['source'],
    status: row.status as TopicSelectionOfflineEvaluationDatasetRecord['status'],
    description: row.description,
    case_count: row.caseCount,
    case_type_coverage: row.caseTypeCoverage as TopicSelectionOfflineEvaluationDatasetRecord['case_type_coverage'],
    payload: asRecord(row.payload),
    created_by: row.createdBy as TopicSelectionOfflineEvaluationDatasetRecord['created_by'],
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function toCaseRecord(row: CaseRow): TopicSelectionOfflineEvaluationCaseRecord {
  return {
    offline_evaluation_case_id: row.id,
    workspace_id: row.workspaceId,
    dataset_id: row.datasetId,
    title_card_id: row.titleCardId,
    case_key: row.caseKey,
    case_type: row.caseType as TopicSelectionOfflineEvaluationCaseRecord['case_type'],
    status: row.status as TopicSelectionOfflineEvaluationCaseRecord['status'],
    frozen_input_bundle: asRecord(row.frozenInputBundle) as unknown as TopicSelectionOfflineEvaluationCaseRecord['frozen_input_bundle'],
    gold_expectation: asRecord(row.goldExpectation) as unknown as TopicSelectionOfflineEvaluationCaseRecord['gold_expectation'],
    tags: row.tags,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function toRunRecord(row: RunRow): TopicSelectionOfflineEvaluationRunRecord {
  return {
    offline_evaluation_run_id: row.id,
    workspace_id: row.workspaceId,
    dataset_id: row.datasetId,
    run_key: row.runKey,
    status: row.status as TopicSelectionOfflineEvaluationRunRecord['status'],
    workflow_profile_key: row.workflowProfileKey,
    workflow_profile_version: row.workflowProfileVersion,
    model_profile_key: row.modelProfileKey,
    search_profile_key: row.searchProfileKey,
    policy_version_id: row.policyVersionId,
    metric_keys: row.metricKeys as TopicSelectionOfflineEvaluationMetricKey[],
    case_count: row.caseCount,
    run_payload: asRecord(row.runPayload),
    created_by: row.createdBy as TopicSelectionOfflineEvaluationRunRecord['created_by'],
    started_at: row.startedAt.toISOString(),
    finished_at: row.finishedAt?.toISOString() ?? null,
  };
}

function toCaseResultRecord(row: CaseResultRow): TopicSelectionOfflineEvaluationCaseResultRecord {
  return {
    offline_evaluation_case_result_id: row.id,
    workspace_id: row.workspaceId,
    run_id: row.runId,
    dataset_id: row.datasetId,
    case_id: row.caseId,
    case_type: row.caseType as TopicSelectionOfflineEvaluationCaseResultRecord['case_type'],
    status: row.status as TopicSelectionOfflineEvaluationCaseResultRecord['status'],
    observed_output: asRecord(row.observedOutput) as unknown as TopicSelectionOfflineEvaluationCaseResultRecord['observed_output'],
    replay_diff_ref: asNullableFunctionalRef(row.replayDiffRef),
    metric_contribution_payload: asRecord(row.metricContributionPayload),
    failure_examples: row.failureExamples,
    created_at: row.createdAt.toISOString(),
  };
}

function toMetricResultRecord(row: MetricResultRow): TopicSelectionOfflineEvaluationMetricResultRecord {
  return {
    offline_evaluation_metric_result_id: row.id,
    workspace_id: row.workspaceId,
    run_id: row.runId,
    dataset_id: row.datasetId,
    metric_key: row.metricKey as TopicSelectionOfflineEvaluationMetricResultRecord['metric_key'],
    numerator: row.numerator,
    denominator: row.denominator,
    value: row.value,
    contributing_case_refs: asArray<TopicSelectionFunctionalRef>(row.contributingCaseRefs),
    failure_case_refs: asArray<TopicSelectionFunctionalRef>(row.failureCaseRefs),
    notes: row.notes,
    metric_payload: asRecord(row.metricPayload),
    created_at: row.createdAt.toISOString(),
  };
}

function toReplayDiffRecord(row: ReplayDiffRow): TopicSelectionReplayDiffRecord {
  return {
    replay_diff_id: row.id,
    workspace_id: row.workspaceId,
    run_id: row.runId,
    dataset_id: row.datasetId,
    case_id: row.caseId,
    status: row.status as TopicSelectionReplayDiffRecord['status'],
    changed_dimensions: row.changedDimensions as TopicSelectionReplayDiffRecord['changed_dimensions'],
    final_decision_changed: row.finalDecisionChanged,
    key_evidence_set_changed: row.keyEvidenceSetChanged,
    blocker_set_changed: row.blockerSetChanged,
    trace_verdict_changed: row.traceVerdictChanged,
    expected_snapshot: asRecord(row.expectedSnapshot),
    observed_snapshot: asRecord(row.observedSnapshot) as unknown as TopicSelectionReplayDiffRecord['observed_snapshot'],
    baseline_snapshot: row.baselineSnapshot === null
      ? null
      : asRecord(row.baselineSnapshot) as unknown as TopicSelectionReplayDiffRecord['baseline_snapshot'],
    diff_payload: asRecord(row.diffPayload),
    created_at: row.createdAt.toISOString(),
  };
}

export class PrismaTopicSelectionOfflineEvaluationReplayRepository
implements TopicSelectionOfflineEvaluationReplayRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createDataset(
    record: TopicSelectionOfflineEvaluationDatasetRecord,
  ): Promise<TopicSelectionOfflineEvaluationDatasetRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationDataset.create({
      data: {
        id: record.offline_evaluation_dataset_id,
        workspaceId: record.workspace_id ?? null,
        datasetKey: record.dataset_key,
        datasetVersion: record.dataset_version,
        stage: record.stage,
        source: record.source,
        status: record.status,
        description: record.description ?? null,
        caseCount: record.case_count,
        caseTypeCoverage: record.case_type_coverage,
        payload: toJsonValue(record.payload),
        createdBy: record.created_by,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      },
    });
    return toDatasetRecord(row);
  }

  async findDatasetById(datasetId: string): Promise<TopicSelectionOfflineEvaluationDatasetRecord | null> {
    const row = await this.prisma.topicSelectionOfflineEvaluationDataset.findUnique({
      where: { id: datasetId },
    });
    return row ? toDatasetRecord(row) : null;
  }

  async updateDataset(
    datasetId: string,
    patch: TopicSelectionOfflineEvaluationDatasetPatch,
  ): Promise<TopicSelectionOfflineEvaluationDatasetRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationDataset.update({
      where: { id: datasetId },
      data: {
        workspaceId: patch.workspace_id,
        datasetKey: patch.dataset_key,
        datasetVersion: patch.dataset_version,
        stage: patch.stage,
        source: patch.source,
        status: patch.status,
        description: patch.description,
        caseCount: patch.case_count,
        caseTypeCoverage: patch.case_type_coverage,
        payload: optionalJson(patch.payload),
        createdBy: patch.created_by,
        updatedAt: patch.updated_at ? new Date(patch.updated_at) : undefined,
      },
    });
    return toDatasetRecord(row);
  }

  async createCase(record: TopicSelectionOfflineEvaluationCaseRecord): Promise<TopicSelectionOfflineEvaluationCaseRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationCase.create({
      data: {
        id: record.offline_evaluation_case_id,
        workspaceId: record.workspace_id ?? null,
        datasetId: record.dataset_id,
        titleCardId: record.title_card_id ?? null,
        caseKey: record.case_key,
        caseType: record.case_type,
        status: record.status,
        frozenInputBundle: toJsonValue(record.frozen_input_bundle),
        goldExpectation: toJsonValue(record.gold_expectation),
        tags: record.tags,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      },
    });
    return toCaseRecord(row);
  }

  async findCaseById(caseId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord | null> {
    const row = await this.prisma.topicSelectionOfflineEvaluationCase.findUnique({
      where: { id: caseId },
    });
    return row ? toCaseRecord(row) : null;
  }

  async listCasesByDatasetId(datasetId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord[]> {
    const rows = await this.prisma.topicSelectionOfflineEvaluationCase.findMany({
      where: { datasetId },
      orderBy: { caseKey: 'asc' },
    });
    return rows.map(toCaseRecord);
  }

  async createRun(record: TopicSelectionOfflineEvaluationRunRecord): Promise<TopicSelectionOfflineEvaluationRunRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationRun.create({
      data: {
        id: record.offline_evaluation_run_id,
        workspaceId: record.workspace_id ?? null,
        datasetId: record.dataset_id,
        runKey: record.run_key,
        status: record.status,
        workflowProfileKey: record.workflow_profile_key,
        workflowProfileVersion: record.workflow_profile_version ?? null,
        modelProfileKey: record.model_profile_key ?? null,
        searchProfileKey: record.search_profile_key ?? null,
        policyVersionId: record.policy_version_id ?? null,
        metricKeys: record.metric_keys,
        caseCount: record.case_count,
        runPayload: toJsonValue(record.run_payload),
        createdBy: record.created_by,
        startedAt: new Date(record.started_at),
        finishedAt: dateOrNull(record.finished_at),
      },
    });
    return toRunRecord(row);
  }

  async findRunById(runId: string): Promise<TopicSelectionOfflineEvaluationRunRecord | null> {
    const row = await this.prisma.topicSelectionOfflineEvaluationRun.findUnique({
      where: { id: runId },
    });
    return row ? toRunRecord(row) : null;
  }

  async updateRun(
    runId: string,
    patch: TopicSelectionOfflineEvaluationRunPatch,
  ): Promise<TopicSelectionOfflineEvaluationRunRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationRun.update({
      where: { id: runId },
      data: {
        workspaceId: patch.workspace_id,
        runKey: patch.run_key,
        status: patch.status,
        workflowProfileKey: patch.workflow_profile_key,
        workflowProfileVersion: patch.workflow_profile_version,
        modelProfileKey: patch.model_profile_key,
        searchProfileKey: patch.search_profile_key,
        policyVersionId: patch.policy_version_id,
        metricKeys: patch.metric_keys,
        caseCount: patch.case_count,
        runPayload: optionalJson(patch.run_payload),
        createdBy: patch.created_by,
        finishedAt: patch.finished_at === undefined ? undefined : dateOrNull(patch.finished_at),
      },
    });
    return toRunRecord(row);
  }

  async createCaseResult(
    record: TopicSelectionOfflineEvaluationCaseResultRecord,
  ): Promise<TopicSelectionOfflineEvaluationCaseResultRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationCaseResult.create({
      data: {
        id: record.offline_evaluation_case_result_id,
        workspaceId: record.workspace_id ?? null,
        runId: record.run_id,
        datasetId: record.dataset_id,
        caseId: record.case_id,
        caseType: record.case_type,
        status: record.status,
        observedOutput: toJsonValue(record.observed_output),
        replayDiffRef: jsonOrNull(record.replay_diff_ref),
        metricContributionPayload: toJsonValue(record.metric_contribution_payload),
        failureExamples: record.failure_examples,
        createdAt: new Date(record.created_at),
      },
    });
    return toCaseResultRecord(row);
  }

  async findCaseResultByRunAndCaseId(
    runId: string,
    caseId: string,
  ): Promise<TopicSelectionOfflineEvaluationCaseResultRecord | null> {
    const row = await this.prisma.topicSelectionOfflineEvaluationCaseResult.findFirst({
      where: { runId, caseId },
    });
    return row ? toCaseResultRecord(row) : null;
  }

  async listCaseResultsByRunId(runId: string): Promise<TopicSelectionOfflineEvaluationCaseResultRecord[]> {
    const rows = await this.prisma.topicSelectionOfflineEvaluationCaseResult.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toCaseResultRecord);
  }

  async createMetricResult(
    record: TopicSelectionOfflineEvaluationMetricResultRecord,
  ): Promise<TopicSelectionOfflineEvaluationMetricResultRecord> {
    const row = await this.prisma.topicSelectionOfflineEvaluationMetricResult.create({
      data: {
        id: record.offline_evaluation_metric_result_id,
        workspaceId: record.workspace_id ?? null,
        runId: record.run_id,
        datasetId: record.dataset_id,
        metricKey: record.metric_key,
        numerator: record.numerator,
        denominator: record.denominator,
        value: record.value,
        contributingCaseRefs: toJsonValue(record.contributing_case_refs),
        failureCaseRefs: toJsonValue(record.failure_case_refs),
        notes: record.notes,
        metricPayload: toJsonValue(record.metric_payload),
        createdAt: new Date(record.created_at),
      },
    });
    return toMetricResultRecord(row);
  }

  async listMetricResultsByRunId(runId: string): Promise<TopicSelectionOfflineEvaluationMetricResultRecord[]> {
    const rows = await this.prisma.topicSelectionOfflineEvaluationMetricResult.findMany({
      where: { runId },
      orderBy: { metricKey: 'asc' },
    });
    return rows.map(toMetricResultRecord);
  }

  async createReplayDiff(record: TopicSelectionReplayDiffRecord): Promise<TopicSelectionReplayDiffRecord> {
    const row = await this.prisma.topicSelectionReplayDiff.create({
      data: {
        id: record.replay_diff_id,
        workspaceId: record.workspace_id ?? null,
        runId: record.run_id,
        datasetId: record.dataset_id,
        caseId: record.case_id,
        status: record.status,
        changedDimensions: record.changed_dimensions,
        finalDecisionChanged: record.final_decision_changed,
        keyEvidenceSetChanged: record.key_evidence_set_changed,
        blockerSetChanged: record.blocker_set_changed,
        traceVerdictChanged: record.trace_verdict_changed,
        expectedSnapshot: toJsonValue(record.expected_snapshot),
        observedSnapshot: toJsonValue(record.observed_snapshot),
        baselineSnapshot: jsonOrNull(record.baseline_snapshot),
        diffPayload: toJsonValue(record.diff_payload),
        createdAt: new Date(record.created_at),
      },
    });
    return toReplayDiffRecord(row);
  }

  async listReplayDiffsByRunId(runId: string): Promise<TopicSelectionReplayDiffRecord[]> {
    const rows = await this.prisma.topicSelectionReplayDiff.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toReplayDiffRecord);
  }
}
