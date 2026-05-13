import assert from 'node:assert/strict';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryLiteratureRepository } from '../repositories/in-memory-literature-repository.js';
import { InMemoryTitleCardManagementRepository } from '../repositories/title-card-management.repository.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionSearchResourceRepository } from '../repositories/in-memory-topic-selection-search-resource-repository.js';
import type { LiteratureRecord } from '../repositories/literature-repository.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionSearchResourceService } from './topic-selection-search-resource-service.js';

function makeService() {
  let sequence = 0;
  const now = () => '2026-05-13T00:00:00.000Z';
  const idFactory = (prefix: string) => `${prefix}_${++sequence}`;
  const titleCards = new InMemoryTitleCardManagementRepository();
  const literature = new InMemoryLiteratureRepository();
  const controlPlaneRepository = new InMemoryTopicSelectionControlPlaneRepository();
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository, { idFactory, now });
  const searchResourceRepository = new InMemoryTopicSelectionSearchResourceRepository();
  const service = new TopicSelectionSearchResourceService(
    searchResourceRepository,
    controlPlane,
    titleCards,
    literature,
    { idFactory, now },
  );
  return {
    controlPlaneRepository,
    literature,
    searchResourceRepository,
    service,
    titleCards,
  };
}

function ref(refType: string, refId: string, titleCardId = 'title_card_1'): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: titleCardId,
  };
}

function makeLiterature(id: string): LiteratureRecord {
  return {
    id,
    title: `Paper ${id}`,
    abstractText: 'A paper about robust literature retrieval.',
    keyContentDigest: 'problem: brittle retrieval; contribution: robust evidence indexing',
    authors: ['A. Researcher'],
    year: 2026,
    doiNormalized: null,
    arxivId: null,
    normalizedTitle: `paper ${id}`,
    titleAuthorsYearHash: `${id}-hash`,
    rightsClass: 'OA',
    tags: ['retrieval'],
    activeEmbeddingVersionId: null,
    createdAt: '2026-05-13T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
  };
}

async function seedTitleCardWithLiterature() {
  const ctx = makeService();
  const titleCard = await ctx.titleCards.createTitleCard({
    working_title: 'Robust evidence retrieval',
    brief: 'Find unmet needs in evidence-grounded literature retrieval.',
  });
  await ctx.literature.createLiterature(makeLiterature('lit_001'));
  await ctx.literature.upsertLiteratureSource({
    id: 'source_001',
    literatureId: 'lit_001',
    provider: 'manual',
    sourceItemId: 'manual-lit-001',
    sourceUrl: 'file://lit_001.pdf',
    rawPayload: {},
    fetchedAt: '2026-05-13T00:00:00.000Z',
  });
  await ctx.literature.upsertPipelineState({
    id: 'pipeline_state_001',
    literatureId: 'lit_001',
    citationComplete: true,
    abstractReady: true,
    keyContentReady: true,
    dedupStatus: 'unique',
    updatedAt: '2026-05-13T00:00:00.000Z',
  });
  await ctx.titleCards.updateEvidenceBasket(titleCard.title_card_id, {
    add_literature_ids: ['lit_001'],
  });
  return { ...ctx, titleCard };
}

async function createBasePlan() {
  const ctx = await seedTitleCardWithLiterature();
  const seed = await ctx.service.createTopicSeedFromTitleCard({
    title_card_id: ctx.titleCard.title_card_id,
    created_by: 'system',
  });
  const snapshot = await ctx.service.createLiteratureResourcePoolSnapshot({
    title_card_id: ctx.titleCard.title_card_id,
    topic_seed_id: seed.topic_seed_id,
    created_by: 'system',
  });
  const plan = await ctx.service.createSearchPlan({
    title_card_id: ctx.titleCard.title_card_id,
    topic_seed_id: seed.topic_seed_id,
    literature_resource_pool_snapshot_id: snapshot.literature_resource_pool_snapshot_id,
    query_intents: ['robust retrieval evidence gaps', 'baseline retrieval limitations'],
    must_check_constraints: ['include baseline and counter-evidence'],
    exclusion_rules: ['exclude non-CS papers'],
    coverage_intents: [
      {
        coverage_key: 'support-gap',
        intent_type: 'support',
        query: 'robust retrieval evidence gaps',
        expected_evidence_role: 'support',
      },
      {
        coverage_key: 'baseline-check',
        intent_type: 'baseline',
        query: 'baseline retrieval limitations',
        expected_evidence_role: 'baseline',
      },
    ],
    created_by: 'system',
  });
  return { ...ctx, plan, seed, snapshot };
}

