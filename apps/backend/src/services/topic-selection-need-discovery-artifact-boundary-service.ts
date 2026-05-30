import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import type {
  TopicSelectionArtifactKind,
  TopicSelectionArtifactRefRecord,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionArtifactFunctionalRef,
  TopicSelectionGenerateNeedCandidateArtifactKey,
  TopicSelectionGenerateNeedCandidateArtifactRefBundle,
  TopicSelectionGenerateNeedCandidateArtifactRefEntry,
  TopicSelectionGenerateNeedCandidateArtifactSnapshot,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';

const GENERATE_NEED_CANDIDATE_NODE_ID = 'topic-selection.v1a.generate-need-candidate.v1' as const;
const REDACTION_POLICY = 'topic_selection_generate_need_candidate_artifact_redaction_v1' as const;
const REDACTED_VALUE = '[REDACTED_BY_TOPIC_SELECTION_ARTIFACT_BOUNDARY]';

const ARTIFACT_KIND_BY_KEY: Record<TopicSelectionGenerateNeedCandidateArtifactKey, TopicSelectionArtifactKind> = {
  exploration_context_packet: 'input',
  arbiter_context_packet: 'input',
  debate_role_output: 'structured_output',
  debate_role_level_summary: 'diagnostic',
  debate_issue_frame: 'structured_output',
  debate_final_synthesis: 'diagnostic',
  context_compression_report: 'diagnostic',
  ranked_candidate_draft_batch: 'structured_output',
  minimum_schema_validation_report: 'diagnostic',
  candidate_draft_admission_report: 'diagnostic',
  supplemental_round_routing_decision: 'diagnostic',
  persist_need_candidate_batch_command: 'diagnostic',
  discovery_audit: 'diagnostic',
};

const FORBIDDEN_KEY_PATTERNS = [
  /hidden[_-]?reasoning/i,
  /chain[_-]?of[_-]?thought/i,
  /raw[_-]?provider[_-]?log/i,
  /raw[_-]?debate[_-]?transcript/i,
  /provider[_-]?secret/i,
  /api[_-]?key/i,
  /secret[_-]?key/i,
  /access[_-]?token/i,
  /credential/i,
] as const;

type RecordNeedDiscoveryArtifactInput = {
  workspace_id?: string | null;
  title_card_id?: string | null;
  workflow_run_id: string;
  input_snapshot_id?: string | null;
  node_attempt_id: string;
  artifact_key: TopicSelectionGenerateNeedCandidateArtifactKey;
  payload_schema: string;
  payload: Record<string, unknown>;
  source_refs?: TopicSelectionFunctionalRef[];
  created_by?: 'human' | 'llm' | 'system' | 'hybrid';
};

type RecordNeedDiscoveryArtifactResult = {
  artifact_ref_record: TopicSelectionArtifactRefRecord;
  artifact_ref: TopicSelectionArtifactFunctionalRef;
  artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
  snapshot: TopicSelectionGenerateNeedCandidateArtifactSnapshot;
};

type ResolveArtifactRefExpectation = {
  workflow_run_id?: string;
  node_attempt_id?: string;
  artifact_key?: TopicSelectionGenerateNeedCandidateArtifactKey;
  title_card_id?: string | null;
};

type RedactionResult = {
  value: unknown;
  redactedPaths: string[];
};

export class TopicSelectionNeedDiscoveryArtifactBoundaryService {
  constructor(private readonly controlPlane: TopicSelectionControlPlaneService) {}

  async recordArtifact(input: RecordNeedDiscoveryArtifactInput): Promise<RecordNeedDiscoveryArtifactResult> {
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.payload_schema, 'payload_schema');
    this.assertArtifactKey(input.artifact_key);
    this.assertFunctionalRefs(input.source_refs ?? [], 'source_refs');

    const redaction = this.redactValue(input.payload, ['payload']);
    const redactedPayload = this.assertRecord(redaction.value, 'payload');
    const payloadHash = sha256Text(stableStringify(redactedPayload));
    const snapshot: TopicSelectionGenerateNeedCandidateArtifactSnapshot = {
      schema_version: 'v1',
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      artifact_key: input.artifact_key,
      payload_schema: input.payload_schema,
      redaction_policy: REDACTION_POLICY,
      redacted: redaction.redactedPaths.length > 0,
      redacted_paths: redaction.redactedPaths,
      source_refs: input.source_refs ?? [],
      payload_hash: payloadHash,
      payload: redactedPayload,
    };

    const record = await this.controlPlane.recordArtifactRef({
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      artifact_kind: this.artifactKindForKey(input.artifact_key),
      storage_kind: 'inline',
      payload: snapshot as unknown as Record<string, unknown>,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: input.input_snapshot_id ?? null,
      created_by: input.created_by ?? 'system',
    });
    const artifactRef = this.toArtifactFunctionalRef(record);
    const artifactEntry: TopicSelectionGenerateNeedCandidateArtifactRefEntry = {
      artifact_key: input.artifact_key,
      artifact_ref: artifactRef,
      artifact_hash: this.requiredChecksum(record),
      payload_hash: payloadHash,
      payload_schema: input.payload_schema,
      redacted_paths: redaction.redactedPaths,
    };

    return {
      artifact_ref_record: record,
      artifact_ref: artifactRef,
      artifact_entry: artifactEntry,
      snapshot,
    };
  }

  buildArtifactRefBundle(input: {
    workflow_run_id: string;
    node_attempt_id: string;
    artifact_entries: TopicSelectionGenerateNeedCandidateArtifactRefEntry[];
  }): TopicSelectionGenerateNeedCandidateArtifactRefBundle {
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    for (const [index, entry] of input.artifact_entries.entries()) {
      this.assertArtifactKey(entry.artifact_key);
      this.assertArtifactFunctionalRef(entry.artifact_ref, `artifact_entries[${index}].artifact_ref`);
      this.assertNonEmpty(entry.artifact_hash, `artifact_entries[${index}].artifact_hash`);
      this.assertNonEmpty(entry.payload_hash, `artifact_entries[${index}].payload_hash`);
      this.assertNonEmpty(entry.payload_schema, `artifact_entries[${index}].payload_schema`);
    }
    return {
      schema_version: 'v1',
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      artifact_refs: input.artifact_entries,
    };
  }

  async resolveArtifactRef(
    artifactRef: TopicSelectionFunctionalRef,
    expectation: ResolveArtifactRefExpectation = {},
  ): Promise<TopicSelectionArtifactRefRecord> {
    if (artifactRef.ref_type !== 'artifact_ref') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref must use ref_type artifact_ref.');
    }
    const record = await this.controlPlane.getArtifactRef(artifactRef.ref_id);
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', `Artifact ref ${artifactRef.ref_id} not found.`);
    }
    if (expectation.title_card_id !== undefined && record.title_card_id !== expectation.title_card_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref title_card_id does not match expectation.');
    }
    if (expectation.workflow_run_id && record.workflow_run_id !== expectation.workflow_run_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref workflow_run_id does not match expectation.');
    }
    const snapshot = this.snapshotFromRecord(record);
    if (snapshot.node_id !== GENERATE_NEED_CANDIDATE_NODE_ID) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref does not point to a generate-need-candidate snapshot.');
    }
    if (expectation.node_attempt_id && snapshot.node_attempt_id !== expectation.node_attempt_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref node_attempt_id does not match expectation.');
    }
    if (expectation.artifact_key && snapshot.artifact_key !== expectation.artifact_key) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref artifact_key does not match expectation.');
    }
    if (!record.checksum) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref checksum is required.');
    }
    const actualChecksum = sha256Text(stableStringify(record.payload));
    if (record.checksum !== actualChecksum) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact ref checksum does not match payload.');
    }
    this.assertSnapshotPayloadHash(snapshot);
    return record;
  }

  toArtifactFunctionalRef(record: TopicSelectionArtifactRefRecord): TopicSelectionArtifactFunctionalRef {
    return {
      ref_type: 'artifact_ref',
      ref_id: record.artifact_ref_id,
      title_card_id: record.title_card_id ?? null,
    };
  }

  private snapshotFromRecord(record: TopicSelectionArtifactRefRecord): TopicSelectionGenerateNeedCandidateArtifactSnapshot {
    const payload = this.assertRecord(record.payload, 'artifact payload');
    if (
      payload.node_id !== GENERATE_NEED_CANDIDATE_NODE_ID
      || typeof payload.workflow_run_id !== 'string'
      || typeof payload.node_attempt_id !== 'string'
      || typeof payload.artifact_key !== 'string'
    ) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact payload is not a generate-need-candidate snapshot.');
    }
    return payload as unknown as TopicSelectionGenerateNeedCandidateArtifactSnapshot;
  }

  private assertSnapshotPayloadHash(snapshot: TopicSelectionGenerateNeedCandidateArtifactSnapshot): void {
    const payloadHash = sha256Text(stableStringify(snapshot.payload));
    if (snapshot.payload_hash !== payloadHash) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact snapshot payload_hash does not match payload.');
    }
  }

  private artifactKindForKey(artifactKey: TopicSelectionGenerateNeedCandidateArtifactKey): TopicSelectionArtifactKind {
    this.assertArtifactKey(artifactKey);
    return ARTIFACT_KIND_BY_KEY[artifactKey];
  }

  private assertArtifactKey(value: unknown): asserts value is TopicSelectionGenerateNeedCandidateArtifactKey {
    if (typeof value !== 'string' || !Object.hasOwn(ARTIFACT_KIND_BY_KEY, value)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'artifact_key is not supported for generate-need-candidate.');
    }
  }

  private assertFunctionalRefs(value: unknown, fieldName: string): asserts value is TopicSelectionFunctionalRef[] {
    if (!Array.isArray(value)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be an array.`);
    }
    for (const [index, ref] of value.entries()) {
      this.assertFunctionalRef(ref, `${fieldName}[${index}]`);
    }
  }

  private assertFunctionalRef(value: unknown, fieldName: string): asserts value is TopicSelectionFunctionalRef {
    const ref = this.assertRecord(value, fieldName);
    if (typeof ref.ref_type !== 'string' || ref.ref_type.trim().length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName}.ref_type cannot be empty.`);
    }
    if (typeof ref.ref_id !== 'string' || ref.ref_id.trim().length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName}.ref_id cannot be empty.`);
    }
  }

  private assertArtifactFunctionalRef(
    value: unknown,
    fieldName: string,
  ): asserts value is TopicSelectionArtifactFunctionalRef {
    this.assertFunctionalRef(value, fieldName);
    if ((value as TopicSelectionFunctionalRef).ref_type !== 'artifact_ref') {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName}.ref_type must be artifact_ref.`);
    }
  }

  private requiredChecksum(record: TopicSelectionArtifactRefRecord): string {
    if (!record.checksum) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Recorded artifact is missing checksum.');
    }
    return record.checksum;
  }

  private redactValue(value: unknown, path: string[]): RedactionResult {
    if (Array.isArray(value)) {
      const redactedPaths: string[] = [];
      const next = value.map((item, index) => {
        const redacted = this.redactValue(item, [...path, String(index)]);
        redactedPaths.push(...redacted.redactedPaths);
        return redacted.value;
      });
      return { value: next, redactedPaths };
    }
    if (!value || typeof value !== 'object') {
      return { value, redactedPaths: [] };
    }

    const redactedPaths: string[] = [];
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = [...path, key];
      if (FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        next[key] = REDACTED_VALUE;
        redactedPaths.push(childPath.join('.'));
        continue;
      }
      const redacted = this.redactValue(child, childPath);
      next[key] = redacted.value;
      redactedPaths.push(...redacted.redactedPaths);
    }
    return { value: next, redactedPaths };
  }

  private assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be an object.`);
    }
    return value as Record<string, unknown>;
  }

  private assertNonEmpty(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} cannot be empty.`);
    }
  }
}
