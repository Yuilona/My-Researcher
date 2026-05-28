import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ExperimentFoundationPromotionDecisionRequest,
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import {
  decideExperimentFoundationPromotion,
  listExperimentFoundationRecords,
} from './api';
import type {
  ExperimentFoundationOperationStatus,
  ExperimentFoundationPanelKey,
  RecordListFilters,
} from './types';
import {
  defaultPromotionDecisionJson,
  parseJsonObject,
  prettyJson,
  promotionCandidateRecordKinds,
  recordToRef,
  toErrorMessage,
} from './utils';

const blankRecordFilterFields = {
  status: '',
  family: '',
  parentRecordId: '',
  ownerRefId: '',
};

const initialCandidateFilters: RecordListFilters = {
  recordKind: 'dataset_asset_candidate',
  ...blankRecordFilterFields,
};

export type UseExperimentFoundationControllerArgs = {
  activePanel: ExperimentFoundationPanelKey;
  setActivePanel: (panel: ExperimentFoundationPanelKey) => void;
  // S2 deep-link bridges: ReadinessInspector and ExperimentFlow live above the
  // controller (App / module), so the controller cannot reach them via local
  // state. The parent passes these callbacks; goTo* deep-links from the
  // Overview panel call them instead of switching to legacy tabs.
  onOpenReadinessInspector: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
  onRequestFlowJobPreselect: (externalJobId: string) => void;
};

export function useExperimentFoundationController({
  activePanel,
  setActivePanel,
  onOpenReadinessInspector,
  onRequestFlowJobPreselect,
}: UseExperimentFoundationControllerArgs) {
  // Only Promotion still consumes the shared record list. Other panels (Asset
  // Library, Experiment Flow, Overview, Readiness Inspector) own their own
  // fetch state.
  const [candidateFilters, setCandidateFilters] = useState<RecordListFilters>(initialCandidateFilters);
  const [recordStatus, setRecordStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [recordError, setRecordError] = useState<string | null>(null);
  const [records, setRecords] = useState<ExperimentFoundationStoredRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExperimentFoundationStoredRecord | null>(null);

  const [promotionCandidateId, setPromotionCandidateId] = useState<string>('');
  const [promotionPayload, setPromotionPayload] = useState<string>(defaultPromotionDecisionJson);
  const [promotionStatus, setPromotionStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [promotionMessage, setPromotionMessage] = useState<string>('');

  const selectedRecordRef = useMemo(
    () => (selectedRecord ? recordToRef(selectedRecord) : null),
    [selectedRecord],
  );

  // Cleanup-on-panel-change: keep the Promotion editor scoped state from
  // leaking across panel switches. Deep-link helpers raise the skip ref so
  // their explicit overrides survive (see S2 post-review note).
  const skipNextPanelCleanupRef = useRef<boolean>(false);
  const previousPanelRef = useRef<ExperimentFoundationPanelKey>(activePanel);
  useEffect(() => {
    if (previousPanelRef.current === activePanel) {
      return;
    }
    previousPanelRef.current = activePanel;
    if (skipNextPanelCleanupRef.current) {
      skipNextPanelCleanupRef.current = false;
      return;
    }
    setSelectedRecord(null);
  }, [activePanel]);

  const goToReadiness = useCallback(
    (targetKind: ExperimentFoundationRecordKind, targetId: string) => {
      // Readiness deep-links now open the inspector instead of switching to a
      // panel. No activePanel change.
      onOpenReadinessInspector(targetKind, targetId);
    },
    [onOpenReadinessInspector],
  );

  const goToPromotion = useCallback(
    (candidateKind: ExperimentFoundationRecordKind, candidateId: string) => {
      skipNextPanelCleanupRef.current = true;
      setActivePanel('promotion');
      setSelectedRecord(null);
      if ((promotionCandidateRecordKinds as readonly string[]).includes(candidateKind)) {
        setCandidateFilters((current) => ({ ...current, recordKind: candidateKind }));
      }
      setPromotionCandidateId(candidateId);
    },
    [setActivePanel],
  );

  const goToJob = useCallback(
    (externalJobId: string) => {
      // Flow controller owns job selection; ask App to preselect and switch
      // tab.
      onRequestFlowJobPreselect(externalJobId);
      setActivePanel('flow');
    },
    [onRequestFlowJobPreselect, setActivePanel],
  );

  const loadRecords = useCallback(async () => {
    setRecordStatus('loading');
    setRecordError(null);
    try {
      const response = await listExperimentFoundationRecords(candidateFilters);
      setRecords(response.records);
      setRecordStatus('success');
      setSelectedRecord((current) => {
        if (!current) {
          return response.records[0] ?? null;
        }
        return (
          response.records.find(
            (record) => record.record_kind === current.record_kind && record.record_id === current.record_id,
          ) ?? response.records[0] ?? null
        );
      });
    } catch (caught) {
      setRecordStatus('error');
      setRecordError(toErrorMessage(caught));
    }
  }, [candidateFilters]);

  useEffect(() => {
    if (activePanel !== 'promotion') {
      return;
    }
    void loadRecords();
  }, [activePanel, loadRecords]);

  const selectRecord = useCallback((record: ExperimentFoundationStoredRecord) => {
    setSelectedRecord(record);
    if (record.record_kind.endsWith('_candidate')) {
      setPromotionCandidateId(record.record_id);
    }
  }, []);

  const decidePromotion = useCallback(async () => {
    setPromotionStatus('loading');
    setPromotionMessage('');
    try {
      const trimmedCandidateId = promotionCandidateId.trim();
      if (!trimmedCandidateId) {
        throw new Error('candidate_id is required.');
      }
      const payload = parseJsonObject(promotionPayload) as unknown as ExperimentFoundationPromotionDecisionRequest;
      const response = await decideExperimentFoundationPromotion(trimmedCandidateId, payload);
      setPromotionStatus('success');
      setPromotionMessage(
        `result ${response.promotion_result_record.record_id}; candidate ${response.candidate_record.status ?? '--'}`,
      );
      await loadRecords();
    } catch (caught) {
      setPromotionStatus('error');
      setPromotionMessage(toErrorMessage(caught));
    }
  }, [loadRecords, promotionCandidateId, promotionPayload]);

  // `prettyJson` is used by promotionPayload initialisation in utils; keep the
  // re-export indirect so future typed promotion forms can read the default.
  void prettyJson;

  return {
    candidateFilters,
    setCandidateFilters,
    records,
    selectedRecord,
    selectedRecordRef,
    selectRecord,
    recordStatus,
    recordError,
    loadRecords,
    promotionCandidateRecordKinds,
    promotionCandidateId,
    setPromotionCandidateId,
    promotionPayload,
    setPromotionPayload,
    promotionStatus,
    promotionMessage,
    decidePromotion,
    goToReadiness,
    goToPromotion,
    goToJob,
  };
}
