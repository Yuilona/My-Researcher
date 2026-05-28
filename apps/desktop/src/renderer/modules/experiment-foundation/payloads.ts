import type {
  BaselineAsset,
  BenchmarkAsset,
  ComparisonObservation,
  EvaluationFact,
  EvaluationProtocol,
  ExperimentFoundationStoredRecord,
  ExperimentResult,
  MaterializeTrainingTaskSpecRequest,
  MetricObservation,
  RunRecipe,
  TrainingTaskSpec,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

/**
 * Typed payload accessors per record kind.
 *
 * Stored records carry their kind-specific payload as `unknown`. The backend
 * validates payloads against the shared AJV schemas on every write path, so
 * once a record has landed in the registry its payload satisfies the
 * corresponding shared interface. These accessors centralise that trust
 * boundary: every renderer-side typed view reads payloads through one of
 * these helpers instead of casting inline, so future schema renames break
 * exactly one site per kind.
 */

export function getRunRecipePayload(
  record: ExperimentFoundationStoredRecord | null,
): RunRecipe | null {
  if (!record || record.record_kind !== 'run_recipe') {
    return null;
  }
  return record.payload as unknown as RunRecipe;
}

export function getTrainingTaskSpecPayload(
  record: ExperimentFoundationStoredRecord | null,
): TrainingTaskSpec | null {
  if (!record || record.record_kind !== 'training_task_spec') {
    return null;
  }
  return record.payload as unknown as TrainingTaskSpec;
}

export function getMaterializeTrainingTaskSpecRequestPayload(
  record: ExperimentFoundationStoredRecord | null,
): MaterializeTrainingTaskSpecRequest | null {
  if (!record || record.record_kind !== 'materialize_training_task_spec_request') {
    return null;
  }
  return record.payload as unknown as MaterializeTrainingTaskSpecRequest;
}

export function getExperimentResultPayload(
  record: ExperimentFoundationStoredRecord | null,
): ExperimentResult | null {
  if (!record || record.record_kind !== 'experiment_result') {
    return null;
  }
  return record.payload as unknown as ExperimentResult;
}

export function getBenchmarkAssetPayload(
  record: ExperimentFoundationStoredRecord | null,
): BenchmarkAsset | null {
  if (!record || record.record_kind !== 'benchmark_asset') {
    return null;
  }
  return record.payload as unknown as BenchmarkAsset;
}

export function getBaselineAssetPayload(
  record: ExperimentFoundationStoredRecord | null,
): BaselineAsset | null {
  if (!record || record.record_kind !== 'baseline_asset') {
    return null;
  }
  return record.payload as unknown as BaselineAsset;
}

export function getEvaluationProtocolPayload(
  record: ExperimentFoundationStoredRecord | null,
): EvaluationProtocol | null {
  if (!record || record.record_kind !== 'evaluation_protocol') {
    return null;
  }
  return record.payload as unknown as EvaluationProtocol;
}

export function getEvaluationFactPayload(
  record: ExperimentFoundationStoredRecord | null,
): EvaluationFact | null {
  if (!record || record.record_kind !== 'evaluation_fact') {
    return null;
  }
  return record.payload as unknown as EvaluationFact;
}

export function getMetricObservationPayload(
  record: ExperimentFoundationStoredRecord | null,
): MetricObservation | null {
  if (!record || record.record_kind !== 'metric_observation') {
    return null;
  }
  return record.payload as unknown as MetricObservation;
}

export function getComparisonObservationPayload(
  record: ExperimentFoundationStoredRecord | null,
): ComparisonObservation | null {
  if (!record || record.record_kind !== 'comparison_observation') {
    return null;
  }
  return record.payload as unknown as ComparisonObservation;
}
