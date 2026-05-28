#!/usr/bin/env node

import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKEND_PORT = 3310;
const DEFAULT_DESKTOP_PORT = 5189;
const DEFAULT_TIMEOUT_MS = 45_000;
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = path.resolve(SCRIPT_DIR, '..');

function parseIntOr(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForHttp(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await delay(200);
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

function createProc(name, command, args, env = process.env) {
  const child = spawn(command, args, {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  return child;
}

function killProc(child, signal = 'SIGTERM') {
  if (!child || child.killed) {
    return;
  }
  child.kill(signal);
}

function assertAlive(label, child) {
  if (!child) {
    throw new Error(`${label} process is not initialized.`);
  }
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(`${label} process exited unexpectedly (code=${child.exitCode}, signal=${child.signalCode}).`);
  }
}

async function ensureNotOccupied(label, port) {
  if (await isPortOpen(port)) {
    throw new Error(`${label} port ${port} is already occupied.`);
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`POST ${url} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function getJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function readDesktopSource(relativePath) {
  return readFile(path.join(DESKTOP_ROOT, relativePath), 'utf8');
}

function assertIncludes(source, snippet, label) {
  if (!source.includes(snippet)) {
    throw new Error(`${label} missing expected snippet: ${snippet}`);
  }
}

async function assertExperimentFoundationWorkbenchSource() {
  const [constants, app, api, controller, moduleSource, utils, topbar, efConstants] = await Promise.all([
    readDesktopSource('src/renderer/literature/shared/constants.ts'),
    readDesktopSource('src/renderer/App.tsx'),
    readDesktopSource('src/renderer/modules/experiment-foundation/api.ts'),
    readDesktopSource('src/renderer/modules/experiment-foundation/useExperimentFoundationController.ts'),
    readDesktopSource('src/renderer/modules/experiment-foundation/ExperimentFoundationModule.tsx'),
    readDesktopSource('src/renderer/modules/experiment-foundation/utils.ts'),
    readDesktopSource('src/renderer/shell/components/Topbar.tsx'),
    readDesktopSource('src/renderer/modules/experiment-foundation/constants.ts'),
  ]);

  assertIncludes(constants, "['文献管理', '实验基座', '选题管理', '论文管理']", 'desktop nav order');
  assertIncludes(app, "activeModule === '实验基座'", 'desktop module mount');
  assertIncludes(app, '<ExperimentFoundationModule', 'desktop module mount');
  assertIncludes(topbar, 'aria-label="实验基座标签页"', 'experiment foundation topbar tabs');
  assertIncludes(efConstants, "{ key: 'overview', label: '概览' }", 'experiment foundation tab labels');
  assertIncludes(efConstants, "{ key: 'assets', label: '资产库' }", 'experiment foundation tab labels');
  assertIncludes(moduleSource, "activePanel === 'assets'", 'experiment foundation panel routing');

  for (const endpoint of [
    '/experiment-foundation/records',
    '/experiment-foundation/readiness/',
    '/experiment-foundation/readiness/check',
    '/experiment-foundation/candidates/',
    '/experiment-foundation/execution/jobs',
    '/experiment-foundation/execution/jobs/submit',
    '/sync',
    '/cancel',
    '/collect',
  ]) {
    assertIncludes(api, endpoint, 'experiment foundation desktop API client');
  }
  assertIncludes(api, 'requestGovernance<', 'experiment foundation desktop API client');

  const rendererSources = [api, controller, moduleSource, utils];
  for (const forbidden of [
    'fetch(',
    'buildApp(',
    'PrismaClient',
    'child_process',
    'new Ajv',
    'LocalScriptAdapter',
    'AliyunPaiDlcAdapter',
    'TrainingPlatformAdapter',
  ]) {
    if (rendererSources.some((source) => source.includes(forbidden))) {
      throw new Error(`Experiment foundation renderer must not own backend/materialization semantics: ${forbidden}`);
    }
  }
}

async function smokeExperimentFoundationApis(backendBaseUrl) {
  const datasetAssetId = 'desktop_smoke_dataset_asset';
  const created = await postJson(`${backendBaseUrl}/experiment-foundation/records`, {
    record_kind: 'dataset_asset',
    payload: {
      dataset_asset_id: datasetAssetId,
      name: 'Desktop Smoke Dataset',
      aliases: ['desktop_smoke_dataset'],
      description: 'Dataset identity used by desktop smoke.',
      source_refs: [{ ref_type: 'desktop_smoke', ref_id: 'source_001' }],
      task_types: ['text_classification'],
      schema_summary: { columns: ['text', 'label'], row_count: 2 },
      default_version_id: null,
      catalog_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
  if (created.record_kind !== 'dataset_asset' || created.record_id !== datasetAssetId) {
    throw new Error('Experiment foundation registry smoke check failed: dataset record identity mismatch.');
  }

  const records = await getJson(`${backendBaseUrl}/experiment-foundation/records?record_kind=dataset_asset`);
  if (!Array.isArray(records.records) || !records.records.some((record) => record.record_id === datasetAssetId)) {
    throw new Error('Experiment foundation registry smoke check failed: dataset list missing created record.');
  }

  const readiness = await postJson(`${backendBaseUrl}/experiment-foundation/readiness/check`, {
    target_ref: { ref_type: 'dataset_asset', ref_id: datasetAssetId },
    source_refs: [{ ref_type: 'desktop_smoke', ref_id: 'readiness_check' }],
  });
  if (!readiness.readiness_report_id || typeof readiness.readiness_status !== 'string') {
    throw new Error('Experiment foundation readiness smoke check failed.');
  }

  const latestReadiness = await getJson(
    `${backendBaseUrl}/experiment-foundation/readiness/dataset_asset/${datasetAssetId}/latest`,
  );
  if (latestReadiness.readiness_report_id !== readiness.readiness_report_id) {
    throw new Error('Experiment foundation latest readiness smoke check failed.');
  }

  const jobs = await getJson(`${backendBaseUrl}/experiment-foundation/execution/jobs`);
  if (!Array.isArray(jobs.jobs)) {
    throw new Error('Experiment foundation execution jobs smoke check failed.');
  }
}

async function main() {
  const backendPort = parseIntOr(process.env.DESKTOP_SMOKE_BACKEND_PORT, DEFAULT_BACKEND_PORT);
  const desktopPort = parseIntOr(process.env.DESKTOP_SMOKE_PORT, DEFAULT_DESKTOP_PORT);
  const timeoutMs = parseIntOr(process.env.DESKTOP_SMOKE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const backendBaseUrl = `http://127.0.0.1:${backendPort}`;
  const rendererBaseUrl = `http://127.0.0.1:${desktopPort}`;

  await ensureNotOccupied('backend', backendPort);
  await ensureNotOccupied('desktop', desktopPort);

  const backend = createProc(
    'backend',
    'pnpm',
    [
      '--filter',
      '@paper-engineering-assistant/backend',
      'exec',
      'node',
      '--loader',
      'ts-node/esm',
      'src/server.ts',
    ],
    {
      ...process.env,
      PORT: String(backendPort),
      HOST: '127.0.0.1',
      RESEARCH_LIFECYCLE_REPOSITORY: 'memory',
      GOVERNANCE_DELIVERY_MODE: 'in-process',
    },
  );

  let desktop = null;

  try {
    await waitForHttp(`${backendBaseUrl}/health`, timeoutMs);

    const paper = await postJson(`${backendBaseUrl}/paper-projects`, {
      title_card_id: 'TITLE-CARD-DESKTOP-SMOKE',
      title: 'Desktop Smoke Paper',
      created_by: 'human',
      initial_context: {
        literature_evidence_ids: ['LIT-DESKTOP-SMOKE'],
      },
    });
    const paperId = paper.paper_id;

    await postJson(`${backendBaseUrl}/paper-projects/${paperId}/version-spine/commit`, {
      lineage_meta: {
        paper_id: paperId,
        stage_id: 'S3',
        module_id: 'M5',
        version_id: 'P001-M5-B01-N0001',
        run_id: 'RUN-DESKTOP-SMOKE',
        lane_id: 'LANE-DESKTOP-SMOKE',
        attempt_id: 'ATT-DESKTOP-SMOKE',
        created_by: 'llm',
        created_at: new Date().toISOString(),
      },
      payload_ref: 'experiment_plan_v:EXP-DESKTOP-SMOKE',
      node_status: 'candidate',
      value_judgement_payload: {
        judgement_id: 'J-DESKTOP-SMOKE',
        decision: 'hold',
        core_score_vector: { technical_soundness: 0.72 },
        extension_score_vector: { protocol_fairness: 0.68 },
        confidence: 0.8,
        reason_summary: 'desktop smoke seed',
        reviewer: 'llm',
        timestamp: new Date().toISOString(),
      },
    });

    desktop = createProc(
      'desktop',
      'pnpm',
      ['--filter', '@paper-engineering-assistant/desktop', 'dev'],
      {
        ...process.env,
        DESKTOP_DEV_PORT: String(desktopPort),
        DESKTOP_BACKEND_BASE_URL: backendBaseUrl,
        VITE_API_BASE_URL: backendBaseUrl,
        VITE_ENABLE_GOVERNANCE_PANELS: '1',
      },
    );

    await waitForHttp(`${rendererBaseUrl}/`, timeoutMs);
    await delay(800);
    assertAlive('desktop', desktop);
    const html = await fetch(`${rendererBaseUrl}/`).then((res) => res.text());
    if (!html.includes('<div id="root"></div>')) {
      throw new Error('Renderer root element not found.');
    }
    await assertExperimentFoundationWorkbenchSource();
    await smokeExperimentFoundationApis(backendBaseUrl);

    const timeline = await getJson(`${backendBaseUrl}/paper-projects/${paperId}/timeline`);
    if (!Array.isArray(timeline.events) || timeline.events.length === 0) {
      throw new Error('Timeline smoke check failed: no events found.');
    }

    const metrics = await getJson(`${backendBaseUrl}/paper-projects/${paperId}/resource-metrics`);
    if (typeof metrics?.paper_runtime_metric?.tokens !== 'number') {
      throw new Error('Metrics smoke check failed: tokens missing.');
    }

    const artifact = await getJson(`${backendBaseUrl}/paper-projects/${paperId}/artifact-bundle`);
    if (!artifact?.artifact_bundle) {
      throw new Error('Artifact bundle smoke check failed.');
    }

    const review = await postJson(`${backendBaseUrl}/paper-projects/${paperId}/release-gate/review`, {
      reviewers: ['reviewer-smoke'],
      decision: 'hold',
      risk_flags: ['policy-check'],
      label_policy: 'ai-generated-required',
      comment: 'desktop smoke',
    });
    if (!review?.gate_result?.review_id) {
      throw new Error('Release review smoke check failed: review_id missing.');
    }

    console.log('[desktop-smoke] PASS');
  } finally {
    killProc(desktop);
    killProc(backend);
    await delay(300);
    killProc(desktop, 'SIGKILL');
    killProc(backend, 'SIGKILL');
  }
}

main().catch((error) => {
  console.error(`[desktop-smoke] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
