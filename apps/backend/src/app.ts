import Fastify, { type FastifyInstance } from 'fastify';
import { AutoPullController } from './controllers/auto-pull-controller.js';
import { LiteratureAcquisitionSettingsController } from './controllers/literature-acquisition-settings-controller.js';
import { LiteratureBackfillController } from './controllers/literature-backfill-controller.js';
import { LiteratureContentProcessingSettingsController } from './controllers/literature-content-processing-settings-controller.js';
import { LiteratureFulltextAcquisitionController } from './controllers/literature-fulltext-acquisition-controller.js';
import { LiteratureController } from './controllers/literature-controller.js';
import { TopicSettingsController } from './controllers/topic-settings-controller.js';
import { TopicSelectionV1aController } from './controllers/topic-selection-v1a-controller.js';
import { TopicSelectionV1bController } from './controllers/topic-selection-v1b-controller.js';
import { TopicSelectionV1cController } from './controllers/topic-selection-v1c-controller.js';
import { InMemoryApplicationSettingsRepository } from './repositories/in-memory-application-settings-repository.js';
import { InMemoryAutoPullRepository } from './repositories/in-memory-auto-pull-repository.js';
import { InMemoryLiteratureRepository } from './repositories/in-memory-literature-repository.js';
import { ResearchLifecycleController } from './controllers/research-lifecycle-controller.js';
import { InMemoryResearchLifecycleRepository } from './repositories/in-memory-research-lifecycle-repository.js';
import { InMemoryTopicSelectionControlPlaneRepository } from './repositories/in-memory-topic-selection-control-plane-repository.js';
import { InMemoryTopicSelectionEvidenceMapRepository } from './repositories/in-memory-topic-selection-evidence-map-repository.js';
import { InMemoryTopicSelectionNeedValidationRepository } from './repositories/in-memory-topic-selection-need-validation-repository.js';
import { InMemoryTopicSelectionOfflineEvaluationReplayRepository } from './repositories/in-memory-topic-selection-offline-evaluation-replay-repository.js';
import { InMemoryTopicSelectionRecheckRiskMemoryRepository } from './repositories/in-memory-topic-selection-recheck-risk-memory-repository.js';
import { InMemoryTopicSelectionSearchResourceRepository } from './repositories/in-memory-topic-selection-search-resource-repository.js';
import { InMemoryTopicSelectionV1bIntakeRepository } from './repositories/in-memory-topic-selection-v1b-intake-repository.js';
import { InMemoryTopicSelectionV1bResearchSliceRepository } from './repositories/in-memory-topic-selection-v1b-research-slice-repository.js';
import { InMemoryTopicSelectionV1bTopicPackageRepository } from './repositories/in-memory-topic-selection-v1b-topic-package-repository.js';
import { InMemoryTopicSelectionV1bTopicQuestionRepository } from './repositories/in-memory-topic-selection-v1b-topic-question-repository.js';
import { InMemoryTopicSelectionV1bValueAssessmentRepository } from './repositories/in-memory-topic-selection-v1b-value-assessment-repository.js';
import { InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository } from './repositories/in-memory-topic-selection-v1c-downstream-feedback-recheck-repository.js';
import { InMemoryTopicSelectionV1cHumanPromotionDecisionRepository } from './repositories/in-memory-topic-selection-v1c-human-promotion-decision-repository.js';
import { InMemoryTopicSelectionV1cPaperProjectBridgeRepository } from './repositories/in-memory-topic-selection-v1c-paper-project-bridge-repository.js';
import { InMemoryTopicSelectionV1cPromotionGateRepository } from './repositories/in-memory-topic-selection-v1c-promotion-gate-repository.js';
import { InMemoryTopicSelectionV1cPromotionInputRepository } from './repositories/in-memory-topic-selection-v1c-promotion-input-repository.js';
import { getPrismaClient } from './repositories/prisma/prisma-client.js';
import { PrismaApplicationSettingsRepository } from './repositories/prisma/prisma-application-settings-repository.js';
import { PrismaAutoPullRepository } from './repositories/prisma/prisma-auto-pull-repository.js';
import { PrismaLiteratureRepository } from './repositories/prisma/prisma-literature-repository.js';
import { PrismaResearchLifecycleRepository } from './repositories/prisma/prisma-research-lifecycle-repository.js';
import { InMemoryTitleCardManagementRepository } from './repositories/title-card-management.repository.js';
import { PrismaTitleCardManagementRepository } from './repositories/prisma/prisma-title-card-management-repository.js';
import { PrismaTopicSelectionControlPlaneRepository } from './repositories/prisma/prisma-topic-selection-control-plane-repository.js';
import { PrismaTopicSelectionEvidenceMapRepository } from './repositories/prisma/prisma-topic-selection-evidence-map-repository.js';
import { PrismaTopicSelectionNeedValidationRepository } from './repositories/prisma/prisma-topic-selection-need-validation-repository.js';
import { PrismaTopicSelectionOfflineEvaluationReplayRepository } from './repositories/prisma/prisma-topic-selection-offline-evaluation-replay-repository.js';
import { PrismaTopicSelectionRecheckRiskMemoryRepository } from './repositories/prisma/prisma-topic-selection-recheck-risk-memory-repository.js';
import { PrismaTopicSelectionSearchResourceRepository } from './repositories/prisma/prisma-topic-selection-search-resource-repository.js';
import { PrismaTopicSelectionV1bIntakeRepository } from './repositories/prisma/prisma-topic-selection-v1b-intake-repository.js';
import { PrismaTopicSelectionV1bResearchSliceRepository } from './repositories/prisma/prisma-topic-selection-v1b-research-slice-repository.js';
import { PrismaTopicSelectionV1bTopicPackageRepository } from './repositories/prisma/prisma-topic-selection-v1b-topic-package-repository.js';
import { PrismaTopicSelectionV1bTopicQuestionRepository } from './repositories/prisma/prisma-topic-selection-v1b-topic-question-repository.js';
import { PrismaTopicSelectionV1bValueAssessmentRepository } from './repositories/prisma/prisma-topic-selection-v1b-value-assessment-repository.js';
import { PrismaTopicSelectionV1cDownstreamFeedbackRecheckRepository } from './repositories/prisma/prisma-topic-selection-v1c-downstream-feedback-recheck-repository.js';
import { PrismaTopicSelectionV1cHumanPromotionDecisionRepository } from './repositories/prisma/prisma-topic-selection-v1c-human-promotion-decision-repository.js';
import { PrismaTopicSelectionV1cPaperProjectBridgeRepository } from './repositories/prisma/prisma-topic-selection-v1c-paper-project-bridge-repository.js';
import { PrismaTopicSelectionV1cPromotionGateRepository } from './repositories/prisma/prisma-topic-selection-v1c-promotion-gate-repository.js';
import { PrismaTopicSelectionV1cPromotionInputRepository } from './repositories/prisma/prisma-topic-selection-v1c-promotion-input-repository.js';
import { registerAutoPullRoutes } from './routes/auto-pull-routes.js';
import { registerLiteratureAcquisitionSettingsRoutes } from './routes/literature-acquisition-settings-routes.js';
import { registerLiteratureBackfillRoutes } from './routes/literature-backfill-routes.js';
import { registerLiteratureContentProcessingSettingsRoutes } from './routes/literature-content-processing-settings-routes.js';
import { registerLiteratureFulltextAcquisitionRoutes } from './routes/literature-fulltext-acquisition-routes.js';
import { registerLiteratureRoutes } from './routes/literature-routes.js';
import { registerResearchLifecycleRoutes } from './routes/research-lifecycle-routes.js';
import { registerTitleCardManagementRoutes } from './routes/title-card-management.js';
import { registerTopicSettingsRoutes } from './routes/topic-settings-routes.js';
import { registerTopicSelectionV1aRoutes } from './routes/topic-selection-v1a-routes.js';
import { registerTopicSelectionV1bRoutes } from './routes/topic-selection-v1b-routes.js';
import { registerTopicSelectionV1cRoutes } from './routes/topic-selection-v1c-routes.js';
import type { ApplicationSettingsRepository } from './repositories/application-settings-repository.js';
import type { AutoPullRepository } from './repositories/auto-pull-repository.js';
import type { LiteratureRepository } from './repositories/literature-repository.js';
import type { ResearchLifecycleRepository } from './repositories/research-lifecycle-repository.js';
import type { TitleCardManagementRepository } from './repositories/title-card-management.repository.js';
import type { TopicSelectionControlPlaneRepository } from './repositories/topic-selection-control-plane.repository.js';
import type { TopicSelectionEvidenceMapRepository } from './repositories/topic-selection-evidence-map.repository.js';
import type { TopicSelectionNeedValidationRepository } from './repositories/topic-selection-need-validation.repository.js';
import type { TopicSelectionOfflineEvaluationReplayRepository } from './repositories/topic-selection-offline-evaluation-replay.repository.js';
import type { TopicSelectionRecheckRiskMemoryRepository } from './repositories/topic-selection-recheck-risk-memory.repository.js';
import type { TopicSelectionSearchResourceRepository } from './repositories/topic-selection-search-resource.repository.js';
import type { TopicSelectionV1bIntakeRepository } from './repositories/topic-selection-v1b-intake.repository.js';
import type { TopicSelectionV1bResearchSliceRepository } from './repositories/topic-selection-v1b-research-slice.repository.js';
import type { TopicSelectionV1bTopicPackageRepository } from './repositories/topic-selection-v1b-topic-package.repository.js';
import type { TopicSelectionV1bTopicQuestionRepository } from './repositories/topic-selection-v1b-topic-question.repository.js';
import type { TopicSelectionV1bValueAssessmentRepository } from './repositories/topic-selection-v1b-value-assessment.repository.js';
import type { TopicSelectionV1cDownstreamFeedbackRecheckRepository } from './repositories/topic-selection-v1c-downstream-feedback-recheck.repository.js';
import type { TopicSelectionV1cHumanPromotionDecisionRepository } from './repositories/topic-selection-v1c-human-promotion-decision.repository.js';
import type { TopicSelectionV1cPaperProjectBridgeRepository } from './repositories/topic-selection-v1c-paper-project-bridge.repository.js';
import type { TopicSelectionV1cPromotionGateRepository } from './repositories/topic-selection-v1c-promotion-gate.repository.js';
import type { TopicSelectionV1cPromotionInputRepository } from './repositories/topic-selection-v1c-promotion-input.repository.js';
import { AutoPullScheduler } from './services/auto-pull-scheduler.js';
import { AutoPullService } from './services/auto-pull-service.js';
import { LiteratureBackfillService } from './services/literature-backfill-service.js';
import { LiteratureAcquisitionSettingsService } from './services/literature-acquisition-settings-service.js';
import { LiteratureClusterService } from './services/literature-cluster-service.js';
import { LiteratureFlowService } from './services/literature-flow-service.js';
import { LiteratureFulltextAcquisitionService } from './services/literature-fulltext-acquisition-service.js';
import { LiteratureService } from './services/literature-service.js';
import { LiteratureContentProcessingSettingsService } from './services/literature-content-processing-settings-service.js';
import { BackendLlmGateway } from './services/llm-gateway.js';
import { ResearchLifecycleService } from './services/research-lifecycle-service.js';
import {
  TitleCardManagementService,
  type PaperProjectGateway,
} from './services/title-card-management.service.js';
import { TitleCardManagementController } from './controllers/title-card-management.controller.js';
import { TopicSelectionControlPlaneService } from './services/topic-selection-control-plane-service.js';
import { TopicSelectionEvidenceMapService } from './services/topic-selection-evidence-map-service.js';
import { TopicSelectionNeedValidationService } from './services/topic-selection-need-validation-service.js';
import { TopicSelectionOfflineEvaluationReplayService } from './services/topic-selection-offline-evaluation-replay-service.js';
import { TopicSelectionRecheckRiskMemoryService } from './services/topic-selection-recheck-risk-memory-service.js';
import { TopicSelectionSearchResourceService } from './services/topic-selection-search-resource-service.js';
import { TopicSelectionV1bIntakeService } from './services/topic-selection-v1b-intake-service.js';
import { TopicSelectionV1bResearchSliceService } from './services/topic-selection-v1b-research-slice-service.js';
import { TopicSelectionV1bTopicPackageService } from './services/topic-selection-v1b-topic-package-service.js';
import { TopicSelectionV1bTopicQuestionService } from './services/topic-selection-v1b-topic-question-service.js';
import { TopicSelectionV1bValueAssessmentService } from './services/topic-selection-v1b-value-assessment-service.js';
import { TopicSelectionV1cDownstreamFeedbackRecheckService } from './services/topic-selection-v1c-downstream-feedback-recheck-service.js';
import { TopicSelectionV1cHumanPromotionDecisionService } from './services/topic-selection-v1c-human-promotion-decision-service.js';
import { TopicSelectionV1cPaperProjectBridgeService } from './services/topic-selection-v1c-paper-project-bridge-service.js';
import { TopicSelectionV1cPromotionGateService } from './services/topic-selection-v1c-promotion-gate-service.js';
import { TopicSelectionV1cPromotionInputService } from './services/topic-selection-v1c-promotion-input-service.js';
import { FileGovernanceDeliveryAuditStore } from './services/event-delivery/governance-delivery-audit-store.js';
import { FileGovernanceDeliveryOutboxStore } from './services/event-delivery/governance-delivery-outbox-store.js';
import { InProcessGovernanceEventDeliveryAdapter } from './services/event-delivery/governance-event-delivery-adapter.js';
import { DurableOutboxGovernanceEventDeliveryAdapter } from './services/event-delivery/governance-event-delivery-outbox-adapter.js';

