import type {
  BootstrapImplementationProjectResponse,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  TopicSelectionFunctionalRef,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-control-plane-contracts';
import type {
  PaperImplementationWorkbenchReadModels,
} from './api';

export type PaperImplementationLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type PaperImplementationActionStatus = 'idle' | 'loading' | 'success' | 'error';

export type PaperImplementationQueueSource =
  | 'decision_work_queue'
  | 'trace_repair_queue'
  | 'validation_review'
  | 'upstream_feedback'
  | 'portfolio_decision'
  | 'failed_workflow'
  | 'failed_run'
  | 'accepted_risk_expiry'
  | 'claim_boundary'
  | 'dossier_readiness';

export type PaperImplementationQueueItem = {
  itemId: string;
  source: PaperImplementationQueueSource;
  type: string;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  summary: string;
  targetRef?: TopicSelectionFunctionalRef | null;
  sourceRefs: TopicSelectionFunctionalRef[];
  traceManifestId?: string | null;
  gateResultId?: string | null;
  blockers: string[];
  risks: string[];
  recommendedActions: string[];
  createdAt?: string | null;
  raw: unknown;
};

export type PaperImplementationWorkbenchSnapshot = {
  projectResponse: BootstrapImplementationProjectResponse | null;
  readModels: PaperImplementationWorkbenchReadModels;
};
