import type {
  AuthorizationMetadata,
  BlockerRef,
  ClaimEvidenceCoverageRow,
  DecisionRecord,
  DecisionTimelineEntry,
  DimensionName,
  GitWeakMappingRef,
  LessonRecord,
  ObjectPointer,
  ProtocolBaselineReproReadiness,
  PromoteToPaperProjectRequest,
  PromoteToPaperProjectResponse,
  ReadinessVerifyRequest,
  ReadinessVerifyResponse,
  ReportPointer,
  ReportProjection,
  ResearchArgumentActor,
  ResearchArgumentWorkspace,
  ResearchBranch,
  SeedWorkspaceFromTitleCardRequest,
  SeedWorkspaceFromTitleCardResponse,
  SourceTraceRef,
  SubmissionRiskFinding,
  SubmissionRiskReport,
  SyncEligibility,
  WritingEntryPacket,
  WorkspaceSummary,
} from '@paper-engineering-assistant/shared/research-lifecycle/research-argument-contracts';
import {
  DIMENSION_NAMES,
} from '@paper-engineering-assistant/shared/research-lifecycle/research-argument-contracts';
import type { AbstractStateSnapshot } from '@paper-engineering-assistant/shared/research-lifecycle/research-argument-contracts';
import type {
  CreatePaperProjectRequest,
  CreatePaperProjectResponse,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-project-contracts';
import {
  buildResearchArgumentBranchGraph,
  type ResearchArgumentBranchGraph,
} from '../research-argument/branch-graph.js';
import {
  buildCoverageProjection,
  buildDecisionTimelineProjection,
  buildReadinessProjection,
} from '../research-argument/projection-builders.js';
import {
  buildClaimEvidenceCoverageRows,
  buildDecisionTimelineEntries,
  buildProtocolBaselineReproReadiness,
  buildWorkspaceSummary,
} from '../research-argument/read-models.js';
import { synthesizeAbstractStateSnapshot } from '../research-argument/state-synthesizer.js';
import {
  dedupeBlockers,
  dedupeObjectPointers,
  dedupeSourceTraceRefs,
  dedupeStrings,
} from '../research-argument/support.js';
import type {
  ResearchArgumentGraphObject,
  ResearchArgumentGraphObjectKind,
  ResearchArgumentGraphObjectKindMap,
} from '../research-argument/graph-kinds.js';
import type { ResearchArgumentRepository } from '../repositories/research-argument.repository.js';

export interface CreateResearchArgumentWorkspaceInput {
  workspace_id?: string;
  branch_id?: string;
  title_card_id: string;
  branch_name?: string;
  source_trace_refs?: SourceTraceRef[];
  sync_eligibility?: SyncEligibility;
  authorization_metadata?: AuthorizationMetadata;
  git_weak_mapping_refs?: GitWeakMappingRef[];
  audit_ref?: string;
}

export interface CreateResearchArgumentBranchInput {
  workspace_id: string;
  branch_id?: string;
  branch_name: string;
  parent_branch_id?: string;
  hypothesis_summary?: string;
  branch_reason?: string;
  activate?: boolean;
}

export interface RecordResearchArgumentDecisionInput {
  decision_id?: string;
  workspace_id: string;
  branch_id: string;
  action: DecisionRecord['action'];
  reason: string;
  actor: DecisionRecord['actor'];
  human_confirmed: boolean;
  confirmation_note?: string;
  linked_object_ids?: string[];
  audit_ref?: string;
}

export interface RecordResearchArgumentLessonInput {
  lesson_record_id?: string;
  workspace_id: string;
  branch_id: string;
  lesson_type: LessonRecord['lesson_type'];
  summary: string;
  origin_decision_id?: string;
  origin_run_ids?: string[];
  applicability_tags?: string[];
  reliability?: number;
}

export interface ResearchArgumentPaperProjectGateway {
  createPaperProject(input: CreatePaperProjectRequest): Promise<CreatePaperProjectResponse>;
  deletePaperProject?(paperId: string): Promise<void>;
}

export interface ResearchArgumentRecomputeResult {
  workspace: ResearchArgumentWorkspace;
  branch: ResearchBranch;
  snapshot: AbstractStateSnapshot;
  summary: WorkspaceSummary;
  coverage_rows: ClaimEvidenceCoverageRow[];
  protocol_baseline_repro_readiness: ProtocolBaselineReproReadiness;
  decision_timeline: DecisionTimelineEntry[];
  report_projections: ReportProjection[];
}

export interface ResearchArgumentPromoteToPaperProjectResult
  extends PromoteToPaperProjectResponse {
  paper_project_created: boolean;
  writing_entry_packet: WritingEntryPacket;
  submission_risk_report: SubmissionRiskReport;
}

export class ResearchArgumentService {
  constructor(
    private readonly repository: ResearchArgumentRepository,
    private readonly paperProjectGateway: ResearchArgumentPaperProjectGateway | null = null,
  ) {}

  async seedWorkspaceFromTitleCard(
    input: SeedWorkspaceFromTitleCardRequest,
  ): Promise<SeedWorkspaceFromTitleCardResponse> {
    assertHasText(input.title_card_id, 'title_card_id');
    const result = await this.createWorkspaceSkeleton({
      title_card_id: input.title_card_id,
      source_trace_refs: buildSeedTraceRefs(input),
      audit_ref: `research_argument_seed:${input.created_by}:${input.title_card_id}`,
    });

    return {
      workspace_id: result.workspace.workspace_id,
      branch_id: result.branch.branch_id,
      seed_trace_refs: result.workspace.source_trace_refs,
      created_at: result.workspace.created_at,
    };
  }

  async verifyReadiness(
    input: ReadinessVerifyRequest,
  ): Promise<ReadinessVerifyResponse> {
    assertHasText(input.workspace_id, 'workspace_id');
    assertHasText(input.branch_id, 'branch_id');
    const result = await this.recompute(input.workspace_id, input.branch_id);
    return this.toReadinessVerifyResponse(result, input.requested_by);
  }

  async promoteToPaperProject(
    input: PromoteToPaperProjectRequest,
  ): Promise<ResearchArgumentPromoteToPaperProjectResult> {
    assertHasText(input.workspace_id, 'workspace_id');
    assertHasText(input.branch_id, 'branch_id');
    assertHasText(input.title_card_id, 'title_card_id');
    assertHasText(input.target_paper_title, 'target_paper_title');
    if (!this.paperProjectGateway) {
      throw new Error('Research argument PaperProject promotion requires a configured PaperProject gateway.');
    }

    const paperProjectGateway = this.paperProjectGateway;
    let createdPaperId: string | null = null;
    try {
      return await this.repository.withTransaction(async (repository) => {
        const now = nowIso();
        const workspace = await mustFindWorkspace(repository, input.workspace_id);
        if (workspace.title_card_id !== input.title_card_id) {
          throw new Error(
            `Research argument workspace ${input.workspace_id} belongs to title card ${workspace.title_card_id}, not ${input.title_card_id}.`,
          );
        }
        const branch = await mustFindBranchInWorkspace(repository, input.workspace_id, input.branch_id);
        if (workspace.workspace_status === 'archived' || workspace.workspace_status === 'killed') {
          throw new Error(`Research argument workspace ${workspace.workspace_id} is not promotable.`);
        }
        if (branch.branch_status !== 'active') {
          throw new Error(`Research argument branch ${branch.branch_id} is not active.`);
        }

        const recompute = await this.recomputeInternal(
          repository,
          input.workspace_id,
          input.branch_id,
          now,
        );
        const readiness = this.toReadinessVerifyResponse(recompute, input.created_by);
        if (readiness.readiness_decision !== 'ready_for_writing_entry') {
          throw new Error(
            `Research argument branch ${input.branch_id} is not ready for PaperProject promotion: ${readiness.readiness_decision}.`,
          );
        }

        const context = await this.loadBranchContextFromRepository(
          repository,
          input.workspace_id,
          input.branch_id,
        );
        const existingPaperId = recompute.workspace.paper_id ?? workspace.paper_id ?? null;
        const paperProject = existingPaperId
          ? {
              paper_id: existingPaperId,
              status: 'active' as const,
              paper_active_sp_full: null,
              paper_active_sp_partial: null,
              created_at: now,
            }
          : await paperProjectGateway.createPaperProject({
              title_card_id: input.title_card_id,
              title: input.target_paper_title.trim(),
              research_direction: input.research_direction?.trim() || 'research_argument',
              created_by: input.created_by,
              initial_context: {
                literature_evidence_ids: this.literatureEvidenceIdsForPromotion(
                  recompute.workspace,
                  context.graph,
                ),
              },
            });
        if (!existingPaperId) {
          createdPaperId = paperProject.paper_id;
        }

        const auditRef = `research_argument_promote:${input.workspace_id}:${input.branch_id}:${paperProject.paper_id}`;
        const sidecars = this.buildPromotionSidecars({
          workspace: recompute.workspace,
          branch: recompute.branch,
          graph: context.graph,
          snapshot: recompute.snapshot,
          readiness,
          coverageRows: recompute.coverage_rows,
          protocolBaselineReproReadiness: recompute.protocol_baseline_repro_readiness,
          reportProjections: recompute.report_projections,
          paperId: paperProject.paper_id,
          actor: input.created_by,
          auditRef,
          now,
        });

        const sidecarProjections = await repository.replaceReportProjections(
          input.workspace_id,
          input.branch_id,
          [sidecars.writingEntryProjection, sidecars.submissionRiskProjection],
        );

        if (!existingPaperId) {
          const decision: DecisionRecord = {
            decision_id: buildId('ra_decision'),
            workspace_id: input.workspace_id,
            branch_id: input.branch_id,
            action: 'advance',
            reason: input.confirmation_note ?? 'Promoted research argument branch to PaperProject writing entry.',
            actor: input.created_by,
            human_confirmed: true,
            confirmation_note: input.confirmation_note,
            linked_object_ids: sidecars.writing_entry_packet.object_pointers.map(
              (pointer) => pointer.object_id,
            ),
            audit_ref: auditRef,
            created_at: now,
          };
          await repository.createDecisionRecord(decision);
          await repository.updateBranch(input.branch_id, {
            decision_refs: dedupeStrings([
              ...(branch.decision_refs ?? []),
              decision.decision_id,
            ]),
            updated_at: now,
          });
        }

        await repository.updateWorkspace(input.workspace_id, {
          workspace_status: 'promoted',
          active_branch_id: input.branch_id,
          current_stage: recompute.snapshot.stage,
          paper_id: paperProject.paper_id,
          report_pointers: mergeProjectionReportPointers(
            recompute.workspace.report_pointers,
            sidecarProjections,
          ),
          updated_at: now,
        });

        return {
          paper_id: paperProject.paper_id,
          workspace_id: input.workspace_id,
          branch_id: input.branch_id,
          packet_ref: sidecars.packet_ref,
          report_ref: sidecars.report_ref,
          audit_ref: auditRef,
          promoted_at: now,
          paper_project_created: !existingPaperId,
          writing_entry_packet: sidecars.writing_entry_packet,
          submission_risk_report: sidecars.submission_risk_report,
        };
      });
    } catch (error) {
      if (createdPaperId && paperProjectGateway.deletePaperProject) {
        await paperProjectGateway.deletePaperProject(createdPaperId);
      }
      throw error;
    }
  }

  async createWorkspaceSkeleton(
    input: CreateResearchArgumentWorkspaceInput,
  ): Promise<ResearchArgumentRecomputeResult> {
    return this.repository.withTransaction(async (repository) => {
      const now = nowIso();
      const workspaceId = input.workspace_id ?? buildId('ra_ws');
      const branchId = input.branch_id ?? buildId('ra_branch');

      const workspace: ResearchArgumentWorkspace = {
        workspace_id: workspaceId,
        title_card_id: input.title_card_id,
        workspace_status: 'active',
        active_branch_id: branchId,
        current_stage: 'Stage1_WorthContinuing',
        source_trace_refs: input.source_trace_refs ?? [],
        report_pointers: [],
        sync_eligibility: input.sync_eligibility ?? 'local_only',
        authorization_metadata: input.authorization_metadata,
        git_weak_mapping_refs: input.git_weak_mapping_refs,
        audit_ref: input.audit_ref,
        created_at: now,
        updated_at: now,
      };
      const branch: ResearchBranch = {
        branch_id: branchId,
        workspace_id: workspaceId,
        branch_name: input.branch_name ?? 'main',
        branch_status: 'active',
        decision_refs: [],
        created_at: now,
        updated_at: now,
      };

      await repository.createWorkspace(workspace);
      await repository.createBranch(branch);
      return this.recomputeInternal(repository, workspaceId, branchId, now);
    });
  }

  async updateWorkspace(
    workspaceId: string,
    patch: Partial<ResearchArgumentWorkspace>,
  ): Promise<ResearchArgumentWorkspace> {
    return this.repository.withTransaction(async (repository) => {
      const workspace = await mustFindWorkspace(repository, workspaceId);
      const nextPatch: Partial<ResearchArgumentWorkspace> = {
        ...patch,
        updated_at: patch.updated_at ?? nowIso(),
      };

      if (patch.active_branch_id !== undefined) {
        const activeBranch = await mustFindBranchInWorkspace(
          repository,
          workspaceId,
          patch.active_branch_id,
        );
        const snapshot = await repository.findLatestStateSnapshot(
          workspaceId,
          activeBranch.branch_id,
        );
        const reportProjections = await repository.listReportProjections({
          workspace_id: workspaceId,
          branch_id: activeBranch.branch_id,
        });
        nextPatch.current_stage = snapshot?.stage ?? workspace.current_stage;
        nextPatch.report_pointers = mergeProjectionReportPointers(
          workspace.report_pointers,
          reportProjections,
        );
      }

      return repository.updateWorkspace(workspaceId, nextPatch);
    });
  }

  async createBranch(input: CreateResearchArgumentBranchInput): Promise<ResearchBranch> {
    return this.repository.withTransaction(async (repository) => {
      const workspace = await mustFindWorkspace(repository, input.workspace_id);
      const now = nowIso();
      const branch: ResearchBranch = {
        branch_id: input.branch_id ?? buildId('ra_branch'),
        workspace_id: input.workspace_id,
        branch_name: input.branch_name,
        branch_status: 'active',
        parent_branch_id: input.parent_branch_id,
        hypothesis_summary: input.hypothesis_summary,
        branch_reason: input.branch_reason,
        decision_refs: [],
        created_at: now,
        updated_at: now,
      };
      const created = await repository.createBranch(branch);
      if (input.activate || !workspace.active_branch_id) {
        await repository.updateWorkspace(workspace.workspace_id, {
          active_branch_id: created.branch_id,
          updated_at: now,
        });
      }
      const recompute = await this.recomputeInternal(
        repository,
        input.workspace_id,
        created.branch_id,
        now,
      );
      return recompute.branch;
    });
  }

  async updateBranch(
    branchId: string,
    patch: Partial<ResearchBranch>,
  ): Promise<ResearchBranch> {
    return this.repository.withTransaction(async (repository) => {
      const current = await mustFindBranch(repository, branchId);
      if (
        patch.workspace_id !== undefined
        && patch.workspace_id !== current.workspace_id
      ) {
        throw new Error(
          `Research argument branch ${branchId} cannot be moved across workspaces.`,
        );
      }
      return repository.updateBranch(branchId, {
        ...patch,
        workspace_id: current.workspace_id,
        updated_at: patch.updated_at ?? nowIso(),
      });
    });
  }

  async upsertGraphObject<K extends ResearchArgumentGraphObjectKind>(
    objectKind: K,
    object: ResearchArgumentGraphObjectKindMap[K],
  ): Promise<ResearchArgumentRecomputeResult> {
    return this.repository.withTransaction(async (repository) => {
      await mustFindWorkspace(repository, object.workspace_id);
      await mustFindBranchInWorkspace(
        repository,
        object.workspace_id,
        object.branch_id,
      );
      await repository.upsertGraphObject(objectKind, object);
      return this.recomputeInternal(
        repository,
        object.workspace_id,
        object.branch_id,
        nowIso(),
      );
    });
  }

  async recordDecision(
    input: RecordResearchArgumentDecisionInput,
  ): Promise<{ decision: DecisionRecord; result: ResearchArgumentRecomputeResult }> {
    return this.repository.withTransaction(async (repository) => {
      const workspace = await mustFindWorkspace(repository, input.workspace_id);
      const branch = await mustFindBranchInWorkspace(
        repository,
        input.workspace_id,
        input.branch_id,
      );
      const now = nowIso();
      const decision: DecisionRecord = {
        decision_id: input.decision_id ?? buildId('ra_decision'),
        workspace_id: input.workspace_id,
        branch_id: input.branch_id,
        action: input.action,
        reason: input.reason,
        actor: input.actor,
        human_confirmed: input.human_confirmed,
        confirmation_note: input.confirmation_note,
        linked_object_ids: input.linked_object_ids,
        audit_ref: input.audit_ref,
        created_at: now,
      };

      await repository.createDecisionRecord(decision);

      const nextDecisionRefs = dedupeStrings([
        ...(branch.decision_refs ?? []),
        decision.decision_id,
      ]);
      await repository.updateBranch(branch.branch_id, {
        branch_status: branchStatusForDecision(branch.branch_status, input.action),
        decision_refs: nextDecisionRefs,
        updated_at: now,
      });

      const workspacePatch = workspacePatchForDecision(
        workspace,
        branch.branch_id,
        input.action,
        now,
      );
      if (workspacePatch) {
        await repository.updateWorkspace(workspace.workspace_id, workspacePatch);
      }

      const result = await this.recomputeInternal(
        repository,
        input.workspace_id,
        input.branch_id,
        now,
      );
      return { decision, result };
    });
  }

  async recordLesson(input: RecordResearchArgumentLessonInput): Promise<LessonRecord> {
    return this.repository.withTransaction(async (repository) => {
      await mustFindWorkspace(repository, input.workspace_id);
      await mustFindBranchInWorkspace(
        repository,
        input.workspace_id,
        input.branch_id,
      );
      const now = nowIso();
      const lesson: LessonRecord = {
        lesson_record_id: input.lesson_record_id ?? buildId('ra_lesson'),
        workspace_id: input.workspace_id,
        branch_id: input.branch_id,
        lesson_type: input.lesson_type,
        summary: input.summary,
        origin_decision_id: input.origin_decision_id,
        origin_run_ids: input.origin_run_ids,
        applicability_tags: input.applicability_tags,
        reliability: input.reliability,
        created_at: now,
        updated_at: now,
      };
      return repository.createLessonRecord(lesson);
    });
  }

  async recompute(
    workspaceId: string,
    branchId?: string,
  ): Promise<ResearchArgumentRecomputeResult> {
    return this.repository.withTransaction(async (repository) => {
      const workspace = await mustFindWorkspace(repository, workspaceId);
      const resolvedBranchId = branchId ?? workspace.active_branch_id;
      if (!resolvedBranchId) {
        throw new Error(`Workspace ${workspaceId} has no active branch to recompute.`);
      }
      return this.recomputeInternal(repository, workspaceId, resolvedBranchId, nowIso());
    });
  }

  async getWorkspaceSummary(workspaceId: string): Promise<WorkspaceSummary> {
    const workspace = await mustFindWorkspace(this.repository, workspaceId);
    const branchId = await resolveBranchId(this.repository, workspace, undefined);
    const context = await this.loadBranchContext(workspaceId, branchId);
    return buildWorkspaceSummary(context);
  }

  async getLatestAbstractStateSnapshot(
    workspaceId: string,
    branchId?: string,
  ): Promise<AbstractStateSnapshot | null> {
    const workspace = await mustFindWorkspace(this.repository, workspaceId);
    const resolvedBranchId = await resolveBranchId(this.repository, workspace, branchId);
    return this.repository.findLatestStateSnapshot(workspaceId, resolvedBranchId);
  }

  async listClaimEvidenceCoverageRows(
    workspaceId: string,
    branchId?: string,
  ): Promise<ClaimEvidenceCoverageRow[]> {
    const context = await this.loadBranchContextForQuery(workspaceId, branchId);
    return buildClaimEvidenceCoverageRows(context.graph);
  }

  async getProtocolBaselineReproReadiness(
    workspaceId: string,
    branchId?: string,
  ): Promise<ProtocolBaselineReproReadiness> {
    const context = await this.loadBranchContextForQuery(workspaceId, branchId);
    if (!context.snapshot) {
      throw new Error(`Workspace ${workspaceId} does not have a state snapshot yet.`);
    }
    return buildProtocolBaselineReproReadiness({
      workspace_id: workspaceId,
      branch_id: context.branch.branch_id,
      graph: context.graph,
      snapshot: context.snapshot,
    });
  }

  async listDecisionTimelineEntries(
    workspaceId: string,
    branchId?: string,
  ): Promise<DecisionTimelineEntry[]> {
    const context = await this.loadBranchContextForQuery(workspaceId, branchId);
    return buildDecisionTimelineEntries(context.decisions, context.graph);
  }

  async listLessonRecords(
    workspaceId: string,
    branchId?: string,
  ): Promise<LessonRecord[]> {
    const workspace = await mustFindWorkspace(this.repository, workspaceId);
    const resolvedBranchId = await resolveBranchId(this.repository, workspace, branchId);
    return this.repository.listLessonRecords(workspaceId, resolvedBranchId);
  }

  async listReportProjections(
    workspaceId: string,
    branchId?: string,
  ): Promise<ReportProjection[]> {
    const workspace = await mustFindWorkspace(this.repository, workspaceId);
    const resolvedBranchId = await resolveBranchId(this.repository, workspace, branchId);
    return this.repository.listReportProjections({
      workspace_id: workspaceId,
      branch_id: resolvedBranchId,
    });
  }

  private async recomputeInternal(
    repository: ResearchArgumentRepository,
    workspaceId: string,
    branchId: string,
    now: string,
  ): Promise<ResearchArgumentRecomputeResult> {
    const context = await this.loadBranchContextFromRepository(
      repository,
      workspaceId,
      branchId,
    );
    const snapshot = synthesizeAbstractStateSnapshot({
      workspace_id: workspaceId,
      branch_id: branchId,
      graph: context.graph,
      previous_snapshot: context.snapshot,
      snapshot_id: buildId('ra_snapshot'),
      now,
    });
    await repository.appendStateSnapshot(snapshot);

    const decisionTimeline = buildDecisionTimelineEntries(context.decisions, context.graph);
    const coverageRows = buildClaimEvidenceCoverageRows(context.graph);
    const readiness = buildProtocolBaselineReproReadiness({
      workspace_id: workspaceId,
      branch_id: branchId,
      graph: context.graph,
      snapshot,
    });

    const projections = await repository.replaceReportProjections(workspaceId, branchId, [
      buildCoverageProjection({
        workspace_id: workspaceId,
        branch_id: branchId,
        rows: coverageRows,
        now,
      }),
      buildReadinessProjection({
        snapshot,
        readiness,
        analysis_finding_ids: context.graph.analysis_findings.map(
          (finding) => finding.analysis_finding_id,
        ),
        now,
      }),
      buildDecisionTimelineProjection({
        workspace_id: workspaceId,
        branch_id: branchId,
        timeline: decisionTimeline,
        now,
      }),
    ]);

    const shouldRefreshWorkspaceSurface =
      !context.workspace.active_branch_id
      || context.workspace.active_branch_id === branchId;
    const updatedWorkspace = shouldRefreshWorkspaceSurface
      ? await repository.updateWorkspace(workspaceId, {
          active_branch_id: context.workspace.active_branch_id ?? branchId,
          current_stage: snapshot.stage,
          report_pointers: mergeProjectionReportPointers(
            context.workspace.report_pointers,
            projections,
          ),
          updated_at: now,
        })
      : context.workspace;
    const updatedBranch = await repository.updateBranch(branchId, {
      updated_at: now,
    });
    const summaryContext = shouldRefreshWorkspaceSurface
      ? {
          graph: context.graph,
          snapshot,
          reportProjections: projections,
        }
      : await this.loadSummaryContextForActiveBranch(repository, updatedWorkspace);

    return {
      workspace: updatedWorkspace,
      branch: updatedBranch,
      snapshot,
      summary: buildWorkspaceSummary({
        workspace: updatedWorkspace,
        graph: summaryContext.graph,
        snapshot: summaryContext.snapshot,
        reportProjections: summaryContext.reportProjections,
      }),
      coverage_rows: coverageRows,
      protocol_baseline_repro_readiness: readiness,
      decision_timeline: decisionTimeline,
      report_projections: projections,
    };
  }

  private async loadBranchContext(
    workspaceId: string,
    branchId: string,
  ): Promise<{
    workspace: ResearchArgumentWorkspace;
    branch: ResearchBranch;
    graph: ResearchArgumentBranchGraph;
    snapshot: AbstractStateSnapshot | null;
    decisions: DecisionRecord[];
    reportProjections: ReportProjection[];
  }> {
    return this.loadBranchContextFromRepository(this.repository, workspaceId, branchId);
  }

  private async loadBranchContextForQuery(
    workspaceId: string,
    branchId?: string,
  ): Promise<{
    workspace: ResearchArgumentWorkspace;
    branch: ResearchBranch;
    graph: ResearchArgumentBranchGraph;
    snapshot: AbstractStateSnapshot | null;
    decisions: DecisionRecord[];
    reportProjections: ReportProjection[];
  }> {
    const workspace = await mustFindWorkspace(this.repository, workspaceId);
    const resolvedBranchId = await resolveBranchId(this.repository, workspace, branchId);
    return this.loadBranchContext(workspaceId, resolvedBranchId);
  }

  private async loadSummaryContextForActiveBranch(
    repository: ResearchArgumentRepository,
    workspace: ResearchArgumentWorkspace,
  ): Promise<{
    graph: ResearchArgumentBranchGraph;
    snapshot: AbstractStateSnapshot | null;
    reportProjections: ReportProjection[];
  }> {
    if (!workspace.active_branch_id) {
      return {
        graph: buildResearchArgumentBranchGraph([]),
        snapshot: null,
        reportProjections: [],
      };
    }

    const context = await this.loadBranchContextFromRepository(
      repository,
      workspace.workspace_id,
      workspace.active_branch_id,
    );
    return {
      graph: context.graph,
      snapshot: context.snapshot,
      reportProjections: context.reportProjections,
    };
  }

  private async loadBranchContextFromRepository(
    repository: ResearchArgumentRepository,
    workspaceId: string,
    branchId: string,
  ): Promise<{
    workspace: ResearchArgumentWorkspace;
    branch: ResearchBranch;
    graph: ResearchArgumentBranchGraph;
    snapshot: AbstractStateSnapshot | null;
    decisions: DecisionRecord[];
    reportProjections: ReportProjection[];
  }> {
    const workspace = await mustFindWorkspace(repository, workspaceId);
    const branch = await mustFindBranch(repository, branchId);
    if (branch.workspace_id !== workspaceId) {
      throw new Error(`Branch ${branchId} does not belong to workspace ${workspaceId}.`);
    }
    const [objects, snapshot, decisions, reportProjections] = await Promise.all([
      repository.listGraphObjects({ workspace_id: workspaceId, branch_id: branchId }),
      repository.findLatestStateSnapshot(workspaceId, branchId),
      repository.listDecisionRecords(workspaceId, branchId),
      repository.listReportProjections({ workspace_id: workspaceId, branch_id: branchId }),
    ]);
    return {
      workspace,
      branch,
      graph: buildResearchArgumentBranchGraph(objects as ResearchArgumentGraphObject[]),
      snapshot,
      decisions,
      reportProjections,
    };
  }

  private toReadinessVerifyResponse(
    result: ResearchArgumentRecomputeResult,
    _requestedBy: ResearchArgumentActor,
  ): ReadinessVerifyResponse {
    const blockers = flattenSnapshotBlockers(result.snapshot);
    const missingItems = buildReadinessMissingItems(
      result.snapshot,
      result.protocol_baseline_repro_readiness,
    );
    const readinessProjection = result.report_projections.find(
      (projection) => projection.report_kind === 'readiness',
    );
    return {
      workspace_id: result.workspace.workspace_id,
      branch_id: result.branch.branch_id,
      readiness_decision: readinessDecisionForSnapshot(result.snapshot),
      stage: result.snapshot.stage,
      blockers,
      missing_items: missingItems,
      dimension_verdicts: DIMENSION_NAMES.map((dimensionName) => {
        const dimension = result.snapshot.dimensions[dimensionName];
        return {
          dimension_name: dimension.dimension_name,
          level: dimension.level,
          score: dimension.score,
          confidence: dimension.confidence,
        };
      }),
      report_pointer: readinessProjection
        ? projectionToReportPointer(readinessProjection)
        : undefined,
      verified_at: result.snapshot.updated_at,
    };
  }

  private literatureEvidenceIdsForPromotion(
    workspace: ResearchArgumentWorkspace,
    graph: ResearchArgumentBranchGraph,
  ): string[] {
    return dedupeStrings([
      ...workspace.source_trace_refs
        .filter((sourceRef) => sourceRef.source_kind === 'literature_evidence')
        .map((sourceRef) => sourceRef.source_id),
      ...graph.evidence_items.flatMap((evidenceItem) =>
        (evidenceItem.provenance ?? [])
          .filter((sourceRef) => sourceRef.source_kind === 'literature_evidence')
          .map((sourceRef) => sourceRef.source_id),
      ),
    ]);
  }

  private buildPromotionSidecars(input: {
    workspace: ResearchArgumentWorkspace;
    branch: ResearchBranch;
    graph: ResearchArgumentBranchGraph;
    snapshot: AbstractStateSnapshot;
    readiness: ReadinessVerifyResponse;
    coverageRows: ClaimEvidenceCoverageRow[];
    protocolBaselineReproReadiness: ProtocolBaselineReproReadiness;
    reportProjections: ReportProjection[];
    paperId: string;
    actor: ResearchArgumentActor;
    auditRef: string;
    now: string;
  }): {
    writing_entry_packet: WritingEntryPacket;
    submission_risk_report: SubmissionRiskReport;
    packet_ref: PromoteToPaperProjectResponse['packet_ref'];
    report_ref: PromoteToPaperProjectResponse['report_ref'];
    writingEntryProjection: ReportProjection;
    submissionRiskProjection: ReportProjection;
  } {
    const objectPointers = this.graphObjectPointers(input.graph);
    const reportPointers = input.reportProjections.map(projectionToReportPointer);
    const sourceTraceRefs = this.graphSourceTraceRefs(input.workspace, input.graph);
    const packetId = `${input.branch.branch_id}:writing_entry`;
    const reportId = `${input.branch.branch_id}:submission_risk`;
    const packetRef = {
      report_kind: 'writing_entry' as const,
      report_id: packetId,
      summary: `Writing entry packet for PaperProject ${input.paperId}.`,
      object_pointers: dedupeObjectPointers([
        { pointer_kind: 'paper_project', object_id: input.paperId },
        ...objectPointers,
      ]),
    };
    const reportRef = {
      report_kind: 'submission_risk' as const,
      report_id: reportId,
      summary: `Submission risk report for PaperProject ${input.paperId}.`,
      object_pointers: dedupeObjectPointers([
        { pointer_kind: 'paper_project', object_id: input.paperId },
        ...objectPointers,
      ]),
    };
    const writingEntryPacket: WritingEntryPacket = {
      packet_id: packetId,
      workspace_id: input.workspace.workspace_id,
      branch_id: input.branch.branch_id,
      title_card_id: input.workspace.title_card_id,
      paper_id: input.paperId,
      claim_summary: input.graph.claims.map((claim) => ({
        claim_id: claim.claim_id,
        claim_text: claim.text,
        claim_strength: claim.claim_strength,
        support_state: claim.support_state,
        evidence_requirement_ids: claim.linked_evidence_requirement_ids,
        boundary_ids: claim.linked_boundary_ids ?? [],
      })),
      evidence_summary: {
        evidence_item_ids: input.graph.evidence_items.map((item) => item.evidence_item_id),
        mandatory_requirement_ids: input.graph.evidence_requirements
          .filter((requirement) => requirement.is_mandatory)
          .map((requirement) => requirement.evidence_requirement_id),
        missing_requirement_ids: input.graph.evidence_requirements
          .filter((requirement) => requirement.status !== 'satisfied')
          .map((requirement) => requirement.evidence_requirement_id),
      },
      baseline_protocol_repro_summary: {
        baseline_set_ids: input.protocolBaselineReproReadiness.baseline_set_ids,
        protocol_ids: input.protocolBaselineReproReadiness.protocol_ids,
        repro_item_ids: input.protocolBaselineReproReadiness.repro_item_ids,
        run_ids: input.protocolBaselineReproReadiness.run_ids,
        artifact_ids: input.protocolBaselineReproReadiness.artifact_ids,
      },
      source_trace_refs: sourceTraceRefs,
      object_pointers: packetRef.object_pointers ?? [],
      report_pointers: [...reportPointers, reportRef],
      audit_ref: input.auditRef,
      actor: input.actor,
      recorded_at: input.now,
      created_at: input.now,
    };
    const submissionRiskReport: SubmissionRiskReport = {
      report_id: reportId,
      workspace_id: input.workspace.workspace_id,
      branch_id: input.branch.branch_id,
      title_card_id: input.workspace.title_card_id,
      dimension_summary: DIMENSION_NAMES.map((dimensionName) => {
        const dimension = input.snapshot.dimensions[dimensionName];
        return {
          dimension_name: dimension.dimension_name,
          level: dimension.level,
          score: dimension.score,
          confidence: dimension.confidence,
        };
      }),
      blockers: input.readiness.blockers,
      missing_items: input.readiness.missing_items,
      findings: this.submissionRiskFindings(input.graph),
      report_pointers: [...reportPointers, packetRef],
      audit_ref: input.auditRef,
      actor: input.actor,
      recorded_at: input.now,
      created_at: input.now,
    };
    return {
      writing_entry_packet: writingEntryPacket,
      submission_risk_report: submissionRiskReport,
      packet_ref: packetRef,
      report_ref: reportRef,
      writingEntryProjection: {
        report_projection_id: packetId,
        workspace_id: input.workspace.workspace_id,
        branch_id: input.branch.branch_id,
        report_kind: 'writing_entry',
        summary: packetRef.summary ?? `Writing entry packet for PaperProject ${input.paperId}.`,
        object_pointers: writingEntryPacket.object_pointers,
        source_trace_refs: writingEntryPacket.source_trace_refs,
        report_pointers: writingEntryPacket.report_pointers,
        created_at: input.now,
        updated_at: input.now,
      },
      submissionRiskProjection: {
        report_projection_id: reportId,
        workspace_id: input.workspace.workspace_id,
        branch_id: input.branch.branch_id,
        report_kind: 'submission_risk',
        summary: reportRef.summary ?? `Submission risk report for PaperProject ${input.paperId}.`,
        object_pointers: submissionRiskReport.findings.flatMap((finding) => finding.pointers),
        source_trace_refs: sourceTraceRefs,
        report_pointers: submissionRiskReport.report_pointers,
        created_at: input.now,
        updated_at: input.now,
      },
    };
  }

  private graphObjectPointers(graph: ResearchArgumentBranchGraph): ObjectPointer[] {
    return dedupeObjectPointers([
      ...graph.problems.map((item) => ({ pointer_kind: 'problem' as const, object_id: item.problem_id })),
      ...graph.value_hypotheses.map((item) => ({
        pointer_kind: 'value_hypothesis' as const,
        object_id: item.value_hypothesis_id,
      })),
      ...graph.contribution_deltas.map((item) => ({
        pointer_kind: 'contribution_delta' as const,
        object_id: item.contribution_delta_id,
      })),
      ...graph.claims.map((item) => ({ pointer_kind: 'claim' as const, object_id: item.claim_id })),
      ...graph.evidence_requirements.map((item) => ({
        pointer_kind: 'evidence_requirement' as const,
        object_id: item.evidence_requirement_id,
      })),
      ...graph.evidence_items.map((item) => ({
        pointer_kind: 'evidence_item' as const,
        object_id: item.evidence_item_id,
      })),
      ...graph.baseline_sets.map((item) => ({
        pointer_kind: 'baseline_set' as const,
        object_id: item.baseline_set_id,
      })),
      ...graph.protocols.map((item) => ({ pointer_kind: 'protocol' as const, object_id: item.protocol_id })),
      ...graph.repro_items.map((item) => ({
        pointer_kind: 'repro_item' as const,
        object_id: item.repro_item_id,
      })),
      ...graph.runs.map((item) => ({ pointer_kind: 'run' as const, object_id: item.run_id })),
      ...graph.artifacts.map((item) => ({ pointer_kind: 'artifact' as const, object_id: item.artifact_id })),
      ...graph.boundaries.map((item) => ({ pointer_kind: 'boundary' as const, object_id: item.boundary_id })),
      ...graph.analysis_findings.map((item) => ({
        pointer_kind: 'analysis_finding' as const,
        object_id: item.analysis_finding_id,
      })),
      ...graph.issue_findings.map((item) => ({
        pointer_kind: 'issue_finding' as const,
        object_id: item.issue_finding_id,
      })),
    ]);
  }

  private graphSourceTraceRefs(
    workspace: ResearchArgumentWorkspace,
    graph: ResearchArgumentBranchGraph,
  ): SourceTraceRef[] {
    return dedupeSourceTraceRefs([
      ...workspace.source_trace_refs,
      ...graph.problems.flatMap((item) => item.source_trace_refs ?? []),
      ...graph.value_hypotheses.flatMap((item) => item.source_trace_refs ?? []),
      ...graph.contribution_deltas.flatMap((item) => item.source_trace_refs ?? []),
      ...graph.claims.flatMap((item) => item.source_trace_refs ?? []),
      ...graph.evidence_items.flatMap((item) => item.provenance ?? []),
    ]);
  }

  private submissionRiskFindings(graph: ResearchArgumentBranchGraph): SubmissionRiskFinding[] {
    return [
      ...graph.issue_findings.map((issue) => ({
        finding_id: `issue:${issue.issue_finding_id}`,
        finding_group: riskFindingGroupForDimensions(issue.dimension_names ?? []),
        severity: issue.severity,
        detail: issue.detail,
        pointers: issue.pointers,
        affected_dimensions: issue.dimension_names,
        suggested_fix: issue.suggested_fix,
      })),
      ...graph.boundaries
        .filter((boundary) => boundary.severity === 'high')
        .map((boundary) => ({
          finding_id: `boundary:${boundary.boundary_id}`,
          finding_group: 'boundary_risk' as const,
          severity: 'high' as const,
          detail: boundary.statement,
          pointers: [{ pointer_kind: 'boundary' as const, object_id: boundary.boundary_id }],
          affected_dimensions: ['BoundaryRiskCoverage' as const],
          suggested_fix: boundary.trigger_condition,
        })),
    ];
  }
}

async function mustFindWorkspace(
  repository: ResearchArgumentRepository,
  workspaceId: string,
): Promise<ResearchArgumentWorkspace> {
  const workspace = await repository.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error(`Research argument workspace ${workspaceId} not found.`);
  }
  return workspace;
}

