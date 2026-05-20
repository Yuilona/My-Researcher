import assert from 'node:assert/strict';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionNeedDiscoveryArbiterContextPayload,
  TopicSelectionNeedDiscoveryExplorationContextPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';
import { TopicSelectionNeedDiscoveryContextCompilerService } from './topic-selection-need-discovery-context-compiler-service.js';

function makeServices() {
  const repository = new InMemoryTopicSelectionControlPlaneRepository();
  let sequence = 0;
  const controlPlane = new TopicSelectionControlPlaneService(repository, {
    idFactory: (prefix) => `${prefix}_${++sequence}`,
    now: () => '2026-05-19T00:00:00.000Z',
  });
  const artifactBoundary = new TopicSelectionNeedDiscoveryArtifactBoundaryService(controlPlane);
  const contextCompiler = new TopicSelectionNeedDiscoveryContextCompilerService(artifactBoundary, {
    now: () => '2026-05-19T00:00:00.000Z',
  });
  return { contextCompiler, repository };
}

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
  };
}

function explorationPayload(): TopicSelectionNeedDiscoveryExplorationContextPayload {
  return {
    topic_scope: {
      title_card_id: 'title_card_001',
      domain: 'RAG fine-tuning safety',
      exclusions: ['generic LLM benchmark surveys'],
    },
    evidence_signal_digest: {
      support_count: 3,
      challenge_count: 2,
    },
    resource_sample_digest: {
      sample_set_id: 'sample_set_001',
      roles: ['support', 'challenge', 'baseline', 'context'],
    },
    search_coverage_digest: {
      coverage: 'partial',
      missing_axes: ['longitudinal evaluation'],
    },
    sibling_candidate_digest: {
      candidate_count: 1,
      merge_hints: [],
    },
    decision_memory_digest: {
      rejected_candidates: [],
      required_challenges: ['avoid pseudo-gap framing'],
    },
    exploration_prompts: ['Generate grounded alternative need candidates.'],
    challenge_prompts: ['Find prior-art conflicts and pseudo-gap risks.'],
    allowed_outputs: ['ranked_candidate_draft_batch'],
    forbidden_outputs: ['need_candidate_authority_write', 'validated_need_write'],
  };
}

function arbiterPayload(): TopicSelectionNeedDiscoveryArbiterContextPayload {
  return {
    node_policy_ref: ref('node_policy', 'generate_need_candidate_v1'),
    output_schema_ref: ref('schema', 'ranked_candidate_draft_batch_v1'),
    authority_boundary: {
      authority_object: 'NeedCandidate',
      forbidden_authority_objects: ['NeedCandidateSet', 'ValidatedNeed', 'TopicQuestionContract'],
    },
    max_persisted_candidates: 5,
    deterministic_gate_checklist: [
      'ranked_candidate_draft_batch_schema',
      'candidate_draft_admission',
      'all_or_none_persistence',
    ],
    role_level_summaries: [
      {
        role: 'explorer',
        artifact_ref: ref('artifact_ref', 'role_summary_001'),
      },
    ],
    candidate_pool_digest: {
      candidate_count: 1,
      candidate_pool_hash: 'candidate_pool_hash_001',
    },
    evidence_ref_table: [
      {
        evidence_ref: ref('evidence_unit', 'support_001'),
        role: 'support',
      },
      {
        evidence_ref: ref('evidence_unit', 'challenge_001'),
        role: 'challenge',
      },
    ],
    rejected_framing_table: [
      {
        framing_id: 'rejected_001',
        reason_code: 'pseudo_gap',
      },
    ],
    unresolved_points: [],
    batch_ranking_rules: ['Prefer grounded, specific, reviewer-answerable need candidates.'],
    persistence_rules: ['Persist admitted drafts only through NeedCandidate records.'],
    failure_rules: ['Block when no draft survives admission gates.'],
  };
}

function compileInput() {
  return {
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    input_snapshot_id: 'input_snapshot_001',
    node_attempt_id: 'node_attempt_001',
    input_refs: [
      ref('topic_scope', 'topic_scope_001'),
      ref('evidence_map', 'evidence_map_001'),
      ref('resource_sample_set', 'sample_set_001'),
      ref('candidate_pool_projection', 'candidate_pool_projection_001'),
    ],
    policy_version: 'generate-need-candidate-policy-v1',
    output_schema_version: 'ranked-candidate-draft-batch-v1',
    profile_id: 'topic-selection.generate-need-candidate.single-agent.v1',
    execution_mode: 'mocked_llm' as const,
    exploration_payload: explorationPayload(),
    arbiter_payload: arbiterPayload(),
  };
}

