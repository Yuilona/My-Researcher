import type {
  ClaimCandidate,
  ImplementationDossier,
  PaperImplementationWritingEntryPacket,
  ResultInterpretationPacket,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-result-claim-dossier-contracts';

export interface PaperImplementationResultClaimDossierRepository {
  createResultInterpretationPacket(
    packet: ResultInterpretationPacket,
  ): Promise<ResultInterpretationPacket>;

  findResultInterpretationPacketById(
    implementationProjectId: string,
    resultInterpretationPacketId: string,
  ): Promise<ResultInterpretationPacket | null>;

  listResultInterpretationPackets(
    implementationProjectId: string,
  ): Promise<ResultInterpretationPacket[]>;

  createClaimCandidate(
    candidate: ClaimCandidate,
  ): Promise<ClaimCandidate>;

  findClaimCandidateById(
    implementationProjectId: string,
    claimCandidateId: string,
  ): Promise<ClaimCandidate | null>;

  listClaimCandidates(
    implementationProjectId: string,
  ): Promise<ClaimCandidate[]>;

  createImplementationDossier(
    dossier: ImplementationDossier,
  ): Promise<ImplementationDossier>;

  findImplementationDossierById(
    implementationProjectId: string,
    dossierId: string,
  ): Promise<ImplementationDossier | null>;

  listImplementationDossiers(
    implementationProjectId: string,
  ): Promise<ImplementationDossier[]>;

  createWritingEntryPacket(
    packet: PaperImplementationWritingEntryPacket,
  ): Promise<PaperImplementationWritingEntryPacket>;

  listWritingEntryPackets(
    implementationProjectId: string,
  ): Promise<PaperImplementationWritingEntryPacket[]>;
}
