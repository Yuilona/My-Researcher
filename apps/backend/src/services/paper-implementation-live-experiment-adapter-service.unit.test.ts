import assert from 'node:assert/strict';
import test from 'node:test';

import Fastify from 'fastify';
import type {
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJob,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
  CollectExternalTrainingJobRequest,
  CancelExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import type {
  ImplementationFeedbackEvent,
  ImplementationIntakeSnapshot,
  ImplementationProject,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  TraceLineageBundle,
  TraceManifest,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-trace-contracts';
import type {
  ExperimentPlanLight,
  ValidationCycle,
  ValidationCycleInputSnapshot,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-validation-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';

import { PaperImplementationController } from '../controllers/paper-implementation-controller.js';
import { AppError } from '../errors/app-error.js';
import { InMemoryPaperImplementationTraceRepository } from '../repositories/in-memory-paper-implementation-trace-repository.js';
import { InMemoryPaperImplementationValidationRepository } from '../repositories/in-memory-paper-implementation-validation-repository.js';
import { InMemoryPaperImplementationWorkOrderRepository } from '../repositories/in-memory-paper-implementation-workorder-repository.js';
import type {
  PaperImplementationBootstrapPersistence,
  PaperImplementationBootstrapResult,
  PaperImplementationRepository,
} from '../repositories/paper-implementation.repository.js';
import type { PaperImplementationAiWorkflowHarnessService } from './paper-implementation-ai-workflow-harness-service.js';
import type { PaperImplementationIntakeBootstrapService } from './paper-implementation-intake-bootstrap-service.js';
import { PaperImplementationLiveExperimentAdapterService } from './paper-implementation-live-experiment-adapter-service.js';
import type { PaperImplementationMotiveEvidenceBoardService } from './paper-implementation-motive-evidence-board-service.js';
import type { PaperImplementationResultClaimDossierService } from './paper-implementation-result-claim-dossier-service.js';
import { PaperImplementationTraceKernelService } from './paper-implementation-trace-kernel-service.js';
import type { PaperImplementationValidationCyclePlanningService } from './paper-implementation-validation-cycle-planning-service.js';
import { PaperImplementationWorkOrderExperimentBridgeService } from './paper-implementation-workorder-experiment-bridge-service.js';
import { registerPaperImplementationRoutes } from '../routes/paper-implementation-routes.js';

const NOW = '2026-05-24T00:00:00.000Z';
const PROJECT_ID = 'implementation_project_001';
const WORK_ORDER_ID = 'research_work_order_001';
const VALIDATION_CYCLE_ID = 'validation_cycle_001';
const EXPERIMENT_PLAN_ID = 'experiment_plan_light_001';
const EXTERNAL_JOB_ID = 'external_training_job_001';

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
    version_id: versionId,
  };
}

function experimentRef(refType: string, refId: string, versionId: string | null = null): ExperimentFoundationRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
  };
}

function makeIdFactory() {
  const counts = new Map<string, number>();
  return (prefix: string) => {
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    return `${prefix}_${String(next).padStart(3, '0')}`;
  };
}

function emptyLineage(): TraceLineageBundle {
  return {
    literature: {
      literature_evidence_refs: [],
      source_locator_refs: [],
      citation_candidate_refs: [],
    },
    experiment: {
      experiment_plan_refs: [],
      work_order_refs: [],
      run_refs: [],
      run_evidence_refs: [],
      result_packet_refs: [],
      metric_refs: [],
    },
    artifact: {
      dataset_refs: [],
      baseline_refs: [],
      code_version_refs: [],
      model_checkpoint_refs: [],
      config_refs: [],
      log_artifact_refs: [],
    },
    decision: {
      validation_cycle_refs: [],
      motive_evolution_decision_refs: [],
      gate_result_refs: [],
      human_decision_refs: [],
      accepted_risk_refs: [],
    },
    internal_interpretation: {
      result_interpretation_refs: [],
      llm_rationale_refs: [],
      board_summary_refs: [],
      non_citable_refs: [],
    },
  };
}