type RepositoryStrategy = 'memory' | 'prisma';

export type BuildAppOptions = {
  topicSelectionV1bLlmGateway?: Pick<BackendLlmGateway, 'createStructuredOutput'>;
  topicSelectionV1cPromotionGateLlmGateway?: Pick<BackendLlmGateway, 'createStructuredOutput'>;
};

export function resolveTitleCardManagementStoreConfig(): {
  researchLifecycleStrategy: RepositoryStrategy;
  literatureStrategy: RepositoryStrategy;
  autoPullStrategy: RepositoryStrategy;
  titleCardStrategy: RepositoryStrategy;
  applicationSettingsStrategy: RepositoryStrategy;
} {
  const titleCardStrategy = resolveRepositoryStrategy(
    process.env.TITLE_CARD_REPOSITORY,
    process.env.RESEARCH_LIFECYCLE_REPOSITORY,
  );
  const researchLifecycleStrategy = resolveRepositoryStrategy(
    process.env.RESEARCH_LIFECYCLE_REPOSITORY,
    process.env.TITLE_CARD_REPOSITORY,
  );
  const literatureStrategy = resolveRepositoryStrategy(
    process.env.RESEARCH_LIFECYCLE_REPOSITORY,
    process.env.TITLE_CARD_REPOSITORY,
  );
  const autoPullStrategy = resolveRepositoryStrategy(
    process.env.AUTO_PULL_REPOSITORY,
    process.env.TITLE_CARD_REPOSITORY,
    process.env.RESEARCH_LIFECYCLE_REPOSITORY,
  );
  const applicationSettingsStrategy = resolveRepositoryStrategy(
    process.env.APPLICATION_SETTINGS_REPOSITORY,
    process.env.TITLE_CARD_REPOSITORY,
    process.env.RESEARCH_LIFECYCLE_REPOSITORY,
  );

  return {
    researchLifecycleStrategy,
    literatureStrategy,
    autoPullStrategy,
    titleCardStrategy,
    applicationSettingsStrategy,
  };
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  const storeConfig = resolveTitleCardManagementStoreConfig();
  assertTitleCardManagementStoreCompatibility(storeConfig);

  const repository = createRepository(storeConfig.researchLifecycleStrategy);
  const literatureRepository = createLiteratureRepository(storeConfig.literatureStrategy);
  const autoPullRepository = createAutoPullRepository(storeConfig.autoPullStrategy);
  const applicationSettingsRepository = createApplicationSettingsRepository(storeConfig.applicationSettingsStrategy);
  const titleCardManagementRepository = createTitleCardManagementRepository(storeConfig.titleCardStrategy);
  const topicSelectionControlPlaneRepository = createTopicSelectionControlPlaneRepository(storeConfig.titleCardStrategy);
  const topicSelectionSearchResourceRepository = createTopicSelectionSearchResourceRepository(storeConfig.titleCardStrategy);
  const topicSelectionEvidenceMapRepository = createTopicSelectionEvidenceMapRepository(storeConfig.titleCardStrategy);
  const topicSelectionNeedValidationRepository = createTopicSelectionNeedValidationRepository(storeConfig.titleCardStrategy);
  const topicSelectionRecheckRiskMemoryRepository = createTopicSelectionRecheckRiskMemoryRepository(storeConfig.titleCardStrategy);
  const topicSelectionOfflineEvaluationReplayRepository = createTopicSelectionOfflineEvaluationReplayRepository(
    storeConfig.titleCardStrategy,
  );
  const topicSelectionV1bIntakeRepository = createTopicSelectionV1bIntakeRepository(storeConfig.titleCardStrategy);
  const topicSelectionV1bResearchSliceRepository = createTopicSelectionV1bResearchSliceRepository(storeConfig.titleCardStrategy);
  const topicSelectionV1bTopicQuestionRepository = createTopicSelectionV1bTopicQuestionRepository(storeConfig.titleCardStrategy);
  const topicSelectionV1bValueAssessmentRepository = createTopicSelectionV1bValueAssessmentRepository(storeConfig.titleCardStrategy);
  const topicSelectionV1bTopicPackageRepository = createTopicSelectionV1bTopicPackageRepository(
    storeConfig.titleCardStrategy,
    topicSelectionV1bValueAssessmentRepository,
  );
  const topicSelectionV1cPromotionInputRepository = createTopicSelectionV1cPromotionInputRepository(
    storeConfig.titleCardStrategy,
  );
  const topicSelectionV1cPromotionGateRepository = createTopicSelectionV1cPromotionGateRepository(
    storeConfig.titleCardStrategy,
  );
  const topicSelectionV1cHumanPromotionDecisionRepository = createTopicSelectionV1cHumanPromotionDecisionRepository(
    storeConfig.titleCardStrategy,
  );
  const topicSelectionV1cPaperProjectBridgeRepository = createTopicSelectionV1cPaperProjectBridgeRepository(
    storeConfig.titleCardStrategy,
  );
  const topicSelectionV1cDownstreamFeedbackRecheckRepository = createTopicSelectionV1cDownstreamFeedbackRecheckRepository(
    storeConfig.titleCardStrategy,
  );
  const auditStore = new FileGovernanceDeliveryAuditStore({
    filePath: process.env.GOVERNANCE_DELIVERY_AUDIT_LOG_PATH,
  });
  const deliveryAdapter = createDeliveryAdapter();
  const researchLifecycleService = new ResearchLifecycleService(repository, {
    deliveryAdapter,
    deliveryAuditStore: auditStore,
  });
  const researchLifecycleController = new ResearchLifecycleController(researchLifecycleService);
  const paperProjectGateway: PaperProjectGateway = {
    createPaperProject: (input) => researchLifecycleService.createPaperProject(input),
    deletePaperProject: (paperId) => researchLifecycleService.deletePaperProject(paperId),
  };
  const titleCardManagementService = new TitleCardManagementService(titleCardManagementRepository, paperProjectGateway, {
    findLiteratureById: (literatureId) => literatureRepository.findLiteratureById(literatureId),
    listLiteratures: () => literatureRepository.listLiteratures(),
    listSourcesByLiteratureId: (literatureId) => literatureRepository.listSourcesByLiteratureId(literatureId),
    listPipelineStatesByLiteratureIds: (literatureIds) => literatureRepository.listPipelineStatesByLiteratureIds(literatureIds),
  });
  const titleCardManagementController = new TitleCardManagementController(titleCardManagementService);
  const topicSelectionControlPlaneService = new TopicSelectionControlPlaneService(topicSelectionControlPlaneRepository);
  const topicSelectionSearchResourceService = new TopicSelectionSearchResourceService(
    topicSelectionSearchResourceRepository,
    topicSelectionControlPlaneService,
    titleCardManagementRepository,
    literatureRepository,
  );
  const topicSelectionEvidenceMapService = new TopicSelectionEvidenceMapService(
    topicSelectionEvidenceMapRepository,
    topicSelectionControlPlaneService,
    topicSelectionSearchResourceRepository,
    literatureRepository,
  );
  const topicSelectionNeedValidationService = new TopicSelectionNeedValidationService(
    topicSelectionNeedValidationRepository,
    topicSelectionControlPlaneService,
    topicSelectionEvidenceMapService,
    topicSelectionSearchResourceService,
  );
  const topicSelectionRecheckRiskMemoryService = new TopicSelectionRecheckRiskMemoryService(
    topicSelectionRecheckRiskMemoryRepository,
    topicSelectionControlPlaneService,
    topicSelectionSearchResourceRepository,
    topicSelectionNeedValidationRepository,
  );
  const topicSelectionOfflineEvaluationReplayService = new TopicSelectionOfflineEvaluationReplayService(
    topicSelectionOfflineEvaluationReplayRepository,
  );
  const topicSelectionV1aController = new TopicSelectionV1aController(
    topicSelectionControlPlaneService,
    topicSelectionSearchResourceService,
    topicSelectionEvidenceMapService,
    topicSelectionNeedValidationService,
    topicSelectionRecheckRiskMemoryService,
    topicSelectionOfflineEvaluationReplayService,
  );
  const literatureContentProcessingSettingsService = new LiteratureContentProcessingSettingsService(applicationSettingsRepository);
  const llmGateway = new BackendLlmGateway({
    settingsService: literatureContentProcessingSettingsService,
  });
  const topicSelectionV1bLlmGateway = options.topicSelectionV1bLlmGateway ?? llmGateway;
  const topicSelectionV1cPromotionGateLlmGateway = options.topicSelectionV1cPromotionGateLlmGateway ?? llmGateway;
  const topicSelectionV1bIntakeService = new TopicSelectionV1bIntakeService(
    topicSelectionV1bIntakeRepository,
    topicSelectionControlPlaneService,
    topicSelectionNeedValidationRepository,
    topicSelectionEvidenceMapRepository,
    topicSelectionSearchResourceRepository,
    topicSelectionRecheckRiskMemoryRepository,
  );
  const topicSelectionV1bResearchSliceService = new TopicSelectionV1bResearchSliceService({
    repository: topicSelectionV1bResearchSliceRepository,
    intakeService: topicSelectionV1bIntakeService,
    controlPlaneService: topicSelectionControlPlaneService,
    llmGateway: topicSelectionV1bLlmGateway,
  });
  const topicSelectionV1bTopicQuestionService = new TopicSelectionV1bTopicQuestionService({
    repository: topicSelectionV1bTopicQuestionRepository,
    researchSliceService: topicSelectionV1bResearchSliceService,
    controlPlaneService: topicSelectionControlPlaneService,
    llmGateway: topicSelectionV1bLlmGateway,
  });
  const topicSelectionV1bValueAssessmentService = new TopicSelectionV1bValueAssessmentService({
    repository: topicSelectionV1bValueAssessmentRepository,
    topicQuestionService: topicSelectionV1bTopicQuestionService,
    researchSliceService: topicSelectionV1bResearchSliceService,
    controlPlaneService: topicSelectionControlPlaneService,
    llmGateway: topicSelectionV1bLlmGateway,
  });
  const topicSelectionV1bTopicPackageService = new TopicSelectionV1bTopicPackageService({
    repository: topicSelectionV1bTopicPackageRepository,
    valueAssessmentRepository: topicSelectionV1bValueAssessmentRepository,
  });
  const topicSelectionV1bController = new TopicSelectionV1bController(
    topicSelectionV1bIntakeService,
    topicSelectionV1bResearchSliceService,
    topicSelectionV1bTopicQuestionService,
    topicSelectionV1bValueAssessmentService,
    topicSelectionV1bTopicPackageService,
    topicSelectionOfflineEvaluationReplayService,
  );
  const topicSelectionV1cPromotionInputService = new TopicSelectionV1cPromotionInputService({
    repository: topicSelectionV1cPromotionInputRepository,
    topicPackageRepository: topicSelectionV1bTopicPackageRepository,
  });
  const topicSelectionV1cPromotionGateService = new TopicSelectionV1cPromotionGateService({
    repository: topicSelectionV1cPromotionGateRepository,
    promotionInputService: topicSelectionV1cPromotionInputService,
    llmGateway: topicSelectionV1cPromotionGateLlmGateway,
  });
  const topicSelectionV1cHumanPromotionDecisionService = new TopicSelectionV1cHumanPromotionDecisionService({
    repository: topicSelectionV1cHumanPromotionDecisionRepository,
    promotionGateService: topicSelectionV1cPromotionGateService,
  });
  const topicSelectionV1cPaperProjectBridgeService = new TopicSelectionV1cPaperProjectBridgeService({
    repository: topicSelectionV1cPaperProjectBridgeRepository,
    humanPromotionDecisionService: topicSelectionV1cHumanPromotionDecisionService,
  });
  const topicSelectionV1cDownstreamFeedbackRecheckService = new TopicSelectionV1cDownstreamFeedbackRecheckService({
    repository: topicSelectionV1cDownstreamFeedbackRecheckRepository,
    paperProjectBridgeService: topicSelectionV1cPaperProjectBridgeService,
    recheckRiskMemoryService: topicSelectionRecheckRiskMemoryService,
  });
  const topicSelectionV1cController = new TopicSelectionV1cController(
    topicSelectionV1cPromotionInputService,
    topicSelectionV1cPromotionGateService,
    topicSelectionV1cHumanPromotionDecisionService,
    topicSelectionV1cPaperProjectBridgeService,
    topicSelectionV1cDownstreamFeedbackRecheckService,
    topicSelectionOfflineEvaluationReplayService,
  );
  const literatureAcquisitionSettingsService = new LiteratureAcquisitionSettingsService(applicationSettingsRepository);
  const literatureAcquisitionSettingsController = new LiteratureAcquisitionSettingsController(
    literatureAcquisitionSettingsService,
  );
  const literatureContentProcessingSettingsController = new LiteratureContentProcessingSettingsController(
    literatureContentProcessingSettingsService,
  );
  const literatureFlowService = new LiteratureFlowService(
    literatureRepository,
    literatureContentProcessingSettingsService,
    llmGateway,
  );
  const literatureService = new LiteratureService(
    literatureRepository,
    repository,
    literatureContentProcessingSettingsService,
    {
      literatureFlowService,
      literatureAcquisitionSettingsService,
      llmGateway,
    },
  );
  const literatureClusterService = new LiteratureClusterService(literatureRepository);
  const literatureController = new LiteratureController(literatureService, literatureClusterService);
  const literatureBackfillService = new LiteratureBackfillService(literatureRepository, literatureFlowService, {
    resolvePreferredKeyContentMethod: () => literatureContentProcessingSettingsService.resolvePreferredKeyContentMethod(),
  });
  void literatureBackfillService.resumeRunnableJobs().catch((error) => {
    app.log.error({ err: error }, 'Failed to resume literature content-processing backfill jobs.');
  });
  const literatureBackfillController = new LiteratureBackfillController(literatureBackfillService);
  const literatureFulltextAcquisitionService = new LiteratureFulltextAcquisitionService(
    literatureRepository,
    literatureService,
    literatureAcquisitionSettingsService,
  );
  void literatureFulltextAcquisitionService.resumeRunnableJobs().catch((error) => {
    app.log.error({ err: error }, 'Failed to resume literature fulltext acquisition jobs.');
  });
  const literatureFulltextAcquisitionController = new LiteratureFulltextAcquisitionController(
    literatureFulltextAcquisitionService,
  );
  const autoPullService = new AutoPullService(
    autoPullRepository,
    literatureService,
    {
      contentProcessingSettingsService: literatureContentProcessingSettingsService,
      acquisitionSettingsService: literatureAcquisitionSettingsService,
      llmGateway,
      sourceRuntimeStore: literatureRepository,
    },
  );
  const autoPullController = new AutoPullController(autoPullService);
  const topicSettingsController = new TopicSettingsController(autoPullService);
  const autoPullScheduler = createAutoPullScheduler(autoPullService);

  app.setErrorHandler((error, _request, reply) => {
    if ('validation' in error) {
      const validationMessage = formatSchemaValidationMessage(error);
      reply.status(400).send({
        error: {
          code: 'INVALID_PAYLOAD',
          message: validationMessage,
          details: {
            validation: sanitizeSchemaValidation(error),
          },
        },
      });
      return;
    }

    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });

  app.get('/health', async () => ({ ok: true }));

  if (autoPullScheduler) {
    autoPullScheduler.start();
    app.addHook('onClose', async () => {
      await autoPullScheduler.stop();
    });
  }

  app.register(async (instance) => {
    await registerResearchLifecycleRoutes(instance, researchLifecycleController);
    await registerTitleCardManagementRoutes(instance, titleCardManagementController);
    await registerTopicSelectionV1aRoutes(instance, topicSelectionV1aController);
    await registerTopicSelectionV1bRoutes(instance, topicSelectionV1bController);
    await registerTopicSelectionV1cRoutes(instance, topicSelectionV1cController);
    await registerLiteratureAcquisitionSettingsRoutes(instance, literatureAcquisitionSettingsController);
    await registerLiteratureContentProcessingSettingsRoutes(instance, literatureContentProcessingSettingsController);
    await registerLiteratureBackfillRoutes(instance, literatureBackfillController);
    await registerLiteratureFulltextAcquisitionRoutes(instance, literatureFulltextAcquisitionController);
    await registerLiteratureRoutes(instance, literatureController);
    await registerTopicSettingsRoutes(instance, topicSettingsController);
    await registerAutoPullRoutes(instance, autoPullController);
  });

  return app;
}

