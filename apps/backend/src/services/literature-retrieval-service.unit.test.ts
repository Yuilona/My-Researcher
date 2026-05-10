import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryLiteratureRepository } from '../repositories/in-memory-literature-repository.js';
import type { LiteratureContentProcessingSettingsService } from './literature-content-processing-settings-service.js';
import { LiteratureRetrievalService } from './literature-retrieval-service.js';

async function seedLocalLiterature(
  repository: InMemoryLiteratureRepository,
  input: {
    literatureId: string;
    title: string;
    chunkText: string;
    versionId: string;
    chunkType?: string;
    profileId?: 'default' | 'economy';
    model?: string;
    dimension?: number;
    vector?: number[];
    authors?: string[];
    year?: number | null;
    doiNormalized?: string | null;
    arxivId?: string | null;
    titleAuthorsYearHash?: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await repository.createLiterature({
    id: input.literatureId,
    title: input.title,
    abstractText: null,
    keyContentDigest: null,
    authors: input.authors ?? ['Tester'],
    year: input.year === undefined ? 2025 : input.year,
    doiNormalized: input.doiNormalized === undefined ? `10.1000/${input.literatureId.toLowerCase()}` : input.doiNormalized,
    arxivId: input.arxivId === undefined ? null : input.arxivId,
    normalizedTitle: input.title.toLowerCase(),
    titleAuthorsYearHash: input.titleAuthorsYearHash === undefined ? `hash-${input.literatureId}` : input.titleAuthorsYearHash,
    rightsClass: 'OA',
    tags: [],
    activeEmbeddingVersionId: input.versionId,
    createdAt: now,
    updatedAt: now,
  });

  await repository.createEmbeddingVersion({
    id: input.versionId,
    literatureId: input.literatureId,
    versionNo: 1,
    status: 'INDEXED',
    profileId: input.profileId ?? 'default',
    provider: 'openai',
    model: input.model ?? 'text-embedding-3-large',
    dimension: input.dimension ?? 3,
    chunkCount: 1,
    vectorCount: 1,
    tokenCount: 0,
    inputChecksum: 'input-checksum',
    chunkArtifactChecksum: 'chunk-checksum',
    embeddingArtifactChecksum: 'embedding-checksum',
    indexArtifactChecksum: 'index-checksum',
    indexedAt: now,
    activatedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await repository.createEmbeddingChunks([
    {
      id: `${input.versionId}-chunk-1`,
      embeddingVersionId: input.versionId,
      literatureId: input.literatureId,
      chunkId: 'chunk-0001',
      chunkIndex: 0,
      text: input.chunkText,
      startOffset: 0,
      endOffset: input.chunkText.length,
      chunkType: input.chunkType ?? 'fulltext_paragraph',
      sourceRefs: [{ ref_type: 'paragraph', ref_id: 'para-1' }],
      metadata: { origin_stage: 'FULLTEXT_PREPROCESSED' },
      contentChecksum: 'content-checksum',
      vector: input.vector ?? [0.1, 0.2, 0.3],
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

test('retrieve ranks literature by hybrid score and returns chunk evidence', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-1',
    title: 'Retrieval Evaluation Benchmark',
    versionId: 'EV-RET-1',
    chunkText: 'retrieval evaluation benchmark with semantic evidence',
  });

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-2',
    title: 'Unrelated Topic',
    versionId: 'EV-RET-2',
    chunkText: 'graph coloring theorem and combinatorics notes',
  });

  const response = await service.retrieve({
    query: 'retrieval evaluation',
    top_k: 10,
    evidence_per_literature: 2,
  });

  assert.equal(response.items.length, 2);
  assert.equal(response.items[0]?.literature_id, 'LIT-RET-1');
  assert.equal(response.items[0]?.evidence_chunks.length, 1);
  assert.equal(response.meta.query_tokens.includes('retrieval'), true);
  assert.equal(response.items[0]?.evidence_chunks[0]?.chunk_type, 'fulltext_paragraph');
  assert.equal(response.meta.profile, 'general');
  assert.equal(response.meta.degraded_mode, true);
  assert.equal(response.meta.profiles_used.length, 0);
  assert.equal(response.meta.skipped_profiles.length, 1);
  assert.equal(response.meta.query_embedding_telemetry, null);
});

test('retrieve boosts exact phrase lexical matches and explains matched tokens', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-PHRASE',
    title: 'Phrase Match Work',
    versionId: 'EV-RET-PHRASE',
    chunkText: 'The masked language modeling objective is central to this encoder pretraining method.',
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-BAG',
    title: 'Bag Match Work',
    versionId: 'EV-RET-BAG',
    chunkText: 'The method masks tokens in a language encoder and studies modeling objectives separately.',
  });

  const response = await service.retrieve({
    query: 'masked language modeling',
    top_k: 2,
  });

  assert.equal(response.items[0]?.literature_id, 'LIT-RET-PHRASE');
  const breakdown = response.items[0]?.evidence_chunks[0]?.score_breakdown;
  assert.deepEqual(breakdown?.matched_tokens, ['masked', 'language', 'modeling']);
  assert.equal(breakdown?.missing_tokens?.length, 0);
  assert.equal(breakdown?.exact_phrases?.includes('masked language modeling'), true);
  assert.equal((breakdown?.weighted_lexical ?? 0) > 0, true);
});

