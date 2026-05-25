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
  TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FINAL_PROFILE_ID,
  TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FRAMING_PROFILE_ID,
  TOPIC_SELECTION_NEED_DISCOVERY_DEEP_CRITIC_PROFILE_ID,
  TOPIC_SELECTION_NEED_DISCOVERY_EXPLORER_PROFILE_ID,
} from '../../apps/backend/src/services/topic-selection-model-profile-registry-service.ts';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from '../../apps/backend/src/services/topic-selection-need-discovery-artifact-boundary-service.ts';
import { TopicSelectionNeedDiscoveryContextCompilerService } from '../../apps/backend/src/services/topic-selection-need-discovery-context-compiler-service.ts';
import { TopicSelectionNeedValidationService } from '../../apps/backend/src/services/topic-selection-need-validation-service.ts';
import { TopicSelectionPersistNeedCandidateBatchService } from '../../apps/backend/src/services/topic-selection-persist-need-candidate-batch-service.ts';
import { TopicSelectionSearchResourceService } from '../../apps/backend/src/services/topic-selection-search-resource-service.ts';
import { TopicSelectionWorkflowHarnessService } from '../../apps/backend/src/services/topic-selection-workflow-harness-service.ts';
import {
  TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_CONTEXT_PACKET_SCHEMA_VERSION,
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
const EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE = normalizeEvidenceExtractionExecutionMode(
  process.env.TOPIC_SELECTION_V1A_HARNESS_EVIDENCE_EXTRACTION_EXECUTION_MODE,
  'none',
);
const EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID = evidenceMapExtractionModelOptionId();
const GENERATE_NEED_CANDIDATE_EXECUTION_MODE = normalizeExecutionMode(
  process.env.TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTION_MODE,
  DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
);
const GENERATE_NEED_CANDIDATE_EXECUTOR_KIND = normalizeGenerateExecutorKind(
  process.env.TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTOR_KIND,
  GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'codex_assisted' ? 'codex_assisted' : 'single_agent',
);
const GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID = v1aGenerateModelOptionId();
const DEBATE_SLOT_IDS = [
  'explorer.round_1_discovery',
  'deep_critic.round_1_discovery',
  'arbiter.issue_framing',
  'arbiter.final_synthesis',
];
const DEBATE_SLOT_PROFILE_IDS = {
  'explorer.round_1_discovery': TOPIC_SELECTION_NEED_DISCOVERY_EXPLORER_PROFILE_ID,
  'deep_critic.round_1_discovery': TOPIC_SELECTION_NEED_DISCOVERY_DEEP_CRITIC_PROFILE_ID,
  'arbiter.issue_framing': TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FRAMING_PROFILE_ID,
  'arbiter.final_synthesis': TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FINAL_PROFILE_ID,
};
const DEBATE_EXECUTION_PROFILE = normalizeDebateExecutionProfile(
  process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PROFILE,
);
const DEBATE_SLOT_EXECUTION_MODES = buildDebateSlotExecutionModes();
const DEBATE_SLOT_MODEL_OPTION_OVERRIDES = buildDebateSlotModelOptionOverrides();
const DEBATE_EXECUTION_PLAN = buildDebateExecutionPlan();
const NEED_ADJUDICATION_EXECUTION_MODE = normalizeExecutionMode(
  process.env.TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_EXECUTION_MODE,
  DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
);
const NEED_ADJUDICATION_MODEL_OPTION_ID = needAdjudicationModelOptionId();
const NEED_ADJUDICATION_NEGATIVE_PROBE = normalizeNeedAdjudicationNegativeProbe(
  process.env.TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_NEGATIVE_PROBE,
);
const RUN_REPLAY_SMOKE = process.env.TOPIC_SELECTION_V1A_HARNESS_REPLAY_SMOKE === '1';
const HARNESS_USES_PROVIDER = EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'provider_llm'
  || GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'provider_llm'
  || NEED_ADJUDICATION_EXECUTION_MODE === 'provider_llm'
  || debateExecutionPlanUsesProvider(DEBATE_EXECUTION_PLAN);
const RUN_ID = process.env.TOPIC_SELECTION_V1A_HARNESS_RUN_ID
  ?? process.env.TOPIC_SELECTION_REAL_RUN_ID
  ?? uniqueId('v1a-harness-e2e');
const SCENARIO_ID = process.env.TOPIC_SELECTION_WORKFLOW_SCENARIO_ID?.trim()
  || process.env.TOPIC_SELECTION_REAL_SCENARIO_ID?.trim()
  || (NEED_ADJUDICATION_NEGATIVE_PROBE
    ? 'topic-selection.provider-negative.validate-need-adjudication.v1'
    : RUN_REPLAY_SMOKE
    ? 'topic-selection.v1a.replay-idempotency.real-db-smoke.v1'
    : HARNESS_USES_PROVIDER
      ? 'topic-selection.provider-stability.v1'
    : 'topic-selection.real-e2e.canary.v1');
const SCENARIO_TYPE = RUN_REPLAY_SMOKE
  ? 'real_db_replay_smoke'
  : NEED_ADJUDICATION_NEGATIVE_PROBE
    ? 'real_provider_negative_canary'
  : HARNESS_USES_PROVIDER
    ? 'real_provider_canary'
    : 'real_db_harness_smoke';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1a-harness-e2e', RUN_ID);
const ROLE_ORDER = ['support', 'challenge', 'baseline', 'context'];
const TOPIC_METHOD_FAMILY_TARGETS = [
  'retrieval_augmented_generation',
  'fine_tuning',
  'hybrid_adaptation',
];
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

function normalizeEvidenceExtractionExecutionMode(value, fallback) {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }
  if (['none', 'mocked_llm', 'codex_assisted', 'provider_llm'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported v1a harness evidence extraction execution mode: ${value}`);
}

function normalizeGenerateExecutorKind(value, fallback) {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }
  if (['single_agent', 'codex_assisted', 'multi_agent_debate'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported v1a harness generate executor kind: ${value}`);
}

function normalizeOptionalString(value) {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeNeedAdjudicationNegativeProbe(value) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  if (normalized === 'clean_validate' || normalized === 'method_gap_drop') {
    return normalized;
  }
  throw new Error(`Unsupported validate-need-adjudication negative probe: ${value}`);
}

function normalizeDebateExecutionProfile(value) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  if (normalized === 'mixed-cost-control' || normalized === 'provider-diverse-deep') {
    return normalized;
  }
  throw new Error(`Unsupported debate execution profile: ${value}`);
}

function debateSlotModelOptionEnv(slotId) {
  return {
    'explorer.round_1_discovery': process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_MODEL_OPTION_ID,
    'deep_critic.round_1_discovery': process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_MODEL_OPTION_ID,
    'arbiter.issue_framing': process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_MODEL_OPTION_ID,
    'arbiter.final_synthesis': process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_MODEL_OPTION_ID,
  }[slotId];
}

function debateSlotDefaultModelOptionId(slotId) {
  const profileId = DEBATE_SLOT_PROFILE_IDS[slotId];
  if (!profileId) {
    throw new Error(`Unsupported debate slot for model option selection: ${slotId}`);
  }
  return defaultProviderModelOptionId(profileId);
}

function defaultProviderModelOptionId(profileId) {
  return PROVIDER_ID === 'dashscope'
    ? `${profileId}.dashscope-thinking-budget`
    : `${profileId}.openai-balanced`;
}

function singleAgentExecutionSpec(executionMode, modelOptionId) {
  if (executionMode === 'none' || executionMode === 'deterministic_parser') {
    return null;
  }
  return {
    execution_mode: executionMode,
    ...(modelOptionId ? { model_option_id: modelOptionId } : {}),
  };
}

function providerModelOptionIdFor(profileId, executionMode, envName) {
  const envOverride = normalizeOptionalString(process.env[envName]);
  if (executionMode !== 'provider_llm') {
    if (envOverride) {
      throw new Error(`${envName} requires provider_llm execution mode.`);
    }
    return null;
  }
  return envOverride ?? defaultProviderModelOptionId(profileId);
}

function evidenceMapExtractionModelOptionId() {
  return providerModelOptionIdFor(
    TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_SINGLE_AGENT_PROFILE_ID,
    EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
    'TOPIC_SELECTION_V1A_HARNESS_EVIDENCE_EXTRACTION_MODEL_OPTION_ID',
  );
}