function createRepository(strategy: RepositoryStrategy): ResearchLifecycleRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaResearchLifecycleRepository(prisma);
  }

  return new InMemoryResearchLifecycleRepository();
}

function formatSchemaValidationMessage(error: unknown): string {
  const baseMessage = error instanceof Error ? error.message : 'Request payload failed schema validation.';
  const validation = readValidationEntries(error);
  const hasKeyContentProvenanceError = validation.some((entry) =>
    readString(entry.instancePath).endsWith('/provenance')
    && readString(entry.schemaPath).includes('/provenance'));
  if (hasKeyContentProvenanceError) {
    return [
      'Invalid key-content item provenance.',
      'Use item-level provenance "model_generated" or "user_edited";',
      'use request.curation_source "codex_curated" or "manual_curated" to identify who curated the dossier.',
    ].join(' ');
  }
  return baseMessage;
}

function sanitizeSchemaValidation(error: unknown): Array<Record<string, unknown>> {
  return readValidationEntries(error).slice(0, 20).map((entry) => ({
    instance_path: readString(entry.instancePath),
    schema_path: readString(entry.schemaPath),
    keyword: readString(entry.keyword),
    message: readString(entry.message),
    params: isRecord(entry.params) ? entry.params : {},
  }));
}

function readValidationEntries(error: unknown): Array<Record<string, unknown>> {
  if (!isRecord(error) || !Array.isArray(error.validation)) {
    return [];
  }
  return error.validation.filter(isRecord);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function createLiteratureRepository(strategy: RepositoryStrategy): LiteratureRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaLiteratureRepository(prisma);
  }

  return new InMemoryLiteratureRepository();
}