test('retrieve uses literature metadata for exact identifier and title term matches', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-ALPHAFOLD',
    title: 'Highly accurate protein structure prediction with AlphaFold',
    versionId: 'EV-RET-ALPHAFOLD',
    chunkText: 'The benchmark reports accurate coordinate prediction and ablation evidence.',
    doiNormalized: '10.1000/protein-structure',
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-GENERIC-PROTEIN',
    title: 'Generic protein structure benchmark',
    versionId: 'EV-RET-GENERIC-PROTEIN',
    chunkText: 'The benchmark reports accurate coordinate prediction and ablation evidence.',
    doiNormalized: '10.1000/generic-protein',
  });

  const response = await service.retrieve({
    query: 'AlphaFold',
    top_k: 2,
  });

  assert.equal(response.items[0]?.literature_id, 'LIT-RET-ALPHAFOLD');
  const breakdown = response.items[0]?.evidence_chunks[0]?.score_breakdown;
  assert.equal(breakdown?.matched_tokens?.includes('alphafold'), false);
  assert.equal(breakdown?.metadata_matched_tokens?.includes('alphafold'), true);
  assert.equal((breakdown?.weighted_metadata ?? 0) > 0, true);
});

test('retrieve deduplicates split records by canonical work identity before applying top-k', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-DUP-DOI',
    title: 'Canonical Duplicate Work',
    versionId: 'EV-RET-DUP-DOI',
    chunkText: 'canonical duplicate evidence from doi record',
    authors: ['Ada Lovelace'],
    year: 2026,
    doiNormalized: '10.1000/canonical-duplicate',
    arxivId: null,
    titleAuthorsYearHash: null,
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-DUP-ARXIV',
    title: 'Canonical Duplicate Work',
    versionId: 'EV-RET-DUP-ARXIV',
    chunkText: 'canonical duplicate evidence from arxiv record with extra evidence',
    authors: ['Ada Lovelace'],
    year: 2026,
    doiNormalized: null,
    arxivId: '2601.00001',
    titleAuthorsYearHash: null,
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-DUP-HISTORICAL',
    title: 'Canonical Duplicate Work',
    versionId: 'EV-RET-DUP-HISTORICAL',
    chunkText: 'canonical duplicate evidence from a historical split record with the strongest lexical match',
    authors: ['Ada Lovelace'],
    year: 2026,
    doiNormalized: null,
    arxivId: null,
    titleAuthorsYearHash: null,
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-UNIQUE',
    title: 'Unique Neighbor Work',
    versionId: 'EV-RET-UNIQUE',
    chunkText: 'canonical duplicate evidence from a separate comparison work',
    authors: ['Grace Hopper'],
    year: 2026,
    doiNormalized: '10.1000/unique-neighbor',
    arxivId: null,
    titleAuthorsYearHash: null,
  });

  const response = await service.retrieve({
    query: 'canonical duplicate evidence',
    top_k: 5,
  });

  assert.equal(response.items.length, 2);
  assert.equal(
    response.items.filter((item) => item.title === 'Canonical Duplicate Work').length,
    1,
  );
  assert.equal(
    response.items.find((item) => item.title === 'Canonical Duplicate Work')?.canonical_work_key,
    'doi:10.1000/canonical-duplicate',
  );
  assert.equal(
    response.items.find((item) => item.title === 'Canonical Duplicate Work')?.literature_id,
    'LIT-RET-DUP-DOI',
  );
  assert.equal(response.items.some((item) => item.literature_id === 'LIT-RET-DUP-HISTORICAL'), false);
  assert.equal(response.items.some((item) => item.literature_id === 'LIT-RET-UNIQUE'), true);
});

