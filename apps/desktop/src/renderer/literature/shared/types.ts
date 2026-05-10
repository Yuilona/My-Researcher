// Shared renderer types extracted from App.tsx

export type PanelStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
export type UiOperationStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'saving';

export type PanelState<T> = {
  status: PanelStatus;
  data: T;
  error: string | null;
};

export type TimelineEvent = {
  event_id: string;
  event_type: string;
  module_id?: string;
  timestamp: string;
  node_id?: string;
  summary: string;
  severity?: 'info' | 'warning' | 'error';
};

export type RuntimeMetric = {
  tokens: number | null;
  cost_usd: number | null;
  gpu_requested: number | null;
  gpu_total: number | null;
  updated_at: string;
};

export type ArtifactBundle = {
  proposal_url: string | null;
  paper_url: string | null;
  repo_url: string | null;
  review_url: string | null;
};

export type ReviewDecision = 'approve' | 'reject' | 'hold';

export type ReleaseGateResponse = {
  gate_result: {
    accepted: boolean;
    review_id: string;
    approved_by?: string;
    approved_at?: string;
    audit_ref: string;
  };
};

export type CitationStatus = 'seeded' | 'selected' | 'used' | 'cited' | 'dropped';
export type ScopeStatus = 'in_scope' | 'excluded';
export type LiteratureProvider = 'crossref' | 'arxiv' | 'manual' | 'web' | 'zotero';
export type LiteratureTabKey = 'auto-import' | 'manual-import' | 'overview' | 'content-processing';
export type AutoImportSubTabKey = 'topic-settings' | 'rule-center' | 'runs-alerts';
export type ManualImportSubTabKey = 'file-review' | 'zotero-sync';
export type ContentProcessingSubTabKey = 'operations' | 'clusters' | 'settings';
export type TitleCardPrimaryTabKey =
  | 'overview'
  | 'evidence'
  | 'need'
  | 'research-question'
  | 'value'
  | 'package'
  | 'promotion';
export type TitleCardEvidenceSubTabKey = 'candidates' | 'basket' | 'inspector';
export type TitleCardEditorSubTabKey = 'list' | 'editor';
export type TitleCardPromotionSubTabKey = 'decision' | 'promotion';
export type TitleCardSubTabState = {
  overview: null;
  evidence: TitleCardEvidenceSubTabKey;
  need: TitleCardEditorSubTabKey;
  'research-question': TitleCardEditorSubTabKey;
  value: TitleCardEditorSubTabKey;
  package: TitleCardEditorSubTabKey;
  promotion: TitleCardPromotionSubTabKey;
};
export type ManualUploadFileStatus = 'processing' | 'parsed' | 'empty' | 'failed' | 'accepted' | 'duplicate';
export type AppMode = 'standard' | 'dev';
export type AutoPullScope = 'GLOBAL' | 'TOPIC';
export type AutoPullRuleStatus = 'ACTIVE' | 'PAUSED';
export type AutoPullSource = 'CROSSREF' | 'ARXIV' | 'ZOTERO';
export type AutoPullFrequency = 'DAILY' | 'WEEKLY';
export type AutoPullWeekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type AutoPullSortMode = 'llm_score' | 'hybrid_score';
export type AutoPullTriggerType = 'MANUAL' | 'SCHEDULE';
export type AutoPullRunStatus = 'PENDING' | 'RUNNING' | 'PARTIAL' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type QuerySort = 'importance' | 'updated_at' | 'published_at' | 'title_initial';
export type SortDirection = 'asc' | 'desc';
export type QuerySortPreset = `${QuerySort}|${SortDirection}`;
export type LiteratureOverviewStatus = 'automation_ready' | 'citable' | 'not_citable' | 'excluded';
export type OverviewContentStatus = 'not_ready' | 'abstract_ready' | 'key_content_ready' | 'indexed';
export type OverviewScopeFilterInput = 'all' | LiteratureOverviewStatus;
export type MetadataIntakeTabKey = 'abstract' | 'key-content' | 'retrieval-ready';
export type MetadataIntakeOpenContext = {
  source_url: string | null;
  doi: string | null;
  arxiv_id: string | null;
};
export type PipelineStageCode =
  | 'CITATION_NORMALIZED'
  | 'ABSTRACT_READY'
  | 'FULLTEXT_PREPROCESSED'
  | 'KEY_CONTENT_READY'
  | 'CHUNKED'
  | 'EMBEDDED'
  | 'INDEXED';
