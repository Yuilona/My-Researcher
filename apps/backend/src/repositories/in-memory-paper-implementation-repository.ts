import type {
  ImplementationFeedbackEvent,
  ImplementationIntakeSnapshot,
  ImplementationProject,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  PaperImplementationBootstrapPersistence,
  PaperImplementationBootstrapResult,
  PaperImplementationRepository,
} from './paper-implementation.repository.js';
import { AppError } from '../errors/app-error.js';

export class InMemoryPaperImplementationRepository
implements PaperImplementationRepository {
  private readonly projects = new Map<string, ImplementationProject>();
  private readonly projectIdsByBridgeId = new Map<string, string>();
  private readonly intakeSnapshots = new Map<string, ImplementationIntakeSnapshot>();
  private readonly intakeSnapshotIdsByProjectId = new Map<string, string>();
  private readonly feedbackEvents = new Map<string, ImplementationFeedbackEvent>();

  async createBootstrap(
    persistence: PaperImplementationBootstrapPersistence,
  ): Promise<PaperImplementationBootstrapResult> {
    const project = structuredClone(persistence.implementation_project);
    const snapshot = structuredClone(persistence.intake_snapshot);

    const existingProjectId = this.projectIdsByBridgeId.get(project.paper_project_bridge_id);
    if (existingProjectId) {
      const existingProject = this.projects.get(existingProjectId);
      const existingSnapshotId = this.intakeSnapshotIdsByProjectId.get(existingProjectId);
      const existingSnapshot = existingSnapshotId
        ? this.intakeSnapshots.get(existingSnapshotId)
        : undefined;
      if (!existingProject || !existingSnapshot) {
        throw new AppError(
          409,
          'GATE_CONSTRAINT_FAILED',
          `ImplementationProject ${existingProjectId} is missing its intake snapshot.`,
        );
      }
      if (existingProject.bridge_payload_hash !== project.bridge_payload_hash) {
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          `ImplementationProject ${existingProject.implementation_project_id} already admits PaperProjectBridge ${project.paper_project_bridge_id} at a different bridge_payload_hash.`,
          {
            implementation_project_id: existingProject.implementation_project_id,
            admitted_bridge_payload_hash: existingProject.bridge_payload_hash,
            requested_bridge_payload_hash: project.bridge_payload_hash,
          },
        );
      }
      return {
        implementation_project: structuredClone(existingProject),
        intake_snapshot: structuredClone(existingSnapshot),
        created: false,
      };
    }

    if (
      this.projects.has(project.implementation_project_id)
      || this.intakeSnapshots.has(snapshot.intake_snapshot_id)
      || this.intakeSnapshotIdsByProjectId.has(project.implementation_project_id)
    ) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Implementation bootstrap identifiers already exist for a different PaperProjectBridge admission.',
      );
    }

    this.projects.set(project.implementation_project_id, project);
    this.projectIdsByBridgeId.set(project.paper_project_bridge_id, project.implementation_project_id);
    this.intakeSnapshots.set(snapshot.intake_snapshot_id, snapshot);
    this.intakeSnapshotIdsByProjectId.set(project.implementation_project_id, snapshot.intake_snapshot_id);
    return {
      implementation_project: structuredClone(project),
      intake_snapshot: structuredClone(snapshot),
      created: true,
    };
  }

  async findProjectById(
    implementationProjectId: string,
  ): Promise<ImplementationProject | null> {
    const project = this.projects.get(implementationProjectId);
    return project ? structuredClone(project) : null;
  }

  async findProjectByBridgeId(
    paperProjectBridgeId: string,
  ): Promise<ImplementationProject | null> {
    const projectId = this.projectIdsByBridgeId.get(paperProjectBridgeId);
    if (!projectId) {
      return null;
    }
    return this.findProjectById(projectId);
  }

  async findIntakeSnapshotById(
    intakeSnapshotId: string,
  ): Promise<ImplementationIntakeSnapshot | null> {
    const snapshot = this.intakeSnapshots.get(intakeSnapshotId);
    return snapshot ? structuredClone(snapshot) : null;
  }

  async findIntakeSnapshotByProjectId(
    implementationProjectId: string,
  ): Promise<ImplementationIntakeSnapshot | null> {
    const snapshotId = this.intakeSnapshotIdsByProjectId.get(implementationProjectId);
    if (!snapshotId) {
      return null;
    }
    return this.findIntakeSnapshotById(snapshotId);
  }

  async createFeedbackEvent(
    event: ImplementationFeedbackEvent,
  ): Promise<ImplementationFeedbackEvent> {
    if (this.feedbackEvents.has(event.feedback_event_id)) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        `ImplementationFeedbackEvent ${event.feedback_event_id} already exists.`,
      );
    }
    const stored = structuredClone(event);
    this.feedbackEvents.set(stored.feedback_event_id, stored);
    return structuredClone(stored);
  }
}
