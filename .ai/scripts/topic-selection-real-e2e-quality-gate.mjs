#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const ROLE_ORDER = ['support', 'challenge', 'baseline', 'context'];

const QUALITY_RUN_ID = process.env.TOPIC_SELECTION_REAL_E2E_QUALITY_RUN_ID
  ?? `real-e2e-quality-${timestamp()}`;
const REPEATS = parsePositiveInt(process.env.TOPIC_SELECTION_REAL_E2E_REPEATS, 3);
const SAMPLE_SIZE = parsePositiveInt(process.env.TOPIC_SELECTION_REAL_LITERATURE_LIMIT, 32);
const RUN_NEGATIVE = process.env.TOPIC_SELECTION_REAL_E2E_SKIP_NEGATIVE !== '1';
const MODEL_ID = process.env.TOPIC_SELECTION_REAL_MODEL_ID ?? 'gpt-5.4-mini';
const PROVIDER_LLM_MODE = process.env.TOPIC_SELECTION_REAL_FLOW_MOCK_LLM ?? '0';
const EXISTING_PROVIDER_RUN_IDS = parseCsv(process.env.TOPIC_SELECTION_REAL_E2E_EXISTING_RUN_IDS);
const EXISTING_NEGATIVE_RUN_ID = process.env.TOPIC_SELECTION_REAL_E2E_EXISTING_NEGATIVE_RUN_ID ?? null;