class StaticProjectRepository implements PaperImplementationRepository {
  readonly project: ImplementationProject = {
    implementation_project_id: PROJECT_ID,
    intake_snapshot_id: 'intake_snapshot_001',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    paper_project_bridge_id: 'paper_project_bridge_001',
    bridge_payload_hash: 'bridge_hash_001',
    target_paper_project_ref: null,
    lifecycle_status: 'active',
    freshness_status: 'fresh',
    source_status: 'active',
    version_number: 1,
    policy_version_id: 'policy_v1',
    created_by: 'system',
    created_at: NOW,
    updated_at: NOW,
  };

  async createBootstrap(
    persistence: PaperImplementationBootstrapPersistence,
  ): Promise<PaperImplementationBootstrapResult> {
    return { ...persistence, created: true };
  }

  async findProjectById(implementationProjectId: string): Promise<ImplementationProject | null> {
    return implementationProjectId === PROJECT_ID ? structuredClone(this.project) : null;
  }

  async findProjectByBridgeId(): Promise<ImplementationProject | null> {
    return structuredClone(this.project);
  }

  async findIntakeSnapshotById(): Promise<ImplementationIntakeSnapshot | null> {
    return null;
  }

  async findIntakeSnapshotByProjectId(): Promise<ImplementationIntakeSnapshot | null> {
    return null;
  }

  async createFeedbackEvent(event: ImplementationFeedbackEvent): Promise<ImplementationFeedbackEvent> {
    return structuredClone(event);
  }
}

class FakeExperimentExecution {
  submitInputs: SubmitExternalTrainingJobRequest[] = [];
  job: ExternalTrainingJob = {
    external_job_id: EXTERNAL_JOB_ID,
    training_task_spec_ref: experimentRef('training_task_spec', 'training_task_spec_001'),
    training_task_spec_hash: 'training_task_spec_hash_001',
    materialization_result_ref: experimentRef('training_task_materialization_result', 'materialization_result_001'),
    materialization_result_hash: 'materialization_result_hash_001',
    adapter_kind: 'local_script',
    adapter_version: 'local_script_v1',
    platform_ref: {
      platform_id: 'training_platform_local_001',
      platform_kind: 'local_script',
      adapter_kind: 'local_script',
      adapter_version: 'local_script_v1',
      capability_refs: [],
    },
    idempotency_key: 'work_order_attempt_001',
    external_job_ref: experimentRef('local_script_job', 'local_job_001'),
    external_job_hash: 'external_job_hash_001',
    job_status: 'submitted',
    submitted_at: NOW,
    last_synced_at: null,
    completed_at: null,
    stage_event_refs: [],
    partial_result_refs: [],
    result_refs: [],
    adapter_metadata_refs: [],
    adapter_metadata_hashes: [],
    traceability_refs: [],
    created_at: NOW,
    updated_at: NOW,
  };

  async submitJob(input: SubmitExternalTrainingJobRequest) {
    this.submitInputs.push(input);
    this.job = {
      ...this.job,
      idempotency_key: input.idempotency_key,
      training_task_spec_ref: input.training_task_spec_ref,
      training_task_spec_hash: input.training_task_spec_hash,
      materialization_result_ref: input.materialization_result_ref,
      materialization_result_hash: input.materialization_result_hash,
    };
    return { external_job: structuredClone(this.job) };
  }

  async syncJob(_externalJobId: string, _input: SyncExternalTrainingJobRequest) {
    this.job = {
      ...this.job,
      job_status: 'running',
      last_synced_at: NOW,
      updated_at: NOW,
    };
    return { external_job: structuredClone(this.job) };
  }

  async collectJob(_externalJobId: string, _input: CollectExternalTrainingJobRequest) {
    this.job = {
      ...this.job,
      job_status: 'succeeded',
      completed_at: NOW,
      result_refs: [
        experimentRef('experiment_result', 'experiment_result_001'),
        experimentRef('result_validation_report', 'result_validation_report_001'),
        experimentRef('evidence_candidate', 'evidence_candidate_001'),
      ],
      partial_result_refs: [experimentRef('training_task_partial_result_ref', 'partial_result_001')],
      updated_at: NOW,
    };
    return { external_job: structuredClone(this.job) };
  }