function createAutoPullRepository(strategy: RepositoryStrategy): AutoPullRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaAutoPullRepository(prisma);
  }

  return new InMemoryAutoPullRepository();
}

function createApplicationSettingsRepository(strategy: RepositoryStrategy): ApplicationSettingsRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaApplicationSettingsRepository(prisma);
  }

  return new InMemoryApplicationSettingsRepository();
}

function createTitleCardManagementRepository(strategy: RepositoryStrategy): TitleCardManagementRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTitleCardManagementRepository(prisma);
  }

  return new InMemoryTitleCardManagementRepository();
}

function createTopicSelectionControlPlaneRepository(
  strategy: RepositoryStrategy,
): TopicSelectionControlPlaneRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionControlPlaneRepository(prisma);
  }

  return new InMemoryTopicSelectionControlPlaneRepository();
}

function createTopicSelectionSearchResourceRepository(
  strategy: RepositoryStrategy,
): TopicSelectionSearchResourceRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionSearchResourceRepository(prisma);
  }

  return new InMemoryTopicSelectionSearchResourceRepository();
}

function createTopicSelectionEvidenceMapRepository(strategy: RepositoryStrategy): TopicSelectionEvidenceMapRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionEvidenceMapRepository(prisma);
  }

  return new InMemoryTopicSelectionEvidenceMapRepository();
}

