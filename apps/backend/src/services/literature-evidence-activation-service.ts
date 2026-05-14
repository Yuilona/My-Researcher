import crypto from 'node:crypto';
import type {
  LiteratureEvidenceActivationStatus,
  LiteratureQualityAssessmentDTO,
  LiteratureQualityStatus,
} from '@paper-engineering-assistant/shared/research-lifecycle/literature-contracts';
import type {
  LiteraturePipelineStateRecord,
  LiteratureQualityAssessmentRecord,
  LiteratureRepository,
  TopicLiteratureScopeRecord,
} from '../repositories/literature-repository.js';

export const LITERATURE_IMPORT_THRESHOLD = 55;
export const LITERATURE_ACTIVATION_THRESHOLD = 75;
export const LITERATURE_ACTIVE_QUALITY_STATUS: LiteratureQualityStatus = 'high_confidence';
export const LITERATURE_TOPIC_ACTIVE_STATUS: LiteratureEvidenceActivationStatus = 'active';
export const LITERATURE_AUTOMATIC_PROCESSING_ACTIVATION_STATUSES = new Set<LiteratureEvidenceActivationStatus>([
  'eligible',
  'active',
]);

export function isLiteratureActiveQualityStatus(status: string | null | undefined): status is LiteratureQualityStatus {
  return status === LITERATURE_ACTIVE_QUALITY_STATUS;
}

export function isLiteratureTopicActiveStatus(
  status: string | null | undefined,
): status is LiteratureEvidenceActivationStatus {
  return status === LITERATURE_TOPIC_ACTIVE_STATUS;
}

export function isLiteratureAutomaticProcessingActivationStatus(
  status: string | null | undefined,
): status is LiteratureEvidenceActivationStatus {
  return LITERATURE_AUTOMATIC_PROCESSING_ACTIVATION_STATUSES.has(status as LiteratureEvidenceActivationStatus);
}

export type EvidenceActivationClassification =
  | {
      importable: false;
      qualityStatus: LiteratureQualityStatus;
      activationStatus: 'excluded';
      reason: string;
    }
  | {
      importable: true;
      qualityStatus: LiteratureQualityStatus;
      activationStatus: 'needs_review' | 'eligible';
      reason: string;
    };

export class LiteratureEvidenceActivationService {
  constructor(private readonly repository: LiteratureRepository) {}

  classifyAutoPullScore(score: number): EvidenceActivationClassification {
    if (score < LITERATURE_IMPORT_THRESHOLD) {
      return {
        importable: false,
        qualityStatus: 'low_confidence',
        activationStatus: 'excluded',
        reason: 'AUTO_PULL_SCORE_LT_IMPORT_THRESHOLD',
      };
    }
    if (score < LITERATURE_ACTIVATION_THRESHOLD) {
      return {
        importable: true,
        qualityStatus: 'medium_confidence',
        activationStatus: 'needs_review',
        reason: 'AUTO_PULL_SCORE_LT_ACTIVATION_THRESHOLD',
      };
    }
    return {
      importable: true,
      qualityStatus: 'high_confidence',
      activationStatus: 'eligible',
      reason: 'AUTO_PULL_SCORE_GTE_ACTIVATION_THRESHOLD',
    };
  }

  toQualityAssessmentDTO(record: LiteratureQualityAssessmentRecord): LiteratureQualityAssessmentDTO {
    return {
      literature_id: record.literatureId,
      quality_status: record.qualityStatus,
      quality_score: record.qualityScore,
      quality_components: record.qualityComponents,
      blocker_codes: record.blockerCodes,
      source: record.source,
      assessed_at: record.assessedAt,
      updated_at: record.updatedAt,
    };
  }

