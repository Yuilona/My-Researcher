#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const RUN_ID = process.env.TOPIC_SELECTION_MULTI_SAMPLE_RUN_ID
  ?? uniqueId('topic-selection-multisample-provider');
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-multisample-provider-batch', RUN_ID);
const SAMPLE_SET_IDS = csv(
  process.env.TOPIC_SELECTION_MULTI_SAMPLE_RESOURCE_SAMPLE_SET_IDS
    ?? process.env.TOPIC_SELECTION_REAL_BATCH_SAMPLE_SET_IDS,
);
const SAMPLE_LIMIT = positiveInt(process.env.TOPIC_SELECTION_MULTI_SAMPLE_LIMIT, 3);
const PROVIDER_ID = providerId(
  process.env.TOPIC_SELECTION_MULTI_SAMPLE_PROVIDER_ID
    ?? process.env.TOPIC_SELECTION_REAL_PROVIDER_ID,
);
const MODEL_ID = process.env.TOPIC_SELECTION_MULTI_SAMPLE_MODEL_ID
  ?? process.env.TOPIC_SELECTION_REAL_MODEL_ID
  ?? 'gpt-5.5';
const LLM_TIMEOUT_MS = String(positiveInt(
  process.env.TOPIC_SELECTION_MULTI_SAMPLE_LLM_TIMEOUT_MS
    ?? process.env.TOPIC_SELECTION_REAL_LLM_TIMEOUT_MS,
  240_000,
));
const LLM_MAX_RETRIES = String(positiveInt(
  process.env.TOPIC_SELECTION_MULTI_SAMPLE_LLM_MAX_RETRIES
    ?? process.env.TOPIC_SELECTION_REAL_LLM_MAX_RETRIES,
  3,
));
const V1A_EXECUTION_MODE = executionMode(process.env.TOPIC_SELECTION_MULTI_SAMPLE_V1A_EXECUTION_MODE, 'codex_assisted');
const V1A_EVIDENCE_MODE = evidenceMode(process.env.TOPIC_SELECTION_MULTI_SAMPLE_V1A_EVIDENCE_MODE, V1A_EXECUTION_MODE);
const V1A_ADJUDICATION_MODE = executionMode(
  process.env.TOPIC_SELECTION_MULTI_SAMPLE_V1A_ADJUDICATION_MODE,
  V1A_EXECUTION_MODE,
);
const V1B_SEMANTIC_MODE = v1bSemanticMode(process.env.TOPIC_SELECTION_MULTI_SAMPLE_V1B_SEMANTIC_MODE, 'provider_llm');
const STOP_ON_FAILURE = process.env.TOPIC_SELECTION_MULTI_SAMPLE_STOP_ON_FAILURE !== '0';

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function csv(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function positiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function providerId(raw) {
  const value = String(raw ?? 'openai').trim();
  if (value === 'openai' || value === 'dashscope') {
    return value;
  }
  throw new Error(`Unsupported multi-sample provider: ${value}. Use openai or dashscope.`);
}

function executionMode(raw, fallback) {
  const value = String(raw ?? fallback).trim();
  if (value === 'mocked_llm' || value === 'codex_assisted' || value === 'provider_llm') {
    return value;
  }
  throw new Error(`Unsupported v1a execution mode: ${value}.`);
}

function evidenceMode(raw, fallback) {
  const value = String(raw ?? fallback).trim();
  if (value === 'none' || value === 'mocked_llm' || value === 'codex_assisted' || value === 'provider_llm') {
    return value;
  }
  throw new Error(`Unsupported v1a evidence mode: ${value}.`);
}

function v1bSemanticMode(raw, fallback) {
  const value = String(raw ?? fallback).trim();
  if (value === 'fixture' || value === 'provider_llm') {
    return value;
  }
  throw new Error(`Unsupported v1b semantic mode: ${value}.`);
}

function generateExecutorKind(mode) {
  return mode === 'codex_assisted' ? 'codex_assisted' : 'single_agent';
}

async function discoverSampleSets(prisma) {
  if (SAMPLE_SET_IDS.length > 0) {
    const rows = await prisma.topicSelectionResourceSampleSet.findMany({
      where: { id: { in: SAMPLE_SET_IDS } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        topicId: true,
        status: true,
        sampleSize: true,
        roleCounts: true,
        sampleHash: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return SAMPLE_SET_IDS.map((id) => {
      const row = byId.get(id);
      if (!row) {
        throw new Error(`Resource sample set not found: ${id}`);
      }
      return row;
    });
  }

  return prisma.topicSelectionResourceSampleSet.findMany({
    where: {
      status: { in: ['ready', 'ready_with_warning'] },
      sampleSize: { gt: 0 },
    },
    orderBy: { createdAt: 'desc' },
    take: SAMPLE_LIMIT,
    select: {
      id: true,
      topicId: true,
      status: true,
      sampleSize: true,
      roleCounts: true,
      sampleHash: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

async function runNodeScript(input) {
  const stdoutChunks = [];
  const stderrChunks = [];
  const child = spawn(process.execPath, [
    '--env-file=.env.local',
    '--loader',
    './apps/backend/node_modules/ts-node/esm.mjs',
    input.script,
  ], {
    cwd: REPO_ROOT,
    env: input.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => stdoutChunks.push(Buffer.from(chunk)));
  child.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  const stdout = Buffer.concat(stdoutChunks).toString('utf8');
  const stderr = Buffer.concat(stderrChunks).toString('utf8');
  await fs.writeFile(input.stdoutPath, stdout, 'utf8');
  await fs.writeFile(input.stderrPath, stderr, 'utf8');
  return { exitCode, stdout, stderr };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function compactV1bSummary(summary) {
  const run = summary?.runs?.[0] ?? null;
  return {
    status: summary?.status ?? null,
    run_id: summary?.run_id ?? null,
    provider_id: summary?.provider_id ?? null,
    semantic_mode: summary?.semantic_mode ?? null,
    title_card_id: run?.title_card_id ?? null,
    v1b_input_bundle_id: run?.v1b_input_bundle_id ?? null,
    candidate_count: run?.candidate_count ?? null,
    value_assessment_count: run?.value_assessment_count ?? null,
    n11_route_decision: run?.nodes?.n11?.route_decision ?? null,
    semantic_artifacts: (run?.semantic_artifacts ?? []).map((artifact) => ({
      slot_id: artifact.slot_id,
      provider_id: artifact.provider_id ?? null,
      model_id: artifact.model_id ?? null,
      output_hash: artifact.output_hash ?? null,
      telemetry: artifact.telemetry ?? null,
      normalization_repairs: artifact.normalization_repairs ?? [],
    })),
  };
}

function childBaseEnv() {
  return {
    ...process.env,
    TOPIC_SELECTION_REAL_PROVIDER_ID: PROVIDER_ID,
    TOPIC_SELECTION_REAL_MODEL_ID: MODEL_ID,
    TOPIC_SELECTION_REAL_LLM_TIMEOUT_MS: LLM_TIMEOUT_MS,
    TOPIC_SELECTION_REAL_LLM_MAX_RETRIES: LLM_MAX_RETRIES,
  };
}

async function runSample(sample, index) {
  const sampleSlug = `sample${index + 1}`;
  const sampleDir = path.join(ARTIFACT_DIR, sampleSlug);
  await fs.mkdir(sampleDir, { recursive: true });

  const v1aRunId = `${RUN_ID}-${sampleSlug}-v1a`;
  const v1aEnv = {
    ...childBaseEnv(),
    TOPIC_SELECTION_REAL_RUN_ID: v1aRunId,
    TOPIC_SELECTION_V1A_HARNESS_RUN_ID: v1aRunId,
    TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID: sample.id,
    TOPIC_SELECTION_REAL_FLOW_MOCK_LLM: '1',
    TOPIC_SELECTION_V1A_HARNESS_AGENT_EXECUTION_MODE: V1A_EXECUTION_MODE,
    TOPIC_SELECTION_V1A_HARNESS_EVIDENCE_EXTRACTION_EXECUTION_MODE: V1A_EVIDENCE_MODE,
    TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTION_MODE: V1A_EXECUTION_MODE,
    TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTOR_KIND: generateExecutorKind(V1A_EXECUTION_MODE),
    TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_EXECUTION_MODE: V1A_ADJUDICATION_MODE,
  };
  console.error(`[multi-sample] ${sampleSlug}: running v1a harness for ${sample.id}`);
  const v1aProcess = await runNodeScript({
    script: '.ai/scripts/topic-selection-v1a-harness-e2e.mjs',
    env: v1aEnv,
    stdoutPath: path.join(sampleDir, 'v1a.stdout.log'),
    stderrPath: path.join(sampleDir, 'v1a.stderr.log'),
  });
  const v1aSummaryPath = path.join(
    REPO_ROOT,
    '.ai/.tmp/topic-selection-v1a-harness-e2e',
    v1aRunId,
    '90-summary.json',
  );
  const v1aSummary = await readJsonIfExists(v1aSummaryPath);
  if (v1aProcess.exitCode !== 0 || v1aSummary?.status !== 'passed') {
    return {
      status: 'failed',
      failed_stage: 'v1a',
      sample_set: sample,
      v1a_exit_code: v1aProcess.exitCode,
      v1a_summary_path: path.relative(REPO_ROOT, v1aSummaryPath),
      v1a_summary: v1aSummary,
    };
  }

  const v1bInputBundleId = v1aSummary.v1b_input_bundle_id;
  if (!v1bInputBundleId) {
    throw new Error(`v1a run ${v1aRunId} did not publish a v1b input bundle.`);
  }

  const v1bRunId = `${RUN_ID}-${sampleSlug}-v1b`;
  const v1bEnv = {
    ...childBaseEnv(),
    TOPIC_SELECTION_V1B_HARNESS_RUN_ID: v1bRunId,
    TOPIC_SELECTION_V1B_HARNESS_INPUT_BUNDLE_ID: v1bInputBundleId,
    TOPIC_SELECTION_V1B_HARNESS_SEMANTIC_MODE: V1B_SEMANTIC_MODE,
    TOPIC_SELECTION_V1B_HARNESS_PROVIDER_ID: PROVIDER_ID,
    TOPIC_SELECTION_V1B_HARNESS_LLM_TIMEOUT_MS: LLM_TIMEOUT_MS,
    TOPIC_SELECTION_V1B_HARNESS_LLM_MAX_RETRIES: LLM_MAX_RETRIES,
  };
  console.error(`[multi-sample] ${sampleSlug}: running v1b harness for bundle ${v1bInputBundleId}`);
  const v1bProcess = await runNodeScript({
    script: '.ai/scripts/topic-selection-v1b-harness-e2e.mjs',
    env: v1bEnv,
    stdoutPath: path.join(sampleDir, 'v1b.stdout.log'),
    stderrPath: path.join(sampleDir, 'v1b.stderr.log'),
  });
  const v1bSummaryPath = path.join(
    REPO_ROOT,
    '.ai/.tmp/topic-selection-v1b-harness-e2e',
    v1bRunId,
    'result.json',
  );
  const v1bSummary = await readJsonIfExists(v1bSummaryPath);
  if (v1bProcess.exitCode !== 0 || v1bSummary?.status !== 'passed') {
    return {
      status: 'failed',
      failed_stage: 'v1b',
      sample_set: sample,
      v1a_summary_path: path.relative(REPO_ROOT, v1aSummaryPath),
      v1b_exit_code: v1bProcess.exitCode,
      v1b_summary_path: path.relative(REPO_ROOT, v1bSummaryPath),
      v1a_summary: {
        run_id: v1aSummary.run_id,
        v1b_input_bundle_id: v1bInputBundleId,
        harness_generate_execution_mode: v1aSummary.harness_generate_execution_mode,
      },
      v1b_summary: v1bSummary,
    };
  }

  return {
    status: 'passed',
    sample_set: {
      id: sample.id,
      topic_id: sample.topicId,
      status: sample.status,
      sample_size: sample.sampleSize,
      item_count: sample._count.items,
      sample_hash: sample.sampleHash,
      role_counts: sample.roleCounts,
      created_at: sample.createdAt.toISOString(),
    },
    v1a_summary_path: path.relative(REPO_ROOT, v1aSummaryPath),
    v1b_summary_path: path.relative(REPO_ROOT, v1bSummaryPath),
    v1a: {
      run_id: v1aSummary.run_id,
      title_card_id: v1aSummary.title_card_id,
      v1b_input_bundle_id: v1bInputBundleId,
      harness_evidence_extraction_execution_mode: v1aSummary.harness_evidence_extraction_execution_mode,
      harness_generate_execution_mode: v1aSummary.harness_generate_execution_mode,
      harness_adjudication_execution_mode: v1aSummary.harness_adjudication_execution_mode,
      harness_llm_gateway: v1aSummary.harness_llm_gateway,
    },
    v1b: compactV1bSummary(v1bSummary),
  };
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const prisma = new PrismaClient();
  const startedAt = new Date().toISOString();
  const results = [];
  try {
    const samples = await discoverSampleSets(prisma);
    if (samples.length === 0) {
      throw new Error('No resource sample sets available for multi-sample provider batch.');
    }
    await fs.writeFile(
      path.join(ARTIFACT_DIR, '00-sample-sets.json'),
      `${JSON.stringify(samples, null, 2)}\n`,
      'utf8',
    );

    for (const [index, sample] of samples.entries()) {
      const result = await runSample(sample, index);
      results.push(result);
      await fs.writeFile(
        path.join(ARTIFACT_DIR, `sample-${index + 1}-summary.json`),
        `${JSON.stringify(result, null, 2)}\n`,
        'utf8',
      );
      if (result.status !== 'passed' && STOP_ON_FAILURE) {
        break;
      }
    }

    const failed = results.filter((result) => result.status !== 'passed');
    const summary = {
      status: failed.length === 0 ? 'passed' : 'failed',
      run_id: RUN_ID,
      artifact_dir: path.relative(REPO_ROOT, ARTIFACT_DIR),
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      provider_id: PROVIDER_ID,
      model_id: MODEL_ID,
      v1a_execution_mode: V1A_EXECUTION_MODE,
      v1a_evidence_mode: V1A_EVIDENCE_MODE,
      v1a_adjudication_mode: V1A_ADJUDICATION_MODE,
      v1b_semantic_mode: V1B_SEMANTIC_MODE,
      sample_count: results.length,
      failed_count: failed.length,
      stop_on_failure: STOP_ON_FAILURE,
      results,
    };
    await fs.writeFile(path.join(ARTIFACT_DIR, 'result.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(summary, null, 2));
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    const failure = {
      status: 'failed',
      run_id: RUN_ID,
      artifact_dir: path.relative(REPO_ROOT, ARTIFACT_DIR),
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      provider_id: PROVIDER_ID,
      model_id: MODEL_ID,
      error: {
        name: error?.name ?? 'Error',
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
      },
      results,
    };
    await fs.writeFile(path.join(ARTIFACT_DIR, 'result.json'), `${JSON.stringify(failure, null, 2)}\n`, 'utf8');
    console.error(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
