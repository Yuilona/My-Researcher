import type {
  TopicSelectionDownstreamTopicFeedbackRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';
import type {
  TopicSelectionV1cDownstreamFeedbackRecheckRepository,
} from './topic-selection-v1c-downstream-feedback-recheck.repository.js';

export class InMemoryTopicSelectionV1cDownstreamFeedbackRecheckRepository
implements TopicSelectionV1cDownstreamFeedbackRecheckRepository {
  private readonly feedbackRecords = new Map<string, TopicSelectionDownstreamTopicFeedbackRecord>();

  async createFeedback(
    record: TopicSelectionDownstreamTopicFeedbackRecord,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord> {
    if (this.feedbackRecords.has(record.downstream_topic_feedback_id)) {
      throw new Error(
        `DownstreamTopicFeedback ${record.downstream_topic_feedback_id} already exists.`,
      );
    }
    this.feedbackRecords.set(record.downstream_topic_feedback_id, record);
    return record;
  }

  async findFeedbackById(
    downstreamTopicFeedbackId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null> {
    return this.feedbackRecords.get(downstreamTopicFeedbackId) ?? null;
  }

  async findFeedbackByRecheckRequestId(
    downstreamRecheckRequestId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null> {
    return [...this.feedbackRecords.values()].find(
      (record) => record.recheck_request?.downstream_recheck_request_id === downstreamRecheckRequestId,
    ) ?? null;
  }

  async findFeedbackByFingerprint(
    feedbackFingerprint: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null> {
    return [...this.feedbackRecords.values()].find(
      (record) => record.feedback_fingerprint === feedbackFingerprint,
    ) ?? null;
  }

  async listFeedbackByBridgeId(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord[]> {
    return [...this.feedbackRecords.values()]
      .filter((record) => record.paper_project_bridge_id === paperProjectBridgeId)
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  }
}
