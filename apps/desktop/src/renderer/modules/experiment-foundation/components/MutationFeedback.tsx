import type { ExperimentFoundationOperationStatus } from '../types';

export type MutationFeedbackProps = {
  status: ExperimentFoundationOperationStatus;
  message: string;
};

/**
 * Renders the success / error feedback strings produced by typed asset views
 * after create / upsert operations. Static literal tones keep the UI gate
 * happy.
 */
export function MutationFeedback({ status, message }: MutationFeedbackProps) {
  if (!message) {
    return null;
  }
  if (status === 'success') {
    return (
      <p data-ui="text" data-variant="caption" data-tone="muted">
        {message}
      </p>
    );
  }
  if (status === 'error') {
    return (
      <p data-ui="text" data-variant="caption" data-tone="danger">
        {message}
      </p>
    );
  }
  return null;
}
