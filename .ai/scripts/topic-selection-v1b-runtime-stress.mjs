#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SLOT_IDS_BY_SCENARIO = {
  n4_runtime_smoke: ['n4_research_slice_option_draft'],
  n6_runtime_smoke: ['n6_question_candidate_draft'],
  n6_loopback_runtime_smoke: ['n6_question_candidate_draft', 'n6_loopback_triage'],
  n7_runtime_smoke: [
    'n7_candidate_grouping',
    'n7_failed_trial_synthesis',
    'n7_n8_debate_admission_review',
  ],
  n8_runtime_smoke: ['n8_value_assessment_draft'],
};
const RUN_ID = normalizeOptionalString(process.env.TOPIC_SELECTION_V1B_RUNTIME_STRESS_RUN_ID)
  ?? `t112-v1b-runtime-stress-${Date.now()}`;
const ITERATIONS = positiveInt(process.env.TOPIC_SELECTION_V1B_RUNTIME_STRESS_ITERATIONS, 1);
const SCENARIOS = parseScenarios(
  process.env.TOPIC_SELECTION_V1B_RUNTIME_STRESS_SCENARIOS
    ?? 'n4_runtime_smoke,n6_runtime_smoke,n6_loopback_runtime_smoke,n7_runtime_smoke,n8_runtime_smoke',
);
const CHILD_TIMEOUT_MS = positiveInt(process.env.TOPIC_SELECTION_V1B_RUNTIME_STRESS_CHILD_TIMEOUT_MS, 900000);
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1b-runtime-stress', RUN_ID);
const HARNESS_ARTIFACT_ROOT = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1b-harness-e2e');

function normalizeOptionalString(value) {
  const normalized = value?.trim();
  return normalized || null;
}

function positiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseScenarios(raw) {
  const scenarios = String(raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalized = scenarios.length > 0
    ? scenarios
    : ['n4_runtime_smoke', 'n6_runtime_smoke', 'n6_loopback_runtime_smoke', 'n7_runtime_smoke', 'n8_runtime_smoke'];
  for (const scenario of normalized) {
    if (!Object.hasOwn(SLOT_IDS_BY_SCENARIO, scenario)) {
      throw new Error(`Unsupported v1b runtime stress scenario: ${scenario}`);
    }
  }
  return normalized;
}

function groupBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    const value = row[key] ?? 'null';
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
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
    compressed_count: rows.filter((row) => row.compressionReportHash).length,
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
    assert.equal(
      fields.includes(forbiddenField),
      false,
      `Prompt packet index must not persist ${forbiddenField}.`,
    );
  }
}

function expectedPromptSlotMinimums(childRuns) {
  const minimums = {};
  for (const childRun of childRuns) {
    for (const slotId of SLOT_IDS_BY_SCENARIO[childRun.scenario]) {
      minimums[slotId] = (minimums[slotId] ?? 0) + 1;
    }
  }
  return minimums;
}

function assertPromptSlotMinimums(snapshot, minimums) {
  for (const [slotId, minimum] of Object.entries(minimums)) {
    const actual = snapshot.by_invocation_slot_id[slotId] ?? 0;
    assert.ok(
      actual >= minimum,
      `Expected at least ${minimum} prompt packet index row(s) for ${slotId}, got ${actual}.`,
    );
  }
}

function assertChildPromptIndex(input, run) {
  const promptIndexCreated = run.prompt_index_created;
  assert.ok(promptIndexCreated, `${input.childRunId} missing prompt index delta.`);
  assertPromptSlotMinimums(
    promptIndexCreated,
    expectedPromptSlotMinimums([{ scenario: input.scenario }]),
  );
  assert.equal(
    promptIndexCreated.by_quality_decision?.block ?? 0,
    0,
    `${input.childRunId} recorded prompt quality blockers.`,
  );
}

function childEnvFor(input) {
  return {
    ...process.env,
    TITLE_CARD_REPOSITORY: 'prisma',
    RESEARCH_LIFECYCLE_REPOSITORY: 'prisma',
    TOPIC_SELECTION_V1B_HARNESS_RUN_ID: input.childRunId,
    TOPIC_SELECTION_V1B_HARNESS_SCENARIO: input.scenario,
    TOPIC_SELECTION_V1B_HARNESS_SEMANTIC_MODE: 'fixture',
    TOPIC_SELECTION_V1B_HARNESS_REPEAT: '1',
  };
}

function assertScenarioCases(input, summary) {
  assert.equal(summary.status, 'passed', `${input.childRunId} summary status`);
  assert.equal(summary.scenario, input.scenario, `${input.childRunId} scenario`);
  assert.equal(summary.semantic_mode, 'fixture', `${input.childRunId} semantic mode`);
  assert.equal(summary.legacy_write_routes_registered, false, `${input.childRunId} legacy route removal`);
  assert.equal(summary.runs?.length, 1, `${input.childRunId} run count`);

  const run = summary.runs[0];
  assertChildPromptIndex(input, run);
  const caseIds = new Set((run.cases ?? []).map((item) => item.case_id));
  if (input.scenario === 'n4_runtime_smoke') {
    assert.ok(caseIds.has('n4_runtime_initial_to_n5_handoff'), 'N4 stress missing initial handoff case.');
    assert.ok(caseIds.has('n4_runtime_source_drift_blocks'), 'N4 stress missing source-drift block case.');
  }
  if (input.scenario === 'n6_runtime_smoke') {
    assert.ok(caseIds.has('n6_runtime_initial_to_n7_handoff'), 'N6 stress missing initial handoff case.');
    assert.ok(caseIds.has('n6_runtime_source_drift_blocks'), 'N6 stress missing source-drift block case.');
  }
  if (input.scenario === 'n6_loopback_runtime_smoke') {
    assert.ok(
      caseIds.has('n6_runtime_regeneration_after_n7_loopback'),
      'N6 loopback stress missing N7 loopback regeneration case.',
    );
    assert.ok(
      caseIds.has('n6_runtime_loopback_triage_and_gate_failure_retry'),
      'N6 loopback stress missing gate-failure retry case.',
    );
  }
  if (input.scenario === 'n7_runtime_smoke') {
    assert.ok(caseIds.has('n7_runtime_grouping_to_n8'), 'N7 stress missing grouping case.');
    assert.ok(caseIds.has('n8_gate_rejection_runtime_readmission'), 'N7 stress missing N8 readmission case.');
    assert.ok(caseIds.has('n7_runtime_failed_trial_to_n6_loopback'), 'N7 stress missing N6 loopback case.');
  }
  if (input.scenario === 'n8_runtime_smoke') {
    assert.ok(caseIds.has('n8_runtime_initial_to_n9_handoff'), 'N8 stress missing initial handoff case.');
    assert.ok(caseIds.has('n8_runtime_projection_source_drift_blocks'), 'N8 stress missing projection-drift block case.');
  }
}

