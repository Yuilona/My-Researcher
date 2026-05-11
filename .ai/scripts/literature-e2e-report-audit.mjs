#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'paper',
  'the',
  'to',
  'using',
  'with',
]);

const DEFAULT_REQUIRED_QUERY_SETS = ['baseline', 'holdout', 'paraphrase', 'adversarial'];

function parseArgs(argv) {
  const args = {
    report: null,
    fixture: null,
    outJson: null,
    outMd: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--report' && next) {
      args.report = next;
      index += 1;
    } else if (arg === '--fixture' && next) {
      args.fixture = next;
      index += 1;
    } else if (arg === '--out-json' && next) {
      args.outJson = next;
      index += 1;
    } else if (arg === '--out-md' && next) {
      args.outMd = next;
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
    '  node .ai/scripts/literature-e2e-report-audit.mjs --report <report.json>',
    '',
    'Options:',
    '  --fixture <path>   Optional evaluator fixture with sample/query metadata',
    '  --out-json <path>  Default: <report-dir>/report-audit.json',
    '  --out-md <path>    Default: <report-dir>/report-audit.md',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = path.resolve(args.report);
  const reportDir = path.dirname(reportPath);
  const outJson = path.resolve(args.outJson ?? path.join(reportDir, 'report-audit.json'));
  const outMd = path.resolve(args.outMd ?? path.join(reportDir, 'report-audit.md'));
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const fixture = args.fixture ? JSON.parse(await fs.readFile(path.resolve(args.fixture), 'utf8')) : {};
  const audit = await auditReport(report, reportDir, fixture);
  await fs.writeFile(outJson, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  await fs.writeFile(outMd, renderMarkdown(audit), 'utf8');
  console.log(JSON.stringify({
    status: audit.status,
    finding_count: audit.findings.length,
    out_json: outJson,
    out_md: outMd,
  }, null, 2));
  process.exit(audit.status === 'FAIL' ? 1 : 0);
}

async function auditReport(report, reportDir, fixture) {
  const findings = [];
  const queryAudit = auditQueries(report, fixture, findings);
  const sampleAudit = auditSamples(report, fixture, findings);
  const telemetryAudit = await auditTelemetry(report, reportDir, findings);
  const storageAudit = await auditStorage(report, reportDir, findings);
  const sourceHealthAudit = auditSourceHealth(report, findings);
  const costAudit = auditCost(report, telemetryAudit, findings);

  const actionableFindings = findings.filter((item) => ['error', 'warning'].includes(readString(item.severity)));
  return {
    generated_at: new Date().toISOString(),
    report_path: path.join(reportDir, 'report.json'),
    run_id: readString(report.run_id),
    source_report_status: readString(report.status),
    status: actionableFindings.some((item) => item.severity === 'error') ? 'FAIL' : actionableFindings.length > 0 ? 'WARN' : 'PASS',
    query_audit: queryAudit,
    sample_audit: sampleAudit,
    source_health_audit: sourceHealthAudit,
    telemetry_audit: telemetryAudit,
    storage_audit: storageAudit,
    cost_audit: costAudit,
    findings,
  };
}

function auditQueries(report, fixture, findings) {
  const queries = Array.isArray(report.golden_queries) ? report.golden_queries : [];
  const fixtureQueries = Array.isArray(fixture.golden_queries) ? fixture.golden_queries : [];
  const fixtureQueryById = new Map(fixtureQueries.map((query) => [readString(query.id), query]));
  const retrievalResults = Array.isArray(report.retrieval_results) ? report.retrieval_results : [];
  const sampleByKey = buildMergedSampleMap(report, fixture);
  const requiredQuerySets = readStringArray(fixture.required_query_sets);
  const expectedQuerySets = requiredQuerySets.length > 0 ? requiredQuerySets : DEFAULT_REQUIRED_QUERY_SETS;
  const querySets = new Map();
  let unclassifiedCount = 0;
  let blindCount = 0;
  let blindHitCount = 0;
  let highLexicalLeakageCount = 0;
  const rows = queries.map((query) => {
    const fixtureQuery = fixtureQueryById.get(readString(query.id)) ?? {};
    const querySet = readString(query.query_set)
      || readString(query.set)
      || readString(fixtureQuery.query_set)
      || readString(fixtureQuery.set)
      || 'unclassified';
    querySets.set(querySet, (querySets.get(querySet) ?? 0) + 1);
    if (querySet === 'unclassified') {
      unclassifiedCount += 1;
    }
    const expectedSample = sampleByKey.get(query.expected) ?? {};
    const lexicalOverlap = lexicalOverlapRatio(readString(query.query), [
      readString(expectedSample.title),
      readString(expectedSample.abstract),
      readString(expectedSample.notes),
    ].join(' '));
    if (lexicalOverlap >= 0.7 && querySet !== 'baseline') {
      highLexicalLeakageCount += 1;
    }
    const retrieval = retrievalResults.find((item) => item.id === query.id);
    if (querySet === 'blind') {
      blindCount += 1;
      if (Boolean(retrieval?.hit_at_5)) {
        blindHitCount += 1;
      }
    }
    return {
      id: readString(query.id),
      expected: readString(query.expected),
      query_set: querySet,
      lexical_overlap_with_visible_sample: lexicalOverlap,
      hit_at_5: Boolean(retrieval?.hit_at_5),
      rank: typeof retrieval?.rank === 'number' ? retrieval.rank : null,
    };
  });

  const missingQuerySets = expectedQuerySets.filter((set) => !querySets.has(set));
  const missingFixtureQueryIds = fixtureQueries
    .map((query) => readString(query.id))
    .filter(Boolean)
    .filter((id) => !queries.some((query) => readString(query.id) === id));
  if (unclassifiedCount > 0 || missingQuerySets.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'QUERY_SET_NOT_STRATIFIED',
      message: 'Golden queries should be split into baseline, holdout, paraphrase, and adversarial sets before using recall as cutover evidence.',
      unclassified_count: unclassifiedCount,
      missing_query_sets: missingQuerySets,
    });
  }
  if (missingFixtureQueryIds.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'QUERY_FIXTURE_COVERAGE_MISSING',
      message: 'The report does not include every query declared by the evaluator fixture.',
      missing_query_ids: missingFixtureQueryIds.slice(0, 50),
      missing_query_count: missingFixtureQueryIds.length,
    });
  }
  if (highLexicalLeakageCount > 0) {
    findings.push({
      severity: 'warning',
      code: 'QUERY_LEXICAL_LEAKAGE_RISK',
      message: 'Some non-baseline queries have high lexical overlap with visible sample metadata.',
      high_lexical_leakage_count: highLexicalLeakageCount,
    });
  }

  return {
    query_count: queries.length,
    query_set_counts: Object.fromEntries([...querySets.entries()].sort()),
    unclassified_count: unclassifiedCount,
    blind_query_count: blindCount,
    blind_hit_at_5_count: blindHitCount,
    blind_recall_at_5: blindCount > 0 ? blindHitCount / blindCount : null,
    high_lexical_leakage_count: highLexicalLeakageCount,
    fixture_query_count: fixtureQueries.length,
    missing_fixture_query_count: missingFixtureQueryIds.length,
    rows,
  };
}