export type PipelineStageStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'STALE'
  | 'FAILED'
  | 'BLOCKED'
  | 'SKIPPED';
export type PipelineActionCode =
  | 'process_content'
  | 'process_to_retrievable'
  | 'rebuild_index'
  | 'reextract'
  | 'retry_failed'
  | 'view_reason';
export type PipelineActionReasonCode =
  | 'READY'
  | 'EXCLUDED_BY_SCOPE'
  | 'RIGHTS_RESTRICTED'
  | 'USER_AUTH_DISABLED'
  | 'PREREQUISITE_NOT_READY'
  | 'STAGE_ALREADY_READY'
  | 'RUN_IN_FLIGHT';
export type PipelineStageStatusMap = Record<PipelineStageCode, PipelineStageStatus>;
export type PipelineActionAvailability = {
  action_code: PipelineActionCode;
  enabled: boolean;
  reason_code: PipelineActionReasonCode | null;
  reason_message: string | null;
  requested_stages: PipelineStageCode[];
};
export type PipelineActionSet = {
  process_content: PipelineActionAvailability;
  process_to_retrievable: PipelineActionAvailability;
  rebuild_index: PipelineActionAvailability;
  reextract: PipelineActionAvailability;
  retry_failed: PipelineActionAvailability;
  view_reason: PipelineActionAvailability;
};

export type ContentProcessingBatchJobStatus =
  | 'PLANNED'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'CANCELING'
  | 'CANCELED'
  | 'SUCCEEDED'
  | 'PARTIAL'
  | 'FAILED';
export type ContentProcessingBatchItemStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'PARTIAL'
  | 'BLOCKED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELED';
export type KeyContentBackfillCurationStatus =
  | 'NOT_APPLICABLE'
  | 'CURATION_REQUIRED'
  | 'WAITING_FOR_DOSSIER'
  | 'READY_TO_IMPORT'
  | 'IMPORT_FAILED';
export type LiteratureRightsClass = 'OA' | 'USER_AUTH' | 'RESTRICTED' | 'UNKNOWN';
export type BackfillStageFilters = {
  missing: boolean;
  stale: boolean;
  failed: boolean;
};
export type BackfillWorkset = {
  topic_id?: string;
  paper_id?: string;
  literature_ids?: string[];
  rights_classes?: LiteratureRightsClass[];
  stage_filters?: BackfillStageFilters;
  updated_at_from?: string;
  updated_at_to?: string;
};
export type BackfillOptions = {
  max_parallel_literature_runs: number;
  extraction_concurrency: number;
  embedding_concurrency: number;
  provider_call_budget: number | null;
};
export type BackfillEstimate = {
  dry_run_id: string;
  generated_at: string;
  target_stage: PipelineStageCode;
  workset: BackfillWorkset;
  options: BackfillOptions;
  total_literatures: number;
  selected_count: number;
  planned_item_count: number;
  skipped_ready_count: number;
  blocked_count: number;
  curation_required_count: number;
  stage_counts: Record<PipelineStageCode, number>;
  rights_class_counts: Array<{ rights_class: LiteratureRightsClass; count: number }>;
  estimated_provider_calls: {
    extraction_calls: number;
    embedding_calls: number;
  };
  estimated_storage_bytes: number;
  blockers: Array<{
    literature_id: string;
    title: string;
    reason_code: string;
    reason_message: string;
    retryable: boolean;
  }>;
  plan_items?: Array<{
    literature_id: string;
    title: string;
    rights_class: LiteratureRightsClass;
    requested_stages: PipelineStageCode[];
    blocked: boolean;
    blocker_code: string | null;
    retryable: boolean;
    key_content_curation_status: KeyContentBackfillCurationStatus | null;
  }>;
};
export type BackfillJobItem = {
  item_id: string;
  job_id: string;
  literature_id: string;
  title: string | null;
  status: ContentProcessingBatchItemStatus;
  requested_stages: PipelineStageCode[];
  next_stage_index: number;
  content_processing_run_id: string | null;
  attempt_count: number;
  error_code: string | null;
  error_message: string | null;
  blocker_code: string | null;
  retryable: boolean;
  key_content_curation_status: KeyContentBackfillCurationStatus | null;
  checkpoint: Record<string, unknown>;
  updated_at: string;
};
export type BackfillJob = {
  job_id: string;
  status: ContentProcessingBatchJobStatus;
  target_stage: PipelineStageCode;
  workset: BackfillWorkset;
  options: BackfillOptions;
  dry_run_estimate: BackfillEstimate | null;
  totals: {
    total: number;
    queued: number;
    running: number;
    succeeded: number;
    partial: number;
    blocked: number;
    failed: number;
    skipped: number;
    canceled: number;
  };
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  paused_at: string | null;
  canceled_at: string | null;
  finished_at: string | null;
  updated_at: string;
  items?: BackfillJobItem[];
};
export type CleanupDryRunResult = {
  generated_at: string;
  retention_days: number;
  candidate_count: number;
  protected_active_version_count: number;
  protected_raw_asset_count: number;
  estimated_chunks_to_remove: number;
  estimated_token_indexes_to_remove: number;
};

