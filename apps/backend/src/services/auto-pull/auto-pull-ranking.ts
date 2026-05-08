import { AppError } from '../../errors/app-error.js';
import type { LiteratureAcquisitionSettingsService } from '../literature-acquisition-settings-service.js';
import type { LiteratureContentProcessingSettingsService } from '../literature-content-processing-settings-service.js';
import { AUTOPULL_ALERT_CODES } from './auto-pull-alert-codes.js';
import type {
  AutoPullRankingMode,
  FetchedCandidate,
  PublicationStatusSignal,
  RankedCandidate,
} from './auto-pull-types.js';

type QualityScorerConfig = {
  endpoint: string | null;
  apiKey: string | null;
  model: string;
  promptVersion: string;
  enabled: boolean;
};

export async function scoreAutoPullRankedCandidates(
  candidates: FetchedCandidate[],
  rankingMode: AutoPullRankingMode,
  dependencies: {
    contentProcessingSettingsService?: LiteratureContentProcessingSettingsService;
    acquisitionSettingsService?: LiteratureAcquisitionSettingsService;
  } = {},
): Promise<RankedCandidate[]> {
  if (candidates.length === 0) {
    return [];
  }
  const scorerConfig = await resolveQualityScorerConfig(dependencies);
  const scored: RankedCandidate[] = [];
  for (const candidate of candidates) {
    const qualityScore = await scoreQualityCandidate(candidate, scorerConfig);
    const rankingScore = computeRankingScore(candidate, qualityScore, rankingMode);
    scored.push({
      candidate,
      qualityScore,
      rankingScore,
      rankingMode,
    });
  }
  return scored;
}

export function readAutoPullRankingMode(config: Record<string, unknown>): AutoPullRankingMode {
  const mode = readString(config.sort_mode);
  return mode === 'hybrid_score' ? 'hybrid_score' : 'llm_score';
}

function computeRankingScore(
  candidate: FetchedCandidate,
  qualityScore: number,
  rankingMode: AutoPullRankingMode,
): number {
  if (rankingMode === 'llm_score') {
    return qualityScore;
  }
  const freshness = computeFreshnessScore(candidate.rankingSignals.publicationYear);
  const publicationStatus = computePublicationStatusScore(candidate.rankingSignals.publicationStatus);
  const citation = computeCitationScore(candidate.rankingSignals.citationCount);
  const weighted = (qualityScore * 0.70) + (freshness * 0.15) + (publicationStatus * 0.10) + (citation * 0.05);
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

function computeFreshnessScore(publicationYear: number | null): number {
  if (!publicationYear || !Number.isFinite(publicationYear)) {
    return 0;
  }
  const age = Math.max(0, new Date().getUTCFullYear() - publicationYear);
  return Math.max(0, Math.round(100 - (age * 5)));
}

function computePublicationStatusScore(status: PublicationStatusSignal): number {
  if (status === 'published') {
    return 100;
  }
  if (status === 'accepted') {
    return 80;
  }
  if (status === 'preprint') {
    return 50;
  }
  return 0;
}

function computeCitationScore(citationCount: number | null): number {
  if (!citationCount || citationCount <= 0) {
    return 0;
  }
  const normalized = Math.log10(citationCount + 1) / Math.log10(501);
  return Math.round(Math.max(0, Math.min(1, normalized)) * 100);
}

async function resolveQualityScorerConfig(dependencies: {
  contentProcessingSettingsService?: LiteratureContentProcessingSettingsService;
  acquisitionSettingsService?: LiteratureAcquisitionSettingsService;
}): Promise<QualityScorerConfig> {
  const endpoint = (process.env.AUTO_PULL_LLM_SCORER_URL ?? '').trim();
  if (endpoint) {
    const apiKey = (process.env.AUTO_PULL_LLM_SCORER_API_KEY ?? '').trim() || null;
    const model = (process.env.AUTO_PULL_LLM_SCORER_MODEL ?? 'quality-score-v1').trim() || 'quality-score-v1';
    return {
      endpoint,
      apiKey,
      model,
      promptVersion: 'external_endpoint',
      enabled: true,
    };
  }

  const profile = await dependencies.acquisitionSettingsService?.resolveQualityScorerProfile();
  if (profile && !profile.enabled) {
    return {
      endpoint: null,
      apiKey: null,
      model: profile.model,
      promptVersion: profile.prompt_version,
      enabled: false,
    };
  }

  const apiKey = await dependencies.contentProcessingSettingsService?.resolveOpenAIProviderApiKey()
    ?? process.env.OPENAI_API_KEY?.trim()
    ?? null;
  if (!apiKey) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `${AUTOPULL_ALERT_CODES.QUALITY_SCORE_UNAVAILABLE}: OpenAI API key is not configured for auto-pull quality scoring.`,
    );
  }
  return {
    endpoint: null,
    apiKey,
    model: profile?.model ?? 'gpt-5.4-mini',
    promptVersion: profile?.prompt_version ?? 'auto_pull_quality.v1',
    enabled: true,
  };
}

