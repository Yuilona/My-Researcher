import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  TopicSelectionFunctionalRef,
  TopicSelectionPromptQualityDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';
import type {
  TopicSelectionPromptPacketCachePutResult,
  TopicSelectionPromptPacketCacheStore,
  TopicSelectionPromptPacketCacheStoreEntry,
  TopicSelectionPromptPacketFreshnessStatus,
} from '../topic-selection-prompt-packet-cache-store.repository.js';

type PromptPacketCacheIndexRow = {
  promptPacketHash: string;
  promptTemplateId: string;
  promptTemplateVersion: string;
  promptVariantKey: string;
  invocationSlotId: string;
  contextPolicyProfileId: string;
  contextPolicyProfileVersion: string;
  contextPolicyProfileHash: string;
  outputContract: string;
  redactionPolicy: string;
  contextPacketHashesHash: string;
  compressionReportHash: string | null;
  compressedContextHash: string | null;
  dynamicMaterialRefsHash: string | null;
  modelOptionId: string | null;
  normalizedParamsHash: string | null;
  runtimeModifiersHash: string;
  redactedPromptArtifactRef: Prisma.JsonValue;
  redactedPromptArtifactHash: string;
  promptQualityReportRef: Prisma.JsonValue;
  promptQualityReportHash: string;
  qualityDecision: string;
  freshnessStatus: string;
  provenanceRef: Prisma.JsonValue;
  blockerCodes: Prisma.JsonValue;
  warningCodes: Prisma.JsonValue;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function toFunctionalRef(value: unknown): TopicSelectionFunctionalRef {
  const record = asRecord(value);
  return {
    ref_type: typeof record.ref_type === 'string' ? record.ref_type : '',
    ref_id: typeof record.ref_id === 'string' ? record.ref_id : '',
    version_id: typeof record.version_id === 'string' ? record.version_id : null,
    title_card_id: typeof record.title_card_id === 'string' ? record.title_card_id : null,
  };
}

function toStoreEntry(row: PromptPacketCacheIndexRow): TopicSelectionPromptPacketCacheStoreEntry {
  return {
    prompt_packet_hash: row.promptPacketHash,
    prompt_template_id: row.promptTemplateId,
    prompt_template_version: row.promptTemplateVersion,
    prompt_variant_key: row.promptVariantKey,
    invocation_slot_id: row.invocationSlotId,
    context_policy_profile_id: row.contextPolicyProfileId,
    context_policy_profile_version: row.contextPolicyProfileVersion,
    context_policy_profile_hash: row.contextPolicyProfileHash,
    output_contract: row.outputContract,
    redaction_policy: row.redactionPolicy,
    context_packet_hashes_hash: row.contextPacketHashesHash,
    compression_report_hash: row.compressionReportHash,
    compressed_context_hash: row.compressedContextHash,
    dynamic_material_refs_hash: row.dynamicMaterialRefsHash,
    model_option_id: row.modelOptionId,
    normalized_params_hash: row.normalizedParamsHash,
    runtime_modifiers_hash: row.runtimeModifiersHash,
    redacted_prompt_artifact_ref: toFunctionalRef(row.redactedPromptArtifactRef),
    redacted_prompt_artifact_hash: row.redactedPromptArtifactHash,
    prompt_quality_report_ref: toFunctionalRef(row.promptQualityReportRef),
    prompt_quality_report_hash: row.promptQualityReportHash,
    quality_decision: row.qualityDecision as TopicSelectionPromptQualityDecision,
    freshness_status: row.freshnessStatus as TopicSelectionPromptPacketFreshnessStatus,
    provenance_ref: toFunctionalRef(row.provenanceRef),
    blocker_codes: asStringArray(row.blockerCodes),
    warning_codes: asStringArray(row.warningCodes),
  };
}

export class PrismaTopicSelectionPromptPacketCacheStore
implements TopicSelectionPromptPacketCacheStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: {
      allowMissingTableFallback?: boolean;
      now?: () => Date;
    } = {},
  ) {}

  async findByPromptPacketHash(
    promptPacketHash: string,
  ): Promise<TopicSelectionPromptPacketCacheStoreEntry | null> {
    const row = await this.withMissingTableFallback(
      () => this.prisma.topicSelectionPromptPacketCacheIndex.findUnique({
        where: { promptPacketHash },
      }),
      null,
    );
    return row ? toStoreEntry(row) : null;
  }

  async putIfAbsent(
    entry: TopicSelectionPromptPacketCacheStoreEntry,
  ): Promise<TopicSelectionPromptPacketCachePutResult> {
    const existing = await this.findByPromptPacketHash(entry.prompt_packet_hash);
    if (existing) {
      return {
        entry: existing,
        inserted: false,
      };
    }

    try {
      const row = await this.withMissingTableFallback(
        () => this.prisma.topicSelectionPromptPacketCacheIndex.create({
          data: {
            promptPacketHash: entry.prompt_packet_hash,
            promptTemplateId: entry.prompt_template_id,
            promptTemplateVersion: entry.prompt_template_version,
            promptVariantKey: entry.prompt_variant_key,
            invocationSlotId: entry.invocation_slot_id,
            contextPolicyProfileId: entry.context_policy_profile_id,
            contextPolicyProfileVersion: entry.context_policy_profile_version,
            contextPolicyProfileHash: entry.context_policy_profile_hash,
            outputContract: entry.output_contract,
            redactionPolicy: entry.redaction_policy,
            contextPacketHashesHash: entry.context_packet_hashes_hash,
            compressionReportHash: entry.compression_report_hash,
            compressedContextHash: entry.compressed_context_hash,
            dynamicMaterialRefsHash: entry.dynamic_material_refs_hash,
            modelOptionId: entry.model_option_id,
            normalizedParamsHash: entry.normalized_params_hash,
            runtimeModifiersHash: entry.runtime_modifiers_hash,
            redactedPromptArtifactRef: toJsonValue(entry.redacted_prompt_artifact_ref),
            redactedPromptArtifactHash: entry.redacted_prompt_artifact_hash,
            promptQualityReportRef: toJsonValue(entry.prompt_quality_report_ref),
            promptQualityReportHash: entry.prompt_quality_report_hash,
            qualityDecision: entry.quality_decision,
            freshnessStatus: entry.freshness_status,
            provenanceRef: toJsonValue(entry.provenance_ref),
            blockerCodes: toJsonValue(entry.blocker_codes),
            warningCodes: toJsonValue(entry.warning_codes),
            createdAt: this.now(),
            updatedAt: this.now(),
          },
        }),
        null,
      );
      if (!row) {
        return {
          entry,
          inserted: false,
        };
      }
      return {
        entry: toStoreEntry(row),
        inserted: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const racedEntry = await this.findByPromptPacketHash(entry.prompt_packet_hash);
        if (racedEntry) {
          return {
            entry: racedEntry,
            inserted: false,
          };
        }
      }
      throw error;
    }
  }

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }

  private async withMissingTableFallback<T>(
    operation: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        this.options.allowMissingTableFallback === true
        && error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2021'
      ) {
        return fallback;
      }
      throw error;
    }
  }
}
