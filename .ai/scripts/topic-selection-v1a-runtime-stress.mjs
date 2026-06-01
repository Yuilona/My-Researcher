#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const RUN_ID = normalizeOptionalString(process.env.TOPIC_SELECTION_V1A_RUNTIME_STRESS_RUN_ID)
  ?? `t112-v1a-runtime-stress-${Date.now()}`;
const ITERATIONS = positiveInt(process.env.TOPIC_SELECTION_V1A_RUNTIME_STRESS_ITERATIONS, 2);
const MODES = parseModes(process.env.TOPIC_SELECTION_V1A_RUNTIME_STRESS_MODES ?? 'single_agent');
const CONTEXT_MODES = parseContextModes(
  process.env.TOPIC_SELECTION_V1A_RUNTIME_STRESS_CONTEXT_MODES ?? 'baseline',
);
const CHILD_TIMEOUT_MS = positiveInt(process.env.TOPIC_SELECTION_V1A_RUNTIME_STRESS_CHILD_TIMEOUT_MS, 600000);
const RESOURCE_SAMPLE_SET_ID = normalizeOptionalString(process.env.TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID)
  ?? 'resource_sample_set_t112_prod_balanced_20260530';
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1a-runtime-stress', RUN_ID);
const HARNESS_ARTIFACT_ROOT = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1a-harness-e2e');
const N6_SLOT_IDS = new Set([
  'need_candidate_generation',
  'explorer.round_1_discovery',
  'deep_critic.round_1_discovery',
  'arbiter.issue_framing',
  'arbiter.final_synthesis',
]);
const N5_SLOT_ID = 'evidence_extraction';
const N8_SLOT_ID = 'confirmation_semantic_review';

function normalizeOptionalString(value) {
  const normalized = value?.trim();
  return normalized || null;
}

function positiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseModes(raw) {
  const modes = String(raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalized = modes.length > 0 ? modes : ['single_agent'];
  for (const mode of normalized) {
    if (mode !== 'single_agent' && mode !== 'multi_agent_debate') {
      throw new Error(`Unsupported v1a runtime stress mode: ${mode}`);
    }
  }
  return normalized;
}

function parseContextModes(raw) {
  const modes = String(raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalized = modes.length > 0 ? modes : ['baseline'];
  for (const mode of normalized) {
    if (mode !== 'baseline' && mode !== 'mocked_n5_n8') {
      throw new Error(`Unsupported v1a runtime stress context mode: ${mode}`);
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
      modelOptionId: true,
      compressionReportHash: true,
      qualityDecision: true,
      freshnessStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  const n6Rows = rows.filter((row) => N6_SLOT_IDS.has(row.invocationSlotId));
  return {
    total_count: rows.length,
    n5_count: rows.filter((row) => row.invocationSlotId === N5_SLOT_ID).length,
    n6_count: n6Rows.length,
    n8_count: rows.filter((row) => row.invocationSlotId === N8_SLOT_ID).length,
    compressed_count: rows.filter((row) => row.compressionReportHash).length,
    by_invocation_slot_id: groupBy(rows, 'invocationSlotId'),
    by_quality_decision: groupBy(rows, 'qualityDecision'),
    by_freshness_status: groupBy(rows, 'freshnessStatus'),
    sample_rows: rows.slice(0, 12).map((row) => ({
      prompt_packet_hash: row.promptPacketHash,
      invocation_slot_id: row.invocationSlotId,
      prompt_template_id: row.promptTemplateId,
      prompt_template_version: row.promptTemplateVersion,
      model_option_id: row.modelOptionId,
      compression_report_hash: row.compressionReportHash,
      quality_decision: row.qualityDecision,
      freshness_status: row.freshnessStatus,
      created_at: row.createdAt.toISOString(),
    })),
  };
}

function expectedPromptSlotMinimums(childRuns) {
  const minimums = { adjudication_recommendation: childRuns.length };
  for (const childRun of childRuns) {
    if (childRun.context_mode === 'mocked_n5_n8') {
      minimums[N5_SLOT_ID] = (minimums[N5_SLOT_ID] ?? 0) + 1;
      minimums[N8_SLOT_ID] = (minimums[N8_SLOT_ID] ?? 0) + 1;
    }
    if (childRun.mode === 'multi_agent_debate') {
      for (const slotId of [
        'explorer.round_1_discovery',
        'deep_critic.round_1_discovery',
        'arbiter.issue_framing',
        'arbiter.final_synthesis',
      ]) {
        minimums[slotId] = (minimums[slotId] ?? 0) + 1;
      }
    } else {
      minimums.need_candidate_generation = (minimums.need_candidate_generation ?? 0) + 1;
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

function childEnvFor(input) {
  const env = {
    ...process.env,
    TOPIC_SELECTION_REAL_FLOW_MOCK_LLM: '1',
    TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID: RESOURCE_SAMPLE_SET_ID,
    TOPIC_SELECTION_WORKFLOW_SCENARIO_ID: 'topic-selection.v1a.runtime-stress.prisma.v1',
    TOPIC_SELECTION_V1A_HARNESS_REPLAY_SMOKE: '1',
    TOPIC_SELECTION_V1A_HARNESS_RUN_ID: input.childRunId,
    TOPIC_SELECTION_V1A_HARNESS_AGENT_EXECUTION_MODE: 'mocked_llm',
    TOPIC_SELECTION_V1A_HARNESS_EVIDENCE_EXTRACTION_EXECUTION_MODE:
      input.contextMode === 'mocked_n5_n8' ? 'mocked_llm' : 'none',
    TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTION_MODE: 'mocked_llm',
    TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_EXECUTION_MODE: 'mocked_llm',
    TOPIC_SELECTION_V1A_HARNESS_HUMAN_CONFIRMATION_SEMANTIC_REVIEW_EXECUTION_MODE:
      input.contextMode === 'mocked_n5_n8' ? 'mocked_llm' : 'deterministic_parser',
  };
  for (const key of [
    'TOPIC_SELECTION_V1A_HARNESS_GENERATE_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_EVIDENCE_EXTRACTION_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PROFILE',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXECUTION_PLAN_JSON',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_MODEL_OPTION_ID',
    'TOPIC_SELECTION_V1A_HARNESS_HUMAN_CONFIRMATION_SEMANTIC_REVIEW_MODEL_OPTION_ID',
  ]) {
    delete env[key];
  }
  if (input.mode === 'multi_agent_debate') {
    env.TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTOR_KIND = 'multi_agent_debate';
    env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_EXECUTION_MODE = 'mocked_llm';
    env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_EXECUTION_MODE = 'mocked_llm';
    env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_EXECUTION_MODE = 'mocked_llm';
    env.TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_EXECUTION_MODE = 'mocked_llm';
  } else {
    env.TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTOR_KIND = 'single_agent';
    for (const key of [
      'TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_EXECUTION_MODE',
      'TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_EXECUTION_MODE',
      'TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_EXECUTION_MODE',
      'TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_EXECUTION_MODE',
    ]) {
      delete env[key];
    }
  }
  return env;
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
    '.ai/scripts/topic-selection-v1a-harness-e2e.mjs',
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
      reject(new Error(`v1a runtime stress child timed out after ${CHILD_TIMEOUT_MS}ms: ${input.childRunId}`));
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
      `v1a runtime stress child failed (${input.childRunId}) with code ${exit.code} signal ${
        exit.signal ?? 'none'
      }: ${stderr || stdout}`,
    );
  }
  const summaryPath = path.join(HARNESS_ARTIFACT_ROOT, input.childRunId, '90-summary.json');
  const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
  assert.equal(summary.status, 'passed', `${input.childRunId} summary status`);
  assert.equal(summary.replay_smoke?.status, 'passed', `${input.childRunId} replay smoke status`);
  assert.equal(
    summary.harness_llm_gateway?.call_count,
    0,
    `${input.childRunId} deterministic runtime stress must not invoke external harness gateway`,
  );
  const generateNode = summary.nodes?.generate_need_candidate ?? {};
  const humanConfirmNode = summary.nodes?.human_confirm_need ?? {};
  const persistedCandidateCount = generateNode.persisted_candidate_refs?.length ?? 0;
  assert.ok(persistedCandidateCount > 0, `${input.childRunId} did not persist NeedCandidate refs.`);
  if (input.mode === 'multi_agent_debate') {
    assert.equal(generateNode.debate_status, 'succeeded', `${input.childRunId} debate status`);
    assert.ok(
      (generateNode.debate_role_invocation_count ?? 0) >= 3,
      `${input.childRunId} expected at least 3 debate role invocations.`,
    );
  } else {
    assert.equal(generateNode.debate_status, null, `${input.childRunId} should not run debate mode.`);
  }
  if (input.contextMode === 'mocked_n5_n8') {
    assert.equal(
      summary.harness_evidence_extraction_execution_mode,
      'mocked_llm',
      `${input.childRunId} evidence extraction execution mode`,
    );
    assert.equal(
      summary.harness_human_confirmation_semantic_review_execution_mode,
      'mocked_llm',
      `${input.childRunId} human confirmation semantic review execution mode`,
    );
    assert.equal(
      humanConfirmNode.node_status,
      'ready',
      `${input.childRunId} human-confirm-need status`,
    );
  }
  return {
    child_run_id: input.childRunId,
    mode: input.mode,
    context_mode: input.contextMode,
    status: summary.status,
    scenario_type: summary.scenario_type,
    artifact_dir: summary.artifact_dir,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    title_card_id: summary.title_card_id,
    need_candidate_id: summary.need_candidate_id,
    validated_need_id: summary.validated_need_id,
    v1b_input_bundle_id: summary.v1b_input_bundle_id,
    resource_sample_set_id: summary.resource_sample_set_id,
    harness_llm_gateway: summary.harness_llm_gateway,
    replay_smoke: {
      status: summary.replay_smoke.status,
      exact_llm_call_delta:
        summary.replay_smoke.exact_replay.llm_call_count_after
        - summary.replay_smoke.exact_replay.llm_call_count_before,
      drift_llm_call_delta:
        summary.replay_smoke.input_hash_drift.llm_call_count_after
        - summary.replay_smoke.input_hash_drift.llm_call_count_before,
      drift_artifact_ref_delta: summary.replay_smoke.input_hash_drift.artifact_ref_delta,
    },
    generate_need_candidate: {
      adapter_status: generateNode.adapter_status,
      debate_status: generateNode.debate_status,
      debate_role_invocation_count: generateNode.debate_role_invocation_count,
      persisted_candidate_ref_count: persistedCandidateCount,
      routing_decision: generateNode.routing_decision,
    },
    human_confirm_need: {
      status: humanConfirmNode.node_status ?? null,
      route_outcome: humanConfirmNode.route_outcome ?? null,
    },
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
    const before = await promptPacketIndexSnapshot(prisma);
    const childRuns = [];
    for (const contextMode of CONTEXT_MODES) {
      for (const mode of MODES) {
        for (let index = 1; index <= ITERATIONS; index += 1) {
          const childRunId = `${RUN_ID}-${contextMode}-${mode}-${String(index).padStart(2, '0')}`;
          childRuns.push(await runHarnessChild({ contextMode, mode, childRunId }));
        }
      }
    }
    const after = await promptPacketIndexSnapshot(prisma);
    const createdDuringStress = await promptPacketIndexSnapshot(prisma, startedAt);
    assert.ok(
      createdDuringStress.total_count >= childRuns.length,
      `Expected prompt packet index rows during stress, got ${createdDuringStress.total_count}.`,
    );
    assert.ok(
      createdDuringStress.n6_count >= childRuns.length,
      `Expected N6 prompt packet index rows during stress, got ${createdDuringStress.n6_count}.`,
    );
    const promptSlotMinimums = expectedPromptSlotMinimums(childRuns);
    assertPromptSlotMinimums(createdDuringStress, promptSlotMinimums);
    assert.equal(
      createdDuringStress.by_quality_decision.block ?? 0,
      0,
      'Prompt packet quality blockers were recorded during runtime stress.',
    );
    const summary = {
      status: 'passed',
      scenario_id: 'topic-selection.v1a.runtime-stress.prisma.v1',
      run_id: RUN_ID,
      artifact_dir: ARTIFACT_DIR,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      iterations_per_mode: ITERATIONS,
      modes: MODES,
      context_modes: CONTEXT_MODES,
      resource_sample_set_id: RESOURCE_SAMPLE_SET_ID,
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
      scenario_id: 'topic-selection.v1a.runtime-stress.prisma.v1',
      run_id: RUN_ID,
      artifact_dir: ARTIFACT_DIR,
      modes: MODES,
      context_modes: CONTEXT_MODES,
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