const QUALITY_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-real-e2e-quality', QUALITY_RUN_ID);
const E2E_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-real-e2e');

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function parsePositiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCsv(raw) {
  return String(raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function roleTargets(sampleSize) {
  const base = Math.floor(sampleSize / ROLE_ORDER.length);
  const targets = Object.fromEntries(ROLE_ORDER.map((role) => [role, base]));
  let remaining = sampleSize - base * ROLE_ORDER.length;
  for (const role of ROLE_ORDER) {
    if (remaining <= 0) {
      break;
    }
    targets[role] += 1;
    remaining -= 1;
  }
  return targets;
}

function roleCounts(items) {
  const counts = Object.fromEntries(ROLE_ORDER.map((role) => [role, 0]));
  for (const item of items) {
    const normalized = normalizeSelectedItem(item);
    if (ROLE_ORDER.includes(normalized.role)) {
      counts[normalized.role] += 1;
    }
  }
  return counts;
}

function normalizeRoleCounts(rawCounts, selectedItems) {
  if (rawCounts && typeof rawCounts === 'object') {
    return Object.fromEntries(ROLE_ORDER.map((role) => [role, Number(rawCounts[role] ?? 0)]));
  }
  return roleCounts(selectedItems);
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
}

function itemText(item) {
  return normalizeText([
    item.title,
    item.key_content_digest,
    item.classification_rationale,
    ...(item.method_families ?? []),
  ].filter(Boolean).join(' '));
}

function hasRiskSignal(item) {
  const text = itemText(item);
  const hardRisk = /poison|attack|leakage attack|source verification failure|unverified|not verified|knowledge conflict|injection|persistent memory attack|memory attacks?|source attribution risk|hijack/u.test(text);
  if (!hardRisk && /hallucination[- ]?free|addresses? the risks? of|emotionally adversarial conversations?/u.test(text)) {
    return false;
  }
  return /poison|adversarial|attack|leak|hallucination(?![- ]?free)|hallucinated|invalid citations?|citation validation|unsupported reasoning|legal reasoning is not semantic similarity search|conflict|source verification|unverified|not verified|failure|robust|safety|wrong|privacy|risk management|risk-management|operational risks|auditability|accountability|governance|injection|defen[cs]e|persistent memory attack|memory attacks?|source attribution risk|hijack|drift/u
    .test(text);
}

function hasChallengeSignal(item) {
  const text = itemText(item);
  return hasRiskSignal(item)
    || /visual financial document retrieval|aggregation strategies|architecture matters|comparing rag systems|defense effectiveness/u
      .test(text);
}

function hasBaselineSignal(item) {
  return /benchmark|evaluat|comparison|compare|comparing|assessment|empirical|deduplication|dataset|baseline|metric|public benchmarks|question answering/u
    .test(itemText(item));
}

function hasContextSignal(item) {
  return /rag|retrieval|llm|language model|transformer|foundation|generation|knowledge|evaluation|context/u
    .test(itemText(item));
}

function selectedSetKey(items) {
  return items
    .map(normalizeSelectedItem)
    .filter((item) => item.id && item.role)
    .map((item) => `${item.id}:${item.role}`)
    .sort()
    .join('|');
}

function normalizeSelectedItem(item) {
  return {
    ...item,
    id: item.id ?? item.literature_ref?.ref_id ?? item.literatureRef?.ref_id ?? null,
    role: item.role ?? item.selected_role ?? item.evidence_role ?? null,
    sample_rank: item.sample_rank ?? item.rank ?? null,
  };
}

function selectedItemsFromSample(samplePayload) {
  return samplePayload?.selected_items?.map(normalizeSelectedItem) ?? [];
}

function mergeSelectedDetails(selectedItems, sampleItems) {
  const sampleById = new Map(sampleItems.map((item) => [item.id, item]));
  return selectedItems.map((rawItem) => {
    const item = normalizeSelectedItem(rawItem);
    const sample = sampleById.get(item.id);
    if (!sample) {
      return item;
    }
    return normalizeSelectedItem({
      ...sample,
      ...item,
      role: item.role ?? sample.role,
      sampling_guardrails: item.sampling_guardrails ?? sample.guardrail_codes ?? [],
      classification_rationale: sample.classification_rationale ?? item.classification_rationale,
      method_families: sample.method_families ?? item.method_families ?? [],
      evidence_polarity: sample.evidence_polarity ?? item.evidence_polarity,
    });
  });
}

async function writeJson(filePath, payload) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function appendLog(logPath, chunk) {
  await fs.appendFile(logPath, chunk);
}

async function runRealE2e(runId, envOverrides, label) {
  const logPath = path.join(QUALITY_DIR, `${label}.log`);
  await fs.writeFile(logPath, '');
  const childEnv = {
    ...process.env,
    TOPIC_SELECTION_REAL_RUN_ID: runId,
    TOPIC_SELECTION_REAL_MODEL_ID: MODEL_ID,
    TOPIC_SELECTION_REAL_LITERATURE_LIMIT: String(SAMPLE_SIZE),
    ...envOverrides,
  };
  const child = spawn(process.execPath, [
    '--loader',
    './apps/backend/node_modules/ts-node/esm.mjs',
    '.ai/scripts/topic-selection-real-e2e.mjs',
  ], {
    cwd: REPO_ROOT,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    void appendLog(logPath, chunk);
  });
  child.stderr.on('data', (chunk) => {
    void appendLog(logPath, chunk);
  });

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  const summaryPath = path.join(E2E_DIR, runId, '90-summary.json');
  const summary = await readJson(summaryPath).catch(async (error) => ({
    status: 'missing_summary',
    run_id: runId,
    error: { message: error instanceof Error ? error.message : String(error) },
  }));
  return {
    exit_code: exitCode,
    log_path: path.relative(REPO_ROOT, logPath),
    summary_path: path.relative(REPO_ROOT, summaryPath),
    summary,
  };
}

async function loadExistingE2e(runId, label) {
  const summaryPath = path.join(E2E_DIR, runId, '90-summary.json');
  const summary = await readJson(summaryPath).catch(async (error) => ({
    status: 'missing_summary',
    run_id: runId,
    error: { message: error instanceof Error ? error.message : String(error) },
  }));
  const passedStatuses = new Set(['passed', 'passed_v1b_non_advance']);
  return {
    exit_code: passedStatuses.has(summary.status) ? 0 : 1,
    log_path: path.relative(REPO_ROOT, path.join(QUALITY_DIR, `${label}.log`)),
    summary_path: path.relative(REPO_ROOT, summaryPath),
    summary,
  };
}

async function loadSelectedDetails(runId) {
  const filePath = path.join(E2E_DIR, runId, '01-selected-literature.json');
  const payload = await readJson(filePath).catch(() => null);
  return payload?.selected_literature ?? [];
}

async function loadResourceSample(runId) {
  const filePath = path.join(E2E_DIR, runId, '00-resource-sample.json');
  return readJson(filePath).catch(() => null);
}

function auditSelectedLiterature(items) {
  const failures = [];
  const warnings = [];
  const rows = [];
  for (const rawItem of items) {
    const item = normalizeSelectedItem(rawItem);
    const itemFailures = [];
    const itemWarnings = [];
    if (item.role === 'support' && hasRiskSignal(item)) {
      itemFailures.push('risk-heavy support');
    }
    if (item.role === 'baseline' && !hasBaselineSignal(item)) {
      itemFailures.push('baseline lacks benchmark/evaluation/comparison signal');
    }
    if (item.role === 'challenge' && !hasChallengeSignal(item)) {
      itemFailures.push('challenge lacks risk/failure signal');
    }
    if (item.role === 'context' && !hasContextSignal(item)) {
      itemWarnings.push('context signal is broad');
    }
    for (const failure of itemFailures) {
      failures.push(`${item.id} ${item.role}: ${failure}`);
    }
    for (const warning of itemWarnings) {
      warnings.push(`${item.id} ${item.role}: ${warning}`);
    }
    rows.push({
      rank: item.sample_rank,
      id: item.id,
      role: item.role,
      title: item.title,
      year: item.year,
      source_id: item.source_id,
      bucket: item.bucket ?? null,
      auto_precheck: itemFailures.length === 0 ? 'pass' : 'fail',
      issues: [...itemFailures, ...itemWarnings],
      guardrails: item.sampling_guardrails ?? [],
      evidence_excerpt: String(item.key_content_digest ?? '').slice(0, 260),
    });
  }
  return { failures, warnings, rows };
}

function auditRun(run, selectedDetails, samplePayload, expectedTargets) {
  const failures = [];
  const warnings = [];
  const summary = run.summary;
  const sampleSet = samplePayload?.sample_set ?? null;
  const selectedFromSummary = summary.selected_literature ?? [];
  const selectedFromSample = selectedItemsFromSample(samplePayload);
  const selected = selectedDetails.length > 0
    ? mergeSelectedDetails(selectedDetails, selectedFromSample)
    : selectedFromSummary.length > 0
      ? mergeSelectedDetails(selectedFromSummary, selectedFromSample)
      : selectedFromSample;
  const counts = normalizeRoleCounts(sampleSet?.role_counts, selected);
  const sampleHash = sampleSet?.sample_hash ?? summary.resource_sample_hash ?? null;
  const sampleStatus = sampleSet?.status ?? summary.resource_sample_status ?? null;
  const sampleWarnings = sampleSet?.warnings ?? summary.resource_sample_warnings ?? [];
  const literatureCount = selected.length || selectedFromSample.length || summary.literature_count || 0;
  if (!samplePayload) {
    failures.push(`run ${summary.run_id} missing resource sample artifact`);
  }
  if (!sampleHash) {
    failures.push(`run ${summary.run_id} missing resource sample hash`);
  }
  if (!sampleStatus) {
    failures.push(`run ${summary.run_id} missing resource sample status`);
  }
  if (sampleStatus === 'blocked') {
    failures.push(`run ${summary.run_id} resource sample status=blocked`);
  }
  warnings.push(...sampleWarnings.map((warning) => `run ${summary.run_id} sample warning: ${warning}`));
  if (literatureCount !== SAMPLE_SIZE) {
    failures.push(`run ${summary.run_id} selected ${literatureCount}, expected ${SAMPLE_SIZE}`);
  }
  for (const role of ROLE_ORDER) {
    if (counts[role] !== expectedTargets[role]) {
      failures.push(`run ${summary.run_id} role ${role} count ${counts[role]}, expected ${expectedTargets[role]}`);
    }
  }

  const outcome = classifyRunOutcome(summary);
  if (summary.status !== 'passed' || run.exit_code !== 0) {
    failures.push(formatRunFailure(summary, run.exit_code, outcome));
  } else {
    if (!summary.paper_project_intake?.paperProjectCreated) {
      failures.push(`run ${summary.run_id} did not create PaperProject intake`);
    }
    if (summary.paper_project_intake?.duplicatePaperProjectCreated !== false) {
      failures.push(`run ${summary.run_id} duplicate intake was not idempotent`);
    }
    const intake = summary.paper_project_intake ?? {};
    const expectedNegative = [
      ['malformedStatus', 400],
      ['staleHashStatus', 409],
      ['workspaceDriftStatus', 409],
      ['inactiveStatus', 409],
    ];
    for (const [key, expected] of expectedNegative) {
      if (intake[key] !== expected) {
        failures.push(`run ${summary.run_id} ${key}=${intake[key]}, expected ${expected}`);
      }
    }
    if ((intake.carriedLiteratureEvidenceIds ?? []).length === 0) {
      failures.push(`run ${summary.run_id} did not carry literature evidence ids`);
    }
    if (summary.downstream?.feedbackCount !== 13 || summary.downstream?.recheckCount !== 12) {
      failures.push(`run ${summary.run_id} downstream feedback/recheck counts drifted`);
    }
  }

  const selectedAudit = auditSelectedLiterature(selected);
  if (selectedAudit.rows.length === 0) {
    failures.push(`run ${summary.run_id} has no selected literature details for manual audit`);
  }
  failures.push(...selectedAudit.failures.map((item) => `run ${summary.run_id}: ${item}`));
  warnings.push(...selectedAudit.warnings.map((item) => `run ${summary.run_id}: ${item}`));

  return {
    run_id: summary.run_id,
    status: summary.status,
    outcome,
    llm_mode: summary.llm_mode,
    sample_status: sampleStatus,
    sample_warnings: sampleWarnings,
    sample_hash: sampleHash,
    role_counts: counts,
    selected_set_key: selectedSetKey(selected),
    literature_count: literatureCount,
    paper_project_id: summary.paper_project_intake?.paperProjectId ?? null,
    bridge_id: summary.v1c?.paperProjectBridgeId ?? null,
    failures,
    warnings,
    selected_audit: selectedAudit.rows,
  };
}

function classifyRunOutcome(summary) {
  if (summary.status === 'passed') {
    return 'passed_full_chain';
  }
  const message = summary.error?.message ?? '';
  if (/not advance-ready/u.test(message)) {
    return 'provider_quality_non_advance';
  }
  if (/unknown or drifted evidence ref/u.test(message)) {
    return 'provider_contract_drift';
  }
  if (summary.status === 'missing_summary') {
    return 'missing_summary';
  }
  return 'failed_other';
}

function formatRunFailure(summary, exitCode, outcome) {
  const stage = summary.current_stage ? ` at ${summary.current_stage}` : '';
  const message = summary.error?.message ? `: ${summary.error.message}` : '';
  return `run ${summary.run_id} ${outcome}${stage} exit=${exitCode}${message}`;
}

function auditStability(runAudits) {
  const failures = [];
  const sampleHashes = new Set(runAudits.map((run) => run.sample_hash));
  const selectedSets = new Set(runAudits.map((run) => run.selected_set_key));
  if (sampleHashes.size !== 1) {
    failures.push(`sample hash drift: ${[...sampleHashes].join(', ')}`);
  }
  if (selectedSets.size !== 1) {
    failures.push('selected literature/role set drifted across runs');
  }
  return {
    sample_hash_stable: sampleHashes.size === 1,
    selected_set_stable: selectedSets.size === 1,
    sample_hashes: [...sampleHashes],
    failures,
  };
}

function auditNegativeRun(run) {
  const failures = [];
  const summary = run.summary;
  if (run.exit_code !== 0) {
    failures.push(`negative run exited with ${run.exit_code}`);
  }
  if (summary.status !== 'passed_v1b_non_advance') {
    failures.push(`negative run status=${summary.status}, expected passed_v1b_non_advance`);
  }
  if (summary.v1b?.advancedToPackage !== false) {
    failures.push('negative run advanced to package');
  }
  if (summary.v1b?.valueDisposition === 'advance_to_package') {
    failures.push('negative run disposition advanced to package');
  }
  if (summary.v1c !== null || summary.paper_project_intake !== null) {
    failures.push('negative run created downstream v1c or PaperProject intake artifacts');
  }
  return {
    run_id: summary.run_id,
    status: summary.status,
    readiness_status: summary.v1b?.topicValueReadinessStatus ?? null,
    value_disposition: summary.v1b?.valueDisposition ?? null,
    advanced_to_package: summary.v1b?.advancedToPackage ?? null,
    failures,
  };
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\|/gu, '\\|')
    .replace(/\s+/gu, ' ')
    .trim();
}

async function writeManualSpotCheck(runAudit) {
  const lines = [
    `# Topic Selection Real E2E Spot Check - ${QUALITY_RUN_ID}`,
    '',
    `Source run: ${runAudit.run_id}`,
    '',
    '| Rank | Literature | Role | Auto Precheck | Auto Issues | Guardrails | Evidence Excerpt | Manual Verdict | Notes |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of runAudit.selected_audit) {
    lines.push([
      item.rank,
      `${item.id} - ${item.title} (${item.year ?? 'n/a'})`,
      item.role,
      item.auto_precheck,
      item.issues.join('; '),
      item.guardrails.join(', '),
      item.evidence_excerpt,
      'pending',
      '',
    ].map(markdownCell).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }
  const filePath = path.join(QUALITY_DIR, 'manual-spot-check.md');
  await fs.writeFile(filePath, `${lines.join('\n')}\n`);
  return path.relative(REPO_ROOT, filePath);
}

await fs.mkdir(QUALITY_DIR, { recursive: true });

const expectedTargets = roleTargets(SAMPLE_SIZE);
const providerRuns = [];
if (EXISTING_PROVIDER_RUN_IDS.length > 0) {
  for (let index = 0; index < EXISTING_PROVIDER_RUN_IDS.length; index += 1) {
    const runId = EXISTING_PROVIDER_RUN_IDS[index];
    console.log(`[load] provider E2E ${index + 1}/${EXISTING_PROVIDER_RUN_IDS.length}: ${runId}`);
    providerRuns.push(await loadExistingE2e(runId, `provider-r${index + 1}`));
  }
} else {
  for (let index = 0; index < REPEATS; index += 1) {
    const runId = `${QUALITY_RUN_ID}-provider-r${index + 1}`;
    console.log(`[run] provider E2E ${index + 1}/${REPEATS}: ${runId}`);
    providerRuns.push(await runRealE2e(runId, {
      TOPIC_SELECTION_REAL_FLOW_MOCK_LLM: PROVIDER_LLM_MODE,
      TOPIC_SELECTION_REAL_QUALITY_NEGATIVE_MODE: '0',
      TOPIC_SELECTION_REAL_ALLOW_NON_ADVANCE_V1B: '0',
    }, `provider-r${index + 1}`));
  }
}

const selectedDetailsByRun = [];
const resourceSamplesByRun = [];
for (const run of providerRuns) {
  selectedDetailsByRun.push(await loadSelectedDetails(run.summary.run_id));
  resourceSamplesByRun.push(await loadResourceSample(run.summary.run_id));
}
const providerAudits = providerRuns.map((run, index) =>
  auditRun(run, selectedDetailsByRun[index], resourceSamplesByRun[index], expectedTargets));
const stability = auditStability(providerAudits);

let negativeRun = null;
let negativeAudit = null;
if (RUN_NEGATIVE) {
  const runId = EXISTING_NEGATIVE_RUN_ID ?? `${QUALITY_RUN_ID}-v1b-negative`;
  if (EXISTING_NEGATIVE_RUN_ID) {
    console.log(`[load] v1b quality negative: ${runId}`);
    negativeRun = await loadExistingE2e(runId, 'v1b-negative');
  } else {
    console.log(`[run] v1b quality negative: ${runId}`);
    negativeRun = await runRealE2e(runId, {
      TOPIC_SELECTION_REAL_FLOW_MOCK_LLM: '1',
      TOPIC_SELECTION_REAL_QUALITY_NEGATIVE_MODE: '1',
      TOPIC_SELECTION_REAL_ALLOW_NON_ADVANCE_V1B: '1',
    }, 'v1b-negative');
  }
  negativeAudit = auditNegativeRun(negativeRun);
}

const manualSpotCheckPath = await writeManualSpotCheck(providerAudits[0]);
const failures = [
  ...providerAudits.flatMap((run) => run.failures),
  ...stability.failures,
  ...(negativeAudit?.failures ?? []),
];
const warnings = providerAudits.flatMap((run) => run.warnings);

const qualitySummary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  quality_run_id: QUALITY_RUN_ID,
  artifact_dir: path.relative(REPO_ROOT, QUALITY_DIR),
  sample_size: SAMPLE_SIZE,
  repeats: providerRuns.length,
  expected_role_targets: expectedTargets,
  provider_llm_mode: PROVIDER_LLM_MODE === '1' ? 'deterministic_mock' : 'provider',
  reused_existing_runs: EXISTING_PROVIDER_RUN_IDS.length > 0,
  provider_runs: providerAudits.map((run, index) => ({
    run_id: run.run_id,
    status: run.status,
    outcome: run.outcome,
    llm_mode: run.llm_mode,
    literature_count: run.literature_count,
    sample_status: run.sample_status,
    sample_warnings: run.sample_warnings,
    sample_hash: run.sample_hash,
    role_counts: run.role_counts,
    paper_project_id: run.paper_project_id,
    bridge_id: run.bridge_id,
    log_path: providerRuns[index].log_path,
    summary_path: providerRuns[index].summary_path,
  })),
  stability,
  v1b_negative: negativeAudit ? {
    ...negativeAudit,
    log_path: negativeRun.log_path,
    summary_path: negativeRun.summary_path,
  } : null,
  manual_spot_check_path: manualSpotCheckPath,
  warnings,
  failures,
};

await writeJson(path.join(QUALITY_DIR, 'quality-summary.json'), qualitySummary);
console.log(JSON.stringify(qualitySummary, null, 2));
if (failures.length > 0) {
  process.exitCode = 1;
}
