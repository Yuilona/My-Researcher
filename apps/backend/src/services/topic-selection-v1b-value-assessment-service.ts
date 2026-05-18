import crypto from 'node:crypto';

import type {
  TopicSelectionActorType,
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  TopicSelectionV1bTopicQuestionFormationInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-research-slice-contracts';
import type {
  TopicSelectionV1bValueAssessmentInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-topic-question-contracts';
import {
  TOPIC_SELECTION_VALUE_DIMENSIONS,
  TOPIC_SELECTION_VALUE_DISPOSITIONS,
  TOPIC_SELECTION_VALUE_GATE_KEYS,
  topicSelectionAssessTopicValueLlmOutputSchema,
  type TopicSelectionAssessTopicValueLlmOutput,
  type TopicSelectionAssessTopicValueRunRecord,
  type TopicSelectionTopicValueAssessmentInputSnapshotRecord,
  type TopicSelectionTopicValueAssessmentRecord,
  type TopicSelectionTopicValueEvidenceRefRecord,
  type TopicSelectionValueDisposition,
  type TopicSelectionValueDispositionDecisionRecord,
  type TopicSelectionValueReasoningMemoRecord,
  type TopicSelectionV1bPackageDraftInput,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1b-value-assessment-contracts';

import { AppError } from '../errors/app-error.js';
import type {
  TopicSelectionV1bValueAssessmentRepository,
} from '../repositories/topic-selection-v1b-value-assessment.repository.js';
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

const WORKFLOW_PROFILE_KEY = 'topic-selection-topic-value-assessment';
const PROMPT_TEMPLATE_ID = 'topic-selection-topic-value-assessment';
const PROMPT_TEMPLATE_VERSION = '1';
const DEFAULT_MODEL: LlmModelRef = {
  providerId: 'openai',
  modelId: 'gpt-5.4-mini',
  profileId: WORKFLOW_PROFILE_KEY,
};

type IdFactory = (prefix: string) => string;

export type TopicSelectionV1bValueAssessmentInputProvider = {
  buildValueAssessmentInput(input: {
    topic_question_contract_id: string;
  }): Promise<TopicSelectionV1bValueAssessmentInput>;
};

export type TopicSelectionV1bValueAssessmentResearchSliceProvider = {
  buildTopicQuestionFormationInput(input: {
    research_slice_id: string;
  }): Promise<TopicSelectionV1bTopicQuestionFormationInput>;
};

export type TopicSelectionV1bValueAssessmentLlmGateway = Pick<
  BackendLlmGateway,
  'createStructuredOutput'
>;

export type AssessTopicValueInput = {
  topic_question_contract_id: string;
  workspace_id?: string | null;
  triggered_by?: TopicSelectionActorType;
  workflow_profile_version?: string | null;
  prompt_template_version?: string | null;
  policy_version_id?: string | null;
  model?: LlmModelRef;
};

export type AssessTopicValueResult = {
  assess_topic_value_run: TopicSelectionAssessTopicValueRunRecord;
  topic_value_input_snapshot: TopicSelectionTopicValueAssessmentInputSnapshotRecord;
  topic_value_assessment: TopicSelectionTopicValueAssessmentRecord;
  value_reasoning_memo: TopicSelectionValueReasoningMemoRecord;
  evidence_refs: TopicSelectionTopicValueEvidenceRefRecord[];
};

export type DecideValueDispositionInput = {
  topic_value_assessment_id: string;
  decision: TopicSelectionValueDisposition;
  decided_by?: TopicSelectionActorType;
  decision_rationale: string;
  required_actions?: string[];
  loopback_target_ref?: TopicSelectionFunctionalRef | null;
  blocking_contexts?: Record<string, unknown>[];
  accepted_risk_refs?: TopicSelectionFunctionalRef[];
  blocker_refs?: TopicSelectionFunctionalRef[];
  policy_version_id?: string | null;
};

export type TopicSelectionV1bValueAssessmentServiceOptions = {
  repository: TopicSelectionV1bValueAssessmentRepository;
  topicQuestionService: TopicSelectionV1bValueAssessmentInputProvider;
  researchSliceService: TopicSelectionV1bValueAssessmentResearchSliceProvider;
  controlPlaneService: TopicSelectionControlPlaneService;
  llmGateway?: TopicSelectionV1bValueAssessmentLlmGateway;
  idFactory?: IdFactory;
  now?: () => string;
};

type ValueAssessmentContext = {
  valueInput: TopicSelectionV1bValueAssessmentInput;
  formationInput: TopicSelectionV1bTopicQuestionFormationInput;
  titleCardId: string;
  workspaceId: string | null;
  inheritedAcceptedRiskRefs: TopicSelectionFunctionalRef[];
  knownRefKeys: Set<string>;
  knownEvidenceRefKeys: Set<string>;
  knownNeedRefKeys: Set<string>;
};

export class TopicSelectionV1bValueAssessmentService {
  private readonly idFactory: IdFactory;
  private readonly now: () => string;
  private readonly repository: TopicSelectionV1bValueAssessmentRepository;
  private readonly topicQuestionService: TopicSelectionV1bValueAssessmentInputProvider;
  private readonly researchSliceService: TopicSelectionV1bValueAssessmentResearchSliceProvider;
  private readonly controlPlane: TopicSelectionControlPlaneService;
  private readonly llmGateway: TopicSelectionV1bValueAssessmentLlmGateway;

  constructor(options: TopicSelectionV1bValueAssessmentServiceOptions) {
    this.repository = options.repository;
    this.topicQuestionService = options.topicQuestionService;
    this.researchSliceService = options.researchSliceService;
    this.controlPlane = options.controlPlaneService;
    this.llmGateway = options.llmGateway ?? new BackendLlmGateway();
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}_${crypto.randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async assessTopicValue(input: AssessTopicValueInput): Promise<AssessTopicValueResult> {
    const valueInput = await this.topicQuestionService.buildValueAssessmentInput({
      topic_question_contract_id: input.topic_question_contract_id,
    });
    const formationInput = await this.researchSliceService.buildTopicQuestionFormationInput({
      research_slice_id: valueInput.research_slice_ref.ref_id,
    });
    this.validateHandoff(valueInput, formationInput, input.topic_question_contract_id);
    if (
      input.workspace_id
      && valueInput.question_contract.workspace_id
      && input.workspace_id !== valueInput.question_contract.workspace_id
    ) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Requested workspace drifts from TopicQuestionContract workspace.');
    }

    const titleCardId = this.requireTitleCardId(valueInput.topic_question_contract_ref);
    const workspaceId = input.workspace_id ?? valueInput.question_contract.workspace_id ?? null;
    const triggeredBy = input.triggered_by ?? 'system';
    const model = input.model ?? DEFAULT_MODEL;
    const promptVersion = input.prompt_template_version ?? PROMPT_TEMPLATE_VERSION;
    const runId = this.idFactory('assess_topic_value_run');
    const inputSnapshotId = this.idFactory('topic_value_input_snapshot');
    const assessmentId = this.idFactory('topic_value_assessment');
    const researchRecordId = this.idFactory('topic_research_record');
    const memoId = this.idFactory('value_reasoning_memo');
    const runRef = this.ref('assess_topic_value_run', runId, titleCardId);
    const assessmentRef = this.ref('topic_value_assessment', assessmentId, titleCardId);
    const sourceRefs = this.compileAssessmentSourceRefs(valueInput, formationInput);
    const controlPlaneInputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      target_ref: runRef,
      source_refs: sourceRefs,
      payload: {
        topic_value_assessment_input_json: valueInput,
        research_slice_snapshot_json: formationInput,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: triggeredBy,
    });

    let llmOutput: TopicSelectionAssessTopicValueLlmOutput;
    let telemetry: LlmCallTelemetry | null = null;
    try {
      const response =
        await this.llmGateway.createStructuredOutput<TopicSelectionAssessTopicValueLlmOutput>({
          executionContext: {
            feature: 'topic_selection',
            operation: 'topic_value_assessment',
            traceId: runId,
            metadata: {
              topic_question_contract_id: input.topic_question_contract_id,
              topic_question_id: valueInput.topic_question_ref.ref_id,
              research_slice_id: valueInput.research_slice_ref.ref_id,
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
                'Assess v1b topic value from the active TopicQuestionContract and selected ResearchSlice handoff.',
                'Do not prove a new unmet need, create new evidence authority, rewrite the question, expand the slice, create packages, create promotions, or create PaperProject records.',
                'Cite only inherited refs and keep advance_to_package separate from promotion readiness.',
                'When citing evidence, use only the nested evidence_ref functional refs from topic_value_assessment_input_json.evidence_refs[*].evidence_ref or research_slice_snapshot_json.evidence_refs[*].evidence_ref.',
                'Treat allowed_functional_refs_json as the complete copy list for refs; if a ref_id is not listed there, do not output it.',
                'Do not cite wrapper ids such as topic_question_evidence_ref_id or research_slice_evidence_ref_id as functional refs, and do not output ref_type topic_question_evidence_ref or research_slice_evidence_ref.',
                'Never invent placeholder refs or synthetic evidence_unit ids; every ref_id in cited_refs, blocker_refs, gate refs, and dimension refs must match one supplied upstream ref_id exactly.',
                'When citing the selected research slice, use the inherited research_slice_ref exactly; do not output ref_type research_slice_ref.',
                'accepted_risk_refs must contain only inherited ref_type accepted_risk authority refs; if no accepted_risk refs are provided, return an empty array and keep ordinary evidence in cited_refs or risk_notes.',
                'Assess package-drafting readiness, not promotion readiness: when the question is answerable, support/challenge/baseline/context evidence is present, and residual risks are explicit, prefer ready_with_accepted_risk plus advance_to_package over refine_slice.',
                `Return exactly ${TOPIC_SELECTION_VALUE_GATE_KEYS.length} hard_gates, one for each gate_key in this exact order: ${TOPIC_SELECTION_VALUE_GATE_KEYS.join(', ')}. Do not collapse multiple gates into one result.`,
                `Return exactly ${TOPIC_SELECTION_VALUE_DIMENSIONS.length} dimension_scores, one for each dimension_key in this exact order: ${TOPIC_SELECTION_VALUE_DIMENSIONS.join(', ')}.`,
                'Use readiness_status ready or ready_with_accepted_risk only when recommended_disposition is advance_to_package, total_score is at least 70, and all dimension scores are at least 60.',
                'If readiness_status is needs_refinement, recheck_required, blocked, parked, or dropped, do not recommend advance_to_package.',
              ].join(' '),
            },
            {
              role: 'user',
              content: JSON.stringify({
                topic_value_assessment_input_json: valueInput,
                research_slice_snapshot_json: formationInput,
                allowed_functional_refs_json: this.allowedFunctionalRefsForPrompt(valueInput, formationInput),
              }, null, 2),
            },
          ],
          schemaName: 'topic_selection_topic_value_assessment',
          schema: topicSelectionAssessTopicValueLlmOutputSchema as unknown as Record<string, unknown>,
        });
      llmOutput = response.parsed;
      telemetry = response.telemetry;
    } catch (error) {
      const failed = await this.persistFailedAssessmentRun({
        input,
        valueInput,
        formationInput,
        runId,
        titleCardId,
        workspaceId,
        triggeredBy,
        model,
        promptVersion,
        controlPlaneInputSnapshotId: controlPlaneInputSnapshot.input_snapshot_id,
        error,
      });
      throw this.runError(error, failed.assess_topic_value_run_id);
    }

    const context = this.buildContext(valueInput, formationInput, titleCardId, workspaceId);
    llmOutput = this.normalizeEvidenceWrapperRefs(llmOutput, context);
    llmOutput = this.normalizeAcceptedRiskRefs(llmOutput, context);
    llmOutput = this.dropUnknownEvidenceRefs(llmOutput, context);
    try {
      this.validateLlmOutput(llmOutput, context);
    } catch (error) {
      const failed = await this.persistFailedAssessmentRun({
        input,
        valueInput,
        formationInput,
        runId,
        titleCardId,
        workspaceId,
        triggeredBy,
        model,
        promptVersion,
        controlPlaneInputSnapshotId: controlPlaneInputSnapshot.input_snapshot_id,
        error,
        telemetry,
        artifacts: [
          {
            artifact_kind: 'structured_output',
            payload: llmOutput as unknown as Record<string, unknown>,
          },
        ],
      });
      throw this.runError(error, failed.assess_topic_value_run_id);
    }

    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      workflow_key: 'topic-selection.v1b-assess-topic-value',
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.workflow_profile_version ?? null,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      status: 'succeeded',
      provider_id: model.providerId,
      model_id: model.modelId,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: promptVersion,
      telemetry: this.telemetryRecord(telemetry),
      output_summary: {
        readiness_status: llmOutput.readiness_status,
        recommended_disposition: llmOutput.recommended_disposition,
        total_score: llmOutput.total_score,
        requires_critic_review: llmOutput.reasoning_memo.requires_critic_review,
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
      gate_key: 'topic-selection.v1b-value-assessment-domain-validation',
      target_ref: assessmentRef,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      verdict: llmOutput.readiness_status === 'ready'
        ? 'pass'
        : llmOutput.readiness_status === 'ready_with_accepted_risk'
          ? 'pass_with_risk'
          : 'block',
      blockers: this.nonOverridableBlockingGates(llmOutput).map((gateResult) =>
        this.blocker(gateResult.gate_key, gateResult.rationale, gateResult.refs),
      ),
      accepted_risk_refs: llmOutput.accepted_risk_refs,
      created_by: triggeredBy,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      transition_key: 'v1b-topic-question-contract-to-value-assessment',
      source_ref: valueInput.topic_question_contract_ref,
      target_ref: assessmentRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: triggeredBy },
      accepted_risk_refs: llmOutput.accepted_risk_refs,
      created_authority_refs: [
        runRef,
        assessmentRef,
        this.ref('value_reasoning_memo', memoId, titleCardId),
      ],
    });
    const traceSnapshot = await this.controlPlane.buildTraceSnapshot({
      workspace_id: workspaceId,
      title_card_id: titleCardId,
      target_ref: assessmentRef,
      object_refs: this.uniqueRefs([
        valueInput.topic_question_ref,
        valueInput.topic_question_contract_ref,
        valueInput.answerability_plan_ref,
        valueInput.research_slice_ref,
        assessmentRef,
        this.ref('value_reasoning_memo', memoId, titleCardId),
        ...llmOutput.accepted_risk_refs,
        ...llmOutput.blocker_refs,
      ]),
      artifact_refs: this.artifactRefs(workflow.artifact_refs, titleCardId),
      transition_attempt_refs: [
        this.ref('chain_transition_attempt', transition.chain_transition_attempt_id, titleCardId),
      ],
      payload: {
        readiness_status: llmOutput.readiness_status,
        recommended_disposition: llmOutput.recommended_disposition,
        total_score: llmOutput.total_score,
      },
      created_by: triggeredBy,
    });

    const now = this.now();
    const topicValueInputSnapshot = this.buildInputSnapshotRecord({
      inputSnapshotId,
      valueInput,
      formationInput,
      titleCardId,
      workspaceId,
      controlPlaneInputSnapshotId: controlPlaneInputSnapshot.input_snapshot_id,
      now,
    });
    const memo = this.buildReasoningMemoRecord({
      memoId,
      assessmentId,
      valueInput,
      llmOutput,
      titleCardId,
      workspaceId,
      workflowRunId: workflow.workflow_run.workflow_run_id,
      artifactRefs: [
        ...this.artifactRefs(workflow.artifact_refs, titleCardId),
        this.ref('trace_snapshot', traceSnapshot.trace_snapshot_id, titleCardId),
      ],
      now,
    });
    const assessment = this.buildAssessmentRecord({
      assessmentId,
      researchRecordId,
      runId,
      inputSnapshotId,
      memoId,
      valueInput,
      formationInput,
      llmOutput,
      titleCardId,
      workspaceId,
      workflowRunId: workflow.workflow_run.workflow_run_id,
      gateResultId: gate.readiness_gate_result_id,
      transitionAttemptId: transition.chain_transition_attempt_id,
      traceSnapshotId: traceSnapshot.trace_snapshot_id,
      artifactRefs: [
        ...this.artifactRefs(workflow.artifact_refs, titleCardId),
        this.ref('trace_snapshot', traceSnapshot.trace_snapshot_id, titleCardId),
      ],
      now,
    });
    const run = this.buildAssessmentRunRecord({
      runId,
      assessmentId,
      memoId,
      valueInput,
      formationInput,
      titleCardId,
      workspaceId,
      triggeredBy,
      model,
      promptVersion,
      status: 'succeeded',
      workflowProfileVersion: input.workflow_profile_version ?? null,
      controlPlaneInputSnapshotId: controlPlaneInputSnapshot.input_snapshot_id,
      topicValueInputSnapshotId: inputSnapshotId,
      workflowRunId: workflow.workflow_run.workflow_run_id,
      gateResultId: gate.readiness_gate_result_id,
      transitionAttemptId: transition.chain_transition_attempt_id,
      artifactRefs: this.artifactRefs(workflow.artifact_refs, titleCardId),
      qualityFlags: [
        `transition:${transition.result}`,
        ...(llmOutput.reasoning_memo.requires_critic_review ? ['critic_review_triggered'] : []),
      ],
      failureReason: null,
      now,
    });
    const evidenceRefs = this.buildValueEvidenceRefs({
      assessmentId,
      valueInput,
      titleCardId,
      workspaceId,
      now,
    });
    return this.repository.createAssessmentWithMemo({
      assess_topic_value_run: run,
      topic_value_input_snapshot: topicValueInputSnapshot,
      topic_value_assessment: assessment,
      value_reasoning_memo: memo,
      evidence_refs: evidenceRefs,
    });
  }

  async decideValueDisposition(
    input: DecideValueDispositionInput,
  ): Promise<TopicSelectionValueDispositionDecisionRecord> {
    if (!TOPIC_SELECTION_VALUE_DISPOSITIONS.includes(input.decision)) {
      throw new AppError(400, 'INVALID_PAYLOAD', `Unsupported value disposition ${input.decision}.`);
    }
    const assessment = await this.repository.findAssessmentById(input.topic_value_assessment_id);
    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', `TopicValueAssessment ${input.topic_value_assessment_id} not found.`);
    }
    if (!assessment.topic_question_contract_id || !assessment.topic_value_input_snapshot_id) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicValueAssessment is not a T-060 authority record.');
    }
    const [memo, snapshot, evidenceRefs] = await Promise.all([
      this.repository.findReasoningMemoById(assessment.value_reasoning_memo_id),
      this.repository.findInputSnapshotById(assessment.topic_value_input_snapshot_id),
      this.repository.listEvidenceRefsByAssessmentId(assessment.topic_value_assessment_id),
    ]);
    if (!memo) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicValueAssessment is missing its ValueReasoningMemo.');
    }
    if (!snapshot) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicValueAssessment is missing its T-060 input snapshot.');
    }
    if (assessment.freshness_status !== 'current') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Only current TopicValueAssessment records can receive disposition decisions.');
    }
    const decidedBy = input.decided_by ?? 'system';
    const decisionId = this.idFactory('value_disposition_decision');
    const decisionRef = this.ref('value_disposition_decision', decisionId, assessment.title_card_id);
    const requiredActions = input.required_actions ?? [];
    const loopbackTargetRef = input.loopback_target_ref ?? this.defaultLoopbackTargetRef(input.decision, snapshot);
    const acceptedRiskRefs = input.accepted_risk_refs ?? assessment.accepted_risk_refs;
    const blockerRefs = input.blocker_refs ?? assessment.blocker_refs;

    this.validateDispositionPayload({
      input,
      assessment,
      snapshot,
      requiredActions,
      loopbackTargetRef,
      acceptedRiskRefs,
      blockerRefs,
    });

    if (input.decision === 'advance_to_package') {
      this.validateAdvanceToPackage(assessment, acceptedRiskRefs);
    }

    const sourceRefs = this.uniqueRefs([
      this.ref('topic_value_assessment', assessment.topic_value_assessment_id, assessment.title_card_id),
      this.ref('value_reasoning_memo', memo.value_reasoning_memo_id, assessment.title_card_id),
      snapshot.topic_question_contract_ref,
      snapshot.research_slice_ref,
    ]);
    const controlPlaneInputSnapshot = await this.controlPlane.compileInputSnapshot({
      workspace_id: assessment.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: assessment.title_card_id,
      target_ref: decisionRef,
      source_refs: sourceRefs,
      payload: {
        topic_value_assessment: assessment,
        value_reasoning_memo: memo,
        decision: input.decision,
        decision_rationale: input.decision_rationale,
        required_actions: requiredActions,
        loopback_target_ref: loopbackTargetRef,
      },
      policy_version: input.policy_version_id ?? null,
      created_by: decidedBy,
    });
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: assessment.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: assessment.title_card_id,
      workflow_key: 'topic-selection.v1b-decide-value-disposition',
      workflow_profile_key: 'deterministic-topic-value-disposition-policy',
      workflow_profile_version: input.policy_version_id ?? null,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      status: 'succeeded',
      output_summary: {
        decision: input.decision,
        package_draft_input_created: input.decision === 'advance_to_package',
        output_topic_package_id: null,
      },
      artifacts: [
        {
          artifact_kind: 'structured_output',
          payload: {
            decision: input.decision,
            package_draft_input_created: input.decision === 'advance_to_package',
          },
        },
      ],
      created_by: decidedBy,
    });
    const gate = await this.controlPlane.runDeterministicGate({
      workspace_id: assessment.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: assessment.title_card_id,
      gate_key: 'topic-selection.v1b-value-disposition-domain-validation',
      target_ref: decisionRef,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.policy_version_id ?? null,
      verdict: input.decision === 'advance_to_package' ? 'pass' : 'pass_with_risk',
      accepted_risk_refs: acceptedRiskRefs,
      created_by: decidedBy,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: assessment.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: assessment.title_card_id,
      transition_key: input.decision === 'advance_to_package'
        ? 'v1b-value-assessment-to-package-draft-input'
        : 'v1b-value-assessment-to-loopback-disposition',
      source_ref: this.ref('topic_value_assessment', assessment.topic_value_assessment_id, assessment.title_card_id),
      target_ref: decisionRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      policy_version_id: input.policy_version_id ?? null,
      actor: { actor_type: decidedBy },
      accepted_risk_refs: acceptedRiskRefs,
      created_authority_refs: [decisionRef],
    });

    const decision: TopicSelectionValueDispositionDecisionRecord = {
      value_disposition_decision_id: decisionId,
      workspace_id: assessment.workspace_id ?? snapshot.workspace_id ?? null,
      title_card_id: assessment.title_card_id,
      topic_value_assessment_id: assessment.topic_value_assessment_id,
      topic_question_contract_id: assessment.topic_question_contract_id,
      value_reasoning_memo_id: memo.value_reasoning_memo_id,
      decision: input.decision,
      decided_by: decidedBy,
      decision_rationale: input.decision_rationale,
      required_actions: requiredActions,
      loopback_target_ref: loopbackTargetRef,
      blocking_contexts: input.blocking_contexts ?? [],
      accepted_risk_refs: acceptedRiskRefs,
      blocker_refs: blockerRefs,
      package_draft_input: null,
      output_topic_package_id: null,
      status: 'active',
      is_current: true,
      input_snapshot_id: controlPlaneInputSnapshot.input_snapshot_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      gate_result_id: gate.readiness_gate_result_id,
      transition_attempt_id: transition.chain_transition_attempt_id,
      artifact_refs: this.artifactRefs(workflow.artifact_refs, assessment.title_card_id),
      created_at: this.now(),
    };
    decision.package_draft_input = decision.decision === 'advance_to_package'
      ? this.buildPackageDraftInputPayload({
        assessment,
        memo,
        snapshot,
        evidenceRefs,
        decision,
      })
      : null;
    if (decision.decision !== 'advance_to_package' && decision.package_draft_input !== null) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Non-advance value dispositions cannot create package handoff.');
    }
    if (decision.decision !== 'advance_to_package' && decision.output_topic_package_id !== null) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'T-060 must not create or reserve TopicPackage ids.');
    }
    return this.repository.createDispositionDecision({
      decision,
      topic_value_assessment_patch: {
        active_disposition_decision_id: decision.value_disposition_decision_id,
        updated_at: this.now(),
      },
    });
  }

  async buildPackageDraftInput(input: {
    value_disposition_decision_id: string;
  }): Promise<TopicSelectionV1bPackageDraftInput> {
    const decision = await this.repository.findDispositionDecisionById(input.value_disposition_decision_id);
    if (!decision) {
      throw new AppError(
        404,
        'NOT_FOUND',
        `ValueDispositionDecision ${input.value_disposition_decision_id} not found.`,
      );
    }
    if (decision.status !== 'active' || !decision.is_current) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        'Only active/current ValueDispositionDecision records can publish T-058 input.',
      );
    }
    if (decision.decision !== 'advance_to_package' || !decision.package_draft_input) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        'Only advance_to_package ValueDispositionDecision records carry package draft input.',
      );
    }
    if (decision.output_topic_package_id !== null && decision.output_topic_package_id !== undefined) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'T-060 handoff cannot reference an existing TopicPackage.');
    }
    const assessment = await this.repository.findAssessmentById(decision.topic_value_assessment_id);
    if (!assessment || assessment.active_disposition_decision_id !== decision.value_disposition_decision_id) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ValueDispositionDecision is not active on its assessment.');
    }
    return decision.package_draft_input;
  }

  private validateHandoff(
    valueInput: TopicSelectionV1bValueAssessmentInput,
    formationInput: TopicSelectionV1bTopicQuestionFormationInput,
    requestedContractId: string,
  ): void {
    if (valueInput.topic_question_contract_ref.ref_id !== requestedContractId) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'T-059 value handoff does not match requested contract.');
    }
    if (valueInput.question_contract.topic_question_contract_id !== requestedContractId) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'TopicQuestionContract payload drifts from handoff ref.');
    }
    if (valueInput.question_contract.status !== 'active') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Only active TopicQuestionContract records can be assessed.');
    }
    if (valueInput.research_slice_ref.ref_id !== formationInput.research_slice_ref.ref_id) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'T-057 ResearchSlice snapshot does not match T-059 handoff.');
    }
    if (
      valueInput.research_slice_ref.version_id
      && formationInput.research_slice_ref.version_id
      && valueInput.research_slice_ref.version_id !== formationInput.research_slice_ref.version_id
    ) {
      throw new AppError(409, 'VERSION_CONFLICT', 'ResearchSlice version drifted before value assessment.');
    }
  }

  private validateLlmOutput(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): void {
    if (!output) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Value assessment LLM returned no output.');
    }
    this.requireUniqueEnumCoverage(
      'value dimensions',
      TOPIC_SELECTION_VALUE_DIMENSIONS,
      output.dimension_scores.map((score) => score.dimension_key),
    );
    this.requireUniqueEnumCoverage(
      'value gates',
      TOPIC_SELECTION_VALUE_GATE_KEYS,
      output.hard_gates.map((gate) => gate.gate_key),
    );
    this.validateMemo(output);
    this.validateOutputRefs(output, context);
    this.validateClaimBoundaries(output, context);
    this.validateAnswerabilityConsistency(output, context);
    this.validateReadinessDispositionConsistency(output);
  }

  private normalizeAcceptedRiskRefs(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): TopicSelectionAssessTopicValueLlmOutput {
    if (output.readiness_status !== 'ready_with_accepted_risk' || output.accepted_risk_refs.length > 0) {
      return output;
    }
    if (context.inheritedAcceptedRiskRefs.length === 0) {
      return {
        ...output,
        readiness_status: 'ready',
      };
    }
    return {
      ...output,
      accepted_risk_refs: context.inheritedAcceptedRiskRefs,
    };
  }

  private allowedFunctionalRefsForPrompt(
    valueInput: TopicSelectionV1bValueAssessmentInput,
    formationInput: TopicSelectionV1bTopicQuestionFormationInput,
  ): Record<string, TopicSelectionFunctionalRef[]> {
    return {
      evidence_refs: this.uniqueRefs([
        ...valueInput.evidence_refs.map((item) => item.evidence_ref),
        ...formationInput.evidence_refs.map((item) => item.evidence_ref),
      ]),
      accepted_risk_refs: this.uniqueRefs([
        ...valueInput.accepted_risk_refs,
        ...formationInput.accepted_risk_refs,
      ]),
      topic_question_refs: this.uniqueRefs([
        valueInput.topic_question_ref,
        valueInput.topic_question_contract_ref,
        valueInput.answerability_plan_ref,
      ]),
      research_slice_refs: this.uniqueRefs([
        valueInput.research_slice_ref,
        formationInput.research_slice_ref,
      ]),
    };
  }

  private normalizeEvidenceWrapperRefs(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): TopicSelectionAssessTopicValueLlmOutput {
    const aliases = this.evidenceWrapperAliases(context);
    const normalizeRef = (ref: TopicSelectionFunctionalRef): TopicSelectionFunctionalRef => {
      const evidenceAlias = aliases.get(this.refKey(ref));
      if (evidenceAlias) {
        return evidenceAlias;
      }
      if (this.isResearchSliceWrapperAlias(ref, context)) {
        return context.valueInput.research_slice_ref;
      }
      return ref;
    };
    const normalizeRefs = (refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] =>
      refs.map((ref) => normalizeRef(ref));

    return {
      ...output,
      hard_gates: output.hard_gates.map((gate) => ({
        ...gate,
        refs: normalizeRefs(gate.refs),
      })),
      dimension_scores: output.dimension_scores.map((score) => ({
        ...score,
        evidence_refs: normalizeRefs(score.evidence_refs),
      })),
      accepted_risk_refs: normalizeRefs(output.accepted_risk_refs).filter((ref) => ref.ref_type === 'accepted_risk'),
      blocker_refs: normalizeRefs(output.blocker_refs),
      reasoning_memo: {
        ...output.reasoning_memo,
        cited_refs: normalizeRefs(output.reasoning_memo.cited_refs),
      },
    };
  }

  private dropUnknownEvidenceRefs(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): TopicSelectionAssessTopicValueLlmOutput {
    const keepKnownRef = (ref: TopicSelectionFunctionalRef): boolean =>
      !this.isEvidenceRef(ref) || context.knownEvidenceRefKeys.has(this.refKey(ref));
    const filterRefs = (refs: TopicSelectionFunctionalRef[]): TopicSelectionFunctionalRef[] =>
      refs.filter((ref) => keepKnownRef(ref));

    return {
      ...output,
      hard_gates: output.hard_gates.map((gate) => ({
        ...gate,
        refs: filterRefs(gate.refs),
      })),
      dimension_scores: output.dimension_scores.map((score) => ({
        ...score,
        evidence_refs: filterRefs(score.evidence_refs),
      })),
      blocker_refs: filterRefs(output.blocker_refs),
      reasoning_memo: {
        ...output.reasoning_memo,
        cited_refs: filterRefs(output.reasoning_memo.cited_refs),
      },
    };
  }

  private isResearchSliceWrapperAlias(
    ref: TopicSelectionFunctionalRef,
    context: ValueAssessmentContext,
  ): boolean {
    return ref.ref_type === 'research_slice_ref'
      && ref.ref_id === context.valueInput.research_slice_ref.ref_id
      && (!ref.title_card_id || ref.title_card_id === context.titleCardId);
  }

  private evidenceWrapperAliases(context: ValueAssessmentContext): Map<string, TopicSelectionFunctionalRef> {
    const aliases = new Map<string, TopicSelectionFunctionalRef>();
    for (const evidenceRef of context.valueInput.evidence_refs) {
      aliases.set(
        this.refKey(this.ref('topic_question_evidence_ref', evidenceRef.topic_question_evidence_ref_id, context.titleCardId)),
        evidenceRef.evidence_ref,
      );
    }
    for (const evidenceRef of context.formationInput.evidence_refs) {
      aliases.set(
        this.refKey(this.ref('research_slice_evidence_ref', evidenceRef.research_slice_evidence_ref_id, context.titleCardId)),
        evidenceRef.evidence_ref,
      );
    }
    return aliases;
  }

  private requireUniqueEnumCoverage(
    label: string,
    expected: readonly string[],
    actual: string[],
  ): void {
    const missing = expected.filter((item) => !actual.includes(item));
    const duplicates = actual.filter((item, index) => actual.indexOf(item) !== index);
    if (missing.length > 0 || duplicates.length > 0) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        `Value assessment ${label} coverage invalid.`,
        { missing, duplicates },
      );
    }
  }

  private validateMemo(output: TopicSelectionAssessTopicValueLlmOutput): void {
    const memo = output.reasoning_memo;
    const requiredStrings = [
      memo.value_thesis,
      memo.significance,
      memo.originality,
      memo.claim_leverage,
      memo.effort_to_value,
      memo.strategic_fit,
      memo.negative_memory_check,
      memo.evidence_backed_rationale,
      memo.uncertainty,
      memo.disposition_bridge,
    ];
    if (requiredStrings.some((value) => !value || value.trim().length === 0)) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ValueReasoningMemo is missing required narrative sections.');
    }
    if (memo.top_objections.length === 0 || memo.reviewer_risks.length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ValueReasoningMemo must include objections and reviewer risks.');
    }
    if (memo.recommendation !== output.recommended_disposition) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Reasoning memo recommendation drifts from assessment disposition.');
    }
  }

  private validateOutputRefs(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): void {
    const citedRefs = this.uniqueRefs([
      ...output.hard_gates.flatMap((gate) => gate.refs),
      ...output.dimension_scores.flatMap((score) => score.evidence_refs),
      ...output.accepted_risk_refs,
      ...output.blocker_refs,
      ...output.reasoning_memo.cited_refs,
    ]);
    const newNeedRefs = citedRefs.filter((ref) =>
      ref.ref_type === 'validated_need' && !context.knownNeedRefKeys.has(this.refKey(ref)),
    );
    if (newNeedRefs.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'T-060 cannot introduce new unmet-need refs.', {
        new_need_refs: newNeedRefs,
      });
    }
    const unknownEvidenceRefs = citedRefs.filter((ref) =>
      this.isEvidenceRef(ref) && !context.knownEvidenceRefKeys.has(this.refKey(ref)),
    );
    if (unknownEvidenceRefs.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Value assessment cites unknown evidence refs.', {
        unknown_evidence_refs: unknownEvidenceRefs,
      });
    }
    const unknown = citedRefs.filter((ref) => !context.knownRefKeys.has(this.refKey(ref)));
    if (unknown.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Value assessment cites refs outside the T-059/T-057 handoff.', {
        unknown_refs: unknown,
      });
    }
  }

  private validateClaimBoundaries(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): void {
    const claims = [
      output.strongest_claim_if_success,
      output.fallback_claim_if_success ?? '',
      output.ceiling_case,
      output.base_case,
      output.floor_case,
    ].map((claim) => claim.toLowerCase());
    const prohibited = [
      ...context.valueInput.question_contract.prohibited_claims,
      ...context.formationInput.non_goals,
    ].map((item) => item.toLowerCase().trim()).filter(Boolean);
    const violations = prohibited.filter((term) =>
      claims.some((claim) => this.containsProhibitedAssertion(claim, term)),
    );
    if (violations.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Value assessment claim exceeds prohibited boundaries.', {
        violations,
      });
    }
    const ceiling = [
      context.valueInput.question_contract.claim_ceiling,
      context.formationInput.claim_ceiling,
    ].join(' ').toLowerCase();
    if (this.containsOverstrongLanguage(output.strongest_claim_if_success) && /not|no|cannot|must not/.test(ceiling)) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Value assessment strongest claim drifts above slice claim ceiling.');
    }
  }

  private validateAnswerabilityConsistency(
    output: TopicSelectionAssessTopicValueLlmOutput,
    context: ValueAssessmentContext,
  ): void {
    const verdict = context.valueInput.answerability_plan.answerability_verdict;
    if (
      (verdict === 'needs_slice_refinement' || verdict === 'not_answerable')
      && (output.readiness_status === 'ready' || output.readiness_status === 'ready_with_accepted_risk')
    ) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Weak answerability cannot pass value assessment readiness.');
    }
    if (verdict === 'answerable_with_risk' && output.readiness_status === 'ready') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Answerable-with-risk contracts cannot become risk-free ready in T-060.');
    }
    if (
      output.readiness_status === 'ready_with_accepted_risk'
      && output.accepted_risk_refs.length === 0
      && context.inheritedAcceptedRiskRefs.length === 0
    ) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'ready_with_accepted_risk requires accepted risk refs.');
    }
    const nonOverridableBlockers = this.nonOverridableBlockingGates(output);
    if (
      nonOverridableBlockers.length > 0
      && (output.readiness_status === 'ready' || output.readiness_status === 'ready_with_accepted_risk')
    ) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Blocking value gates cannot produce ready assessment.');
    }
  }

  private validateReadinessDispositionConsistency(output: TopicSelectionAssessTopicValueLlmOutput): void {
    const readyStatus = output.readiness_status === 'ready' || output.readiness_status === 'ready_with_accepted_risk';
    if (readyStatus && output.recommended_disposition !== 'advance_to_package') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Ready value assessments must recommend advance_to_package.');
    }
    if (!readyStatus && output.recommended_disposition === 'advance_to_package') {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'advance_to_package requires a ready value assessment.');
    }
    if (!readyStatus) {
      return;
    }
    if (output.total_score < 70) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Ready value assessments require total_score >= 70.');
    }
    const weakDimensions = output.dimension_scores.filter((score) => score.score < 60);
    if (weakDimensions.length > 0) {
      throw new AppError(
        409,
        'GATE_CONSTRAINT_FAILED',
        'Ready value assessments cannot contain weak dimension scores.',
        { weak_dimensions: weakDimensions.map((score) => score.dimension_key) },
      );
    }
  }

  private validateAdvanceToPackage(
    assessment: TopicSelectionTopicValueAssessmentRecord,
    acceptedRiskRefs: TopicSelectionFunctionalRef[],
  ): void {
    if (
      assessment.readiness_status !== 'ready'
      && assessment.readiness_status !== 'ready_with_accepted_risk'
    ) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'advance_to_package requires ready value assessment.');
    }
    const nonOverridableBlockers = assessment.hard_gates.filter((gate) =>
      gate.verdict === 'fail' && gate.severity === 'blocking' && !gate.overridable_with_risk,
    );
    if (nonOverridableBlockers.length > 0 || assessment.blocker_refs.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'advance_to_package is blocked by non-overridable value issues.');
    }
    if (assessment.readiness_status === 'ready_with_accepted_risk' && acceptedRiskRefs.length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'advance_to_package with risk requires accepted risk refs.');
    }
  }

  private validateDispositionPayload(input: {
    input: DecideValueDispositionInput;
    assessment: TopicSelectionTopicValueAssessmentRecord;
    snapshot: TopicSelectionTopicValueAssessmentInputSnapshotRecord;
    requiredActions: string[];
    loopbackTargetRef: TopicSelectionFunctionalRef | null;
    acceptedRiskRefs: TopicSelectionFunctionalRef[];
    blockerRefs: TopicSelectionFunctionalRef[];
  }): void {
    if (!input.input.decision_rationale || input.input.decision_rationale.trim().length === 0) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'ValueDispositionDecision requires a decision rationale.');
    }
    this.requireExactInheritedRefs(
      'accepted risk refs',
      input.acceptedRiskRefs,
      input.assessment.accepted_risk_refs,
    );
    this.requireExactInheritedRefs(
      'blocker refs',
      input.blockerRefs,
      input.assessment.blocker_refs,
    );
    if (input.input.decision === 'advance_to_package') {
      if (input.loopbackTargetRef) {
        throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'advance_to_package cannot carry a loopback target.');
      }
      return;
    }
    if (input.requiredActions.length === 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', 'Non-advance value dispositions require explicit required_actions.');
    }
    const loopbackRequired = input.input.decision === 'refine_question'
      || input.input.decision === 'refine_slice'
      || input.input.decision === 'recheck_evidence_or_search';
    if (loopbackRequired && !input.loopbackTargetRef) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `${input.input.decision} requires a loopback target ref.`);
    }
    if (input.loopbackTargetRef) {
      const allowedLoopbackRefs = this.uniqueRefs([
        input.snapshot.topic_question_contract_ref,
        input.snapshot.research_slice_ref,
        ...input.snapshot.recheck_request_refs,
        this.ref('recheck_request', 'pending', input.snapshot.title_card_id),
      ]);
      this.requireKnownRefs('loopback target ref', [input.loopbackTargetRef], allowedLoopbackRefs);
    }
  }

  private buildContext(
    valueInput: TopicSelectionV1bValueAssessmentInput,
    formationInput: TopicSelectionV1bTopicQuestionFormationInput,
    titleCardId: string,
    workspaceId: string | null,
  ): ValueAssessmentContext {
    const knownNeedRefs = this.uniqueRefs([
      ...valueInput.validated_need_refs,
      formationInput.validated_need_ref,
    ]);
    const knownEvidenceRefs = [
      ...valueInput.evidence_refs.map((ref) => ref.evidence_ref),
      ...formationInput.evidence_refs.map((ref) => ref.evidence_ref),
    ];
    const inheritedAcceptedRiskRefs = this.uniqueRefs([
      ...valueInput.accepted_risk_refs,
      ...formationInput.accepted_risk_refs,
    ]);
    const knownRefs = this.uniqueRefs([
      valueInput.topic_question_ref,
      valueInput.topic_question_contract_ref,
      valueInput.answerability_plan_ref,
      valueInput.research_slice_ref,
      valueInput.selection_decision_ref,
      valueInput.candidate_set_ref,
      valueInput.source_candidate_ref,
      formationInput.slice_selection_decision_ref,
      formationInput.source_option_set_ref,
      formationInput.source_option_ref,
      formationInput.v1b_intake_snapshot_ref,
      formationInput.research_constraint_profile_ref,
      formationInput.readiness_assessment_ref,
      formationInput.evidence_map_ref,
      formationInput.search_run_ref,
      formationInput.search_plan_ref,
      formationInput.literature_snapshot_ref,
      ...knownNeedRefs,
      ...knownEvidenceRefs,
      ...inheritedAcceptedRiskRefs,
      ...valueInput.memory_suggestion_refs,
      ...formationInput.memory_suggestion_refs,
      ...valueInput.recheck_request_refs,
      ...formationInput.recheck_request_refs,
      ...valueInput.boundary_refs.flatMap((ref) => [
        this.ref('topic_question_boundary_ref', ref.topic_question_boundary_ref_id, titleCardId),
        this.ref('research_slice_boundary', ref.research_slice_boundary_id, titleCardId),
      ]),
      ...formationInput.boundaries.map((boundary) =>
        this.ref('research_slice_boundary', boundary.research_slice_boundary_id, titleCardId),
      ),
      ...valueInput.assumption_refs.map((ref) =>
        this.ref('topic_question_assumption_ref', ref.topic_question_assumption_ref_id, titleCardId),
      ),
      ...formationInput.assumptions.map((assumption) =>
        this.ref('research_slice_assumption', assumption.research_slice_assumption_id, titleCardId),
      ),
      ...valueInput.falsification_conditions.map((condition) =>
        this.ref(
          'topic_question_falsification_condition',
          condition.topic_question_falsification_condition_id,
          titleCardId,
        ),
      ),
    ]);
    return {
      valueInput,
      formationInput,
      titleCardId,
      workspaceId,
      inheritedAcceptedRiskRefs,
      knownRefKeys: new Set(knownRefs.map((ref) => this.refKey(ref))),
      knownEvidenceRefKeys: new Set(knownEvidenceRefs.map((ref) => this.refKey(ref))),
      knownNeedRefKeys: new Set(knownNeedRefs.map((ref) => this.refKey(ref))),
    };
  }

  private buildInputSnapshotRecord(input: {
    inputSnapshotId: string;
    valueInput: TopicSelectionV1bValueAssessmentInput;
    formationInput: TopicSelectionV1bTopicQuestionFormationInput;
    titleCardId: string;
    workspaceId: string | null;
    controlPlaneInputSnapshotId: string;
    now: string;
  }): TopicSelectionTopicValueAssessmentInputSnapshotRecord {
    const researchSliceSnapshot = {
      ...input.formationInput,
      research_slice_id: input.valueInput.research_slice_ref.ref_id,
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      slice_version: input.valueInput.research_slice_ref.version_id ?? 'v1',
    };
    const payload = {
      value_input: input.valueInput,
      research_slice_snapshot: researchSliceSnapshot,
    };
    return {
      topic_value_input_snapshot_id: input.inputSnapshotId,
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_question_contract_id: input.valueInput.topic_question_contract_ref.ref_id,
      topic_question_id: input.valueInput.topic_question_ref.ref_id,
      research_slice_id: input.valueInput.research_slice_ref.ref_id,
      research_slice_version: input.valueInput.research_slice_ref.version_id ?? 'v1',
      topic_question_ref: input.valueInput.topic_question_ref,
      topic_question_contract_ref: input.valueInput.topic_question_contract_ref,
      answerability_plan_ref: input.valueInput.answerability_plan_ref,
      research_slice_ref: input.valueInput.research_slice_ref,
      validated_need_refs: input.valueInput.validated_need_refs,
      evidence_refs: input.valueInput.evidence_refs,
      need_refs: input.valueInput.need_refs,
      boundary_refs: input.valueInput.boundary_refs,
      assumption_refs: input.valueInput.assumption_refs,
      falsification_conditions: input.valueInput.falsification_conditions,
      accepted_risk_refs: this.uniqueRefs([
        ...input.valueInput.accepted_risk_refs,
        ...input.formationInput.accepted_risk_refs,
      ]),
      memory_suggestion_refs: this.uniqueRefs([
        ...input.valueInput.memory_suggestion_refs,
        ...input.formationInput.memory_suggestion_refs,
      ]),
      recheck_request_refs: this.uniqueRefs([
        ...input.valueInput.recheck_request_refs,
        ...input.formationInput.recheck_request_refs,
      ]),
      question_contract: input.valueInput.question_contract,
      answerability_plan: input.valueInput.answerability_plan,
      research_slice_snapshot: researchSliceSnapshot as unknown as Record<string, unknown>,
      snapshot_hash: sha256Text(stableStringify(payload)),
      control_plane_input_snapshot_id: input.controlPlaneInputSnapshotId,
      created_at: input.now,
    };
  }

  private buildAssessmentRecord(input: {
    assessmentId: string;
    researchRecordId: string;
    runId: string;
    inputSnapshotId: string;
    memoId: string;
    valueInput: TopicSelectionV1bValueAssessmentInput;
    formationInput: TopicSelectionV1bTopicQuestionFormationInput;
    llmOutput: TopicSelectionAssessTopicValueLlmOutput;
    titleCardId: string;
    workspaceId: string | null;
    workflowRunId: string;
    gateResultId: string;
    transitionAttemptId: string;
    traceSnapshotId: string;
    artifactRefs: TopicSelectionFunctionalRef[];
    now: string;
  }): TopicSelectionTopicValueAssessmentRecord {
    return {
      topic_value_assessment_id: input.assessmentId,
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_question_id: input.valueInput.topic_question_ref.ref_id,
      topic_question_contract_id: input.valueInput.topic_question_contract_ref.ref_id,
      research_record_id: input.researchRecordId,
      source_research_slice_id: input.valueInput.research_slice_ref.ref_id,
      source_research_slice_version: input.valueInput.research_slice_ref.version_id ?? 'v1',
      assess_topic_value_run_id: input.runId,
      topic_value_input_snapshot_id: input.inputSnapshotId,
      value_reasoning_memo_id: input.memoId,
      active_disposition_decision_id: null,
      readiness_status: input.llmOutput.readiness_status,
      freshness_status: 'current',
      strongest_claim_if_success: input.llmOutput.strongest_claim_if_success,
      fallback_claim_if_success: input.llmOutput.fallback_claim_if_success ?? null,
      hard_gates: input.llmOutput.hard_gates,
      dimension_scores: input.llmOutput.dimension_scores,
      risk_penalty: input.llmOutput.risk_penalty,
      reviewer_objections: input.llmOutput.reviewer_objections,
      ceiling_case: input.llmOutput.ceiling_case,
      base_case: input.llmOutput.base_case,
      floor_case: input.llmOutput.floor_case,
      legacy_verdict: this.legacyVerdict(input.llmOutput.recommended_disposition),
      total_score: input.llmOutput.total_score,
      value_summary: input.llmOutput.value_summary,
      confidence: input.llmOutput.confidence,
      accepted_risk_refs: this.uniqueRefs([
        ...input.valueInput.accepted_risk_refs,
        ...input.formationInput.accepted_risk_refs,
        ...input.llmOutput.accepted_risk_refs,
      ]),
      blocker_refs: input.llmOutput.blocker_refs,
      risk_notes: input.llmOutput.risk_notes,
      trace_snapshot_id: input.traceSnapshotId,
      workflow_run_id: input.workflowRunId,
      gate_result_id: input.gateResultId,
      transition_attempt_id: input.transitionAttemptId,
      artifact_refs: input.artifactRefs,
      created_at: input.now,
      updated_at: input.now,
    };
  }

  private buildReasoningMemoRecord(input: {
    memoId: string;
    assessmentId: string;
    valueInput: TopicSelectionV1bValueAssessmentInput;
    llmOutput: TopicSelectionAssessTopicValueLlmOutput;
    titleCardId: string;
    workspaceId: string | null;
    workflowRunId: string;
    artifactRefs: TopicSelectionFunctionalRef[];
    now: string;
  }): TopicSelectionValueReasoningMemoRecord {
    return {
      value_reasoning_memo_id: input.memoId,
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_value_assessment_id: input.assessmentId,
      topic_question_contract_id: input.valueInput.topic_question_contract_ref.ref_id,
      recommendation: input.llmOutput.reasoning_memo.recommendation,
      value_thesis: input.llmOutput.reasoning_memo.value_thesis,
      significance: input.llmOutput.reasoning_memo.significance,
      originality: input.llmOutput.reasoning_memo.originality,
      claim_leverage: input.llmOutput.reasoning_memo.claim_leverage,
      reviewer_risks: input.llmOutput.reasoning_memo.reviewer_risks,
      effort_to_value: input.llmOutput.reasoning_memo.effort_to_value,
      strategic_fit: input.llmOutput.reasoning_memo.strategic_fit,
      negative_memory_check: input.llmOutput.reasoning_memo.negative_memory_check,
      evidence_backed_rationale: input.llmOutput.reasoning_memo.evidence_backed_rationale,
      top_objections: input.llmOutput.reasoning_memo.top_objections,
      uncertainty: input.llmOutput.reasoning_memo.uncertainty,
      disposition_bridge: input.llmOutput.reasoning_memo.disposition_bridge,
      requires_critic_review: input.llmOutput.reasoning_memo.requires_critic_review,
      critic_triggers: input.llmOutput.reasoning_memo.critic_triggers,
      cited_refs: input.llmOutput.reasoning_memo.cited_refs,
      created_by_workflow_run_id: input.workflowRunId,
      artifact_refs: input.artifactRefs,
      created_at: input.now,
    };
  }

  private buildAssessmentRunRecord(input: {
    runId: string;
    assessmentId?: string | null;
    memoId?: string | null;
    valueInput: TopicSelectionV1bValueAssessmentInput;
    formationInput: TopicSelectionV1bTopicQuestionFormationInput;
    titleCardId: string;
    workspaceId: string | null;
    triggeredBy: TopicSelectionActorType;
    model: LlmModelRef;
    promptVersion: string;
    status: TopicSelectionAssessTopicValueRunRecord['status'];
    workflowProfileVersion?: string | null;
    controlPlaneInputSnapshotId?: string | null;
    topicValueInputSnapshotId?: string | null;
    workflowRunId?: string | null;
    gateResultId?: string | null;
    transitionAttemptId?: string | null;
    artifactRefs: TopicSelectionFunctionalRef[];
    qualityFlags: string[];
    failureReason?: string | null;
    now: string;
  }): TopicSelectionAssessTopicValueRunRecord {
    return {
      assess_topic_value_run_id: input.runId,
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_question_contract_id: input.valueInput.topic_question_contract_ref.ref_id,
      topic_question_id: input.valueInput.topic_question_ref.ref_id,
      research_slice_id: input.valueInput.research_slice_ref.ref_id,
      research_slice_version: input.valueInput.research_slice_ref.version_id ?? 'v1',
      topic_value_assessment_id: input.assessmentId ?? null,
      value_reasoning_memo_id: input.memoId ?? null,
      status: input.status,
      triggered_by: input.triggeredBy,
      topic_question_ref: input.valueInput.topic_question_ref,
      topic_question_contract_ref: input.valueInput.topic_question_contract_ref,
      answerability_plan_ref: input.valueInput.answerability_plan_ref,
      research_slice_ref: input.valueInput.research_slice_ref,
      selection_decision_ref: input.valueInput.selection_decision_ref,
      validated_need_refs: input.valueInput.validated_need_refs,
      evidence_refs: this.uniqueRefs([
        ...input.valueInput.evidence_refs.map((ref) => ref.evidence_ref),
        ...input.formationInput.evidence_refs.map((ref) => ref.evidence_ref),
      ]),
      accepted_risk_refs: this.uniqueRefs([
        ...input.valueInput.accepted_risk_refs,
        ...input.formationInput.accepted_risk_refs,
      ]),
      memory_suggestion_refs: this.uniqueRefs([
        ...input.valueInput.memory_suggestion_refs,
        ...input.formationInput.memory_suggestion_refs,
      ]),
      recheck_request_refs: this.uniqueRefs([
        ...input.valueInput.recheck_request_refs,
        ...input.formationInput.recheck_request_refs,
      ]),
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.workflowProfileVersion ?? null,
      provider_id: input.model.providerId,
      model_id: input.model.modelId,
      prompt_template_id: PROMPT_TEMPLATE_ID,
      prompt_template_version: input.promptVersion,
      topic_value_input_snapshot_id: input.topicValueInputSnapshotId ?? null,
      input_snapshot_id: input.controlPlaneInputSnapshotId ?? null,
      workflow_run_id: input.workflowRunId ?? null,
      gate_result_id: input.gateResultId ?? null,
      transition_attempt_id: input.transitionAttemptId ?? null,
      artifact_refs: input.artifactRefs,
      quality_flags: input.qualityFlags,
      failure_reason: input.failureReason ?? null,
      created_at: input.now,
      updated_at: input.now,
    };
  }

  private buildValueEvidenceRefs(input: {
    assessmentId: string;
    valueInput: TopicSelectionV1bValueAssessmentInput;
    titleCardId: string;
    workspaceId: string | null;
    now: string;
  }): TopicSelectionTopicValueEvidenceRefRecord[] {
    return input.valueInput.evidence_refs.map((ref, index) => ({
      topic_value_evidence_ref_id: this.idFactory('topic_value_evidence_ref'),
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      topic_value_assessment_id: input.assessmentId,
      topic_question_contract_id: input.valueInput.topic_question_contract_ref.ref_id,
      evidence_ref: ref.evidence_ref,
      evidence_role: ref.evidence_role,
      value_use: ref.mapped_question_part || `value_trace_${index + 1}`,
      rationale: ref.rationale,
      created_at: input.now,
    }));
  }

  private buildPackageDraftInputPayload(input: {
    assessment: TopicSelectionTopicValueAssessmentRecord;
    memo: TopicSelectionValueReasoningMemoRecord;
    snapshot: TopicSelectionTopicValueAssessmentInputSnapshotRecord;
    evidenceRefs: TopicSelectionTopicValueEvidenceRefRecord[];
    decision: TopicSelectionValueDispositionDecisionRecord;
  }): TopicSelectionV1bPackageDraftInput {
    const decisionWithoutPackage: Omit<TopicSelectionValueDispositionDecisionRecord, 'package_draft_input'> = {
      value_disposition_decision_id: input.decision.value_disposition_decision_id,
      workspace_id: input.decision.workspace_id,
      title_card_id: input.decision.title_card_id,
      topic_value_assessment_id: input.decision.topic_value_assessment_id,
      topic_question_contract_id: input.decision.topic_question_contract_id,
      value_reasoning_memo_id: input.decision.value_reasoning_memo_id,
      decision: input.decision.decision,
      decided_by: input.decision.decided_by,
      decision_rationale: input.decision.decision_rationale,
      required_actions: input.decision.required_actions,
      loopback_target_ref: input.decision.loopback_target_ref,
      blocking_contexts: input.decision.blocking_contexts,
      accepted_risk_refs: input.decision.accepted_risk_refs,
      blocker_refs: input.decision.blocker_refs,
      output_topic_package_id: input.decision.output_topic_package_id,
      status: input.decision.status,
      is_current: input.decision.is_current,
      input_snapshot_id: input.decision.input_snapshot_id,
      workflow_run_id: input.decision.workflow_run_id,
      gate_result_id: input.decision.gate_result_id,
      transition_attempt_id: input.decision.transition_attempt_id,
      artifact_refs: input.decision.artifact_refs,
      created_at: input.decision.created_at,
    };
    return {
      topic_value_assessment_ref: this.ref(
        'topic_value_assessment',
        input.assessment.topic_value_assessment_id,
        input.assessment.title_card_id,
      ),
      value_reasoning_memo_ref: this.ref(
        'value_reasoning_memo',
        input.memo.value_reasoning_memo_id,
        input.assessment.title_card_id,
      ),
      value_disposition_decision_ref: this.ref(
        'value_disposition_decision',
        input.decision.value_disposition_decision_id,
        input.assessment.title_card_id,
      ),
      topic_question_ref: input.snapshot.topic_question_ref,
      topic_question_contract_ref: input.snapshot.topic_question_contract_ref,
      answerability_plan_ref: input.snapshot.answerability_plan_ref,
      research_slice_ref: input.snapshot.research_slice_ref,
      validated_need_refs: input.snapshot.validated_need_refs,
      evidence_refs: input.snapshot.evidence_refs.length > 0
        ? input.snapshot.evidence_refs
        : input.evidenceRefs.map((ref) => ({
          topic_question_evidence_ref_id: ref.topic_value_evidence_ref_id,
          workspace_id: ref.workspace_id,
          title_card_id: ref.title_card_id,
          topic_question_id: input.snapshot.topic_question_id,
          topic_question_contract_id: ref.topic_question_contract_id,
          evidence_ref: ref.evidence_ref,
          evidence_role: 'support',
          mapped_question_part: ref.value_use,
          rationale: ref.rationale,
          source_locator_snapshot: {},
          created_at: ref.created_at,
        })),
      boundary_refs: input.snapshot.boundary_refs,
      assumption_refs: input.snapshot.assumption_refs,
      falsification_conditions: input.snapshot.falsification_conditions,
      accepted_risk_refs: input.decision.accepted_risk_refs,
      memory_suggestion_refs: input.snapshot.memory_suggestion_refs,
      recheck_request_refs: input.snapshot.recheck_request_refs,
      topic_value_assessment: input.assessment,
      value_reasoning_memo: input.memo,
      value_disposition_decision: decisionWithoutPackage,
      question_contract: input.snapshot.question_contract,
      answerability_plan: input.snapshot.answerability_plan,
      research_slice_snapshot: input.snapshot.research_slice_snapshot,
    };
  }

  private async persistFailedAssessmentRun(input: {
    input: AssessTopicValueInput;
    valueInput: TopicSelectionV1bValueAssessmentInput;
    formationInput: TopicSelectionV1bTopicQuestionFormationInput;
    runId: string;
    titleCardId: string;
    workspaceId: string | null;
    triggeredBy: TopicSelectionActorType;
    model: LlmModelRef;
    promptVersion: string;
    controlPlaneInputSnapshotId: string;
    error: unknown;
    telemetry?: LlmCallTelemetry | null;
    artifacts?: Array<{ artifact_kind: 'structured_output' | 'diagnostic'; payload: Record<string, unknown> }>;
  }): Promise<TopicSelectionAssessTopicValueRunRecord> {
    const runRef = this.ref('assess_topic_value_run', input.runId, input.titleCardId);
    const workflow = await this.controlPlane.recordWorkflowRun({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      workflow_key: 'topic-selection.v1b-assess-topic-value',
      workflow_profile_key: WORKFLOW_PROFILE_KEY,
      workflow_profile_version: input.input.workflow_profile_version ?? null,
      input_snapshot_id: input.controlPlaneInputSnapshotId,
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
      gate_key: 'topic-selection.v1b-value-assessment-domain-validation',
      target_ref: runRef,
      input_snapshot_id: input.controlPlaneInputSnapshotId,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      policy_version_id: input.input.policy_version_id ?? null,
      blockers: [
        this.blocker(
          this.errorCode(input.error),
          this.errorMessage(input.error),
          [input.valueInput.topic_question_contract_ref],
        ),
      ],
      created_by: input.triggeredBy,
    });
    const transition = await this.controlPlane.attemptTransition({
      workspace_id: input.workspaceId,
      title_card_id: input.titleCardId,
      transition_key: 'v1b-topic-question-contract-to-value-assessment',
      source_ref: input.valueInput.topic_question_contract_ref,
      target_ref: runRef,
      gate_result_id: gate.readiness_gate_result_id,
      workflow_run_id: workflow.workflow_run.workflow_run_id,
      input_snapshot_id: input.controlPlaneInputSnapshotId,
      policy_version_id: input.input.policy_version_id ?? null,
      actor: { actor_type: input.triggeredBy },
      created_authority_refs: [runRef],
    });
    const now = this.now();
    const failedRun = this.buildAssessmentRunRecord({
      runId: input.runId,
      assessmentId: null,
      memoId: null,
      valueInput: input.valueInput,
      formationInput: input.formationInput,
      titleCardId: input.titleCardId,
      workspaceId: input.workspaceId,
      triggeredBy: input.triggeredBy,
      model: input.model,
      promptVersion: input.promptVersion,
      status: 'failed',
      workflowProfileVersion: input.input.workflow_profile_version ?? null,
      controlPlaneInputSnapshotId: input.controlPlaneInputSnapshotId,
      workflowRunId: workflow.workflow_run.workflow_run_id,
      gateResultId: gate.readiness_gate_result_id,
      transitionAttemptId: transition.chain_transition_attempt_id,
      artifactRefs: this.artifactRefs(workflow.artifact_refs, input.titleCardId),
      qualityFlags: [`transition:${transition.result}`],
      failureReason: this.errorMessage(input.error),
      now,
    });
    return this.repository.createAssessmentRun(failedRun);
  }

  private defaultLoopbackTargetRef(
    decision: TopicSelectionValueDisposition,
    snapshot: TopicSelectionTopicValueAssessmentInputSnapshotRecord,
  ): TopicSelectionFunctionalRef | null {
    if (decision === 'refine_question') {
      return snapshot.topic_question_contract_ref;
    }
    if (decision === 'refine_slice') {
      return snapshot.research_slice_ref;
    }
    if (decision === 'recheck_evidence_or_search') {
      return snapshot.recheck_request_refs[0] ?? this.ref('recheck_request', 'pending', snapshot.title_card_id);
    }
    return null;
  }

  private compileAssessmentSourceRefs(
    valueInput: TopicSelectionV1bValueAssessmentInput,
    formationInput: TopicSelectionV1bTopicQuestionFormationInput,
  ): TopicSelectionFunctionalRef[] {
    return this.uniqueRefs([
      valueInput.topic_question_ref,
      valueInput.topic_question_contract_ref,
      valueInput.answerability_plan_ref,
      valueInput.research_slice_ref,
      valueInput.selection_decision_ref,
      valueInput.candidate_set_ref,
      valueInput.source_candidate_ref,
      formationInput.slice_selection_decision_ref,
      formationInput.research_constraint_profile_ref,
      ...valueInput.validated_need_refs,
      ...valueInput.evidence_refs.map((ref) => ref.evidence_ref),
      ...formationInput.evidence_refs.map((ref) => ref.evidence_ref),
      ...valueInput.accepted_risk_refs,
      ...formationInput.accepted_risk_refs,
      ...valueInput.memory_suggestion_refs,
      ...formationInput.memory_suggestion_refs,
      ...valueInput.recheck_request_refs,
      ...formationInput.recheck_request_refs,
    ]);
  }

  private nonOverridableBlockingGates(output: TopicSelectionAssessTopicValueLlmOutput) {
    return output.hard_gates.filter((gate) =>
      gate.verdict === 'fail' && gate.severity === 'blocking' && !gate.overridable_with_risk,
    );
  }

  private legacyVerdict(disposition: TopicSelectionValueDisposition): 'promote' | 'refine' | 'park' | 'drop' {
    if (disposition === 'advance_to_package') return 'refine';
    if (disposition === 'park') return 'park';
    if (disposition === 'drop') return 'drop';
    return 'refine';
  }

  private isEvidenceRef(ref: TopicSelectionFunctionalRef): boolean {
    return ref.ref_type.includes('evidence')
      || ref.ref_type === 'literature_record'
      || ref.ref_type === 'literature_source';
  }

  private containsOverstrongLanguage(claim: string): boolean {
    const normalized = claim.toLowerCase();
    return [
      'production-ready',
      'production ready',
      'production superiority',
      'state of the art',
      'sota',
      'guarantee',
      'always',
    ].some((term) => normalized.includes(term));
  }

  private containsProhibitedAssertion(claim: string, term: string): boolean {
    let cursor = claim.indexOf(term);
    while (cursor >= 0) {
      const prefix = claim.slice(Math.max(0, cursor - 24), cursor);
      if (!/(?:not|no|never|without|cannot|can't)\s+$/.test(prefix)) {
        return true;
      }
      cursor = claim.indexOf(term, cursor + term.length);
    }
    return false;
  }

  private requireExactInheritedRefs(
    label: string,
    actual: TopicSelectionFunctionalRef[],
    expected: TopicSelectionFunctionalRef[],
  ): void {
    this.requireKnownRefs(label, actual, expected);
    const actualKeys = new Set(actual.map((ref) => this.refKey(ref)));
    const missing = expected.filter((ref) => !actualKeys.has(this.refKey(ref)));
    if (missing.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `ValueDispositionDecision cannot drop inherited ${label}.`, {
        missing_refs: missing,
      });
    }
  }

  private requireKnownRefs(
    label: string,
    actual: TopicSelectionFunctionalRef[],
    expected: TopicSelectionFunctionalRef[],
  ): void {
    const expectedKeys = new Set(expected.map((ref) => this.refKey(ref)));
    const unknown = actual.filter((ref) => !expectedKeys.has(this.refKey(ref)));
    if (unknown.length > 0) {
      throw new AppError(409, 'GATE_CONSTRAINT_FAILED', `ValueDispositionDecision contains unknown ${label}.`, {
        unknown_refs: unknown,
      });
    }
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
    return 'TOPIC_VALUE_ASSESSMENT_FAILED';
  }

  private errorPayload(error: unknown): Record<string, unknown> {
    return {
      code: this.errorCode(error),
      message: this.errorMessage(error),
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Topic value assessment failed.';
  }

  private runError(error: unknown, runId: string): AppError {
    if (error instanceof AppError) {
      return new AppError(error.statusCode, error.errorCode, error.message, {
        ...(error.details ?? {}),
        assess_topic_value_run_id: runId,
      });
    }
    return new AppError(500, 'INTERNAL_ERROR', this.errorMessage(error), {
      assess_topic_value_run_id: runId,
    });
  }
}
