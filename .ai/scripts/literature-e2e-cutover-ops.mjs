#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MIN_RECALL_AT_5 = 0.75;
const DEFAULT_MIN_MRR_AT_5 = 0.75;
const DEFAULT_MIN_NDCG_AT_5 = 0.75;
const DEFAULT_MAX_WARNING_RATE = 0.25;

function parseArgs(argv) {
  const args = {
    operation: 'preflight',
    mode: 'broad-cutover',
    reports: [],
    audits: [],
    ciEvidence: null,
    outDir: null,
    confirm: null,
    reason: null,
    requireConsecutive: 2,
    minRecallAt5: DEFAULT_MIN_RECALL_AT_5,
    minMrrAt5: DEFAULT_MIN_MRR_AT_5,
    minNdcgAt5: DEFAULT_MIN_NDCG_AT_5,
    maxWarningRate: DEFAULT_MAX_WARNING_RATE,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--operation' && next) {
      args.operation = next;
      index += 1;
    } else if (arg === '--mode' && next) {
      args.mode = next;
      index += 1;
    } else if (arg === '--report' && next) {
      args.reports.push(next);
      index += 1;
    } else if (arg === '--audit' && next) {
      args.audits.push(next);
      index += 1;
    } else if (arg === '--ci-evidence' && next) {
      args.ciEvidence = next;
      index += 1;
    } else if (arg === '--out-dir' && next) {
      args.outDir = next;
      index += 1;
    } else if (arg === '--confirm' && next) {
      args.confirm = next;
      index += 1;
    } else if (arg === '--reason' && next) {
      args.reason = next;
      index += 1;
    } else if (arg === '--require-consecutive' && next) {
      args.requireConsecutive = Number(next);
      index += 1;
    } else if (arg === '--min-recall-at-5' && next) {
      args.minRecallAt5 = Number(next);
      index += 1;
    } else if (arg === '--min-mrr-at-5' && next) {
      args.minMrrAt5 = Number(next);
      index += 1;
    } else if (arg === '--min-ndcg-at-5' && next) {
      args.minNdcgAt5 = Number(next);
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
  if (!['preflight', 'cutover', 'rollback'].includes(args.operation)) {
    throw new Error('--operation must be preflight, cutover, or rollback.');
  }
  if (args.operation !== 'rollback' && args.reports.length === 0) {
    throw new Error('--report is required for preflight and cutover operations.');
  }
  args.outDir = path.resolve(args.outDir ?? defaultOutDir(args));
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node .ai/scripts/literature-e2e-cutover-ops.mjs --operation <preflight|cutover|rollback> --report <report.json> [--report <previous.json>]',
    '',
    'Options:',
    '  --mode <current-scope|broad-cutover>  Default: broad-cutover',
    '  --audit <report-audit.json>           May be repeated; defaults to report-dir/report-audit.json',
    '  --ci-evidence <json>                  JSON evidence that deterministic CI/mock checks passed',
    '  --require-consecutive <n>             Default: 2',
    '  --min-recall-at-5 <number>            Default: 0.75',
    '  --min-mrr-at-5 <number>               Default: 0.75',
    '  --min-ndcg-at-5 <number>              Default: 0.75',
    '  --max-warning-rate <number>           Default: 0.25',
    '  --confirm <run_id>                    Required for --operation cutover',
    '  --reason <text>                       Required for --operation rollback',
    '  --out-dir <path>                      Default: latest report dir',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await buildOperationResult(args);
  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, `cutover-${args.operation}.json`);
  const mdPath = path.join(args.outDir, `cutover-${args.operation}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await fs.writeFile(mdPath, renderMarkdown(result), 'utf8');
  console.log(JSON.stringify({
    status: result.status,
    operation: result.operation,
    blocker_count: result.blockers.length,
    warning_count: result.warnings.length,
    out_json: jsonPath,
    out_md: mdPath,
  }, null, 2));
  process.exit(result.status === 'PASS' ? 0 : 1);
}

async function buildOperationResult(args) {
  if (args.operation === 'rollback') {
    const blockers = [];
    if (!readString(args.reason)) {
      blockers.push('rollback requires --reason so the evidence artifact explains why default behavior should be reverted');
    }
    return {
      generated_at: new Date().toISOString(),
      operation: args.operation,
      mode: args.mode,
      status: blockers.length === 0 ? 'PASS' : 'FAIL',
      decision: blockers.length === 0 ? 'ROLLBACK_PLAN_READY' : 'ROLLBACK_BLOCKED',
      reports: [],
      ci_evidence: null,
      blockers,
      warnings: [],
      rollback_plan: [
        'Set literature full-chain cutover/default toggles back to the previous known-good profile.',
        'Keep collection import enabled; pause unattended fulltext/content backfills until one smoke run passes.',
        'Run current-scope smoke E2E, report audit, and cutover gate before re-enabling broad default behavior.',
        'Record the rollback report under the active T-041 verification notes.',
      ],
      reason: args.reason,
    };
  }

  const reportRows = [];
  for (let index = 0; index < args.reports.length; index += 1) {
    const reportPath = path.resolve(args.reports[index]);
    const auditPath = args.audits[index]
      ? path.resolve(args.audits[index])
      : path.join(path.dirname(reportPath), 'report-audit.json');
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    const audit = await readOptionalJson(auditPath);
    reportRows.push(evaluateReport(report, audit, {
      reportPath,
      auditPath,
      mode: args.mode,
      minRecallAt5: args.minRecallAt5,
      minMrrAt5: args.minMrrAt5,
      minNdcgAt5: args.minNdcgAt5,
      maxWarningRate: args.maxWarningRate,
    }));
  }

  const blockers = [];
  const warnings = [];
  const latest = reportRows[reportRows.length - 1] ?? null;
  const consecutiveRows = reportRows.slice(-Math.max(1, args.requireConsecutive));
  if (reportRows.length < args.requireConsecutive) {
    blockers.push(`requires ${args.requireConsecutive} consecutive report(s), observed ${reportRows.length}`);
  }
  if (consecutiveRows.some((row) => row.status !== 'PASS')) {
    blockers.push('not every required consecutive report passes cutover gates');
  }
  const ciEvidence = args.ciEvidence ? await readCiEvidence(path.resolve(args.ciEvidence)) : null;
  if (!ciEvidence) {
    const message = 'no CI/mock evidence file supplied; deterministic suite status is not attached to this operation';
    if (args.operation === 'cutover') {
      blockers.push(message);
    } else {
      warnings.push(message);
    }
  } else if (ciEvidence.status !== 'PASS') {
    blockers.push(`CI/mock evidence status is ${ciEvidence.status}`);
  }
  if (args.operation === 'cutover') {
    if (!latest?.run_id || args.confirm !== latest.run_id) {
      blockers.push(`cutover requires --confirm ${latest?.run_id ?? '<latest-run-id>'}`);
    }
  }

  for (const row of reportRows) {
    blockers.push(...row.blockers.map((item) => `${row.run_id}: ${item}`));
    warnings.push(...row.warnings.map((item) => `${row.run_id}: ${item}`));
  }

  const status = blockers.length === 0 ? 'PASS' : 'FAIL';
  return {
    generated_at: new Date().toISOString(),
    operation: args.operation,
    mode: args.mode,
    status,
    decision: status === 'PASS'
      ? args.operation === 'cutover'
        ? 'CUTOVER_READY'
        : 'PREFLIGHT_READY'
      : 'BLOCKED',
    reports: reportRows,
    ci_evidence: ciEvidence,
    blockers,
    warnings,
    rollback_plan: [
      'Keep the previous default profile and cutover artifact until a post-cutover smoke run passes.',
      'If post-cutover smoke fails, restore the previous settings/profile and pause unattended backfill jobs.',
      'Run lightweight E2E plus report audit before allowing new broad-cutover attempts.',
    ],
  };
}

function evaluateReport(report, audit, options) {
  const metrics = isRecord(report.metrics) ? report.metrics : {};
  const blockers = [];
  const warnings = [];
  const processable = readCountMetric(metrics.processable_sample_count, metrics.sample_count);
  const expectedBlockers = readNumber(metrics.expected_blocker_count);
  if (readString(report.status) !== 'PASS') {
    blockers.push(`source report status is ${readString(report.status) || 'missing'}`);
  }
  if (readNumber(metrics.download_success_count) < processable) {
    blockers.push('not every processable sample downloaded successfully');
  }
  if (readNumber(metrics.parser_success_count) < processable) {
    blockers.push('not every processable sample parsed successfully');
  }
  if (readNumber(metrics.key_content_success_count) < processable) {
    blockers.push('not every processable sample reached KEY_CONTENT_READY');
  }
  if (readNumber(metrics.indexed_success_count) < processable) {
    blockers.push('not every processable sample reached INDEXED');
  }
  if (readNumber(metrics.expected_blocker_success_count) < expectedBlockers) {
    blockers.push('not every expected blocker behaved as expected');
  }
  if (readNumber(metrics.recall_at_5) < options.minRecallAt5) {
    blockers.push(`recall@5 is below ${options.minRecallAt5}`);
  }
  if (readNumber(metrics.positive_query_count) > 0 && readNumber(metrics.mrr_at_5) < options.minMrrAt5) {
    blockers.push(`mrr@5 is below ${options.minMrrAt5}`);
  }
  if (readNumber(metrics.positive_query_count) > 0 && readNumber(metrics.ndcg_at_5) < options.minNdcgAt5) {
    blockers.push(`ndcg@5 is below ${options.minNdcgAt5}`);
  }
  if (readNumber(metrics.blind_query_count) > 0 && readNumber(metrics.blind_recall_at_5) < options.minRecallAt5) {
    blockers.push(`blind recall@5 is below ${options.minRecallAt5}`);
  }
  if (readNumber(metrics.key_content_warning_rate) > options.maxWarningRate) {
    blockers.push(`key-content warning rate is above ${options.maxWarningRate}`);
  }
  if (readNumber(metrics.degraded_retrieval_count) > 0) {
    blockers.push('retrieval used degraded mode');
  }
  if (readNumber(metrics.top5_duplicate_work_count) > 0) {
    blockers.push('retrieval top5 contains duplicate work hits');
  }
  if (!audit) {
    warnings.push('report audit missing');
  } else {
    const findings = Array.isArray(audit.findings) ? audit.findings : [];
    const errors = findings.filter((finding) => readString(finding.severity) === 'error');
    const auditWarnings = findings.filter((finding) => readString(finding.severity) === 'warning');
    if (errors.length > 0) {
      blockers.push(`audit has ${errors.length} error finding(s)`);
    }
    if (options.mode === 'broad-cutover' && auditWarnings.length > 0) {
      blockers.push(`broad cutover requires zero audit warnings; observed ${auditWarnings.length}`);
    } else if (auditWarnings.length > 0) {
      warnings.push(`audit has ${auditWarnings.length} warning finding(s)`);
    }
  }
  return {
    run_id: readString(report.run_id),
    report_path: options.reportPath,
    audit_path: options.auditPath,
    status: blockers.length === 0 ? 'PASS' : 'FAIL',
    report_status: readString(report.status),
    metrics: {
      sample_count: readNumber(metrics.sample_count),
      processable_sample_count: processable,
      expected_blocker_count: expectedBlockers,
      query_count: readNumber(metrics.query_count),
      positive_query_count: readNumber(metrics.positive_query_count),
      recall_at_5: readNumber(metrics.recall_at_5),
      mrr_at_5: readNumber(metrics.mrr_at_5),
      ndcg_at_5: readNumber(metrics.ndcg_at_5),
      blind_query_count: readNumber(metrics.blind_query_count),
      blind_recall_at_5: readNumber(metrics.blind_recall_at_5),
      key_content_warning_rate: readNumber(metrics.key_content_warning_rate),
      degraded_retrieval_count: readNumber(metrics.degraded_retrieval_count),
      top5_duplicate_work_count: readNumber(metrics.top5_duplicate_work_count),
    },
    blockers,
    warnings,
  };
}

async function readCiEvidence(filePath) {
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  if (readString(raw.status)) {
    return {
      status: readString(raw.status),
      path: filePath,
      checks: Array.isArray(raw.checks) ? raw.checks : [],
    };
  }
  const checks = Array.isArray(raw.checks) ? raw.checks : [];
  return {
    status: checks.length > 0 && checks.every((check) => readString(check.status) === 'PASS') ? 'PASS' : 'FAIL',
    path: filePath,
    checks,
  };
}

async function readOptionalJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function defaultOutDir(args) {
  const latestReport = args.reports[args.reports.length - 1];
  return latestReport ? path.dirname(path.resolve(latestReport)) : process.cwd();
}

function renderMarkdown(result) {
  return `${[
    '# Literature Cutover Operation',
    '',
    `- operation: \`${result.operation}\``,
    `- mode: \`${result.mode}\``,
    `- status: \`${result.status}\``,
    `- decision: \`${result.decision}\``,
    `- generated_at: \`${result.generated_at}\``,
    '',
    '## Reports',
    '',
    result.reports.length
      ? result.reports.map((row) => `- \`${row.run_id}\`: \`${row.status}\` recall@5=\`${row.metrics.recall_at_5}\` mrr@5=\`${row.metrics.mrr_at_5}\` nDCG@5=\`${row.metrics.ndcg_at_5}\` blind_recall@5=\`${row.metrics.blind_recall_at_5}\``).join('\n')
      : '- None',
    '',
    '## Blockers',
    '',
    result.blockers.length ? result.blockers.map((item) => `- ${item}`).join('\n') : '- None',
    '',
    '## Warnings',
    '',
    result.warnings.length ? result.warnings.map((item) => `- ${item}`).join('\n') : '- None',
    '',
    '## Rollback Plan',
    '',
    result.rollback_plan.map((item) => `- ${item}`).join('\n'),
    '',
  ].join('\n')}\n`;
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
