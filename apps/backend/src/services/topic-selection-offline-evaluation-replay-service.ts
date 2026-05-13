import crypto from 'node:crypto';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import {
  TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES,
  TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS,
  createTopicSelectionOfflineFrozenInputBundle,
  type TopicSelectionOfflineEvaluationCaseRecord,
  type TopicSelectionOfflineEvaluationCaseResultRecord,
  type TopicSelectionOfflineEvaluationCaseType,
  type TopicSelectionOfflineEvaluationDatasetRecord,
  type TopicSelectionOfflineEvaluationDatasetSource,
  type TopicSelectionOfflineEvaluationGoldExpectation,
  type TopicSelectionOfflineEvaluationMetricKey,
  type TopicSelectionOfflineEvaluationMetricResultRecord,
  type TopicSelectionOfflineEvaluationObservedOutput,
  type TopicSelectionOfflineEvaluationRunRecord,
  type TopicSelectionReplayDiffDimension,
  type TopicSelectionReplayDiffRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-offline-evaluation-replay-contracts';
import { AppError } from '../errors/app-error.js';
import type { TopicSelectionOfflineEvaluationReplayRepository } from '../repositories/topic-selection-offline-evaluation-replay.repository.js';

type IdFactory = (prefix: string) => string;

type ServiceOptions = {
  idFactory?: IdFactory;
  now?: () => string;
};

type CreateDatasetInput = {
  workspace_id?: string | null;
  dataset_key?: string;
  dataset_version?: string;
  source?: TopicSelectionOfflineEvaluationDatasetSource;
  status?: TopicSelectionOfflineEvaluationDatasetRecord['status'];
  description?: string | null;
  payload?: Record<string, unknown>;
  created_by?: TopicSelectionOfflineEvaluationDatasetRecord['created_by'];
};

type AddCaseInput = {
  workspace_id?: string | null;
  dataset_id: string;
  title_card_id?: string | null;
  case_key: string;
  case_type: TopicSelectionOfflineEvaluationCaseType;
  frozen_input_bundle: TopicSelectionOfflineEvaluationCaseRecord['frozen_input_bundle'];
  gold_expectation: TopicSelectionOfflineEvaluationGoldExpectation;
  tags?: string[];
};

type StartRunInput = {
  workspace_id?: string | null;
  dataset_id: string;
  run_key?: string;
  workflow_profile_key: string;
  workflow_profile_version?: string | null;
  model_profile_key?: string | null;
  search_profile_key?: string | null;
  policy_version_id?: string | null;
  metric_keys?: TopicSelectionOfflineEvaluationMetricKey[];
  run_payload?: Record<string, unknown>;
  created_by?: TopicSelectionOfflineEvaluationRunRecord['created_by'];
};

type SyntheticCaseSpec = {
  case_key: string;
  case_type: TopicSelectionOfflineEvaluationCaseType;
  tags: string[];
  gold: TopicSelectionOfflineEvaluationGoldExpectation;
  observed: TopicSelectionOfflineEvaluationObservedOutput;
};

type MetricComputation = {
  numerator: number;
  denominator: number;
  contributing_case_refs: TopicSelectionFunctionalRef[];
  failure_case_refs: TopicSelectionFunctionalRef[];
  notes: string[];
  metric_payload: Record<string, unknown>;
};

export class TopicSelectionOfflineEvaluationReplayService {
  private readonly idFactory: IdFactory;
  private readonly now: () => string;

  constructor(
    private readonly repository: TopicSelectionOfflineEvaluationReplayRepository,
    options: ServiceOptions = {},
  ) {
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async createDataset(input: CreateDatasetInput = {}): Promise<TopicSelectionOfflineEvaluationDatasetRecord> {
    const now = this.now();
    const record: TopicSelectionOfflineEvaluationDatasetRecord = {
      offline_evaluation_dataset_id: this.idFactory('offline_eval_dataset'),
      workspace_id: input.workspace_id ?? null,
      dataset_key: input.dataset_key ?? 'topic-selection-v1a-synthetic-baseline',
      dataset_version: input.dataset_version ?? 'v1',
      stage: 'v1a',
      source: input.source ?? 'synthetic_fixture',
      status: input.status ?? 'draft',
      description: input.description ?? null,
      case_count: 0,
      case_type_coverage: [],
      payload: input.payload ?? {},
      created_by: input.created_by ?? 'system',
      created_at: now,
      updated_at: now,
    };
    return this.repository.createDataset(record);
  }

  async createSyntheticV1aBaselineDataset(input: CreateDatasetInput = {}): Promise<{
    dataset: TopicSelectionOfflineEvaluationDatasetRecord;
    cases: TopicSelectionOfflineEvaluationCaseRecord[];
  }> {
    const dataset = await this.createDataset({
      ...input,
      source: 'synthetic_fixture',
      status: input.status ?? 'active',
      description: input.description ?? 'Synthetic v1a offline evaluation baseline covering required case types.',
      payload: {
        fixture_family: 'topic-selection-v1a-minimum',
        replay_mode: 'frozen_snapshot_evaluation',
        ...(input.payload ?? {}),
      },
    });
    const specs = this.syntheticCaseSpecs(this.now());
    for (const spec of specs) {
      await this.addCase({
        workspace_id: input.workspace_id ?? null,
        dataset_id: dataset.offline_evaluation_dataset_id,
        title_card_id: `title_card_${spec.case_key}`,
        case_key: spec.case_key,
        case_type: spec.case_type,
        tags: spec.tags,
        gold_expectation: spec.gold,
        frozen_input_bundle: createTopicSelectionOfflineFrozenInputBundle({
          frozen_at: this.now(),
          source_refs: this.uniqueRefs([
            ...spec.gold.expected_key_evidence_refs,
            ...spec.gold.expected_counter_evidence_refs,
            ...spec.gold.required_trace_refs,
            ...spec.gold.expected_recheck_action_refs,
            ...spec.gold.expected_negative_memory_refs,
          ]),
          stage_snapshots: {
            control_plane: { fixture_case_key: spec.case_key },
            search_resource: { fixture_case_key: spec.case_key },
            evidence_map: { fixture_case_key: spec.case_key },
            need_validation: { fixture_case_key: spec.case_key },
            recheck_risk_memory: { fixture_case_key: spec.case_key },
            downstream_feedback: { causes: spec.gold.expected_downstream_rework_causes },
          },
          payload: {
            fixture_observed_output: spec.observed,
          },
        }),
      });
    }

    return {
      dataset: await this.requireDataset(dataset.offline_evaluation_dataset_id),
      cases: await this.repository.listCasesByDatasetId(dataset.offline_evaluation_dataset_id),
    };
  }

  async addCase(input: AddCaseInput): Promise<TopicSelectionOfflineEvaluationCaseRecord> {
    const dataset = await this.requireDataset(input.dataset_id);
    const now = this.now();
    const record: TopicSelectionOfflineEvaluationCaseRecord = {
      offline_evaluation_case_id: this.idFactory('offline_eval_case'),
      workspace_id: input.workspace_id ?? dataset.workspace_id ?? null,
      dataset_id: dataset.offline_evaluation_dataset_id,
      title_card_id: input.title_card_id ?? null,
      case_key: input.case_key,
      case_type: input.case_type,
      status: 'active',
      frozen_input_bundle: input.frozen_input_bundle,
      gold_expectation: input.gold_expectation,
      tags: input.tags ?? [],
      created_at: now,
      updated_at: now,
    };
    const created = await this.repository.createCase(record);
    const cases = await this.repository.listCasesByDatasetId(dataset.offline_evaluation_dataset_id);
    await this.repository.updateDataset(dataset.offline_evaluation_dataset_id, {
      case_count: cases.length,
      case_type_coverage: this.caseTypeCoverage(cases),
      updated_at: now,
    });
    return created;
  }

  async startRun(input: StartRunInput): Promise<TopicSelectionOfflineEvaluationRunRecord> {
    const dataset = await this.requireDataset(input.dataset_id);
    const cases = await this.repository.listCasesByDatasetId(dataset.offline_evaluation_dataset_id);
    const now = this.now();
    const metricKeys = this.uniqueMetricKeys(input.metric_keys ?? [...TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS]);
    if (metricKeys.length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Offline evaluation runs require at least one metric key.');
    }
    const record: TopicSelectionOfflineEvaluationRunRecord = {
      offline_evaluation_run_id: this.idFactory('offline_eval_run'),
      workspace_id: input.workspace_id ?? dataset.workspace_id ?? null,
      dataset_id: dataset.offline_evaluation_dataset_id,
      run_key: input.run_key ?? `${dataset.dataset_key}:${dataset.dataset_version}:${now}`,
      status: 'running',
      workflow_profile_key: input.workflow_profile_key,
      workflow_profile_version: input.workflow_profile_version ?? null,
      model_profile_key: input.model_profile_key ?? null,
      search_profile_key: input.search_profile_key ?? null,
      policy_version_id: input.policy_version_id ?? null,
      metric_keys: metricKeys,
      case_count: cases.length,
      run_payload: {
        replay_mode: 'frozen_snapshot_evaluation',
        ...(input.run_payload ?? {}),
      },
      created_by: input.created_by ?? 'system',
      started_at: now,
      finished_at: null,
    };
    return this.repository.createRun(record);
  }

  async recordFrozenCaseResult(input: {
    workspace_id?: string | null;
    run_id: string;
    case_id: string;
    observed_output: TopicSelectionOfflineEvaluationObservedOutput;
  }): Promise<{
    case_result: TopicSelectionOfflineEvaluationCaseResultRecord;
    replay_diff: TopicSelectionReplayDiffRecord;
  }> {
    const run = await this.requireRun(input.run_id);
    if (run.status !== 'running') {
      throw new AppError(409, 'VERSION_CONFLICT', 'Frozen case results can only be recorded for running offline evaluation runs.');
    }
    const evaluationCase = await this.requireCase(input.case_id);
    if (evaluationCase.status !== 'active') {
      throw new AppError(409, 'VERSION_CONFLICT', 'Frozen case results can only be recorded for active offline evaluation cases.');
    }
    if (evaluationCase.dataset_id !== run.dataset_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Case does not belong to the run dataset.');
    }
    const existingResult = await this.repository.findCaseResultByRunAndCaseId(
      run.offline_evaluation_run_id,
      evaluationCase.offline_evaluation_case_id,
    );
    if (existingResult) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Offline evaluation run already has a result for this case.');
    }

    const now = this.now();
    const replayDiff = await this.repository.createReplayDiff(
      this.buildReplayDiff({
        workspace_id: input.workspace_id ?? run.workspace_id ?? evaluationCase.workspace_id ?? null,
        run,
        evaluationCase,
        observed_output: input.observed_output,
        created_at: now,
      }),
    );
    const caseResult = await this.repository.createCaseResult({
      offline_evaluation_case_result_id: this.idFactory('offline_eval_case_result'),
      workspace_id: input.workspace_id ?? run.workspace_id ?? evaluationCase.workspace_id ?? null,
      run_id: run.offline_evaluation_run_id,
      dataset_id: run.dataset_id,
      case_id: evaluationCase.offline_evaluation_case_id,
      case_type: evaluationCase.case_type,
      status: 'evaluated',
      observed_output: input.observed_output,
      replay_diff_ref: this.ref('offline_evaluation_replay_diff', replayDiff.replay_diff_id, evaluationCase.title_card_id),
      metric_contribution_payload: this.caseContributionPayload(evaluationCase, input.observed_output, replayDiff),
      failure_examples: this.failureExamples(evaluationCase, input.observed_output, replayDiff),
      created_at: now,
    });

    return { case_result: caseResult, replay_diff: replayDiff };
  }

  async completeRunAndCalculateMetrics(input: { run_id: string }): Promise<{
    run: TopicSelectionOfflineEvaluationRunRecord;
    metric_results: TopicSelectionOfflineEvaluationMetricResultRecord[];
  }> {
    const run = await this.requireRun(input.run_id);
    const existing = await this.repository.listMetricResultsByRunId(run.offline_evaluation_run_id);
    if (existing.length > 0) {
      const expectedMetricKeys = new Set(run.metric_keys);
      const existingMetricKeys = new Set(existing.map((record) => record.metric_key));
      const hasAllMetrics = run.metric_keys.every((metricKey) => existingMetricKeys.has(metricKey));
      const hasUnexpectedMetrics = existing.some((record) => !expectedMetricKeys.has(record.metric_key));
      if (hasAllMetrics && !hasUnexpectedMetrics && existing.length === run.metric_keys.length) {
        if (run.status === 'completed') {
          return { run, metric_results: existing };
        }
        if (run.status === 'running') {
          const recoveredRun = await this.repository.updateRun(run.offline_evaluation_run_id, {
            status: 'completed',
            finished_at: this.now(),
          });
          return { run: recoveredRun, metric_results: existing };
        }
      }
      throw new AppError(409, 'VERSION_CONFLICT', 'Offline evaluation run already has partial or inconsistent metric results.');
    }
    if (run.status !== 'running') {
      throw new AppError(409, 'VERSION_CONFLICT', 'Only running offline evaluation runs can calculate metrics.');
    }

    const cases = (await this.repository.listCasesByDatasetId(run.dataset_id))
      .filter((record) => record.status === 'active');
    if (cases.length === 0) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Offline evaluation run cannot complete without active cases.');
    }
    const caseResults = await this.repository.listCaseResultsByRunId(run.offline_evaluation_run_id);
    const caseIds = new Set(cases.map((record) => record.offline_evaluation_case_id));
    const resultCounts = new Map<string, number>();
    for (const caseResult of caseResults) {
      if (!caseIds.has(caseResult.case_id)) {
        throw new AppError(409, 'VERSION_CONFLICT', 'Offline evaluation run has a case result outside its active dataset cases.');
      }
      resultCounts.set(caseResult.case_id, (resultCounts.get(caseResult.case_id) ?? 0) + 1);
    }
    const missingCaseIds = [...caseIds].filter((caseId) => !resultCounts.has(caseId));
    const duplicateCaseIds = [...resultCounts].filter(([, count]) => count > 1).map(([caseId]) => caseId);
    if (missingCaseIds.length > 0 || duplicateCaseIds.length > 0) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Offline evaluation run cannot complete before every active case has a result.');
    }

    const resultByCaseId = new Map(caseResults.map((record) => [record.case_id, record]));
    for (const metricKey of run.metric_keys) {
      const computation = this.computeMetric(metricKey, cases, resultByCaseId);
      await this.repository.createMetricResult({
        offline_evaluation_metric_result_id: this.idFactory('offline_eval_metric_result'),
        workspace_id: run.workspace_id ?? null,
        run_id: run.offline_evaluation_run_id,
        dataset_id: run.dataset_id,
        metric_key: metricKey,
        numerator: computation.numerator,
        denominator: computation.denominator,
        value: computation.denominator === 0 ? null : computation.numerator / computation.denominator,
        contributing_case_refs: computation.contributing_case_refs,
        failure_case_refs: computation.failure_case_refs,
        notes: computation.notes,
        metric_payload: computation.metric_payload,
        created_at: this.now(),
      });
    }

    const completedRun = await this.repository.updateRun(run.offline_evaluation_run_id, {
      status: 'completed',
      finished_at: this.now(),
      case_count: cases.length,
    });
    const persisted = await this.repository.listMetricResultsByRunId(run.offline_evaluation_run_id);
    return { run: completedRun, metric_results: persisted };
  }

  async listMetricResults(runId: string): Promise<TopicSelectionOfflineEvaluationMetricResultRecord[]> {
    return this.repository.listMetricResultsByRunId(runId);
  }

  async listReplayDiffs(runId: string): Promise<TopicSelectionReplayDiffRecord[]> {
    return this.repository.listReplayDiffsByRunId(runId);
  }

  private async requireDataset(datasetId: string): Promise<TopicSelectionOfflineEvaluationDatasetRecord> {
    const dataset = await this.repository.findDatasetById(datasetId);
    if (!dataset) {
      throw new AppError(404, 'NOT_FOUND', `OfflineEvaluationDataset ${datasetId} not found.`);
    }
    return dataset;
  }

  private async requireCase(caseId: string): Promise<TopicSelectionOfflineEvaluationCaseRecord> {
    const evaluationCase = await this.repository.findCaseById(caseId);
    if (!evaluationCase) {
      throw new AppError(404, 'NOT_FOUND', `OfflineEvaluationCase ${caseId} not found.`);
    }
    return evaluationCase;
  }

  private async requireRun(runId: string): Promise<TopicSelectionOfflineEvaluationRunRecord> {
    const run = await this.repository.findRunById(runId);
    if (!run) {
      throw new AppError(404, 'NOT_FOUND', `OfflineEvaluationRun ${runId} not found.`);
    }
    return run;
  }

  private buildReplayDiff(input: {
    workspace_id?: string | null;
    run: TopicSelectionOfflineEvaluationRunRecord;
    evaluationCase: TopicSelectionOfflineEvaluationCaseRecord;
    observed_output: TopicSelectionOfflineEvaluationObservedOutput;
    created_at: string;
  }): TopicSelectionReplayDiffRecord {
    const gold = input.evaluationCase.gold_expectation;
    const observed = input.observed_output;
    const finalDecisionChanged = gold.expected_final_decision !== undefined
      && (observed.final_decision ?? null) !== (gold.expected_final_decision ?? null);
    const keyEvidenceSetChanged = !this.sameRefSet(gold.expected_key_evidence_refs, observed.key_evidence_refs);
    const blockerSetChanged = !this.sameStringSet(gold.expected_blocker_codes, observed.blocker_codes);
    const traceVerdictChanged = !this.traceComplete(gold, observed);
    const changedDimensions: TopicSelectionReplayDiffDimension[] = [];
    if (finalDecisionChanged) changedDimensions.push('final_decision');
    if (keyEvidenceSetChanged) changedDimensions.push('key_evidence_set');
    if (blockerSetChanged) changedDimensions.push('blocker_set');
    if (traceVerdictChanged) changedDimensions.push('trace_verdict');

    return {
      replay_diff_id: this.idFactory('replay_diff'),
      workspace_id: input.workspace_id ?? null,
      run_id: input.run.offline_evaluation_run_id,
      dataset_id: input.run.dataset_id,
      case_id: input.evaluationCase.offline_evaluation_case_id,
      status: changedDimensions.length === 0 ? 'match' : 'mismatch',
      changed_dimensions: changedDimensions,
      final_decision_changed: finalDecisionChanged,
      key_evidence_set_changed: keyEvidenceSetChanged,
      blocker_set_changed: blockerSetChanged,
      trace_verdict_changed: traceVerdictChanged,
      expected_snapshot: {
        expected_final_decision: gold.expected_final_decision ?? null,
        expected_key_evidence_refs: gold.expected_key_evidence_refs,
        expected_blocker_codes: gold.expected_blocker_codes,
        expected_trace_verdict: gold.expected_trace_verdict ?? null,
        required_trace_refs: gold.required_trace_refs,
      },
      observed_snapshot: observed,
      baseline_snapshot: observed.baseline_observed_output ?? null,
      diff_payload: {
        changed_dimensions: changedDimensions,
        case_key: input.evaluationCase.case_key,
        case_type: input.evaluationCase.case_type,
      },
      created_at: input.created_at,
    };
  }

  private computeMetric(
    metricKey: TopicSelectionOfflineEvaluationMetricKey,
    cases: TopicSelectionOfflineEvaluationCaseRecord[],
    resultByCaseId: Map<string, { observed_output: TopicSelectionOfflineEvaluationObservedOutput }>,
  ): MetricComputation {
    switch (metricKey) {
      case 'false_gap_rate':
        return this.computeCaseRateMetric(
          cases.filter((record) => !record.gold_expectation.expected_unmet_need),
          resultByCaseId,
          (_evaluationCase, observed) => this.observedSuggestsValidatedNeed(observed),
          'Non-unmet-need cases that replay advanced as validate/ready.',
        );
      case 'baseline_miss_rate':
        return this.computeCaseRateMetric(
          cases.filter((record) =>
            record.case_type === 'strong_baseline_solved' || record.gold_expectation.expected_baseline_solved === true),
          resultByCaseId,
          (evaluationCase, observed) =>
            !this.includesEveryString(observed.blocker_codes, evaluationCase.gold_expectation.expected_blocker_codes)
            || this.observedSuggestsValidatedNeed(observed),
          'Strong-baseline-solved cases missing expected baseline blockers.',
        );
      case 'counter_evidence_recall':
        return this.computeRefRecallMetric(
          cases,
          resultByCaseId,
          (evaluationCase) => evaluationCase.gold_expectation.expected_counter_evidence_refs,
          (observed) => observed.counter_evidence_refs,
          'Expected counter-evidence refs recovered by frozen replay.',
        );
      case 'trace_completeness':
        return this.computeCaseRateMetric(
          cases,
          resultByCaseId,
          (evaluationCase, observed) => this.traceComplete(evaluationCase.gold_expectation, observed),
          'Cases with required trace refs and expected trace verdict present.',
          { predicate_indicates_failure: false },
        );
      case 'readiness_false_pass_rate':
        return this.computeCaseRateMetric(
          cases.filter((record) => record.gold_expectation.expected_readiness_passed === false),
          resultByCaseId,
          (_evaluationCase, observed) => this.observedSuggestsValidatedNeed(observed),
          'Gold-blocked readiness cases that replay passed as ready/validate.',
        );
      case 'human_override_rate':
        return this.computeCaseRateMetric(
          cases,
          resultByCaseId,
          (_evaluationCase, observed) => observed.human_override_refs.length > 0,
          'Cases containing human override refs in observed frozen output.',
        );
      case 'rerun_instability':
        return this.computeCaseRateMetric(
          cases.filter((record) => resultByCaseId.get(record.offline_evaluation_case_id)?.observed_output.baseline_observed_output),
          resultByCaseId,
          (_evaluationCase, observed) => this.observedOutputChangedFromBaseline(observed),
          'Cases where repeated replay changed final decision, key evidence, blockers, or trace verdict.',
        );
      case 'recheck_precision':
        return this.computeRefPrecisionMetric(
          cases,
          resultByCaseId,
          (evaluationCase) => evaluationCase.gold_expectation.expected_recheck_action_refs,
          (observed) => observed.recheck_action_refs,
          'Observed recheck actions that match expected recheck actions.',
        );
      case 'negative_memory_usefulness':
        return this.computeNegativeMemoryUsefulness(cases, resultByCaseId);
      case 'downstream_rework_cause':
        return this.computeDownstreamReworkCause(cases, resultByCaseId);
    }
  }

  private computeCaseRateMetric(
    denominatorCases: TopicSelectionOfflineEvaluationCaseRecord[],
    resultByCaseId: Map<string, { observed_output: TopicSelectionOfflineEvaluationObservedOutput }>,
    predicate: (
      evaluationCase: TopicSelectionOfflineEvaluationCaseRecord,
      observed: TopicSelectionOfflineEvaluationObservedOutput,
    ) => boolean,
    note: string,
    options: { predicate_indicates_failure?: boolean } = {},
  ): MetricComputation {
    const contributing: TopicSelectionFunctionalRef[] = [];
    const failures: TopicSelectionFunctionalRef[] = [];
    let numerator = 0;
    for (const evaluationCase of denominatorCases) {
      const observed = resultByCaseId.get(evaluationCase.offline_evaluation_case_id)?.observed_output;
      if (!observed) continue;
      const caseRef = this.caseRef(evaluationCase);
      contributing.push(caseRef);
      const predicateMatched = predicate(evaluationCase, observed);
      if (predicateMatched) {
        numerator += 1;
      }
      const isFailure = options.predicate_indicates_failure === false ? !predicateMatched : predicateMatched;
      if (isFailure) {
        failures.push(caseRef);
      }
    }
    return {
      numerator,
      denominator: contributing.length,
      contributing_case_refs: contributing,
      failure_case_refs: failures,
      notes: [note],
      metric_payload: {},
    };
  }

  private computeRefRecallMetric(
    cases: TopicSelectionOfflineEvaluationCaseRecord[],
    resultByCaseId: Map<string, { observed_output: TopicSelectionOfflineEvaluationObservedOutput }>,
    expectedRefs: (evaluationCase: TopicSelectionOfflineEvaluationCaseRecord) => TopicSelectionFunctionalRef[],
    observedRefs: (observed: TopicSelectionOfflineEvaluationObservedOutput) => TopicSelectionFunctionalRef[],
    note: string,
  ): MetricComputation {
    let numerator = 0;
    let denominator = 0;
    const contributing: TopicSelectionFunctionalRef[] = [];
    const failures: TopicSelectionFunctionalRef[] = [];
    for (const evaluationCase of cases) {
      const expected = expectedRefs(evaluationCase);
      if (expected.length === 0) continue;
      const observed = resultByCaseId.get(evaluationCase.offline_evaluation_case_id)?.observed_output;
      if (!observed) continue;
      contributing.push(this.caseRef(evaluationCase));
      const expectedKeys = new Set(expected.map((record) => this.refKey(record)));
      const observedSet = new Set(observedRefs(observed).map((record) => this.refKey(record)));
      const found = [...expectedKeys].filter((record) => observedSet.has(record)).length;
      numerator += found;
      denominator += expectedKeys.size;
      if (found < expectedKeys.size) {
        failures.push(this.caseRef(evaluationCase));
      }
    }
    return {
      numerator,
      denominator,
      contributing_case_refs: contributing,
      failure_case_refs: failures,
      notes: [note],
      metric_payload: {},
    };
  }

  private computeRefPrecisionMetric(
    cases: TopicSelectionOfflineEvaluationCaseRecord[],
    resultByCaseId: Map<string, { observed_output: TopicSelectionOfflineEvaluationObservedOutput }>,
    expectedRefs: (evaluationCase: TopicSelectionOfflineEvaluationCaseRecord) => TopicSelectionFunctionalRef[],
    observedRefs: (observed: TopicSelectionOfflineEvaluationObservedOutput) => TopicSelectionFunctionalRef[],
    note: string,
  ): MetricComputation {
    let numerator = 0;
    let denominator = 0;
    const contributing: TopicSelectionFunctionalRef[] = [];
    const failures: TopicSelectionFunctionalRef[] = [];
    for (const evaluationCase of cases) {
      const observed = resultByCaseId.get(evaluationCase.offline_evaluation_case_id)?.observed_output;
      if (!observed) continue;
      const observedValues = new Map(observedRefs(observed).map((record) => [this.refKey(record), record]));
      if (observedValues.size === 0) continue;
      contributing.push(this.caseRef(evaluationCase));
      const expectedSet = new Set(expectedRefs(evaluationCase).map((record) => this.refKey(record)));
      const matched = [...observedValues.keys()].filter((record) => expectedSet.has(record)).length;
      numerator += matched;
      denominator += observedValues.size;
      if (matched < observedValues.size) {
        failures.push(this.caseRef(evaluationCase));
      }
    }
    return {
      numerator,
      denominator,
      contributing_case_refs: contributing,
      failure_case_refs: failures,
      notes: [note],
      metric_payload: {},
    };
  }

  private computeNegativeMemoryUsefulness(
    cases: TopicSelectionOfflineEvaluationCaseRecord[],
    resultByCaseId: Map<string, { observed_output: TopicSelectionOfflineEvaluationObservedOutput }>,
  ): MetricComputation {
    let numerator = 0;
    let denominator = 0;
    const contributing: TopicSelectionFunctionalRef[] = [];
    const failures: TopicSelectionFunctionalRef[] = [];
    for (const evaluationCase of cases) {
      const expected = evaluationCase.gold_expectation.expected_negative_memory_refs;
      if (expected.length === 0) continue;
      const observed = resultByCaseId.get(evaluationCase.offline_evaluation_case_id)?.observed_output;
      if (!observed) continue;
      contributing.push(this.caseRef(evaluationCase));
      const memorySet = new Set(observed.memory_refs.map((record) => this.refKey(record)));
      const memoryAsEvidenceSet = new Set(observed.memory_used_as_evidence_refs.map((record) => this.refKey(record)));
      const expectedKeys = new Set(expected.map((record) => this.refKey(record)));
      let caseFailed = false;
      for (const key of expectedKeys) {
        denominator += 1;
        if (memorySet.has(key) && !memoryAsEvidenceSet.has(key)) {
          numerator += 1;
        } else {
          caseFailed = true;
        }
      }
      if (caseFailed) {
        failures.push(this.caseRef(evaluationCase));
      }
    }
    return {
      numerator,
      denominator,
      contributing_case_refs: contributing,
      failure_case_refs: failures,
      notes: ['Negative decision memory must be used as constraint/routing context, never evidence.'],
      metric_payload: { evidence_policy: 'not_evidence' },
    };
  }

  private computeDownstreamReworkCause(
    cases: TopicSelectionOfflineEvaluationCaseRecord[],
    resultByCaseId: Map<string, { observed_output: TopicSelectionOfflineEvaluationObservedOutput }>,
  ): MetricComputation {
    let numerator = 0;
    let denominator = 0;
    const contributing: TopicSelectionFunctionalRef[] = [];
    const failures: TopicSelectionFunctionalRef[] = [];
    const causeDistribution: Record<string, number> = {};
    for (const evaluationCase of cases) {
      const expected = evaluationCase.gold_expectation.expected_downstream_rework_causes;
      const isDownstreamCase = evaluationCase.case_type === 'downstream_failure_feedback' || expected.length > 0;
      if (!isDownstreamCase) continue;
      const observed = resultByCaseId.get(evaluationCase.offline_evaluation_case_id)?.observed_output;
      if (!observed) continue;
      contributing.push(this.caseRef(evaluationCase));
      denominator += 1;
      for (const cause of observed.downstream_rework_causes) {
        causeDistribution[cause] = (causeDistribution[cause] ?? 0) + 1;
      }
      if (observed.downstream_rework_causes.some((cause) => expected.includes(cause))) {
        numerator += 1;
      } else {
        failures.push(this.caseRef(evaluationCase));
      }
    }
    return {
      numerator,
      denominator,
      contributing_case_refs: contributing,
      failure_case_refs: failures,
      notes: ['Downstream rework cause classification coverage for feedback cases.'],
      metric_payload: { cause_distribution: causeDistribution },
    };
  }

  private caseContributionPayload(
    evaluationCase: TopicSelectionOfflineEvaluationCaseRecord,
    observed: TopicSelectionOfflineEvaluationObservedOutput,
    replayDiff: TopicSelectionReplayDiffRecord,
  ): Record<string, unknown> {
    return {
      false_gap_candidate: !evaluationCase.gold_expectation.expected_unmet_need && this.observedSuggestsValidatedNeed(observed),
      baseline_missed: evaluationCase.gold_expectation.expected_baseline_solved === true
        && !this.includesEveryString(observed.blocker_codes, evaluationCase.gold_expectation.expected_blocker_codes),
      trace_complete: this.traceComplete(evaluationCase.gold_expectation, observed),
      memory_used_as_evidence: observed.memory_used_as_evidence_refs.length > 0,
      replay_diff_status: replayDiff.status,
      changed_dimensions: replayDiff.changed_dimensions,
    };
  }

  private failureExamples(
    evaluationCase: TopicSelectionOfflineEvaluationCaseRecord,
    observed: TopicSelectionOfflineEvaluationObservedOutput,
    replayDiff: TopicSelectionReplayDiffRecord,
  ): string[] {
    const examples = replayDiff.changed_dimensions.map((dimension) =>
      `${evaluationCase.case_key}:${dimension}`);
    if (observed.memory_used_as_evidence_refs.length > 0) {
      examples.push(`${evaluationCase.case_key}:memory_used_as_evidence`);
    }
    if (!evaluationCase.gold_expectation.expected_unmet_need && this.observedSuggestsValidatedNeed(observed)) {
      examples.push(`${evaluationCase.case_key}:false_gap_candidate`);
    }
    return examples;
  }

  private observedSuggestsValidatedNeed(observed: TopicSelectionOfflineEvaluationObservedOutput): boolean {
    return observed.final_decision === 'validate'
      || observed.readiness_passed === true
      || observed.readiness_recommendation === 'ready_for_validation';
  }

  private observedOutputChangedFromBaseline(observed: TopicSelectionOfflineEvaluationObservedOutput): boolean {
    const baseline = observed.baseline_observed_output;
    if (!baseline) return false;
    return (observed.final_decision ?? null) !== (baseline.final_decision ?? null)
      || !this.sameRefSet(observed.key_evidence_refs, baseline.key_evidence_refs)
      || !this.sameStringSet(observed.blocker_codes, baseline.blocker_codes)
      || (observed.trace_verdict ?? null) !== (baseline.trace_verdict ?? null);
  }

  private traceComplete(
    gold: TopicSelectionOfflineEvaluationGoldExpectation,
    observed: TopicSelectionOfflineEvaluationObservedOutput,
  ): boolean {
    const hasRequiredTraceRefs = this.includesEveryRef(observed.trace_refs, gold.required_trace_refs);
    const verdictMatches = gold.expected_trace_verdict === undefined
      || (observed.trace_verdict ?? null) === (gold.expected_trace_verdict ?? null);
    return hasRequiredTraceRefs && verdictMatches;
  }

  private caseTypeCoverage(cases: TopicSelectionOfflineEvaluationCaseRecord[]): TopicSelectionOfflineEvaluationCaseType[] {
    const present = new Set(cases.map((record) => record.case_type));
    return TOPIC_SELECTION_OFFLINE_EVALUATION_CASE_TYPES.filter((caseType) => present.has(caseType));
  }

  private includesEveryRef(values: TopicSelectionFunctionalRef[], required: TopicSelectionFunctionalRef[]): boolean {
    const valueSet = new Set(values.map((record) => this.refKey(record)));
    return required.every((record) => valueSet.has(this.refKey(record)));
  }

  private includesEveryString(values: string[], required: string[]): boolean {
    const valueSet = new Set(values);
    return required.every((record) => valueSet.has(record));
  }

  private sameRefSet(left: TopicSelectionFunctionalRef[], right: TopicSelectionFunctionalRef[]): boolean {
    return this.sameStringSet(left.map((record) => this.refKey(record)), right.map((record) => this.refKey(record)));
  }

  private sameStringSet(left: string[], right: string[]): boolean {
    const leftSet = new Set(left);
    const rightSet = new Set(right);
    if (leftSet.size !== rightSet.size) return false;
    return [...rightSet].every((record) => leftSet.has(record));
  }

  private uniqueRefs(refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] {
    const records = new Map<string, TopicSelectionFunctionalRef>();
    for (const ref of refs) {
      records.set(this.refKey(ref), ref);
    }
    return [...records.values()];
  }

  private uniqueMetricKeys(
    metricKeys: TopicSelectionOfflineEvaluationMetricKey[],
  ): TopicSelectionOfflineEvaluationMetricKey[] {
    return TOPIC_SELECTION_OFFLINE_EVALUATION_METRIC_KEYS.filter((metricKey) => metricKeys.includes(metricKey));
  }

  private caseRef(evaluationCase: TopicSelectionOfflineEvaluationCaseRecord): TopicSelectionFunctionalRef {
    return this.ref(
      'offline_evaluation_case',
      evaluationCase.offline_evaluation_case_id,
      evaluationCase.title_card_id ?? null,
    );
  }

  private ref(refType: string, refId: string, titleCardId?: string | null): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: refId,
      title_card_id: titleCardId ?? null,
    };
  }

  private refKey(ref: TopicSelectionFunctionalRef): string {
    return [
      ref.ref_type,
      ref.ref_id,
      ref.version_id ?? '',
      ref.title_card_id ?? '',
    ].join(':');
  }

  private syntheticCaseSpecs(frozenAt: string): SyntheticCaseSpec[] {
    const makeRef = (caseKey: string, refType: string, suffix: string): TopicSelectionFunctionalRef => ({
      ref_type: refType,
      ref_id: `${caseKey}_${suffix}`,
      title_card_id: `title_card_${caseKey}`,
    });
    const observed = (
      caseKey: string,
      overrides: Partial<TopicSelectionOfflineEvaluationObservedOutput>,
    ): TopicSelectionOfflineEvaluationObservedOutput => ({
      final_decision: null,
      readiness_recommendation: null,
      readiness_passed: null,
      key_evidence_refs: [],
      counter_evidence_refs: [],
      evidence_refs: [],
      blocker_codes: [],
      trace_refs: [makeRef(caseKey, 'trace_snapshot', 'trace')],
      trace_verdict: 'complete',
      human_override_refs: [],
      recheck_action_refs: [],
      memory_refs: [],
      memory_used_as_evidence_refs: [],
      downstream_rework_causes: [],
      payload: { frozen_at: frozenAt },
      ...overrides,
    });
    const gold = (
      caseKey: string,
      overrides: Partial<TopicSelectionOfflineEvaluationGoldExpectation>,
    ): TopicSelectionOfflineEvaluationGoldExpectation => ({
      expected_unmet_need: false,
      expected_final_decision: 'reject',
      expected_readiness_passed: false,
      expected_key_evidence_refs: [],
      expected_counter_evidence_refs: [],
      expected_blocker_codes: [],
      required_trace_refs: [makeRef(caseKey, 'trace_snapshot', 'trace')],
      expected_trace_verdict: 'complete',
      expected_recheck_action_refs: [],
      expected_negative_memory_refs: [],
      expected_downstream_rework_causes: [],
      expected_baseline_solved: false,
      notes: [],
      ...overrides,
    });

    return [
      {
        case_key: 'true_unmet_need',
        case_type: 'true_unmet_need',
        tags: ['synthetic', 'positive'],
        gold: gold('true_unmet_need', {
          expected_unmet_need: true,
          expected_final_decision: 'validate',
          expected_readiness_passed: true,
          expected_key_evidence_refs: [makeRef('true_unmet_need', 'evidence_unit', 'support')],
        }),
        observed: observed('true_unmet_need', {
          final_decision: 'validate',
          readiness_recommendation: 'ready_for_validation',
          readiness_passed: true,
          key_evidence_refs: [makeRef('true_unmet_need', 'evidence_unit', 'support')],
          evidence_refs: [makeRef('true_unmet_need', 'evidence_unit', 'support')],
        }),
      },
      {
        case_key: 'pseudo_gap',
        case_type: 'pseudo_gap',
        tags: ['synthetic', 'negative'],
        gold: gold('pseudo_gap', {
          expected_counter_evidence_refs: [makeRef('pseudo_gap', 'evidence_unit', 'counter')],
          expected_blocker_codes: ['PSEUDO_GAP'],
        }),
        observed: observed('pseudo_gap', {
          final_decision: 'validate',
          readiness_recommendation: 'ready_for_validation',
          readiness_passed: true,
          key_evidence_refs: [makeRef('pseudo_gap', 'evidence_unit', 'weak_support')],
          evidence_refs: [makeRef('pseudo_gap', 'evidence_unit', 'weak_support')],
        }),
      },
      {
        case_key: 'strong_baseline_solved',
        case_type: 'strong_baseline_solved',
        tags: ['synthetic', 'baseline'],
        gold: gold('strong_baseline_solved', {
          expected_counter_evidence_refs: [makeRef('strong_baseline_solved', 'evidence_unit', 'baseline')],
          expected_blocker_codes: ['ALREADY_SOLVED'],
          expected_baseline_solved: true,
        }),
        observed: observed('strong_baseline_solved', {
          final_decision: 'validate',
          readiness_recommendation: 'ready_for_validation',
          readiness_passed: true,
          key_evidence_refs: [makeRef('strong_baseline_solved', 'evidence_unit', 'weak_support')],
          evidence_refs: [makeRef('strong_baseline_solved', 'evidence_unit', 'weak_support')],
        }),
      },
      {
        case_key: 'author_future_work_misleading',
        case_type: 'author_future_work_misleading',
        tags: ['synthetic', 'future_work'],
        gold: gold('author_future_work_misleading', {
          expected_blocker_codes: ['AUTHOR_FUTURE_WORK_ONLY'],
        }),
        observed: observed('author_future_work_misleading', {
          final_decision: 'reject',
          readiness_passed: false,
          blocker_codes: ['AUTHOR_FUTURE_WORK_ONLY'],
        }),
      },
      {
        case_key: 'abstract_overclaim_body_unsupported',
        case_type: 'abstract_overclaim_body_unsupported',
        tags: ['synthetic', 'source_locator'],
        gold: gold('abstract_overclaim_body_unsupported', {
          expected_counter_evidence_refs: [
            makeRef('abstract_overclaim_body_unsupported', 'evidence_unit', 'body_challenge'),
          ],
          expected_blocker_codes: ['BODY_UNSUPPORTED'],
        }),
        observed: observed('abstract_overclaim_body_unsupported', {
          final_decision: 'reject',
          readiness_passed: false,
          blocker_codes: ['BODY_UNSUPPORTED'],
          trace_refs: [],
          trace_verdict: 'incomplete',
        }),
      },
      {
        case_key: 'terminology_shift_same_task',
        case_type: 'terminology_shift_same_task',
        tags: ['synthetic', 'terminology'],
        gold: gold('terminology_shift_same_task', {
          expected_blocker_codes: ['TERMINOLOGY_SHIFT_DUPLICATE'],
        }),
        observed: observed('terminology_shift_same_task', {
          final_decision: 'reject',
          readiness_passed: false,
          blocker_codes: ['TERMINOLOGY_SHIFT_DUPLICATE'],
        }),
      },
      {
        case_key: 'same_team_duplicate_claim',
        case_type: 'same_team_duplicate_claim',
        tags: ['synthetic', 'memory'],
        gold: gold('same_team_duplicate_claim', {
          expected_blocker_codes: ['SAME_TEAM_DUPLICATE'],
          expected_negative_memory_refs: [makeRef('same_team_duplicate_claim', 'decision_memory_entry', 'duplicate')],
        }),
        observed: observed('same_team_duplicate_claim', {
          final_decision: 'reject',
          readiness_passed: false,
          blocker_codes: ['SAME_TEAM_DUPLICATE'],
          human_override_refs: [makeRef('same_team_duplicate_claim', 'human_override', 'override')],
          memory_refs: [makeRef('same_team_duplicate_claim', 'decision_memory_entry', 'duplicate')],
          memory_used_as_evidence_refs: [makeRef('same_team_duplicate_claim', 'decision_memory_entry', 'duplicate')],
        }),
      },
      {
        case_key: 'source_health_or_missing_fulltext',
        case_type: 'source_health_or_missing_fulltext',
        tags: ['synthetic', 'recheck'],
        gold: gold('source_health_or_missing_fulltext', {
          expected_final_decision: 'request_searchplan_recheck',
          expected_blocker_codes: ['MISSING_FULLTEXT'],
          expected_recheck_action_refs: [makeRef('source_health_or_missing_fulltext', 'recheck_impact', 'fulltext')],
        }),
        observed: observed('source_health_or_missing_fulltext', {
          final_decision: 'request_searchplan_recheck',
          readiness_passed: false,
          blocker_codes: ['MISSING_FULLTEXT'],
          recheck_action_refs: [makeRef('source_health_or_missing_fulltext', 'recheck_impact', 'fulltext')],
        }),
      },
      {
        case_key: 'downstream_failure_feedback',
        case_type: 'downstream_failure_feedback',
        tags: ['synthetic', 'downstream'],
        gold: gold('downstream_failure_feedback', {
          expected_unmet_need: true,
          expected_final_decision: 'return_to_candidate',
          expected_negative_memory_refs: [makeRef('downstream_failure_feedback', 'decision_memory_entry', 'downstream')],
          expected_downstream_rework_causes: ['weak_counter_evidence_recall'],
        }),
        observed: observed('downstream_failure_feedback', {
          final_decision: 'return_to_candidate',
          readiness_passed: false,
          memory_refs: [makeRef('downstream_failure_feedback', 'decision_memory_entry', 'downstream')],
          downstream_rework_causes: ['weak_counter_evidence_recall'],
          baseline_observed_output: {
            final_decision: 'validate',
            readiness_recommendation: 'ready_for_validation',
            readiness_passed: true,
            key_evidence_refs: [makeRef('downstream_failure_feedback', 'evidence_unit', 'old_support')],
            counter_evidence_refs: [],
            evidence_refs: [makeRef('downstream_failure_feedback', 'evidence_unit', 'old_support')],
            blocker_codes: [],
            trace_refs: [makeRef('downstream_failure_feedback', 'trace_snapshot', 'trace')],
            trace_verdict: 'complete',
            human_override_refs: [],
            recheck_action_refs: [],
            memory_refs: [],
            memory_used_as_evidence_refs: [],
            downstream_rework_causes: [],
            payload: { frozen_at: frozenAt, prior_run: true },
          },
        }),
      },
    ];
  }
}
