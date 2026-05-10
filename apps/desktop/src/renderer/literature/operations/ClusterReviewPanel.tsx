import { useCallback, useEffect, useMemo, useState } from 'react';
import { requestGovernance } from '../shared/api';
import type {
  ClusterCandidateGenerationResponse,
  ListLiteratureClustersResponse,
  LiteratureCluster,
  LiteratureClusterReviewOutcome,
  LiteratureClusterStatus,
  LiteratureClusterType,
} from '../shared/types';
import './ClusterReviewPanel.css';

type ClusterStatusFilter = 'all' | LiteratureClusterStatus;
type ClusterTypeFilter = 'all' | LiteratureClusterType;
type FeedbackLevel = 'success' | 'warning' | 'error';
type FeedbackEntry = {
  id: string;
  level: FeedbackLevel;
  message: string;
};

const clusterTypeOptions: Array<{ value: ClusterTypeFilter; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'same_work', label: '同一工作' },
  { value: 'version_family', label: '版本族' },
  { value: 'related_topic', label: '相关主题' },
];

const clusterStatusOptions: Array<{ value: ClusterStatusFilter; label: string }> = [
  { value: 'candidate', label: '候选' },
  { value: 'confirmed', label: '已确认' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'split', label: '已拆分' },
  { value: 'all', label: '全部状态' },
];

const clusterTypeLabels: Record<LiteratureClusterType, string> = {
  same_work: '同一工作',
  version_family: '版本族',
  related_topic: '相关主题',
};

const statusLabels: Record<LiteratureClusterStatus, string> = {
  candidate: '候选',
  confirmed: '已确认',
  rejected: '已拒绝',
  split: '已拆分',
};

const outcomeLabels: Record<LiteratureClusterReviewOutcome, string> = {
  pending_review: '待 review',
  same_work_confirmed: '同一工作确认',
  version_family_confirmed: '版本族确认',
  related_topic_confirmed: '相关主题确认',
  rejected: '已拒绝',
  split: '已拆分',
};

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function reviewOutcomeForType(clusterType: LiteratureClusterType): LiteratureClusterReviewOutcome {
  if (clusterType === 'related_topic') {
    return 'related_topic_confirmed';
  }
  if (clusterType === 'version_family') {
    return 'version_family_confirmed';
  }
  return 'same_work_confirmed';
}

function statusTone(status: LiteratureClusterStatus): 'neutral' | 'success' | 'warning' | 'danger' {
  if (status === 'confirmed') return 'success';
  if (status === 'candidate') return 'warning';
  if (status === 'rejected' || status === 'split') return 'danger';
  return 'neutral';
}

function reviewTone(cluster: LiteratureCluster): 'neutral' | 'success' | 'warning' {
  if (cluster.review.retrieval_dedup_active) return 'success';
  if (cluster.review.review_required) return 'warning';
  return 'neutral';
}

