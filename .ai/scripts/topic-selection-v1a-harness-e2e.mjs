#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

import { buildApp } from '../../apps/backend/src/app.ts';
import { PrismaLiteratureRepository } from '../../apps/backend/src/repositories/prisma/prisma-literature-repository.ts';
import { PrismaTitleCardManagementRepository } from '../../apps/backend/src/repositories/prisma/prisma-title-card-management-repository.ts';
import { PrismaTopicSelectionControlPlaneRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-control-plane-repository.ts';
import { PrismaTopicSelectionEvidenceMapRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-evidence-map-repository.ts';
import { PrismaTopicSelectionNeedValidationRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-need-validation-repository.ts';
import { PrismaTopicSelectionSearchResourceRepository } from '../../apps/backend/src/repositories/prisma/prisma-topic-selection-search-resource-repository.ts';
import { BackendLlmGateway } from '../../apps/backend/src/services/llm-gateway.ts';
import { TopicSelectionAgentOrchestratorService } from '../../apps/backend/src/services/topic-selection-agent-orchestrator-service.ts';
import { TopicSelectionControlPlaneService } from '../../apps/backend/src/services/topic-selection-control-plane-service.ts';
import { TopicSelectionEvidenceMapMaterializationService } from '../../apps/backend/src/services/topic-selection-evidence-map-materialization-service.ts';
import { TopicSelectionEvidenceMapService } from '../../apps/backend/src/services/topic-selection-evidence-map-service.ts';
import { TopicSelectionGenerateNeedCandidateOrchestratorAdapterService } from '../../apps/backend/src/services/topic-selection-generate-need-candidate-orchestrator-adapter-service.ts';
import {
  TOPIC_SELECTION_CONFIRMATION_SEMANTIC_REVIEW_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
  TOPIC_SELECTION_NEED_ADJUDICATION_SINGLE_AGENT_PROFILE_ID,
} from '../../apps/backend/src/services/topic-selection-model-profile-registry-service.ts';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from '../../apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.ts';
import { TopicSelectionNeedDiscoveryContextCompilerService } from '../../apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.ts';
import { TopicSelectionNeedValidationService } from '../../apps/backend/src/services/topic-selection-need-validation-service.ts';
import { TopicSelectionPersistNeedCandidateBatchService } from '../../apps/backend/src/services/topic-selection-persist-need-candidate-batch-service.ts';
import { TopicSelectionSearchResourceService } from '../../apps/backend/src/services/topic-selection-search-resource-service.ts';
import { TopicSelectionWorkflowHarnessService } from '../../apps/backend/src/services/topic-selection-workflow-harness-service.ts';
import {
  TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_DRAFT_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-evidence-map-contracts.ts';
import {
  TOPIC_SELECTION_HUMAN_CONFIRMATION_INPUT_SCHEMA_VERSION,
  TOPIC_SELECTION_NEED_ADJUDICATION_RECOMMENDATION_PACKET_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-need-validation-contracts.ts';
import {
  TOPIC_SELECTION_SEARCH_RUN_RECORD_BUNDLE_SCHEMA_VERSION,
} from '../../packages/shared/src/research-lifecycle/topic-selection-search-resource-contracts.ts';

const TOPIC_ID = process.env.TOPIC_SELECTION_REAL_TOPIC_ID ?? 'ai-rag-finetuning-2022-2026';
const PROVIDER_ID = process.env.TOPIC_SELECTION_REAL_PROVIDER_ID === 'dashscope' ? 'dashscope' : 'openai';
const MODEL_ID = process.env.TOPIC_SELECTION_REAL_MODEL_ID ?? 'gpt-5.4-mini';
const LITERATURE_LIMIT = positiveInt(process.env.TOPIC_SELECTION_REAL_LITERATURE_LIMIT, 16);
const LLM_TIMEOUT_MS = positiveInt(process.env.TOPIC_SELECTION_REAL_LLM_TIMEOUT_MS, 180000);
const LLM_MAX_RETRIES = positiveInt(process.env.TOPIC_SELECTION_REAL_LLM_MAX_RETRIES, 3);
const USE_MOCK_RESOURCE_SAMPLING = process.env.TOPIC_SELECTION_REAL_FLOW_MOCK_LLM === '1';
const EXISTING_RESOURCE_SAMPLE_SET_ID = process.env.TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID?.trim() || null;
const DEFAULT_HARNESS_AGENT_EXECUTION_MODE = normalizeExecutionMode(
  process.env.TOPIC_SELECTION_V1A_HARNESS_AGENT_EXECUTION_MODE
    ?? process.env.TOPIC_SELECTION_REAL_V1A_GENERATE_EXECUTION_MODE,
  'mocked_llm',
);
const GENERATE_NEED_CANDIDATE_EXECUTION_MODE = normalizeExecutionMode(
  process.env.TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTION_MODE,
  DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
);
const NEED_ADJUDICATION_EXECUTION_MODE = normalizeExecutionMode(
  process.env.TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_EXECUTION_MODE,
  DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
);
const RUN_ID = process.env.TOPIC_SELECTION_V1A_HARNESS_RUN_ID
  ?? process.env.TOPIC_SELECTION_REAL_RUN_ID
  ?? uniqueId('v1a-harness-e2e');
const SCENARIO_ID = process.env.TOPIC_SELECTION_WORKFLOW_SCENARIO_ID?.trim()
  || process.env.TOPIC_SELECTION_REAL_SCENARIO_ID?.trim()
  || 'topic-selection.real-e2e.canary.v1';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1a-harness-e2e', RUN_ID);
const ROLE_ORDER = ['support', 'challenge', 'baseline', 'context'];
const MOCK_RESOURCE_RISK_PATTERN =
  /poison|adversarial|attack|leak|hallucination|conflict|verification|source verification|failure|robust|safety/u;

let currentStage = 'bootstrap';

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function positiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeExecutionMode(value, fallback) {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }
  if (['mocked_llm', 'codex_assisted', 'provider_llm'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported v1a harness execution mode: ${value}`);
}

function ref(refType, refId, titleCardId, versionId = null) {
  return {
    ref_type: refType,
    ref_id: refId,
    version_id: versionId,
    title_card_id: titleCardId,
  };
}

function titleCardRef(titleCardId) {
  return ref('title_card', titleCardId, titleCardId);
}

function manualLocator(input) {
  return {
    locator_type: 'manual',
    locator_ref: ref('manual_locator', input.key, input.titleCardId),
    literature_ref: input.literatureRef,
    source_ref: input.sourceRef,
    content_ref: null,
    document_ref: null,
    section_ref: null,
    paragraph_ref: null,
    anchor_ref: null,
    manual_label: input.label,
  };
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

function snippet(value, maxLength = 420) {
  const text = normalizeText(value);
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}...`;
}

function parseJsonMessage(request, key) {
  const content = request.messages.at(-1)?.content ?? '{}';
  const parsed = JSON.parse(content);
  return key ? parsed[key] : parsed;
}

function mockTelemetry(request) {
  return {
    provider_id: 'mock',
    model_id: request.model?.modelId ?? MODEL_ID,
    profile_id: request.model?.profileId ?? null,
    prompt_template_id: request.prompt?.promptTemplateId ?? null,
    prompt_template_version: request.prompt?.version ?? null,
    elapsed_ms: 1,
    request_count: 1,
    retry_count: 0,
    timeout_count: 0,
    rate_limit_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    embedding_input_tokens: null,
    total_tokens: 0,
    cost_usd: null,
  };
}

function roleScores(primaryRole) {
  return {
    support: primaryRole === 'support' ? 0.92 : 0.12,
    challenge: primaryRole === 'challenge' ? 0.92 : 0.12,
    baseline: primaryRole === 'baseline' ? 0.92 : 0.12,
    context: primaryRole === 'context' ? 0.92 : 0.12,
    review: primaryRole === 'review' ? 0.92 : 0.02,
    excluded: primaryRole === 'excluded' ? 0.92 : 0.02,
  };
}

function resourceCandidateText(candidate) {
  return `${candidate.title ?? ''} ${candidate.abstract ?? ''} ${candidate.key_content_digest ?? ''} ${(candidate.tags ?? []).join(' ')}`.toLowerCase();
}

function classifyResourceCandidate(candidate) {
  const text = resourceCandidateText(candidate);
  if (MOCK_RESOURCE_RISK_PATTERN.test(text)) {
    return {
      role: 'challenge',
      polarity: 'risk_or_failure',
      rationale: 'Risk or failure-mode evidence for the topic-selection challenge role.',
      methodFamilies: ['risk_analysis'],
    };
  }
  if (/benchmark|evaluat|comparison|compare|baseline|dataset|leaderboard|metric|ablation|empirical/u.test(text)) {
    return {
      role: 'baseline',
      polarity: 'evaluation_baseline',
      rationale: 'Benchmark or comparison evidence for baseline calibration.',
      methodFamilies: ['evaluation'],
    };
  }
  if (/attention is all you need|transformer|bert|word representations|foundation|background|context|representation|optimization/u.test(text)) {
    return {
      role: 'context',
      polarity: 'foundation_context',
      rationale: 'Foundational or background evidence for context framing.',
      methodFamilies: ['foundation_model_context'],
    };
  }
  return {
    role: 'support',
    polarity: 'positive_method',
    rationale: 'Positive method evidence for RAG, fine-tuning, retrieval, or attribution workflow support.',
    methodFamilies: /fine[- ]?tuning|finetun|lora|adapter/u.test(text)
      ? ['fine_tuning']
      : ['retrieval_augmented_generation'],
  };
}

function roleTargetFor(role, roleTargets) {
  return roleTargets?.[role] ?? 1;
}

function assignResourceRole(entry, role) {
  entry.draft.primary_role = role;
  entry.draft.evidence_polarity = {
    support: 'positive_method',
    challenge: 'risk_or_failure',
    baseline: 'evaluation_baseline',
    context: 'foundation_context',
  }[role];
  entry.draft.role_scores = roleScores(role);
  entry.draft.classification_rationale = `Deterministic mock assigned ${role} to satisfy role-balanced v1a harness coverage.`;
  entry.draft.method_families = role === 'support' ? ['fine_tuning'] : entry.draft.method_families;
}

function forceRoleCoverage(entries, roleTargets) {
  const roleCounts = () => ROLE_ORDER.reduce((counts, role) => {
    counts[role] = entries.filter((entry) => entry.draft.primary_role === role).length;
    return counts;
  }, {});
  for (const role of ROLE_ORDER) {
    let counts = roleCounts();
    while ((counts[role] ?? 0) < roleTargetFor(role, roleTargets)) {
      const donor = entries.find((entry) => {
        const donorRole = entry.draft.primary_role;
        const donorSurplus = (counts[donorRole] ?? 0) > roleTargetFor(donorRole, roleTargets);
        const supportSafe = role !== 'support' || !MOCK_RESOURCE_RISK_PATTERN.test(entry.text);
        return donorRole !== role && donorSurplus && supportSafe;
      });
      if (!donor) {
        break;
      }
      assignResourceRole(donor, role);
      counts = roleCounts();
    }
  }
}

function makeResourceSamplingOutput(request) {
  const payload = parseJsonMessage(request);
  const entries = (payload.eligible_candidates ?? []).map((candidate) => {
    const classified = classifyResourceCandidate(candidate);
    return {
      text: resourceCandidateText(candidate),
      draft: {
        literature_ref: candidate.literature_ref,
        primary_role: classified.role,
        topic_relevance: 0.86,
        evidence_polarity: classified.polarity,
        role_scores: roleScores(classified.role),
        confidence: 0.84,
        classification_rationale: classified.rationale,
        exclusion_reason: null,
        review_reason: null,
        method_families: classified.methodFamilies,
      },
    };
  });
  forceRoleCoverage(entries, payload.role_targets ?? {});
  return { classifications: entries.map((entry) => entry.draft) };
}

class DeterministicResourceSamplingLlmGateway {
  async createStructuredOutput(request) {
    const parsed = {
      topic_selection_resource_sampling_classification: () => makeResourceSamplingOutput(request),
    }[request.schemaName]?.();
    if (!parsed) {
      throw new Error(`Unsupported deterministic v1a harness LLM schemaName: ${request.schemaName}`);
    }
    return {
      parsed,
      raw: { mock_llm: true, schemaName: request.schemaName, run_id: RUN_ID },
      telemetry: mockTelemetry(request),
    };
  }
}

function makeSamplingLlmGateway() {
  if (USE_MOCK_RESOURCE_SAMPLING) {
    return new DeterministicResourceSamplingLlmGateway();
  }
  return new BackendLlmGateway({
    defaultTimeoutMs: LLM_TIMEOUT_MS,
    defaultMaxRetries: LLM_MAX_RETRIES,
  });
}

function makeHarnessLlmGateway() {
  if ([GENERATE_NEED_CANDIDATE_EXECUTION_MODE, NEED_ADJUDICATION_EXECUTION_MODE].includes('provider_llm')) {
    return new BackendLlmGateway({
      defaultTimeoutMs: LLM_TIMEOUT_MS,
      defaultMaxRetries: LLM_MAX_RETRIES,
    });
  }
  return new DeterministicResourceSamplingLlmGateway();
}

function makeWorkflowHarness(prisma, llmGateway) {
  const titleCards = new PrismaTitleCardManagementRepository(prisma);
  const literature = new PrismaLiteratureRepository(prisma);
  const controlPlaneRepository = new PrismaTopicSelectionControlPlaneRepository(prisma);
  const searchResourceRepository = new PrismaTopicSelectionSearchResourceRepository(prisma);
  const evidenceMapRepository = new PrismaTopicSelectionEvidenceMapRepository(prisma);
  const needValidationRepository = new PrismaTopicSelectionNeedValidationRepository(prisma);
  const controlPlane = new TopicSelectionControlPlaneService(controlPlaneRepository);
  const searchResources = new TopicSelectionSearchResourceService(
    searchResourceRepository,
    controlPlane,
    titleCards,
    literature,
  );
  const evidenceMaps = new TopicSelectionEvidenceMapService(
    evidenceMapRepository,
    controlPlane,
    searchResourceRepository,
    literature,
  );
  const needValidation = new TopicSelectionNeedValidationService(
    needValidationRepository,
    controlPlane,
    evidenceMaps,
    searchResources,
  );
  const evidenceMapMaterializer = new TopicSelectionEvidenceMapMaterializationService();
  const artifactBoundary = new TopicSelectionNeedDiscoveryArtifactBoundaryService(controlPlane);
  const contextCompiler = new TopicSelectionNeedDiscoveryContextCompilerService(artifactBoundary);
  const agentOrchestrator = new TopicSelectionAgentOrchestratorService({
    controlPlane,
    llmGateway,
  });
  const generateNeedCandidateAdapter = new TopicSelectionGenerateNeedCandidateOrchestratorAdapterService({
    contextCompiler,
    agentOrchestrator,
    artifactBoundary,
    needCandidateBatchPersistence: new TopicSelectionPersistNeedCandidateBatchService(needValidationRepository),
  });
  const workflowHarness = new TopicSelectionWorkflowHarnessService({
    contextCompiler,
    generateNeedCandidateAdapter,
    artifactBoundary,
    controlPlane,
    searchResources,
    evidenceMaps,
    evidenceMapMaterializer,
    evidenceMapExtractionAgent: agentOrchestrator,
    needValidation,
    needAdjudicationAgent: agentOrchestrator,
    humanConfirmationSemanticReviewAgent: agentOrchestrator,
  });

  return {
    workflowHarness,
    evidenceMapMaterializer,
    needValidation,
  };
}

function assertStatus(response, expected, label) {
  if (response.statusCode !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, received ${response.statusCode}: ${response.body}`);
  }
}

async function requestJson(app, method, url, expected, payload, label = `${method} ${url}`) {
  currentStage = label;
  const response = await app.inject({ method, url, payload });
  assertStatus(response, expected, label);
  return response.json();
}

async function writeJson(relativeName, payload) {
  await fs.writeFile(path.join(ARTIFACT_DIR, relativeName), `${JSON.stringify(payload, null, 2)}\n`);
}

function metadataBucket(resource) {
  for (const asset of resource.contentAssets) {
    const bucket = asset.metadata && typeof asset.metadata === 'object'
      ? asset.metadata.selection_bucket
      : null;
    if (typeof bucket === 'string' && bucket.trim()) {
      return bucket.trim();
    }
  }
  return null;
}

async function loadSampledResources(prisma, sampleResult) {
  currentStage = 'load resource sample details';
  if (sampleResult.sample_set.status === 'blocked') {
    throw new Error(`resource sample set blocked: ${JSON.stringify(sampleResult.sample_set.warnings)}`);
  }
  const selectedItems = sampleResult.selected_items
    .filter((item) => ROLE_ORDER.includes(item.selected_role));
  if (selectedItems.length < ROLE_ORDER.length) {
    throw new Error(`resource sample set underfilled target roles: ${JSON.stringify(sampleResult.sample_set.role_counts)}`);
  }
  const selectedIds = selectedItems.map((item) => item.literature_ref.ref_id);
  const rows = await prisma.topicLiteratureScope.findMany({
    where: {
      topicId: TOPIC_ID,
      literatureId: { in: selectedIds },
    },
    include: {
      literature: {
        include: {
          sources: true,
          contentAssets: {
            where: { status: { in: ['ready', 'READY'] } },
          },
          pipelineState: true,
        },
      },
    },
  });
  const rowByLiteratureId = new Map(rows.map((row) => [row.literatureId, row]));

  const resources = selectedItems.map((item) => {
    const row = rowByLiteratureId.get(item.literature_ref.ref_id);
    if (!row) {
      throw new Error(`sampled literature ${item.literature_ref.ref_id} not found in topic scope`);
    }
    if (!row.literature.sources[0]?.id) {
      throw new Error(`sampled literature ${item.literature_ref.ref_id} has no source record`);
    }
    return {
      id: row.literatureId,
      topicId: row.topicId,
      scopeStatus: row.scopeStatus,
      activationStatus: row.activationStatus,
      activationScore: row.activationScore,
      scopeReason: row.reason,
      evidenceRole: item.selected_role,
      sampleSetId: sampleResult.sample_set.resource_sample_set_id,
      sampleItemId: item.resource_sample_item_id,
      sampleRank: item.rank,
      evidencePolarity: item.evidence_polarity,
      classificationRationale: item.classification_rationale,
      samplingGuardrails: item.guardrail_codes,
      title: row.literature.title,
      year: row.literature.year,
      abstractText: row.literature.abstractText,
      keyContentDigest: row.literature.keyContentDigest,
      sources: row.literature.sources,
      contentAssets: row.literature.contentAssets,
      pipelineState: row.literature.pipelineState,
    };
  });

  for (const role of ROLE_ORDER) {
    assert.ok(resources.some((resource) => resource.evidenceRole === role), `sample did not select literature for ${role}`);
  }
  return resources.slice(0, LITERATURE_LIMIT);
}

function summarizeSelectedLiterature(selectedResources) {
  return selectedResources.map((resource) => ({
    id: resource.id,
    role: resource.evidenceRole,
    sample_set_id: resource.sampleSetId,
    sample_item_id: resource.sampleItemId,
    sample_rank: resource.sampleRank,
    evidence_polarity: resource.evidencePolarity,
    sampling_guardrails: resource.samplingGuardrails,
    title: resource.title,
    year: resource.year,
    activation_score: resource.activationScore,
    source_id: resource.sources[0]?.id ?? null,
    bucket: metadataBucket(resource),
    key_content_digest: snippet(resource.keyContentDigest, 500),
  }));
}

async function createTitleCardFixture(app, selectedResources) {
  currentStage = 'create title card fixture';
  const card = await requestJson(app, 'POST', '/title-cards', 201, {
    working_title: `v1a Harness E2E: RAG vs Fine-Tuning Evidence ${RUN_ID}`,
    brief:
      'v1a WorkflowHarness rehearsal over the ai-rag-finetuning-2022-2026 literature pool with role-balanced sampled resources.',
  });
  assert.ok(card.title_card_id, 'title card creation did not return title_card_id');

  await requestJson(
    app,
    'PATCH',
    `/title-cards/${encodeURIComponent(card.title_card_id)}/evidence-basket`,
    200,
    { add_literature_ids: selectedResources.map((resource) => resource.id) },
    'attach sampled literature to title-card evidence basket',
  );

  return card.title_card_id;
}

function buildCoverageIntents(selectedResources) {
  const titleCardRefs = selectedResources.map((resource) => ({
    role: resource.evidenceRole,
    ref: resource.literatureRef,
  }));
  return ROLE_ORDER.map((role, index) => ({
    coverage_key: `${role}-real-evidence`,
    intent_type: role,
    query: {
      support:
        'RAG fine-tuning adaptation evidence for answer quality, attribution, or retrieval control in AI systems',
      challenge:
        'failure modes for RAG and fine-tuned LLM systems including poisoning, source verification, retrieval conflict, leakage, or robustness',
      baseline:
        'benchmarks and empirical comparisons for RAG, fine-tuning, retrieval evaluation, deduplication, or source attribution',
      context:
        'foundational model, transformer, representation learning, and optimization context that constrains RAG versus fine-tuning claims',
    }[role],
    expected_evidence_role: role,
    rationale: `v1a harness ${role} coverage over ${TOPIC_ID}.`,
    required: true,
    priority: index,
    target_source_types: ['paper'],
    refs: titleCardRefs.filter((item) => item.role === role).map((item) => item.ref),
  }));
}

function roleCoverageExpectation(selectedResources) {
  return ROLE_ORDER.reduce((counts, role) => {
    counts[role] = selectedResources.filter((resource) => resource.evidenceRole === role).length;
    return counts;
  }, {});
}

function buildSearchPlanBlueprint(input) {
  const coverageIntents = buildCoverageIntents(input.selectedResources);
  return {
    schema_version: 'TopicSelectionSearchPlanBlueprint@v1',
    blueprint_origin: 'workflow_scenario_fixture',
    blueprint_provenance_refs: input.resourceSampleSetRef ? [input.resourceSampleSetRef] : [],
    title_card_ref: titleCardRef(input.titleCardId),
    topic_seed_ref: input.topicSeedRef,
    literature_resource_pool_snapshot_ref: input.literatureSnapshotRef,
    expected_snapshot_hash: input.snapshotHash,
    plan_version: 'v1',
    parent_search_plan_ref: null,
    recheck_request_ref: null,
    query_intents: coverageIntents.map((intent) => intent.query),
    coverage_intents: coverageIntents,
    must_check_constraints: [
      'Do not claim RAG or fine-tuning superiority without benchmark-backed evidence.',
      'Separate source-attribution reliability from answer-quality improvement.',
      'Treat poisoning, leakage, and retrieval-conflict evidence as possible blockers.',
    ],
    exclusion_rules: [
      'Exclude claims about production deployment readiness.',
      'Exclude multimodal-only claims unless they generalize to textual RAG/fine-tuning decisions.',
    ],
    coverage_strategy: {
      breadth: 'role_balanced_small_sample',
      sequencing: ROLE_ORDER,
    },
    role_coverage_expectation: roleCoverageExpectation(input.selectedResources),
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
}

function firstRefByRole(coverageRowIntentRefs, coverageRowIntents, role) {
  const index = coverageRowIntents.findIndex((row) => row.expected_evidence_role === role);
  if (index < 0 || !coverageRowIntentRefs[index]) {
    throw new Error(`missing coverage row intent ref for role ${role}`);
  }
  return coverageRowIntentRefs[index];
}

function sourceStatement(resource) {
  return `${resource.title}: ${snippet(resource.keyContentDigest ?? resource.abstractText, 520)}`;
}

function buildSearchRunBundle(input) {
  const {
    titleCardId,
    selectedResources,
    searchPlanRef,
    coverageRowIntents,
    coverageRowIntentRefs,
    literatureSnapshotRef,
    snapshotHash,
  } = input;
  const coverageRowRefByRole = new Map(ROLE_ORDER.map((role) => [
    role,
    firstRefByRole(coverageRowIntentRefs, coverageRowIntents, role),
  ]));
  const evidenceMapInputRefs = selectedResources.flatMap((resource) => [resource.literatureRef, resource.sourceRef]);
  return {
    schema_version: TOPIC_SELECTION_SEARCH_RUN_RECORD_BUNDLE_SCHEMA_VERSION,
    title_card_ref: titleCardRef(titleCardId),
    search_plan_ref: searchPlanRef,
    literature_resource_pool_snapshot_ref: literatureSnapshotRef,
    expected_literature_snapshot_hash: snapshotHash,
    run_kind: 'planned_search',
    run_status: 'succeeded',
    query_provenance: coverageRowIntents.map((row) => ({
      query: row.query,
      coverage_key: row.coverage_key,
      source: 'v1a_harness_e2e_fixture',
    })),
    result_accounting: {
      total_result_count: selectedResources.length,
      unique_literature_count: selectedResources.length,
      duplicate_result_count: 0,
      failed_source_count: 0,
      skipped_source_count: 0,
    },
    source_health_summary: {
      source_count: selectedResources.length,
      failed_source_count: 0,
      warning_codes: [],
    },
    dedup_summary: {
      duplicate_groups: 0,
      canonical_work_refs: selectedResources.map((resource) => resource.literatureRef),
    },
    evidence_map_input_refs: evidenceMapInputRefs,
    coverage_observations: coverageRowIntents.map((row) => {
      const count = selectedResources.filter((resource) => resource.evidenceRole === row.expected_evidence_role).length;
      return {
        coverage_row_intent_ref: coverageRowRefByRole.get(row.expected_evidence_role),
        status: 'succeeded',
        result_count: count,
        source_count: count,
        missing_reason_codes: [],
        notes: `v1a harness selected ${count} ${row.expected_evidence_role} resources.`,
      };
    }),
    evidence_bindings: selectedResources.map((resource, index) => ({
      coverage_row_intent_ref: coverageRowRefByRole.get(resource.evidenceRole),
      literature_ref: resource.literatureRef,
      source_refs: [resource.sourceRef],
      binding_kind: 'retrieval_hit',
      result_rank: index + 1,
    })),
    coverage_assessments: coverageRowIntents.map((row) => ({
      coverage_row_intent_ref: coverageRowRefByRole.get(row.expected_evidence_role),
      verdict: 'satisfied',
      issue_codes: [],
      confidence: 0.82,
      assessed_by: 'system',
    })),
    coverage_risk_acceptances: [],
    raw_log_artifact_ref: ref('raw_search_log', `v1a_harness_raw_search_${RUN_ID}`, titleCardId),
    raw_log_artifact_payload: {
      source: 'v1a_harness_e2e_fixture',
      selected_literature_ids: selectedResources.map((resource) => resource.id),
      resource_sample_set_id: selectedResources[0]?.sampleSetId ?? null,
    },
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
}

function buildEvidenceMapExtractionDraft(input) {
  const inputRefsHash = input.evidenceMapMaterializer.inputRefsHashForSearchRunHandoff(input.searchRunHandoff);
  const coverageRowRefByRole = new Map(input.searchRunHandoff.coverage_row_intent_refs.map((rowRef) => {
    const role = input.coverageRowIntents.find((row) => row.coverage_row_intent_id === rowRef.ref_id)
      ?.expected_evidence_role;
    return [role, rowRef];
  }));
  const clusterTypeByRole = {
    support: 'method_family',
    challenge: 'limitation_family',
    baseline: 'baseline_family',
    context: 'method_family',
  };
  const patternTypeByRole = {
    support: 'solution',
    challenge: 'limitation',
    baseline: 'baseline',
    context: 'context',
  };
  const draftUnits = input.selectedResources.map((resource, index) => ({
    client_unit_key: `${resource.evidenceRole}-${index + 1}-${resource.id}`,
    coverage_row_intent_ref: coverageRowRefByRole.get(resource.evidenceRole) ?? null,
    evidence_role: resource.evidenceRole,
    literature_ref: resource.literatureRef,
    source_refs: [resource.sourceRef],
    locator: manualLocator({
      titleCardId: input.titleCardId,
      literatureRef: resource.literatureRef,
      sourceRef: resource.sourceRef,
      key: `${resource.evidenceRole}-${resource.id}-${RUN_ID}`,
      label: `${resource.evidenceRole}: ${resource.title}`,
    }),
    source_statement: sourceStatement(resource),
    source_attribution_kind: 'source_claim',
    normalized_statement: snippet(resource.keyContentDigest ?? resource.abstractText, 360),
    interpretation_payload: {
      role_hint: resource.evidenceRole,
      evidence_polarity: resource.evidencePolarity,
      sample_item_id: resource.sampleItemId,
    },
    confidence: 0.82,
    issue_codes: [],
  }));

  return {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_DRAFT_SCHEMA_VERSION,
    title_card_ref: titleCardRef(input.titleCardId),
    search_run_ref: input.searchRunHandoff.search_run_ref,
    search_plan_ref: input.searchRunHandoff.search_plan_ref,
    literature_resource_pool_snapshot_ref: input.searchRunHandoff.literature_resource_pool_snapshot_ref,
    literature_snapshot_hash: input.searchRunHandoff.literature_snapshot_hash,
    producer_kind: 'fixture',
    profile_id: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_SINGLE_AGENT_PROFILE_ID,
    input_refs_hash: inputRefsHash,
    draft_units: draftUnits,
    draft_links: [],
    draft_clusters: ROLE_ORDER.map((role) => ({
      cluster_type: clusterTypeByRole[role],
      cluster_key: `${role}-cluster`,
      unit_keys: draftUnits.filter((unit) => unit.evidence_role === role).map((unit) => unit.client_unit_key),
      label: `${role} evidence`,
      rationale: `Role-balanced ${role} evidence extracted from sampled literature.`,
      confidence: 0.82,
    })),
    draft_patterns: ROLE_ORDER.map((role) => ({
      pattern_type: patternTypeByRole[role],
      evidence_role: role,
      unit_keys: draftUnits.filter((unit) => unit.evidence_role === role).map((unit) => unit.client_unit_key),
      pattern_statement: `${role} evidence is present for v1a need validation.`,
      confidence: 0.82,
    })),
    draft_conflicts: [{
      conflict_type: 'claim_conflict',
      severity: 'moderate',
      support_unit_keys: draftUnits.filter((unit) => unit.evidence_role === 'support').map((unit) => unit.client_unit_key),
      challenge_unit_keys: draftUnits.filter((unit) => unit.evidence_role === 'challenge').map((unit) => unit.client_unit_key),
      baseline_unit_keys: draftUnits.filter((unit) => unit.evidence_role === 'baseline').map((unit) => unit.client_unit_key),
      context_unit_keys: draftUnits.filter((unit) => unit.evidence_role === 'context').map((unit) => unit.client_unit_key),
      issue_codes: ['risk_carry_forward_required'],
    }],
    warning_codes: [],
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
}

function evidenceUnitRefsByRole(evidenceMapRecords, role, titleCardId) {
  return evidenceMapRecords.evidence_units
    .filter((unit) => unit.evidence_role === role)
    .map((unit) => ref('evidence_unit', unit.evidence_unit_id, titleCardId, unit.evidence_map_version ?? null));
}

function allEvidenceUnitRefs(evidenceMapRecords, titleCardId) {
  return ROLE_ORDER.flatMap((role) => evidenceUnitRefsByRole(evidenceMapRecords, role, titleCardId));
}

function evidenceRefTable(evidenceMapRecords, titleCardId) {
  return evidenceMapRecords.evidence_units.map((unit) => ({
    evidence_ref: ref('evidence_unit', unit.evidence_unit_id, titleCardId, unit.evidence_map_version ?? null),
    role: unit.evidence_role,
    evidence_role: unit.evidence_role,
  }));
}

function buildRankedCandidateDraftBatch(input) {
  return {
    schema_version: 'v1',
    draft_batch: {
      batch_id: `ranked_candidate_batch_${RUN_ID}`,
      node_attempt_id: input.nodeAttemptId,
      terminal_result: 'finalize',
      ranking_rationale:
        'The candidate is grounded in role-balanced support, challenge, baseline, and context evidence from the v1a harness resource sample.',
      max_persisted_candidates: 5,
    },
    drafts: [
      {
        draft_id: `draft_v1a_harness_need_${RUN_ID}`,
        rank: 1,
        candidate_need:
          'AI systems researchers need a bounded decision framework for when RAG, fine-tuning, or hybrid adaptation improves answer quality and source attribution without introducing unacceptable retrieval-conflict, poisoning, or leakage risks.',
        unmet_need_statement:
          'The current literature contains many RAG and fine-tuning variants, but the actionable boundary conditions for choosing among them remain hard to audit from evidence alone.',
        mechanism_type: 'evaluation_gap',
        mechanism_summary:
          'Benchmarks, attribution checks, and failure-mode evidence are fragmented across RAG, fine-tuning, and agentic retrieval papers.',
        mechanism_payload: {
          decision_boundary: 'RAG versus fine-tuning versus hybrid adaptation',
          evaluation_axes: ['answer_quality', 'source_attribution', 'retrieval_conflict_risk'],
          v1a_harness_run_id: RUN_ID,
        },
        scope_notes:
          'Scope is limited to AI/RAG/fine-tuning literature in ai-rag-finetuning-2022-2026; no production deployment or universal superiority claims.',
        non_goal_notes:
          'Do not claim universal RAG superiority, universal fine-tuning superiority, or production deployment readiness.',
        prior_art_status: 'partial_solution_known',
        evidence_role_bundle: {
          support_unit_refs: evidenceUnitRefsByRole(input.evidenceMapRecords, 'support', input.titleCardId),
          challenge_unit_refs: evidenceUnitRefsByRole(input.evidenceMapRecords, 'challenge', input.titleCardId),
          baseline_unit_refs: evidenceUnitRefsByRole(input.evidenceMapRecords, 'baseline', input.titleCardId),
          context_unit_refs: evidenceUnitRefsByRole(input.evidenceMapRecords, 'context', input.titleCardId),
        },
        conflict_refs: [input.conflictRef],
        strength_assessment_refs: [input.evidenceStrengthRef],
        accepted_risk_refs: [],
        gap_codes: ['decision_boundary_evidence_fragmentation', 'risk_carry_forward_gap'],
        speculative: false,
        confidence: 0.82,
      },
    ],
    rejected_framings: [],
    unresolved_points: [],
  };
}

function buildGenerateExplorationPayload(input) {
  const roleCounts = ROLE_ORDER.reduce((counts, role) => {
    counts[role] = input.evidenceMapRecords.evidence_units.filter((unit) => unit.evidence_role === role).length;
    return counts;
  }, {});
  return {
    topic_scope: {
      title_card_id: input.titleCardId,
      topic_id: TOPIC_ID,
      domain: 'RAG, fine-tuning, and hybrid adaptation decision boundaries for AI systems papers',
    },
    evidence_signal_digest: {
      role_counts: roleCounts,
      support_count: roleCounts.support ?? 0,
      challenge_count: roleCounts.challenge ?? 0,
      baseline_count: roleCounts.baseline ?? 0,
      context_count: roleCounts.context ?? 0,
    },
    resource_sample_digest: {
      sample_set_id: input.resourceSampleSetId,
      selected_literature_count: input.selectedResources.length,
      role_counts: roleCounts,
    },
    search_coverage_digest: {
      search_run_id: input.searchRunRef.ref_id,
      coverage: 'role_balanced_v1a_harness_sample',
    },
    sibling_candidate_digest: {
      candidate_count: 0,
      semantic_role: 'existing_sibling_candidates_for_duplicate_awareness',
      empty_pool_meaning: 'no known sibling candidates; generate new drafts from evidence signals',
    },
    decision_memory_digest: {
      required_challenges: [
        'avoid universal RAG or fine-tuning superiority claims',
        'carry poisoning, leakage, and source-verification risks forward',
      ],
    },
    exploration_prompts: [
      'Generate bounded, evidence-grounded need candidates that explain why the selected literature supports a topic-management decision.',
    ],
    challenge_prompts: [
      'Pressure-test whether challenge and baseline evidence prevent overclaiming.',
    ],
    allowed_outputs: ['ranked_candidate_draft_batch'],
    forbidden_outputs: ['NeedCandidateSet', 'ValidatedNeed', 'TopicQuestionContract', 'SearchPlan mutation'],
  };
}

function buildGenerateArbiterPayload(input) {
  return {
    node_policy_ref: ref('node_policy', 'topic-selection.v1a.generate-need-candidate.v1', input.titleCardId, 'v1'),
    output_schema_ref: ref('schema', 'RankedCandidateDraftBatch@v1', input.titleCardId),
    authority_boundary: {
      authority_object: 'NeedCandidate',
      forbidden: ['NeedCandidateSet', 'ValidatedNeed', 'TopicQuestionContract', 'SearchPlan'],
    },
    max_persisted_candidates: 5,
    deterministic_gate_checklist: [
      'ranked_candidate_draft_batch_schema',
      'candidate_draft_admission',
      'supplemental_round_routing',
      'admitted_only_batch_persistence',
    ],
    role_level_summaries: [
      {
        role: 'single_agent',
        summary:
          'v1a harness E2E persists only admitted candidate drafts through the unified generate-need-candidate adapter.',
      },
    ],
    candidate_pool_digest: {
      candidate_count: 0,
      candidate_entries: [],
      semantic_role: 'existing_sibling_candidates_for_duplicate_awareness',
      empty_pool_meaning: 'no known duplicate candidates; generate new drafts from evidence_ref_table',
    },
    evidence_ref_table: [
      ...evidenceRefTable(input.evidenceMapRecords, input.titleCardId),
      { evidence_ref: input.evidenceStrengthRef, role: 'strength' },
      { evidence_ref: input.conflictRef, role: 'challenge' },
    ],
    rejected_framing_table: [],
    unresolved_points: [],
    batch_ranking_rules: ['rank grounded, bounded, reviewer-auditable candidates first'],
    persistence_rules: ['persist only admitted drafts through NeedCandidate batch boundary'],
    failure_rules: ['block when ranked batch is malformed or no generated draft passes admission gates'],
  };
}

function v1aGenerateModelOptionId() {
  if (GENERATE_NEED_CANDIDATE_EXECUTION_MODE !== 'provider_llm') {
    return null;
  }
  return PROVIDER_ID === 'dashscope'
    ? `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.dashscope-budget`
    : `${TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID}.openai-balanced`;
}

function needAdjudicationModelOptionId() {
  if (NEED_ADJUDICATION_EXECUTION_MODE !== 'provider_llm') {
    return null;
  }
  return PROVIDER_ID === 'dashscope'
    ? `${TOPIC_SELECTION_NEED_ADJUDICATION_SINGLE_AGENT_PROFILE_ID}.dashscope-budget`
    : `${TOPIC_SELECTION_NEED_ADJUDICATION_SINGLE_AGENT_PROFILE_ID}.openai-balanced`;
}

async function runGenerateNeedCandidate(runtime, input) {
  const nodeAttemptId = `node_attempt_generate_need_candidate_${RUN_ID}`;
  const workflowRunId = `workflow_run_generate_need_candidate_${RUN_ID}`;
  const evidenceMapRef = ref(
    'evidence_map',
    input.evidenceMapRecords.evidence_map.evidence_map_id,
    input.titleCardId,
    input.evidenceMapRecords.evidence_map.evidence_map_version ?? null,
  );
  const evidenceStrengthRef = ref('evidence_strength_assessment', `v1a_harness_strength_${RUN_ID}`, input.titleCardId);
  const conflictRef = ref('evidence_conflict', `v1a_harness_conflict_${RUN_ID}`, input.titleCardId);
  const rankedBatch = buildRankedCandidateDraftBatch({
    nodeAttemptId,
    titleCardId: input.titleCardId,
    evidenceMapRecords: input.evidenceMapRecords,
    evidenceStrengthRef,
    conflictRef,
  });
  const topicScopeRef = ref('topic_scope', TOPIC_ID, input.titleCardId);
  const resourceSampleSetRef = ref('resource_sample_set', input.resourceSampleSetId, input.titleCardId);
  const harnessInput = {
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-generate-need-candidate-${RUN_ID}`,
    title_card_id: input.titleCardId,
    workflow_run_id: workflowRunId,
    input_snapshot_id: null,
    node_attempt_id: nodeAttemptId,
    topic_scope_ref: topicScopeRef,
    evidence_map_ref: evidenceMapRef,
    evidence_strength_ref: evidenceStrengthRef,
    resource_sample_set_ref: resourceSampleSetRef,
    candidate_pool_projection_ref: null,
    search_snapshot_refs: [input.searchRunRef],
    resource_snapshot_refs: [input.literatureSnapshotRef],
    policy_version: 'v1',
    output_schema_version: 'v1',
    profile_id: TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    execution_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
    run_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'provider_llm' ? 'product' : 'acceptance',
    executor_kind: GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'codex_assisted' ? 'codex_assisted' : 'single_agent',
    exploration_payload: buildGenerateExplorationPayload({
      ...input,
      evidenceStrengthRef,
      conflictRef,
    }),
    arbiter_payload: buildGenerateArbiterPayload({
      ...input,
      evidenceStrengthRef,
      conflictRef,
    }),
    mocked_output: GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'mocked_llm'
      ? {
        fixture_id: `v1a_harness_ranked_candidate_batch_${RUN_ID}`,
        output: rankedBatch,
      }
      : null,
    codex_response: GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'codex_assisted'
      ? {
        operator_label: 'codex-v1a-harness-e2e',
        output: rankedBatch,
      }
      : null,
    model_option_id: v1aGenerateModelOptionId(),
    current_round_index: 1,
    remaining_round_budget: 0,
    persist_admitted_candidates: true,
    persistence_context: {
      search_run_ref: input.searchRunRef,
      search_plan_ref: input.searchPlanRef,
      literature_snapshot_ref: input.literatureSnapshotRef,
    },
    expectations: {
      status: 'succeeded',
      routing_decision: 'finalize_with_admitted_batch',
      ...(GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'provider_llm'
        ? {
          min_admitted_draft_count: 1,
          max_admitted_draft_count: 5,
          min_persisted_candidate_count: 1,
          max_persisted_candidate_count: 5,
        }
        : {
          admitted_draft_count: 1,
          persisted_candidate_count: 1,
        }),
      persistence: 'required',
    },
    created_by: 'system',
  };
  const result = await runtime.workflowHarness.runGenerateNeedCandidateScenario(harnessInput);
  assertScenarioPassed(result, 'generate-need-candidate');
  const persisted = result.adapter_result.persist_need_candidate_batch_result?.persisted_candidates ?? [];
  if (persisted.length === 0) {
    throw new Error('generate-need-candidate harness did not persist any NeedCandidate.');
  }
  return {
    result,
    persistedCandidates: persisted,
  };
}

async function prepareValidationInputs(runtime, candidates, titleCardId) {
  currentStage = 'prepare validate-need-adjudication inputs';
  const readinessAttempts = [];
  let selectedCandidate = null;
  let readiness = null;
  for (const candidate of candidates) {
    const candidateReadiness = await runtime.needValidation.assessCandidateReadiness({
      need_candidate_id: candidate.need_candidate_id,
      assessed_by: 'system',
    });
    readinessAttempts.push({
      need_candidate_id: candidate.need_candidate_id,
      recommendation: candidateReadiness.recommendation,
      blocker_codes: candidateReadiness.blockers.map((blocker) => blocker.code),
      warning_codes: candidateReadiness.warnings.map((warning) => warning.code),
    });
    if (candidateReadiness.recommendation === 'ready_for_validation') {
      selectedCandidate = candidate;
      readiness = candidateReadiness;
      break;
    }
  }
  if (!selectedCandidate || !readiness) {
    throw new Error(`No generated NeedCandidate is ready_for_validation: ${JSON.stringify(readinessAttempts)}`);
  }
  const supportPacket = await runtime.needValidation.createValidationDecisionSupportPacket({
    need_candidate_id: selectedCandidate.need_candidate_id,
    readiness_assessment_id: readiness.readiness_assessment_id,
    created_by: 'system',
  });
  const workflowRunId = `workflow_run_validate_need_adjudication_${RUN_ID}`;
  const nodeAttemptId = `node_attempt_validate_need_adjudication_${RUN_ID}`;
  const recommendationPacket = {
    schema_version: TOPIC_SELECTION_NEED_ADJUDICATION_RECOMMENDATION_PACKET_SCHEMA_VERSION,
    workflow_run_id: workflowRunId,
    node_attempt_id: nodeAttemptId,
    recommendation_packet_id: `${nodeAttemptId}_recommendation`,
    need_candidate_ref: ref('need_candidate', selectedCandidate.need_candidate_id, titleCardId, selectedCandidate.candidate_version),
    validation_support_packet_ref: ref(
      'validation_decision_support_packet',
      supportPacket.validation_support_packet_id,
      titleCardId,
    ),
    readiness_assessment_ref: ref('need_candidate_readiness', readiness.readiness_assessment_id, titleCardId),
    execution_mode: NEED_ADJUDICATION_EXECUTION_MODE,
    profile_id: TOPIC_SELECTION_NEED_ADJUDICATION_SINGLE_AGENT_PROFILE_ID,
    final_decision: 'validate',
    rationale:
      'The role-balanced support packet is sufficient to validate a bounded, reviewer-auditable need for v1b handoff.',
    required_actions: ['route result according to deterministic node policy'],
    gap_codes: [],
    accepted_risk_refs: [],
    residual_risk_refs: supportPacket.residual_risk_refs,
    rejected_reason: null,
    merge_target_need_candidate_ref: null,
    searchplan_recheck_reason: null,
    searchplan_recheck_gap_codes: [],
    source_refs: [
      ref('need_candidate', selectedCandidate.need_candidate_id, titleCardId, selectedCandidate.candidate_version),
      ref('need_candidate_readiness', readiness.readiness_assessment_id, titleCardId),
      ref('validation_decision_support_packet', supportPacket.validation_support_packet_id, titleCardId),
    ],
    recommendation_payload: { confidence: 0.82, run_id: RUN_ID },
    policy_version: 'v1',
    output_schema_version: 'v1',
  };
  return {
    candidate: selectedCandidate,
    readiness,
    supportPacket,
    recommendationPacket,
    workflowRunId,
    nodeAttemptId,
  };
}

async function runValidateNeedAdjudication(runtime, input) {
  const result = await runtime.workflowHarness.runValidateNeedAdjudicationScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-validate-need-adjudication-${RUN_ID}`,
    title_card_id: input.titleCardId,
    workflow_run_id: input.workflowRunId,
    node_attempt_id: input.nodeAttemptId,
    need_candidate_ref: ref(
      'need_candidate',
      input.candidate.need_candidate_id,
      input.titleCardId,
      input.candidate.candidate_version,
    ),
    evidence_map_ref: input.candidate.evidence_map_ref,
    search_run_ref: input.candidate.search_run_ref,
    search_plan_ref: input.candidate.search_plan_ref,
    literature_snapshot_ref: input.candidate.literature_snapshot_ref,
    readiness_assessment_ref: ref('need_candidate_readiness', input.readiness.readiness_assessment_id, input.titleCardId),
    validation_support_packet_ref: ref(
      'validation_decision_support_packet',
      input.supportPacket.validation_support_packet_id,
      input.titleCardId,
    ),
    readiness_packet_mode: 'consume_explicit_ref',
    support_packet_mode: 'consume_explicit_ref',
    execution_mode: NEED_ADJUDICATION_EXECUTION_MODE,
    run_mode: NEED_ADJUDICATION_EXECUTION_MODE === 'provider_llm' ? 'product' : 'acceptance',
    executor_kind: NEED_ADJUDICATION_EXECUTION_MODE === 'codex_assisted' ? 'codex_assisted' : 'single_agent',
    profile_id: TOPIC_SELECTION_NEED_ADJUDICATION_SINGLE_AGENT_PROFILE_ID,
    mocked_output: NEED_ADJUDICATION_EXECUTION_MODE === 'mocked_llm'
      ? {
        fixture_id: `v1a_harness_need_adjudication_${RUN_ID}`,
        output: input.recommendationPacket,
      }
      : null,
    codex_response: NEED_ADJUDICATION_EXECUTION_MODE === 'codex_assisted'
      ? {
        operator_label: 'codex-v1a-harness-e2e',
        output: input.recommendationPacket,
      }
      : null,
    model_option_id: needAdjudicationModelOptionId(),
    adjudication_actor: { actor_type: 'human', actor_id: 'v1a-harness-reviewer' },
    fixture_human_decision: NEED_ADJUDICATION_EXECUTION_MODE !== 'provider_llm',
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: {
      status: 'ready',
      route_outcome: 'advance_to_human_confirmation',
      final_decision: 'validate',
      adjudication_created: true,
    },
    created_by: 'system',
  });
  assertScenarioPassed(result, 'validate-need-adjudication');
  return result;
}

function humanConfirmationInput(supportPacket) {
  return {
    schema_version: TOPIC_SELECTION_HUMAN_CONFIRMATION_INPUT_SCHEMA_VERSION,
    actor_mode: 'human',
    accountable_human_ref: { actor_type: 'human', actor_id: 'v1a-harness-reviewer' },
    rationale:
      'I reviewed the support packet, required checks, residual risks, and validate adjudication for this v1a harness E2E run.',
    accepted_risk_refs: supportPacket.residual_risk_refs,
    required_check_results: supportPacket.required_human_checks.map((checkId) => ({
      check_id: checkId,
      result: 'accepted',
    })),
    delegated_executor: null,
  };
}

async function runHumanConfirmNeed(runtime, input) {
  const result = await runtime.workflowHarness.runHumanConfirmNeedScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-human-confirm-need-${RUN_ID}`,
    title_card_id: input.titleCardId,
    workflow_run_id: `workflow_run_human_confirm_need_${RUN_ID}`,
    node_attempt_id: `node_attempt_human_confirm_need_${RUN_ID}`,
    adjudication_result_ref: input.validateResult.node_result.adjudication_result_ref,
    need_candidate_ref: ref(
      'need_candidate',
      input.candidate.need_candidate_id,
      input.titleCardId,
      input.candidate.candidate_version,
    ),
    validation_support_packet_ref: ref(
      'validation_decision_support_packet',
      input.supportPacket.validation_support_packet_id,
      input.titleCardId,
    ),
    reserved_validated_need_ref: input.validateResult.node_result.reserved_validated_need_ref,
    confirmation_input: humanConfirmationInput(input.supportPacket),
    execution_mode: 'deterministic_parser',
    profile_id: TOPIC_SELECTION_CONFIRMATION_SEMANTIC_REVIEW_SINGLE_AGENT_PROFILE_ID,
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: {
      status: 'ready',
      route_outcome: 'advance_to_publish_v1b_input_bundle',
      validated_need_created: true,
      v1b_bundle_created: false,
    },
    created_by: 'system',
  });
  assertScenarioPassed(result, 'human-confirm-need');
  return result;
}

async function runPublishV1bInputBundle(runtime, input) {
  const validatedNeedId = input.humanConfirmResult.node_result.validated_need_ref.ref_id;
  const validatedNeed = await runtime.needValidation.getValidatedNeedById(validatedNeedId);
  assert.ok(validatedNeed, `ValidatedNeed ${validatedNeedId} not found after human confirmation.`);
  const memorySuggestions = await runtime.needValidation.listCandidateMemorySuggestionsByNeedCandidateId(
    input.candidate.need_candidate_id,
  );
  const result = await runtime.workflowHarness.runPublishV1bInputBundleScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-publish-v1b-input-bundle-${RUN_ID}`,
    title_card_id: input.titleCardId,
    workflow_run_id: `workflow_run_publish_v1b_input_bundle_${RUN_ID}`,
    node_attempt_id: `node_attempt_publish_v1b_input_bundle_${RUN_ID}`,
    validated_need_ref: input.humanConfirmResult.node_result.validated_need_ref,
    source_need_candidate_ref: ref(
      'need_candidate',
      input.candidate.need_candidate_id,
      input.titleCardId,
      input.candidate.candidate_version,
    ),
    adjudication_result_ref: input.humanConfirmResult.node_result.adjudication_result_ref,
    support_packet_ref: input.humanConfirmResult.node_result.validation_support_packet_ref,
    human_decision_ref: input.humanConfirmResult.node_result.human_decision_ref,
    evidence_map_ref: validatedNeed.evidence_map_ref,
    search_run_ref: validatedNeed.search_run_ref,
    search_plan_ref: validatedNeed.search_plan_ref,
    literature_snapshot_ref: validatedNeed.literature_snapshot_ref,
    evidence_role_bundle: validatedNeed.evidence_role_bundle,
    risk_refs: [...validatedNeed.residual_risk_refs, ...validatedNeed.accepted_risk_refs],
    memory_suggestion_refs: memorySuggestions.map((suggestion) =>
      ref('candidate_decision_memory_suggestion', suggestion.memory_suggestion_id, suggestion.title_card_id)
    ),
    recheck_request_refs: input.candidate.open_recheck_request_refs,
    expected_bundle_version: 'v1a-to-v1b-input-bundle-v1',
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: {
      status: 'ready',
      route_outcome: 'published_v1b_input_bundle',
      idempotency_result: 'created_new_bundle',
      bundle_published: true,
    },
    created_by: 'system',
  });
  assertScenarioPassed(result, 'publish-v1b-input-bundle');
  return result;
}

function assertScenarioPassed(result, label) {
  if (result.scenario_status !== 'passed') {
    throw new Error(`${label} harness scenario failed: ${JSON.stringify(result.assertions)}`);
  }
}

function compactNode(result) {
  return {
    node_id: result.node_id,
    scenario_case_id: result.scenario_case_id,
    scenario_status: result.scenario_status,
    workflow_run_id: result.workflow_run_id,
    node_attempt_id: result.node_attempt_id,
    node_status: result.node_result.status ?? result.adapter_result?.status ?? null,
    route_outcome: result.node_result.route_outcome ?? null,
    authority_refs: result.node_result.authority_refs ?? [],
    blocker_codes: result.node_result.blocker_codes ?? [],
    warning_codes: result.node_result.warning_codes ?? [],
    harness_trace_artifact_ref: result.harness_trace_artifact_ref,
  };
}

function compactGenerateNode(generateResult) {
  return {
    node_id: generateResult.result.node_id,
    scenario_case_id: generateResult.result.scenario_case_id,
    scenario_status: generateResult.result.scenario_status,
    workflow_run_id: generateResult.result.workflow_run_id,
    node_attempt_id: generateResult.result.node_attempt_id,
    adapter_status: generateResult.result.adapter_result.status,
    routing_decision:
      generateResult.result.adapter_result.supplemental_round_routing_decision?.routing_decision ?? null,
    persisted_candidate_refs:
      generateResult.result.adapter_result.persist_need_candidate_batch_result?.persisted_candidate_refs ?? [],
    candidate_pool_projection_ref:
      generateResult.result.adapter_result.persist_need_candidate_batch_result?.candidate_pool_projection_ref ?? null,
    blocker_codes: generateResult.result.adapter_result.blocker_codes ?? [],
    warning_codes: generateResult.result.adapter_result.warning_codes ?? [],
    harness_trace_artifact_ref: generateResult.result.harness_trace_artifact_ref,
  };
}

function sanitizeError(error) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

async function runV1aHarness(app, runtime, selectedResources, resourceSample) {
  const titleCardId = await createTitleCardFixture(app, selectedResources);
  const resourceSampleSetRef = ref('resource_sample_set', resourceSample.sample_set.resource_sample_set_id, titleCardId);
  selectedResources.forEach((resource) => {
    resource.literatureRef = ref('literature_record', resource.id, titleCardId);
    resource.sourceRef = ref('literature_source', resource.sources[0].id, titleCardId);
  });

  currentStage = 'harness create-topic-seed';
  const topicSeed = await runtime.workflowHarness.runCreateTopicSeedScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-create-topic-seed-${RUN_ID}`,
    title_card_id: titleCardId,
    workflow_run_id: `workflow_run_create_topic_seed_${RUN_ID}`,
    node_attempt_id: `node_attempt_create_topic_seed_${RUN_ID}`,
    intent_summary:
      'Evaluate whether the current RAG/fine-tuning literature pool supports a bounded, reviewer-auditable research topic about when retrieval, fine-tuning, or hybrid adaptation is justified.',
    scope_notes: `Real literature scope: ${TOPIC_ID}; selected ${selectedResources.length} key-content-ready records.`,
    intent_preparation_refs: [resourceSampleSetRef],
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: {
      status: 'succeeded',
      seed_version: 'v1',
    },
    created_by: 'system',
  });
  assertScenarioPassed(topicSeed, 'create-topic-seed');

  currentStage = 'harness snapshot-literature-resource-pool';
  const snapshot = await runtime.workflowHarness.runSnapshotLiteratureResourcePoolScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-snapshot-literature-resource-pool-${RUN_ID}`,
    title_card_id: titleCardId,
    workflow_run_id: `workflow_run_snapshot_literature_resource_pool_${RUN_ID}`,
    node_attempt_id: `node_attempt_snapshot_literature_resource_pool_${RUN_ID}`,
    topic_seed_ref: topicSeed.node_result.topic_seed_ref,
    source_scope: 'title_card_evidence_basket',
    resource_sample_set_provenance_ref: resourceSampleSetRef,
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: {
      status: 'succeeded',
      included_literature_count: selectedResources.length,
    },
    created_by: 'system',
  });
  assertScenarioPassed(snapshot, 'snapshot-literature-resource-pool');

  currentStage = 'harness create-search-plan';
  const blueprint = buildSearchPlanBlueprint({
    titleCardId,
    selectedResources,
    resourceSampleSetRef,
    topicSeedRef: topicSeed.node_result.topic_seed_ref,
    literatureSnapshotRef: snapshot.node_result.literature_resource_pool_snapshot_ref,
    snapshotHash: snapshot.node_result.snapshot_hash,
  });
  const searchPlan = await runtime.workflowHarness.runCreateSearchPlanScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-create-search-plan-${RUN_ID}`,
    title_card_id: titleCardId,
    workflow_run_id: `workflow_run_create_search_plan_${RUN_ID}`,
    node_attempt_id: `node_attempt_create_search_plan_${RUN_ID}`,
    blueprint,
    expectations: {
      status: 'succeeded',
      coverage_row_count: ROLE_ORDER.length,
      plan_version: 'v1',
    },
    created_by: 'system',
  });
  assertScenarioPassed(searchPlan, 'create-search-plan');

  currentStage = 'harness record-search-run';
  const searchRunBundle = buildSearchRunBundle({
    titleCardId,
    selectedResources,
    searchPlanRef: searchPlan.node_result.search_plan_ref,
    coverageRowIntents: searchPlan.node_result.coverage_row_intents,
    coverageRowIntentRefs: searchPlan.node_result.coverage_row_intent_refs,
    literatureSnapshotRef: snapshot.node_result.literature_resource_pool_snapshot_ref,
    snapshotHash: snapshot.node_result.snapshot_hash,
  });
  const searchRun = await runtime.workflowHarness.runRecordSearchRunScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-record-search-run-${RUN_ID}`,
    title_card_id: titleCardId,
    workflow_run_id: `workflow_run_record_search_run_${RUN_ID}`,
    node_attempt_id: `node_attempt_record_search_run_${RUN_ID}`,
    bundle: searchRunBundle,
    expectations: {
      status: 'succeeded',
      consumable_for_evidence_map: true,
      downstream_handoff_present: true,
    },
    created_by: 'system',
  });
  assertScenarioPassed(searchRun, 'record-search-run');

  currentStage = 'harness build-evidence-map';
  const evidenceMapDraft = buildEvidenceMapExtractionDraft({
    titleCardId,
    selectedResources,
    coverageRowIntents: searchPlan.node_result.coverage_row_intents,
    searchRunHandoff: searchRun.node_result.downstream_handoff,
    evidenceMapMaterializer: runtime.evidenceMapMaterializer,
  });
  const evidenceMap = await runtime.workflowHarness.runBuildEvidenceMapScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-build-evidence-map-${RUN_ID}`,
    title_card_id: titleCardId,
    workflow_run_id: `workflow_run_build_evidence_map_${RUN_ID}`,
    node_attempt_id: `node_attempt_build_evidence_map_${RUN_ID}`,
    search_run_handoff: searchRun.node_result.downstream_handoff,
    extraction_draft: evidenceMapDraft,
    execution_mode: 'none',
    profile_id: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_SINGLE_AGENT_PROFILE_ID,
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: {
      status: 'succeeded',
      materialization_status: 'ready',
      evidence_unit_count: selectedResources.length,
      downstream_handoff_present: true,
    },
    created_by: 'system',
  });
  assertScenarioPassed(evidenceMap, 'build-evidence-map');

  currentStage = 'harness generate-need-candidate';
  const generateNeedCandidate = await runGenerateNeedCandidate(runtime, {
    titleCardId,
    selectedResources,
    resourceSampleSetId: resourceSample.sample_set.resource_sample_set_id,
    evidenceMapRecords: evidenceMap.node_result.evidence_map_records,
    searchRunRef: searchRun.node_result.search_run_ref,
    searchPlanRef: searchPlan.node_result.search_plan_ref,
    literatureSnapshotRef: snapshot.node_result.literature_resource_pool_snapshot_ref,
  });

  const validationInputs = await prepareValidationInputs(
    runtime,
    generateNeedCandidate.persistedCandidates,
    titleCardId,
  );
  const candidate = validationInputs.candidate;

  currentStage = 'harness validate-need-adjudication';
  const validateNeed = await runValidateNeedAdjudication(runtime, {
    titleCardId,
    candidate,
    readiness: validationInputs.readiness,
    supportPacket: validationInputs.supportPacket,
    recommendationPacket: validationInputs.recommendationPacket,
    workflowRunId: validationInputs.workflowRunId,
    nodeAttemptId: validationInputs.nodeAttemptId,
  });

  currentStage = 'harness human-confirm-need';
  const humanConfirmNeed = await runHumanConfirmNeed(runtime, {
    titleCardId,
    candidate,
    supportPacket: validationInputs.supportPacket,
    validateResult: validateNeed,
  });

  currentStage = 'harness publish-v1b-input-bundle';
  const publishV1bInputBundle = await runPublishV1bInputBundle(runtime, {
    titleCardId,
    candidate,
    humanConfirmResult: humanConfirmNeed,
  });

  return {
    title_card_id: titleCardId,
    topic_seed_id: topicSeed.node_result.topic_seed_ref.ref_id,
    literature_resource_pool_snapshot_id: snapshot.node_result.literature_resource_pool_snapshot_ref.ref_id,
    search_plan_id: searchPlan.node_result.search_plan_ref.ref_id,
    search_run_id: searchRun.node_result.search_run_ref.ref_id,
    evidence_map_id: evidenceMap.node_result.evidence_map_ref.ref_id,
    need_candidate_id: candidate.need_candidate_id,
    validated_need_id: humanConfirmNeed.node_result.validated_need_ref.ref_id,
    v1b_input_bundle_id: publishV1bInputBundle.node_result.v1b_input_bundle_ref.ref_id,
    nodes: {
      create_topic_seed: compactNode(topicSeed),
      snapshot_literature_resource_pool: compactNode(snapshot),
      create_search_plan: compactNode(searchPlan),
      record_search_run: compactNode(searchRun),
      build_evidence_map: compactNode(evidenceMap),
      generate_need_candidate: compactGenerateNode(generateNeedCandidate),
      validate_need_adjudication: compactNode(validateNeed),
      human_confirm_need: compactNode(humanConfirmNeed),
      publish_v1b_input_bundle: compactNode(publishV1bInputBundle),
    },
    full_results: {
      create_topic_seed: topicSeed,
      snapshot_literature_resource_pool: snapshot,
      create_search_plan: searchPlan,
      record_search_run: searchRun,
      build_evidence_map: evidenceMap,
      generate_need_candidate: generateNeedCandidate.result,
      validate_need_adjudication: validateNeed,
      human_confirm_need: humanConfirmNeed,
      publish_v1b_input_bundle: publishV1bInputBundle,
    },
  };
}

