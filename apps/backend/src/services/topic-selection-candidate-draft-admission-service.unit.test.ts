import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionGenerateNeedCandidateNodeInput,
  TopicSelectionRankedCandidateDraftBatch,
  TopicSelectionRankedCandidateDraftBatchMinimumValidationReport,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import { TopicSelectionCandidateDraftAdmissionService } from './topic-selection-candidate-draft-admission-service.js';
import { TopicSelectionRankedCandidateDraftBatchValidatorService } from './topic-selection-ranked-candidate-draft-batch-validator-service.js';

const admission = new TopicSelectionCandidateDraftAdmissionService();
const minimumValidator = new TopicSelectionRankedCandidateDraftBatchValidatorService({
  now: () => '2026-05-19T00:00:00.000Z',
});

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
  };
}

function nodeInput(): TopicSelectionGenerateNeedCandidateNodeInput {
  return {
    schema_version: 'v1',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    topic_scope_ref: ref('topic_scope', 'topic_scope_001'),
    evidence_map_ref: ref('evidence_map', 'evidence_map_001'),
    evidence_strength_ref: ref('evidence_strength_assessment', 'strength_001'),
    resource_sample_set_ref: ref('resource_sample_set', 'sample_set_001'),
    candidate_pool_projection_ref: ref('candidate_pool_projection', 'candidate_pool_001'),
    search_snapshot_refs: [ref('search_run', 'search_run_001')],
    resource_snapshot_refs: [ref('literature_snapshot', 'literature_snapshot_001')],
    exploration_context_ref: {
      ...ref('artifact_ref', 'exploration_context_001'),
      ref_type: 'artifact_ref',
    },
    arbiter_context_ref: {
      ...ref('artifact_ref', 'arbiter_context_001'),
      ref_type: 'artifact_ref',
    },
    execution_mode: 'mocked_llm',
    profile_id: 'topic-selection.generate-need-candidate.single-agent.v1',
    policy_version: 'v1',
    operator_reuse_approval_ref: null,
  };
}

function rankedBatch(): TopicSelectionRankedCandidateDraftBatch {
  return {
    schema_version: 'v1',
    draft_batch: {
      batch_id: 'draft_batch_001',
      node_attempt_id: 'node_attempt_001',
      terminal_result: 'finalize',
      ranking_rationale: 'Grounded drafts ranked by expected research value.',
      max_persisted_candidates: 5,
    },
    drafts: [
      {
        draft_id: 'draft_001',
        rank: 1,
        candidate_need: 'Need a risk-aware evaluation workflow for RAG fine-tuning.',
        unmet_need_statement: 'Existing studies do not isolate retrieval-risk effects during fine-tuning.',
        mechanism_type: 'evaluation_gap',
        mechanism_summary: 'Risk-aware evaluation gap.',
        mechanism_payload: { axis: 'retrieval-risk' },
        scope_notes: 'CS literature workflow only.',
        non_goal_notes: null,
        prior_art_status: 'partial_solution_known',
        evidence_role_bundle: {
          support_unit_refs: [ref('evidence_unit', 'support_001')],
          challenge_unit_refs: [ref('evidence_unit', 'challenge_001')],
          baseline_unit_refs: [ref('evidence_unit', 'baseline_001')],
          context_unit_refs: [],
        },
        conflict_refs: [ref('evidence_conflict', 'conflict_001')],
        strength_assessment_refs: [ref('evidence_strength_assessment', 'strength_001')],
        accepted_risk_refs: [],
        gap_codes: ['risk_evaluation_gap'],
        speculative: false,
        confidence: 0.82,
      },
    ],
    rejected_framings: [],
    unresolved_points: [],
  };
}

function validMinimumReport(batch = rankedBatch()): TopicSelectionRankedCandidateDraftBatchMinimumValidationReport {
  return minimumValidator.validate({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    max_persisted_candidates: 5,
  });
}

function resolvableRefs(): TopicSelectionFunctionalRef[] {
  return [
    ref('evidence_unit', 'support_001'),
    ref('evidence_unit', 'challenge_001'),
    ref('evidence_unit', 'baseline_001'),
    ref('evidence_unit', 'context_001'),
    ref('evidence_conflict', 'conflict_001'),
    ref('evidence_strength_assessment', 'strength_001'),
  ];
}

function evidenceRoleRefEntries() {
  return [
    { evidence_ref: ref('evidence_unit', 'support_001'), role: 'support' },
    { evidence_ref: ref('evidence_unit', 'challenge_001'), role: 'challenge' },
    { evidence_ref: ref('evidence_unit', 'baseline_001'), role: 'baseline' },
    { evidence_ref: ref('evidence_unit', 'context_001'), role: 'context' },
  ];
}