function buildDebateSlotModelOptionOverrides() {
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate') {
    return null;
  }
  if (
    DEBATE_EXECUTION_PROFILE
    || normalizeOptionalString(process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PLAN_JSON)
  ) {
    assertNoLegacyDebateSlotEnv('named debate execution profile or execution_plan JSON');
    return null;
  }
  const overrides = {};
  for (const slotId of Object.keys(DEBATE_SLOT_EXECUTION_MODES)) {
    const envOverride = normalizeOptionalString(debateSlotModelOptionEnv(slotId));
    if (DEBATE_SLOT_EXECUTION_MODES[slotId] !== 'provider_llm') {
      if (envOverride) {
        throw new Error(`${slotId} model option override requires provider_llm execution mode.`);
      }
      continue;
    }
    overrides[slotId] = envOverride ?? debateSlotDefaultModelOptionId(slotId);
  }
  return Object.keys(overrides).length > 0 ? overrides : null;
}

function buildDebateSlotExecutionModes() {
  if (DEBATE_EXECUTION_PROFILE === 'mixed-cost-control') {
    return {
      'explorer.round_1_discovery': 'codex_assisted',
      'deep_critic.round_1_discovery': 'codex_assisted',
      'arbiter.issue_framing': 'codex_assisted',
      'arbiter.final_synthesis': 'provider_llm',
    };
  }
  if (DEBATE_EXECUTION_PROFILE === 'provider-diverse-deep') {
    return {
      'explorer.round_1_discovery': 'codex_assisted',
      'deep_critic.round_1_discovery': 'provider_llm',
      'arbiter.issue_framing': 'codex_assisted',
      'arbiter.final_synthesis': 'provider_llm',
    };
  }
  return {
    'explorer.round_1_discovery': normalizeExecutionMode(
      process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_EXECUTION_MODE,
      'codex_assisted',
    ),
    'deep_critic.round_1_discovery': normalizeExecutionMode(
      process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_EXECUTION_MODE,
      'provider_llm',
    ),
    'arbiter.issue_framing': normalizeExecutionMode(
      process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_EXECUTION_MODE,
      'provider_llm',
    ),
    'arbiter.final_synthesis': normalizeExecutionMode(
      process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_EXECUTION_MODE,
      'provider_llm',
    ),
  };
}

function legacyDebateSlotEnvNames() {
  return [
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_EXECUTION_MODE',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_EXECUTION_MODE',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_EXECUTION_MODE',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_EXECUTION_MODE',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_MODEL_OPTION_ID',
  ];
}

function activeLegacyDebateSlotEnvNames() {
  return legacyDebateSlotEnvNames().filter((envName) => normalizeOptionalString(process.env[envName]));
}

function assertNoLegacyDebateSlotEnv(owner) {
  const activeNames = activeLegacyDebateSlotEnvNames();
  if (activeNames.length > 0) {
    throw new Error(`${owner} cannot be combined with legacy debate slot env overrides: ${activeNames.join(', ')}`);
  }
}

function buildDebateExecutionPlan() {
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate') {
    return null;
  }
  const envJson = normalizeOptionalString(process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PLAN_JSON);
  if (DEBATE_EXECUTION_PROFILE && envJson) {
    throw new Error('TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PROFILE cannot be combined with TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PLAN_JSON.');
  }
  if (DEBATE_EXECUTION_PROFILE) {
    assertNoLegacyDebateSlotEnv(`debate execution profile ${DEBATE_EXECUTION_PROFILE}`);
    return buildNamedDebateExecutionPlan(DEBATE_EXECUTION_PROFILE);
  }
  if (envJson) {
    assertNoLegacyDebateSlotEnv('debate execution_plan JSON');
    return JSON.parse(envJson);
  }
  const slots = {};
  for (const [slotId, executionMode] of Object.entries(DEBATE_SLOT_EXECUTION_MODES)) {
    slots[slotId] = {
      execution_mode: executionMode,
      ...(executionMode === 'provider_llm' && DEBATE_SLOT_MODEL_OPTION_OVERRIDES?.[slotId]
        ? { model_option_id: DEBATE_SLOT_MODEL_OPTION_OVERRIDES[slotId] }
        : {}),
    };
  }
  return { slots };
}

function buildNamedDebateExecutionPlan(profile) {
  if (profile === 'mixed-cost-control') {
    return {
      slots: {
        'explorer.round_1_discovery': { execution_mode: 'codex_assisted' },
        'deep_critic.round_1_discovery': { execution_mode: 'codex_assisted' },
        'arbiter.issue_framing': { execution_mode: 'codex_assisted' },
        'arbiter.final_synthesis': {
          execution_mode: 'provider_llm',
          model_option_id: `${TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FINAL_PROFILE_ID}.openai-quality`,
        },
      },
    };
  }
  if (profile === 'provider-diverse-deep') {
    return {
      slots: {
        'explorer.round_1_discovery': { execution_mode: 'codex_assisted' },
        'deep_critic.round_1_discovery': {
          execution_mode: 'provider_llm',
          model_option_id: `${TOPIC_SELECTION_NEED_DISCOVERY_DEEP_CRITIC_PROFILE_ID}.openai-deep-reasoning`,
        },
        'arbiter.issue_framing': { execution_mode: 'codex_assisted' },
        'arbiter.final_synthesis': {
          execution_mode: 'provider_llm',
          model_option_id: `${TOPIC_SELECTION_NEED_DISCOVERY_ARBITER_FINAL_PROFILE_ID}.openai-deep-reasoning`,
        },
      },
      instances: {
        'explorer.round_1_discovery#explorer_2': {
          execution_mode: 'provider_llm',
          model_option_id: `${TOPIC_SELECTION_NEED_DISCOVERY_EXPLORER_PROFILE_ID}.openai-quality`,
        },
        'explorer.round_1_discovery#explorer_3': {
          execution_mode: 'provider_llm',
          model_option_id: `${TOPIC_SELECTION_NEED_DISCOVERY_EXPLORER_PROFILE_ID}.dashscope-thinking-budget`,
        },
        'deep_critic.round_1_discovery#deep_critic_2': { execution_mode: 'codex_assisted' },
      },
    };
  }
  throw new Error(`Unsupported named debate execution profile: ${profile}`);
}

function debateExecutionSpec(slotId, agentInstanceId = null) {
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate') {
    return null;
  }
  const instanceKey = agentInstanceId ? `${slotId}#${agentInstanceId}` : null;
  return (instanceKey ? DEBATE_EXECUTION_PLAN?.instances?.[instanceKey] : null)
    ?? DEBATE_EXECUTION_PLAN?.slots?.[slotId]
    ?? DEBATE_EXECUTION_PLAN?.default
    ?? {
      execution_mode: DEBATE_SLOT_EXECUTION_MODES[slotId],
      ...(DEBATE_SLOT_MODEL_OPTION_OVERRIDES?.[slotId]
        ? { model_option_id: DEBATE_SLOT_MODEL_OPTION_OVERRIDES[slotId] }
        : {}),
    };
}

function debateExecutionPlanUsesProvider(plan) {
  if (!plan) {
    return false;
  }
  const specs = [
    plan.default,
    ...Object.values(plan.slots ?? {}),
    ...Object.values(plan.instances ?? {}),
  ].filter(Boolean);
  return specs.some((spec) => spec.execution_mode === 'provider_llm');
}

function plannedDebateInstanceCount(slotId) {
  const prefix = `${slotId}#`;
  let count = 0;
  for (const key of Object.keys(DEBATE_EXECUTION_PLAN?.instances ?? {})) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const match = key.slice(prefix.length).match(/_(\d+)$/u);
    count = Math.max(count, Number.parseInt(match?.[1] ?? '0', 10));
  }
  return count;
}