function auditSamples(report, fixture, findings) {
  const samples = Array.isArray(report.samples) ? report.samples : [];
  const perLiterature = Array.isArray(report.per_literature) ? report.per_literature : [];
  const fixtureSamples = Array.isArray(fixture.samples) ? fixture.samples : [];
  const fixtureSampleByKey = new Map(fixtureSamples.map((sample) => [readString(sample.key), sample]));
  const providerCounts = new Map();
  const sourceGroupCounts = new Map();
  let arxivCount = 0;
  let doiCount = 0;
  let edgeCaseCount = 0;
  let noOaCount = 0;
  for (const sample of samples) {
    const fixtureSample = fixtureSampleByKey.get(readString(sample.key)) ?? {};
    const mergedSample = { ...fixtureSample, ...sample };
    const provider = readString(mergedSample.provider) || (readString(mergedSample.arxiv_id) ? 'arxiv' : 'unknown');
    const sourceGroup = readString(mergedSample.source_group) || provider;
    providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
    sourceGroupCounts.set(sourceGroup, (sourceGroupCounts.get(sourceGroup) ?? 0) + 1);
    if (readString(mergedSample.arxiv_id)) {
      arxivCount += 1;
    }
    if (readString(mergedSample.doi)) {
      doiCount += 1;
    }
    const tags = Array.isArray(mergedSample.tags) ? mergedSample.tags.map(readString) : [];
    if (tags.some((tag) => tag.includes('edge') || tag.includes('parser') || tag.includes('ocr') || tag.includes('no-oa'))) {
      edgeCaseCount += 1;
    }
    const rights = readString(mergedSample.rights_class);
    if (rights && rights !== 'OA') {
      noOaCount += 1;
    }
  }

  const missingFixtureSampleKeys = fixtureSamples
    .map((sample) => readString(sample.key))
    .filter(Boolean)
    .filter((key) => !samples.some((sample) => readString(sample.key) === key));
  if (missingFixtureSampleKeys.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'SAMPLE_FIXTURE_COVERAGE_MISSING',
      message: 'The report does not include every sample declared by the evaluator fixture.',
      missing_sample_keys: missingFixtureSampleKeys.slice(0, 50),
      missing_sample_count: missingFixtureSampleKeys.length,
    });
  }
  if (samples.length > 0 && arxivCount === samples.length) {
    findings.push({
      severity: 'warning',
      code: 'SAMPLE_SET_ARXIV_ONLY',
      message: 'The sample set is arXiv-only; add DOI/Unpaywall and non-arXiv OA samples before treating the evaluator as broad cutover evidence.',
      sample_count: samples.length,
    });
  }
  if (doiCount === 0) {
    findings.push({
      severity: 'warning',
      code: 'SAMPLE_SET_MISSING_DOI',
      message: 'No DOI samples were detected; DOI/Unpaywall acquisition quality is not covered.',
    });
  }
  if (edgeCaseCount === 0 && noOaCount === 0) {
    findings.push({
      severity: 'warning',
      code: 'SAMPLE_SET_MISSING_EDGE_CASES',
      message: 'No parser-edge, OCR_REQUIRED, no-OA, or rights-gated samples were detected.',
    });
  }

  const parserQualityRows = perLiterature
    .map((item) => ({
      key: readString(item.key),
      score: readOptionalNumber(item.parser_quality_score),
      bucket: readString(item.parser_quality_bucket),
      parser_status: readString(item.parser_status),
    }))
    .filter((item) => item.score !== null || item.bucket);
  const lowParserQualityRows = parserQualityRows.filter((item) =>
    item.bucket === 'low'
    || (typeof item.score === 'number' && item.score < 0.55));
  if (lowParserQualityRows.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'PARSER_QUALITY_LOW',
      message: 'One or more successfully parsed literature rows have low parser-quality scores; review before using them as broad retrieval-quality evidence.',
      affected_literature: lowParserQualityRows.map((item) => ({
        key: item.key,
        score: item.score,
        bucket: item.bucket,
      })),
    });
  }
  const parserQualityScores = parserQualityRows
    .map((item) => item.score)
    .filter((value) => typeof value === 'number');

  return {
    sample_count: samples.length,
    provider_counts: Object.fromEntries([...providerCounts.entries()].sort()),
    source_group_counts: Object.fromEntries([...sourceGroupCounts.entries()].sort()),
    arxiv_count: arxivCount,
    doi_count: doiCount,
    edge_case_count: edgeCaseCount,
    no_oa_or_rights_gated_count: noOaCount,
    fixture_sample_count: fixtureSamples.length,
    missing_fixture_sample_count: missingFixtureSampleKeys.length,
    parser_quality_score_avg: parserQualityScores.length > 0
      ? parserQualityScores.reduce((sum, value) => sum + value, 0) / parserQualityScores.length
      : null,
    parser_quality_low_count: lowParserQualityRows.length,
  };
}