test('fake v1a slice creates seed, literature snapshot, SearchPlan, SearchRun, and matrix from child records', async () => {
  const ctx = await createBasePlan();
  const supportIntent = ctx.plan.coverage_row_intents[0]!;
  const searchRun = await ctx.service.recordSearchRun({
    title_card_id: ctx.titleCard.title_card_id,
    search_plan_id: ctx.plan.search_plan.search_plan_id,
    result_accounting: {
      total_result_count: 3,
      unique_literature_count: 1,
      duplicate_result_count: 1,
      failed_source_count: 0,
      skipped_source_count: 0,
    },
    source_health_summary: {
      source_count: 1,
      degraded_source_count: 0,
      warning_codes: [],
    },
    dedup_summary: {
      canonical_work_refs: [ref('literature_record', 'lit_001', ctx.titleCard.title_card_id)],
    },
    evidence_map_input_refs: [
      ref('literature_record', 'lit_001', ctx.titleCard.title_card_id),
      ref('literature_source', 'source_001', ctx.titleCard.title_card_id),
    ],
    raw_log_artifact: {
      provider: 'fixture',
      hits: ['lit_001'],
    },
    coverage_observations: [
      {
        coverage_row_intent_id: supportIntent.coverage_row_intent_id,
        status: 'succeeded',
        result_count: 3,
        source_count: 1,
      },
    ],
    evidence_bindings: [
      {
        coverage_row_intent_id: supportIntent.coverage_row_intent_id,
        literature_ref: ref('literature_record', 'lit_001', ctx.titleCard.title_card_id),
        source_refs: [ref('literature_source', 'source_001', ctx.titleCard.title_card_id)],
        binding_kind: 'retrieval_hit',
        result_rank: 1,
      },
    ],
    coverage_assessments: [
      {
        coverage_row_intent_id: supportIntent.coverage_row_intent_id,
        verdict: 'satisfied',
        confidence: 0.82,
        assessed_by: 'system',
      },
    ],
    created_by: 'system',
  });

  const matrix = await ctx.service.getCoverageMatrix(ctx.plan.search_plan.search_plan_id);

  assert.equal(ctx.seed.title_card_id, ctx.titleCard.title_card_id);
  assert.equal(ctx.snapshot.literature_refs[0]?.ref_id, 'lit_001');
  assert.equal(ctx.plan.search_plan.literature_snapshot_ref.ref_id, ctx.snapshot.literature_resource_pool_snapshot_id);
  assert.equal(searchRun.search_run.search_plan_ref.ref_id, ctx.plan.search_plan.search_plan_id);
  assert.equal(searchRun.search_run.artifact_refs.length, 1);
  assert.equal(matrix.rows.length, 2);
  assert.equal(matrix.summary.satisfied_count, 1);
  assert.equal(matrix.summary.unassessed_count, 1);
  assert.equal(matrix.rows[0]?.evidence_bindings[0]?.literature_ref.ref_id, 'lit_001');
});