test('candidate draft admission admits grounded non-duplicate drafts', () => {
  const batch = rankedBatch();
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    max_persisted_candidates: 5,
  });

  assert.equal(report.valid_draft_count, 1);
  assert.equal(report.rejected_draft_count, 0);
  assert.equal(report.merge_hint_count, 0);
  assert.deepEqual(report.blocking_reason_codes, []);
  assert.equal(report.draft_results[0].decision, 'admit');
  assert.equal(report.draft_results[0].admitted_draft_ref?.ref_type, 'candidate_draft');
  assert.equal(report.draft_results[0].resolved_ref_counts.support, 1);
  assert.equal(report.draft_results[0].resolved_ref_counts.challenge, 1);
  assert.equal(report.draft_results[0].normalized_candidate_key?.startsWith('need-a-risk-aware'), true);
});

test('candidate draft admission rejects non-evidence refs inside role bundles before persistence', () => {
  const batch = rankedBatch();
  batch.drafts[0] = {
    ...batch.drafts[0],
    evidence_role_bundle: {
      ...batch.drafts[0].evidence_role_bundle,
      support_unit_refs: [ref('evidence_conflict', 'conflict_001')],
    },
  };

  const rejected = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    remaining_round_budget: 0,
    max_persisted_candidates: 5,
  });
  const supplement = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    remaining_round_budget: 1,
    max_persisted_candidates: 5,
  });

  assert.equal(rejected.draft_results[0].decision, 'reject_artifact_only');
  assert.ok(rejected.draft_results[0].blocking_reason_codes.includes('ROLE_BUNDLE_NON_EVIDENCE_REF'));
  assert.equal(supplement.draft_results[0].decision, 'return_for_supplemental_round');
  assert.match(supplement.draft_results[0].supplemental_questions[0] ?? '', /evidence_unit refs/);
});

test('candidate draft admission rejects evidence units placed under the wrong role bundle', () => {
  const batch = rankedBatch();
  batch.drafts[0] = {
    ...batch.drafts[0],
    evidence_role_bundle: {
      ...batch.drafts[0].evidence_role_bundle,
      support_unit_refs: [ref('evidence_unit', 'context_001')],
    },
  };

  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    max_persisted_candidates: 5,
  });

  assert.equal(report.valid_draft_count, 0);
  assert.equal(report.draft_results[0].decision, 'reject_artifact_only');
  assert.ok(report.draft_results[0].blocking_reason_codes.includes('ROLE_BUNDLE_EVIDENCE_ROLE_MISMATCH'));
});

test('candidate draft admission allows conflict and strength refs only in dedicated arrays', () => {
  const batch = rankedBatch();
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    max_persisted_candidates: 5,
  });

  assert.equal(report.draft_results[0].decision, 'admit');
  assert.deepEqual(report.draft_results[0].blocking_reason_codes, []);
});

test('candidate draft admission emits method-family coverage warning without rejecting grounded drafts', () => {
  const batch = rankedBatch();
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    method_family_counts: {
      retrieval_augmented_generation: 2,
      risk_analysis: 1,
    },
    method_family_targets: ['retrieval_augmented_generation', 'fine_tuning', 'hybrid_adaptation'],
    max_persisted_candidates: 5,
  });

  assert.equal(report.draft_results[0].decision, 'admit');
  assert.ok(report.draft_results[0].reason_codes.includes('METHOD_FAMILY_COVERAGE_GAP'));
});

test('candidate draft admission ignores non-target method-family mentions for coverage warnings', () => {
  const batch = rankedBatch();
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    evidence_role_ref_entries: evidenceRoleRefEntries(),
    method_family_counts: {
      retrieval_augmented_generation: 2,
    },
    method_family_targets: ['retrieval_augmented_generation'],
    max_persisted_candidates: 5,
  });

  assert.equal(report.draft_results[0].decision, 'admit');
  assert.equal(report.draft_results[0].reason_codes.includes('METHOD_FAMILY_COVERAGE_GAP'), false);
});

test('candidate draft admission converts duplicate normalized keys to merge hints', () => {
  const batch = rankedBatch();
  const duplicateKey = 'need-a-risk-aware-evaluation-workflow-for-rag-fine-tuning-existing-studies-do-not-isolate-retrieval-risk-effects-during-fine-tuning';
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    candidate_pool_entries: [
      {
        normalized_candidate_key: duplicateKey,
        candidate_ref: ref('need_candidate', 'need_candidate_existing'),
      },
    ],
    max_persisted_candidates: 5,
  });

  assert.equal(report.valid_draft_count, 0);
  assert.equal(report.merge_hint_count, 1);
  assert.equal(report.draft_results[0].decision, 'merge_hint_only');
  assert.equal(report.draft_results[0].duplicate_candidate_refs[0].ref_id, 'need_candidate_existing');
  assert.equal(report.draft_results[0].merge_target_ref?.ref_id, 'need_candidate_existing');
});

