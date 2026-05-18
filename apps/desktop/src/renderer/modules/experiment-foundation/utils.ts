import {
  EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_STATUSES,
  EXPERIMENT_FOUNDATION_RECORD_KINDS,
  EXPERIMENT_FOUNDATION_TRAINING_ADAPTER_KINDS,
  type ExperimentFoundationRecordKind,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import type { JsonObject } from './types';

export const experimentFoundationRecordKinds = [...EXPERIMENT_FOUNDATION_RECORD_KINDS];
export const experimentFoundationTrainingAdapterKinds = [...EXPERIMENT_FOUNDATION_TRAINING_ADAPTER_KINDS];
export const experimentFoundationExternalJobStatuses = [...EXPERIMENT_FOUNDATION_EXTERNAL_TRAINING_JOB_STATUSES];

export const promotionCandidateRecordKinds = [
  'dataset_asset_candidate',
  'benchmark_asset_candidate',
  'baseline_asset_candidate',
  'evaluation_protocol_candidate',
  'method_component_candidate',
  'base_model_candidate',
] satisfies ExperimentFoundationRecordKind[];

export const recipeRecordKinds = [
  'version_lock',
  'recipe_draft',
  'execution_profile',
  'generate_run_recipe_request',
  'run_recipe',
  'training_platform_ref',
  'materialize_training_task_spec_request',
  'fine_tuning_task_profile',
  'training_task_spec',
  'adapter_metadata_ref',
  'training_task_materialization_result',
] satisfies ExperimentFoundationRecordKind[];

export const evidenceRecordKinds = [
  'experiment_result',
  'fine_tuning_result',
  'result_validation_report',
  'evaluation_fact',
  'metric_observation',
  'comparison_observation',
  'implementation_decision_signal',
  'paper_table_fact_set',
  'evidence_candidate',
  'paper_experiment_sidecar',
] satisfies ExperimentFoundationRecordKind[];

export function parseJsonObject(input: string): JsonObject {
  const parsed = JSON.parse(input) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON payload must be an object.');
  }
  return parsed as JsonObject;
}

export function parseJsonArray(input: string): unknown[] {
  const parsed = JSON.parse(input) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('JSON payload must be an array.');
  }
  return parsed;
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function shortText(value: unknown, maxLength = 42): string {
  if (value === null || value === undefined || value === '') {
    return '--';
  }
  const text = String(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1))}...`;
}

export function recordToRef(record: ExperimentFoundationStoredRecord): ExperimentFoundationRef {
  return {
    ref_type: record.record_kind,
    ref_id: record.record_id,
  };
}

export function formatRef(ref: ExperimentFoundationRef): string {
  return `${ref.ref_type}:${ref.ref_id}`;
}

export function formatRefList(refs: ExperimentFoundationRef[] | undefined, maxItems = 3): string {
  if (!refs || refs.length === 0) {
    return '--';
  }
  const visible = refs.slice(0, maxItems).map(formatRef);
  return refs.length > maxItems ? `${visible.join(', ')} +${refs.length - maxItems}` : visible.join(', ');
}

export function isExperimentFoundationRecordKind(value: string): value is ExperimentFoundationRecordKind {
  return (experimentFoundationRecordKinds as string[]).includes(value);
}

export const emptyObjectJson = prettyJson({});
export const defaultSourceRefsJson = prettyJson([{ ref_type: 'desktop_workbench', ref_id: 'T-078' }]);

export const defaultPromotionDecisionJson = prettyJson({
  promotion_request: {},
  promotion_result: {},
});

export const defaultSubmitJobJson = prettyJson({
  training_task_spec_ref: { ref_type: 'training_task_spec', ref_id: '' },
  training_task_spec_hash: '',
  materialization_result_ref: { ref_type: 'training_task_materialization_result', ref_id: '' },
  materialization_result_hash: '',
  idempotency_key: '',
  requested_by_ref: { ref_type: 'desktop_workbench', ref_id: 'T-078' },
  source_refs: [{ ref_type: 'desktop_workbench', ref_id: 'T-078' }],
});

export const defaultCancelJobJson = prettyJson({
  requested_by_ref: { ref_type: 'desktop_workbench', ref_id: 'T-078' },
  reason: '',
  idempotency_key: '',
  source_refs: [{ ref_type: 'desktop_workbench', ref_id: 'T-078' }],
});

export const defaultCollectJobJson = prettyJson({
  source_refs: [{ ref_type: 'desktop_workbench', ref_id: 'T-078' }],
  accept_partial: false,
});
