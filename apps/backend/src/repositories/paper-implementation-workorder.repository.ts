import type {
  ResearchWorkOrder,
  ResearchWorkOrderHarnessRun,
  RunEvidenceUnit,
  RunMonitorIntakeRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-workorder-contracts';

export type RunMonitorIngestionPersistence = {
  monitor_intake: RunMonitorIntakeRecord;
  run_evidence_unit: RunEvidenceUnit | null;
  work_order: ResearchWorkOrder | null;
};

export interface PaperImplementationWorkOrderRepository {
  createWorkOrder(
    workOrder: ResearchWorkOrder,
  ): Promise<ResearchWorkOrder>;

  findWorkOrderById(
    implementationProjectId: string,
    workOrderId: string,
  ): Promise<ResearchWorkOrder | null>;

  listWorkOrders(
    implementationProjectId: string,
  ): Promise<ResearchWorkOrder[]>;

  updateWorkOrder(
    workOrder: ResearchWorkOrder,
  ): Promise<ResearchWorkOrder>;

  createHarnessRun(
    harnessRun: ResearchWorkOrderHarnessRun,
    workOrder: ResearchWorkOrder,
  ): Promise<ResearchWorkOrderHarnessRun>;

  listHarnessRuns(
    implementationProjectId: string,
    workOrderId: string,
  ): Promise<ResearchWorkOrderHarnessRun[]>;

  recordMonitorIngestion(
    persistence: RunMonitorIngestionPersistence,
  ): Promise<RunMonitorIngestionPersistence>;

  listRunEvidenceUnits(
    implementationProjectId: string,
  ): Promise<RunEvidenceUnit[]>;

  findRunEvidenceUnitById(
    implementationProjectId: string,
    runEvidenceUnitId: string,
  ): Promise<RunEvidenceUnit | null>;
}
