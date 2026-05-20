import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../errors/app-error.js';
import {
  createDefaultTopicSelectionModelProfileRegistry,
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TopicSelectionModelProfileRegistryService,
} from './topic-selection-model-profile-registry-service.js';
import type {
  TopicSelectionModelProfileRegistry,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-profile-contracts';

function cloneRegistry(
  registry: TopicSelectionModelProfileRegistry,
): TopicSelectionModelProfileRegistry {
  return JSON.parse(JSON.stringify(registry)) as TopicSelectionModelProfileRegistry;
}

test('model profile registry validates default DMP v1 profiles and resolves provider option', () => {
  const service = new TopicSelectionModelProfileRegistryService();

  const validation = service.validateRegistry();
  assert.equal(validation.valid, true);
  assert.equal(validation.issue_count, 0);

  const singleAgent = service.resolveProfile({
    profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    execution_mode: 'codex_assisted',
    run_mode: 'product',
  });
  assert.equal(singleAgent.profile.output_contract, 'RankedCandidateDraftBatch@v1');
  assert.equal(singleAgent.selected_model_option, null);

  const resolved = service.resolveProfile({
    profile_id: 'topic-selection.need-discovery.explorer.v1',
    execution_mode: 'provider_llm',
    run_mode: 'product',
  });

  assert.equal(resolved.profile.role_family, 'explorer');
  assert.equal(resolved.selected_model_option?.provider_id, 'openai');
  assert.equal(resolved.selected_model_option?.use_when.includes('default_provider_run'), true);
  assert.match(resolved.profile_hash, /^[a-f0-9]{64}$/);
  assert.match(resolved.normalized_params_hash ?? '', /^[a-f0-9]{64}$/);
});

test('model profile registry enforces run-mode and role profile execution eligibility', () => {
  const service = new TopicSelectionModelProfileRegistryService();

  assert.throws(
    () => service.resolveProfile({
      profile_id: 'topic-selection.need-discovery.explorer.v1',
      execution_mode: 'mocked_llm',
      run_mode: 'product',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  assert.throws(
    () => service.resolveProfile({
      profile_id: 'topic-selection.need-discovery.arbiter-final.v1',
      execution_mode: 'codex_assisted',
      run_mode: 'acceptance',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('model profile registry catches duplicate profile and model option ids', () => {
  const registry = createDefaultTopicSelectionModelProfileRegistry();
  registry.profiles.push(cloneRegistry(registry).profiles[0]!);
  registry.profiles[0]!.model_options.push({ ...registry.profiles[0]!.model_options[0]! });

  const service = new TopicSelectionModelProfileRegistryService({ registry });
  const validation = service.validateRegistry();

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'DUPLICATE_PROFILE_ID'));
  assert.ok(validation.issues.some((issue) => issue.code === 'DUPLICATE_MODEL_OPTION_ID'));
});

test('model profile registry catches DMP policy drift in valid-shaped profiles', () => {
  const registry = createDefaultTopicSelectionModelProfileRegistry();
  const profile = registry.profiles[0]!;
  profile.run_mode_eligibility.mocked_llm = ['test', 'acceptance', 'product'];
  profile.audit_policy.store_raw_provider_response = true;
  profile.audit_policy.forbid_hidden_reasoning = false;
  profile.failure_handling_policy.technical_retry.require_same_context_packet_hashes = false;
  profile.budget_policy.max_provider_attempts = 1;
  profile.required_capabilities = ['json_schema'];

  const service = new TopicSelectionModelProfileRegistryService({ registry });
  const validation = service.validateRegistry();
  const codes = validation.issues.map((issue) => issue.code);

  assert.equal(validation.valid, false);
  assert.ok(codes.includes('MOCK_PRODUCT_MODE_FORBIDDEN'));
  assert.ok(codes.includes('RAW_PROVIDER_RESPONSE_AUDIT_FORBIDDEN'));
  assert.ok(codes.includes('HIDDEN_REASONING_AUDIT_FORBIDDEN'));
  assert.ok(codes.includes('TECHNICAL_RETRY_MUST_PRESERVE_INVOCATION'));
  assert.ok(codes.includes('BUDGET_ATTEMPTS_BELOW_TECHNICAL_RETRY'));
  assert.ok(codes.includes('STRUCTURED_OUTPUT_CAPABILITY_REQUIRED'));
});

test('model profile registry rejects unknown provider and explicit unknown model option', () => {
  const registry = createDefaultTopicSelectionModelProfileRegistry();
  registry.profiles[0]!.model_options[0]!.provider_id = 'unknown-provider';
  const invalidProvider = new TopicSelectionModelProfileRegistryService({ registry });
  assert.equal(invalidProvider.validateRegistry().issues.some((issue) => issue.code === 'UNKNOWN_PROVIDER_ID'), true);

  const service = new TopicSelectionModelProfileRegistryService();
  assert.throws(
    () => service.resolveProfile({
      profile_id: 'topic-selection.need-discovery.explorer.v1',
      execution_mode: 'provider_llm',
      run_mode: 'product',
      model_option_id: 'missing-option',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});