test('need discovery context compiler records exploration and arbiter context packet artifacts', async () => {
  const { contextCompiler, repository } = makeServices();
  const result = await contextCompiler.compileContextPair(compileInput());

  assert.equal(result.node_id, 'topic-selection.v1a.generate-need-candidate.v1');
  assert.equal(result.exploration_context_ref.ref_type, 'artifact_ref');
  assert.equal(result.arbiter_context_ref.ref_type, 'artifact_ref');
  assert.notEqual(result.exploration_cache_key, result.arbiter_cache_key);
  assert.deepEqual(result.artifact_refs.map((entry) => entry.artifact_key), [
    'exploration_context_packet',
    'arbiter_context_packet',
  ]);
  assert.equal(result.exploration_context_packet.context_family, 'exploration_context');
  assert.equal(result.arbiter_context_packet.context_family, 'arbiter_context');
  assert.equal(result.exploration_context_packet.input_refs_hash, result.arbiter_context_packet.input_refs_hash);
  assert.equal(result.exploration_context_hash, result.exploration_context_packet.payload_hash);
  assert.equal(result.arbiter_context_hash, result.arbiter_context_packet.payload_hash);

  const explorationRecord = await repository.findArtifactRefById(result.exploration_context_ref.ref_id);
  const arbiterRecord = await repository.findArtifactRefById(result.arbiter_context_ref.ref_id);
  assert.equal(explorationRecord?.artifact_kind, 'input');
  assert.equal(arbiterRecord?.artifact_kind, 'input');
  assert.equal(explorationRecord?.workflow_run_id, 'workflow_run_001');
  assert.equal(explorationRecord?.input_snapshot_id, 'input_snapshot_001');
  assert.equal(
    JSON.stringify(explorationRecord?.payload).includes('raw_debate_transcript'),
    false,
  );

  const resolvedExploration = await contextCompiler.resolveContextPacket(result.exploration_context_ref, {
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    context_family: 'exploration_context',
    policy_version: 'generate-need-candidate-policy-v1',
    output_schema_version: 'ranked-candidate-draft-batch-v1',
    profile_id: 'topic-selection.generate-need-candidate.single-agent.v1',
    execution_mode: 'mocked_llm',
    cache_key: result.exploration_cache_key,
  });
  assert.equal(resolvedExploration.context_family, 'exploration_context');
  if (resolvedExploration.context_family !== 'exploration_context') {
    throw new Error('Expected exploration context packet.');
  }
  assert.equal(resolvedExploration.payload.topic_scope.domain, 'RAG fine-tuning safety');
});

test('need discovery context compiler enforces exact family and cache-key boundaries', async () => {
  const { contextCompiler } = makeServices();
  const result = await contextCompiler.compileContextPair(compileInput());
  const repeated = await contextCompiler.compileContextPair(compileInput());
  assert.equal(repeated.exploration_cache_key, result.exploration_cache_key);
  assert.equal(repeated.arbiter_cache_key, result.arbiter_cache_key);

  await assert.rejects(
    () => contextCompiler.resolveContextPacket(result.arbiter_context_ref, {
      workflow_run_id: 'workflow_run_001',
      node_attempt_id: 'node_attempt_001',
      context_family: 'exploration_context',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const stalePolicyPacket = {
    ...result.exploration_context_packet,
    policy_version: 'generate-need-candidate-policy-v2',
  };
  assert.throws(
    () => contextCompiler.validateContextPacket(stalePolicyPacket),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const badPayloadHashPacket = {
    ...result.arbiter_context_packet,
    payload_hash: 'tampered',
  };
  assert.throws(
    () => contextCompiler.validateContextPacket(badPayloadHashPacket),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('need discovery context compiler blocks raw or hidden context material before artifact write', async () => {
  const { contextCompiler, repository } = makeServices();
  await assert.rejects(
    () => contextCompiler.compileContextPair({
      ...compileInput(),
      exploration_payload: {
        ...explorationPayload(),
        decision_memory_digest: {
          raw_debate_transcript: 'raw transcript must remain artifact-only and redacted.',
        },
      },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  assert.equal(await repository.findArtifactRefById('artifact_ref_1'), null);
});
