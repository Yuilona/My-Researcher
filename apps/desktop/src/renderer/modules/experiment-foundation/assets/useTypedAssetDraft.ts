import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import type { JsonObject } from '../types';
import { useAssetKindController } from './useAssetKindController';

export type BuildResult = {
  payload: JsonObject;
  error: string | null;
};

export type TypedAssetDraftHelpers<Draft> = {
  blank: Draft;
  derive: (record: ExperimentFoundationStoredRecord) => Draft;
  build: (draft: Draft, base: Record<string, unknown> | null) => BuildResult;
};

/**
 * Shared scaffold for every "typed asset" form (Dataset, Baseline, Benchmark,
 * EvaluationProtocol, ...).
 *
 * Centralises:
 * - controller wiring per record kind
 * - draft state + previousRecordIdRef so refresh of the SAME record does NOT
 *   stomp the user's in-progress edits (S1 post-review rule)
 * - basePayload tracking for round-tripping unknown contract fields
 * - new / save lifecycle including renderer-side validation and create/upsert
 *   branching
 *
 * Each view supplies only the field-specific shape (Draft + derive + build).
 */
export function useTypedAssetDraft<Draft>(
  recordKind: ExperimentFoundationRecordKind,
  helpers: TypedAssetDraftHelpers<Draft>,
) {
  const controller = useAssetKindController(recordKind);
  const helpersRef = useRef(helpers);
  helpersRef.current = helpers;

  const [draft, setDraft] = useState<Draft>(helpers.blank);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const previousRecordIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = controller.selectedRecord?.record_id ?? null;
    if (currentId === previousRecordIdRef.current) {
      return;
    }
    previousRecordIdRef.current = currentId;
    if (controller.selectedRecord) {
      setDraft(helpersRef.current.derive(controller.selectedRecord));
      setIsEditing(true);
      setDraftError(null);
    }
  }, [controller.selectedRecord]);

  const basePayload = useMemo<Record<string, unknown> | null>(() => {
    if (!isEditing || !controller.selectedRecord) return null;
    return (controller.selectedRecord.payload ?? {}) as Record<string, unknown>;
  }, [isEditing, controller.selectedRecord]);

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDraftError(null);
  }, []);

  const replaceDraft = useCallback((next: Draft) => {
    setDraft(next);
    setDraftError(null);
  }, []);

  const handleNew = useCallback(() => {
    setDraft(helpersRef.current.blank);
    setIsEditing(false);
    setDraftError(null);
    controller.selectRecord(null);
  }, [controller]);

  const handleSave = useCallback(async () => {
    const built = helpersRef.current.build(draft, basePayload);
    if (built.error) {
      setDraftError(built.error);
      return;
    }
    if (isEditing && controller.selectedRecord) {
      await controller.upsertRecord(controller.selectedRecord.record_id, built.payload);
    } else {
      const created = await controller.createRecord(built.payload);
      if (created) setIsEditing(true);
    }
  }, [basePayload, controller, draft, isEditing]);

  return {
    controller,
    draft,
    update,
    replaceDraft,
    draftError,
    isEditing,
    basePayload,
    handleNew,
    handleSave,
  };
}
