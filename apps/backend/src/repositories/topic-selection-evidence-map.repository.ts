import type {
  TopicSelectionEvidenceClusterRecord,
  TopicSelectionEvidenceConflictSetRecord,
  TopicSelectionEvidenceFreshnessStatus,
  TopicSelectionEvidenceMapRecord,
  TopicSelectionEvidencePatternRecord,
  TopicSelectionEvidenceStrengthAssessmentRecord,
  TopicSelectionEvidenceTypedLinkRecord,
  TopicSelectionEvidenceUnitRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-evidence-map-contracts';

export type TopicSelectionEvidenceMapCreateRecords = {
  evidence_map: TopicSelectionEvidenceMapRecord;
  evidence_units: TopicSelectionEvidenceUnitRecord[];
  typed_links: TopicSelectionEvidenceTypedLinkRecord[];
  clusters: TopicSelectionEvidenceClusterRecord[];
  patterns: TopicSelectionEvidencePatternRecord[];
  conflict_sets: TopicSelectionEvidenceConflictSetRecord[];
};

export interface TopicSelectionEvidenceMapRepository {
  createEvidenceMapWithRecords(
    records: TopicSelectionEvidenceMapCreateRecords,
  ): Promise<TopicSelectionEvidenceMapCreateRecords>;

  findEvidenceMapById(evidenceMapId: string): Promise<TopicSelectionEvidenceMapRecord | null>;
  updateEvidenceMapFreshness(
    evidenceMapId: string,
    freshnessStatus: TopicSelectionEvidenceFreshnessStatus,
    staleReasonCodes: string[],
  ): Promise<TopicSelectionEvidenceMapRecord>;

  listEvidenceUnitsByEvidenceMapId(evidenceMapId: string): Promise<TopicSelectionEvidenceUnitRecord[]>;
  listTypedLinksByEvidenceMapId(evidenceMapId: string): Promise<TopicSelectionEvidenceTypedLinkRecord[]>;
  listClustersByEvidenceMapId(evidenceMapId: string): Promise<TopicSelectionEvidenceClusterRecord[]>;
  listPatternsByEvidenceMapId(evidenceMapId: string): Promise<TopicSelectionEvidencePatternRecord[]>;
  listConflictSetsByEvidenceMapId(evidenceMapId: string): Promise<TopicSelectionEvidenceConflictSetRecord[]>;

  createEvidenceStrengthAssessment(
    record: TopicSelectionEvidenceStrengthAssessmentRecord,
  ): Promise<TopicSelectionEvidenceStrengthAssessmentRecord>;
  findFreshEvidenceStrengthAssessmentByCacheKey(
    cacheKey: string,
  ): Promise<TopicSelectionEvidenceStrengthAssessmentRecord | null>;
  listEvidenceStrengthAssessmentsByEvidenceMapId(
    evidenceMapId: string,
  ): Promise<TopicSelectionEvidenceStrengthAssessmentRecord[]>;
  markEvidenceStrengthAssessmentsStaleByEvidenceMapId(
    evidenceMapId: string,
    staleReasonCodes: string[],
    freshnessStatus: TopicSelectionEvidenceFreshnessStatus,
  ): Promise<number>;
}