function assertHasText(value: string | null | undefined, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`Research argument ${field} is required.`);
  }
}

function buildSeedTraceRefs(input: SeedWorkspaceFromTitleCardRequest): SourceTraceRef[] {
  return dedupeSourceTraceRefs([
    {
      source_kind: 'title_card',
      source_id: input.title_card_id,
      note: `seeded_by:${input.created_by}`,
    },
    ...(input.source_need_ids ?? []).map((sourceId) => ({
      source_kind: 'need_review' as const,
      source_id: sourceId,
    })),
    ...(input.source_research_question_ids ?? []).map((sourceId) => ({
      source_kind: 'research_question' as const,
      source_id: sourceId,
    })),
    ...(input.source_value_assessment_ids ?? []).map((sourceId) => ({
      source_kind: 'value_assessment' as const,
      source_id: sourceId,
    })),
    ...(input.selected_literature_evidence_ids ?? []).map((sourceId) => ({
      source_kind: 'literature_evidence' as const,
      source_id: sourceId,
    })),
  ]);
}

function flattenSnapshotBlockers(snapshot: AbstractStateSnapshot): BlockerRef[] {
  return dedupeBlockers(
    DIMENSION_NAMES.flatMap((dimensionName) => snapshot.dimensions[dimensionName].blockers),
  );
}