test('retrieve consumes confirmed same-work clusters while ignoring candidate clusters', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);
  const now = new Date().toISOString();
  let capturedClusterFilter: Parameters<InMemoryLiteratureRepository['listLiteratureClusters']>[0] | undefined;
  const originalListLiteratureClusters = repository.listLiteratureClusters.bind(repository);
  repository.listLiteratureClusters = async (filter) => {
    capturedClusterFilter = filter;
    return originalListLiteratureClusters(filter);
  };

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-CLUSTER-CANONICAL',
    title: 'Confirmed Cluster Canonical Work',
    versionId: 'EV-RET-CLUSTER-CANONICAL',
    chunkText: 'clustered duplicate evidence from canonical record',
    authors: ['Ada Lovelace'],
    year: 2026,
    doiNormalized: '10.1000/cluster-canonical',
    titleAuthorsYearHash: null,
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-CLUSTER-VARIANT',
    title: 'Confirmed Cluster Variant Work',
    versionId: 'EV-RET-CLUSTER-VARIANT',
    chunkText: 'clustered duplicate evidence from variant record with stronger lexical duplicate evidence',
    authors: ['A. Lovelace'],
    year: 2027,
    doiNormalized: null,
    titleAuthorsYearHash: null,
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-CLUSTER-CANDIDATE',
    title: 'Candidate Cluster Work',
    versionId: 'EV-RET-CLUSTER-CANDIDATE',
    chunkText: 'clustered duplicate evidence from candidate-only record',
    authors: ['Ada Lovelace'],
    year: 2026,
    doiNormalized: '10.1000/cluster-candidate',
    titleAuthorsYearHash: null,
  });

  await repository.upsertLiteratureCluster({
    id: 'LCL-CONFIRMED',
    clusterType: 'same_work',
    status: 'confirmed',
    representativeLiteratureId: 'LIT-RET-CLUSTER-CANONICAL',
    confidence: 0.91,
    method: 'unit',
    createdAt: now,
    updatedAt: now,
  }, [
    {
      id: 'LCM-CONFIRMED-1',
      clusterId: 'LCL-CONFIRMED',
      literatureId: 'LIT-RET-CLUSTER-CANONICAL',
      role: 'representative',
      relationType: 'near_duplicate',
      confidence: 0.91,
      decisionStatus: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'LCM-CONFIRMED-2',
      clusterId: 'LCL-CONFIRMED',
      literatureId: 'LIT-RET-CLUSTER-VARIANT',
      role: 'variant',
      relationType: 'near_duplicate',
      confidence: 0.91,
      decisionStatus: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
  ], [
    {
      id: 'LCE-CONFIRMED-1',
      clusterId: 'LCL-CONFIRMED',
      literatureIdA: 'LIT-RET-CLUSTER-CANONICAL',
      literatureIdB: 'LIT-RET-CLUSTER-VARIANT',
      signalType: 'title_similarity',
      score: 0.91,
      payload: {},
      createdAt: now,
    },
  ]);
  await repository.upsertLiteratureCluster({
    id: 'LCL-CANDIDATE',
    clusterType: 'same_work',
    status: 'candidate',
    representativeLiteratureId: 'LIT-RET-CLUSTER-CANONICAL',
    confidence: 0.91,
    method: 'unit',
    createdAt: now,
    updatedAt: now,
  }, [
    {
      id: 'LCM-CANDIDATE-1',
      clusterId: 'LCL-CANDIDATE',
      literatureId: 'LIT-RET-CLUSTER-CANONICAL',
      role: 'representative',
      relationType: 'near_duplicate',
      confidence: 0.91,
      decisionStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'LCM-CANDIDATE-2',
      clusterId: 'LCL-CANDIDATE',
      literatureId: 'LIT-RET-CLUSTER-CANDIDATE',
      role: 'variant',
      relationType: 'near_duplicate',
      confidence: 0.91,
      decisionStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    },
  ], []);

  const response = await service.retrieve({
    query: 'clustered duplicate evidence',
    top_k: 10,
  });

  assert.equal(response.items.some((item) => item.literature_id === 'LIT-RET-CLUSTER-VARIANT'), false);
  assert.equal(response.items.some((item) => item.literature_id === 'LIT-RET-CLUSTER-CANONICAL'), true);
  assert.equal(response.items.some((item) => item.literature_id === 'LIT-RET-CLUSTER-CANDIDATE'), true);
  assert.deepEqual(
    new Set(capturedClusterFilter?.literatureIds ?? []),
    new Set(['LIT-RET-CLUSTER-CANONICAL', 'LIT-RET-CLUSTER-VARIANT', 'LIT-RET-CLUSTER-CANDIDATE']),
  );
});