export type LiteratureClusterType = 'same_work' | 'version_family' | 'related_topic';
export type LiteratureClusterStatus = 'candidate' | 'confirmed' | 'rejected' | 'split';
export type LiteratureClusterMemberRole = 'representative' | 'variant' | 'related';
export type LiteratureClusterMemberDecisionStatus = 'pending' | 'accepted' | 'rejected';
export type LiteratureClusterRelationType =
  | 'same_pdf'
  | 'same_normalized_text'
  | 'same_work'
  | 'preprint_of'
  | 'published_version_of'
  | 'near_duplicate'
  | 'related_method';
export type LiteratureClusterEvidenceSignalType =
  | 'doi'
  | 'arxiv_id'
  | 'title_author_year'
  | 'pdf_sha256'
  | 'text_fingerprint'
  | 'title_similarity'
  | 'author_overlap'
  | 'abstract_similarity'
  | 'embedding_similarity';
export type LiteratureClusterReviewOutcome =
  | 'pending_review'
  | 'same_work_confirmed'
  | 'version_family_confirmed'
  | 'related_topic_confirmed'
  | 'rejected'
  | 'split';
export type LiteratureClusterConsumptionScope = 'none' | 'retrieval_dedup' | 'related_topic_reference';
export type LiteratureClusterReview = {
  outcome: LiteratureClusterReviewOutcome;
  consumption_scope: LiteratureClusterConsumptionScope;
  retrieval_dedup_active: boolean;
  review_required: boolean;
  accepted_member_count: number;
  rejected_member_count: number;
  pending_member_count: number;
  blocking_reasons: string[];
};
export type LiteratureClusterMember = {
  member_id: string;
  cluster_id: string;
  literature_id: string;
  role: LiteratureClusterMemberRole;
  relation_type: LiteratureClusterRelationType;
  confidence: number;
  decision_status: LiteratureClusterMemberDecisionStatus;
  title: string | null;
  canonical_work_key: string | null;
  created_at: string;
  updated_at: string;
};
export type LiteratureClusterEvidence = {
  evidence_id: string;
  cluster_id: string;
  literature_id_a: string;
  literature_id_b: string;
  signal_type: LiteratureClusterEvidenceSignalType;
  score: number;
  payload: Record<string, unknown>;
  created_at: string;
};
export type LiteratureCluster = {
  cluster_id: string;
  cluster_type: LiteratureClusterType;
  status: LiteratureClusterStatus;
  representative_literature_id: string | null;
  confidence: number;
  method: string;
  created_at: string;
  updated_at: string;
  review: LiteratureClusterReview;
  members: LiteratureClusterMember[];
  evidence: LiteratureClusterEvidence[];
};
export type ListLiteratureClustersResponse = {
  items: LiteratureCluster[];
};
export type ClusterCandidateGenerationResponse = {
  generated_count: number;
  clusters: LiteratureCluster[];
  summary: {
    same_pdf_count: number;
    same_normalized_text_count: number;
    title_author_year_count: number;
    fuzzy_near_duplicate_count: number;
    embedding_similarity_count: number;
  };
};

