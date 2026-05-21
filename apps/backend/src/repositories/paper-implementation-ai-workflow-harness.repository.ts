import type {
  AgentWorkflowHarnessRun,
  AgentWorkflowHarnessSpec,
  CreateAgentWorkflowHarnessRunResponse,
  DecisionWorkQueueItem,
  ImplementationHarness,
  ImplementationInputSnapshot,
  ImplementationProposalArtifact,
  ResolveDecisionWorkQueueItemRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-ai-workflow-harness-contracts';

export type AgentWorkflowHarnessRunPersistence = CreateAgentWorkflowHarnessRunResponse & {
  spec: AgentWorkflowHarnessSpec;
};

export interface PaperImplementationAiWorkflowHarnessRepository {
  createHarness(
    harness: ImplementationHarness,
  ): Promise<ImplementationHarness>;

  findHarnessById(
    implementationProjectId: string,
    harnessId: string,
  ): Promise<ImplementationHarness | null>;

  listHarnesses(
    implementationProjectId: string,
  ): Promise<ImplementationHarness[]>;

  createInputSnapshot(
    snapshot: ImplementationInputSnapshot,
  ): Promise<ImplementationInputSnapshot>;

  findInputSnapshotById(
    implementationProjectId: string,
    inputSnapshotId: string,
  ): Promise<ImplementationInputSnapshot | null>;

  listInputSnapshots(
    implementationProjectId: string,
  ): Promise<ImplementationInputSnapshot[]>;

  createAgentWorkflowHarnessRun(
    persistence: AgentWorkflowHarnessRunPersistence,
  ): Promise<CreateAgentWorkflowHarnessRunResponse>;

  listAgentWorkflowHarnessRuns(
    implementationProjectId: string,
  ): Promise<AgentWorkflowHarnessRun[]>;

  listProposalArtifacts(
    implementationProjectId: string,
  ): Promise<ImplementationProposalArtifact[]>;

  listDecisionWorkQueueItems(
    implementationProjectId: string,
  ): Promise<DecisionWorkQueueItem[]>;

  resolveDecisionWorkQueueItem(
    implementationProjectId: string,
    queueItemId: string,
    resolution: ResolveDecisionWorkQueueItemRequest & { resolved_at: string },
  ): Promise<DecisionWorkQueueItem>;
}