function buildMergedSampleMap(report, fixture) {
  const fixtureSamples = Array.isArray(fixture.samples) ? fixture.samples : [];
  const reportSamples = Array.isArray(report.samples) ? report.samples : [];
  const sampleByKey = new Map();
  for (const sample of fixtureSamples) {
    sampleByKey.set(readString(sample.key), sample);
  }
  for (const sample of reportSamples) {
    const key = readString(sample.key);
    sampleByKey.set(key, { ...(sampleByKey.get(key) ?? {}), ...sample });
  }
  return sampleByKey;
}

function auditSourceHealth(report, findings) {
  const jobHealth = Array.isArray(report.source_health) ? report.source_health : [];
  const jobHealthByKind = new Map(jobHealth.map((item) => [readString(item.source_kind), item]));
  const samples = Array.isArray(report.samples) ? report.samples : [];
  const rows = Array.isArray(report.per_literature) ? report.per_literature : [];
  const importedRows = rows.filter((item) => readString(item.literature_id));
  const sourceRows = [
    observedSourceHealth('crossref', {
      plannedRows: samples.filter((sample) => readString(sample.provider) === 'crossref'),
      succeededRows: importedRows.filter((item) => readString(item.provider) === 'crossref'),
      allRows: rows.filter((item) => readString(item.provider) === 'crossref'),
    }),
    jobOrObservedSourceHealth('arxiv', jobHealthByKind, rows.filter((item) => readString(item.arxiv_id))),
    jobOrObservedSourceHealth('unpaywall', jobHealthByKind, rows.filter((item) =>
      readString(item.source_group).includes('unpaywall')
      || (readString(item.doi) && readString(item.rights_class) === 'OA'),
    )),
    jobOrObservedSourceHealth('explicit_url', jobHealthByKind, rows.filter((item) =>
      ['explicit_pdf', 'parser_edge'].includes(readString(item.source_group))
      || readString(item.provider) === 'explicit_pdf',
    )),
    jobOrObservedSourceHealth('download', jobHealthByKind, rows.filter((item) =>
      readString(item.expected_pipeline_outcome) === 'indexed'
      || readString(item.download_status) !== 'NOT_RUN',
    )),
  ];
  const uncoveredRows = rows.filter((row) =>
    readString(row.download_status) === 'NOT_RUN'
    && readString(row.expected_pipeline_outcome) === 'indexed',
  );
  if (uncoveredRows.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'SOURCE_HEALTH_UNCOVERED_ROWS',
      message: 'Some indexable samples were not covered by a fulltext acquisition attempt.',
      affected_literature: uncoveredRows.map((row) => readString(row.key)).filter(Boolean),
    });
  }
  return {
    source_count: sourceRows.length,
    report_source_health_available: jobHealth.length > 0,
    rows: sourceRows,
  };
}

