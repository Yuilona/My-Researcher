import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { TopicSelectionFunctionalRef } from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionResourceRoleCounts,
  TopicSelectionResourceRoleScores,
  TopicSelectionResourceRoleTargets,
  TopicSelectionResourceSampleItemRecord,
  TopicSelectionResourceSampleResult,
  TopicSelectionResourceSampleSetRecord,
  TopicSelectionResourceSamplingAuditRecord,
  TopicSelectionResourceSamplingModelRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-resource-sampling-contracts';
import type {
  TopicSelectionResourceSampleCreation,
  TopicSelectionResourceSamplingRepository,
} from '../topic-selection-resource-sampling.repository.js';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function jsonOrNull(value: unknown | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined ? Prisma.JsonNull : toJsonValue(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asFunctionalRef(value: unknown): TopicSelectionFunctionalRef {
  return asRecord(value) as unknown as TopicSelectionFunctionalRef;
}

function asModelRef(value: unknown): TopicSelectionResourceSamplingModelRef {
  const record = asRecord(value);
  return {
    provider_id: typeof record.provider_id === 'string' ? record.provider_id : 'unknown',
    model_id: typeof record.model_id === 'string' ? record.model_id : 'unknown',
    profile_id: typeof record.profile_id === 'string' ? record.profile_id : null,
  };
}

type ResourceSampleSetRow = {
  id: string;
  workspaceId: string | null;
  titleCardId: string | null;
  topicId: string;
  sampleSize: number;
  policyVersion: string;
  status: string;
  roleTargets: Prisma.JsonValue;
  roleCounts: Prisma.JsonValue;
  warnings: string[];
  sampleHash: string;
  model: Prisma.JsonValue;
  inputSnapshotId: string | null;
  workflowRunId: string | null;
  gateResultId: string | null;
  auditRef: Prisma.JsonValue | null;
  createdBy: string;
  createdAt: Date;
};

type ResourceSampleItemRow = {
  id: string;
  sampleSetId: string;
  workspaceId: string | null;
  titleCardId: string | null;
  topicId: string;
  literatureRef: Prisma.JsonValue;
  selectedRole: string;
  selected: boolean;
  rank: number;
  topicRelevance: number;
  evidencePolarity: string;
  roleScores: Prisma.JsonValue;
  confidence: number;
  classificationRationale: string;
  exclusionReason: string | null;
  reviewReason: string | null;
  guardrailCodes: string[];
  methodFamilies: string[];
  createdAt: Date;
};

type ResourceSamplingAuditRow = {
  id: string;
  sampleSetId: string;
  workspaceId: string | null;
  titleCardId: string | null;
  topicId: string;
  policyVersion: string;
  promptTemplateId: string | null;
  promptTemplateVersion: string | null;
  model: Prisma.JsonValue;
  candidateCount: number;
  eligibleCount: number;
  selectedCount: number;
  excludedCount: number;
  warningCodes: string[];
  guardrailSummary: Prisma.JsonValue;
  artifactRefs: Prisma.JsonValue;
  llmStructuredOutput: Prisma.JsonValue;
  createdAt: Date;
};

type ResourceSampleSetWithRelations = ResourceSampleSetRow & {
  items: ResourceSampleItemRow[];
  audits: ResourceSamplingAuditRow[];
};

function toSampleSetRecord(row: ResourceSampleSetRow): TopicSelectionResourceSampleSetRecord {
  return {
    resource_sample_set_id: row.id,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    topic_id: row.topicId,
    sample_size: row.sampleSize,
    policy_version: row.policyVersion,
    status: row.status as TopicSelectionResourceSampleSetRecord['status'],
    role_targets: asRecord(row.roleTargets) as TopicSelectionResourceRoleTargets,
    role_counts: asRecord(row.roleCounts) as TopicSelectionResourceRoleCounts,
    warnings: row.warnings,
    sample_hash: row.sampleHash,
    model: asModelRef(row.model),
    input_snapshot_id: row.inputSnapshotId,
    workflow_run_id: row.workflowRunId,
    gate_result_id: row.gateResultId,
    audit_ref: row.auditRef === null ? null : asFunctionalRef(row.auditRef),
    created_by: row.createdBy as TopicSelectionResourceSampleSetRecord['created_by'],
    created_at: row.createdAt.toISOString(),
  };
}

function toSampleItemRecord(row: ResourceSampleItemRow): TopicSelectionResourceSampleItemRecord {
  return {
    resource_sample_item_id: row.id,
    sample_set_id: row.sampleSetId,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    topic_id: row.topicId,
    literature_ref: asFunctionalRef(row.literatureRef),
    selected_role: row.selectedRole as TopicSelectionResourceSampleItemRecord['selected_role'],
    selected: row.selected,
    rank: row.rank,
    topic_relevance: row.topicRelevance,
    evidence_polarity: row.evidencePolarity as TopicSelectionResourceSampleItemRecord['evidence_polarity'],
    role_scores: asRecord(row.roleScores) as TopicSelectionResourceRoleScores,
    confidence: row.confidence,
    classification_rationale: row.classificationRationale,
    exclusion_reason: row.exclusionReason,
    review_reason: row.reviewReason,
    guardrail_codes: row.guardrailCodes,
    method_families: row.methodFamilies,
    created_at: row.createdAt.toISOString(),
  };
}

function toAuditRecord(row: ResourceSamplingAuditRow): TopicSelectionResourceSamplingAuditRecord {
  return {
    resource_sampling_audit_id: row.id,
    sample_set_id: row.sampleSetId,
    workspace_id: row.workspaceId,
    title_card_id: row.titleCardId,
    topic_id: row.topicId,
    policy_version: row.policyVersion,
    prompt_template_id: row.promptTemplateId,
    prompt_template_version: row.promptTemplateVersion,
    model: asModelRef(row.model),
    candidate_count: row.candidateCount,
    eligible_count: row.eligibleCount,
    selected_count: row.selectedCount,
    excluded_count: row.excludedCount,
    warning_codes: row.warningCodes,
    guardrail_summary: asRecord(row.guardrailSummary),
    artifact_refs: asArray<TopicSelectionFunctionalRef>(row.artifactRefs),
    llm_structured_output: asRecord(row.llmStructuredOutput),
    created_at: row.createdAt.toISOString(),
  };
}

function toResult(row: ResourceSampleSetWithRelations): TopicSelectionResourceSampleResult {
  const candidateItems = row.items
    .map(toSampleItemRecord)
    .sort((left, right) => left.rank - right.rank || left.resource_sample_item_id.localeCompare(right.resource_sample_item_id));
  const audit = row.audits.map(toAuditRecord)[0];
  if (!audit) {
    throw new Error(`ResourceSampleSet ${row.id} audit not found.`);
  }
  return {
    sample_set: toSampleSetRecord(row),
    selected_items: candidateItems.filter((item) => item.selected),
    candidate_items: candidateItems,
    audit,
  };
}

export class PrismaTopicSelectionResourceSamplingRepository implements TopicSelectionResourceSamplingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createResourceSampleSet(
    creation: TopicSelectionResourceSampleCreation,
  ): Promise<TopicSelectionResourceSampleResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.topicSelectionResourceSampleSet.create({
        data: {
          id: creation.sample_set.resource_sample_set_id,
          workspaceId: creation.sample_set.workspace_id ?? null,
          titleCardId: creation.sample_set.title_card_id ?? null,
          topicId: creation.sample_set.topic_id,
          sampleSize: creation.sample_set.sample_size,
          policyVersion: creation.sample_set.policy_version,
          status: creation.sample_set.status,
          roleTargets: toJsonValue(creation.sample_set.role_targets),
          roleCounts: toJsonValue(creation.sample_set.role_counts),
          warnings: creation.sample_set.warnings,
          sampleHash: creation.sample_set.sample_hash,
          model: toJsonValue(creation.sample_set.model),
          inputSnapshotId: creation.sample_set.input_snapshot_id ?? null,
          workflowRunId: creation.sample_set.workflow_run_id ?? null,
          gateResultId: creation.sample_set.gate_result_id ?? null,
          auditRef: jsonOrNull(creation.sample_set.audit_ref),
          createdBy: creation.sample_set.created_by,
          createdAt: new Date(creation.sample_set.created_at),
        },
      });
      if (creation.items.length > 0) {
        await tx.topicSelectionResourceSampleItem.createMany({
          data: creation.items.map((item) => ({
            id: item.resource_sample_item_id,
            sampleSetId: item.sample_set_id,
            workspaceId: item.workspace_id ?? null,
            titleCardId: item.title_card_id ?? null,
            topicId: item.topic_id,
            literatureId: item.literature_ref.ref_id,
            literatureRef: toJsonValue(item.literature_ref),
            selectedRole: item.selected_role,
            selected: item.selected,
            rank: item.rank,
            topicRelevance: item.topic_relevance,
            evidencePolarity: item.evidence_polarity,
            roleScores: toJsonValue(item.role_scores),
            confidence: item.confidence,
            classificationRationale: item.classification_rationale,
            exclusionReason: item.exclusion_reason ?? null,
            reviewReason: item.review_reason ?? null,
            guardrailCodes: item.guardrail_codes,
            methodFamilies: item.method_families,
            createdAt: new Date(item.created_at),
          })),
        });
      }
      await tx.topicSelectionResourceSamplingAudit.create({
        data: {
          id: creation.audit.resource_sampling_audit_id,
          sampleSetId: creation.audit.sample_set_id,
          workspaceId: creation.audit.workspace_id ?? null,
          titleCardId: creation.audit.title_card_id ?? null,
          topicId: creation.audit.topic_id,
          policyVersion: creation.audit.policy_version,
          promptTemplateId: creation.audit.prompt_template_id ?? null,
          promptTemplateVersion: creation.audit.prompt_template_version ?? null,
          model: toJsonValue(creation.audit.model),
          candidateCount: creation.audit.candidate_count,
          eligibleCount: creation.audit.eligible_count,
          selectedCount: creation.audit.selected_count,
          excludedCount: creation.audit.excluded_count,
          warningCodes: creation.audit.warning_codes,
          guardrailSummary: toJsonValue(creation.audit.guardrail_summary),
          artifactRefs: toJsonValue(creation.audit.artifact_refs),
          llmStructuredOutput: toJsonValue(creation.audit.llm_structured_output),
          createdAt: new Date(creation.audit.created_at),
        },
      });
      const row = await tx.topicSelectionResourceSampleSet.findUniqueOrThrow({
        where: { id: creation.sample_set.resource_sample_set_id },
        include: {
          items: { orderBy: [{ rank: 'asc' }, { id: 'asc' }] },
          audits: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      return toResult(row as ResourceSampleSetWithRelations);
    });
  }

  async findResourceSampleSetById(sampleSetId: string): Promise<TopicSelectionResourceSampleResult | null> {
    const row = await this.prisma.topicSelectionResourceSampleSet.findUnique({
      where: { id: sampleSetId },
      include: {
        items: { orderBy: [{ rank: 'asc' }, { id: 'asc' }] },
        audits: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return row ? toResult(row as ResourceSampleSetWithRelations) : null;
  }
}
