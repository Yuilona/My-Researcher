import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  TopicSelectionPromotionBridgeHandoff,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-human-promotion-decision-contracts';

import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionV1cPaperProjectBridgeRepository } from '../repositories/in-memory-topic-selection-v1c-paper-project-bridge-repository.js';
import { InMemoryTopicSelectionV1cPromotionInputRepository } from '../repositories/in-memory-topic-selection-v1c-promotion-input-repository.js';
import type {
  TopicSelectionV1cPaperProjectBridgePersistence,
} from '../repositories/topic-selection-v1c-paper-project-bridge.repository.js';
import type {
  TopicSelectionV1cPromotionInputPersistence,
} from '../repositories/topic-selection-v1c-promotion-input.repository.js';
import {
  createTopicSelectionV1cAcceptanceGraph,
  createTopicSelectionV1cAcceptanceIdFactory,
  createTopicSelectionV1cPromotionBridgeHandoffFixture,
  TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  topicSelectionV1cAcceptanceRef,
  TopicSelectionV1cAcceptanceTopicPackageRepository,
} from './topic-selection-v1c-acceptance-scenario-fixtures.js';
import {
  TopicSelectionV1cPaperProjectBridgeService,
} from './topic-selection-v1c-paper-project-bridge-service.js';
import {
  TopicSelectionV1cPromotionInputService,
} from './topic-selection-v1c-promotion-input-service.js';

class RecordingPromotionInputRepository extends InMemoryTopicSelectionV1cPromotionInputRepository {
  readonly writes: TopicSelectionV1cPromotionInputPersistence[] = [];

  override async createSnapshot(
    persistence: TopicSelectionV1cPromotionInputPersistence,
  ) {
    this.writes.push(persistence);
    return super.createSnapshot(persistence);
  }
}

class RecordingPaperProjectBridgeRepository extends InMemoryTopicSelectionV1cPaperProjectBridgeRepository {
  readonly writes: TopicSelectionV1cPaperProjectBridgePersistence[] = [];

  override async createBridge(
    persistence: TopicSelectionV1cPaperProjectBridgePersistence,
  ) {
    this.writes.push(persistence);
    return super.createBridge(persistence);
  }
}

class MutablePromotionBridgeHandoffProvider {
  constructor(public handoff: TopicSelectionPromotionBridgeHandoff) {}

  async getPromotionBridgeHandoff(
    promotionDecisionId: string,
  ): Promise<TopicSelectionPromotionBridgeHandoff> {
    if (promotionDecisionId !== this.handoff.promotion_decision_id) {
      throw new AppError(404, 'NOT_FOUND', `PromotionDecision ${promotionDecisionId} not found.`);
    }
    return this.handoff;
  }
}

