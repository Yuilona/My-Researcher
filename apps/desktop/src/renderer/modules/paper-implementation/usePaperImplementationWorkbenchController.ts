import { useCallback, useMemo, useState } from 'react';
import type {
  BootstrapImplementationProjectResponse,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-contracts';
import type {
  ApplyMotivePortfolioDecisionRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/paper-implementation-motive-contracts';
import type {
  PaperImplementationWorkbenchReadModels,
} from './api';
import {
  applyMotivePortfolioDecision,
  bootstrapImplementationProject,
  createEmptyPaperImplementationReadModels,
  dispatchValidationUpstreamFeedbackCandidate,
  getImplementationProject,
  getImplementationProjectByBridge,
  loadPaperImplementationReadModels,
  resolveDecisionWorkQueueItem,
  resolveTraceRepairQueueItem,
} from './api';
import type {
  PaperImplementationActionStatus,
  PaperImplementationLoadStatus,
  PaperImplementationQueueItem,
  PaperImplementationWorkbenchSnapshot,
} from './types';
import {
  buildPaperImplementationQueue,
  parseJsonObject,
  toErrorMessage,
} from './utils';

const defaultPortfolioDecisionPayload = [
  '{',
  '  "motive_roles_after_decision": {',
  '    "primary_motive_ids": [],',
  '    "secondary_motive_ids": [],',
  '    "fallback_motive_ids": [],',
  '    "supporting_motive_ids": [],',
  '    "parked_motive_ids": [],',
  '    "abandoned_motive_ids": []',
  '  },',
  '  "changes": {',
  '    "promoted_to_primary": [],',
  '    "demoted_from_primary": [],',
  '    "merged_motives": [],',
  '    "split_motives": [],',
  '    "newly_parked": [],',
  '    "newly_abandoned": []',
  '  },',
  '  "rationale": {},',
  '  "proposed_by": "human",',
  '  "confirmed_by": "human",',
  '  "confirmation_level": "human_confirmed"',
  '}',
].join('\n');

export function usePaperImplementationWorkbenchController() {
  const [implementationProjectIdInput, setImplementationProjectIdInput] = useState<string>('');
  const [paperProjectBridgeIdInput, setPaperProjectBridgeIdInput] = useState<string>('');
  const [bridgePayloadHashInput, setBridgePayloadHashInput] = useState<string>('');
  const [projectResponse, setProjectResponse] = useState<BootstrapImplementationProjectResponse | null>(null);
  const [readModels, setReadModels] = useState<PaperImplementationWorkbenchReadModels>(
    () => createEmptyPaperImplementationReadModels(),
  );
  const [selectedQueueItemId, setSelectedQueueItemId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<PaperImplementationLoadStatus>('idle');
  const [readModelStatus, setReadModelStatus] = useState<PaperImplementationLoadStatus>('idle');
  const [projectError, setProjectError] = useState<string | null>(null);
  const [readModelError, setReadModelError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<PaperImplementationActionStatus>('idle');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [decisionResolutionNote, setDecisionResolutionNote] = useState<string>('');
  const [traceResolutionNote, setTraceResolutionNote] = useState<string>('');
  const [upstreamRequiredAction, setUpstreamRequiredAction] = useState<string>('');
  const [portfolioDecisionPayload, setPortfolioDecisionPayload] = useState<string>(defaultPortfolioDecisionPayload);

  const queueItems = useMemo(() => buildPaperImplementationQueue(readModels), [readModels]);
  const selectedQueueItem = useMemo<PaperImplementationQueueItem | null>(() => {
    if (!selectedQueueItemId) {
      return queueItems[0] ?? null;
    }
    return queueItems.find((item) => item.itemId === selectedQueueItemId) ?? queueItems[0] ?? null;
  }, [queueItems, selectedQueueItemId]);
  const activeImplementationProjectId = projectResponse?.implementation_project.implementation_project_id ?? '';
  const snapshot = useMemo<PaperImplementationWorkbenchSnapshot>(
    () => ({ projectResponse, readModels }),
    [projectResponse, readModels],
  );

  const refreshReadModels = useCallback(async (implementationProjectId: string) => {
    const normalizedProjectId = implementationProjectId.trim();
    if (!normalizedProjectId) {
      setReadModels(createEmptyPaperImplementationReadModels());
      setReadModelStatus('idle');
      return;
    }

    setReadModelStatus('loading');
    setReadModelError(null);
    try {
      const loaded = await loadPaperImplementationReadModels(normalizedProjectId);
      setReadModels(loaded);
      setReadModelStatus('ready');
      setSelectedQueueItemId((current) => {
        const nextQueue = buildPaperImplementationQueue(loaded);
        if (current && nextQueue.some((item) => item.itemId === current)) {
          return current;
        }
        return nextQueue[0]?.itemId ?? null;
      });
    } catch (error) {
      setReadModels(createEmptyPaperImplementationReadModels());
      setReadModelStatus('error');
      setReadModelError(toErrorMessage(error));
    }
  }, []);

  const adoptProjectResponse = useCallback(async (response: BootstrapImplementationProjectResponse) => {
    const projectId = response.implementation_project.implementation_project_id;
    setProjectResponse(response);
    setImplementationProjectIdInput(projectId);
    setPaperProjectBridgeIdInput(response.implementation_project.paper_project_bridge_id);
    setBridgePayloadHashInput(response.implementation_project.bridge_payload_hash);
    await refreshReadModels(projectId);
  }, [refreshReadModels]);

  const loadByProjectId = useCallback(async () => {
    const normalizedProjectId = implementationProjectIdInput.trim();
    if (!normalizedProjectId) {
      setProjectStatus('error');
      setProjectError('ImplementationProject ID 不能为空。');
      return;
    }

    setProjectStatus('loading');
    setProjectError(null);
    try {
      const response = await getImplementationProject(normalizedProjectId);
      setProjectStatus('ready');
      setActionMessage(`已加载 ${response.implementation_project.implementation_project_id}`);
      await adoptProjectResponse(response);
    } catch (error) {
      setProjectStatus('error');
      setProjectError(toErrorMessage(error));
    }
  }, [adoptProjectResponse, implementationProjectIdInput]);

  const loadByBridgeId = useCallback(async () => {
    const normalizedBridgeId = paperProjectBridgeIdInput.trim();
    if (!normalizedBridgeId) {
      setProjectStatus('error');
      setProjectError('PaperProjectBridge ID 不能为空。');
      return;
    }

    setProjectStatus('loading');
    setProjectError(null);
    try {
      const response = await getImplementationProjectByBridge(normalizedBridgeId);
      setProjectStatus('ready');
      setActionMessage(`已通过 bridge 加载 ${response.implementation_project.implementation_project_id}`);
      await adoptProjectResponse(response);
    } catch (error) {
      setProjectStatus('error');
      setProjectError(toErrorMessage(error));
    }
  }, [adoptProjectResponse, paperProjectBridgeIdInput]);

  const bootstrapFromBridge = useCallback(async () => {
    const normalizedBridgeId = paperProjectBridgeIdInput.trim();
    const normalizedBridgeHash = bridgePayloadHashInput.trim();
    if (!normalizedBridgeId || !normalizedBridgeHash) {
      setProjectStatus('error');
      setProjectError('PaperProjectBridge ID 和 bridge_payload_hash 均不能为空。');
      return;
    }

    setProjectStatus('loading');
    setProjectError(null);
    try {
      const response = await bootstrapImplementationProject({
        paper_project_bridge_id: normalizedBridgeId,
        bridge_payload_hash: normalizedBridgeHash,
        created_by: 'human',
      });
      setProjectStatus('ready');
      setActionMessage(response.project_created ? '已创建 ImplementationProject。' : '已返回既有 ImplementationProject。');
      await adoptProjectResponse(response);
    } catch (error) {
      setProjectStatus('error');
      setProjectError(toErrorMessage(error));
    }
  }, [adoptProjectResponse, bridgePayloadHashInput, paperProjectBridgeIdInput]);

  const reload = useCallback(async () => {
    if (!activeImplementationProjectId) {
      await loadByProjectId();
      return;
    }
    await refreshReadModels(activeImplementationProjectId);
  }, [activeImplementationProjectId, loadByProjectId, refreshReadModels]);

  const resolveSelectedDecisionQueueItem = useCallback(async (status: 'resolved' | 'dismissed' | 'superseded') => {
    if (!activeImplementationProjectId || !selectedQueueItem || selectedQueueItem.source !== 'decision_work_queue') {
      return;
    }
    setActionStatus('loading');
    setActionMessage('');
    try {
      await resolveDecisionWorkQueueItem(
        activeImplementationProjectId,
        selectedQueueItem.itemId,
        {
          status,
          resolution_note: decisionResolutionNote.trim() || null,
          resolved_by: 'human',
        },
      );
      setActionStatus('success');
      setActionMessage(`decision queue item 已${status}。`);
      setDecisionResolutionNote('');
      await refreshReadModels(activeImplementationProjectId);
    } catch (error) {
      setActionStatus('error');
      setActionMessage(toErrorMessage(error));
    }
  }, [
    activeImplementationProjectId,
    decisionResolutionNote,
    refreshReadModels,
    selectedQueueItem,
  ]);

  const resolveSelectedTraceRepairItem = useCallback(async () => {
    if (!activeImplementationProjectId || !selectedQueueItem || selectedQueueItem.source !== 'trace_repair_queue') {
      return;
    }
    setActionStatus('loading');
    setActionMessage('');
    try {
      await resolveTraceRepairQueueItem(
        activeImplementationProjectId,
        selectedQueueItem.itemId,
        {
          resolution_note: traceResolutionNote.trim() || null,
          resolved_by: 'human',
        },
      );
      setActionStatus('success');
      setActionMessage('trace repair queue item 已提交 resolve 命令。');
      setTraceResolutionNote('');
      await refreshReadModels(activeImplementationProjectId);
    } catch (error) {
      setActionStatus('error');
      setActionMessage(toErrorMessage(error));
    }
  }, [
    activeImplementationProjectId,
    refreshReadModels,
    selectedQueueItem,
    traceResolutionNote,
  ]);

  const dispatchSelectedUpstreamFeedbackCandidate = useCallback(async () => {
    if (!activeImplementationProjectId || !selectedQueueItem || selectedQueueItem.source !== 'upstream_feedback') {
      return;
    }
    setActionStatus('loading');
    setActionMessage('');
    try {
      await dispatchValidationUpstreamFeedbackCandidate(
        activeImplementationProjectId,
        selectedQueueItem.itemId,
        {
          required_action: upstreamRequiredAction.trim() || null,
          created_by: 'human',
        },
      );
      setActionStatus('success');
      setActionMessage('upstream feedback candidate 已通过 T-093 feedback event dispatch。');
      setUpstreamRequiredAction('');
      await refreshReadModels(activeImplementationProjectId);
    } catch (error) {
      setActionStatus('error');
      setActionMessage(toErrorMessage(error));
    }
  }, [
    activeImplementationProjectId,
    refreshReadModels,
    selectedQueueItem,
    upstreamRequiredAction,
  ]);

  const submitPortfolioDecision = useCallback(async () => {
    if (!activeImplementationProjectId) {
      setActionStatus('error');
      setActionMessage('请先加载 ImplementationProject。');
      return;
    }

    setActionStatus('loading');
    setActionMessage('');
    try {
      const payload = parseJsonObject(portfolioDecisionPayload) as unknown as ApplyMotivePortfolioDecisionRequest;
      await applyMotivePortfolioDecision(activeImplementationProjectId, payload);
      setActionStatus('success');
      setActionMessage('portfolio decision 已提交后端 StateWriter 路径。');
      await refreshReadModels(activeImplementationProjectId);
    } catch (error) {
      setActionStatus('error');
      setActionMessage(toErrorMessage(error));
    }
  }, [
    activeImplementationProjectId,
    portfolioDecisionPayload,
    refreshReadModels,
  ]);

  return {
    implementationProjectIdInput,
    setImplementationProjectIdInput,
    paperProjectBridgeIdInput,
    setPaperProjectBridgeIdInput,
    bridgePayloadHashInput,
    setBridgePayloadHashInput,
    projectResponse,
    snapshot,
    readModels,
    queueItems,
    selectedQueueItem,
    selectedQueueItemId,
    setSelectedQueueItemId,
    projectStatus,
    readModelStatus,
    projectError,
    readModelError,
    actionStatus,
    actionMessage,
    decisionResolutionNote,
    setDecisionResolutionNote,
    traceResolutionNote,
    setTraceResolutionNote,
    upstreamRequiredAction,
    setUpstreamRequiredAction,
    portfolioDecisionPayload,
    setPortfolioDecisionPayload,
    loadByProjectId,
    loadByBridgeId,
    bootstrapFromBridge,
    reload,
    resolveSelectedDecisionQueueItem,
    resolveSelectedTraceRepairItem,
    dispatchSelectedUpstreamFeedbackCandidate,
    submitPortfolioDecision,
  };
}