test('retrieve skips OpenAI profile when API key is not configured', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);
  const now = new Date().toISOString();

  await repository.createLiterature({
    id: 'LIT-RET-OPENAI',
    title: 'OpenAI Embedding Candidate',
    abstractText: null,
    keyContentDigest: null,
    authors: ['Tester'],
    year: 2025,
    doiNormalized: '10.1000/lit-ret-openai',
    arxivId: null,
    normalizedTitle: 'openai embedding candidate',
    titleAuthorsYearHash: 'hash-lit-ret-openai',
    rightsClass: 'OA',
    tags: [],
    activeEmbeddingVersionId: 'EV-RET-OPENAI',
    createdAt: now,
    updatedAt: now,
  });

  await repository.createEmbeddingVersion({
    id: 'EV-RET-OPENAI',
    literatureId: 'LIT-RET-OPENAI',
    versionNo: 1,
    status: 'INDEXED',
    profileId: 'default',
    provider: 'openai',
    model: 'text-embedding-3-large',
    dimension: 3,
    chunkCount: 1,
    vectorCount: 1,
    tokenCount: 0,
    inputChecksum: 'input-checksum',
    chunkArtifactChecksum: 'chunk-checksum',
    embeddingArtifactChecksum: 'embedding-checksum',
    indexArtifactChecksum: 'index-checksum',
    indexedAt: now,
    activatedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await repository.createEmbeddingChunks([
    {
      id: 'EV-RET-OPENAI-chunk-1',
      embeddingVersionId: 'EV-RET-OPENAI',
      literatureId: 'LIT-RET-OPENAI',
      chunkId: 'chunk-0001',
      chunkIndex: 0,
      text: 'openai profile chunk text',
      startOffset: 0,
      endOffset: 26,
      chunkType: 'semantic_dossier',
      sourceRefs: [{ ref_type: 'paragraph', ref_id: 'para-1' }],
      metadata: { origin_stage: 'KEY_CONTENT_READY' },
      contentChecksum: 'content-checksum',
      vector: [0.1, 0.2, 0.3],
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const response = await service.retrieve({
    query: 'openai embedding',
  });

  assert.equal(response.items.length, 1);
  assert.equal(response.meta.degraded_mode, true);
  assert.equal(response.meta.profiles_used.length, 0);
  assert.equal(response.meta.skipped_profiles.length, 1);
  assert.equal(response.meta.skipped_profiles[0]?.provider, 'openai');
  assert.equal(response.meta.query_embedding_telemetry, null);
});

test('retrieve uses only the configured active embedding profile when active versions are mixed', async () => {
  const repository = new InMemoryLiteratureRepository();
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-LARGE',
    title: 'Large Profile Candidate',
    versionId: 'EV-RET-LARGE',
    chunkText: 'large profile semantic comparison evidence',
    profileId: 'default',
    model: 'text-embedding-3-large',
    dimension: 3,
    vector: [0.1, 0.2, 0.3],
  });
  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-SMALL',
    title: 'Small Profile Candidate',
    versionId: 'EV-RET-SMALL',
    chunkText: 'small profile should not be mixed into large retrieval',
    profileId: 'economy',
    model: 'text-embedding-3-small',
    dimension: 3,
    vector: [0.9, 0.1, 0.1],
  });
  const settingsService = {
    resolveOpenAIProviderApiKey: async () => 'sk-test',
    resolveActiveEmbeddingProfile: async () => ({
      profileId: 'default',
      provider: 'openai',
      model: 'text-embedding-3-large',
      dimensions: 3,
    }),
    resolveOpenAIEmbeddingConfig: async (profileId: 'default' | 'economy') => ({
      apiKey: 'sk-test',
      profileId,
      model: profileId === 'default' ? 'text-embedding-3-large' : 'text-embedding-3-small',
      dimensions: 3,
    }),
  } as LiteratureContentProcessingSettingsService;
  const previousFetch = globalThis.fetch;
  let embeddingCallCount = 0;
  globalThis.fetch = (async () => {
    embeddingCallCount += 1;
    return new Response(JSON.stringify({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { prompt_tokens: 2, total_tokens: 2 },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const service = new LiteratureRetrievalService(repository, settingsService);
    const response = await service.retrieve({
      query: 'semantic comparison',
      top_k: 10,
    });

    assert.equal(embeddingCallCount, 1);
    assert.deepEqual(response.items.map((item) => item.literature_id), ['LIT-RET-LARGE']);
    assert.equal(response.meta.profiles_used.length, 1);
    assert.equal(response.meta.profiles_used[0]?.model, 'text-embedding-3-large');
    assert.equal(response.meta.skipped_profiles.length, 1);
    assert.equal(response.meta.skipped_profiles[0]?.model, 'text-embedding-3-small');
    assert.equal(response.meta.query_embedding_telemetry?.embedding_input_tokens, 2);
    assert.equal(response.meta.query_embedding_telemetry?.total_tokens, 2);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('retrieve excludes stale indexes by default and can include them for diagnostics', async () => {
  const repository = new InMemoryLiteratureRepository();
  const service = new LiteratureRetrievalService(repository);
  const now = new Date().toISOString();

  await seedLocalLiterature(repository, {
    literatureId: 'LIT-RET-STALE',
    title: 'Writing Evidence Candidate',
    versionId: 'EV-RET-STALE',
    chunkText: 'writing evidence claim paragraph with grounded provenance',
    chunkType: 'evidence',
  });
  await repository.upsertPipelineStageState({
    id: 'LIT-RET-STALE-indexed-state',
    literatureId: 'LIT-RET-STALE',
    stageCode: 'INDEXED',
    status: 'STALE',
    lastRunId: null,
    detail: {
      reason_code: 'PROFILE_CHANGED',
      reason_message: 'Embedding profile changed after the active index was built.',
    },
    updatedAt: now,
  });

  const defaultResponse = await service.retrieve({
    query: 'writing evidence claim',
    profile: 'writing_evidence',
    top_k: 1,
  });

  assert.equal(defaultResponse.meta.profile, 'writing_evidence');
  assert.equal(defaultResponse.meta.freshness_warnings.length, 1);
  assert.equal(defaultResponse.items.length, 0);

  const response = await service.retrieve({
    query: 'writing evidence claim',
    profile: 'writing_evidence',
    top_k: 1,
    include_stale: true,
  });

  assert.equal(response.meta.profile, 'writing_evidence');
  assert.equal(response.meta.freshness_warnings.length, 1);
  assert.equal(response.meta.freshness_warnings[0]?.reason_code, 'PROFILE_CHANGED');
  assert.equal(response.items[0]?.retrieval_profile, 'writing_evidence');
  assert.equal(response.items[0]?.is_stale, true);
  assert.deepEqual(response.items[0]?.warnings, ['Embedding profile changed after the active index was built.']);
  assert.equal(response.items[0]?.evidence_chunks[0]?.chunk_type, 'evidence');
  assert.equal(response.items[0]?.evidence_chunks[0]?.score_breakdown.profile_boost, 0.16);
});