function makePromotionInputAcceptanceSubject(
  graph = createTopicSelectionV1cAcceptanceGraph(),
) {
  const repository = new RecordingPromotionInputRepository();
  const topicPackageRepository = new TopicSelectionV1cAcceptanceTopicPackageRepository(graph);
  const service = new TopicSelectionV1cPromotionInputService({
    repository,
    topicPackageRepository,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  return {
    graph,
    repository,
    service,
    topicPackageRepository,
  };
}

function makeBridgeAcceptanceSubject(
  handoff = createTopicSelectionV1cPromotionBridgeHandoffFixture(),
) {
  const repository = new RecordingPaperProjectBridgeRepository();
  const handoffProvider = new MutablePromotionBridgeHandoffProvider(handoff);
  const service = new TopicSelectionV1cPaperProjectBridgeService({
    repository,
    humanPromotionDecisionService: handoffProvider,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  return {
    handoffProvider,
    repository,
    service,
  };
}

test('T-108 N1 ready snapshot preserves carry-forward refs and has no LLM/downstream authority', async () => {
  const blockerRef = topicSelectionV1cAcceptanceRef('topic_selection_blocker', 'blocker_001');
  const subject = makePromotionInputAcceptanceSubject(createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      blocker_refs: [blockerRef],
    },
  }));

  const snapshot = await subject.service.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  const handoff = await subject.service.getPromotionInputHandoff(snapshot.promotion_input_snapshot_id);
  const write = subject.repository.writes[0];

  assert.equal(snapshot.closure_status, 'ready_for_gate');
  assert.equal(handoff.closure_status, 'ready_for_gate');
  assert.deepEqual(handoff.accepted_risk_refs, [
    topicSelectionV1cAcceptanceRef('accepted_risk', 'accepted_risk_001'),
  ]);
  assert.deepEqual(handoff.blocker_refs, [blockerRef]);
  assert.deepEqual(handoff.memory_suggestion_refs, [
    topicSelectionV1cAcceptanceRef('memory_suggestion', 'memory_suggestion_001'),
  ]);
  assert.deepEqual(handoff.recheck_request_refs, [
    topicSelectionV1cAcceptanceRef('recheck_request', 'recheck_request_001'),
  ]);
  assert.equal(write?.control_plane.workflow_run.provider_id, null);
  assert.equal(write?.control_plane.workflow_run.model_id, null);
  assert.equal(write?.control_plane.workflow_run.prompt_template_id, null);
  assert.deepEqual(
    write?.control_plane.transition_attempt.created_authority_refs.map((ref) => ref.ref_type),
    ['promotion_input_snapshot'],
  );
});

test('T-108 N1 malformed and workspace-drift entries fail before snapshot persistence', async () => {
  const subject = makePromotionInputAcceptanceSubject();

  await assert.rejects(
    () => subject.service.createPromotionInputSnapshot({
      v1b_to_v1c_input_bundle_id: 'missing_v1b_to_v1c_input_bundle',
    }),
    (error) => error instanceof AppError && error.errorCode === 'NOT_FOUND',
  );
  await assert.rejects(
    () => subject.service.createPromotionInputSnapshot({
      v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
      workspace_id: 'workspace_other',
    }),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );

  assert.equal(subject.repository.writes.length, 0);
});

test('T-108 N1 non-ready diagnostic snapshot stops handoff and remains idempotency-safe', async () => {
  const subject = makePromotionInputAcceptanceSubject(createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      package_readiness_status: 'needs_revision',
    },
  }));

  const snapshot = await subject.service.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });

  assert.equal(snapshot.closure_status, 'needs_upstream_refresh');
  assert.equal(snapshot.stop_condition_code, 'topic_package_not_ready_for_promotion_review');
  await assert.rejects(
    () => subject.service.getPromotionInputHandoff(snapshot.promotion_input_snapshot_id),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
  assert.equal(subject.repository.writes.length, 1);

  subject.topicPackageRepository.putBundle({
    ...subject.graph.bundle,
    bundle_hash: 'changed_bundle_hash',
  }, true);
  await assert.rejects(
    () => subject.service.createPromotionInputSnapshot({
      v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
    }),
    (error) => error instanceof AppError && error.errorCode === 'VERSION_CONFLICT',
  );
  assert.equal(subject.repository.writes.length, 1);
});