function jobOrObservedSourceHealth(sourceKind, jobHealthByKind, rows) {
  const jobHealth = jobHealthByKind.get(sourceKind);
  if (jobHealth) {
    return {
      source_kind: sourceKind,
      planned_count: readNumber(jobHealth.planned_count),
      succeeded_count: readNumber(jobHealth.succeeded_count),
      failed_count: readNumber(jobHealth.failed_count),
      blocked_count: readNumber(jobHealth.blocked_count),
      retryable_failure_count: readNumber(jobHealth.retryable_failure_count),
      non_retryable_failure_count: readNumber(jobHealth.non_retryable_failure_count),
      runtime_status: readString(jobHealth.runtime_status) || null,
      error_counts_by_code: readRecord(jobHealth.error_counts_by_code),
      coverage_source: 'fulltext_acquisition_job',
    };
  }
  return observedSourceHealth(sourceKind, {
    plannedRows: rows,
    succeededRows: successfulDownloadRows(rows),
    allRows: rows,
  });
}

function observedSourceHealth(sourceKind, { plannedRows, succeededRows, allRows }) {
  const failedRows = allRows.filter((item) => ['FAILED', 'PARTIAL'].includes(readString(item.download_status)));
  const blockedRows = allRows.filter((item) => readString(item.download_status) === 'BLOCKED');
  const errorCounts = new Map();
  for (const row of [...failedRows, ...blockedRows]) {
    const code = readString(row.blocker_code) || readString(row.error) || 'UNKNOWN';
    errorCounts.set(code, (errorCounts.get(code) ?? 0) + 1);
  }
  return {
    source_kind: sourceKind,
    planned_count: plannedRows.length,
    succeeded_count: succeededRows.length,
    failed_count: failedRows.length,
    blocked_count: blockedRows.length,
    retryable_failure_count: 0,
    non_retryable_failure_count: failedRows.length + blockedRows.length,
    runtime_status: plannedRows.length > 0 ? 'OBSERVED' : null,
    error_counts_by_code: Object.fromEntries([...errorCounts.entries()].sort()),
    coverage_source: 'report_observed',
  };
}

function successfulDownloadRows(rows) {
  return rows.filter((item) => readString(item.download_status) === 'SUCCEEDED');
}

