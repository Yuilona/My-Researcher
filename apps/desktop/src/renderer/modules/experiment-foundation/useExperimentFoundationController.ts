import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CancelExternalTrainingJobRequest,
  CollectExternalTrainingJobRequest,
  ExperimentFoundationPromotionDecisionRequest,
  ExperimentFoundationReadinessCheckResponse,
  ExperimentFoundationRecordKind,
  ExperimentFoundationRef,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJob,
  SubmitExternalTrainingJobRequest,
  SyncExternalTrainingJobRequest,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import {
  cancelExperimentFoundationJob,
  checkExperimentFoundationReadiness,
  collectExperimentFoundationJob,
  createExperimentFoundationRecord,
  decideExperimentFoundationPromotion,
  getExperimentFoundationJob,
  getLatestExperimentFoundationReadiness,
  listExperimentFoundationJobs,
  listExperimentFoundationRecords,
  submitExperimentFoundationJob,
  syncExperimentFoundationJob,
  upsertExperimentFoundationRecord,
} from './api';
import type {
  ExperimentFoundationOperationStatus,
  ExperimentFoundationPanelKey,
  JobListFilters,
  RecordListFilters,
} from './types';
import {
  defaultCancelJobJson,
  defaultCollectJobJson,
  defaultPromotionDecisionJson,
  defaultSourceRefsJson,
  defaultSubmitJobJson,
  emptyObjectJson,
  evidenceRecordKinds,
  parseJsonArray,
  parseJsonObject,
  prettyJson,
  promotionCandidateRecordKinds,
  recipeRecordKinds,
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

const initialRecipeFilters: RecordListFilters = {
  recordKind: 'run_recipe',
  ...blankRecordFilterFields,
};

const initialEvidenceFilters: RecordListFilters = {
  recordKind: 'evidence_candidate',
  ...blankRecordFilterFields,
};

const initialJobFilters: JobListFilters = {
  adapterKind: '',
  status: '',
  trainingTaskSpecId: '',
  materializationResultId: '',
};

function parseSourceRefs(input: string): ExperimentFoundationRef[] {
  return parseJsonArray(input) as ExperimentFoundationRef[];
}

export type UseExperimentFoundationControllerArgs = {
  activePanel: ExperimentFoundationPanelKey;
  setActivePanel: (panel: ExperimentFoundationPanelKey) => void;
};

export function useExperimentFoundationController({
  activePanel,
  setActivePanel,
}: UseExperimentFoundationControllerArgs) {
  const [candidateFilters, setCandidateFilters] = useState<RecordListFilters>(initialCandidateFilters);
  const [recipeFilters, setRecipeFilters] = useState<RecordListFilters>(initialRecipeFilters);
  const [evidenceFilters, setEvidenceFilters] = useState<RecordListFilters>(initialEvidenceFilters);
  const [recordStatus, setRecordStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [recordError, setRecordError] = useState<string | null>(null);
  const [records, setRecords] = useState<ExperimentFoundationStoredRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExperimentFoundationStoredRecord | null>(null);
  const [recordEditorKind, setRecordEditorKind] = useState<ExperimentFoundationRecordKind>('dataset_asset');
  const [recordEditorId, setRecordEditorId] = useState<string>('');
  const [recordEditorPayload, setRecordEditorPayload] = useState<string>(emptyObjectJson);
  const [recordMutationStatus, setRecordMutationStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [recordMutationMessage, setRecordMutationMessage] = useState<string>('');

  const [readinessTargetKind, setReadinessTargetKind] = useState<ExperimentFoundationRecordKind>('dataset_asset');
  const [readinessTargetId, setReadinessTargetId] = useState<string>('');
  const [readinessCheckKind, setReadinessCheckKind] = useState<string>('');
  const [readinessSourceRefs, setReadinessSourceRefs] = useState<string>(defaultSourceRefsJson);
  const [readinessReport, setReadinessReport] = useState<ExperimentFoundationReadinessCheckResponse | null>(null);
  const [readinessStatus, setReadinessStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [readinessError, setReadinessError] = useState<string | null>(null);

  const [promotionCandidateId, setPromotionCandidateId] = useState<string>('');
  const [promotionPayload, setPromotionPayload] = useState<string>(defaultPromotionDecisionJson);
  const [promotionStatus, setPromotionStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [promotionMessage, setPromotionMessage] = useState<string>('');

  const [jobFilters, setJobFilters] = useState<JobListFilters>(initialJobFilters);
  const [jobStatus, setJobStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ExternalTrainingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ExternalTrainingJob | null>(null);
  const [submitJobPayload, setSubmitJobPayload] = useState<string>(defaultSubmitJobJson);
  const [jobSourceRefs, setJobSourceRefs] = useState<string>(defaultSourceRefsJson);
  const [cancelJobPayload, setCancelJobPayload] = useState<string>(defaultCancelJobJson);
  const [collectJobPayload, setCollectJobPayload] = useState<string>(defaultCollectJobJson);
  const [jobMutationStatus, setJobMutationStatus] = useState<ExperimentFoundationOperationStatus>('idle');
  const [jobMutationMessage, setJobMutationMessage] = useState<string>('');

  const selectedRecordRef = useMemo(
    () => (selectedRecord ? recordToRef(selectedRecord) : null),
    [selectedRecord],
  );

  const activeRecordFilters = useMemo(() => {
    if (activePanel === 'recipes') {
      return recipeFilters;
    }
    if (activePanel === 'execution') {
      return evidenceFilters;
    }
    return candidateFilters;
  }, [activePanel, candidateFilters, evidenceFilters, recipeFilters]);

  // Cleanup-on-panel-change: when the parent flips activePanel via a Topbar
  // click, reset scoped editor state so panel switching does not silently
  // carry forward a stale selection (T-078 post-review rule). Deep-link
  // helpers (goToJob / goToReadiness / goToPromotion) set their own
  // panel-specific overrides synchronously alongside the panel flip; they
  // raise `skipNextPanelCleanupRef` so this useEffect does not stomp those
  // overrides one tick later.
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
    if (activePanel === 'promotion') {
      setRecordEditorKind('dataset_asset_candidate');
    } else if (activePanel === 'recipes') {
      setRecordEditorKind('run_recipe');
    } else if (activePanel === 'execution') {
      setRecordEditorKind('evidence_candidate');
    }
    if (activePanel !== 'readiness') {
      setRecordEditorId('');
      setRecordEditorPayload(emptyObjectJson);
    }
  }, [activePanel]);

  const goToReadiness = useCallback(
    (targetKind: ExperimentFoundationRecordKind, targetId: string) => {
      // Deep-link applies its own preset (target kind + id); skip the auto
      // cleanup that would otherwise clear readiness target state one tick
      // later.
      skipNextPanelCleanupRef.current = true;
      setActivePanel('readiness');
      setSelectedRecord(null);
      setReadinessTargetKind(targetKind);
      setReadinessTargetId(targetId);
    },
    [setActivePanel],
  );

  const goToPromotion = useCallback(
    (candidateKind: ExperimentFoundationRecordKind, candidateId: string) => {
      // Deep-link sets the specific candidate kind on the editor; skip the
      // auto cleanup that would force it back to 'dataset_asset_candidate'.
      skipNextPanelCleanupRef.current = true;
      setActivePanel('promotion');
      setSelectedRecord(null);
      if ((promotionCandidateRecordKinds as readonly string[]).includes(candidateKind)) {
        setCandidateFilters((current) => ({ ...current, recordKind: candidateKind }));
        setRecordEditorKind(candidateKind);
      } else {
        setRecordEditorKind('dataset_asset_candidate');
      }
      setRecordEditorId('');
      setRecordEditorPayload(emptyObjectJson);
      setPromotionCandidateId(candidateId);
    },
    [setActivePanel],
  );

  const loadRecords = useCallback(async () => {
    setRecordStatus('loading');
    setRecordError(null);
    try {
      const response = await listExperimentFoundationRecords(activeRecordFilters);
      setRecords(response.records);
      setRecordStatus('success');
      setSelectedRecord((current) => {
        if (!current) {
          return response.records[0] ?? null;
        }
        return response.records.find(
          (record) => record.record_kind === current.record_kind && record.record_id === current.record_id,
        ) ?? response.records[0] ?? null;
      });
    } catch (error) {
      setRecordStatus('error');
      setRecordError(toErrorMessage(error));
    }
  }, [activeRecordFilters]);

  const selectRecord = useCallback((record: ExperimentFoundationStoredRecord) => {
    setSelectedRecord(record);
    setRecordEditorKind(record.record_kind);
    setRecordEditorId(record.record_id);
    setRecordEditorPayload(prettyJson(record.payload));
    setReadinessTargetKind(record.record_kind);
    setReadinessTargetId(record.record_id);
    if (record.record_kind.endsWith('_candidate')) {
      setPromotionCandidateId(record.record_id);
    }
  }, []);

  const createRecord = useCallback(async () => {
    setRecordMutationStatus('loading');
    setRecordMutationMessage('');
    try {
      const payload = parseJsonObject(recordEditorPayload);
      const created = await createExperimentFoundationRecord(recordEditorKind, payload);
      setRecordMutationStatus('success');
      setRecordMutationMessage(`created ${created.record_kind}:${created.record_id}`);
      selectRecord(created);
      await loadRecords();
    } catch (error) {
      setRecordMutationStatus('error');
      setRecordMutationMessage(toErrorMessage(error));
    }
  }, [loadRecords, recordEditorKind, recordEditorPayload, selectRecord]);

  const upsertRecord = useCallback(async () => {
    setRecordMutationStatus('loading');
    setRecordMutationMessage('');
    try {
      const trimmedRecordId = recordEditorId.trim();
      if (!trimmedRecordId) {
        throw new Error('record_id is required for upsert.');
      }
      const payload = parseJsonObject(recordEditorPayload);
      const updated = await upsertExperimentFoundationRecord(recordEditorKind, trimmedRecordId, payload);
      setRecordMutationStatus('success');
      setRecordMutationMessage(`upserted ${updated.record_kind}:${updated.record_id}`);
      selectRecord(updated);
      await loadRecords();
    } catch (error) {
      setRecordMutationStatus('error');
      setRecordMutationMessage(toErrorMessage(error));
    }
  }, [loadRecords, recordEditorId, recordEditorKind, recordEditorPayload, selectRecord]);

  const loadLatestReadiness = useCallback(async () => {
    setReadinessStatus('loading');
    setReadinessError(null);
    try {
      const trimmedTargetId = readinessTargetId.trim();
      if (!trimmedTargetId) {
        throw new Error('target_id is required.');
      }
      const report = await getLatestExperimentFoundationReadiness(readinessTargetKind, trimmedTargetId);
      setReadinessReport(report);
      setReadinessStatus('success');
    } catch (error) {
      setReadinessStatus('error');
      setReadinessError(toErrorMessage(error));
    }
  }, [readinessTargetId, readinessTargetKind]);

  const checkReadiness = useCallback(async () => {
    setReadinessStatus('loading');
    setReadinessError(null);
    try {
      const trimmedTargetId = readinessTargetId.trim();
      if (!trimmedTargetId) {
        throw new Error('target_id is required.');
      }
      const sourceRefs = parseSourceRefs(readinessSourceRefs);
      const report = await checkExperimentFoundationReadiness({
        target_ref: {
          ref_type: readinessTargetKind,
          ref_id: trimmedTargetId,
        },
        check_kind: readinessCheckKind.trim() || null,
        source_refs: sourceRefs,
      });
      setReadinessReport(report);
      setReadinessStatus('success');
    } catch (error) {
      setReadinessStatus('error');
      setReadinessError(toErrorMessage(error));
    }
  }, [readinessCheckKind, readinessSourceRefs, readinessTargetId, readinessTargetKind]);

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
    } catch (error) {
      setPromotionStatus('error');
      setPromotionMessage(toErrorMessage(error));
    }
  }, [loadRecords, promotionCandidateId, promotionPayload]);

  const loadJobs = useCallback(async () => {
    setJobStatus('loading');
    setJobError(null);
    try {
      const response = await listExperimentFoundationJobs(jobFilters);
      setJobs(response.jobs);
      setJobStatus('success');
      setSelectedJob((current) => {
        if (!current) {
          return response.jobs[0] ?? null;
        }
        return response.jobs.find((job) => job.external_job_id === current.external_job_id) ?? response.jobs[0] ?? null;
      });
    } catch (error) {
      setJobStatus('error');
      setJobError(toErrorMessage(error));
    }
  }, [jobFilters]);

  const selectJobById = useCallback(async (externalJobId: string) => {
    setJobMutationStatus('loading');
    setJobMutationMessage('');
    try {
      const response = await getExperimentFoundationJob(externalJobId);
      setSelectedJob(response.external_job);
      setJobMutationStatus('success');
      setJobMutationMessage(`loaded ${response.external_job.external_job_id}`);
    } catch (error) {
      setJobMutationStatus('error');
      setJobMutationMessage(toErrorMessage(error));
    }
  }, []);

  const goToJob = useCallback(
    async (externalJobId: string) => {
      // Deep-link selects a specific job; skip the panel-cleanup useEffect
      // so it cannot stomp the editor kind one tick after we set it.
      skipNextPanelCleanupRef.current = true;
      setActivePanel('execution');
      setSelectedRecord(null);
      setRecordEditorKind('evidence_candidate');
      setRecordEditorId('');
      setRecordEditorPayload(emptyObjectJson);
      await selectJobById(externalJobId);
    },
    [selectJobById, setActivePanel],
  );

  const submitJob = useCallback(async () => {
    setJobMutationStatus('loading');
    setJobMutationMessage('');
    try {
      const payload = parseJsonObject(submitJobPayload) as unknown as SubmitExternalTrainingJobRequest;
      const response = await submitExperimentFoundationJob(payload);
      setSelectedJob(response.external_job);
      setJobMutationStatus('success');
      setJobMutationMessage(`submitted ${response.external_job.external_job_id}`);
      await loadJobs();
    } catch (error) {
      setJobMutationStatus('error');
      setJobMutationMessage(toErrorMessage(error));
    }
  }, [loadJobs, submitJobPayload]);

  const syncJob = useCallback(async () => {
    setJobMutationStatus('loading');
    setJobMutationMessage('');
    try {
      if (!selectedJob) {
        throw new Error('external_job_id is required.');
      }
      const payload: SyncExternalTrainingJobRequest = {
        source_refs: parseSourceRefs(jobSourceRefs),
      };
      const response = await syncExperimentFoundationJob(selectedJob.external_job_id, payload);
      setSelectedJob(response.external_job);
      setJobMutationStatus('success');
      setJobMutationMessage(`synced ${response.external_job.external_job_id}`);
      await loadJobs();
    } catch (error) {
      setJobMutationStatus('error');
      setJobMutationMessage(toErrorMessage(error));
    }
  }, [jobSourceRefs, loadJobs, selectedJob]);

  const cancelJob = useCallback(async () => {
    setJobMutationStatus('loading');
    setJobMutationMessage('');
    try {
      if (!selectedJob) {
        throw new Error('external_job_id is required.');
      }
      const payload = parseJsonObject(cancelJobPayload) as unknown as CancelExternalTrainingJobRequest;
      const response = await cancelExperimentFoundationJob(selectedJob.external_job_id, payload);
      setSelectedJob(response.external_job);
      setJobMutationStatus('success');
      setJobMutationMessage(`cancelled ${response.external_job.external_job_id}`);
      await loadJobs();
    } catch (error) {
      setJobMutationStatus('error');
      setJobMutationMessage(toErrorMessage(error));
    }
  }, [cancelJobPayload, loadJobs, selectedJob]);

  const collectJob = useCallback(async () => {
    setJobMutationStatus('loading');
    setJobMutationMessage('');
    try {
      if (!selectedJob) {
        throw new Error('external_job_id is required.');
      }
      const payload = parseJsonObject(collectJobPayload) as unknown as CollectExternalTrainingJobRequest;
      const response = await collectExperimentFoundationJob(selectedJob.external_job_id, payload);
      setSelectedJob(response.external_job);
      setJobMutationStatus('success');
      setJobMutationMessage(`collected ${response.external_job.external_job_id}`);
      await loadJobs();
      await loadRecords();
    } catch (error) {
      setJobMutationStatus('error');
      setJobMutationMessage(toErrorMessage(error));
    }
  }, [collectJobPayload, loadJobs, loadRecords, selectedJob]);

  useEffect(() => {
    // Panels that own their own fetch path (overview, assets) or that do not
    // consume controller.records (readiness) should not trigger the shared
    // loadRecords. Skipping here also avoids a wasted candidate fetch on first
    // mount because the default activePanel is 'overview'.
    if (activePanel === 'overview' || activePanel === 'assets' || activePanel === 'readiness') {
      return;
    }
    void loadRecords();
  }, [activePanel, loadRecords]);

  useEffect(() => {
    if (activePanel !== 'execution') {
      return;
    }
    void loadJobs();
  }, [activePanel, loadJobs]);

  return {
    candidateFilters,
    collectJob,
    collectJobPayload,
    createRecord,
    decidePromotion,
    evidenceRecordKinds,
    evidenceFilters,
    goToJob,
    goToPromotion,
    goToReadiness,
    jobError,
    jobFilters,
    jobMutationMessage,
    jobMutationStatus,
    jobSourceRefs,
    jobStatus,
    jobs,
    loadJobs,
    loadLatestReadiness,
    loadRecords,
    promotionCandidateId,
    promotionCandidateRecordKinds,
    promotionMessage,
    promotionPayload,
    promotionStatus,
    readinessCheckKind,
    readinessError,
    readinessReport,
    readinessSourceRefs,
    readinessStatus,
    readinessTargetId,
    readinessTargetKind,
    recipeRecordKinds,
    recipeFilters,
    recordEditorId,
    recordEditorKind,
    recordEditorPayload,
    recordError,
    recordMutationMessage,
    recordMutationStatus,
    recordStatus,
    records,
    selectedJob,
    selectedRecord,
    selectedRecordRef,
    selectJobById,
    selectRecord,
    setCancelJobPayload,
    setCollectJobPayload,
    setJobFilters,
    setJobSourceRefs,
    setCandidateFilters,
    setEvidenceFilters,
    setPromotionCandidateId,
    setPromotionPayload,
    setReadinessCheckKind,
    setReadinessSourceRefs,
    setReadinessTargetId,
    setReadinessTargetKind,
    setRecordEditorId,
    setRecordEditorKind,
    setRecordEditorPayload,
    setRecipeFilters,
    setSubmitJobPayload,
    submitJob,
    submitJobPayload,
    syncJob,
    cancelJob,
    cancelJobPayload,
    checkReadiness,
    upsertRecord,
  };
}