function buildReadinessMissingItems(
  snapshot: AbstractStateSnapshot,
  readiness: ProtocolBaselineReproReadiness,
): string[] {
  return dedupeStrings([
    ...readiness.missing_items,
    ...DIMENSION_NAMES
      .filter((dimensionName) => snapshot.dimensions[dimensionName].gap > 0)
      .map((dimensionName) => `Dimension ${dimensionName} is below readiness threshold.`),
  ]);
}

function readinessDecisionForSnapshot(
  snapshot: AbstractStateSnapshot,
): ReadinessVerifyResponse['readiness_decision'] {
  if (snapshot.global_flags.has_critical_blocker) {
    return 'not_ready';
  }
  if (
    snapshot.stage === 'Stage2_ReadyForWritingEntry'
    && snapshot.derived.current_goal_satisfied
  ) {
    return 'ready_for_writing_entry';
  }
  return 'worth_continuing';
}

function projectionToReportPointer(projection: ReportProjection): ReportPointer {
  return {
    report_kind: projection.report_kind,
    report_id: projection.report_projection_id,
    summary: projection.summary,
    object_pointers: projection.object_pointers,
  };
}

function riskFindingGroupForDimensions(
  dimensions: DimensionName[],
): SubmissionRiskFinding['finding_group'] {
  if (dimensions.includes('EvaluationSoundness')) {
    return 'evaluation_fairness';
  }
  if (dimensions.includes('ReproducibilityReadiness')) {
    return 'reproducibility';
  }
  if (dimensions.includes('BoundaryRiskCoverage')) {
    return 'boundary_risk';
  }
  if (dimensions.includes('EvidenceCompleteness') || dimensions.includes('ClaimSharpness')) {
    return 'claim_evidence';
  }
  if (dimensions.includes('OutcomeFeasibility')) {
    return 'feasibility';
  }
  return 'value_novelty';
}

