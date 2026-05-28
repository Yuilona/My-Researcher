import type {
  ExperimentFoundationStoredRecord,
  ExperimentResult,
  MaterializeTrainingTaskSpecRequest,
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
