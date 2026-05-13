import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS,
  type TopicSelectionOfflineEvaluationCaseRecord,
  type TopicSelectionOfflineEvaluationMetricResultRecord,
  type TopicSelectionOfflineEvaluationObservedOutput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionOfflineEvaluationReplayRepository } from '../repositories/in-memory-topic-selection-offline-evaluation-replay-repository.js';
import { TopicSelectionOfflineEvaluationReplayService } from './topic-selection-offline-evaluation-replay-service.js';

function makeContext() {
  let sequence = 0;
  const now = () => '2026-05-13T00:00:00.000Z';
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const repository = new InMemoryTopicSelectionOfflineEvaluationReplayRepository();
  const service = new TopicSelectionOfflineEvaluationReplayService(repository, { idFactory, now });
  return { repository, service };
}

async function createCompletedSyntheticRun() {
  const ctx = makeContext();
  const { dataset, cases } = await ctx.service.createSyntheticV1aBaselineDataset();
  const run = await ctx.service.startRun({
    dataset_id: dataset.offline_evaluation_dataset_id,
    workflow_profile_key: 'topic-selection-v1a-frozen-fixture',
    workflow_profile_version: 'v1',
    model_profile_key: 'offline-fixture',
    search_profile_key: 'offline-fixture',
    policy_version_id: 'policy_v1',
  });

  for (const evaluationCase of cases) {
    await ctx.service.recordFrozenCaseResult({
      run_id: run.offline_evaluation_run_id,
      case_id: evaluationCase.offline_evaluation_case_id,
      observed_output: fixtureObservedOutput(evaluationCase),
    });
  }
  const completion = await ctx.service.completeRunAndCalculateMetrics({
    run_id: run.offline_evaluation_run_id,
  });
  return { ...ctx, dataset, cases, run: completion.run, metricResults: completion.metric_results };
}

function fixtureObservedOutput(
  evaluationCase: TopicSelectionOfflineEvaluationCaseRecord,
): TopicSelectionOfflineEvaluationObservedOutput {
  return evaluationCase.frozen_input_bundle.payload.fixture_observed_output as TopicSelectionOfflineEvaluationObservedOutput;
}

function metricByKey(
  metrics: TopicSelectionOfflineEvaluationMetricResultRecord[],
): Map<string, TopicSelectionOfflineEvaluationMetricResultRecord> {
  return new Map(metrics.map((record) => [record.metric_key, record]));
}

test('synthetic baseline covers every required v1a offline evaluation case type', async () => {
  const ctx = makeContext();
  const { dataset, cases } = await ctx.service.createSyntheticV1aBaselineDataset();

  assert.equal(dataset.case_count, TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES.length);
  assert.deepEqual(new Set(cases.map((record) => record.case_type)), new Set(TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES));
  assert.deepEqual(new Set(dataset.case_type_coverage), new Set(TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES));
  assert.equal(cases.every((record) => record.frozen_input_bundle.stage === 'v1a'), true);
  assert.equal(cases.every((record) => record.frozen_input_bundle.payload.fixture_observed_output), true);
});

test('frozen replay records case results without production workflow or ValidatedNeed dependencies', async () => {
  const ctx = makeContext();
  const { dataset, cases } = await ctx.service.createSyntheticV1aBaselineDataset();
  const run = await ctx.service.startRun({
    dataset_id: dataset.offline_evaluation_dataset_id,
    workflow_profile_key: 'topic-selection-v1a-frozen-fixture',
  });

  const first = cases.find((record) => record.case_type === 'true_unmet_need') as TopicSelectionOfflineEvaluationCaseRecord;
  const result = await ctx.service.recordFrozenCaseResult({
    run_id: run.offline_evaluation_run_id,
    case_id: first.offline_evaluation_case_id,
    observed_output: fixtureObservedOutput(first),
  });

  assert.equal(result.case_result.dataset_id, dataset.offline_evaluation_dataset_id);
  assert.equal(result.case_result.status, 'evaluated');
  assert.equal(result.case_result.observed_output.final_decision, 'validate');
  assert.equal(result.replay_diff.dataset_id, dataset.offline_evaluation_dataset_id);
  assert.equal(await ctx.repository.findDatasetById(dataset.offline_evaluation_dataset_id), dataset);
});

