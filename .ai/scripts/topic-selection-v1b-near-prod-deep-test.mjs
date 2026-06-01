#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const RUN_ID = optionalString(process.env.TOPIC_SELECTION_V1B_NEAR_PROD_RUN_ID)
  ?? `t112-v1b-near-prod-deep-test-${Date.now()}`;
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1b-near-prod-deep-test', RUN_ID);
const HARNESS_REPEAT = positiveInt(process.env.TOPIC_SELECTION_V1B_NEAR_PROD_HARNESS_REPEAT, 1);
const RUNTIME_STRESS_ITERATIONS = positiveInt(
  process.env.TOPIC_SELECTION_V1B_NEAR_PROD_RUNTIME_ITERATIONS,
  1,
);
const CONCURRENT_STRESS_RUNS = positiveInt(
  process.env.TOPIC_SELECTION_V1B_NEAR_PROD_CONCURRENT_STRESS_RUNS,
  1,
);
const INCLUDE_PROVIDER_CANARY = boolEnv(
  process.env.TOPIC_SELECTION_V1B_NEAR_PROD_INCLUDE_PROVIDER_CANARY,
  true,
);

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
    )),
  );
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return null;
    throw error;
  }
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
  const timeoutMs = step.timeoutMs ?? 900000;

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
      forceKillTimeout = setTimeout(() => {
        child.kill('SIGKILL');
      }, 5000);
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
    parsed_summary: step.summaryPath
      ? await readJsonIfPresent(path.resolve(REPO_ROOT, step.summaryPath))
      : null,
  };
  if (exit.timed_out) {
    throw Object.assign(
      new Error(`Step ${step.id} timed out after ${timeoutMs}ms.`),
      { step_result: result },
    );
  }
  if (exit.code !== 0) {
    throw Object.assign(
      new Error(`Step ${step.id} failed with code ${exit.code} signal ${exit.signal ?? 'none'}.`),
      { step_result: result },
    );
  }
  return result;
}

function fullChainStep() {
  const childRunId = `${RUN_ID}-full-chain`;
  return {
    id: '01-full-chain-prisma',
    layer: 'prisma_full_chain',
    command: 'pnpm',
    args: ['topic-selection:v1b-harness-e2e'],
    env: {
      TITLE_CARD_REPOSITORY: 'prisma',
      RESEARCH_LIFECYCLE_REPOSITORY: 'prisma',
      TOPIC_SELECTION_V1B_HARNESS_RUN_ID: childRunId,
      TOPIC_SELECTION_V1B_HARNESS_REPEAT: String(HARNESS_REPEAT),
      TOPIC_SELECTION_V1B_HARNESS_SCENARIO: 'positive',
      TOPIC_SELECTION_V1B_HARNESS_SEMANTIC_MODE: 'fixture',
    },
    timeoutMs: 900000,
    summaryPath: `.ai/.tmp/topic-selection-v1b-harness-e2e/${childRunId}/result.json`,
  };
}

function runtimeStressStep(suffix, id) {
  const childRunId = `${RUN_ID}-${suffix}`;
  return {
    id,
    layer: 'runtime_stress',
    command: 'pnpm',
    args: ['topic-selection:v1b-runtime-stress'],
    env: {
      TOPIC_SELECTION_V1B_RUNTIME_STRESS_RUN_ID: childRunId,
      TOPIC_SELECTION_V1B_RUNTIME_STRESS_ITERATIONS: String(RUNTIME_STRESS_ITERATIONS),
      TOPIC_SELECTION_V1B_RUNTIME_STRESS_SCENARIOS:
        'n4_runtime_smoke,n6_runtime_smoke,n6_loopback_runtime_smoke,n7_runtime_smoke,n8_runtime_smoke',
    },
    timeoutMs: 1800000,
    summaryPath: `.ai/.tmp/topic-selection-v1b-runtime-stress/${childRunId}/90-summary.json`,
  };
}

