import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeReplayArtifacts({
  repoRoot,
  runnerId,
  runnerVersion,
  state,
}) {
  const files = {
    manifest: 'manifest.json',
    flow_steps: 'flow-steps.json',
    fixture_inventory: 'fixture-inventory.json',
    linked_loop: 'linked-loop-report.json',
    blocked_paths: 'blocked-path-report.json',
    writing_packet: 'writing-packet-summary.json',
    ui_boundary: 'ui-boundary-report.json',
    residual_risks: 'residual-risks.md',
    operator_checklist: 'operator-checklist.md',
  };
  const manifest = {
    runner_id: runnerId,
    runner_version: runnerVersion,
    task_id: 'T-109',
    run_id: state.runId,
    status: state.status,
    started_at: state.startedAt,
    completed_at: state.completedAt,
    artifact_dir: relativePath(repoRoot, state.artifactDir),
    default_lane: 'route-level-in-memory',
    optional_lanes: {
      local_postgres: 'not_run_by_default',
      browser_smoke: 'not_run_by_default',
      real_cloud: 'not_run_by_design',
      live_provider_execution: 'not_implemented',
    },
    files,
    blockers: state.blockers,
  };
  await fs.writeFile(path.join(state.artifactDir, files.manifest), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.flow_steps), `${JSON.stringify(state.steps, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.fixture_inventory), `${JSON.stringify(fixtureInventory(), null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.linked_loop), `${JSON.stringify(state.linkedLoop, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.blocked_paths), `${JSON.stringify(state.blockedPaths, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.writing_packet), `${JSON.stringify(state.writingPacket, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.ui_boundary), `${JSON.stringify(state.uiBoundary, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.residual_risks), renderResidualRisks(state), 'utf8');
  await fs.writeFile(path.join(state.artifactDir, files.operator_checklist), renderOperatorChecklist(state), 'utf8');
}

function fixtureInventory() {
  return {
    happy_path: ['HP-ROUTE-001'],
    linked_loop: ['LL-FAILED-RUN-001', 'LL-FOLLOWUP-PLAN-001'],
    adjacent_lanes: ['ADJ-T104-FAKE-001', 'ADJ-T105-PREFLIGHT-001', 'ADJ-T100-STATIC-001'],
    p0_blocked_paths: [
      'BP0-01',
      'BP0-02',
      'BP0-03',
      'BP0-04',
      'BP0-05',
      'BP0-06',
      'BP0-07',
      'BP0-08',
      'BP0-09',
      'BP0-10',
    ],
    p1_handling: {
      BP1_01: 'covered by bootstrap replay/idempotency can be added cheaply in Phase 2 if required',
      BP1_02: 'overlaps BP0-01',
      BP1_03: 'covered by T-104 existing targeted tests; not repeated in route replay',
      BP1_04: 'covered by T-095 existing targeted tests',
      BP1_05: 'residual owner T-094/T-095 unless fixture setup remains small',
      BP1_06: 'covered by LL-FAILED-RUN-001',
    },
    p2_residuals: [
      'local_postgres_parity',
      'ui_stale_race',
      'true_cloud_partial_failure',
      'live_provider_output_instability',
      'writing_ingestion_mismatch',
    ],
  };
}

function renderResidualRisks(state) {
  return `# T-109 Residual Risks

Run: ${state.runId}
Status: ${state.status}

## Non-blocking by design
- Local Postgres/disposable-schema parity was not run by default.
- Browser smoke was not run by default.
- True cloud execution was not run by design.
- Live provider execution is not implemented; T-105 remains preflight-only.
- Writing module ingestion is outside T-109 and remains a future task.

## Blockers
${state.blockers.length === 0 ? '- None.\n' : state.blockers.map((item) => `- ${item}`).join('\n')}
`;
}

function renderOperatorChecklist(state) {
  return `# T-109 Operator Checklist

Run: ${state.runId}

## Default command
\`\`\`bash
node --loader ./apps/backend/node_modules/ts-node/esm.mjs .ai/scripts/paper-implementation-v1-runnable-replay.mjs
\`\`\`

## What this proves
- Route-level in-memory PaperImplementation V1 replay.
- Deterministic linked loop through the T-104 fake/local experiment seam.
- Trusted target-specific run evidence.
- Result, claim, dossier, and WritingEntryPacket projection.
- P0 blocked-path behavior.
- T-105 live-provider preflight does not execute live provider calls.

## What this does not prove
- Local Postgres parity unless an optional DB lane is added.
- Browser-level UI behavior.
- Real cloud execution.
- Live provider output variance.
- Writing-module ingestion.
`;
}

function relativePath(repoRoot, absolutePath) {
  return path.relative(repoRoot, absolutePath) || '.';
}
