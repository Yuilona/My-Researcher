import type {
  ImplementationFeedbackEvent,
  ImplementationIntakeSnapshot,
  ImplementationProject,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';

export type PaperImplementationBootstrapPersistence = {
  intake_snapshot: ImplementationIntakeSnapshot;
  implementation_project: ImplementationProject;
};

export type PaperImplementationBootstrapResult =
  PaperImplementationBootstrapPersistence & {
    created: boolean;
  };

export interface PaperImplementationRepository {
  createBootstrap(
    persistence: PaperImplementationBootstrapPersistence,
  ): Promise<PaperImplementationBootstrapResult>;

  findProjectById(
    implementationProjectId: string,
  ): Promise<ImplementationProject | null>;

  findProjectByBridgeId(
    paperProjectBridgeId: string,
  ): Promise<ImplementationProject | null>;

  findIntakeSnapshotById(
    intakeSnapshotId: string,
  ): Promise<ImplementationIntakeSnapshot | null>;

  findIntakeSnapshotByProjectId(
    implementationProjectId: string,
  ): Promise<ImplementationIntakeSnapshot | null>;

  createFeedbackEvent(
    event: ImplementationFeedbackEvent,
  ): Promise<ImplementationFeedbackEvent>;
}