async function mustFindBranch(
  repository: ResearchArgumentRepository,
  branchId: string,
): Promise<ResearchBranch> {
  const branch = await repository.findBranchById(branchId);
  if (!branch) {
    throw new Error(`Research argument branch ${branchId} not found.`);
  }
  return branch;
}

async function mustFindBranchInWorkspace(
  repository: ResearchArgumentRepository,
  workspaceId: string,
  branchId: string | undefined,
): Promise<ResearchBranch> {
  if (!branchId) {
    throw new Error(`Research argument workspace ${workspaceId} is missing a branch id.`);
  }
  const branch = await mustFindBranch(repository, branchId);
  if (branch.workspace_id !== workspaceId) {
    throw new Error(`Research argument branch ${branchId} does not belong to workspace ${workspaceId}.`);
  }
  return branch;
}

async function resolveBranchId(
  repository: ResearchArgumentRepository,
  workspace: ResearchArgumentWorkspace,
  branchId?: string,
): Promise<string> {
  if (branchId) {
    return branchId;
  }
  if (workspace.active_branch_id) {
    return workspace.active_branch_id;
  }
  const branches = await repository.listBranchesByWorkspaceId(workspace.workspace_id);
  const firstActiveBranch = branches.find((branch) => branch.branch_status === 'active');
  if (!firstActiveBranch) {
    throw new Error(`Workspace ${workspace.workspace_id} has no active branch.`);
  }
  return firstActiveBranch.branch_id;
}