await fs.mkdir(ARTIFACT_DIR, { recursive: true });

const prisma = new PrismaClient();
let app;

try {
  const runtime = makeWorkflowHarness(prisma, makeHarnessLlmGateway());
  app = buildApp({
    topicSelectionResourceSamplingLlmGateway: makeSamplingLlmGateway(),
  });

  currentStage = EXISTING_RESOURCE_SAMPLE_SET_ID ? 'load existing resource sample set' : 'create resource sample set';
  const resourceSample = EXISTING_RESOURCE_SAMPLE_SET_ID
    ? await requestJson(
      app,
      'GET',
      `/topic-selection/v1a/resource-samples/${encodeURIComponent(EXISTING_RESOURCE_SAMPLE_SET_ID)}`,
      200,
      undefined,
      'load existing resource sample set',
    )
    : await requestJson(app, 'POST', '/topic-selection/v1a/resource-samples', 201, {
      topic_id: TOPIC_ID,
      sample_size: LITERATURE_LIMIT,
      model: {
        provider_id: PROVIDER_ID,
        model_id: MODEL_ID,
        profile_id: 'topic-selection-resource-sampling-classification',
      },
      created_by: 'system',
    }, 'create resource sample set');
  await writeJson('00-resource-sample.json', resourceSample);

  currentStage = 'load sampled resources';
  const selectedResources = await loadSampledResources(prisma, resourceSample);
  const selectedLiterature = summarizeSelectedLiterature(selectedResources);
  await writeJson('01-selected-literature.json', {
    run_id: RUN_ID,
    topic_id: TOPIC_ID,
    resource_sample_set_id: resourceSample.sample_set.resource_sample_set_id,
    resource_sample_status: resourceSample.sample_set.status,
    resource_sample_warnings: resourceSample.sample_set.warnings,
    selected_literature: selectedLiterature,
  });

  const v1aHarness = await runV1aHarness(app, runtime, selectedResources, resourceSample);
  await writeJson('02-v1a-harness.json', v1aHarness);

  const summary = {
    status: 'passed',
    scenario_id: SCENARIO_ID,
    scenario_type: 'v1a_full_workflow_harness_e2e',
    run_id: RUN_ID,
    artifact_dir: ARTIFACT_DIR,
    topic_id: TOPIC_ID,
    provider_id: PROVIDER_ID,
    model_id: MODEL_ID,
    resource_sampling_mode: USE_MOCK_RESOURCE_SAMPLING ? 'deterministic_mock' : 'provider',
    harness_agent_execution_mode: DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
    harness_generate_execution_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
    harness_adjudication_execution_mode: NEED_ADJUDICATION_EXECUTION_MODE,
    resource_sample_source: EXISTING_RESOURCE_SAMPLE_SET_ID ? 'existing_sample_set' : 'created_in_run',
    resource_sample_set_id: resourceSample.sample_set.resource_sample_set_id,
    resource_sample_status: resourceSample.sample_set.status,
    resource_sample_warnings: resourceSample.sample_set.warnings,
    resource_sample_hash: resourceSample.sample_set.sample_hash,
    literature_count: selectedResources.length,
    selected_literature: selectedLiterature.map(({ key_content_digest: _digest, ...item }) => item),
    title_card_id: v1aHarness.title_card_id,
    topic_seed_id: v1aHarness.topic_seed_id,
    literature_resource_pool_snapshot_id: v1aHarness.literature_resource_pool_snapshot_id,
    search_plan_id: v1aHarness.search_plan_id,
    search_run_id: v1aHarness.search_run_id,
    evidence_map_id: v1aHarness.evidence_map_id,
    need_candidate_id: v1aHarness.need_candidate_id,
    validated_need_id: v1aHarness.validated_need_id,
    v1b_input_bundle_id: v1aHarness.v1b_input_bundle_id,
    nodes: v1aHarness.nodes,
  };
  await writeJson('90-summary.json', summary);
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  const failure = {
    status: 'failed',
    scenario_id: SCENARIO_ID,
    scenario_type: 'v1a_full_workflow_harness_e2e',
    run_id: RUN_ID,
    artifact_dir: ARTIFACT_DIR,
    topic_id: TOPIC_ID,
    current_stage: currentStage,
    provider_id: PROVIDER_ID,
    model_id: MODEL_ID,
    harness_agent_execution_mode: DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
    harness_generate_execution_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
    harness_adjudication_execution_mode: NEED_ADJUDICATION_EXECUTION_MODE,
    error: sanitizeError(error),
  };
  await writeJson('90-summary.json', failure);
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  if (app) {
    await app.close();
  }
}
