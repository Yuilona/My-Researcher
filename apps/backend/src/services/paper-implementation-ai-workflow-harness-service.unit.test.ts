import { strict as assert } from 'node:assert';
import test from 'node:test';

import type {
  CreateAgentWorkflowHarnessRunRequest,
  CreateImplementationHarnessRequest,
  CreateImplementationInputSnapshotRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-ai-workflow-harness-contracts';
import type {
  ImplementationFeedbackEvent,
  ImplementationIntakeSnapshot,
  ImplementationProject,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  CitationCandidate,
  ClaimTracePacket,
  NaturalLanguageFieldRoleRecord,
  TraceManifest,
  TraceRepairQueueItem,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-trace-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';

import { InMemoryPaperImplementationAiWorkflowHarnessRepository } from '../repositories/in-memory-paper-implementation-ai-workflow-harness-repository.js';
import type {
  PaperImplementationBootstrapPersistence,
  PaperImplementationBootstrapResult,
  PaperImplementationRepository,
} from '../repositories/paper-implementation.repository.js';
import type { PaperImplementationTraceRepository } from '../repositories/paper-implementation-trace.repository.js';
import { PaperImplementationAiWorkflowHarnessService } from './paper-implementation-ai-workflow-harness-service.js';

const NOW = '2026-05-21T10:00:00.000Z';

class StaticProjectRepository implements PaperImplementationRepository {
  constructor(private readonly project: ImplementationProject) {}

  async createBootstrap(
    persistence: PaperImplementationBootstrapPersistence,
  ): Promise<PaperImplementationBootstrapResult> {
    return {
      ...persistence,
      created: true,
    };
  }

  async findProjectById(implementationProjectId: string): Promise<ImplementationProject | null> {
    return this.project.implementation_project_id === implementationProjectId
      ? structuredClone(this.project)
      : null;
  }

  async findProjectByBridgeId(): Promise<ImplementationProject | null> {
    return null;
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

class StaticTraceRepository implements PaperImplementationTraceRepository {
  private readonly manifests = new Map<string, TraceManifest>();

  addTraceManifest(manifest: TraceManifest): void {
    this.manifests.set(manifest.trace_manifest_id, structuredClone(manifest));
  }

  async createTraceManifest(): Promise<TraceManifest> {
    throw new Error('not implemented');
  }

  async findTraceManifestById(
    implementationProjectId: string,
    traceManifestId: string,
  ): Promise<TraceManifest | null> {
    const manifest = this.manifests.get(traceManifestId);
    if (!manifest || manifest.implementation_project_id !== implementationProjectId) {
      return null;
    }
    return structuredClone(manifest);
  }

  async listTraceManifests(): Promise<TraceManifest[]> {
    return [...this.manifests.values()].map((manifest) => structuredClone(manifest));
  }

  async createCitationCandidate(candidate: CitationCandidate): Promise<CitationCandidate> {
    return candidate;
  }

  async listCitationCandidates(): Promise<CitationCandidate[]> {
    return [];
  }

  async createClaimTracePacket(packet: ClaimTracePacket): Promise<ClaimTracePacket> {
    return packet;
  }

  async listClaimTracePackets(): Promise<ClaimTracePacket[]> {
    return [];
  }

  async createNaturalLanguageFieldRole(
    record: NaturalLanguageFieldRoleRecord,
  ): Promise<NaturalLanguageFieldRoleRecord> {
    return record;
  }

  async findNaturalLanguageFieldRoleByIdentity(): Promise<NaturalLanguageFieldRoleRecord | null> {
    return null;
  }

  async listTraceRepairQueueItems(): Promise<TraceRepairQueueItem[]> {
    return [];
  }

  async listTraceRepairQueueItemsByManifest(): Promise<TraceRepairQueueItem[]> {
    return [];
  }

  async resolveTraceRepairQueueItem(): Promise<TraceRepairQueueItem> {
    throw new Error('not implemented');
  }
}

function buildService() {
  const project = makeProject();
  const traceRepository = new StaticTraceRepository();
  const repository = new InMemoryPaperImplementationAiWorkflowHarnessRepository();
  const nextId = makeIdFactory();
  const service = new PaperImplementationAiWorkflowHarnessService({
    projectRepository: new StaticProjectRepository(project),
    traceRepository,
    harnessRepository: repository,
    idFactory: nextId,
    now: () => NOW,
  });
  return { service, traceRepository, repository, project };
}

test('AI workflow harness completes a proposal-only trace-ready run', async () => {
  const { service, traceRepository, project } = buildService();
  traceRepository.addTraceManifest(makeTraceManifest(project.implementation_project_id));

  const harness = await service.createImplementationHarness(
    project.implementation_project_id,
    makeHarnessRequest(),
  );
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );
  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
    }),
  );

  assert.equal(result.harness_run.run_status, 'completed');
  assert.equal('spec' in (result as unknown as Record<string, unknown>), false);
  assert.equal(result.gate_result.result, 'pass');
  assert.equal(result.proposal_artifacts[0]?.proposal_status, 'proposed');
  assert.equal(result.queue_items.length, 0);
});

