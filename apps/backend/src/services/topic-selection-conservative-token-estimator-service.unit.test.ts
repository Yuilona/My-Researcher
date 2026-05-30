import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../errors/app-error.js';
import { TopicSelectionConservativeTokenEstimatorService } from './topic-selection-conservative-token-estimator-service.js';

test('conservative token estimator is deterministic and counts CJK text conservatively', () => {
  const estimator = new TopicSelectionConservativeTokenEstimatorService();
  const english = estimator.estimateText('Need candidate generation should preserve residual risks.');
  const cjk = estimator.estimateText('需要保留阻断项、残余风险、方法族缺口。');

  assert.equal(estimator.estimateText('Need candidate generation should preserve residual risks.').estimated_tokens, english.estimated_tokens);
  assert.equal(cjk.cjk_character_count > 0, true);
  assert.equal(cjk.estimated_tokens > english.estimated_tokens / 2, true);
});

test('conservative token estimator includes JSON structure and schema overhead', () => {
  const estimator = new TopicSelectionConservativeTokenEstimatorService();
  const payloadTokens = estimator.estimatePayload({
    topic_scope: {
      domain: 'long-context literature reasoning',
      exclusions: ['generic benchmark survey'],
    },
    residual_risks: ['pseudo-gap framing'],
  });
  const schemaOverhead = estimator.estimateSchemaOverhead({
    type: 'object',
    required: ['candidates'],
    properties: {
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          required: ['need_statement'],
          properties: {
            need_statement: { type: 'string' },
          },
        },
      },
    },
  });

  assert.equal(payloadTokens > 0, true);
  assert.equal(schemaOverhead > 0, true);
  assert.equal(schemaOverhead > estimator.estimatePayload({ type: 'object' }), true);
});

test('conservative token estimator applies profile safety margin to input estimates', () => {
  const estimator = new TopicSelectionConservativeTokenEstimatorService();
  const withoutMargin = estimator.estimateInputTokens({
    messages: [{ role: 'user', content: 'Generate grounded candidate drafts.' }],
    context_payloads: [{ blockers: ['missing longitudinal evaluation'] }],
    schema: { type: 'object' },
    safety_margin: 1,
  });
  const withMargin = estimator.estimateInputTokens({
    messages: [{ role: 'user', content: 'Generate grounded candidate drafts.' }],
    context_payloads: [{ blockers: ['missing longitudinal evaluation'] }],
    schema: { type: 'object' },
    safety_margin: 1.25,
  });

  assert.equal(withMargin.raw_input_tokens, withoutMargin.raw_input_tokens);
  assert.equal(withMargin.estimated_input_tokens >= Math.ceil(withoutMargin.raw_input_tokens * 1.25), true);
  assert.equal(withMargin.schema_overhead_tokens, withoutMargin.schema_overhead_tokens);
});

test('conservative token estimator rejects invalid safety margins', () => {
  const estimator = new TopicSelectionConservativeTokenEstimatorService();

  assert.throws(
    () => estimator.estimateInputTokens({
      messages: [{ role: 'user', content: 'x' }],
      safety_margin: 0.8,
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.errorCode === 'INVALID_PAYLOAD'
      && error.message === 'token estimate safety margin must be a finite multiplier greater than or equal to 1.',
  );
});
