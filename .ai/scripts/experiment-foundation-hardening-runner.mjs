#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const RUNNER_VERSION = 't106-phase6-phase7';
const SUPPORTED_MODES = new Set([
  'contract',
  'deterministic',
  'real-local-db',
  'ui-definition',
  'external-gate',
  'full',
]);
const SUPPORTED_TRUE_EXTERNAL_CANARY_PROVIDERS = new Set(['aliyun_pai_dlc']);
const COMMAND_OUTPUT_TAIL_CHARS = 8_000;
const ROOT_ENV_LOCAL_PATH = '.env.local';
const UI_FLOW_CONTRACT_PATH = 'dev-docs/active/experiment-foundation-real-interaction-hardening/07-ui-workbench-flow-contract.md';
const USE_PROCESS_GROUP_SIGNALS = process.platform !== 'win32';

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  printHelp();
  process.exit(2);
}

if (args.help) {
  printHelp();
  process.exit(0);
}

const runId = args.runId ?? `experiment-foundation-hardening-${timestamp()}`;
const artifactDir = path.resolve(args.artifactDir ?? path.join(REPO_ROOT, '.ai/.tmp/experiment-foundation-hardening', runId));
await fs.mkdir(artifactDir, { recursive: true });

const manifest = buildManifest({
  artifactDir,
  includeTrueExternalCanary: args.includeTrueExternalCanary,
  mode: args.mode,
  requireRealDb: args.requireRealDb,
  runId,
});

let commandResult = null;
let uiDefinitionResult = null;
let externalCanaryGateResult = null;
let status = 'CONTRACT_READY';
let exitCode = 0;

if (args.mode === 'contract') {
  status = 'CONTRACT_READY';
} else if (args.mode === 'ui-definition') {
  uiDefinitionResult = await runUiDefinitionCheck();
  status = uiDefinitionResult.blockers.length > 0 ? 'UI_DEFINITION_FAILED' : 'UI_DEFINITION_PASSED';
  exitCode = uiDefinitionResult.blockers.length > 0 ? 1 : 0;
} else if (args.mode === 'external-gate') {
  externalCanaryGateResult = await runExternalCanaryGate(args);
  status = externalCanaryGateResult.blockers.length > 0
    ? 'TRUE_EXTERNAL_CANARY_BLOCKED'
    : externalCanaryGateResult.status === 'skipped'
      ? 'TRUE_EXTERNAL_CANARY_SKIPPED'
      : 'TRUE_EXTERNAL_CANARY_GATE_READY';
  exitCode = externalCanaryGateResult.blockers.length > 0 ? 1 : 0;
} else if (args.mode === 'deterministic') {
  uiDefinitionResult = await runUiDefinitionCheck();
  commandResult = await runCommands(manifest.command_inventory.filter((item) => item.mode === 'deterministic'));
  const blockers = collectBlockers(uiDefinitionResult, commandResult, null);
  status = blockers.length > 0 ? 'DETERMINISTIC_FAILED' : 'DETERMINISTIC_PASSED';
  exitCode = blockers.length > 0 ? 1 : 0;
} else if (args.mode === 'real-local-db') {
  commandResult = await runCommands(manifest.command_inventory.filter((item) => item.mode === 'real-local-db'));
  const blockers = collectBlockers(null, commandResult, null);
  status = blockers.length > 0 ? 'REAL_LOCAL_DB_FAILED' : 'REAL_LOCAL_DB_PASSED';
  exitCode = blockers.length > 0 ? 1 : 0;
} else if (args.mode === 'full') {
  uiDefinitionResult = await runUiDefinitionCheck();
  commandResult = await runCommands(manifest.command_inventory.filter((item) => item.mode === 'deterministic' || item.mode === 'real-local-db'));
  externalCanaryGateResult = await runExternalCanaryGate(args);
  const blockers = collectBlockers(uiDefinitionResult, commandResult, externalCanaryGateResult);
  status = blockers.length > 0 ? 'FULL_FAILED' : 'FULL_PASSED';
  exitCode = blockers.length > 0 ? 1 : 0;
}