  async cancelJob(_externalJobId: string, input: CancelExternalTrainingJobRequest) {
    this.job = {
      ...this.job,
      job_status: 'cancelled',
      completed_at: NOW,
      updated_at: NOW,
      adapter_metadata_hashes: [input.idempotency_key],
    };
    return { external_job: structuredClone(this.job) };
  }
}

class FakeExperimentRecords {
  private readonly hashes = new Map<string, string>([
    ['experiment_result:experiment_result_001', 'experiment_result_hash_001'],
    ['result_validation_report:result_validation_report_001', 'validation_report_hash_001'],
    ['evidence_candidate:evidence_candidate_001', 'evidence_candidate_hash_001'],
  ]);

  async getRecord(recordKind: string, recordId: string): Promise<ExperimentFoundationStoredRecord> {
    const key = `${recordKind}:${recordId}`;
    const hash = this.hashes.get(key);
    if (!hash) {
      throw new AppError(404, 'NOT_FOUND', `${key} not found.`);
    }
    return {
      id: key,
      record_kind: recordKind as ExperimentFoundationStoredRecord['record_kind'],
      record_id: recordId,
      record_hash: hash,
      status: null,
      family: null,
      parent_record_kind: null,
      parent_record_id: null,
      owner_ref_type: null,
      owner_ref_id: null,
      payload: {},
      source_refs: [],
      traceability_refs: [],
      created_at: NOW,
      updated_at: NOW,
    };
  }
}

function makeInputSnapshot(): ValidationCycleInputSnapshot {
  return {
    input_snapshot_id: 'validation_input_snapshot_001',
    implementation_project_id: PROJECT_ID,
    context_policy_version_id: 'validation_context_v1',
    included_refs: {
      motive_version_refs: [ref('core_motive_version', 'core_motive_version_001', '1')],
      board_version_refs: [ref('motive_evidence_board_version', 'motive_evidence_board_001')],
      evidence_refs: [ref('literature_evidence_unit', 'literature_evidence_unit_001')],
      route_refs: [],
      work_order_refs: [],
      result_packet_refs: [],
      experiment_plan_light_refs: [],
    },
    excluded_context_notes: [],
    input_snapshot_hash: 'validation_input_hash_001',
    created_by: 'system',
    created_at: NOW,
  };
}

function makeValidationCycle(): ValidationCycle {
  const inputSnapshot = makeInputSnapshot();
  return {
    validation_cycle_id: VALIDATION_CYCLE_ID,
    implementation_project_id: PROJECT_ID,
    input_snapshot_id: inputSnapshot.input_snapshot_id,
    target: {
      target_type: 'core_motive_version',
      target_id: 'core_motive_version_001',
      target_version_id: '1',
    },
    trigger: {
      trigger_type: 'board_gap',
      trigger_refs: [ref('motive_evidence_board_version', 'motive_evidence_board_001')],
    },
    cycle_type: 'probe_execution',
    validation_frame: {
      validation_question: 'Does the run support the admitted assertion?',
      assumptions_under_test: ['The dataset contains sufficient examples.'],
      assertions_under_test: [ref('motive_assertion', 'motive_assertion_001')],
      decision_if_pass: 'Prepare claim interpretation.',
      decision_if_fail: 'Lower the claim ceiling.',
      decision_if_inconclusive: 'Revise the route.',
      expected_information_gain: 'high',
      why_this_cycle_now: 'The evidence board is admitted and needs run evidence.',
    },
    context: inputSnapshot,
    criteria: {
      pass_conditions: ['Primary metric improves over baseline.'],
      fail_conditions: ['Primary metric does not improve.'],
      inconclusive_conditions: ['Run cannot complete or metric is unstable.'],
      stop_conditions: ['Stop after one failed confirmatory run.'],
      minimum_artifacts_required: ['Trusted run evidence unit.'],
    },
    budget: {
      budget_id: 'validation_budget_001',
      max_runtime: 'PT4H',
      max_compute: 'local_cpu',
      max_human_review_count: 1,
      retry_budget: 0,
    },
    lifecycle_status: 'admitted',
    execution_status: 'not_started',
    outputs: {
      evidence_unit_refs: [],
      evidence_binding_refs: [],
      board_update_refs: [],
      route_update_refs: [],
      work_order_result_refs: [],
      result_interpretation_packet_refs: [],
      quality_signal_refs: [],
      recommended_evolution_decision_refs: [],
    },
    cycle_assessment: null,
    trace_manifest_ref: ref('trace_manifest', 'trace_manifest_validation_001'),
    trace_manifest_id: 'trace_manifest_validation_001',
    gate_result_id: 'validation_gate_result_001',
    decision_exit: null,
    confirmation_level: 'human_confirmed',
    confirmed_by: 'human',
    policy_version_id: 'policy_v1',
    created_by: 'system',
    created_at: NOW,
    updated_at: NOW,
    admitted_at: NOW,
    completed_at: null,
  };
}

