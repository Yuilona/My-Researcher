#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const PROCESSABLE_SCOPE_STATUSES = new Set(['in_scope']);
const DEFAULT_OUT_DIR = '.ai/.tmp/literature-evidence-activation-bootstrap';

function parseArgs(argv) {
  const args = {
    mode: 'dry-run',
    outJson: path.resolve(DEFAULT_OUT_DIR, 'bootstrap-report.json'),
    outMd: path.resolve(DEFAULT_OUT_DIR, 'bootstrap-report.md'),
    confirmApply: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--mode' && next) {
      args.mode = next;
      index += 1;
    } else if (arg === '--out-json' && next) {
      args.outJson = path.resolve(next);
      index += 1;
    } else if (arg === '--out-md' && next) {
      args.outMd = path.resolve(next);
      index += 1;
    } else if (arg === '--confirm-apply') {
      args.confirmApply = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }
  if (!['dry-run', 'apply'].includes(args.mode)) {
    throw new Error('--mode must be dry-run or apply.');
  }
  if (args.mode === 'apply' && !args.confirmApply) {
    throw new Error('--confirm-apply is required with --mode apply.');
  }
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node .ai/scripts/literature-evidence-activation-bootstrap.mjs [--mode dry-run|apply]',
    '',
    'Options:',
    '  --confirm-apply   Required for --mode apply',
    '  --out-json <path> Default: .ai/.tmp/literature-evidence-activation-bootstrap/bootstrap-report.json',
    '  --out-md <path>   Default: .ai/.tmp/literature-evidence-activation-bootstrap/bootstrap-report.md',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFiles(['apps/backend/.env.local', '.env.local', 'apps/backend/.env', '.env']);
  const prisma = new PrismaClient();
  try {
    const plan = await buildBootstrapPlan(prisma);
    const applied = args.mode === 'apply' ? await applyBootstrapPlan(prisma, plan) : [];
    const report = {
      generated_at: new Date().toISOString(),
      mode: args.mode,
      status: 'PASS',
      summary: summarizePlan(plan, applied),
      scope_updates: plan.scopeUpdates,
      quality_upserts: plan.qualityUpserts,
      applied_actions: applied,
    };
    await fs.mkdir(path.dirname(args.outJson), { recursive: true });
    await fs.mkdir(path.dirname(args.outMd), { recursive: true });
    await fs.writeFile(args.outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await fs.writeFile(args.outMd, renderMarkdown(report), 'utf8');
    console.log(JSON.stringify({
      status: report.status,
      mode: report.mode,
      summary: report.summary,
      out_json: args.outJson,
      out_md: args.outMd,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

async function buildBootstrapPlan(prisma) {
  const [literatures, scopes, pipelineStates, indexedStages, embeddingVersions, existingQuality] = await Promise.all([
    prisma.literatureRecord.findMany({
      select: {
        id: true,
        activeEmbeddingVersionId: true,
      },
    }),
    prisma.topicLiteratureScope.findMany({
      orderBy: [{ topicId: 'asc' }, { literatureId: 'asc' }],
    }),
    prisma.literaturePipelineState.findMany(),
    prisma.literaturePipelineStageState.findMany({
      where: { stageCode: 'INDEXED' },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.literatureEmbeddingVersion.findMany({
      select: {
        id: true,
        literatureId: true,
        status: true,
        activatedAt: true,
      },
    }),
    prisma.literatureQualityAssessment.findMany(),
  ]);

  const literatureById = new Map(literatures.map((item) => [item.id, item]));
  const pipelineByLiterature = new Map(pipelineStates.map((item) => [item.literatureId, item]));
  const latestIndexedStageByLiterature = new Map();
  for (const stage of indexedStages) {
    if (!latestIndexedStageByLiterature.has(stage.literatureId)) {
      latestIndexedStageByLiterature.set(stage.literatureId, stage);
    }
  }
  const embeddingById = new Map(embeddingVersions.map((item) => [item.id, item]));
  const qualityByLiterature = new Map(existingQuality.map((item) => [item.literatureId, item]));
  const scopesByLiterature = new Map();
  for (const scope of scopes) {
    const rows = scopesByLiterature.get(scope.literatureId) ?? [];
    rows.push(scope);
    scopesByLiterature.set(scope.literatureId, rows);
  }

  const scopeUpdates = [];
  for (const scope of scopes) {
    const target = resolveScopeActivation({
      scope,
      literature: literatureById.get(scope.literatureId) ?? null,
      pipelineState: pipelineByLiterature.get(scope.literatureId) ?? null,
      indexedStage: latestIndexedStageByLiterature.get(scope.literatureId) ?? null,
      embeddingById,
    });
    if (
      scope.activationStatus !== target.activationStatus
      || (scope.activationReason ?? null) !== target.activationReason
      || normalizeIso(scope.activatedAt) !== target.activatedAt
    ) {
      scopeUpdates.push({
        id: scope.id,
        topic_id: scope.topicId,
        literature_id: scope.literatureId,
        from_activation_status: scope.activationStatus,
        to_activation_status: target.activationStatus,
        activation_reason: target.activationReason,
        activated_at: target.activatedAt,
      });
    }
  }

  const qualityUpserts = [];
  const targetStatusByScopeId = new Map(
    scopeUpdates.map((item) => [item.id, item.to_activation_status]),
  );
  for (const literature of literatures) {
    const literatureId = literature.id;
    if (qualityByLiterature.has(literatureId)) {
      continue;
    }
    const literatureScopes = scopesByLiterature.get(literatureId) ?? [];
    const pipelineState = pipelineByLiterature.get(literatureId) ?? null;
    const indexedStage = latestIndexedStageByLiterature.get(literatureId) ?? null;
    const evidenceReady = isEvidenceReady({
      literature,
      pipelineState,
      indexedStage,
      embeddingById,
    });
    const hasActiveScope = literatureScopes.some((scope) =>
      (targetStatusByScopeId.get(scope.id) ?? scope.activationStatus) === 'active');
    const hasInScope = literatureScopes.some((scope) => PROCESSABLE_SCOPE_STATUSES.has(scope.scopeStatus));
    const allExcluded = literatureScopes.length > 0
      && literatureScopes.every((scope) => scope.scopeStatus === 'excluded');
    const quality = evidenceReady || hasActiveScope
      ? {
          quality_status: 'high_confidence',
          quality_score: 100,
          source: 'bootstrap_rule',
          reason: evidenceReady ? 'BOOTSTRAP_GLOBAL_EVIDENCE_READY' : 'BOOTSTRAP_ACTIVE_SCOPE',
        }
      : allExcluded
        ? {
            quality_status: 'excluded',
            quality_score: null,
            source: 'bootstrap_rule',
            reason: 'BOOTSTRAP_SCOPE_EXCLUDED',
          }
        : hasInScope
          ? {
              quality_status: 'needs_review',
              quality_score: null,
              source: 'bootstrap_rule',
              reason: 'BOOTSTRAP_IN_SCOPE_NOT_EVIDENCE_READY',
            }
          : {
              quality_status: 'needs_review',
              quality_score: null,
              source: 'bootstrap_rule',
              reason: 'BOOTSTRAP_UNCLASSIFIED',
            };
    qualityUpserts.push({
      literature_id: literatureId,
      ...quality,
    });
  }

  return { scopeUpdates, qualityUpserts };
}

async function loadEnvFiles(files) {
  for (const file of files) {
    let content;
    try {
      content = await fs.readFile(path.resolve(file), 'utf8');
    } catch {
      continue;
    }
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex <= 0) {
        continue;
      }
      const key = trimmed.slice(0, equalsIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) {
        continue;
      }
      process.env[key] = unquoteEnvValue(trimmed.slice(equalsIndex + 1).trim());
    }
  }
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function resolveScopeActivation({ scope, literature, pipelineState, indexedStage, embeddingById }) {
  if (scope.scopeStatus === 'excluded') {
    return {
      activationStatus: 'excluded',
      activationReason: 'BOOTSTRAP_SCOPE_EXCLUDED',
      activatedAt: null,
    };
  }
  if (!PROCESSABLE_SCOPE_STATUSES.has(scope.scopeStatus)) {
    return {
      activationStatus: 'candidate',
      activationReason: 'BOOTSTRAP_SCOPE_NOT_IN_SCOPE',
      activatedAt: null,
    };
  }
  if (isEvidenceReady({ literature, pipelineState, indexedStage, embeddingById })) {
    return {
      activationStatus: 'active',
      activationReason: 'BOOTSTRAP_EVIDENCE_READY',
      activatedAt: normalizeIso(embeddingById.get(literature.activeEmbeddingVersionId)?.activatedAt) ?? new Date().toISOString(),
    };
  }
  if (pipelineState?.citationComplete || pipelineState?.abstractReady || pipelineState?.keyContentReady) {
    return {
      activationStatus: 'needs_review',
      activationReason: 'BOOTSTRAP_IN_SCOPE_NOT_EVIDENCE_READY',
      activatedAt: null,
    };
  }
  return {
    activationStatus: 'candidate',
    activationReason: 'BOOTSTRAP_IN_SCOPE_UNPROCESSED',
    activatedAt: null,
  };
}

function isEvidenceReady({ literature, pipelineState, indexedStage, embeddingById }) {
  if (!literature?.activeEmbeddingVersionId || !pipelineState?.keyContentReady) {
    return false;
  }
  const activeVersion = embeddingById.get(literature.activeEmbeddingVersionId);
  if (!activeVersion?.activatedAt) {
    return false;
  }
  return indexedStage?.status !== 'STALE';
}

async function applyBootstrapPlan(prisma, plan) {
  const now = new Date();
  const actions = [];
  for (const item of plan.scopeUpdates) {
    await prisma.topicLiteratureScope.update({
      where: { id: item.id },
      data: {
        activationStatus: item.to_activation_status,
        activationReason: item.activation_reason,
        activatedAt: item.activated_at ? new Date(item.activated_at) : null,
        updatedAt: now,
      },
    });
    actions.push({
      op: 'update_topic_activation',
      topic_id: item.topic_id,
      literature_id: item.literature_id,
      activation_status: item.to_activation_status,
    });
  }
  for (const item of plan.qualityUpserts) {
    await prisma.literatureQualityAssessment.upsert({
      where: { literatureId: item.literature_id },
      update: {},
      create: {
        id: crypto.randomUUID(),
        literatureId: item.literature_id,
        qualityStatus: item.quality_status,
        qualityScore: item.quality_score,
        qualityComponents: {
          inferred_from: item.reason,
        },
        blockerCodes: item.quality_status === 'excluded' ? ['BOOTSTRAP_SCOPE_EXCLUDED'] : [],
        source: item.source,
        assessedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    actions.push({
      op: 'upsert_quality_assessment',
      literature_id: item.literature_id,
      quality_status: item.quality_status,
    });
  }
  return actions;
}

function summarizePlan(plan, applied) {
  return {
    planned_scope_update_count: plan.scopeUpdates.length,
    planned_quality_upsert_count: plan.qualityUpserts.length,
    applied_action_count: applied.length,
    scope_activation_counts: countBy(plan.scopeUpdates, 'to_activation_status'),
    quality_status_counts: countBy(plan.qualityUpserts, 'quality_status'),
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? 'unknown';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizeIso(value) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function renderMarkdown(report) {
  const lines = [
    '# Literature Evidence Activation Bootstrap',
    '',
    `- Mode: ${report.mode}`,
    `- Status: ${report.status}`,
    `- Planned scope updates: ${report.summary.planned_scope_update_count}`,
    `- Planned quality upserts: ${report.summary.planned_quality_upsert_count}`,
    `- Applied actions: ${report.summary.applied_action_count}`,
    '',
    '## Scope Activation Counts',
    '',
  ];
  for (const [status, count] of Object.entries(report.summary.scope_activation_counts)) {
    lines.push(`- ${status}: ${count}`);
  }
  lines.push('', '## Quality Status Counts', '');
  for (const [status, count] of Object.entries(report.summary.quality_status_counts)) {
    lines.push(`- ${status}: ${count}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