function createTopicSelectionNeedValidationRepository(
  strategy: RepositoryStrategy,
): TopicSelectionNeedValidationRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionNeedValidationRepository(prisma);
  }

  return new InMemoryTopicSelectionNeedValidationRepository();
}

function createTopicSelectionRecheckRiskMemoryRepository(
  strategy: RepositoryStrategy,
): TopicSelectionRecheckRiskMemoryRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionRecheckRiskMemoryRepository(prisma);
  }

  return new InMemoryTopicSelectionRecheckRiskMemoryRepository();
}

function createTopicSelectionOfflineEvaluationReplayRepository(
  strategy: RepositoryStrategy,
): TopicSelectionOfflineEvaluationReplayRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionOfflineEvaluationReplayRepository(prisma);
  }

  return new InMemoryTopicSelectionOfflineEvaluationReplayRepository();
}

function createTopicSelectionV1bIntakeRepository(strategy: RepositoryStrategy): TopicSelectionV1bIntakeRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1bIntakeRepository(prisma);
  }

  return new InMemoryTopicSelectionV1bIntakeRepository();
}

function createTopicSelectionV1bResearchSliceRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1bResearchSliceRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1bResearchSliceRepository(prisma);
  }

  return new InMemoryTopicSelectionV1bResearchSliceRepository();
}