function makeExperimentPlan(): ExperimentPlanLight {
  return {
    experiment_plan_light_id: EXPERIMENT_PLAN_ID,
    implementation_project_id: PROJECT_ID,
    validation_cycle_id: VALIDATION_CYCLE_ID,
    route_candidate_id: null,
    run_mode: 'confirmatory',
    plan_summary: 'Run confirmatory experiment.',
    estimated_cost_class: 'medium',
    baseline_gap_status: 'resolved',
    primary_metric_refs: [ref('metric', 'metric_001')],
    secondary_metric_refs: [],
    dataset_version_refs: [ref('dataset_version', 'dataset_version_001')],
    baseline_version_refs: [ref('baseline_version', 'baseline_version_001')],
    code_version_refs: [ref('code_version', 'code_version_001')],
    config_refs: [ref('config', 'config_001')],
    confirmatory_marker: true,
    scope_boundary_ref: null,
    budget_id: 'validation_budget_001',
    stop_condition_refs: [ref('stop_rule', 'stop_rule_001')],
    trace_manifest_ref: ref('trace_manifest', 'trace_manifest_plan_001'),
    trace_manifest_id: 'trace_manifest_plan_001',
    created_by: 'system',
    created_at: NOW,
  };
}

function traceManifest(traceManifestId: string, targetRefType: string, targetRefId: string): TraceManifest {
  return {
    trace_manifest_id: traceManifestId,
    implementation_project_id: PROJECT_ID,
    target_ref: ref(targetRefType, targetRefId),
    lineage: emptyLineage(),
    integrity: {
      missing_refs: [],
      broken_refs: [],
      stale_refs: [],
      invalidated_refs: [],
      non_citable_refs: [],
      partial_refs: [],
    },
    trace_status: 'complete',
    broken_ref_count: 0,
    stale_ref_count: 0,
    missing_ref_count: 0,
    non_citable_ref_count: 0,
    trace_policy_version_id: 'trace_policy_v1',
    created_by: 'system',
    created_at: NOW,
  };
}

function workOrderRequest() {
  return {
    work_order_id: WORK_ORDER_ID,
    validation_cycle_id: VALIDATION_CYCLE_ID,
    experiment_plan_light_id: EXPERIMENT_PLAN_ID,
    run_type: 'confirmatory' as const,
    run_policy: {
      run_policy_id: 'run_policy_001',
      retry_budget: 0,
      stop_condition_refs: [ref('stop_rule', 'stop_rule_001')],
      allowed_mutation_refs: [],
      autotune_policy: 'disabled' as const,
    },
    experiment_bridge: {
      run_recipe_ref: ref('experiment_run_recipe', 'run_recipe_001', 'v1'),
      run_recipe_hash: 'run_recipe_hash_001',
      version_lock_hash: 'version_lock_hash_001',
      config_snapshot_hash: 'config_snapshot_hash_001',
      materialization_result_ref: ref('training_task_materialization_result', 'materialization_result_001'),
      materialization_result_hash: 'materialization_result_hash_001',
      training_task_spec_ref: ref('training_task_spec', 'training_task_spec_001'),
      training_task_spec_hash: 'training_task_spec_hash_001',
      result_validation_policy_ref: ref('result_validation_policy', 'result_validation_policy_001'),
    },
    trace_manifest_id: 'trace_manifest_work_order_001',
  };
}

