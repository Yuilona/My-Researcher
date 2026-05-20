import assert from 'node:assert/strict';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import { buildApp } from '../app.js';

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function ref(
  refType: string,
  refId: string,
  titleCardId: string,
  versionId: string | null = null,
): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
    title_card_id: titleCardId,
  };
}

function assertStatus(response: { statusCode: number; body: string }, expected: number): void {
  if (response.statusCode !== expected) {
    assert.fail(`Expected HTTP ${expected}, received ${response.statusCode}: ${response.body}`);
  }
}

function manualLocator(input: {
  titleCardId: string;
  literatureRef: TopicSelectionFunctionalRef;
  sourceRef: TopicSelectionFunctionalRef;
  key: string;
}) {
  return {
    locator_type: 'manual',
    locator_ref: ref('manual_locator', input.key, input.titleCardId),
    literature_ref: input.literatureRef,
    source_ref: input.sourceRef,
    content_ref: null,
    section_ref: null,
    paragraph_ref: null,
    anchor_ref: null,
    manual_label: `Manual locator ${input.key}`,
  };
}

async function createLiterature(app: ReturnType<typeof buildApp>, suffix: string): Promise<string> {
  const importRes = await app.inject({
    method: 'POST',
    url: '/literature/collections/import',
    payload: {
      items: [
        {
          provider: 'manual',
          external_id: `topic-selection-v1a-api-${suffix}`,
          title: `Topic Selection API Evidence ${suffix}`,
          abstract: 'Evidence workflows miss reviewer-facing traceability from claims to decisions.',
          authors: ['API Route Author'],
          year: 2026,
          doi: `10.1000/topic-selection-api-${suffix.toLowerCase()}`,
          source_url: `https://example.com/topic-selection-api/${suffix.toLowerCase()}`,
        },
      ],
    },
  });
  assertStatus(importRes, 200);
  const body = importRes.json() as { results: Array<{ literature_id: string }> };
  const literatureId = body.results[0]?.literature_id;
  assert.ok(literatureId);
  return literatureId;
}

async function createTitleCard(app: ReturnType<typeof buildApp>, suffix: string): Promise<string> {
  const titleCardRes = await app.inject({
    method: 'POST',
    url: '/title-cards',
    payload: {
      working_title: `Topic Selection API Title ${suffix}`,
      brief: 'Validate evidence-to-need traceability through HTTP routes.',
    },
  });
  assertStatus(titleCardRes, 201);
  const body = titleCardRes.json() as { title_card_id: string };
  return body.title_card_id;
}

