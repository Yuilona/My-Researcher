import assert from 'node:assert/strict';
import test from 'node:test';

import Fastify from 'fastify';
import type {
  BootstrapImplementationProjectResponse,
  RecordImplementationFeedbackEventResponse,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  CitationCandidate,
  ClaimTracePacket,
  ListTraceRepairQueueResponse,
  TraceGateResult,
  TraceManifest,
  TraceRepairQueueItem,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-trace-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionPaperProjectBridgeHandoff,
  TopicSelectionPaperProjectBridgeRecord,
  TopicSelectionPaperProjectBridgeWorkingCopyPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-paper-project-bridge-contracts';
import type {
  TopicSelectionDownstreamTopicFeedbackCreateInput,
  TopicSelectionDownstreamTopicFeedbackRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';

import { buildApp } from '../app.js';
import { PaperImplementationController } from '../controllers/paper-implementation-controller.js';
import { AppError } from '../errors/app-error.js';
import { InMemoryPaperImplementationRepository } from '../repositories/in-memory-paper-implementation-repository.js';
import { InMemoryPaperImplementationTraceRepository } from '../repositories/in-memory-paper-implementation-trace-repository.js';
import {
  PaperImplementationIntakeBootstrapService,
  type PaperImplementationDownstreamFeedbackService,
} from '../services/paper-implementation-intake-bootstrap-service.js';
import { PaperImplementationTraceKernelService } from '../services/paper-implementation-trace-kernel-service.js';
import type {
  TopicSelectionV1cDownstreamFeedbackRecheckResult,
} from '../services/topic-selection-v1c-downstream-feedback-recheck-service.js';
import { registerPaperImplementationRoutes } from './paper-implementation-routes.js';

const NOW = '2026-05-20T00:00:00.000Z';

function ref(refType: string, refId: string, versionId: string | null = null): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
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

function emptyTraceLineage() {
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

function traceLineageWithLiterature() {
  return {
    ...emptyTraceLineage(),
    literature: {
      literature_evidence_refs: [ref('literature_evidence_unit', 'literature_evidence_unit_001')],
      source_locator_refs: [ref('source_locator', 'source_locator_001')],
      citation_candidate_refs: [],
    },
  };
}

function makeBridgeHandoff(): TopicSelectionPaperProjectBridgeHandoff {
  const sourceRefs = [
    ref('topic_package', 'topic_package_001', 'v1'),
    ref('evidence_unit', 'evidence_unit_001'),
  ];
  const workingCopy: TopicSelectionPaperProjectBridgeWorkingCopyPayload = {
    editable_title: 'Working paper title',
    problem_statement: 'Problem statement.',
    contribution_summary: 'Contribution summary.',
    evaluation_plan: 'Evaluation plan.',
    initial_planning_notes: [],
    claim_ceiling: 'Bounded claim ceiling.',
    prohibited_claims: [],
    conditions: [],
    accepted_risk_refs: [],
    early_check_obligations: [],
    source_lineage_summary: {
      topic_package_id: 'topic_package_001',
    },
  };
  const bridge: TopicSelectionPaperProjectBridgeRecord = {
    paper_project_bridge_id: 'paper_project_bridge_001',
    bridge_status: 'active',
    workspace_id: 'workspace_001',
    title_card_id: 'title_card_001',
    source_promotion_decision_id: 'promotion_decision_001',
    source_promotion_decision_ref: ref('promotion_decision', 'promotion_decision_001'),
    human_promotion_decision_ref: ref('human_promotion_decision', 'human_promotion_decision_001'),
    human_confirmed_decision_ref: ref('human_confirmed_decision', 'human_confirmed_decision_001'),
    promotion_commitment_profile_id: 'promotion_commitment_profile_001',
    promotion_commitment_profile_ref: ref('promotion_commitment_profile', 'promotion_commitment_profile_001'),
    promotion_gate_check_ref: ref('promotion_gate_check', 'promotion_gate_check_001'),
    promotion_input_snapshot_id: 'promotion_input_snapshot_001',
    promotion_input_snapshot_ref: ref('promotion_input_snapshot', 'promotion_input_snapshot_001'),
    promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    topic_package_id: 'topic_package_001',
    package_version: 'v1',
    decision: 'promote_to_paper_project',
    conditions: [],
    accepted_risk_refs: [],
    allowed_refinements: [],
    early_check_obligations: [],
    stop_conditions: [],
    reopen_conditions: [],
    source_refs: sourceRefs,
    snapshot_hashes: {
      bundle_hash: 'bundle_hash_001',
      package_snapshot_hash: 'package_snapshot_hash_001',
      package_draft_input_snapshot_hash: 'package_draft_input_snapshot_hash_001',
      promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
    },
    working_copy_payload: workingCopy,
    working_copy_payload_hash: 'working_copy_payload_hash_001',
    bridge_payload_hash: 'bridge_payload_hash_001',
    paper_project_intake_ref: null,
    target_paper_project_ref: null,
    source_promotion_handoff: {} as never,
    artifact_refs: [],
    policy_version_id: 'policy_v1',
    created_by: 'system',
    created_at: NOW,
  };
  return {
    paper_project_bridge_id: bridge.paper_project_bridge_id,
    paper_project_bridge_ref: ref('paper_project_bridge', bridge.paper_project_bridge_id, bridge.bridge_payload_hash),
    bridge_status: 'active',
    source_promotion_decision_id: bridge.source_promotion_decision_id,
    source_promotion_decision_ref: bridge.source_promotion_decision_ref,
    promotion_commitment_profile_ref: bridge.promotion_commitment_profile_ref,
    promotion_input_snapshot_id: bridge.promotion_input_snapshot_id,
    promotion_input_snapshot_ref: bridge.promotion_input_snapshot_ref,
    promotion_input_snapshot_hash: bridge.promotion_input_snapshot_hash,
    topic_package_id: bridge.topic_package_id,
    package_version: bridge.package_version,
    decision: bridge.decision,
    working_copy_payload: bridge.working_copy_payload,
    working_copy_payload_hash: bridge.working_copy_payload_hash,
    bridge_payload_hash: bridge.bridge_payload_hash,
    conditions: bridge.conditions,
    accepted_risk_refs: bridge.accepted_risk_refs,
    allowed_refinements: bridge.allowed_refinements,
    early_check_obligations: bridge.early_check_obligations,
    stop_conditions: bridge.stop_conditions,
    reopen_conditions: bridge.reopen_conditions,
    source_refs: bridge.source_refs,
    snapshot_hashes: bridge.snapshot_hashes,
    paper_project_intake_ref: bridge.paper_project_intake_ref,
    target_paper_project_ref: bridge.target_paper_project_ref,
    bridge,
    source_promotion_handoff: bridge.source_promotion_handoff,
  };
}

class StubBridgeService {
  private readonly handoff = makeBridgeHandoff();

  async getPaperProjectBridgeHandoff(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionPaperProjectBridgeHandoff> {
    if (paperProjectBridgeId !== this.handoff.paper_project_bridge_id) {
      throw new AppError(404, 'NOT_FOUND', `PaperProjectBridge ${paperProjectBridgeId} not found.`);
    }
    return structuredClone(this.handoff);
  }
}

class RecordingDownstreamFeedbackService implements PaperImplementationDownstreamFeedbackService {
  readonly calls: TopicSelectionDownstreamTopicFeedbackCreateInput[] = [];

  async recordDownstreamTopicFeedback(
    input: TopicSelectionDownstreamTopicFeedbackCreateInput,
  ): Promise<TopicSelectionV1cDownstreamFeedbackRecheckResult> {
    this.calls.push(structuredClone(input));
    const feedbackId = `downstream_topic_feedback_${String(this.calls.length).padStart(3, '0')}`;
    const downstreamTopicFeedback: TopicSelectionDownstreamTopicFeedbackRecord = {
      downstream_topic_feedback_id: feedbackId,
      feedback_fingerprint: `fingerprint_${this.calls.length}`,
      workspace_id: input.workspace_id ?? null,
      title_card_id: 'title_card_001',
      paper_project_bridge_id: input.paper_project_bridge_id,
      paper_project_bridge_ref: ref('paper_project_bridge', input.paper_project_bridge_id, 'bridge_payload_hash_001'),
      source_promotion_decision_ref: ref('promotion_decision', 'promotion_decision_001'),
      promotion_commitment_profile_ref: ref('promotion_commitment_profile', 'promotion_commitment_profile_001'),
      promotion_input_snapshot_id: 'promotion_input_snapshot_001',
      promotion_input_snapshot_ref: ref('promotion_input_snapshot', 'promotion_input_snapshot_001'),
      promotion_input_snapshot_hash: 'promotion_input_snapshot_hash_001',
      topic_package_id: 'topic_package_001',
      package_version: 'v1',
      downstream_source_kind: input.downstream_source_kind,
      downstream_source_ref: input.downstream_source_ref,
      source_feedback_refs: input.source_feedback_refs ?? [],
      observed_blocker_refs: input.observed_blocker_refs ?? [],
      feedback_signal: input.feedback_signal,
      severity: input.severity,
      summary: input.summary,
      required_action: input.required_action ?? null,
      classification: {
        loopback_target: 'evidence_or_search',
        loopback_cause: input.feedback_signal,
        severity: input.severity,
        requires_recheck: true,
        affected_ref: ref('paper_project_bridge', input.paper_project_bridge_id, 'bridge_payload_hash_001'),
        affected_stage: 'paper_project_bridge',
        source_refs: [input.downstream_source_ref],
        rationale: 'route test classification',
        required_actions: input.required_action ? [input.required_action] : [],
      },
      recheck_request: {
        downstream_recheck_request_id: `downstream_recheck_request_${this.calls.length}`,
        feedback_ref: ref('downstream_topic_feedback', feedbackId),
        loopback_target: 'paper_project_bridge',
        loopback_cause: input.feedback_signal,
        affected_ref: ref('paper_project_bridge', input.paper_project_bridge_id, 'bridge_payload_hash_001'),
        required_actions: input.required_action ? [input.required_action] : [],
        reason_codes: [input.feedback_signal],
        source_refs: [input.downstream_source_ref],
        created_at: NOW,
      },
      impact_summary: {
        impact_level: 'recheck_required',
        severity: input.severity,
        loopback_target: 'paper_project_bridge',
        loopback_cause: input.feedback_signal,
        requires_recheck: true,
        affected_ref: ref('paper_project_bridge', input.paper_project_bridge_id, 'bridge_payload_hash_001'),
        summary: 'route test impact',
      },
      recheck_event_ref: null,
      recheck_impact_ref: null,
      decision_work_queue_item_ref: null,
      artifact_refs: input.artifact_refs ?? [],
      payload: input.feedback_payload ?? {},
      policy_version_id: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
      created_at: NOW,
    };
    return {
      downstream_topic_feedback: downstreamTopicFeedback,
      classification: downstreamTopicFeedback.classification,
      recheck_request: downstreamTopicFeedback.recheck_request ?? null,
      impact_summary: downstreamTopicFeedback.impact_summary,
    };
  }
}

function makeRealService(): {
  downstreamFeedback: RecordingDownstreamFeedbackService;
  service: PaperImplementationIntakeBootstrapService;
  traceKernel: PaperImplementationTraceKernelService;
} {
  const downstreamFeedback = new RecordingDownstreamFeedbackService();
  const repository = new InMemoryPaperImplementationRepository();
  const traceRepository = new InMemoryPaperImplementationTraceRepository();
  const idFactory = makeIdFactory();
  return {
    downstreamFeedback,
    service: new PaperImplementationIntakeBootstrapService({
      repository,
      paperProjectBridgeService: new StubBridgeService(),
      downstreamFeedbackService: downstreamFeedback,
      idFactory,
      now: () => NOW,
    }),
    traceKernel: new PaperImplementationTraceKernelService({
      projectRepository: repository,
      traceRepository,
      idFactory,
      now: () => NOW,
    }),
  };
}

test('buildApp registers PaperImplementation routes and drives bootstrap happy path', async () => {
  const downstreamFeedback = new RecordingDownstreamFeedbackService();
  const app = buildApp({
    paperImplementationRepository: new InMemoryPaperImplementationRepository(),
    paperImplementationTraceRepository: new InMemoryPaperImplementationTraceRepository(),
    paperImplementationBridgeService: new StubBridgeService(),
    paperImplementationDownstreamFeedbackService: downstreamFeedback,
  });
  try {
    const malformed = await app.inject({
      method: 'POST',
      url: '/paper-implementation/projects/bootstrap',
      payload: {
        paper_project_bridge_id: 'paper_project_bridge_001',
      },
    });
    assert.equal(malformed.statusCode, 400);
    assert.equal((malformed.json() as { error: { code: string } }).error.code, 'INVALID_PAYLOAD');

    const missing = await app.inject({
      method: 'GET',
      url: '/paper-implementation/projects/implementation_project_missing',
    });
    assert.equal(missing.statusCode, 404);
    assert.equal((missing.json() as { error: { code: string } }).error.code, 'NOT_FOUND');

    const created = await app.inject({
      method: 'POST',
      url: '/paper-implementation/projects/bootstrap',
      payload: {
        paper_project_bridge_id: 'paper_project_bridge_001',
        bridge_payload_hash: 'bridge_payload_hash_001',
      },
    });
    assert.equal(created.statusCode, 201);
    const createdBody = created.json() as BootstrapImplementationProjectResponse;
    assert.equal(createdBody.project_created, true);
    const projectId = createdBody.implementation_project.implementation_project_id;

    const duplicate = await app.inject({
      method: 'POST',
      url: '/paper-implementation/projects/bootstrap',
      payload: {
        paper_project_bridge_id: 'paper_project_bridge_001',
        bridge_payload_hash: 'bridge_payload_hash_001',
      },
    });
    assert.equal(duplicate.statusCode, 200);
    assert.equal((duplicate.json() as BootstrapImplementationProjectResponse).project_created, false);

    const feedback = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(createdBody.implementation_project.implementation_project_id)}/feedback-events`,
      payload: {
        feedback_type: 'lower_claim_ceiling',
        severity: 'warning',
        summary: 'The observed result lowers the admissible claim ceiling.',
      },
    });
    assert.equal(feedback.statusCode, 201);
    assert.equal(
      (feedback.json() as RecordImplementationFeedbackEventResponse).feedback_event.feedback_status,
      'recheck_requested',
    );
    assert.equal(downstreamFeedback.calls[0]?.downstream_source_kind, 'paper_implementation');

    const malformedTrace = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-manifests`,
      payload: {
        target_ref: ref('core_motive_version', 'core_motive_version_001', 'v1'),
      },
    });
    assert.equal(malformedTrace.statusCode, 400);
    assert.equal((malformedTrace.json() as { error: { code: string } }).error.code, 'INVALID_PAYLOAD');

    const trace = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-manifests`,
      payload: {
        target_ref: ref('core_motive_version', 'core_motive_version_001', 'v1'),
        lineage: traceLineageWithLiterature(),
        integrity: {
          missing_refs: [ref('source_locator', 'source_locator_missing')],
        },
      },
    });
    assert.equal(trace.statusCode, 201);
    const traceBody = trace.json() as TraceManifest;
    assert.equal(traceBody.trace_status, 'broken');
    assert.equal(traceBody.missing_ref_count, 1);

    const missingManifest = await app.inject({
      method: 'GET',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-manifests/trace_manifest_missing`,
    });
    assert.equal(missingManifest.statusCode, 404);
    assert.equal((missingManifest.json() as { error: { code: string } }).error.code, 'NOT_FOUND');

    const gate = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-gates/evaluate`,
      payload: {
        trace_manifest_id: traceBody.trace_manifest_id,
      },
    });
    assert.equal(gate.statusCode, 200);
    assert.equal((gate.json() as TraceGateResult).gate_status, 'blocked');

    const nonCitableCandidate = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/citation-candidates`,
      payload: {
        trace_manifest_id: traceBody.trace_manifest_id,
        source_kind: 'literature_evidence_unit',
        source_type: 'paper',
        source_id: 'literature_source_001',
        source_evidence_unit_ref: ref('literature_evidence_unit', 'literature_evidence_unit_001'),
        source_locator_id: 'source_locator_missing',
        locator_quality: 'missing',
        locator: {},
        cited_for: ['method_prior_art'],
        linked_target_refs: [traceBody.target_ref],
        normalized_source_statement: 'A citable statement needs an exact locator.',
      },
    });
    assert.equal(nonCitableCandidate.statusCode, 409);
    assert.equal((nonCitableCandidate.json() as { error: { code: string } }).error.code, 'GATE_CONSTRAINT_FAILED');

    const queue = await app.inject({
      method: 'GET',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-repair-queue`,
    });
    assert.equal(queue.statusCode, 200);
    const queueItems = (queue.json() as ListTraceRepairQueueResponse).items;
    assert.equal(queueItems.length, 1);
    assert.equal(queueItems[0]?.status, 'open');

    const resolved = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-repair-queue/${encodeURIComponent(queueItems[0]?.queue_item_id ?? '')}/resolve`,
      payload: {
        resolution_note: 'Locator was replaced by a newer trace manifest.',
      },
    });
    assert.equal(resolved.statusCode, 200);
    assert.equal((resolved.json() as TraceRepairQueueItem).status, 'resolved');

    const fetchedTrace = await app.inject({
      method: 'GET',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-manifests/${encodeURIComponent(traceBody.trace_manifest_id)}`,
    });
    assert.equal(fetchedTrace.statusCode, 200);
    assert.equal((fetchedTrace.json() as TraceManifest).trace_status, 'broken');
  } finally {
    await app.close();
  }
});

test('PaperImplementation routes expose bootstrap, idempotent duplicate, stale hash, and feedback behavior through real service', async () => {
  const app = Fastify({ logger: false });
  const { downstreamFeedback, service, traceKernel } = makeRealService();
  await registerPaperImplementationRoutes(app, new PaperImplementationController(service, traceKernel));
  try {
    const created = await app.inject({
      method: 'POST',
      url: '/paper-implementation/projects/bootstrap',
      payload: {
        paper_project_bridge_id: 'paper_project_bridge_001',
        bridge_payload_hash: 'bridge_payload_hash_001',
      },
    });
    assert.equal(created.statusCode, 201);
    const createdBody = created.json() as BootstrapImplementationProjectResponse;
    assert.equal(createdBody.project_created, true);
    assert.equal(createdBody.implementation_project.paper_project_bridge_id, 'paper_project_bridge_001');

    const duplicate = await app.inject({
      method: 'POST',
      url: '/paper-implementation/projects/bootstrap',
      payload: {
        paper_project_bridge_id: 'paper_project_bridge_001',
        bridge_payload_hash: 'bridge_payload_hash_001',
      },
    });
    assert.equal(duplicate.statusCode, 200);
    assert.equal((duplicate.json() as BootstrapImplementationProjectResponse).project_created, false);

    const stale = await app.inject({
      method: 'POST',
      url: '/paper-implementation/projects/bootstrap',
      payload: {
        paper_project_bridge_id: 'paper_project_bridge_001',
        bridge_payload_hash: 'stale_hash',
      },
    });
    assert.equal(stale.statusCode, 409);
    assert.equal((stale.json() as { error: { code: string } }).error.code, 'VERSION_CONFLICT');

    const feedback = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(createdBody.implementation_project.implementation_project_id)}/feedback-events`,
      payload: {
        feedback_type: 'infeasible_route',
        severity: 'blocking',
        summary: 'The route is infeasible.',
      },
    });
    assert.equal(feedback.statusCode, 201);
    assert.equal(
      (feedback.json() as RecordImplementationFeedbackEventResponse).feedback_event.feedback_status,
      'recheck_requested',
    );
    assert.equal(downstreamFeedback.calls.length, 1);
    assert.equal(downstreamFeedback.calls[0]?.downstream_source_kind, 'paper_implementation');
    assert.equal(downstreamFeedback.calls[0]?.feedback_signal, 'paper_project_constraint_conflict');

    const projectId = createdBody.implementation_project.implementation_project_id;
    const trace = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/trace-manifests`,
      payload: {
        target_ref: ref('claim_candidate', 'claim_candidate_001', 'v1'),
        lineage: traceLineageWithLiterature(),
      },
    });
    assert.equal(trace.statusCode, 201);
    const traceBody = trace.json() as TraceManifest;
    assert.equal(traceBody.trace_status, 'complete');

    const citation = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/citation-candidates`,
      payload: {
        trace_manifest_id: traceBody.trace_manifest_id,
        source_kind: 'literature_evidence_unit',
        source_type: 'paper',
        source_id: 'literature_source_001',
        source_evidence_unit_ref: ref('literature_evidence_unit', 'literature_evidence_unit_001'),
        source_locator_id: 'source_locator_001',
        locator_quality: 'exact',
        locator: {
          section: '3.1',
          paragraph: '2',
        },
        cited_for: ['method_prior_art'],
        linked_target_refs: [traceBody.target_ref],
        normalized_source_statement: 'The prior paper establishes the comparison point.',
      },
    });
    assert.equal(citation.statusCode, 201);
    assert.equal((citation.json() as CitationCandidate).status, 'candidate');

    const claimPacket = await app.inject({
      method: 'POST',
      url: `/paper-implementation/projects/${encodeURIComponent(projectId)}/claim-trace-packets`,
      payload: {
        claim_ref: ref('claim_candidate', 'claim_candidate_001', 'v1'),
        claim_statement: 'The implementation improves the target workflow under the bounded setting.',
        trace_manifest_id: traceBody.trace_manifest_id,
        lineage: {
          ...emptyTraceLineage(),
          literature: {
            ...emptyTraceLineage().literature,
            citation_candidate_refs: [ref('citation_candidate', 'citation_candidate_001')],
          },
        },
        challenge: {
          challenging_result_refs: [],
          counter_evidence_refs: [],
          unresolved_objections: [],
        },
        scope: {
          task_scope: 'bounded implementation workflow',
        },
        boundary: {
          forbidden_overclaims: ['Do not claim general superiority.'],
          claim_strength: 'tentative',
          human_confirmation_required: true,
        },
      },
    });
    assert.equal(claimPacket.statusCode, 201);
    assert.equal((claimPacket.json() as ClaimTracePacket).claim_ref.ref_id, 'claim_candidate_001');
  } finally {
    await app.close();
  }
});
