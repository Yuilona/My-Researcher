import assert from 'node:assert/strict';
import test from 'node:test';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import { AppError } from '../errors/app-error.js';
import { InMemoryTopicSelectionControlPlaneRepository } from '../repositories/in-memory-topic-selection-control-plane-repository.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';

function makeServices() {
  const repository = new InMemoryTopicSelectionControlPlaneRepository();
  let sequence = 0;
  const controlPlane = new TopicSelectionControlPlaneService(repository, {
    idFactory: (prefix) => `${prefix}_${++sequence}`,
    now: () => '2026-05-19T00:00:00.000Z',
  });
  const artifactBoundary = new TopicSelectionNeedDiscoveryArtifactBoundaryService(controlPlane);
  return { artifactBoundary, controlPlane, repository };
}

function ref(refType: string, refId: string): TopicSelectionFunctionalRef {
  return {
    ref_type: refType,
    ref_id: refId,
    title_card_id: 'title_card_001',
  };
}

test('need discovery artifact boundary records redacted snapshots with stable artifact refs', async () => {
  const { artifactBoundary, repository } = makeServices();
  const first = await artifactBoundary.recordArtifact({
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'ranked_candidate_draft_batch',
    payload_schema: 'RankedCandidateDraftBatch@v1',
    source_refs: [ref('evidence_map', 'evidence_map_001')],
    payload: {
      draft_count: 1,
      hidden_reasoning: 'private chain should not persist',
      nested: {
        api_key: 'sk-test-secret',
        visible_summary: 'Grounded candidate batch.',
      },
    },
  });
  const second = await artifactBoundary.recordArtifact({
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'ranked_candidate_draft_batch',
    payload_schema: 'RankedCandidateDraftBatch@v1',
    source_refs: [ref('evidence_map', 'evidence_map_001')],
    payload: {
      draft_count: 1,
      hidden_reasoning: 'private chain should not persist',
      nested: {
        api_key: 'sk-test-secret',
        visible_summary: 'Grounded candidate batch.',
      },
    },
  });

  assert.equal(first.artifact_ref.ref_type, 'artifact_ref');
  assert.equal(first.artifact_entry.artifact_key, 'ranked_candidate_draft_batch');
  assert.equal(first.artifact_ref_record.artifact_kind, 'structured_output');
  assert.equal(first.artifact_ref_record.storage_kind, 'inline');
  assert.equal(first.artifact_ref_record.checksum, second.artifact_ref_record.checksum);
  assert.deepEqual(first.snapshot.redacted_paths.sort(), ['payload.hidden_reasoning', 'payload.nested.api_key']);
  assert.equal(JSON.stringify(first.artifact_ref_record.payload).includes('private chain should not persist'), false);
  assert.equal(JSON.stringify(first.artifact_ref_record.payload).includes('sk-test-secret'), false);
  assert.ok(await repository.findArtifactRefById(first.artifact_ref.ref_id));
});

test('need discovery artifact boundary resolves refs with checksum and expectation guards', async () => {
  const { artifactBoundary } = makeServices();
  const recorded = await artifactBoundary.recordArtifact({
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'candidate_draft_admission_report',
    payload_schema: 'CandidateDraftAdmissionReport@v1',
    payload: {
      admitted: 1,
      raw_debate_transcript: 'transcript is not a business artifact',
    },
  });

  const resolved = await artifactBoundary.resolveArtifactRef(recorded.artifact_ref, {
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'candidate_draft_admission_report',
  });
  assert.equal(resolved.artifact_ref_id, recorded.artifact_ref.ref_id);

  await assert.rejects(
    () => artifactBoundary.resolveArtifactRef(ref('need_candidate', recorded.artifact_ref.ref_id)),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
  await assert.rejects(
    () => artifactBoundary.resolveArtifactRef(recorded.artifact_ref, {
      artifact_key: 'ranked_candidate_draft_batch',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  recorded.artifact_ref_record.checksum = 'tampered';
  await assert.rejects(
    () => artifactBoundary.resolveArtifactRef(recorded.artifact_ref, {
      artifact_key: 'candidate_draft_admission_report',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('need discovery artifact boundary rejects stale snapshot payload hashes and malformed refs', async () => {
  const { artifactBoundary } = makeServices();
  await assert.rejects(
    () => artifactBoundary.recordArtifact({
      title_card_id: 'title_card_001',
      workflow_run_id: 'workflow_run_001',
      node_attempt_id: 'node_attempt_001',
      artifact_key: 'discovery_audit',
      payload_schema: 'DiscoveryAudit@v1',
      source_refs: [{ ref_type: '', ref_id: 'evidence_map_001' }],
      payload: { ok: true },
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );

  const recorded = await artifactBoundary.recordArtifact({
    title_card_id: 'title_card_001',
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'discovery_audit',
    payload_schema: 'DiscoveryAudit@v1',
    source_refs: [ref('evidence_map', 'evidence_map_001')],
    payload: { ok: true },
  });
  const snapshot = recorded.artifact_ref_record.payload as Record<string, unknown>;
  snapshot.payload_hash = 'tampered_payload_hash';
  recorded.artifact_ref_record.checksum = sha256Text(stableStringify(snapshot));

  await assert.rejects(
    () => artifactBoundary.resolveArtifactRef(recorded.artifact_ref, {
      artifact_key: 'discovery_audit',
    }),
    (error: unknown) => error instanceof AppError && error.errorCode === 'INVALID_PAYLOAD',
  );
});

test('need discovery artifact boundary builds node-scoped artifact ref bundles', async () => {
  const { artifactBoundary } = makeServices();
  const ranked = await artifactBoundary.recordArtifact({
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'ranked_candidate_draft_batch',
    payload_schema: 'RankedCandidateDraftBatch@v1',
    payload: { draft_count: 1 },
  });
  const admission = await artifactBoundary.recordArtifact({
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_key: 'candidate_draft_admission_report',
    payload_schema: 'CandidateDraftAdmissionReport@v1',
    payload: { admitted_count: 1 },
  });

  const bundle = artifactBoundary.buildArtifactRefBundle({
    workflow_run_id: 'workflow_run_001',
    node_attempt_id: 'node_attempt_001',
    artifact_entries: [ranked.artifact_entry, admission.artifact_entry],
  });

  assert.equal(bundle.node_id, 'topic-selection.v1a.generate-need-candidate.v1');
  assert.equal(bundle.artifact_refs.length, 2);
  assert.deepEqual(bundle.artifact_refs.map((entry) => entry.artifact_key), [
    'ranked_candidate_draft_batch',
    'candidate_draft_admission_report',
  ]);
});
