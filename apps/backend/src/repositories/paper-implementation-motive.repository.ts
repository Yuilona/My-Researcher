import type {
  CoreMotiveDraftResponse,
  CoreMotiveIdentity,
  CoreMotiveSet,
  CoreMotiveVersion,
  CoreMotiveVersionState,
  CrossBoardReview,
  EvidenceBinding,
  EvidenceTransferBinding,
  MotiveAssertion,
  MotiveEvidenceBoardVersion,
  MotiveEvolutionDecision,
  MotivePortfolioDecision,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-motive-contracts';

export type AdmitCoreMotiveVersionPersistence = {
  motive_identity: CoreMotiveIdentity;
  additional_motive_identities?: CoreMotiveIdentity[];
  motive_set: CoreMotiveSet;
  core_motive_version: CoreMotiveVersion;
  motive_version_state: CoreMotiveVersionState;
  portfolio_decision: MotivePortfolioDecision;
};

export type MotiveEvidenceBoardPersistence = {
  board_version: MotiveEvidenceBoardVersion;
  evidence_bindings: EvidenceBinding[];
  motive_version_state: CoreMotiveVersionState;
};

export type MotivePortfolioDecisionPersistence = {
  portfolio_decision: MotivePortfolioDecision;
  motive_set: CoreMotiveSet;
  motive_identities: CoreMotiveIdentity[];
};

export interface PaperImplementationMotiveRepository {
  createCoreMotiveDraft(
    draft: CoreMotiveDraftResponse,
  ): Promise<CoreMotiveDraftResponse>;

  findMotiveIdentityById(
    implementationProjectId: string,
    motiveId: string,
  ): Promise<CoreMotiveIdentity | null>;

  listMotiveIdentities(
    implementationProjectId: string,
  ): Promise<CoreMotiveIdentity[]>;

  findMotiveSet(
    implementationProjectId: string,
  ): Promise<CoreMotiveSet | null>;

  findCoreMotiveVersionById(
    implementationProjectId: string,
    coreMotiveVersionId: string,
  ): Promise<CoreMotiveVersion | null>;

  listCoreMotiveVersions(
    implementationProjectId: string,
    motiveId: string,
  ): Promise<CoreMotiveVersion[]>;

  findMotiveVersionStateByVersionId(
    implementationProjectId: string,
    coreMotiveVersionId: string,
  ): Promise<CoreMotiveVersionState | null>;

  listAssertionsByVersion(
    implementationProjectId: string,
    coreMotiveVersionId: string,
  ): Promise<MotiveAssertion[]>;

  admitCoreMotiveVersion(
    persistence: AdmitCoreMotiveVersionPersistence,
  ): Promise<AdmitCoreMotiveVersionPersistence>;

  createMotiveEvidenceBoardVersion(
    persistence: MotiveEvidenceBoardPersistence,
  ): Promise<MotiveEvidenceBoardPersistence>;

  listMotiveEvidenceBoards(
    implementationProjectId: string,
  ): Promise<MotiveEvidenceBoardVersion[]>;

  findMotiveEvidenceBoardById(
    implementationProjectId: string,
    boardVersionId: string,
  ): Promise<MotiveEvidenceBoardVersion | null>;

  findEvidenceBindingById(
    implementationProjectId: string,
    evidenceBindingId: string,
  ): Promise<EvidenceBinding | null>;

  createEvidenceTransferBinding(
    transfer: EvidenceTransferBinding,
  ): Promise<EvidenceTransferBinding>;

  listEvidenceTransferBindings(
    implementationProjectId: string,
  ): Promise<EvidenceTransferBinding[]>;

  createCrossBoardReview(
    review: CrossBoardReview,
  ): Promise<CrossBoardReview>;

  createMotivePortfolioDecision(
    persistence: MotivePortfolioDecisionPersistence,
  ): Promise<MotivePortfolioDecisionPersistence>;

  listMotivePortfolioDecisions(
    implementationProjectId: string,
  ): Promise<MotivePortfolioDecision[]>;

  createMotiveEvolutionDecision(
    decision: MotiveEvolutionDecision,
  ): Promise<MotiveEvolutionDecision>;

  findMotiveEvolutionDecisionById(
    implementationProjectId: string,
    motiveEvolutionDecisionId: string,
  ): Promise<MotiveEvolutionDecision | null>;
}