test('implementation harness rejects disabled invariants before workflow execution', async () => {
  const { service, project } = buildService();
  const request = makeHarnessRequest();
  request.invariants.require_trace_manifest = false;

  await assert.rejects(
    service.createImplementationHarness(project.implementation_project_id, request),
    /invariants must all be enabled/,
  );
});

test('AI workflow harness blocks product runs that use mock execution', async () => {
  const { service, traceRepository, project } = buildService();
  traceRepository.addTraceManifest(makeTraceManifest(project.implementation_project_id));
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );

  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
      run_mode: 'product',
      execution_mode: 'mocked_llm',
    }),
  );

  assert.equal(result.harness_run.run_status, 'blocked');
  assert.ok(result.harness_run.blocked_reasons.includes('product_run_mode_rejects_mocked_llm_execution'));
  assert.ok(result.harness_run.blocked_reasons.includes('product_run_mode_rejects_mock_model_profile'));
  assert.equal(result.queue_items[0]?.queue_type, 'failed_workflow');
});

test('AI workflow harness turns direct authority mutation into queue blocker', async () => {
  const { service, traceRepository, project } = buildService();
  traceRepository.addTraceManifest(makeTraceManifest(project.implementation_project_id));
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );

  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
      direct_authority_mutation_refs: [ref('core_motive_version', 'cmv_1')],
    }),
  );

  assert.equal(result.harness_run.run_status, 'blocked');
  assert.equal(result.proposal_artifacts[0]?.proposal_status, 'blocked');
  assert.ok(result.quality_signals.some((signal) => signal.signal_type === 'forbidden_state_mutation'));
  assert.equal(result.queue_items[0]?.priority, 'critical');
});

test('AI workflow harness blocks missing trace manifest instead of admitting proposal', async () => {
  const { service, project } = buildService();
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );

  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
    }),
  );

  assert.equal(result.harness_run.run_status, 'blocked');
  assert.ok(result.harness_run.blocked_reasons.includes('proposal_trace_manifest_missing'));
  assert.equal(result.queue_items[0]?.queue_type, 'trace_repair');
});

test('AI workflow harness blocks stale trace manifests', async () => {
  const { service, traceRepository, project } = buildService();
  const staleTrace = makeTraceManifest(project.implementation_project_id);
  staleTrace.trace_status = 'stale';
  staleTrace.stale_ref_count = 1;
  staleTrace.integrity.stale_refs = [ref('run_evidence_unit', 'stale_evidence_1')];
  traceRepository.addTraceManifest(staleTrace);
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );

  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
    }),
  );

  assert.equal(result.harness_run.run_status, 'blocked');
  assert.equal(result.harness_run.trace_validation_status, 'failed');
  assert.ok(result.harness_run.blocked_reasons.includes('proposal_trace_manifest_stale'));
  assert.equal(result.queue_items[0]?.queue_type, 'trace_repair');
});

test('AI workflow harness blocks proposal refs outside or excluded from input snapshot', async () => {
  const { service, traceRepository, project } = buildService();
  traceRepository.addTraceManifest(makeTraceManifest(project.implementation_project_id));
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshotRequest = makeSnapshotRequest();
  snapshotRequest.excluded_context.excluded_refs = [ref('core_motive_version', 'cmv_1')];
  snapshotRequest.excluded_context.exclusion_reasons = ['stale evidence excluded by context compiler'];
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    snapshotRequest,
  );

  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
      proposal_artifacts: [{
        ...makeRunRequest().proposal_artifacts[0]!,
        target_ref: ref('validation_cycle', 'validation_cycle_outside_snapshot'),
        source_refs: [ref('core_motive_version', 'cmv_1'), ref('run_evidence_unit', 'not_in_snapshot')],
      }],
    }),
  );

  assert.equal(result.harness_run.run_status, 'blocked');
  assert.equal(result.harness_run.reference_validation_status, 'failed');
  assert.ok(result.harness_run.blocked_reasons.includes('proposal_target_ref_input_snapshot_mismatch'));
  assert.ok(result.harness_run.blocked_reasons.includes('proposal_source_ref_excluded_by_input_snapshot'));
  assert.ok(result.harness_run.blocked_reasons.includes('proposal_source_ref_not_in_input_snapshot'));
});

