import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import {
  createTopicSelectionV1aGenerateNeedCandidateDebateScenarioContract,
  topicSelectionDebateScenarioContractSchema,
} from './topic-selection-debate-scenario-contracts.js';

async function validatesBody(schema: Record<string, unknown>, body: unknown): Promise<boolean> {
  const app = Fastify();
  app.post('/validate', { schema: { body: schema } }, async () => ({ ok: true }));
  try {
    const result = await app.inject({
      method: 'POST',
      url: '/validate',
      payload: body as Record<string, unknown>,
    });
    return result.statusCode === 200;
  } finally {
    await app.close();
  }
}

test('topic-selection debate scenario contract schema accepts v1a need-discovery contract', async () => {
  const contract = createTopicSelectionV1aGenerateNeedCandidateDebateScenarioContract();

  assert.equal(await validatesBody(topicSelectionDebateScenarioContractSchema, contract), true);
  assert.equal(contract.node_id, 'topic-selection.v1a.generate-need-candidate.v1');
  assert.equal(contract.debate_policy_id, 'topic-selection.need-discovery.debate.v1');
  assert.equal(contract.role_stage_slots.length, 4);
  assert.equal(
    contract.role_stage_slots.find((slot) => slot.slot_id === 'explorer.round_1_discovery')
      ?.instance_policy.default_instances,
    2,
  );
  assert.equal(
    contract.role_stage_slots.find((slot) => slot.slot_id === 'arbiter.final_synthesis')
      ?.codex_substitution_policy.allowed,
    false,
  );
  assert.equal(contract.validation_contract.max_persisted_candidates, 5);
  assert.deepEqual(
    contract.role_stage_slots.map((slot) => slot.slot_id),
    [
      'explorer.round_1_discovery',
      'deep_critic.round_1_discovery',
      'arbiter.issue_framing',
      'arbiter.final_synthesis',
    ],
  );
  assert.equal(JSON.stringify(contract).includes('temperature'), false);
});

test('topic-selection debate scenario contract schema rejects fallback and provider-param drift', async () => {
  const contract = createTopicSelectionV1aGenerateNeedCandidateDebateScenarioContract() as unknown as Record<string, unknown>;
  const providerPolicy = contract.provider_selection_policy as Record<string, unknown>;
  providerPolicy.automatic_fallback = true;
  const slot = ((contract.role_stage_slots as Array<Record<string, unknown>>)[0]!);
  slot.temperature = 0.2;

  assert.equal(await validatesBody(topicSelectionDebateScenarioContractSchema, contract), false);
});
