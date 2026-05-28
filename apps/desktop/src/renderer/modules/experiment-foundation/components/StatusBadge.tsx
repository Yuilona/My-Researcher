export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) {
    return 'neutral';
  }
  if (['passed', 'ready', 'fresh', 'valid', 'promoted', 'succeeded', 'materialized'].includes(status)) {
    return 'success';
  }
  if (['blocked', 'failed', 'invalid', 'rejected', 'cancelled'].includes(status)) {
    return 'danger';
  }
  if (['stale', 'partial', 'accepted_partial', 'manual_review_required', 'needs_info', 'running'].includes(status)) {
    return 'warning';
  }
  return 'info';
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? '--';
  switch (statusTone(value)) {
    case 'success':
      return <span data-ui="badge" data-variant="subtle" data-tone="success">{label}</span>;
    case 'warning':
      return <span data-ui="badge" data-variant="subtle" data-tone="warning">{label}</span>;
    case 'danger':
      return <span data-ui="badge" data-variant="subtle" data-tone="danger">{label}</span>;
    case 'info':
      return <span data-ui="badge" data-variant="subtle" data-tone="info">{label}</span>;
    case 'neutral':
      return <span data-ui="badge" data-variant="subtle" data-tone="neutral">{label}</span>;
  }
}
