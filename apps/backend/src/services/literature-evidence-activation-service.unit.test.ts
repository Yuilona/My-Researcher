import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryLiteratureRepository } from '../repositories/in-memory-literature-repository.js';
import { LiteratureEvidenceActivationService } from './literature-evidence-activation-service.js';

test('evidence activation classifies auto-pull scores with import and activation thresholds', () => {
  const service = new LiteratureEvidenceActivationService(new InMemoryLiteratureRepository());

  assert.deepEqual(service.classifyAutoPullScore(54), {
    importable: false,
    qualityStatus: 'low_confidence',
    activationStatus: 'excluded',
    reason: 'AUTO_PULL_SCORE_LT_IMPORT_THRESHOLD',
  });
  assert.deepEqual(service.classifyAutoPullScore(60), {
    importable: true,
    qualityStatus: 'medium_confidence',
    activationStatus: 'needs_review',
    reason: 'AUTO_PULL_SCORE_LT_ACTIVATION_THRESHOLD',
  });
  assert.deepEqual(service.classifyAutoPullScore(80), {
    importable: true,
    qualityStatus: 'high_confidence',
    activationStatus: 'eligible',
    reason: 'AUTO_PULL_SCORE_GTE_ACTIVATION_THRESHOLD',
  });
});

test('evidence activation promotes only indexed and key-content-ready eligible scopes to active', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureEvidenceActivationService(repository);
  const now = new Date().toISOString();

  await repository.createLiterature({
    id: 'LIT-ACTIVE-1',
    title: 'Evidence Ready Work',
    abstractText: null,
    keyContentDigest: null,
    authors: ['Tester'],
    year: 2026,
    doiNormalized: '10.1000/evidence-ready',
    arxivId: null,
    normalizedTitle: 'evidence ready work',
    titleAuthorsYearHash: 'hash-evidence-ready',
    rightsClass: 'OA',
    tags: [],
    activeEmbeddingVersionId: 'EV-ACTIVE-1',
    createdAt: now,
    updatedAt: now,
  });
  await repository.createEmbeddingVersion({
    id: 'EV-ACTIVE-1',
    literatureId: 'LIT-ACTIVE-1',
    versionNo: 1,
    status: 'INDEXED',
    profileId: 'default',
    provider: 'openai',
    model: 'text-embedding-3-large',
    dimension: 3,
    chunkCount: 1,
    vectorCount: 1,
    tokenCount: 4,
    inputChecksum: 'input',
    chunkArtifactChecksum: 'chunk',
    embeddingArtifactChecksum: 'embedding',
    indexArtifactChecksum: 'index',
    indexedAt: now,
    activatedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await repository.upsertPipelineState({
    id: 'pipeline-active-1',
    literatureId: 'LIT-ACTIVE-1',
    citationComplete: true,
    abstractReady: true,
    keyContentReady: true,
    dedupStatus: 'unique',
    updatedAt: now,
  });
  await repository.upsertQualityAssessment({
    id: 'quality-active-1',
    literatureId: 'LIT-ACTIVE-1',
    qualityStatus: 'high_confidence',
    qualityScore: 95,
    qualityComponents: { test_fixture: true },
    blockerCodes: [],
    source: 'test_fixture',
    assessedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await repository.upsertTopicScope({
    id: 'scope-active-1',
    topicId: 'topic-active',
    literatureId: 'LIT-ACTIVE-1',
    scopeStatus: 'in_scope',
    reason: 'test',
    activationStatus: 'eligible',
    activationReason: 'TEST_ELIGIBLE',
    activationScore: 95,
    activatedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await service.refreshAfterIndexed('LIT-ACTIVE-1');

  const [scope] = await repository.listTopicScopesByTopicId('topic-active');
  assert.equal(scope?.activationStatus, 'active');
  assert.equal(scope?.activationReason, 'EVIDENCE_READY');
  assert.notEqual(scope?.activatedAt, null);
});

test('evidence activation keeps medium-confidence eligible scopes out of active retrieval', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureEvidenceActivationService(repository);
  const now = new Date().toISOString();

  await repository.upsertQualityAssessment({
    id: 'quality-medium-1',
    literatureId: 'LIT-MEDIUM-1',
    qualityStatus: 'medium_confidence',
    qualityScore: 60,
    qualityComponents: { auto_pull_quality_score: 60 },
    blockerCodes: [],
    source: 'auto_pull',
    assessedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await repository.upsertPipelineState({
    id: 'pipeline-medium-1',
    literatureId: 'LIT-MEDIUM-1',
    citationComplete: true,
    abstractReady: true,
    keyContentReady: true,
    dedupStatus: 'unique',
    updatedAt: now,
  });

  const readyIds = await service.filterEvidenceReadyLiteratureIds(['LIT-MEDIUM-1']);

  assert.equal(readyIds.has('LIT-MEDIUM-1'), false);
});

test('evidence activation centralizes retrieval and automatic processing workset policies', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureEvidenceActivationService(repository);
  const now = new Date().toISOString();

  for (const [literatureId, activationStatus] of [
    ['LIT-POLICY-ACTIVE', 'active'],
    ['LIT-POLICY-ELIGIBLE', 'eligible'],
    ['LIT-POLICY-REVIEW', 'needs_review'],
  ] as const) {
    await repository.upsertTopicScope({
      id: `scope-${literatureId}`,
      topicId: 'topic-policy',
      literatureId,
      scopeStatus: 'in_scope',
      reason: 'test',
      activationStatus,
      activationReason: 'TEST',
      activationScore: null,
      activatedAt: activationStatus === 'active' ? now : null,
      createdAt: now,
      updatedAt: now,
    });
    await repository.upsertPaperLiteratureLink({
      id: `paper-link-${literatureId}`,
      paperId: 'paper-policy',
      topicId: 'topic-policy',
      literatureId,
      citationStatus: 'seeded',
      note: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const [literatureId, qualityStatus] of [
    ['LIT-POLICY-GLOBAL-HIGH', 'high_confidence'],
    ['LIT-POLICY-GLOBAL-MEDIUM', 'medium_confidence'],
  ] as const) {
    await repository.upsertQualityAssessment({
      id: `quality-${literatureId}`,
      literatureId,
      qualityStatus,
      qualityScore: qualityStatus === 'high_confidence' ? 90 : 60,
      qualityComponents: { test_fixture: true },
      blockerCodes: [],
      source: 'test_fixture',
      assessedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await repository.upsertPaperLiteratureLink({
      id: `paper-link-${literatureId}`,
      paperId: 'paper-policy',
      topicId: null,
      literatureId,
      citationStatus: 'seeded',
      note: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  assert.deepEqual(
    [...await service.resolveTopicEvidenceActiveLiteratureIds('topic-policy')].sort(),
    ['LIT-POLICY-ACTIVE'],
  );
  assert.deepEqual(
    [...await service.resolveTopicAutomaticProcessingLiteratureIds('topic-policy')].sort(),
    ['LIT-POLICY-ACTIVE', 'LIT-POLICY-ELIGIBLE'],
  );
  assert.deepEqual(
    [...await service.filterGlobalAutomaticProcessingLiteratureIds([
      'LIT-POLICY-GLOBAL-HIGH',
      'LIT-POLICY-GLOBAL-MEDIUM',
    ])].sort(),
    ['LIT-POLICY-GLOBAL-HIGH'],
  );
  assert.deepEqual(
    [...await service.resolvePaperEvidenceCandidateLiteratureIds('paper-policy')].sort(),
    ['LIT-POLICY-ACTIVE', 'LIT-POLICY-GLOBAL-HIGH', 'LIT-POLICY-GLOBAL-MEDIUM'],
  );
  assert.deepEqual(
    [...await service.resolvePaperAutomaticProcessingLiteratureIds('paper-policy')].sort(),
    ['LIT-POLICY-ACTIVE', 'LIT-POLICY-ELIGIBLE', 'LIT-POLICY-GLOBAL-HIGH'],
  );
});