async function makeHarness() {
  const projectRepository = new StaticProjectRepository();
  const traceRepository = new InMemoryPaperImplementationTraceRepository();
  const validationRepository = new InMemoryPaperImplementationValidationRepository();
  const workOrderRepository = new InMemoryPaperImplementationWorkOrderRepository();
  const idFactory = makeIdFactory();
  const workOrderService = new PaperImplementationWorkOrderExperimentBridgeService({
    projectRepository,
    traceRepository,
    validationRepository,
    workOrderRepository,
    idFactory,
    now: () => NOW,
  });
  const traceKernel = new PaperImplementationTraceKernelService({
    projectRepository,
    traceRepository,
    idFactory,
    now: () => NOW,
  });
  const execution = new FakeExperimentExecution();
  const records = new FakeExperimentRecords();
  const service = new PaperImplementationLiveExperimentAdapterService({
    experimentExecution: execution,
    experimentRecords: records,
    workOrderService,
    traceKernel,
    workOrderRepository,
  });

  await validationRepository.createValidationCycleDraft({
    input_snapshot: makeInputSnapshot(),
    validation_cycle: makeValidationCycle(),
  });
  await validationRepository.createExperimentPlanLight(makeExperimentPlan());
  await traceRepository.createTraceManifest(
    traceManifest('trace_manifest_work_order_001', 'research_work_order', WORK_ORDER_ID),
    [],
  );
  await workOrderService.createResearchWorkOrderDraft(PROJECT_ID, workOrderRequest());
  await workOrderService.admitResearchWorkOrder(PROJECT_ID, WORK_ORDER_ID, {
    admission_gate_result_id: 'work_order_gate_result_001',
  });

  return {
    service,
    execution,
    workOrderService,
    traceKernel,
  };
}

async function assertRejectsWithCode(action: () => Promise<unknown>, expectedCode: string) {
  await assert.rejects(
    action,
    (error: unknown) => error instanceof AppError && error.errorCode === expectedCode,
  );
}

test('submits admitted WorkOrder to experiment-foundation execution idempotently', async () => {
  const { service, execution, workOrderService } = await makeHarness();

  const submitted = await service.submitLiveExperimentRun(PROJECT_ID, WORK_ORDER_ID, {
    idempotency_key: 'work_order_attempt_001',
  });
  assert.equal(submitted.external_job.external_job_id, EXTERNAL_JOB_ID);
  assert.equal(submitted.harness_run?.external_job_ref.ref_id, 'local_job_001');
  assert.equal(execution.submitInputs[0]?.materialization_result_ref.ref_id, 'materialization_result_001');

  const repeated = await service.submitLiveExperimentRun(PROJECT_ID, WORK_ORDER_ID, {
    idempotency_key: 'work_order_attempt_001',
  });
  assert.equal(repeated.harness_run?.harness_run_id, submitted.harness_run?.harness_run_id);
  assert.equal((await workOrderService.listHarnessRuns(PROJECT_ID, WORK_ORDER_ID)).length, 1);
});