async function scoreQualityCandidate(
  candidate: FetchedCandidate,
  config: QualityScorerConfig,
): Promise<number> {
  if (!config.enabled) {
    return computeRuleOnlyQualityScore(candidate);
  }
  if (!config.endpoint) {
    return scoreQualityCandidateViaOpenAI(candidate, config);
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      input: {
        title: candidate.item.title,
        abstract: candidate.item.abstract ?? null,
        authors: candidate.item.authors ?? [],
        year: candidate.item.year ?? null,
        doi: candidate.item.doi ?? null,
        arxiv_id: candidate.item.arxiv_id ?? null,
        source_url: candidate.item.source_url,
        provider: candidate.item.provider,
      },
    }),
  });
  if (!response.ok) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `${AUTOPULL_ALERT_CODES.QUALITY_SCORE_UNAVAILABLE}: scorer request failed with status ${response.status}.`,
    );
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const score = readQualityScore(payload);
  if (score === null) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `${AUTOPULL_ALERT_CODES.QUALITY_SCORE_UNAVAILABLE}: scorer response missing score.`,
    );
  }
  return score;
}

async function scoreQualityCandidateViaOpenAI(
  candidate: FetchedCandidate,
  config: QualityScorerConfig,
): Promise<number> {
  if (!config.apiKey) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `${AUTOPULL_ALERT_CODES.QUALITY_SCORE_UNAVAILABLE}: OpenAI API key is not configured.`,
    );
  }
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        {
          role: 'system',
          content: [
            'Score whether a CS paper candidate is relevant and useful for literature intake.',
            'Return JSON only with quality_score from 0 to 100.',
            'Do not reward missing abstracts, invalid identifiers, or irrelevant source metadata.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            prompt_version: config.promptVersion,
            title: candidate.item.title,
            abstract: candidate.item.abstract ?? null,
            authors: candidate.item.authors ?? [],
            year: candidate.item.year ?? null,
            doi: candidate.item.doi ?? null,
            arxiv_id: candidate.item.arxiv_id ?? null,
            source_url: candidate.item.source_url,
            provider: candidate.item.provider,
            ranking_signals: candidate.rankingSignals,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'auto_pull_quality_score',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['quality_score'],
            properties: {
              quality_score: { type: 'number', minimum: 0, maximum: 100 },
            },
          },
        },
      },
    }),
  });
  if (!response.ok) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `${AUTOPULL_ALERT_CODES.QUALITY_SCORE_UNAVAILABLE}: OpenAI scorer request failed with status ${response.status}.`,
    );
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const parsed = readQualityScore(payload) ?? readQualityScore(tryReadOutputObject(payload));
  if (parsed === null) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      `${AUTOPULL_ALERT_CODES.QUALITY_SCORE_UNAVAILABLE}: OpenAI scorer response missing score.`,
    );
  }
  return parsed;
}

function computeRuleOnlyQualityScore(candidate: FetchedCandidate): number {
  const hasAbstract = candidate.item.abstract?.trim() ? 20 : 0;
  const hasIdentifier = candidate.item.doi || candidate.item.arxiv_id ? 20 : 0;
  const freshness = computeFreshnessScore(candidate.rankingSignals.publicationYear) * 0.25;
  const status = computePublicationStatusScore(candidate.rankingSignals.publicationStatus) * 0.2;
  const citations = computeCitationScore(candidate.rankingSignals.citationCount) * 0.15;
  return Math.round(Math.max(0, Math.min(100, hasAbstract + hasIdentifier + freshness + status + citations)));
}

function tryReadOutputObject(payload: Record<string, unknown>): Record<string, unknown> {
  const outputText = typeof payload.output_text === 'string' ? payload.output_text : null;
  if (outputText) {
    try {
      const parsed = JSON.parse(outputText) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const row = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : {};
    const content = Array.isArray(row.content) ? row.content : [];
    for (const contentItem of content) {
      const contentRow = contentItem && typeof contentItem === 'object' && !Array.isArray(contentItem)
        ? contentItem as Record<string, unknown>
        : {};
      if (contentRow.parsed && typeof contentRow.parsed === 'object' && !Array.isArray(contentRow.parsed)) {
        return contentRow.parsed as Record<string, unknown>;
      }
      if (typeof contentRow.text === 'string') {
        try {
          const parsed = JSON.parse(contentRow.text) as unknown;
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
        } catch {
          continue;
        }
      }
    }
  }
  return {};
}

function readQualityScore(payload: Record<string, unknown>): number | null {
  const directScore = readNonNegativeNumber(payload.quality_score);
  if (directScore !== null) {
    return Math.round(Math.max(0, Math.min(100, directScore)));
  }
  const fallbackScore = readNonNegativeNumber(payload.score);
  if (fallbackScore !== null) {
    return Math.round(Math.max(0, Math.min(100, fallbackScore)));
  }
  return null;
}

function readNonNegativeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