function createTopicSelectionV1bTopicQuestionRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1bTopicQuestionRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1bTopicQuestionRepository(prisma);
  }

  return new InMemoryTopicSelectionV1bTopicQuestionRepository();
}

function createTopicSelectionV1bValueAssessmentRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1bValueAssessmentRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1bValueAssessmentRepository(prisma);
  }

  return new InMemoryTopicSelectionV1bValueAssessmentRepository();
}

function createTopicSelectionV1bTopicPackageRepository(
  strategy: RepositoryStrategy,
  valueAssessmentRepository: TopicSelectionV1bValueAssessmentRepository,
): TopicSelectionV1bTopicPackageRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1bTopicPackageRepository(prisma);
  }

  return new InMemoryTopicSelectionV1bTopicPackageRepository(valueAssessmentRepository);
}

function createTopicSelectionV1cPromotionInputRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1cPromotionInputRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1cPromotionInputRepository(prisma);
  }

  return new InMemoryTopicSelectionV1cPromotionInputRepository();
}

function createTopicSelectionV1cPromotionGateRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1cPromotionGateRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1cPromotionGateRepository(prisma);
  }

  return new InMemoryTopicSelectionV1cPromotionGateRepository();
}

function createTopicSelectionV1cHumanPromotionDecisionRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1cHumanPromotionDecisionRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1cHumanPromotionDecisionRepository(prisma);
  }

  return new InMemoryTopicSelectionV1cHumanPromotionDecisionRepository();
}