function focusedUnitStep() {
  return {
    id: '03-runtime-contract-and-compression-units',
    layer: 'runtime_contracts_and_l5',
    command: 'pnpm',
    args: [
      '--filter',
      '@paper-engineering-assistant/backend',
      'exec',
      'node',
      '--test',
      '--loader',
      'ts-node/esm',
      'src/services/topic-selection-context-policy-profile-registry-service.unit.test.ts',
      'src/services/topic-selection-compression-runtime-service.unit.test.ts',
      'src/services/topic-selection-v1b-n6-draft-admission-service.unit.test.ts',
      'src/services/topic-selection-v1b-n7-support-admission-service.unit.test.ts',
    ],
    timeoutMs: 900000,
  };
}

function providerCanaryStep() {
  return {
    id: '04-provider-slot-canary',
    layer: 'provider_required_live',
    command: 'pnpm',
    args: ['topic-selection:v1b-provider-canary'],
    timeoutMs: 1200000,
  };
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

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const startedAt = new Date();
  const results = [];
  const summaryPath = path.join(ARTIFACT_DIR, '90-summary.json');
  const config = {
    run_id: RUN_ID,
    harness_repeat: HARNESS_REPEAT,
    runtime_stress_iterations: RUNTIME_STRESS_ITERATIONS,
    concurrent_stress_runs: CONCURRENT_STRESS_RUNS,
    include_provider_canary: INCLUDE_PROVIDER_CANARY,
    retired_full_chain_provider_loopbacks: true,
  };

  try {
    results.push(await runCommand(syntaxStep('00-script-syntax-near-prod', '.ai/scripts/topic-selection-v1b-near-prod-deep-test.mjs')));
    results.push(await runCommand(syntaxStep('00-script-syntax-harness', '.ai/scripts/topic-selection-v1b-harness-e2e.mjs')));
    results.push(await runCommand(syntaxStep('00-script-syntax-runtime-stress', '.ai/scripts/topic-selection-v1b-runtime-stress.mjs')));
    results.push(await runCommand(fullChainStep()));

    if (CONCURRENT_STRESS_RUNS === 1) {
      results.push(await runCommand(runtimeStressStep('runtime-stress', '02-runtime-stress-prisma')));
    } else {
      const concurrentSteps = Array.from({ length: CONCURRENT_STRESS_RUNS }, (_, index) => runtimeStressStep(
        `runtime-stress-concurrent-${String(index + 1).padStart(2, '0')}`,
        `02-runtime-stress-prisma-concurrent-${String(index + 1).padStart(2, '0')}`,
      ));
      results.push(...await Promise.all(concurrentSteps.map((step) => runCommand(step))));
    }

    results.push(await runCommand(focusedUnitStep()));
    if (INCLUDE_PROVIDER_CANARY) {
      results.push(await runCommand(providerCanaryStep()));
    }

    const summary = {
      status: 'passed',
      scenario_id: 'topic-selection.v1b.near-production-deep-test.v1',
      config,
      artifact_dir: path.relative(REPO_ROOT, ARTIFACT_DIR),
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      layers: results.map((result) => ({
        id: result.id,
        layer: result.layer,
        status: result.status,
        duration_ms: result.duration_ms,
        logs: result.logs,
        parsed_status: result.parsed_summary?.status ?? null,
        parsed_scenario: result.parsed_summary?.scenario ?? result.parsed_summary?.scenario_id ?? null,
      })),
    };
    assert.equal(summary.layers.every((layer) => layer.status === 'passed'), true);
    await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    const stepResult = error && typeof error === 'object' && 'step_result' in error
      ? error.step_result
      : null;
    if (stepResult) {
      results.push(stepResult);
    }
    const failure = {
      status: 'failed',
      scenario_id: 'topic-selection.v1b.near-production-deep-test.v1',
      config,
      artifact_dir: path.relative(REPO_ROOT, ARTIFACT_DIR),
      started_at: startedAt.toISOString(),
      failed_at: new Date().toISOString(),
      completed_layers: results.map((result) => ({
        id: result.id,
        layer: result.layer,
        status: result.status,
        duration_ms: result.duration_ms,
        logs: result.logs,
      })),
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { message: String(error) },
    };
    await fs.writeFile(summaryPath, `${JSON.stringify(failure, null, 2)}\n`, 'utf8');
    console.error(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
  }
}

await main();