if (
  GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
  && debateExecutionSpec('arbiter.final_synthesis')?.execution_mode === 'codex_assisted'
) {
  throw new Error('topic-selection v1a debate final synthesis must be provider_llm or mocked_llm; codex_assisted is not allowed.');
}
if (
  GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate'
  && DEBATE_EXECUTION_PROFILE
) {
  throw new Error('TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PROFILE requires generate executor kind multi_agent_debate.');
}
if (
  GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate'
  && normalizeOptionalString(process.env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PLAN_JSON)
) {
  throw new Error('TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PLAN_JSON requires generate executor kind multi_agent_debate.');
}
if (
  GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'codex_assisted'
  && GENERATE_NEED_CANDIDATE_EXECUTION_MODE !== 'codex_assisted'
) {
  throw new Error('generate executor kind codex_assisted requires generate execution mode codex_assisted.');
}
if (
  GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'codex_assisted'
  && GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate'
  && GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'codex_assisted'
) {
  throw new Error('generate execution mode codex_assisted requires generate executor kind codex_assisted.');
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
  if (text.length <= maxLength) {
    return text;
  }
  const limit = Math.max(1, maxLength - 3);
  const boundaryWindow = text.slice(0, limit);
  const sentenceBoundary = Math.max(
    boundaryWindow.lastIndexOf('. '),
    boundaryWindow.lastIndexOf('? '),
    boundaryWindow.lastIndexOf('! '),
  );
  if (sentenceBoundary >= Math.floor(limit * 0.55)) {
    return `${boundaryWindow.slice(0, sentenceBoundary + 1).trim()}...`;
  }
  const wordBoundary = boundaryWindow.lastIndexOf(' ');
  const end = wordBoundary >= Math.floor(limit * 0.65) ? wordBoundary : limit;
  return `${boundaryWindow.slice(0, end).trim()}...`;
}

function stripLeadingTitle(title, value) {
  const text = normalizeText(value);
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) {
    return text;
  }
  const lowerText = text.toLowerCase();
  const lowerTitle = normalizedTitle.toLowerCase();
  if (lowerText === lowerTitle) {
    return '';
  }
  for (const separator of [':', '--', '-', '|']) {
    const prefix = `${lowerTitle}${separator}`;
    if (lowerText.startsWith(prefix)) {
      return text.slice(normalizedTitle.length + separator.length).trim();
    }
  }
  if (lowerText.startsWith(`${lowerTitle} `)) {
    return text.slice(normalizedTitle.length).trim();
  }
  return text;
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

class CountingLlmGateway {
  constructor(delegate) {
    this.delegate = delegate;
    this.calls = [];
  }

  get callCount() {
    return this.calls.length;
  }

  snapshot() {
    return {
      call_count: this.callCount,
      calls: this.calls.map((call) => ({ ...call })),
    };
  }