test('SearchPlan creation requires concrete seed and literature snapshot refs', async () => {
  const ctx = await seedTitleCardWithLiterature();

  await assert.rejects(
    () => ctx.service.createSearchPlan({
      title_card_id: ctx.titleCard.title_card_id,
      topic_seed_id: 'missing_seed',
      literature_resource_pool_snapshot_id: 'missing_snapshot',
      query_intents: ['gap query'],
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 404
      && error.message.includes('TopicSeed missing_seed not found'),
  );
});

test('SearchRun cannot become consumable without source health and result accounting', async () => {
  const ctx = await createBasePlan();

  await assert.rejects(
    () => ctx.service.recordSearchRun({
      title_card_id: ctx.titleCard.title_card_id,
      search_plan_id: ctx.plan.search_plan.search_plan_id,
      result_accounting: {
        total_result_count: Number.NaN,
        unique_literature_count: 1,
        duplicate_result_count: 0,
        failed_source_count: 0,
        skipped_source_count: 0,
      },
      source_health_summary: {},
      evidence_map_input_refs: [ref('literature_record', 'lit_001', ctx.titleCard.title_card_id)],
      created_by: 'system',
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 409
      && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('raw search logs cannot be used as EvidenceMap authority refs', async () => {
  const ctx = await createBasePlan();

  await assert.rejects(
    () => ctx.service.recordSearchRun({
      title_card_id: ctx.titleCard.title_card_id,
      search_plan_id: ctx.plan.search_plan.search_plan_id,
      result_accounting: {
        total_result_count: 1,
        unique_literature_count: 1,
        duplicate_result_count: 0,
        failed_source_count: 0,
        skipped_source_count: 0,
      },
      source_health_summary: {
        source_count: 1,
      },
      evidence_map_input_refs: [ref('artifact_ref', 'raw_log_001', ctx.titleCard.title_card_id)],
      raw_log_artifact: { hits: ['lit_001'] },
      created_by: 'system',
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 409
      && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});

test('SearchRun coverage records must reference rows owned by the SearchPlan', async () => {
  const ctx = await createBasePlan();

  await assert.rejects(
    () => ctx.service.recordSearchRun({
      title_card_id: ctx.titleCard.title_card_id,
      search_plan_id: ctx.plan.search_plan.search_plan_id,
      result_accounting: {
        total_result_count: 1,
        unique_literature_count: 1,
        duplicate_result_count: 0,
        failed_source_count: 0,
        skipped_source_count: 0,
      },
      source_health_summary: {
        source_count: 1,
      },
      evidence_map_input_refs: [ref('literature_record', 'lit_001', ctx.titleCard.title_card_id)],
      coverage_observations: [
        {
          coverage_row_intent_id: 'coverage_intent_from_another_plan',
          status: 'succeeded',
          result_count: 1,
          source_count: 1,
        },
      ],
      created_by: 'system',
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 409
      && error.errorCode === 'VERSION_CONFLICT'
      && error.message.includes('coverage_intent_from_another_plan'),
  );
});

test('SearchPlanRecheckRequest accepted, reject, accepted-risk, and materialized outcomes remain traceable', async () => {
  const ctx = await createBasePlan();
  const sourceRef = ref('need_candidate', 'need_candidate_001', ctx.titleCard.title_card_id);
  const accepted = await ctx.service.createSearchPlanRecheckRequest({
    title_card_id: ctx.titleCard.title_card_id,
    source_ref: sourceRef,
    target_search_plan_id: ctx.plan.search_plan.search_plan_id,
    reason: 'Candidate found a useful optional expansion.',
    gap_codes: ['OPTIONAL_EXPANSION'],
  });
  const acceptedResult = await ctx.service.resolveSearchPlanRecheckRequest({
    request_id: accepted.search_plan_recheck_request_id,
    outcome: 'accepted',
    decision_summary: 'Accepted as a terminal note; no revised plan is required.',
  });
  assert.equal(acceptedResult.request.status, 'accepted');
  assert.equal(acceptedResult.request.resulting_search_plan_ref, null);
  await assert.rejects(
    () => ctx.service.resolveSearchPlanRecheckRequest({
      request_id: accepted.search_plan_recheck_request_id,
      outcome: 'materialized',
      decision_summary: 'Should not re-resolve an accepted request.',
      revised_search_plan: {
        plan_version: 'illegal-reopen',
        query_intents: ['illegal reopen'],
      },
    }),
    (error: unknown) =>
      error instanceof AppError
      && error.statusCode === 409
      && error.errorCode === 'VERSION_CONFLICT',
  );

  const rejected = await ctx.service.createSearchPlanRecheckRequest({
    title_card_id: ctx.titleCard.title_card_id,
    source_ref: sourceRef,
    target_search_plan_id: ctx.plan.search_plan.search_plan_id,
    reason: 'Candidate found weak baseline coverage.',
    gap_codes: ['BASELINE_GAP'],
  });
  const rejectedResult = await ctx.service.resolveSearchPlanRecheckRequest({
    request_id: rejected.search_plan_recheck_request_id,
    outcome: 'rejected',
    decision_summary: 'Existing baseline row is sufficient for v1a.',
  });
  assert.equal(rejectedResult.request.status, 'rejected');
  assert.equal(rejectedResult.request.resulting_search_plan_ref, null);

  const acceptedRisk = await ctx.service.createSearchPlanRecheckRequest({
    title_card_id: ctx.titleCard.title_card_id,
    source_ref: sourceRef,
    target_search_plan_id: ctx.plan.search_plan.search_plan_id,
    reason: 'Coverage source is temporarily unavailable.',
    gap_codes: ['SOURCE_UNAVAILABLE'],
  });
  const acceptedRiskResult = await ctx.service.resolveSearchPlanRecheckRequest({
    request_id: acceptedRisk.search_plan_recheck_request_id,
    outcome: 'accepted_risk',
    decision_summary: 'Proceed with an explicit source-availability risk.',
    accepted_risk_refs: [ref('accepted_risk', 'risk_001', ctx.titleCard.title_card_id)],
  });
  assert.equal(acceptedRiskResult.request.status, 'accepted_risk');
  assert.equal(acceptedRiskResult.request.accepted_risk_refs[0]?.ref_id, 'risk_001');

  const materialized = await ctx.service.createSearchPlanRecheckRequest({
    title_card_id: ctx.titleCard.title_card_id,
    source_ref: sourceRef,
    target_search_plan_id: ctx.plan.search_plan.search_plan_id,
    reason: 'Need validation requires counter-evidence coverage.',
    gap_codes: ['COUNTER_EVIDENCE_GAP'],
  });
  const materializedResult = await ctx.service.resolveSearchPlanRecheckRequest({
    request_id: materialized.search_plan_recheck_request_id,
    outcome: 'materialized',
    decision_summary: 'Created a revised plan and follow-up SearchRun.',
    revised_search_plan: {
      plan_version: 'recheck-v1',
      query_intents: ['counter evidence robust retrieval failures'],
      coverage_intents: [
        {
          coverage_key: 'counter-evidence',
          intent_type: 'challenge',
          query: 'counter evidence robust retrieval failures',
          expected_evidence_role: 'challenge',
        },
      ],
      created_by: 'system',
    },
    follow_up_search_run: {
      result_accounting: {
        total_result_count: 1,
        unique_literature_count: 1,
        duplicate_result_count: 0,
        failed_source_count: 0,
        skipped_source_count: 0,
      },
      source_health_summary: {
        source_count: 1,
      },
      evidence_map_input_refs: [ref('literature_record', 'lit_001', ctx.titleCard.title_card_id)],
      created_by: 'system',
    },
  });

  assert.equal(materializedResult.request.status, 'materialized');
  assert.equal(materializedResult.request.resulting_search_plan_ref?.ref_id, materializedResult.revised_search_plan?.search_plan_id);
  assert.equal(materializedResult.request.resulting_search_run_ref?.ref_id, materializedResult.follow_up_search_run?.search_run_id);
  assert.equal(materializedResult.revised_search_plan?.parent_search_plan_ref?.ref_id, ctx.plan.search_plan.search_plan_id);
  assert.equal(materializedResult.revised_search_plan?.recheck_request_ref?.ref_id, materialized.search_plan_recheck_request_id);
  assert.equal(materializedResult.follow_up_search_run?.run_kind, 'recheck_followup');
});