test('AI workflow harness turns spec/schema mismatch into a blocked run', async () => {
  const { service, traceRepository, project } = buildService();
  traceRepository.addTraceManifest(makeTraceManifest(project.implementation_project_id));
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );

  const baseSpec = makeSpec();
  const spec: CreateAgentWorkflowHarnessRunRequest['spec'] = {
    ...baseSpec,
    workflow_version: 'unexpected_version',
    validation_policy: {
      ...baseSpec.validation_policy,
      schema_validation: false,
    },
  };
  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
      spec,
    }),
  );

  assert.equal(result.harness_run.run_status, 'blocked');
  assert.equal(result.harness_run.schema_validation_status, 'failed');
  assert.ok(result.harness_run.blocked_reasons.includes('spec_workflow_version_mismatch'));
  assert.ok(result.harness_run.blocked_reasons.includes('spec_required_validation_disabled'));
});

test('input snapshot rejects memo-like refs in evidence-bearing context', async () => {
  const { service, project } = buildService();
  const request = makeSnapshotRequest();
  request.included_context.evidence_binding_refs = [ref('display_summary', 'summary_1')];

  await assert.rejects(
    service.createImplementationInputSnapshot(project.implementation_project_id, request),
    /cannot enter evidence-bearing input context/,
  );
});

test('decision queue resolution does not mutate harness run authority', async () => {
  const { service, project } = buildService();
  const harness = await service.createImplementationHarness(project.implementation_project_id, makeHarnessRequest());
  const snapshot = await service.createImplementationInputSnapshot(
    project.implementation_project_id,
    makeSnapshotRequest(),
  );
  const result = await service.createAgentWorkflowHarnessRun(
    project.implementation_project_id,
    makeRunRequest({
      harness_id: harness.harness_id,
      input_snapshot_id: snapshot.input_snapshot_id,
    }),
  );
  const queueItemId = result.queue_items[0]!.queue_item_id;

  const resolved = await service.resolveDecisionWorkQueueItem(
    project.implementation_project_id,
    queueItemId,
    { status: 'resolved', resolution_note: 'manual trace repair queued', resolved_by: 'human' },
  );
  const runs = await service.listAgentWorkflowHarnessRuns(project.implementation_project_id);

  assert.equal(resolved.status, 'resolved');
  assert.equal(runs[0]?.run_status, 'blocked');
  assert.ok(runs[0]?.blocked_reasons.includes('proposal_trace_manifest_missing'));
});