async function runHarnessChild(input) {
  const stdoutPath = path.join(ARTIFACT_DIR, `${input.childRunId}.stdout.log`);
  const stderrPath = path.join(ARTIFACT_DIR, `${input.childRunId}.stderr.log`);
  const stdoutChunks = [];
  const stderrChunks = [];
  const args = [
    '--env-file=.env.local',
    '--loader',
    './apps/backend/node_modules/ts-node/esm.mjs',
    '.ai/scripts/topic-selection-v1b-harness-e2e.mjs',
  ];
  const startedAt = new Date();
  const exit = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: REPO_ROOT,
      env: childEnvFor(input),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`v1b runtime stress child timed out after ${CHILD_TIMEOUT_MS}ms: ${input.childRunId}`));
    }, CHILD_TIMEOUT_MS);
    child.stdout.on('data', (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
  const stdout = Buffer.concat(stdoutChunks).toString('utf8');
  const stderr = Buffer.concat(stderrChunks).toString('utf8');
  await fs.writeFile(stdoutPath, stdout);
  await fs.writeFile(stderrPath, stderr);
  const finishedAt = new Date();
  if (exit.code !== 0) {
    throw new Error(
      `v1b runtime stress child failed (${input.childRunId}) with code ${exit.code} signal ${
        exit.signal ?? 'none'
      }: ${stderr || stdout}`,
    );
  }

  const summaryPath = path.join(HARNESS_ARTIFACT_ROOT, input.childRunId, 'result.json');
  const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
  assertScenarioCases(input, summary);
  return {
    child_run_id: input.childRunId,
    scenario: input.scenario,
    status: summary.status,
    semantic_mode: summary.semantic_mode,
    artifact_dir: summary.artifact_dir,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    title_card_id: summary.runs[0]?.title_card_id ?? null,
    v1b_input_bundle_id: summary.runs[0]?.v1b_input_bundle_id ?? null,
    selected_option_id: summary.runs[0]?.selected_option_id ?? null,
    prompt_index_created: summary.runs[0]?.prompt_index_created ?? null,
    cases: (summary.runs[0]?.cases ?? []).map((item) => ({
      case_id: item.case_id,
      semantic_artifact_count: item.semantic_artifacts?.length ?? 0,
      node_keys: Object.keys(item.nodes ?? {}),
    })),
    logs: {
      stdout_path: stdoutPath,
      stderr_path: stderrPath,
    },
  };
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const prisma = new PrismaClient();
  const startedAt = new Date();
  try {
    assertPromptPacketIndexModelMetadataOnly(prisma);
    const before = await promptPacketIndexSnapshot(prisma);
    const childRuns = [];
    for (const scenario of SCENARIOS) {
      for (let index = 1; index <= ITERATIONS; index += 1) {
        const childRunId = `${RUN_ID}-${scenario}-${String(index).padStart(2, '0')}`;
        childRuns.push(await runHarnessChild({ scenario, childRunId }));
      }
    }

    const after = await promptPacketIndexSnapshot(prisma);
    const createdDuringStress = await promptPacketIndexSnapshot(prisma, startedAt);
    assert.ok(
      createdDuringStress.total_count >= childRuns.length,
      `Expected prompt packet index rows during stress, got ${createdDuringStress.total_count}.`,
    );
    const promptSlotMinimums = expectedPromptSlotMinimums(childRuns);
    assertPromptSlotMinimums(createdDuringStress, promptSlotMinimums);
    assert.equal(
      createdDuringStress.by_quality_decision.block ?? 0,
      0,
      'Prompt packet quality blockers were recorded during v1b runtime stress.',
    );

    const summary = {
      status: 'passed',
      scenario_id: 'topic-selection.v1b.runtime-stress.prisma.v1',
      run_id: RUN_ID,
      artifact_dir: ARTIFACT_DIR,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      iterations_per_scenario: ITERATIONS,
      scenarios: SCENARIOS,
      child_run_count: childRuns.length,
      child_runs: childRuns,
      prompt_packet_index: {
        before,
        after,
        created_during_stress: createdDuringStress,
        expected_slot_minimums: promptSlotMinimums,
      },
    };
    await fs.writeFile(path.join(ARTIFACT_DIR, '90-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    const failure = {
      status: 'failed',
      scenario_id: 'topic-selection.v1b.runtime-stress.prisma.v1',
      run_id: RUN_ID,
      artifact_dir: ARTIFACT_DIR,
      scenarios: SCENARIOS,
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { message: String(error) },
    };
    await fs.writeFile(path.join(ARTIFACT_DIR, '90-summary.json'), `${JSON.stringify(failure, null, 2)}\n`);
    console.error(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