test('blocks live submit when WorkOrder lacks materialization refs', async () => {
  const { service, workOrderService, traceKernel } = await makeHarness();
  await traceKernel.createTraceManifest(PROJECT_ID, {
    target_ref: ref('research_work_order', 'research_work_order_missing_materialization'),
    lineage: {
      ...emptyLineage(),
      experiment: {
        ...emptyLineage().experiment,
        experiment_plan_refs: [ref('experiment_plan_light', EXPERIMENT_PLAN_ID)],
      },
    },
    integrity: {},
  });
  await workOrderService.createResearchWorkOrderDraft(PROJECT_ID, {
    ...workOrderRequest(),
    work_order_id: 'research_work_order_missing_materialization',
    experiment_bridge: {
      ...workOrderRequest().experiment_bridge,
      materialization_result_ref: null,
      materialization_result_hash: null,
    },
    trace_manifest_id: 'trace_manifest_001',
  });
  await workOrderService.admitResearchWorkOrder(PROJECT_ID, 'research_work_order_missing_materialization', {
    admission_gate_result_id: 'work_order_gate_result_002',
  });

  await assertRejectsWithCode(
    () => service.submitLiveExperimentRun(PROJECT_ID, 'research_work_order_missing_materialization', {
      idempotency_key: 'work_order_attempt_missing_materialization',
    }),
    'GATE_CONSTRAINT_FAILED',
  );
});

test('sync records non-final monitor intake without trusted run evidence', async () => {
  const { service } = await makeHarness();
  await service.submitLiveExperimentRun(PROJECT_ID, WORK_ORDER_ID, {
    idempotency_key: 'work_order_attempt_001',
  });

  const synced = await service.syncLiveExperimentRun(PROJECT_ID, WORK_ORDER_ID, EXTERNAL_JOB_ID, {});
  assert.equal(synced.monitor_intake?.run_status, 'running');
  assert.equal(synced.monitor_intake?.trust_status, 'trusted');
  assert.equal(synced.run_evidence_unit, null);
});

test('collect creates target-specific trace and trusted run evidence from stored result hashes', async () => {
  const { service } = await makeHarness();
  await service.submitLiveExperimentRun(PROJECT_ID, WORK_ORDER_ID, {
    idempotency_key: 'work_order_attempt_001',
  });

  const collected = await service.collectLiveExperimentRun(PROJECT_ID, WORK_ORDER_ID, EXTERNAL_JOB_ID, {});
  assert.equal(collected.run_evidence_unit?.run_status, 'succeeded');
  assert.equal(collected.run_evidence_unit?.result_hash, 'experiment_result_hash_001');
  assert.equal(collected.run_evidence_unit?.result_validation_report_hash, 'validation_report_hash_001');
  assert.equal(collected.run_evidence_unit?.evidence_candidate_hashes[0], 'evidence_candidate_hash_001');
  assert.equal(collected.trace_manifest?.target_ref.ref_type, 'run_evidence_unit');
  assert.equal(collected.trace_manifest?.target_ref.ref_id, collected.run_evidence_unit?.run_evidence_unit_id);
  assert.equal(collected.trace_manifest?.trace_status, 'complete');
});

test('route wiring validates submit payload and delegates live experiment submit', async () => {
  const { service } = await makeHarness();
  const app = Fastify({ logger: false });
  await registerPaperImplementationRoutes(
    app,
    new PaperImplementationController(
      {} as PaperImplementationIntakeBootstrapService,
      {} as PaperImplementationTraceKernelService,
      {} as PaperImplementationMotiveEvidenceBoardService,
      {} as PaperImplementationValidationCyclePlanningService,
      {} as PaperImplementationWorkOrderExperimentBridgeService,
      {} as PaperImplementationResultClaimDossierService,
      {} as PaperImplementationAiWorkflowHarnessService,
      service,
    ),
  );
  try {
    const invalid = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${PROJECT_ID}/research-work-orders/${WORK_ORDER_ID}/live-experiment-runs/submit`,
      payload: {},
    });
    assert.equal(invalid.statusCode, 400);

    const valid = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${PROJECT_ID}/research-work-orders/${WORK_ORDER_ID}/live-experiment-runs/submit`,
      payload: {
        idempotency_key: 'work_order_attempt_001',
      },
    });
    assert.equal(valid.statusCode, 201);
    assert.equal(valid.json().harness_run.external_job_ref.ref_id, 'local_job_001');
  } finally {
    await app.close();
  }
});
