import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionNeedDiscoveryArbiterContextPayload,
  TopicSelectionNeedDiscoveryExplorationContextPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import {
  TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS,
} from './topic-selection-context-policy-profile-registry-service.js';
import { TopicSelectionContextPacketCacheService } from './topic-selection-context-packet-cache-service.js';
import {
  TopicSelectionV1aN6RuntimeContextCacheBindingService,
  type BuildTopicSelectionV1aN6RuntimeContextCacheInput,
} from './topic-selection-v1a-n6-runtime-context-cache-binding-service.js';

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

function buildInput(
  overrides: Partial<BuildTopicSelectionV1aN6RuntimeContextCacheInput> = {},
): BuildTopicSelectionV1aN6RuntimeContextCacheInput {
  return {
    cache_service: new TopicSelectionContextPacketCacheService(),
    title_card_id: 'title_card_001',
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
    execution_mode: 'mocked_llm',
    run_mode: 'test',
    executor_kind: 'single_agent',
    model_option_id: null,
    scenario_id: 'scenario_001',
    scenario_case_id: 'case_001',
    current_round_index: 1,
    remaining_round_budget: 0,
    exploration_payload: explorationPayload(),
    arbiter_payload: arbiterPayload(),
    ...overrides,
  };
}

test('v1a N6 runtime context cache binding owns node-specific slot/profile identity', () => {
  const service = new TopicSelectionV1aN6RuntimeContextCacheBindingService();
  const result = service.build(buildInput());

  assert.ok(result);
  assert.equal(result.cache_service instanceof TopicSelectionContextPacketCacheService, true);
  assert.equal(
    result.exploration_context?.context_policy_profile.invocation_slot_id,
    TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.need_candidate_generation,
  );
  assert.equal(
    result.arbiter_context?.context_policy_profile.invocation_slot_id,
    TOPIC_SELECTION_V1A_N6_INVOCATION_SLOT_IDS.arbiter_final_synthesis,
  );
  assert.equal(result.exploration_context?.prompt_template_id, 'topic-selection-generate-need-candidate');
  assert.equal(result.arbiter_context?.output_contract, 'RankedCandidateDraftBatch@v1');
  assert.equal(
    result.exploration_context?.provenance_ref.ref_id,
    'node_attempt_001_n6_exploration_context_cache',
  );
});

test('v1a N6 runtime context cache binding returns null when cache service is absent', () => {
  const service = new TopicSelectionV1aN6RuntimeContextCacheBindingService();

  assert.equal(service.build(buildInput({ cache_service: null })), null);
});

test('v1a N6 runtime context cache binding changes identity for supplemental and semantic scenarios', () => {
  const service = new TopicSelectionV1aN6RuntimeContextCacheBindingService();
  const initial = service.build(buildInput());
  const supplemental = service.build(buildInput({
    current_round_index: 2,
    remaining_round_budget: 1,
  }));
  const semantic = service.build(buildInput({
    scenario_id: 'semantic:scenario_001',
    scenario_case_id: 'case_001',
  }));

  assert.ok(initial?.exploration_context);
  assert.ok(supplemental?.exploration_context);
  assert.ok(semantic?.exploration_context);
  assert.notEqual(
    supplemental.exploration_context.runtime_invocation_context_hash,
    initial.exploration_context.runtime_invocation_context_hash,
  );
  assert.notEqual(
    supplemental.exploration_context.prompt_packet_hash,
    initial.exploration_context.prompt_packet_hash,
  );
  assert.notEqual(
    semantic.exploration_context.runtime_invocation_context_hash,
    initial.exploration_context.runtime_invocation_context_hash,
  );
});