  async upsertAutoPullAssessment(input: {
    literatureId: string;
    score: number;
    rankingScore: number;
    rankingMode: string;
    source: string;
  }): Promise<LiteratureQualityAssessmentRecord> {
    const classification = this.classifyAutoPullScore(input.score);
    const now = new Date().toISOString();
    const existing = await this.repository.findQualityAssessmentByLiteratureId(input.literatureId);
    const upserted = await this.repository.upsertQualityAssessment({
      id: existing?.id ?? crypto.randomUUID(),
      literatureId: input.literatureId,
      qualityStatus: classification.qualityStatus,
      qualityScore: input.score,
      qualityComponents: {
        auto_pull_quality_score: input.score,
        ranking_score: input.rankingScore,
        ranking_mode: input.rankingMode,
        import_threshold: LITERATURE_IMPORT_THRESHOLD,
        activation_threshold: LITERATURE_ACTIVATION_THRESHOLD,
        source: input.source,
      },
      blockerCodes: [],
      source: 'auto_pull',
      assessedAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    return upserted.record;
  }

  async ensureIndexedAssessment(literatureId: string): Promise<LiteratureQualityAssessmentRecord> {
    const existing = await this.repository.findQualityAssessmentByLiteratureId(literatureId);
    if (existing && existing.qualityStatus !== 'low_confidence' && existing.qualityStatus !== 'excluded') {
      return existing;
    }
    const now = new Date().toISOString();
    const upserted = await this.repository.upsertQualityAssessment({
      id: existing?.id ?? crypto.randomUUID(),
      literatureId,
      qualityStatus: 'high_confidence',
      qualityScore: existing?.qualityScore ?? 100,
      qualityComponents: {
        inferred_from: 'content_processing_indexed',
        indexed_ready: true,
        activation_threshold: LITERATURE_ACTIVATION_THRESHOLD,
      },
      blockerCodes: [],
      source: 'content_processing',
      assessedAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    return upserted.record;
  }

  async upsertManualReviewAssessment(input: {
    literatureId: string;
    qualityScore?: number | null;
    reason: string;
  }): Promise<LiteratureQualityAssessmentRecord> {
    const now = new Date().toISOString();
    const existing = await this.repository.findQualityAssessmentByLiteratureId(input.literatureId);
    const upserted = await this.repository.upsertQualityAssessment({
      id: existing?.id ?? crypto.randomUUID(),
      literatureId: input.literatureId,
      qualityStatus: 'high_confidence',
      qualityScore: input.qualityScore ?? existing?.qualityScore ?? 100,
      qualityComponents: {
        ...(existing?.qualityComponents ?? {}),
        manual_review_reason: input.reason,
      },
      blockerCodes: [],
      source: 'manual_review',
      assessedAt: now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    return upserted.record;
  }

  defaultActivationForScopeStatus(scopeStatus: 'in_scope' | 'excluded'): {
    activationStatus: LiteratureEvidenceActivationStatus;
    reason: string;
  } {
    return scopeStatus === 'excluded'
      ? {
          activationStatus: 'excluded',
          reason: 'TOPIC_SCOPE_EXCLUDED',
        }
      : {
          activationStatus: 'eligible',
          reason: 'MANUAL_SCOPE_IN_SCOPE',
        };
  }

  async refreshAfterIndexed(literatureId: string): Promise<void> {
    await this.ensureIndexedAssessment(literatureId);
    const scopes = await this.repository.listTopicScopesByLiteratureId(literatureId);
    await Promise.all(scopes.map((scope) => this.refreshTopicActivation(scope)));
  }

  async refreshTopicActivation(scope: TopicLiteratureScopeRecord): Promise<TopicLiteratureScopeRecord> {
    const now = new Date().toISOString();
    if (scope.scopeStatus === 'excluded') {
      return this.repository.updateTopicScopeActivation(scope.topicId, scope.literatureId, {
        activationStatus: 'excluded',
        activationReason: 'TOPIC_SCOPE_EXCLUDED',
        activatedAt: null,
        updatedAt: now,
      });
    }
    if (scope.activationStatus !== 'eligible' && scope.activationStatus !== 'active') {
      return scope;
    }
    const ready = await this.isEvidenceReady(scope.literatureId);
    if (!ready.active) {
      return this.repository.updateTopicScopeActivation(scope.topicId, scope.literatureId, {
        activationStatus: 'eligible',
        activationReason: ready.reason,
        activatedAt: null,
        updatedAt: now,
      });
    }
    return this.repository.updateTopicScopeActivation(scope.topicId, scope.literatureId, {
      activationStatus: 'active',
      activationReason: 'EVIDENCE_READY',
      activatedAt: scope.activatedAt ?? now,
      updatedAt: now,
    });
  }

  async isEvidenceReady(literatureId: string): Promise<{ active: boolean; reason: string }> {
    const [quality, pipelineState, embeddingVersions] = await Promise.all([
      this.repository.findQualityAssessmentByLiteratureId(literatureId),
      this.repository.findPipelineStateByLiteratureId(literatureId),
      this.repository.listActiveEmbeddingVersionsByLiteratureIds([literatureId]),
    ]);
    if (!this.isQualityActive(quality)) {
      return { active: false, reason: 'QUALITY_NOT_ACTIVE' };
    }
    if (!this.isPipelineReady(pipelineState)) {
      return { active: false, reason: 'KEY_CONTENT_NOT_READY' };
    }
    if (!embeddingVersions.some((version) => version.status === 'ACTIVE' || Boolean(version.activatedAt))) {
      return { active: false, reason: 'INDEX_NOT_ACTIVE' };
    }
    return { active: true, reason: 'EVIDENCE_READY' };
  }

  async resolveTopicEvidenceActiveLiteratureIds(topicId: string): Promise<Set<string>> {
    const scopes = await this.repository.listTopicScopesByTopicId(topicId);
    return new Set(
      scopes
        .filter((scope) => isLiteratureTopicActiveStatus(scope.activationStatus))
        .map((scope) => scope.literatureId),
    );
  }

  async resolveTopicAutomaticProcessingLiteratureIds(topicId: string): Promise<Set<string>> {
    const scopes = await this.repository.listTopicScopesByTopicId(topicId);
    return new Set(
      scopes
        .filter((scope) => isLiteratureAutomaticProcessingActivationStatus(scope.activationStatus))
        .map((scope) => scope.literatureId),
    );
  }

  async resolvePaperEvidenceCandidateLiteratureIds(paperId: string): Promise<Set<string>> {
    const links = await this.repository.listPaperLiteratureLinksByPaperId(paperId);
    const activeTopicPairs = await this.resolveTopicLiteraturePairs(
      links,
      isLiteratureTopicActiveStatus,
    );
    return new Set(
      links
        .filter((link) =>
          link.topicId
            ? activeTopicPairs.has(`${link.topicId}:${link.literatureId}`)
            : true)
        .map((link) => link.literatureId),
    );
  }

  async resolvePaperAutomaticProcessingLiteratureIds(paperId: string): Promise<Set<string>> {
    const links = await this.repository.listPaperLiteratureLinksByPaperId(paperId);
    const processableTopicPairs = await this.resolveTopicLiteraturePairs(
      links,
      isLiteratureAutomaticProcessingActivationStatus,
    );
    const globalLinkIds = links
      .filter((link) => !link.topicId)
      .map((link) => link.literatureId);
    const globalProcessableIds = await this.filterGlobalAutomaticProcessingLiteratureIds(globalLinkIds);
    return new Set(
      links
        .filter((link) =>
          link.topicId
            ? processableTopicPairs.has(`${link.topicId}:${link.literatureId}`)
            : globalProcessableIds.has(link.literatureId))
        .map((link) => link.literatureId),
    );
  }

  async filterGlobalAutomaticProcessingLiteratureIds(literatureIds: string[]): Promise<Set<string>> {
    const uniqueIds = [...new Set(literatureIds)];
    if (uniqueIds.length === 0) {
      return new Set();
    }
    const assessments = await this.repository.listQualityAssessmentsByLiteratureIds(uniqueIds);
    return new Set(
      assessments
        .filter((assessment) => isLiteratureActiveQualityStatus(assessment.qualityStatus))
        .map((assessment) => assessment.literatureId),
    );
  }

  async filterEvidenceReadyLiteratureIds(literatureIds: string[]): Promise<Set<string>> {
    const uniqueIds = [...new Set(literatureIds)];
    if (uniqueIds.length === 0) {
      return new Set();
    }
    const [qualities, states, versions] = await Promise.all([
      this.repository.listQualityAssessmentsByLiteratureIds(uniqueIds),
      this.repository.listPipelineStatesByLiteratureIds(uniqueIds),
      this.repository.listActiveEmbeddingVersionsByLiteratureIds(uniqueIds),
    ]);
    const qualityByLiterature = new Map(qualities.map((record) => [record.literatureId, record]));
    const stateByLiterature = new Map(states.map((record) => [record.literatureId, record]));
    const activeVersionIds = new Set(
      versions
        .filter((version) => version.status === 'ACTIVE' || Boolean(version.activatedAt))
        .map((version) => version.literatureId),
    );
    return new Set(uniqueIds.filter((literatureId) =>
      this.isQualityActive(qualityByLiterature.get(literatureId) ?? null)
      && this.isPipelineReady(stateByLiterature.get(literatureId) ?? null)
      && activeVersionIds.has(literatureId)));
  }

  private isQualityActive(record: LiteratureQualityAssessmentRecord | null): boolean {
    return isLiteratureActiveQualityStatus(record?.qualityStatus);
  }

  private isPipelineReady(record: LiteraturePipelineStateRecord | null): boolean {
    return Boolean(record?.keyContentReady);
  }

  private async resolveTopicLiteraturePairs(
    links: Array<{ topicId: string | null; literatureId: string }>,
    predicate: (status: string | null | undefined) => boolean,
  ): Promise<Set<string>> {
    const topicIds = [...new Set(links.flatMap((link) => (link.topicId ? [link.topicId] : [])))];
    const pairs = new Set<string>();
    for (const topicId of topicIds) {
      const scopes = await this.repository.listTopicScopesByTopicId(topicId);
      for (const scope of scopes) {
        if (predicate(scope.activationStatus)) {
          pairs.add(`${topicId}:${scope.literatureId}`);
        }
      }
    }
    return pairs;
  }
}
