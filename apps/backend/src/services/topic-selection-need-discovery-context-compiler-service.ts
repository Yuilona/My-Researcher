import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import type {
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionExecutorKind,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-agent-invocation-contracts';
import type {
  TopicSelectionContextPolicyProfile,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import type {
  TopicSelectionAgentExecutionMode,
  TopicSelectionArtifactFunctionalRef,
  TopicSelectionGenerateNeedCandidateArtifactKey,
  TopicSelectionGenerateNeedCandidateArtifactSnapshot,
  TopicSelectionGenerateNeedCandidateArtifactRefEntry,
  TopicSelectionNeedDiscoveryArbiterContextPayload,
  TopicSelectionNeedDiscoveryCompiledContextPair,
  TopicSelectionNeedDiscoveryContextCompression,
  TopicSelectionNeedDiscoveryContextFamily,
  TopicSelectionNeedDiscoveryContextPacket,
  TopicSelectionNeedDiscoveryExplorationContextPayload,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-need-validation-contracts';
import { AppError } from '../errors/app-error.js';
import { TopicSelectionContextPacketCacheService } from './topic-selection-context-packet-cache-service.js';
import { TopicSelectionLlmRuntimeKeyBuilderService } from './topic-selection-llm-runtime-key-builder-service.js';
import { TopicSelectionNeedDiscoveryArtifactBoundaryService } from './topic-selection-need-discovery-artifact-boundary-service.js';

const GENERATE_NEED_CANDIDATE_NODE_ID = 'topic-selection.v1a.generate-need-candidate.v1' as const;
const CONTEXT_PACKET_SCHEMA_VERSION = 'v1';
const CONTEXT_PACKET_PAYLOAD_SCHEMA = 'TopicSelectionNeedDiscoveryContextPacket@v1';
const DEFAULT_CONTEXT_COMPILER_VERSION = 'topic-selection-need-discovery-context-compiler-v1';
const DEFAULT_CONTEXT_REDACTION_POLICY = 'topic_selection_need_discovery_context_redaction_v1' as const;
const DEFAULT_COMPRESSION_VERSION = 'topic-selection-need-discovery-context-compression-v1';

const FORBIDDEN_CONTEXT_KEY_PATTERNS = [
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

export type CompileNeedDiscoveryContextPairInput = {
  workspace_id?: string | null;
  title_card_id?: string | null;
  workflow_run_id: string;
  input_snapshot_id?: string | null;
  node_attempt_id: string;
  input_refs: TopicSelectionFunctionalRef[];
  policy_version: string;
  output_schema_version: string;
  profile_id: string;
  execution_mode: TopicSelectionAgentExecutionMode;
  exploration_payload: TopicSelectionNeedDiscoveryExplorationContextPayload;
  arbiter_payload: TopicSelectionNeedDiscoveryArbiterContextPayload;
  memory_digest_hash?: string | null;
  candidate_pool_hash?: string | null;
  cache_hit?: boolean;
  exploration_compression?: TopicSelectionNeedDiscoveryContextCompression;
  arbiter_compression?: TopicSelectionNeedDiscoveryContextCompression;
  created_by?: TopicSelectionActorType;
  runtime_context_cache?: NeedDiscoveryRuntimeContextCacheInput | null;
};

export type NeedDiscoveryRuntimeContextCacheBinding = {
  context_policy_profile: TopicSelectionContextPolicyProfile;
  context_policy_profile_hash: string;
  executor_kind: TopicSelectionExecutorKind;
  runtime_invocation_context_hash: string;
  prompt_packet_hash: string;
  prompt_template_id: string;
  prompt_template_version: string;
  model_option_id?: string | null;
  normalized_params_hash?: string | null;
  output_contract: string;
  redaction_policy?: string | null;
  context_packet_hashes?: string[] | null;
  provenance_ref: TopicSelectionFunctionalRef;
};

export type NeedDiscoveryRuntimeContextCacheInput = {
  cache_service: TopicSelectionContextPacketCacheService;
  exploration_context?: NeedDiscoveryRuntimeContextCacheBinding | null;
  arbiter_context?: NeedDiscoveryRuntimeContextCacheBinding | null;
};

export type ResolveNeedDiscoveryContextPacketExpectation = {
  workflow_run_id?: string;
  node_attempt_id?: string;
  context_family?: TopicSelectionNeedDiscoveryContextFamily;
  policy_version?: string;
  output_schema_version?: string;
  profile_id?: string;
  execution_mode?: TopicSelectionAgentExecutionMode;
  cache_key?: string;
  input_refs_hash?: string;
  title_card_id?: string | null;
};

export type TopicSelectionNeedDiscoveryCompiledContextPairResult =
  TopicSelectionNeedDiscoveryCompiledContextPair & {
    exploration_context_packet: TopicSelectionNeedDiscoveryContextPacket;
    arbiter_context_packet: TopicSelectionNeedDiscoveryContextPacket;
    exploration_artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
    arbiter_artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
  };

type CompileSingleContextPacketInput = {
  workspace_id?: string | null;
  title_card_id?: string | null;
  workflow_run_id: string;
  input_snapshot_id?: string | null;
  node_attempt_id: string;
  input_refs: TopicSelectionFunctionalRef[];
  input_refs_hash: string;
  policy_version: string;
  output_schema_version: string;
  profile_id: string;
  execution_mode: TopicSelectionAgentExecutionMode;
  memory_digest_hash: string;
  candidate_pool_hash: string;
  cache_hit: boolean;
  created_at: string;
  created_by?: TopicSelectionActorType;
  context_family: TopicSelectionNeedDiscoveryContextFamily;
  payload: TopicSelectionNeedDiscoveryContextPacket['payload'];
  compression: TopicSelectionNeedDiscoveryContextCompression;
  runtime_cache_binding?: NeedDiscoveryRuntimeContextCacheBinding | null;
  runtime_cache_service?: TopicSelectionContextPacketCacheService | null;
};

export class TopicSelectionNeedDiscoveryContextCompilerService {
  private readonly now: () => string;
  private readonly contextCompilerVersion: string;
  private readonly runtimeKeyBuilder = new TopicSelectionLlmRuntimeKeyBuilderService();

  constructor(
    private readonly artifactBoundary: TopicSelectionNeedDiscoveryArtifactBoundaryService,
    options: {
      now?: () => string;
      contextCompilerVersion?: string;
    } = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.contextCompilerVersion = options.contextCompilerVersion ?? DEFAULT_CONTEXT_COMPILER_VERSION;
  }

  async compileContextPair(
    input: CompileNeedDiscoveryContextPairInput,
  ): Promise<TopicSelectionNeedDiscoveryCompiledContextPairResult> {
    this.assertNonEmpty(input.workflow_run_id, 'workflow_run_id');
    this.assertNonEmpty(input.node_attempt_id, 'node_attempt_id');
    this.assertNonEmpty(input.policy_version, 'policy_version');
    this.assertNonEmpty(input.output_schema_version, 'output_schema_version');
    this.assertNonEmpty(input.profile_id, 'profile_id');
    this.assertFunctionalRefs(input.input_refs, 'input_refs');
    if (input.input_refs.length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'input_refs must contain at least one functional ref.');
    }

    this.assertPayloadShape('exploration_context', input.exploration_payload);
    this.assertPayloadShape('arbiter_context', input.arbiter_payload);

    const inputRefsHash = this.hash(input.input_refs);
    const memoryDigestHash = input.memory_digest_hash?.trim()
      || this.hash(input.exploration_payload.decision_memory_digest);
    const candidatePoolHash = input.candidate_pool_hash?.trim()
      || this.hash(input.arbiter_payload.candidate_pool_digest);
    const createdAt = this.now();
    const common = {
      workspace_id: input.workspace_id ?? null,
      title_card_id: input.title_card_id ?? null,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: input.input_snapshot_id ?? null,
      node_attempt_id: input.node_attempt_id,
      input_refs: input.input_refs,
      input_refs_hash: inputRefsHash,
      policy_version: input.policy_version,
      output_schema_version: input.output_schema_version,
      profile_id: input.profile_id,
      execution_mode: input.execution_mode,
      memory_digest_hash: memoryDigestHash,
      candidate_pool_hash: candidatePoolHash,
      cache_hit: input.cache_hit ?? false,
      created_at: createdAt,
      created_by: input.created_by ?? 'system',
    };

    const exploration = await this.compileContextPacket({
      ...common,
      context_family: 'exploration_context',
      payload: input.exploration_payload,
      compression: input.exploration_compression ?? this.defaultCompression([
        'raw_authority_artifact_refs',
        'evidence_resource_digest',
        'candidate_memory_digest',
      ]),
      runtime_cache_binding: input.runtime_context_cache?.exploration_context ?? null,
      runtime_cache_service: input.runtime_context_cache?.cache_service ?? null,
    });
    const arbiter = await this.compileContextPacket({
      ...common,
      context_family: 'arbiter_context',
      payload: input.arbiter_payload,
      compression: input.arbiter_compression ?? this.defaultCompression([
        'raw_authority_artifact_refs',
        'role_level_summaries',
        'arbiter_context',
      ]),
      runtime_cache_binding: input.runtime_context_cache?.arbiter_context ?? null,
      runtime_cache_service: input.runtime_context_cache?.cache_service ?? null,
    });

    return {
      schema_version: CONTEXT_PACKET_SCHEMA_VERSION,
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      exploration_context_ref: exploration.artifact_ref,
      arbiter_context_ref: arbiter.artifact_ref,
      exploration_context_hash: exploration.packet.payload_hash,
      arbiter_context_hash: arbiter.packet.payload_hash,
      exploration_cache_key: exploration.packet.cache_key,
      arbiter_cache_key: arbiter.packet.cache_key,
      exploration_runtime_cache_key_hash: exploration.packet.runtime_cache_key_hash ?? null,
      arbiter_runtime_cache_key_hash: arbiter.packet.runtime_cache_key_hash ?? null,
      artifact_refs: [exploration.artifact_entry, arbiter.artifact_entry],
      exploration_context_packet: exploration.packet,
      arbiter_context_packet: arbiter.packet,
      exploration_artifact_entry: exploration.artifact_entry,
      arbiter_artifact_entry: arbiter.artifact_entry,
    };
  }

  async resolveContextPacket(
    artifactRef: TopicSelectionFunctionalRef,
    expectation: ResolveNeedDiscoveryContextPacketExpectation = {},
  ): Promise<TopicSelectionNeedDiscoveryContextPacket> {
    if (!expectation.context_family) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'context_family expectation is required when resolving context packets.');
    }
    const artifactExpectation: {
      title_card_id?: string | null;
      workflow_run_id?: string;
      node_attempt_id?: string;
      artifact_key: TopicSelectionGenerateNeedCandidateArtifactKey;
    } = {
      artifact_key: this.artifactKeyForFamily(expectation.context_family),
    };
    if (expectation.title_card_id !== undefined) {
      artifactExpectation.title_card_id = expectation.title_card_id;
    }
    if (expectation.workflow_run_id) {
      artifactExpectation.workflow_run_id = expectation.workflow_run_id;
    }
    if (expectation.node_attempt_id) {
      artifactExpectation.node_attempt_id = expectation.node_attempt_id;
    }
    const record = await this.artifactBoundary.resolveArtifactRef(artifactRef, artifactExpectation);
    const snapshot = this.assertRecord(record.payload, 'artifact payload');
    const packet = this.assertRecord(snapshot.payload, 'context packet') as unknown as TopicSelectionNeedDiscoveryContextPacket;
    this.validateContextPacket(packet, expectation);
    return packet;
  }

  validateContextPacket(
    packet: TopicSelectionNeedDiscoveryContextPacket,
    expectation: ResolveNeedDiscoveryContextPacketExpectation = {},
  ): void {
    if (packet.schema_version !== CONTEXT_PACKET_SCHEMA_VERSION) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet schema_version is not supported.');
    }
    if (packet.node_id !== GENERATE_NEED_CANDIDATE_NODE_ID) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet node_id is not supported.');
    }
    if (expectation.context_family && packet.context_family !== expectation.context_family) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet family does not match expectation.');
    }
    if (expectation.workflow_run_id && packet.workflow_run_id !== expectation.workflow_run_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet workflow_run_id does not match expectation.');
    }
    if (expectation.node_attempt_id && packet.node_attempt_id !== expectation.node_attempt_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet node_attempt_id does not match expectation.');
    }
    if (expectation.policy_version && packet.policy_version !== expectation.policy_version) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet policy_version does not match expectation.');
    }
    if (expectation.output_schema_version && packet.output_schema_version !== expectation.output_schema_version) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet output_schema_version does not match expectation.');
    }
    if (expectation.profile_id && packet.profile_id !== expectation.profile_id) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet profile_id does not match expectation.');
    }
    if (expectation.execution_mode && packet.execution_mode !== expectation.execution_mode) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet execution_mode does not match expectation.');
    }
    if (packet.redaction_policy !== DEFAULT_CONTEXT_REDACTION_POLICY) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet redaction_policy is not supported.');
    }
    this.assertFunctionalRefs(packet.input_refs, 'context packet input_refs');
    this.assertPayloadShape(packet.context_family, packet.payload);

    const actualInputRefsHash = this.hash(packet.input_refs);
    if (packet.input_refs_hash !== actualInputRefsHash) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet input_refs_hash does not match input_refs.');
    }
    if (expectation.input_refs_hash && packet.input_refs_hash !== expectation.input_refs_hash) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet input_refs_hash does not match expectation.');
    }
    const actualPayloadHash = this.hash(packet.payload);
    if (packet.payload_hash !== actualPayloadHash) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet payload_hash does not match payload.');
    }
    const expectedCacheKey = this.buildCacheKey(packet);
    if (packet.cache_key !== expectedCacheKey) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet cache_key is stale for its envelope.');
    }
    if (expectation.cache_key && packet.cache_key !== expectation.cache_key) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Context packet cache_key does not match expectation.');
    }
  }

  private async compileContextPacket(input: CompileSingleContextPacketInput): Promise<{
    packet: TopicSelectionNeedDiscoveryContextPacket;
    artifact_ref: TopicSelectionArtifactFunctionalRef;
    artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
  }> {
    this.assertPayloadShape(input.context_family, input.payload);
    const payloadHash = this.hash(input.payload);
    const packet = {
      schema_version: CONTEXT_PACKET_SCHEMA_VERSION,
      node_id: GENERATE_NEED_CANDIDATE_NODE_ID,
      workflow_run_id: input.workflow_run_id,
      node_attempt_id: input.node_attempt_id,
      context_family: input.context_family,
      input_refs: input.input_refs,
      input_refs_hash: input.input_refs_hash,
      context_compiler_version: this.contextCompilerVersion,
      policy_version: input.policy_version,
      output_schema_version: input.output_schema_version,
      profile_id: input.profile_id,
      execution_mode: input.execution_mode,
      cache_key: '',
      cache_hit: input.cache_hit,
      redaction_policy: DEFAULT_CONTEXT_REDACTION_POLICY,
      created_at: input.created_at,
      memory_digest_hash: input.memory_digest_hash,
      candidate_pool_hash: input.candidate_pool_hash,
      payload_hash: payloadHash,
      compression: input.compression,
      payload: input.payload,
    } as TopicSelectionNeedDiscoveryContextPacket;
    packet.cache_key = this.buildCacheKey(packet);
    packet.runtime_cache_key_hash = input.runtime_cache_binding
      ? this.buildRuntimeContextCacheKey(input, packet).hash
      : null;
    this.validateContextPacket(packet);

    const cached = await this.resolveRuntimeCacheHit(input, packet);
    if (cached) {
      return cached;
    }

    const artifact = await this.artifactBoundary.recordArtifact({
      workspace_id: input.workspace_id,
      title_card_id: input.title_card_id,
      workflow_run_id: input.workflow_run_id,
      input_snapshot_id: input.input_snapshot_id,
      node_attempt_id: input.node_attempt_id,
      artifact_key: this.artifactKeyForFamily(input.context_family),
      payload_schema: CONTEXT_PACKET_PAYLOAD_SCHEMA,
      payload: packet as unknown as Record<string, unknown>,
      source_refs: input.input_refs,
      created_by: input.created_by ?? 'system',
    });

    await this.recordRuntimeCacheArtifact(input, packet, artifact.artifact_ref, artifact.artifact_entry.artifact_hash);
    return {
      packet,
      artifact_ref: artifact.artifact_ref,
      artifact_entry: artifact.artifact_entry,
    };
  }

  private async resolveRuntimeCacheHit(
    input: CompileSingleContextPacketInput,
    packet: TopicSelectionNeedDiscoveryContextPacket,
  ): Promise<{
    packet: TopicSelectionNeedDiscoveryContextPacket;
    artifact_ref: TopicSelectionArtifactFunctionalRef;
    artifact_entry: TopicSelectionGenerateNeedCandidateArtifactRefEntry;
  } | null> {
    if (!input.runtime_cache_service || !input.runtime_cache_binding) {
      return null;
    }

    const runtimeKey = this.buildRuntimeContextCacheKey(input, packet);
    const cacheResult = await input.runtime_cache_service.lookup({
      cache_key: runtimeKey.value,
      context_policy_profile: input.runtime_cache_binding.context_policy_profile,
      context_policy_profile_hash: input.runtime_cache_binding.context_policy_profile_hash,
      source_refs_hash: input.input_refs_hash,
      provenance_ref: input.runtime_cache_binding.provenance_ref,
    });
    if (cacheResult.cache_result === 'miss' || cacheResult.cache_result === 'not_applicable') {
      return null;
    }
    if (cacheResult.cache_result !== 'hit') {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        `Context packet runtime cache returned ${cacheResult.cache_result}.`,
      );
    }
    if (!cacheResult.artifact_ref || !cacheResult.artifact_hash) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Context packet cache hit did not include artifact metadata.');
    }

    const record = await this.artifactBoundary.resolveArtifactRef(cacheResult.artifact_ref, {
      title_card_id: input.title_card_id,
      artifact_key: this.artifactKeyForFamily(input.context_family),
    });
    const snapshot = this.snapshotFromArtifactRecord(record.payload);
    const cachedPacket = this.assertRecord(snapshot.payload, 'cached context packet') as unknown as TopicSelectionNeedDiscoveryContextPacket;
    this.validateContextPacket(cachedPacket, {
      context_family: input.context_family,
      policy_version: input.policy_version,
      output_schema_version: input.output_schema_version,
      profile_id: input.profile_id,
      execution_mode: input.execution_mode,
      input_refs_hash: input.input_refs_hash,
    });

    return {
      packet: {
        ...cachedPacket,
        cache_hit: true,
      },
      artifact_ref: cacheResult.artifact_ref as TopicSelectionArtifactFunctionalRef,
      artifact_entry: {
        artifact_key: this.artifactKeyForFamily(input.context_family),
        artifact_ref: cacheResult.artifact_ref as TopicSelectionArtifactFunctionalRef,
        artifact_hash: cacheResult.artifact_hash,
        payload_hash: cachedPacket.payload_hash,
        payload_schema: CONTEXT_PACKET_PAYLOAD_SCHEMA,
        redacted_paths: snapshot.redacted_paths,
      },
    };
  }

  private async recordRuntimeCacheArtifact(
    input: CompileSingleContextPacketInput,
    packet: TopicSelectionNeedDiscoveryContextPacket,
    artifactRef: TopicSelectionArtifactFunctionalRef,
    artifactHash: string,
  ): Promise<void> {
    if (!input.runtime_cache_service || !input.runtime_cache_binding) {
      return;
    }
    const runtimeKey = this.buildRuntimeContextCacheKey(input, packet);
    await input.runtime_cache_service.recordFreshArtifact({
      cache_key: runtimeKey.value,
      context_policy_profile: input.runtime_cache_binding.context_policy_profile,
      context_policy_profile_hash: input.runtime_cache_binding.context_policy_profile_hash,
      artifact_ref: artifactRef,
      artifact_hash: artifactHash,
      source_refs_hash: input.input_refs_hash,
      provenance_ref: input.runtime_cache_binding.provenance_ref,
    });
  }

  private buildRuntimeContextCacheKey(
    input: CompileSingleContextPacketInput,
    packet: TopicSelectionNeedDiscoveryContextPacket,
  ) {
    if (!input.runtime_cache_binding) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Runtime cache binding is required.');
    }
    const binding = input.runtime_cache_binding;
    return this.runtimeKeyBuilder.buildContextPacketCacheKey({
      node_id: packet.node_id,
      invocation_slot_id: binding.context_policy_profile.invocation_slot_id,
      execution_mode: packet.execution_mode,
      executor_kind: binding.executor_kind,
      context_family: binding.context_policy_profile.context_family,
      runtime_invocation_context_hash: binding.runtime_invocation_context_hash,
      input_refs_hash: packet.input_refs_hash,
      context_packet_hashes: binding.context_packet_hashes ?? [packet.payload_hash],
      prompt_packet_hash: binding.prompt_packet_hash,
      policy_version: packet.policy_version,
      schema_version: binding.context_policy_profile.schema_version,
      context_compiler_version: packet.context_compiler_version,
      prompt_template_id: binding.prompt_template_id,
      prompt_template_version: binding.prompt_template_version,
      profile_hash: binding.context_policy_profile_hash,
      model_option_id: binding.model_option_id ?? null,
      normalized_params_hash: binding.normalized_params_hash ?? null,
      output_contract: binding.output_contract,
      redaction_policy: binding.redaction_policy ?? binding.context_policy_profile.redaction_policy,
      cache_scope: binding.context_policy_profile.cache_policy.cache_scope,
    });
  }

  private snapshotFromArtifactRecord(value: unknown): TopicSelectionGenerateNeedCandidateArtifactSnapshot {
    const snapshot = this.assertRecord(value, 'artifact payload');
    if (
      snapshot.node_id !== GENERATE_NEED_CANDIDATE_NODE_ID
      || typeof snapshot.workflow_run_id !== 'string'
      || typeof snapshot.node_attempt_id !== 'string'
      || typeof snapshot.artifact_key !== 'string'
      || !Array.isArray(snapshot.redacted_paths)
    ) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'Artifact payload is not a generate-need-candidate snapshot.');
    }
    return snapshot as unknown as TopicSelectionGenerateNeedCandidateArtifactSnapshot;
  }

  private buildCacheKey(input: Pick<
    TopicSelectionNeedDiscoveryContextPacket,
    | 'schema_version'
    | 'node_id'
    | 'context_family'
    | 'input_refs_hash'
    | 'policy_version'
    | 'context_compiler_version'
    | 'output_schema_version'
    | 'profile_id'
    | 'execution_mode'
    | 'memory_digest_hash'
    | 'candidate_pool_hash'
  >): string {
    return this.hash({
      candidate_pool_hash: input.candidate_pool_hash,
      context_compiler_version: input.context_compiler_version,
      context_family: input.context_family,
      execution_mode: input.execution_mode,
      input_refs_hash: input.input_refs_hash,
      memory_digest_hash: input.memory_digest_hash,
      node_id: input.node_id,
      policy_version: input.policy_version,
      profile_id: input.profile_id,
      schema_version: input.schema_version,
      output_schema_version: input.output_schema_version,
    });
  }

  private defaultCompression(layerKeys: string[]): TopicSelectionNeedDiscoveryContextCompression {
    return {
      compression_version: DEFAULT_COMPRESSION_VERSION,
      layer_keys: layerKeys,
    };
  }

  private artifactKeyForFamily(
    contextFamily: TopicSelectionNeedDiscoveryContextFamily,
  ): TopicSelectionGenerateNeedCandidateArtifactKey {
    return contextFamily === 'exploration_context'
      ? 'exploration_context_packet'
      : 'arbiter_context_packet';
  }

  private assertPayloadShape(
    contextFamily: TopicSelectionNeedDiscoveryContextFamily,
    payload: TopicSelectionNeedDiscoveryContextPacket['payload'],
  ): void {
    const record = this.assertRecord(payload, `${contextFamily} payload`);
    this.assertNoForbiddenKeys(record, ['payload']);
    if (contextFamily === 'exploration_context') {
      for (const key of [
        'topic_scope',
        'evidence_signal_digest',
        'resource_sample_digest',
        'search_coverage_digest',
        'sibling_candidate_digest',
        'decision_memory_digest',
      ]) {
        this.assertRecord(record[key], `exploration_context.${key}`);
      }
      for (const key of ['exploration_prompts', 'challenge_prompts', 'allowed_outputs', 'forbidden_outputs']) {
        this.assertStringArray(record[key], `exploration_context.${key}`);
      }
      return;
    }

    this.assertFunctionalRef(record.node_policy_ref, 'arbiter_context.node_policy_ref');
    this.assertFunctionalRef(record.output_schema_ref, 'arbiter_context.output_schema_ref');
    this.assertRecord(record.authority_boundary, 'arbiter_context.authority_boundary');
    if (typeof record.max_persisted_candidates !== 'number') {
      throw new AppError(400, 'INVALID_PAYLOAD', 'arbiter_context.max_persisted_candidates must be a number.');
    }
    this.assertStringArray(record.deterministic_gate_checklist, 'arbiter_context.deterministic_gate_checklist');
    this.assertRecordArray(record.role_level_summaries, 'arbiter_context.role_level_summaries');
    this.assertRecord(record.candidate_pool_digest, 'arbiter_context.candidate_pool_digest');
    this.assertRecordArray(record.evidence_ref_table, 'arbiter_context.evidence_ref_table');
    this.assertRecordArray(record.rejected_framing_table, 'arbiter_context.rejected_framing_table');
    this.assertRecordArray(record.unresolved_points, 'arbiter_context.unresolved_points');
    this.assertStringArray(record.batch_ranking_rules, 'arbiter_context.batch_ranking_rules');
    this.assertStringArray(record.persistence_rules, 'arbiter_context.persistence_rules');
    this.assertStringArray(record.failure_rules, 'arbiter_context.failure_rules');
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
    const record = this.assertRecord(value, fieldName);
    if (typeof record.ref_type !== 'string' || record.ref_type.trim().length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName}.ref_type cannot be empty.`);
    }
    if (typeof record.ref_id !== 'string' || record.ref_id.trim().length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName}.ref_id cannot be empty.`);
    }
  }

  private assertRecordArray(value: unknown, fieldName: string): asserts value is Record<string, unknown>[] {
    if (!Array.isArray(value)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be an array.`);
    }
    for (const [index, item] of value.entries()) {
      this.assertRecord(item, `${fieldName}[${index}]`);
    }
  }

  private assertStringArray(value: unknown, fieldName: string): asserts value is string[] {
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be an array of non-empty strings.`);
    }
  }

  private assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} must be an object.`);
    }
    return value as Record<string, unknown>;
  }

  private assertNoForbiddenKeys(value: unknown, path: string[]): void {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => this.assertNoForbiddenKeys(item, [...path, String(index)]));
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = [...path, key];
      if (FORBIDDEN_CONTEXT_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        throw new AppError(400, 'INVALID_PAYLOAD', `Context packet contains forbidden key ${childPath.join('.')}.`);
      }
      this.assertNoForbiddenKeys(child, childPath);
    }
  }

  private assertNonEmpty(value: string, fieldName: string): void {
    if (!value.trim()) {
      throw new AppError(400, 'INVALID_PAYLOAD', `${fieldName} cannot be empty.`);
    }
  }

  private hash(value: unknown): string {
    return sha256Text(stableStringify(value));
  }
}
