import type {
  TopicSelectionFunctionalRef,
  TopicSelectionPromptPacketCacheResultEnvelope,
  TopicSelectionPromptQualityDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-llm-runtime-contracts';

export type TopicSelectionPromptPacketFreshnessStatus =
  TopicSelectionPromptPacketCacheResultEnvelope['freshness_status'];

export interface TopicSelectionPromptPacketCacheStoreEntry {
  prompt_packet_hash: string;
  prompt_template_id: string;
  prompt_template_version: string;
  prompt_variant_key: string;
  invocation_slot_id: string;
  context_policy_profile_id: string;
  context_policy_profile_version: string;
  context_policy_profile_hash: string;
  output_contract: string;
  redaction_policy: string;
  context_packet_hashes_hash: string;
  compression_report_hash: string | null;
  compressed_context_hash: string | null;
  dynamic_material_refs_hash: string | null;
  model_option_id: string | null;
  normalized_params_hash: string | null;
  runtime_modifiers_hash: string;
  redacted_prompt_artifact_ref: TopicSelectionFunctionalRef;
  redacted_prompt_artifact_hash: string;
  prompt_quality_report_ref: TopicSelectionFunctionalRef;
  prompt_quality_report_hash: string;
  quality_decision: TopicSelectionPromptQualityDecision;
  freshness_status: TopicSelectionPromptPacketFreshnessStatus;
  provenance_ref: TopicSelectionFunctionalRef;
  blocker_codes: string[];
  warning_codes: string[];
}

export interface TopicSelectionPromptPacketCachePutResult {
  entry: TopicSelectionPromptPacketCacheStoreEntry;
  inserted: boolean;
}

export interface TopicSelectionPromptPacketCacheStore {
  findByPromptPacketHash(
    promptPacketHash: string,
  ): Promise<TopicSelectionPromptPacketCacheStoreEntry | null>;
  putIfAbsent(
    entry: TopicSelectionPromptPacketCacheStoreEntry,
  ): Promise<TopicSelectionPromptPacketCachePutResult>;
}
