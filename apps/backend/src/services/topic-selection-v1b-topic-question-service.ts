import crypto from 'node:crypto';

import type {
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionResearchSliceAssumptionRecord,
  TopicSelectionV1bTopicQuestionFormationInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import {
  TOPIC_SELECTION_TOPIC_QUESTION_EVIDENCE_ROLES,
  topicSelectionFormTopicQuestionLlmOutputSchema,
  type TopicSelectionFormTopicQuestionLlmOutput,
  type TopicSelectionFormTopicQuestionRunRecord,
  type TopicSelectionQuestionFrameRecord,
  type TopicSelectionTopicQuestionAnswerabilityPlanRecord,
  type TopicSelectionTopicQuestionAssumptionRefRecord,
  type TopicSelectionTopicQuestionBoundaryRefRecord,
  type TopicSelectionTopicQuestionCandidateRecord,
  type TopicSelectionTopicQuestionCandidateSetRecord,
  type TopicSelectionTopicQuestionContractRecord,
  type TopicSelectionTopicQuestionEvidenceRefRecord,
  type TopicSelectionTopicQuestionRecord,
  type TopicSelectionTopicQuestionSelectionDecision,
  type TopicSelectionTopicQuestionSelectionDecisionRecord,
  type TopicSelectionV1bTopicQuestionMaterialization,
  type TopicSelectionV1bValueAssessmentInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';

import { AppError } from '../errors/app-error.js';
import type {
  TopicSelectionV1bTopicQuestionRepository,
} from '../repositories/topic-selection-v1b-topic-question.repository.js';
import {
  sha256Text,
  stableStringify,
} from './literature-content-processing-utils.js';
import {
  BackendLlmGateway,
  LlmGatewayError,
  type LlmCallTelemetry,
  type LlmModelRef,
} from './llm-gateway.js';
import { TopicSelectionControlPlaneService } from './topic-selection-control-plane-service.js';

const WORKFLOW_PROFILE_KEY = 'topic-selection-topic-question-formation';
const PROMPT_TEMPLATE_ID = 'topic-selection-topic-question-formation';
const PROMPT_TEMPLATE_VERSION = '1';
const DEFAULT_MODEL: LlmModelRef = {
  providerId: 'openai',
  modelId: 'gpt-5.4-mini',
  profileId: WORKFLOW_PROFILE_KEY,
};

type IdFactory = (prefix: string) => string;

export type TopicSelectionV1bTopicQuestionFormationInputProvider = {
  buildTopicQuestionFormationInput(input: {
    research_slice_id: string;
  }): Promise<TopicSelectionV1bTopicQuestionFormationInput>;
};

export type TopicSelectionV1bTopicQuestionLlmGateway = Pick<
  BackendLlmGateway,
  'createStructuredOutput'
>;

export type FormTopicQuestionCandidatesInput = {
  research_slice_id: string;
  workspace_id?: string | null;
  triggered_by?: TopicSelectionActorType;
  workflow_profile_version?: string | null;
  prompt_template_version?: string | null;
  policy_version_id?: string | null;
  model?: LlmModelRef;
};

export type FormTopicQuestionCandidatesResult = {
  form_topic_question_run: TopicSelectionFormTopicQuestionRunRecord;
  question_frame: TopicSelectionQuestionFrameRecord;
  candidate_set: TopicSelectionTopicQuestionCandidateSetRecord;
  candidates: TopicSelectionTopicQuestionCandidateRecord[];
};

export type SelectTopicQuestionInput = {
  candidate_set_id: string;
  decision: TopicSelectionTopicQuestionSelectionDecision;
  admitted_candidate_ids?: string[];
  decided_by?: TopicSelectionActorType;
  selection_policy_version?: string;
  decision_rationale: string;
  merged_candidate_groups?: Record<string, unknown>[];
  candidate_relationships?: Record<string, unknown>;
  priority_order?: string[];
  rejected_candidate_reasons?: Record<string, unknown>[];
  blocking_contexts?: Record<string, unknown>[];
  accepted_risk_refs?: TopicSelectionFunctionalRef[];
  confidence?: number | null;
  requires_human_review?: boolean;
  human_review_triggers?: string[];
  policy_version_id?: string | null;
};

export type SelectTopicQuestionResult = {
  decision: TopicSelectionTopicQuestionSelectionDecisionRecord;
  materializations: TopicSelectionV1bTopicQuestionMaterialization[];
};

export type TopicSelectionV1bTopicQuestionServiceOptions = {
  repository: TopicSelectionV1bTopicQuestionRepository;
  researchSliceService: TopicSelectionV1bTopicQuestionFormationInputProvider;
  controlPlaneService: TopicSelectionControlPlaneService;
  llmGateway?: TopicSelectionV1bTopicQuestionLlmGateway;
  idFactory?: IdFactory;
  now?: () => string;
};

type CandidateValidationResult = {
  questionFrame: TopicSelectionQuestionFrameRecord;
  candidateSet: TopicSelectionTopicQuestionCandidateSetRecord;
  candidates: TopicSelectionTopicQuestionCandidateRecord[];
  recommendedCandidateIds: string[];
  qualityFlags: string[];
};

type QuestionContext = {
  formationInput: TopicSelectionV1bTopicQuestionFormationInput;
  knownEvidenceRefKeys: Set<string>;
  knownBoundaryRefKeys: Set<string>;
  knownAssumptionRefKeys: Set<string>;
  knownSourceRefKeys: Set<string>;
};

export class TopicSelectionV1bTopicQuestionService {
  private readonly idFactory: IdFactory;
  private readonly now: () => string;
  private readonly repository: TopicSelectionV1bTopicQuestionRepository;
  private readonly researchSliceService: TopicSelectionV1bTopicQuestionFormationInputProvider;
  private readonly controlPlane: TopicSelectionControlPlaneService;
  private readonly llmGateway: TopicSelectionV1bTopicQuestionLlmGateway;

  constructor(options: TopicSelectionV1bTopicQuestionServiceOptions) {
    this.repository = options.repository;
    this.researchSliceService = options.researchSliceService;
    this.controlPlane = options.controlPlaneService;
    this.llmGateway = options.llmGateway ?? new BackendLlmGateway();
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async formTopicQuestionCandidates(
    input: FormTopicQuestionCandidatesInput,
  ): Promise<FormTopicQuestionCandidatesResult> {
    const formationInput = await this.researchSliceService.buildTopicQuestionFormationInput({
      research_slice_id: input.research_slice_id,
    });
    if (formationInput.research_slice_ref.ref_id !== input.research_slice_id) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        'TopicQuestion formation handoff does not match the requested ResearchSlice.',
      );
    }
    const titleCardId = this.requireTitleCardId(formationInput.research_slice_ref);
    const workspaceId = input.workspace_id ?? null;
    const triggeredBy = input.triggered_by ?? 'system';
    const model = input.model ?? DEFAULT_MODEL;
    const promptVersion = input.prompt_template_version ?? PROMPT_TEMPLATE_VERSION;
    const runId = this.idFactory('form_topic_question_run');
    const questionFrameId = this.idFactory('topic_question_frame');
    const candidateSetId = this.idFactory('topic_question_candidate_set');
    const runRef = this.ref('form_topic_question_run', runId, titleCardId);
    const candidateSetRef = this.ref('topic_question_candidate_set', candidateSetId, titleCardId);
    const sourceRefs = this.compileFormationSourceRefs(formationInput);
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      target_ref: runRef,
      source_refs: sourceRefs,
      payload: {
        research_slice_id: input.research_slice_id,
        topic_question_formation_input: formationInput,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: triggeredBy,
    });

    let llmOutput: TopicSelectionFormTopicQuestionLlmOutput;
    let telemetry: LlmCallTelemetry | null = null;
    try {
      const response =
        await this.llmGateway.createStructuredOutput<TopicSelectionFormTopicQuestionLlmOutput>({
          executionContext: {
            feature: 'topic_selection',
            operation: 'topic_question_formation',
            traceId: runId,
            metadata: {
              research_slice_id: input.research_slice_id,
              research_slice_version: formationInput.research_slice_ref.version_id ?? null,
              validated_need_id: formationInput.validated_need_ref.ref_id,
            },
          },
          model,
          prompt: {
            promptTemplateId: PROMPT_TEMPLATE_ID,
            version: promptVersion,
          },
          messages: [
            {
              role: 'system',
              content: [
                'Form bounded, answerable v1b TopicQuestion candidates from the supplied selected ResearchSlice handoff.',
                'Do not create value assessment, package, promotion, PaperProject, or new unmet-need evidence.',
                'Copy upstream refs exactly and keep evidence separate from assumptions.',
              ].join(' '),
            },
            {
              role: 'user',
              content: JSON.stringify({ topic_question_formation_input_json: formationInput }, null, 2),
            },
          ],
          schemaName: 'topic_selection_topic_question_candidate_set',
          schema: topicSelectionFormTopicQuestionLlmOutputSchema as unknown as Record<string, unknown>,
        });
      llmOutput = response.parsed;
      telemetry = response.telemetry;
    } catch (error) {
      const failed = await this.persistFailedFormationRun({
        input,
        formationInput,
        runId,
        titleCardId,
        workspaceId,
        triggeredBy,
        model,
        promptVersion,
        inputSnapshotId: inputSnapshot.input_snapshot_id,
        sourceRefs,
        error,
      });
      throw this.runError(error, failed.form_topic_question_run_id);
    }

    let validation: CandidateValidationResult;
    try {
      validation = this.validateAndBuildCandidates({
        output: llmOutput,
        formationInput,
        runId,
        questionFrameId,
        candidateSetId,
        titleCardId,
        workspaceId,
      });
    } catch (error) {
      const failed = await this.persistFailedFormationRun({
        input,
        formationInput,
        runId,
        titleCardId,
        workspaceId,
        triggeredBy,
        model,
        promptVersion,
        inputSnapshotId: inputSnapshot.input_snapshot_id,
        sourceRefs,
        error,
        telemetry,
        artifacts: [
          {
            artifact_kind: 'structured_output',
            payload: llmOutput as unknown as Record<string, unknown>,
          },
        ],
      });
      throw this.runError(error, failed.form_topic_question_run_id);
    }

    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      workflow_key: 'topic-selection.v1b-form-topic-question-candidates',
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.workflow_profile_version ?? null,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      status: 'succeeded',
      provider_id: model.providerId,
      model_id: model.modelId,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: promptVersion,
      telemetry: this.telemetryRecord(telemetry),
      output_summary: {
        candidate_count: validation.candidates.length,
        recommended_candidate_ids: validation.recommendedCandidateIds,
        quality_flags: validation.qualityFlags,
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: llmOutput as unknown as Record<string, unknown>,
        },
      ],
      created_by: triggeredBy,
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      gate_key: 'topic-selection.v1b-topic-question-candidate-domain-validation',
      target_ref: runRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      warnings: validation.qualityFlags.map((flag) =>
        this.warning(flag, `TopicQuestion candidate formation emitted ${flag}.`, [runRef]),
      ),
      accepted_risk_refs: formationInput.accepted_risk_refs,
      created_by: triggeredBy,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      transition_key: 'v1b-research-slice-to-topic-question-candidate-set',
      source_ref: formationInput.research_slice_ref,
      target_ref: candidateSetRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: triggeredBy },
      accepted_risk_refs: formationInput.accepted_risk_refs,
      created_authority_refs: [
        runRef,
        this.ref('topic_question_frame', questionFrameId, titleCardId),
        candidateSetRef,
      ],
    });

    const now = this.now();
    const run: TopicSelectionFormTopicQuestionRunRecord = {
      form_topic_question_run_id: runId,
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      research_slice_id: formationInput.research_slice_ref.ref_id,
      research_slice_version: formationInput.research_slice_ref.version_id ?? 'v1',
      status: 'succeeded',
      triggered_by: triggeredBy,
      research_slice_ref: formationInput.research_slice_ref,
      slice_selection_decision_ref: formationInput.slice_selection_decision_ref,
      source_option_set_ref: formationInput.source_option_set_ref,
      source_option_ref: formationInput.source_option_ref,
      validated_need_ref: formationInput.validated_need_ref,
      v1b_intake_snapshot_ref: formationInput.v1b_intake_snapshot_ref,
      research_constraint_profile_ref: formationInput.research_constraint_profile_ref,
      readiness_assessment_ref: formationInput.readiness_assessment_ref,
      evidence_map_ref: formationInput.evidence_map_ref,
      search_run_ref: formationInput.search_run_ref,
      search_plan_ref: formationInput.search_plan_ref,
      literature_snapshot_ref: formationInput.literature_snapshot_ref,
      accepted_risk_refs: formationInput.accepted_risk_refs,
      memory_suggestion_refs: formationInput.memory_suggestion_refs,
      recheck_request_refs: formationInput.recheck_request_refs,
      gap_codes: formationInput.gap_codes,
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.workflow_profile_version ?? null,
      provider_id: model.providerId,
      model_id: model.modelId,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: promptVersion,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      question_frame_id: questionFrameId,
      candidate_set_id: candidateSetId,
      artifact_refs: this.artifactRefs(workflow.artifact_refs, titleCardId),
      quality_flags: [...validation.qualityFlags, `transition:${transition.result}`],
      failure_reason: null,
      created_at: now,
      updated_at: now,
    };
    const persisted = await this.repository.createFormationRunWithCandidates({
      form_topic_question_run: run,
      question_frame: validation.questionFrame,
      candidate_set: {
        ...validation.candidateSet,
        input_snapshot_id: inputSnapshot.input_snapshot_id,
        workflow_run_id: workflow.workflow_run.workflow_run_id,
        artifact_refs: this.artifactRefs(workflow.artifact_refs, titleCardId),
      },
      candidates: validation.candidates,
    });
    return persisted;
  }

  async selectTopicQuestion(input: SelectTopicQuestionInput): Promise<SelectTopicQuestionResult> {
    const candidateSet = await this.requireCandidateSet(input.candidate_set_id);
    if (candidateSet.status !== 'ready_for_selection') {
      throw new AppError(
        409,
        candidateSet.status === 'selected' ? 'VERSION_CONFLICT' : 'GATE_CONSTRAINT_FAILED',
        `TopicQuestionCandidateSet status ${candidateSet.status} cannot create a new selection decision.`,
      );
    }
    const [run, frame, candidates] = await Promise.all([
      this.requireFormationRun(candidateSet.form_topic_question_run_id),
      this.requireQuestionFrame(candidateSet.question_frame_id),
      this.repository.listCandidatesByCandidateSetId(candidateSet.topic_question_candidate_set_id),
    ]);
    const titleCardId = candidateSet.title_card_id;
    const workspaceId = candidateSet.workspace_id ?? null;
    const decidedBy = input.decided_by ?? 'system';
    const decisionId = this.idFactory('topic_question_selection_decision');
    const decisionRef = this.ref('topic_question_selection_decision', decisionId, titleCardId);
    const candidateSetRef = this.ref(
      'topic_question_candidate_set',
      candidateSet.topic_question_candidate_set_id,
      titleCardId,
    );

    if (!this.isAdmitDecision(input.decision)) {
      const { workflow, gate, transition } = await this.recordSelectionControlPlane({
        workspaceId,
        titleCardId,
        actor: decidedBy,
        decisionRef,
        sourceRef: candidateSetRef,
        targetRef: decisionRef,
        sourceRefs: [candidateSetRef, run.research_slice_ref, ...run.artifact_refs],
        payload: {
          decision: input.decision,
          candidate_set: candidateSet,
          decision_rationale: input.decision_rationale,
        },
        outputSummary: { decision: input.decision },
        policyVersionId: input.policy_version_id ?? input.selection_policy_version ?? null,
        acceptedRiskRefs: input.accepted_risk_refs ?? [],
        createdAuthorityRefs: [decisionRef],
        transitionKey: 'v1b-topic-question-candidate-set-to-selection-decision',
      });
      const now = this.now();
      const decision: TopicSelectionTopicQuestionSelectionDecisionRecord = {
        topic_question_selection_decision_id: decisionId,
        workspace_id: workspaceId,
        title_card_id: titleCardId,
        candidate_set_id: candidateSet.topic_question_candidate_set_id,
        form_topic_question_run_id: candidateSet.form_topic_question_run_id,
        research_slice_id: candidateSet.research_slice_id,
        research_slice_version: candidateSet.research_slice_version,
        input_snapshot_ref: this.ref('input_snapshot', workflow.workflow_run.input_snapshot_id ?? 'selection', titleCardId),
        decision: input.decision,
        decided_by: decidedBy,
        selection_policy_version: input.selection_policy_version ?? '1',
        admitted_candidate_ids: [],
        created_topic_question_ids: [],
        merged_candidate_groups: input.merged_candidate_groups ?? [],
        hard_gate_results: this.hardGateResults(candidates),
        admission_review: { decision: input.decision, rationale: input.decision_rationale },
        candidate_relationships: input.candidate_relationships ?? {},
        priority_order: input.priority_order ?? [],
        rejected_candidate_reasons: input.rejected_candidate_reasons ?? [],
        blocking_contexts: input.blocking_contexts ?? [],
        decision_rationale: input.decision_rationale,
        requires_human_review: input.requires_human_review ?? false,
        human_review_triggers: input.human_review_triggers ?? [],
        accepted_risk_refs: input.accepted_risk_refs ?? [],
        confidence: input.confidence ?? null,
        input_snapshot_id: workflow.workflow_run.input_snapshot_id,
        workflow_run_id: workflow.workflow_run.workflow_run_id,
        gate_result_id: gate.readiness_gate_result_id,
        transition_attempt_id: transition.chain_transition_attempt_id,
        artifact_refs: this.artifactRefs(workflow.artifact_refs, titleCardId),
        created_at: now,
      };
      return this.repository.createSelectionDecisionWithMaterializations({
        decision,
        candidate_set_patch: {
          status: this.candidateSetStatusForNonAdmit(input.decision),
          updated_at: now,
        },
        candidate_status_patches: this.candidateStatusPatchesForNonAdmit(input.decision, candidates),
        materializations: [],
      });
    }

    const admittedCandidates = this.resolveAdmittedCandidates(input, candidateSet, candidates);
    const admissionIssues = admittedCandidates.flatMap((candidate) =>
      this.admissionBlockers(candidate, frame, input.accepted_risk_refs ?? [], decidedBy),
    );
    if (admissionIssues.length > 0) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        `TopicQuestion admission failed: ${admissionIssues.join('; ')}`,
      );
    }

    const materializationCandidates = input.decision === 'merge_then_admit'
      ? [admittedCandidates[0]!]
      : admittedCandidates;
    const materializations = materializationCandidates.map((candidate) =>
      this.materializeQuestion({
        candidate,
        candidateSet,
        frame,
        run,
        selectionDecisionId: decisionId,
        workflowRunId: null,
        acceptedRiskRefs: input.accepted_risk_refs ?? [],
      }),
    );
    const createdAuthorityRefs = [
      decisionRef,
      ...materializations.flatMap((materialization) => [
        this.ref('topic_question', materialization.topic_question.topic_question_id, titleCardId),
        this.ref(
          'topic_question_contract',
          materialization.topic_question_contract.topic_question_contract_id,
          titleCardId,
          materialization.topic_question_contract.version,
        ),
      ]),
    ];
    const { workflow, gate, transition } = await this.recordSelectionControlPlane({
      workspaceId,
      titleCardId,
      actor: decidedBy,
      decisionRef,
      sourceRef: candidateSetRef,
      targetRef: createdAuthorityRefs[1] ?? decisionRef,
      sourceRefs: this.uniqueRefs([
        candidateSetRef,
        run.research_slice_ref,
        run.validated_need_ref,
        run.research_constraint_profile_ref,
        ...admittedCandidates.map((candidate) =>
          this.ref('topic_question_candidate', candidate.topic_question_candidate_id, titleCardId),
        ),
        ...run.artifact_refs,
      ]),
      payload: {
        decision: input.decision,
        admitted_candidate_ids: admittedCandidates.map((candidate) => candidate.topic_question_candidate_id),
        accepted_risk_refs: input.accepted_risk_refs ?? [],
      },
      outputSummary: {
        decision: input.decision,
        created_topic_question_ids: materializations.map((item) => item.topic_question.topic_question_id),
      },
      policyVersionId: input.policy_version_id ?? input.selection_policy_version ?? null,
      acceptedRiskRefs: input.accepted_risk_refs ?? [],
      createdAuthorityRefs,
      verdict: (input.accepted_risk_refs ?? []).length > 0 ? 'pass_with_risk' : undefined,
      transitionKey: 'v1b-topic-question-candidate-set-to-topic-question-contract',
    });
    const traceSnapshots = await Promise.all(materializations.map((materialization) =>
      this.controlPlane.buildTraceSnapshot({
        workspace_id: workspaceId,
        title_card_id: titleCardId,
        target_ref: this.ref(
          'topic_question_contract',
          materialization.topic_question_contract.topic_question_contract_id,
          titleCardId,
          materialization.topic_question_contract.version,
        ),
        object_refs: this.uniqueRefs([
          run.research_slice_ref,
          run.validated_need_ref,
          decisionRef,
          candidateSetRef,
          this.ref('topic_question', materialization.topic_question.topic_question_id, titleCardId),
          this.ref(
            'topic_question_contract',
            materialization.topic_question_contract.topic_question_contract_id,
            titleCardId,
            materialization.topic_question_contract.version,
          ),
          ...materialization.evidence_refs.map((ref) => ref.evidence_ref),
        ]),
        artifact_refs: this.artifactRefs(workflow.artifact_refs, titleCardId),
        transition_attempt_refs: [
          this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, titleCardId),
        ],
        payload: {
          answerability_verdict: materialization.answerability_plan.answerability_verdict,
          claim_ceiling: materialization.topic_question_contract.claim_ceiling,
          prohibited_claims: materialization.topic_question_contract.prohibited_claims,
        },
        created_by: decidedBy,
      }),
    ));
    const materializationsWithWorkflow = materializations.map((materialization, index) => ({
      ...materialization,
      topic_question_contract: {
        ...materialization.topic_question_contract,
        created_by_workflow_run_id: workflow.workflow_run.workflow_run_id,
        artifact_refs: [
          ...materialization.topic_question_contract.artifact_refs,
          ...this.artifactRefs(workflow.artifact_refs, titleCardId),
          this.ref('trace_snapshot', traceSnapshots[index]!.trace_snapshot_id, titleCardId),
        ],
      },
    }));
    const now = this.now();
    const decision: TopicSelectionTopicQuestionSelectionDecisionRecord = {
      topic_question_selection_decision_id: decisionId,
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      candidate_set_id: candidateSet.topic_question_candidate_set_id,
      form_topic_question_run_id: candidateSet.form_topic_question_run_id,
      research_slice_id: candidateSet.research_slice_id,
      research_slice_version: candidateSet.research_slice_version,
      input_snapshot_ref: this.ref('input_snapshot', workflow.workflow_run.input_snapshot_id ?? 'selection', titleCardId),
      decision: input.decision,
      decided_by: decidedBy,
      selection_policy_version: input.selection_policy_version ?? '1',
      admitted_candidate_ids: admittedCandidates.map((candidate) => candidate.topic_question_candidate_id),
      created_topic_question_ids: materializationsWithWorkflow.map((item) => item.topic_question.topic_question_id),
      merged_candidate_groups: input.merged_candidate_groups ?? [],
      hard_gate_results: this.hardGateResults(candidates),
      admission_review: {
        answerability: 'passed',
        boundary_fit: 'passed',
        evidence_trace_strength: 'passed',
        claim_fit: 'passed',
        rationale: input.decision_rationale,
      },
      candidate_relationships: input.candidate_relationships ?? {},
      priority_order: input.priority_order ?? [],
      rejected_candidate_reasons: input.rejected_candidate_reasons ?? this.defaultRejectedCandidateReasons(
        candidates,
        admittedCandidates,
      ),
      blocking_contexts: input.blocking_contexts ?? [],
      decision_rationale: input.decision_rationale,
      requires_human_review: input.requires_human_review ?? admittedCandidates.some((candidate) =>
        candidate.human_review_triggers.length > 0 || candidate.answerability_verdict === 'answerable_with_risk'),
      human_review_triggers: input.human_review_triggers ?? this.uniqueStrings(admittedCandidates.flatMap((candidate) =>
        candidate.human_review_triggers)),
      accepted_risk_refs: input.accepted_risk_refs ?? [],
      confidence: input.confidence ?? this.minConfidence(admittedCandidates),
      input_snapshot_id: workflow.workflow_run.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      artifact_refs: this.artifactRefs(workflow.artifact_refs, titleCardId),
      created_at: now,
    };
    const persisted = await this.repository.createSelectionDecisionWithMaterializations({
      decision,
      candidate_set_patch: {
        status: 'selected',
        updated_at: now,
      },
      candidate_status_patches: candidates.map((candidate) => ({
        candidate_id: candidate.topic_question_candidate_id,
        status: admittedCandidates.some((admitted) => admitted.topic_question_candidate_id === candidate.topic_question_candidate_id)
          ? input.decision === 'merge_then_admit' && candidate.topic_question_candidate_id !== admittedCandidates[0]!.topic_question_candidate_id
            ? 'merged'
            : 'admitted'
          : 'rejected',
      })),
      materializations: materializationsWithWorkflow,
    });
    return persisted;
  }

  async buildValueAssessmentInput(input: {
    topic_question_contract_id: string;
  }): Promise<TopicSelectionV1bValueAssessmentInput> {
    const contract = await this.repository.findTopicQuestionContractById(input.topic_question_contract_id);
    if (!contract) {
      throw new AppError(404, 'NOT_FOUND', `TopicQuestionContract ${input.topic_question_contract_id} not found.`);
    }
    if (contract.status !== 'active') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Only active TopicQuestionContract records can form T-060 input.');
    }
    const [question, answerabilityPlan, needRefs, evidenceRefs, boundaryRefs, assumptionRefs, conditions, decision] =
      await Promise.all([
        this.repository.findTopicQuestionById(contract.topic_question_id),
        this.repository.findAnswerabilityPlanByContractId(contract.topic_question_contract_id),
        this.repository.listNeedRefsByContractId(contract.topic_question_contract_id),
        this.repository.listEvidenceRefsByContractId(contract.topic_question_contract_id),
        this.repository.listBoundaryRefsByContractId(contract.topic_question_contract_id),
        this.repository.listAssumptionRefsByContractId(contract.topic_question_contract_id),
        this.repository.listFalsificationConditionsByContractId(contract.topic_question_contract_id),
        this.repository.findSelectionDecisionById(contract.selection_decision_id),
      ]);
    if (!question) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract references a missing TopicQuestion.');
    }
    if (question.active_question_contract_id !== contract.topic_question_contract_id) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract is not the active contract for its question.');
    }
    if (!answerabilityPlan) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract is missing its answerability plan.');
    }
    if (answerabilityPlan.topic_question_answerability_plan_id !== contract.answerability_plan_id) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract answerability plan ref is stale.');
    }
    if (!decision) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract references a missing selection decision.');
    }
    if (!this.sameRefSet(contract.accepted_risk_refs, decision.accepted_risk_refs)) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract accepted-risk refs drift from the selection decision.');
    }
    const run = await this.repository.findFormationRunById(decision.form_topic_question_run_id);
    return {
      topic_question_ref: this.ref('topic_question', question.topic_question_id, question.title_card_id, contract.version),
      topic_question_contract_ref: this.ref(
        'topic_question_contract',
        contract.topic_question_contract_id,
        contract.title_card_id,
        contract.version,
      ),
      answerability_plan_ref: this.ref(
        'topic_question_answerability_plan',
        answerabilityPlan.topic_question_answerability_plan_id,
        answerabilityPlan.title_card_id,
      ),
      research_slice_ref: this.ref(
        'research_slice',
        contract.source_research_slice_id,
        contract.title_card_id,
        contract.source_research_slice_version,
      ),
      selection_decision_ref: this.ref(
        'topic_question_selection_decision',
        decision.topic_question_selection_decision_id,
        decision.title_card_id,
      ),
      candidate_set_ref: this.ref('topic_question_candidate_set', decision.candidate_set_id, decision.title_card_id),
      source_candidate_ref: this.ref('topic_question_candidate', contract.source_candidate_id, contract.title_card_id),
      validated_need_refs: needRefs.map((ref) => ref.validated_need_ref),
      evidence_refs: evidenceRefs,
      need_refs: needRefs,
      boundary_refs: boundaryRefs,
      assumption_refs: assumptionRefs,
      falsification_conditions: conditions,
      accepted_risk_refs: contract.accepted_risk_refs,
      memory_suggestion_refs: run?.memory_suggestion_refs ?? [],
      recheck_request_refs: run?.recheck_request_refs ?? [],
      question_contract: contract,
      answerability_plan: answerabilityPlan,
    };
  }

  private validateAndBuildCandidates(input: {
    output: TopicSelectionFormTopicQuestionLlmOutput;
    formationInput: TopicSelectionV1bTopicQuestionFormationInput;
    runId: string;
    questionFrameId: string;
    candidateSetId: string;
    titleCardId: string;
    workspaceId: string | null;
  }): CandidateValidationResult {
    const { output, formationInput, runId, questionFrameId, candidateSetId, titleCardId, workspaceId } = input;
    if (!output || !Array.isArray(output.candidates) || output.candidates.length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestion formation returned no candidates.');
    }
    const context: QuestionContext = {
      formationInput,
      knownEvidenceRefKeys: new Set(formationInput.evidence_refs.map((ref) => this.refKey(ref.evidence_ref))),
      knownBoundaryRefKeys: new Set(formationInput.boundaries.map((boundary) =>
        this.refKey(this.ref('research_slice_boundary', boundary.research_slice_boundary_id, boundary.title_card_id)),
      )),
      knownAssumptionRefKeys: new Set(formationInput.assumptions.map((assumption) =>
        this.refKey(this.ref('research_slice_assumption', assumption.research_slice_assumption_id, assumption.title_card_id)),
      )),
      knownSourceRefKeys: new Set(this.compileFormationSourceRefs(formationInput).map((ref) => this.refKey(ref))),
    };
    this.validateFrame(output.question_frame, context);
    this.assertUniqueCandidateKeys(output.candidates);
    const now = this.now();
    const questionFrame: TopicSelectionQuestionFrameRecord = {
      question_frame_id: questionFrameId,
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      form_topic_question_run_id: runId,
      research_slice_id: formationInput.research_slice_ref.ref_id,
      research_slice_version: formationInput.research_slice_ref.version_id ?? 'v1',
      source_validated_need_refs: [formationInput.validated_need_ref],
      target_setting: output.question_frame.target_setting,
      target_community: output.question_frame.target_community,
      object_scope: output.question_frame.object_scope,
      task_scope: output.question_frame.task_scope,
      intervention_or_approach: output.question_frame.intervention_or_approach,
      comparison_baseline: output.question_frame.comparison_baseline,
      observable_outcome: output.question_frame.observable_outcome,
      assumption_refs: output.question_frame.assumption_refs,
      evidence_refs: output.question_frame.evidence_refs,
      frame_payload: {
        ...output.question_frame.frame_payload,
        inherited_claim_ceiling: formationInput.claim_ceiling,
        inherited_non_goals: formationInput.non_goals,
        inherited_assumptions: formationInput.assumptions,
        inherited_evaluation_path: formationInput.evaluation_path,
        topic_question_guardrails: formationInput.topic_question_guardrails,
        value_assessment_inputs: formationInput.value_assessment_inputs,
      },
      checksum: sha256Text(stableStringify(output.question_frame)),
      created_at: now,
    };
    const candidateRecords = output.candidates.map((draft, index) => {
      this.validateCandidateDraft(draft, context, index);
      const candidateId = this.idFactory('topic_question_candidate');
      const hasHardBlocker = draft.blockers.length > 0
        || draft.boundary_check.boundary_violations.length > 0
        || draft.answerability_verdict === 'not_answerable'
        || draft.answerability_verdict === 'needs_slice_refinement';
      return {
        topic_question_candidate_id: candidateId,
        workspace_id: workspaceId,
        title_card_id: titleCardId,
        candidate_set_id: candidateSetId,
        question_frame_id: questionFrameId,
        research_slice_id: formationInput.research_slice_ref.ref_id,
        research_slice_version: formationInput.research_slice_ref.version_id ?? 'v1',
        candidate_ordinal: index + 1,
        candidate_key: draft.candidate_key,
        status: hasHardBlocker
          ? 'blocked'
          : output.recommended_candidate_keys.includes(draft.candidate_key)
            ? 'recommended'
            : 'candidate',
        main_question: draft.main_question,
        sub_questions: draft.sub_questions,
        question_type: draft.question_type,
        contribution_hypothesis: draft.contribution_hypothesis,
        source_validated_need_refs: draft.source_validated_need_refs,
        answerability_verdict: draft.answerability_verdict,
        answerability_plan_payload: draft.answerability_plan,
        boundary_check_payload: draft.boundary_check,
        traceability_check_payload: draft.traceability_check,
        expected_claim: draft.expected_claim,
        fallback_claim: draft.fallback_claim,
        max_claim_strength: draft.max_claim_strength,
        observable_success_criteria: draft.observable_success_criteria,
        falsification_conditions_payload: draft.falsification_conditions,
        risk_notes: draft.risk_notes,
        blockers: draft.blockers,
        objections: draft.objections,
        human_review_triggers: draft.human_review_triggers,
        confidence: draft.confidence ?? null,
        created_at: now,
      } satisfies TopicSelectionTopicQuestionCandidateRecord;
    });
    const recommendedCandidateIds = output.recommended_candidate_keys
      .map((key) => candidateRecords.find((candidate) => candidate.candidate_key === key)?.topic_question_candidate_id)
      .filter((id): id is string => Boolean(id));
    const qualityFlags = this.uniqueStrings([
      ...(recommendedCandidateIds.length === 0 ? ['NO_RECOMMENDED_TOPIC_QUESTION_CANDIDATE'] : []),
      ...(candidateRecords.some((candidate) => candidate.status === 'blocked') ? ['BLOCKED_CANDIDATES_PRESENT'] : []),
      ...(output.human_review_triggers.length > 0 ? ['HUMAN_REVIEW_TRIGGERED'] : []),
      ...(candidateRecords.some((candidate) => (candidate.confidence ?? 1) < 0.6)
        ? ['LOW_CONFIDENCE_CANDIDATE_PRESENT']
        : []),
    ]);
    const candidateSet: TopicSelectionTopicQuestionCandidateSetRecord = {
      topic_question_candidate_set_id: candidateSetId,
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      form_topic_question_run_id: runId,
      question_frame_id: questionFrameId,
      research_slice_id: formationInput.research_slice_ref.ref_id,
      research_slice_version: formationInput.research_slice_ref.version_id ?? 'v1',
      status: 'ready_for_selection',
      candidate_count: candidateRecords.length,
      recommended_candidate_ids: recommendedCandidateIds,
      admission_readiness: {
        hard_blocked_candidate_count: candidateRecords.filter((candidate) => candidate.status === 'blocked').length,
        answerability_verdicts: candidateRecords.map((candidate) => candidate.answerability_verdict),
      },
      hard_blockers: candidateRecords.flatMap((candidate) => candidate.blockers),
      human_review_triggers: this.uniqueStrings([
        ...output.human_review_triggers,
        ...candidateRecords.flatMap((candidate) => candidate.human_review_triggers),
      ]),
      generation_notes: output.generation_notes,
      input_snapshot_id: null,
      workflow_run_id: null,
      artifact_refs: [],
      created_at: now,
      updated_at: now,
    };
    return {
      questionFrame,
      candidateSet,
      candidates: candidateRecords,
      recommendedCandidateIds,
      qualityFlags,
    };
  }

  private validateFrame(frame: TopicSelectionFormTopicQuestionLlmOutput['question_frame'], context: QuestionContext): void {
    if (!this.aligns(frame.target_community, context.formationInput.target_community)) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'QuestionFrame target community drifts from ResearchSlice.');
    }
    for (const ref of frame.evidence_refs) {
      if (!context.knownEvidenceRefKeys.has(this.refKey(ref))) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `QuestionFrame cites unknown or drifted evidence ref ${ref.ref_id}.`);
      }
    }
    for (const ref of frame.assumption_refs) {
      if (!context.knownAssumptionRefKeys.has(this.refKey(ref))) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `QuestionFrame cites unknown or drifted assumption ref ${ref.ref_id}.`);
      }
    }
  }

  private validateCandidateDraft(
    candidate: TopicSelectionFormTopicQuestionLlmOutput['candidates'][number],
    context: QuestionContext,
    index: number,
  ): void {
    const ordinal = index + 1;
    if (candidate.source_validated_need_refs.length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} must inherit a ValidatedNeed ref.`);
    }
    const validatedNeedRefKey = this.refKey(context.formationInput.validated_need_ref);
    const unknownNeed = candidate.source_validated_need_refs.find((ref) =>
      this.refKey(ref) !== validatedNeedRefKey);
    if (unknownNeed) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} introduces unknown need ref ${unknownNeed.ref_id}.`);
    }
    if (candidate.boundary_check.boundary_violations.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} violates ResearchSlice boundaries.`);
    }
    for (const ref of [
      ...candidate.boundary_check.preserved_boundary_refs,
      ...candidate.boundary_check.excluded_boundary_refs,
    ]) {
      if (!context.knownBoundaryRefKeys.has(this.refKey(ref))) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} cites unknown or drifted boundary ref ${ref.ref_id}.`);
      }
    }
    this.assertAnswerabilityPlan(candidate.answerability_plan, `TopicQuestion candidate ${ordinal}`);
    for (const ref of this.candidateEvidenceRefs(candidate)) {
      if (!context.knownEvidenceRefKeys.has(this.refKey(ref))) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} cites unknown or drifted evidence ref ${ref.ref_id}.`);
      }
    }
    for (const ref of candidate.falsification_conditions.flatMap((condition) => condition.trigger_source_refs)) {
      if (!context.knownSourceRefKeys.has(this.refKey(ref))) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} cites unknown source ref ${ref.ref_id}.`);
      }
    }
    const claimViolations = this.explicitClaimCeilingViolations(context.formationInput.claim_ceiling, [
      candidate.expected_claim,
      candidate.fallback_claim,
      candidate.max_claim_strength,
    ]);
    if (claimViolations.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `TopicQuestion candidate ${ordinal} exceeds the ResearchSlice claim ceiling.`);
    }
  }

  private admissionBlockers(
    candidate: TopicSelectionTopicQuestionCandidateRecord,
    frame: TopicSelectionQuestionFrameRecord,
    acceptedRiskRefs: TopicSelectionFunctionalRef[],
    actor: TopicSelectionActorType,
  ): string[] {
    const blockers: string[] = [];
    if (candidate.status === 'blocked') {
      blockers.push(`${candidate.topic_question_candidate_id}: candidate is blocked`);
    }
    if (candidate.blockers.length > 0) {
      blockers.push(...candidate.blockers.map((blocker) => `${candidate.topic_question_candidate_id}: ${blocker}`));
    }
    if (candidate.boundary_check_payload.boundary_violations.length > 0) {
      blockers.push(`${candidate.topic_question_candidate_id}: boundary violation`);
    }
    if (
      candidate.answerability_verdict === 'not_answerable'
      || candidate.answerability_verdict === 'needs_slice_refinement'
    ) {
      blockers.push(`${candidate.topic_question_candidate_id}: ${candidate.answerability_verdict}`);
    }
    if (
      candidate.answerability_verdict === 'answerable_with_risk'
      && actor === 'system'
      && acceptedRiskRefs.length === 0
    ) {
      blockers.push(`${candidate.topic_question_candidate_id}: answerable_with_risk requires accepted risk or human handling`);
    }
    const claimCeiling = this.frameClaimCeiling(frame);
    if (this.explicitClaimCeilingViolations(claimCeiling, [
      candidate.expected_claim,
      candidate.fallback_claim,
      candidate.max_claim_strength,
    ]).length > 0) {
      blockers.push(`${candidate.topic_question_candidate_id}: claim ceiling violation`);
    }
    try {
      this.assertAnswerabilityPlan(candidate.answerability_plan_payload, candidate.topic_question_candidate_id);
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : `${candidate.topic_question_candidate_id}: invalid answerability plan`);
    }
    return this.uniqueStrings(blockers);
  }

  private materializeQuestion(input: {
    candidate: TopicSelectionTopicQuestionCandidateRecord;
    candidateSet: TopicSelectionTopicQuestionCandidateSetRecord;
    frame: TopicSelectionQuestionFrameRecord;
    run: TopicSelectionFormTopicQuestionRunRecord;
    selectionDecisionId: string;
    workflowRunId: string | null;
    acceptedRiskRefs: TopicSelectionFunctionalRef[];
  }): TopicSelectionV1bTopicQuestionMaterialization {
    const { candidate, candidateSet, frame, run, selectionDecisionId, acceptedRiskRefs } = input;
    const now = this.now();
    const questionId = this.idFactory('topic_question');
    const researchRecordId = this.idFactory('topic_record');
    const contractId = this.idFactory('topic_question_contract');
    const answerabilityPlanId = this.idFactory('topic_question_answerability_plan');
    const contractVersion = this.versionFromId(contractId);
    const question: TopicSelectionTopicQuestionRecord = {
      topic_question_id: questionId,
      workspace_id: candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      research_record_id: researchRecordId,
      research_slice_id: candidate.research_slice_id,
      research_slice_version: candidate.research_slice_version,
      source_validated_need_ids: candidate.source_validated_need_refs.map((ref) => ref.ref_id),
      source_candidate_set_id: candidateSet.topic_question_candidate_set_id,
      source_candidate_id: candidate.topic_question_candidate_id,
      selection_decision_id: selectionDecisionId,
      active_question_contract_id: contractId,
      main_question: candidate.main_question,
      sub_questions: candidate.sub_questions,
      question_type: candidate.question_type,
      contribution_hypothesis: candidate.contribution_hypothesis,
      status: 'active',
      created_at: now,
      updated_at: now,
    };
    const contractPayload = {
      accepted_risk_refs: acceptedRiskRefs,
      answerability_plan_id: answerabilityPlanId,
      candidate,
      frame,
      run_id: run.form_topic_question_run_id,
      selection_decision_id: selectionDecisionId,
    };
    const evidenceRefs = this.buildEvidenceRefs({
      candidate,
      questionId,
      contractId,
      titleCardId: candidate.title_card_id,
      workspaceId: candidate.workspace_id ?? null,
    });
    const contract: TopicSelectionTopicQuestionContractRecord = {
      topic_question_contract_id: contractId,
      workspace_id: candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      topic_question_id: questionId,
      version: contractVersion,
      answerability_plan_id: answerabilityPlanId,
      source_research_slice_id: candidate.research_slice_id,
      source_research_slice_version: candidate.research_slice_version,
      source_candidate_id: candidate.topic_question_candidate_id,
      selection_decision_id: selectionDecisionId,
      input_snapshot_ref: this.ref('input_snapshot', run.input_snapshot_id ?? run.form_topic_question_run_id, candidate.title_card_id),
      contract_hash: sha256Text(stableStringify(contractPayload)),
      main_question: candidate.main_question,
      question_type: candidate.question_type,
      contribution_hypothesis: candidate.contribution_hypothesis,
      target_setting: frame.target_setting,
      target_community: frame.target_community,
      expected_claim: candidate.expected_claim,
      fallback_claim: candidate.fallback_claim,
      max_claim_strength: candidate.max_claim_strength,
      evaluation_route: candidate.answerability_plan_payload.evaluation_setting,
      claim_ceiling: this.frameClaimCeiling(frame),
      prohibited_claims: this.uniqueStrings([
        ...candidate.boundary_check_payload.prohibited_claims,
        ...this.frameStringArray(frame, 'inherited_non_goals'),
      ]),
      required_evidence_categories: this.requiredEvidenceCategories(evidenceRefs),
      allowed_refinements: candidate.boundary_check_payload.allowed_refinements,
      stop_reopen_conditions: candidate.falsification_conditions_payload.map((condition) => condition.statement),
      accepted_risk_refs: acceptedRiskRefs,
      risk_notes: candidate.risk_notes,
      status: 'active',
      created_by_workflow_run_id: input.workflowRunId,
      artifact_refs: run.artifact_refs,
      created_at: now,
      updated_at: now,
    };
    const answerabilityPlan: TopicSelectionTopicQuestionAnswerabilityPlanRecord = {
      topic_question_answerability_plan_id: answerabilityPlanId,
      workspace_id: candidate.workspace_id ?? null,
      title_card_id: candidate.title_card_id,
      topic_question_id: questionId,
      topic_question_contract_id: contractId,
      answerability_verdict: candidate.answerability_verdict,
      datasets_or_resources: candidate.answerability_plan_payload.datasets_or_resources,
      metrics: candidate.answerability_plan_payload.metrics,
      baselines: candidate.answerability_plan_payload.baselines,
      ablations_or_comparisons: candidate.answerability_plan_payload.ablations_or_comparisons,
      evaluation_setting: candidate.answerability_plan_payload.evaluation_setting,
      dependency_risks: candidate.answerability_plan_payload.dependency_risks,
      open_dependencies: candidate.answerability_plan_payload.open_dependencies,
      known_gaps: candidate.answerability_plan_payload.known_gaps,
      required_evidence_refs: candidate.answerability_plan_payload.required_evidence_refs,
      created_at: now,
    };
    return {
      topic_question: question,
      topic_question_contract: contract,
      answerability_plan: answerabilityPlan,
      need_refs: candidate.source_validated_need_refs.map((needRef) => ({
        topic_question_need_ref_id: this.idFactory('topic_question_need_ref'),
        workspace_id: candidate.workspace_id ?? null,
        title_card_id: candidate.title_card_id,
        topic_question_id: questionId,
        topic_question_contract_id: contractId,
        validated_need_ref: needRef,
        source_need_candidate_ref: null,
        role: needRef.ref_id === run.validated_need_ref.ref_id ? 'primary' : 'supporting',
        inherited_from_research_slice_id: candidate.research_slice_id,
        coverage_note: 'Inherited through selected ResearchSlice; T-059 does not revalidate need existence.',
        created_at: now,
      })),
      evidence_refs: evidenceRefs,
      boundary_refs: this.buildBoundaryRefs({
        candidate,
        questionId,
        contractId,
        titleCardId: candidate.title_card_id,
        workspaceId: candidate.workspace_id ?? null,
      }),
      assumption_refs: this.buildAssumptionRefs({
        candidate,
        frame,
        questionId,
        contractId,
        titleCardId: candidate.title_card_id,
        workspaceId: candidate.workspace_id ?? null,
      }),
      falsification_conditions: candidate.falsification_conditions_payload.map((condition) => ({
        topic_question_falsification_condition_id: this.idFactory('topic_question_falsification_condition'),
        workspace_id: candidate.workspace_id ?? null,
        title_card_id: candidate.title_card_id,
        topic_question_contract_id: contractId,
        condition_type: condition.condition_type,
        severity: condition.severity,
        statement: condition.statement,
        trigger_evidence_refs: condition.trigger_evidence_refs,
        trigger_source_refs: condition.trigger_source_refs,
        related_contract_fields: condition.related_contract_fields,
        expected_action: condition.expected_action,
        check_timing: condition.check_timing,
        confidence: condition.confidence,
        status: 'active',
        created_at: now,
      })),
    };
  }

  private buildEvidenceRefs(input: {
    candidate: TopicSelectionTopicQuestionCandidateRecord;
    questionId: string;
    contractId: string;
    titleCardId: string;
    workspaceId: string | null;
  }): TopicSelectionTopicQuestionEvidenceRefRecord[] {
    const now = this.now();
    const byRole = [
      ['support', input.candidate.traceability_check_payload.support_evidence_refs],
      ['challenge', input.candidate.traceability_check_payload.challenge_evidence_refs],
      ['claim', this.uniqueRefs([
        ...input.candidate.answerability_plan_payload.required_evidence_refs,
        ...input.candidate.traceability_check_payload.mapped_evidence_refs,
      ])],
      ['baseline', input.candidate.traceability_check_payload.baseline_evidence_refs],
      ['context', input.candidate.traceability_check_payload.context_evidence_refs],
    ] as const;
    return byRole.flatMap(([role, refs]) =>
      refs.map((evidenceRef) => ({
        topic_question_evidence_ref_id: this.idFactory('topic_question_evidence_ref'),
        workspace_id: input.workspaceId,
        title_card_id: input.titleCardId,
        topic_question_id: input.questionId,
        topic_question_contract_id: input.contractId,
        evidence_ref: evidenceRef,
        evidence_role: role,
        mapped_question_part: input.candidate.main_question,
        rationale: `Mapped as ${role} evidence for the admitted TopicQuestion.`,
        source_locator_snapshot: {},
        created_at: now,
      } satisfies TopicSelectionTopicQuestionEvidenceRefRecord)),
    );
  }

  private buildBoundaryRefs(input: {
    candidate: TopicSelectionTopicQuestionCandidateRecord;
    questionId: string;
    contractId: string;
    titleCardId: string;
    workspaceId: string | null;
  }): TopicSelectionTopicQuestionBoundaryRefRecord[] {
    const now = this.now();
    const preserved = input.candidate.boundary_check_payload.preserved_boundary_refs.map((ref) => ({
      ref,
      kind: 'preserved' as const,
    }));
    const excluded = input.candidate.boundary_check_payload.excluded_boundary_refs.map((ref) => ({
      ref,
      kind: 'excluded' as const,
    }));
    return [...preserved, ...excluded].map(({ ref, kind }) => ({
      topic_question_boundary_ref_id: this.idFactory('topic_question_boundary_ref'),
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_question_id: input.questionId,
      topic_question_contract_id: input.contractId,
      research_slice_boundary_id: ref.ref_id,
      boundary_kind: kind,
      question_part: input.candidate.main_question,
      note: kind === 'excluded'
        ? 'Excluded boundary preserved by the TopicQuestionContract.'
        : 'Included boundary preserved by the TopicQuestionContract.',
      created_at: now,
    }));
  }

  private buildAssumptionRefs(input: {
    candidate: TopicSelectionTopicQuestionCandidateRecord;
    frame: TopicSelectionQuestionFrameRecord;
    questionId: string;
    contractId: string;
    titleCardId: string;
    workspaceId: string | null;
  }): TopicSelectionTopicQuestionAssumptionRefRecord[] {
    const now = this.now();
    const selectedAssumptionKeys = new Set(input.frame.assumption_refs.map((ref) => this.refKey(ref)));
    const inheritedAssumptionRefs = this.frameInheritedAssumptions(input.frame)
      .filter((assumption) =>
        selectedAssumptionKeys.has(this.refKey(
          this.ref('research_slice_assumption', assumption.research_slice_assumption_id, assumption.title_card_id),
        )),
      )
      .map((assumption) => ({
        topic_question_assumption_ref_id: this.idFactory('topic_question_assumption_ref'),
        workspace_id: input.workspaceId,
        title_card_id: input.titleCardId,
        topic_question_id: input.questionId,
        topic_question_contract_id: input.contractId,
        assumption_type: assumption.assumption_type,
        statement: assumption.statement,
        source_assumption_id: assumption.research_slice_assumption_id,
        evidence_refs: assumption.evidence_refs,
        risk_level: assumption.risk_level,
        status: assumption.status,
        created_at: now,
      } satisfies TopicSelectionTopicQuestionAssumptionRefRecord));
    const unmappedAssumptionRefs = input.candidate.traceability_check_payload.unmapped_assumptions.map((statement) => ({
      topic_question_assumption_ref_id: this.idFactory('topic_question_assumption_ref'),
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_question_id: input.questionId,
      topic_question_contract_id: input.contractId,
      assumption_type: 'dependency',
      statement,
      source_assumption_id: null,
      evidence_refs: [],
      risk_level: 'unknown',
      status: 'open',
      created_at: now,
    } satisfies TopicSelectionTopicQuestionAssumptionRefRecord));
    return [...inheritedAssumptionRefs, ...unmappedAssumptionRefs];
  }

  private async persistFailedFormationRun(input: {
    input: FormTopicQuestionCandidatesInput;
    formationInput: TopicSelectionV1bTopicQuestionFormationInput;
    runId: string;
    titleCardId: string;
    workspaceId: string | null;
    triggeredBy: TopicSelectionActorType;
    model: LlmModelRef;
    promptVersion: string;
    inputSnapshotId: string;
    sourceRefs: TopicSelectionFunctionalRef[];
    error: unknown;
    telemetry?: LlmCallTelemetry | null;
    artifacts?: Array<{ artifact_kind: 'structured_output' | 'diagnostic'; payload: Record<string, unknown> }>;
  }): Promise<TopicSelectionFormTopicQuestionRunRecord> {
    const runRef = this.ref('form_topic_question_run', input.runId, input.titleCardId);
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      workflow_key: 'topic-selection.v1b-form-topic-question-candidates',
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.input.workflow_profile_version ?? null,
      input_snapshot_id: input.inputSnapshotId,
      status: 'failed',
      provider_id: input.model.providerId,
      model_id: input.model.modelId,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: input.promptVersion,
      telemetry: this.telemetryRecord(input.telemetry ?? this.errorTelemetry(input.error)),
      output_summary: {
        error: this.errorPayload(input.error),
      },
      error_code: this.errorCode(input.error),
      error_message: this.errorMessage(input.error),
      artifacts: input.artifacts ?? [
        {
          artifact_kind: 'diagnostic',
          payload: this.errorPayload(input.error),
        },
      ],
      created_by: input.triggeredBy,
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      gate_key: 'topic-selection.v1b-topic-question-candidate-domain-validation',
      target_ref: runRef,
      input_snapshot_id: input.inputSnapshotId,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.input.policy_version_id ?? null,
      blockers: [
        this.blocker(
          this.errorCode(input.error),
          this.errorMessage(input.error),
          [input.formationInput.research_slice_ref],
        ),
      ],
      created_by: input.triggeredBy,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      transition_key: 'v1b-research-slice-to-topic-question-candidate-set',
      source_ref: input.formationInput.research_slice_ref,
      target_ref: runRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: input.inputSnapshotId,
      policy_version_id: input.input.policy_version_id ?? null,
      actor: { actor_type: input.triggeredBy },
      created_authority_refs: [],
    });
    const now = this.now();
    const failedRun: TopicSelectionFormTopicQuestionRunRecord = {
      form_topic_question_run_id: input.runId,
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      research_slice_id: input.formationInput.research_slice_ref.ref_id,
      research_slice_version: input.formationInput.research_slice_ref.version_id ?? 'v1',
      status: 'failed',
      triggered_by: input.triggeredBy,
      research_slice_ref: input.formationInput.research_slice_ref,
      slice_selection_decision_ref: input.formationInput.slice_selection_decision_ref,
      source_option_set_ref: input.formationInput.source_option_set_ref,
      source_option_ref: input.formationInput.source_option_ref,
      validated_need_ref: input.formationInput.validated_need_ref,
      v1b_intake_snapshot_ref: input.formationInput.v1b_intake_snapshot_ref,
      research_constraint_profile_ref: input.formationInput.research_constraint_profile_ref,
      readiness_assessment_ref: input.formationInput.readiness_assessment_ref,
      evidence_map_ref: input.formationInput.evidence_map_ref,
      search_run_ref: input.formationInput.search_run_ref,
      search_plan_ref: input.formationInput.search_plan_ref,
      literature_snapshot_ref: input.formationInput.literature_snapshot_ref,
      accepted_risk_refs: input.formationInput.accepted_risk_refs,
      memory_suggestion_refs: input.formationInput.memory_suggestion_refs,
      recheck_request_refs: input.formationInput.recheck_request_refs,
      gap_codes: input.formationInput.gap_codes,
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.input.workflow_profile_version ?? null,
      provider_id: input.model.providerId,
      model_id: input.model.modelId,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: input.promptVersion,
      input_snapshot_id: input.inputSnapshotId,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      question_frame_id: null,
      candidate_set_id: null,
      artifact_refs: this.artifactRefs(workflow.artifact_refs, input.titleCardId),
      quality_flags: [`transition:${transition.result}`],
      failure_reason: this.errorMessage(input.error),
      created_at: now,
      updated_at: now,
    };
    return this.repository.createFormationRun(failedRun);
  }

  private async recordSelectionControlPlane(input: {
    workspaceId: string | null;
    titleCardId: string;
    actor: TopicSelectionActorType;
    decisionRef: TopicSelectionFunctionalRef;
    sourceRef: TopicSelectionFunctionalRef;
    targetRef: TopicSelectionFunctionalRef;
    sourceRefs: TopicSelectionFunctionalRef[];
    payload: Record<string, unknown>;
    outputSummary: Record<string, unknown>;
    policyVersionId: string | null;
    acceptedRiskRefs: TopicSelectionFunctionalRef[];
    createdAuthorityRefs: TopicSelectionFunctionalRef[];
    verdict?: 'pass' | 'pass_with_risk' | 'needs_human_review';
    transitionKey: string;
  }) {
    const inputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      target_ref: input.decisionRef,
      source_refs: input.sourceRefs,
      payload: input.payload,
      policy_version: input.policyVersionId,
      created_by: input.actor,
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      workflow_key: 'topic-selection.v1b-select-topic-question',
      workflow_profile_key: 'deterministic-topic-question-selection-policy',
      workflow_profile_version: input.policyVersionId,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      status: 'succeeded',
      output_summary: input.outputSummary,
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: input.outputSummary,
        },
      ],
      created_by: input.actor,
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      gate_key: 'topic-selection.v1b-topic-question-selection-domain-validation',
      target_ref: input.targetRef,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policyVersionId,
      verdict: input.verdict,
      accepted_risk_refs: input.acceptedRiskRefs,
      created_by: input.actor,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      transition_key: input.transitionKey,
      source_ref: input.sourceRef,
      target_ref: input.targetRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: inputSnapshot.input_snapshot_id,
      policy_version_id: input.policyVersionId,
      actor: { actor_type: input.actor },
      accepted_risk_refs: input.acceptedRiskRefs,
      created_authority_refs: input.createdAuthorityRefs,
    });
    return { workflow, gate, transition };
  }

  private resolveAdmittedCandidates(
    input: SelectTopicQuestionInput,
    candidateSet: TopicSelectionTopicQuestionCandidateSetRecord,
    candidates: TopicSelectionTopicQuestionCandidateRecord[],
  ): TopicSelectionTopicQuestionCandidateRecord[] {
    const requestedIds = input.admitted_candidate_ids?.length
      ? input.admitted_candidate_ids
      : candidateSet.recommended_candidate_ids.length
        ? [candidateSet.recommended_candidate_ids[0]!]
        : [candidates[0]?.topic_question_candidate_id].filter((id): id is string => Boolean(id));
    const admitted = requestedIds.map((candidateId) => {
      const candidate = candidates.find((item) => item.topic_question_candidate_id === candidateId);
      if (!candidate) {
        throw new AppError(404, 'NOT_FOUND', `TopicQuestionCandidate ${candidateId} not found.`);
      }
      return candidate;
    });
    if (new Set(requestedIds).size !== requestedIds.length) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'admitted_candidate_ids must not contain duplicates.');
    }
    if (input.decision === 'admit' && admitted.length !== 1) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'admit requires exactly one admitted candidate.');
    }
    if (input.decision === 'merge_then_admit' && admitted.length < 1) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'merge_then_admit requires at least one canonical candidate.');
    }
    if (input.decision === 'admit_multiple' && admitted.length < 2) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'admit_multiple requires at least two admitted candidates.');
    }
    return admitted;
  }

  private candidateStatusPatchesForNonAdmit(
    decision: TopicSelectionTopicQuestionSelectionDecision,
    candidates: TopicSelectionTopicQuestionCandidateRecord[],
  ): Array<{
    candidate_id: string;
    status: TopicSelectionTopicQuestionCandidateRecord['status'];
  }> {
    return candidates.map((candidate) => ({
      candidate_id: candidate.topic_question_candidate_id,
      status: decision === 'park'
        ? 'parked'
        : candidate.status === 'blocked'
          ? 'blocked'
          : 'rejected',
    }));
  }

  private isAdmitDecision(decision: TopicSelectionTopicQuestionSelectionDecision): boolean {
    return decision === 'admit' || decision === 'admit_multiple' || decision === 'merge_then_admit';
  }

  private candidateSetStatusForNonAdmit(
    decision: TopicSelectionTopicQuestionSelectionDecision,
  ): TopicSelectionTopicQuestionCandidateSetRecord['status'] {
    if (decision === 'park') {
      return 'parked';
    }
    if (decision === 'reject_all') {
      return 'rejected';
    }
    return 'no_admissible_candidate';
  }

  private compileFormationSourceRefs(input: TopicSelectionV1bTopicQuestionFormationInput): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      input.research_slice_ref,
      input.slice_selection_decision_ref,
      input.source_option_set_ref,
      input.source_option_ref,
      input.validated_need_ref,
      input.v1b_intake_snapshot_ref,
      input.research_constraint_profile_ref,
      input.readiness_assessment_ref,
      input.evidence_map_ref,
      input.search_run_ref,
      input.search_plan_ref,
      input.literature_snapshot_ref,
      ...input.evidence_refs.map((ref) => ref.evidence_ref),
      ...input.boundaries.map((boundary) =>
        this.ref('research_slice_boundary', boundary.research_slice_boundary_id, boundary.title_card_id),
      ),
      ...input.assumptions.map((assumption) =>
        this.ref('research_slice_assumption', assumption.research_slice_assumption_id, assumption.title_card_id),
      ),
      ...input.accepted_risk_refs,
      ...input.memory_suggestion_refs,
      ...input.recheck_request_refs,
    ]);
  }

  private candidateEvidenceRefs(candidate: TopicSelectionFormTopicQuestionLlmOutput['candidates'][number]): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      ...candidate.answerability_plan.required_evidence_refs,
      ...candidate.traceability_check.support_evidence_refs,
      ...candidate.traceability_check.challenge_evidence_refs,
      ...candidate.traceability_check.baseline_evidence_refs,
      ...candidate.traceability_check.context_evidence_refs,
      ...candidate.traceability_check.mapped_evidence_refs,
      ...candidate.falsification_conditions.flatMap((condition) => condition.trigger_evidence_refs),
    ]);
  }

  private assertUniqueCandidateKeys(candidates: TopicSelectionFormTopicQuestionLlmOutput['candidates']): void {
    const seen = new Set<string>();
    for (const candidate of candidates) {
      if (seen.has(candidate.candidate_key)) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `Duplicate TopicQuestion candidate key ${candidate.candidate_key}.`);
      }
      seen.add(candidate.candidate_key);
    }
  }

  private assertAnswerabilityPlan(
    plan: TopicSelectionTopicQuestionCandidateRecord['answerability_plan_payload'],
    label: string,
  ): void {
    if (
      plan.datasets_or_resources.length === 0
      || plan.metrics.length === 0
      || plan.baselines.length === 0
      || plan.required_evidence_refs.length === 0
      || plan.evaluation_setting.trim().length === 0
    ) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `${label} is missing a minimum answerability plan.`);
    }
  }

  private hardGateResults(candidates: TopicSelectionTopicQuestionCandidateRecord[]): Record<string, unknown>[] {
    return candidates.map((candidate) => ({
      candidate_question_id: candidate.topic_question_candidate_id,
      passed: candidate.status !== 'blocked' && candidate.blockers.length === 0,
      blockers: candidate.blockers,
      answerability_verdict: candidate.answerability_verdict,
    }));
  }

  private defaultRejectedCandidateReasons(
    candidates: TopicSelectionTopicQuestionCandidateRecord[],
    admittedCandidates: TopicSelectionTopicQuestionCandidateRecord[],
  ): Record<string, unknown>[] {
    const admittedIds = new Set(admittedCandidates.map((candidate) => candidate.topic_question_candidate_id));
    return candidates
      .filter((candidate) => !admittedIds.has(candidate.topic_question_candidate_id))
      .map((candidate) => ({
        candidate_question_id: candidate.topic_question_candidate_id,
        reason: candidate.blockers[0] ?? 'Not admitted by selection decision.',
      }));
  }

  private requiredEvidenceCategories(evidenceRefs: TopicSelectionTopicQuestionEvidenceRefRecord[]): string[] {
    const roles = new Set(evidenceRefs.map((ref) => ref.evidence_role));
    return TOPIC_SELECTION_TOPIC_QUESTION_EVIDENCE_ROLES.filter((role) => roles.has(role));
  }

  private minConfidence(candidates: TopicSelectionTopicQuestionCandidateRecord[]): number | null {
    const confidences = candidates
      .map((candidate) => candidate.confidence)
      .filter((confidence): confidence is number => typeof confidence === 'number');
    return confidences.length > 0 ? Math.min(...confidences) : null;
  }

  private frameClaimCeiling(frame: TopicSelectionQuestionFrameRecord): string {
    const value = frame.frame_payload.inherited_claim_ceiling;
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : 'No broader than the selected ResearchSlice expected/fallback claim.';
  }

  private frameStringArray(frame: TopicSelectionQuestionFrameRecord, key: string): string[] {
    const value = frame.frame_payload[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private frameInheritedAssumptions(
    frame: TopicSelectionQuestionFrameRecord,
  ): TopicSelectionResearchSliceAssumptionRecord[] {
    const value = frame.frame_payload.inherited_assumptions;
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is TopicSelectionResearchSliceAssumptionRecord =>
      typeof item === 'object'
      && item !== null
      && typeof (item as TopicSelectionResearchSliceAssumptionRecord).research_slice_assumption_id === 'string'
      && typeof (item as TopicSelectionResearchSliceAssumptionRecord).title_card_id === 'string'
      && typeof (item as TopicSelectionResearchSliceAssumptionRecord).assumption_type === 'string'
      && typeof (item as TopicSelectionResearchSliceAssumptionRecord).statement === 'string'
      && Array.isArray((item as TopicSelectionResearchSliceAssumptionRecord).evidence_refs)
      && typeof (item as TopicSelectionResearchSliceAssumptionRecord).risk_level === 'string'
      && typeof (item as TopicSelectionResearchSliceAssumptionRecord).status === 'string',
    );
  }

  private explicitClaimCeilingViolations(claimCeiling: string, claims: string[]): string[] {
    const claimText = claims.map((claim) => this.normalize(claim)).join(' ');
    const ceilingText = this.normalize(claimCeiling);
    const blockedPhrases = [
      ...ceilingText.matchAll(/\b(?:not|cannot|can't|do not|should not)\s+([^.;,]+)/g),
    ]
      .map((match) => match[1]?.trim() ?? '')
      .filter((phrase) => phrase.length >= 4);
    return blockedPhrases.filter((phrase) => claimText.includes(phrase));
  }

  private aligns(left: string, right: string): boolean {
    const normalizedLeft = this.normalize(left);
    const normalizedRight = this.normalize(right);
    return normalizedLeft === normalizedRight
      || normalizedLeft.includes(normalizedRight)
      || normalizedRight.includes(normalizedLeft);
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async requireFormationRun(runId: string): Promise<TopicSelectionFormTopicQuestionRunRecord> {
    const run = await this.repository.findFormationRunById(runId);
    if (!run) {
      throw new AppError(404, 'NOT_FOUND', `FormTopicQuestionRun ${runId} not found.`);
    }
    return run;
  }

  private async requireCandidateSet(candidateSetId: string): Promise<TopicSelectionTopicQuestionCandidateSetRecord> {
    const candidateSet = await this.repository.findCandidateSetById(candidateSetId);
    if (!candidateSet) {
      throw new AppError(404, 'NOT_FOUND', `TopicQuestionCandidateSet ${candidateSetId} not found.`);
    }
    return candidateSet;
  }

  private async requireQuestionFrame(frameId: string): Promise<TopicSelectionQuestionFrameRecord> {
    const frame = await this.repository.findQuestionFrameById(frameId);
    if (!frame) {
      throw new AppError(404, 'NOT_FOUND', `QuestionFrame ${frameId} not found.`);
    }
    return frame;
  }

  private warning(code: string, message: string, refs?: TopicSelectionFunctionalRef[]) {
    return { code, message, severity: 'warning' as const, refs };
  }

  private blocker(code: string, message: string, refs?: TopicSelectionFunctionalRef[]) {
    return { code, message, severity: 'blocking' as const, refs };
  }

  private artifactRefs(
    artifacts: Array<{ artifact_ref_id: string }>,
    titleCardId: string,
  ): TopicSelectionFunctionalRef[] {
    return artifacts.map((artifact) =>
      this.ref('artifact_ref', artifact.artifact_ref_id, titleCardId),
    );
  }

  private ref(
    refType: string,
    refId: string,
    titleCardId?: string | null,
    versionId?: string | null,
  ): TopicSelectionFunctionalRef {
    return {
      ref_type: refType,
      ref_id: refId,
      title_card_id: titleCardId ?? null,
      version_id: versionId ?? null,
    };
  }

  private requireTitleCardId(ref: TopicSelectionFunctionalRef): string {
    if (!ref.title_card_id) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Upstream ref is missing title_card_id.');
    }
    return ref.title_card_id;
  }

  private uniqueRefs(refs: Array<TopicSelectionFunctionalRef | null | undefined>): TopicSelectionFunctionalRef[] {
    const seen = new Set<string>();
    const result: TopicSelectionFunctionalRef[] = [];
    for (const ref of refs) {
      if (!ref) {
        continue;
      }
      const key = this.refKey(ref);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(ref);
    }
    return result;
  }

  private refKey(ref: TopicSelectionFunctionalRef): string {
    return [
      ref.ref_type,
      ref.ref_id,
      ref.version_id ?? '',
      ref.title_card_id ?? '',
    ].join(':');
  }

  private sameRefSet(left: TopicSelectionFunctionalRef[], right: TopicSelectionFunctionalRef[]): boolean {
    const leftKeys = left.map((ref) => this.refKey(ref)).sort();
    const rightKeys = right.map((ref) => this.refKey(ref)).sort();
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index]);
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.trim().length > 0))];
  }

  private versionFromId(id: string): string {
    return `v_${id.split('_').at(-1) ?? '1'}`;
  }

  private telemetryRecord(telemetry: LlmCallTelemetry | null | undefined): Record<string, unknown> {
    return telemetry ? telemetry as unknown as Record<string, unknown> : {};
  }

  private errorTelemetry(error: unknown): LlmCallTelemetry | null {
    return error instanceof LlmGatewayError ? error.telemetry ?? null : null;
  }

  private errorCode(error: unknown): string {
    if (error instanceof AppError) {
      return error.errorCode;
    }
    if (error instanceof LlmGatewayError) {
      return error.code;
    }
    return 'TOPIC_QUESTION_FORMATION_FAILED';
  }

  private errorPayload(error: unknown): Record<string, unknown> {
    return {
      code: this.errorCode(error),
      message: this.errorMessage(error),
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'TopicQuestion formation failed.';
  }

  private runError(error: unknown, runId: string): AppError {
    if (error instanceof AppError) {
      return new AppError(error.statusCode, error.errorCode, error.message, {
        ...(error.details ?? {}),
        form_topic_question_run_id: runId,
      });
    }
    return new AppError(500, 'INTERNAL_ERROR', this.errorMessage(error), {
      form_topic_question_run_id: runId,
    });
  }
}