function formatScore(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function buildListPath(status: ClusterStatusFilter, clusterType: ClusterTypeFilter, limit: number): string {
  const params = new URLSearchParams();
  if (status !== 'all') {
    params.set('status', status);
  }
  if (clusterType !== 'all') {
    params.set('cluster_type', clusterType);
  }
  params.set('limit', String(limit));
  return `/literature/clusters?${params.toString()}`;
}

function Badge({
  tone,
  children,
}: {
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  if (tone === 'success') {
    return (
      <span data-ui="badge" data-variant="solid" data-tone="success" className="cluster-review-badge">
        {children}
      </span>
    );
  }
  if (tone === 'warning') {
    return (
      <span data-ui="badge" data-variant="solid" data-tone="warning" className="cluster-review-badge">
        {children}
      </span>
    );
  }
  if (tone === 'danger') {
    return (
      <span data-ui="badge" data-variant="solid" data-tone="danger" className="cluster-review-badge">
        {children}
      </span>
    );
  }
  return (
    <span data-ui="badge" data-variant="solid" data-tone="neutral" className="cluster-review-badge">
      {children}
    </span>
  );
}

function FeedbackAlert({
  entry,
  onDismiss,
}: {
  entry: FeedbackEntry;
  onDismiss: (id: string) => void;
}) {
  const content = (
    <>
      <span>{entry.message}</span>
      <button
        data-ui="button"
        data-variant="ghost"
        data-size="sm"
        type="button"
        aria-label="关闭提示"
        onClick={() => onDismiss(entry.id)}
      >
        ×
      </button>
    </>
  );
  if (entry.level === 'error') {
    return (
      <div data-ui="alert" data-tone="danger" className="cluster-review-feedback-alert">
        {content}
      </div>
    );
  }
  if (entry.level === 'warning') {
    return (
      <div data-ui="alert" data-tone="warning" className="cluster-review-feedback-alert">
        {content}
      </div>
    );
  }
  return (
    <div data-ui="alert" data-tone="success" className="cluster-review-feedback-alert">
      {content}
    </div>
  );
}

function ClusterCard({
  cluster,
  actionInFlight,
  onDecision,
}: {
  cluster: LiteratureCluster;
  actionInFlight: string | null;
  onDecision: (cluster: LiteratureCluster, outcome: LiteratureClusterReviewOutcome) => Promise<void>;
}) {
  const representativeTitle = cluster.members.find((member) => (
    member.literature_id === cluster.representative_literature_id
  ))?.title ?? cluster.members[0]?.title ?? 'Untitled';
  const pending = actionInFlight !== null;
  const confirmOutcome = reviewOutcomeForType(cluster.cluster_type);

  return (
    <article data-ui="card" className="cluster-review-card">
      <header className="cluster-review-card-header">
        <div data-ui="stack" data-direction="col" data-gap="1" className="cluster-review-title-block">
          <div className="cluster-review-title-row">
            <h3 data-ui="text" data-variant="h3" data-tone="primary">{representativeTitle}</h3>
            <Badge tone={statusTone(cluster.status)}>{statusLabels[cluster.status]}</Badge>
            <Badge tone="neutral">{clusterTypeLabels[cluster.cluster_type]}</Badge>
          </div>
          <div data-ui="text" data-variant="caption" data-tone="muted">
            {cluster.cluster_id} · {cluster.method} · {formatScore(cluster.confidence)}
          </div>
        </div>
        <div className="cluster-review-actions">
          <button
            data-ui="button"
            data-variant="primary"
            data-size="sm"
            type="button"
            disabled={pending || cluster.status === 'confirmed'}
            onClick={() => onDecision(cluster, confirmOutcome)}
          >
            确认
          </button>
          <button
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            type="button"
            disabled={pending || cluster.status === 'rejected'}
            onClick={() => onDecision(cluster, 'rejected')}
          >
            拒绝
          </button>
          <button
            data-ui="button"
            data-variant="secondary"
            data-size="sm"
            type="button"
            disabled={pending || cluster.status === 'split'}
            onClick={() => onDecision(cluster, 'split')}
          >
            拆分
          </button>
        </div>
      </header>

      <div className="cluster-review-summary-row">
        <div data-ui="stack" data-direction="col" data-gap="1">
          <span data-ui="text" data-variant="caption" data-tone="muted">Review</span>
          <div className="cluster-review-chip-row">
            <Badge tone={reviewTone(cluster)}>{outcomeLabels[cluster.review.outcome]}</Badge>
            <Badge tone={cluster.review.consumption_scope === 'retrieval_dedup' ? 'success' : 'neutral'}>
              {cluster.review.consumption_scope}
            </Badge>
          </div>
        </div>
        <div data-ui="stack" data-direction="col" data-gap="1">
          <span data-ui="text" data-variant="caption" data-tone="muted">成员</span>
          <span data-ui="text" data-variant="body" data-tone="primary">
            {cluster.review.accepted_member_count}/{cluster.members.length} accepted
          </span>
        </div>
        <div data-ui="stack" data-direction="col" data-gap="1">
          <span data-ui="text" data-variant="caption" data-tone="muted">Blockers</span>
          <span data-ui="text" data-variant="body" data-tone="primary">
            {cluster.review.blocking_reasons.length > 0 ? cluster.review.blocking_reasons.join(', ') : 'none'}
          </span>
        </div>
      </div>

      <div className="cluster-review-table-wrap">
        <table data-ui="table" className="cluster-review-table">
          <thead>
            <tr>
              <th>文献</th>
              <th>角色</th>
              <th>关系</th>
              <th>决策</th>
              <th>置信度</th>
            </tr>
          </thead>
          <tbody>
            {cluster.members.map((member) => (
              <tr key={member.member_id}>
                <td>{member.title ?? member.literature_id}</td>
                <td>{member.role}</td>
                <td>{member.relation_type}</td>
                <td>{member.decision_status}</td>
                <td>{formatScore(member.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cluster-review-evidence-row">
        {cluster.evidence.map((evidence) => (
          <span key={evidence.evidence_id} data-ui="badge" data-variant="subtle" data-tone="neutral">
            {evidence.signal_type}: {formatScore(evidence.score)}
          </span>
        ))}
      </div>
    </article>
  );
}

export function ClusterReviewPanel() {
  const [status, setStatus] = useState<ClusterStatusFilter>('candidate');
  const [clusterType, setClusterType] = useState<ClusterTypeFilter>('all');
  const [limitInput, setLimitInput] = useState('50');
  const [clusters, setClusters] = useState<LiteratureCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  const limit = useMemo(() => {
    const parsed = Number.parseInt(limitInput, 10);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(200, parsed)) : 50;
  }, [limitInput]);

  const pushFeedback = useCallback((level: FeedbackLevel, message: string) => {
    setFeedback((entries) => [{ id: generateId(), level, message }, ...entries].slice(0, 3));
  }, []);

  const dismissFeedback = useCallback((id: string) => {
    setFeedback((entries) => entries.filter((entry) => entry.id !== id));
  }, []);

  const loadClusters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await requestGovernance<ListLiteratureClustersResponse>({
        method: 'GET',
        path: buildListPath(status, clusterType, limit),
      });
      setClusters(response.items);
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : '加载聚类失败');
    } finally {
      setLoading(false);
    }
  }, [clusterType, limit, pushFeedback, status]);

  useEffect(() => {
    void loadClusters();
  }, [loadClusters]);

  const generateCandidates = async () => {
    setActionInFlight('generate');
    try {
      const clusterTypes = clusterType === 'all'
        ? ['same_work', 'version_family', 'related_topic']
        : [clusterType];
      const response = await requestGovernance<ClusterCandidateGenerationResponse>({
        method: 'POST',
        path: '/literature/clusters/candidates',
        body: {
          cluster_types: clusterTypes,
          include_existing: true,
        },
      });
      pushFeedback('success', `生成 ${response.generated_count} 个候选`);
      await loadClusters();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : '生成候选失败');
    } finally {
      setActionInFlight(null);
    }
  };

  const updateDecision = async (cluster: LiteratureCluster, outcome: LiteratureClusterReviewOutcome) => {
    setActionInFlight(cluster.cluster_id);
    try {
      const representativeId = cluster.representative_literature_id ?? cluster.members[0]?.literature_id ?? null;
      const statusByOutcome: Record<LiteratureClusterReviewOutcome, LiteratureClusterStatus> = {
        pending_review: 'candidate',
        same_work_confirmed: 'confirmed',
        version_family_confirmed: 'confirmed',
        related_topic_confirmed: 'confirmed',
        rejected: 'rejected',
        split: 'split',
      };
      await requestGovernance({
        method: 'PATCH',
        path: `/literature/clusters/${cluster.cluster_id}`,
        body: {
          status: statusByOutcome[outcome],
          review_outcome: outcome,
          ...(outcome.endsWith('_confirmed') && representativeId
            ? { representative_literature_id: representativeId }
            : {}),
        },
      });
      pushFeedback('success', `${outcomeLabels[outcome]} 已保存`);
      await loadClusters();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : '保存聚类决策失败');
    } finally {
      setActionInFlight(null);
    }
  };

  return (
    <section data-ui="stack" data-direction="col" data-gap="4">
      <div data-ui="card" data-variant="outlined" data-padding="sm" data-elevation="none">
        <div className="cluster-review-toolbar">
          <label data-ui="field">
            <span data-ui="text" data-variant="caption" data-tone="muted">状态</span>
            <select
              data-ui="select"
              data-size="sm"
              value={status}
              onChange={(event) => setStatus(event.target.value as ClusterStatusFilter)}
            >
              {clusterStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label data-ui="field">
            <span data-ui="text" data-variant="caption" data-tone="muted">类型</span>
            <select
              data-ui="select"
              data-size="sm"
              value={clusterType}
              onChange={(event) => setClusterType(event.target.value as ClusterTypeFilter)}
            >
              {clusterTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label data-ui="field" className="cluster-review-limit-field">
            <span data-ui="text" data-variant="caption" data-tone="muted">Limit</span>
            <input
              data-ui="input"
              data-size="sm"
              type="number"
              min="1"
              max="200"
              value={limitInput}
              onChange={(event) => setLimitInput(event.target.value)}
            />
          </label>
          <div className="cluster-review-toolbar-actions">
            <button
              data-ui="button"
              data-variant="secondary"
              type="button"
              disabled={loading}
              onClick={() => void loadClusters()}
            >
              刷新
            </button>
            <button
              data-ui="button"
              data-variant="primary"
              type="button"
              disabled={actionInFlight !== null}
              onClick={() => void generateCandidates()}
            >
              生成候选
            </button>
          </div>
        </div>
      </div>

      {feedback.length > 0 ? (
        <div data-ui="stack" data-direction="col" data-gap="2">
          {feedback.map((entry) => (
            <FeedbackAlert key={entry.id} entry={entry} onDismiss={dismissFeedback} />
          ))}
        </div>
      ) : null}

      <div className="cluster-review-list">
        {clusters.length > 0 ? (
          clusters.map((cluster) => (
            <ClusterCard
              key={cluster.cluster_id}
              cluster={cluster}
              actionInFlight={actionInFlight}
              onDecision={updateDecision}
            />
          ))
        ) : (
          <div data-ui="empty-state" data-variant="compact" data-tone="neutral" className="cluster-review-empty">
            {loading ? '加载中' : '暂无聚类'}
          </div>
        )}
      </div>
    </section>
  );
}
