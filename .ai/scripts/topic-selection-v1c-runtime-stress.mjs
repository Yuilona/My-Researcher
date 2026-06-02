#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const STARTED_AT = new Date();
const RUN_ID = optionalString(process.env.TOPIC_SELECTION_V1C_RUNTIME_STRESS_RUN_ID)
  ?? `t112-v1c-runtime-stress-${Date.now()}`;
const ITERATIONS = positiveInt(process.env.TOPIC_SELECTION_V1C_RUNTIME_STRESS_ITERATIONS, 1);
const CHILD_TIMEOUT_MS = positiveInt(process.env.TOPIC_SELECTION_V1C_RUNTIME_STRESS_CHILD_TIMEOUT_MS, 900000);
const INCLUDE_HARNESS_ACCEPTANCE = boolEnv(
  process.env.TOPIC_SELECTION_V1C_RUNTIME_STRESS_INCLUDE_HARNESS_ACCEPTANCE,
  true,
);
const INCLUDE_PROVIDER_CANARY = boolEnv(
  process.env.TOPIC_SELECTION_V1C_RUNTIME_STRESS_INCLUDE_PROVIDER_CANARY,
  true,
);
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1c-runtime-stress', RUN_ID);

const N2_SLOT_IDS = [
  'n2_bounded_micro_debate.promotion_supporter_draft',
  'n2_bounded_micro_debate.reviewer_critic_review',
  'n2_bounded_micro_debate.promotion_supporter_repair',
  'n2_bounded_micro_debate.synthesizer_final',
];
const N4_SLOT_IDS = ['n4_delegated_promotion_decision_candidate'];
const N6_SLOT_IDS = ['downstream_feedback_normalization'];

function optionalString(value) {
  const normalized = value?.trim();
  return normalized || null;
}

function positiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolEnv(raw, fallback) {
  if (raw == null || String(raw).trim() === '') return fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`Invalid boolean env value: ${raw}`);
}

function commandText(command, args) {
  return [command, ...args].join(' ');
}

function sanitizedEnv(env) {
  return Object.fromEntries(
    Object.entries(env).filter(([key]) => (
      key.startsWith('TOPIC_SELECTION_')
      || key === 'TITLE_CARD_REPOSITORY'
      || key === 'RESEARCH_LIFECYCLE_REPOSITORY'
      || key === 'BACKEND_TEST_PRESERVE_REAL_ENV'
      || key.startsWith('T112_')
      || key === 'TS_NODE_PROJECT'
    )),
  );
}

function groupBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    const value = row[key] ?? 'null';
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return null;
    throw error;
  }
}

function assertPromptPacketIndexModelMetadataOnly(prisma) {
  const fields = prisma._runtimeDataModel?.models?.TopicSelectionPromptPacketCacheIndex?.fields
    ?.map((field) => field.name);
  assert.ok(Array.isArray(fields), 'Expected Prisma runtime model metadata for TopicSelectionPromptPacketCacheIndex.');
  assert.ok(fields.includes('promptPacketHash'), 'Prompt packet index model metadata is incomplete.');
  for (const forbiddenField of [
    'messages',
    'promptPayload',
    'providerResponse',
    'providerResponsePayload',
    'providerTelemetry',
    'providerTelemetryPayload',
    'rawProviderLogs',
    'authorityPayload',
    'secret',
  ]) {
    assert.equal(fields.includes(forbiddenField), false, `Prompt packet index must not persist ${forbiddenField}.`);
  }
}