function createTopicSelectionV1cPaperProjectBridgeRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1cPaperProjectBridgeRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1cPaperProjectBridgeRepository(prisma);
  }

  return new InMemoryTopicSelectionV1cPaperProjectBridgeRepository();
}

function createTopicSelectionV1cDownstreamFeedbackRecheckRepository(
  strategy: RepositoryStrategy,
): TopicSelectionV1cDownstreamFeedbackRecheckRepository {
  if (strategy === 'prisma') {
    const prisma = getPrismaClient();
    return new PrismaTopicSelectionV1cDownstreamFeedbackRecheckRepository(prisma);
  }

  return new InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository();
}

function createAutoPullScheduler(service: AutoPullService): AutoPullScheduler | null {
  const enabled = process.env.AUTO_PULL_SCHEDULER_ENABLED ?? 'true';
  const normalized = enabled.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return null;
  }

  const tickMsRaw = process.env.AUTO_PULL_SCHEDULER_TICK_MS;
  const tickMs = tickMsRaw ? Number.parseInt(tickMsRaw, 10) : undefined;
  return new AutoPullScheduler(service, { tickMs });
}

function createDeliveryAdapter():
  | InProcessGovernanceEventDeliveryAdapter
  | DurableOutboxGovernanceEventDeliveryAdapter {
  const mode = process.env.GOVERNANCE_DELIVERY_MODE ?? 'in-process';
  if (mode === 'durable-outbox') {
    const outboxStore = new FileGovernanceDeliveryOutboxStore({
      filePath: process.env.GOVERNANCE_OUTBOX_LOG_PATH,
    });
    return new DurableOutboxGovernanceEventDeliveryAdapter(outboxStore);
  }
  return new InProcessGovernanceEventDeliveryAdapter();
}

