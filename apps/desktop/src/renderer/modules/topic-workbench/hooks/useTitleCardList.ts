import { useCallback, useEffect, useState } from 'react';
import { requestGovernance } from '../../../literature/shared/api';
import type {
  TitleCardWorkbenchListPayload,
  TitleCardWorkbenchSummary,
} from '../types';

/**
 * Load title-card summary list from `/title-cards`.
 *
 * Phase 1 — feeds the Sidebar selector and the Overview view. Backend route
 * already exists (see `apps/backend/src/routes/title-card-management.ts`)
 * and returns both `items` and aggregate `summary`.
 */
export type UseTitleCardListResult = {
  items: TitleCardWorkbenchSummary[];
  summary: TitleCardWorkbenchListPayload['summary'] | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useTitleCardList(refreshToken: number, enabled: boolean = true): UseTitleCardListResult {
  const [items, setItems] = useState<TitleCardWorkbenchSummary[]>([]);
  const [summary, setSummary] = useState<TitleCardWorkbenchListPayload['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await requestGovernance<TitleCardWorkbenchListPayload>({
        method: 'GET',
        path: '/title-cards',
      });
      setItems(payload.items);
      setSummary(payload.summary);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '加载题目卡列表失败。');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void reload();
  }, [enabled, reload, refreshToken]);

  return { items, summary, loading, error, reload };
}