async function auditTelemetry(report, reportDir, findings) {
  const startedAt = Date.parse(readString(report.started_at));
  const finishedAt = Date.parse(readString(report.finished_at));
  const steps = Array.isArray(report.steps) ? report.steps : [];
  const stepRows = steps.map((step, index) => {
    const at = Date.parse(readString(step.at));
    const nextAt = index + 1 < steps.length ? Date.parse(readString(steps[index + 1]?.at)) : finishedAt;
    return {
      name: readString(step.name),
      status: readString(step.status),
      at: readString(step.at),
      elapsed_to_next_ms: Number.isFinite(at) && Number.isFinite(nextAt) && nextAt >= at ? nextAt - at : null,
      detail: isRecord(step.detail) ? step.detail : {},
    };
  });
  const perLiterature = Array.isArray(report.per_literature) ? report.per_literature : [];
  const missingPerStageTiming = perLiterature.filter((item) =>
    !isRecord(item.timings)
    && !isRecord(item.timings_ms)
    && typeof item.elapsed_ms !== 'number').length;
  if (missingPerStageTiming > 0) {
    findings.push({
      severity: 'warning',
      code: 'PER_LITERATURE_STAGE_TIMING_MISSING',
      message: 'Per-literature stage timing is missing; add download_ms, parser_ms, key_content_ms, embedding_ms, and index_ms to the formal evaluator.',
      affected_literature_count: missingPerStageTiming,
    });
  }

  const llmTelemetry = extractLlmTelemetry(report);
  const totalElapsedMs = Number.isFinite(startedAt) && Number.isFinite(finishedAt) && finishedAt >= startedAt
    ? finishedAt - startedAt
    : null;
  return {
    total_elapsed_ms: totalElapsedMs,
    step_timings: stepRows,
    per_literature_count: perLiterature.length,
    missing_per_literature_stage_timing_count: missingPerStageTiming,
    llm_telemetry: llmTelemetry,
    report_dir: reportDir,
  };
}

async function auditStorage(report, reportDir, findings) {
  const storageDir = path.join(reportDir, 'storage');
  const retentionDays = 30;
  const evidenceStorage = await summarizeDirectory(storageDir, { includeRawPdfManifest: true, retentionDays });
  const rawFilesRoot = readString(readRecord(readRecord(report.environment).storage_roots).raw_files);
  const externalRawStorage = rawFilesRoot && !isPathInside(rawFilesRoot, storageDir)
    ? await summarizeDirectory(rawFilesRoot, { countAllPdfsAsRaw: true, includeRawPdfManifest: true, retentionDays })
    : null;
  const rawPdfManifest = [
    ...evidenceStorage.raw_pdf_manifest,
    ...(externalRawStorage?.raw_pdf_manifest ?? []),
  ].sort((left, right) => left.absolute_path.localeCompare(right.absolute_path));
  const duplicateChecksumCount = countDuplicateRawPdfChecksums(rawPdfManifest);
  const staleRawPdfs = rawPdfManifest.filter((item) => item.retention_status === 'stale_review');
  const storage = {
    exists: evidenceStorage.exists || Boolean(externalRawStorage?.exists),
    file_count: evidenceStorage.file_count + (externalRawStorage?.file_count ?? 0),
    total_bytes: evidenceStorage.total_bytes + (externalRawStorage?.total_bytes ?? 0),
    raw_pdf_count: evidenceStorage.raw_pdf_count + (externalRawStorage?.raw_pdf_count ?? 0),
    raw_pdf_bytes: evidenceStorage.raw_pdf_bytes + (externalRawStorage?.raw_pdf_bytes ?? 0),
    artifact_count: evidenceStorage.artifact_count,
    normalized_text_count: evidenceStorage.normalized_text_count,
    evidence_storage: evidenceStorage,
    external_raw_storage: externalRawStorage,
    raw_pdf_manifest: rawPdfManifest,
    duplicate_raw_pdf_checksum_count: duplicateChecksumCount,
    retention_review: {
      retention_days: retentionDays,
      stale_raw_pdf_count: staleRawPdfs.length,
      stale_raw_pdf_bytes: staleRawPdfs.reduce((sum, item) => sum + item.byte_size, 0),
      destructive_cleanup_allowed: false,
    },
    raw_files_root: rawFilesRoot || null,
  };
  if (storage.raw_pdf_count > 0) {
    findings.push({
      severity: 'info',
      code: 'LOCAL_PDF_RETENTION_REVIEW',
      message: 'Real PDFs are present under local E2E storage or the configured raw files root; keep retention explicit and do not commit them.',
      raw_pdf_count: storage.raw_pdf_count,
      total_bytes: storage.total_bytes,
      raw_files_root: storage.raw_files_root,
    });
  }
  if (duplicateChecksumCount > 0) {
    findings.push({
      severity: 'info',
      code: 'RAW_PDF_DUPLICATE_CHECKSUMS',
      message: 'Multiple raw PDFs share the same checksum; storage coalescing remains non-destructive and should be reviewed before cleanup.',
      duplicate_checksum_count: duplicateChecksumCount,
    });
  }
  if (staleRawPdfs.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'RAW_PDF_RETENTION_REVIEW_DUE',
      message: 'One or more raw PDFs exceed the local retention review threshold; no automatic deletion was performed.',
      stale_raw_pdf_count: staleRawPdfs.length,
      retention_days: retentionDays,
    });
  }
  return storage;
}