async function promptPacketIndexSnapshot(prisma, since = null) {
  const rows = await prisma.topicSelectionPromptPacketCacheIndex.findMany({
    where: since ? { createdAt: { gte: since } } : undefined,
    select: {
      promptPacketHash: true,
      invocationSlotId: true,
      promptTemplateId: true,
      promptTemplateVersion: true,
      promptVariantKey: true,
      contextPolicyProfileId: true,
      outputContract: true,
      modelOptionId: true,
      compressionReportHash: true,
      compressedContextHash: true,
      qualityDecision: true,
      freshnessStatus: true,
      provenanceRef: true,
      redactedPromptArtifactRef: true,
      promptQualityReportRef: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return {
    total_count: rows.length,
    by_invocation_slot_id: groupBy(rows, 'invocationSlotId'),
    by_quality_decision: groupBy(rows, 'qualityDecision'),
    by_freshness_status: groupBy(rows, 'freshnessStatus'),
    sample_rows: rows.slice(0, 20).map((row) => ({
      prompt_packet_hash: row.promptPacketHash,
      invocation_slot_id: row.invocationSlotId,
      prompt_template_id: row.promptTemplateId,
      prompt_template_version: row.promptTemplateVersion,
      prompt_variant_key: row.promptVariantKey,
      context_policy_profile_id: row.contextPolicyProfileId,
      output_contract: row.outputContract,
      model_option_id: row.modelOptionId,
      compression_report_hash: row.compressionReportHash,
      compressed_context_hash: row.compressedContextHash,
      quality_decision: row.qualityDecision,
      freshness_status: row.freshnessStatus,
      has_provenance_ref: Boolean(row.provenanceRef),
      has_redacted_prompt_artifact_ref: Boolean(row.redactedPromptArtifactRef),
      has_prompt_quality_report_ref: Boolean(row.promptQualityReportRef),
      created_at: row.createdAt.toISOString(),
    })),
  };
}

function rowSlotCounts(manifest) {
  return groupBy(manifest.prompt_index?.rows_after_first ?? [], 'invocation_slot_id');
}

function assertExpectedSlots(slotCounts, expectedSlots, label) {
  for (const slotId of expectedSlots) {
    assert.ok((slotCounts[slotId] ?? 0) >= 1, `${label} missing prompt-index row for ${slotId}.`);
  }
}

function assertN2Manifest(manifest) {
  assert.equal(manifest?.status, 'pass', 'N2 runtime smoke status.');
  assert.equal(manifest.n2_runtime?.role_count, 4, 'N2 runtime role count.');
  assert.equal(manifest.n2_runtime?.runtime_provenance_class, 'runtime_verified');
  assertExpectedSlots(rowSlotCounts(manifest), N2_SLOT_IDS, manifest.run_id);
  assert.equal(manifest.replay?.support_id_stable, true, 'N2 support replay id stability.');
  assert.equal(manifest.replay?.gate_id_stable, true, 'N2 gate replay id stability.');
  assert.equal(manifest.replay?.prompt_index_row_count_stable, true, 'N2 prompt-index replay stability.');
  assert.equal(manifest.prompt_index?.prompt_cache_replay?.redacted_prompt_artifact_ref_reused, true);
  assert.equal(manifest.prompt_index?.prompt_cache_replay?.prompt_quality_report_ref_reused, true);
  assert.equal(manifest.drift?.blocked, true, 'N2 prompt drift must block.');
  assert.equal(manifest.drift?.blocker_code, 'N2_BOUNDED_DEBATE_ARTIFACT_PROMPT_DRIFT');
  assert.equal(manifest.no_n3_bypass?.gate_before_explicit_n3, true, 'N2 must not create N3 before explicit gate.');
}

function assertN6Manifest(manifest) {
  assert.equal(manifest?.status, 'pass', 'N6 runtime smoke status.');
  assert.equal(manifest.n6_runtime?.slot_id, 'downstream_feedback_normalization');
  assert.equal(manifest.n6_runtime?.runtime_provenance_class, 'runtime_verified');
  assertExpectedSlots(rowSlotCounts(manifest), N6_SLOT_IDS, manifest.run_id);
  assert.equal(manifest.replay?.feedback_id_stable, true, 'N6 feedback replay id stability.');
  assert.equal(manifest.replay?.prompt_index_row_count_stable, true, 'N6 prompt-index replay stability.');
  assert.equal(manifest.prompt_index?.prompt_cache_replay?.redacted_prompt_artifact_ref_reused, true);
  assert.equal(manifest.prompt_index?.prompt_cache_replay?.prompt_quality_report_ref_reused, true);
  assert.equal(manifest.drift?.blocked, true, 'N6 prompt drift must block.');
  assert.equal(manifest.drift?.blocker_code, 'N6_FEEDBACK_NORMALIZATION_ARTIFACT_PROMPT_DRIFT');
  for (const [key, value] of Object.entries(manifest.no_side_effect_bypass?.upstream_counts_unchanged ?? {})) {
    assert.equal(value, 0, `N6 no-side-effect bypass changed upstream ${key}.`);
  }
  assert.equal(manifest.no_side_effect_bypass?.downstream_feedback_row_count, 1);
  assert.equal(manifest.no_side_effect_bypass?.recheck_sink_calls, 1);
}

function assertN4Manifest(manifest) {
  assert.equal(manifest?.status, 'pass', 'N4 runtime smoke status.');
  assert.equal(manifest.n4_runtime?.slot_id, 'n4_delegated_promotion_decision_candidate');
  assert.equal(manifest.n4_runtime?.runtime_provenance_class, 'runtime_verified');
  assertExpectedSlots(rowSlotCounts(manifest), N4_SLOT_IDS, manifest.run_id);
  assert.equal(manifest.replay?.human_decision_id_stable, true, 'N4 human decision replay id stability.');
  assert.equal(manifest.replay?.bridge_id_stable, true, 'N4 explicit N5 bridge replay id stability.');
  assert.equal(manifest.replay?.prompt_index_row_count_stable, true, 'N4 prompt-index replay stability.');
  assert.equal(manifest.prompt_index?.prompt_cache_replay?.redacted_prompt_artifact_ref_reused, true);
  assert.equal(manifest.prompt_index?.prompt_cache_replay?.prompt_quality_report_ref_reused, true);
  assert.equal(manifest.drift?.blocked, true, 'N4 prompt drift must block.');
  assert.equal(manifest.drift?.blocker_code, 'N4_DELEGATED_DECISION_ARTIFACT_PROMPT_DRIFT');
  for (const [key, value] of Object.entries(manifest.no_n5_bypass?.counts_after_runtime_admission_before_human ?? {})) {
    assert.equal(value, 0, `N4 runtime/admission bypass changed authority ${key}.`);
  }
  assert.equal(manifest.no_n5_bypass?.counts_after_human_before_explicit_n5?.paper_project_bridge, 0);
  assert.equal(manifest.no_n5_bypass?.counts_after_explicit_n5?.paper_project_bridge, 1);
}

function assertHarnessManifest(manifest) {
  assert.equal(manifest?.status, 'pass', 'v1c harness acceptance status.');
  assert.ok((manifest.row_results?.length ?? 0) >= 17, 'v1c harness acceptance row count too low.');
  assert.ok((manifest.node_trace?.length ?? 0) >= 29, 'v1c harness acceptance node trace count too low.');
  assert.deepEqual(manifest.pending_gaps ?? [], [], 'v1c harness acceptance has pending gaps.');
  for (const row of manifest.row_results ?? []) {
    assert.equal(row.status, 'pass', `v1c harness row ${row.row_id} did not pass.`);
  }
}

function assertStressPromptIndex(snapshot, iterations) {
  const expectedMinimums = {
    'n2_bounded_micro_debate.promotion_supporter_draft': iterations,
    'n2_bounded_micro_debate.reviewer_critic_review': iterations,
    'n2_bounded_micro_debate.promotion_supporter_repair': iterations,
    'n2_bounded_micro_debate.synthesizer_final': iterations,
    n4_delegated_promotion_decision_candidate: iterations,
    downstream_feedback_normalization: iterations,
  };
  for (const [slotId, minimum] of Object.entries(expectedMinimums)) {
    assert.ok(
      (snapshot.by_invocation_slot_id[slotId] ?? 0) >= minimum,
      `Expected at least ${minimum} prompt packet row(s) for ${slotId}, got ${
        snapshot.by_invocation_slot_id[slotId] ?? 0
      }.`,
    );
  }
  assert.equal(snapshot.by_quality_decision.block ?? 0, 0, 'Prompt packet quality blockers recorded.');
}

async function runCommand(step) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const stdoutPath = path.join(ARTIFACT_DIR, `${step.id}.stdout.log`);
  const stderrPath = path.join(ARTIFACT_DIR, `${step.id}.stderr.log`);
  const stdoutChunks = [];
  const stderrChunks = [];
  const startedAt = new Date();
  const env = {
    ...process.env,
    ...(step.env ?? {}),
  };
  const timeoutMs = step.timeoutMs ?? CHILD_TIMEOUT_MS;

  const exit = await new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: REPO_ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let timedOut = false;
    let forceKillTimeout = null;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      forceKillTimeout = setTimeout(() => child.kill('SIGKILL'), 5000);
    }, timeoutMs);
    child.stdout.on('data', (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));
    child.on('error', (error) => {
      clearTimeout(timeout);
      if (forceKillTimeout) clearTimeout(forceKillTimeout);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (forceKillTimeout) clearTimeout(forceKillTimeout);
      resolve({ code, signal, timed_out: timedOut });
    });
  });

  const stdout = Buffer.concat(stdoutChunks).toString('utf8');
  const stderr = Buffer.concat(stderrChunks).toString('utf8');
  await fs.writeFile(stdoutPath, stdout);
  await fs.writeFile(stderrPath, stderr);
  const finishedAt = new Date();
  const manifest = step.manifestPath
    ? await readJsonIfPresent(path.resolve(REPO_ROOT, step.manifestPath))
    : null;
  const result = {
    id: step.id,
    layer: step.layer,
    status: exit.code === 0 && !exit.timed_out ? 'passed' : 'failed',
    command: commandText(step.command, step.args),
    env: sanitizedEnv(step.env ?? {}),
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_ms: finishedAt.getTime() - startedAt.getTime(),
    logs: {
      stdout_path: path.relative(REPO_ROOT, stdoutPath),
      stderr_path: path.relative(REPO_ROOT, stderrPath),
    },
    exit,
    manifest,
  };
  if (exit.timed_out) {
    throw Object.assign(new Error(`Step ${step.id} timed out after ${timeoutMs}ms.`), { step_result: result });
  }
  if (exit.code !== 0) {
    throw Object.assign(
      new Error(`Step ${step.id} failed with code ${exit.code} signal ${exit.signal ?? 'none'}.`),
      { step_result: result },
    );
  }
  return result;
}

