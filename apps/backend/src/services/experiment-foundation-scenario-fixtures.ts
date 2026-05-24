import process from 'node:process';
import type {
  DataPolicy,
  DatasetAsset,
  DatasetAssetCandidate,
  DatasetLocation,
  DatasetMirror,
  DatasetVersion,
  EvaluationProtocol,
  ExperimentAssetCandidateCompletenessCheck,
  ExperimentAssetCandidateDuplicateCheck,
  ExperimentAssetCandidatePolicyCheck,
  ExperimentAssetCandidateRiskAssessment,
  ExperimentAssetCandidateSourceTrace,
  ExperimentAssetPromotionRequest,
  ExperimentAssetPromotionResult,
  ExperimentFoundationAdapterMetadataRef,
  ExperimentFoundationRecordKind,
  ExperimentFoundationRef,
  ExperimentFoundationTrainingAdapterKind,
  MetricDefinition,
  RunRecipe,
  SubmitExternalTrainingJobRequest,
  TrainingTaskMaterializationResult,
  TrainingTaskSpec,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';

export const EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP = '2026-05-23T00:00:00.000Z';

export type ExperimentFoundationScenarioRecord = {
  record_kind: ExperimentFoundationRecordKind;
  payload: Record<string, unknown>;
};

export type ExperimentFoundationMinimalGraph = {
  records: ExperimentFoundationScenarioRecord[];
  datasetAsset: DatasetAsset;
  datasetVersion: DatasetVersion;
  datasetLocation: DatasetLocation;
  datasetMirror: DatasetMirror;
  dataPolicy: DataPolicy;
  evaluationProtocol: EvaluationProtocol;
  metricDefinition: MetricDefinition;
  runRecipe: RunRecipe;
  trainingTaskSpec: TrainingTaskSpec;
  materializationResult: TrainingTaskMaterializationResult;
  submitRequest: SubmitExternalTrainingJobRequest;
};

export type ExperimentFoundationMinimalGraphOptions = {
  outputRoot: string;
  scenarioId?: string;
  adapterKind?: ExperimentFoundationTrainingAdapterKind;
  materializationStatus?: TrainingTaskMaterializationResult['status'];
  dataPolicyOverrides?: Partial<DataPolicy>;
  datasetMirrorOverrides?: Partial<DatasetMirror>;
  taskSpecOverrides?: Partial<TrainingTaskSpec>;
};

export type ExperimentFoundationScenarioIds = {
  suffix: string;
  datasetAssetId: string;
  datasetVersionId: string;
  datasetLocationId: string;
  datasetMirrorId: string;
  dataPolicyId: string;
  checksumManifestId: string;
  splitProtocolId: string;
  metricDefinitionId: string;
  evaluationProtocolId: string;
  benchmarkAssetId: string;
  baselineAssetId: string;
  baselineImplementationVersionId: string;
  methodComponentId: string;
  readinessReportId: string;
  versionLockId: string;
  runRecipeId: string;
  recipeDraftId: string;
  materializationRequestId: string;
  trainingTaskSpecId: string;
  materializationResultId: string;
  adapterMetadataRefId: string;
  datasetAssetCandidateId: string;
  candidateSourceTraceId: string;
  duplicateCheckId: string;
  completenessCheckId: string;
  policyCheckId: string;
  riskAssessmentId: string;
  ruleTraceId: string;
  promotionRequestId: string;
  promotionResultId: string;
  storageRootRefId: string;
  checksumManifestHash: string;
  splitProtocolHash: string;
  dataPolicyHash: string;
  evaluationProtocolHash: string;
  runtimeHash: string;
  baselineImplementationHash: string;
  methodComponentHash: string;
  readinessReportHash: string;
  versionLockHash: string;
  runRecipeHash: string;
  configSnapshotHash: string;
  trainingTaskSpecHash: string;
  materializationHash: string;
  adapterMetadataHash: string;
  datasetAssetCandidateHash: string;
  triageReportHash: string;
  promotionRequestHash: string;
  promotionResultHash: string;
  submitIdempotencyKey: string;
  materializationIdempotencyKey: string;
};

export function experimentFoundationRef(refType: string, refId: string): ExperimentFoundationRef {
  return { ref_type: refType, ref_id: refId };
}

export function experimentFoundationScenarioIds(scenarioId = '001'): ExperimentFoundationScenarioIds {
  const suffix = normalizeScenarioId(scenarioId);
  return {
    suffix,
    datasetAssetId: `dataset_asset_${suffix}`,
    datasetVersionId: `dataset_version_${suffix}`,
    datasetLocationId: `dataset_location_${suffix}`,
    datasetMirrorId: `dataset_mirror_${suffix}`,
    dataPolicyId: `data_policy_${suffix}`,
    checksumManifestId: `checksum_manifest_${suffix}`,
    splitProtocolId: `split_protocol_${suffix}`,
    metricDefinitionId: `metric_definition_${suffix}_adapter_success`,
    evaluationProtocolId: `evaluation_protocol_${suffix}`,
    benchmarkAssetId: `benchmark_asset_${suffix}`,
    baselineAssetId: `baseline_asset_${suffix}`,
    baselineImplementationVersionId: `baseline_impl_${suffix}`,
    methodComponentId: `method_component_${suffix}`,
    readinessReportId: `readiness_report_${suffix}`,
    versionLockId: `version_lock_${suffix}`,
    runRecipeId: `run_recipe_${suffix}`,
    recipeDraftId: `recipe_draft_${suffix}`,
    materializationRequestId: `materialization_request_${suffix}`,
    trainingTaskSpecId: `training_task_spec_${suffix}`,
    materializationResultId: `materialization_result_${suffix}`,
    adapterMetadataRefId: `adapter_metadata_ref_${suffix}_materialization`,
    datasetAssetCandidateId: `dataset_asset_candidate_${suffix}`,
    candidateSourceTraceId: `candidate_source_trace_${suffix}`,
    duplicateCheckId: `duplicate_check_${suffix}`,
    completenessCheckId: `completeness_check_${suffix}`,
    policyCheckId: `policy_check_${suffix}`,
    riskAssessmentId: `risk_assessment_${suffix}`,
    ruleTraceId: `candidate_rule_trace_${suffix}`,
    promotionRequestId: `promotion_request_${suffix}`,
    promotionResultId: `promotion_result_${suffix}`,
    storageRootRefId: `storage_root_${suffix}`,
    checksumManifestHash: `sha256:${suffix}-checksum-manifest`,
    splitProtocolHash: `sha256:${suffix}-split-protocol`,
    dataPolicyHash: `sha256:${suffix}-data-policy`,
    evaluationProtocolHash: `sha256:${suffix}-evaluation-protocol`,
    runtimeHash: `sha256:${suffix}-runtime`,
    baselineImplementationHash: `sha256:${suffix}-baseline-implementation`,
    methodComponentHash: `sha256:${suffix}-method-component`,
    readinessReportHash: `sha256:${suffix}-readiness-report`,
    versionLockHash: `sha256:${suffix}-version-lock`,
    runRecipeHash: `sha256:${suffix}-run-recipe`,
    configSnapshotHash: `sha256:${suffix}-config-snapshot`,
    trainingTaskSpecHash: `sha256:${suffix}-training-task-spec`,
    materializationHash: `sha256:${suffix}-materialization`,
    adapterMetadataHash: `sha256:${suffix}-adapter-metadata`,
    datasetAssetCandidateHash: `sha256:${suffix}-asset-candidate`,
    triageReportHash: `sha256:${suffix}-candidate-triage-report`,
    promotionRequestHash: `sha256:${suffix}-auto-promote-request`,
    promotionResultHash: `sha256:${suffix}-promotion-result`,
    submitIdempotencyKey: `submit-${suffix}-key`,
    materializationIdempotencyKey: `materialization-${suffix}-key`,
  };
}

export function createExperimentFoundationMinimalGraph(
  options: ExperimentFoundationMinimalGraphOptions,
): ExperimentFoundationMinimalGraph {
  const adapterKind = options.adapterKind ?? 'local_script';
  const ids = experimentFoundationScenarioIds(options.scenarioId);
  const dataPolicy = dataPolicyFixture(options.dataPolicyOverrides ?? {}, ids);
  const datasetAsset = datasetAssetFixture({}, ids);
  const datasetVersion = datasetVersionFixture({}, ids);
  const datasetLocation = datasetLocationFixture({}, ids);
  const datasetMirror = datasetMirrorFixture({
    provider: adapterKind === 'aliyun_pai_dlc' ? 'aliyun_oss' : 'local_execution_cache',
    mirror_ref: experimentFoundationRef(
      adapterKind === 'aliyun_pai_dlc' ? 'aliyun_oss_object' : 'local_execution_cache',
      ids.datasetMirrorId,
    ),
    ...(options.datasetMirrorOverrides ?? {}),
  }, ids);
  const metricDefinition = metricDefinitionFixture({}, ids);
  const evaluationProtocol = evaluationProtocolFixture({}, ids);
  const runRecipe = runRecipeFixture({}, ids);
  const trainingTaskSpec = trainingTaskSpecFixture({
    outputRoot: options.outputRoot,
    adapterKind,
    ids,
    overrides: options.taskSpecOverrides,
  });
  const materializationResult = materializationResultFixture({
    status: options.materializationStatus ?? 'materialized',
    adapterKind,
    ids,
  });
  const submitRequest = submitExternalTrainingJobRequestFixture({}, ids);

  return {
    records: [
      record('dataset_asset', datasetAsset),
      record('data_policy', dataPolicy),
      record('dataset_location', datasetLocation),
      record('dataset_mirror', datasetMirror),
      record('dataset_version', datasetVersion),
      record('metric_definition', metricDefinition),
      record('evaluation_protocol', evaluationProtocol),
      record('run_recipe', runRecipe),
      record('training_task_spec', trainingTaskSpec),
      record('training_task_materialization_result', materializationResult),
    ],
    datasetAsset,
    datasetVersion,
    datasetLocation,
    datasetMirror,
    dataPolicy,
    evaluationProtocol,
    metricDefinition,
    runRecipe,
    trainingTaskSpec,
    materializationResult,
    submitRequest,
  };
}

export function datasetAssetFixture(
  overrides: Partial<DatasetAsset> = {},
  ids = experimentFoundationScenarioIds(),
): DatasetAsset {
  return {
    dataset_asset_id: ids.datasetAssetId,
    name: 'Capability Harness Dataset',
    aliases: ['capability_harness_dataset'],
    description: 'Synthetic dataset identity used by experiment foundation capability tests.',
    source_refs: [experimentFoundationRef('test_fixture', 'capability_dataset')],
    task_types: ['text_classification'],
    schema_summary: { columns: ['text', 'label'], row_count: 2 },
    default_version_id: ids.datasetVersionId,
    catalog_status: 'active',
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    updated_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function datasetVersionFixture(
  overrides: Partial<DatasetVersion> = {},
  ids = experimentFoundationScenarioIds(),
): DatasetVersion {
  return {
    dataset_version_id: ids.datasetVersionId,
    dataset_asset_id: ids.datasetAssetId,
    version_label: 'v1',
    checksum_manifest_id: ids.checksumManifestId,
    checksum_manifest_hash: ids.checksumManifestHash,
    split_protocol_id: ids.splitProtocolId,
    split_protocol_hash: ids.splitProtocolHash,
    data_policy_id: ids.dataPolicyId,
    data_policy_hash: ids.dataPolicyHash,
    processing_recipe_ref: null,
    location_ids: [ids.datasetLocationId],
    access_status: 'available',
    readiness_status: 'ready',
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    updated_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function datasetLocationFixture(
  overrides: Partial<DatasetLocation> = {},
  ids = experimentFoundationScenarioIds(),
): DatasetLocation {
  return {
    dataset_location_id: ids.datasetLocationId,
    dataset_version_id: ids.datasetVersionId,
    location_kind: 'local_directory',
    storage_root_ref: {
      storage_root_ref_id: ids.storageRootRefId,
      root_key: 'capability-fixtures',
      root_label: 'Capability fixtures',
      root_kind: 'local',
      policy_ref: experimentFoundationRef('data_policy', ids.dataPolicyId),
    },
    local_file_ref: {
      storage_root_ref_id: ids.storageRootRefId,
      relative_path: `datasets/${ids.suffix}/capability-harness`,
      file_kind: 'directory',
      expected_checksum_hash: ids.checksumManifestHash,
      byte_size: 0,
    },
    remote_ref: null,
    availability_status: 'available',
    last_checked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function datasetMirrorFixture(
  overrides: Partial<DatasetMirror> = {},
  ids = experimentFoundationScenarioIds(),
): DatasetMirror {
  return {
    dataset_mirror_id: ids.datasetMirrorId,
    dataset_version_id: ids.datasetVersionId,
    mirror_role: 'execution_mirror',
    provider: 'local_execution_cache',
    mirror_ref: experimentFoundationRef('local_execution_cache', ids.datasetMirrorId),
    mirror_status: 'ready',
    source_checksum_manifest_hash: ids.checksumManifestHash,
    freshness_status: 'fresh',
    approval_ref: null,
    run_scope_ref: null,
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    updated_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function dataPolicyFixture(
  overrides: Partial<DataPolicy> = {},
  ids = experimentFoundationScenarioIds(),
): DataPolicy {
  return {
    data_policy_id: ids.dataPolicyId,
    license: 'CC BY 4.0',
    access_level: 'open',
    privacy_level: 'public',
    allowed_use_cases: ['benchmarking', 'local_execution_smoke'],
    mirror_policy: 'allowed',
    approval_refs: [],
    policy_hash: ids.dataPolicyHash,
    retention_notes: null,
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function metricDefinitionFixture(
  overrides: Partial<MetricDefinition> = {},
  ids = experimentFoundationScenarioIds(),
): MetricDefinition {
  return {
    metric_definition_id: ids.metricDefinitionId,
    metric_key: 'adapter_success',
    name: 'Adapter success',
    description: 'Binary success metric emitted by the capability harness adapter path.',
    direction: 'higher_is_better',
    unit: 'binary',
    value_type: 'number',
    evaluator_ref: experimentFoundationRef('evaluator', 'adapter_smoke'),
    parser_ref: null,
    validity_constraints: ['value must be 0 or 1'],
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    updated_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function evaluationProtocolFixture(
  overrides: Partial<EvaluationProtocol> = {},
  ids = experimentFoundationScenarioIds(),
): EvaluationProtocol {
  return {
    evaluation_protocol_id: ids.evaluationProtocolId,
    benchmark_asset_id: ids.benchmarkAssetId,
    protocol_version: 'v1',
    protocol_hash: ids.evaluationProtocolHash,
    metric_definition_refs: [experimentFoundationRef('metric_definition', ids.metricDefinitionId)],
    evaluator_refs: [experimentFoundationRef('evaluator', 'adapter_smoke')],
    aggregation: { primary_metric: 'adapter_success' },
    seed_policy: { seed: 42 },
    repeat_policy: { repeats: 1 },
    reporting_protocol: { report_splits: ['execution'] },
    comparison_policy: { compare_to: 'baseline' },
    statistical_protocol: { test: 'none' },
    budget_fairness_policy: { same_budget: true },
    tuning_fairness_policy: { same_search_space: true },
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    updated_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function runRecipeFixture(
  overrides: Partial<RunRecipe> = {},
  ids = experimentFoundationScenarioIds(),
): RunRecipe {
  const readinessSnapshot = {
    readiness_report_id: ids.readinessReportId,
    readiness_report_hash: ids.readinessReportHash,
    status: 'passed' as const,
    checked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    source_refs: [experimentFoundationRef('test_fixture', 'readiness')],
    blockers: [],
  };
  const versionLock = {
    version_lock_id: ids.versionLockId,
    dataset_version_lock: {
      dataset_asset_id: ids.datasetAssetId,
      dataset_version_id: ids.datasetVersionId,
      checksum_manifest_hash: ids.checksumManifestHash,
      split_protocol_hash: ids.splitProtocolHash,
      data_policy_id: ids.dataPolicyId,
      data_policy_hash: ids.dataPolicyHash,
      locked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
      source_refs: [experimentFoundationRef('dataset_version', ids.datasetVersionId)],
    },
    evaluation_protocol_lock: {
      evaluation_protocol_id: ids.evaluationProtocolId,
      benchmark_asset_id: ids.benchmarkAssetId,
      protocol_version: 'v1',
      protocol_hash: ids.evaluationProtocolHash,
      metric_definition_refs: [experimentFoundationRef('metric_definition', ids.metricDefinitionId)],
      locked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
      source_refs: [experimentFoundationRef('evaluation_protocol', ids.evaluationProtocolId)],
    },
    baseline_implementation_locks: [{
      baseline_asset_id: ids.baselineAssetId,
      baseline_implementation_version_id: ids.baselineImplementationVersionId,
      version_label: 'v1',
      implementation_hash: ids.baselineImplementationHash,
      code_ref: experimentFoundationRef('code', 'baseline_repo'),
      commit_hash: 'abc123',
      runtime_ref: experimentFoundationRef('runtime', 'node'),
      runtime_hash: ids.runtimeHash,
      entrypoint: 'baseline.js',
      locked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
      source_refs: [],
    }],
    method_component_locks: [{
      method_recipe_component_id: ids.methodComponentId,
      component_kind: 'training_strategy' as const,
      version_label: 'v1',
      component_hash: ids.methodComponentHash,
      locked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
      source_refs: [],
    }],
    external_lock_refs: [],
    readiness_snapshot: readinessSnapshot,
    version_lock_hash: ids.versionLockHash,
    locked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    source_refs: [experimentFoundationRef('test_fixture', 'version_lock')],
  };

  return {
    run_recipe_id: ids.runRecipeId,
    recipe_draft_id: ids.recipeDraftId,
    version_lock: versionLock,
    version_lock_hash: ids.versionLockHash,
    resolved_params: { epochs: 1 },
    execution_profile: {
      profile_kind: 'standard_training',
      capability_requirements: ['local_execution'],
      resource_classes: ['cpu'],
      supports_distributed: false,
      long_running: false,
    },
    config_snapshot: { epochs: 1, batch_size: 1 },
    config_snapshot_hash: ids.configSnapshotHash,
    readiness_snapshot: readinessSnapshot,
    run_recipe_hash: ids.runRecipeHash,
    locked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    source_refs: [experimentFoundationRef('recipe_draft', ids.recipeDraftId)],
    traceability_refs: [experimentFoundationRef('version_lock', ids.versionLockId)],
    ...overrides,
  };
}

export function trainingTaskSpecFixture(input: {
  outputRoot: string;
  ids?: ExperimentFoundationScenarioIds;
  adapterKind?: ExperimentFoundationTrainingAdapterKind;
  overrides?: Partial<TrainingTaskSpec>;
}): TrainingTaskSpec {
  const adapterKind = input.adapterKind ?? 'local_script';
  const ids = input.ids ?? experimentFoundationScenarioIds();
  const selectedPlatform: TrainingTaskSpec['selected_platform'] = {
    platform_id: adapterKind === 'local_script' ? `local_script_${ids.suffix}` : `aliyun_pai_dlc_${ids.suffix}`,
    platform_kind: adapterKind,
    adapter_kind: adapterKind,
    adapter_version: adapterKind === 'local_script' ? 'capability-local-v1' : 'capability-aliyun-v1',
    capability_refs: [experimentFoundationRef('capability', adapterKind)],
  };

  return {
    training_task_spec_id: ids.trainingTaskSpecId,
    materialization_request_id: ids.materializationRequestId,
    run_recipe_id: ids.runRecipeId,
    run_recipe_hash: ids.runRecipeHash,
    version_lock_hash: ids.versionLockHash,
    profile_kind: 'standard_training',
    selected_platform: selectedPlatform,
    runtime_ref: experimentFoundationRef('runtime', 'node'),
    runtime_hash: ids.runtimeHash,
    command: process.execPath,
    args: ['-e', 'console.log("experiment-foundation-capability-ok")'],
    env_refs: [],
    input_refs: adapterKind === 'aliyun_pai_dlc'
      ? [experimentFoundationRef('dataset_mirror', ids.datasetMirrorId)]
      : [],
    output_contract: { working_directory: input.outputRoot },
    resource_request: { cpu: 1, memory_mb: 128 },
    timeout_seconds: 10,
    retry_policy: { max_retries: 0 },
    auth_ref_names: [],
    config_snapshot_hash: ids.configSnapshotHash,
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    source_refs: [experimentFoundationRef('materialize_training_task_spec_request', ids.materializationRequestId)],
    traceability_refs: [experimentFoundationRef('run_recipe', ids.runRecipeId)],
    ...input.overrides,
  };
}

export function materializationResultFixture(input: {
  status?: TrainingTaskMaterializationResult['status'];
  adapterKind?: ExperimentFoundationTrainingAdapterKind;
  ids?: ExperimentFoundationScenarioIds;
} = {}): TrainingTaskMaterializationResult {
  const adapterKind = input.adapterKind ?? 'local_script';
  const ids = input.ids ?? experimentFoundationScenarioIds();
  const adapterMetadata = adapterMetadataRefFixture(adapterKind, ids);
  return {
    materialization_result_id: ids.materializationResultId,
    materialization_request_id: ids.materializationRequestId,
    status: input.status ?? 'materialized',
    training_task_spec_ref: experimentFoundationRef('training_task_spec', ids.trainingTaskSpecId),
    training_task_spec_hash: ids.trainingTaskSpecHash,
    adapter_metadata_ref: adapterMetadata,
    adapter_metadata_hash: adapterMetadata.metadata_hash,
    materialization_hash: ids.materializationHash,
    idempotency_key: ids.materializationIdempotencyKey,
    blockers: [],
    warnings: [],
    traceability_refs: [experimentFoundationRef('training_task_spec', ids.trainingTaskSpecId)],
    event_refs: [],
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
  };
}

export function submitExternalTrainingJobRequestFixture(
  overrides: Partial<SubmitExternalTrainingJobRequest> = {},
  ids = experimentFoundationScenarioIds(),
): SubmitExternalTrainingJobRequest {
  return {
    training_task_spec_ref: experimentFoundationRef('training_task_spec', ids.trainingTaskSpecId),
    training_task_spec_hash: ids.trainingTaskSpecHash,
    materialization_result_ref: experimentFoundationRef(
      'training_task_materialization_result',
      ids.materializationResultId,
    ),
    materialization_result_hash: ids.materializationHash,
    idempotency_key: ids.submitIdempotencyKey,
    requested_by_ref: experimentFoundationRef('user', 'capability_tester'),
    source_refs: [experimentFoundationRef('test_case', 'capability_vertical_slice')],
    ...overrides,
  };
}

export function adapterMetadataRefFixture(
  adapterKind: ExperimentFoundationTrainingAdapterKind = 'local_script',
  ids = experimentFoundationScenarioIds(),
): ExperimentFoundationAdapterMetadataRef {
  return {
    adapter_metadata_ref_id: ids.adapterMetadataRefId,
    adapter_kind: adapterKind,
    adapter_version: adapterKind === 'local_script' ? 'capability-local-v1' : 'capability-aliyun-v1',
    metadata_storage_ref: experimentFoundationRef('local_metadata_artifact', `${ids.suffix}_materialization_metadata`),
    metadata_hash: ids.adapterMetadataHash,
    schema_version: 'experiment-foundation-adapter-metadata-v1',
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    source_refs: [experimentFoundationRef('test_fixture', 'materialization')],
  };
}

export function candidateSourceTraceFixture(
  overrides: Partial<ExperimentAssetCandidateSourceTrace> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetCandidateSourceTrace {
  return {
    source_trace_id: ids.candidateSourceTraceId,
    source_kind: 'literature_key_content',
    source_ref: experimentFoundationRef('literature_key_content', `${ids.suffix}_key_content`),
    extraction_ref: experimentFoundationRef('candidate_extraction', `${ids.suffix}_extraction`),
    evidence_locator_snapshot: { quote: 'Capability Harness Dataset' },
    confidence_score: 0.92,
    extracted_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function duplicateCheckFixture(
  overrides: Partial<ExperimentAssetCandidateDuplicateCheck> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetCandidateDuplicateCheck {
  return {
    duplicate_check_id: ids.duplicateCheckId,
    duplicate_status: 'no_duplicate',
    checked_refs: [experimentFoundationRef('dataset_asset', ids.datasetAssetId)],
    possible_duplicate_refs: [],
    rationale: 'Checked normalized name and source refs.',
    checked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function completenessCheckFixture(
  overrides: Partial<ExperimentAssetCandidateCompletenessCheck> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetCandidateCompletenessCheck {
  return {
    completeness_check_id: ids.completenessCheckId,
    completeness_status: 'complete',
    required_fields: ['canonical_name', 'source_refs', 'policy_check'],
    missing_fields: [],
    checked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function policyCheckFixture(
  overrides: Partial<ExperimentAssetCandidatePolicyCheck> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetCandidatePolicyCheck {
  return {
    policy_check_id: ids.policyCheckId,
    policy_status: 'clear',
    license: 'CC BY 4.0',
    policy_ref: experimentFoundationRef('data_policy', ids.dataPolicyId),
    policy_hash: ids.dataPolicyHash,
    restricted_reasons: [],
    checked_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function riskAssessmentFixture(
  overrides: Partial<ExperimentAssetCandidateRiskAssessment> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetCandidateRiskAssessment {
  return {
    risk_assessment_id: ids.riskAssessmentId,
    risk_level: 'low',
    risk_reasons: [],
    privacy_sensitive: false,
    model_weight_sensitive: false,
    requires_manual_review: false,
    assessed_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function datasetAssetCandidateFixture(
  overrides: Partial<DatasetAssetCandidate> = {},
  ids = experimentFoundationScenarioIds(),
): DatasetAssetCandidate {
  return {
    dataset_asset_candidate_id: ids.datasetAssetCandidateId,
    candidate_family: 'dataset',
    candidate_status: 'ready_for_promotion',
    canonical_name: 'Capability Harness Dataset',
    aliases: ['capability_harness_dataset'],
    description: 'Extracted dataset candidate used by capability tests.',
    dataset_usage: 'benchmark_dataset',
    source_refs: [experimentFoundationRef('literature_key_content', `${ids.suffix}_key_content`)],
    source_traces: [candidateSourceTraceFixture({}, ids)],
    extraction_provenance_refs: [experimentFoundationRef('candidate_extraction', `${ids.suffix}_extraction`)],
    confidence_score: 0.92,
    duplicate_check: duplicateCheckFixture({}, ids),
    completeness_check: completenessCheckFixture({}, ids),
    policy_check: policyCheckFixture({}, ids),
    risk_assessment: riskAssessmentFixture({}, ids),
    deterministic_rule_trace_refs: [experimentFoundationRef('candidate_rule_trace', ids.ruleTraceId)],
    existing_canonical_refs: [],
    task_types: ['text_classification'],
    schema_summary: { columns: ['text', 'label'], row_count: 2 },
    version_label: 'candidate-v1',
    proposed_version_refs: [experimentFoundationRef('dataset_version', ids.datasetVersionId)],
    proposed_policy_refs: [experimentFoundationRef('data_policy', ids.dataPolicyId)],
    proposed_location_refs: [experimentFoundationRef('dataset_location', ids.datasetLocationId)],
    candidate_hash: ids.datasetAssetCandidateHash,
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    updated_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

export function promotionRequestFixture(
  overrides: Partial<ExperimentAssetPromotionRequest> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetPromotionRequest {
  return {
    promotion_request_id: ids.promotionRequestId,
    candidate_ref: experimentFoundationRef('dataset_asset_candidate', ids.datasetAssetCandidateId),
    candidate_hash: ids.datasetAssetCandidateHash,
    candidate_family: 'dataset',
    decision_kind: 'auto_promote',
    candidate_status: 'ready_for_promotion',
    confidence_score: 0.92,
    duplicate_status: 'no_duplicate',
    completeness_status: 'complete',
    policy_status: 'clear',
    risk_level: 'low',
    source_refs: [experimentFoundationRef('literature_key_content', `${ids.suffix}_key_content`)],
    provenance_refs: [experimentFoundationRef('candidate_extraction', `${ids.suffix}_extraction`)],
    deterministic_rule_trace_refs: [experimentFoundationRef('candidate_rule_trace', ids.ruleTraceId)],
    required_version_refs: [experimentFoundationRef('dataset_version', ids.datasetVersionId)],
    required_policy_refs: [experimentFoundationRef('data_policy', ids.dataPolicyId)],
    required_protocol_refs: [experimentFoundationRef('evaluation_protocol', ids.evaluationProtocolId)],
    triage_report_ref: experimentFoundationRef('asset_candidate_triage_report', `asset_candidate_triage_report_${ids.suffix}`),
    triage_report_hash: ids.triageReportHash,
    reviewer_ref: null,
    requested_by_ref: experimentFoundationRef('user', 'capability_tester'),
    requested_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    request_hash: ids.promotionRequestHash,
    ...overrides,
  };
}

export function promotionResultFixture(
  overrides: Partial<ExperimentAssetPromotionResult> = {},
  ids = experimentFoundationScenarioIds(),
): ExperimentAssetPromotionResult {
  return {
    promotion_result_id: ids.promotionResultId,
    promotion_request_id: ids.promotionRequestId,
    candidate_ref: experimentFoundationRef('dataset_asset_candidate', ids.datasetAssetCandidateId),
    candidate_hash: ids.datasetAssetCandidateHash,
    candidate_family: 'dataset',
    result_status: 'promoted',
    canonical_asset_refs: [experimentFoundationRef('dataset_asset', ids.datasetAssetId)],
    canonical_version_refs: [experimentFoundationRef('dataset_version', ids.datasetVersionId)],
    canonical_protocol_refs: [experimentFoundationRef('evaluation_protocol', ids.evaluationProtocolId)],
    canonical_policy_refs: [experimentFoundationRef('data_policy', ids.dataPolicyId)],
    blockers: [],
    warnings: [],
    source_refs: [experimentFoundationRef('literature_key_content', `${ids.suffix}_key_content`)],
    provenance_refs: [experimentFoundationRef('candidate_extraction', `${ids.suffix}_extraction`)],
    promotion_hash: ids.promotionResultHash,
    created_at: EXPERIMENT_FOUNDATION_SCENARIO_TIMESTAMP,
    ...overrides,
  };
}

function record(recordKind: ExperimentFoundationRecordKind, payload: unknown): ExperimentFoundationScenarioRecord {
  return {
    record_kind: recordKind,
    payload: payload as Record<string, unknown>,
  };
}

function normalizeScenarioId(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  const suffix = normalized || '001';
  return suffix.startsWith('capability_') ? suffix : `capability_${suffix}`;
}