  async createStructuredOutput(request) {
    this.calls.push({
      stage: currentStage,
      schema_name: request.schemaName ?? null,
      provider_id: request.model?.providerId ?? null,
      model_id: request.model?.modelId ?? null,
      profile_id: request.model?.profileId ?? null,
      prompt_template_id: request.prompt?.promptTemplateId ?? null,
      prompt_template_version: request.prompt?.version ?? null,
    });
    return this.delegate.createStructuredOutput(request);
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
  const debateNeedsProvider = GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
    && Object.values(DEBATE_SLOT_EXECUTION_MODES).includes('provider_llm');
  if (
    [
      EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
      GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
      NEED_ADJUDICATION_EXECUTION_MODE,
    ].includes('provider_llm')
    || debateNeedsProvider
  ) {
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
      methodFamilies: item.method_families ?? [],
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
    method_families: resource.methodFamilies,
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

function methodFamilyCounts(selectedResources) {
  return selectedResources.reduce((counts, resource) => {
    for (const family of resource.methodFamilies ?? []) {
      counts[family] = (counts[family] ?? 0) + 1;
    }
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
      method_family_targets: TOPIC_METHOD_FAMILY_TARGETS,
    },
    role_coverage_expectation: roleCoverageExpectation(input.selectedResources),
    method_family_targets: TOPIC_METHOD_FAMILY_TARGETS,
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
  const title = normalizeText(resource.title);
  const body = sourceStatementBody(resource, 520);
  return title && body ? `${title}: ${body}` : title || body;
}

function sourceStatementBody(resource, maxLength = 420) {
  return snippet(stripLeadingTitle(resource.title, resource.keyContentDigest ?? resource.abstractText), maxLength);
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
  const producerKind = input.producerKind ?? 'fixture';
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
    normalized_statement: sourceStatementBody(resource, 360),
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
    producer_kind: producerKind,
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

function buildEvidenceMapExtractionContextPacket(input) {
  const inputRefsHash = input.evidenceMapMaterializer.inputRefsHashForSearchRunHandoff(input.searchRunHandoff);
  const coverageRowRefByRole = new Map((input.searchRunHandoff.coverage_role_expectations ?? []).map((entry) => [
    entry.expected_evidence_role,
    entry.coverage_row_intent_ref,
  ]));
  const sourceCandidates = input.selectedResources.map((resource, index) => ({
    candidate_key: `${resource.evidenceRole}-${index + 1}-${resource.id}`,
    expected_evidence_role: resource.evidenceRole,
    coverage_row_intent_ref: coverageRowRefByRole.get(resource.evidenceRole) ?? null,
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
    normalized_statement: sourceStatementBody(resource, 360),
    source_attribution_kind: 'source_claim',
    evidence_polarity: resource.evidencePolarity,
    role_hint: resource.evidenceRole,
    title: resource.title,
    sample_item_id: resource.sampleItemId,
  }));
  return {
    schema_version: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_CONTEXT_PACKET_SCHEMA_VERSION,
    node_id: 'topic-selection.v1a.build-evidence-map.v1',
    workflow_run_id: input.workflowRunId,
    node_attempt_id: input.nodeAttemptId,
    context_family: 'evidence_extraction_context',
    input_refs: uniqueFunctionalRefs([
      input.searchRunHandoff.search_run_ref,
      input.searchRunHandoff.search_plan_ref,
      input.searchRunHandoff.literature_resource_pool_snapshot_ref,
      ...input.searchRunHandoff.coverage_row_intent_refs,
      ...input.searchRunHandoff.evidence_map_input_refs,
      ...input.searchRunHandoff.coverage_binding_refs,
      ...input.searchRunHandoff.coverage_assessment_refs,
    ]),
    input_refs_hash: inputRefsHash,
    search_run_handoff_hash: inputRefsHash,
    context_compiler_version: 'v1a-harness-evidence-extraction-context-v1',
    policy_version: 'v1',
    output_schema_version: 'v1',
    execution_mode: input.executionMode,
    profile_id: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_SINGLE_AGENT_PROFILE_ID,
    cache_key: [
      'topic-selection.evidence-map-extraction',
      input.searchRunHandoff.search_run_ref.ref_id,
      inputRefsHash,
      input.executionMode,
      'v1',
    ].join(':'),
    cache_hit: false,
    redaction_policy: 'topic_selection_evidence_map_extraction_context_redaction_v1',
    payload: {
      search_run_handoff_summary: {
        search_run_ref: input.searchRunHandoff.search_run_ref,
        search_plan_ref: input.searchRunHandoff.search_plan_ref,
        literature_resource_pool_snapshot_ref: input.searchRunHandoff.literature_resource_pool_snapshot_ref,
        literature_snapshot_hash: input.searchRunHandoff.literature_snapshot_hash,
        method_family_targets: input.searchRunHandoff.method_family_targets ?? [],
        coverage_role_expectations: input.searchRunHandoff.coverage_role_expectations,
        coverage_summary: input.searchRunHandoff.coverage_summary,
        source_health_summary: input.searchRunHandoff.source_health_summary,
      },
      source_candidates: sourceCandidates,
      materialization_rules: [
        'Produce TopicSelectionEvidenceMapExtractionDraft@v1 only.',
        'Create at least one draft_unit per source_candidate; omitted source candidates block materialization.',
        'Copy literature_ref, source_refs, locator, and coverage_row_intent_ref exactly from source_candidates.',
        'evidence_role must equal expected_evidence_role for the cited coverage_row_intent_ref.',
        'source_statement must be source-grounded text from source_candidate.source_statement.',
        'source_attribution_kind must be source_claim, counter_evidence, or human_judgment; never llm_inference.',
        'Do not include hidden reasoning, raw provider logs, raw search logs, or authority record ids.',
      ],
      allowed_outputs: [
        'draft_units',
        'draft_links',
        'draft_clusters',
        'draft_patterns',
        'draft_conflicts',
        'warning_codes',
      ],
      forbidden_outputs: [
        'evidence_map_id',
        'evidence_unit_id',
        'hidden_reasoning',
        'raw_provider_response',
        'raw_provider_logs',
        'raw_search_log_authority_refs',
      ],
    },
    created_at: new Date().toISOString(),
  };
}

function uniqueFunctionalRefs(refs) {
  const seen = new Set();
  const unique = [];
  for (const candidate of refs) {
    if (!candidate) {
      continue;
    }
    const signature = refSignature(candidate);
    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(candidate);
    }
  }
  return unique;
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

function buildDebateExplorerNotes(input) {
  return {
    schema_version: 'v1',
    debate_loop_id: input.debateLoopId,
    round_index: 1,
    role: 'explorer',
    stage: 'round_1_discovery',
    agent_instance_id: 'explorer_1',
    candidate_angles: [
      {
        angle_id: `explorer_angle_decision_boundary_${RUN_ID}`,
        summary:
          'RAG, fine-tuning, and hybrid adaptation papers expose a decision-boundary need rather than a simple method ranking.',
        candidate_need_hint:
          'Frame the need as an auditable decision framework for choosing RAG, fine-tuning, or hybrid adaptation under evidence and risk constraints.',
        evidence_refs: allEvidenceUnitRefs(input.evidenceMapRecords, input.titleCardId),
      },
    ],
    evidence_refs: allEvidenceUnitRefs(input.evidenceMapRecords, input.titleCardId),
    unresolved_questions: [
      'Which risks should block a broad claim and which can be carried forward as accepted residual risk?',
    ],
    warnings: [],
  };
}

function buildDebateDeepCriticNotes(input) {
  return {
    schema_version: 'v1',
    debate_loop_id: input.debateLoopId,
    round_index: 1,
    role: 'deep_critic',
    stage: 'round_1_discovery',
    agent_instance_id: 'deep_critic_1',
    critique_points: [
      {
        critique_id: `deep_critic_overclaim_${RUN_ID}`,
        summary:
          'A useful need candidate must retain poisoning, leakage, source-verification, and retrieval-conflict risks instead of converting them into support evidence.',
        severity: 'high',
        evidence_refs: evidenceUnitRefsByRole(input.evidenceMapRecords, 'challenge', input.titleCardId),
      },
    ],
    failure_modes: [
      'universal superiority framing',
      'dropping challenge evidence after candidate generation',
      'treating benchmark context as proof of deployment readiness',
    ],
    missing_evidence_questions: [
      'Which benchmark or comparison evidence is strong enough to bound the proposed decision framework?',
    ],
    evidence_refs: [
      ...evidenceUnitRefsByRole(input.evidenceMapRecords, 'challenge', input.titleCardId),
      ...evidenceUnitRefsByRole(input.evidenceMapRecords, 'baseline', input.titleCardId),
    ],
    warnings: ['risk evidence must not be reclassified as support'],
  };
}

function buildDebateMockedIssueFrame(input) {
  return {
    schema_version: 'v1',
    debate_loop_id: input.debateLoopId,
    round_index: 1,
    role: 'arbiter',
    stage: 'issue_framing',
    frame_id: `issue_frame_${RUN_ID}`,
    focused_questions: [
      'Can the final candidate articulate a bounded decision framework while carrying support, challenge, baseline, and context evidence?',
    ],
    requested_roles: ['explorer', 'deep_critic'],
    source_role_summary_refs: [
      ref('artifact_ref', `mock_explorer_role_summary_${RUN_ID}`, input.titleCardId),
      ref('artifact_ref', `mock_deep_critic_role_summary_${RUN_ID}`, input.titleCardId),
    ],
    stop_condition: null,
  };
}

function buildDebateCodexResponses(input) {
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate') {
    return null;
  }
  const responses = {};
  const explorerCount = Math.max(1, plannedDebateInstanceCount('explorer.round_1_discovery'));
  const explorerResponses = [];
  for (let index = 0; index < explorerCount; index += 1) {
    const agentInstanceId = `explorer_${index + 1}`;
    if (debateExecutionSpec('explorer.round_1_discovery', agentInstanceId)?.execution_mode !== 'codex_assisted') {
      explorerResponses.push(null);
      continue;
    }
    const output = buildDebateExplorerNotes(input);
    output.agent_instance_id = agentInstanceId;
    explorerResponses.push({
      operator_label: `codex-v1a-harness-debate-${agentInstanceId}`,
      output,
    });
  }
  while (explorerResponses.at(-1) === null) {
    explorerResponses.pop();
  }
  if (explorerResponses.some(Boolean)) {
    responses.explorer = explorerResponses;
  }

  const deepCriticCount = Math.max(1, plannedDebateInstanceCount('deep_critic.round_1_discovery'));
  const deepCriticResponses = [];
  for (let index = 0; index < deepCriticCount; index += 1) {
    const agentInstanceId = `deep_critic_${index + 1}`;
    if (debateExecutionSpec('deep_critic.round_1_discovery', agentInstanceId)?.execution_mode !== 'codex_assisted') {
      deepCriticResponses.push(null);
      continue;
    }
    const output = buildDebateDeepCriticNotes(input);
    output.agent_instance_id = agentInstanceId;
    deepCriticResponses.push({
      operator_label: `codex-v1a-harness-debate-${agentInstanceId}`,
      output,
    });
  }
  while (deepCriticResponses.at(-1) === null) {
    deepCriticResponses.pop();
  }
  if (deepCriticResponses.some(Boolean)) {
    responses.deep_critic = deepCriticResponses;
  }
  if (debateExecutionSpec('arbiter.issue_framing')?.execution_mode === 'codex_assisted') {
    responses.arbiter_issue_frame = {
      operator_label: 'codex-v1a-harness-debate-issue-frame',
      output: buildDebateMockedIssueFrame(input),
    };
  }
  return Object.keys(responses).length > 0 ? responses : null;
}

function buildDebateMockedOutputs(input) {
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate') {
    return null;
  }
  const allSlotsMocked = DEBATE_SLOT_IDS.every((slotId) =>
    debateExecutionSpec(slotId)?.execution_mode === 'mocked_llm',
  );
  if (!allSlotsMocked) {
    return null;
  }
  return {
    explorer: [{
      fixture_id: `v1a_harness_debate_explorer_${RUN_ID}`,
      output: buildDebateExplorerNotes(input),
    }],
    deep_critic: [{
      fixture_id: `v1a_harness_debate_deep_critic_${RUN_ID}`,
      output: buildDebateDeepCriticNotes(input),
    }],
    arbiter_issue_frame: {
      fixture_id: `v1a_harness_debate_issue_frame_${RUN_ID}`,
      output: buildDebateMockedIssueFrame(input),
    },
    arbiter_final: {
      fixture_id: `v1a_harness_debate_final_${RUN_ID}`,
      output: input.rankedBatch,
    },
  };
}

function assertSupportedDebateSlotFixtures() {
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate') {
    return;
  }
  const mockedSlots = DEBATE_SLOT_IDS
    .filter((slotId) => debateExecutionSpec(slotId)?.execution_mode === 'mocked_llm');
  if (mockedSlots.length > 0 && mockedSlots.length < DEBATE_SLOT_IDS.length) {
    throw new Error(`Mixed mocked_llm debate slots are not supported by this E2E script: ${mockedSlots.join(', ')}`);
  }
}

function buildGenerateExplorationPayload(input) {
  const roleCounts = ROLE_ORDER.reduce((counts, role) => {
    counts[role] = input.evidenceMapRecords.evidence_units.filter((unit) => unit.evidence_role === role).length;
    return counts;
  }, {});
  const familyCounts = methodFamilyCounts(input.selectedResources);
  const methodFamilyTargets = input.evidenceMapHandoff?.method_family_targets
    ?? input.searchRunHandoff?.method_family_targets
    ?? input.searchPlanBlueprint?.method_family_targets
    ?? [];
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
      method_family_counts: familyCounts,
      covered_method_families: Object.keys(familyCounts).sort(),
      topic_method_family_targets: methodFamilyTargets,
    },
    search_coverage_digest: {
      search_run_id: input.searchRunRef.ref_id,
      coverage: 'role_balanced_v1a_harness_sample',
      method_family_targets: methodFamilyTargets,
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
  if (GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate') {
    const envOverride = normalizeOptionalString(process.env.TOPIC_SELECTION_V1A_HARNESS_GENERATE_MODEL_OPTION_ID);
    if (envOverride) {
      throw new Error('TOPIC_SELECTION_V1A_HARNESS_GENERATE_MODEL_OPTION_ID is for single-agent generate-need-candidate only; use debate execution_plan or slot model option env vars for debate.');
    }
    return null;
  }
  return providerModelOptionIdFor(
    TOPIC_SELECTION_GENERATE_NEED_CANDIDATE_SINGLE_AGENT_PROFILE_ID,
    GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
    'TOPIC_SELECTION_V1A_HARNESS_GENERATE_MODEL_OPTION_ID',
  );
}

function needAdjudicationModelOptionId() {
  return providerModelOptionIdFor(
    TOPIC_SELECTION_NEED_ADJUDICATION_SINGLE_AGENT_PROFILE_ID,
    NEED_ADJUDICATION_EXECUTION_MODE,
    'TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_MODEL_OPTION_ID',
  );
}

function needAdjudicationNegativeProbeInstruction() {
  if (NEED_ADJUDICATION_NEGATIVE_PROBE === 'clean_validate') {
    return [
      'Diagnostic provider-negative conformance probe.',
      'For this acceptance-only probe, intentionally return a schema-valid but policy-invalid clean validate packet.',
      'Preserve workflow_run_id, node_attempt_id, need_candidate_ref, validation_support_packet_ref, readiness_assessment_ref, profile_id, policy_version, and output_schema_version exactly.',
      'Set final_decision to validate, but set residual_risk_refs, accepted_risk_refs, gap_codes, and required_actions to empty arrays even when the support packet contains residual risks or METHOD_FAMILY_COVERAGE_GAP.',
      'Do not choose return_to_candidate, request_searchplan_recheck, reject, park, or merge.',
    ].join(' ');
  }
  if (NEED_ADJUDICATION_NEGATIVE_PROBE === 'method_gap_drop') {
    return [
      'Diagnostic provider-negative conformance probe.',
      'For this acceptance-only probe, intentionally return a schema-valid but policy-invalid validate packet that carries risks but drops method-family coverage follow-up.',
      'Preserve workflow_run_id, node_attempt_id, need_candidate_ref, validation_support_packet_ref, readiness_assessment_ref, profile_id, policy_version, and output_schema_version exactly.',
      'Set final_decision to validate.',
      'Copy every support_packet.residual_risk_refs item exactly into residual_risk_refs and accepted_risk_refs.',
      'Set gap_codes and required_actions to empty arrays even when support_packet.open_gap_codes contains METHOD_FAMILY_COVERAGE_GAP.',
      'Do not mention METHOD_FAMILY_COVERAGE_GAP, method-family, fine-tuning, hybrid, or coverage gap in rationale or required_actions.',
      'Do not choose return_to_candidate, request_searchplan_recheck, reject, park, or merge.',
    ].join(' ');
  }
  return null;
}

function needAdjudicationNegativeProbeExpectation() {
  if (NEED_ADJUDICATION_NEGATIVE_PROBE === 'clean_validate') {
    return {
      status: 'blocked',
      route_outcome: 'blocked',
      final_decision: 'validate',
      error_code: 'GATE_CONSTRAINT_FAILED',
      blocker_codes: ['RESIDUAL_RISK_DROPPED'],
      adjudication_created: false,
    };
  }
  if (NEED_ADJUDICATION_NEGATIVE_PROBE === 'method_gap_drop') {
    return {
      status: 'blocked',
      route_outcome: 'blocked',
      final_decision: 'validate',
      error_code: 'GATE_CONSTRAINT_FAILED',
      blocker_codes: ['METHOD_FAMILY_COVERAGE_GAP_DROPPED'],
      adjudication_created: false,
    };
  }
  return null;
}

async function runGenerateNeedCandidate(runtime, input) {
  assertSupportedDebateSlotFixtures();
  const nodeAttemptId = `node_attempt_generate_need_candidate_${RUN_ID}`;
  const workflowRunId = `workflow_run_generate_need_candidate_${RUN_ID}`;
  const debateLoopId = `debate_loop_generate_need_candidate_${RUN_ID}`;
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
  const debateFixtureInput = {
    debateLoopId,
    titleCardId: input.titleCardId,
    evidenceMapRecords: input.evidenceMapRecords,
    rankedBatch,
  };
  const debateFinalUsesProvider = GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
    && debateExecutionSpec('arbiter.final_synthesis')?.execution_mode === 'provider_llm';
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
    execution_spec: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? null
      : singleAgentExecutionSpec(GENERATE_NEED_CANDIDATE_EXECUTION_MODE, GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID),
    run_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'provider_llm' ? 'product' : 'acceptance',
    executor_kind: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND,
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
    debate_loop_id: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate' ? debateLoopId : null,
    debate_execution_plan: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_EXECUTION_PLAN
      : null,
    debate_slot_execution_overrides: null,
    debate_slot_model_option_overrides: null,
    debate_mocked_outputs: buildDebateMockedOutputs(debateFixtureInput),
    debate_codex_responses: buildDebateCodexResponses(debateFixtureInput),
    mocked_output: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate'
      && GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'mocked_llm'
      ? {
        fixture_id: `v1a_harness_ranked_candidate_batch_${RUN_ID}`,
        output: rankedBatch,
      }
      : null,
    codex_response: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND !== 'multi_agent_debate'
      && GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'codex_assisted'
      ? {
        operator_label: 'codex-v1a-harness-e2e',
        output: rankedBatch,
      }
      : null,
    model_option_id: GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID,
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
      ...(GENERATE_NEED_CANDIDATE_EXECUTION_MODE === 'provider_llm' || debateFinalUsesProvider
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
  try {
    assertScenarioPassed(result, 'generate-need-candidate');
  } catch (error) {
    await writeJson('02-v1a-harness.partial-generate-need-candidate.json', {
      run_id: RUN_ID,
      current_stage: 'harness generate-need-candidate',
      harness_input: harnessInput,
      result,
      error: sanitizeError(error),
    });
    throw error;
  }
  const persisted = result.adapter_result.persist_need_candidate_batch_result?.persisted_candidates ?? [];
  if (persisted.length === 0) {
    throw new Error('generate-need-candidate harness did not persist any NeedCandidate.');
  }
  return {
    result,
    harnessInput,
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
  const openGapCodes = supportPacket.open_gap_codes ?? [];
  const requiredActions = [
    'route result according to deterministic node policy',
    ...(openGapCodes.includes('METHOD_FAMILY_COVERAGE_GAP')
      ? ['carry METHOD_FAMILY_COVERAGE_GAP into v1b intake and require method-family coverage follow-up']
      : []),
  ];
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
    required_actions: requiredActions,
    gap_codes: openGapCodes,
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
  const negativeProbeInstruction = needAdjudicationNegativeProbeInstruction();
  const negativeProbeExpectation = needAdjudicationNegativeProbeExpectation();
  const isNegativeProbe = negativeProbeInstruction !== null && negativeProbeExpectation !== null;
  const harnessInput = {
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
    execution_spec: singleAgentExecutionSpec(NEED_ADJUDICATION_EXECUTION_MODE, NEED_ADJUDICATION_MODEL_OPTION_ID),
    run_mode: isNegativeProbe
      ? 'acceptance'
      : NEED_ADJUDICATION_EXECUTION_MODE === 'provider_llm' ? 'product' : 'acceptance',
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
    model_option_id: NEED_ADJUDICATION_MODEL_OPTION_ID,
    diagnostic_prompt_appendix: negativeProbeInstruction,
    adjudication_actor: { actor_type: 'human', actor_id: 'v1a-harness-reviewer' },
    fixture_human_decision: NEED_ADJUDICATION_EXECUTION_MODE !== 'provider_llm',
    policy_version: 'v1',
    output_schema_version: 'v1',
    expectations: isNegativeProbe ? negativeProbeExpectation : {
      status: 'ready',
      route_outcome: 'advance_to_human_confirmation',
      final_decision: 'validate',
      adjudication_created: true,
    },
    created_by: 'system',
  };
  const result = await runtime.workflowHarness.runValidateNeedAdjudicationScenario(harnessInput);
  assertScenarioPassed(result, 'validate-need-adjudication');
  return { result, harnessInput };
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
  const harnessInput = {
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
    execution_spec: null,
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
  };
  const result = await runtime.workflowHarness.runHumanConfirmNeedScenario(harnessInput);
  assertScenarioPassed(result, 'human-confirm-need');
  return { result, harnessInput };
}

async function runPublishV1bInputBundle(runtime, input) {
  const validatedNeedId = input.humanConfirmResult.node_result.validated_need_ref.ref_id;
  const validatedNeed = await runtime.needValidation.getValidatedNeedById(validatedNeedId);
  assert.ok(validatedNeed, `ValidatedNeed ${validatedNeedId} not found after human confirmation.`);
  const memorySuggestions = await runtime.needValidation.listCandidateMemorySuggestionsByNeedCandidateId(
    input.candidate.need_candidate_id,
  );
  const harnessInput = {
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
  };
  const result = await runtime.workflowHarness.runPublishV1bInputBundleScenario(harnessInput);
  assertScenarioPassed(result, 'publish-v1b-input-bundle');
  return { result, harnessInput };
}

async function replayAuthorityCounts(prisma, titleCardId) {
  const [
    needCandidateCount,
    readinessAssessmentCount,
    supportPacketCount,
    adjudicationResultCount,
    humanDecisionCount,
    validatedNeedCount,
    v1bInputBundleCount,
    artifactRefCount,
  ] = await Promise.all([
    prisma.topicSelectionNeedCandidate.count({ where: { titleCardId } }),
    prisma.topicSelectionNeedCandidateReadinessAssessment.count({ where: { titleCardId } }),
    prisma.topicSelectionValidationDecisionSupportPacket.count({ where: { titleCardId } }),
    prisma.topicSelectionValidateNeedAdjudicationResult.count({ where: { titleCardId } }),
    prisma.topicSelectionHumanConfirmedDecision.count({ where: { titleCardId } }),
    prisma.topicSelectionValidatedNeed.count({ where: { titleCardId } }),
    prisma.topicSelectionV1aToV1bInputBundle.count({ where: { titleCardId } }),
    prisma.topicSelectionArtifactRef.count({ where: { titleCardId } }),
  ]);
  return {
    need_candidate_count: needCandidateCount,
    readiness_assessment_count: readinessAssessmentCount,
    validation_support_packet_count: supportPacketCount,
    adjudication_result_count: adjudicationResultCount,
    human_decision_count: humanDecisionCount,
    validated_need_count: validatedNeedCount,
    v1b_input_bundle_count: v1bInputBundleCount,
    artifact_ref_count: artifactRefCount,
  };
}

function authorityOnlyCounts(counts) {
  const { artifact_ref_count: _artifactRefCount, ...authorityCounts } = counts;
  return authorityCounts;
}

function assertReplayProvenance(label, value) {
  assert.equal(value?.replayed, true, `${label} did not return replay provenance.`);
}

function assertNoCountDrift(label, before, after) {
  assert.deepEqual(after, before, `${label} changed authority counts.`);
}

function sameRefs(left, right) {
  if (
    left && right
    && typeof left === 'object'
    && typeof right === 'object'
    && ('ref_id' in left || 'ref_id' in right)
  ) {
    return refSignature(left) === refSignature(right);
  }
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function refSignature(value) {
  if (!value || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  return [
    value.ref_type ?? '',
    value.ref_id ?? '',
    value.version_id ?? '',
    value.title_card_id ?? '',
  ].join(':');
}

function sameRefSet(left, right) {
  const leftSignatures = (left ?? []).map(refSignature).sort();
  const rightSignatures = (right ?? []).map(refSignature).sort();
  return JSON.stringify(leftSignatures) === JSON.stringify(rightSignatures);
}

function sameStringSet(left, right) {
  const normalize = (values) => (values ?? [])
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .sort();
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function compactReplayResult(label, result, original) {
  if (label === 'generate_need_candidate') {
    const replayRefs = result.adapter_result.persist_need_candidate_batch_result?.persisted_candidate_refs ?? [];
    const originalRefs = original.result.adapter_result.persist_need_candidate_batch_result?.persisted_candidate_refs ?? [];
    assertReplayProvenance(label, result.adapter_result.replay_provenance);
    assert.equal(sameRefSet(replayRefs, originalRefs), true, `${label} replay candidate refs drifted.`);
    return {
      replayed: true,
      scenario_status: result.scenario_status,
      persisted_candidate_ref_count: replayRefs.length,
      same_persisted_candidate_refs: true,
    };
  }
  assertReplayProvenance(label, result.node_result.replay_provenance);
  if (label === 'validate_need_adjudication') {
    assert.equal(
      sameRefs(result.node_result.adjudication_result_ref, original.result.node_result.adjudication_result_ref),
      true,
      `${label} replay adjudication_result_ref drifted.`,
    );
    assert.equal(
      sameRefs(result.node_result.reserved_validated_need_ref, original.result.node_result.reserved_validated_need_ref),
      true,
      `${label} replay reserved_validated_need_ref drifted.`,
    );
  }
  if (label === 'human_confirm_need') {
    assert.equal(
      sameRefs(result.node_result.validated_need_ref, original.result.node_result.validated_need_ref),
      true,
      `${label} replay validated_need_ref drifted.`,
    );
    assert.equal(
      sameRefs(result.node_result.human_decision_ref, original.result.node_result.human_decision_ref),
      true,
      `${label} replay human_decision_ref drifted.`,
    );
  }
  if (label === 'publish_v1b_input_bundle') {
    assert.equal(
      sameRefs(result.node_result.v1b_input_bundle_ref, original.result.node_result.v1b_input_bundle_ref),
      true,
      `${label} replay v1b_input_bundle_ref drifted.`,
    );
  }
  return {
    replayed: true,
    scenario_status: result.scenario_status,
    node_status: result.node_result.status,
    route_outcome: result.node_result.route_outcome ?? null,
    blocker_codes: result.node_result.blocker_codes ?? [],
    warning_codes: result.node_result.warning_codes ?? [],
    source_trace_artifact_ref: result.node_result.replay_provenance.source_trace_artifact_ref,
  };
}

async function expectReplayInputHashMismatch(label, run) {
  try {
    const result = await run();
    const nodeResult = result.node_result ?? null;
    const blockerCodes = nodeResult?.blocker_codes ?? result.adapter_result?.blocker_codes ?? [];
    assert.ok(
      blockerCodes.includes('REPLAY_INPUT_HASH_MISMATCH'),
      `${label} drift did not include REPLAY_INPUT_HASH_MISMATCH: ${JSON.stringify(blockerCodes)}`,
    );
    return {
      mode: 'blocked_result',
      scenario_status: result.scenario_status,
      node_status: nodeResult?.status ?? result.adapter_result?.status ?? null,
      blocker_codes: blockerCodes,
      error_code: nodeResult?.error_code ?? result.adapter_result?.error_code ?? null,
    };
  } catch (error) {
    assert.equal(error?.errorCode, 'VERSION_CONFLICT', `${label} drift threw unexpected error.`);
    assert.deepEqual(error?.details?.blocker_codes, ['REPLAY_INPUT_HASH_MISMATCH']);
    return {
      mode: 'thrown',
      error_code: error.errorCode,
      status_code: error.statusCode ?? null,
      blocker_codes: error.details?.blocker_codes ?? [],
    };
  }
}

async function runN6ToN9ReplaySmoke(input) {
  const {
    runtime,
    prisma,
    harnessLlmGateway,
    titleCardId,
    generateNeedCandidate,
    validateNeed,
    humanConfirmNeed,
    publishV1bInputBundle,
  } = input;

  currentStage = 'harness n6-n9 exact replay smoke';
  const exactCountsBefore = await replayAuthorityCounts(prisma, titleCardId);
  const exactLlmCallsBefore = harnessLlmGateway.callCount;
  const generateReplay = await runtime.workflowHarness.runGenerateNeedCandidateScenario(
    generateNeedCandidate.harnessInput,
  );
  const validateReplay = await runtime.workflowHarness.runValidateNeedAdjudicationScenario(
    validateNeed.harnessInput,
  );
  const humanReplay = await runtime.workflowHarness.runHumanConfirmNeedScenario(
    humanConfirmNeed.harnessInput,
  );
  const publishReplay = await runtime.workflowHarness.runPublishV1bInputBundleScenario(
    publishV1bInputBundle.harnessInput,
  );
  const exactCountsAfter = await replayAuthorityCounts(prisma, titleCardId);
  const exactLlmCallsAfter = harnessLlmGateway.callCount;
  assertNoCountDrift('N6-N9 exact replay', exactCountsBefore, exactCountsAfter);
  assert.equal(
    exactLlmCallsAfter,
    exactLlmCallsBefore,
    'N6-N9 exact replay invoked the harness LLM gateway.',
  );

  currentStage = 'harness n6-n9 replay drift smoke';
  const driftAuthorityCountsBefore = authorityOnlyCounts(await replayAuthorityCounts(prisma, titleCardId));
  const driftLlmCallsBefore = harnessLlmGateway.callCount;
  const drift = {
    generate_need_candidate: await expectReplayInputHashMismatch('generate_need_candidate', () =>
      runtime.workflowHarness.runGenerateNeedCandidateScenario({
        ...generateNeedCandidate.harnessInput,
        policy_version: 'v1-replay-drift',
      })
    ),
    validate_need_adjudication: await expectReplayInputHashMismatch('validate_need_adjudication', () =>
      runtime.workflowHarness.runValidateNeedAdjudicationScenario({
        ...validateNeed.harnessInput,
        policy_version: 'v1-replay-drift',
      })
    ),
    human_confirm_need: await expectReplayInputHashMismatch('human_confirm_need', () =>
      runtime.workflowHarness.runHumanConfirmNeedScenario({
        ...humanConfirmNeed.harnessInput,
        policy_version: 'v1-replay-drift',
      })
    ),
    publish_v1b_input_bundle: await expectReplayInputHashMismatch('publish_v1b_input_bundle', () =>
      runtime.workflowHarness.runPublishV1bInputBundleScenario({
        ...publishV1bInputBundle.harnessInput,
        policy_version: 'v1-replay-drift',
      })
    ),
  };
  const driftCountsAfter = await replayAuthorityCounts(prisma, titleCardId);
  assertNoCountDrift(
    'N6-N9 replay input-hash drift',
    driftAuthorityCountsBefore,
    authorityOnlyCounts(driftCountsAfter),
  );
  assert.equal(
    harnessLlmGateway.callCount,
    driftLlmCallsBefore,
    'N6-N9 replay input-hash drift invoked the harness LLM gateway.',
  );

  return {
    status: 'passed',
    replay_scope: 'N6-N9',
    exact_replay: {
      db_counts_before: exactCountsBefore,
      db_counts_after: exactCountsAfter,
      llm_call_count_before: exactLlmCallsBefore,
      llm_call_count_after: exactLlmCallsAfter,
      nodes: {
        generate_need_candidate: compactReplayResult('generate_need_candidate', generateReplay, generateNeedCandidate),
        validate_need_adjudication: compactReplayResult('validate_need_adjudication', validateReplay, validateNeed),
        human_confirm_need: compactReplayResult('human_confirm_need', humanReplay, humanConfirmNeed),
        publish_v1b_input_bundle: compactReplayResult('publish_v1b_input_bundle', publishReplay, publishV1bInputBundle),
      },
    },
    input_hash_drift: {
      authority_counts_before: driftAuthorityCountsBefore,
      authority_counts_after: authorityOnlyCounts(driftCountsAfter),
      artifact_ref_delta: driftCountsAfter.artifact_ref_count - exactCountsAfter.artifact_ref_count,
      llm_call_count_before: driftLlmCallsBefore,
      llm_call_count_after: harnessLlmGateway.callCount,
      nodes: drift,
    },
  };
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
    debate_status: generateResult.result.adapter_result.debate_result?.status ?? null,
    debate_loop_id: generateResult.result.adapter_result.debate_result?.debate_loop_id ?? null,
    debate_role_invocation_count:
      generateResult.result.adapter_result.debate_result?.role_invocation_results?.length ?? 0,
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

async function runV1aHarness(app, runtime, prisma, harnessLlmGateway, selectedResources, resourceSample) {
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
  if (!sameStringSet(searchRun.node_result.downstream_handoff?.method_family_targets, blueprint.method_family_targets)) {
    throw new Error('record-search-run handoff did not preserve SearchPlan method_family_targets.');
  }

  currentStage = 'harness build-evidence-map';
  const evidenceMapWorkflowRunId = `workflow_run_build_evidence_map_${RUN_ID}`;
  const evidenceMapNodeAttemptId = `node_attempt_build_evidence_map_${RUN_ID}`;
  const evidenceMapProducerKind = {
    none: 'fixture',
    mocked_llm: 'mocked_llm',
    codex_assisted: 'codex_assisted',
    provider_llm: 'provider_llm',
  }[EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE];
  const evidenceMapDraft = buildEvidenceMapExtractionDraft({
    titleCardId,
    selectedResources,
    coverageRowIntents: searchPlan.node_result.coverage_row_intents,
    searchRunHandoff: searchRun.node_result.downstream_handoff,
    searchPlanBlueprint: blueprint,
    evidenceMapMaterializer: runtime.evidenceMapMaterializer,
    producerKind: evidenceMapProducerKind,
  });
  const evidenceMapExtractionContext = EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'none'
    ? null
    : buildEvidenceMapExtractionContextPacket({
        titleCardId,
        selectedResources,
        searchRunHandoff: searchRun.node_result.downstream_handoff,
        evidenceMapMaterializer: runtime.evidenceMapMaterializer,
        executionMode: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
        workflowRunId: evidenceMapWorkflowRunId,
        nodeAttemptId: evidenceMapNodeAttemptId,
      });
  const evidenceMap = await runtime.workflowHarness.runBuildEvidenceMapScenario({
    scenario_id: SCENARIO_ID,
    scenario_case_id: `v1a-harness-build-evidence-map-${RUN_ID}`,
    title_card_id: titleCardId,
    workflow_run_id: evidenceMapWorkflowRunId,
    node_attempt_id: evidenceMapNodeAttemptId,
    search_run_handoff: searchRun.node_result.downstream_handoff,
    extraction_draft: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'none' ? evidenceMapDraft : null,
    extraction_context_packet: evidenceMapExtractionContext,
    execution_mode: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
    execution_spec: singleAgentExecutionSpec(
      EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
      EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID,
    ),
    run_mode: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'provider_llm' ? 'product' : 'acceptance',
    profile_id: TOPIC_SELECTION_EVIDENCE_MAP_EXTRACTION_SINGLE_AGENT_PROFILE_ID,
    model_option_id: EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID,
    mocked_output: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'mocked_llm'
      ? {
          fixture_id: `fixture_evidence_map_extraction_${RUN_ID}`,
          output: evidenceMapDraft,
        }
      : null,
    codex_response: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'codex_assisted'
      ? {
          output: evidenceMapDraft,
          operator_label: 'v1a-harness-codex-assisted-evidence-extraction',
          response_source: 'operator_supplied',
        }
      : null,
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
  if (EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE !== 'none') {
    if (evidenceMap.node_result.agent_invocation_status !== 'succeeded') {
      throw new Error(`EvidenceMap extraction agent did not succeed: ${evidenceMap.node_result.error_code}`);
    }
  }
  if (EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE === 'provider_llm') {
    const evidenceExtractionCalls = harnessLlmGateway.snapshot().calls.filter((call) =>
      call.stage === 'harness build-evidence-map'
      && call.schema_name === 'TopicSelectionEvidenceMapExtractionDraft@v1',
    );
    if (evidenceExtractionCalls.length !== 1) {
      throw new Error(`Expected exactly one provider-backed EvidenceMap extraction call, got ${evidenceExtractionCalls.length}.`);
    }
  }

  currentStage = 'harness generate-need-candidate';
  const generateNeedCandidate = await runGenerateNeedCandidate(runtime, {
    titleCardId,
    selectedResources,
    resourceSampleSetId: resourceSample.sample_set.resource_sample_set_id,
    evidenceMapRecords: evidenceMap.node_result.evidence_map_records,
    evidenceMapHandoff: evidenceMap.node_result.downstream_handoff,
    searchRunHandoff: searchRun.node_result.downstream_handoff,
    searchPlanBlueprint: blueprint,
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

  if (NEED_ADJUDICATION_NEGATIVE_PROBE) {
    return {
      title_card_id: titleCardId,
      topic_seed_id: topicSeed.node_result.topic_seed_ref.ref_id,
      literature_resource_pool_snapshot_id: snapshot.node_result.literature_resource_pool_snapshot_ref.ref_id,
      search_plan_id: searchPlan.node_result.search_plan_ref.ref_id,
      search_run_id: searchRun.node_result.search_run_ref.ref_id,
      evidence_map_id: evidenceMap.node_result.evidence_map_ref.ref_id,
      need_candidate_id: candidate.need_candidate_id,
      validated_need_id: null,
      v1b_input_bundle_id: null,
      replay_smoke: null,
      nodes: {
        create_topic_seed: compactNode(topicSeed),
        snapshot_literature_resource_pool: compactNode(snapshot),
        create_search_plan: compactNode(searchPlan),
        record_search_run: compactNode(searchRun),
        build_evidence_map: compactNode(evidenceMap),
        generate_need_candidate: compactGenerateNode(generateNeedCandidate),
        validate_need_adjudication: compactNode(validateNeed.result),
        human_confirm_need: null,
        publish_v1b_input_bundle: null,
      },
      full_results: {
        create_topic_seed: topicSeed,
        snapshot_literature_resource_pool: snapshot,
        create_search_plan: searchPlan,
        record_search_run: searchRun,
        build_evidence_map: evidenceMap,
        generate_need_candidate: generateNeedCandidate.result,
        validate_need_adjudication: validateNeed.result,
        human_confirm_need: null,
        publish_v1b_input_bundle: null,
      },
    };
  }

  currentStage = 'harness human-confirm-need';
  const humanConfirmNeed = await runHumanConfirmNeed(runtime, {
    titleCardId,
    candidate,
    supportPacket: validationInputs.supportPacket,
    validateResult: validateNeed.result,
  });

  currentStage = 'harness publish-v1b-input-bundle';
  const publishV1bInputBundle = await runPublishV1bInputBundle(runtime, {
    titleCardId,
    candidate,
    humanConfirmResult: humanConfirmNeed.result,
  });

  const replaySmoke = RUN_REPLAY_SMOKE
    ? await runN6ToN9ReplaySmoke({
      runtime,
      prisma,
      harnessLlmGateway,
      titleCardId,
      generateNeedCandidate,
      validateNeed,
      humanConfirmNeed,
      publishV1bInputBundle,
    })
    : null;

  return {
    title_card_id: titleCardId,
    topic_seed_id: topicSeed.node_result.topic_seed_ref.ref_id,
    literature_resource_pool_snapshot_id: snapshot.node_result.literature_resource_pool_snapshot_ref.ref_id,
    search_plan_id: searchPlan.node_result.search_plan_ref.ref_id,
    search_run_id: searchRun.node_result.search_run_ref.ref_id,
    evidence_map_id: evidenceMap.node_result.evidence_map_ref.ref_id,
    need_candidate_id: candidate.need_candidate_id,
    validated_need_id: humanConfirmNeed.result.node_result.validated_need_ref.ref_id,
    v1b_input_bundle_id: publishV1bInputBundle.result.node_result.v1b_input_bundle_ref.ref_id,
    replay_smoke: replaySmoke,
    nodes: {
      create_topic_seed: compactNode(topicSeed),
      snapshot_literature_resource_pool: compactNode(snapshot),
      create_search_plan: compactNode(searchPlan),
      record_search_run: compactNode(searchRun),
      build_evidence_map: compactNode(evidenceMap),
      generate_need_candidate: compactGenerateNode(generateNeedCandidate),
      validate_need_adjudication: compactNode(validateNeed.result),
      human_confirm_need: compactNode(humanConfirmNeed.result),
      publish_v1b_input_bundle: compactNode(publishV1bInputBundle.result),
    },
    full_results: {
      create_topic_seed: topicSeed,
      snapshot_literature_resource_pool: snapshot,
      create_search_plan: searchPlan,
      record_search_run: searchRun,
      build_evidence_map: evidenceMap,
      generate_need_candidate: generateNeedCandidate.result,
      validate_need_adjudication: validateNeed.result,
      human_confirm_need: humanConfirmNeed.result,
      publish_v1b_input_bundle: publishV1bInputBundle.result,
    },
  };
}

await fs.mkdir(ARTIFACT_DIR, { recursive: true });

const prisma = new PrismaClient();
let app;
let harnessLlmGateway;

try {
  harnessLlmGateway = new CountingLlmGateway(makeHarnessLlmGateway());
  const runtime = makeWorkflowHarness(prisma, harnessLlmGateway);
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

  const v1aHarness = await runV1aHarness(app, runtime, prisma, harnessLlmGateway, selectedResources, resourceSample);
  await writeJson('02-v1a-harness.json', v1aHarness);
  if (v1aHarness.replay_smoke) {
    await writeJson('03-v1a-replay-smoke.json', v1aHarness.replay_smoke);
  }

  const summary = {
    status: 'passed',
    scenario_id: SCENARIO_ID,
    scenario_type: SCENARIO_TYPE,
    run_id: RUN_ID,
    artifact_dir: ARTIFACT_DIR,
    topic_id: TOPIC_ID,
    provider_id: PROVIDER_ID,
    model_id: MODEL_ID,
    resource_sampling_mode: USE_MOCK_RESOURCE_SAMPLING ? 'deterministic_mock' : 'provider',
    harness_agent_execution_mode: DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
    harness_evidence_extraction_execution_mode: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
    harness_evidence_extraction_model_option_id: EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID,
    harness_evidence_extraction_execution_spec: singleAgentExecutionSpec(
      EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
      EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID,
    ),
    harness_generate_execution_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
    harness_generate_executor_kind: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND,
    harness_generate_model_option_id: GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID,
    harness_generate_execution_spec: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? null
      : singleAgentExecutionSpec(GENERATE_NEED_CANDIDATE_EXECUTION_MODE, GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID),
    replay_smoke_enabled: RUN_REPLAY_SMOKE,
    debate_slot_execution_modes: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_SLOT_EXECUTION_MODES
      : null,
    debate_slot_model_option_overrides: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_SLOT_MODEL_OPTION_OVERRIDES
      : null,
    debate_execution_profile: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_EXECUTION_PROFILE
      : null,
    debate_execution_plan: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_EXECUTION_PLAN
      : null,
    harness_adjudication_execution_mode: NEED_ADJUDICATION_EXECUTION_MODE,
    harness_adjudication_model_option_id: NEED_ADJUDICATION_MODEL_OPTION_ID,
    harness_adjudication_execution_spec: singleAgentExecutionSpec(
      NEED_ADJUDICATION_EXECUTION_MODE,
      NEED_ADJUDICATION_MODEL_OPTION_ID,
    ),
    harness_adjudication_negative_probe: NEED_ADJUDICATION_NEGATIVE_PROBE,
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
    replay_smoke: v1aHarness.replay_smoke,
    harness_llm_gateway: harnessLlmGateway.snapshot(),
    nodes: v1aHarness.nodes,
  };
  await writeJson('90-summary.json', summary);
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  const failure = {
    status: 'failed',
    scenario_id: SCENARIO_ID,
    scenario_type: SCENARIO_TYPE,
    run_id: RUN_ID,
    artifact_dir: ARTIFACT_DIR,
    topic_id: TOPIC_ID,
    current_stage: currentStage,
    provider_id: PROVIDER_ID,
    model_id: MODEL_ID,
    harness_agent_execution_mode: DEFAULT_HARNESS_AGENT_EXECUTION_MODE,
    harness_evidence_extraction_execution_mode: EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
    harness_evidence_extraction_model_option_id: EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID,
    harness_evidence_extraction_execution_spec: singleAgentExecutionSpec(
      EVIDENCE_MAP_EXTRACTION_EXECUTION_MODE,
      EVIDENCE_MAP_EXTRACTION_MODEL_OPTION_ID,
    ),
    harness_generate_execution_mode: GENERATE_NEED_CANDIDATE_EXECUTION_MODE,
    harness_generate_executor_kind: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND,
    harness_generate_model_option_id: GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID,
    harness_generate_execution_spec: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? null
      : singleAgentExecutionSpec(GENERATE_NEED_CANDIDATE_EXECUTION_MODE, GENERATE_NEED_CANDIDATE_MODEL_OPTION_ID),
    replay_smoke_enabled: RUN_REPLAY_SMOKE,
    debate_slot_execution_modes: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_SLOT_EXECUTION_MODES
      : null,
    debate_slot_model_option_overrides: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_SLOT_MODEL_OPTION_OVERRIDES
      : null,
    debate_execution_profile: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_EXECUTION_PROFILE
      : null,
    debate_execution_plan: GENERATE_NEED_CANDIDATE_EXECUTOR_KIND === 'multi_agent_debate'
      ? DEBATE_EXECUTION_PLAN
      : null,
    harness_adjudication_execution_mode: NEED_ADJUDICATION_EXECUTION_MODE,
    harness_adjudication_model_option_id: NEED_ADJUDICATION_MODEL_OPTION_ID,
    harness_adjudication_execution_spec: singleAgentExecutionSpec(
      NEED_ADJUDICATION_EXECUTION_MODE,
      NEED_ADJUDICATION_MODEL_OPTION_ID,
    ),
    harness_adjudication_negative_probe: NEED_ADJUDICATION_NEGATIVE_PROBE,
    harness_llm_gateway: harnessLlmGateway?.snapshot?.() ?? null,
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