export type LiteratureContentProcessingProviderId = 'openai' | 'dashscope';
export type LiteratureEmbeddingProfileId = 'default' | 'economy';
export type LiteratureExtractionProfileId = 'default' | 'high_accuracy';
export type LiteratureKeyContentReadyMethod = 'llm_gateway' | 'codex_curated' | 'manual_curated';
export type LiteratureContentProcessingProviderSettings = {
  provider: LiteratureContentProcessingProviderId;
  api_key_set: boolean;
  api_key_last_updated_at: string | null;
};
export type LiteratureEmbeddingProfile = {
  profile_id: LiteratureEmbeddingProfileId;
  provider: LiteratureContentProcessingProviderId;
  model: string;
  dimensions: number | null;
};
export type LiteratureExtractionProfile = {
  profile_id: LiteratureExtractionProfileId;
  provider: LiteratureContentProcessingProviderId;
  model: string;
};
export type LiteratureContentProcessingStorageRoots = {
  raw_files: string | null;
  normalized_text: string | null;
  artifacts_cache: string | null;
  indexes: string | null;
  exports: string | null;
};
export type LiteratureFulltextParserSettings = {
  grobid: {
    endpoint_url: string;
  };
};
export type LiteratureFulltextParserHealth = {
  provider: 'grobid';
  endpoint_url: string;
  status: 'ready' | 'unavailable';
  checked_at: string;
  version: string | null;
  details: Record<string, unknown>;
};

export type LiteratureLocalSecretsStatus = {
  openai_api_key_set: boolean;
  updated_at: string | null;
  storage: 'encrypted-file' | 'unavailable';
  error?: string;
};
export type LiteratureContentProcessingSettings = {
  providers: LiteratureContentProcessingProviderSettings[];
  embedding: {
    active_profile_id: LiteratureEmbeddingProfileId;
    profiles: LiteratureEmbeddingProfile[];
  };
  extraction: {
    active_profile_id: LiteratureExtractionProfileId;
    profiles: LiteratureExtractionProfile[];
    runtime: {
      preferred_key_content_method: LiteratureKeyContentReadyMethod;
      section_concurrency: number;
      request_timeout_ms: number;
      max_retries: number;
      prompt_profile_id: string;
      diagnostic_policy: string;
    };
  };
  storage_roots: LiteratureContentProcessingStorageRoots;
  effective_storage_roots: LiteratureContentProcessingStorageRoots;
  fulltext_parser: LiteratureFulltextParserSettings;
  updated_at: string;
};

export type ManualUploadFileItem = {
  id: string;
  fileName: string;
  format: string;
  status: ManualUploadFileStatus;
  rowCount: number;
};

export type ZoteroAction = 'idle' | 'test-link' | 'load-to-list' | 'sync-import';
export type ZoteroLinkResult = {
  tested: boolean;
  connected: boolean;
  totalCount: number;
  duplicateCount: number;
  unparsedCount: number;
  importableCount: number;
};

export type FeedbackRecoveryAction =
  | 'retry-zotero-import'
  | 'reload-overview';
export type InlineFeedbackModel = {
  slot: 'header' | 'auto-import' | 'manual-import' | 'overview';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  recoveryAction?: FeedbackRecoveryAction;
};

