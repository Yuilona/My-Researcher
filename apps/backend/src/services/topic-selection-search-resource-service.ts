import crypto from 'node:crypto';
import type {
  TopicSelectionActorRef,
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
  TopicSelectionGateIssue,
  TopicSelectionStateWriteIntent,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionCoverageAssessmentVerdict,
  TopicSelectionCoverageBindingKind,
  TopicSelectionCoverageExecutionStatus,
  TopicSelectionCoverageIntentType,
  TopicSelectionCoverageRowIntentRecord,
  TopicSelectionEvidenceRole,
  TopicSelectionLiteratureResourcePoolSnapshotRecord,
  TopicSelectionResourcePoolSource,
  TopicSelectionSearchPlanCoverageMatrix,
  TopicSelectionSearchPlanRecord,
  TopicSelectionSearchPlanRecheckRequestRecord,
  TopicSelectionSearchPlanRecheckRequestStatus,
  TopicSelectionSearchRunKind,
  TopicSelectionSearchRunRecord,
  TopicSelectionSearchRunResultAccounting,
  TopicSelectionSearchRunStatus,
  TopicSelectionSourceHealthSummary,
  TopicSelectionTopicSeedRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-search-resource-contracts';
import { AppError } from '../errors/app-error.js';
import type { LiteratureRepository } from '../repositories/literature-repository.js';
import type { TitleCardManagementRepository } from '../repositories/title-card-management.repository.js';
import type {
  TopicSelectionSearchResourceRepository,
  TopicSelectionSearchRunCoverageRecords,
  TopicSelectionSearchRunWithCoverageRecordsResult,
} from '../repositories/topic-selection-search-resource.repository.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';

type IdFactory = (prefix: string) => string;

type ServiceOptions = {
  idFactory?: IdFactory;
  now?: () => string;
};

type CreateTopicSeedFromTitleCardInput = {
  workspace_id?: string | null;
  title_card_id: string;
  seed_version?: string;
  intent_summary?: string;
  scope_notes?: string | null;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type CreateLiteratureResourcePoolSnapshotInput = {
  workspace_id?: string | null;
  title_card_id: string;
  topic_seed_id: string;
  snapshot_version?: string;
  source_scope?: TopicSelectionResourcePoolSource;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type CoverageIntentInput = {
  coverage_key?: string;
  intent_type?: TopicSelectionCoverageIntentType;
  query: string;
  rationale?: string;
  required?: boolean;
  priority?: number;
  target_source_types?: string[];
  expected_evidence_role?: TopicSelectionEvidenceRole;
  refs?: TopicSelectionFunctionalRef[];
};

type CreateSearchPlanInput = {
  workspace_id?: string | null;
  title_card_id: string;
  topic_seed_id: string;
  literature_resource_pool_snapshot_id: string;
  plan_version?: string;
  query_intents: string[];
  must_check_constraints?: string[];
  exclusion_rules?: string[];
  coverage_strategy?: Record<string, unknown>;
  coverage_intents?: CoverageIntentInput[];
  parent_search_plan_ref?: TopicSelectionFunctionalRef | null;
  recheck_request_ref?: TopicSelectionFunctionalRef | null;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type CoverageExecutionObservationInput = {
  coverage_row_intent_id: string;
  status: TopicSelectionCoverageExecutionStatus;
  result_count?: number;
  source_count?: number;
  missing_reason_codes?: string[];
  notes?: string | null;
};

type CoverageEvidenceBindingInput = {
  coverage_row_intent_id: string;
  literature_ref: TopicSelectionFunctionalRef;
  source_refs?: TopicSelectionFunctionalRef[];
  binding_kind?: TopicSelectionCoverageBindingKind;
  result_rank?: number | null;
};

type CoverageAssessmentInput = {
  coverage_row_intent_id: string;
  verdict: TopicSelectionCoverageAssessmentVerdict;
  issue_codes?: string[];
  confidence?: number | null;
  assessed_by?: TopicSelectionActorType;
};

type CoverageRiskAcceptanceInput = {
  coverage_row_intent_id: string;
  accepted_risk_ref: TopicSelectionFunctionalRef;
  accepted_by: TopicSelectionActorRef;
  rationale: string;
  expires_at?: string | null;
};

type RecordSearchRunInput = {
  workspace_id?: string | null;
  title_card_id: string;
  search_plan_id: string;
  literature_resource_pool_snapshot_id?: string;
  run_kind?: TopicSelectionSearchRunKind;
  run_status?: TopicSelectionSearchRunStatus;
  query_provenance?: Array<Record<string, unknown>>;
  result_accounting: TopicSelectionSearchRunResultAccounting;
  source_health_summary: Record<string, unknown>;
  dedup_summary?: Record<string, unknown>;
  evidence_map_input_refs: TopicSelectionFunctionalRef[];
  raw_log_artifact?: Record<string, unknown> | null;
  coverage_observations?: CoverageExecutionObservationInput[];
  evidence_bindings?: CoverageEvidenceBindingInput[];
  coverage_assessments?: CoverageAssessmentInput[];
  coverage_risk_acceptances?: CoverageRiskAcceptanceInput[];
  started_at?: string;
  finished_at?: string | null;
  created_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type CreateSearchPlanRecheckRequestInput = {
  workspace_id?: string | null;
  title_card_id: string;
  source_ref: TopicSelectionFunctionalRef;
  target_search_plan_id: string;
  reason: string;
  gap_codes?: string[];
  requested_by?: TopicSelectionActorType;
  policy_version_id?: string | null;
};

type ResolveSearchPlanRecheckRequestInput = {
  request_id: string;
  outcome: Extract<TopicSelectionSearchPlanRecheckRequestStatus, 'accepted' | 'rejected' | 'accepted_risk' | 'materialized'>;
  decision_summary: string;
  accepted_risk_refs?: TopicSelectionFunctionalRef[];
  revised_search_plan?: Omit<CreateSearchPlanInput, 'title_card_id' | 'topic_seed_id' | 'literature_resource_pool_snapshot_id' | 'parent_search_plan_ref' | 'recheck_request_ref'>;
  follow_up_search_run?: Omit<RecordSearchRunInput, 'title_card_id' | 'search_plan_id' | 'literature_resource_pool_snapshot_id' | 'run_kind'>;
};

type ResolveSearchPlanRecheckRequestResult = {
  request: TopicSelectionSearchPlanRecheckRequestRecord;
  revised_search_plan?: TopicSelectionSearchPlanRecord;
  follow_up_search_run?: TopicSelectionSearchRunRecord;
};

const CONSUMABLE_SEARCH_RUN_STATUSES = new Set<TopicSelectionSearchRunStatus>(['succeeded', 'partial']);

export class TopicSelectionSearchResourceService {
  private readonly idFactory: IdFactory;
  private readonly now: () => string;

  constructor(
    private readonly repository: TopicSelectionSearchResourceRepository,
    private readonly controlPlane: TopicSelectionControlPlaneService,
    private readonly titleCards: TitleCardManagementRepository,
    private readonly literature: LiteratureRepository,
    options: ServiceOptions = {},
  ) {
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async createTopicSeedFromTitleCard(
    input: CreateTopicSeedFromTitleCardInput,
  ): Promise<TopicSelectionTopicSeedRecord> {
    const titleCard = await this.titleCards.getTitleCard(input.title_card_id);
    if (!titleCard) {
      throw new AppError(404, 'NOT_FOUND', `Title card ${input.title_card_id} not found.`);
    }

    const topicSeedId = this.idFactory('topic_seed');
    const topicSeedRef = this.ref('topic_seed', topicSeedId, input.title_card_id, input.seed_version ?? 'v1');
    const titleCardRef = this.ref('title_card', titleCard.title_card_id, titleCard.title_card_id);
    const snapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      target_ref: topicSeedRef,
      source_refs: [titleCardRef],
      payload: {
        title_card: {
          working_title: titleCard.working_title,
          brief: titleCard.brief,
          status: titleCard.status,
          updated_at: titleCard.updated_at,
        },
        scope_notes: input.scope_notes ?? null,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      gate_key: 'topic-selection.topic-seed-ready',
      target_ref: topicSeedRef,
      input_snapshot_id: snapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      transition_key: 'title-card-to-topic-seed',
      source_ref: titleCardRef,
      target_ref: topicSeedRef,
      gate_result_id: gate.readiness_gate_result_id,
      input_snapshot_id: snapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(topicSeedRef, 'execution', 'topic_seed', 'ready')],
      created_authority_refs: [topicSeedRef],
    });
    this.assertTransitionPassed(transition.result, 'TopicSeed');

    const record: TopicSelectionTopicSeedRecord = {
      topic_seed_id: topicSeedId,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      seed_version: input.seed_version ?? 'v1',
      seed_kind: 'title_card',
      working_title: titleCard.working_title,
      intent_summary: input.intent_summary ?? titleCard.brief,
      scope_notes: input.scope_notes ?? null,
      source_title_card_ref: titleCardRef,
      source_refs: [titleCardRef],
      input_snapshot_id: snapshot.input_snapshot_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      trace_snapshot_id: null,
      created_by: input.created_by ?? 'system',
      created_at: this.now(),
    };
    return this.repository.createTopicSeed(record);
  }

  async createLiteratureResourcePoolSnapshot(
    input: CreateLiteratureResourcePoolSnapshotInput,
  ): Promise<TopicSelectionLiteratureResourcePoolSnapshotRecord> {
    const topicSeed = await this.requireTopicSeed(input.topic_seed_id);
    if (topicSeed.title_card_id !== input.title_card_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'TopicSeed belongs to a different title card.');
    }

    const basket = await this.titleCards.getEvidenceBasket(input.title_card_id);
    if (basket.items.length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Literature snapshot requires at least one basket item.');
    }

    const literatureIds = basket.items.map((item) => item.literature_id);
    const literatures = await this.literature.listLiteraturesByIds(literatureIds);
    const literatureById = new Map(literatures.map((item) => [item.id, item]));
    const pipelineStates = await this.literature.listPipelineStatesByLiteratureIds(literatureIds);
    const pipelineByLiteratureId = new Map(pipelineStates.map((item) => [item.literatureId, item]));
    const contentSourceRefs: TopicSelectionFunctionalRef[] = [];
    let sourceCount = 0;
    for (const literatureId of literatureIds) {
      const sources = await this.literature.listSourcesByLiteratureId(literatureId);
      sourceCount += sources.length;
      contentSourceRefs.push(...sources.map((source) => this.ref('literature_source', source.id, input.title_card_id)));
    }

    const missingLiteratureIds = literatureIds.filter((literatureId) => !literatureById.has(literatureId));
    const sourceHealthSummary = this.buildLiteratureSourceHealthSummary(
      literatureIds,
      literatureById,
      pipelineByLiteratureId,
      sourceCount,
      missingLiteratureIds,
    );
    const literatureRefs = literatureIds
      .filter((literatureId) => literatureById.has(literatureId))
      .map((literatureId) => this.ref('literature_record', literatureId, input.title_card_id));
    const snapshotPayload = {
      basket_updated_at: basket.updated_at,
      literature_refs: literatureRefs,
      content_source_refs: contentSourceRefs,
      source_health_summary: sourceHealthSummary,
    };
    const snapshotHash = sha256Text(stableStringify(snapshotPayload));
    const snapshotId = this.idFactory('literature_snapshot');
    const snapshotVersion = input.snapshot_version ?? this.versionFromId(snapshotId);
    const snapshotRef = this.ref(
      'literature_resource_pool_snapshot',
      snapshotId,
      input.title_card_id,
      snapshotVersion,
    );
    const topicSeedRef = this.ref('topic_seed', topicSeed.topic_seed_id, input.title_card_id, topicSeed.seed_version);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      target_ref: snapshotRef,
      source_refs: [topicSeedRef, ...literatureRefs, ...contentSourceRefs],
      payload: snapshotPayload,
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const blockers = missingLiteratureIds.length > 0
      ? [this.blocker('MISSING_LITERATURE_RECORD', 'Snapshot contains basket ids that cannot be resolved.')]
      : [];
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      gate_key: 'topic-selection.literature-snapshot-ready',
      target_ref: snapshotRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      blockers,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      transition_key: 'topic-seed-to-literature-snapshot',
      source_ref: topicSeedRef,
      target_ref: snapshotRef,
      gate_result_id: gate.readiness_gate_result_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(snapshotRef, 'freshness', 'literature_snapshot', 'current')],
      created_authority_refs: [snapshotRef],
    });
    this.assertTransitionPassed(transition.result, 'LiteratureResourcePoolSnapshot');

    return this.repository.createLiteratureResourcePoolSnapshot({
      literature_resource_pool_snapshot_id: snapshotId,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      snapshot_version: snapshotVersion,
      source_scope: input.source_scope ?? 'title_card_evidence_basket',
      topic_seed_ref: topicSeedRef,
      literature_refs: literatureRefs,
      content_source_refs: contentSourceRefs,
      source_health_summary: sourceHealthSummary,
      snapshot_hash: snapshotHash,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      created_by: input.created_by ?? 'system',
      created_at: this.now(),
    });
  }

  async createSearchPlan(input: CreateSearchPlanInput): Promise<{
    search_plan: TopicSelectionSearchPlanRecord;
    coverage_row_intents: TopicSelectionCoverageRowIntentRecord[];
  }> {
    const topicSeed = await this.requireTopicSeed(input.topic_seed_id);
    const literatureSnapshot = await this.requireLiteratureSnapshot(input.literature_resource_pool_snapshot_id);
    this.assertSameTitleCard(input.title_card_id, topicSeed.title_card_id, 'TopicSeed');
    this.assertSameTitleCard(input.title_card_id, literatureSnapshot.title_card_id, 'LiteratureResourcePoolSnapshot');
    if (literatureSnapshot.topic_seed_ref.ref_id !== topicSeed.topic_seed_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'SearchPlan snapshot does not trace to the requested TopicSeed.');
    }

    const searchPlanId = this.idFactory('search_plan');
    const planVersion = input.plan_version ?? this.versionFromId(searchPlanId);
    const searchPlanRef = this.ref('search_plan', searchPlanId, input.title_card_id, planVersion);
    const topicSeedRef = this.ref('topic_seed', topicSeed.topic_seed_id, input.title_card_id, topicSeed.seed_version);
    const literatureSnapshotRef = this.ref(
      'literature_resource_pool_snapshot',
      literatureSnapshot.literature_resource_pool_snapshot_id,
      input.title_card_id,
      literatureSnapshot.snapshot_version,
    );
    const coverageInputs = this.normalizeCoverageIntents(input.query_intents, input.coverage_intents);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      target_ref: searchPlanRef,
      source_refs: [topicSeedRef, literatureSnapshotRef],
      payload: {
        query_intents: input.query_intents,
        must_check_constraints: input.must_check_constraints ?? [],
        exclusion_rules: input.exclusion_rules ?? [],
        coverage_strategy: input.coverage_strategy ?? {},
        coverage_intents: coverageInputs,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      workflow_key: 'topic-selection.search-plan-draft',
      workflow_profile_key: 'deterministic-contract',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      output_summary: { coverage_row_count: coverageInputs.length },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            query_intents: input.query_intents,
            coverage_intents: coverageInputs,
          },
        },
      ],
      created_by: input.created_by ?? 'system',
    });
    const blockers = this.searchPlanBlockers(input.query_intents, coverageInputs);
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      gate_key: 'topic-selection.search-plan-ready',
      target_ref: searchPlanRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      blockers,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      transition_key: 'literature-snapshot-to-search-plan',
      source_ref: literatureSnapshotRef,
      target_ref: searchPlanRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(searchPlanRef, 'execution', 'search_plan', 'ready')],
      created_authority_refs: [searchPlanRef],
    });
    this.assertTransitionPassed(transition.result, 'SearchPlan');

    const artifactRefs = workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, input.title_card_id));
    const createdAt = this.now();
    const searchPlan: TopicSelectionSearchPlanRecord = {
      search_plan_id: searchPlanId,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      plan_version: planVersion,
      status: 'ready',
      topic_seed_ref: topicSeedRef,
      literature_snapshot_ref: literatureSnapshotRef,
      parent_search_plan_ref: input.parent_search_plan_ref ?? null,
      recheck_request_ref: input.recheck_request_ref ?? null,
      query_intents: input.query_intents,
      must_check_constraints: input.must_check_constraints ?? [],
      exclusion_rules: input.exclusion_rules ?? [],
      coverage_strategy: input.coverage_strategy ?? {},
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      artifact_refs: artifactRefs,
      created_by: input.created_by ?? 'system',
      created_at: createdAt,
    };
    const coverageRowIntents = coverageInputs.map<TopicSelectionCoverageRowIntentRecord>((coverageInput, index) => ({
      coverage_row_intent_id: this.idFactory('coverage_intent'),
      search_plan_id: searchPlanId,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      coverage_key: coverageInput.coverage_key ?? `query-${index + 1}`,
      intent_type: coverageInput.intent_type ?? 'support',
      query: coverageInput.query,
      rationale: coverageInput.rationale ?? 'Derived from SearchPlan query intent.',
      required: coverageInput.required ?? true,
      priority: coverageInput.priority ?? index,
      target_source_types: coverageInput.target_source_types ?? [],
      expected_evidence_role: coverageInput.expected_evidence_role ?? 'support',
      refs: coverageInput.refs ?? [],
      created_at: createdAt,
    }));
    return this.repository.createSearchPlanWithCoverageIntents(searchPlan, coverageRowIntents);
  }

  async recordSearchRun(input: RecordSearchRunInput): Promise<TopicSelectionSearchRunWithCoverageRecordsResult> {
    const searchPlan = await this.requireSearchPlan(input.search_plan_id);
    this.assertSameTitleCard(input.title_card_id, searchPlan.title_card_id, 'SearchPlan');
    const snapshotId = input.literature_resource_pool_snapshot_id ?? searchPlan.literature_snapshot_ref.ref_id;
    const literatureSnapshot = await this.requireLiteratureSnapshot(snapshotId);
    this.assertSameTitleCard(input.title_card_id, literatureSnapshot.title_card_id, 'LiteratureResourcePoolSnapshot');
    if (searchPlan.literature_snapshot_ref.ref_id !== literatureSnapshot.literature_resource_pool_snapshot_id) {
      throw new AppError(409, 'VERSION_CONFLICT', 'SearchRun snapshot does not match SearchPlan snapshot.');
    }
    const coverageRowIntents = await this.repository.listCoverageRowIntentsBySearchPlanId(searchPlan.search_plan_id);
    this.assertCoverageRecordsBelongToSearchPlan(input, coverageRowIntents);

    const searchRunId = this.idFactory('search_run');
    const searchRunRef = this.ref('search_run', searchRunId, input.title_card_id);
    const searchPlanRef = this.ref('search_plan', searchPlan.search_plan_id, input.title_card_id, searchPlan.plan_version);
    const literatureSnapshotRef = this.ref(
      'literature_resource_pool_snapshot',
      literatureSnapshot.literature_resource_pool_snapshot_id,
      input.title_card_id,
      literatureSnapshot.snapshot_version,
    );
    const blockers = this.searchRunBlockers(input);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      target_ref: searchRunRef,
      source_refs: [searchPlanRef, literatureSnapshotRef, ...input.evidence_map_input_refs],
      payload: {
        run_kind: input.run_kind ?? 'planned_search',
        run_status: input.run_status ?? 'succeeded',
        query_provenance: input.query_provenance ?? [],
        result_accounting: input.result_accounting,
        source_health_summary: input.source_health_summary,
        dedup_summary: input.dedup_summary ?? {},
        evidence_map_input_refs: input.evidence_map_input_refs,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      workflow_key: 'topic-selection.search-run',
      workflow_profile_key: 'retrieval-provenance',
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      status: blockers.length > 0 ? 'blocked' : 'succeeded',
      output_summary: {
        run_status: input.run_status ?? 'succeeded',
        total_result_count: input.result_accounting.total_result_count,
        unique_literature_count: input.result_accounting.unique_literature_count,
      },
      artifacts: input.raw_log_artifact
        ? [{ artifact_kind: 'raw_output', payload: input.raw_log_artifact }]
        : [],
      created_by: input.created_by ?? 'system',
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      gate_key: 'topic-selection.search-run-consumable',
      target_ref: searchRunRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      blockers,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      transition_key: 'search-plan-to-search-run',
      source_ref: searchPlanRef,
      target_ref: searchRunRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: input.created_by ?? 'system' },
      state_write_intents: [this.stateWriteIntent(searchRunRef, 'execution', 'search_run', 'consumable')],
      created_authority_refs: [searchRunRef],
    });
    this.assertTransitionPassed(transition.result, 'SearchRun');

    const artifactRefs = workflow.artifact_refs.map((artifact) => this.ref('artifact_ref', artifact.artifact_ref_id, input.title_card_id));
    const createdAt = this.now();
    const searchRun: TopicSelectionSearchRunRecord = {
      search_run_id: searchRunId,
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      search_plan_ref: searchPlanRef,
      literature_snapshot_ref: literatureSnapshotRef,
      run_kind: input.run_kind ?? 'planned_search',
      run_status: input.run_status ?? 'succeeded',
      query_provenance: input.query_provenance ?? [],
      result_accounting: input.result_accounting,
      source_health_summary: input.source_health_summary,
      dedup_summary: input.dedup_summary ?? {},
      evidence_map_input_refs: input.evidence_map_input_refs,
      artifact_refs: artifactRefs,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      started_at: input.started_at ?? createdAt,
      finished_at: input.finished_at ?? createdAt,
      created_by: input.created_by ?? 'system',
      created_at: createdAt,
    };
    const coverageRecords = this.buildSearchRunCoverageRecords(searchPlan.search_plan_id, searchRunId, input, createdAt);
    return this.repository.createSearchRunWithCoverageRecords(searchRun, coverageRecords);
  }

  async getCoverageMatrix(searchPlanId: string): Promise<TopicSelectionSearchPlanCoverageMatrix> {
    const searchPlan = await this.requireSearchPlan(searchPlanId);
    const intents = await this.repository.listCoverageRowIntentsBySearchPlanId(searchPlanId);
    const observations = await this.repository.listCoverageExecutionObservationsBySearchPlanId(searchPlanId);
    const bindings = await this.repository.listCoverageEvidenceBindingsBySearchPlanId(searchPlanId);
    const assessments = await this.repository.listCoverageAssessmentsBySearchPlanId(searchPlanId);
    const riskAcceptances = await this.repository.listCoverageRiskAcceptancesBySearchPlanId(searchPlanId);
    const rows = intents.map((intent) => {
      const latestObservation = observations.find((item) => item.coverage_row_intent_id === intent.coverage_row_intent_id) ?? null;
      const latestAssessment = assessments.find((item) => item.coverage_row_intent_id === intent.coverage_row_intent_id) ?? null;
      return {
        coverage_row_intent: intent,
        latest_observation: latestObservation,
        latest_assessment: latestAssessment,
        evidence_bindings: bindings.filter((item) => item.coverage_row_intent_id === intent.coverage_row_intent_id),
        risk_acceptances: riskAcceptances.filter((item) => item.coverage_row_intent_id === intent.coverage_row_intent_id),
      };
    });
    return {
      search_plan_ref: this.ref('search_plan', searchPlan.search_plan_id, searchPlan.title_card_id, searchPlan.plan_version),
      generated_at: this.now(),
      rows,
      summary: {
        row_count: rows.length,
        satisfied_count: rows.filter((row) => row.latest_assessment?.verdict === 'satisfied').length,
        partial_count: rows.filter((row) => row.latest_assessment?.verdict === 'partial').length,
        missing_count: rows.filter((row) => row.latest_assessment?.verdict === 'missing').length,
        accepted_risk_count: rows.filter((row) => row.latest_assessment?.verdict === 'accepted_risk').length,
        unassessed_count: rows.filter((row) => !row.latest_assessment).length,
      },
    };
  }

  async createSearchPlanRecheckRequest(
    input: CreateSearchPlanRecheckRequestInput,
  ): Promise<TopicSelectionSearchPlanRecheckRequestRecord> {
    const searchPlan = await this.requireSearchPlan(input.target_search_plan_id);
    this.assertSameTitleCard(input.title_card_id, searchPlan.title_card_id, 'SearchPlan');
    return this.repository.createSearchPlanRecheckRequest({
      search_plan_recheck_request_id: this.idFactory('search_recheck'),
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id,
      source_ref: input.source_ref,
      target_search_plan_ref: this.ref('search_plan', searchPlan.search_plan_id, input.title_card_id, searchPlan.plan_version),
      target_literature_snapshot_ref: searchPlan.literature_snapshot_ref,
      reason: input.reason,
      gap_codes: input.gap_codes ?? [],
      requested_by: input.requested_by ?? 'system',
      status: 'open',
      decision_summary: null,
      policy_version_id: input.policy_version_id ?? null,
      accepted_risk_refs: [],
      resulting_search_plan_ref: null,
      resulting_search_run_ref: null,
      created_at: this.now(),
      resolved_at: null,
    });
  }

  async resolveSearchPlanRecheckRequest(
    input: ResolveSearchPlanRecheckRequestInput,
  ): Promise<ResolveSearchPlanRecheckRequestResult> {
    const request = await this.requireRecheckRequest(input.request_id);
    if (request.status !== 'open') {
      throw new AppError(409, 'VERSION_CONFLICT', 'SearchPlanRecheckRequest has already been resolved.');
    }
    if (input.outcome === 'accepted_risk' && (input.accepted_risk_refs ?? []).length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Accepted-risk recheck outcome requires risk refs.');
    }

    if (input.outcome !== 'materialized') {
      return {
        request: await this.repository.updateSearchPlanRecheckRequest(input.request_id, {
          status: input.outcome,
          decision_summary: input.decision_summary,
          accepted_risk_refs: input.accepted_risk_refs ?? [],
          resolved_at: this.now(),
        }),
      };
    }

    if (!input.revised_search_plan) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Materialized recheck requires a revised SearchPlan.');
    }
    const targetPlan = await this.requireSearchPlan(request.target_search_plan_ref.ref_id);
    const revised = await this.createSearchPlan({
      ...input.revised_search_plan,
      workspace_id: input.revised_search_plan.workspace_id ?? request.workspace_id ?? null,
      title_card_id: request.title_card_id,
      topic_seed_id: targetPlan.topic_seed_ref.ref_id,
      literature_resource_pool_snapshot_id: targetPlan.literature_snapshot_ref.ref_id,
      parent_search_plan_ref: request.target_search_plan_ref,
      recheck_request_ref: this.ref('search_plan_recheck_request', request.search_plan_recheck_request_id, request.title_card_id),
    });
    const followUpRun = input.follow_up_search_run
      ? await this.recordSearchRun({
          ...input.follow_up_search_run,
          workspace_id: input.follow_up_search_run.workspace_id ?? request.workspace_id ?? null,
          title_card_id: request.title_card_id,
          search_plan_id: revised.search_plan.search_plan_id,
          literature_resource_pool_snapshot_id: targetPlan.literature_snapshot_ref.ref_id,
          run_kind: 'recheck_followup',
        })
      : null;

    const resolvedRequest = await this.repository.updateSearchPlanRecheckRequest(input.request_id, {
      status: 'materialized',
      decision_summary: input.decision_summary,
      accepted_risk_refs: input.accepted_risk_refs ?? [],
      resulting_search_plan_ref: this.ref(
        'search_plan',
        revised.search_plan.search_plan_id,
        revised.search_plan.title_card_id,
        revised.search_plan.plan_version,
      ),
      resulting_search_run_ref: followUpRun
        ? this.ref('search_run', followUpRun.search_run.search_run_id, followUpRun.search_run.title_card_id)
        : null,
      resolved_at: this.now(),
    });

    return {
      request: resolvedRequest,
      revised_search_plan: revised.search_plan,
      follow_up_search_run: followUpRun?.search_run,
    };
  }

  private normalizeCoverageIntents(
    queryIntents: string[],
    coverageIntents: CoverageIntentInput[] | undefined,
  ): CoverageIntentInput[] {
    if (coverageIntents && coverageIntents.length > 0) {
      return coverageIntents;
    }
    return queryIntents.map((query, index) => ({
      coverage_key: `query-${index + 1}`,
      intent_type: 'support',
      query,
      rationale: 'Derived from query intent.',
      required: true,
      priority: index,
      expected_evidence_role: 'support',
    }));
  }

  private searchPlanBlockers(
    queryIntents: string[],
    coverageInputs: CoverageIntentInput[],
  ): TopicSelectionGateIssue[] {
    const blockers: TopicSelectionGateIssue[] = [];
    if (queryIntents.length === 0 || queryIntents.every((query) => query.trim().length === 0)) {
      blockers.push(this.blocker('SEARCH_PLAN_QUERY_INTENT_REQUIRED', 'SearchPlan requires at least one query intent.'));
    }
    if (coverageInputs.length === 0 || coverageInputs.some((intent) => intent.query.trim().length === 0)) {
      blockers.push(this.blocker('COVERAGE_ROW_QUERY_REQUIRED', 'Coverage row intents require non-empty queries.'));
    }
    return blockers;
  }

  private searchRunBlockers(input: RecordSearchRunInput): TopicSelectionGateIssue[] {
    const blockers: TopicSelectionGateIssue[] = [];
    if (!this.hasCompleteResultAccounting(input.result_accounting)) {
      blockers.push(this.blocker('SEARCH_RUN_RESULT_ACCOUNTING_REQUIRED', 'SearchRun requires complete result accounting.'));
    }
    if (!input.source_health_summary || Object.keys(input.source_health_summary).length === 0) {
      blockers.push(this.blocker('SEARCH_RUN_SOURCE_HEALTH_REQUIRED', 'SearchRun requires source-health summary.'));
    }
    const status = input.run_status ?? 'succeeded';
    if (CONSUMABLE_SEARCH_RUN_STATUSES.has(status) && input.evidence_map_input_refs.length === 0) {
      blockers.push(this.blocker('SEARCH_RUN_STABLE_INPUT_REFS_REQUIRED', 'Consumable SearchRun requires stable EvidenceMap input refs.'));
    }
    if (input.evidence_map_input_refs.some((ref) => ref.ref_type === 'artifact_ref' || ref.ref_type === 'raw_search_log')) {
      blockers.push(this.blocker('RAW_SEARCH_LOG_NOT_AUTHORITY', 'Raw search logs cannot be EvidenceMap authority refs.'));
    }
    return blockers;
  }

  private buildSearchRunCoverageRecords(
    searchPlanId: string,
    searchRunId: string,
    input: RecordSearchRunInput,
    createdAt: string,
  ): TopicSelectionSearchRunCoverageRecords {
    return {
      observations: (input.coverage_observations ?? []).map((observation) => ({
        coverage_execution_observation_id: this.idFactory('coverage_observation'),
        search_plan_id: searchPlanId,
        coverage_row_intent_id: observation.coverage_row_intent_id,
        search_run_id: searchRunId,
        status: observation.status,
        result_count: observation.result_count ?? 0,
        source_count: observation.source_count ?? 0,
        missing_reason_codes: observation.missing_reason_codes ?? [],
        notes: observation.notes ?? null,
        created_at: createdAt,
      })),
      evidence_bindings: (input.evidence_bindings ?? []).map((binding) => ({
        coverage_evidence_binding_id: this.idFactory('coverage_binding'),
        search_plan_id: searchPlanId,
        coverage_row_intent_id: binding.coverage_row_intent_id,
        search_run_id: searchRunId,
        literature_ref: binding.literature_ref,
        source_refs: binding.source_refs ?? [],
        binding_kind: binding.binding_kind ?? 'retrieval_hit',
        result_rank: binding.result_rank ?? null,
        created_at: createdAt,
      })),
      assessments: (input.coverage_assessments ?? []).map((assessment) => ({
        coverage_assessment_id: this.idFactory('coverage_assessment'),
        search_plan_id: searchPlanId,
        coverage_row_intent_id: assessment.coverage_row_intent_id,
        verdict: assessment.verdict,
        issue_codes: assessment.issue_codes ?? [],
        confidence: assessment.confidence ?? null,
        assessed_by: assessment.assessed_by ?? 'system',
        created_at: createdAt,
      })),
      risk_acceptances: (input.coverage_risk_acceptances ?? []).map((riskAcceptance) => ({
        coverage_risk_acceptance_id: this.idFactory('coverage_risk'),
        search_plan_id: searchPlanId,
        coverage_row_intent_id: riskAcceptance.coverage_row_intent_id,
        accepted_risk_ref: riskAcceptance.accepted_risk_ref,
        accepted_by: riskAcceptance.accepted_by,
        rationale: riskAcceptance.rationale,
        expires_at: riskAcceptance.expires_at ?? null,
        created_at: createdAt,
      })),
    };
  }

  private assertCoverageRecordsBelongToSearchPlan(
    input: RecordSearchRunInput,
    coverageRowIntents: TopicSelectionCoverageRowIntentRecord[],
  ): void {
    const allowedRowIds = new Set(coverageRowIntents.map((intent) => intent.coverage_row_intent_id));
    const referencedRowIds = new Set<string>();
    for (const observation of input.coverage_observations ?? []) {
      referencedRowIds.add(observation.coverage_row_intent_id);
    }
    for (const binding of input.evidence_bindings ?? []) {
      referencedRowIds.add(binding.coverage_row_intent_id);
    }
    for (const assessment of input.coverage_assessments ?? []) {
      referencedRowIds.add(assessment.coverage_row_intent_id);
    }
    for (const riskAcceptance of input.coverage_risk_acceptances ?? []) {
      referencedRowIds.add(riskAcceptance.coverage_row_intent_id);
    }

    const invalidRowIds = [...referencedRowIds].filter((rowId) => !allowedRowIds.has(rowId));
    if (invalidRowIds.length > 0) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        `Coverage records reference rows outside SearchPlan: ${invalidRowIds.join(', ')}.`,
      );
    }
  }

  private buildLiteratureSourceHealthSummary(
    literatureIds: string[],
    literatureById: Map<string, { rightsClass: string; abstractText: string | null; keyContentDigest: string | null }>,
    pipelineByLiteratureId: Map<string, { abstractReady: boolean; keyContentReady: boolean; dedupStatus: string }>,
    sourceCount: number,
    missingLiteratureIds: string[],
  ): TopicSelectionSourceHealthSummary {
    const rightsClassCounts: Record<string, number> = {};
    let pipelineReadyCount = 0;
    let abstractReadyCount = 0;
    let keyContentReadyCount = 0;
    let fulltextReadyCount = 0;
    let staleCount = 0;
    for (const literatureId of literatureIds) {
      const literature = literatureById.get(literatureId);
      if (!literature) {
        continue;
      }
      rightsClassCounts[literature.rightsClass] = (rightsClassCounts[literature.rightsClass] ?? 0) + 1;
      const pipeline = pipelineByLiteratureId.get(literatureId);
      if (pipeline?.abstractReady || literature.abstractText) {
        abstractReadyCount += 1;
      }
      if (pipeline?.keyContentReady || literature.keyContentDigest) {
        keyContentReadyCount += 1;
      }
      if (pipeline?.abstractReady && pipeline?.keyContentReady) {
        pipelineReadyCount += 1;
      }
      if (pipeline?.dedupStatus === 'duplicate') {
        staleCount += 1;
      }
      if (literature.keyContentDigest) {
        fulltextReadyCount += 1;
      }
    }
    return {
      total_literature_count: literatureIds.length,
      missing_literature_ids: missingLiteratureIds,
      rights_class_counts: rightsClassCounts,
      pipeline_ready_count: pipelineReadyCount,
      abstract_ready_count: abstractReadyCount,
      key_content_ready_count: keyContentReadyCount,
      fulltext_ready_count: fulltextReadyCount,
      source_count: sourceCount,
      stale_count: staleCount,
      blocked_count: missingLiteratureIds.length,
      warning_codes: missingLiteratureIds.length > 0 ? ['MISSING_LITERATURE_RECORD'] : [],
    };
  }

  private async requireTopicSeed(topicSeedId: string): Promise<TopicSelectionTopicSeedRecord> {
    const record = await this.repository.findTopicSeedById(topicSeedId);
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', `TopicSeed ${topicSeedId} not found.`);
    }
    return record;
  }

  private async requireLiteratureSnapshot(
    snapshotId: string,
  ): Promise<TopicSelectionLiteratureResourcePoolSnapshotRecord> {
    const record = await this.repository.findLiteratureResourcePoolSnapshotById(snapshotId);
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', `LiteratureResourcePoolSnapshot ${snapshotId} not found.`);
    }
    return record;
  }

  private async requireSearchPlan(searchPlanId: string): Promise<TopicSelectionSearchPlanRecord> {
    const record = await this.repository.findSearchPlanById(searchPlanId);
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', `SearchPlan ${searchPlanId} not found.`);
    }
    return record;
  }

  private async requireRecheckRequest(requestId: string): Promise<TopicSelectionSearchPlanRecheckRequestRecord> {
    const record = await this.repository.findSearchPlanRecheckRequestById(requestId);
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', `SearchPlanRecheckRequest ${requestId} not found.`);
    }
    return record;
  }

  private assertSameTitleCard(expected: string, actual: string, label: string): void {
    if (expected !== actual) {
      throw new AppError(409, 'VERSION_CONFLICT', `${label} belongs to a different title card.`);
    }
  }

  private assertTransitionPassed(result: string, label: string): void {
    if (result !== 'passed' && result !== 'passed_with_risk') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `${label} did not pass its readiness transition.`);
    }
  }

  private hasCompleteResultAccounting(accounting: TopicSelectionSearchRunResultAccounting): boolean {
    return Number.isFinite(accounting.total_result_count)
      && Number.isFinite(accounting.unique_literature_count)
      && Number.isFinite(accounting.duplicate_result_count)
      && Number.isFinite(accounting.failed_source_count)
      && Number.isFinite(accounting.skipped_source_count);
  }

  private ref(
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

  private blocker(code: string, message: string): TopicSelectionGateIssue {
    return {
      code,
      message,
      severity: 'blocking',
    };
  }

  private stateWriteIntent(
    targetRef: TopicSelectionFunctionalRef,
    axis: TopicSelectionStateWriteIntent['axis'],
    stateKey: string,
    nextValue: string,
  ): TopicSelectionStateWriteIntent {
    return {
      axis,
      target_ref: targetRef,
      state_key: stateKey,
      next_value: nextValue,
    };
  }

  private versionFromId(id: string): string {
    const suffix = id.split('_').at(-1) ?? 'v1';
    return `v-${suffix}`;
  }
}