function syntaxStep(id, scriptPath) {
  return {
    id,
    layer: 'preflight',
    command: process.execPath,
    args: ['--check', scriptPath],
    timeoutMs: 120000,
  };
}

function n2Step(index) {
  const childRunId = `${RUN_ID}-n2-${String(index).padStart(2, '0')}`;
  return {
    id: `10-n2-runtime-smoke-${String(index).padStart(2, '0')}`,
    layer: 'n2_runtime_smoke',
    command: 'pnpm',
    args: ['topic-selection:v1c-n2-runtime-smoke'],
    env: {
      TOPIC_SELECTION_V1C_N2_RUNTIME_SMOKE_RUN_ID: childRunId,
    },
    manifestPath: `.ai/.tmp/topic-selection-v1c-n2-runtime-smoke/${childRunId}/manifest.json`,
    timeoutMs: CHILD_TIMEOUT_MS,
  };
}

function n6Step(index) {
  const childRunId = `${RUN_ID}-n6-${String(index).padStart(2, '0')}`;
  return {
    id: `20-n6-runtime-smoke-${String(index).padStart(2, '0')}`,
    layer: 'n6_runtime_smoke',
    command: 'pnpm',
    args: ['topic-selection:v1c-n6-runtime-smoke'],
    env: {
      TOPIC_SELECTION_V1C_N6_RUNTIME_SMOKE_RUN_ID: childRunId,
    },
    manifestPath: `.ai/.tmp/topic-selection-v1c-n6-runtime-smoke/${childRunId}/manifest.json`,
    timeoutMs: CHILD_TIMEOUT_MS,
  };
}