export type AutoPullTopicProfile = {
  topic_id: string;
  name: string;
  is_active: boolean;
  initial_pull_pending: boolean;
  include_keywords: string[];
  exclude_keywords: string[];
  venue_filters: string[];
  default_lookback_days: number;
  default_min_year: number | null;
  default_max_year: number | null;
  rule_ids: string[];
  created_at: string;
  updated_at: string;
};

export type AutoPullRuleSourceItem = {
  source: AutoPullSource;
  enabled: boolean;
  priority: number;
  config: Record<string, unknown>;
};

export type AutoPullRuleScheduleItem = {
  frequency: AutoPullFrequency;
  days_of_week: string[];
  hour: number;
  minute: number;
  timezone: string;
  active: boolean;
};

export type AutoPullRule = {
  rule_id: string;
  scope: AutoPullScope;
  topic_id: string | null;
  topic_ids: string[];
  name: string;
  status: AutoPullRuleStatus;
  query_spec: {
    include_keywords: string[];
    exclude_keywords: string[];
    authors: string[];
    venues: string[];
    max_results_per_source: number;
  };
  time_spec: {
    lookback_days: number;
    min_year: number | null;
    max_year: number | null;
  };
  quality_spec: {
    min_quality_score: number;
  };
  sources: AutoPullRuleSourceItem[];
  schedules: AutoPullRuleScheduleItem[];
  created_at: string;
  updated_at: string;
};

export type AutoPullSourceAttempt = {
  source: AutoPullSource;
  status: AutoPullRunStatus;
  fetched_count: number;
  imported_count: number;
  failed_count: number;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  meta: Record<string, unknown>;
};

export type AutoPullSuggestion = {
  suggestion_id: string;
  literature_id: string;
  topic_id: string | null;
  suggested_scope: ScopeStatus;
  reason: string;
  score: number;
  created_at: string;
};

export type AutoPullRun = {
  run_id: string;
  rule_id: string;
  trigger_type: AutoPullTriggerType;
  status: AutoPullRunStatus;
  started_at: string | null;
  finished_at: string | null;
  summary: Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  source_attempts?: AutoPullSourceAttempt[];
  suggestions?: AutoPullSuggestion[];
};

export type TopicScopeItem = {
  scope_id: string;
  topic_id: string;
  literature_id: string;
  scope_status: ScopeStatus;
  reason?: string;
  updated_at: string;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  arxiv_id: string | null;
};

export type PaperLiteratureItem = {
  link_id: string;
  paper_id: string;
  topic_id: string | null;
  literature_id: string;
  citation_status: CitationStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  arxiv_id: string | null;
  source_provider: string | null;
  source_url: string | null;
  tags: string[];
};

export type LiteratureOverviewSummary = {
  total_literatures: number;
  topic_scope_total: number;
  in_scope_count: number;
  excluded_count: number;
  paper_link_total: number;
  cited_count: number;
  used_count: number;
  provider_counts: Array<{ provider: LiteratureProvider; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
};

export type LiteratureOverviewItem = {
  literature_id: string;
  canonical_work_key: string;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  arxiv_id: string | null;
  rights_class: LiteratureRightsClass;
  tags: string[];
  providers: LiteratureProvider[];
  source_url: string | null;
  source_updated_at: string | null;
  topic_scope_status?: ScopeStatus;
  citation_status?: CitationStatus;
  overview_status: LiteratureOverviewStatus;
  content_processing_state: {
    citation_complete: boolean;
    abstract_ready: boolean;
    key_content_ready: boolean;
    fulltext_preprocessed: boolean;
    chunked: boolean;
    embedded: boolean;
    indexed: boolean;
  };
  content_processing_stage_status: PipelineStageStatusMap;
  content_processing_actions: PipelineActionSet;
};

export type LiteratureOverviewData = {
  topic_id?: string;
  paper_id?: string;
  summary: LiteratureOverviewSummary;
  items: LiteratureOverviewItem[];
};

export type LiteratureMetadataRecord = {
  literature_id: string;
  canonical_work_key: string;
  title: string;
  abstract: string | null;
  key_content_digest: string | null;
  updated_at: string;
};

export type GovernanceRequest = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
};
