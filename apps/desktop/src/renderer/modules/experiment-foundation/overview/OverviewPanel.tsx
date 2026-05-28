import type {
  ExperimentFoundationReadinessCheckResponse,
  ExperimentFoundationRecordKind,
  ExperimentFoundationStoredRecord,
  ExternalTrainingJob,
} from '@paper-engineering-assistant/shared/research-lifecycle/experiment-foundation-contracts';
import { StatusBadge } from '../components/StatusBadge';
import type { ExperimentFoundationOperationStatus } from '../types';
import { shortText } from '../utils';
import { useOverviewController } from './useOverviewController';

export type OverviewDeepLinks = {
  goToJob: (externalJobId: string) => void;
  goToReadiness: (targetKind: ExperimentFoundationRecordKind, targetId: string) => void;
  goToPromotion: (candidateKind: ExperimentFoundationRecordKind, candidateId: string) => void;
};

function CounterCard({ label, value }: { label: string; value: number }) {
  return (
    <section data-ui="section" data-padding="md">
      <div data-ui="stack" data-direction="col" data-gap="1">
        <p data-ui="text" data-variant="caption" data-tone="muted">
          {label}
        </p>
        <p data-ui="text" data-variant="h3" data-tone="primary">
          {value}
        </p>
      </div>
    </section>
  );
}

function StatusLine({
  status,
  message,
}: {
  status: ExperimentFoundationOperationStatus;
  message: string | null;
}) {
  if (!message) {
    return null;
  }
  if (status === 'error') {
    return (
      <p data-ui="text" data-variant="caption" data-tone="danger">
        {message}
      </p>
    );
  }
  return (
    <p data-ui="text" data-variant="caption" data-tone="muted">
      {message}
    </p>
  );
}

function RecentJobsList({
  jobs,
  onSelectJob,
}: {
  jobs: ExternalTrainingJob[];
  onSelectJob: (externalJobId: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">No recent jobs</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>job</th>
          <th>status</th>
          <th>adapter</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.external_job_id}>
            <td>
              <button
                data-ui="button"
                data-variant="ghost"
                data-size="sm"
                type="button"
                title={job.external_job_id}
                onClick={() => onSelectJob(job.external_job_id)}
              >
                {shortText(job.external_job_id, 34)}
              </button>
            </td>
            <td>
              <StatusBadge value={job.job_status} />
            </td>
            <td>{job.adapter_kind}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BlockedReadinessList({
  reports,
  onSelectReport,
}: {
  reports: ExperimentFoundationReadinessCheckResponse[];
  onSelectReport: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
}) {
  if (reports.length === 0) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">No blocked readiness</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>target</th>
          <th>readiness</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => {
          const targetKey = `${report.target_ref.ref_type}:${report.target_ref.ref_id}`;
          return (
            <tr key={report.readiness_report_id}>
              <td>
                <button
                  data-ui="button"
                  data-variant="ghost"
                  data-size="sm"
                  type="button"
                  title={targetKey}
                  onClick={() =>
                    onSelectReport(
                      report.target_ref.ref_type as ExperimentFoundationRecordKind,
                      report.target_ref.ref_id,
                    )
                  }
                >
                  {shortText(targetKey, 44)}
                </button>
              </td>
              <td>
                <StatusBadge value={report.readiness_status} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PendingCandidatesList({
  records,
  onSelectCandidate,
}: {
  records: ExperimentFoundationStoredRecord[];
  onSelectCandidate: (kind: ExperimentFoundationRecordKind, recordId: string) => void;
}) {
  if (records.length === 0) {
    return (
      <div data-ui="empty-state" data-variant="compact" data-tone="neutral">
        <p data-slot="title">No pending candidates</p>
      </div>
    );
  }
  return (
    <table data-ui="table" data-density="compact">
      <thead>
        <tr>
          <th>candidate</th>
          <th>status</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={`${record.record_kind}:${record.record_id}`}>
            <td>
              <button
                data-ui="button"
                data-variant="ghost"
                data-size="sm"
                type="button"
                title={`${record.record_kind}:${record.record_id}`}
                onClick={() => onSelectCandidate(record.record_kind, record.record_id)}
              >
                {shortText(`${record.record_kind}:${record.record_id}`, 44)}
              </button>
            </td>
            <td>
              <StatusBadge value={record.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function OverviewPanel({ deepLinks }: { deepLinks: OverviewDeepLinks }) {
  const controller = useOverviewController();

  return (
    <div data-ui="stack" data-direction="col" data-gap="4">
      <div data-ui="toolbar" data-align="between" data-wrap="wrap">
        <p data-ui="text" data-variant="caption" data-tone="muted">
          状态读自后端契约源（readiness 报告 / records / jobs），点击行进入对应详情。
        </p>
        <button
          data-ui="button"
          data-variant="secondary"
          data-size="sm"
          type="button"
          onClick={() => void controller.refresh()}
        >
          刷新
        </button>
      </div>
      <StatusLine status={controller.status} message={controller.error} />

      <div data-ui="grid" data-cols="4" data-gap="4">
        <CounterCard label="进行中 jobs" value={controller.counters.jobsInFlight} />
        <CounterCard label="阻塞 readiness" value={controller.counters.blockedReadiness} />
        <CounterCard label="需关注候选" value={controller.counters.pendingPromotion} />
        <CounterCard label="待评审 evidence" value={controller.counters.evidenceUnderReview} />
      </div>

      <div data-ui="grid" data-cols="3" data-gap="4">
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="2">
            <p data-ui="text" data-variant="label" data-tone="primary">
              最近 jobs
            </p>
            <RecentJobsList jobs={controller.recentJobs} onSelectJob={deepLinks.goToJob} />
          </div>
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="2">
            <p data-ui="text" data-variant="label" data-tone="primary">
              阻塞 readiness
            </p>
            <BlockedReadinessList
              reports={controller.blockedReadinessList}
              onSelectReport={deepLinks.goToReadiness}
            />
          </div>
        </section>
        <section data-ui="section" data-padding="none">
          <div data-ui="stack" data-direction="col" data-gap="2">
            <p data-ui="text" data-variant="label" data-tone="primary">
              需关注候选
            </p>
            <PendingCandidatesList
              records={controller.pendingCandidates}
              onSelectCandidate={deepLinks.goToPromotion}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