test('T-108 N5 bridge-ready path is deterministic and creates no downstream intake authority', async () => {
  const subject = makeBridgeAcceptanceSubject();

  const result = await subject.service.createPaperProjectBridge({
    promotion_decision_id: 'promotion_decision_001',
  });
  const write = subject.repository.writes[0];

  assert.equal(result.paper_project_bridge.bridge_status, 'active');
  assert.equal(result.paper_project_bridge.paper_project_intake_ref, null);
  assert.equal(result.paper_project_bridge.target_paper_project_ref, null);
  assert.equal(result.paper_project_bridge.working_copy_payload.editable_title, 'Working paper title');
  assert.equal(result.paper_project_bridge.working_copy_payload.contribution_summary, 'A focused contribution summary.');
  assert.equal(result.paper_project_bridge.working_copy_payload.evaluation_plan, 'A bounded evaluation plan.');
  assert.equal(result.paper_project_bridge.working_copy_payload.claim_ceiling, 'Correlation and mechanism claims only.');
  assert.equal(write?.control_plane.workflow_run.provider_id, null);
  assert.equal(write?.control_plane.workflow_run.model_id, null);
  assert.equal(
    (write?.control_plane.workflow_run.telemetry as { deterministic_bridge_creation?: boolean } | undefined)
      ?.deterministic_bridge_creation,
    true,
  );
  assert.deepEqual(
    write?.control_plane.transition_attempt.created_authority_refs.map((ref) => ref.ref_type),
    ['paper_project_bridge'],
  );
});

test('T-108 N5 invalid entry and missing bridge semantics create no half-built bridge', async () => {
  const invalidEntrySubject = makeBridgeAcceptanceSubject();
  await assert.rejects(
    () => invalidEntrySubject.service.createPaperProjectBridge({
      promotion_decision_id: 'missing_promotion_decision',
    }),
    (error) => error instanceof AppError && error.errorCode === 'NOT_FOUND',
  );
  assert.equal(invalidEntrySubject.repository.writes.length, 0);

  const ineligible = createTopicSelectionV1cPromotionBridgeHandoffFixture({
    promotion_decision: {
      ...createTopicSelectionV1cPromotionBridgeHandoffFixture().promotion_decision,
      bridge_eligible: false,
    },
  });
  const ineligibleSubject = makeBridgeAcceptanceSubject(ineligible);
  await assert.rejects(
    () => ineligibleSubject.service.createPaperProjectBridge({
      promotion_decision_id: 'promotion_decision_001',
    }),
    (error) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
  assert.equal(ineligibleSubject.repository.writes.length, 0);

  const missingSemantic = createTopicSelectionV1cPromotionBridgeHandoffFixture();
  const scope = missingSemantic.promotion_commitment_profile.scope as Record<string, unknown>;
  const excerpt = scope.source_snapshot_excerpt as Record<string, unknown>;
  excerpt.selected_evidence_refs = [];
  const missingSemanticSubject = makeBridgeAcceptanceSubject(missingSemantic);
  await assert.rejects(
    () => missingSemanticSubject.service.createPaperProjectBridge({
      promotion_decision_id: 'promotion_decision_001',
    }),
    (error) =>
      error instanceof AppError
      && error.errorCode === 'GATE_CONSTRAINT_FAILED'
      && /selected_evidence_refs/.test(error.message),
  );
  assert.equal(missingSemanticSubject.repository.writes.length, 0);
});

test('T-108 N5 exact replay is idempotent and source handoff drift returns version conflict', async () => {
  const subject = makeBridgeAcceptanceSubject();
  const first = await subject.service.createPaperProjectBridge({
    promotion_decision_id: 'promotion_decision_001',
  });
  const second = await subject.service.createPaperProjectBridge({
    promotion_decision_id: 'promotion_decision_001',
  });

  assert.equal(second.paper_project_bridge.paper_project_bridge_id, first.paper_project_bridge.paper_project_bridge_id);
  assert.equal(subject.repository.writes.length, 1);

  const drifted = createTopicSelectionV1cPromotionBridgeHandoffFixture();
  drifted.promotion_commitment_profile.scope = {
    ...drifted.promotion_commitment_profile.scope,
    contribution_summary: 'A drifted contribution summary.',
  };
  subject.handoffProvider.handoff = drifted;

  await assert.rejects(
    () => subject.service.createPaperProjectBridge({
      promotion_decision_id: 'promotion_decision_001',
    }),
    (error) =>
      error instanceof AppError
      && error.errorCode === 'VERSION_CONFLICT'
      && /source handoff drifted/.test(error.message),
  );
  assert.equal(subject.repository.writes.length, 1);
});