test('offline replay service remains isolated from live v1a write services', async () => {
  const serviceSource = await readFile(
    new URL('./topic-selection-offline-evaluation-replay-service.ts', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(serviceSource, /topic-selection-need-validation-service/);
  assert.doesNotMatch(serviceSource, /topic-selection-recheck-risk-memory-service/);
  assert.doesNotMatch(serviceSource, /topic-selection-search-resource-service/);
  assert.doesNotMatch(serviceSource, /topic-selection-control-plane-service/);
});

test('offline replay runs deduplicate metric keys and reject empty metric sets', async () => {
  const ctx = makeContext();
  const { dataset } = await ctx.service.createSyntheticV1aBaselineDataset();

  const run = await ctx.service.startRun({
    dataset_id: dataset.offline_evaluation_dataset_id,
    workflow_profile_key: 'topic-selection-v1a-frozen-fixture',
    metric_keys: ['false_gap_rate', 'false_gap_rate', 'trace_completeness'],
  });

  assert.deepEqual(run.metric_keys, ['false_gap_rate', 'trace_completeness']);
  await assert.rejects(
    () => ctx.service.startRun({
      dataset_id: dataset.offline_evaluation_dataset_id,
      workflow_profile_key: 'topic-selection-v1a-frozen-fixture',
      metric_keys: [],
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('frozen replay rejects duplicate case results and cannot complete with missing case results', async () => {
  const ctx = makeContext();
  const { dataset, cases } = await ctx.service.createSyntheticV1aBaselineDataset();
  const run = await ctx.service.startRun({
    dataset_id: dataset.offline_evaluation_dataset_id,
    workflow_profile_key: 'topic-selection-v1a-frozen-fixture',
  });
  const first = cases.find((record) => record.case_type === 'true_unmet_need') as TopicSelectionOfflineEvaluationCaseRecord;

  await ctx.service.recordFrozenCaseResult({
    run_id: run.offline_evaluation_run_id,
    case_id: first.offline_evaluation_case_id,
    observed_output: fixtureObservedOutput(first),
  });

  await assert.rejects(
    () => ctx.service.recordFrozenCaseResult({
      run_id: run.offline_evaluation_run_id,
      case_id: first.offline_evaluation_case_id,
      observed_output: fixtureObservedOutput(first),
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );
  await assert.rejects(
    () => ctx.service.completeRunAndCalculateMetrics({ run_id: run.offline_evaluation_run_id }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );
});

test('completed replay runs reject late case results and metric completion is idempotent', async () => {
  const { run, cases, service, metricResults } = await createCompletedSyntheticRun();
  const first = cases.find((record) => record.case_type === 'true_unmet_need') as TopicSelectionOfflineEvaluationCaseRecord;

  await assert.rejects(
    () => service.recordFrozenCaseResult({
      run_id: run.offline_evaluation_run_id,
      case_id: first.offline_evaluation_case_id,
      observed_output: fixtureObservedOutput(first),
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );

  const secondCompletion = await service.completeRunAndCalculateMetrics({ run_id: run.offline_evaluation_run_id });
  assert.equal(secondCompletion.run.status, 'completed');
  assert.deepEqual(secondCompletion.metric_results, metricResults);
});

test('metric calculation emits all minimum metrics with numerator, denominator, case refs, and notes', async () => {
  const { metricResults } = await createCompletedSyntheticRun();
  const byKey = metricByKey(metricResults);

  assert.deepEqual(new Set(byKey.keys()), new Set(TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS));
  for (const metricKey of TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS) {
    const metric = byKey.get(metricKey);
    assert.ok(metric, `missing metric ${metricKey}`);
    assert.equal(typeof metric.numerator, 'number');
    assert.equal(typeof metric.denominator, 'number');
    assert.equal(Array.isArray(metric.contributing_case_refs), true);
    assert.equal(Array.isArray(metric.failure_case_refs), true);
    assert.equal(metric.notes.length > 0, true);
  }

  assert.equal(byKey.get('false_gap_rate')?.numerator, 2);
  assert.equal(byKey.get('false_gap_rate')?.denominator, 7);
  assert.equal(byKey.get('baseline_miss_rate')?.numerator, 1);
  assert.equal(byKey.get('baseline_miss_rate')?.denominator, 1);
  assert.equal(byKey.get('counter_evidence_recall')?.numerator, 0);
  assert.equal(byKey.get('counter_evidence_recall')?.denominator, 3);
  assert.equal(byKey.get('trace_completeness')?.numerator, 8);
  assert.equal(byKey.get('trace_completeness')?.denominator, 9);
  assert.equal(byKey.get('readiness_false_pass_rate')?.numerator, 2);
  assert.equal(byKey.get('human_override_rate')?.numerator, 1);
  assert.equal(byKey.get('rerun_instability')?.numerator, 1);
  assert.equal(byKey.get('recheck_precision')?.numerator, 1);
  assert.equal(byKey.get('recheck_precision')?.denominator, 1);
});

test('ReplayDiff flags final decision, key evidence, blocker set, and trace verdict changes', async () => {
  const { run, service } = await createCompletedSyntheticRun();
  const diffs = await service.listReplayDiffs(run.offline_evaluation_run_id);
  const changedDimensions = new Set(diffs.flatMap((record) => record.changed_dimensions));

  assert.equal(changedDimensions.has('final_decision'), true);
  assert.equal(changedDimensions.has('key_evidence_set'), true);
  assert.equal(changedDimensions.has('blocker_set'), true);
  assert.equal(changedDimensions.has('trace_verdict'), true);
  assert.equal(diffs.some((record) => record.status === 'mismatch'), true);
});

test('memory is evaluated as constraint context only and never boosts evidence recall', async () => {
  const { metricResults } = await createCompletedSyntheticRun();
  const byKey = metricByKey(metricResults);
  const memory = byKey.get('negative_memory_usefulness');
  const counterEvidence = byKey.get('counter_evidence_recall');

  assert.equal(memory?.numerator, 1);
  assert.equal(memory?.denominator, 2);
  assert.equal(memory?.failure_case_refs.some((ref) => ref.title_card_id === 'title_card_same_team_duplicate_claim'), true);
  assert.deepEqual(memory?.metric_payload, { evidence_policy: 'not_evidence' });
  assert.equal(counterEvidence?.denominator, 3);
  assert.equal(counterEvidence?.numerator, 0);
});

test('downstream rework cause metric records classification distribution', async () => {
  const { metricResults } = await createCompletedSyntheticRun();
  const downstream = metricByKey(metricResults).get('downstream_rework_cause');

  assert.equal(downstream?.numerator, 1);
  assert.equal(downstream?.denominator, 1);
  assert.deepEqual(downstream?.metric_payload, {
    cause_distribution: {
      weak_counter_evidence_recall: 1,
    },
  });
});

test('Prisma migration protects one case result per run/case and one metric result per run/key', async () => {
  const migration = await readFile(
    new URL('../../../../prisma/migrations/20260513224500_add_topic_selection_offline_evaluation_replay/migration.sql', import.meta.url),
    'utf8',
  );

  assert.match(
    migration,
    /CREATE UNIQUE INDEX "TopicSelectionOfflineEvaluationCaseResult_runId_caseId_key"/,
  );
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "TopicSelectionOfflineEvaluationMetricResult_runId_metricKey_key"/,
  );
});