function resolveRepositoryStrategy(...candidates: Array<string | undefined>): RepositoryStrategy {
  const raw = candidates.find((candidate) => candidate !== undefined);
  if (!raw) {
    return 'memory';
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'memory' || normalized === 'prisma') {
    return normalized;
  }

  throw new Error(`Unsupported repository strategy "${raw}". Expected "memory" or "prisma".`);
}

function assertTitleCardManagementStoreCompatibility(config: {
  researchLifecycleStrategy: RepositoryStrategy;
  literatureStrategy: RepositoryStrategy;
  autoPullStrategy: RepositoryStrategy;
  titleCardStrategy: RepositoryStrategy;
  applicationSettingsStrategy: RepositoryStrategy;
}) {
  if (config.titleCardStrategy !== 'prisma') {
    return;
  }

  if (
    config.titleCardStrategy !== config.researchLifecycleStrategy
    || config.titleCardStrategy !== config.literatureStrategy
    || config.titleCardStrategy !== config.autoPullStrategy
    || config.titleCardStrategy !== config.applicationSettingsStrategy
  ) {
    throw new Error(
      'When title-card management uses Prisma, TITLE_CARD_REPOSITORY, RESEARCH_LIFECYCLE_REPOSITORY, AUTO_PULL_REPOSITORY, and APPLICATION_SETTINGS_REPOSITORY must resolve to the same strategy.',
    );
  }
}