function makeProject(): ImplementationProject {
  return {
    implementation_project_id: 'impl_project_1',
    intake_snapshot_id: 'intake_snapshot_1',
    workspace_id: 'workspace_1',
    title_card_id: 'title_card_1',
    paper_project_bridge_id: 'bridge_1',
    bridge_payload_hash: 'sha256:bridge',
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
}

function makeHarnessRequest(): CreateImplementationHarnessRequest {
  return {
    harness_id: 'harness_1',
    policy_pack: {
      context_policy_version_id: 'context_policy_v1',
      trace_policy_version_id: 'trace_policy_v1',
      evidence_policy_version_id: 'evidence_policy_v1',
      experiment_policy_version_id: 'experiment_policy_v1',
      retention_policy_version_id: 'retention_policy_v1',
      evaluation_policy_version_id: 'evaluation_policy_v1',
    },
    runtime_bindings: {
      control_plane_id: 'control_plane_1',
      artifact_store_ref: ref('artifact_store', 'store_1'),
      evidence_ledger_ref: ref('evidence_ledger', 'ledger_1'),
      work_order_broker_ref: ref('work_order_broker', 'broker_1'),
      run_monitor_ref: ref('run_monitor', 'monitor_1'),
    },
    invariants: {
      require_input_snapshot: true,
      require_trace_manifest: true,
      require_artifact_refs: true,
      forbid_untraced_claims: true,
      forbid_memo_as_evidence: true,
      retain_failed_runs: true,
      separate_exploratory_and_confirmatory: true,
    },
    created_by: 'system',
  };
}

function makeSnapshotRequest(): CreateImplementationInputSnapshotRequest {
  return {
    input_snapshot_id: 'input_snapshot_1',
    target_ref: ref('validation_cycle', 'validation_cycle_1'),
    workflow_type: 'validation_cycle_planning',
    context_policy_version_id: 'context_policy_v1',
    included_context: emptyIncludedContext({
      motive_version_refs: [ref('core_motive_version', 'cmv_1')],
      board_version_refs: [ref('motive_evidence_board_version', 'board_1')],
      trace_manifest_refs: [ref('trace_manifest', 'trace_manifest_1')],
    }),
    excluded_context: {
      excluded_refs: [],
      exclusion_reasons: [],
    },
    freshness_constraints: {
      exclude_stale_evidence: true,
      exclude_invalidated_refs: true,
    },
    evidence_rules: {
      memo_as_evidence_forbidden: true,
      citation_requires_source_locator: true,
    },
    source_hashes: ['sha256:source-context'],
    created_by: 'system',
  };
}

function makeRunRequest(
  overrides: Partial<CreateAgentWorkflowHarnessRunRequest> = {},
): CreateAgentWorkflowHarnessRunRequest {
  const base: CreateAgentWorkflowHarnessRunRequest = {
    harness_run_id: 'harness_run_1',
    harness_id: 'harness_1',
    input_snapshot_id: 'input_snapshot_1',
    workflow_type: 'validation_cycle_planning',
    workflow_version: 'validation_cycle_planning.v1',
    run_mode: 'mock',
    execution_mode: 'mocked_llm',
    model_profile_id: 'mock.paper-implementation.validation-cycle-planner.v1',
    prompt_template_version_id: 'prompt_template_v1',
    output_schema_version_id: 'validation_cycle_planning_output_v1',
    raw_output_artifact_ref: ref('artifact', 'raw_output_1'),
    parsed_output_artifact_ref: ref('artifact', 'parsed_output_1'),
    spec: makeSpec(),
    proposal_artifacts: [{
      proposal_artifact_id: 'proposal_1',
      artifact_kind: 'proposal_object',
      target_ref: ref('validation_cycle', 'validation_cycle_1'),
      artifact_ref: ref('artifact', 'proposal_artifact_1'),
      source_refs: [ref('core_motive_version', 'cmv_1')],
      trace_manifest_refs: [ref('trace_manifest', 'trace_manifest_1')],
      payload: { proposal_only: true },
    }],
    quality_signal_candidates: [],
    direct_authority_mutation_refs: [],
    created_by: 'system',
  };
  const merged = { ...base, ...overrides };
  merged.spec = overrides.spec ?? {
    ...base.spec,
    workflow_type: merged.workflow_type,
    workflow_version: merged.workflow_version,
    prompt_policy: {
      ...base.spec.prompt_policy,
      prompt_template_version_id: merged.prompt_template_version_id,
      output_schema_version_id: merged.output_schema_version_id,
    },
    model_policy: {
      ...base.spec.model_policy,
      model_profile_id: merged.model_profile_id,
    },
  };
  return merged;
}

function makeSpec() {
  return {
    workflow_type: 'validation_cycle_planning',
    workflow_version: 'validation_cycle_planning.v1',
    input_policy: {
      required_input_snapshot: true,
      allowed_context_types: ['core_motive_version', 'motive_evidence_board_version', 'trace_manifest'],
      forbidden_context_types: ['display_summary', 'rationale_memo'],
      max_context_tokens: 12_000,
    },
    prompt_policy: {
      prompt_template_version_id: 'prompt_template_v1',
      system_instruction_version_id: 'system_instruction_v1',
      output_schema_version_id: 'validation_cycle_planning_output_v1',
    },
    model_policy: {
      model_profile_id: 'mock.paper-implementation.validation-cycle-planner.v1',
      temperature: 0.1,
      allowed_tools: [],
    },
    output_policy: {
      required_schema: 'validation_cycle_planning_output_v1',
      natural_language_field_contract_version_id: 'nl_field_policy_v1',
      required_ref_fields: ['trace_manifest_refs', 'source_refs'],
      forbidden_outputs: ['authority_write', 'citation_from_memo'],
    },
    validation_policy: {
      schema_validation: true,
      reference_validation: true,
      trace_validation: true,
      claim_boundary_validation: true,
    },
    retry_policy: {
      max_retries: 1,
      retry_on_schema_failure: true,
      retry_on_missing_refs: true,
    },
    audit_policy: {
      save_prompt: true,
      save_input_snapshot: true,
      save_raw_output: true,
      save_parsed_output: true,
      save_validator_results: true,
    },
  } satisfies CreateAgentWorkflowHarnessRunRequest['spec'];
}

function makeTraceManifest(implementationProjectId: string): TraceManifest {
  return {
    trace_manifest_id: 'trace_manifest_1',
    implementation_project_id: implementationProjectId,
    target_ref: ref('validation_cycle', 'validation_cycle_1'),
    lineage: {
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
        log_artifact_refs: [ref('artifact', 'proposal_artifact_1')],
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
    },
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

function emptyIncludedContext(
  overrides: Partial<CreateImplementationInputSnapshotRequest['included_context']> = {},
): CreateImplementationInputSnapshotRequest['included_context'] {
  return {
    motive_version_refs: [],
    board_version_refs: [],
    assertion_refs: [],
    evidence_binding_refs: [],
    route_refs: [],
    probe_refs: [],
    experiment_plan_refs: [],
    work_order_refs: [],
    run_evidence_refs: [],
    result_packet_refs: [],
    accepted_risk_refs: [],
    human_decision_refs: [],
    trace_manifest_refs: [],
    ...overrides,
  };
}

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
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
    return `${prefix}_${next}`;
  };
}