function auditCost(report, telemetryAudit, findings) {
  const metrics = isRecord(report.metrics) ? report.metrics : {};
  const knownExternalKeyContentCalls = readNumber(metrics.key_content_external_call_count);
  const llmTelemetry = telemetryAudit.llm_telemetry;
  const priced = {
    key_content_external_call_count: knownExternalKeyContentCalls,
    llm_request_count: llmTelemetry.request_count,
    llm_retry_count: llmTelemetry.retry_count,
    input_tokens: llmTelemetry.input_tokens,
    output_tokens: llmTelemetry.output_tokens,
    embedding_input_tokens: llmTelemetry.embedding_input_tokens,
    total_tokens: llmTelemetry.total_tokens,
    cost_usd: llmTelemetry.cost_usd,
    estimated_cost_usd: llmTelemetry.estimated_cost_usd,
  };
  const unpricedOperations = [];
  const keyContentLlmWasUsed = llmTelemetry.request_count > 0 || knownExternalKeyContentCalls > 0;
  const embeddingWasUsed = readNumber(metrics.indexed_success_count) > 0 || readNumber(metrics.query_count) > 0;
  if (keyContentLlmWasUsed && (llmTelemetry.input_tokens === null || llmTelemetry.output_tokens === null)) {
    unpricedOperations.push('llm_token_counts_missing');
  }
  if (embeddingWasUsed && llmTelemetry.embedding_input_tokens === null) {
    unpricedOperations.push('embedding_token_counts_missing');
  }
  if ((keyContentLlmWasUsed || embeddingWasUsed) && llmTelemetry.cost_usd === null && llmTelemetry.estimated_cost_usd === null) {
    unpricedOperations.push('cost_usd_missing');
  }
  if (unpricedOperations.length > 0) {
    findings.push({
      severity: 'warning',
      code: 'COST_ATTRIBUTION_INCOMPLETE',
      message: 'The E2E report does not include enough token/cost telemetry to compute precise per-stage cost.',
      unpriced_operations: unpricedOperations,
    });
  }
  return {
    priced,
    unpriced_operations: unpricedOperations,
    recommendation: 'Emit input_tokens, output_tokens, embedding_input_tokens, model, provider, and cost_usd per evaluator phase.',
  };
}

function extractLlmTelemetry(report) {
  let requestCount = 0;
  let retryCount = 0;
  let elapsedMs = 0;
  let timeoutCount = 0;
  let rateLimitCount = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let embeddingInputTokens = 0;
  let totalTokens = 0;
  let costUsd = 0;
  let estimatedCostUsd = 0;
  let hasInputTokens = false;
  let hasOutputTokens = false;
  let hasEmbeddingInputTokens = false;
  let hasTotalTokens = false;
  let hasCostUsd = false;
  let hasEstimatedCostUsd = false;
  const reportTelemetry = readReportLlmTelemetry(report);
  if (reportTelemetry) {
    return reportTelemetry;
  }
  for (const item of Array.isArray(report.per_literature) ? report.per_literature : []) {
    for (const diagnostic of Array.isArray(item.diagnostics) ? item.diagnostics : []) {
      requestCount += readNumber(diagnostic.request_count);
      retryCount += readNumber(diagnostic.retry_count);
      elapsedMs += readNumber(diagnostic.elapsed_ms_total);
      timeoutCount += readNumber(diagnostic.timeout_count);
      rateLimitCount += readNumber(diagnostic.rate_limit_count);
      const input = readOptionalNumber(diagnostic.input_tokens_total);
      const output = readOptionalNumber(diagnostic.output_tokens_total);
      const embeddingInput = readOptionalNumber(diagnostic.embedding_input_tokens_total);
      const total = readOptionalNumber(diagnostic.total_tokens);
      const cost = readOptionalNumber(diagnostic.cost_usd);
      const estimatedCost = readOptionalNumber(diagnostic.estimated_cost_usd);
      if (input !== null) {
        inputTokens += input;
        hasInputTokens = true;
      }
      if (output !== null) {
        outputTokens += output;
        hasOutputTokens = true;
      }
      if (embeddingInput !== null) {
        embeddingInputTokens += embeddingInput;
        hasEmbeddingInputTokens = true;
      }
      if (total !== null) {
        totalTokens += total;
        hasTotalTokens = true;
      }
      if (cost !== null) {
        costUsd += cost;
        hasCostUsd = true;
      }
      if (estimatedCost !== null) {
        estimatedCostUsd += estimatedCost;
        hasEstimatedCostUsd = true;
      }
    }
    const rowEmbedding = readRecord(readRecord(item.telemetry).embedding);
    const rowEmbeddingInput = readOptionalNumber(rowEmbedding.embedding_input_tokens);
    if (rowEmbeddingInput !== null) {
      embeddingInputTokens += rowEmbeddingInput;
      hasEmbeddingInputTokens = true;
    }
    const rowEmbeddingCost = readOptionalNumber(rowEmbedding.cost_usd);
    if (rowEmbeddingCost !== null) {
      costUsd += rowEmbeddingCost;
      hasCostUsd = true;
    }
    const rowEmbeddingEstimate = readOptionalNumber(rowEmbedding.estimated_cost_usd);
    if (rowEmbeddingEstimate !== null) {
      estimatedCostUsd += rowEmbeddingEstimate;
      hasEstimatedCostUsd = true;
    }
  }
  return {
    request_count: requestCount,
    retry_count: retryCount,
    elapsed_ms_total: elapsedMs,
    timeout_count: timeoutCount,
    rate_limit_count: rateLimitCount,
    input_tokens: hasInputTokens ? inputTokens : null,
    output_tokens: hasOutputTokens ? outputTokens : null,
    embedding_input_tokens: hasEmbeddingInputTokens ? embeddingInputTokens : null,
    total_tokens: hasTotalTokens ? totalTokens : null,
    cost_usd: hasCostUsd ? costUsd : null,
    estimated_cost_usd: hasEstimatedCostUsd ? estimatedCostUsd : null,
  };
}

