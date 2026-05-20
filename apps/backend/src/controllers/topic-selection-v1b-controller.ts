import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { TopicSelectionOfflineEvaluationReplayService } from '../services/topic-selection-offline-evaluation-replay-service.js';
import { TopicSelectionV1bIntakeService } from '../services/topic-selection-v1b-intake-service.js';
import { TopicSelectionV1bResearchSliceService } from '../services/topic-selection-v1b-research-slice-service.js';
import { TopicSelectionV1bTopicPackageService } from '../services/topic-selection-v1b-topic-package-service.js';
import { TopicSelectionV1bTopicQuestionService } from '../services/topic-selection-v1b-topic-question-service.js';
import { TopicSelectionV1bValueAssessmentService } from '../services/topic-selection-v1b-value-assessment-service.js';

type BodyRequest<T> = FastifyRequest<{ Body: T }>;
type ParamsRequest<T> = FastifyRequest<{ Params: T }>;
type BodyParamsRequest<TBody, TParams> = FastifyRequest<{ Body: TBody; Params: TParams }>;

type IntakeSnapshotBody = Parameters<TopicSelectionV1bIntakeService['createV1bIntakeSnapshot']>[0];
type ConstraintProfileBody = Parameters<TopicSelectionV1bIntakeService['createOrUpdateResearchConstraintProfile']>[0];
type IntakeReadinessBody = Parameters<TopicSelectionV1bIntakeService['assessV1bIntakeReadiness']>[0];
type ResearchSlicePlanBody = Parameters<TopicSelectionV1bResearchSliceService['planResearchSliceOptions']>[0];
type ResearchSliceSelectionBody =
  Omit<Parameters<TopicSelectionV1bResearchSliceService['selectResearchSlice']>[0], 'option_set_id'>;
type TopicQuestionFormationBody = Parameters<TopicSelectionV1bTopicQuestionService['formTopicQuestionCandidates']>[0];
type TopicQuestionSelectionBody =
  Omit<Parameters<TopicSelectionV1bTopicQuestionService['selectTopicQuestion']>[0], 'candidate_set_id'>;
type TopicValueAssessmentBody = Parameters<TopicSelectionV1bValueAssessmentService['assessTopicValue']>[0];
type ValueDispositionBody =
  Omit<Parameters<TopicSelectionV1bValueAssessmentService['decideValueDisposition']>[0], 'topic_value_assessment_id'>;
type DraftPackageBody = Parameters<TopicSelectionV1bTopicPackageService['createDraftPackage']>[0];
export type OfflineDatasetBody = Parameters<TopicSelectionOfflineEvaluationReplayService['createDataset']>[0];
type OfflineCaseBody = Parameters<TopicSelectionOfflineEvaluationReplayService['addCase']>[0];
type OfflineRunBody = Parameters<TopicSelectionOfflineEvaluationReplayService['startRun']>[0];
type OfflineCaseResultBody = Parameters<TopicSelectionOfflineEvaluationReplayService['recordFrozenCaseResult']>[0];

function handleError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.details,
      },
    });
  }

  const request = (reply as { request?: { log?: { error: (err: unknown, msg?: string) => void } } }).request;
  if (request?.log?.error) {
    request.log.error(error, 'topic-selection v1b error');
  } else {
    console.error('[topic-selection-v1b]', error);
  }
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected topic-selection v1b failure.',
    },
  });
}

export class TopicSelectionV1bController {
  constructor(
    private readonly intake: TopicSelectionV1bIntakeService,
    private readonly researchSlice: TopicSelectionV1bResearchSliceService,
    private readonly topicQuestion: TopicSelectionV1bTopicQuestionService,
    private readonly valueAssessment: TopicSelectionV1bValueAssessmentService,
    private readonly topicPackage: TopicSelectionV1bTopicPackageService,
    private readonly offlineReplay: TopicSelectionOfflineEvaluationReplayService,
  ) {}

