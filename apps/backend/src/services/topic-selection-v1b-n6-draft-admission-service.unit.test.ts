import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-workflow-harness-contracts';
import {
  TopicSelectionV1bN6DraftAdmissionService,
  type TopicSelectionV1bN6DraftAdmissionExpectedIdentity,
} from './topic-selection-v1b-n6-draft-admission-service.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);
const hashC = '1'.repeat(64);
const hashD = '2'.repeat(64);
const hashE = '3'.repeat(64);
const hashF = '4'.repeat(64);
const payloadHash = '5'.repeat(64);

function ref(refType: string, refId: string) {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
    version_id: null,
  };
}

function expected(
  overrides: Partial<TopicSelectionV1bN6DraftAdmissionExpectedIdentity> = {},
): TopicSelectionV1bN6DraftAdmissionExpectedIdentity {
  return {
    slot_id: 'n6_question_candidate_draft',
    output_contract: 'TopicQuestionCandidateSetDraft@v1',
    context_policy_profile_id: 'topic-selection.v1b.n6.question-candidate-draft.context-runtime@v1',
    context_policy_profile_version: 'v1',
    context_policy_profile_hash: hashA,
    prompt_variant_key: 'n6_question_candidate_draft.initial_from_n5',
    prompt_packet_hash: hashE,
    runtime_invocation_context_hash: hashB,
    redaction_policy: 'topic-selection-redacted-ref-backed-v1',
    source_hashes: {
      frozen_input_hash: hashC,
      n5_handoff_hash: hashD,
    },
    normalized_payload_hash: payloadHash,
    ...overrides,
  };
}

function artifact(
  overrides: Partial<TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef> = {},
): TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef {
  return {
    slot_id: 'n6_question_candidate_draft',
    node_id: 'topic-selection.v1b.generate-topic-question-candidates.v1',
    execution_mode: 'codex_assisted',
    run_mode: 'acceptance',
    allowed_effect: 'model_draft_for_gate',
    support_artifact_ref: ref('artifact_ref', 'support_001'),
    support_artifact_hash: payloadHash,
    normalized_output_ref: ref('artifact_ref', 'normalized_001'),
    normalized_output_hash: payloadHash,
    output_contract: 'TopicQuestionCandidateSetDraft@v1',
    profile_id: 'topic-selection.v1b.topic-question-candidates.single-agent.v1',
    model_option_id: null,
    input_hash: hashC,
    prompt_packet_hash: hashE,
    structured_output_hash: payloadHash,
    adapter_policy_version: 'topic-selection-v1b-node-policy-v1',
    slot_spec_hash: hashF,
    provenance_ref: ref('artifact_ref', 'runtime_audit_001'),
    runtime_provenance_class: 'runtime_verified',
    context_policy_profile_id: 'topic-selection.v1b.n6.question-candidate-draft.context-runtime@v1',
    context_policy_profile_version: 'v1',
    context_policy_profile_hash: hashA,
    prompt_variant_key: 'n6_question_candidate_draft.initial_from_n5',
    runtime_invocation_context_hash: hashB,
    redaction_policy: 'topic-selection-redacted-ref-backed-v1',
    source_hashes: {
      frozen_input_hash: hashC,
      n5_handoff_hash: hashD,
    },
    runtime_audit_ref: ref('artifact_ref', 'runtime_audit_001'),
    runtime_audit_hash: hashF,
    compression_report_ref: null,
    compression_report_hash: null,
    compressed_context_hash: null,
    ...overrides,
  };
}

test('v1b N6 draft admission accepts runtime_verified artifacts with exact runtime identity', () => {
  const service = new TopicSelectionV1bN6DraftAdmissionService();
  const result = service.admit({
    artifact: artifact(),
    expected: expected(),
    allow_fixture_replay: false,
  });
  if (!result.admitted) {
    throw new Error(`Expected runtime draft admission to pass: ${result.blocker.code}`);
  }
  assert.equal(result.runtime_provenance_class, 'runtime_verified');
});

