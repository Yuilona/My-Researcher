import type {
  TopicSelectionResourceSampleItemRecord,
  TopicSelectionResourceSampleResult,
  TopicSelectionResourceSampleSetRecord,
  TopicSelectionResourceSamplingAuditRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-resource-sampling-contracts';
import type {
  TopicSelectionResourceSampleCreation,
  TopicSelectionResourceSamplingRepository,
} from './topic-selection-resource-sampling.repository.js';

export class InMemoryTopicSelectionResourceSamplingRepository implements TopicSelectionResourceSamplingRepository {
  private readonly sampleSets = new Map<string, TopicSelectionResourceSampleSetRecord>();
  private readonly items = new Map<string, TopicSelectionResourceSampleItemRecord>();
  private readonly audits = new Map<string, TopicSelectionResourceSamplingAuditRecord>();

  async createResourceSampleSet(
    creation: TopicSelectionResourceSampleCreation,
  ): Promise<TopicSelectionResourceSampleResult> {
    this.sampleSets.set(creation.sample_set.resource_sample_set_id, creation.sample_set);
    for (const item of creation.items) {
      this.items.set(item.resource_sample_item_id, item);
    }
    this.audits.set(creation.audit.resource_sampling_audit_id, creation.audit);
    return this.toResult(creation.sample_set.resource_sample_set_id);
  }

  async findResourceSampleSetById(sampleSetId: string): Promise<TopicSelectionResourceSampleResult | null> {
    const sampleSet = this.sampleSets.get(sampleSetId);
    if (!sampleSet) {
      return null;
    }
    return this.toResult(sampleSetId);
  }

  private toResult(sampleSetId: string): TopicSelectionResourceSampleResult {
    const sampleSet = this.sampleSets.get(sampleSetId);
    if (!sampleSet) {
      throw new Error(`ResourceSampleSet ${sampleSetId} not found.`);
    }
    const candidateItems = [...this.items.values()]
      .filter((item) => item.sample_set_id === sampleSetId)
      .sort((left, right) => left.rank - right.rank || left.resource_sample_item_id.localeCompare(right.resource_sample_item_id));
    const selectedItems = candidateItems.filter((item) => item.selected);
    const audit = [...this.audits.values()]
      .filter((item) => item.sample_set_id === sampleSetId)
      .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
    if (!audit) {
      throw new Error(`ResourceSampleSet ${sampleSetId} audit not found.`);
    }
    return {
      sample_set: sampleSet,
      selected_items: selectedItems,
      candidate_items: candidateItems,
      audit,
    };
  }
}
