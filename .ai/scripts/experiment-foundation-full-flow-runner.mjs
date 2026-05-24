#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SUPPORTED_MODES = new Set(['contract', 'preflight', 'deterministic', 'real-local-db', 'full']);
const RUNNER_VERSION = 't103-phase2';
const DEFAULT_BACKEND_SMOKE_PORT = 3310;
const DEFAULT_DESKTOP_SMOKE_PORT = 5189;

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const runId = args.runId ?? `experiment-foundation-full-flow-${timestamp()}`;
const artifactDir = path.resolve(args.artifactDir ?? path.join(REPO_ROOT, '.ai/.tmp/experiment-foundation-full-flow', runId));
const now = new Date().toISOString();
const manifest = buildLaneManifest({
  artifactDir,
  generatedAt: now,
  includeExternalCanary: args.includeExternalCanary,
  mode: args.mode,
  requireRealDb: args.requireRealDb,
  runId,
});

let preflightResult = null;
let status = 'NOT_IMPLEMENTED';
let exitCode = 2;
if (args.mode === 'contract') {
  status = 'CONTRACT_READY';
  exitCode = 0;
} else if (args.mode === 'preflight') {
  preflightResult = await runPreflight(args);
  status = preflightResult.status;
  exitCode = preflightResult.blockers.length > 0 ? 1 : 0;
}

