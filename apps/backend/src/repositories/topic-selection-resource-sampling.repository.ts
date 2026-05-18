import type {
  TopicSelectionResourceSampleItemRecord,
  TopicSelectionResourceSampleResult,
  TopicSelectionResourceSampleSetRecord,
  TopicSelectionResourceSamplingAuditRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-resource-sampling-contracts';

export type TopicSelectionResourceSampleCreation = {
  sample_set: TopicSelectionResourceSampleSetRecord;
  items: TopicSelectionResourceSampleItemRecord[];
  audit: TopicSelectionResourceSamplingAuditRecord;
};

export interface TopicSelectionResourceSamplingRepository {
  createResourceSampleSet(
    creation: TopicSelectionResourceSampleCreation,
  ): Promise<TopicSelectionResourceSampleResult>;
  findResourceSampleSetById(sampleSetId: string): Promise<TopicSelectionResourceSampleResult | null>;
}