function mergeProjectionReportPointers(
  currentPointers: ReportPointer[],
  projections: ReportProjection[],
): ReportPointer[] {
  const projectionKinds = new Set<string>(
    projections.map((projection) => projection.report_kind),
  );
  const retained = currentPointers.filter(
    (pointer) => !projectionKinds.has(pointer.report_kind),
  );
  return [
    ...retained,
    ...projections.map((projection) => ({
      report_kind: projection.report_kind,
      report_id: projection.report_projection_id,
      summary: projection.summary,
      object_pointers: projection.object_pointers,
    })),
  ];
}

function branchStatusForDecision(
  currentStatus: ResearchBranch['branch_status'],
  action: DecisionRecord['action'],
): ResearchBranch['branch_status'] {
  switch (action) {
    case 'archive':
      return 'archived';
    case 'kill':
      return 'killed';
    case 'merge':
      return 'merged';
    case 'reopen':
      return 'active';
    default:
      return currentStatus;
  }
}

function workspacePatchForDecision(
  workspace: ResearchArgumentWorkspace,
  branchId: string,
  action: DecisionRecord['action'],
  now: string,
): Partial<ResearchArgumentWorkspace> | null {
  if (workspace.active_branch_id && workspace.active_branch_id !== branchId) {
    return null;
  }

  switch (action) {
    case 'archive':
      return { workspace_status: 'archived', updated_at: now };
    case 'kill':
      return { workspace_status: 'killed', updated_at: now };
    case 'reopen':
      return {
        workspace_status: 'active',
        active_branch_id: branchId,
        updated_at: now,
      };
    default:
      return { updated_at: now };
  }
}

function buildId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}