await fs.mkdir(artifactDir, { recursive: true });
await fs.writeFile(path.join(artifactDir, '00-command-contract.md'), renderCommandContract(manifest), 'utf8');
await fs.writeFile(path.join(artifactDir, '01-lane-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(artifactDir, '02-validation-report.md'), renderValidationReport(manifest, status, preflightResult), 'utf8');
await fs.writeFile(path.join(artifactDir, '03-blockers.md'), renderBlockers(manifest, status, preflightResult), 'utf8');
if (preflightResult) {
  await fs.writeFile(path.join(artifactDir, '04-preflight.md'), renderPreflightMarkdown(preflightResult), 'utf8');
  await fs.writeFile(path.join(artifactDir, '05-preflight.json'), `${JSON.stringify(preflightResult, null, 2)}\n`, 'utf8');
}

const summary = {
  status,
  runner_version: RUNNER_VERSION,
  mode: args.mode,
  run_id: runId,
  artifact_dir: relativePath(artifactDir),
  report: relativePath(path.join(artifactDir, '02-validation-report.md')),
};
console.log(JSON.stringify(summary, null, 2));
process.exit(exitCode);

function parseArgs(rawArgs) {
  const parsed = {
    artifactDir: null,
    help: false,
    includeExternalCanary: false,
    mode: 'contract',
    requireRealDb: false,
    runId: null,
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const next = rawArgs[index + 1];
    if (arg === '--') {
      continue;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--mode' && next) {
      parsed.mode = next;
      index += 1;
    } else if (arg.startsWith('--mode=')) {
      parsed.mode = arg.slice('--mode='.length);
    } else if (arg === '--run-id' && next) {
      parsed.runId = next;
      index += 1;
    } else if (arg.startsWith('--run-id=')) {
      parsed.runId = arg.slice('--run-id='.length);
    } else if (arg === '--artifact-dir' && next) {
      parsed.artifactDir = next;
      index += 1;
    } else if (arg.startsWith('--artifact-dir=')) {
      parsed.artifactDir = arg.slice('--artifact-dir='.length);
    } else if (arg === '--include-external-canary') {
      parsed.includeExternalCanary = true;
    } else if (arg === '--require-real-db') {
      parsed.requireRealDb = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  if (!SUPPORTED_MODES.has(parsed.mode)) {
    throw new Error(`Unsupported --mode "${parsed.mode}".`);
  }
  if (parsed.runId !== null && !/^[A-Za-z0-9._-]+$/.test(parsed.runId)) {
    throw new Error('--run-id may only contain letters, numbers, dot, underscore, and hyphen.');
  }

  return parsed;
}

function buildLaneManifest(input) {
  return {
    runner_id: 'experiment-foundation-full-flow-runner',
    runner_version: RUNNER_VERSION,
    task_id: 'T-103',
    run_id: input.runId,
    generated_at: input.generatedAt,
    mode_requested: input.mode,
    artifact_dir: relativePath(input.artifactDir),
    phase_1_contract_only: true,
    flags: {
      include_external_canary: input.includeExternalCanary,
      require_real_db: input.requireRealDb,
    },
    artifact_files: [
      '00-command-contract.md',
      '01-lane-manifest.json',
      '02-validation-report.md',
      '03-blockers.md',
      ...(input.mode === 'preflight' ? ['04-preflight.md', '05-preflight.json'] : []),
    ],
    lanes: [
      {
        lane_id: 'preflight',
        default_enabled: true,
        phase_1_status: input.mode === 'preflight' ? 'implemented' : 'contract_only',
        purpose: 'Verify local prerequisites before expensive checks.',
        checks: [
          '.env.local exists',
          'DATABASE_URL resolves through local env loading',
          'Postgres is reachable',
          'repo migrations are applied',
          'LocalScript execution root and allowlist are configured',
          'backend and desktop smoke ports are available or selectable',
        ],
        future_failure_semantics: 'blocker',
      },
      {
        lane_id: 'deterministic',
        default_enabled: true,
        phase_1_status: 'contract_only',
        purpose: 'Run repeatable repo-local validation without cloud credentials.',
        command_ids: [
          'shared-typecheck',
          'shared-test',
          'backend-typecheck',
          'backend-test',
          'desktop-typecheck',
          'desktop-build',
          'desktop-smoke-e2e',
          'backend-t090-capability-harness',
          'backend-adjacent-workorder-guard',
          'governance-sync-dry-run',
          'governance-lint',
          'diff-check',
        ],
        future_failure_semantics: 'blocker',
      },
      {
        lane_id: 'real-local-db',
        default_enabled: input.requireRealDb,
        phase_1_status: 'contract_only',
        purpose: 'Prove local Postgres path with disposable schema or read-only smoke semantics.',
        checks: [
          'local DATABASE_URL is present',
          'smoke path avoids destructive operations on the developer schema',
          'registry/readiness/execution records can round-trip safely',
        ],
        future_failure_semantics: input.requireRealDb ? 'blocker' : 'skipped_unless_requested',
      },
      {
        lane_id: 'external-opt-in',
        default_enabled: input.includeExternalCanary,
        phase_1_status: 'contract_only',
        purpose: 'Reserve a real external provider/cloud canary lane without making it default.',
        checks: [
          'credentials and cost controls are explicitly enabled',
          'real external submit is opt-in',
          'result collection is separated from deterministic validation',
        ],
        future_failure_semantics: input.includeExternalCanary ? 'blocker' : 'skipped_unless_requested',
      },
    ],
    deterministic_command_inventory: [
      command('shared-typecheck', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/shared', 'typecheck']),
      command('shared-test', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/shared', 'test']),
      command('backend-typecheck', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/backend', 'typecheck']),
      command('backend-test', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/backend', 'test']),
      command('desktop-typecheck', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/desktop', 'typecheck']),
      command('desktop-build', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/desktop', 'build']),
      command('desktop-smoke-e2e', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/desktop', 'smoke:e2e']),
      command(
        'backend-t090-capability-harness',
        'deterministic',
        ['node', '--test', '--loader', 'ts-node/esm', 'src/services/experiment-foundation-capability-harness.test.ts'],
        'apps/backend',
      ),
      command(
        'backend-adjacent-workorder-guard',
        'deterministic',
        ['node', '--test', '--loader', 'ts-node/esm', 'src/services/paper-implementation-workorder-experiment-bridge-service.unit.test.ts'],
        'apps/backend',
      ),
      command(
        'governance-sync-dry-run',
        'deterministic',
        ['node', '.ai/scripts/ctl-project-governance.mjs', 'sync', '--dry-run', '--project', 'main'],
      ),
      command(
        'governance-lint',
        'deterministic',
        ['node', '.ai/scripts/ctl-project-governance.mjs', 'lint', '--check', '--project', 'main'],
      ),
      command('diff-check', 'deterministic', ['git', 'diff', '--check']),
    ],
  };
}

function command(commandId, laneId, argv, cwd = '.') {
  return {
    command_id: commandId,
    lane_id: laneId,
    cwd,
    argv,
    display: argv.join(' '),
    phase_1_execution: 'not_executed',
  };
}

function renderCommandContract(manifest) {
  return `${[
    '# Experiment Foundation Full-flow Runner Command Contract',
    '',
    `- Runner: \`${manifest.runner_id}\``,
    `- Version: \`${manifest.runner_version}\``,
    `- Task: \`${manifest.task_id}\``,
    `- Run ID: \`${manifest.run_id}\``,
    `- Mode requested: \`${manifest.mode_requested}\``,
    `- Artifact dir: \`${manifest.artifact_dir}\``,
    '',
    '## CLI',
    '```bash',
    'node .ai/scripts/experiment-foundation-full-flow-runner.mjs --mode contract',
    'pnpm experiment-foundation:full-flow -- --mode contract',
    '```',
    '',
    'Supported modes: `contract`, `preflight`, `deterministic`, `real-local-db`, `full`.',
    '',
    '`contract` writes the command contract. `preflight` runs lightweight local prerequisite checks. Other modes intentionally return `NOT_IMPLEMENTED` until later phases.',
    '',
    '## Lanes',
    ...manifest.lanes.map((lane) => [
      `### ${lane.lane_id}`,
      '',
      `- Default enabled: \`${lane.default_enabled}\``,
      `- Phase 1 status: \`${lane.phase_1_status}\``,
      `- Purpose: ${lane.purpose}`,
      `- Future failure semantics: \`${lane.future_failure_semantics}\``,
      '',
    ].join('\n')),
    '## Deterministic Command Inventory',
    '',
    ...manifest.deterministic_command_inventory.map((item) =>
      `- \`${item.command_id}\` (${item.cwd}): \`${item.display}\``
    ),
    '',
  ].join('\n')}\n`;
}

function renderValidationReport(manifest, reportStatus, preflightResult) {
  const laneRows = manifest.lanes
    .map((lane) => `| \`${lane.lane_id}\` | \`${lane.phase_1_status}\` | \`${lane.future_failure_semantics}\` |`)
    .join('\n');
  return `${[
    '# Experiment Foundation Full-flow Validation Report',
    '',
    `- Status: \`${reportStatus}\``,
    `- Runner version: \`${manifest.runner_version}\``,
    `- Run ID: \`${manifest.run_id}\``,
    `- Mode requested: \`${manifest.mode_requested}\``,
    `- Artifact dir: \`${manifest.artifact_dir}\``,
    '',
    preflightResult
      ? 'Preflight checks were executed. Deterministic, real DB smoke, and external canary lanes were not executed.'
      : 'No validation commands were executed. This report records the runner command contract only.',
    '',
    '| Lane | Phase 1 status | Future failure semantics |',
    '| --- | --- | --- |',
    laneRows,
    '',
    ...(preflightResult ? [
      '## Preflight Summary',
      '',
      `- Checks: \`${preflightResult.checks.length}\``,
      `- Passed: \`${preflightResult.summary.pass_count}\``,
      `- Warnings: \`${preflightResult.summary.warn_count}\``,
      `- Blockers: \`${preflightResult.summary.fail_count}\``,
      '',
    ] : []),
    '## Redaction',
    '',
    preflightResult
      ? '- Local environment files were read for key presence only; secret values are not stored.'
      : '- Environment variables were not loaded.',
    '- No `DATABASE_URL`, provider key, credential path, SDK payload, raw data, log, checkpoint, or artifact payload value is stored.',
    '',
  ].join('\n')}\n`;
}

function renderBlockers(manifest, reportStatus, preflightResult) {
  if (preflightResult) {
    if (preflightResult.blockers.length === 0) {
      return `${[
        '# Blockers',
        '',
        '- None.',
        ...(preflightResult.warnings.length ? ['', '## Warnings', '', ...preflightResult.warnings.map((item) => `- \`${item.code}\`: ${item.message}`)] : []),
        '',
      ].join('\n')}\n`;
    }
    return `${[
      '# Blockers',
      '',
      ...preflightResult.blockers.map((item) => `- \`${item.code}\`: ${item.message}`),
      '',
      '## Required Actions',
      '',
      ...preflightResult.blockers.map((item) => `- ${item.action}`),
      '',
    ].join('\n')}\n`;
  }

  if (reportStatus === 'CONTRACT_READY') {
    return `${[
      '# Blockers',
      '',
      '- None for T-103 Phase 1 command-contract generation.',
      '- Phase 2 must implement real preflight before `preflight`, `deterministic`, `real-local-db`, or `full` can succeed.',
      '',
    ].join('\n')}\n`;
  }

  return `${[
    '# Blockers',
    '',
    `- Requested mode \`${manifest.mode_requested}\` is not implemented in T-103 Phase 1.`,
    '- Re-run with `--mode contract` to generate the command contract successfully.',
    '- Implement Phase 2 preflight before enabling execution lanes.',
    '',
  ].join('\n')}\n`;
}

async function runPreflight(options) {
  const startedAt = new Date().toISOString();
  const envResolution = await loadLocalEnvironment();
  const checks = [];
  const rootEnvLocal = envResolution.files.find((file) => file.relative_path === '.env.local');
  checks.push(checkFromCondition(
    'env-local-present',
    Boolean(rootEnvLocal?.exists),
    '.env.local is present',
    '.env.local is missing',
    'Run `pnpm env:dev:compile` or `pnpm backend:dev:prisma:setup` to generate the local env file.',
  ));

  const databaseUrlCheck = checkDatabaseUrl(envResolution);
  checks.push(databaseUrlCheck);

  if (databaseUrlCheck.status !== 'fail') {
    checks.push(await checkPostgresConnectivity(envResolution.database_url));
    checks.push(await checkPrismaMigrationStatus(envResolution.env));
  }

  checks.push(await checkLocalScriptConfiguration(envResolution.env));
  checks.push(await checkPortAvailability('desktop-smoke-backend-port', envResolution.env.DESKTOP_SMOKE_BACKEND_PORT, DEFAULT_BACKEND_SMOKE_PORT));
  checks.push(await checkPortAvailability('desktop-smoke-renderer-port', envResolution.env.DESKTOP_SMOKE_PORT, DEFAULT_DESKTOP_SMOKE_PORT));
  checks.push(checkExternalCanaryReadiness(envResolution.env, options.includeExternalCanary));

  const blockers = checks
    .filter((check) => check.status === 'fail')
    .map((check) => ({
      code: check.check_id,
      message: check.summary,
      action: check.action,
    }));
  const warnings = checks
    .filter((check) => check.status === 'warn')
    .map((check) => ({
      code: check.check_id,
      message: check.summary,
      action: check.action,
    }));
  const summary = {
    pass_count: checks.filter((check) => check.status === 'pass').length,
    warn_count: warnings.length,
    fail_count: blockers.length,
  };

  return {
    runner_version: RUNNER_VERSION,
    mode: 'preflight',
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    status: blockers.length > 0
      ? 'PREFLIGHT_FAILED'
      : warnings.length > 0
        ? 'PREFLIGHT_PASSED_WITH_WARNINGS'
        : 'PREFLIGHT_PASSED',
    summary,
    environment: {
      env_files: envResolution.files,
      database_url: {
        present: Boolean(envResolution.database_url),
        source: envResolution.database_url_source,
        parse_status: databaseUrlCheck.status === 'fail' ? 'invalid_or_missing' : 'valid',
      },
      redaction: {
        database_url_value_stored: false,
        provider_key_values_stored: false,
        credential_paths_stored: false,
      },
    },
    checks,
    blockers,
    warnings,
  };
}

async function loadLocalEnvironment() {
  const env = { ...process.env };
  const sources = new Map(Object.keys(process.env).map((key) => [key, 'process.env']));
  const files = [
    path.join(REPO_ROOT, '.env.local'),
    path.join(REPO_ROOT, '.env'),
    path.join(REPO_ROOT, 'apps/backend/.env.local'),
    path.join(REPO_ROOT, 'apps/backend/.env'),
  ];
  const fileReports = [];

  for (const filePath of files) {
    let content = null;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }

    if (content === null) {
      fileReports.push({
        relative_path: relativePath(filePath),
        exists: false,
        loaded_key_count: 0,
      });
      continue;
    }

    let loadedKeyCount = 0;
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed || env[parsed.key] !== undefined) {
        continue;
      }
      env[parsed.key] = parsed.value;
      sources.set(parsed.key, relativePath(filePath));
      loadedKeyCount += 1;
    }
    fileReports.push({
      relative_path: relativePath(filePath),
      exists: true,
      loaded_key_count: loadedKeyCount,
    });
  }

  return {
    env,
    files: fileReports,
    database_url: env.DATABASE_URL?.trim() || null,
    database_url_source: sources.get('DATABASE_URL') ?? null,
  };
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const declaration = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
  const separatorIndex = declaration.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = declaration.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null;
  }
  return {
    key,
    value: parseEnvValue(declaration.slice(separatorIndex + 1).trim()),
  };
}

function parseEnvValue(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replaceAll('\\n', '\n')
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\');
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

function checkDatabaseUrl(envResolution) {
  if (!envResolution.database_url) {
    return failCheck(
      'database-url-present',
      'DATABASE_URL is missing after local env resolution',
      'Run `pnpm env:dev:compile` and ensure the database URL secret material exists.',
    );
  }

  try {
    const parsed = new URL(envResolution.database_url);
    if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
      return failCheck(
        'database-url-valid',
        'DATABASE_URL must use a PostgreSQL protocol',
        'Update the local database URL secret and re-run `pnpm env:dev:compile`.',
      );
    }
    return passCheck('database-url-valid', 'DATABASE_URL is present and parseable', {
      source: envResolution.database_url_source,
      protocol: parsed.protocol.replace(':', ''),
      raw_value_stored: false,
    });
  } catch {
    return failCheck(
      'database-url-valid',
      'DATABASE_URL is present but not parseable',
      'Update the local database URL secret and re-run `pnpm env:dev:compile`.',
    );
  }
}

async function checkPostgresConnectivity(databaseUrl) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  try {
    await withTimeout(prisma.$queryRawUnsafe('SELECT 1'), 7_500, 'Postgres connectivity timed out.');
    return passCheck('postgres-connectivity', 'Postgres accepted a lightweight connectivity query');
  } catch (error) {
    return failCheck(
      'postgres-connectivity',
      `Postgres connectivity failed: ${safeErrorMessage(error)}`,
      'Start local Postgres, verify `.env.local`, and confirm the configured database is reachable.',
    );
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function checkPrismaMigrationStatus(env) {
  const result = await runCommand(
    ['pnpm', 'exec', 'prisma', 'migrate', 'status', '--schema', 'prisma/schema.prisma'],
    { env, timeoutMs: 20_000 },
  );
  if (result.exit_code === 0) {
    return passCheck('prisma-migration-status', 'Prisma migration status completed successfully', {
      duration_ms: result.duration_ms,
      raw_output_stored: false,
    });
  }
  return failCheck(
    'prisma-migration-status',
    `Prisma migration status failed with exit code ${result.exit_code}`,
    'Inspect local migrations and run `pnpm db:dev:migrate` after confirming the target database.',
    {
      duration_ms: result.duration_ms,
      raw_output_stored: false,
    },
  );
}

async function checkLocalScriptConfiguration(env) {
  const root = env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ROOT?.trim()
    || path.join(REPO_ROOT, '.ai/.tmp/experiment-foundation-local-execution');
  const enabled = ['true', '1', 'yes'].includes((env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ENABLED ?? '').trim().toLowerCase());
  const allowlist = (env.EXPERIMENT_FOUNDATION_LOCAL_SCRIPT_ALLOWED_COMMANDS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const rootExists = await pathExists(root);
  const details = {
    execution_root_source: env.EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ROOT ? 'configured' : 'default',
    execution_root_exists: rootExists,
    execution_enabled: enabled,
    allowlist_configured: allowlist.length > 0,
    raw_paths_stored: false,
    allowlist_values_stored: false,
  };
  const warnings = [];
  if (!rootExists) {
    warnings.push('execution root does not exist yet');
  }
  if (!enabled) {
    warnings.push('local execution is not explicitly enabled outside test mode');
  }
  if (allowlist.length === 0) {
    warnings.push('local script command allowlist is empty');
  }
  if (warnings.length === 0) {
    return passCheck('localscript-configuration', 'LocalScript execution root and allowlist are configured', details);
  }
  return warnCheck(
    'localscript-configuration',
    `LocalScript configuration is incomplete: ${warnings.join('; ')}`,
    'Set EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ROOT, EXPERIMENT_FOUNDATION_LOCAL_EXECUTION_ENABLED=true, and EXPERIMENT_FOUNDATION_LOCAL_SCRIPT_ALLOWED_COMMANDS before real LocalScript execution.',
    details,
  );
}

async function checkPortAvailability(checkId, rawPort, fallbackPort) {
  const requestedPort = parsePort(rawPort, fallbackPort);
  const requestedAvailable = await isPortAvailable(requestedPort);
  if (requestedAvailable) {
    return passCheck(checkId, `Port ${requestedPort} is available`, {
      requested_port: requestedPort,
      available: true,
    });
  }

  const alternativePort = await findAvailablePort(requestedPort + 1, 50);
  if (alternativePort !== null) {
    return warnCheck(
      checkId,
      `Port ${requestedPort} is occupied; alternative port ${alternativePort} is available`,
      `Set ${checkId === 'desktop-smoke-backend-port' ? 'DESKTOP_SMOKE_BACKEND_PORT' : 'DESKTOP_SMOKE_PORT'}=${alternativePort} for the smoke run.`,
      {
        requested_port: requestedPort,
        available: false,
        suggested_port: alternativePort,
      },
    );
  }

  return failCheck(
    checkId,
    `Port ${requestedPort} is occupied and no nearby alternative was found`,
    'Stop the conflicting process or set an explicit smoke port environment variable.',
    {
      requested_port: requestedPort,
      available: false,
      suggested_port: null,
    },
  );
}

function checkExternalCanaryReadiness(env, includeExternalCanary) {
  if (!includeExternalCanary) {
    return passCheck('external-canary-default-skip', 'External canary is skipped by default', {
      include_external_canary: false,
    });
  }
  const hasAliyunCredentialPair = Boolean(
    (env.ALIYUN_ACCESS_KEY_ID && env.ALIYUN_ACCESS_KEY_SECRET)
      || (env.ALIBABA_CLOUD_ACCESS_KEY_ID && env.ALIBABA_CLOUD_ACCESS_KEY_SECRET),
  );
  if (hasAliyunCredentialPair) {
    return passCheck('external-canary-credentials', 'External canary credential key names are present', {
      include_external_canary: true,
      credential_values_stored: false,
    });
  }
  return failCheck(
    'external-canary-credentials',
    'External canary was requested but required Aliyun credential key names are missing',
    'Provide credential material through the approved local secret mechanism or rerun without `--include-external-canary`.',
    {
      include_external_canary: true,
      credential_values_stored: false,
    },
  );
}

function renderPreflightMarkdown(preflightResult) {
  const rows = preflightResult.checks
    .map((check) => `| \`${check.check_id}\` | \`${check.status}\` | ${check.summary} |`)
    .join('\n');
  return `${[
    '# Experiment Foundation Preflight',
    '',
    `- Status: \`${preflightResult.status}\``,
    `- Runner version: \`${preflightResult.runner_version}\``,
    `- Started: \`${preflightResult.started_at}\``,
    `- Finished: \`${preflightResult.finished_at}\``,
    `- Passed: \`${preflightResult.summary.pass_count}\``,
    `- Warnings: \`${preflightResult.summary.warn_count}\``,
    `- Blockers: \`${preflightResult.summary.fail_count}\``,
    '',
    '| Check | Status | Summary |',
    '| --- | --- | --- |',
    rows,
    '',
    '## Redaction',
    '',
    '- Raw `DATABASE_URL` values are not stored.',
    '- Provider key values and credential paths are not stored.',
    '- Prisma command output is summarized by exit status only.',
    '',
  ].join('\n')}\n`;
}

function checkFromCondition(checkId, condition, passSummary, failSummary, action, detail = {}) {
  return condition ? passCheck(checkId, passSummary, detail) : failCheck(checkId, failSummary, action, detail);
}

function passCheck(checkId, summary, detail = {}) {
  return {
    check_id: checkId,
    status: 'pass',
    summary,
    detail,
    action: null,
  };
}

function warnCheck(checkId, summary, action, detail = {}) {
  return {
    check_id: checkId,
    status: 'warn',
    summary,
    detail,
    action,
  };
}

function failCheck(checkId, summary, action, detail = {}) {
  return {
    check_id: checkId,
    status: 'fail',
    summary,
    detail,
    action,
  };
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parsePort(rawPort, fallbackPort) {
  const parsed = Number.parseInt(String(rawPort ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65_536 ? parsed : fallbackPort;
}

async function findAvailablePort(startPort, maxAttempts) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = startPort + offset;
    if (port >= 65_536) {
      return null;
    }
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function runCommand(argv, options) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const child = spawn(argv[0], argv.slice(1), {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, options.timeoutMs);
    child.on('error', () => {
      clearTimeout(timer);
      resolve({
        exit_code: 1,
        duration_ms: Date.now() - startedAt,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exit_code: code ?? 1,
        duration_ms: Date.now() - startedAt,
      });
    });
  });
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function safeErrorMessage(error) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/postgres(?:ql)?:\/\/\S+/giu, '[REDACTED_DATABASE_URL]')
    .replace(/(password|passwd|pwd)=([^&\s]+)/giu, '$1=[REDACTED]')
    .slice(0, 220);
}

function printHelp() {
  console.log([
    'Usage:',
    '  node .ai/scripts/experiment-foundation-full-flow-runner.mjs [options]',
    '  pnpm experiment-foundation:full-flow -- [options]',
    '',
    'Options:',
    '  --mode <contract|preflight|deterministic|real-local-db|full>   Default: contract',
    '  --run-id <id>                                                   Evidence run id',
    '  --artifact-dir <path>                                           Default: .ai/.tmp/experiment-foundation-full-flow/<run-id>',
    '  --include-external-canary                                       Include future external opt-in lane in manifest',
    '  --require-real-db                                               Treat future real-local-db lane as required',
    '  --help, -h                                                      Show help',
    '',
    'T-103 Phase 2 supports contract and lightweight preflight modes.',
  ].join('\n'));
}

function relativePath(value) {
  return path.relative(REPO_ROOT, value).replaceAll('\\', '/') || '.';
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
