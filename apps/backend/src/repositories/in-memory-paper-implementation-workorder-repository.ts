import type {
  ResearchWorkOrder,
  ResearchWorkOrderHarnessRun,
  RunEvidenceUnit,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-workorder-contracts';

import { AppError } from '../errors/app-error.js';
import type {
  PaperImplementationWorkOrderRepository,
  RunMonitorIngestionPersistence,
} from './paper-implementation-workorder.repository.js';

export class InMemoryPaperImplementationWorkOrderRepository
implements PaperImplementationWorkOrderRepository {
  private readonly workOrders = new Map<string, ResearchWorkOrder>();
  private readonly workOrderIdsByProject = new Map<string, string[]>();
  private readonly harnessRuns = new Map<string, ResearchWorkOrderHarnessRun>();
  private readonly harnessRunIdsByWorkOrder = new Map<string, string[]>();
  private readonly monitorIntakes = new Map<string, RunMonitorIngestionPersistence['monitor_intake']>();
  private readonly runEvidenceUnits = new Map<string, RunEvidenceUnit>();
  private readonly runEvidenceUnitIdsByProject = new Map<string, string[]>();

  async createWorkOrder(workOrder: ResearchWorkOrder): Promise<ResearchWorkOrder> {
    this.assertNewId(this.workOrders, workOrder.work_order_id, 'ResearchWorkOrder');
    this.workOrders.set(workOrder.work_order_id, structuredClone(workOrder));
    this.pushId(
      this.workOrderIdsByProject,
      workOrder.implementation_project_id,
      workOrder.work_order_id,
    );
    return structuredClone(workOrder);
  }

  async findWorkOrderById(
    implementationProjectId: string,
    workOrderId: string,
  ): Promise<ResearchWorkOrder | null> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder || workOrder.implementation_project_id !== implementationProjectId) {
      return null;
    }
    return structuredClone(workOrder);
  }

  async listWorkOrders(
    implementationProjectId: string,
  ): Promise<ResearchWorkOrder[]> {
    return (this.workOrderIdsByProject.get(implementationProjectId) ?? [])
      .map((id) => this.workOrders.get(id))
      .filter((workOrder): workOrder is ResearchWorkOrder => Boolean(workOrder))
      .map((workOrder) => structuredClone(workOrder));
  }

  async updateWorkOrder(workOrder: ResearchWorkOrder): Promise<ResearchWorkOrder> {
    const existing = this.workOrders.get(workOrder.work_order_id);
    if (!existing || existing.implementation_project_id !== workOrder.implementation_project_id) {
      throw new AppError(404, 'NOT_FOUND', `ResearchWorkOrder ${workOrder.work_order_id} not found.`);
    }
    this.workOrders.set(workOrder.work_order_id, structuredClone(workOrder));
    return structuredClone(workOrder);
  }

  async createHarnessRun(
    harnessRun: ResearchWorkOrderHarnessRun,
    workOrder: ResearchWorkOrder,
  ): Promise<ResearchWorkOrderHarnessRun> {
    this.assertNewId(this.harnessRuns, harnessRun.harness_run_id, 'ResearchWorkOrderHarnessRun');
    this.harnessRuns.set(harnessRun.harness_run_id, structuredClone(harnessRun));
    this.pushId(this.harnessRunIdsByWorkOrder, harnessRun.work_order_id, harnessRun.harness_run_id);
    await this.updateWorkOrder(workOrder);
    return structuredClone(harnessRun);
  }

  async listHarnessRuns(
    implementationProjectId: string,
    workOrderId: string,
  ): Promise<ResearchWorkOrderHarnessRun[]> {
    return (this.harnessRunIdsByWorkOrder.get(workOrderId) ?? [])
      .map((id) => this.harnessRuns.get(id))
      .filter((run): run is ResearchWorkOrderHarnessRun => Boolean(run))
      .filter((run) => run.implementation_project_id === implementationProjectId)
      .map((run) => structuredClone(run));
  }

  async recordMonitorIngestion(
    persistence: RunMonitorIngestionPersistence,
  ): Promise<RunMonitorIngestionPersistence> {
    this.assertNewId(
      this.monitorIntakes,
      persistence.monitor_intake.monitor_intake_id,
      'RunMonitorIntakeRecord',
    );
    if (persistence.run_evidence_unit) {
      this.assertNewId(
        this.runEvidenceUnits,
        persistence.run_evidence_unit.run_evidence_unit_id,
        'RunEvidenceUnit',
      );
    }
    this.monitorIntakes.set(
      persistence.monitor_intake.monitor_intake_id,
      structuredClone(persistence.monitor_intake),
    );
    if (persistence.run_evidence_unit) {
      this.runEvidenceUnits.set(
        persistence.run_evidence_unit.run_evidence_unit_id,
        structuredClone(persistence.run_evidence_unit),
      );
      this.pushId(
        this.runEvidenceUnitIdsByProject,
        persistence.run_evidence_unit.implementation_project_id,
        persistence.run_evidence_unit.run_evidence_unit_id,
      );
    }
    if (persistence.work_order) {
      await this.updateWorkOrder(persistence.work_order);
    }
    return structuredClone(persistence);
  }

  async listRunEvidenceUnits(
    implementationProjectId: string,
  ): Promise<RunEvidenceUnit[]> {
    return (this.runEvidenceUnitIdsByProject.get(implementationProjectId) ?? [])
      .map((id) => this.runEvidenceUnits.get(id))
      .filter((unit): unit is RunEvidenceUnit => Boolean(unit))
      .map((unit) => structuredClone(unit));
  }

  async findRunEvidenceUnitById(
    implementationProjectId: string,
    runEvidenceUnitId: string,
  ): Promise<RunEvidenceUnit | null> {
    const unit = this.runEvidenceUnits.get(runEvidenceUnitId);
    if (!unit || unit.implementation_project_id !== implementationProjectId) {
      return null;
    }
    return structuredClone(unit);
  }

  private assertNewId<T>(map: Map<string, T>, id: string, label: string): void {
    if (map.has(id)) {
      throw new AppError(409, 'VERSION_CONFLICT', `${label} ${id} already exists.`);
    }
  }

  private pushId(map: Map<string, string[]>, key: string, id: string): void {
    const ids = map.get(key) ?? [];
    ids.push(id);
    map.set(key, ids);
  }
}