test('v1b N6 draft admission blocks legacy and fixture artifacts outside fixture mode', () => {
  const service = new TopicSelectionV1bN6DraftAdmissionService();
  const legacy = service.admit({
    artifact: artifact({ runtime_provenance_class: 'legacy_unverified' }),
    expected: expected(),
    allow_fixture_replay: true,
  });
  if (legacy.admitted) {
    throw new Error('Expected legacy draft to block.');
  }
  assert.equal(legacy.blocker.code, 'N6_DRAFT_ARTIFACT_LEGACY_UNVERIFIED');

  const fixtureBlocked = service.admit({
    artifact: artifact({ runtime_provenance_class: 'fixture_replay' }),
    expected: expected(),
    allow_fixture_replay: false,
  });
  if (fixtureBlocked.admitted) {
    throw new Error('Expected fixture draft to block outside fixture mode.');
  }
  assert.equal(fixtureBlocked.blocker.code, 'N6_DRAFT_ARTIFACT_PROVENANCE_CLASS_INVALID');

  const fixtureAllowed = service.admit({
    artifact: artifact({ runtime_provenance_class: 'fixture_replay' }),
    expected: expected(),
    allow_fixture_replay: true,
  });
  if (!fixtureAllowed.admitted) {
    throw new Error(`Expected fixture draft to pass in fixture mode: ${fixtureAllowed.blocker.code}`);
  }
  assert.equal(fixtureAllowed.runtime_provenance_class, 'fixture_replay');
});

test('v1b N6 draft admission blocks payload, profile, prompt, runtime, source, and compression drift', () => {
  const service = new TopicSelectionV1bN6DraftAdmissionService();
  const cases: Array<{
    name: string;
    artifact: TopicSelectionV1bWorkflowHarnessSemanticSupportArtifactRef;
    code: string;
  }> = [
    {
      name: 'payload',
      artifact: artifact({ normalized_output_hash: '6'.repeat(64) }),
      code: 'N6_DRAFT_ARTIFACT_PAYLOAD_HASH_MISMATCH',
    },
    {
      name: 'profile',
      artifact: artifact({ context_policy_profile_hash: '6'.repeat(64) }),
      code: 'N6_DRAFT_ARTIFACT_PROFILE_DRIFT',
    },
    {
      name: 'prompt',
      artifact: artifact({ prompt_variant_key: 'n6_question_candidate_draft.regeneration_after_n7_loopback' }),
      code: 'N6_DRAFT_ARTIFACT_PROMPT_IDENTITY_DRIFT',
    },
    {
      name: 'prompt packet',
      artifact: artifact({ prompt_packet_hash: '6'.repeat(64) }),
      code: 'N6_DRAFT_ARTIFACT_PROMPT_IDENTITY_DRIFT',
    },
    {
      name: 'placeholder prompt packet',
      artifact: artifact({ prompt_packet_hash: 'c'.repeat(64) }),
      code: 'N6_DRAFT_ARTIFACT_PROMPT_IDENTITY_DRIFT',
    },
    {
      name: 'runtime',
      artifact: artifact({ runtime_invocation_context_hash: '6'.repeat(64) }),
      code: 'N6_DRAFT_ARTIFACT_RUNTIME_CONTEXT_DRIFT',
    },
    {
      name: 'runtime audit ref type',
      artifact: artifact({ runtime_audit_ref: ref('runtime_audit', 'runtime_audit_001') }),
      code: 'N6_DRAFT_ARTIFACT_RUNTIME_CONTEXT_DRIFT',
    },
    {
      name: 'runtime provenance ref',
      artifact: artifact({ provenance_ref: ref('artifact_ref', 'other_runtime_audit') }),
      code: 'N6_DRAFT_ARTIFACT_RUNTIME_CONTEXT_DRIFT',
    },
    {
      name: 'source',
      artifact: artifact({ source_hashes: { frozen_input_hash: hashC } }),
      code: 'N6_DRAFT_ARTIFACT_SOURCE_HASH_DRIFT',
    },
    {
      name: 'extra source',
      artifact: artifact({ source_hashes: { frozen_input_hash: hashC, n5_handoff_hash: hashD, extra: hashE } }),
      code: 'N6_DRAFT_ARTIFACT_SOURCE_HASH_DRIFT',
    },
    {
      name: 'compression',
      artifact: artifact({
        compression_report_ref: ref('compression_report', 'compression_001'),
        compression_report_hash: null,
        compressed_context_hash: null,
      }),
      code: 'N6_DRAFT_ARTIFACT_PROMPT_IDENTITY_DRIFT',
    },
  ];

  for (const item of cases) {
    const result = service.admit({
      artifact: item.artifact,
      expected: expected(),
      allow_fixture_replay: false,
    });
    if (result.admitted) {
      throw new Error(`Expected ${item.name} drift to block.`);
    }
    assert.equal(result.blocker.code, item.code, item.name);
  }
});