  createIntakeSnapshot = async (request: BodyRequest<IntakeSnapshotBody>, reply: FastifyReply) => {
    try {
      const result = await this.intake.createV1bIntakeSnapshot(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createResearchConstraintProfile = async (request: BodyRequest<ConstraintProfileBody>, reply: FastifyReply) => {
    try {
      const result = await this.intake.createOrUpdateResearchConstraintProfile(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  assessIntakeReadiness = async (request: BodyRequest<IntakeReadinessBody>, reply: FastifyReply) => {
    try {
      const result = await this.intake.assessV1bIntakeReadiness(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  planResearchSliceOptions = async (request: BodyRequest<ResearchSlicePlanBody>, reply: FastifyReply) => {
    try {
      const result = await this.researchSlice.planResearchSliceOptions(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  selectResearchSlice = async (
    request: BodyParamsRequest<ResearchSliceSelectionBody, { optionSetId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.researchSlice.selectResearchSlice({
        ...request.body,
        option_set_id: request.params.optionSetId,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  formTopicQuestionCandidates = async (request: BodyRequest<TopicQuestionFormationBody>, reply: FastifyReply) => {
    try {
      const result = await this.topicQuestion.formTopicQuestionCandidates(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  selectTopicQuestion = async (
    request: BodyParamsRequest<TopicQuestionSelectionBody, { candidateSetId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.topicQuestion.selectTopicQuestion({
        ...request.body,
        candidate_set_id: request.params.candidateSetId,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  assessTopicValue = async (request: BodyRequest<TopicValueAssessmentBody>, reply: FastifyReply) => {
    try {
      const result = await this.valueAssessment.assessTopicValue(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  decideValueDisposition = async (
    request: BodyParamsRequest<ValueDispositionBody, { topicValueAssessmentId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.valueAssessment.decideValueDisposition({
        ...request.body,
        topic_value_assessment_id: request.params.topicValueAssessmentId,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createDraftPackage = async (request: BodyRequest<DraftPackageBody>, reply: FastifyReply) => {
    try {
      const result = await this.topicPackage.createDraftPackage(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  getDraftPackage = async (request: ParamsRequest<{ topicPackageId: string }>, reply: FastifyReply) => {
    try {
      const result = await this.topicPackage.getDraftPackage(request.params.topicPackageId);
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  publishV1cInputBundle = async (
    request: ParamsRequest<{ topicPackageId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.topicPackage.publishV1cInputBundle({
        topic_package_id: request.params.topicPackageId,
      });
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createOfflineEvaluationDataset = async (
    request: BodyRequest<OfflineDatasetBody>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.offlineReplay.createDataset({
        ...(request.body ?? {}),
        stage: 'v1b',
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  createSyntheticOfflineEvaluationDataset = async (
    request: BodyRequest<OfflineDatasetBody>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.offlineReplay.createSyntheticV1bBaselineDataset(request.body ?? {});
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  addOfflineEvaluationCase = async (request: BodyRequest<OfflineCaseBody>, reply: FastifyReply) => {
    try {
      const result = await this.offlineReplay.addCase(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  startOfflineEvaluationRun = async (request: BodyRequest<OfflineRunBody>, reply: FastifyReply) => {
    try {
      const result = await this.offlineReplay.startRun(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  recordOfflineEvaluationCaseResult = async (
    request: BodyRequest<OfflineCaseResultBody>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.offlineReplay.recordFrozenCaseResult(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  completeOfflineEvaluationRun = async (
    request: ParamsRequest<{ runId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.offlineReplay.completeRunAndCalculateMetrics({ run_id: request.params.runId });
      return reply.send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listOfflineEvaluationMetricResults = async (
    request: ParamsRequest<{ runId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.offlineReplay.listMetricResults(request.params.runId);
      return reply.send({ items: result });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  listOfflineEvaluationReplayDiffs = async (
    request: ParamsRequest<{ runId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.offlineReplay.listReplayDiffs(request.params.runId);
      return reply.send({ items: result });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  /**
   * T-087 Phase 3.1 — list ResearchSliceOptionSets for a title-card.
   */
  listResearchSliceOptionSetsByTitleCard = async (
    request: ParamsRequest<{ titleCardId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.researchSlice.listOptionSetsByTitleCardId(request.params.titleCardId);
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  /**
   * T-087 Phase 3.1 — list TopicQuestionCandidateSets for a title-card.
   */
  listTopicQuestionCandidateSetsByTitleCard = async (
    request: ParamsRequest<{ titleCardId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.topicQuestion.listCandidateSetsByTitleCardId(request.params.titleCardId);
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  /**
   * T-087 Phase 3.1 — list TopicValueAssessments for a title-card.
   */
  listTopicValueAssessmentsByTitleCard = async (
    request: ParamsRequest<{ titleCardId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.valueAssessment.listAssessmentsByTitleCardId(request.params.titleCardId);
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  /**
   * T-087 Phase 3.1 — list TopicPackages for a title-card.
   */
  listTopicPackagesByTitleCard = async (
    request: ParamsRequest<{ titleCardId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.topicPackage.listPackagesByTitleCardId(request.params.titleCardId);
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  /**
   * T-087 Phase 3.2 — list ResearchSliceOptions for an OptionSet picker.
   */
  listResearchSliceOptionsByOptionSet = async (
    request: ParamsRequest<{ optionSetId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.researchSlice.listOptionsByOptionSetId(request.params.optionSetId);
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };

  /**
   * T-087 Phase 3.3 — list TopicQuestionCandidates for a CandidateSet picker.
   */
  listTopicQuestionCandidatesByCandidateSet = async (
    request: ParamsRequest<{ candidateSetId: string }>,
    reply: FastifyReply,
  ) => {
    try {
      const items = await this.topicQuestion.listCandidatesByCandidateSetId(request.params.candidateSetId);
      return reply.send({ items });
    } catch (error) {
      return handleError(reply, error);
    }
  };
}