function n4Step(index) {
  const childRunId = `${RUN_ID}-n4-${String(index).padStart(2, '0')}`;
  return {
    id: `15-n4-runtime-smoke-${String(index).padStart(2, '0')}`,
    layer: 'n4_runtime_smoke',
    command: 'pnpm',
    args: ['topic-selection:v1c-n4-runtime-smoke'],
    env: {
      TOPIC_SELECTION_V1C_N4_RUNTIME_SMOKE_RUN_ID: childRunId,
    },
    manifestPath: `.ai/.tmp/topic-selection-v1c-n4-runtime-smoke/${childRunId}/manifest.json`,
    timeoutMs: CHILD_TIMEOUT_MS,
  };
}

function harnessStep() {
  const childRunId = `${RUN_ID}-harness`;
  return {
    id: '30-v1c-harness-acceptance',
    layer: 'harness_acceptance',
    command: 'pnpm',
    args: ['topic-selection:v1c-harness-acceptance'],
    env: {
      TOPIC_SELECTION_V1C_ACCEPTANCE_RUN_ID: childRunId,
    },
    manifestPath: `.ai/.tmp/topic-selection-v1c-acceptance/${childRunId}/manifest.json`,
    timeoutMs: CHILD_TIMEOUT_MS,
  };
}

function providerCanaryStep() {
  return {
    id: '40-provider-canary-local',
    layer: 'provider_canary_local',
    command: 'pnpm',
    args: ['topic-selection:v1c-provider-canary'],
    env: {
      BACKEND_TEST_PRESERVE_REAL_ENV: '1',
      T112_PROVIDER_CANARY_LIVE: '0',
      T112_V1C_N2_PROVIDER_CANARY_LIVE: '0',
      T112_V1C_N4_PROVIDER_CANARY_LIVE: '0',
      T112_V1C_N6_PROVIDER_CANARY_LIVE: '0',
      T112_V1B_N4_PROVIDER_CANARY_LIVE: '0',
      T112_V1B_N6_PROVIDER_CANARY_LIVE: '0',
      T112_V1B_N8_PROVIDER_CANARY_LIVE: '0',
    },
    timeoutMs: CHILD_TIMEOUT_MS,
  };
}