function readReportLlmTelemetry(report) {
  const total = readRecord(readRecord(readRecord(report.telemetry).llm).total);
  if (Object.keys(total).length === 0) {
    return null;
  }
  return {
    request_count: readNumber(total.request_count),
    retry_count: readNumber(total.retry_count),
    elapsed_ms_total: readNumber(total.elapsed_ms),
    timeout_count: readNumber(total.timeout_count),
    rate_limit_count: readNumber(total.rate_limit_count),
    input_tokens: readOptionalNumber(total.input_tokens),
    output_tokens: readOptionalNumber(total.output_tokens),
    embedding_input_tokens: readOptionalNumber(total.embedding_input_tokens),
    total_tokens: readOptionalNumber(total.total_tokens),
    cost_usd: readOptionalNumber(total.cost_usd),
    estimated_cost_usd: readOptionalNumber(total.estimated_cost_usd),
  };
}

async function summarizeDirectory(root, options = {}) {
  const retentionDays = typeof options.retentionDays === 'number' ? options.retentionDays : 30;
  const retentionCutoffMs = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const summary = {
    exists: false,
    root,
    file_count: 0,
    total_bytes: 0,
    raw_pdf_count: 0,
    raw_pdf_bytes: 0,
    artifact_count: 0,
    normalized_text_count: 0,
    raw_pdf_manifest: [],
  };
  try {
    await fs.access(root);
    summary.exists = true;
  } catch {
    return summary;
  }
  for await (const filePath of walk(root)) {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      continue;
    }
    summary.file_count += 1;
    summary.total_bytes += stat.size;
    const isRawPdf = (options.countAllPdfsAsRaw || filePath.includes(`${path.sep}raw${path.sep}`)) && filePath.endsWith('.pdf');
    if (isRawPdf) {
      summary.raw_pdf_count += 1;
      summary.raw_pdf_bytes += stat.size;
      if (options.includeRawPdfManifest) {
        summary.raw_pdf_manifest.push({
          root,
          relative_path: path.relative(root, filePath),
          absolute_path: filePath,
          byte_size: stat.size,
          sha256: await sha256File(filePath),
          modified_at: stat.mtime.toISOString(),
          retention_status: stat.mtimeMs < retentionCutoffMs ? 'stale_review' : 'within_retention',
          destructive_cleanup_allowed: false,
        });
      }
    }
    if (filePath.includes(`${path.sep}artifacts${path.sep}`)) {
      summary.artifact_count += 1;
    }
    if (filePath.includes(`${path.sep}normalized${path.sep}`)) {
      summary.normalized_text_count += 1;
    }
  }
  return summary;
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

function countDuplicateRawPdfChecksums(manifest) {
  const countsByChecksum = new Map();
  for (const item of manifest) {
    countsByChecksum.set(item.sha256, (countsByChecksum.get(item.sha256) ?? 0) + 1);
  }
  return [...countsByChecksum.values()].filter((count) => count > 1).length;
}

