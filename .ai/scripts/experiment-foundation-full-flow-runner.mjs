#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SUPPORTED_MODES = new Set(['contract', 'preflight', 'deterministic', 'real-local-db', 'full']);
const RUNNER_VERSION = 't103-phase1';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const runId = args.runId ?? `experiment-foundation-full-flow-${timestamp()}`;
const artifactDir = path.resolve(args.artifactDir ?? path.join(REPO_ROOT, '.ai/.tmp/experiment-foundation-full-flow', runId));
const now = new Date().toISOString();
const status = args.mode === 'contract' ? 'CONTRACT_READY' : 'NOT_IMPLEMENTED';
const exitCode = args.mode === 'contract' ? 0 : 2;
const manifest = buildLaneManifest({
  artifactDir,
  generatedAt: now,
  includeExternalCanary: args.includeExternalCanary,
  mode: args.mode,
  requireRealDb: args.requireRealDb,
  runId,
});

await fs.mkdir(artifactDir, { recursive: true });
await fs.writeFile(path.join(artifactDir, '00-command-contract.md'), renderCommandContract(manifest), 'utf8');
await fs.writeFile(path.join(artifactDir, '01-lane-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(artifactDir, '02-validation-report.md'), renderValidationReport(manifest, status), 'utf8');
await fs.writeFile(path.join(artifactDir, '03-blockers.md'), renderBlockers(manifest, status), 'utf8');

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
    ],
    lanes: [
      {
        lane_id: 'preflight',
        default_enabled: true,
        phase_1_status: 'contract_only',
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
    'Supported future modes: `contract`, `preflight`, `deterministic`, `real-local-db`, `full`.',
    '',
    'Phase 1 only executes `contract` mode. Other modes intentionally return `NOT_IMPLEMENTED`.',
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

function renderValidationReport(manifest, reportStatus) {
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
    'No validation commands were executed in T-103 Phase 1. This report records the runner command contract only.',
    '',
    '| Lane | Phase 1 status | Future failure semantics |',
    '| --- | --- | --- |',
    laneRows,
    '',
    '## Redaction',
    '',
    '- Environment variables were not loaded.',
    '- No `DATABASE_URL`, provider key, credential path, SDK payload, raw data, log, checkpoint, or artifact payload value is stored.',
    '',
  ].join('\n')}\n`;
}

function renderBlockers(manifest, reportStatus) {
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
    'T-103 Phase 1 only supports successful contract generation.',
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
