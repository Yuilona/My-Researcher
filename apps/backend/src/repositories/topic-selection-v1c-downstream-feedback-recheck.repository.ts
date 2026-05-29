import type {
  TopicSelectionDownstreamTopicFeedbackRecord,
} from '@paper-engineering-assistant/shared/research-lifecycle/topic-selection-v1c-downstream-feedback-recheck-contracts';

export interface TopicSelectionV1cDownstreamFeedbackRecheckRepository {
  createFeedback(
    record: TopicSelectionDownstreamTopicFeedbackRecord,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord>;

  findFeedbackById(
    downstreamTopicFeedbackId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null>;

  findFeedbackByRecheckRequestId(
    downstreamRecheckRequestId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null>;

  findFeedbackByFingerprint(
    feedbackFingerprint: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord | null>;

  listFeedbackByBridgeId(
    paperProjectBridgeId: string,
  ): Promise<TopicSelectionDownstreamTopicFeedbackRecord[]>;
}