function isPathInside(candidate, parent) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
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

function lexicalOverlapRatio(query, visibleText) {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) {
    return 0;
  }
  const visibleTokens = new Set(tokenize(visibleText));
  let overlap = 0;
  for (const token of queryTokens) {
    if (visibleTokens.has(token)) {
      overlap += 1;
    }
  }
  return overlap / queryTokens.size;
}

function tokenize(value) {
  return readString(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function renderMarkdown(audit) {
  const metric = (value) => typeof value === 'number' ? value.toLocaleString('en-US') : String(value);
  return `${[
    '# Literature E2E Report Audit',
    '',
    `- Run ID: \`${audit.run_id}\``,
    `- Source report status: \`${audit.source_report_status}\``,
    `- Audit status: \`${audit.status}\``,
    `- Generated: \`${audit.generated_at}\``,
    '',
    '## Findings',
    '',
    audit.findings.length
      ? audit.findings.map((finding) => `- \`${finding.severity}\` \`${finding.code}\`: ${finding.message}`).join('\n')
      : '- None',
    '',
    '## Query Audit',
    '',
    `- query_count: \`${audit.query_audit.query_count}\``,
    `- query_set_counts: \`${JSON.stringify(audit.query_audit.query_set_counts)}\``,
    `- unclassified_count: \`${audit.query_audit.unclassified_count}\``,
    `- blind_query_count: \`${audit.query_audit.blind_query_count}\``,
    `- blind_recall@5: \`${metric(audit.query_audit.blind_recall_at_5 ?? 'n/a')}\``,
    `- high_lexical_leakage_count: \`${audit.query_audit.high_lexical_leakage_count}\``,
    '',
    '## Sample Audit',
    '',
    `- sample_count: \`${audit.sample_audit.sample_count}\``,
    `- provider_counts: \`${JSON.stringify(audit.sample_audit.provider_counts)}\``,
    `- source_group_counts: \`${JSON.stringify(audit.sample_audit.source_group_counts)}\``,
    `- doi_count: \`${audit.sample_audit.doi_count}\``,
    `- edge_case_count: \`${audit.sample_audit.edge_case_count}\``,
    `- parser_quality_score_avg: \`${metric(audit.sample_audit.parser_quality_score_avg)}\``,
    `- parser_quality_low_count: \`${audit.sample_audit.parser_quality_low_count}\``,
    '',
    '## Source Health',
    '',
    `- report_source_health_available: \`${audit.source_health_audit.report_source_health_available}\``,
    `- rows: \`${JSON.stringify(audit.source_health_audit.rows)}\``,
    '',
    '## Telemetry',
    '',
    `- total_elapsed_ms: \`${metric(audit.telemetry_audit.total_elapsed_ms)}\``,
    `- missing_per_literature_stage_timing_count: \`${audit.telemetry_audit.missing_per_literature_stage_timing_count}\``,
    `- llm_request_count: \`${audit.telemetry_audit.llm_telemetry.request_count}\``,
    `- embedding_input_tokens: \`${metric(audit.telemetry_audit.llm_telemetry.embedding_input_tokens)}\``,
    `- estimated_cost_usd: \`${metric(audit.telemetry_audit.llm_telemetry.estimated_cost_usd)}\``,
    '',
    '## Storage',
    '',
    `- storage_exists: \`${audit.storage_audit.exists}\``,
    `- raw_files_root: \`${audit.storage_audit.raw_files_root ?? 'null'}\``,
    `- file_count: \`${audit.storage_audit.file_count}\``,
    `- total_bytes: \`${metric(audit.storage_audit.total_bytes)}\``,
    `- raw_pdf_count: \`${audit.storage_audit.raw_pdf_count}\``,
    `- duplicate_raw_pdf_checksum_count: \`${audit.storage_audit.duplicate_raw_pdf_checksum_count}\``,
    `- retention_days: \`${audit.storage_audit.retention_review.retention_days}\``,
    `- stale_raw_pdf_count: \`${audit.storage_audit.retention_review.stale_raw_pdf_count}\``,
    `- destructive_cleanup_allowed: \`${audit.storage_audit.retention_review.destructive_cleanup_allowed}\``,
    '',
  ].join('\n')}\n`;
}

function readString(value) {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value) {
  return Array.isArray(value)
    ? value.map(readString).filter(Boolean)
    : [];
}

function readNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readOptionalNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
