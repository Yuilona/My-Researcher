#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-downstream-feedback-recheck-repository.ts';
import { InMemoryTopicSelectionV1cHumanPromotionDecisionRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-human-promotion-decision-repository.ts';
import { InMemoryTopicSelectionV1cPaperProjectBridgeRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-paper-project-bridge-repository.ts';
import { InMemoryTopicSelectionV1cPromotionGateRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-promotion-gate-repository.ts';
import { InMemoryTopicSelectionV1cPromotionInputRepository } from '../../apps/backend/src/repositories/in-memory-topic-selection-v1c-promotion-input-repository.ts';
import {
  TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
  normalizeN1PromotionInputSnapshot,
  normalizeN2PromotionSupport,
  normalizeN3PromotionGate,
  normalizeN4HumanPromotionDecision,
  normalizeN5PaperProjectBridge,
  normalizeN6DownstreamFeedback,
} from '../../apps/backend/src/services/topic-selection-v1c-harness-adapter.ts';
import {
  createTopicSelectionV1cAcceptanceGraph,
  createTopicSelectionV1cAcceptanceIdFactory,
  createTopicSelectionV1cPromotionConditionFixture,
  TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  topicSelectionV1cAcceptanceRef,
  TopicSelectionV1cAcceptanceTopicPackageRepository,
} from '../../apps/backend/src/services/topic-selection-v1c-acceptance-scenario-fixtures.ts';
import { TopicSelectionV1cDownstreamFeedbackRecheckService } from '../../apps/backend/src/services/topic-selection-v1c-downstream-feedback-recheck-service.ts';
import { TopicSelectionV1cHumanPromotionDecisionService } from '../../apps/backend/src/services/topic-selection-v1c-human-promotion-decision-service.ts';
import { TopicSelectionV1cPaperProjectBridgeService } from '../../apps/backend/src/services/topic-selection-v1c-paper-project-bridge-service.ts';
import { TopicSelectionV1cPromotionGateService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-gate-service.ts';
import { TopicSelectionV1cPromotionInputService } from '../../apps/backend/src/services/topic-selection-v1c-promotion-input-service.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const STARTED_AT = new Date().toISOString();
const RUN_ID = process.env.TOPIC_SELECTION_V1C_ACCEPTANCE_RUN_ID?.trim()
  || `v1c-harness-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1c-acceptance', RUN_ID);
const execFileAsync = promisify(execFile);

class RecordingPromotionInputRepository extends InMemoryTopicSelectionV1cPromotionInputRepository {
  writes = [];

  async createSnapshot(persistence) {
    this.writes.push(persistence);
    return super.createSnapshot(persistence);
  }
}

class RecordingPromotionGateRepository extends InMemoryTopicSelectionV1cPromotionGateRepository {
  writes = [];
  supportWrites = [];
  gateCheckWrites = [];

  async createBundle(persistence) {
    this.writes.push(persistence);
    return super.createBundle(persistence);
  }

  async createSupportBundle(persistence) {
    this.supportWrites.push(persistence);
    return super.createSupportBundle(persistence);
  }

  async createGateCheckBundle(persistence) {
    this.gateCheckWrites.push(persistence);
    return super.createGateCheckBundle(persistence);
  }
}

class RecordingHumanPromotionDecisionRepository extends InMemoryTopicSelectionV1cHumanPromotionDecisionRepository {
  writes = [];

  async createBundle(persistence) {
    this.writes.push(persistence);
    return super.createBundle(persistence);
  }
}

class RecordingPaperProjectBridgeRepository extends InMemoryTopicSelectionV1cPaperProjectBridgeRepository {
  writes = [];

  async createBridge(persistence) {
    this.writes.push(persistence);
    return super.createBridge(persistence);
  }
}

class RecordingDownstreamFeedbackRepository extends InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository {
  writes = [];

  async createFeedback(record) {
    this.writes.push(record);
    return super.createFeedback(record);
  }
}

class RecordingRecheckSink {
  calls = [];

  async recordDownstreamFeedback(input) {
    this.calls.push({
      source_ref: input.source_ref,
      affected_ref: input.affected_ref,
      feedback_type: input.feedback_type,
      reason_codes: input.reason_codes,
      summary: input.summary,
    });
    const suffix = String(this.calls.length).padStart(3, '0');
    return {
      event: {
        recheck_event_id: `recheck_event_${suffix}`,
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
      },
      impact: {
        recheck_impact_id: `recheck_impact_${suffix}`,
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
      },
      queue_item: {
        decision_work_queue_item_id: `decision_work_queue_item_${suffix}`,
        workspace_id: input.workspace_id ?? null,
        title_card_id: input.title_card_id ?? null,
      },
    };
  }
}

function createReadyGraph() {
  return createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      package_payload: {
        claim_ceiling: 'Correlation and mechanism claims only.',
      },
      recheck_request_refs: [],
    },
  });
}

function createActionRequiredGraph() {
  return createTopicSelectionV1cAcceptanceGraph({
    packageOverrides: {
      contribution_summary: '',
      package_payload: {
        claim_ceiling: 'Correlation and mechanism claims only.',
      },
      recheck_request_refs: [],
    },
  });
}

function createWorkflowSubject(graph = createReadyGraph()) {
  const promotionInputRepository = new RecordingPromotionInputRepository();
  const promotionGateRepository = new RecordingPromotionGateRepository();
  const humanPromotionDecisionRepository = new RecordingHumanPromotionDecisionRepository();
  const paperProjectBridgeRepository = new RecordingPaperProjectBridgeRepository();
  const downstreamFeedbackRepository = new RecordingDownstreamFeedbackRepository();
  const recheckSink = new RecordingRecheckSink();
  const promotionInputService = new TopicSelectionV1cPromotionInputService({
    repository: promotionInputRepository,
    topicPackageRepository: new TopicSelectionV1cAcceptanceTopicPackageRepository(graph),
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const promotionGateService = new TopicSelectionV1cPromotionGateService({
    repository: promotionGateRepository,
    promotionInputService,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const humanPromotionDecisionService = new TopicSelectionV1cHumanPromotionDecisionService({
    repository: humanPromotionDecisionRepository,
    promotionGateService,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const paperProjectBridgeService = new TopicSelectionV1cPaperProjectBridgeService({
    repository: paperProjectBridgeRepository,
    humanPromotionDecisionService,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  const downstreamFeedbackService = new TopicSelectionV1cDownstreamFeedbackRecheckService({
    repository: downstreamFeedbackRepository,
    paperProjectBridgeService,
    recheckRiskMemoryService: recheckSink,
    idFactory: createTopicSelectionV1cAcceptanceIdFactory(),
    now: () => TOPIC_SELECTION_V1C_ACCEPTANCE_TIMESTAMP,
  });
  return {
    graph,
    promotionInputRepository,
    promotionGateRepository,
    humanPromotionDecisionRepository,
    paperProjectBridgeRepository,
    downstreamFeedbackRepository,
    recheckSink,
    promotionInputService,
    promotionGateService,
    humanPromotionDecisionService,
    paperProjectBridgeService,
    downstreamFeedbackService,
  };
}

async function createSplitGateSupport(subject, promotionInputSnapshotId) {
  const supportBundle = await subject.promotionGateService.createPromotionDecisionSupport({
    promotion_input_snapshot_id: promotionInputSnapshotId,
  });
  const gateBundle = await subject.promotionGateService.createPromotionGateCheckFromSupport({
    promotion_decision_support_id: supportBundle.promotion_decision_support.promotion_decision_support_id,
  });
  return {
    ...gateBundle,
    supportBundle,
  };
}

async function runHappyBridgeChain(subject = createWorkflowSubject()) {
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeN2PromotionSupport(gateSupport.supportBundle));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  const humanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision({
    promotion_gate_check_id: gateSupport.promotion_gate_check.promotion_gate_check_id,
    decision: 'promote_with_conditions',
    human_actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    rationale: 'Ready for bridge materialization with explicit condition.',
    confirmed_snapshot_hash: gateSupport.handoff.promotion_input_snapshot_hash,
    conditions: [createTopicSelectionV1cPromotionConditionFixture()],
  });
  nodeTrace.push(normalizeN4HumanPromotionDecision(humanDecision));

  const bridge = await subject.paperProjectBridgeService.createPaperProjectBridge({
    promotion_decision_id: humanDecision.promotion_decision.promotion_decision_id,
  });
  nodeTrace.push(normalizeN5PaperProjectBridge({
    bridge: bridge.paper_project_bridge,
    handoff: bridge.handoff,
  }));

  return {
    subject,
    nodeTrace,
    promotionInputSnapshot,
    gateSupport,
    humanDecision,
    bridge,
  };
}

async function runActionRequiredStop() {
  const subject = createWorkflowSubject(createActionRequiredGraph());
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeN2PromotionSupport(gateSupport.supportBundle));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  assert.equal(gateSupport.promotion_gate_check.promote_allowed, false);
  assert.equal(subject.humanPromotionDecisionRepository.writes.length, 0);
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    gateSupport,
  };
}

async function runReadyGateOnly() {
  const subject = createWorkflowSubject();
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeN2PromotionSupport(gateSupport.supportBundle));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  assert.equal(gateSupport.promotion_gate_check.disposition, 'ready_for_human_decision');
  assert.equal(subject.humanPromotionDecisionRepository.writes.length, 0);
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    gateSupport,
  };
}

async function runN4NoBridgeCreationScenario() {
  const subject = createWorkflowSubject();
  const nodeTrace = [];
  const promotionInputSnapshot = await subject.promotionInputService.createPromotionInputSnapshot({
    v1b_to_v1c_input_bundle_id: subject.graph.bundle.v1b_to_v1c_input_bundle_id,
  });
  nodeTrace.push(normalizeN1PromotionInputSnapshot(promotionInputSnapshot));

  const gateSupport = await createSplitGateSupport(subject, promotionInputSnapshot.promotion_input_snapshot_id);
  nodeTrace.push(normalizeN2PromotionSupport(gateSupport.supportBundle));
  nodeTrace.push(normalizeN3PromotionGate(gateSupport.handoff));

  const humanDecision = await subject.humanPromotionDecisionService.recordHumanPromotionDecision({
    promotion_gate_check_id: gateSupport.promotion_gate_check.promotion_gate_check_id,
    decision: 'promote_with_conditions',
    human_actor: {
      actor_type: 'human',
      actor_id: 'reviewer_001',
    },
    rationale: 'Authorize bridge, but do not materialize N5 inside N4.',
    confirmed_snapshot_hash: gateSupport.handoff.promotion_input_snapshot_hash,
    conditions: [createTopicSelectionV1cPromotionConditionFixture()],
  });
  const n4Node = normalizeN4HumanPromotionDecision(humanDecision);
  nodeTrace.push(n4Node);

  assert.equal(n4Node.routing_outcome, 'bridge_authorized');
  assert.equal(subject.paperProjectBridgeRepository.writes.length, 0);
  assert.equal(subject.downstreamFeedbackRepository.writes.length, 0);
  return {
    subject,
    nodeTrace,
    gateSupport,
    humanDecision,
    n4Node,
  };
}

async function runReplayScenario() {
  const subject = createWorkflowSubject();
  const first = await runHappyBridgeChain(subject);
  const second = await runHappyBridgeChain(subject);
  assert.equal(
    second.promotionInputSnapshot.promotion_input_snapshot_id,
    first.promotionInputSnapshot.promotion_input_snapshot_id,
  );
  assert.equal(
    second.gateSupport.promotion_gate_check.promotion_gate_check_id,
    first.gateSupport.promotion_gate_check.promotion_gate_check_id,
  );
  assert.equal(
    second.humanDecision.promotion_decision.promotion_decision_id,
    first.humanDecision.promotion_decision.promotion_decision_id,
  );
  assert.equal(
    second.bridge.paper_project_bridge.paper_project_bridge_id,
    first.bridge.paper_project_bridge.paper_project_bridge_id,
  );
  assert.deepEqual(workflowWriteCounts(subject), {
    promotion_input_snapshot: 1,
    promotion_decision_support: 1,
    promotion_gate_check: 1,
    human_promotion_decision: 1,
    paper_project_bridge: 1,
    downstream_feedback: 0,
    recheck_sink_calls: 0,
  });
  return {
    subject,
    first,
    second,
  };
}

async function runN6NoRecheckScenario() {
  const chain = await runHappyBridgeChain();
  const beforeCounts = workflowWriteCounts(chain.subject);
  const feedback = await chain.subject.downstreamFeedbackService.recordDownstreamTopicFeedback({
    paper_project_bridge_id: chain.bridge.paper_project_bridge.paper_project_bridge_id,
    workspace_id: 'workspace_001',
    downstream_source_kind: 'reviewer_check',
    downstream_source_ref: topicSelectionV1cAcceptanceRef('reviewer_check', 'reviewer_check_no_recheck_001'),
    source_feedback_refs: [topicSelectionV1cAcceptanceRef('review_comment', 'review_comment_no_recheck_001')],
    feedback_signal: 'no_recheck_needed',
    severity: 'info',
    summary: 'Reviewer confirms the bridge remains usable without recheck.',
    created_by: 'system',
  });
  const n6Node = normalizeN6DownstreamFeedback(feedback.downstream_topic_feedback);
  const afterCounts = workflowWriteCounts(chain.subject);
  assert.equal(n6Node.routing_outcome, 'feedback_recorded');
  assert.equal(feedback.recheck_request, null);
  assert.equal(afterCounts.downstream_feedback, beforeCounts.downstream_feedback + 1);
  assert.equal(afterCounts.recheck_sink_calls, beforeCounts.recheck_sink_calls);
  assert.deepEqual(
    {
      ...afterCounts,
      downstream_feedback: beforeCounts.downstream_feedback,
    },
    beforeCounts,
  );
  return {
    ...chain,
    feedback,
    n6Node,
    beforeCounts,
    afterCounts,
  };
}

async function runN6NoAutoLoopScenario() {
  const chain = await runHappyBridgeChain();
  const beforeCounts = workflowWriteCounts(chain.subject);
  const feedback = await chain.subject.downstreamFeedbackService.recordDownstreamTopicFeedback({
    paper_project_bridge_id: chain.bridge.paper_project_bridge.paper_project_bridge_id,
    workspace_id: 'workspace_001',
    downstream_source_kind: 'reviewer_check',
    downstream_source_ref: topicSelectionV1cAcceptanceRef('reviewer_check', 'reviewer_check_001'),
    source_feedback_refs: [topicSelectionV1cAcceptanceRef('review_comment', 'review_comment_001')],
    feedback_signal: 'stale_evidence',
    severity: 'blocking',
    summary: 'The selected evidence is stale for the current paper framing.',
    required_action: 'Refresh selected evidence before continuing.',
    created_by: 'system',
  });
  const n6Node = normalizeN6DownstreamFeedback(feedback.downstream_topic_feedback);
  const afterCounts = workflowWriteCounts(chain.subject);
  assert.deepEqual(
    {
      ...afterCounts,
      downstream_feedback: beforeCounts.downstream_feedback,
      recheck_sink_calls: beforeCounts.recheck_sink_calls,
    },
    beforeCounts,
  );
  assert.equal(afterCounts.downstream_feedback, 1);
  assert.equal(afterCounts.recheck_sink_calls, 1);
  return {
    ...chain,
    feedback,
    n6Node,
    beforeCounts,
    afterCounts,
  };
}

async function buildManifest() {
  const nodeTrace = [];
  const rowResults = [];

  const happy = await runHappyBridgeChain();
  nodeTrace.push(...happy.nodeTrace);
  assert.deepEqual(workflowWriteCounts(happy.subject), {
    promotion_input_snapshot: 1,
    promotion_decision_support: 1,
    promotion_gate_check: 1,
    human_promotion_decision: 1,
    paper_project_bridge: 1,
    downstream_feedback: 0,
    recheck_sink_calls: 0,
  });
  rowResults.push(rowPass('X-01', 'forward_only_happy_chain', happy.nodeTrace, {
    bridge_id: happy.bridge.paper_project_bridge.paper_project_bridge_id,
    bridge_payload_hash: happy.bridge.paper_project_bridge.bridge_payload_hash,
  }));
  rowResults.push(rowPass('N1-01', 'ready_snapshot', happy.nodeTrace.filter((node) => node.node_id === 'N1'), {
    promotion_input_snapshot_id: happy.promotionInputSnapshot.promotion_input_snapshot_id,
  }));
  rowResults.push(rowPass('N3-01', 'ready_gate_happy_path', happy.nodeTrace.filter((node) => node.node_id === 'N3'), {
    promotion_gate_check_id: happy.gateSupport.promotion_gate_check.promotion_gate_check_id,
  }));
  rowResults.push(rowPass('N4-01', 'bridge_authorized_happy_path', happy.nodeTrace.filter((node) => node.node_id === 'N4'), {
    promotion_decision_id: happy.humanDecision.promotion_decision.promotion_decision_id,
  }));
  rowResults.push(rowPass('N5-01', 'bridge_ready_happy_path', happy.nodeTrace.filter((node) => node.node_id === 'N5'), {
    paper_project_bridge_id: happy.bridge.paper_project_bridge.paper_project_bridge_id,
  }));
  rowResults.push(rowPass('N5-10', 'no_downstream_side_effect', happy.nodeTrace.filter((node) => node.node_id === 'N5'), {
    downstream_feedback_writes: happy.subject.downstreamFeedbackRepository.writes.length,
    recheck_sink_calls: happy.subject.recheckSink.calls.length,
    paper_project_boundary: 'not_entered_by_v1c_harness_acceptance',
  }));

  const stop = await runActionRequiredStop();
  nodeTrace.push(...stop.nodeTrace);
  rowResults.push(rowPass('X-03', 'stop_outcomes', stop.nodeTrace, {
    n3_required_action_count: stop.gateSupport.promotion_gate_check.required_actions.length,
    human_decision_writes: stop.subject.humanPromotionDecisionRepository.writes.length,
    bridge_writes: stop.subject.paperProjectBridgeRepository.writes.length,
  }));
  rowResults.push(rowPass('N3-06', 'mini_check_gaps', stop.nodeTrace.filter((node) => node.node_id === 'N3'), {
    disposition: stop.gateSupport.promotion_gate_check.disposition,
  }));

  const readyGateOnly = await runReadyGateOnly();
  nodeTrace.push(...readyGateOnly.nodeTrace);
  rowResults.push(rowPass('N3-08', 'ready_is_not_promote', readyGateOnly.nodeTrace.filter((node) => node.node_id === 'N3'), {
    promotion_gate_check_id: readyGateOnly.gateSupport.promotion_gate_check.promotion_gate_check_id,
    human_decision_writes: readyGateOnly.subject.humanPromotionDecisionRepository.writes.length,
    bridge_writes: readyGateOnly.subject.paperProjectBridgeRepository.writes.length,
  }));

  const n4NoBridge = await runN4NoBridgeCreationScenario();
  nodeTrace.push(...n4NoBridge.nodeTrace);
  rowResults.push(rowPass('N4-11', 'no_bridge_creation', [n4NoBridge.n4Node], {
    promotion_decision_id: n4NoBridge.humanDecision.promotion_decision.promotion_decision_id,
    bridge_writes: n4NoBridge.subject.paperProjectBridgeRepository.writes.length,
    downstream_feedback_writes: n4NoBridge.subject.downstreamFeedbackRepository.writes.length,
  }));

  const replay = await runReplayScenario();
  rowResults.push(rowPass('X-06', 'replay_no_duplicate_writes', replay.first.nodeTrace, {
    persistence_summary: workflowWriteCounts(replay.subject),
    replay_bridge_id: replay.second.bridge.paper_project_bridge.paper_project_bridge_id,
  }));

  const n6NoRecheck = await runN6NoRecheckScenario();
  nodeTrace.push(...n6NoRecheck.nodeTrace, n6NoRecheck.n6Node);
  rowResults.push(rowPass('N6-02', 'structured_no_recheck', [n6NoRecheck.n6Node], {
    feedback_id: n6NoRecheck.feedback.downstream_topic_feedback.downstream_topic_feedback_id,
    recheck_request_id: n6NoRecheck.feedback.recheck_request?.downstream_recheck_request_id ?? null,
    before_counts: n6NoRecheck.beforeCounts,
    after_counts: n6NoRecheck.afterCounts,
  }));

  const n6 = await runN6NoAutoLoopScenario();
  nodeTrace.push(...n6.nodeTrace, n6.n6Node);
  rowResults.push(rowPass('X-09', 'n6_no_auto_loop', [n6.n6Node], {
    before_counts: n6.beforeCounts,
    after_counts: n6.afterCounts,
  }));
  rowResults.push(rowPass('N6-01', 'structured_recheck_happy_path', [n6.n6Node], {
    feedback_id: n6.feedback.downstream_topic_feedback.downstream_topic_feedback_id,
    recheck_request_id: n6.feedback.recheck_request?.downstream_recheck_request_id ?? null,
  }));
  rowResults.push(rowPass('N6-10', 'no_upstream_mutation_auto_loop', [n6.n6Node], {
    unchanged_upstream_counts: {
      promotion_input_snapshot: n6.afterCounts.promotion_input_snapshot === n6.beforeCounts.promotion_input_snapshot,
      promotion_decision_support: n6.afterCounts.promotion_decision_support === n6.beforeCounts.promotion_decision_support,
      promotion_gate_check: n6.afterCounts.promotion_gate_check === n6.beforeCounts.promotion_gate_check,
      human_promotion_decision: n6.afterCounts.human_promotion_decision === n6.beforeCounts.human_promotion_decision,
      paper_project_bridge: n6.afterCounts.paper_project_bridge === n6.beforeCounts.paper_project_bridge,
    },
    recheck_sink_calls: n6.afterCounts.recheck_sink_calls,
  }));

  const persistenceSummary = mergePersistenceSummaries([
    workflowWriteCounts(happy.subject),
    workflowWriteCounts(stop.subject),
    workflowWriteCounts(readyGateOnly.subject),
    workflowWriteCounts(n4NoBridge.subject),
    workflowWriteCounts(replay.subject),
    workflowWriteCounts(n6NoRecheck.subject),
    workflowWriteCounts(n6.subject),
  ]);
  const gitSha = await resolveGitSha();

  return {
    schema_version: 'topic-selection-v1c-acceptance-manifest-v0',
    run_id: RUN_ID,
    adapter_version: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
    created_at: new Date().toISOString(),
    started_at: STARTED_AT,
    completed_at: new Date().toISOString(),
    command: `node ${process.argv.slice(1).join(' ')}`,
    git_sha: gitSha,
    selected_gate: process.env.TOPIC_SELECTION_V1C_ACCEPTANCE_GATE?.trim() || 'local',
    environment_status: {
      node_version: process.version,
      ts_node_project: process.env.TS_NODE_PROJECT ?? null,
      real_codex: 'not_applicable_deterministic_runner',
    },
    profile_versions: {
      harness_adapter: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
      deterministic_acceptance: 'topic-selection-v1c-deterministic-acceptance-v0',
    },
    status: 'pass',
    row_results: rowResults,
    node_trace: nodeTrace,
    persistence_summary: persistenceSummary,
    evidence_files: [
      path.join(ARTIFACT_DIR, 'manifest.json'),
      path.join(ARTIFACT_DIR, 'acceptance-row-results.jsonl'),
      path.join(ARTIFACT_DIR, 'row-results.json'),
      path.join(ARTIFACT_DIR, 'harness-trace.json'),
      path.join(ARTIFACT_DIR, 'node-trace.json'),
      path.join(ARTIFACT_DIR, 'persistence-summary.json'),
    ],
    pending_gaps: [],
  };
}

async function resolveGitSha() {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function workflowWriteCounts(subject) {
  return {
    promotion_input_snapshot: subject.promotionInputRepository.writes.length,
    promotion_decision_support: subject.promotionGateRepository.writes.length
      + subject.promotionGateRepository.supportWrites.length,
    promotion_gate_check: subject.promotionGateRepository.writes.length
      + subject.promotionGateRepository.gateCheckWrites.length,
    human_promotion_decision: subject.humanPromotionDecisionRepository.writes.length,
    paper_project_bridge: subject.paperProjectBridgeRepository.writes.length,
    downstream_feedback: subject.downstreamFeedbackRepository.writes.length,
    recheck_sink_calls: subject.recheckSink.calls.length,
  };
}

function rowPass(rowId, scenario, nodes, evidence) {
  return {
    row_id: rowId,
    status: 'pass',
    scenario,
    node_ids: nodes.map((node) => node.node_id),
    routing_outcomes: nodes.map((node) => node.routing_outcome),
    evidence,
    notes: nodes.flatMap((node) => node.notes),
  };
}

function mergePersistenceSummaries(summaries) {
  const merged = {};
  for (const summary of summaries) {
    for (const [key, value] of Object.entries(summary)) {
      if (Number.isNaN(value)) {
        continue;
      }
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

async function writeManifest(manifest) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const acceptanceRowResultsJsonlPath = path.join(ARTIFACT_DIR, 'acceptance-row-results.jsonl');
  const rowResultsPath = path.join(ARTIFACT_DIR, 'row-results.json');
  const harnessTracePath = path.join(ARTIFACT_DIR, 'harness-trace.json');
  const nodeTracePath = path.join(ARTIFACT_DIR, 'node-trace.json');
  const persistenceSummaryPath = path.join(ARTIFACT_DIR, 'persistence-summary.json');
  const manifestPath = path.join(ARTIFACT_DIR, 'manifest.json');
  await fs.writeFile(
    acceptanceRowResultsJsonlPath,
    `${manifest.row_results.map((row) => JSON.stringify(row)).join('\n')}\n`,
    'utf8',
  );
  await fs.writeFile(rowResultsPath, `${JSON.stringify(manifest.row_results, null, 2)}\n`, 'utf8');
  await fs.writeFile(harnessTracePath, `${JSON.stringify(manifest.node_trace, null, 2)}\n`, 'utf8');
  await fs.writeFile(nodeTracePath, `${JSON.stringify(manifest.node_trace, null, 2)}\n`, 'utf8');
  await fs.writeFile(
    persistenceSummaryPath,
    `${JSON.stringify(manifest.persistence_summary, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

async function main() {
  try {
    const manifest = await buildManifest();
    const manifestPath = await writeManifest(manifest);
    console.log(JSON.stringify({
      status: manifest.status,
      run_id: manifest.run_id,
      manifest_path: manifestPath,
      row_count: manifest.row_results.length,
      node_trace_count: manifest.node_trace.length,
    }, null, 2));
  } catch (error) {
    const gitSha = await resolveGitSha();
    const manifest = {
      schema_version: 'topic-selection-v1c-acceptance-manifest-v0',
      run_id: RUN_ID,
      adapter_version: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
      created_at: new Date().toISOString(),
      started_at: STARTED_AT,
      completed_at: new Date().toISOString(),
      command: `node ${process.argv.slice(1).join(' ')}`,
      git_sha: gitSha,
      selected_gate: process.env.TOPIC_SELECTION_V1C_ACCEPTANCE_GATE?.trim() || 'local',
      environment_status: {
        node_version: process.version,
        ts_node_project: process.env.TS_NODE_PROJECT ?? null,
        real_codex: 'not_applicable_deterministic_runner',
      },
      profile_versions: {
        harness_adapter: TOPIC_SELECTION_V1C_HARNESS_ADAPTER_VERSION,
        deterministic_acceptance: 'topic-selection-v1c-deterministic-acceptance-v0',
      },
      status: 'fail',
      row_results: [{
        row_id: 'runner-failure',
        status: 'fail',
        scenario: 'topic-selection-v1c-harness-acceptance',
        node_ids: [],
        routing_outcomes: [],
        evidence: {
          error_message: error instanceof Error ? error.message : String(error),
          error_stack: error instanceof Error ? error.stack : null,
        },
        notes: ['Runner failed before completing deterministic acceptance.'],
      }],
      node_trace: [],
      persistence_summary: {},
      evidence_files: [
        path.join(ARTIFACT_DIR, 'manifest.json'),
        path.join(ARTIFACT_DIR, 'acceptance-row-results.jsonl'),
        path.join(ARTIFACT_DIR, 'row-results.json'),
        path.join(ARTIFACT_DIR, 'harness-trace.json'),
        path.join(ARTIFACT_DIR, 'node-trace.json'),
        path.join(ARTIFACT_DIR, 'persistence-summary.json'),
      ],
      pending_gaps: [],
    };
    const manifestPath = await writeManifest(manifest);
    console.error(`topic-selection v1c harness acceptance failed; manifest written to ${manifestPath}`);
    process.exitCode = 1;
  }
}

await main();
