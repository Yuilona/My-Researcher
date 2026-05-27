const EXPERIMENT_FOUNDATION_COPY_FORBIDDEN_KEYS = new Set([
  'dataset_asset',
  'dataset_asset_dto',
  'dataset_version',
  'dataset_version_dto',
  'benchmark_asset',
  'benchmark_asset_dto',
  'baseline_asset',
  'baseline_asset_dto',
  'evaluation_protocol',
  'evaluation_protocol_dto',
  'run_recipe',
  'run_recipe_dto',
  'training_task_spec',
  'training_task_spec_dto',
  'materialization_result',
  'materialization_result_dto',
  'experiment_result',
  'experiment_result_dto',
  'fine_tuning_result',
  'fine_tuning_result_dto',
  'evidence_candidate',
  'evidence_candidate_dto',
  'paper_experiment_sidecar',
  'paper_experiment_sidecar_dto',
  'claim_text',
  'paper_claim',
  'acceptance_status',
  'final_conclusion',
  'publication_ready_text',
  'publication_claim',
  'leaderboard_rank',
  'leaderboard_row',
  'leaderboard_rows',
  'leaderboard',
  'ranking',
  'rankings',
  'winner',
  'best_result',
  'final_table',
  'rendered_table',
  'markdown_table',
  'latex_table',
]);

export function findExperimentFoundationPayloadCopyKey(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (seen.has(value)) {
    return null;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const blocked = findExperimentFoundationPayloadCopyKey(item, seen);
      if (blocked) {
        return blocked;
      }
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (EXPERIMENT_FOUNDATION_COPY_FORBIDDEN_KEYS.has(key)) {
      return key;
    }
    const blocked = findExperimentFoundationPayloadCopyKey(nested, seen);
    if (blocked) {
      return blocked;
    }
  }
  return null;
}
