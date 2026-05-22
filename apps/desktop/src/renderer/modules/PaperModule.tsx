import { useState } from 'react';
import type { CitationStatus, PaperLiteratureItem } from '../literature/shared/types';
import { PaperImplementationWorkbench } from './paper-implementation/PaperImplementationWorkbench';

type PaperModuleProps = {
  paperId: string;
  topicId: string;
  onSyncPaperFromTopic: () => Promise<void>;
  onReloadPaperLiterature: (paperId: string) => Promise<void>;
  paperLiteratureError: string | null;
  literatureActionMessage: string;
  paperLiteratureLoading: boolean;
  paperLiteratureItems: PaperLiteratureItem[];
  citationStatusOptions: CitationStatus[];
  onUpdateCitationStatus: (linkId: string, status: CitationStatus) => Promise<void>;
};

export function PaperModule({
  paperId,
  topicId,
  onSyncPaperFromTopic,
  onReloadPaperLiterature,
  paperLiteratureError,
  literatureActionMessage,
  paperLiteratureLoading,
  paperLiteratureItems,
  citationStatusOptions,
  onUpdateCitationStatus,
}: PaperModuleProps) {
  const [activePanel, setActivePanel] = useState<'implementation' | 'literature'>('implementation');

  return (
    <section className="module-dashboard paper-literature-workspace">
      <div data-ui="stack" data-direction="col" data-gap="3">
        <div data-ui="toolbar" data-align="between" data-wrap="wrap">
          <div data-ui="stack" data-direction="col" data-gap="1">
            <p data-ui="text" data-variant="h3" data-tone="primary">论文管理</p>
            <p data-ui="text" data-variant="caption" data-tone="muted">
              论文实施工作台与论文文献集合共用同一个论文管理入口。
            </p>
          </div>
          <div data-ui="stack" data-direction="row" data-gap="2" data-wrap="wrap" data-align="center">
            <span data-ui="badge" data-variant="subtle" data-tone="neutral">Paper: {paperId}</span>
            <span data-ui="badge" data-variant="subtle" data-tone="neutral">Topic: {topicId}</span>
          </div>
        </div>

        <div data-ui="tabs" data-variant="pill" data-size="sm" role="tablist" aria-label="论文管理面板">
          {activePanel === 'implementation' ? (
            <button
              data-ui="tab"
              data-state="active"
              type="button"
              role="tab"
              aria-selected="true"
              onClick={() => setActivePanel('implementation')}
            >
              论文实施
            </button>
          ) : (
            <button
              data-ui="tab"
              data-state="inactive"
              type="button"
              role="tab"
              aria-selected="false"
              onClick={() => setActivePanel('implementation')}
            >
              论文实施
            </button>
          )}
          {activePanel === 'literature' ? (
            <button
              data-ui="tab"
              data-state="active"
              type="button"
              role="tab"
              aria-selected="true"
              onClick={() => setActivePanel('literature')}
            >
              文献集合
            </button>
          ) : (
            <button
              data-ui="tab"
              data-state="inactive"
              type="button"
              role="tab"
              aria-selected="false"
              onClick={() => setActivePanel('literature')}
            >
              文献集合
            </button>
          )}
        </div>

        {activePanel === 'implementation' ? (
          <PaperImplementationWorkbench />
        ) : null}

        {activePanel === 'literature' ? (
          <>
            <div data-ui="toolbar" data-wrap="wrap">
              <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void onSyncPaperFromTopic()}>
                从选题范围带入论文
              </button>
              <button data-ui="button" data-variant="secondary" data-size="sm" type="button" onClick={() => void onReloadPaperLiterature(paperId)}>
                刷新论文文献
              </button>
            </div>
            {paperLiteratureError ? (
              <p data-ui="text" data-variant="caption" data-tone="danger">{paperLiteratureError}</p>
            ) : null}
            {literatureActionMessage ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">{literatureActionMessage}</p>
            ) : null}
            {paperLiteratureLoading ? (
              <p data-ui="text" data-variant="caption" data-tone="muted">正在加载论文文献...</p>
            ) : (
              <div className="paper-literature-table">
                {paperLiteratureItems.length === 0 ? (
                  <p data-ui="text" data-variant="caption" data-tone="muted">当前论文暂无文献。</p>
                ) : (
                  paperLiteratureItems.map((item) => (
                    <div key={item.link_id} className="paper-literature-row">
                      <div>
                        <p data-ui="text" data-variant="body" data-tone="primary">{item.title}</p>
                        <p data-ui="text" data-variant="caption" data-tone="muted">
                          {item.source_provider ?? '--'} · {item.source_url ?? '--'}
                        </p>
                      </div>
                      <select
                        data-ui="select"
                        data-size="sm"
                        value={item.citation_status}
                        onChange={(event) =>
                          void onUpdateCitationStatus(item.link_id, event.target.value as CitationStatus)
                        }
                      >
                        {citationStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
