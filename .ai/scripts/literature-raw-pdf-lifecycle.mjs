#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_ROOT = '/Volumes/DataDisk/Paper/Auto';
const DEFAULT_RETENTION_DAYS = 30;

function parseArgs(argv) {
  const args = {
    root: process.env.LITERATURE_E2E_RAW_FILES_ROOT ?? DEFAULT_ROOT,
    mode: 'dry-run',
    retentionDays: DEFAULT_RETENTION_DAYS,
    activeManifest: null,
    quarantineDir: null,
    outJson: null,
    outMd: null,
    confirmApply: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--root' && next) {
      args.root = next;
      index += 1;
    } else if (arg === '--mode' && next) {
      args.mode = next;
      index += 1;
    } else if (arg === '--retention-days' && next) {
      args.retentionDays = Number(next);
      index += 1;
    } else if (arg === '--active-manifest' && next) {
      args.activeManifest = next;
      index += 1;
    } else if (arg === '--quarantine-dir' && next) {
      args.quarantineDir = next;
      index += 1;
    } else if (arg === '--out-json' && next) {
      args.outJson = next;
      index += 1;
    } else if (arg === '--out-md' && next) {
      args.outMd = next;
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
  if (!Number.isFinite(args.retentionDays) || args.retentionDays < 0) {
    throw new Error('--retention-days must be a non-negative number.');
  }
  args.root = path.resolve(args.root);
  args.quarantineDir = path.resolve(args.quarantineDir ?? path.join(args.root, '.retention-quarantine'));
  const defaultOutDir = path.join(process.cwd(), '.ai/.tmp/literature-raw-pdf-lifecycle');
  args.outJson = path.resolve(args.outJson ?? path.join(defaultOutDir, 'lifecycle-report.json'));
  args.outMd = path.resolve(args.outMd ?? path.join(defaultOutDir, 'lifecycle-report.md'));
  return args;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node .ai/scripts/literature-raw-pdf-lifecycle.mjs [--mode dry-run|apply] [--root /Volumes/DataDisk/Paper/Auto]',
    '',
    'Options:',
    '  --retention-days <n>       Default: 30',
    '  --active-manifest <json>   report.json or report-audit.json whose raw_pdf_manifest paths are protected',
    '  --quarantine-dir <path>    Default: <root>/.retention-quarantine',
    '  --confirm-apply           Required for --mode apply',
    '  --out-json <path>          Default: .ai/.tmp/literature-raw-pdf-lifecycle/lifecycle-report.json',
    '  --out-md <path>            Default: .ai/.tmp/literature-raw-pdf-lifecycle/lifecycle-report.md',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await assertSafeRoot(args.root);
  const protectedPaths = args.activeManifest
    ? await readProtectedPaths(path.resolve(args.activeManifest))
    : new Set();
  const plan = await buildLifecyclePlan(args, protectedPaths);
  const applied = args.mode === 'apply' ? await applyLifecyclePlan(args, plan) : [];
  const report = {
    ...plan,
    mode: args.mode,
    applied_actions: applied,
    status: plan.blockers.length === 0 ? 'PASS' : 'FAIL',
  };
  await fs.mkdir(path.dirname(args.outJson), { recursive: true });
  await fs.mkdir(path.dirname(args.outMd), { recursive: true });
  await fs.writeFile(args.outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(args.outMd, renderMarkdown(report), 'utf8');
  console.log(JSON.stringify({
    status: report.status,
    mode: args.mode,
    scanned_pdf_count: report.scanned_pdf_count,
    planned_action_count: report.planned_actions.length,
    applied_action_count: report.applied_actions.length,
    out_json: args.outJson,
    out_md: args.outMd,
  }, null, 2));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

async function assertSafeRoot(root) {
  const parsed = path.parse(root);
  if (root === parsed.root) {
    throw new Error('Refusing to scan filesystem root.');
  }
  const relativeToHome = path.relative(os.homedir(), root);
  if (relativeToHome === '') {
    throw new Error('Refusing to scan the entire home directory.');
  }
  await fs.mkdir(root, { recursive: true });
}

async function readProtectedPaths(manifestPath) {
  const raw = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const paths = new Set();
  for (const item of extractRawPdfManifest(raw)) {
    const absolute = readString(item.absolute_path);
    if (absolute) {
      paths.add(path.resolve(absolute));
    }
  }
  for (const row of Array.isArray(raw.per_literature) ? raw.per_literature : []) {
    const assetPath = readString(row.raw_file_path) || readString(row.fulltext_path);
    if (assetPath) {
      paths.add(path.resolve(assetPath));
    }
  }
  return paths;
}

function extractRawPdfManifest(raw) {
  if (Array.isArray(raw.raw_pdf_manifest)) {
    return raw.raw_pdf_manifest;
  }
  const storageAudit = readRecord(raw.storage_audit);
  if (Array.isArray(storageAudit.raw_pdf_manifest)) {
    return storageAudit.raw_pdf_manifest;
  }
  return [];
}

async function buildLifecyclePlan(args, protectedPaths) {
  const now = Date.now();
  const retentionCutoffMs = now - (args.retentionDays * 24 * 60 * 60 * 1000);
  const files = [];
  for await (const filePath of walk(args.root)) {
    if (!filePath.toLowerCase().endsWith('.pdf')) {
      continue;
    }
    if (isPathInside(filePath, args.quarantineDir)) {
      continue;
    }
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      continue;
    }
    files.push({
      absolute_path: filePath,
      relative_path: path.relative(args.root, filePath),
      byte_size: stat.size,
      modified_at: stat.mtime.toISOString(),
      age_days: Math.max(0, (now - stat.mtimeMs) / (24 * 60 * 60 * 1000)),
      stale: stat.mtimeMs < retentionCutoffMs,
      protected: protectedPaths.has(path.resolve(filePath)),
      sha256: await sha256File(filePath),
    });
  }

  const byChecksum = new Map();
  for (const file of files) {
    const group = byChecksum.get(file.sha256) ?? [];
    group.push(file);
    byChecksum.set(file.sha256, group);
  }

  const plannedActions = [];
  const reviewOnly = [];
  for (const group of byChecksum.values()) {
    group.sort((left, right) => Date.parse(left.modified_at) - Date.parse(right.modified_at));
    if (group.length === 1) {
      const only = group[0];
      if (only.stale && !only.protected) {
        reviewOnly.push({
          action: 'review_stale_single_copy',
          path: only.absolute_path,
          reason: 'stale raw PDF has no duplicate retained copy; automatic quarantine is not safe',
        });
      }
      continue;
    }
    const retained = group.find((item) => item.protected) ?? group[group.length - 1];
    for (const file of group) {
      if (file.absolute_path === retained.absolute_path || file.protected) {
        continue;
      }
      if (!file.stale) {
        reviewOnly.push({
          action: 'review_fresh_duplicate',
          path: file.absolute_path,
          retained_path: retained.absolute_path,
          reason: 'duplicate checksum is still within retention; no automatic quarantine planned',
        });
        continue;
      }
      plannedActions.push({
        action: 'quarantine_stale_duplicate',
        path: file.absolute_path,
        relative_path: file.relative_path,
        retained_path: retained.absolute_path,
        sha256: file.sha256,
        byte_size: file.byte_size,
        destructive_cleanup_allowed: false,
      });
    }
  }

  const blockers = [];
  if (args.mode === 'apply' && !args.confirmApply) {
    blockers.push('apply mode requires --confirm-apply');
  }
  return {
    generated_at: new Date().toISOString(),
    root: args.root,
    quarantine_dir: args.quarantineDir,
    retention_days: args.retentionDays,
    active_manifest: args.activeManifest ? path.resolve(args.activeManifest) : null,
    scanned_pdf_count: files.length,
    scanned_pdf_bytes: files.reduce((sum, item) => sum + item.byte_size, 0),
    protected_pdf_count: files.filter((item) => item.protected).length,
    duplicate_checksum_count: [...byChecksum.values()].filter((group) => group.length > 1).length,
    stale_pdf_count: files.filter((item) => item.stale).length,
    planned_actions: plannedActions,
    review_only: reviewOnly,
    blockers,
  };
}

async function applyLifecyclePlan(args, plan) {
  if (plan.blockers.length > 0) {
    return [];
  }
  const operationDir = path.join(args.quarantineDir, new Date().toISOString().replace(/[:.]/g, '-'));
  const applied = [];
  for (const action of plan.planned_actions) {
    const target = path.join(operationDir, action.relative_path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.rename(action.path, target);
    applied.push({
      ...action,
      quarantine_path: target,
      applied_at: new Date().toISOString(),
    });
  }
  if (applied.length > 0) {
    await fs.writeFile(path.join(operationDir, 'manifest.json'), `${JSON.stringify(applied, null, 2)}\n`, 'utf8');
  }
  return applied;
}

async function* walk(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

function renderMarkdown(report) {
  return `${[
    '# Literature Raw PDF Lifecycle',
    '',
    `- status: \`${report.status}\``,
    `- mode: \`${report.mode}\``,
    `- root: \`${report.root}\``,
    `- scanned_pdf_count: \`${report.scanned_pdf_count}\``,
    `- duplicate_checksum_count: \`${report.duplicate_checksum_count}\``,
    `- stale_pdf_count: \`${report.stale_pdf_count}\``,
    `- protected_pdf_count: \`${report.protected_pdf_count}\``,
    `- planned_action_count: \`${report.planned_actions.length}\``,
    `- applied_action_count: \`${report.applied_actions.length}\``,
    '',
    '## Planned Actions',
    '',
    report.planned_actions.length
      ? report.planned_actions.map((item) => `- \`${item.action}\` ${item.path} -> retained ${item.retained_path}`).join('\n')
      : '- None',
    '',
    '## Review Only',
    '',
    report.review_only.length
      ? report.review_only.map((item) => `- \`${item.action}\` ${item.path}: ${item.reason}`).join('\n')
      : '- None',
    '',
    '## Blockers',
    '',
    report.blockers.length ? report.blockers.map((item) => `- ${item}`).join('\n') : '- None',
    '',
  ].join('\n')}\n`;
}

function isPathInside(candidate, parent) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function readString(value) {
  return typeof value === 'string' ? value : '';
}

function readRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
