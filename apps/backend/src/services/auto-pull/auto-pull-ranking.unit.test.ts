import assert from 'node:assert/strict';
import test from 'node:test';
import type { LiteratureAcquisitionSettingsService } from '../literature-acquisition-settings-service.js';
import type { LiteratureContentProcessingSettingsService } from '../literature-content-processing-settings-service.js';
import { BackendLlmGateway } from '../llm-gateway.js';
import { scoreAutoPullRankedCandidates } from './auto-pull-ranking.js';
import type { FetchedCandidate } from './auto-pull-types.js';

test('auto-pull internal quality scorer calls OpenAI through LLM gateway profile', async () => {
  const previousEndpoint = process.env.AUTO_PULL_LLM_SCORER_URL;
  delete process.env.AUTO_PULL_LLM_SCORER_URL;

  const requests: Array<Record<string, unknown>> = [];
  const llmGateway = new BackendLlmGateway({
    settingsService: {
      resolveOpenAIProviderApiKey: async () => 'sk-test',
    } as LiteratureContentProcessingSettingsService,
    fetchImpl: (async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify({
        output_text: JSON.stringify({ quality_score: 87 }),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch,
  });

  const candidate: FetchedCandidate = {
    item: {
      provider: 'crossref',
      external_id: '10.1000/gateway-score',
      title: 'Gateway Scored Paper',
      abstract: 'A paper about source-grounded literature retrieval.',
      authors: ['Ada Lovelace'],
      year: 2026,
      doi: '10.1000/gateway-score',
      source_url: 'https://doi.org/10.1000/gateway-score',
      rights_class: 'OA',
      tags: [],
    },
    rankingSignals: {
      publicationStatus: 'published',
      publicationYear: 2026,
      citationCount: 5,
    },
  };

  try {
    const ranked = await scoreAutoPullRankedCandidates([candidate], 'llm_score', {
      llmGateway,
      acquisitionSettingsService: {
        resolveQualityScorerProfile: async () => ({
          enabled: true,
          provider: 'openai',
          model: 'gpt-score-test',
          prompt_version: 'auto_pull_quality.v1',
          external_endpoint_configured: false,
        }),
      } as LiteratureAcquisitionSettingsService,
    });

    assert.equal(ranked[0]?.qualityScore, 87);
    assert.equal(ranked[0]?.rankingScore, 87);
    assert.equal(requests.length, 1);
    const request = requests[0];
    assert.ok(request);
    assert.equal(request.model, 'gpt-score-test');
    const text = request.text as Record<string, unknown>;
    assert.equal((text.format as Record<string, unknown>).name, 'auto_pull_quality_score');
    const messages = request.input as Array<{ role: string; content: string }>;
    assert.equal(messages.some((message) => message.content.includes('auto_pull_quality.v1')), true);
  } finally {
    if (previousEndpoint === undefined) {
      delete process.env.AUTO_PULL_LLM_SCORER_URL;
    } else {
      process.env.AUTO_PULL_LLM_SCORER_URL = previousEndpoint;
    }
  }
});