manifest.artifact_files = buildArtifactFiles({ commandResult, uiDefinitionResult, externalCanaryGateResult });
await writeArtifacts({ artifactDir, commandResult, externalCanaryGateResult, manifest, status, uiDefinitionResult });

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
    includeTrueExternalCanary: false,
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
    } else if (arg === '--include-true-external-canary') {
      parsed.includeTrueExternalCanary = true;
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

function buildManifest(input) {
  return {
    runner_id: 'experiment-foundation-hardening-runner',
    runner_version: RUNNER_VERSION,
    task_id: 'T-106',
    run_id: input.runId,
    generated_at: new Date().toISOString(),
    mode_requested: input.mode,
    artifact_dir: relativePath(input.artifactDir),
    flags: {
      include_true_external_canary: input.includeTrueExternalCanary,
      require_real_db: input.requireRealDb,
    },
    artifact_files: buildArtifactFiles({}),
    lanes: [
      lane('deterministic', true, 'implemented', 'Repeatable repo-local hardening for shared schemas, backend execution, harness recovery, and PaperImplementation seams.', 'blocker'),
      lane('real-local-db', input.requireRealDb || ['real-local-db', 'full'].includes(input.mode), 'implemented_opt_in', 'Disposable Postgres parity for registry, readiness, promotion, execution, result, and evidence transitions.', 'blocker_when_requested'),
      lane('ui-definition', true, 'implemented_docs_check', 'Validate the desktop workbench flow contract without implementing renderer automation in this lane.', 'blocker'),
      lane('local-fake-external', true, 'implemented_via_deterministic_tests', 'Exercise external-adapter behavior through deterministic fake/local providers.', 'blocker'),
      lane('true-external-canary', input.includeTrueExternalCanary, 'implemented_gate_only', 'Gate real external canary prerequisites without calling a real cloud provider in this runner phase.', input.includeTrueExternalCanary ? 'blocker' : 'skipped_unless_requested'),
      lane('governance', true, 'implemented', 'Keep task/project governance and diff hygiene aligned.', 'blocker'),
    ],
    command_inventory: [
      command('shared-experiment-foundation-schema-test', 'deterministic', 'deterministic', ['node', '--test', '--loader', 'ts-node/esm', 'src/research-lifecycle/experiment-foundation-contracts.schema.test.ts'], 'packages/shared', 180_000, input.mode),
      command('backend-execution-service-hardening', 'deterministic', 'deterministic', ['node', '--test', '--loader', 'ts-node/esm', 'src/services/experiment-foundation-execution-service.unit.test.ts'], 'apps/backend', 180_000, input.mode),
      command('backend-capability-harness', 'deterministic', 'deterministic', ['node', '--test', '--loader', 'ts-node/esm', 'src/services/experiment-foundation-capability-harness.test.ts'], 'apps/backend', 180_000, input.mode),
      command('backend-paper-implementation-live-seam', 'deterministic', 'deterministic', ['node', '--test', '--loader', 'ts-node/esm', 'src/services/paper-implementation-live-experiment-adapter-service.unit.test.ts'], 'apps/backend', 120_000, input.mode),
      command('backend-paper-implementation-workorder-seam', 'deterministic', 'deterministic', ['node', '--test', '--loader', 'ts-node/esm', 'src/services/paper-implementation-workorder-experiment-bridge-service.unit.test.ts'], 'apps/backend', 120_000, input.mode),
      command('backend-typecheck', 'deterministic', 'deterministic', ['pnpm', '--filter', '@paper-engineering-assistant/backend', 'typecheck'], '.', 240_000, input.mode),
      command('governance-sync-dry-run', 'governance', 'deterministic', ['node', '.ai/scripts/ctl-project-governance.mjs', 'sync', '--dry-run', '--project', 'main'], '.', 60_000, input.mode),
      command('governance-lint', 'governance', 'deterministic', ['node', '.ai/scripts/ctl-project-governance.mjs', 'lint', '--check', '--project', 'main'], '.', 60_000, input.mode),
      command('diff-check', 'governance', 'deterministic', ['git', 'diff', '--check'], '.', 60_000, input.mode),
      command('backend-prisma-parity-disposable-db', 'real-local-db', 'real-local-db', ['node', '--env-file=../../.env.local', '--test', '--loader', 'ts-node/esm', 'src/services/experiment-foundation-prisma-parity.integration.test.ts'], 'apps/backend', 300_000, input.mode, {
        EXPERIMENT_FOUNDATION_PRISMA_PARITY: '1',
      }),
    ],
    true_external_canary_contract: {
      default_behavior: 'skipped',
      opt_in_flag: '--include-true-external-canary',
      execution_policy: 'gate_only_in_t106_phase6_phase7',
      required_env_key_names: trueExternalCanaryRequiredKeys(null),
      provider_specific_required_env_key_names: {
        aliyun_pai_dlc: trueExternalCanaryRequiredKeys('aliyun_pai_dlc'),
      },
      artifact_policy: 'Store key presence, provider kind, blockers, refs, hashes, summaries, and cleanup status only. Never store credentials, raw provider logs, SDK payloads, raw data, checkpoints, or unredacted object paths.',
    },
  };
}

function lane(laneId, defaultEnabled, implementationStatus, purpose, failureSemantics) {
  return {
    lane_id: laneId,
    default_enabled: defaultEnabled,
    implementation_status: implementationStatus,
    purpose,
    failure_semantics: failureSemantics,
  };
}

function command(commandId, laneId, mode, argv, cwd, timeoutMs, requestedMode, env = {}) {
  const willExecute = requestedMode === mode || (requestedMode === 'full' && ['deterministic', 'real-local-db'].includes(mode));
  return {
    command_id: commandId,
    lane_id: laneId,
    mode,
    cwd,
    argv,
    display: argv.join(' '),
    timeout_ms: timeoutMs,
    env_keys: Object.keys(env).sort(),
    execution_status: willExecute ? 'executed_in_this_run' : 'not_executed_in_this_run',
    env,
  };
}

function buildArtifactFiles({ commandResult = null, uiDefinitionResult = null, externalCanaryGateResult = null }) {
  return [
    '00-command-contract.md',
    '01-lane-manifest.json',
    '02-validation-report.md',
    '03-blockers.md',
    ...(commandResult ? ['04-command-results.json', '05-command-results.md'] : []),
    ...(uiDefinitionResult ? ['06-ui-definition.json'] : []),
    ...(externalCanaryGateResult ? ['07-external-canary-gate.json'] : []),
  ];
}

async function writeArtifacts({ artifactDir, commandResult, externalCanaryGateResult, manifest, status, uiDefinitionResult }) {
  const publicManifest = stripPrivateManifestFields(manifest);
  await fs.writeFile(path.join(artifactDir, '00-command-contract.md'), renderCommandContract(publicManifest), 'utf8');
  await fs.writeFile(path.join(artifactDir, '01-lane-manifest.json'), `${JSON.stringify(publicManifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(artifactDir, '02-validation-report.md'), renderValidationReport(publicManifest, status, commandResult, uiDefinitionResult, externalCanaryGateResult), 'utf8');
  await fs.writeFile(path.join(artifactDir, '03-blockers.md'), renderBlockers(status, commandResult, uiDefinitionResult, externalCanaryGateResult), 'utf8');
  if (commandResult) {
    await fs.writeFile(path.join(artifactDir, '04-command-results.json'), `${JSON.stringify(commandResult, null, 2)}\n`, 'utf8');
    await fs.writeFile(path.join(artifactDir, '05-command-results.md'), renderCommandResults(commandResult), 'utf8');
  }
  if (uiDefinitionResult) {
    await fs.writeFile(path.join(artifactDir, '06-ui-definition.json'), `${JSON.stringify(uiDefinitionResult, null, 2)}\n`, 'utf8');
  }
  if (externalCanaryGateResult) {
    await fs.writeFile(path.join(artifactDir, '07-external-canary-gate.json'), `${JSON.stringify(externalCanaryGateResult, null, 2)}\n`, 'utf8');
  }
}

function stripPrivateManifestFields(manifest) {
  return {
    ...manifest,
    command_inventory: manifest.command_inventory.map(({ env, ...item }) => item),
  };
}

function renderCommandContract(manifest) {
  return `${[
    '# Experiment Foundation Hardening Runner Command Contract',
    '',
    `- Runner: \`${manifest.runner_id}\``,
    `- Version: \`${manifest.runner_version}\``,
    `- Task: \`${manifest.task_id}\``,
    `- Run ID: \`${manifest.run_id}\``,
    `- Mode requested: \`${manifest.mode_requested}\``,
    `- Artifact dir: \`${manifest.artifact_dir}\``,
    '',
    '## CLI',
    '',
    '```bash',
    'node .ai/scripts/experiment-foundation-hardening-runner.mjs --mode contract',
    'pnpm experiment-foundation:hardening -- --mode deterministic',
    'pnpm experiment-foundation:hardening -- --mode real-local-db --require-real-db',
    'pnpm experiment-foundation:hardening -- --mode external-gate --include-true-external-canary',
    'pnpm experiment-foundation:hardening -- --mode full --include-true-external-canary',
    '```',
    '',
    'Supported modes: `contract`, `deterministic`, `real-local-db`, `ui-definition`, `external-gate`, `full`.',
    '',
    '`contract` writes the runner contract only. `deterministic` runs repeatable local hardening checks. `real-local-db` runs the opt-in disposable Postgres parity probe. `ui-definition` checks the desktop workbench flow contract. `external-gate` validates true external canary prerequisites without real cloud calls. `full` runs deterministic plus real-local-DB checks and records the external gate.',
    '',
    '## Lanes',
    '',
    '| Lane | Default | Status | Failure semantics |',
    '| --- | --- | --- | --- |',
    ...manifest.lanes.map((item) => `| \`${item.lane_id}\` | \`${item.default_enabled}\` | \`${item.implementation_status}\` | \`${item.failure_semantics}\` |`),
    '',
    '## Command Inventory',
    '',
    ...manifest.command_inventory.map((item) => `- \`${item.command_id}\` (${item.cwd}): \`${item.display}\``),
    '',
    '## External Canary',
    '',
    '- Default behavior: skipped.',
    '- True external execution is not performed by this runner phase.',
    '- With `--include-true-external-canary`, this runner checks prerequisite key presence and returns `blocked` until a provider-specific real execution implementation is added.',
    '- Artifacts store key names and presence only, never raw values.',
    '',
  ].join('\n')}\n`;
}

function renderValidationReport(manifest, status, commandResult, uiDefinitionResult, externalCanaryGateResult) {
  return `${[
    '# Experiment Foundation Hardening Validation Report',
    '',
    `- Status: \`${status}\``,
    `- Runner version: \`${manifest.runner_version}\``,
    `- Run ID: \`${manifest.run_id}\``,
    `- Mode requested: \`${manifest.mode_requested}\``,
    `- Artifact dir: \`${manifest.artifact_dir}\``,
    '',
    '| Lane | Implementation status | Failure semantics |',
    '| --- | --- | --- |',
    ...manifest.lanes.map((laneItem) => `| \`${laneItem.lane_id}\` | \`${laneItem.implementation_status}\` | \`${laneItem.failure_semantics}\` |`),
    '',
    ...(commandResult ? [
      '## Command Summary',
      '',
      `- Commands: \`${commandResult.summary.command_count}\``,
      `- Passed: \`${commandResult.summary.pass_count}\``,
      `- Failed: \`${commandResult.summary.fail_count}\``,
      `- Timed out: \`${commandResult.summary.timeout_count}\``,
      `- Duration: \`${commandResult.summary.duration_ms}ms\``,
      '',
    ] : ['No shell commands were executed in this mode.', '']),
    ...(uiDefinitionResult ? [
      '## UI Definition Summary',
      '',
      `- Checks: \`${uiDefinitionResult.checks.length}\``,
      `- Passed: \`${uiDefinitionResult.summary.pass_count}\``,
      `- Blockers: \`${uiDefinitionResult.summary.fail_count}\``,
      '',
    ] : []),
    ...(externalCanaryGateResult ? [
      '## External Canary Gate Summary',
      '',
      `- Status: \`${externalCanaryGateResult.status}\``,
      `- Include true external canary: \`${externalCanaryGateResult.include_true_external_canary}\``,
      `- Real submission executed: \`${externalCanaryGateResult.real_submission_executed}\``,
      `- Blockers: \`${externalCanaryGateResult.blockers.length}\``,
      '',
    ] : []),
    '## Redaction',
    '',
    '- Artifacts are written under `.ai/.tmp/experiment-foundation-hardening/<run-id>/`.',
    '- Command output is stored as a redacted tail, not unbounded raw logs.',
    '- External canary artifacts store env key presence only.',
    '- No raw `DATABASE_URL`, credential value, SDK payload, raw dataset, checkpoint, or provider object payload is intentionally stored.',
    '',
  ].join('\n')}\n`;
}

function renderBlockers(status, commandResult, uiDefinitionResult, externalCanaryGateResult) {
  const blockers = collectBlockers(uiDefinitionResult, commandResult, externalCanaryGateResult);
  if (blockers.length === 0) {
    return `${[
      '# Blockers',
      '',
      status === 'CONTRACT_READY'
        ? '- None for command-contract generation.'
        : '- None.',
      '',
    ].join('\n')}\n`;
  }
  return `${[
    '# Blockers',
    '',
    ...blockers.map((item) => `- \`${item.code}\`: ${item.message}`),
    '',
    '## Required Actions',
    '',
    ...blockers.map((item) => `- ${item.action}`),
    '',
  ].join('\n')}\n`;
}

function renderCommandResults(commandResult) {
  return `${[
    '# Command Results',
    '',
    '| Command | Status | Exit | Duration |',
    '| --- | --- | --- | --- |',
    ...commandResult.commands.map((item) => `| \`${item.command_id}\` | \`${item.status}\` | \`${item.exit_code ?? item.signal ?? 'n/a'}\` | \`${item.duration_ms}ms\` |`),
    '',
    ...commandResult.commands.flatMap((item) => [
      `## ${item.command_id}`,
      '',
      `- CWD: \`${item.cwd}\``,
      `- Display: \`${item.display}\``,
      `- Status: \`${item.status}\``,
      `- Duration: \`${item.duration_ms}ms\``,
      '',
      '```text',
      item.output_tail || '(no output)',
      '```',
      '',
    ]),
  ].join('\n')}\n`;
}

async function runCommands(commands) {
  const started = Date.now();
  const results = [];
  for (const item of commands) {
    results.push(await runCommand(item));
  }
  const blockers = results
    .filter((item) => item.status !== 'passed')
    .map((item) => ({
      code: item.command_id,
      message: `Command failed with status ${item.status}.`,
      action: `Inspect ${item.command_id} in 04-command-results.json and rerun ${item.display}.`,
    }));
  return {
    started_at: new Date(started).toISOString(),
    finished_at: new Date().toISOString(),
    summary: {
      command_count: results.length,
      pass_count: results.filter((item) => item.status === 'passed').length,
      fail_count: results.filter((item) => item.status === 'failed').length,
      timeout_count: results.filter((item) => item.status === 'timed_out').length,
      duration_ms: Date.now() - started,
    },
    blockers,
    commands: results,
  };
}

async function runCommand(commandItem) {
  const started = Date.now();
  const [program, ...argv] = commandItem.argv;
  const cwd = path.resolve(REPO_ROOT, commandItem.cwd);
  let output = '';
  let timedOut = false;

  return await new Promise((resolve) => {
    const child = spawn(program, argv, {
      cwd,
      detached: USE_PROCESS_GROUP_SIGNALS,
      env: {
        ...process.env,
        ...commandItem.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      if (USE_PROCESS_GROUP_SIGNALS && child.pid) {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {
          child.kill('SIGTERM');
        }
      } else {
        child.kill('SIGTERM');
      }
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill('SIGKILL');
        }
      }, 5_000).unref();
    }, commandItem.timeout_ms);

    child.stdout.on('data', (chunk) => {
      output = appendBoundedOutput(output, chunk);
    });
    child.stderr.on('data', (chunk) => {
      output = appendBoundedOutput(output, chunk);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        command_id: commandItem.command_id,
        cwd: commandItem.cwd,
        display: commandItem.display,
        status: 'failed',
        exit_code: null,
        signal: null,
        duration_ms: Date.now() - started,
        output_tail: redact(`${output}\n${error.message}`),
      });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        command_id: commandItem.command_id,
        cwd: commandItem.cwd,
        display: commandItem.display,
        status: timedOut ? 'timed_out' : code === 0 ? 'passed' : 'failed',
        exit_code: code,
        signal,
        duration_ms: Date.now() - started,
        output_tail: redact(output),
      });
    });
  });
}

async function runUiDefinitionCheck() {
  const absolutePath = path.join(REPO_ROOT, UI_FLOW_CONTRACT_PATH);
  let content = '';
  let exists = true;
  try {
    content = await fs.readFile(absolutePath, 'utf8');
  } catch {
    exists = false;
  }

  const requiredPatterns = [
    'Backend authority',
    '/experiment-foundation/records',
    '/experiment-foundation/readiness/check',
    '/experiment-foundation/candidates/:candidate_id/promotion',
    '/experiment-foundation/execution/jobs/submit',
    '/experiment-foundation/execution/jobs/:external_job_id/sync',
    '/experiment-foundation/execution/jobs/:external_job_id/cancel',
    '/experiment-foundation/execution/jobs/:external_job_id/collect',
    'renderer MUST NOT',
    '.ai/.tmp/experiment-foundation-hardening/<run-id>/ui/',
  ];
  const checks = [
    check('ui-flow-contract-exists', exists, `${UI_FLOW_CONTRACT_PATH} exists`, `${UI_FLOW_CONTRACT_PATH} is missing`, 'Restore the Phase 4 UI flow contract before running UI-definition hardening.'),
    ...requiredPatterns.map((pattern) => check(
      `ui-flow-contract-contains-${slug(pattern)}`,
      exists && content.includes(pattern),
      `UI flow contract contains ${pattern}`,
      `UI flow contract is missing ${pattern}`,
      `Update ${UI_FLOW_CONTRACT_PATH} so later UI automation has an explicit backend-authority target.`,
    )),
  ];
  const blockers = checks
    .filter((item) => item.status === 'fail')
    .map((item) => ({ code: item.check_id, message: item.summary, action: item.action }));
  return {
    checked_at: new Date().toISOString(),
    contract_path: UI_FLOW_CONTRACT_PATH,
    summary: {
      pass_count: checks.filter((item) => item.status === 'pass').length,
      fail_count: blockers.length,
    },
    blockers,
    checks,
  };
}

async function runExternalCanaryGate(options) {
  const envPresence = await loadEnvironmentPresence();
  const provider = readEnvValue('EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_PROVIDER', envPresence);
  const include = options.includeTrueExternalCanary;
  const requiredKeys = trueExternalCanaryRequiredKeys(provider);
  const isSupportedProvider = provider === null || SUPPORTED_TRUE_EXTERNAL_CANARY_PROVIDERS.has(provider);
  const checks = [
    check(
      'true-external-canary-opt-in',
      include,
      'True external canary was explicitly requested.',
      'True external canary was not requested; lane is skipped by default.',
      'Re-run with `--include-true-external-canary` only when external credentials, mirror refs, budget approval, and cleanup plan are ready.',
      include ? 'fail' : 'skip',
    ),
    check(
      'true-external-canary-provider-supported',
      include && isSupportedProvider,
      'True external canary provider is supported by the current gate contract.',
      `Unsupported true external canary provider: ${provider ? redactProviderKind(provider) : 'missing'}.`,
      `Use one of: ${Array.from(SUPPORTED_TRUE_EXTERNAL_CANARY_PROVIDERS).join(', ')}; add a provider-specific gate before using another provider.`,
      include ? 'fail' : 'skip',
    ),
    ...requiredKeys.map((key) => check(
      `env-key-present-${slug(key)}`,
      include && hasEnvKeyOrGroup(key, envPresence),
      `${key} is present.`,
      `${key} is missing.`,
      `Set ${key} in the local environment or .env.local secret flow before enabling the true external canary.`,
      include ? 'fail' : 'skip',
    )),
  ];
  const blockers = include
    ? checks
      .filter((item) => item.status === 'fail')
      .map((item) => ({ code: item.check_id, message: item.summary, action: item.action }))
    : [];
  const status = include
    ? blockers.length > 0
      ? 'blocked'
      : 'ready_for_provider_specific_real_execution'
    : 'skipped';
  return {
    checked_at: new Date().toISOString(),
    include_true_external_canary: include,
    status,
    provider_kind: provider ? redactProviderKind(provider) : null,
    execution_policy: 'gate_only_no_real_cloud_call',
    real_submission_executed: false,
    required_env_key_names: requiredKeys,
    env_sources: {
      process_env: true,
      env_local_path: ROOT_ENV_LOCAL_PATH,
      env_local_exists: envPresence.env_local.exists,
    },
    env_key_presence: requiredKeys.map((key) => envKeyPresence(key, envPresence)),
    blockers,
    checks,
    artifact_policy: 'Env values, credentials, raw provider logs, SDK payloads, raw data, checkpoints, and unredacted provider object paths are not stored.',
  };
}

function trueExternalCanaryRequiredKeys(provider) {
  const baseKeys = [
    'EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_PROVIDER',
    'EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_MIRROR_REF',
    'EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_APPROVAL_REF',
    'EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_BUDGET_REF',
    'EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_CLEANUP_PLAN_REF',
  ];
  if (provider === 'aliyun_pai_dlc') {
    return [
      ...baseKeys,
      'EXPERIMENT_FOUNDATION_TRUE_EXTERNAL_CANARY_ALIYUN_WORKSPACE_REF',
      'ALIYUN_ACCESS_KEY_ID or ALIYUN_ACCESS_KEY',
      'ALIYUN_ACCESS_KEY_SECRET or ALIYUN_SECRET_KEY',
    ];
  }
  return baseKeys;
}

async function loadEnvironmentPresence() {
  const envLocal = await loadEnvLocal();
  return {
    process_env: process.env,
    env_local: envLocal,
  };
}

async function loadEnvLocal() {
  const filePath = path.join(REPO_ROOT, ROOT_ENV_LOCAL_PATH);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return {
      exists: true,
      values: parseEnvFile(content),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        exists: false,
        values: new Map(),
      };
    }
    throw error;
  }
}

function parseEnvFile(content) {
  const values = new Map();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    values.set(match[1], normalizeEnvValue(match[2]));
  }
  return values;
}

function normalizeEnvValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function collectBlockers(uiDefinitionResult, commandResult, externalCanaryGateResult) {
  return [
    ...(uiDefinitionResult?.blockers ?? []),
    ...(commandResult?.blockers ?? []),
    ...(externalCanaryGateResult?.blockers ?? []),
  ];
}

function check(checkId, passed, passSummary, failSummary, action, failStatus = 'fail') {
  return {
    check_id: checkId,
    status: passed ? 'pass' : failStatus,
    summary: passed ? passSummary : failSummary,
    action: passed ? null : action,
  };
}

function appendBoundedOutput(current, chunk) {
  const next = `${current}${chunk.toString('utf8')}`;
  return next.length > COMMAND_OUTPUT_TAIL_CHARS
    ? next.slice(next.length - COMMAND_OUTPUT_TAIL_CHARS)
    : next;
}

function redact(input) {
  const secretKeyName = '(?:DATABASE_URL|[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|ACCESS_KEY|API_KEY|CREDENTIALS|SDK_PAYLOAD)[A-Z0-9_]*)';
  return input
    .replace(/postgres(?:ql)?:\/\/[^\s'"`<>]+/gi, '[REDACTED_DATABASE_URL]')
    .replace(new RegExp(`(["']?${secretKeyName}["']?\\s*[:=]\\s*)(["'])[^"']*\\2`, 'gi'), '$1$2[REDACTED]$2')
    .replace(new RegExp('\\b(' + secretKeyName + ')\\s*=\\s*[^\\s\'"`]+', 'gi'), '$1=[REDACTED]')
    .replace(new RegExp('\\b(' + secretKeyName + ')\\s*:\\s*[^\\s,\'"`]+', 'gi'), '$1: [REDACTED]')
    .replace(/\b(Authorization)\s*:\s*Bearer\s+[^\s,'"`]+/gi, '$1: Bearer [REDACTED]');
}

function redactProviderKind(provider) {
  return /^[A-Za-z0-9._-]+$/.test(provider) ? provider : '[REDACTED_PROVIDER_KIND]';
}

function hasEnvKeyOrGroup(keyOrGroup, envPresence) {
  return keyOrGroup.split(/\s+or\s+/).some((key) => readEnvValue(key, envPresence) !== null);
}

function envKeyPresence(keyOrGroup, envPresence) {
  const keys = keyOrGroup.split(/\s+or\s+/);
  return {
    key: keyOrGroup,
    present: keys.some((key) => readEnvValue(key, envPresence) !== null),
    process_env_present: keys.some((key) => hasProcessEnvValue(key, envPresence)),
    env_local_present: keys.some((key) => hasEnvLocalValue(key, envPresence)),
  };
}

function readEnvValue(key, envPresence) {
  const processValue = envPresence.process_env[key];
  if (typeof processValue === 'string' && processValue.trim() !== '') {
    return processValue.trim();
  }
  const envLocalValue = envPresence.env_local.values.get(key);
  if (typeof envLocalValue === 'string' && envLocalValue.trim() !== '') {
    return envLocalValue.trim();
  }
  return null;
}

function hasProcessEnvValue(key, envPresence) {
  const value = envPresence.process_env[key];
  return typeof value === 'string' && value.trim() !== '';
}

function hasEnvLocalValue(key, envPresence) {
  const value = envPresence.env_local.values.get(key);
  return typeof value === 'string' && value.trim() !== '';
}

function relativePath(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath) || '.';
}

function slug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function printHelp() {
  console.log(`Experiment Foundation Hardening Runner

Usage:
  node .ai/scripts/experiment-foundation-hardening-runner.mjs [options]
  pnpm experiment-foundation:hardening -- [options]

Options:
  --mode <contract|deterministic|real-local-db|ui-definition|external-gate|full>
      Default: contract
  --run-id <id>
      Default: experiment-foundation-hardening-<timestamp>
  --artifact-dir <path>
      Default: .ai/.tmp/experiment-foundation-hardening/<run-id>
  --include-true-external-canary
      Enable gate checks for the true external canary lane. This phase does not call real cloud providers.
  --require-real-db
      Mark the real-local-DB lane as explicitly required in the manifest.
  --help
      Show this help.
`);
}