test('candidate draft admission converts same-batch duplicate normalized keys to merge hints', () => {
  const batch = rankedBatch();
  batch.drafts = [
    batch.drafts[0],
    {
      ...batch.drafts[0],
      draft_id: 'draft_002',
      rank: 2,
    },
  ];
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    max_persisted_candidates: 5,
  });

  assert.equal(report.valid_draft_count, 1);
  assert.equal(report.merge_hint_count, 1);
  assert.equal(report.draft_results[0].decision, 'admit');
  assert.equal(report.draft_results[1].decision, 'merge_hint_only');
  assert.equal(report.draft_results[1].merge_target_ref?.ref_id, 'draft_001');
});

test('candidate draft admission rejects unresolved refs and ungrounded mechanism before persistence', () => {
  const batch = rankedBatch();
  batch.drafts[0] = {
    ...batch.drafts[0],
    candidate_need: 'More research is needed on an interesting topic.',
    unmet_need_statement: 'Explore LLMs.',
    mechanism_type: 'other',
    mechanism_summary: null,
    mechanism_payload: {},
  };
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: [ref('evidence_unit', 'support_001')],
    max_persisted_candidates: 5,
  });

  assert.equal(report.valid_draft_count, 0);
  assert.equal(report.draft_results[0].decision, 'reject_artifact_only');
  assert.ok(report.draft_results[0].reason_codes.includes('UNRESOLVED_CANDIDATE_DRAFT_REFS'));
  assert.ok(report.draft_results[0].blocking_reason_codes.includes('UNRESOLVED_CANDIDATE_DRAFT_REFS'));
  assert.deepEqual(report.blocking_reason_codes, ['NO_ADMISSIBLE_NEED_CANDIDATE']);
});

test('candidate draft admission rejects pseudo-gap mechanisms when refs are otherwise resolved', () => {
  const batch = rankedBatch();
  batch.drafts[0] = {
    ...batch.drafts[0],
    candidate_need: 'More research is needed on an interesting topic.',
    unmet_need_statement: 'Explore LLMs.',
    mechanism_type: 'other',
    mechanism_summary: null,
    mechanism_payload: {},
  };
  const report = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: validMinimumReport(batch),
    resolvable_refs: resolvableRefs(),
    max_persisted_candidates: 5,
  });

  assert.equal(report.valid_draft_count, 0);
  assert.equal(report.draft_results[0].decision, 'reject_artifact_only');
  assert.ok(report.draft_results[0].reason_codes.includes('PSEUDO_GAP_ONLY'));
  assert.deepEqual(report.blocking_reason_codes, ['NO_ADMISSIBLE_NEED_CANDIDATE']);
});

test('candidate draft admission routes speculative drafts to supplemental or human review', () => {
  const batch = rankedBatch();
  batch.drafts[0] = {
    ...batch.drafts[0],
    speculative: true,
    scope_notes: null,
    non_goal_notes: null,
    conflict_refs: [],
    evidence_role_bundle: {
      ...batch.drafts[0].evidence_role_bundle,
      challenge_unit_refs: [],
    },
  };
  const minimumReport = validMinimumReport(batch);
  const supplementalReport = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: minimumReport,
    resolvable_refs: [
      ref('evidence_unit', 'support_001'),
      ref('evidence_unit', 'baseline_001'),
      ref('evidence_strength_assessment', 'strength_001'),
    ],
    remaining_round_budget: 1,
    max_persisted_candidates: 5,
  });
  const humanReviewReport = admission.createAdmissionReport({
    node_input: nodeInput(),
    ranked_candidate_draft_batch: batch,
    minimum_validation_report: minimumReport,
    resolvable_refs: [
      ref('evidence_unit', 'support_001'),
      ref('evidence_unit', 'baseline_001'),
      ref('evidence_strength_assessment', 'strength_001'),
    ],
    remaining_round_budget: 0,
    max_persisted_candidates: 5,
  });

  assert.equal(supplementalReport.draft_results[0].decision, 'return_for_supplemental_round');
  assert.equal(supplementalReport.draft_results[0].supplemental_questions.length, 1);
  assert.equal(humanReviewReport.draft_results[0].decision, 'require_human_review');
  assert.equal(humanReviewReport.draft_results[0].required_human_review_points[0]?.ref_type, 'candidate_draft');
});

test('candidate draft admission refuses to run after failed minimum validation', () => {
  const batch = rankedBatch();
  const failedMinimumReport = {
    ...validMinimumReport(batch),
    valid: false,
    blocking_reason_codes: ['INVALID_RANKED_CANDIDATE_DRAFT_BATCH'],
  };

  assert.throws(
    () => admission.createAdmissionReport({
      node_input: nodeInput(),
      ranked_candidate_draft_batch: batch,
      minimum_validation_report: failedMinimumReport,
      resolvable_refs: resolvableRefs(),
      max_persisted_candidates: 5,
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'GATE_CONSTRAINT_FAILED',
  );
});
