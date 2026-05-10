#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MIN_RECALL_AT_5 = 0.75;
const DEFAULT_MAX_WARNING_RATE = 0.25;

function parseArgs(argv) {
  const args = {
    report: null,
    audit: null,
    mode: 'current-scope',
    minRecallAt5: DEFAULT_MIN_RECALL_AT_5,
    maxWarningRate: DEFAULT_MAX_WARNING_RATE,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--report' && next) {
      args.report = next;
      index += 1;
    } else if (arg === '--audit' && next) {
      args.audit = next;
      index += 1;
    } else if (arg === '--mode' && next) {
      args.mode = next;
      index += 1;
    } else if (arg === '--min-recall-at-5' && next) {
      args.minRecallAt5 = Number(next);
      index += 1;
    } else if (arg === '--max-warning-rate' && next) {
      args.maxWarningRate = Number(next);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }
  if (!args.report) {
    throw new Error('--report is required.');
  }
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node .ai/scripts/literature-e2e-cutover-gate.mjs --report <report.json> [--audit <report-audit.json>]',
    '',
    'Options:',
    '  --mode <current-scope|broad-cutover>  Default: current-scope',
    '  --min-recall-at-5 <number>            Default: 0.75',
    '  --max-warning-rate <number>           Default: 0.25',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = path.resolve(args.report);
  const auditPath = args.audit
    ? path.resolve(args.audit)
    : path.join(path.dirname(reportPath), 'report-audit.json');
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const audit = await readOptionalJson(auditPath);
  const result = evaluateCutover(report, audit, args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

async function readOptionalJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function evaluateCutover(report, audit, args) {
  const metrics = isRecord(report.metrics) ? report.metrics : {};
  const processableSampleCount = readCountMetric(metrics.processable_sample_count, metrics.sample_count);
  const expectedBlockerCount = readNumber(metrics.expected_blocker_count);
  const blockers = [];
  const warnings = [];
  if (readString(report.status) !== 'PASS') {
    blockers.push(`source report status is ${readString(report.status) || 'missing'}`);
  }
  if (readNumber(metrics.download_success_count) < processableSampleCount) {
    blockers.push('not every processable sample downloaded successfully');
  }
  if (readNumber(metrics.parser_success_count) < processableSampleCount) {
    blockers.push('not every processable sample parsed successfully');
  }
  if (readNumber(metrics.key_content_success_count) < processableSampleCount) {
    blockers.push('not every processable sample reached KEY_CONTENT_READY');
  }
  if (readNumber(metrics.indexed_success_count) < processableSampleCount) {
    blockers.push('not every processable sample reached INDEXED');
  }
  if (readNumber(metrics.expected_blocker_success_count) < expectedBlockerCount) {
    blockers.push('not every expected blocker behaved as expected');
  }
  if (readNumber(metrics.recall_at_5) < args.minRecallAt5) {
    blockers.push(`recall@5 ${readNumber(metrics.recall_at_5)} is below ${args.minRecallAt5}`);
  }
  if (readNumber(metrics.negative_query_success_count) < readNumber(metrics.negative_query_count)) {
    blockers.push('not every negative retrieval query excluded the expected gated sample');
  }
  if (readNumber(metrics.key_content_warning_rate) > args.maxWarningRate) {
    blockers.push(`key-content warning rate ${readNumber(metrics.key_content_warning_rate)} is above ${args.maxWarningRate}`);
  }
  if (readNumber(metrics.degraded_retrieval_count) > 0) {
    blockers.push('retrieval used degraded mode for at least one query');
  }

  if (audit) {
    const auditFindings = Array.isArray(audit.findings) ? audit.findings : [];
    const auditErrors = auditFindings.filter((finding) => readString(finding.severity) === 'error');
    if (auditErrors.length > 0) {
      blockers.push(`audit has ${auditErrors.length} error finding(s)`);
    }
    const auditWarnings = auditFindings.filter((finding) => readString(finding.severity) === 'warning');
    if (args.mode === 'broad-cutover' && auditWarnings.length > 0) {
      blockers.push(`broad cutover requires zero audit warnings; observed ${auditWarnings.length}`);
    } else if (auditWarnings.length > 0) {
      warnings.push(`audit has ${auditWarnings.length} warning finding(s); current-scope gate may pass but broad cutover should not`);
    }
  } else {
    warnings.push('no report audit was available; run literature-e2e-report-audit before cutover decisions');
  }

  return {
    status: blockers.length === 0 ? 'PASS' : 'FAIL',
    mode: args.mode,
    report_status: readString(report.status),
    key_content_method: readString(report.key_content_method),
    metrics: {
      sample_count: readNumber(metrics.sample_count),
      processable_sample_count: processableSampleCount,
      expected_blocker_count: expectedBlockerCount,
      query_count: readNumber(metrics.query_count),
      positive_query_count: readNumber(metrics.positive_query_count),
      negative_query_count: readNumber(metrics.negative_query_count),
      recall_at_5: readNumber(metrics.recall_at_5),
      key_content_warning_rate: readNumber(metrics.key_content_warning_rate),
      degraded_retrieval_count: readNumber(metrics.degraded_retrieval_count),
    },
    blockers,
    warnings,
  };
}

function readString(value) {
  return typeof value === 'string' ? value : '';
}

function readNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readCountMetric(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : readNumber(fallback);
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
