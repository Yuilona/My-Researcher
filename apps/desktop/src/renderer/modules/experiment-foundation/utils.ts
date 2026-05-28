import {
  EXPERIMENT_FOUNDATION_RECORD_KINDS,
  type ExperimentFoundationRecordKind,
  type ExperimentFoundationRef,
  type ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import type { JsonObject } from './types';

export const experimentFoundationRecordKinds = [...EXPERIMENT_FOUNDATION_RECORD_KINDS];

export const promotionCandidateRecordKinds = [
  'dataset_asset_candidate',
  'benchmark_asset_candidate',
  'baseline_asset_candidate',
  'evaluation_protocol_candidate',
  'method_component_candidate',
  'base_model_candidate',
] satisfies ExperimentFoundationRecordKind[];

export function parseJsonObject(input: string): JsonObject {
  const parsed = JSON.parse(input) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON payload must be an object.');
  }
  return parsed as JsonObject;
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

export const defaultPromotionDecisionJson = prettyJson({
  promotion_request: {},
  promotion_result: {},
});
