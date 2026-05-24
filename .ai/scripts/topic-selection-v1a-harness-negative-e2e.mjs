import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const RUN_GROUP_ID = process.env.TOPIC_SELECTION_V1A_HARNESS_NEGATIVE_RUN_ID
  ?? `v1a-harness-negative-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const ARTIFACT_DIR = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1a-harness-negative-e2e', RUN_GROUP_ID);
const HARNESS_ARTIFACT_ROOT = path.join(REPO_ROOT, '.ai/.tmp/topic-selection-v1a-harness-e2e');
const HARNESS_SCRIPT = '.ai/scripts/topic-selection-v1a-harness-e2e.mjs';

const prisma = new PrismaClient();

function shortHash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function baseHarnessEnv(runId) {
  const env = {
    ...process.env,
    TOPIC_SELECTION_V1A_HARNESS_RUN_ID: runId,
    TOPIC_SELECTION_REAL_FLOW_MOCK_LLM: '1',
    TOPIC_SELECTION_V1A_HARNESS_AGENT_EXECUTION_MODE: 'mocked_llm',
    TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTION_MODE: 'provider_llm',
    TOPIC_SELECTION_V1A_HARNESS_GENERATE_EXECUTOR_KIND: 'multi_agent_debate',
    TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_EXECUTION_MODE: 'codex_assisted',
    TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_EXECUTION_MODE: 'provider_llm',
    TOPIC_SELECTION_V1A_HARNESS_DEBATE_ISSUE_FRAME_EXECUTION_MODE: 'provider_llm',
    TOPIC_SELECTION_V1A_HARNESS_DEBATE_FINAL_EXECUTION_MODE: 'provider_llm',
    TOPIC_SELECTION_V1A_HARNESS_ADJUDICATION_EXECUTION_MODE: 'provider_llm',
    TOPIC_SELECTION_REAL_PROVIDER_ID: 'openai',
    TOPIC_SELECTION_REAL_MODEL_ID: 'gpt-5.4-mini',
    TOPIC_SELECTION_REAL_LLM_TIMEOUT_MS: '240000',
  };
  if (process.env.TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID?.trim()) {
    env.TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID = process.env.TOPIC_SELECTION_REAL_RESOURCE_SAMPLE_SET_ID.trim();
  }
  return env;
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runHarnessCase(testCase) {
  const runId = `${RUN_GROUP_ID}-${testCase.case_id}-${shortHash(testCase.case_id)}`;
  const env = {
    ...baseHarnessEnv(runId),
    ...testCase.env,
  };
  const child = spawn(
    process.execPath,
    ['--env-file=.env.local', '--loader', './apps/backend/node_modules/ts-node/esm.mjs', HARNESS_SCRIPT],
    {
      cwd: REPO_ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const stdoutChunks = [];
  const stderrChunks = [];
  child.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
  child.stderr.on('data', (chunk) => stderrChunks.push(chunk));
  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  const stdout = Buffer.concat(stdoutChunks).toString('utf8');
  const stderr = Buffer.concat(stderrChunks).toString('utf8');
  const combinedOutput = `${stdout}\n${stderr}`;
  const harnessArtifactDir = path.join(HARNESS_ARTIFACT_ROOT, runId);
  const summaryPath = path.join(harnessArtifactDir, '90-summary.json');
  const summary = await readJsonIfExists(summaryPath);
  const caseArtifactPath = path.join(ARTIFACT_DIR, `${testCase.case_id}.json`);
  await fs.writeFile(caseArtifactPath, `${JSON.stringify({
    case_id: testCase.case_id,
    run_id: runId,
    exit_code: exitCode,
    stdout,
    stderr,
    summary,
  }, null, 2)}\n`);

  expect(exitCode !== 0, `${testCase.case_id}: expected harness failure, got exit code 0.`);
  expect(
    testCase.expected_output_patterns.some((pattern) => combinedOutput.includes(pattern)),
    `${testCase.case_id}: expected failure output to include one of ${JSON.stringify(testCase.expected_output_patterns)}.`,
  );
  if (testCase.summary_required) {
    expect(summary?.status === 'failed', `${testCase.case_id}: expected failed summary artifact.`);
    expect(
      testCase.expected_summary_stage ? summary.current_stage === testCase.expected_summary_stage : true,
      `${testCase.case_id}: expected current_stage=${testCase.expected_summary_stage}, got ${summary?.current_stage}.`,
    );
  } else {
    expect(summary === null, `${testCase.case_id}: expected no summary because configuration failed before harness startup.`);
  }

  const authorityCounts = await authorityCountsForRun(runId);
  expect(authorityCounts.need_candidate_count === 0, `${testCase.case_id}: unexpected NeedCandidate authority write.`);
  expect(authorityCounts.validated_need_count === 0, `${testCase.case_id}: unexpected ValidatedNeed authority write.`);
  expect(authorityCounts.v1b_input_bundle_count === 0, `${testCase.case_id}: unexpected v1b input bundle authority write.`);

  return {
    case_id: testCase.case_id,
    run_id: runId,
    exit_code: exitCode,
    summary_status: summary?.status ?? null,
    current_stage: summary?.current_stage ?? null,
    harness_artifact_dir: path.relative(REPO_ROOT, harnessArtifactDir),
    authority_counts: authorityCounts,
  };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function authorityCountsForRun(runId) {
  const titleCards = await prisma.titleCard.findMany({
    where: {
      workingTitle: {
        contains: runId,
      },
    },
    select: {
      id: true,
    },
  });
  const titleCardIds = titleCards.map((card) => card.id);
  if (titleCardIds.length === 0) {
    return {
      title_card_ids: [],
      need_candidate_count: 0,
      validated_need_count: 0,
      v1b_input_bundle_count: 0,
    };
  }
  const [needCandidateCount, validatedNeedCount, v1bInputBundleCount] = await Promise.all([
    prisma.topicSelectionNeedCandidate.count({
      where: {
        titleCardId: {
          in: titleCardIds,
        },
      },
    }),
    prisma.topicSelectionValidatedNeed.count({
      where: {
        titleCardId: {
          in: titleCardIds,
        },
      },
    }),
    prisma.topicSelectionV1aToV1bInputBundle.count({
      where: {
        titleCardId: {
          in: titleCardIds,
        },
      },
    }),
  ]);
  return {
    title_card_ids: titleCardIds,
    need_candidate_count: needCandidateCount,
    validated_need_count: validatedNeedCount,
    v1b_input_bundle_count: v1bInputBundleCount,
  };
}

async function main() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const cases = [
    {
      case_id: 'non_provider_slot_model_option_override',
      env: {
        TOPIC_SELECTION_V1A_HARNESS_DEBATE_EXPLORER_MODEL_OPTION_ID:
          'topic-selection.need-discovery.explorer.v1.openai-balanced',
      },
      expected_output_patterns: [
        'explorer.round_1_discovery model option override requires provider_llm execution mode.',
      ],
      summary_required: false,
    },
    {
      case_id: 'cross_profile_model_option_override',
      env: {
        TOPIC_SELECTION_V1A_HARNESS_DEBATE_DEEP_CRITIC_MODEL_OPTION_ID:
          'topic-selection.need-discovery.explorer.v1.openai-balanced',
      },
      expected_output_patterns: [
        'model_option_id is not defined by model profile.',
      ],
      expected_summary_stage: 'harness generate-need-candidate',
      summary_required: true,
    },
  ];
  const results = [];
  for (const testCase of cases) {
    results.push(await runHarnessCase(testCase));
  }
  const summary = {
    status: 'passed',
    run_group_id: RUN_GROUP_ID,
    artifact_dir: ARTIFACT_DIR,
    cases: results,
  };
  await fs.writeFile(path.join(ARTIFACT_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

try {
  await main();
} catch (error) {
  const failure = {
    status: 'failed',
    run_group_id: RUN_GROUP_ID,
    artifact_dir: ARTIFACT_DIR,
    error: {
      name: error?.name ?? 'Error',
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
    },
  };
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  await fs.writeFile(path.join(ARTIFACT_DIR, 'summary.json'), `${JSON.stringify(failure, null, 2)}\n`);
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