async function runAndAssert(step) {
  const result = await runCommand(step);
  if (step.layer === 'n2_runtime_smoke') {
    assertN2Manifest(result.manifest);
  }
  if (step.layer === 'n4_runtime_smoke') {
    assertN4Manifest(result.manifest);
  }
  if (step.layer === 'n6_runtime_smoke') {
    assertN6Manifest(result.manifest);
  }
  if (step.layer === 'harness_acceptance') {
    assertHarnessManifest(result.manifest);
  }
  return result;
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const prisma = new PrismaClient();
  const results = [];
  const summaryPath = path.join(ARTIFACT_DIR, '90-summary.json');
  const config = {
    run_id: RUN_ID,
    iterations: ITERATIONS,
    include_harness_acceptance: INCLUDE_HARNESS_ACCEPTANCE,
    include_provider_canary: INCLUDE_PROVIDER_CANARY,
    child_timeout_ms: CHILD_TIMEOUT_MS,
  };

  try {
    assertPromptPacketIndexModelMetadataOnly(prisma);
    const before = await promptPacketIndexSnapshot(prisma);
    results.push(await runCommand(syntaxStep('00-script-syntax-v1c-runtime-stress', '.ai/scripts/topic-selection-v1c-runtime-stress.mjs')));
    results.push(await runCommand(syntaxStep('00-script-syntax-v1c-n2-runtime-smoke', '.ai/scripts/topic-selection-v1c-n2-runtime-smoke.mjs')));
    results.push(await runCommand(syntaxStep('00-script-syntax-v1c-n4-runtime-smoke', '.ai/scripts/topic-selection-v1c-n4-runtime-smoke.mjs')));
    results.push(await runCommand(syntaxStep('00-script-syntax-v1c-n6-runtime-smoke', '.ai/scripts/topic-selection-v1c-n6-runtime-smoke.mjs')));
    results.push(await runCommand(syntaxStep('00-script-syntax-v1c-harness-acceptance', '.ai/scripts/topic-selection-v1c-harness-acceptance.mjs')));

    for (let index = 1; index <= ITERATIONS; index += 1) {
      results.push(await runAndAssert(n2Step(index)));
      results.push(await runAndAssert(n4Step(index)));
      results.push(await runAndAssert(n6Step(index)));
    }

    if (INCLUDE_HARNESS_ACCEPTANCE) {
      results.push(await runAndAssert(harnessStep()));
    }
    if (INCLUDE_PROVIDER_CANARY) {
      results.push(await runAndAssert(providerCanaryStep()));
    }

    const after = await promptPacketIndexSnapshot(prisma);
    const createdDuringStress = await promptPacketIndexSnapshot(prisma, STARTED_AT);
    assertStressPromptIndex(createdDuringStress, ITERATIONS);

    const summary = {
      schema_version: 'topic-selection-v1c-runtime-stress-summary-v0',
      status: 'passed',
      scenario_id: 'topic-selection.v1c.runtime-stress.prisma.v1',
      ...config,
      artifact_dir: ARTIFACT_DIR,
      started_at: STARTED_AT.toISOString(),
      completed_at: new Date().toISOString(),
      child_run_count: results.length,
      child_runs: results.map((result) => ({
        id: result.id,
        layer: result.layer,
        status: result.status,
        duration_ms: result.duration_ms,
        logs: result.logs,
        manifest_run_id: result.manifest?.run_id ?? null,
        manifest_status: result.manifest?.status ?? null,
      })),
      runtime_smoke_assertions: {
        n2_iterations: ITERATIONS,
        n4_iterations: ITERATIONS,
        n6_iterations: ITERATIONS,
        harness_acceptance_checked: INCLUDE_HARNESS_ACCEPTANCE,
        provider_canary_local_checked: INCLUDE_PROVIDER_CANARY,
      },
      prompt_packet_index: {
        before,
        after,
        created_during_stress: createdDuringStress,
      },
    };
    await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({
      status: summary.status,
      run_id: RUN_ID,
      summary_path: summaryPath,
      child_run_count: summary.child_run_count,
      prompt_index_created_count: createdDuringStress.total_count,
      prompt_index_slots: createdDuringStress.by_invocation_slot_id,
    }, null, 2));
  } catch (error) {
    const failure = {
      schema_version: 'topic-selection-v1c-runtime-stress-summary-v0',
      status: 'failed',
      scenario_id: 'topic-selection.v1c.runtime-stress.prisma.v1',
      ...config,
      artifact_dir: ARTIFACT_DIR,
      started_at: STARTED_AT.toISOString(),
      completed_at: new Date().toISOString(),
      child_runs: results.map((result) => ({
        id: result.id,
        layer: result.layer,
        status: result.status,
        duration_ms: result.duration_ms,
        logs: result.logs,
        manifest_run_id: result.manifest?.run_id ?? null,
        manifest_status: result.manifest?.status ?? null,
      })),
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            step_result: error.step_result ?? null,
          }
        : { message: String(error) },
    };
    await fs.writeFile(summaryPath, `${JSON.stringify(failure, null, 2)}\n`, 'utf8');
    console.error(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