test('topic-selection v1a HTTP routes drive evidence-to-need validation through buildApp', async () => {
  const app = buildApp();
  try {
    const suffix = uniqueId('v1a-api');
    const literatureId = await createLiterature(app, suffix);
    const titleCardId = await createTitleCard(app, suffix);

    const basketRes = await app.inject({
      method: 'PATCH',
      url: `/title-cards/${encodeURIComponent(titleCardId)}/evidence-basket`,
      payload: {
        add_literature_ids: [literatureId],
      },
    });
    assertStatus(basketRes, 200);

    const seedRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/topic-seeds/from-title-card',
      payload: {
        title_card_id: titleCardId,
        created_by: 'system',
      },
    });
    assertStatus(seedRes, 201);
    const seed = seedRes.json() as { topic_seed_id: string };
    assert.ok(seed.topic_seed_id);

    const snapshotRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/literature-resource-pool-snapshots',
      payload: {
        title_card_id: titleCardId,
        topic_seed_id: seed.topic_seed_id,
        created_by: 'system',
      },
    });
    assertStatus(snapshotRes, 201);
    const snapshot = snapshotRes.json() as {
      literature_resource_pool_snapshot_id: string;
      literature_refs: TopicSelectionFunctionalRef[];
      content_source_refs: TopicSelectionFunctionalRef[];
    };
    const literatureRef = snapshot.literature_refs[0] ?? ref('literature_record', literatureId, titleCardId);
    const sourceRef = snapshot.content_source_refs[0] ?? ref('literature_source', `manual-source-${suffix}`, titleCardId);

    const planRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/search-plans',
      payload: {
        title_card_id: titleCardId,
        topic_seed_id: seed.topic_seed_id,
        literature_resource_pool_snapshot_id: snapshot.literature_resource_pool_snapshot_id,
        query_intents: [
          'support reviewer-facing traceability gap',
          'baseline decision chain misses provenance',
          'context local CS paper engineering workflow',
        ],
        coverage_intents: [
          {
            coverage_key: 'support-traceability',
            intent_type: 'support',
            query: 'support reviewer-facing traceability gap',
            expected_evidence_role: 'support',
          },
          {
            coverage_key: 'baseline-provenance',
            intent_type: 'baseline',
            query: 'baseline decision chain misses provenance',
            expected_evidence_role: 'baseline',
          },
          {
            coverage_key: 'context-workflow',
            intent_type: 'context',
            query: 'context local CS paper engineering workflow',
            expected_evidence_role: 'context',
          },
        ],
        created_by: 'system',
      },
    });
    assertStatus(planRes, 201);
    const plan = planRes.json() as {
      search_plan: { search_plan_id: string; plan_version: string };
      coverage_row_intents: Array<{ coverage_row_intent_id: string }>;
    };
    const [supportRow, baselineRow, contextRow] = plan.coverage_row_intents;
    assert.ok(supportRow);
    assert.ok(baselineRow);
    assert.ok(contextRow);

    const runRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/search-runs',
      payload: {
        title_card_id: titleCardId,
        search_plan_id: plan.search_plan.search_plan_id,
        result_accounting: {
          total_result_count: 3,
          unique_literature_count: 1,
          duplicate_result_count: 0,
          failed_source_count: 0,
          skipped_source_count: 0,
        },
        source_health_summary: {
          source_count: 1,
          warning_codes: [],
        },
        dedup_summary: {
          canonical_work_refs: [literatureRef],
        },
        evidence_map_input_refs: [literatureRef, sourceRef],
        coverage_observations: plan.coverage_row_intents.map((row) => ({
          coverage_row_intent_id: row.coverage_row_intent_id,
          status: 'succeeded',
          result_count: 1,
          source_count: 1,
        })),
        evidence_bindings: plan.coverage_row_intents.map((row, index) => ({
          coverage_row_intent_id: row.coverage_row_intent_id,
          literature_ref: literatureRef,
          source_refs: [sourceRef],
          binding_kind: 'retrieval_hit',
          result_rank: index + 1,
        })),
        coverage_assessments: plan.coverage_row_intents.map((row) => ({
          coverage_row_intent_id: row.coverage_row_intent_id,
          verdict: 'satisfied',
          confidence: 0.88,
          assessed_by: 'system',
        })),
        created_by: 'system',
      },
    });
    assertStatus(runRes, 201);
    const run = runRes.json() as { search_run: { search_run_id: string } };

    const matrixRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/search-plans/${encodeURIComponent(plan.search_plan.search_plan_id)}/coverage-matrix`,
    });
    assertStatus(matrixRes, 200);
    const matrix = matrixRes.json() as { summary: { satisfied_count: number } };
    assert.equal(matrix.summary.satisfied_count, 3);

    const evidenceMapRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/evidence-maps',
      payload: {
        title_card_id: titleCardId,
        search_run_id: run.search_run.search_run_id,
        evidence_units: [
          {
            client_unit_key: 'support',
            coverage_row_intent_id: supportRow.coverage_row_intent_id,
            evidence_role: 'support',
            literature_ref: literatureRef,
            locator: manualLocator({
              titleCardId,
              literatureRef,
              sourceRef,
              key: `support-${suffix}`,
            }),
            source_statement: 'Reviewers need traceability from source claims to topic-selection decisions.',
          },
          {
            client_unit_key: 'baseline',
            coverage_row_intent_id: baselineRow.coverage_row_intent_id,
            evidence_role: 'baseline',
            literature_ref: literatureRef,
            locator: manualLocator({
              titleCardId,
              literatureRef,
              sourceRef,
              key: `baseline-${suffix}`,
            }),
            source_statement: 'Baseline decision chains often collapse provenance into a single opaque status.',
          },
          {
            client_unit_key: 'context',
            coverage_row_intent_id: contextRow.coverage_row_intent_id,
            evidence_role: 'context',
            literature_ref: literatureRef,
            locator: manualLocator({
              titleCardId,
              literatureRef,
              sourceRef,
              key: `context-${suffix}`,
            }),
            source_statement: 'The workflow is scoped to local CS paper engineering and reviewer-aligned evidence review.',
          },
        ],
        created_by: 'system',
      },
    });
    assertStatus(evidenceMapRes, 201);
    const evidenceMap = evidenceMapRes.json() as {
      evidence_map: { evidence_map_id: string; support_unit_count: number };
    };
    assert.equal(evidenceMap.evidence_map.support_unit_count, 1);

    // T-087 Phase 2.3 — EvidenceUnit list by evidence-map drives the drilldown UI.
    const unitsRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/evidence-maps/${encodeURIComponent(evidenceMap.evidence_map.evidence_map_id)}/units`,
    });
    assertStatus(unitsRes, 200);
    const unitsList = unitsRes.json() as {
      items: Array<{ evidence_unit_id: string; evidence_map_id: string; evidence_role: string }>;
    };
    assert.ok(unitsList.items.length > 0);
    assert.ok(unitsList.items.every((unit) => unit.evidence_map_id === evidenceMap.evidence_map.evidence_map_id));

    const bundleRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/evidence-maps/${encodeURIComponent(evidenceMap.evidence_map.evidence_map_id)}/need-validation-bundle`,
    });
    assertStatus(bundleRes, 200);

    const candidateRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/need-candidates',
      payload: {
        title_card_id: titleCardId,
        evidence_map_id: evidenceMap.evidence_map.evidence_map_id,
        candidate_need: 'Reviewer-aligned topic selection needs traceable evidence-to-need decisions.',
        mechanism_type: 'workflow_gap',
        mechanism_summary: 'The decision chain is hard to audit without explicit gates and evidence refs.',
        scope_notes: 'Local-first CS paper engineering workflows that prepare reviewer-facing topic decisions.',
        prior_art_status: 'no_strong_solution_found',
        created_by: 'system',
      },
    });
    assertStatus(candidateRes, 201);
    const candidate = candidateRes.json() as { need_candidate_id: string };

    const readinessRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(candidate.need_candidate_id)}/readiness-assessments`,
      payload: {
        assessed_by: 'system',
      },
    });
    assertStatus(readinessRes, 201);
    const readiness = readinessRes.json() as { readiness_assessment_id: string; recommendation: string };
    assert.equal(readiness.recommendation, 'ready_for_validation');

    const packetRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/validation-support-packets',
      payload: {
        need_candidate_id: candidate.need_candidate_id,
        readiness_assessment_id: readiness.readiness_assessment_id,
        created_by: 'system',
      },
    });
    assertStatus(packetRes, 201);
    const packet = packetRes.json() as { validation_support_packet_id: string };

    // T-087 Phase 2.5 — packet picker driver: assert candidate-scoped list.
    const packetListRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(candidate.need_candidate_id)}/validation-support-packets`,
    });
    assertStatus(packetListRes, 200);
    const packetList = packetListRes.json() as { items: Array<{ validation_support_packet_id: string; need_candidate_id: string }> };
    assert.ok(packetList.items.some((item) => item.validation_support_packet_id === packet.validation_support_packet_id));
    assert.ok(packetList.items.every((item) => item.need_candidate_id === candidate.need_candidate_id));

    const adjudicationRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(candidate.need_candidate_id)}/adjudications`,
      payload: {
        support_packet_id: packet.validation_support_packet_id,
        final_decision: 'validate',
        rationale: 'Human reviewer confirms the need and trace boundary.',
        adjudicated_by: { actor_type: 'human', actor_id: 'route-test-reviewer' },
      },
    });
    assertStatus(adjudicationRes, 201);
    const adjudication = adjudicationRes.json() as {
      adjudication_result: { adjudication_result_id: string; output_validated_need_id: string | null };
      validated_need: null;
      v1b_input_bundle: null;
    };
    assert.ok(adjudication.adjudication_result.output_validated_need_id);
    assert.equal(adjudication.validated_need, null);
    assert.equal(adjudication.v1b_input_bundle, null);

    const confirmationRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/adjudications/${encodeURIComponent(
        adjudication.adjudication_result.adjudication_result_id,
      )}/human-confirmations`,
      payload: {
        human_actor: { actor_type: 'human', actor_id: 'route-test-reviewer' },
        human_rationale: 'Support, baseline, context, and handoff refs are sufficient for v1b input.',
      },
    });
    assertStatus(confirmationRes, 201);
    const confirmation = confirmationRes.json() as {
      validated_need: { validated_need_id: string };
    };
    assert.equal(adjudication.adjudication_result.output_validated_need_id, confirmation.validated_need.validated_need_id);

    const v1bBundleRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/v1b-input-bundles',
      payload: { validated_need_id: confirmation.validated_need.validated_need_id, created_by: 'system' },
    });
    assertStatus(v1bBundleRes, 201);
    const v1bBundle = v1bBundleRes.json() as { validated_need_id: string };
    assert.equal(v1bBundle.validated_need_id, confirmation.validated_need.validated_need_id);

    const qualitySignalRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/quality-signals',
      payload: {
        title_card_id: titleCardId,
        target_ref: ref('validated_need', confirmation.validated_need.validated_need_id, titleCardId),
        stage: 'v1a',
        check_type: 'trace_review',
        verdict: 'warn',
        issue_codes: ['TRACE_REVIEW_REQUIRED'],
        recommended_action: 'inspect_trace',
        refs: [ref('evidence_map', evidenceMap.evidence_map.evidence_map_id, titleCardId)],
      },
    });
    assertStatus(qualitySignalRes, 201);
    const qualitySignal = qualitySignalRes.json() as { quality_signal_id: string };

    const interpretSignalRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/quality-signals/${encodeURIComponent(qualitySignal.quality_signal_id)}/interpret`,
    });
    assertStatus(interpretSignalRes, 201);
    const interpretedSignal = interpretSignalRes.json() as { queue_item: { queue_item_type: string } };
    assert.equal(interpretedSignal.queue_item.queue_item_type, 'recheck');

    const acceptedRiskRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/accepted-risks',
      payload: {
        title_card_id: titleCardId,
        risk_type: 'residual_coverage_gap',
        target_ref: ref('validated_need', confirmation.validated_need.validated_need_id, titleCardId),
        scope_refs: [ref('search_plan', plan.search_plan.search_plan_id, titleCardId, plan.search_plan.plan_version)],
        affected_object_refs: [ref('validated_need', confirmation.validated_need.validated_need_id, titleCardId)],
        rationale: 'Residual route-test coverage risk is bounded.',
        accepted_by: { actor_type: 'human', actor_id: 'route-test-reviewer' },
        recheck_condition: 'new counter-evidence appears',
      },
    });
    assertStatus(acceptedRiskRes, 201);
    const acceptedRisk = acceptedRiskRes.json() as { status: string };
    assert.equal(acceptedRisk.status, 'active');

    const recheckCandidateRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/need-candidates',
      payload: {
        title_card_id: titleCardId,
        evidence_map_id: evidenceMap.evidence_map.evidence_map_id,
        candidate_need: 'Counter-evidence search should be rechecked before validating a secondary candidate.',
        mechanism_type: 'workflow_gap',
        scope_notes: 'Secondary route coverage candidate within topic-selection v1a.',
        prior_art_status: 'no_strong_solution_found',
        created_by: 'system',
      },
    });
    assertStatus(recheckCandidateRes, 201);
    const recheckCandidate = recheckCandidateRes.json() as { need_candidate_id: string };

    const recheckReadinessRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(recheckCandidate.need_candidate_id)}/readiness-assessments`,
      payload: {
        assessed_by: 'system',
      },
    });
    assertStatus(recheckReadinessRes, 201);
    const recheckReadiness = recheckReadinessRes.json() as { readiness_assessment_id: string };

    const recheckPacketRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/validation-support-packets',
      payload: {
        need_candidate_id: recheckCandidate.need_candidate_id,
        readiness_assessment_id: recheckReadiness.readiness_assessment_id,
        created_by: 'system',
      },
    });
    assertStatus(recheckPacketRes, 201);
    const recheckPacket = recheckPacketRes.json() as { validation_support_packet_id: string };

    const recheckAdjudicationRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(recheckCandidate.need_candidate_id)}/adjudications`,
      payload: {
        support_packet_id: recheckPacket.validation_support_packet_id,
        final_decision: 'request_searchplan_recheck',
        rationale: 'Counter-evidence coverage should be expanded.',
        searchplan_recheck_gap_codes: ['COUNTER_EVIDENCE_COVERAGE_GAP'],
        memory_suggestion: {
          suggestion_type: 'recheck_learning',
          rationale: 'Remember to expand counter-evidence before validating similar candidates.',
          suggestion_payload: { gap_code: 'COUNTER_EVIDENCE_COVERAGE_GAP' },
        },
        adjudicated_by: { actor_type: 'human', actor_id: 'route-test-reviewer' },
      },
    });
    assertStatus(recheckAdjudicationRes, 201);
    const recheckAdjudication = recheckAdjudicationRes.json() as {
      adjudication_result: {
        output_searchplan_recheck_request_ref: TopicSelectionFunctionalRef;
        output_memory_suggestion_ref: TopicSelectionFunctionalRef;
      };
    };

    const queuedRecheckRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/search-plan-recheck-requests/${encodeURIComponent(recheckAdjudication.adjudication_result.output_searchplan_recheck_request_ref.ref_id)}/queue`,
    });
    assertStatus(queuedRecheckRes, 201);
    const queuedRecheck = queuedRecheckRes.json() as { queue_item: { handler_key: string } };
    assert.equal(queuedRecheck.queue_item.handler_key, 'revise_search_plan');

    // T-087 Phase 2.2 — list SearchPlanRecheckRequests for the title-card.
    const recheckListRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/title-cards/${encodeURIComponent(titleCardId)}/search-plan-recheck-requests`,
    });
    assertStatus(recheckListRes, 200);
    const recheckList = recheckListRes.json() as {
      items: Array<{ search_plan_recheck_request_id: string; title_card_id: string }>;
    };
    assert.ok(recheckList.items.length > 0);
    assert.ok(recheckList.items.every((item) => item.title_card_id === titleCardId));

    const memoryRes = await app.inject({
      method: 'POST',
      url: `/topic-selection/v1a/candidate-memory-suggestions/${encodeURIComponent(recheckAdjudication.adjudication_result.output_memory_suggestion_ref.ref_id)}/materialize`,
      payload: {},
    });
    assertStatus(memoryRes, 201);
    const memory = memoryRes.json() as { memory_entry: { effect_policy: string } };
    assert.equal(memory.memory_entry.effect_policy, 'warn');

    // T-087 Phase 2.4 — list candidate memory suggestions for the recheck candidate.
    const memoryListRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/need-candidates/${encodeURIComponent(recheckCandidate.need_candidate_id)}/memory-suggestions`,
    });
    assertStatus(memoryListRes, 200);
    const memoryList = memoryListRes.json() as {
      items: Array<{ source_need_candidate_id: string; suggestion_type: string }>;
    };
    assert.ok(memoryList.items.length > 0);
    assert.ok(memoryList.items.every((item) => item.source_need_candidate_id === recheckCandidate.need_candidate_id));

    const queueRes = await app.inject({
      method: 'GET',
      url: '/topic-selection/v1a/work-queue/open',
    });
    assertStatus(queueRes, 200);
    const queue = queueRes.json() as { items: Array<{ title_card_id: string | null }> };
    assert.ok(queue.items.some((item) => item.title_card_id === titleCardId));

    // T-087 D1 read-only projections — assert the 4 list-by-title-card endpoints
    // expose what the reviewer workbench needs, without changing decision-chain
    // semantics. Each endpoint returns `{ items: [...] }` newest first.
    const listSearchPlansRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/title-cards/${encodeURIComponent(titleCardId)}/search-plans`,
    });
    assertStatus(listSearchPlansRes, 200);
    const searchPlanList = listSearchPlansRes.json() as { items: Array<{ title_card_id: string; search_plan_id: string }> };
    assert.ok(searchPlanList.items.length > 0);
    assert.ok(searchPlanList.items.every((item) => item.title_card_id === titleCardId));

    const listEvidenceMapsRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/title-cards/${encodeURIComponent(titleCardId)}/evidence-maps`,
    });
    assertStatus(listEvidenceMapsRes, 200);
    const evidenceMapList = listEvidenceMapsRes.json() as { items: Array<{ title_card_id: string; evidence_map_id: string }> };
    assert.ok(evidenceMapList.items.length > 0);
    assert.ok(evidenceMapList.items.every((item) => item.title_card_id === titleCardId));

    const listNeedCandidatesRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/title-cards/${encodeURIComponent(titleCardId)}/need-candidates`,
    });
    assertStatus(listNeedCandidatesRes, 200);
    const needCandidateList = listNeedCandidatesRes.json() as { items: Array<{ title_card_id: string; need_candidate_id: string }> };
    assert.ok(needCandidateList.items.length > 0);
    assert.ok(needCandidateList.items.every((item) => item.title_card_id === titleCardId));

    const listValidatedNeedsRes = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/title-cards/${encodeURIComponent(titleCardId)}/validated-needs`,
    });
    assertStatus(listValidatedNeedsRes, 200);
    const validatedNeedList = listValidatedNeedsRes.json() as { items: Array<{ title_card_id: string; validated_need_id: string }> };
    // ValidatedNeed creation depends on adjudication outcome; just assert shape.
    assert.ok(Array.isArray(validatedNeedList.items));
    assert.ok(validatedNeedList.items.every((item) => item.title_card_id === titleCardId));

    const offlineRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/offline-evaluation/datasets/synthetic-baseline',
      payload: {
        dataset_key: `topic-selection-v1a-api-${suffix}`,
      },
    });
    assertStatus(offlineRes, 201);
    const offline = offlineRes.json() as { dataset: { case_count: number }; cases: unknown[] };
    assert.equal(offline.dataset.case_count, offline.cases.length);
    assert.ok(offline.cases.length > 0);
  } finally {
    await app.close();
  }
});

test('topic-selection v1a routes reject malformed search-plan payloads before service execution', async () => {
  const app = buildApp();
  try {
    const res = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/search-plans',
      payload: {
        title_card_id: 'title-card-missing-query-intents',
        topic_seed_id: 'topic-seed-missing-query-intents',
        literature_resource_pool_snapshot_id: 'snapshot-missing-query-intents',
      },
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'INVALID_PAYLOAD');
    assert.match(body.error.message, /query_intents/);
  } finally {
    await app.close();
  }
});

test('topic-selection v1a routes accept omitted bodies for optional requestBody endpoints', async () => {
  const app = buildApp();
  try {
    const datasetRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/offline-evaluation/datasets',
    });
    assertStatus(datasetRes, 201);
    const dataset = datasetRes.json() as { offline_evaluation_dataset_id: string; dataset_key: string };
    assert.ok(dataset.offline_evaluation_dataset_id);
    assert.equal(dataset.dataset_key, 'topic-selection-v1a-synthetic-baseline');

    const syntheticRes = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/offline-evaluation/datasets/synthetic-baseline',
    });
    assertStatus(syntheticRes, 201);
    const synthetic = syntheticRes.json() as { dataset: { case_count: number }; cases: unknown[] };
    assert.equal(synthetic.dataset.case_count, synthetic.cases.length);
    assert.ok(synthetic.cases.length > 0);
  } finally {
    await app.close();
  }
});
